import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Forward all query parameters to backend
    const backendUrl = new URL(`${process.env.NEXT_PUBLIC_API_URL}/analytics/same-location-violations/`)
    searchParams.forEach((value, key) => {
      backendUrl.searchParams.append(key, value)
    })

    const response = await fetch(backendUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    })

    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error('Error fetching same location violations:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch same location violations',
        violations: [],
        pagination: {
          page: 1,
          page_size: 20,
          total_count: 0,
          total_pages: 0
        },
        summary: {
          total_violations: 0,
          total_checks: 0,
          unique_expeditors: 0
        }
      },
      { status: 500 }
    )
  }
}
