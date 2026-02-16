'use client'

import { useState, useCallback } from 'react'
import Hero from './components/Hero'
import BillUpload from './components/Upload'
import Results, { AnalysisResult } from './components/Results'
import { Shield, AlertTriangle } from 'lucide-react'

type View = 'landing' | 'analyzing' | 'results' | 'error'

const DEMO_RESULT: AnalysisResult = {
  provider: 'Mercy General Hospital',
  dateOfService: 'January 12, 2026',
  billType: 'Emergency Room Visit',
  lineItems: [
    {
      code: '99285',
      description: 'ER Visit - Level 5 (Highest Complexity)',
      billedAmount: 4850.0,
      status: 'overcharge',
      issue:
        'Level 5 ER code billed for a presentation consistent with Level 3 (moderate complexity). Common upcoding pattern — Level 5 requires high-severity conditions with immediate threat to life.',
      fairPrice: 1200.0,
      savings: 3650.0,
      severity: 'high',
      regulation: 'CMS Correct Coding Initiative (NCCI) — CPT evaluation guidelines',
    },
    {
      code: '36415',
      description: 'Venipuncture (Blood Draw)',
      billedAmount: 175.0,
      status: 'overcharge',
      issue: 'Blood draw billed at 5.8x the Medicare rate of $30. Excessive facility markup.',
      fairPrice: 30.0,
      savings: 145.0,
      severity: 'medium',
      regulation: 'Hospital Price Transparency Rule (45 CFR Part 180)',
    },
    {
      code: '85025',
      description: 'Complete Blood Count (CBC)',
      billedAmount: 350.0,
      status: 'overcharge',
      issue: 'Standard CBC lab test billed at 9x the Medicare rate. National average is $35-50.',
      fairPrice: 40.0,
      savings: 310.0,
      severity: 'high',
      regulation: 'Hospital Price Transparency Rule (45 CFR Part 180)',
    },
    {
      code: '71046',
      description: 'Chest X-Ray, 2 Views',
      billedAmount: 890.0,
      status: 'overcharge',
      issue: 'Chest X-ray billed at 12x the Medicare allowable amount of ~$75.',
      fairPrice: 75.0,
      savings: 815.0,
      severity: 'high',
      regulation: 'Medicare Fee Schedule — Physician Fee Schedule Lookup Tool',
    },
    {
      code: '96374',
      description: 'IV Push, Single Drug',
      billedAmount: 425.0,
      status: 'suspicious',
      issue: 'IV push administration fee significantly above Medicare rate of $55. Verify drug was actually administered.',
      fairPrice: 55.0,
      savings: 370.0,
      severity: 'medium',
      regulation: 'False Claims Act (31 USC §3729)',
    },
    {
      code: 'J7030',
      description: 'Normal Saline 1000ml',
      billedAmount: 137.0,
      status: 'overcharge',
      issue: 'Saline bag costs $1-3 wholesale. Hospital charging 45x+ markup.',
      fairPrice: 5.0,
      savings: 132.0,
      severity: 'medium',
      regulation: 'Hospital Price Transparency Rule (45 CFR Part 180)',
    },
    {
      code: '99051',
      description: 'Service Provided in Office During Regular Hours',
      billedAmount: 250.0,
      status: 'duplicate',
      issue: 'This modifier code is already included in the ER visit facility fee. Double-charging for the same service.',
      fairPrice: 0.0,
      savings: 250.0,
      severity: 'high',
      regulation: 'CMS Correct Coding Initiative (NCCI) — Bundling rules',
    },
    {
      code: '80053',
      description: 'Comprehensive Metabolic Panel',
      billedAmount: 415.0,
      status: 'ok',
      issue: null,
      fairPrice: 415.0,
      savings: 0.0,
      severity: 'low',
      regulation: '',
    },
  ],
  totalBilled: 7492.0,
  totalFairPrice: 1820.0,
  totalSavings: 5672.0,
  summary:
    'This emergency room bill contains 7 flagged charges with a total of $5,672 in potential overcharges — 75.7% of the total bill. The most significant issue is upcoding the ER visit from what appears to be a Level 3 to a Level 5, adding $3,650 in excess charges. Multiple line items show markups ranging from 5x to 45x the Medicare rate.',
  overchargeCount: 7,
  confidence: 'high',
}

export default function Home() {
  const [view, setView] = useState<View>('landing')
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [analyzeStep, setAnalyzeStep] = useState(0)

  const ANALYZE_STEPS = [
    'Reading your bill...',
    'Identifying CPT codes and charges...',
    'Checking against Medicare rates...',
    'Scanning for billing violations...',
    'Checking No Surprises Act compliance...',
    'Calculating fair market prices...',
    'Generating your report...',
  ]

  const handleUploadClick = useCallback(() => {
    setShowUpload(true)
    setTimeout(() => {
      document.getElementById('upload-section')?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }, [])

  const handleDemo = useCallback(() => {
    setView('analyzing')
    setAnalyzeStep(0)

    // Simulate analysis steps
    const steps = ANALYZE_STEPS.length
    for (let i = 0; i < steps; i++) {
      setTimeout(() => setAnalyzeStep(i), i * 600)
    }
    setTimeout(() => {
      setResult(DEMO_RESULT)
      setView('results')
    }, steps * 600 + 400)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleFileSelected = useCallback(async (file: File) => {
    setIsUploading(true)
    setView('analyzing')
    setAnalyzeStep(0)

    // Step through analysis phases
    const stepInterval = setInterval(() => {
      setAnalyzeStep((prev) => (prev < ANALYZE_STEPS.length - 1 ? prev + 1 : prev))
    }, 3000)

    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const result = reader.result as string
          // Strip data URL prefix
          const base64Data = result.split(',')[1]
          resolve(base64Data)
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64,
          mimeType: file.type || 'image/jpeg',
        }),
      })

      clearInterval(stepInterval)
      const data = await res.json()

      if (data.error) {
        setErrorMessage(data.error)
        setView('error')
      } else {
        setResult(data)
        setView('results')
      }
    } catch {
      clearInterval(stepInterval)
      setErrorMessage('Failed to analyze your bill. Please try again.')
      setView('error')
    }

    setIsUploading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Analyzing View
  if (view === 'analyzing') {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: 'var(--accent-glow)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
            }}
          >
            <Shield size={32} color="var(--accent)" />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Auditing Your Bill</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'left' }}>
            {ANALYZE_STEPS.map((step, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: i === analyzeStep ? 'var(--accent-glow)' : 'transparent',
                  transition: 'all 0.3s ease',
                  opacity: i <= analyzeStep ? 1 : 0.3,
                }}
              >
                {i < analyzeStep ? (
                  <div style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8.5L6.5 12L13 4" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                ) : i === analyzeStep ? (
                  <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                ) : (
                  <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid var(--border)' }} />
                )}
                <span
                  style={{
                    fontSize: 14,
                    color: i === analyzeStep ? 'var(--text)' : i < analyzeStep ? 'var(--success)' : 'var(--text-dim)',
                    fontWeight: i === analyzeStep ? 500 : 400,
                  }}
                >
                  {step}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Error View
  if (view === 'error') {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <div className="glass-card" style={{ padding: 40, textAlign: 'center', maxWidth: 480 }}>
          <AlertTriangle size={40} color="var(--danger)" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Analysis Failed</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>{errorMessage}</p>
          <button
            className="btn-primary"
            onClick={() => {
              setView('landing')
              setShowUpload(false)
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // Results View
  if (view === 'results' && result) {
    return (
      <Results
        result={result}
        onBack={() => {
          setView('landing')
          setShowUpload(false)
          setResult(null)
        }}
      />
    )
  }

  // Landing View
  return (
    <main style={{ minHeight: '100vh' }}>
      {/* Nav */}
      <nav
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 24px',
          maxWidth: 1100,
          margin: '0 auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Shield size={22} color="var(--accent)" />
          <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 20 }}>
            BillGuard
          </span>
        </div>
        <button className="btn-primary" onClick={handleUploadClick} style={{ padding: '10px 20px', fontSize: 14 }}>
          Scan My Bill
        </button>
      </nav>

      <Hero onUploadClick={handleUploadClick} onDemoClick={handleDemo} />

      {showUpload && <BillUpload onFileSelected={handleFileSelected} isUploading={isUploading} />}

      {/* Social Proof */}
      <section style={{ padding: '60px 24px', maxWidth: 800, margin: '0 auto' }}>
        <div
          className="glass-card"
          style={{
            padding: '40px 32px',
            textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(239,68,68,0.04) 0%, rgba(245,158,11,0.04) 100%)',
          }}
        >
          <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 12 }}>
            <span style={{ color: 'var(--danger)' }}>80%</span> of medical bills contain errors.
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 16, lineHeight: 1.6, maxWidth: 540, margin: '0 auto' }}>
            The average American family overpays $1,300 per year on medical bills.
            BillGuard catches what you can&apos;t see — upcoding, duplicate charges,
            balance billing violations, and markups that violate federal transparency rules.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section style={{ padding: '20px 24px 80px', maxWidth: 800, margin: '0 auto' }}>
        <h2 style={{ fontSize: 26, fontWeight: 900, textAlign: 'center', marginBottom: 40 }}>
          How It Works
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
          {[
            {
              step: '01',
              title: 'Upload Your Bill',
              desc: 'Snap a photo or upload a scan of your medical bill or EOB.',
            },
            {
              step: '02',
              title: 'AI Audits Every Line',
              desc: 'Our system checks each charge against Medicare rates, coding rules, and federal regulations.',
            },
            {
              step: '03',
              title: 'Get Your Dispute Letter',
              desc: 'If overcharges are found, we generate a regulation-citing dispute letter ready to send.',
            },
          ].map((item) => (
            <div key={item.step} className="glass-card" style={{ padding: 24 }}>
              <div
                style={{
                  fontFamily: "'Fraunces', serif",
                  fontSize: 36,
                  fontWeight: 900,
                  color: 'var(--accent)',
                  opacity: 0.3,
                  marginBottom: 8,
                }}
              >
                {item.step}
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>
                {item.title}
              </h3>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '24px', textAlign: 'center', borderTop: '1px solid var(--border)' }}>
        <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>
          © {new Date().getFullYear()} NumberOneSonSoftware. BillGuard is not a substitute for legal advice.
        </p>
      </footer>
    </main>
  )
}
