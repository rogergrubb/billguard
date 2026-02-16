import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60

const UNIVERSAL_ANALYSIS_PROMPT = `You are an expert document analyst with deep expertise across legal, medical, financial, insurance, tax, real estate, employment, and government documents. Analyze the uploaded document image with extreme precision and thoroughness.

STEP 1 — CLASSIFY THE DOCUMENT
Determine the document category:
- medical_bill: Hospital bills, physician bills, lab bills, pharmacy bills
- legal_contract: Contracts, agreements, terms of service, NDAs, leases
- legal_notice: Court notices, demand letters, cease & desist, summons, legal filings
- insurance_eob: Explanation of Benefits, insurance claims, coverage letters
- tax_document: W-2, 1099, tax returns, property tax bills, IRS notices
- financial_statement: Bank statements, investment reports, credit reports, loan docs
- invoice: Business invoices, service bills, utility bills
- receipt: Purchase receipts, transaction records
- government_form: Government applications, permits, licenses, registrations
- real_estate: Deeds, title docs, closing statements, property records, HOA docs
- employment: Offer letters, pay stubs, employment contracts, termination letters, benefits enrollment
- correspondence: General letters, notices, memos
- other: Anything that doesn't fit above

STEP 2 — EXTRACT ALL METADATA
Read every visible piece of text. Extract:
- All names, organizations, addresses, phone numbers, emails
- All dates (issue date, due dates, effective dates, expiration dates)
- All monetary amounts with context
- All reference numbers, account numbers, case numbers, policy numbers
- All key terms, conditions, obligations, rights
- Document-specific codes (CPT codes for medical, statute numbers for legal, etc.)

STEP 3 — PROVIDE INTELLIGENT ANALYSIS
Based on document type:

FOR MEDICAL BILLS: Check for upcoding, duplicate charges, unbundling, balance billing violations, markup abuse vs Medicare rates. Cite No Surprises Act, NCCI, Hospital Price Transparency Rule.

FOR LEGAL DOCUMENTS: Identify key obligations, deadlines, penalty clauses, unusual terms, potential risks, rights granted/waived. Flag any one-sided clauses, hidden fees, or concerning language.

FOR INSURANCE EOBs: Compare allowed amounts vs billed, identify denied claims, check for coordination of benefits issues, verify patient responsibility calculations.

FOR TAX DOCUMENTS: Verify calculations, identify deduction opportunities, flag potential audit triggers, check for missing information.

FOR FINANCIAL STATEMENTS: Identify trends, anomalies, fees, interest rates, balance changes, unauthorized transactions.

FOR ALL DOCUMENTS: Flag anything that requires urgent action, has a deadline, represents a financial risk, or contains unusual/concerning language.

RESPOND IN THIS EXACT JSON FORMAT (no markdown, no backticks, just raw JSON):
{
  "category": "one of the category codes above",
  "subcategory": "more specific type (e.g., 'Emergency Room Bill', 'Commercial Lease', 'Form W-2')",
  "title": "A clear, descriptive title for this document",
  "summary": "2-3 sentence plain-English summary of what this document is and what it means for the person",
  "detailedAnalysis": "A thorough 3-5 paragraph analysis covering all important aspects of this document. Write this as expert advice — what would a lawyer, accountant, or medical billing advocate tell this person? Be specific and actionable.",
  "entities": [
    {"label": "Entity type (e.g., 'Provider', 'Patient', 'Landlord')", "value": "The actual value", "confidence": "high|medium|low"}
  ],
  "metaTags": [
    {"key": "tag name", "value": "tag value", "category": "grouping category"}
  ],
  "dates": [
    {"label": "What this date represents", "date": "The date as written"}
  ],
  "amounts": [
    {"label": "What this amount represents", "amount": 0.00, "currency": "USD"}
  ],
  "parties": [
    {"role": "Their role (Provider, Patient, Plaintiff, Landlord, etc.)", "name": "Full name", "details": "Address, contact info, or other identifying details"}
  ],
  "keyFindings": [
    "Finding 1: Clear, specific statement about something important in this document",
    "Finding 2: Another important observation"
  ],
  "riskFlags": [
    {
      "issue": "Brief description of the risk or concern",
      "severity": "critical|warning|info",
      "explanation": "Detailed explanation of why this matters and what to do about it",
      "regulation": "Relevant law, regulation, or standard (if applicable)"
    }
  ],
  "actionItems": [
    {
      "action": "What the person should do",
      "deadline": "Date if applicable, null if no deadline",
      "priority": "high|medium|low"
    }
  ],
  "legalReferences": [
    "Any laws, regulations, statutes, or legal standards relevant to this document"
  ],
  "confidence": "high|medium|low"
}

SPECIAL INSTRUCTIONS FOR MEDICAL BILLS:
If this is a medical bill, ALSO include a "medicalBillData" field with lineItems array containing code, description, billedAmount, status (ok|overcharge|duplicate|unbundled|suspicious), issue, fairPrice, savings, severity, regulation. Plus totalBilled, totalFairPrice, totalSavings.

BE THOROUGH. Extract EVERY piece of information visible in the document. Miss nothing. Flag everything that could affect the person financially, legally, or medically. If the image is unclear, note that with lower confidence but still extract what you can.

If the image is NOT a document (it's a photo of something else entirely), return:
{"error": "This does not appear to be a document. Please upload a photo of a bill, contract, legal document, tax form, or other paperwork."}`

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { image, mimeType } = body

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Analysis service not configured' },
        { status: 500 }
      )
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`
    const geminiResponse = await fetch(
      url,
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
                { text: UNIVERSAL_ANALYSIS_PROMPT },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            topP: 0.8,
            maxOutputTokens: 8192,
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
    const rawText =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || ''

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
        { error: 'Could not analyze this document clearly. Please try with a clearer photo or scan.' },
        { status: 422 }
      )
    }

    if (analysis.error) {
      return NextResponse.json({ error: analysis.error }, { status: 422 })
    }

    // Normalize with safe defaults
    const result = {
      category: analysis.category || 'other',
      subcategory: analysis.subcategory || 'Unknown',
      title: analysis.title || 'Untitled Document',
      summary: analysis.summary || '',
      detailedAnalysis: analysis.detailedAnalysis || '',
      entities: (analysis.entities || []).map((e: Record<string, unknown>) => ({
        label: e.label || '', value: e.value || '', confidence: e.confidence || 'medium',
      })),
      metaTags: (analysis.metaTags || []).map((t: Record<string, unknown>) => ({
        key: t.key || '', value: t.value || '', category: t.category || 'general',
      })),
      dates: (analysis.dates || []).map((d: Record<string, unknown>) => ({
        label: d.label || '', date: d.date || '',
      })),
      amounts: (analysis.amounts || []).map((a: Record<string, unknown>) => ({
        label: a.label || '', amount: Number(a.amount) || 0, currency: a.currency || 'USD',
      })),
      parties: (analysis.parties || []).map((p: Record<string, unknown>) => ({
        role: p.role || '', name: p.name || '', details: p.details || '',
      })),
      keyFindings: analysis.keyFindings || [],
      riskFlags: (analysis.riskFlags || []).map((r: Record<string, unknown>) => ({
        issue: r.issue || '', severity: r.severity || 'info',
        explanation: r.explanation || '', regulation: r.regulation || '',
      })),
      actionItems: (analysis.actionItems || []).map((a: Record<string, unknown>) => ({
        action: a.action || '', deadline: a.deadline || null,
        priority: a.priority || 'medium', status: 'pending',
      })),
      legalReferences: analysis.legalReferences || [],
      medicalBillData: analysis.medicalBillData || undefined,
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
