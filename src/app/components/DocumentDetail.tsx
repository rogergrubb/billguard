'use client'

import { useState } from 'react'
import { DocumentAnalysis } from '../lib/types'
import { exportDocumentPDF } from '../lib/pdf'
import {
  ArrowLeft, Download, AlertTriangle, CheckCircle, FileText, Calendar,
  DollarSign, Users, Tag, Shield, BookOpen, ClipboardList, Copy, Check,
} from 'lucide-react'

interface DetailProps {
  doc: DocumentAnalysis
  onBack: () => void
}

function formatMoney(n: number) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function DocumentDetail({ doc, onBack }: DetailProps) {
  const [copiedSummary, setCopiedSummary] = useState(false)
  const [disputeLetter, setDisputeLetter] = useState<string | null>(null)
  const [loadingLetter, setLoadingLetter] = useState(false)

  const handleExportPDF = () => exportDocumentPDF(doc)

  const handleCopySummary = () => {
    const text = `${doc.title}\n\n${doc.summary}\n\nKey Findings:\n${doc.keyFindings.map((f, i) => `${i + 1}. ${f}`).join('\n')}\n\nDetailed Analysis:\n${doc.detailedAnalysis}`
    navigator.clipboard.writeText(text)
    setCopiedSummary(true)
    setTimeout(() => setCopiedSummary(false), 2000)
  }

  async function generateDisputeLetter() {
    if (!doc.medicalBillData) return
    setLoadingLetter(true)
    try {
      const res = await fetch('/api/dispute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: doc.parties.find((p) => p.role.toLowerCase().includes('provider'))?.name || doc.title,
          dateOfService: doc.dates[0]?.date || 'Unknown',
          billType: doc.subcategory,
          lineItems: doc.medicalBillData.lineItems,
          totalBilled: doc.medicalBillData.totalBilled,
          totalFairPrice: doc.medicalBillData.totalFairPrice,
          totalSavings: doc.medicalBillData.totalSavings,
        }),
      })
      const data = await res.json()
      if (data.letter) setDisputeLetter(data.letter)
    } catch { /* ignore */ }
    setLoadingLetter(false)
  }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px 80px' }}>
      {/* Top bar */}
      <div className="animate-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, padding: 0, fontFamily: 'inherit' }}
        >
          <ArrowLeft size={16} /> Back to Library
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-secondary" onClick={handleCopySummary} style={{ padding: '8px 16px', fontSize: 13 }}>
            {copiedSummary ? <Check size={14} /> : <Copy size={14} />}
            {copiedSummary ? 'Copied!' : 'Copy Summary'}
          </button>
          <button className="btn-primary" onClick={handleExportPDF} style={{ padding: '8px 16px', fontSize: 13 }}>
            <Download size={14} /> Export PDF
          </button>
        </div>
      </div>

      {/* Title */}
      <div className="animate-in stagger-1" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: 26, fontWeight: 900 }}>{doc.title}</h1>
          <span className={`badge ${doc.confidence === 'high' ? 'badge-success' : doc.confidence === 'medium' ? 'badge-warning' : 'badge-danger'}`}>
            {doc.confidence} confidence
          </span>
        </div>
        <p style={{ color: 'var(--text-dim)', fontSize: 13 }}>
          {doc.subcategory} · {doc.category.replace(/_/g, ' ')} · Uploaded {new Date(doc.uploadedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      {/* Summary card */}
      <div className="animate-in stagger-2 glass-card" style={{ padding: 24, marginBottom: 24, borderLeft: '3px solid var(--accent)' }}>
        <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--text-muted)' }}>{doc.summary}</p>
      </div>

      {/* Quick stats grid */}
      <div className="animate-in stagger-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 28 }}>
        <Stat icon={AlertTriangle} label="Risk Flags" value={String(doc.riskFlags.length)} color={doc.riskFlags.some((r) => r.severity === 'critical') ? 'var(--danger)' : 'var(--accent)'} />
        <Stat icon={DollarSign} label="Amounts Found" value={String(doc.amounts.length)} color="var(--info)" />
        <Stat icon={Calendar} label="Dates Found" value={String(doc.dates.length)} color="var(--success)" />
        <Stat icon={Users} label="Parties" value={String(doc.parties.length)} color="#a78bfa" />
        <Stat icon={Tag} label="Meta Tags" value={String(doc.metaTags.length)} color="#f97316" />
        <Stat icon={ClipboardList} label="Action Items" value={String(doc.actionItems.length)} color="var(--accent)" />
      </div>

      {/* Key Findings */}
      {doc.keyFindings.length > 0 && (
        <Section icon={CheckCircle} title="Key Findings" color="var(--success)">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {doc.keyFindings.map((f, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                <span style={{ fontWeight: 600, color: 'var(--success)', flexShrink: 0 }}>{i + 1}.</span>
                {f}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Risk Flags */}
      {doc.riskFlags.length > 0 && (
        <Section icon={AlertTriangle} title="Risk Flags" color="var(--danger)">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {doc.riskFlags.map((r, i) => (
              <div key={i} style={{ padding: 16, borderRadius: 10, background: r.severity === 'critical' ? 'var(--danger-glow)' : r.severity === 'warning' ? 'var(--accent-glow)' : 'rgba(59,130,246,0.06)', borderLeft: `3px solid ${r.severity === 'critical' ? 'var(--danger)' : r.severity === 'warning' ? 'var(--accent)' : 'var(--info)'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span className={`badge ${r.severity === 'critical' ? 'badge-danger' : r.severity === 'warning' ? 'badge-warning' : 'badge-info'}`} style={{ fontSize: 10 }}>
                    {r.severity}
                  </span>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{r.issue}</span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{r.explanation}</p>
                {r.regulation && (
                  <p style={{ fontSize: 11, color: 'var(--info)', marginTop: 6 }}>📋 {r.regulation}</p>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Detailed Analysis */}
      <Section icon={FileText} title="Detailed Analysis" color="var(--accent)">
        <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
          {doc.detailedAnalysis}
        </div>
      </Section>

      {/* Amounts */}
      {doc.amounts.length > 0 && (
        <Section icon={DollarSign} title="Financial Details" color="var(--info)">
          <div className="glass-card" style={{ overflow: 'hidden' }}>
            {doc.amounts.map((a, i) => (
              <div key={i} style={{ padding: '10px 16px', display: 'flex', justifyContent: 'space-between', borderBottom: i < doc.amounts.length - 1 ? '1px solid var(--border)' : 'none', fontSize: 14 }}>
                <span style={{ color: 'var(--text-muted)' }}>{a.label}</span>
                <span style={{ fontWeight: 600 }}>{formatMoney(a.amount)}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Dates */}
      {doc.dates.length > 0 && (
        <Section icon={Calendar} title="Key Dates" color="var(--success)">
          <div className="glass-card" style={{ overflow: 'hidden' }}>
            {doc.dates.map((d, i) => (
              <div key={i} style={{ padding: '10px 16px', display: 'flex', justifyContent: 'space-between', borderBottom: i < doc.dates.length - 1 ? '1px solid var(--border)' : 'none', fontSize: 14 }}>
                <span style={{ color: 'var(--text-muted)' }}>{d.label}</span>
                <span style={{ fontWeight: 500 }}>{d.date}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Parties */}
      {doc.parties.length > 0 && (
        <Section icon={Users} title="Parties Involved" color="#a78bfa">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {doc.parties.map((p, i) => (
              <div key={i} className="glass-card" style={{ padding: 14 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{p.role}</span>
                <div style={{ fontWeight: 600, fontSize: 14, marginTop: 2 }}>{p.name}</div>
                {p.details && <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>{p.details}</div>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Action Items */}
      {doc.actionItems.length > 0 && (
        <Section icon={ClipboardList} title="Action Items" color="var(--accent)">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {doc.actionItems.map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: 12, borderRadius: 8, background: 'rgba(245,158,11,0.04)' }}>
                <span className={`badge ${a.priority === 'high' ? 'badge-danger' : a.priority === 'medium' ? 'badge-warning' : 'badge-info'}`} style={{ fontSize: 10, flexShrink: 0 }}>
                  {a.priority}
                </span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{a.action}</div>
                  {a.deadline && <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>⏰ {a.deadline}</div>}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Legal References */}
      {doc.legalReferences.length > 0 && (
        <Section icon={BookOpen} title="Legal References" color="var(--info)">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {doc.legalReferences.map((r, i) => (
              <div key={i} style={{ fontSize: 13, color: 'var(--text-muted)', padding: '4px 0' }}>• {r}</div>
            ))}
          </div>
        </Section>
      )}

      {/* Meta Tags */}
      {doc.metaTags.length > 0 && (
        <Section icon={Tag} title="Metadata Tags" color="#f97316">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {doc.metaTags.map((t, i) => (
              <span key={i} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.15)', color: '#f97316' }}>
                {t.key}: {t.value}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Medical Bill Data */}
      {doc.medicalBillData && (
        <Section icon={Shield} title="Medical Billing Audit" color="var(--danger)">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
            <div className="glass-card" style={{ padding: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>Total Billed</div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{formatMoney(doc.medicalBillData.totalBilled)}</div>
            </div>
            <div className="glass-card glow-red" style={{ padding: 16, borderColor: 'rgba(239,68,68,0.2)' }}>
              <div style={{ fontSize: 12, color: 'var(--danger)' }}>Overcharges</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--danger)' }}>{formatMoney(doc.medicalBillData.totalSavings)}</div>
            </div>
            <div className="glass-card glow-green" style={{ padding: 16, borderColor: 'rgba(16,185,129,0.2)' }}>
              <div style={{ fontSize: 12, color: 'var(--success)' }}>Fair Price</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--success)' }}>{formatMoney(doc.medicalBillData.totalFairPrice)}</div>
            </div>
          </div>

          {doc.medicalBillData.lineItems.map((item, i) => (
            <div key={i} className="glass-card" style={{ padding: 16, marginBottom: 8, borderLeft: `3px solid ${item.status === 'ok' ? 'var(--success)' : item.severity === 'high' ? 'var(--danger)' : 'var(--accent)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                <div>
                  <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-dim)' }}>{item.code}</span>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{item.description}</div>
                </div>
                <span className={`badge ${item.status === 'ok' ? 'badge-success' : item.severity === 'high' ? 'badge-danger' : 'badge-warning'}`} style={{ fontSize: 10 }}>
                  {item.status}
                </span>
              </div>
              {item.issue && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>{item.issue}</p>}
              <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
                <span>Billed: <strong>{formatMoney(item.billedAmount)}</strong></span>
                <span>Fair: <strong style={{ color: 'var(--success)' }}>{formatMoney(item.fairPrice)}</strong></span>
                {item.savings > 0 && <span>Overcharge: <strong style={{ color: 'var(--danger)' }}>{formatMoney(item.savings)}</strong></span>}
              </div>
            </div>
          ))}

          {/* Dispute letter */}
          {doc.medicalBillData.totalSavings > 0 && !disputeLetter && (
            <button className="btn-primary" onClick={generateDisputeLetter} disabled={loadingLetter} style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}>
              {loadingLetter ? <><div className="spinner" /> Generating...</> : <><Shield size={16} /> Generate Dispute Letter</>}
            </button>
          )}
          {disputeLetter && (
            <div style={{ marginTop: 16 }}>
              <pre style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: 20, whiteSpace: 'pre-wrap', fontSize: 12, lineHeight: 1.7, color: 'var(--text-muted)', maxHeight: 400, overflow: 'auto' }}>
                {disputeLetter}
              </pre>
            </div>
          )}
        </Section>
      )}

      {/* Entities */}
      {doc.entities.length > 0 && (
        <Section icon={FileText} title="Extracted Entities" color="var(--text-dim)">
          <div className="glass-card" style={{ overflow: 'hidden' }}>
            {doc.entities.map((e, i) => (
              <div key={i} style={{ padding: '8px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: i < doc.entities.length - 1 ? '1px solid var(--border)' : 'none', fontSize: 13 }}>
                <span style={{ color: 'var(--text-dim)' }}>{e.label}</span>
                <span style={{ fontWeight: 500 }}>{e.value}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Disclaimer */}
      <p style={{ marginTop: 40, fontSize: 11, color: 'var(--text-dim)', textAlign: 'center', lineHeight: 1.6 }}>
        BillGuard document analysis is AI-powered and does not constitute legal, medical, or financial advice. Always verify findings with a qualified professional.
        <br />© {new Date().getFullYear()} NumberOneSonSoftware. All rights reserved.
      </p>
    </div>
  )
}

function Section({ icon: Icon, title, color, children }: { icon: typeof FileText; title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="animate-in" style={{ marginBottom: 28 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon size={18} color={color} /> {title}
      </h2>
      {children}
    </div>
  )
}

function Stat({ icon: Icon, label, value, color }: { icon: typeof FileText; label: string; value: string; color: string }) {
  return (
    <div className="glass-card" style={{ padding: '14px 16px', textAlign: 'center' }}>
      <Icon size={18} color={color} style={{ margin: '0 auto 6px' }} />
      <div style={{ fontSize: 20, fontWeight: 700 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{label}</div>
    </div>
  )
}
