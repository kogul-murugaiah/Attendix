import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col [&~footer]:hidden">
      {/* Hero Section */}
      <header className="flex items-center justify-between p-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-0">
          <div className="relative w-16 h-16">
            <Image
              src="/logo.png"
              alt="Attendix"
              fill
              className="object-contain"
              priority
            />
          </div>
          <span className="font-bold text-2xl bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400 -ml-3">Attendix</span>
        </div>
        <nav className="hidden md:flex gap-6 text-sm text-gray-400">
          <a href="#" className="hover:text-white transition-colors">Features</a>
          <a href="#" className="hover:text-white transition-colors">Pricing</a>
          <a href="#" className="hover:text-white transition-colors">Support</a>
        </nav>
        <div className="flex gap-4">
          <Link href="/login">
            <Button variant="ghost" className="text-gray-300 hover:text-white">Login</Button>
          </Link>
          <Link href="/register">
            <Button className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 border-0 rounded-full px-6">
              Get Started
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
        {/* Background Glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="z-10 max-w-3xl space-y-6">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-100 to-gray-400">
            Event Management, <br /> Reimagined for Everyone.
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
            The all-in-one platform for colleges, clubs, and corporate events.
            Manage registrations, track attendance with QR codes, and analyze data in real-time.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Link href="/onboarding">
              <Button size="lg" className="h-14 px-8 text-lg rounded-full bg-white text-black hover:bg-gray-200 transition-all hover:scale-105">
                Create Your Organization
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Landing Page Footer - Larger and more prominent */}
      <footer className="relative p-8 border-t border-white/10 text-center bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <p className="text-gray-400 text-sm">
            © 2026 Attendix. All rights reserved. | Developed by <span className="text-purple-400 font-medium">Kogul Murugaiah</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
