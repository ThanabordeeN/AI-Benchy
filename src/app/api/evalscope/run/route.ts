import { NextRequest } from 'next/server';
import { EvalScopeConfig, HeatmapCell } from '@/types/evalscope';
import { computeContextLengths, computeDepthPercents, generateHaystackWithNeedle, scoreNeedleResponse } from '@/utils/evalscope';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const config: EvalScopeConfig = await req.json();

    const contextLengths = computeContextLengths(
      config.datasetArgs.contextLengthsMin,
      config.datasetArgs.contextLengthsMax,
      config.datasetArgs.contextLengthsNumIntervals
    );

    const depths = computeDepthPercents(
      config.datasetArgs.documentDepthPercentMin,
      config.datasetArgs.documentDepthPercentMax,
      config.datasetArgs.documentDepthPercentIntervals
    );

    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    const sendEvent = async (data: any) => {
      const payload = `data: ${JSON.stringify(data)}\n\n`;
      await writer.write(encoder.encode(payload));
    };

    // Run evaluation in background task
    (async () => {
      try {
        await sendEvent({
          event: 'start',
          timestamp: new Date().toISOString(),
          message: `🚀 Starting Automated EvalScope NIAH benchmark on ${config.model} (${contextLengths.length * depths.length} cells)...`,
          totalCells: contextLengths.length * depths.length,
        });

        let completed = 0;
        const total = contextLengths.length * depths.length;
        const targetNeedle = config.datasetArgs.needles[0] || 'The secret verification code is ZX-48291.';

        // Normalize base URL
        let baseUrl = config.apiUrl || 'http://localhost:1234/v1';
        baseUrl = baseUrl.trim().replace(/\/+$/, '');
        const chatUrl = baseUrl.endsWith('/v1') ? `${baseUrl}/chat/completions` : `${baseUrl}/v1/chat/completions`;

        for (const ctx of contextLengths) {
          for (const depth of depths) {
            await sendEvent({
              event: 'cell_start',
              timestamp: new Date().toISOString(),
              currentCell: { contextLength: ctx, depthPercent: depth },
              message: `Testing Context ${ctx >= 1000 ? `${Math.round(ctx / 1000)}K` : ctx} tokens @ Depth ${depth}%...`,
            });

            const startTime = Date.now();
            let score = 1.0;
            let status: 'passed' | 'partial' | 'failed' = 'passed';
            let responseSnippet = '';
            let latencyMs = 0;

            try {
              // Construct prompt with haystack and embedded needle
              const haystack = generateHaystackWithNeedle(ctx, depth, targetNeedle);
              const prompt = `${haystack}\n\nQuestion: ${config.datasetArgs.retrievalQuestion}\nAnswer directly and concisely:`;

              const headers: Record<string, string> = {
                'Content-Type': 'application/json',
              };
              if (config.apiKey && config.apiKey !== 'EMPTY') {
                headers['Authorization'] = `Bearer ${config.apiKey}`;
              }

              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s per cell timeout

              const res = await fetch(chatUrl, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                  model: config.model,
                  messages: [
                    {
                      role: 'user',
                      content: prompt,
                    },
                  ],
                  max_tokens: config.generationConfig.maxTokens || 128,
                  temperature: config.generationConfig.temperature ?? 0,
                  stream: false,
                }),
                signal: controller.signal,
              });

              clearTimeout(timeoutId);
              latencyMs = Date.now() - startTime;

              if (res.ok) {
                const resData = await res.json();
                const text =
                  resData.choices?.[0]?.message?.content ||
                  resData.choices?.[0]?.text ||
                  '';
                responseSnippet = text.trim();

                // Score against the user-configured needle (shared helper)
                const verdict = scoreNeedleResponse(text, targetNeedle);
                score = verdict.score;
                status = verdict.status;
              } else {
                throw new Error(`HTTP ${res.status}`);
              }
            } catch (err: any) {
              // Do NOT fabricate results when the endpoint fails: report the
              // cell as failed with the underlying error so the heatmap stays
              // honest (previously this path simulated scores silently).
              score = 0.0;
              status = 'failed';
              responseSnippet = `Error: ${err?.message || 'Request failed'}`;
            }

            const cellResult: HeatmapCell = {
              contextLength: ctx,
              depthPercent: depth,
              score,
              status,
              responseSnippet: responseSnippet.slice(0, 150),
              needleFound: score > 0.5,
              latencyMs,
            };

            completed++;
            const progressPercent = Math.round((completed / total) * 100);

            await sendEvent({
              event: 'cell_complete',
              timestamp: new Date().toISOString(),
              cellResult,
              completedCells: completed,
              totalCells: total,
              progressPercent,
            });
          }
        }

        await sendEvent({
          event: 'complete',
          timestamp: new Date().toISOString(),
          message: 'EvalScope Needle In A Haystack benchmark finished successfully.',
        });
      } catch (err: any) {
        await sendEvent({
          event: 'error',
          timestamp: new Date().toISOString(),
          message: err.message || 'Evaluation encountered an error.',
        });
      } finally {
        await writer.close();
      }
    })();

    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
