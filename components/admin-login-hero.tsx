"use client";

import Image from "next/image";
import { useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, Clock, Menu, Play, Search, Star, User, X } from "lucide-react";
import { LoginForm } from "@/components/login-form";

const videoUrl = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260406_094145_4a271a6c-3869-4f1c-8aa7-aeb0cb227994.mp4";
const navLinks = ["Movies", "TV Series", "Editor's Pick", "Interviews", "User Reviews"];

export function AdminLoginHero({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <main className={`relative flex h-screen min-h-screen overflow-hidden bg-black text-white ${className}`} dir="ltr">
      <video className="fixed inset-0 z-0 h-full w-full object-cover" src={videoUrl} autoPlay muted loop playsInline />
      <div className="bottom-blur-mask pointer-events-none fixed inset-0 z-[1] backdrop-blur-xl" />

      <div className="relative z-10 flex h-full w-full flex-col">
        <nav className="relative z-50 flex items-center justify-between px-4 py-4 sm:px-6 md:px-12 md:py-6">
          <div className="animate-blur-fade-up text-xl font-semibold tracking-[0.28em] md:text-2xl" style={{ animationDelay: "0ms" }}>FAHS</div>

          <div className="hidden items-center gap-8 lg:flex">
            {navLinks.map((link, index) => (
              <a key={link} href="#" className="animate-blur-fade-up text-sm text-white/85 transition-colors hover:text-gray-300" style={{ animationDelay: `${100 + index * 50}ms` }}>{link}</a>
            ))}
          </div>

          <div className="hidden items-center gap-3 sm:flex">
            <button className="liquid-glass animate-blur-fade-up flex items-center gap-2 rounded-full px-4 py-2 text-sm md:px-6" style={{ animationDelay: "350ms" }}>
              Search <Search size={18} />
            </button>
            <button className="liquid-glass animate-blur-fade-up grid h-10 w-10 place-items-center rounded-full" style={{ animationDelay: "400ms" }} aria-label="Profile">
              <User size={18} />
            </button>
          </div>

          <button className="liquid-glass animate-blur-fade-up relative grid h-10 w-10 place-items-center rounded-full lg:hidden" style={{ animationDelay: "350ms" }} onClick={() => setOpen((value) => !value)} aria-label="Menu">
            <Menu className={`absolute transition-all duration-500 ease-out ${open ? "rotate-180 scale-50 opacity-0" : "rotate-0 scale-100 opacity-100"}`} size={20} />
            <X className={`absolute transition-all duration-500 ease-out ${open ? "rotate-0 scale-100 opacity-100" : "-rotate-180 scale-50 opacity-0"}`} size={20} />
          </button>
        </nav>

        <div className={`absolute inset-x-0 top-[72px] z-40 border-y border-gray-800 bg-gray-900/95 shadow-2xl backdrop-blur-lg transition-all duration-500 ease-out lg:hidden ${open ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-4 opacity-0"}`}>
          <div className="px-4 py-4 sm:px-6">
            {navLinks.map((link, index) => (
              <a key={link} href="#" className={`block rounded-lg px-3 py-3 text-sm text-white/90 transition-all duration-500 hover:bg-gray-800/50 ${open ? "translate-x-0 opacity-100" : "-translate-x-4 opacity-0"}`} style={{ transitionDelay: `${index * 50}ms` }}>{link}</a>
            ))}
            <div className="mt-3 flex gap-3 border-t border-gray-800 pt-4 sm:hidden">
              <button className="liquid-glass flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm">Search <Search size={18} /></button>
              <button className="liquid-glass grid h-10 w-10 place-items-center rounded-full"><User size={18} /></button>
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-4 top-24 z-10 flex justify-center sm:top-24 md:top-28">
          <Image src="/logo-mark.png" alt="الفاحص الذكي" width={760} height={240} priority className="animate-blur-fade-up h-auto w-full max-w-[360px] object-contain sm:max-w-[520px] md:max-w-[680px]" style={{ animationDelay: "250ms" }} />
        </div>

        <section className="relative z-10 flex flex-1 flex-col justify-end px-4 pb-8 sm:px-6 md:px-12 md:pb-16">
          <div className="flex flex-col items-end gap-8 md:flex-row">
            <div className="flex-1">
              <div className="animate-blur-fade-up mb-6 flex flex-wrap gap-3 text-xs text-white/85 sm:gap-6 sm:text-sm md:mb-8" style={{ animationDelay: "300ms" }}>
                <span className="flex items-center gap-2 font-medium"><Star size={16} className="fill-white sm:h-5 sm:w-5" />8.7/10 IMDB</span>
                <span className="flex items-center gap-2"><Clock size={16} />132 min</span>
                <span className="flex items-center gap-2"><Calendar size={16} />April, 2025</span>
              </div>
              <h1 className="animate-blur-fade-up mb-4 max-w-4xl text-3xl font-normal tracking-[-0.04em] sm:text-5xl md:mb-6 md:text-6xl lg:text-7xl" style={{ animationDelay: "400ms" }}>Step Through. Work Smarter.</h1>
              <p className="animate-blur-fade-up mb-6 max-w-2xl text-base text-gray-400 sm:text-lg md:mb-8 md:text-xl" style={{ animationDelay: "500ms" }}>A voyage through forgotten realms, where past and future intertwine.</p>
              <div className="flex flex-wrap items-start gap-3 sm:gap-4">
                <div className="animate-blur-fade-up" style={{ animationDelay: "600ms" }}>
                  <LoginForm cinematic />
                </div>
                <button className="liquid-glass animate-blur-fade-up flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-medium sm:px-8 sm:py-3" style={{ animationDelay: "700ms" }}>
                  Learn More
                </button>
                <button className="animate-blur-fade-up hidden items-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-medium text-black transition-colors hover:bg-gray-200 sm:flex sm:px-8 sm:py-3" style={{ animationDelay: "650ms" }}>
                  <Play size={18} className="fill-black" /> Watch Now
                </button>
              </div>
            </div>

            <div className="flex w-full gap-3 md:w-auto md:justify-end">
              <button className="liquid-glass animate-blur-fade-up flex items-center gap-2 rounded-full px-4 py-2.5 text-sm sm:px-6 sm:py-3" style={{ animationDelay: "800ms" }}><ChevronLeft size={18} />Previous</button>
              <button className="liquid-glass animate-blur-fade-up flex items-center gap-2 rounded-full px-4 py-2.5 text-sm sm:px-6 sm:py-3" style={{ animationDelay: "900ms" }}>Next<ChevronRight size={18} /></button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
