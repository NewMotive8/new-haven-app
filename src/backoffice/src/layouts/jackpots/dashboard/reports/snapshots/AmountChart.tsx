import React from 'react'
import {
 BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

export default function AmountChart({ data }: any) {
    const vA = (data?.map((d: any) => d?.Contributed || 0))
    const vB = (data?.map((d: any) => d?.Paid || 0))
    const vC = (data?.map((d: any) => d?.Current || 0))
    const max = Math.ceil(Math.max(...vA, ...vB, ...vC) * 1.4) || 0
    const pureMin = Math.min(...vA, ...vB, ...vC) || 0
    const min = pureMin < 0 ? Math.ceil(pureMin * 1.4) : Math.ceil(pureMin - (pureMin * 1.2))
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
                top: 5,
                right: 30,
                left: 20,
                bottom: 35,
            }}
        >

            <XAxis dataKey="name" height={50} tickMargin={20} />
            <YAxis scale="sqrt" domain={[min, max]} />
            <Tooltip
                cursor={false}
                contentStyle={{
                    background: 'var(--section-bg)',
                    border: 'solid 2px var(--section-bg)',
                    borderRadius: '10px',
                }}
            />
            <Legend />
            <Bar
                dataKey="Contributed"
                fill="var(--success)"
                label={labelStyle}
            />
            <Bar
                dataKey="Paid"
                stackId="Paid"
                fill="var(--info)"
                label={labelStyle}
            />
            <Bar
                dataKey="Current"
                fill="var(--warning)"
                label={labelStyle}
            />
            <Bar dataKey="gap" stackId="Paid" fill="transparent" />
        </BarChart>
    )
}
