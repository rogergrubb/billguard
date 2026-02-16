import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60

const ANALYSIS_PROMPT = `You are a medical billing auditor AI. Analyze this medical bill image thoroughly.

INSTRUCTIONS:
1. Read every line item, CPT/HCPCS code, revenue code, description, and charge amount
2. Identify the bill type (ER visit, surgery, hospital stay, lab work, imaging, etc.)
3. Identify the provider name, patient info if visible, and date of service
4. For each line item, determine if the charge appears reasonable or potentially problematic

CHECK FOR THESE SPECIFIC ISSUES:
- **Upcoding**: Service billed at higher complexity than warranted (e.g., Level 5 ER visit for minor issue)
- **Duplicate charges**: Same service billed more than once
- **Unbundling**: Services that should be bundled into one charge billed separately to inflate costs
- **Balance billing violations**: Out-of-network charges that violate the No Surprises Act
- **Markup abuse**: Supply/medication charges dramatically above Medicare or Average Wholesale Price
- **Phantom charges**: Services that appear on the bill but weren't likely provided
- **Wrong patient/date errors**: Obvious data mismatches
- **Modifier abuse**: Inappropriate use of billing modifiers

For each identified issue, cite the relevant regulation:
- No Surprises Act (various sections)
- CMS Correct Coding Initiative (NCCI)
- Hospital Price Transparency Rule (45 CFR 180)
- False Claims Act (31 USC §3729)
- State balance billing protections
- Medicare fee schedules as reference

RESPOND IN THIS EXACT JSON FORMAT (no markdown, no backticks, just raw JSON):
{
  "provider": "Name of hospital/provider if visible",
  "dateOfService": "Date if visible or 'Not visible'",
  "billType": "Type of medical service",
  "lineItems": [
    {
      "code": "CPT/HCPCS/REV code",
      "description": "Service description",
      "billedAmount": 0.00,
      "status": "ok | overcharge | duplicate | unbundled | suspicious",
      "issue": "Description of the issue if not ok, null if ok",
      "fairPrice": 0.00,
      "savings": 0.00,
      "severity": "high | medium | low",
      "regulation": "Relevant regulation citation"
    }
  ],
  "totalBilled": 0.00,
  "totalFairPrice": 0.00,
  "totalSavings": 0.00,
  "summary": "2-3 sentence plain-English summary of findings",
  "overchargeCount": 0,
  "confidence": "high | medium | low"
}

If you cannot read the bill clearly, still provide your best analysis with confidence: "low".
If the image is not a medical bill, return: {"error": "This does not appear to be a medical bill. Please upload a photo of your medical bill or Explanation of Benefits (EOB)."}

Be aggressive about finding issues — err on the side of flagging potential problems for the consumer to investigate.`

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { image, mimeType } = body

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Analysis service not configured' }, { status: 500 })
    }

    // Call Gemini Vision API
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    mimeType: mimeType || 'image/jpeg',
                    data: image,
                  },
                },
                {
                  text: ANALYSIS_PROMPT,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            topP: 0.8,
            maxOutputTokens: 4096,
          },
        }),
      }
    )

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text()
      console.error('Gemini API error:', errText)
      return NextResponse.json(
        { error: 'Analysis service temporarily unavailable. Please try again.' },
        { status: 502 }
      )
    }

    const geminiData = await geminiResponse.json()

    // Extract text from Gemini response
    const rawText =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || ''

    // Parse JSON from response (strip any markdown fences if present)
    const cleaned = rawText
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim()

    let analysis
    try {
      analysis = JSON.parse(cleaned)
    } catch {
      console.error('Failed to parse Gemini response:', rawText.slice(0, 500))
      return NextResponse.json(
        {
          error:
            'Could not parse the bill clearly. Please try with a clearer photo.',
        },
        { status: 422 }
      )
    }

    // Check for Gemini-side error
    if (analysis.error) {
      return NextResponse.json({ error: analysis.error }, { status: 422 })
    }

    // Ensure all expected fields exist
    const result = {
      provider: analysis.provider || 'Unknown Provider',
      dateOfService: analysis.dateOfService || 'Not visible',
      billType: analysis.billType || 'Medical Bill',
      lineItems: (analysis.lineItems || []).map((item: Record<string, unknown>) => ({
        code: item.code || 'N/A',
        description: item.description || '',
        billedAmount: Number(item.billedAmount) || 0,
        status: item.status || 'ok',
        issue: item.issue || null,
        fairPrice: Number(item.fairPrice) || 0,
        savings: Number(item.savings) || 0,
        severity: item.severity || 'low',
        regulation: item.regulation || '',
      })),
      totalBilled: Number(analysis.totalBilled) || 0,
      totalFairPrice: Number(analysis.totalFairPrice) || 0,
      totalSavings: Number(analysis.totalSavings) || 0,
      summary: analysis.summary || '',
      overchargeCount: Number(analysis.overchargeCount) || 0,
      confidence: analysis.confidence || 'medium',
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error('Analysis error:', err)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
