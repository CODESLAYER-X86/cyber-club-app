'use client'

import { useCertificateStore } from '@/store/certificate-store'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Check, Award, BookOpen, Star, Trophy } from 'lucide-react'

const templateIcons: Record<string, React.ReactNode> = {
  participation: <Award className="w-5 h-5" />,
  completion: <BookOpen className="w-5 h-5" />,
  excellence: <Star className="w-5 h-5" />,
  achievement: <Trophy className="w-5 h-5" />,
}

export function TypesPanel() {
  const { templates, selectedTemplateId, setSelectedTemplate } = useCertificateStore()

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-border">
        <h3 className="text-sm font-semibold">Certificate Templates</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Choose a template style for your certificate
        </p>
      </div>

      <ScrollArea className="flex-1 p-3">
        <div className="space-y-3">
          {templates.map((template) => {
            const isSelected = template.id === selectedTemplateId
            return (
              <button
                key={template.id}
                onClick={() => setSelectedTemplate(template.id)}
                className={`w-full rounded-lg border p-4 text-left transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${template.borderColor}15`, color: template.borderColor }}
                    >
                      {templateIcons[template.id]}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{template.name}</div>
                      <div className="text-xs text-muted-foreground capitalize">{template.backgroundStyle} style</div>
                    </div>
                  </div>
                  {isSelected && (
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  )}
                </div>

                {/* Template preview mini */}
                <div
                  className="mt-3 h-16 rounded border-2 relative overflow-hidden"
                  style={{ borderColor: template.borderColor }}
                >
                  <div
                    className="absolute inset-x-0 top-0 h-4"
                    style={{ backgroundColor: `${template.borderColor}10` }}
                  />
                  <div
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[8px] font-bold"
                    style={{ color: template.borderColor }}
                  >
                    {template.name.toUpperCase()}
                  </div>
                  {/* Corner accents */}
                  <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2" style={{ borderColor: template.borderAccent }} />
                  <div className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2" style={{ borderColor: template.borderAccent }} />
                  <div className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2" style={{ borderColor: template.borderAccent }} />
                  <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2" style={{ borderColor: template.borderAccent }} />
                </div>
              </button>
            )
          })}
        </div>
      </ScrollArea>

      {/* Note: NO color controls here - they are in the Element tab */}
      <div className="p-3 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          To customize colors, select an element in the Element tab
        </p>
      </div>
    </div>
  )
}
