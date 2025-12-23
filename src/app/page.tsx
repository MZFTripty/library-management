'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Library,
  LayoutDashboard,
  UserCircle,
  BookOpen,
  Search,
  Brain,
  Users,
  ArrowRight,
  Github,
  Twitter,
  Linkedin,
  ChevronRight,
  ChevronLeft,
  Trophy,
  Globe,
  Clock,
  Sparkles,
  Zap,
  Heart
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { User } from '@/lib/database.types'

/* -------------------------------------------------------------------------------------------------
 * Navbar Component
 * -----------------------------------------------------------------------------------------------*/
function HomeNavbar({ user }: { user: User | null }) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-200 dark:border-white/10">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 group-hover:scale-105 transition-transform shadow-lg shadow-indigo-500/20">
            <Library className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-white dark:to-gray-400">
            LibraryMS
          </span>
        </Link>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link href="/dashboard">
                <Button variant="ghost" className="font-medium hover:bg-indigo-50 dark:hover:bg-white/5">
                  <LayoutDashboard className="w-4 h-4 mr-2 text-indigo-600 dark:text-indigo-400" />
                  Dashboard
                </Button>
              </Link>
              <Link href="/settings">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg cursor-pointer hover:scale-105 transition-transform">
                  {user.name?.[0]?.toUpperCase() || 'U'}
                </div>
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" className="font-medium">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25">
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

/* -------------------------------------------------------------------------------------------------
 * Hero Section (Carousel)
 * -----------------------------------------------------------------------------------------------*/
// Using reliable, standard Unsplash URLs
const slides = [
  {
    title: "Discover Your Next Great Read",
    subtitle: "Explore thousands of titles in our state-of-the-art digital library system.",
    image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&q=80&w=2428", // Swapped to a highly reliable image
    icon: BookOpen
  },
  {
    title: "Classic Collections",
    subtitle: "Immerse yourself in timeless classics and rare manuscripts.",
    image: "https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&q=80&w=2688",
    icon: Library
  },
  {
    title: "Modern Study Spaces",
    subtitle: "Find your perfect quiet corner for focus and productivity.",
    image: "https://images.unsplash.com/photo-1568667256549-094345857637?auto=format&fit=crop&q=80&w=2515",
    icon: Users
  },
  {
    title: "Aesthetic Environment",
    subtitle: "A beautiful space designed to inspire your imagination.",
    image: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&q=80&w=2670",
    icon: Brain
  },
  {
    title: "Endless Resources",
    subtitle: "Access a world of knowledge at your fingertips.",
    image: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&q=80&w=2670",
    icon: BookOpen
  }
]

function HeroCarousel() {
  const [current, setCurrent] = useState(0)

  // Auto-scroll effect - No pause on hover as per request
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const nextSlide = useCallback(() => {
    setCurrent((prev) => (prev + 1) % slides.length)
  }, [])

  const prevSlide = useCallback(() => {
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length)
  }, [])

  return (
    <div className="relative h-[600px] w-full overflow-hidden mt-20 group bg-gray-900">
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 flex items-center justify-center ${index === current ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
        >
          {/* Background Image with Overlay */}
          <div className="absolute inset-0">
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50" /> {/* Dark overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-90" />
          </div>

          {/* Pattern Overlay */}
          <div className="absolute inset-0 opacity-10 pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}
          />

          {/* Content */}
          <div className="relative z-20 text-center px-6 max-w-4xl mx-auto space-y-8">
            <div className="inline-flex p-4 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 mb-4 animate-float shadow-2xl">
              <slide.icon className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-tight drop-shadow-2xl">
              {slide.title}
            </h1>
            <p className="text-lg md:text-xl text-indigo-50 max-w-2xl mx-auto leading-relaxed drop-shadow-lg font-medium">
              {slide.subtitle}
            </p>
            <div className="flex gap-4 justify-center pt-4">
              <Link href="/catalog">
                <Button size="lg" variant="outline" className="border-white/30 text-pink-500 hover:text-white hover:bg-white/10 hover:border-white h-14 px-8 text-lg font-bold backdrop-blur-sm shadow-lg">
                  Browse Catalog
                </Button>
              </Link>
              <Link href="/member/requests">
                <Button size="lg" variant="outline" className="border-white/30 text-pink-500 hover:text-white hover:bg-white/10 hover:border-white h-14 px-8 text-lg font-bold backdrop-blur-sm shadow-lg">
                  My Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows - Kept for manual control but auto-scroll is dominant */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 duration-300"
        aria-label="Previous Slide"
      >
        <ChevronLeft className="w-8 h-8" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 duration-300"
        aria-label="Next Slide"
      >
        <ChevronRight className="w-8 h-8" />
      </button>

      {/* Indicators */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-3 z-30">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrent(idx)}
            className={`h-2 rounded-full transition-all duration-300 shadow-lg ${idx === current ? 'bg-white w-12' : 'bg-white/40 w-2 hover:bg-white/80'
              }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------------------------------
 * Partition Stats Section
 * -----------------------------------------------------------------------------------------------*/
function StatsDivider() {
  return (
    <section className="bg-gradient-to-br from-indigo-100 to-pink-100 dark:bg-gradient-to-br dark:from-indigo-900 dark:to-pink-900 py-20 border-b border-gray-100 dark:border-white/5 relative z-20 overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute left-0 top-0 w-64 h-64 bg-indigo-50 dark:bg-indigo-900/10 rounded-full blur-3xl opacity-50 -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute right-0 bottom-0 w-64 h-64 bg-pink-50 dark:bg-pink-900/10 rounded-full blur-3xl opacity-50 translate-x-1/2 translate-y-1/2"></div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { label: "Active Readers", value: "10k+", icon: Users, color: "from-blue-500 to-cyan-400", bg: "group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20" },
            { label: "Book Collection", value: "50k+", icon: BookOpen, color: "from-indigo-500 to-violet-500", bg: "group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20" },
            { label: "Awards Won", value: "25+", icon: Trophy, color: "from-amber-400 to-orange-500", bg: "group-hover:bg-amber-50 dark:group-hover:bg-amber-900/20" },
            { label: "Global Reach", value: "100+", icon: Globe, color: "from-pink-500 to-rose-500", bg: "group-hover:bg-pink-50 dark:group-hover:bg-pink-900/20" },
          ].map((stat, idx) => (
            <div key={idx} className={`flex flex-col items-center justify-center p-8 rounded-3xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 transition-all duration-300 group hover:-translate-y-2 hover:shadow-xl dark:hover:shadow-indigo-500/10 ${stat.bg}`}>
              <div className={`p-4 rounded-2xl bg-gradient-to-br ${stat.color} shadow-lg shadow-indigo-500/20 mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                <stat.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 mb-2">{stat.value}</h3>
              <p className="font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest text-xs group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------------------------------
 * About Section
 * -----------------------------------------------------------------------------------------------*/
function AboutSection() {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Fixed Background Image */}
      <div
        className="absolute inset-0 bg-fixed bg-cover bg-center z-0"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&q=80&w=2670')" }}
      />
      {/* Dark Overlay for readability */}
      <div className="absolute inset-0 bg-black/80 z-0 backdrop-blur-[2px]" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Header Info - Clean Text (No Glassy Box to match User Request) */}
        <div className="text-center mb-16 space-y-4">
          <span className="inline-block animate-bounce text-indigo-400 font-bold tracking-wider uppercase text-sm bg-indigo-900/50 px-4 py-1.5 rounded-full backdrop-blur-sm border border-indigo-500/30">Why Choose Us</span>
          <h2 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg mt-6">
            Redefining the Library Experience
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed font-medium">
            Experience a modern, seamless way to manage your reading journey with our cutting-edge platform.
          </p>
        </div>

        {/* Cards - Colorful & Animated */}
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { title: "Smart Catalog", desc: "Instant search and categorization for thousands of books.", icon: Search, color: "from-blue-500 to-cyan-500" },
            { title: "Digital Tracking", desc: "Keep track of due dates, fines, and history effortlessly.", icon: LayoutDashboard, color: "from-indigo-500 to-purple-500" },
            { title: "AI Assistant", desc: "Get personalized recommendations powered by advanced AI.", icon: Brain, color: "from-fuchsia-500 to-pink-500" },
          ].map((feature, idx) => (
            <div key={idx} className="group relative p-8 rounded-3xl bg-white dark:bg-gray-900 overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl">
              {/* Animated Gradient Border Effect */}
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${feature.color} -z-10 blur-xl`} />

              {/* Content Container (Keeps opacity but allows gradient glow) */}
              <div className="relative z-10">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 shadow-lg`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{feature.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                  {feature.desc}
                </p>
              </div>

              {/* Subtle border that lights up */}
              <div className={`absolute inset-0 border-2 border-transparent group-hover:border-indigo-500/20 rounded-3xl transition-colors duration-500 pointer-events-none`} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------------------------------
 * Footer
 * -----------------------------------------------------------------------------------------------*/
function Footer() {
  return (
    <footer className="bg-white dark:bg-black border-t border-gray-200 dark:border-white/10 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-2 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-600">
                <Library className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">LibraryMS</span>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-lg max-w-md">
              Empowering readers and institutions with modern tools for knowledge management.
            </p>
            <div className="flex gap-4">
              {[Twitter, Github, Linkedin].map((Icon, i) => (
                <a key={i} href="#" className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-indigo-600 hover:text-white transition-colors">
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-6">Platform</h4>
            <ul className="space-y-4 text-gray-500 dark:text-gray-400">
              {['Browse Catalog', 'My Dashboard', 'AI Assistant', 'New Arrivals'].map(item => (
                <li key={item}><a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">{item}</a></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-6">Company</h4>
            <ul className="space-y-4 text-gray-500 dark:text-gray-400">
              {['About Us', 'Careers', 'Contact', 'Privacy Policy'].map(item => (
                <li key={item}><a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">{item}</a></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-200 dark:border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            © 2025 LibraryMS. All rights reserved.
          </p>
          <div className="flex gap-8 text-sm text-gray-500 dark:text-gray-400">
            <a href="#" className="hover:text-gray-900 dark:hover:text-white">Terms</a>
            <a href="#" className="hover:text-gray-900 dark:hover:text-white">Privacy</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

/* -------------------------------------------------------------------------------------------------
 * Main Page Component
 * -----------------------------------------------------------------------------------------------*/
export default function HomePage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Fetch public user data
        const { data } = await (supabase.from('users') as any)
          .select('*')
          .eq('id', user.id)
          .single()
        setUser(data)
      }
      setLoading(false)
    }
    checkUser()
  }, [])

  if (loading) return null // Or a glassy loader

  return (
    <div className="min-h-screen bg-white dark:bg-black font-sans selection:bg-indigo-500/30">
      <HomeNavbar user={user} />
      <HeroCarousel />
      {/* Added Partition Here */}
      <StatsDivider />
      <AboutSection />
      <Footer />
    </div>
  )
}
