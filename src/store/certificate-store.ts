'use client'

import { create } from 'zustand'

export interface CertificateElement {
  id: string
  type: 'title' | 'headerTitle' | 'headerSubtitle' | 'introText' | 'recipientName' | 'eventLabel' | 'eventName' | 'descriptionText' | 'certificateId' | 'footerText' | 'signatureName' | 'signatureTitle'
  label: string
  text: string
  fontSize: number
  color: string
  fontWeight: 'normal' | 'bold'
  visible: boolean
  x: number
  y: number
}

export interface CertificateTemplate {
  id: string
  name: string
  borderColor: string
  borderAccent: string
  backgroundStyle: 'classic' | 'modern' | 'elegant'
}

const defaultTemplates: CertificateTemplate[] = [
  { id: 'participation', name: 'Participation', borderColor: '#8B0000', borderAccent: '#D4AF37', backgroundStyle: 'classic' },
  { id: 'completion', name: 'Completion', borderColor: '#1B4332', borderAccent: '#D4AF37', backgroundStyle: 'elegant' },
  { id: 'excellence', name: 'Excellence', borderColor: '#1E3A5F', borderAccent: '#C0C0C0', backgroundStyle: 'modern' },
  { id: 'achievement', name: 'Achievement', borderColor: '#4A0E4E', borderAccent: '#FFD700', backgroundStyle: 'elegant' },
]

const defaultElements: CertificateElement[] = [
  { id: 'title', type: 'title', label: 'Certificate Title', text: 'CERTIFICATE OF PARTICIPATION', fontSize: 28, color: '#8B0000', fontWeight: 'bold', visible: true, x: 50, y: 15 },
  { id: 'headerTitle', type: 'headerTitle', label: 'Header Title', text: 'CYBER SECURITY CLUB', fontSize: 16, color: '#333333', fontWeight: 'bold', visible: true, x: 50, y: 5 },
  { id: 'headerSubtitle', type: 'headerSubtitle', label: 'Header Subtitle', text: 'DHAKA INTERNATIONAL UNIVERSITY', fontSize: 11, color: '#666666', fontWeight: 'normal', visible: true, x: 50, y: 8 },
  { id: 'introText', type: 'introText', label: 'Intro Text', text: 'This is to certify that', fontSize: 14, color: '#444444', fontWeight: 'normal', visible: true, x: 50, y: 30 },
  { id: 'recipientName', type: 'recipientName', label: 'Recipient Name', text: 'Md. Rahim Uddin Shuvo', fontSize: 26, color: '#0D7377', fontWeight: 'bold', visible: true, x: 50, y: 40 },
  { id: 'eventLabel', type: 'eventLabel', label: 'Event Label', text: 'has successfully participated in', fontSize: 13, color: '#555555', fontWeight: 'normal', visible: true, x: 50, y: 50 },
  { id: 'eventName', type: 'eventName', label: 'Event Name', text: 'CyberSec Workshop 2026', fontSize: 18, color: '#8B0000', fontWeight: 'bold', visible: true, x: 50, y: 58 },
  { id: 'descriptionText', type: 'descriptionText', label: 'Description Text', text: 'Demonstrated exceptional skills in cybersecurity practices and ethical hacking methodologies.', fontSize: 11, color: '#777777', fontWeight: 'normal', visible: true, x: 50, y: 67 },
  { id: 'certificateId', type: 'certificateId', label: 'Certificate ID', text: 'CSC-2026-CYBERSEC-00125', fontSize: 10, color: '#0D7377', fontWeight: 'bold', visible: true, x: 50, y: 88 },
  { id: 'footerText', type: 'footerText', label: 'Footer Text', text: 'This certificate can be verified at', fontSize: 9, color: '#999999', fontWeight: 'normal', visible: true, x: 50, y: 92 },
  { id: 'signatureName', type: 'signatureName', label: 'Signature Name', text: 'Dr. Ahmad Hassan', fontSize: 12, color: '#333333', fontWeight: 'bold', visible: true, x: 30, y: 80 },
  { id: 'signatureTitle', type: 'signatureTitle', label: 'Signature Title', text: 'Club Advisor', fontSize: 10, color: '#666666', fontWeight: 'normal', visible: true, x: 30, y: 83 },
]

interface CertificateStore {
  elements: CertificateElement[]
  templates: CertificateTemplate[]
  selectedTemplateId: string
  selectedElementId: string | null
  setSelectedElementId: (id: string | null) => void
  updateElementText: (id: string, text: string) => void
  updateElementFontSize: (id: string, fontSize: number) => void
  updateElementColor: (id: string, color: string) => void
  updateElementFontWeight: (id: string, fontWeight: 'normal' | 'bold') => void
  updateElementVisible: (id: string, visible: boolean) => void
  updateElementPosition: (id: string, x: number, y: number) => void
  setSelectedTemplate: (id: string) => void
  getSelectedTemplate: () => CertificateTemplate
  getSelectedElement: () => CertificateElement | null
  resetToDefaults: () => void
}

export const useCertificateStore = create<CertificateStore>((set, get) => ({
  elements: defaultElements,
  templates: defaultTemplates,
  selectedTemplateId: 'participation',
  selectedElementId: null,

  setSelectedElementId: (id) => set({ selectedElementId: id }),

  updateElementText: (id, text) =>
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? { ...el, text } : el
      ),
    })),

  updateElementFontSize: (id, fontSize) =>
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? { ...el, fontSize: Math.max(6, Math.min(72, fontSize)) } : el
      ),
    })),

  updateElementColor: (id, color) =>
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? { ...el, color } : el
      ),
    })),

  updateElementFontWeight: (id, fontWeight) =>
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? { ...el, fontWeight } : el
      ),
    })),

  updateElementVisible: (id, visible) =>
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? { ...el, visible } : el
      ),
    })),

  updateElementPosition: (id, x, y) =>
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? { ...el, x, y } : el
      ),
    })),

  setSelectedTemplate: (id) => {
    const template = defaultTemplates.find(t => t.id === id)
    if (template) {
      set((state) => ({
        selectedTemplateId: id,
        // Update title and border colors when template changes
        elements: state.elements.map((el) => {
          if (el.id === 'title') return { ...el, color: template.borderColor }
          if (el.id === 'eventName') return { ...el, color: template.borderColor }
          return el
        }),
      }))
    }
  },

  getSelectedTemplate: () => {
    const state = get()
    return state.templates.find(t => t.id === state.selectedTemplateId) || state.templates[0]
  },

  getSelectedElement: () => {
    const state = get()
    if (!state.selectedElementId) return null
    return state.elements.find(el => el.id === state.selectedElementId) || null
  },

  resetToDefaults: () => set({
    elements: defaultElements,
    selectedTemplateId: 'participation',
    selectedElementId: null,
  }),
}))
