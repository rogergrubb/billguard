'use client'

import { useState } from 'react'
import {
  AlertTriangle,
  CheckCircle,
  DollarSign,
  FileText,
  ArrowLeft,
  Copy,
  Check,
  Download,
  Shield,
  TrendingDown,
  AlertCircle,
} from 'lucide-react'

interface LineItem {
  code: string
  description: string
  billedAmount: number
  status: string
  issue: string | null
  fairPrice: number
  savings: number
  severity: string
  regulation: string
}

export interface AnalysisResult {
  provider: string
  dateOfService: string
  billType: string
  lineItems: LineItem[]
  totalBilled: number
  totalFairPrice: number
  totalSavings: number
  summary: string
  overchargeCount: number
  confidence: string
}

interface ResultsProps {
  result: AnalysisResult
  onBack: () => void
}

function formatMoney(n: number) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function StatusBadge({ status, severity }: { status: string; severity: string }) {
  if (status === 'ok') {
    return (
      <span className="badge badge-success">
        <CheckCircle size={11} /> OK
      </span>
    )
  }
  const cls = severity === 'high' ? 'badge-danger' : 'badge-warning'
  const label = status.replace(/_/g, ' ').toUpperCase()
  return (
    <span className={`badge ${cls}`}>
      <AlertTriangle size={11} /> {label}
    </span>
  )
}

export default function Results({ result, onBack }: ResultsProps) {
  const [disputeLetter, setDisputeLetter] = useState<string | null>(null)
  const [loadingLetter, setLoadingLetter] = useState(false)
  const [copied, setCopied] = useState(false)
  const [patientName, setPatientName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [showLetterForm, setShowLetterForm] = useState(false)

  const flaggedItems = result.lineItems.filter((i) => i.status !== 'ok')
  const okItems = result.lineItems.filter((i) => i.status === 'ok')
  const savingsPercent =
    result.totalBilled > 0
      ? Math.round((result.totalSavings / result.totalBilled) * 100)
      : 0

  async function generateLetter() {
    setLoadingLetter(true)
    try {
      const res = await fetch('/api/dispute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...result,
          patientName: patientName || '[YOUR NAME]',
          accountNumber: accountNumber || '[ACCOUNT NUMBER]',
        }),
      })
      const data = await res.json()
      if (data.letter) {
        setDisputeLetter(data.letter)
        setShowLetterForm(false)
      }
    } catch {
      alert('Failed to generate letter. Please try again.')
    }
    setLoadingLetter(false)
  }

  function copyLetter() {
    if (disputeLetter) {
      navigator.clipboard.writeText(disputeLetter)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  function downloadLetter() {
    if (!disputeLetter) return
    const blob = new Blob([disputeLetter], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `BillGuard-Dispute-${result.provider.replace(/\s+/g, '-')}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px 80px' }}>
      {/* Header */}
      <div className="animate-in" style={{ marginBottom: 32 }}>
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 14,
            marginBottom: 20,
            padding: 0,
            fontFamily: 'inherit',
          }}
        >
          <ArrowLeft size={16} /> Scan another bill
        </button>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap', marginBottom: 6 }}>
          <h1 style={{ fontSize: 28, fontWeight: 900 }}>Bill Analysis</h1>
          <span
            className={`badge ${
              result.confidence === 'high'
                ? 'badge-success'
                : result.confidence === 'medium'
                ? 'badge-warning'
                : 'badge-danger'
            }`}
          >
            {result.confidence} confidence
          </span>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          {result.provider} · {result.billType} · {result.dateOfService}
        </p>
      </div>

      {/* Summary Cards */}
      <div
        className="animate-in stagger-1"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}
      >
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <DollarSign size={18} color="var(--text-dim)" />
            <span style={{ fontSize: 13, color: 'var(--text-dim)', fontWeight: 500 }}>Total Billed</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{formatMoney(result.totalBilled)}</div>
        </div>

        {result.totalSavings > 0 && (
          <div className="glass-card glow-red" style={{ padding: 24, borderColor: 'rgba(239,68,68,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <TrendingDown size={18} color="var(--danger)" />
              <span style={{ fontSize: 13, color: 'var(--danger)', fontWeight: 500 }}>Potential Overcharges</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--danger)' }}>
              {formatMoney(result.totalSavings)}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 4 }}>
              {savingsPercent}% of your bill
            </div>
          </div>
        )}

        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <AlertCircle size={18} color="var(--accent)" />
            <span style={{ fontSize: 13, color: 'var(--text-dim)', fontWeight: 500 }}>Issues Found</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>
            {result.overchargeCount}
            <span style={{ fontSize: 16, color: 'var(--text-dim)', fontWeight: 400 }}>
              {' '} of {result.lineItems.length} items
            </span>
          </div>
        </div>
      </div>

      {/* Summary */}
      {result.summary && (
        <div
          className="animate-in stagger-2 glass-card"
          style={{
            padding: 20,
            marginBottom: 32,
            borderLeft: '3px solid var(--accent)',
          }}
        >
          <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--text-muted)' }}>
            {result.summary}
          </p>
        </div>
      )}

      {/* Flagged Items */}
      {flaggedItems.length > 0 && (
        <div className="animate-in stagger-3" style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={20} color="var(--danger)" />
            Flagged Charges
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {flaggedItems.map((item, i) => (
              <div
                key={i}
                className="glass-card"
                style={{
                  padding: 20,
                  borderLeft: `3px solid ${item.severity === 'high' ? 'var(--danger)' : 'var(--accent)'}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                  <div>
                    <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-dim)' }}>
                      {item.code}
                    </span>
                    <h3 style={{ fontSize: 15, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>
                      {item.description}
                    </h3>
                  </div>
                  <StatusBadge status={item.status} severity={item.severity} />
                </div>

                {item.issue && (
                  <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 10, lineHeight: 1.5 }}>
                    {item.issue}
                  </p>
                )}

                <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: 14 }}>
                  <div>
                    <span style={{ color: 'var(--text-dim)' }}>Billed: </span>
                    <span style={{ fontWeight: 600 }}>{formatMoney(item.billedAmount)}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-dim)' }}>Fair Price: </span>
                    <span style={{ fontWeight: 600, color: 'var(--success)' }}>{formatMoney(item.fairPrice)}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-dim)' }}>Overcharge: </span>
                    <span style={{ fontWeight: 600, color: 'var(--danger)' }}>{formatMoney(item.savings)}</span>
                  </div>
                </div>

                {item.regulation && (
                  <div
                    style={{
                      marginTop: 10,
                      padding: '6px 10px',
                      background: 'rgba(59, 130, 246, 0.06)',
                      borderRadius: 6,
                      fontSize: 12,
                      color: 'var(--info)',
                    }}
                  >
                    📋 {item.regulation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* OK Items */}
      {okItems.length > 0 && (
        <div className="animate-in stagger-4" style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: 'var(--text-muted)' }}>
            <CheckCircle size={18} color="var(--success)" style={{ verticalAlign: 'middle', marginRight: 6 }} />
            Charges That Look Correct ({okItems.length})
          </h2>
          <div className="glass-card" style={{ overflow: 'hidden' }}>
            {okItems.map((item, i) => (
              <div
                key={i}
                style={{
                  padding: '12px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: i < okItems.length - 1 ? '1px solid var(--border)' : 'none',
                  fontSize: 14,
                }}
              >
                <div>
                  <span style={{ color: 'var(--text-dim)', fontFamily: 'monospace', fontSize: 12, marginRight: 8 }}>
                    {item.code}
                  </span>
                  {item.description}
                </div>
                <span style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>{formatMoney(item.billedAmount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dispute Letter CTA */}
      {flaggedItems.length > 0 && !disputeLetter && !showLetterForm && (
        <div
          className="glass-card glow-amber"
          style={{
            padding: 32,
            textAlign: 'center',
            borderColor: 'rgba(245, 158, 11, 0.2)',
          }}
        >
          <Shield size={36} color="var(--accent)" style={{ margin: '0 auto 12px' }} />
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
            Ready to Fight Back?
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 20, maxWidth: 440, margin: '0 auto 20px' }}>
            We&apos;ll generate a professional dispute letter citing federal regulations
            and specific overcharges. Send it to your provider&apos;s billing department.
          </p>
          <button className="btn-primary" onClick={() => setShowLetterForm(true)}>
            <FileText size={18} />
            Generate Dispute Letter
          </button>
        </div>
      )}

      {/* Letter Form */}
      {showLetterForm && !disputeLetter && (
        <div className="glass-card" style={{ padding: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
            Your Information (Optional)
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>
            Add your name and account number to personalize the letter, or leave blank to fill in later.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
            <input
              type="text"
              placeholder="Your full name"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              style={{
                padding: '12px 16px',
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--text)',
                fontSize: 15,
                fontFamily: 'inherit',
                outline: 'none',
              }}
            />
            <input
              type="text"
              placeholder="Account or patient ID number"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              style={{
                padding: '12px 16px',
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--text)',
                fontSize: 15,
                fontFamily: 'inherit',
                outline: 'none',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn-primary" onClick={generateLetter} disabled={loadingLetter}>
              {loadingLetter ? (
                <>
                  <div className="spinner" /> Generating...
                </>
              ) : (
                <>
                  <FileText size={18} /> Generate Letter
                </>
              )}
            </button>
            <button className="btn-secondary" onClick={() => setShowLetterForm(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Dispute Letter Display */}
      {disputeLetter && (
        <div className="glass-card" style={{ padding: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>
              <FileText size={20} style={{ verticalAlign: 'middle', marginRight: 8 }} />
              Your Dispute Letter
            </h2>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-secondary" onClick={copyLetter} style={{ padding: '8px 16px', fontSize: 14 }}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button className="btn-primary" onClick={downloadLetter} style={{ padding: '8px 16px', fontSize: 14 }}>
                <Download size={14} /> Download
              </button>
            </div>
          </div>
          <pre
            style={{
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: 24,
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
              fontSize: 13,
              lineHeight: 1.7,
              color: 'var(--text-muted)',
              maxHeight: 500,
              overflow: 'auto',
            }}
          >
            {disputeLetter}
          </pre>
        </div>
      )}

      {/* Disclaimer */}
      <p
        style={{
          marginTop: 40,
          fontSize: 12,
          color: 'var(--text-dim)',
          textAlign: 'center',
          lineHeight: 1.6,
        }}
      >
        BillGuard is an AI-powered analysis tool and does not constitute legal or medical advice.
        Always verify findings with your provider. Analysis accuracy depends on bill image quality.
        <br />© {new Date().getFullYear()} NumberOneSonSoftware. All rights reserved.
      </p>
    </div>
  )
}
