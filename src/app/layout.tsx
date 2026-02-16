import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BillGuard — Stop Overpaying on Medical Bills',
  description: 'Upload your medical bill. Our AI finds overcharges, billing errors, and regulatory violations — then generates dispute letters automatically. Americans overpay $210 billion annually on medical bills.',
  keywords: 'medical bill analysis, healthcare overcharges, medical billing errors, dispute medical bills, No Surprises Act, balance billing',
  openGraph: {
    title: 'BillGuard — Stop Overpaying on Medical Bills',
    description: 'AI-powered medical bill analysis. Upload a photo of your bill and find overcharges in seconds.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
