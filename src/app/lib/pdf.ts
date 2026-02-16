import { jsPDF } from 'jspdf'
import { DocumentAnalysis } from './types'

function formatMoney(n: number): string {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function exportDocumentPDF(doc: DocumentAnalysis) {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const margin = 20
  const contentWidth = pageWidth - margin * 2
  let y = margin

  function addText(text: string, size: number, style: string = 'normal', color: [number, number, number] = [30, 30, 30]) {
    pdf.setFontSize(size)
    pdf.setFont('helvetica', style)
    pdf.setTextColor(color[0], color[1], color[2])
    const lines = pdf.splitTextToSize(text, contentWidth)
    for (const line of lines) {
      if (y > 270) {
        pdf.addPage()
        y = margin
      }
      pdf.text(line, margin, y)
      y += size * 0.45
    }
  }

  function addSpacer(h: number = 4) {
    y += h
  }

  function addLine() {
    if (y > 270) { pdf.addPage(); y = margin }
    pdf.setDrawColor(200, 200, 200)
    pdf.line(margin, y, pageWidth - margin, y)
    y += 4
  }

  // Header
  pdf.setFillColor(15, 23, 42)
  pdf.rect(0, 0, pageWidth, 35, 'F')
  pdf.setTextColor(245, 158, 11)
  pdf.setFontSize(18)
  pdf.setFont('helvetica', 'bold')
  pdf.text('BillGuard', margin, 14)
  pdf.setTextColor(200, 200, 200)
  pdf.setFontSize(9)
  pdf.text('Document Intelligence Report', margin, 20)
  pdf.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, margin, 26)
  y = 45

  // Title
  addText(doc.title, 16, 'bold')
  addSpacer(2)
  addText(`${doc.subcategory} · ${doc.category.replace(/_/g, ' ').toUpperCase()} · Confidence: ${doc.confidence}`, 9, 'normal', [120, 120, 120])
  addSpacer(6)

  // Summary
  addText('SUMMARY', 10, 'bold', [245, 158, 11])
  addSpacer(2)
  addText(doc.summary, 10)
  addSpacer(4)
  addLine()

  // Key Findings
  if (doc.keyFindings.length > 0) {
    addText('KEY FINDINGS', 10, 'bold', [245, 158, 11])
    addSpacer(2)
    doc.keyFindings.forEach((f, i) => {
      addText(`${i + 1}. ${f}`, 9)
      addSpacer(1)
    })
    addSpacer(4)
    addLine()
  }

  // Risk Flags
  if (doc.riskFlags.length > 0) {
    addText('RISK FLAGS', 10, 'bold', [239, 68, 68])
    addSpacer(2)
    doc.riskFlags.forEach((r) => {
      const severityColor: [number, number, number] =
        r.severity === 'critical' ? [239, 68, 68] : r.severity === 'warning' ? [245, 158, 11] : [59, 130, 246]
      addText(`[${r.severity.toUpperCase()}] ${r.issue}`, 9, 'bold', severityColor)
      addText(r.explanation, 9, 'normal', [80, 80, 80])
      if (r.regulation) {
        addText(`Regulation: ${r.regulation}`, 8, 'italic', [100, 100, 100])
      }
      addSpacer(3)
    })
    addLine()
  }

  // Detailed Analysis
  addText('DETAILED ANALYSIS', 10, 'bold', [245, 158, 11])
  addSpacer(2)
  addText(doc.detailedAnalysis, 9, 'normal', [60, 60, 60])
  addSpacer(4)
  addLine()

  // Amounts
  if (doc.amounts.length > 0) {
    addText('FINANCIAL DETAILS', 10, 'bold', [245, 158, 11])
    addSpacer(2)
    doc.amounts.forEach((a) => {
      addText(`${a.label}: ${formatMoney(a.amount)}`, 9)
    })
    addSpacer(4)
    addLine()
  }

  // Dates
  if (doc.dates.length > 0) {
    addText('KEY DATES', 10, 'bold', [245, 158, 11])
    addSpacer(2)
    doc.dates.forEach((d) => {
      addText(`${d.label}: ${d.date}`, 9)
    })
    addSpacer(4)
    addLine()
  }

  // Parties
  if (doc.parties.length > 0) {
    addText('PARTIES INVOLVED', 10, 'bold', [245, 158, 11])
    addSpacer(2)
    doc.parties.forEach((p) => {
      addText(`${p.role}: ${p.name}`, 9, 'bold')
      if (p.details) addText(p.details, 8, 'normal', [100, 100, 100])
      addSpacer(2)
    })
    addSpacer(2)
    addLine()
  }

  // Action Items
  if (doc.actionItems.length > 0) {
    addText('ACTION ITEMS', 10, 'bold', [245, 158, 11])
    addSpacer(2)
    doc.actionItems.forEach((a, i) => {
      const priorityColor: [number, number, number] =
        a.priority === 'high' ? [239, 68, 68] : a.priority === 'medium' ? [245, 158, 11] : [100, 100, 100]
      addText(`${i + 1}. [${a.priority.toUpperCase()}] ${a.action}`, 9, 'normal', priorityColor)
      if (a.deadline) addText(`   Deadline: ${a.deadline}`, 8, 'italic', [100, 100, 100])
      addSpacer(1)
    })
    addSpacer(4)
    addLine()
  }

  // Legal References
  if (doc.legalReferences.length > 0) {
    addText('LEGAL REFERENCES', 10, 'bold', [245, 158, 11])
    addSpacer(2)
    doc.legalReferences.forEach((r) => {
      addText(`• ${r}`, 8, 'normal', [80, 80, 80])
    })
    addSpacer(4)
    addLine()
  }

  // Medical Bill Data
  if (doc.medicalBillData) {
    const mb = doc.medicalBillData
    addText('MEDICAL BILLING AUDIT', 10, 'bold', [239, 68, 68])
    addSpacer(2)
    addText(`Total Billed: ${formatMoney(mb.totalBilled)}`, 10, 'bold')
    if (mb.totalSavings > 0) {
      addText(`Potential Overcharges: ${formatMoney(mb.totalSavings)}`, 10, 'bold', [239, 68, 68])
      addText(`Fair Price Estimate: ${formatMoney(mb.totalFairPrice)}`, 10, 'bold', [16, 185, 129])
    }
    addSpacer(3)

    mb.lineItems.forEach((item) => {
      const statusColor: [number, number, number] =
        item.status === 'ok' ? [16, 185, 129] : item.severity === 'high' ? [239, 68, 68] : [245, 158, 11]
      addText(`${item.code} — ${item.description}`, 9, 'bold')
      addText(`Billed: ${formatMoney(item.billedAmount)} | Fair: ${formatMoney(item.fairPrice)} | Status: ${item.status.toUpperCase()}`, 8, 'normal', statusColor)
      if (item.issue) addText(`Issue: ${item.issue}`, 8, 'italic', [100, 100, 100])
      addSpacer(3)
    })
  }

  // Metadata tags
  if (doc.metaTags.length > 0) {
    addText('METADATA TAGS', 10, 'bold', [245, 158, 11])
    addSpacer(2)
    doc.metaTags.forEach((t) => {
      addText(`${t.key}: ${t.value} [${t.category}]`, 8, 'normal', [80, 80, 80])
    })
  }

  // Footer
  addSpacer(8)
  addText('This report was generated by BillGuard (billguard-sable.vercel.app). Analysis is AI-powered and does not constitute legal, medical, or financial advice.', 7, 'italic', [150, 150, 150])

  // Save
  const filename = `BillGuard-${doc.title.replace(/[^a-zA-Z0-9]/g, '-').slice(0, 40)}.pdf`
  pdf.save(filename)
}
