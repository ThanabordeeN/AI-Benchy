'use client';

import React, { useState } from 'react';
import { BenchmarkResultRow, ThroughputDataPoint } from '@/types/benchmark';
import { GlassCard } from '@/components/apple/GlassCard';
import { SegmentedControl } from '@/components/apple/SegmentedControl';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Area,
  AreaChart,
} from 'recharts';
import { Layers, Zap, Clock, Users, Activity, BarChart3 } from 'lucide-react';
import { clsx } from 'clsx';

interface MetricsVisualizerProps {
  rows: BenchmarkResultRow[];
  timeseries: ThroughputDataPoint[];
}

type ChartView = 'pp-depth' | 'tg-depth' | 'latency-depth' | 'concurrency' | 'timeseries';

export const MetricsVisualizer: React.FC<MetricsVisualizerProps> = ({
  rows,
  timeseries,
}) => {
  const [activeChart, setActiveChart] = useState<ChartView>('pp-depth');

  // Filter PP rows
  const ppRows = rows
    .filter((r) => r.pp > 0)
    .sort((a, b) => a.depth - b.depth || a.pp - b.pp);

  // Filter TG rows
  const tgRows = rows
    .filter((r) => r.tg > 0)
    .sort((a, b) => a.depth - b.depth || a.tg - b.tg);

  // Latency data
  const latencyData = rows
    .filter((r) => r.ttfrMs !== undefined)
    .map((r) => ({
      name: `d${r.depth}`,
      depth: r.depth,
      test: r.test,
      ttfr: r.ttfrMs ? Number(r.ttfrMs.toFixed(1)) : 0,
      estPpt: r.estPptMs ? Number(r.estPptMs.toFixed(1)) : 0,
      e2eTtft: r.e2eTtftMs ? Number(r.e2eTtftMs.toFixed(1)) : 0,
    }));

  // Concurrency scaling data
  const concurrencyData = rows
    .filter((r) => r.concurrency > 1 || rows.some((x) => x.concurrency > 1))
    .reduce<Record<number, { concurrency: number; ppTps?: number; tgTps?: number }>>((acc, curr) => {
      if (!acc[curr.concurrency]) {
        acc[curr.concurrency] = { concurrency: curr.concurrency };
      }
      if (curr.pp > 0) {
        acc[curr.concurrency].ppTps = Math.round(curr.tps);
      } else if (curr.tg > 0) {
        acc[curr.concurrency].tgTps = Number(curr.tps.toFixed(1));
      }
      return acc;
    }, {});

  const concurrencyChartData = Object.values(concurrencyData).sort((a, b) => a.concurrency - b.concurrency);

  const ppChartData = ppRows.map((r) => ({
    name: r.depth > 0 ? `d${r.depth}` : 'd0',
    depth: r.depth,
    pp: r.pp,
    tps: Math.round(r.tps),
    tpsStd: r.tpsStd ? Number(r.tpsStd.toFixed(1)) : 0,
  }));

  const tgChartData = tgRows.map((r) => ({
    name: r.depth > 0 ? `d${r.depth}` : 'd0',
    depth: r.depth,
    tg: r.tg,
    tps: Number(r.tps.toFixed(2)),
    peakTps: r.peakTps ? Number(r.peakTps.toFixed(2)) : undefined,
  }));

  const hasData = rows.length > 0;

  return (
    <GlassCard
      title="Performance Analytics & Scaling Charts"
      subtitle="Visual breakdown of prefill throughput, generation speed and latency scaling"
      icon={<BarChart3 className="w-4 h-4 text-apple-blue" />}
      headerAction={
        <SegmentedControl<ChartView>
          value={activeChart}
          onChange={setActiveChart}
          size="sm"
          options={[
            { id: 'pp-depth', label: 'PP Speed vs Depth', icon: <Layers className="w-3 h-3" /> },
            { id: 'tg-depth', label: 'TG Speed vs Depth', icon: <Zap className="w-3 h-3" /> },
            { id: 'latency-depth', label: 'Latency Breakdown', icon: <Clock className="w-3 h-3" /> },
            { id: 'concurrency', label: 'Concurrency Scaling', icon: <Users className="w-3 h-3" /> },
            { id: 'timeseries', label: 'Throughput Stream', icon: <Activity className="w-3 h-3" /> },
          ]}
        />
      }
    >
      {!hasData ? (
        <div className="h-72 flex flex-col items-center justify-center text-center p-6 text-zinc-400">
          <BarChart3 className="w-12 h-12 stroke-[1.2] mb-3 text-zinc-300 dark:text-zinc-600" />
          <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
            No Benchmark Data Available Yet
          </p>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm">
            Execute a benchmark run or test with a simulated run above to generate interactive scaling curves.
          </p>
        </div>
      ) : (
        <div className="h-72 sm:h-80 w-full pt-4">
          {/* Chart 1: Prompt Processing Speed vs Depth */}
          {activeChart === 'pp-depth' && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ppChartData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                <defs>
                  <linearGradient id="ppGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0071e3" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0071e3" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(150, 150, 150, 0.15)" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#888' }}
                  label={{ value: 'Context Depth (Tokens)', position: 'insideBottom', offset: -10, fontSize: 11, fill: '#888' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#888' }}
                  label={{ value: 'Prompt Processing Speed (t/s)', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#888' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(25, 25, 28, 0.85)',
                    backdropFilter: 'blur(12px)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  formatter={(val: any) => [`${val} tokens/sec`, 'PP Throughput']}
                />
                <Area
                  type="monotone"
                  dataKey="tps"
                  stroke="#0071e3"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#ppGradient)"
                  dot={{ r: 4, fill: '#0071e3', stroke: '#fff', strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}

          {/* Chart 2: Token Generation Speed vs Depth */}
          {activeChart === 'tg-depth' && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={tgChartData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                <defs>
                  <linearGradient id="tgGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34c759" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#34c759" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(150, 150, 150, 0.15)" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#888' }}
                  label={{ value: 'Context Depth (Tokens)', position: 'insideBottom', offset: -10, fontSize: 11, fill: '#888' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#888' }}
                  label={{ value: 'Token Generation Speed (t/s)', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#888' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(25, 25, 28, 0.85)',
                    backdropFilter: 'blur(12px)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  formatter={(val: any, name: any) => [
                    `${val} tokens/sec`,
                    name === 'peakTps' ? 'Peak Speed' : 'Generation Speed',
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area
                  name="TG Speed (t/s)"
                  type="monotone"
                  dataKey="tps"
                  stroke="#34c759"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#tgGradient)"
                  dot={{ r: 4, fill: '#34c759', stroke: '#fff', strokeWidth: 2 }}
                />
                {tgChartData.some((d) => d.peakTps) && (
                  <Line
                    name="Peak Speed (t/s)"
                    type="monotone"
                    dataKey="peakTps"
                    stroke="#ff9500"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={{ r: 3, fill: '#ff9500' }}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          )}

          {/* Chart 3: Latency Breakdown */}
          {activeChart === 'latency-depth' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={latencyData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(150, 150, 150, 0.15)" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#888' }}
                  label={{ value: 'Context Depth', position: 'insideBottom', offset: -10, fontSize: 11, fill: '#888' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#888' }}
                  label={{ value: 'Latency (ms)', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#888' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(25, 25, 28, 0.85)',
                    backdropFilter: 'blur(12px)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  formatter={(val: any) => [`${val} ms`]}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar name="TTFR (First Response)" dataKey="ttfr" fill="#af52de" radius={[4, 4, 0, 0]} />
                <Bar name="Est. PPT (Prompt Time)" dataKey="estPpt" fill="#0071e3" radius={[4, 4, 0, 0]} />
                <Bar name="E2E TTFT (Total Token)" dataKey="e2eTtft" fill="#ff9500" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}

          {/* Chart 4: Concurrency Scaling */}
          {activeChart === 'concurrency' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={concurrencyChartData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(150, 150, 150, 0.15)" />
                <XAxis
                  dataKey="concurrency"
                  tick={{ fontSize: 11, fill: '#888' }}
                  label={{ value: 'Concurrency (Clients)', position: 'insideBottom', offset: -10, fontSize: 11, fill: '#888' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#888' }}
                  label={{ value: 'Throughput (t/s)', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#888' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(25, 25, 28, 0.85)',
                    backdropFilter: 'blur(12px)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar name="Prompt Processing (t/s)" dataKey="ppTps" fill="#0071e3" radius={[4, 4, 0, 0]} />
                <Bar name="Token Generation (t/s)" dataKey="tgTps" fill="#34c759" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}

          {/* Chart 5: Throughput Stream Timeseries */}
          {activeChart === 'timeseries' && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeseries} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(150, 150, 150, 0.15)" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 11, fill: '#888' }}
                  label={{ value: 'Time (Seconds)', position: 'insideBottom', offset: -10, fontSize: 11, fill: '#888' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#888' }}
                  label={{ value: 'Throughput (t/s)', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#888' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(25, 25, 28, 0.85)',
                    backdropFilter: 'blur(12px)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  formatter={(val: any) => [`${Number(val).toFixed(1)} tokens/sec`, 'Throughput']}
                />
                <Line
                  name="Aggregate Throughput"
                  type="monotone"
                  dataKey="totalThroughput"
                  stroke="#5856d6"
                  strokeWidth={2.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      )}
    </GlassCard>
  );
};
