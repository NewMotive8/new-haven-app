import React from 'react'
import {
 BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

export default function EventChart({ data }: any) {
    const DataFormatter = (number: number) => {
        if (number > 1000000000) {
            return `${(number / 1000000000).toString()}B`
        } if (number > 1000000) {
            return `${(number / 1000000).toString()}M`
        } if (number > 1000) {
            return `${(number / 1000).toString()}K`
        }
            return number.toString()
    }

    const vA = (data?.map((d: any) => d['Number of Spins'] || 0))
    const vB = (data?.map((d: any) => d['Number of Wins'] || 0))
    const max = Math.ceil(Math.max(...vA, ...vB) * 1.2) || 0
    const pureMin = Math.min(...vA, ...vB) || 0
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
            <YAxis scale="sqrt" domain={[min, max]} tickFormatter={DataFormatter} />
            <Tooltip
                cursor={false}
                contentStyle={{
                    background: 'var(--section-bg)',
                    border: 'solid 2px var(--section-bg)',
                    borderRadius: '10px',
                }}
            />
            <Legend />
            <Bar dataKey="Number of Spins" fill="var(--success)" label={labelStyle} />
            <Bar dataKey="Number of Wins" fill="var(--info)" label={labelStyle} />
        </BarChart>
    )
}
