import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ScribeForge - AI-Powered Writing Organizer',
  description: 'Organize your texts and identify characters with AI',
  icons: {
    icon: '/logo.svg',
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
