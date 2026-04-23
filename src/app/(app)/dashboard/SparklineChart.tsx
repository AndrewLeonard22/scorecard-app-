'use client'

import { LineChart, Line, ResponsiveContainer, Tooltip, ReferenceLine } from 'recharts'

interface SparklineChartProps {
  data: { week: string; value: number | null }[]
  target?: number | null
  color?: string
}

export function SparklineChart({ data, target, color = '#10b981' }: SparklineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={48}>
      <LineChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
        {target ? (
          <ReferenceLine y={target} stroke="hsl(215,20%,40%)" strokeDasharray="3 3" strokeWidth={1} />
        ) : null}
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={{ r: 2, fill: color, strokeWidth: 0 }}
          activeDot={{ r: 3 }}
          connectNulls={false}
        />
        <Tooltip
          contentStyle={{
            background: 'hsl(217,33%,17%)',
            border: '1px solid hsl(217,33%,25%)',
            borderRadius: '6px',
            fontSize: '11px',
            padding: '4px 8px',
          }}
          labelStyle={{ color: 'hsl(215,20%,65%)', fontSize: '10px' }}
          itemStyle={{ color: color }}
          formatter={(v) => [v ?? '—', ''] as [string | number, string]}
          labelFormatter={(label) => String(label ?? '')}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
