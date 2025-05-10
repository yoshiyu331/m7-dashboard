// src/app/api/income/route.ts
import { NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

const uri = process.env.MONGODB_URI!
console.log("🔍 MongoDB URI:", uri) // ← これを追加
const client = new MongoClient(uri)

export async function GET() {
  try {
    await client.connect()
    const db = client.db('m7_database')
    const collection = db.collection('income_statements')
    const data = await collection.find({}).limit(50).toArray()
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: 'DB接続エラー' }, { status: 500 })
  } finally {
    await client.close()
  }
}
