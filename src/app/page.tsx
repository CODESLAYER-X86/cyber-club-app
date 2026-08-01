'use client'

import { CertificateDesigner } from '@/components/certificate/certificate-designer'

export default function Home() {
  return (
    <div className="h-screen w-screen overflow-hidden">
      <CertificateDesigner />
    </div>
  )
}
