'use client';

import { motion } from 'framer-motion';
import { Shield, Github, Twitter, MessageCircle, Heart } from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';
import type { AppView } from '@/types';

const quickLinks: { label: string; view: AppView }[] = [
  { label: 'Home', view: 'landing' },
  { label: 'About', view: 'about' },
  { label: 'Events', view: 'events' },
  { label: 'Gallery', view: 'gallery' },
  { label: 'Achievements', view: 'achievements' },
  { label: 'Join Club', view: 'register' },
];

const resources = ['Documentation', 'API Status', 'Support', 'FAQ'];
const legal = ['Privacy Policy', 'Terms of Service', 'Cookie Policy'];

const socialLinks = [
  { icon: Github, label: 'GitHub', href: '#' },
  { icon: Twitter, label: 'X (Twitter)', href: '#' },
  { icon: MessageCircle, label: 'Discord', href: '#' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

export function Footer() {
  const { setCurrentView } = useAppStore();

  return (
    <motion.footer
      variants={containerVariants as any}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
      className="mt-auto border-t border-white/5 bg-[#0a0a0a]"
    >
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Column 1: Brand */}
          <motion.div variants={itemVariants as any} className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
                <Shield className="h-5 w-5 text-emerald-400" />
              </div>
              <span className="text-lg font-bold text-white">
                Cyber Security <span className="text-emerald-400">Club</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed text-gray-500">
              Defending the Digital Frontier
            </p>
            <div className="flex items-center gap-3 pt-1">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  whileHover={{ scale: 1.15, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/5 bg-white/[0.02] text-gray-500 transition-colors hover:border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-400"
                >
                  <social.icon className="h-4 w-4" />
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Column 2: Quick Links */}
          <motion.div variants={itemVariants as any} className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-300">
              Quick Links
            </h3>
            <ul className="space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.view}>
                  <button
                    onClick={() => setCurrentView(link.view)}
                    className="text-sm text-gray-500 transition-colors hover:text-cyan-400"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Column 3: Resources */}
          <motion.div variants={itemVariants as any} className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-300">
              Resources
            </h3>
            <ul className="space-y-2.5">
              {resources.map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-sm text-gray-500 transition-colors hover:text-cyan-400"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Column 4: Legal */}
          <motion.div variants={itemVariants as any} className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-300">
              Legal
            </h3>
            <ul className="space-y-2.5">
              {legal.map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-sm text-gray-500 transition-colors hover:text-cyan-400"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>

      {/* Bottom bar */}
      <motion.div
        variants={itemVariants as any}
        className="border-t border-white/5"
      >
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 sm:flex-row sm:px-6 lg:px-8">
          <p className="text-xs text-gray-600">
            &copy; 2025 Cyber Security Club. All rights reserved.
          </p>
          <p className="text-xs text-gray-600">
            Created By <span className="font-mono text-emerald-400">CODESLAYER_X86</span>
          </p>
        </div>
      </motion.div>
    </motion.footer>
  );
}
