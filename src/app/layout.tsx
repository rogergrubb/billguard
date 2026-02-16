import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BillGuard — Stop Overpaying on Medical Bills',
  description:
    'Upload your medical bill. Our AI finds overcharges, billing errors, and regulatory violations in seconds. Get a free dispute letter.',
  openGraph: {
    title: 'BillGuard — Stop Overpaying on Medical Bills',
    description:
      'AI-powered medical bill auditor. Find overcharges instantly.',
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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,700;0,9..144,900;1,9..144,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
