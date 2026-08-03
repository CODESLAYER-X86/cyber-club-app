'use client'

import { useCertificateStore } from '@/store/certificate-store'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Eye, EyeOff, Bold, Type, Palette, Move } from 'lucide-react'
import { useCallback, useState } from 'react'

export function ElementEditorPanel() {
  const {
    elements,
    selectedElementId,
    setSelectedElementId,
    updateElementText,
    updateElementFontSize,
    updateElementColor,
    updateElementFontWeight,
    updateElementVisible,
  } = useCertificateStore()

  const selectedElement = elements.find(el => el.id === selectedElementId)
  const [colorInput, setColorInput] = useState('')

  const handleColorChange = useCallback((id: string, color: string) => {
    if (/^#[0-9A-Fa-f]{6}$/.test(color) || /^#[0-9A-Fa-f]{3}$/.test(color)) {
      updateElementColor(id, color)
    }
    setColorInput(color)
  }, [updateElementColor])

  const handleColorBlur = useCallback(() => {
    if (selectedElement) {
      setColorInput(selectedElement.color)
    }
  }, [selectedElement])

  // Preset colors
  const presetColors = [
    '#8B0000', '#1B4332', '#1E3A5F', '#4A0E4E', '#0D7377',
    '#333333', '#555555', '#777777', '#999999', '#D4AF37',
    '#FFD700', '#C0C0C0', '#FF4444', '#00AA00', '#0066CC',
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Element list */}
      <div className="p-3 border-b border-border">
        <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
          <Type className="w-4 h-4 text-primary" />
          Certificate Elements
        </h3>
        <ScrollArea className="h-[280px]">
          <div className="space-y-1 pr-2">
            {elements.map((el) => (
              <button
                key={el.id}
                onClick={() => setSelectedElementId(el.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
                  selectedElementId === el.id
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'hover:bg-muted text-foreground'
                }`}
              >
                <span className="truncate flex-1 text-left">{el.label}</span>
                <div className="flex items-center gap-1.5 ml-2">
                  <div
                    className="w-3 h-3 rounded-full border border-border"
                    style={{ backgroundColor: el.color }}
                  />
                  {!el.visible && <EyeOff className="w-3 h-3 text-muted-foreground" />}
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Selected element properties */}
      {selectedElement ? (
        <div className="p-3 flex-1 overflow-y-auto space-y-4">
          <h3 className="text-sm font-semibold flex items-center gap-1.5">
            <Move className="w-4 h-4 text-primary" />
            Edit: {selectedElement.label}
          </h3>

          {/* TEXT EDITING - This is the fix: allow text content editing */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Text Content</Label>
            {selectedElement.text.length > 50 ? (
              <Textarea
                value={selectedElement.text}
                onChange={(e) => updateElementText(selectedElement.id, e.target.value)}
                className="text-sm resize-none"
                rows={3}
              />
            ) : (
              <Input
                value={selectedElement.text}
                onChange={(e) => updateElementText(selectedElement.id, e.target.value)}
                className="text-sm"
                placeholder={`Enter ${selectedElement.label.toLowerCase()}`}
              />
            )}
          </div>

          {/* Font Size */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Font Size</Label>
              <span className="text-xs text-muted-foreground">{selectedElement.fontSize}px</span>
            </div>
            <Slider
              value={[selectedElement.fontSize]}
              onValueChange={([val]) => updateElementFontSize(selectedElement.id, val)}
              min={6}
              max={72}
              step={1}
              className="w-full"
            />
          </div>

          {/* Color Picker */}
          <div className="space-y-2">
            <Label className="text-xs font-medium flex items-center gap-1.5">
              <Palette className="w-3 h-3" />
              Color
            </Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={selectedElement.color}
                onChange={(e) => {
                  updateElementColor(selectedElement.id, e.target.value)
                  setColorInput(e.target.value)
                }}
                className="w-8 h-8 rounded cursor-pointer border border-border"
              />
              <Input
                value={colorInput || selectedElement.color}
                onChange={(e) => handleColorChange(selectedElement.id, e.target.value)}
                onBlur={handleColorBlur}
                className="text-xs font-mono flex-1"
                placeholder="#000000"
              />
            </div>
            {/* Preset colors */}
            <div className="flex flex-wrap gap-1.5 mt-1">
              {presetColors.map((color) => (
                <button
                  key={color}
                  onClick={() => {
                    updateElementColor(selectedElement.id, color)
                    setColorInput(color)
                  }}
                  className={`w-5 h-5 rounded-sm border transition-transform hover:scale-110 ${
                    selectedElement.color === color ? 'border-foreground ring-1 ring-primary' : 'border-border'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          {/* Font Weight */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Style</Label>
            <div className="flex items-center gap-2">
              <Button
                variant={selectedElement.fontWeight === 'bold' ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateElementFontWeight(
                  selectedElement.id,
                  selectedElement.fontWeight === 'bold' ? 'normal' : 'bold'
                )}
                className="gap-1.5"
              >
                <Bold className="w-3 h-3" />
                Bold
              </Button>
            </div>
          </div>

          {/* Visibility */}
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium flex items-center gap-1.5">
              {selectedElement.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              Visible
            </Label>
            <Switch
              checked={selectedElement.visible}
              onCheckedChange={(checked) => updateElementVisible(selectedElement.id, checked)}
            />
          </div>
        </div>
      ) : (
        <div className="p-4 text-center text-sm text-muted-foreground flex-1 flex items-center justify-center">
          Select an element to edit its properties
        </div>
      )}
    </div>
  )
}
