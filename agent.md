# Agent Memory – BillGuard

## 1. Project Overview
- AI-powered medical bill auditor that finds overcharges, billing errors, and regulatory violations
- Primary users: Insured Americans confused by medical bills
- Non-goals: Not a legal advice platform, not a payment processor

## 2. Definition of Done (DoD)
- [x] Landing page with compelling copy and CTAs
- [x] Bill upload (photo/PDF) with drag-and-drop
- [x] AI analysis via Gemini Vision API (reads bill image, returns structured JSON)
- [x] Results display with flagged charges, fair prices, savings calculations
- [x] Dispute letter generation citing federal regulations
- [x] Demo mode with realistic sample data (no upload required)
- [x] Deployed to Vercel production
- [x] GEMINI_API_KEY env var configured
- [ ] Custom domain (billguard.app or similar)
- [ ] User authentication / accounts
- [ ] Payment/subscription system
- [ ] Email capture / newsletter integration
- [ ] PDF dispute letter download (currently .txt)
- [ ] Bill-to-EOB reconciliation feature
- [ ] SEO optimization

## 3. Current State
- Build: ✅ Compiles clean, no errors
- Deployment: ✅ Live at https://billguard-sable.vercel.app
- APIs: ✅ /api/analyze (Gemini Vision) and /api/dispute (letter gen) both working
- Demo: ✅ "Try Demo" button shows realistic ER bill with $5,672 in overcharges

## 4. Architecture & Design Decisions
- Next.js 14 with App Router on Vercel
- Gemini 2.0 Flash for bill image analysis (fast, cheap, good vision)
- No database yet — stateless analysis (upload → analyze → results)
- Dark theme with DM Sans + Fraunces fonts
- Component-based architecture (Hero, Upload, Results) to avoid massive single files
- API routes handle all server-side logic

## 5. Known Issues & Landmines
- Gemini API key is Roger's personal key — need dedicated key for production scale
- No rate limiting on API routes — could be abused
- No error tracking (Sentry etc.)
- PDF files upload but Gemini may struggle with complex PDFs vs photos
- No mobile-optimized camera capture flow yet

## 6. Debug History
- DoAnything agent built 41K single-file page.tsx that had JSX errors → Rebuilt as modular components
- Vercel CLI DNS issues in container → Token flag workaround works
- GEMINI_API_KEY env var already existed from prior deployment → No action needed

## 7. Proven Patterns
- Gemini Vision API with structured JSON prompt returns reliable billing analysis
- Dispute letter template with regulation citations is well-structured
- Component splitting prevents file-size-related JSX errors
- Vercel CLI deploy with --token flag works from containers

## 8. Failed Approaches (Do Not Retry)
- Single 41K page.tsx file → Always split into components
- DoAnything agent's first attempt was simulation-only → Build real from start

## 9. Open Questions / Unknowns
- What domain to use? billguard.app? billguard.com?
- Pricing model: freemium (3 free scans) vs subscription vs per-scan?
- Should dispute letters be PDF or text?
- Need to validate Gemini analysis accuracy against real bills

## 10. Next Actions
1. Buy custom domain and configure on Vercel
2. Add email capture (newsletter signup) on landing page
3. Add Stripe payment for premium features
4. Implement PDF dispute letter generation (jsPDF or similar)
5. Add rate limiting to API routes
6. SEO: sitemap, robots.txt, structured data
7. Analytics: Vercel Analytics or Plausible
8. Create social media assets for launch
