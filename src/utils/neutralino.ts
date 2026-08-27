import { BenchmarkConfig, ProgressEvent, BenchmarkResultRow } from '@/types/benchmark';
import { buildCliArgs } from '@/utils/commandBuilder';
import { parseLlamaBenchMarkdown } from '@/utils/formatters';

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
    totalTests: (config.pp.length + config.tg.length) * config.depth.length * config.concurrency.length,
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
    let activeTokenCount = 0;
    let decodeStartTime = 0;
    let activePpTps = 0;

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
              activeTestName = activeDepth > 0 ? `pp${activePp} @ d${activeDepth}` : `pp${activePp}`;
              activeTtfrMs = undefined;
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
              const ttfrSec = parsed.ttfr_s ?? parsed.ttft_s ?? parsed.ttfr ?? 0;
              activeTtfrMs = ttfrSec * 1000;
              decodeStartTime = Date.now();
              const totalPromptTokens = activePp + activeDepth;
              activePpTps = ttfrSec > 0 ? totalPromptTokens / ttfrSec : 0;

              const liveRow: BenchmarkResultRow = {
                id: `${activeTestName}-${Date.now()}`,
                model: config.model,
                test: activeTestName,
                pp: activePp,
                tg: activeTg,
                depth: activeDepth,
                concurrency: activeConcurrency,
                tps: activePpTps,
                peakTps: activePpTps,
                ttfrMs: activeTtfrMs,
                estPptMs: activeTtfrMs,
                e2eTtftMs: activeTtfrMs,
              };

              onEvent({
                event: 'live_metric',
                timestamp: new Date().toISOString(),
                liveRow,
                message: `[Prefill Done] ${activeTestName} • TTFR: ${activeTtfrMs.toFixed(1)}ms (${activePpTps.toFixed(1)} t/s)`,
              });
              continue;
            }

            if (evtType === 'tokens') {
              activeTokenCount += parsed.count || 1;
              const now = Date.now();
              const decodeDurationSec = decodeStartTime > 0 ? (now - decodeStartTime) / 1000 : 0.001;
              const liveTgTps = decodeDurationSec > 0 ? activeTokenCount / decodeDurationSec : 0;

              const liveRow: BenchmarkResultRow = {
                id: `tg-${activeTestName}-${Date.now()}`,
                model: config.model,
                test: `tg${activeTg}`,
                pp: activePp,
                tg: activeTokenCount,
                depth: activeDepth,
                concurrency: activeConcurrency,
                tps: liveTgTps,
                peakTps: liveTgTps,
                ttfrMs: activeTtfrMs,
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
                test: `tg${activeTg}`,
                pp: activePp,
                tg: totalTokens,
                depth: activeDepth,
                concurrency: activeConcurrency,
                tps: finalTgTps,
                peakTps: finalTgTps,
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
              });
              continue;
            }

            continue;
          } catch {}
        }

        // 2. Parse Markdown Table rows from stdout
        if (trimmed.includes('|') && !trimmed.includes('---') && !trimmed.includes('model | test')) {
          const parsedRows = parseLlamaBenchMarkdown(trimmed);
          if (parsedRows.length > 0) {
            for (const row of parsedRows) {
              onEvent({
                event: 'run_complete',
                timestamp: new Date().toISOString(),
                data: row,
                message: `[Row Ready] ${row.test}: ${row.tps.toFixed(1)} t/s`,
              });
            }
          }
        }

        // 3. Regular console logs
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
