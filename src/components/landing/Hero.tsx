import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Star, ShieldCheck, Zap } from "lucide-react"

export function Hero() {
    return (
        <section className="relative pt-40 pb-20 px-6 min-h-[90vh] flex flex-col items-center justify-center text-center overflow-hidden">
            {/* Background Effects: Grid + Spotlight */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
            <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-purple-500/10 via-transparent to-transparent pointer-events-none"></div>
            <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-purple-600/20 rounded-[100%] blur-[100px] pointer-events-none" />

            {/* Content */}
            <div className="z-10 max-w-5xl space-y-8 animate-in fade-in zoom-in duration-700 slide-in-from-bottom-10">

                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-4 hover:border-purple-500/30 transition-colors">
                    <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-sm font-medium text-gray-300">v2.0 is now live</span>
                </div>

                <h1 className="text-6xl md:text-8xl font-bold tracking-tight leading-tight">
                    Events managed <br />
                    <span className="bg-clip-text text-transparent bg-gradient-to-br from-white via-gray-200 to-gray-500">
                        like magic.
                    </span>
                </h1>

                <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                    The complete operating system for modern events. Registration, check-in, and analytics in one beautiful dashboard.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
                    <Link href="/onboarding">
                        <Button size="lg" className="h-14 px-8 text-lg rounded-full bg-white text-black hover:bg-gray-200 transition-all hover:scale-105 shadow-[0_0_50px_-10px_rgba(255,255,255,0.3)] font-medium">
                            Create Your Organization
                            <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                    </Link>
                    <Link href="#features">
                        <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 text-white transition-all">
                            View Features
                        </Button>
                    </Link>
                </div>

                {/* Social Proof / Trust Badges */}
                <div className="pt-20 space-y-6">
                    <p className="text-sm text-gray-500 font-medium uppercase tracking-widest">Trusted by next-gen organizations</p>
                    <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                        {/* Placeholder Logos */}
                        <div className="flex items-center gap-2 text-xl font-bold text-white"><ShieldCheck className="w-6 h-6" /> SecureEvents</div>
                        <div className="flex items-center gap-2 text-xl font-bold text-white"><Zap className="w-6 h-6" /> FastTrack</div>
                        <div className="flex items-center gap-2 text-xl font-bold text-white"><Star className="w-6 h-6" /> EliteClub</div>
                    </div>
                </div>
            </div>
        </section>
    )
}
