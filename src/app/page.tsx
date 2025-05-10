'use client'

import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, LabelList,
} from 'recharts'

type Record = {
  ticker: string
  index: string
  year: string
  ['Total Revenue']: number
}

type Currency = 'USD' | 'JPY'

type ChartData = {
  ticker: string
  [key: number]: number
}

function transformData(data: Record[]) {
  const grouped: { [ticker: string]: ChartData } = {}
  data.forEach((item) => {
    const year = new Date(item.index).getFullYear()
    const key = item.ticker
    if (!grouped[key]) grouped[key] = { ticker: key }
    grouped[key][year] = item['Total Revenue'] / 1000000000
  })
  return Object.values(grouped)
}

const formatNumber = (value: number, currency: Currency) => {
  if (currency === 'USD') {
    return `$${value.toFixed(2)}B`
  } else {
    const jpyValue = value * 150 // 1ドル = 150円換算
    return `¥${jpyValue.toFixed(0)}億`
  }
}

export default function Page() {
  const [data, setData] = useState<Record[]>([])
  const [currency, setCurrency] = useState<Currency>('USD')

  useEffect(() => {
    fetch('/api/income')
      .then(res => res.json())
      .then(setData)
  }, [])

  const chartData = transformData(data)
  const years = [2020, 2021, 2022, 2023, 2024]
  const lastYear = years[years.length - 1]

  // 各企業の最初の非ゼロ年をMapで持つ
  const firstNonZeroYearMap = new Map<string, number>()
  chartData.forEach((row: any) => {
    for (const year of years) {
      if (row[year] && row[year] > 0) {
        firstNonZeroYearMap.set(row.ticker, year)
        break
      }
    }
  })

  // ラベル描画関数
  const renderCustomLabel = (props: any) => {
    const { x, y, width, value, index, dataKey } = props
    const row = chartData[index]
    const ticker = row.ticker
    const year = dataKey
    const firstYear = firstNonZeroYearMap.get(ticker)
    // 値が0でない、かつ「最初の非ゼロ年」または「最新年」だけラベルを返す
    if (
      typeof value === 'number' &&
      value > 0 &&
      (year === firstYear || year === lastYear)
    ) {
      return (
        <text
          x={x + width / 2}
          y={y - 5}
          fill="#334155"
          textAnchor="middle"
          fontSize={12}
        >
          {formatNumber(value, currency)}
        </text>
      )
    }
    return null
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-white to-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl md:text-4xl font-bold flex items-center gap-2">
            📊 M7企業 売上推移グラフ
          </h1>
          <button
            onClick={() => setCurrency(currency === 'USD' ? 'JPY' : 'USD')}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            {currency === 'USD' ? '円表示に切り替え（150円/ドル換算）' : 'ドル表示に切り替え'}
          </button>
        </div>
        <p className="text-gray-500 mb-6 text-sm md:text-base">
          年ごとに主要テック企業の売上を比較できます。
        </p>
        <div className="bg-white shadow-xl rounded-2xl p-4 md:p-6 border border-gray-200">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData} barCategoryGap={16}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="ticker" tick={{ fill: '#334155', fontSize: 12 }} />
              <YAxis 
                tick={{ fill: '#334155', fontSize: 12 }} 
                tickFormatter={(value) => formatNumber(value, currency)}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#f9fafb', borderRadius: '8px' }}
                formatter={(value: number) => formatNumber(value, currency)}
              />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              {years.map((year, i) => (
                <Bar 
                  key={year} 
                  dataKey={year} 
                  fill={`hsl(${i * 50 + 10}, 75%, 55%)`} 
                  radius={[6, 6, 0, 0]}
                >
                  <LabelList
                    dataKey={year}
                    position="top"
                    content={renderCustomLabel}
                  />
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </main>
  )
}
