'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, Camera, FileImage, X, ArrowRight } from 'lucide-react'

interface UploadProps {
  onFileSelected: (file: File) => void
  isUploading: boolean
}

export default function BillUpload({ onFileSelected, isUploading }: UploadProps) {
  const [dragOver, setDragOver] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      alert('Please upload an image (JPG, PNG) or PDF of your medical bill.')
      return
    }
    setSelectedFile(file)
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => setPreview(e.target?.result as string)
      reader.readAsDataURL(file)
    } else {
      setPreview(null)
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

  const handleSubmit = () => {
    if (selectedFile) onFileSelected(selectedFile)
  }

  const clearFile = () => {
    setSelectedFile(null)
    setPreview(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <section
      id="upload-section"
      className="animate-in"
      style={{ maxWidth: 640, margin: '0 auto', padding: '0 24px 60px' }}
    >
      <div className="glass-card" style={{ padding: 32 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, textAlign: 'center' }}>
          Upload Your Bill
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', marginBottom: 24 }}>
          Take a photo or upload a scan. We support JPG, PNG, and PDF.
        </p>

        {!selectedFile ? (
          <div
            className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*,application/pdf"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFile(file)
              }}
            />
            <Upload
              size={40}
              color="var(--text-dim)"
              style={{ margin: '0 auto 16px' }}
            />
            <p style={{ fontWeight: 500, marginBottom: 4 }}>
              Drop your bill here or click to browse
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>
              JPG, PNG, or PDF up to 10MB
            </p>
            <div
              style={{
                display: 'flex',
                gap: 12,
                justifyContent: 'center',
                marginTop: 20,
              }}
            >
              <span className="badge badge-info">
                <Camera size={12} /> Phone Camera
              </span>
              <span className="badge badge-info">
                <FileImage size={12} /> Scan / Screenshot
              </span>
            </div>
          </div>
        ) : (
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: 16,
                background: 'rgba(245, 158, 11, 0.06)',
                borderRadius: 12,
                border: '1px solid rgba(245, 158, 11, 0.15)',
                marginBottom: 20,
              }}
            >
              {preview ? (
                <img
                  src={preview}
                  alt="Bill preview"
                  style={{
                    width: 80,
                    height: 80,
                    objectFit: 'cover',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 8,
                    background: 'var(--bg-card)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <FileImage size={32} color="var(--text-dim)" />
                </div>
              )}
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 500, fontSize: 14, marginBottom: 2 }}>
                  {selectedFile.name}
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <button
                onClick={clearFile}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 8,
                  borderRadius: 8,
                  color: 'var(--text-dim)',
                }}
              >
                <X size={18} />
              </button>
            </div>

            <button
              className="btn-primary"
              onClick={handleSubmit}
              disabled={isUploading}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {isUploading ? (
                <>
                  <div className="spinner" />
                  Analyzing your bill...
                </>
              ) : (
                <>
                  Analyze My Bill
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
