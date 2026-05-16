import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'

export default function OptinChart({ data }: any) {
  const labelStyle: any = {
    position: 'top',
    color: 'var(--text)',
    fill: 'var(--text)',
  }

  return (
    <BarChart
      width={400}
      height={350}
      data={data}
      margin={{
        top: 40,
        right: 30,
        left: 20,
        bottom: 35,
      }}
    >
      <XAxis dataKey="name" height={50} tickMargin={20} />
      <YAxis />
      <Tooltip
        cursor={false}
        contentStyle={{
          background: 'var(--section-bg)',
          border: 'solid 2px var(--section-bg)',
          borderRadius: '10px',
        }}
      />
      <Legend />
      <Bar dataKey="Opted In" fill="var(--success)" label={labelStyle} />
      <Bar dataKey="Not Opted In" fill="var(--danger)" label={labelStyle} />
    </BarChart>
  )
}