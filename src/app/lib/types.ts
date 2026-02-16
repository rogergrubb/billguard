export type DocumentCategory =
  | 'medical_bill'
  | 'legal_contract'
  | 'legal_notice'
  | 'insurance_eob'
  | 'tax_document'
  | 'financial_statement'
  | 'invoice'
  | 'receipt'
  | 'government_form'
  | 'real_estate'
  | 'employment'
  | 'correspondence'
  | 'other'

export interface ExtractedEntity {
  label: string
  value: string
  confidence: 'high' | 'medium' | 'low'
}

export interface MetaTag {
  key: string
  value: string
  category: string
}

export interface ActionItem {
  action: string
  deadline: string | null
  priority: 'high' | 'medium' | 'low'
  status: 'pending' | 'done'
}

export interface RiskFlag {
  issue: string
  severity: 'critical' | 'warning' | 'info'
  explanation: string
  regulation?: string
}

export interface DocumentAnalysis {
  id: string
  fileName: string
  fileType: string
  fileSize: number
  uploadedAt: string
  analyzedAt: string

  // Classification
  category: DocumentCategory
  subcategory: string
  title: string
  summary: string
  detailedAnalysis: string

  // Extracted data
  entities: ExtractedEntity[]
  metaTags: MetaTag[]
  dates: { label: string; date: string }[]
  amounts: { label: string; amount: number; currency: string }[]
  parties: { role: string; name: string; details: string }[]

  // Intelligence
  keyFindings: string[]
  riskFlags: RiskFlag[]
  actionItems: ActionItem[]
  legalReferences: string[]

  // For medical bills specifically
  medicalBillData?: {
    lineItems: Array<{
      code: string
      description: string
      billedAmount: number
      status: string
      issue: string | null
      fairPrice: number
      savings: number
      severity: string
      regulation: string
    }>
    totalBilled: number
    totalFairPrice: number
    totalSavings: number
  }

  confidence: 'high' | 'medium' | 'low'
  thumbnailData?: string
}

export interface DocumentLibrary {
  documents: DocumentAnalysis[]
  lastUpdated: string
}
