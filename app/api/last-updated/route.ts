import { NextResponse } from "next/server"
import { promises as fs } from "fs"

const FILE_PATH = "/home/administrator/Documents/expiditor-tracker-/backend/last_update.txt"

export async function GET() {
  try {
    const content = await fs.readFile(FILE_PATH, "utf8").catch(() => "")
    return NextResponse.json({ timestamp: content.trim() || null })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { timestamp } = await request.json().catch(() => ({ timestamp: null }))
    const ts = typeof timestamp === "string" && timestamp ? timestamp : new Date().toISOString()
    await fs.writeFile(FILE_PATH, ts + "\n", "utf8")
    return NextResponse.json({ ok: true, timestamp: ts })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}


