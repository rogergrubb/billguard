'use client'

import { Shield, ArrowRight, Zap, FileSearch, Scale } from 'lucide-react'

interface HeroProps {
  onUploadClick: () => void
  onDemoClick: () => void
}

export default function Hero({ onUploadClick, onDemoClick }: HeroProps) {
  return (
    <section style={{ padding: '80px 24px 60px', maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
      <div className="animate-in" style={{ marginBottom: 16 }}>
        <span className="badge badge-warning" style={{ fontSize: 13, padding: '6px 14px' }}>
          <Zap size={14} /> Americans overpay $210 billion/year on medical bills
        </span>
      </div>

      <h1
        className="animate-in stagger-1"
        style={{
          fontSize: 'clamp(2.5rem, 6vw, 4rem)',
          fontWeight: 900,
          lineHeight: 1.1,
          marginBottom: 20,
          letterSpacing: '-0.02em',
        }}
      >
        Your medical bill
        <br />
        <span style={{ color: 'var(--danger)' }}>probably has errors.</span>
      </h1>

      <p
        className="animate-in stagger-2"
        style={{
          fontSize: 18,
          color: 'var(--text-muted)',
          maxWidth: 560,
          margin: '0 auto 36px',
          lineHeight: 1.6,
        }}
      >
        Upload a photo of your bill. Our AI auditor finds overcharges, duplicate
        billing, coding errors, and regulatory violations — then writes your
        dispute letter automatically.
      </p>

      <div
        className="animate-in stagger-3"
        style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}
      >
        <button className="btn-primary" onClick={onUploadClick}>
          <Shield size={18} />
          Scan My Bill
          <ArrowRight size={16} />
        </button>
        <button className="btn-secondary" onClick={onDemoClick}>
          Try Demo
        </button>
      </div>

      <div
        className="animate-in stagger-4"
        style={{
          display: 'flex',
          gap: 32,
          justifyContent: 'center',
          marginTop: 56,
          flexWrap: 'wrap',
        }}
      >
        {[
          { icon: FileSearch, label: 'AI Bill Auditor', desc: 'Scans every line item' },
          { icon: Scale, label: 'Regulation Cited', desc: 'No Surprises Act & more' },
          { icon: Shield, label: 'Dispute Letters', desc: 'Auto-generated, ready to send' },
        ].map((f) => (
          <div key={f.label} style={{ textAlign: 'center' }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: 'var(--accent-glow)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 10px',
              }}
            >
              <f.icon size={22} color="var(--accent)" />
            </div>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{f.label}</div>
            <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>{f.desc}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
