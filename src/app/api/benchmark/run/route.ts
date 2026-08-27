import { NextRequest } from 'next/server';
import { spawn } from 'child_process';
import { BenchmarkConfig } from '@/types/benchmark';
import { buildCliArgs } from '@/utils/commandBuilder';
import { benchyTestName, buildTotalThroughputTimeseries } from '@/utils/formatters';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { config, mockMode }: { config: BenchmarkConfig; mockMode?: boolean } = await req.json();

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (data: any) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        if (mockMode) {
          // Simulated benchmark run with realistic progression and stats
          await runSimulatedBenchmark(config, sendEvent);
          controller.close();
          return;
        }

        // Real Execution
        const args = buildCliArgs({ ...config, emitProgress: true });

        sendEvent({
          event: 'start',
          timestamp: new Date().toISOString(),
          message: `Starting llama-benchy benchmark for ${config.model || 'auto-detected model'} on ${config.baseUrl}...`,
          // llama-benchy runs the cartesian matrix pp × tg × depth × concurrency
          // (each cell generates pp prompt tokens and tg output tokens together).
          totalTests:
            (config.pp.length || 1) *
            (config.tg.length || 1) *
            (config.depth.length || 1) *
            (config.concurrency.length || 1),
        });

        // Determine if llama-benchy is installed directly or use uvx
        let cmd = 'llama-benchy';
        let spawnArgs = args;

        // Try spawning uvx or llama-benchy
        const proc = spawn(cmd, spawnArgs, {
          env: {
            ...process.env,
            PYTHONUNBUFFERED: '1',
          },
          shell: true,
        });

        let fullStdout = '';
        let fullStderr = '';

        const totalShapes =
          (config.pp.length || 1) *
          (config.tg.length || 1) *
          (config.depth.length || 1) *
          (config.concurrency.length || 1);
        const totalRunsPerShape = config.runs || 3;
        const totalRequests = Math.max(1, totalShapes * totalRunsPerShape);
        let completedRequests = 0;
        let lastTtfrMs: number | undefined = undefined;
        let lastE2eTtftMs: number | undefined = undefined;
        let measuredLatencyMs: number | undefined = undefined;
        let currentPromptSize = config.pp[0] || 2048;
        let currentResponseSize = config.tg[0] || 32;
        let currentDepth = config.depth[0] || 0;
        let currentConcurrency = config.concurrency[0] || 1;
        let currentRunIndex = 0;

        // llama-benchy emits newline-delimited JSON; a line can be split across
        // chunks, so keep a partial-line buffer instead of parsing per chunk.
        let stdoutLineBuffer = '';
        let stderrLineBuffer = '';

        // Collect token-chunk timestamps from the progress stream to build the
        // total-throughput timeseries (same source data upstream uses for its
        // peak-throughput calculation).
        const tokenEvents: { ts: number; count: number }[] = [];

        proc.stdout.on('data', (chunk: Buffer) => {
          const text = chunk.toString();
          fullStdout += text;
          stdoutLineBuffer += text;

          const lines = stdoutLineBuffer.split('\n');
          stdoutLineBuffer = lines.pop() || '';
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            // Check if JSON progress event from llama-benchy
            if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
              try {
                const parsed = JSON.parse(trimmed);
                let displayMsg = '';

                if (parsed.type === 'request_start') {
                  currentPromptSize = parsed.prompt_size ?? currentPromptSize;
                  currentResponseSize = parsed.response_size ?? currentResponseSize;
                  currentDepth = parsed.context_size ?? currentDepth;
                  currentConcurrency = parsed.concurrency ?? currentConcurrency;
                  currentRunIndex = parsed.run_index ?? currentRunIndex;

                  const testShapeName = benchyTestName('pp', currentPromptSize, currentDepth, currentConcurrency);

                  displayMsg = `[Start] pp=${currentPromptSize} tg=${currentResponseSize} depth=${currentDepth} c=${currentConcurrency} (Run #${currentRunIndex + 1}/${totalRunsPerShape})`;

                  sendEvent({
                    event: 'run_progress',
                    timestamp: new Date().toISOString(),
                    currentTest: testShapeName,
                    runIndex: currentRunIndex + 1,
                    totalRuns: totalRunsPerShape,
                    concurrency: currentConcurrency,
                    depth: currentDepth,
                    pp: currentPromptSize,
                    tg: currentResponseSize,
                    progressPercent: Math.min(95, Math.max(5, Math.round((completedRequests / totalRequests) * 100))),
                    data: parsed,
                    message: displayMsg,
                  });
                  continue;
                } else if (parsed.type === 'request_first_response') {
                  lastTtfrMs = parsed.ttfr_s * 1000;
                  displayMsg = `[TTFR] First response in ${lastTtfrMs.toFixed(1)} ms`;

                  sendEvent({
                    event: 'run_progress',
                    timestamp: new Date().toISOString(),
                    ttfrMs: lastTtfrMs,
                    message: displayMsg,
                    data: parsed,
                  });
                  continue;
                } else if (parsed.type === 'request_first_token') {
                  // e2e_ttft: end-to-end time to first content token (seconds)
                  lastE2eTtftMs = parsed.ttft_s * 1000;
                  displayMsg = `[TTFT] First token in ${lastE2eTtftMs.toFixed(1)} ms`;
                } else if (parsed.type === 'tokens') {
                  if (typeof parsed.ts === 'number') {
                    tokenEvents.push({ ts: parsed.ts, count: parsed.count || 1 });
                  }
                  displayMsg = `[Token] "${parsed.snippet?.replace(/\n/g, '\\n')}"`;
                } else if (parsed.type === 'request_end') {
                  completedRequests++;
                  const decodeSec = parsed.decode_seconds || 0.001;
                  const totalTokens = parsed.total_tokens || 0;
                  const tgTps = totalTokens > 0 ? totalTokens / decodeSec : 0;
                  const progress = Math.min(99, Math.max(5, Math.round((completedRequests / totalRequests) * 100)));

                  displayMsg = `[End] ${totalTokens} tokens decoded in ${decodeSec.toFixed(2)}s (${tgTps.toFixed(1)} t/s)`;

                  // Mirror upstream metric semantics: est_ppt = ttfr − network latency,
                  // pp speed = prompt tokens / est_ppt. No fabricated peak values.
                  const estPptMs = lastTtfrMs !== undefined
                    ? Math.max(0, lastTtfrMs - (measuredLatencyMs ?? 0))
                    : undefined;
                  const promptTokens = parsed.prompt_tokens || currentPromptSize + currentDepth;

                  const ppLiveRow = {
                    id: `live-pp-${completedRequests}`,
                    model: config.model || 'unknown',
                    test: benchyTestName('pp', currentPromptSize, currentDepth, currentConcurrency),
                    pp: currentPromptSize,
                    tg: 0,
                    depth: currentDepth,
                    concurrency: currentConcurrency,
                    tps: estPptMs && estPptMs > 0 ? promptTokens / (estPptMs / 1000) : 0,
                    ttfrMs: lastTtfrMs,
                    estPptMs,
                    e2eTtftMs: lastE2eTtftMs,
                  };

                  const tgLiveRow = {
                    id: `live-tg-${completedRequests}`,
                    model: config.model || 'unknown',
                    test: benchyTestName('tg', currentResponseSize, currentDepth, currentConcurrency),
                    pp: 0,
                    tg: currentResponseSize,
                    depth: currentDepth,
                    concurrency: currentConcurrency,
                    tps: tgTps,
                    ttfrMs: lastTtfrMs,
                  };

                  sendEvent({
                    event: 'live_metric',
                    timestamp: new Date().toISOString(),
                    currentTest: ppLiveRow.test,
                    progressPercent: progress,
                    liveRow: ppLiveRow,
                    data: parsed,
                    message: `[Prefill] ${ppLiveRow.test} -> ${ppLiveRow.tps > 0 ? `${ppLiveRow.tps.toFixed(1)} t/s` : 'n/a'}`,
                  });

                  sendEvent({
                    event: 'live_metric',
                    timestamp: new Date().toISOString(),
                    currentTest: tgLiveRow.test,
                    currentTps: tgTps,
                    progressPercent: progress,
                    liveRow: tgLiveRow,
                    data: parsed,
                    message: displayMsg,
                  });
                  continue;
                } else if (parsed.type === 'latency_measured') {
                  // Upstream emits this once before all requests; consumers are
                  // expected to compute est_ppt = ttfr − latency.
                  measuredLatencyMs = parsed.latency_s * 1000;
                  displayMsg = `[Latency] ${parsed.mode} latency: ${measuredLatencyMs.toFixed(2)} ms`;
                } else if (parsed.type === 'bench_complete') {
                  displayMsg = `[Complete] Benchmark matrix completed (Status: ${parsed.status})`;
                } else {
                  displayMsg = parsed.message || parsed.event || parsed.type || 'Benchmark event';
                }

                sendEvent({
                  event: 'run_progress',
                  timestamp: new Date().toISOString(),
                  data: parsed,
                  message: displayMsg,
                });
                continue;
              } catch {
                // Not valid JSON, treat as stdout text
              }
            }

            // Normal stdout line
            sendEvent({
              event: 'stdout',
              timestamp: new Date().toISOString(),
              message: trimmed,
            });
          }
        });

        proc.stderr.on('data', (chunk: Buffer) => {
          const text = chunk.toString();
          fullStderr += text;
          stderrLineBuffer += text;

          const lines = stderrLineBuffer.split('\n');
          stderrLineBuffer = lines.pop() || '';
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            sendEvent({
              event: 'stdout',
              timestamp: new Date().toISOString(),
              message: `[stderr] ${trimmed}`,
            });
          }
        });

        proc.on('close', (code) => {
          // Flush any remaining partial lines (EOF without trailing newline)
          if (stdoutLineBuffer.trim()) {
            fullStdout += stdoutLineBuffer;
            stdoutLineBuffer = '';
          }
          if (stderrLineBuffer.trim()) {
            fullStderr += stderrLineBuffer;
            stderrLineBuffer = '';
          }

          const combinedOutput = `${fullStdout}\n${fullStderr}`;
          const isNoResults = combinedOutput.includes('No results collected') || combinedOutput.includes('Check if the model is generating tokens');

          if (code === 0 && !isNoResults) {
            sendEvent({
              event: 'complete',
              timestamp: new Date().toISOString(),
              message: 'Benchmark completed successfully.',
              fullStdout: combinedOutput,
              // Real-run timeseries derived from the progress stream
              // (1-second total-throughput bins across all requests).
              timeseries: buildTotalThroughputTimeseries(tokenEvents),
            });
          } else if (isNoResults) {
            sendEvent({
              event: 'error',
              timestamp: new Date().toISOString(),
              message: `Warning: No results collected by llama-benchy.\n\nPossible Causes:\n1. Context Length Exceeded: The combination of --pp (${config.pp.join(', ')}) and --depth (${config.depth.join(', ')}) may exceed the Context Window configured in LM Studio / vLLM.\n2. Concurrency Limit: High concurrency (${config.concurrency.join(', ')}) may have caused timeouts or empty responses.\n3. Tokenizer Mismatch: Set --tokenizer to a valid HuggingFace model.\n\nTip: Try the "Quick Smoke Test" preset (pp=512, tg=32, depth=0) first!`,
              fullStdout: combinedOutput,
              fullStderr,
            });
          } else {
            sendEvent({
              event: 'error',
              timestamp: new Date().toISOString(),
              message: `llama-benchy exited with code ${code}.\n${fullStderr || fullStdout}`,
              fullStdout: combinedOutput,
              fullStderr,
            });
          }
          controller.close();
        });

        proc.on('error', (err) => {
          sendEvent({
            event: 'error',
            timestamp: new Date().toISOString(),
            message: `Failed to execute llama-benchy: ${err.message}. Tip: Check if uv or llama-benchy is installed.`,
          });
          controller.close();
        });
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || 'Internal error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

async function runSimulatedBenchmark(
  config: BenchmarkConfig,
  sendEvent: (data: any) => void
) {
  const modelName = config.model || 'openai/gpt-oss-120b';
  const depths = config.depth.length > 0 ? config.depth : [0];
  const pps = config.pp.length > 0 ? config.pp : [2048];
  const tgs = config.tg.length > 0 ? config.tg : [32];
  const runs = config.runs || 3;
  const concs = config.concurrency.length > 0 ? config.concurrency : [1];

  const totalShapes = depths.length * pps.length * tgs.length * concs.length;

  sendEvent({
    event: 'start',
    timestamp: new Date().toISOString(),
    message: `[Simulated Run] Initializing benchmark for ${modelName} on ${config.baseUrl}...`,
    totalTests: totalShapes,
  });

  await sleep(600);

  // Warmup stage
  if (!config.noWarmup) {
    sendEvent({
      event: 'warmup',
      timestamp: new Date().toISOString(),
      message: `Running ${config.warmupRuns || 1} warmup iteration(s) to prime KV cache and test shape...`,
      progressPercent: 5,
    });
    await sleep(900);
  }

  // Coherence check
  if (!config.skipCoherence) {
    sendEvent({
      event: 'coherence_check',
      timestamp: new Date().toISOString(),
      message: 'Running coherence test with Project Gutenberg source text...',
      progressPercent: 10,
    });
    await sleep(700);
  }

  let testCount = 0;
  const resultRows: any[] = [];
  const timeseries: any[] = [];
  let currentTimeSec = 0;

  // Base speeds for simulation
  const basePpSpeed = 8650; // tokens/sec
  const baseTgSpeed = 74.5; // tokens/sec
  const baseTtfr = 295;    // ms

  for (const conc of concs) {
    for (const depth of depths) {
      // llama-benchy runs a cartesian matrix: every (pp, tg) pair is ONE cell.
      // Each cell issues num_runs requests that send pp prompt tokens and
      // generate tg output tokens together, then reports both a pp row and a
      // tg row from the same measurements.
      for (const pp of pps) {
        for (const tg of tgs) {
          testCount++;
          const testName = benchyTestName('pp', pp, depth, conc);
          const tgTestName = benchyTestName('tg', tg, depth, conc);
          const progress = Math.round((testCount / totalShapes) * 90) + 8;

          sendEvent({
            event: 'run_start',
            timestamp: new Date().toISOString(),
            testIndex: testCount,
            totalTests: totalShapes,
            currentTest: testName,
            pp,
            tg,
            depth,
            concurrency: conc,
            message: `Benchmarking ${testName} + ${tgTestName} (${runs} runs)...`,
            progressPercent: progress,
          });

          const depthPenalty = 1 - (depth / 131072) * 0.28;
          const concMultiplier = Math.pow(conc, 0.72);
          const calcPpSpeed = (basePpSpeed * depthPenalty * concMultiplier * (1 + (Math.random() * 0.04 - 0.02)));
          const calcEstPpt = ((pp / calcPpSpeed) * 1000) * (1 + (Math.random() * 0.02));
          const calcTtfr = (baseTtfr + (depth * 0.14) + (pp * 0.08)) * (1 + (Math.random() * 0.03));
          const calcE2e = calcTtfr + 42 + Math.random() * 10;

          const tgDepthPenalty = 1 - (depth / 65536) * 0.12;
          const concTgTotal = (baseTgSpeed * Math.pow(conc, 0.88) * tgDepthPenalty);

          for (let r = 1; r <= runs; r++) {
            await sleep(450);
            currentTimeSec += 1;
            timeseries.push({
              time: currentTimeSec,
              totalThroughput: concTgTotal * (1 + (Math.random() * 0.05 - 0.025)),
              depth,
              concurrency: conc,
            });

            sendEvent({
              event: 'run_progress',
              timestamp: new Date().toISOString(),
              testIndex: testCount,
              runIndex: r,
              totalRuns: runs,
              currentTest: testName,
              currentTps: calcPpSpeed,
              progressPercent: progress,
              message: `Run ${r}/${runs}: pp ${calcPpSpeed.toFixed(1)} t/s, tg ${concTgTotal.toFixed(2)} t/s, TTFR ${calcTtfr.toFixed(1)} ms`,
            });
          }

          const ppStd = Math.max(8.5, calcPpSpeed * 0.008);
          const ttfrStd = Math.max(1.5, calcTtfr * 0.006);
          const tgStd = Math.max(0.4, concTgTotal * 0.01);
          const peakStd = tgStd * 1.1;
          const peakTps = concTgTotal * 1.04;

          const ppRow = {
            id: `row-pp-${testCount}`,
            model: modelName,
            test: testName,
            pp,
            tg: 0,
            depth,
            concurrency: conc,
            tps: calcPpSpeed,
            tpsStd: ppStd,
            ttfrMs: calcTtfr,
            ttfrStd: ttfrStd,
            estPptMs: calcEstPpt,
            estPptStd: ttfrStd,
            e2eTtftMs: calcE2e,
            e2eTtftStd: ttfrStd * 1.5,
          };

          const tgRow = {
            id: `row-tg-${testCount}`,
            model: modelName,
            test: tgTestName,
            pp: 0,
            tg,
            depth,
            concurrency: conc,
            tps: concTgTotal,
            tpsStd: tgStd,
            peakTps: peakTps,
            peakTpsStd: peakStd,
          };
          resultRows.push(ppRow, tgRow);

          sendEvent({
            event: 'run_complete',
            timestamp: new Date().toISOString(),
            data: ppRow,
            message: `Completed ${testName} -> ${calcPpSpeed.toFixed(1)} ± ${ppStd.toFixed(1)} t/s`,
          });

          sendEvent({
            event: 'run_complete',
            timestamp: new Date().toISOString(),
            data: tgRow,
            message: `Completed ${tgTestName} -> ${concTgTotal.toFixed(2)} ± ${tgStd.toFixed(2)} t/s`,
          });
        }
      }
    }
  }

  // Generate standard markdown table matching llama-bench output
  const mdTable = generateMarkdownTable(modelName, resultRows, config.latencyMode);

  sendEvent({
    event: 'complete',
    timestamp: new Date().toISOString(),
    message: 'Benchmark complete. All iterations and shapes processed.',
    progressPercent: 100,
    fullStdout: mdTable,
    rows: resultRows,
    timeseries,
  });
}

function generateMarkdownTable(model: string, rows: any[], latencyMode: string) {
  let output = `| model | test | t/s | peak t/s | ttfr (ms) | est_ppt (ms) | e2e_ttft (ms) |\n`;
  output += `|:---|---:|---:|---:|---:|---:|---:|\n`;

  for (const r of rows) {
    const tpsStr = r.tps ? `${r.tps.toFixed(2)}${r.tpsStd ? ` ± ${r.tpsStd.toFixed(2)}` : ''}` : '';
    const peakStr = r.peakTps ? `${r.peakTps.toFixed(2)}${r.peakTpsStd ? ` ± ${r.peakTpsStd.toFixed(2)}` : ''}` : '';
    const ttfrStr = r.ttfrMs ? `${r.ttfrMs.toFixed(2)}${r.ttfrStd ? ` ± ${r.ttfrStd.toFixed(2)}` : ''}` : '';
    const estPptStr = r.estPptMs ? `${r.estPptMs.toFixed(2)}${r.estPptStd ? ` ± ${r.estPptStd.toFixed(2)}` : ''}` : '';
    const e2eStr = r.e2eTtftMs ? `${r.e2eTtftMs.toFixed(2)}${r.e2eTtftStd ? ` ± ${r.e2eTtftStd.toFixed(2)}` : ''}` : '';

    output += `| ${model} | ${r.test} | ${tpsStr} | ${peakStr} | ${ttfrStr} | ${estPptStr} | ${e2eStr} |\n`;
  }

  output += `\nllama-benchy\ndate: ${new Date().toISOString().replace('T', ' ').substring(0, 19)} | latency mode: ${latencyMode}\n`;
  return output;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
