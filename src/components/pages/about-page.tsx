'use client';

import { motion } from 'framer-motion';
import { Shield, Eye, Scale, Lightbulb, Users, Award, Target, BookOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const fadeUp = { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.5 } };

export function AboutPage() {
  return (
    <div className="flex flex-1 flex-col">
      <section className="relative px-4 py-24">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/3 top-1/4 h-96 w-96 rounded-full bg-emerald-500/6 blur-[140px]" />
        </div>
        <div className="relative mx-auto max-w-4xl text-center">
          <motion.div {...fadeUp}>
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-emerald-500/20 bg-emerald-500/10">
              <Shield className="h-10 w-10 text-emerald-400" />
            </div>
            <h1 className="text-4xl font-extrabold text-white md:text-5xl">About <span className="text-emerald-400">CyberSec Club</span></h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-400">We are a community of cybersecurity enthusiasts dedicated to learning, practicing, and advancing the art of digital defense.</p>
          </motion.div>
        </div>
      </section>

      <section className="px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <motion.div {...fadeUp} className="grid gap-8 md:grid-cols-2">
            <Card className="border-white/5 bg-[#111]/60 backdrop-blur">
              <CardContent className="pt-6">
                <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-white"><Target className="h-6 w-6 text-emerald-400" /> Our Mission</h2>
                <p className="text-gray-400">To cultivate the next generation of cybersecurity professionals through hands-on training, competitive challenges, and a supportive community. We bridge the gap between academic learning and real-world security skills.</p>
              </CardContent>
            </Card>
            <Card className="border-white/5 bg-[#111]/60 backdrop-blur">
              <CardContent className="pt-6">
                <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-white"><Eye className="h-6 w-6 text-cyan-400" /> Our Vision</h2>
                <p className="text-gray-400">To become the leading student-run cybersecurity community, recognized for producing skilled professionals who protect organizations and individuals from digital threats worldwide.</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      <section className="px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <motion.div {...fadeUp} className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-white">Core Values</h2>
          </motion.div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Shield, title: 'Security', desc: 'We practice what we preach — security first in everything we do.', color: 'emerald' },
              { icon: Scale, title: 'Transparency', desc: 'Open governance, clear processes, and accountable leadership.', color: 'cyan' },
              { icon: Users, title: 'Community', desc: 'Together we learn, together we grow. No one gets left behind.', color: 'amber' },
              { icon: Lightbulb, title: 'Innovation', desc: 'Constantly exploring new threats, tools, and techniques.', color: 'purple' },
            ].map((v, i) => (
              <motion.div key={v.title} {...fadeUp} transition={{ delay: i * 0.1 }}>
                <Card className="h-full border-white/5 bg-[#111]/60 backdrop-blur">
                  <CardContent className="pt-6 text-center">
                    <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-${v.color}-500/10 border border-${v.color}-500/20`}>
                      <v.icon className={`h-7 w-7 text-${v.color}-400`} />
                    </div>
                    <h3 className="text-lg font-semibold text-white">{v.title}</h3>
                    <p className="mt-2 text-sm text-gray-500">{v.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <motion.div {...fadeUp} className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-white">Our Achievements</h2>
          </motion.div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { num: '12', label: 'CTF Competition Wins' },
              { num: '40+', label: 'Workshops & Seminars' },
              { num: '150+', label: 'Active Members' },
            ].map((a) => (
              <motion.div key={a.label} {...fadeUp}>
                <Card className="border-white/5 bg-[#111]/60 backdrop-blur text-center">
                  <CardContent className="pt-6">
                    <p className="text-4xl font-extrabold text-emerald-400">{a.num}</p>
                    <p className="mt-2 text-gray-500">{a.label}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-white/5 px-4 py-8 text-center text-xs text-gray-600">
        &copy; 2025 CyberSec Club. All rights reserved.
      </footer>
    </div>
  );
}
