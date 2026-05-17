'use client'

import {
  RadialBarChart,
  RadialBar,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import type { KPIData } from '@/server/actions/kpi'

interface KpiChartProps {
  kpis: KPIData[]
}

function getBarColor(pct: number): string {
  if (pct >= 100) return '#10b981'
  if (pct >= 60) return '#3b82f6'
  return '#ef4444'
}

export function KpiChart({ kpis }: KpiChartProps) {
  if (kpis.length === 0) return null

  const top6 = [...kpis].sort((a, b) => b.weight - a.weight).slice(0, 6)

  const data = top6.map((k) => {
    const pct = k.target > 0 ? Math.min((k.current / k.target) * 100, 100) : 0
    return {
      name: k.title,
      value: Math.round(pct),
      fill: getBarColor(pct),
    }
  })

  return (
    <div className="surface-card p-4">
      <h3 className="mb-2 text-sm font-semibold text-muted-foreground">ภาพรวม KPI</h3>
      <ResponsiveContainer width="100%" height={220}>
        <RadialBarChart
          innerRadius="30%"
          outerRadius="90%"
          data={data}
          startAngle={90}
          endAngle={-270}
        >
          <RadialBar
            background
            dataKey="value"
            label={{ position: 'insideStart', fill: '#fff', fontSize: 10 }}
          />
          <Legend
            iconSize={10}
            layout="vertical"
            verticalAlign="middle"
            align="right"
            wrapperStyle={{ fontSize: '11px' }}
          />
          <Tooltip
            formatter={(value: number, name: string) => [`${value}%`, name]}
            contentStyle={{ fontSize: '12px', borderRadius: '8px' }}
          />
        </RadialBarChart>
      </ResponsiveContainer>
    </div>
  )
}
