'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut, Download, ExternalLink, User as UserIcon, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ROLE_LABELS, UserRole } from '@/types';

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  src?: string | null;
  alt?: string;
  name?: string;
  role?: string;
  department?: string;
  studentId?: string;
}

export function ImagePreviewModal({
  isOpen,
  onClose,
  src,
  alt = 'Member Photo',
  name = 'Member',
  role,
  department,
  studentId,
}: ImagePreviewModalProps) {
  const [scale, setScale] = useState(1);

  // Reset zoom on open
  useEffect(() => {
    if (isOpen) {
      setScale(1);
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const initials = name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 15 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            className="relative z-10 flex flex-col max-h-[90vh] max-w-2xl w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0d1117] shadow-2xl shadow-emerald-500/10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header bar */}
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5 bg-white/[0.02]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
                  <Shield className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-white truncate flex items-center gap-2">
                    {name}
                    {role && (
                      <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400 bg-emerald-500/10 shrink-0">
                        {ROLE_LABELS[role as UserRole] || role}
                      </Badge>
                    )}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
                    {studentId && <span>ID: {studentId}</span>}
                    {studentId && department && <span>&middot;</span>}
                    {department && <span className="truncate">{department}</span>}
                  </div>
                </div>
              </div>

              {/* Action Tools */}
              <div className="flex items-center gap-1.5 shrink-0">
                {src && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10"
                      onClick={() => setScale((s) => Math.min(s + 0.25, 2.5))}
                      title="Zoom In"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10"
                      onClick={() => setScale((s) => Math.max(s - 0.25, 0.75))}
                      title="Zoom Out"
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <a
                      href={src}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                      title="Open Original Image"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                    <a
                      href={src}
                      download={`${name.replace(/\s+/g, '_')}_photo`}
                      className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                      title="Download Photo"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  </>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-400 hover:text-white hover:bg-red-500/20 hover:text-red-400 ml-1"
                  onClick={onClose}
                  title="Close (Esc)"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Content Body */}
            <div className="flex flex-1 items-center justify-center overflow-auto p-6 bg-black/40 min-h-[320px] max-h-[70vh]">
              {src ? (
                <div className="relative overflow-hidden rounded-xl border border-white/5 shadow-2xl flex items-center justify-center">
                  <motion.img
                    src={src}
                    alt={alt}
                    animate={{ scale }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className="max-h-[60vh] max-w-full object-contain rounded-xl select-none"
                    draggable={false}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
                  <div className="flex h-36 w-36 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/30 via-cyan-500/20 to-emerald-500/10 border-2 border-emerald-500/30 text-emerald-400 text-5xl font-bold shadow-xl shadow-emerald-500/10">
                    {initials}
                  </div>
                  <div className="space-y-1">
                    <p className="text-base font-semibold text-white">{name}</p>
                    <p className="text-xs text-gray-500">No profile picture has been uploaded by this member</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-white/10 px-5 py-3 bg-white/[0.01] flex items-center justify-between text-xs text-gray-400">
              <span className="font-mono">
                {src ? `Zoom: ${Math.round(scale * 100)}%` : 'Default Operative Avatar'}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="h-7 text-xs border-white/10 text-gray-300 hover:text-white hover:bg-white/5"
              >
                Close
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
