'use client'

import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid,
} from 'recharts'

// 💡 shadcn/ui を使わず HTML + Tailwind で置き換えました


type Record = {
  ticker: string
  index: string
  year: string
  ['Total Revenue']: number
}

function transformData(data: Record[]) {
  const grouped: { [ticker: string]: any } = {}
  data.forEach((item) => {
    const year = new Date(item.index).getFullYear()
    const key = item.ticker
    if (!grouped[key]) grouped[key] = { ticker: key }
    grouped[key][year] = item['Total Revenue']
  })
  return Object.values(grouped)
}

export default function Page() {
  const [data, setData] = useState<Record[]>([])

  useEffect(() => {
    fetch('/api/income')
      .then(res => res.json())
      .then(setData)
  }, [])

  const chartData = transformData(data)

  return (
    <main className="p-8 bg-gradient-to-br from-blue-50 to-white min-h-screen font-sans">
      <h1 className="text-4xl font-bold mb-8 text-gray-800 flex items-center gap-3">
        <span role="img" aria-label="chart">📊</span> M7企業 売上推移グラフ
      </h1>

      <div className="bg-white shadow-2xl rounded-3xl p-8 border border-blue-100">
        <ResponsiveContainer width="100%" height={480}>
          <BarChart data={chartData} barCategoryGap={16}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="ticker" tick={{ fill: '#334155', fontSize: 14 }} />
            <YAxis tick={{ fill: '#334155', fontSize: 14 }} />
            <Tooltip contentStyle={{ backgroundColor: '#f9fafb', borderRadius: '8px' }} />
            <Legend wrapperStyle={{ paddingTop: '10px' }} />
            {[2020, 2021, 2022, 2023, 2024].map((year, i) => (
              <Bar key={year} dataKey={year} fill={`hsl(${i * 50 + 10}, 75%, 55%)`} radius={[6, 6, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </main>
  )
}
