'use client';

import React, { useState } from 'react';
import { Globe, Key, RefreshCw, CheckCircle2, AlertCircle, Server, Sparkles, ChevronDown, Cpu, Zap } from 'lucide-react';
import { detectHfTokenizerFromModelName } from '@/utils/presets';
import { clsx } from 'clsx';

interface EndpointTesterProps {
  baseUrl: string;
  apiKey: string;
  selectedModel: string;
  servedModelName?: string;
  onBaseUrlChange: (url: string) => void;
  onApiKeyChange: (key: string) => void;
  onModelSelect: (model: string, servedModelName?: string) => void;
}

interface EndpointPreset {
  name: string;
  url: string;
  engine: 'llamacpp' | 'vllm' | 'ollama' | 'sglang' | 'openai';
  badge: string;
}

const COMMON_ENDPOINTS: EndpointPreset[] = [
  { name: 'llama.cpp Server', url: 'http://localhost:8080/v1', engine: 'llamacpp', badge: 'llama.cpp' },
  { name: 'LM Studio', url: 'http://localhost:1234/v1', engine: 'llamacpp', badge: 'llama.cpp' },
  { name: 'vLLM Local', url: 'http://localhost:8000/v1', engine: 'vllm', badge: 'vLLM' },
  { name: 'SGLang', url: 'http://localhost:30000/v1', engine: 'sglang', badge: 'SGLang' },
  { name: 'Ollama', url: 'http://localhost:11434/v1', engine: 'ollama', badge: 'Ollama' },
  { name: 'OpenAI Remote', url: 'https://api.openai.com/v1', engine: 'openai', badge: 'OpenAI' },
];

export const EndpointTester: React.FC<EndpointTesterProps> = ({
  baseUrl,
  apiKey,
  selectedModel,
  servedModelName,
  onBaseUrlChange,
  onApiKeyChange,
  onModelSelect,
}) => {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    tested: boolean;
    success: boolean;
    latencyMs?: number;
    models?: string[];
    error?: string;
    detectedEngine?: 'llamacpp' | 'vllm' | 'ollama' | 'sglang' | 'openai' | 'generic';
  }>({ tested: false, success: false });

  const [showKey, setShowKey] = useState(false);

  // Detect active engine based on URL and model name
  const isLlamaCppEngine =
    baseUrl.includes(':8080') ||
    baseUrl.includes(':1234') ||
    (servedModelName && (servedModelName.includes('.gguf') || servedModelName.startsWith('/') || servedModelName.includes('@')));

  const applySelectedModel = (rawModelId: string) => {
    const isLocalGguf =
      rawModelId.startsWith('/') ||
      rawModelId.includes('\\') ||
      rawModelId.endsWith('.gguf') ||
      rawModelId.includes('@') ||
      rawModelId.includes(':') ||
      !rawModelId.includes('/');

    // If llama.cpp / local GGUF mode: map path to HF Tokenizer and keep path in servedModelName
    if (isLocalGguf || isLlamaCppEngine) {
      const hfRepo = detectHfTokenizerFromModelName(rawModelId);
      onModelSelect(hfRepo, rawModelId);
    } else {
      // For vLLM / SGLang / OpenAI: standard direct model ID
      onModelSelect(rawModelId, '');
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult({ tested: false, success: false });

    const startTime = Date.now();
    let normalizedUrl = (baseUrl || 'http://localhost:8080/v1').trim().replace(/\/+$/, '');
    if (!normalizedUrl.endsWith('/v1')) {
      normalizedUrl = `${normalizedUrl}/v1`;
      onBaseUrlChange(normalizedUrl);
    }
    const modelsUrl = `${normalizedUrl}/models`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (apiKey && apiKey !== 'EMPTY') {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    // 1. Direct fetch to local LLM server (Native Desktop & Webview)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(modelsUrl, { method: 'GET', headers, signal: controller.signal });
      clearTimeout(timeoutId);
      const latencyMs = Date.now() - startTime;

      if (res.ok) {
        const data = await res.json();
        const modelsList: Array<{ id: string } | string> = Array.isArray(data.data)
          ? data.data
          : Array.isArray(data)
          ? data
          : [];
        const modelNames = modelsList.map((m: any) => (typeof m === 'string' ? m : m.id || 'unknown'));

        // Identify engine type
        let detectedEngine: 'llamacpp' | 'vllm' | 'ollama' | 'sglang' | 'openai' | 'generic' = 'generic';
        if (normalizedUrl.includes(':8080') || normalizedUrl.includes(':1234') || modelNames.some(m => m.includes('.gguf') || m.startsWith('/'))) {
          detectedEngine = 'llamacpp';
        } else if (normalizedUrl.includes(':8000')) {
          detectedEngine = 'vllm';
        } else if (normalizedUrl.includes(':30000')) {
          detectedEngine = 'sglang';
        } else if (normalizedUrl.includes(':11434')) {
          detectedEngine = 'ollama';
        }

        setTestResult({
          tested: true,
          success: true,
          latencyMs,
          models: modelNames,
          detectedEngine,
        });

        if (modelNames.length > 0 && (!servedModelName || !modelNames.includes(servedModelName))) {
          applySelectedModel(modelNames[0]);
        }
        setTesting(false);
        return;
      }
    } catch (directErr) {
      // Fall through to proxy if in Next server dev mode
    }

    // 2. Server proxy fallback
    try {
      const res = await fetch('/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseUrl: normalizedUrl, apiKey }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.reachable) {
          setTestResult({
            tested: true,
            success: true,
            latencyMs: data.latencyMs,
            models: data.models,
            detectedEngine: normalizedUrl.includes(':8080') || normalizedUrl.includes(':1234') ? 'llamacpp' : 'generic',
          });
          if (data.models && data.models.length > 0 && (!servedModelName || !data.models.includes(servedModelName))) {
            applySelectedModel(data.models[0]);
          }
          setTesting(false);
          return;
        }
      }
    } catch {}

    setTestResult({
      tested: true,
      success: false,
      latencyMs: Date.now() - startTime,
      error: `Could not connect to ${modelsUrl}. Ensure your LLM server is running.`,
    });
    setTesting(false);
  };

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-5 rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] backdrop-blur-xl">
      {/* Endpoint URL & Key Row */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
        {/* Base URL */}
        <div className="md:col-span-6 flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-apple-blue" />
              OpenAI Base URL (with /v1)
              <code className="text-[10px] font-mono text-apple-blue dark:text-apple-cyan bg-apple-blue/10 px-1.5 py-0.2 rounded">
                --base-url
              </code>
            </span>
            {isLlamaCppEngine && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                🦙 llama.cpp GGUF Mode
              </span>
            )}
          </label>
          <div className="relative">
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => onBaseUrlChange(e.target.value)}
              placeholder="http://localhost:8080/v1"
              className="w-full h-10 px-3.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#2c2c2e] text-xs font-mono text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-apple-blue shadow-apple-sm transition"
            />
          </div>
        </div>

        {/* API Key */}
        <div className="md:col-span-4 flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-zinc-500" />
              API Key
              <code className="text-[10px] font-mono text-zinc-500 bg-black/5 dark:bg-white/10 px-1.5 py-0.2 rounded">
                --api-key
              </code>
            </span>
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="text-[10px] text-apple-blue hover:underline"
            >
              {showKey ? 'Hide' : 'Show'}
            </button>
          </label>
          <input
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => onApiKeyChange(e.target.value)}
            placeholder="EMPTY or sk-..."
            className="w-full h-10 px-3.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#2c2c2e] text-xs font-mono text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-apple-blue shadow-apple-sm transition"
          />
        </div>

        {/* Test Connection Button */}
        <div className="md:col-span-2">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing}
            className="w-full h-10 px-4 rounded-xl bg-apple-blue hover:bg-apple-blue-hover text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-apple-sm active:scale-95 disabled:opacity-50 transition"
          >
            <RefreshCw className={clsx('w-3.5 h-3.5', testing && 'animate-spin')} />
            <span>{testing ? 'Testing...' : 'Test & Detect'}</span>
          </button>
        </div>
      </div>

      {/* Preset Quick Endpoints */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-black/5 dark:border-white/5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] uppercase font-bold text-zinc-400">Quick Engines:</span>
          {COMMON_ENDPOINTS.map((ep) => (
            <button
              key={ep.name}
              type="button"
              onClick={() => onBaseUrlChange(ep.url)}
              className={clsx(
                'px-2 py-0.5 rounded-md text-[11px] font-mono transition-all flex items-center gap-1',
                baseUrl === ep.url
                  ? 'bg-apple-blue/15 text-apple-blue dark:bg-apple-blue/30 dark:text-apple-cyan font-bold'
                  : 'bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-zinc-600 dark:text-zinc-400'
              )}
            >
              <span>{ep.name}</span>
            </button>
          ))}
        </div>

        {/* Model Selector dropdown when discovered */}
        {testResult.success && testResult.models && testResult.models.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">Discovered:</span>
            <div className="relative inline-block">
              <select
                value={servedModelName || selectedModel}
                onChange={(e) => applySelectedModel(e.target.value)}
                className="h-7 pl-2.5 pr-7 rounded-lg bg-black/5 dark:bg-white/10 text-xs font-mono font-semibold text-zinc-900 dark:text-zinc-100 border border-black/5 dark:border-white/10 appearance-none focus:outline-none focus:ring-1 focus:ring-apple-blue max-w-[280px] truncate"
              >
                {testResult.models.map((m) => (
                  <option key={m} value={m}>
                    {m.length > 40 ? `...${m.slice(-38)}` : m}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-zinc-400 absolute right-2 top-2 pointer-events-none" />
            </div>
          </div>
        )}
      </div>

      {/* Connection Status Banner */}
      {testResult.tested && (
        <div
          className={clsx(
            'p-3 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs transition-all animate-fade-in',
            testResult.success
              ? 'bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
              : 'bg-rose-500/10 dark:bg-rose-500/15 border-rose-500/20 text-rose-700 dark:text-rose-300'
          )}
        >
          <div className="flex items-center gap-2">
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            )}
            <span className="font-medium">
              {testResult.success
                ? `Connected to ${baseUrl} (${testResult.models?.length || 0} models detected)`
                : testResult.error}
            </span>
          </div>

          {testResult.success && (
            <div className="flex items-center gap-3 text-[11px] font-mono opacity-90">
              {isLlamaCppEngine ? (
                <>
                  <span>HF Tokenizer: <strong>{selectedModel}</strong></span>
                  <span className="text-amber-600 dark:text-amber-400">GGUF Path Mapped</span>
                </>
              ) : (
                <span>Model: <strong>{selectedModel}</strong></span>
              )}
              {testResult.latencyMs !== undefined && <span>Ping: {testResult.latencyMs} ms</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
