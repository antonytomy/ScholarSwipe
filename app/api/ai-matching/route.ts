import { NextRequest, NextResponse } from 'next/server'

export async function POST(_request: NextRequest) {
  return NextResponse.json({
    matches: [],
    disabled: true,
    matchingMode: 'hard-filter-only',
    message: 'AI matching is disabled during beta.',
  })
}
