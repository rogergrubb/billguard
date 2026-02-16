'use client'

import { DocumentAnalysis, DocumentCategory } from '../lib/types'
import {
  FileText, Heart, Scale, Shield, Receipt, Building2, Briefcase,
  Mail, FileCheck, Landmark, Home, CreditCard, AlertTriangle, Clock, Trash2,
} from 'lucide-react'

const CATEGORY_CONFIG: Record<DocumentCategory, { icon: typeof FileText; color: string; label: string }> = {
  medical_bill: { icon: Heart, color: '#ef4444', label: 'Medical Bill' },
  legal_contract: { icon: Scale, color: '#8b5cf6', label: 'Legal Contract' },
  legal_notice: { icon: Shield, color: '#f59e0b', label: 'Legal Notice' },
  insurance_eob: { icon: FileCheck, color: '#3b82f6', label: 'Insurance EOB' },
  tax_document: { icon: Landmark, color: '#10b981', label: 'Tax Document' },
  financial_statement: { icon: CreditCard, color: '#06b6d4', label: 'Financial' },
  invoice: { icon: Receipt, color: '#f97316', label: 'Invoice' },
  receipt: { icon: Receipt, color: '#84cc16', label: 'Receipt' },
  government_form: { icon: Building2, color: '#6366f1', label: 'Government' },
  real_estate: { icon: Home, color: '#ec4899', label: 'Real Estate' },
  employment: { icon: Briefcase, color: '#14b8a6', label: 'Employment' },
  correspondence: { icon: Mail, color: '#a78bfa', label: 'Correspondence' },
  other: { icon: FileText, color: '#94a3b8', label: 'Document' },
}

interface DocumentCardProps {
  doc: DocumentAnalysis
  onClick: () => void
  onDelete: (e: React.MouseEvent) => void
}

export default function DocumentCard({ doc, onClick, onDelete }: DocumentCardProps) {
  const config = CATEGORY_CONFIG[doc.category] || CATEGORY_CONFIG.other
  const Icon = config.icon
  const criticalFlags = doc.riskFlags.filter((r) => r.severity === 'critical').length
  const totalAmount = doc.amounts.length > 0 ? doc.amounts[0] : null
  const timeAgo = getTimeAgo(doc.uploadedAt)

  return (
    <div
      className="glass-card"
      onClick={onClick}
      style={{
        padding: 20,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        position: 'relative',
        borderLeft: `3px solid ${config.color}`,
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLDivElement).style.background = 'var(--bg-card-hover)'
        ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLDivElement).style.background = 'var(--bg-card)'
        ;(e.currentTarget as HTMLDivElement).style.transform = 'none'
      }}
    >
      {/* Delete button */}
      <button
        onClick={onDelete}
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-dim)',
          padding: 4,
          borderRadius: 4,
          opacity: 0.5,
          transition: 'opacity 0.2s',
        }}
        onMouseEnter={(e) => { (e.currentTarget.style.opacity = '1'); (e.currentTarget.style.color = 'var(--danger)') }}
        onMouseLeave={(e) => { (e.currentTarget.style.opacity = '0.5'); (e.currentTarget.style.color = 'var(--text-dim)') }}
      >
        <Trash2 size={14} />
      </button>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: `${config.color}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon size={20} color={config.color} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3
            style={{
              fontSize: 14,
              fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif",
              marginBottom: 2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              paddingRight: 20,
            }}
          >
            {doc.title}
          </h3>
          <span style={{ fontSize: 11, color: config.color, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {config.label}
          </span>
        </div>
      </div>

      {/* Summary */}
      <p
        style={{
          fontSize: 12,
          color: 'var(--text-muted)',
          lineHeight: 1.5,
          marginBottom: 12,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {doc.summary}
      </p>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {criticalFlags > 0 && (
            <span className="badge badge-danger" style={{ fontSize: 10, padding: '2px 6px' }}>
              <AlertTriangle size={10} /> {criticalFlags} critical
            </span>
          )}
          {totalAmount && (
            <span className="badge badge-info" style={{ fontSize: 10, padding: '2px 6px' }}>
              ${totalAmount.amount.toLocaleString()}
            </span>
          )}
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Clock size={10} /> {timeAgo}
        </span>
      </div>
    </div>
  )
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
