import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles } from "lucide-react"

export function Hero() {
    return (
        <section className="relative pt-32 pb-20 px-6 min-h-[90vh] flex flex-col items-center justify-center text-center overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse delay-1000" />

            {/* Content */}
            <div className="z-10 max-w-4xl space-y-8 animate-in fade-in zoom-in duration-1000 slide-in-from-bottom-10">
                <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight">
                    Event Management, <br />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-cyan-400 to-emerald-400 animate-gradient-x">
                        Reimagined.
                    </span>
                </h1>

                <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                    The all-in-one platform for next-generation events. Manage registrations,
                    track attendance with instant QR codes, and gain powerful insights in real-time.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
                    <Link href="/onboarding">
                        <Button size="lg" className="h-14 px-8 text-lg rounded-full bg-white text-black hover:bg-gray-200 transition-all hover:scale-105 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]">
                            Create Your Organization
                            <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                    </Link>
                    <Link href="#features">
                        <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 text-white transition-all">
                            Explore Features
                        </Button>
                    </Link>
                </div>

                {/* Stats / Social Proof */}
                <div className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-8 opacity-60">
                    <div>
                        <div className="text-2xl font-bold text-white">10k+</div>
                        <div className="text-sm text-gray-500">Attendees</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-white">500+</div>
                        <div className="text-sm text-gray-500">Events Hosted</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-white">99.9%</div>
                        <div className="text-sm text-gray-500">Uptime</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-white">Zero</div>
                        <div className="text-sm text-gray-500">Paper Tickets</div>
                    </div>
                </div>
            </div>
        </section>
    )
}
