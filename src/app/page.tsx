import { Navbar } from "@/components/landing/Navbar"
import { Hero } from "@/components/landing/Hero"
import { Features } from "@/components/landing/Features"
import { Pricing } from "@/components/landing/Pricing"
import { Footer } from "@/components/landing/Footer"

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col [&~footer]:hidden selection:bg-purple-500/30">
      <Navbar />

      <main className="flex-1">
        <Hero />
        <Features />
        <Pricing />
      </main>

      <Footer />
    </div>
  )
}
