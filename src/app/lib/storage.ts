import { DocumentAnalysis, DocumentLibrary } from './types'

const STORAGE_KEY = 'billguard_documents'

export function getLibrary(): DocumentLibrary {
  if (typeof window === 'undefined') return { documents: [], lastUpdated: '' }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { documents: [], lastUpdated: new Date().toISOString() }
    return JSON.parse(raw)
  } catch {
    return { documents: [], lastUpdated: new Date().toISOString() }
  }
}

export function saveDocument(doc: DocumentAnalysis): void {
  const lib = getLibrary()
  // Replace if same ID exists, otherwise prepend
  const idx = lib.documents.findIndex((d) => d.id === doc.id)
  if (idx >= 0) {
    lib.documents[idx] = doc
  } else {
    lib.documents.unshift(doc)
  }
  lib.lastUpdated = new Date().toISOString()
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lib))
}

export function deleteDocument(id: string): void {
  const lib = getLibrary()
  lib.documents = lib.documents.filter((d) => d.id !== id)
  lib.lastUpdated = new Date().toISOString()
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lib))
}

export function searchDocuments(query: string): DocumentAnalysis[] {
  const lib = getLibrary()
  if (!query.trim()) return lib.documents

  const q = query.toLowerCase()
  return lib.documents.filter((doc) => {
    const searchable = [
      doc.title,
      doc.summary,
      doc.category,
      doc.subcategory,
      doc.fileName,
      doc.detailedAnalysis,
      ...doc.keyFindings,
      ...doc.entities.map((e) => `${e.label} ${e.value}`),
      ...doc.metaTags.map((t) => `${t.key} ${t.value}`),
      ...doc.parties.map((p) => `${p.role} ${p.name} ${p.details}`),
      ...doc.riskFlags.map((r) => r.issue),
      ...doc.actionItems.map((a) => a.action),
      ...doc.legalReferences,
    ]
      .join(' ')
      .toLowerCase()

    return q.split(/\s+/).every((word) => searchable.includes(word) || searchable.indexOf(word) >= 0)
  })
}

export function getDocumentsByCategory(category: string): DocumentAnalysis[] {
  const lib = getLibrary()
  if (category === 'all') return lib.documents
  return lib.documents.filter((d) => d.category === category)
}

export function generateId(): string {
  return `doc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}
