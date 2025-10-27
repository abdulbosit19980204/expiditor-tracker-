import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { check_id } = await request.json()
    
    if (!check_id) {
      return NextResponse.json({ error: 'Check ID is required' }, { status: 400 })
    }

    // Fetch from smartpos.uz
    const response = await fetch(`https://smartpos.uz/uz/proverka-cheka?uid=${check_id}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
      }
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch check details' }, { status: response.status })
    }

    const html = await response.text()
    
    // Extract check details using regex patterns
    const details: any = {}
    
    // Extract common receipt fields using regex
    const extractField = (pattern: RegExp, label: string) => {
      const match = html.match(pattern)
      if (match && match[1]) {
        details[label] = match[1].trim()
      }
    }
    
    // Try to extract structured data from HTML
    extractField(/ИНН[:\s]*([\d]+)/i, 'ИНН')
    extractField(/ККМ[:\s]*([A-Z0-9]+)/i, 'Номер ККМ')
    extractField(/Kassir[:\s]*(.+?)(?:\n|<)/i, 'Kassir')
    extractField(/Смена[:\s]*(\d+)/i, 'Смена')
    extractField(/Дата и время[:\s]*(.+?)(?:\n|<)/i, 'Дата и время')
    extractField(/Тип чека[:\s]*(.+?)(?:\n|<)/i, 'Тип чека')
    extractField(/Позиций[:\s]*(\d+)/i, 'Позиций')
    extractField(/Итого[:\s]*([\d\s]+)/i, 'Итого')
    extractField(/Скидка[:\s]*([\d\s]+)/i, 'Скидка')
    extractField(/К оплате[:\s]*([\d\s]+)/i, 'К оплате')
    extractField(/Оплачено[:\s]*([\d\s]+)/i, 'Оплачено')
    extractField(/НДС[:\s]*([\d\s.]+)/i, 'Итого сумма НДС')
    extractField(/Номер чека[:\s]*(\d+)/i, 'Номер чека')
    extractField(/UID[:\s]*([\d]+)/i, 'UID')
    extractField(/ФМ[:\s]*([A-Z0-9]+)/i, 'ФМ')
    
    // Try to find seller information
    const sellerMatch = html.match(/GLORIYA GLOBAL[^<]*/i)
    if (sellerMatch) {
      details['Продавец'] = sellerMatch[0].trim()
    }
    
    // Extract address
    const addressMatch = html.match(/BAXODIR[^<]+/i)
    if (addressMatch) {
      details['Адрес'] = addressMatch[0].trim()
    }
    
    return NextResponse.json({ 
      success: true,
      check_id,
      details,
      raw_html: html.substring(0, 1000) // First 1000 chars for debugging
    })
    
  } catch (error: any) {
    console.error('Error parsing check:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to parse check details',
      details: error.stack
    }, { status: 500 })
  }
}

