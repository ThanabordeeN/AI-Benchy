import { BenchmarkConfig, ProgressEvent, BenchmarkResultRow } from '@/types/benchmark';
import { buildCliArgs } from '@/utils/commandBuilder';
import { benchyTestName, buildTotalThroughputTimeseries } from '@/utils/formatters';

declare global {
  interface Window {
    Neutralino?: any;
    NL_PORT?: number;
    NL_TOKEN?: string;
  }
}

export function isNeutralino(): boolean {
  return typeof window !== 'undefined' && Boolean(window.Neutralino);
}

export async function initNeutralino(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  if (window.Neutralino) {
    try {
      window.Neutralino.init();
      console.log('⚡ Neutralinojs Native Engine Initialized');
      return true;
    } catch (e) {
      console.warn('Failed to initialize Neutralino:', e);
    }
  }
  return false;
}

export async function runNeutralinoBenchmark(
  config: BenchmarkConfig,
  onEvent: (event: ProgressEvent) => void
): Promise<() => void> {
  if (!isNeutralino()) {
    throw new Error('Neutralinojs native runtime is not available');
  }

  const args = buildCliArgs({ ...config, emitProgress: true });
  const cmd = `llama-benchy ${args.join(' ')}`;

  onEvent({
    event: 'start',
    timestamp: new Date().toISOString(),
    message: `[Native Engine] Spawning llama-benchy directly on local OS...`,
    // llama-benchy runs the cartesian matrix pp × tg × depth × concurrency
    totalTests:
      (config.pp.length || 1) *
      (config.tg.length || 1) *
      (config.depth.length || 1) *
      (config.concurrency.length || 1),
  });

  try {
    const processInfo = await window.Neutralino.os.spawnProcess(cmd);
    const pid = processInfo.id;

    // Track active request state
    let activePp = config.pp[0] || 512;
    let activeTg = config.tg[0] || 128;
    let activeDepth = config.depth[0] || 0;
    let activeConcurrency = config.concurrency[0] || 1;
    let activeTestName = `pp${activePp}`;
    let activeTtfrMs: number | undefined;
    let activeE2eTtftMs: number | undefined;
    let activeTokenCount = 0;
    let decodeStartTime = 0;
    let activePpTps = 0;

    // Token-chunk timestamps → total-throughput timeseries for charts
    const tokenEvents: { ts: number; count: number }[] = [];

    // Listen to native process output stream
    const onProcessEvent = (evt: any) => {
      if (!evt || !evt.detail) return;
      if (evt.detail.id !== pid) return;

      // Handle process exit event
      if (evt.detail.action === 'exit') {
        const exitCode = typeof evt.detail.data === 'number' ? evt.detail.data : 0;
        onEvent({
          event: 'complete',
          timestamp: new Date().toISOString(),
          message: `Benchmark process completed (Exit Code: ${exitCode}).`,
          timeseries: buildTotalThroughputTimeseries(tokenEvents),
        });
        return;
      }

      const raw = evt.detail.data ?? evt.detail.stdOut ?? evt.detail.stdErr;
      if (raw === undefined || raw === null) return;
      const text = typeof raw === 'string' ? raw : String(raw);
      if (!text.trim()) return;

      const lines = text.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        // 1. Handle JSON Progress Events (schema: llama-benchy-progress.v1)
        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
          try {
            const parsed = JSON.parse(trimmed);
            const evtType = parsed.type || parsed.event || '';

            if (evtType === 'request_start') {
              activePp = parsed.prompt_size ?? (parsed.test?.pp || config.pp[0] || 512);
              activeTg = parsed.response_size ?? (parsed.test?.tg || config.tg[0] || 128);
              activeDepth = parsed.context_size ?? (parsed.test?.depth || 0);
              activeConcurrency = parsed.concurrency || 1;
              activeTestName = benchyTestName('pp', activePp, activeDepth, activeConcurrency);
              activeTtfrMs = undefined;
              activeE2eTtftMs = undefined;
              activeTokenCount = 0;
              decodeStartTime = 0;

              onEvent({
                event: 'stdout',
                timestamp: new Date().toISOString(),
                message: `[Start] Testing ${activeTestName} (tg=${activeTg}, conc=${activeConcurrency})...`,
              });
              continue;
            }

            if (evtType === 'request_first_response' || evtType === 'request_first_token') {
              // ttfr = time to first response chunk, ttft = time to first
              // content token (e2e_ttft upstream). est_ppt = ttfr − latency;
              // latency is unknown here so we keep the raw ttfr as estimate.
              const ttfrSec = parsed.ttfr_s ?? 0;
              const ttftSec = parsed.ttft_s ?? 0;
              if (parsed.ttfr_s !== undefined) activeTtfrMs = ttfrSec * 1000;
              if (parsed.ttft_s !== undefined) activeE2eTtftMs = ttftSec * 1000;
              if (evtType === 'request_first_token') {
                decodeStartTime = Date.now();
              }
              const totalPromptTokens = activePp + activeDepth;
              const estPptMs = activeTtfrMs !== undefined ? Math.max(0, activeTtfrMs) : undefined;
              activePpTps = estPptMs && estPptMs > 0 ? totalPromptTokens / (estPptMs / 1000) : 0;

              const liveRow: BenchmarkResultRow = {
                id: `${activeTestName}-${Date.now()}`,
                model: config.model,
                test: activeTestName,
                pp: activePp,
                tg: 0,
                depth: activeDepth,
                concurrency: activeConcurrency,
                tps: activePpTps,
                ttfrMs: activeTtfrMs,
                estPptMs,
                e2eTtftMs: activeE2eTtftMs,
              };

              onEvent({
                event: 'live_metric',
                timestamp: new Date().toISOString(),
                liveRow,
                message: `[Prefill] ${activeTestName} • TTFR: ${(activeTtfrMs ?? 0).toFixed(1)}ms${activePpTps > 0 ? ` (${activePpTps.toFixed(1)} t/s)` : ''}`,
              });
              continue;
            }

            if (evtType === 'tokens') {
              activeTokenCount += parsed.count || 1;
              if (typeof parsed.ts === 'number') {
                tokenEvents.push({ ts: parsed.ts, count: parsed.count || 1 });
              }
              const now = Date.now();
              const decodeDurationSec = decodeStartTime > 0 ? (now - decodeStartTime) / 1000 : 0.001;
              const liveTgTps = decodeDurationSec > 0 ? activeTokenCount / decodeDurationSec : 0;

              const liveRow: BenchmarkResultRow = {
                id: `tg-${activeTestName}-${Date.now()}`,
                model: config.model,
                test: benchyTestName('tg', activeTg, activeDepth, activeConcurrency),
                pp: 0,
                tg: activeTg,
                depth: activeDepth,
                concurrency: activeConcurrency,
                tps: liveTgTps,
              };

              onEvent({
                event: 'live_metric',
                timestamp: new Date().toISOString(),
                liveRow,
                message: `[Generating] ${activeTokenCount}/${activeTg} tokens (${liveTgTps.toFixed(1)} t/s)`,
              });
              continue;
            }

            if (evtType === 'request_end') {
              const totalTokens = parsed.total_tokens ?? parsed.tokens ?? activeTokenCount;
              const decodeSec = parsed.decode_seconds ?? parsed.duration ?? 0;
              const finalTgTps = decodeSec > 0 ? totalTokens / decodeSec : (parsed.tps || 0);

              const liveRow: BenchmarkResultRow = {
                id: `tg-${activeTestName}-${Date.now()}`,
                model: config.model,
                test: benchyTestName('tg', activeTg, activeDepth, activeConcurrency),
                pp: 0,
                tg: activeTg,
                depth: activeDepth,
                concurrency: activeConcurrency,
                tps: finalTgTps,
                ttfrMs: activeTtfrMs,
              };

              onEvent({
                event: 'live_metric',
                timestamp: new Date().toISOString(),
                liveRow,
                message: `[Request Finished] ${activeTestName} • ${totalTokens} tokens in ${decodeSec.toFixed(2)}s (${finalTgTps.toFixed(2)} t/s)`,
              });
              continue;
            }

            if (evtType === 'bench_complete') {
              onEvent({
                event: 'complete',
                timestamp: new Date().toISOString(),
                message: 'Benchmark completed successfully.',
                timeseries: buildTotalThroughputTimeseries(tokenEvents),
              });
              continue;
            }

            continue;
          } catch {}
        }

        // 2. Regular console logs
        onEvent({
          event: 'stdout',
          timestamp: new Date().toISOString(),
          message: trimmed,
        });
      }
    };

    window.Neutralino.events.on('spawnedProcess', onProcessEvent);

    return () => {
      try {
        window.Neutralino.os.execCommand(`kill -9 ${pid}`);
      } catch (e) {
        console.error('Failed to kill native process', e);
      }
    };
  } catch (err: any) {
    onEvent({
      event: 'error',
      timestamp: new Date().toISOString(),
      message: `Neutralino OS Process error: ${err.message}`,
    });
    return () => {};
  }
}
