'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, ArrowUpRight, ArrowDownRight, BarChart3 } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import type { TimeframeOption } from '@/components/shared/timeline-filter';
import { getTimeframeLabel } from '@/components/shared/timeline-filter';

interface CashflowTimelineChartProps {
  deposits: any[];
  expenses: any[];
  timeframe: TimeframeOption;
}

export function CashflowTimelineChart({ deposits, expenses, timeframe }: CashflowTimelineChartProps) {
  // Aggregate daily inflow & outflow for the chart
  const { chartData, totalInflow, totalOutflow } = useMemo(() => {
    const dayMap = new Map<string, { date: string; displayDate: string; inflow: number; outflow: number }>();

    // Helper to get day key YYYY-MM-DD
    const getDayKey = (dStr: string) => {
      const d = new Date(dStr);
      if (isNaN(d.getTime())) return null;
      return d.toISOString().split('T')[0];
    };

    let inflowSum = 0;
    let outflowSum = 0;

    // Process approved deposits
    deposits.forEach((dep) => {
      if (dep.status !== 'APPROVED') return;
      const key = getDayKey(dep.date || dep.createdAt);
      if (!key) return;
      const amt = Number(dep.amount) || 0;
      inflowSum += amt;

      const existing = dayMap.get(key) || {
        date: key,
        displayDate: new Date(key).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        inflow: 0,
        outflow: 0,
      };
      existing.inflow += amt;
      dayMap.set(key, existing);
    });

    // Process approved expenses
    expenses.forEach((exp) => {
      if (exp.status !== 'APPROVED') return;
      const key = getDayKey(exp.date || exp.createdAt);
      if (!key) return;
      const amt = Number(exp.amount) || 0;
      outflowSum += amt;

      const existing = dayMap.get(key) || {
        date: key,
        displayDate: new Date(key).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        inflow: 0,
        outflow: 0,
      };
      existing.outflow += amt;
      dayMap.set(key, existing);
    });

    // Sort chronologically
    const sorted = Array.from(dayMap.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return {
      chartData: sorted,
      totalInflow: inflowSum,
      totalOutflow: outflowSum,
    };
  }, [deposits, expenses]);

  const netCashflow = totalInflow - totalOutflow;

  return (
    <Card className="border-white/5 bg-[#111]/70 backdrop-blur-md overflow-hidden">
      <CardHeader className="pb-2 pt-4 px-4 sm:px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <BarChart3 className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-sm sm:text-base font-semibold text-white flex items-center gap-2">
              Timeline Cashflow Visualizer
              <span className="text-xs font-normal text-emerald-400/80 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                {getTimeframeLabel(timeframe)}
              </span>
            </CardTitle>
            <p className="text-xs text-gray-400">Approved deposits inflow vs approved expenses outflow</p>
          </div>
        </div>

        {/* Period summary pills */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
            <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400" />
            <span>Inflow: ৳{totalInflow.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-300">
            <ArrowDownRight className="h-3.5 w-3.5 text-amber-400" />
            <span>Outflow: ৳{totalOutflow.toLocaleString()}</span>
          </div>
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border ${
              netCashflow >= 0
                ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-300'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
            }`}
          >
            <span>Net: ৳{netCashflow.toLocaleString()}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6">
        {chartData.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-500">
            No approved cashflow records in this timeline window.
          </div>
        ) : (
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                <XAxis
                  dataKey="displayDate"
                  stroke="#666"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#333' }}
                />
                <YAxis
                  stroke="#666"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#333' }}
                  tickFormatter={(val) => `৳${val}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f0f13',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                  }}
                  formatter={(val: any, name: any) => [
                    `৳${Number(val).toLocaleString()}`,
                    name === 'inflow' ? 'Deposits (Inflow)' : 'Expenses (Outflow)',
                  ]}
                  labelStyle={{ color: '#9ca3af', marginBottom: '4px', fontWeight: 600 }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  wrapperStyle={{ fontSize: '11px', paddingBottom: '8px' }}
                  formatter={(val) => (
                    <span className="text-gray-300 font-medium">
                      {val === 'inflow' ? 'Deposits' : 'Expenses'}
                    </span>
                  )}
                />
                <Bar
                  dataKey="inflow"
                  name="inflow"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={36}
                />
                <Bar
                  dataKey="outflow"
                  name="outflow"
                  fill="#f59e0b"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={36}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
