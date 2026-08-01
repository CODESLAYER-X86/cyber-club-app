'use client'

import { useState } from 'react'
import { useCertificateStore } from '@/store/certificate-store'
import { CertificateRenderer } from './certificate-renderer'
import { ElementEditorPanel } from './element-editor-panel'
import { TypesPanel } from './types-panel'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { RotateCcw, Download, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'

export function CertificateDesigner() {
  const { resetToDefaults, elements, getSelectedTemplate } = useCertificateStore()
  const [zoom, setZoom] = useState(0.55)
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false)

  const template = getSelectedTemplate()

  const handleDownloadPDF = () => {
    // Create a printable version
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const certHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Certificate</title>
        <style>
          @page { size: landscape; margin: 0; }
          body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
        </style>
      </head>
      <body>
        <div id="cert-container" style="width: 800px; height: 566px;"></div>
        <script>
          // This will be replaced with actual certificate HTML
          window.print();
        </script>
      </body>
      </html>
    `
    printWindow.document.write(certHtml)
    printWindow.document.close()
  }

  return (
    <div className="flex h-full bg-background">
      {/* Left panel - Editor tabs */}
      <div className="w-[380px] flex-shrink-0 border-r border-border bg-card">
        <Tabs defaultValue="element" className="h-full flex flex-col">
          <TabsList className="w-full rounded-none border-b border-border bg-muted/30 p-0 h-10">
            <TabsTrigger
              value="element"
              className="flex-1 rounded-none data-[state=active]:bg-background data-[state=active]:shadow-none h-full text-sm font-medium"
            >
              Element
            </TabsTrigger>
            <TabsTrigger
              value="types"
              className="flex-1 rounded-none data-[state=active]:bg-background data-[state=active]:shadow-none h-full text-sm font-medium"
            >
              Types
            </TabsTrigger>
          </TabsList>

          <TabsContent value="element" className="flex-1 mt-0 overflow-hidden">
            <ElementEditorPanel />
          </TabsContent>

          <TabsContent value="types" className="flex-1 mt-0 overflow-hidden">
            <TypesPanel />
          </TabsContent>
        </Tabs>

        {/* Bottom actions */}
        <div className="p-3 border-t border-border flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={resetToDefaults}
            className="gap-1.5 text-xs"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </Button>
        </div>
      </div>

      {/* Right panel - Live Preview */}
      <div className="flex-1 flex flex-col p-4 overflow-auto">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold">Live Preview</h2>
            <p className="text-xs text-muted-foreground">
              {template.name} Template &middot; Changes apply instantly
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoom(Math.max(0.3, zoom - 0.1))}
              className="h-7 w-7 p-0"
            >
              <ZoomOut className="w-3 h-3" />
            </Button>
            <span className="text-xs text-muted-foreground w-10 text-center">{Math.round(zoom * 100)}%</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoom(Math.min(1, zoom + 0.1))}
              className="h-7 w-7 p-0"
            >
              <ZoomIn className="w-3 h-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPreviewExpanded(!isPreviewExpanded)}
              className="h-7 w-7 p-0 ml-1"
            >
              <Maximize2 className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Certificate Preview - renders from the SAME store as the real certificate */}
        <div className={`flex items-center justify-center ${isPreviewExpanded ? 'flex-1' : ''}`}>
          <div
            className="shadow-xl transition-all duration-200"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'center center',
            }}
          >
            <CertificateRenderer
              width={800}
              height={566}
              showWatermark={true}
            />
          </div>
        </div>

        {/* Download section */}
        <div className="mt-4 flex items-center justify-center gap-3">
          <Button
            onClick={handleDownloadPDF}
            className="gap-2"
            style={{ backgroundColor: '#0D7377' }}
          >
            <Download className="w-4 h-4" />
            Download PDF
          </Button>
        </div>

        {/* Info about sync */}
        <div className="mt-4 text-center">
          <p className="text-xs text-muted-foreground">
            The preview above shows the <strong>actual certificate</strong> that will be generated.
            All changes are synced in real-time.
          </p>
        </div>
      </div>
    </div>
  )
}
