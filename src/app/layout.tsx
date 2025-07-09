import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'KRGeobuk Portal Admin',
  description: 'KRGeobuk 서비스 통합 관리 포탈',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}