import { EvalScopeConfig, HeatmapCell } from '@/types/evalscope';

export const DEFAULT_EVALSCOPE_CONFIG: EvalScopeConfig = {
  model: 'Qwen3.8-27B',
  apiUrl: 'http://127.0.0.1:1234/v1',
  apiKey: 'EMPTY',
  evalType: 'openai_api',
  datasets: ['needle_haystack'],
  datasetArgs: {
    subsetList: ['english'],
    retrievalQuestion: 'What is the secret verification code?',
    needles: ['The secret verification code is ZX-48291.'],
    contextLengthsMin: 32000,
    contextLengthsMax: 200000,
    contextLengthsNumIntervals: 6,
    documentDepthPercentMin: 0,
    documentDepthPercentMax: 100,
    documentDepthPercentIntervals: 10,
    tokenizerPath: 'Qwen/Qwen3-0.6B',
    showScore: true,
  },
  generationConfig: {
    maxTokens: 128,
    temperature: 0,
  },
  evalBatchSize: 1,
};

export function computeContextLengths(min: number, max: number, intervals: number): number[] {
  if (intervals <= 1) return [min];
  const step = (max - min) / (intervals - 1);
  const result: number[] = [];
  for (let i = 0; i < intervals; i++) {
    result.push(Math.round(min + i * step));
  }
  return result;
}

// ---------------------------------------------------------------------------
// Built-in NIAH engine (shared by the client loop and the server route)
// ---------------------------------------------------------------------------

export const FILLER_SENTENCE =
  'The quick brown fox jumps over the lazy dog and explores the distributed architecture of high performance neural inference runtimes. ';

/**
 * Builds a haystack of approximately `targetTokens` tokens (~4 chars/token for
 * English) with the needle inserted at `depthPercent` of the document.
 * NOTE: this is the built-in lite engine, NOT the official EvalScope corpus.
 */
export function generateHaystackWithNeedle(
  targetTokens: number,
  depthPercent: number,
  needle: string
): string {
  const totalChars = targetTokens * 4;
  const sentenceChars = FILLER_SENTENCE.length;
  const totalSentences = Math.max(1, Math.floor(totalChars / sentenceChars));
  const insertIndex = Math.min(
    totalSentences - 1,
    Math.floor(totalSentences * (depthPercent / 100))
  );

  const parts: string[] = [];
  for (let i = 0; i < totalSentences; i++) {
    if (i === insertIndex) {
      parts.push(`\n\nImportant Fact: ${needle}\n\n`);
    }
    parts.push(FILLER_SENTENCE);
  }

  // If needle wasn't inserted (e.g. depth 100%)
  if (insertIndex >= totalSentences - 1 && !parts.some((p) => p.includes(needle))) {
    parts.push(`\n\nImportant Fact: ${needle}\n\n`);
  }

  return parts.join(' ');
}

/**
 * Scores a model response against the user-configured needle by checking how
 * many distinctive needle keywords (length > 3, punctuation stripped — hyphens
 * kept so codes like ZX-48291 survive) appear in the response.
 */
export function scoreNeedleResponse(
  text: string,
  needle: string
): { score: number; status: 'passed' | 'partial' | 'failed'; foundCount: number; totalKeywords: number } {
  const keywords = needle
    .replace(/[.,\/#!$%\^&\*;:{}=_`~()]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 3);

  if (keywords.length === 0) {
    // Degenerate needle (no distinctive keywords): fall back to substring match
    const found = text.toLowerCase().includes(needle.trim().toLowerCase());
    return { score: found ? 1.0 : 0.0, status: found ? 'passed' : 'failed', foundCount: found ? 1 : 0, totalKeywords: 1 };
  }

  const foundCount = keywords.filter((k) => text.toLowerCase().includes(k.toLowerCase())).length;

  if (foundCount === keywords.length) {
    return { score: 1.0, status: 'passed', foundCount, totalKeywords: keywords.length };
  }
  if (foundCount > 0) {
    return { score: 0.6, status: 'partial', foundCount, totalKeywords: keywords.length };
  }
  return { score: 0.0, status: 'failed', foundCount, totalKeywords: keywords.length };
}

export function computeDepthPercents(min: number, max: number, intervals: number): number[] {
  if (intervals <= 1) return [min];
  const step = (max - min) / (intervals - 1);
  const result: number[] = [];
  for (let i = 0; i < intervals; i++) {
    result.push(Math.round(min + i * step));
  }
  return result;
}

export function generateEvalScopePythonScript(config: EvalScopeConfig): string {
  const pyStr = (s: string) => s.replace(/"/g, '\\"');
  const judgeApiKey = config.apiKey || 'EMPTY';

  return `from evalscope import TaskConfig, run_task

# 🎯 EvalScope: Needle In A Haystack (NIAH) Long-Context Evaluation
# Target Endpoint: ${config.apiUrl} (${config.model})

task_cfg = TaskConfig(
    model="${config.model}",
    api_url="${config.apiUrl}",
    api_key="${config.apiKey || 'EMPTY'}",
    eval_type="${config.evalType}",
    datasets=["${config.datasets.join('", "')}"],

    dataset_args={
        "needle_haystack": {
            "subset_list": ["${config.datasetArgs.subsetList.join('", "')}"],
            "extra_params": {
                "retrieval_question": "${pyStr(config.datasetArgs.retrievalQuestion)}",
                "needles": ${JSON.stringify(config.datasetArgs.needles, null, 20)},

                "context_lengths_min": ${config.datasetArgs.contextLengthsMin},
                "context_lengths_max": ${config.datasetArgs.contextLengthsMax},
                "context_lengths_num_intervals": ${config.datasetArgs.contextLengthsNumIntervals},

                "document_depth_percent_min": ${config.datasetArgs.documentDepthPercentMin},
                "document_depth_percent_max": ${config.datasetArgs.documentDepthPercentMax},
                "document_depth_percent_intervals": ${config.datasetArgs.documentDepthPercentIntervals},

                "tokenizer_path": "${config.datasetArgs.tokenizerPath}",
                "show_score": ${config.datasetArgs.showScore ? 'True' : 'False'},
            }
        }
    },

    generation_config={
        "max_tokens": ${config.generationConfig.maxTokens},
        "temperature": ${config.generationConfig.temperature},
    },

    eval_batch_size=${config.evalBatchSize},

    # ⚠️ EvalScope NIAH scoring requires a judge model. This script reuses the
    # target endpoint as judge — point it at a separate strong model endpoint
    # if your endpoint only serves the model under test.
    judge={
        "models": {
            "model_id": "${config.model}",
            "api_url": "${config.apiUrl}",
            "api_key": "${judgeApiKey}",
        }
    },
)

if __name__ == "__main__":
    print("🚀 Starting EvalScope NIAH Long-Context Benchmark...")
    run_task(task_cfg=task_cfg)
    print("✅ Evaluation completed. Heatmap and reports generated.")
`;
}

export function generateNeedleMarkdownReport(
  config: EvalScopeConfig,
  cells: HeatmapCell[]
): string {
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

  const passedCount = cells.filter((c) => c.status === 'passed').length;
  const partialCount = cells.filter((c) => c.status === 'partial').length;
  const failedCount = cells.filter((c) => c.status === 'failed').length;
  const total = cells.length || (contextLengths.length * depths.length);
  const passRate = total > 0 ? ((passedCount / total) * 100).toFixed(1) : '0.0';

  let md = `# 🎯 EvalScope: Needle In A Haystack (NIAH) Report
> Generated by **AI-Benchy** wrapping [ModelScope EvalScope](https://github.com/modelscope/evalscope)  
> **Date:** ${new Date().toLocaleString()}

---

## 📌 Executive Accuracy Summary

| Metric | Value | Notes |
|:---|---:|:---|
| **Model** | \`${config.model}\` | Target model tested |
| **Endpoint URL** | \`${config.apiUrl}\` | OpenAI-compatible endpoint |
| **Context Window Range** | \`${(config.datasetArgs.contextLengthsMin / 1000).toFixed(0)}K – ${(config.datasetArgs.contextLengthsMax / 1000).toFixed(0)}K tokens\` | ${contextLengths.length} intervals |
| **Needle Depths** | \`${config.datasetArgs.documentDepthPercentMin}% – ${config.datasetArgs.documentDepthPercentMax}%\` | ${depths.length} position intervals |
| **Overall Retrieval Pass Rate** | **${passRate}%** | ${passedCount} Passed / ${total} Tested |
| **Retrieval Question** | "${config.datasetArgs.retrievalQuestion}" | Target needle query |

---

## 🗺️ Long-Context Retrieval Heatmap Matrix

\`\`\`
                 Needle position (Depth %)
Context Length   ${depths.map((d) => `${d}%`.padEnd(6)).join(' ')}
----------------------------------------------------------------------
`;

  for (const ctx of contextLengths) {
    const ctxLabel = ctx >= 1000 ? `${Math.round(ctx / 1000)}K` : `${ctx}`;
    let rowStr = ctxLabel.padEnd(16);

    for (const depth of depths) {
      const cell = cells.find((c) => c.contextLength === ctx && c.depthPercent === depth);
      if (!cell || cell.status === 'pending') {
        rowStr += ' ⬜   ';
      } else if (cell.status === 'passed') {
        rowStr += ' ✅   ';
      } else if (cell.status === 'partial') {
        rowStr += ' ⚠️   ';
      } else {
        rowStr += ' ❌   ';
      }
    }
    md += `${rowStr}\n`;
  }

  md += `\`\`\`

> **Legend:**  
> ✅ **Passed (100%):** Model accurately retrieved the needle without hallucination.  
> ⚠️ **Partial (50-90%):** Retrieved partial needle or slight inaccuracies.  
> ❌ **Failed (0%):** Model failed to locate needle or generated hallucinated answer.

---

## 📋 Detailed Cell Breakdown Table

| Context Length | Needle Depth | Retrieval Status | Score | Response Snippet | Latency (ms) |
|:---|:---|:---:|:---:|:---|---:|
`;

  for (const cell of cells) {
    const icon = cell.status === 'passed' ? '✅ Pass' : cell.status === 'partial' ? '⚠️ Partial' : '❌ Fail';
    const ctxLabel = cell.contextLength >= 1000 ? `${Math.round(cell.contextLength / 1000)}K` : `${cell.contextLength}`;
    md += `| ${ctxLabel} (${cell.contextLength} tokens) | ${cell.depthPercent}% | ${icon} | **${(cell.score * 100).toFixed(0)}%** | ${cell.responseSnippet ? `\`${cell.responseSnippet.slice(0, 45)}...\`` : '—'} | ${cell.latencyMs ? `${cell.latencyMs} ms` : '—'} |\n`;
  }

  md += `\n---\n\n## ⚙️ EvalScope Task Configuration

\`\`\`python
${generateEvalScopePythonScript(config)}
\`\`\`

---
*Report generated automatically by [AI-Benchy](https://github.com/eugr/llama-benchy).*
`;

  return md;
}
