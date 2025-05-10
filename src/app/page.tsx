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
    // 10億ドル単位 × 0.15 = 兆円
    const jpyValue = value * 0.15
    return `¥${jpyValue.toFixed(1)}兆`
  }
}

export default function Page() {
  const [data, setData] = useState<Record[]>([])
  const [currency, setCurrency] = useState<Currency>('USD')
  const [selectedTickers, setSelectedTickers] = useState<string[]>([])

  useEffect(() => {
    fetch('/api/income')
      .then(res => res.json())
      .then((d) => {
        setData(d)
        if (d.length > 0) {
          // 初期状態は左から3社のみ選択
          const allTickers = Array.from(new Set(d.map((item: Record) => item.ticker))) as string[];
          setSelectedTickers(allTickers.slice(0, 3))
        }
      })
  }, [])

  const chartData = transformData(data)
  const years = [2020, 2021, 2022, 2023, 2024]
  const lastYear = years[years.length - 1]

  // 企業名リスト
  const tickers = Array.from(new Set(data.map(d => d.ticker)))

  // 選択した企業のみ表示
  const filteredChartData = selectedTickers.length > 0
    ? chartData.filter((row: any) => selectedTickers.includes(row.ticker))
    : chartData

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

  // ボタンのトグル処理
  const handleTickerToggle = (ticker: string) => {
    setSelectedTickers(prev =>
      prev.includes(ticker)
        ? prev.filter(t => t !== ticker)
        : [...prev, ticker]
    )
  }

  // ラベル描画関数
  const renderCustomLabel = (props: any) => {
    const { x, y, width, value, index, dataKey } = props
    const row = filteredChartData[index]
    const ticker = row.ticker
    const year = dataKey
    const firstYear = firstNonZeroYearMap.get(ticker)
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
        <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center mb-4 gap-2">
          <h1 className="text-xl sm:text-3xl font-extrabold text-gray-900 flex items-center gap-2">
            📊 M7企業 売上推移グラフ
          </h1>
          <button
            onClick={() => setCurrency(currency === 'USD' ? 'JPY' : 'USD')}
            className="px-3 py-1 sm:px-4 sm:py-2 bg-white border border-blue-600 rounded-lg shadow-sm hover:bg-blue-50 transition-colors text-xs sm:text-sm font-semibold text-blue-600 text-center"
          >
            {currency === 'USD'
              ? (<>
                  <span>円表示に切り替え</span>
                  <span className="hidden sm:inline"><br /></span>
                  <span>（150円/ドル換算）</span>
                </>)
              : 'ドル表示に切り替え'}
          </button>
        </div>
        {/* 企業名ボタン：常に折り返し（wrap）で複数行に */}
        <div className="mb-6 pb-2">
          <div className="flex flex-wrap gap-2 justify-center">
            {tickers.map(ticker => (
              <button
                key={ticker}
                onClick={() => handleTickerToggle(ticker)}
                className={`px-4 py-2 rounded-lg border text-sm font-semibold transition-colors whitespace-nowrap ${selectedTickers.includes(ticker) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-600 border-blue-600 hover:bg-blue-50'}`}
                style={{ minWidth: 80 }}
              >
                {ticker}
              </button>
            ))}
          </div>
        </div>
        <p className="text-gray-700 mb-6 text-sm md:text-base">
          年ごとに主要テック企業の売上を比較できます。
        </p>
        {/* グラフ：常に画面幅にフィット */}
        <div className="bg-white shadow-xl rounded-2xl p-4 md:p-6 border border-gray-200">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={filteredChartData} barCategoryGap={selectedTickers.length > 4 ? 8 : 16}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="ticker" tick={{ fill: '#1e293b', fontSize: 14, fontWeight: 600 }} />
              <YAxis 
                tick={{ fill: '#1e293b', fontSize: 14, fontWeight: 600 }} 
                tickFormatter={(value) => formatNumber(value, currency)}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#f9fafb', borderRadius: '8px', color: '#1e293b', fontWeight: 600 }}
                formatter={(value: number) => formatNumber(value, currency)}
              />
              <Legend wrapperStyle={{ paddingTop: '10px', color: '#1e293b', fontWeight: 600 }} />
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
