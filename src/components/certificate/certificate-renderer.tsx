'use client'

import { useCertificateStore } from '@/store/certificate-store'

interface CertificateRendererProps {
  width?: number
  height?: number
  className?: string
  showWatermark?: boolean
}

export function CertificateRenderer({
  width = 800,
  height = 566,
  className = '',
  showWatermark = false,
}: CertificateRendererProps) {
  const { elements, getSelectedTemplate } = useCertificateStore()
  const template = getSelectedTemplate()

  const getElement = (id: string) => elements.find(el => el.id === id)

  const title = getElement('title')
  const headerTitle = getElement('headerTitle')
  const headerSubtitle = getElement('headerSubtitle')
  const introText = getElement('introText')
  const recipientName = getElement('recipientName')
  const eventLabel = getElement('eventLabel')
  const eventName = getElement('eventName')
  const descriptionText = getElement('descriptionText')
  const certificateId = getElement('certificateId')
  const footerText = getElement('footerText')
  const signatureName = getElement('signatureName')
  const signatureTitle = getElement('signatureTitle')

  const renderElement = (el: typeof title, style?: React.CSSProperties) => {
    if (!el || !el.visible) return null
    return (
      <div
        key={el.id}
        style={{
          position: 'absolute',
          left: `${el.x}%`,
          top: `${el.y}%`,
          transform: 'translate(-50%, -50%)',
          fontSize: `${el.fontSize}px`,
          color: el.color,
          fontWeight: el.fontWeight,
          textAlign: 'center',
          width: '80%',
          ...style,
        }}
      >
        {el.text}
      </div>
    )
  }

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        width,
        height,
        background: 'linear-gradient(135deg, #FEFEFE 0%, #F8F6F0 50%, #FEFEFE 100%)',
        border: `3px solid ${template.borderColor}`,
        borderRadius: '8px',
      }}
    >
      {/* Corner accents */}
      {[
        { top: 8, left: 8, rotate: 0 },
        { top: 8, right: 8, rotate: 90 },
        { bottom: 8, right: 8, rotate: 180 },
        { bottom: 8, left: 8, rotate: 270 },
      ].map((pos, i) => {
        const { rotate, ...posStyle } = pos
        return (
          <div
            key={`corner-${i}`}
            style={{
              position: 'absolute',
              ...posStyle,
              width: '30px',
              height: '30px',
              borderTop: `3px solid ${template.borderAccent}`,
              borderLeft: `3px solid ${template.borderAccent}`,
              transform: `rotate(${rotate}deg)`,
            }}
          />
        )
      })}

      {/* Inner border */}
      <div
        style={{
          position: 'absolute',
          inset: '12px',
          border: `1px solid ${template.borderColor}33`,
          borderRadius: '4px',
          pointerEvents: 'none',
        }}
      />

      {/* Club Logo */}
      <img
        src="/certificate/logo.png"
        alt="Club Logo"
        style={{
          position: 'absolute',
          top: '1%',
          left: '50%',
          transform: 'translate(-50%, 0)',
          width: '60px',
          height: '60px',
          objectFit: 'contain',
          opacity: 0.9,
          zIndex: 2,
        }}
      />

      {/* Certificate content - SINGLE rendering of each element */}
      {renderElement(headerTitle)}
      {renderElement(headerSubtitle)}
      {renderElement(title)}
      {renderElement(introText)}
      {renderElement(recipientName)}
      {renderElement(eventLabel)}
      {renderElement(eventName)}
      {renderElement(descriptionText)}
      {renderElement(signatureName, { textAlign: 'left', width: 'auto' })}
      {renderElement(signatureTitle, { textAlign: 'left', width: 'auto' })}
      {renderElement(certificateId)}
      {renderElement(footerText)}

      {/* Signature line */}
      {signatureName && signatureName.visible && (
        <div
          style={{
            position: 'absolute',
            left: `${signatureName.x}%`,
            top: `${signatureName.y + 2}%`,
            transform: 'translate(-50%, 0)',
            width: '120px',
            borderTop: '1px solid #999',
          }}
        />
      )}

      {/* Issue date */}
      <div
        style={{
          position: 'absolute',
          right: '60px',
          bottom: '70px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '9px', color: '#999', marginBottom: '2px' }}>Issue Date</div>
        <div style={{ fontSize: '11px', color: '#333', fontWeight: 600 }}>
          {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Verification URL */}
      {certificateId && certificateId.visible && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            bottom: '15px',
            transform: 'translateX(-50%)',
            fontSize: '8px',
            color: '#aaa',
            textAlign: 'center',
          }}
        >
          https://csc-diu.vercel.app/verify/{certificateId.text}
        </div>
      )}

      {/* Watermark */}
      {showWatermark && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.04,
            fontSize: '80px',
            fontWeight: 'bold',
            color: template.borderColor,
            transform: 'rotate(-30deg)',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          VERIFIED
        </div>
      )}
    </div>
  )
}
