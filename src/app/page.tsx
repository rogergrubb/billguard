'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Shield, Upload, Search, Plus, FileText, X, Camera, FileImage,
  ArrowRight, Zap, ChevronDown, AlertTriangle,
} from 'lucide-react'
import { DocumentAnalysis } from './lib/types'
import { getLibrary, saveDocument, deleteDocument, searchDocuments, generateId } from './lib/storage'
import DocumentCard from './components/DocumentCard'
import DocumentDetail from './components/DocumentDetail'

type View = 'dashboard' | 'uploading' | 'analyzing' | 'detail' | 'error'

const ANALYZE_STEPS = [
  'Reading your document...',
  'Classifying document type...',
  'Extracting metadata and entities...',
  'Identifying key dates and amounts...',
  'Scanning for risks and concerns...',
  'Cross-referencing regulations...',
  'Building your analysis report...',
]

const CATEGORY_FILTERS = [
  { value: 'all', label: 'All Documents' },
  { value: 'medical_bill', label: 'Medical Bills' },
  { value: 'legal_contract', label: 'Legal Contracts' },
  { value: 'legal_notice', label: 'Legal Notices' },
  { value: 'insurance_eob', label: 'Insurance EOB' },
  { value: 'tax_document', label: 'Tax Documents' },
  { value: 'financial_statement', label: 'Financial' },
  { value: 'invoice', label: 'Invoices' },
  { value: 'receipt', label: 'Receipts' },
  { value: 'employment', label: 'Employment' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'government_form', label: 'Government' },
]

export default function Home() {
  const [view, setView] = useState<View>('dashboard')
  const [documents, setDocuments] = useState<DocumentAnalysis[]>([])
  const [selectedDoc, setSelectedDoc] = useState<DocumentAnalysis | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [errorMessage, setErrorMessage] = useState('')
  const [analyzeStep, setAnalyzeStep] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load documents on mount
  useEffect(() => {
    const lib = getLibrary()
    setDocuments(lib.documents)
  }, [])

  // Filter documents
  const filteredDocs = searchQuery
    ? searchDocuments(searchQuery)
    : categoryFilter !== 'all'
    ? documents.filter((d) => d.category === categoryFilter)
    : documents

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      alert('Please upload an image (JPG, PNG) or PDF.')
      return
    }

    setShowUploadModal(false)
    setView('analyzing')
    setAnalyzeStep(0)

    const stepInterval = setInterval(() => {
      setAnalyzeStep((prev) => (prev < ANALYZE_STEPS.length - 1 ? prev + 1 : prev))
    }, 2500)

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve((reader.result as string).split(',')[1])
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      // Create thumbnail for images
      let thumbnailData: string | undefined
      if (file.type.startsWith('image/')) {
        thumbnailData = await createThumbnail(file)
      }

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, mimeType: file.type || 'image/jpeg' }),
      })

      clearInterval(stepInterval)
      const data = await res.json()

      if (data.error) {
        setErrorMessage(data.error)
        setView('error')
        return
      }

      // Build full document analysis
      const doc: DocumentAnalysis = {
        id: generateId(),
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        uploadedAt: new Date().toISOString(),
        analyzedAt: new Date().toISOString(),
        thumbnailData,
        ...data,
      }

      // Save to library
      saveDocument(doc)
      setDocuments(getLibrary().documents)
      setSelectedDoc(doc)
      setView('detail')
    } catch {
      clearInterval(stepInterval)
      setErrorMessage('Failed to analyze your document. Please try again.')
      setView('error')
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const handleDelete = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Delete this document analysis?')) {
      deleteDocument(id)
      setDocuments(getLibrary().documents)
    }
  }, [])

  // Analyzing View
  if (view === 'analyzing') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: 'var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <Shield size={32} color="var(--accent)" />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Analyzing Document</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'left' }}>
            {ANALYZE_STEPS.map((step, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', borderRadius: 8, background: i === analyzeStep ? 'var(--accent-glow)' : 'transparent', transition: 'all 0.3s ease', opacity: i <= analyzeStep ? 1 : 0.3 }}>
                {i < analyzeStep ? (
                  <svg width="20" height="20" viewBox="0 0 16 16" fill="none"><path d="M3 8.5L6.5 12L13 4" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                ) : i === analyzeStep ? (
                  <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                ) : (
                  <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid var(--border)' }} />
                )}
                <span style={{ fontSize: 14, color: i === analyzeStep ? 'var(--text)' : i < analyzeStep ? 'var(--success)' : 'var(--text-dim)', fontWeight: i === analyzeStep ? 500 : 400 }}>
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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div className="glass-card" style={{ padding: 40, textAlign: 'center', maxWidth: 480 }}>
          <AlertTriangle size={40} color="var(--danger)" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Analysis Failed</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>{errorMessage}</p>
          <button className="btn-primary" onClick={() => setView('dashboard')}>Back to Dashboard</button>
        </div>
      </div>
    )
  }

  // Detail View
  if (view === 'detail' && selectedDoc) {
    return (
      <DocumentDetail
        doc={selectedDoc}
        onBack={() => { setView('dashboard'); setSelectedDoc(null) }}
      />
    )
  }

  // Dashboard View
  const hasDocuments = documents.length > 0

  return (
    <main
      style={{ minHeight: '100vh' }}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {/* Global drag overlay */}
      {dragOver && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(11,15,26,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '3px dashed var(--accent)',
        }}>
          <div style={{ textAlign: 'center' }}>
            <Upload size={56} color="var(--accent)" style={{ margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Drop your document here</h2>
            <p style={{ color: 'var(--text-muted)' }}>JPG, PNG, or PDF — we&apos;ll analyze it instantly</p>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={() => setShowUploadModal(false)}>
          <div className="glass-card" style={{ padding: 32, maxWidth: 480, width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700 }}>Upload Document</h2>
              <button onClick={() => setShowUploadModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', padding: 4 }}>
                <X size={20} />
              </button>
            </div>
            <div
              className="upload-zone"
              onClick={() => inputRef.current?.click()}
              style={{ marginBottom: 16 }}
            >
              <input ref={inputRef} type="file" accept="image/*,application/pdf" style={{ display: 'none' }}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
              <Upload size={36} color="var(--text-dim)" style={{ margin: '0 auto 12px' }} />
              <p style={{ fontWeight: 500, marginBottom: 4 }}>Click to browse or drag here</p>
              <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>Medical bills, contracts, tax docs, legal notices — any document</p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
                <span className="badge badge-info"><Camera size={11} /> Photo</span>
                <span className="badge badge-info"><FileImage size={11} /> Scan</span>
                <span className="badge badge-info"><FileText size={11} /> PDF</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => { setView('dashboard'); setSelectedDoc(null) }}>
          <Shield size={22} color="var(--accent)" />
          <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 20 }}>BillGuard</span>
          {hasDocuments && (
            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: 'var(--accent-glow)', color: 'var(--accent)', fontWeight: 600, marginLeft: 4 }}>
              {documents.length} docs
            </span>
          )}
        </div>
        <button className="btn-primary" onClick={() => setShowUploadModal(true)} style={{ padding: '8px 18px', fontSize: 13 }}>
          <Plus size={16} /> Analyze Document
        </button>
      </nav>

      {/* Main Content */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 80px' }}>
        {!hasDocuments ? (
          /* Empty state / Landing */
          <div style={{ textAlign: 'center', padding: '60px 0 40px' }}>
            <div className="animate-in" style={{ marginBottom: 16 }}>
              <span className="badge badge-warning" style={{ fontSize: 13, padding: '6px 14px' }}>
                <Zap size={14} /> AI-Powered Document Intelligence
              </span>
            </div>
            <h1 className="animate-in stagger-1" style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: 16 }}>
              Upload any document.
              <br /><span style={{ color: 'var(--accent)' }}>Get instant intelligence.</span>
            </h1>
            <p className="animate-in stagger-2" style={{ fontSize: 17, color: 'var(--text-muted)', maxWidth: 520, margin: '0 auto 32px', lineHeight: 1.6 }}>
              Medical bills, legal contracts, tax documents, insurance forms — our AI reads everything, extracts every detail, flags every risk, and generates exportable reports.
            </p>

            <div className="animate-in stagger-3" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 48 }}>
              <button className="btn-primary" onClick={() => setShowUploadModal(true)}>
                <Shield size={18} /> Analyze a Document <ArrowRight size={16} />
              </button>
            </div>

            {/* Feature grid */}
            <div className="animate-in stagger-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, maxWidth: 800, margin: '0 auto' }}>
              {[
                { title: 'Any Document Type', desc: 'Medical bills, contracts, tax forms, insurance EOBs, legal notices, invoices, and more.' },
                { title: 'Deep Metadata Extraction', desc: 'Every name, date, amount, code, and reference number — automatically tagged and searchable.' },
                { title: 'Risk & Compliance Flags', desc: 'AI identifies overcharges, hidden clauses, missed deadlines, and regulatory violations.' },
                { title: 'Export & Print', desc: 'Generate professional PDF reports with full analysis, ready to share or file.' },
              ].map((f) => (
                <div key={f.title} className="glass-card" style={{ padding: 20, textAlign: 'left' }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>{f.title}</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Document Library */
          <div style={{ paddingTop: 24 }}>
            {/* Search + Filter Bar */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
                <Search size={16} color="var(--text-dim)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search documents, tags, entities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%', padding: '12px 14px 12px 40px', borderRadius: 10,
                    border: '1px solid var(--border)', background: 'var(--bg-card)',
                    color: 'var(--text)', fontSize: 14, fontFamily: 'inherit', outline: 'none',
                  }}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)' }}>
                    <X size={14} />
                  </button>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  style={{
                    padding: '12px 36px 12px 14px', borderRadius: 10,
                    border: '1px solid var(--border)', background: 'var(--bg-card)',
                    color: 'var(--text)', fontSize: 14, fontFamily: 'inherit',
                    appearance: 'none', cursor: 'pointer', outline: 'none',
                  }}
                >
                  {CATEGORY_FILTERS.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
                <ChevronDown size={14} color="var(--text-dim)" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              </div>
            </div>

            {/* Results count */}
            <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 16 }}>
              {filteredDocs.length} document{filteredDocs.length !== 1 ? 's' : ''}
              {searchQuery && ` matching "${searchQuery}"`}
              {categoryFilter !== 'all' && ` in ${CATEGORY_FILTERS.find((f) => f.value === categoryFilter)?.label}`}
            </p>

            {/* Document Grid */}
            {filteredDocs.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                {filteredDocs.map((doc) => (
                  <DocumentCard
                    key={doc.id}
                    doc={doc}
                    onClick={() => { setSelectedDoc(doc); setView('detail') }}
                    onDelete={(e) => handleDelete(doc.id, e)}
                  />
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <FileText size={40} color="var(--text-dim)" style={{ margin: '0 auto 12px' }} />
                <p style={{ color: 'var(--text-dim)' }}>No documents match your search.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer style={{ padding: 24, textAlign: 'center', borderTop: '1px solid var(--border)' }}>
        <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>
          © {new Date().getFullYear()} NumberOneSonSoftware. AI-powered document intelligence. Not a substitute for professional advice.
        </p>
      </footer>
    </main>
  )
}

async function createThumbnail(file: File): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const size = 120
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')!
      const scale = Math.max(size / img.width, size / img.height)
      const w = img.width * scale
      const h = img.height * scale
      ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h)
      resolve(canvas.toDataURL('image/jpeg', 0.6))
    }
    img.onerror = () => resolve('')
    img.src = URL.createObjectURL(file)
  })
}
