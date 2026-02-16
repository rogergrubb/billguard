'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import {
  Shield,
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  ChevronRight,
  Copy,
  Download,
  ArrowLeft,
  Zap,
  Scale,
  TrendingDown,
  Eye,
  X,
  Camera,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────
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

interface AnalysisResult {
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

type AppView = 'landing' | 'upload' | 'analyzing' | 'results' | 'dispute'

// ── Helpers ────────────────────────────────────────────────────
function usd(n: number) {
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  })
}

function severityColor(s: string) {
  if (s === 'high') return 'text-red-400 bg-red-400/10 border-red-400/30'
  if (s === 'medium')
    return 'text-amber-400 bg-amber-400/10 border-amber-400/30'
  return 'text-blue-400 bg-blue-400/10 border-blue-400/30'
}

function severityLabel(s: string) {
  if (s === 'high') return 'HIGH'
  if (s === 'medium') return 'MED'
  return 'LOW'
}

// ── Counter animation ──────────────────────────────────────────
function AnimatedNumber({ value, prefix = '' }: { value: number; prefix?: string }) {
  const [display, setDisplay] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const animated = useRef(false)

  useEffect(() => {
    if (animated.current) return
    animated.current = true
    const duration = 1200
    const start = performance.now()
    function tick(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(value * eased * 100) / 100)
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [value])

  return (
    <span ref={ref}>
      {prefix}
      {display.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}
    </span>
  )
}

// ── Main App ───────────────────────────────────────────────────
export default function BillGuardApp() {
  const [view, setView] = useState<AppView>('landing')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [disputeLetter, setDisputeLetter] = useState<string | null>(null)
  const [scanProgress, setScanProgress] = useState(0)
  const [email, setEmail] = useState('')
  const [emailCaptured, setEmailCaptured] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── File handling ──────────────────────────────────────────
  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith('image/') && f.type !== 'application/pdf') {
      setError('Please upload an image (JPG, PNG) or PDF of your medical bill.')
      return
    }
    if (f.size > 20 * 1024 * 1024) {
      setError('File too large. Maximum 20MB.')
      return
    }
    setFile(f)
    setError(null)
    if (f.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => setPreview(e.target?.result as string)
      reader.readAsDataURL(f)
    } else {
      setPreview(null)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const f = e.dataTransfer.files[0]
      if (f) handleFile(f)
    },
    [handleFile]
  )

  // ── Analysis ───────────────────────────────────────────────
  const runAnalysis = useCallback(async () => {
    if (!file) return
    setView('analyzing')
    setError(null)
    setScanProgress(0)

    // Animate progress
    const interval = setInterval(() => {
      setScanProgress((p) => (p < 90 ? p + Math.random() * 8 : p))
    }, 300)

    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const result = reader.result as string
          const base64Data = result.split(',')[1]
          resolve(base64Data)
        }
        reader.onerror = () => reject(new Error('Failed to read file'))
        reader.readAsDataURL(file)
      })

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64,
          mimeType: file.type || 'image/jpeg',
        }),
      })

      const data = await response.json()

      clearInterval(interval)
      setScanProgress(100)

      if (data.error) {
        setError(data.error)
        setView('upload')
        return
      }

      setResult(data)
      setTimeout(() => setView('results'), 600)
    } catch {
      clearInterval(interval)
      setError('Analysis failed. Please check your connection and try again.')
      setView('upload')
    }
  }, [file])

  // ── Dispute letter ─────────────────────────────────────────
  const generateDispute = useCallback(async () => {
    if (!result) return
    try {
      const response = await fetch('/api/dispute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result),
      })
      const data = await response.json()
      if (data.letter) {
        setDisputeLetter(data.letter)
        setView('dispute')
      }
    } catch {
      setError('Failed to generate dispute letter.')
    }
  }, [result])

  const copyLetter = useCallback(() => {
    if (disputeLetter) {
      navigator.clipboard.writeText(disputeLetter)
    }
  }, [disputeLetter])

  const downloadLetter = useCallback(() => {
    if (!disputeLetter) return
    const blob = new Blob([disputeLetter], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `BillGuard-Dispute-${new Date().toISOString().slice(0, 10)}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }, [disputeLetter])

  // ── Email capture ──────────────────────────────────────────
  const handleEmailCapture = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (email) {
        // In production, send to email service API
        setEmailCaptured(true)
      }
    },
    [email]
  )

  // ── VIEWS ──────────────────────────────────────────────────

  // ═══════════════════════════════════════════════════════════
  // LANDING PAGE
  // ═══════════════════════════════════════════════════════════
  if (view === 'landing') {
    return (
      <div className="min-h-screen bg-slate-950">
        {/* Nav */}
        <nav className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-7 h-7 text-emerald-400" />
              <span
                className="text-xl font-bold tracking-tight"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                BillGuard
              </span>
            </div>
            <button
              onClick={() => setView('upload')}
              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-lg transition-all text-sm"
            >
              Scan My Bill
            </button>
          </div>
        </nav>

        {/* Hero */}
        <section className="pt-32 pb-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-1.5 rounded-full text-sm mb-8">
              <AlertTriangle className="w-4 h-4" />
              80% of medical bills contain errors
            </div>

            <h1
              className="text-5xl sm:text-6xl lg:text-7xl leading-tight mb-6"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Your Hospital Bill Has{' '}
              <span className="text-emerald-400">Errors.</span>
              <br />
              We Find Them.
            </h1>

            <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Upload a photo of your medical bill. Our AI analyzes every line
              item, detects overcharges, and generates a dispute letter citing
              the exact regulations they violated. Takes 30 seconds.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <button
                onClick={() => setView('upload')}
                className="group px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-all text-lg flex items-center justify-center gap-2"
              >
                <Camera className="w-5 h-5" />
                Scan Your Bill Free
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() =>
                  document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })
                }
                className="px-8 py-4 bg-slate-800/50 hover:bg-slate-800 text-slate-300 font-semibold rounded-xl border border-slate-700/50 transition-all text-lg"
              >
                See How It Works
              </button>
            </div>

            {/* Trust metrics */}
            <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto">
              <div>
                <div className="text-2xl font-bold text-emerald-400">$210B</div>
                <div className="text-xs text-slate-500 mt-1">
                  Overcharged/yr in US
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-400">80%</div>
                <div className="text-xs text-slate-500 mt-1">
                  Bills with errors
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-400">30s</div>
                <div className="text-xs text-slate-500 mt-1">
                  Analysis time
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-24 px-6 bg-slate-900/30">
          <div className="max-w-5xl mx-auto">
            <h2
              className="text-3xl sm:text-4xl text-center mb-16"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Three Steps. Hundreds Saved.
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Upload className="w-8 h-8" />,
                  title: 'Upload Your Bill',
                  desc: 'Take a photo or upload a PDF of any medical bill or Explanation of Benefits (EOB).',
                  color: 'text-blue-400 bg-blue-400/10',
                },
                {
                  icon: <Eye className="w-8 h-8" />,
                  title: 'AI Scans Every Line',
                  desc: 'Our AI reads every CPT code, charge, and line item — comparing against Medicare rates and regulations.',
                  color: 'text-amber-400 bg-amber-400/10',
                },
                {
                  icon: <Scale className="w-8 h-8" />,
                  title: 'Get Your Dispute Letter',
                  desc: 'Receive a professional dispute letter citing the exact laws and regulations the provider violated.',
                  color: 'text-emerald-400 bg-emerald-400/10',
                },
              ].map((step, i) => (
                <div
                  key={i}
                  className="bg-slate-800/30 border border-slate-700/40 rounded-2xl p-8 text-center"
                >
                  <div
                    className={`inline-flex p-4 rounded-xl mb-5 ${step.color}`}
                  >
                    {step.icon}
                  </div>
                  <div className="text-sm text-slate-500 mb-2">
                    Step {i + 1}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What We Detect */}
        <section className="py-24 px-6">
          <div className="max-w-5xl mx-auto">
            <h2
              className="text-3xl sm:text-4xl text-center mb-4"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              What Our AI Catches
            </h2>
            <p className="text-slate-400 text-center mb-16 max-w-2xl mx-auto">
              Trained on millions of medical billing codes, Medicare fee
              schedules, and federal/state regulations.
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              {[
                {
                  icon: <TrendingDown className="w-5 h-5 text-red-400" />,
                  title: 'Upcoding',
                  desc: 'Services billed at higher complexity than actually provided',
                },
                {
                  icon: <FileText className="w-5 h-5 text-amber-400" />,
                  title: 'Duplicate Charges',
                  desc: 'Same procedure or supply billed multiple times',
                },
                {
                  icon: <Zap className="w-5 h-5 text-blue-400" />,
                  title: 'Unbundling',
                  desc: 'Bundled services split into separate charges to inflate cost',
                },
                {
                  icon: <DollarSign className="w-5 h-5 text-emerald-400" />,
                  title: 'Markup Abuse',
                  desc: 'Supplies and medications charged 300-1000% above market rate',
                },
                {
                  icon: <Shield className="w-5 h-5 text-purple-400" />,
                  title: 'Balance Billing',
                  desc: 'Violations of the No Surprises Act protections',
                },
                {
                  icon: <AlertTriangle className="w-5 h-5 text-orange-400" />,
                  title: 'Phantom Charges',
                  desc: 'Services that appear on bills but were never provided',
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex gap-4 p-5 bg-slate-800/20 border border-slate-700/30 rounded-xl"
                >
                  <div className="mt-0.5">{item.icon}</div>
                  <div>
                    <div className="font-semibold text-sm">{item.title}</div>
                    <div className="text-slate-400 text-sm mt-1">
                      {item.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Email Capture / CTA */}
        <section className="py-24 px-6 bg-slate-900/30">
          <div className="max-w-2xl mx-auto text-center">
            <h2
              className="text-3xl mb-4"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Stop Overpaying. Start Now.
            </h2>
            <p className="text-slate-400 mb-8">
              Join thousands of Americans who are fighting back against medical
              billing errors.
            </p>
            <button
              onClick={() => setView('upload')}
              className="px-10 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-all text-lg"
            >
              Analyze My Bill Free →
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-6 border-t border-slate-800/50">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-slate-500">
              <Shield className="w-4 h-4" />
              <span className="text-sm">
                BillGuard by NumberOneSonSoftware
              </span>
            </div>
            <p className="text-xs text-slate-600">
              BillGuard provides informational analysis only and does not
              constitute legal or medical advice. Consult qualified
              professionals for specific situations.
            </p>
          </div>
        </footer>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════
  // UPLOAD VIEW
  // ═══════════════════════════════════════════════════════════
  if (view === 'upload') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        {/* Header */}
        <div className="border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
            <button
              onClick={() => {
                setView('landing')
                setFile(null)
                setPreview(null)
                setError(null)
              }}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-400" />
              <span className="font-semibold">BillGuard</span>
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-xl w-full">
            <h2
              className="text-3xl text-center mb-2"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Upload Your Medical Bill
            </h2>
            <p className="text-slate-400 text-center mb-8">
              Photo, screenshot, or PDF — we&apos;ll read every line.
            </p>

            {/* Drop zone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
                file
                  ? 'border-emerald-400/50 bg-emerald-400/5'
                  : 'border-slate-600/50 bg-slate-800/20 hover:border-emerald-400/30 hover:bg-slate-800/40'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) handleFile(f)
                }}
              />

              {preview ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preview}
                    alt="Bill preview"
                    className="max-h-64 mx-auto rounded-lg opacity-80"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setFile(null)
                      setPreview(null)
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-slate-900/80 rounded-full hover:bg-red-500/30 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : file ? (
                <div>
                  <FileText className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                  <div className="text-sm font-medium">{file.name}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    {(file.size / 1024 / 1024).toFixed(1)} MB
                  </div>
                </div>
              ) : (
                <div>
                  <div className="inline-flex p-4 bg-slate-700/30 rounded-xl mb-4">
                    <Upload className="w-8 h-8 text-slate-400" />
                  </div>
                  <div className="text-sm font-medium mb-1">
                    Drop your bill here or click to browse
                  </div>
                  <div className="text-xs text-slate-500">
                    JPG, PNG, or PDF — up to 20MB
                  </div>
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Analyze button */}
            <button
              onClick={runAnalysis}
              disabled={!file}
              className={`w-full mt-6 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
                file
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Zap className="w-5 h-5" />
              Analyze My Bill
            </button>

            <p className="text-xs text-slate-600 text-center mt-4">
              Your bill is analyzed securely and never stored. We don&apos;t
              save personal health information.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════
  // ANALYZING VIEW
  // ═══════════════════════════════════════════════════════════
  if (view === 'analyzing') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          {/* Scanning animation */}
          <div className="relative w-32 h-32 mx-auto mb-8">
            <div className="absolute inset-0 border-2 border-emerald-400/20 rounded-2xl">
              <div className="absolute left-0 right-0 h-0.5 bg-emerald-400 scan-line rounded-full shadow-[0_0_12px_rgba(52,211,153,0.5)]" />
            </div>
            <div className="absolute inset-4 flex items-center justify-center">
              <FileText className="w-12 h-12 text-emerald-400/60" />
            </div>
          </div>

          <h2
            className="text-2xl mb-3"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Analyzing Your Bill
          </h2>

          {/* Progress bar */}
          <div className="w-full bg-slate-800 rounded-full h-2 mb-4 overflow-hidden">
            <div
              className="h-full bg-emerald-400 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${scanProgress}%` }}
            />
          </div>

          <div className="space-y-2 text-sm text-slate-400">
            {scanProgress < 20 && <p>Reading line items...</p>}
            {scanProgress >= 20 && scanProgress < 45 && (
              <p>Identifying CPT and HCPCS codes...</p>
            )}
            {scanProgress >= 45 && scanProgress < 65 && (
              <p>Comparing against Medicare fee schedules...</p>
            )}
            {scanProgress >= 65 && scanProgress < 85 && (
              <p>Checking for regulatory violations...</p>
            )}
            {scanProgress >= 85 && <p>Preparing your report...</p>}
          </div>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════
  // RESULTS VIEW
  // ═══════════════════════════════════════════════════════════
  if (view === 'results' && result) {
    const flagged = result.lineItems.filter((item) => item.status !== 'ok')
    const clean = result.lineItems.filter((item) => item.status === 'ok')

    return (
      <div className="min-h-screen bg-slate-950">
        {/* Header */}
        <div className="border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  setView('upload')
                  setFile(null)
                  setPreview(null)
                  setResult(null)
                }}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-400" />
                <span className="font-semibold">BillGuard</span>
              </div>
            </div>
            {flagged.length > 0 && (
              <button
                onClick={generateDispute}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-lg transition-all text-sm flex items-center gap-2"
              >
                <Scale className="w-4 h-4" />
                Generate Dispute Letter
              </button>
            )}
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-8">
          {/* Summary cards */}
          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-slate-800/30 border border-slate-700/40 rounded-xl p-6">
              <div className="text-sm text-slate-400 mb-1">Total Billed</div>
              <div className="text-2xl font-bold">
                <AnimatedNumber value={result.totalBilled} prefix="$" />
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {result.provider} · {result.dateOfService}
              </div>
            </div>

            <div
              className={`rounded-xl p-6 border ${
                result.totalSavings > 0
                  ? 'bg-red-500/10 border-red-500/20'
                  : 'bg-emerald-500/10 border-emerald-500/20'
              }`}
            >
              <div className="text-sm text-slate-400 mb-1">
                Overcharges Found
              </div>
              <div
                className={`text-2xl font-bold ${
                  result.totalSavings > 0 ? 'text-red-400' : 'text-emerald-400'
                }`}
              >
                <AnimatedNumber value={result.totalSavings} prefix="$" />
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {flagged.length} issue{flagged.length !== 1 ? 's' : ''}{' '}
                detected
              </div>
            </div>

            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6">
              <div className="text-sm text-slate-400 mb-1">
                Fair Price Estimate
              </div>
              <div className="text-2xl font-bold text-emerald-400">
                <AnimatedNumber value={result.totalFairPrice} prefix="$" />
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Based on Medicare rates & market data
              </div>
            </div>
          </div>

          {/* AI Summary */}
          {result.summary && (
            <div className="bg-slate-800/20 border border-slate-700/30 rounded-xl p-6 mb-8">
              <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                AI Analysis Summary
              </div>
              <p className="text-slate-300 leading-relaxed">{result.summary}</p>
              <div className="mt-3 text-xs text-slate-500">
                Confidence:{' '}
                <span
                  className={
                    result.confidence === 'high'
                      ? 'text-emerald-400'
                      : result.confidence === 'medium'
                      ? 'text-amber-400'
                      : 'text-red-400'
                  }
                >
                  {result.confidence.toUpperCase()}
                </span>
              </div>
            </div>
          )}

          {/* Flagged Items */}
          {flagged.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                Issues Found ({flagged.length})
              </h3>
              <div className="space-y-3">
                {flagged.map((item, i) => (
                  <div
                    key={i}
                    className="bg-slate-800/30 border border-slate-700/40 rounded-xl p-5 animate-fade-in-up"
                    style={{ animationDelay: `${i * 100}ms`, opacity: 0 }}
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="font-mono text-xs px-2 py-0.5 rounded bg-slate-700/50 text-slate-300"
                          >
                            {item.code}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full border font-medium ${severityColor(
                              item.severity
                            )}`}
                          >
                            {severityLabel(item.severity)}
                          </span>
                        </div>
                        <div className="font-medium text-sm">
                          {item.description}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-red-400 font-bold">
                          {usd(item.billedAmount)}
                        </div>
                        <div className="text-emerald-400 text-sm">
                          Fair: {usd(item.fairPrice)}
                        </div>
                      </div>
                    </div>

                    {item.issue && (
                      <div className="text-sm text-slate-400 mb-2">
                        <span className="text-red-400/80">Issue: </span>
                        {item.issue}
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700/30">
                      <span className="text-xs text-slate-500 font-mono">
                        {item.regulation}
                      </span>
                      <span className="text-sm font-bold text-red-400">
                        Save {usd(item.savings)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Clean Items */}
          {clean.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                Charges OK ({clean.length})
              </h3>
              <div className="bg-slate-800/20 border border-slate-700/30 rounded-xl divide-y divide-slate-700/30">
                {clean.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-slate-500">
                        {item.code}
                      </span>
                      <span className="text-sm text-slate-300">
                        {item.description}
                      </span>
                    </div>
                    <span className="text-sm text-slate-400">
                      {usd(item.billedAmount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA: Dispute or new scan */}
          <div className="flex flex-col sm:flex-row gap-4 py-8 border-t border-slate-800/50">
            {flagged.length > 0 && (
              <button
                onClick={generateDispute}
                className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Scale className="w-5 h-5" />
                Generate Dispute Letter — Save {usd(result.totalSavings)}
              </button>
            )}
            <button
              onClick={() => {
                setView('upload')
                setFile(null)
                setPreview(null)
                setResult(null)
              }}
              className="flex-1 py-4 bg-slate-800/50 hover:bg-slate-800 text-slate-300 font-semibold rounded-xl border border-slate-700/50 transition-all flex items-center justify-center gap-2"
            >
              Scan Another Bill
            </button>
          </div>

          {/* Email capture */}
          {!emailCaptured && (
            <div className="bg-slate-800/20 border border-slate-700/30 rounded-xl p-6 text-center">
              <h3 className="font-semibold mb-2">
                Get alerted about new billing regulations
              </h3>
              <p className="text-sm text-slate-400 mb-4">
                We&apos;ll send you updates when new consumer protections pass
                that could save you money.
              </p>
              <div className="flex gap-2 max-w-md mx-auto">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-emerald-400/50"
                  onKeyDown={(e) => e.key === 'Enter' && handleEmailCapture(e)}
                />
                <button
                  onClick={handleEmailCapture}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-lg text-sm transition-all"
                >
                  Subscribe
                </button>
              </div>
            </div>
          )}
          {emailCaptured && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center text-emerald-400 text-sm">
              <CheckCircle className="w-5 h-5 inline mr-2" />
              You&apos;re subscribed! We&apos;ll keep you informed.
            </div>
          )}
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════
  // DISPUTE LETTER VIEW
  // ═══════════════════════════════════════════════════════════
  if (view === 'dispute' && disputeLetter) {
    return (
      <div className="min-h-screen bg-slate-950">
        {/* Header */}
        <div className="border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setView('results')}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-400" />
                <span className="font-semibold">Dispute Letter</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={copyLetter}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm flex items-center gap-2 transition-colors"
              >
                <Copy className="w-4 h-4" />
                Copy
              </button>
              <button
                onClick={downloadLetter}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-lg text-sm flex items-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-6 py-8">
          <div className="bg-white text-slate-900 rounded-xl p-8 sm:p-12 shadow-2xl">
            <pre
              className="whitespace-pre-wrap text-sm leading-relaxed"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              {disputeLetter}
            </pre>
          </div>

          <div className="mt-8 bg-amber-500/10 border border-amber-500/20 rounded-xl p-5">
            <h4 className="font-semibold text-amber-400 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Before you send this letter
            </h4>
            <ul className="text-sm text-slate-400 space-y-1.5">
              <li>
                • Replace [YOUR NAME], [ACCOUNT NUMBER], and [PROVIDER ADDRESS]
                with your actual information
              </li>
              <li>
                • Request an itemized bill if you don&apos;t have one already
              </li>
              <li>
                • Send via certified mail with return receipt requested
              </li>
              <li>
                • Keep a copy of everything for your records
              </li>
              <li>
                • Consider consulting a medical billing advocate for complex
                disputes
              </li>
            </ul>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setView('upload')
                setFile(null)
                setPreview(null)
                setResult(null)
                setDisputeLetter(null)
              }}
              className="px-8 py-3 bg-slate-800/50 hover:bg-slate-800 text-slate-300 font-semibold rounded-xl border border-slate-700/50 transition-all"
            >
              Scan Another Bill
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Fallback
  return null
}
