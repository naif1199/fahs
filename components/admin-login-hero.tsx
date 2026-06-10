"use client";

import Image from "next/image";
import { LoginForm } from "@/components/login-form";

const videoUrl = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260406_094145_4a271a6c-3869-4f1c-8aa7-aeb0cb227994.mp4";

export function AdminLoginHero({ className = "" }: { className?: string }) {
  return (
    <main className={`relative grid h-screen min-h-screen place-items-center overflow-hidden bg-black text-white ${className}`} dir="rtl">
      <video className="fixed inset-0 z-0 h-full w-full object-cover" src={videoUrl} autoPlay muted loop playsInline />
      <div className="bottom-blur-mask pointer-events-none fixed inset-0 z-[1] backdrop-blur-xl" />
      <div className="pointer-events-none fixed inset-0 z-[2] bg-black/18" />

      <section className="relative z-10 w-full max-w-3xl px-5">
        <div className="animate-blur-fade-up rounded-[36px] border border-white/18 bg-white/[0.075] p-6 shadow-[0_32px_110px_rgba(0,0,0,.38)] backdrop-blur-md sm:p-8 md:p-10" style={{ animationDelay: "0ms" }}>
          <div className="mx-auto mb-8 max-w-2xl rounded-[30px] border border-white/16 bg-white/18 px-6 py-7 shadow-[inset_0_1px_1px_rgba(255,255,255,.22),0_22px_70px_rgba(0,0,0,.28)] backdrop-blur-xl md:px-10 md:py-9">
            <Image
              src="/logo-mark.png"
              alt="شعار الفاحص الذكي"
              width={900}
              height={300}
              priority
              className="mx-auto h-auto w-full max-w-[620px] object-contain drop-shadow-[0_12px_28px_rgba(0,0,0,.45)]"
            />
          </div>

          <div className="mx-auto max-w-md">
            <LoginForm cinematic />
          </div>
        </div>
      </section>
    </main>
  );
}
