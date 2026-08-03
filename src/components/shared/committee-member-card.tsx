'use client';

import { useState } from 'react';
import {
  Facebook,
  Linkedin,
  Github,
  Mail,
  Pencil,
  Trash2,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CommitteeMember } from '@/types';

interface SocialLinkData {
  linkedin?: string;
  github?: string;
  facebook?: string;
  twitter?: string;
}

interface CommitteeMemberCardProps {
  member: CommitteeMember;
  canManage?: boolean;
  onEdit?: (member: CommitteeMember) => void;
  onDelete?: (member: CommitteeMember) => void;
}

interface RoleColors {
  avatarBg: string;
  accentClass: string;
  borderAccent: string;
  glowClass: string;
}

function getRoleColors(role: string): RoleColors {
  const firstWord = role.split(' ')[0].toLowerCase();
  switch (firstWord) {
    case 'president':
      return {
        avatarBg: 'from-amber-500 to-orange-500',
        accentClass: 'text-amber-400',
        borderAccent: 'border-amber-500/30',
        glowClass: 'shadow-amber-500/10 hover:shadow-amber-500/20',
      };
    case 'vice':
    case 'vp':
      return {
        avatarBg: 'from-purple-500 to-violet-500',
        accentClass: 'text-purple-400',
        borderAccent: 'border-purple-500/30',
        glowClass: 'shadow-purple-500/10 hover:shadow-purple-500/20',
      };
    case 'general':
    case 'gs':
      return {
        avatarBg: 'from-cyan-500 to-teal-500',
        accentClass: 'text-cyan-400',
        borderAccent: 'border-cyan-500/30',
        glowClass: 'shadow-cyan-500/10 hover:shadow-cyan-500/20',
      };
    case 'treasurer':
      return {
        avatarBg: 'from-emerald-500 to-green-500',
        accentClass: 'text-emerald-400',
        borderAccent: 'border-emerald-500/30',
        glowClass: 'shadow-emerald-500/10 hover:shadow-emerald-500/20',
      };
    case 'media':
      return {
        avatarBg: 'from-pink-500 to-rose-500',
        accentClass: 'text-pink-400',
        borderAccent: 'border-pink-500/30',
        glowClass: 'shadow-pink-500/10 hover:shadow-pink-500/20',
      };
    default:
      return {
        avatarBg: 'from-gray-500 to-slate-500',
        accentClass: 'text-gray-400',
        borderAccent: 'border-gray-500/30',
        glowClass: 'shadow-gray-500/10 hover:shadow-gray-500/20',
      };
  }
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function parseSocialLinks(raw: string | null | undefined): SocialLinkData | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SocialLinkData;
  } catch {
    return null;
  }
}

export function CommitteeMemberCard({
  member,
  canManage = false,
  onEdit,
  onDelete,
}: CommitteeMemberCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const colors = getRoleColors(member.role);
  const initials = getInitials(member.name);
  const socials = parseSocialLinks(member.socialLinks);

  const toggleFlip = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFlipped(!isFlipped);
  };

  return (
    <div className="perspective-1000 w-full h-[450px]">
      <div
        className={`relative w-full h-full transition-transform duration-700 transform-style-3d ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
      >
        {/* FRONT SIDE */}
        <div
          className={`absolute inset-0 w-full h-full backface-hidden rounded-2xl border border-white/5 bg-[#111]/80 backdrop-blur-xl overflow-hidden flex flex-col justify-between transition-all duration-300 hover:border-white/10 ${colors.glowClass}`}
        >
          {/* Photo/Avatar Container */}
          <div className="relative w-full h-[380px] bg-neutral-900 overflow-hidden flex items-center justify-center">
            {member.imageUrl ? (
              <img
                src={member.imageUrl}
                alt={member.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div
                className={`flex w-full h-full items-center justify-center bg-gradient-to-br ${colors.avatarBg} text-4xl font-bold text-white shadow-inner`}
              >
                {initials}
              </div>
            )}

            {/* Gradient Overlay for Text */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-[#111]/30 to-transparent opacity-90" />

            {/* Info and Social Links positioned at bottom of image */}
            <div className="absolute bottom-4 left-4 right-4 z-10">
              <span className={`text-[10px] font-bold tracking-widest uppercase ${colors.accentClass}`}>
                {member.role}
              </span>
              <h3 className="text-xl font-bold text-white mt-0.5 drop-shadow-md truncate">
                {member.name}
              </h3>
              {member.department && (
                <p className="text-xs text-gray-400 mt-0.5 truncate">{member.department}</p>
              )}

              {/* Socials Row */}
              <div className="mt-3 flex items-center gap-2">
                {socials?.facebook && (
                  <a
                    href={socials.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-white/5 text-gray-400 hover:text-blue-500 hover:bg-blue-500/10 transition-colors"
                  >
                    <Facebook className="h-3.5 w-3.5" />
                  </a>
                )}
                {socials?.linkedin && (
                  <a
                    href={socials.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-white/5 text-gray-400 hover:text-blue-500 hover:bg-blue-500/10 transition-colors"
                  >
                    <Linkedin className="h-3.5 w-3.5" />
                  </a>
                )}
                {socials?.github && (
                  <a
                    href={socials.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-white/5 text-gray-400 hover:text-gray-200 hover:bg-white/10 transition-colors"
                  >
                    <Github className="h-3.5 w-3.5" />
                  </a>
                )}
                {member.email && (
                  <a
                    href={`mailto:${member.email}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-white/5 text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                  >
                    <Mail className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Flip Action area */}
          <div className="flex-1 flex items-center bg-[#151515] border-t border-white/5">
            <button
              onClick={toggleFlip}
              className="flex w-full h-full items-center justify-between px-5 py-3.5 text-xs font-semibold text-gray-400 hover:text-white hover:bg-white/[0.02] transition-colors"
            >
              <span>About {member.name.split(' ')[0]}</span>
              <ArrowRight className="h-4 w-4 text-emerald-500" />
            </button>
          </div>
        </div>

        {/* BACK SIDE */}
        <div
          className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-2xl border border-white/5 bg-[#121212] flex flex-col justify-between p-6"
        >
          <div className="flex-1 flex flex-col min-h-0">
            {/* Header section on Back */}
            <div className="flex items-start justify-between border-b border-white/5 pb-3">
              <div>
                <h4 className="text-lg font-bold text-white truncate">{member.name}</h4>
                <p className={`text-xs font-semibold uppercase ${colors.accentClass}`}>{member.role}</p>
              </div>

              {/* Admin controls */}
              {canManage && (
                <div className="flex items-center gap-1 shrink-0">
                  {onEdit && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(member);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(member);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Bio content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar mt-4 text-sm text-gray-400 leading-relaxed pr-1">
              <p className="whitespace-pre-line">{member.description}</p>
            </div>
          </div>

          {/* Back button to flip back */}
          <button
            onClick={toggleFlip}
            className="mt-4 flex items-center justify-center gap-1.5 w-full rounded-lg border border-white/5 bg-white/[0.02] px-4 py-2.5 text-xs font-semibold text-gray-400 hover:text-white hover:bg-white/[0.05] hover:border-white/10 transition-all duration-200"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-emerald-500" />
            <span>Back to Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
}
