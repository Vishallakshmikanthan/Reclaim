"use client";

import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

const recoveryData = [
  { time: "00:00", recovered: 12000, atRisk: 15000 },
  { time: "04:00", recovered: 18000, atRisk: 22000 },
  { time: "08:00", recovered: 45000, atRisk: 58000 },
  { time: "12:00", recovered: 89000, atRisk: 105000 },
  { time: "16:00", recovered: 135000, atRisk: 160000 },
  { time: "20:00", recovered: 178000, atRisk: 210000 },
  { time: "24:00", recovered: 245000, atRisk: 280000 },
];

const failureData = [
  { name: "UPI Timeout", count: 250, share: "31%" },
  { name: "Card Decline", count: 200, share: "25%" },
  { name: "No Funds", count: 150, share: "19%" },
  { name: "Abandonment", count: 150, share: "19%" },
  { name: "Bank Down", count: 120, share: "15%" },
  { name: "Sub Fail", count: 80, share: "10%" },
  { name: "Overdue", count: 50, share: "6%" },
];

export function RecoveryTrendChart() {
  return (
    <div className="h-[280px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={recoveryData} margin={{ top: 12, right: 12, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRecovered" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--status-recovered)" stopOpacity={0.25} />
              <stop offset="95%" stopColor="var(--status-recovered)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--status-at-risk)" stopOpacity={0.15} />
              <stop offset="95%" stopColor="var(--status-at-risk)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="var(--border-subtle)" opacity={0.6} />
          <XAxis 
            dataKey="time" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'var(--text-muted)', fontSize: 11, fontWeight: 500 }} 
            dy={8}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'var(--text-muted)', fontSize: 11, fontWeight: 500 }} 
            tickFormatter={(value) => `₹${value / 1000}k`}
            dx={-4}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'var(--bg-surface-elevated)', 
              borderColor: 'var(--border-subtle)', 
              borderRadius: '8px', 
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
              fontSize: '12px',
              color: 'var(--text-primary)' 
            }}
            itemStyle={{ color: 'var(--text-primary)', padding: '2px 0' }}
            formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, undefined]}
          />
          <Area 
            type="monotone" 
            dataKey="atRisk" 
            stroke="var(--status-at-risk)" 
            strokeWidth={2} 
            fillOpacity={1} 
            fill="url(#colorRisk)" 
            name="At Risk" 
          />
          <Area 
            type="monotone" 
            dataKey="recovered" 
            stroke="var(--status-recovered)" 
            strokeWidth={2.5} 
            fillOpacity={1} 
            fill="url(#colorRecovered)" 
            name="Recovered" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function FailureTypeChart() {
  return (
    <div className="h-[280px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={failureData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }} layout="vertical">
          <CartesianGrid strokeDasharray="2 2" horizontal={true} vertical={false} stroke="var(--border-subtle)" opacity={0.6} />
          <XAxis 
            type="number" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }} 
          />
          <YAxis 
            dataKey="name" 
            type="category" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'var(--text-muted)', fontSize: 11, fontWeight: 500 }} 
            width={95} 
          />
          <Tooltip 
            cursor={{ fill: 'var(--border-subtle)', opacity: 0.15 }}
            contentStyle={{ 
              backgroundColor: 'var(--bg-surface-elevated)', 
              borderColor: 'var(--border-subtle)', 
              borderRadius: '8px', 
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
              fontSize: '12px',
              color: 'var(--text-primary)' 
            }}
          />
          <Bar 
            dataKey="count" 
            fill="var(--brand-primary)" 
            radius={[0, 4, 4, 0]} 
            barSize={16} 
            name="Failed Cases" 
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

