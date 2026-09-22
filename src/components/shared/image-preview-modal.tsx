'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut, Download, ExternalLink, Shield, RotateCcw } from 'lucide-react';
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

function getHighResImageUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  // If it's a Google user content profile photo, request high-resolution (800px) instead of 96px thumbnail
  if (url.includes('googleusercontent.com')) {
    return url.replace(/=s\d+(-c)?$/, '=s800-c');
  }
  return url;
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
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setScale(1);
    }
  }, [isOpen]);

  const handleZoomIn = useCallback(() => {
    setScale((s) => Math.min(Number((s + 0.25).toFixed(2)), 3.5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((s) => Math.max(Number((s - 0.25).toFixed(2)), 0.5));
  }, []);

  const handleResetZoom = useCallback(() => {
    setScale(1);
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        handleZoomOut();
      } else if (e.key === '0') {
        handleResetZoom();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handleZoomIn, handleZoomOut, handleResetZoom]);

  // Handle mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  const initials = name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  const displaySrc = getHighResImageUrl(src);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 md:p-8">
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
            initial={{ opacity: 0, scale: 0.94, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 15 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            className="relative z-10 flex flex-col max-h-[92vh] max-w-2xl w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0d1117] shadow-2xl shadow-emerald-500/10"
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
                {displaySrc && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10"
                      onClick={handleZoomIn}
                      title="Zoom In (+)"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10"
                      onClick={handleZoomOut}
                      title="Zoom Out (-)"
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    {scale !== 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10"
                        onClick={handleResetZoom}
                        title="Reset Zoom (0)"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <a
                      href={displaySrc}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                      title="Open Original Image"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                    <a
                      href={displaySrc}
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

            {/* Content Body / Interactive Viewport */}
            <div
              className={`relative flex flex-1 items-center justify-center overflow-hidden p-6 bg-black/60 min-h-[340px] max-h-[70vh] select-none ${scale > 1 ? 'cursor-grab active:cursor-grabbing' : ''}`}
              onWheel={handleWheel}
            >
              {displaySrc ? (
                <motion.div
                  drag={scale > 1}
                  dragConstraints={{
                    left: -200 * (scale - 1),
                    right: 200 * (scale - 1),
                    top: -200 * (scale - 1),
                    bottom: 200 * (scale - 1),
                  }}
                  dragElastic={0.1}
                  animate={{ scale }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  className="flex items-center justify-center will-change-transform"
                  onDoubleClick={() => setScale((s) => (s > 1.2 ? 1 : 2))}
                  title={scale > 1 ? 'Drag to pan · Double click to reset' : 'Double click to zoom 2x'}
                >
                  <img
                    src={displaySrc}
                    alt={alt}
                    className="max-h-[55vh] max-w-[85vw] sm:max-h-[50vh] sm:max-w-[480px] w-auto h-auto min-w-[260px] min-h-[260px] sm:min-w-[320px] sm:min-h-[320px] object-cover sm:object-contain rounded-2xl border border-white/10 shadow-2xl select-none pointer-events-none"
                    draggable={false}
                  />
                </motion.div>
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
              <div className="flex items-center gap-2">
                <span
                  onClick={handleResetZoom}
                  className={`font-mono transition-colors ${displaySrc ? 'cursor-pointer hover:text-emerald-400' : ''}`}
                  title={displaySrc ? 'Click to reset zoom (100%)' : undefined}
                >
                  {displaySrc ? `Zoom: ${Math.round(scale * 100)}%` : 'Default Operative Avatar'}
                </span>
                {scale > 1 && (
                  <span className="text-[10px] text-gray-500 hidden sm:inline">
                    (Drag to pan · Double-click to reset)
                  </span>
                )}
              </div>
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
