import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ContactModal } from "@/components/landing/ContactModal"

const tiers = [
    {
        name: "Starter",
        price: "₹0",
        description: "Perfect for small clubs and meetups.",
        features: [
            "Up to 100 participants/event",
            "1 Active Event",
            "Basic QR Scanning",
            "Email Support",
            "Standard Analytics"
        ],
        cta: "Start for Free",
        popular: false
    },
    {
        name: "Basic",
        price: "₹499",
        period: "/mo",
        description: "For regular events and workshops.",
        features: [
            "Up to 500 participants/event",
            "10 Active Events",
            "Custom Branding",
            "Priority Email Support",
            "Advanced Export (Excel/CSV)"
        ],
        cta: "Get Started",
        popular: false
    },
    {
        name: "Pro",
        price: "₹1,499",
        period: "/mo",
        description: "For growing organizations and colleges.",
        features: [
            "Up to 2,000 participants/event",
            "Unlimited Events",
            "Custom Branding",
            "Priority Email Support",
            "Advanced Export (Excel/CSV)",
            "Multi-device Scanning"
        ],
        cta: "Get Started",
        popular: true
    },
    {
        name: "Enterprise",
        price: "Custom",
        description: "For large festivals and universities.",
        features: [
            "Unlimited Participants",
            "Unlimited Events",
            "Dedicated Server Instance",
            "SLA Guarantee",
            "Custom API Access",
            "24/7 Phone Support"
        ],
        cta: "Contact Sales",
        popular: false
    }
]

export function Pricing() {
    return (
        <section id="pricing" className="py-24 px-6 bg-black/20">
            <div className="max-w-7xl mx-auto space-y-12">
                <div className="text-center space-y-4">
                    <h2 className="text-3xl md:text-5xl font-bold text-white">Simple, transparent pricing</h2>
                    <p className="text-gray-400 text-lg">No hidden fees. Cancel anytime.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {tiers.map((tier) => (
                        <div
                            key={tier.name}
                            className={`relative p-8 rounded-3xl border backdrop-blur-sm flex flex-col transition-all duration-300 group hover:shadow-2xl ${tier.popular
                                ? "bg-white/5 border-purple-500/50 shadow-purple-500/10 scale-105 z-10 hover:shadow-purple-500/20"
                                : "bg-black/20 border-white/10 hover:bg-white/5 hover:border-white/20 hover:scale-[1.02]"
                                }`}
                        >
                            {/* Hover Glow Effect */}
                            <div className={`absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl pointer-events-none ${tier.popular ? 'from-purple-500/10' : ''}`} />
                            {tier.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 text-xs font-bold text-white uppercase tracking-wider">
                                    Most Popular
                                </div>
                            )}

                            <div className="mb-8">
                                <h3 className="text-lg font-medium text-gray-400 mb-2">{tier.name}</h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-bold text-white">{tier.price}</span>
                                    {tier.period && <span className="text-gray-500">{tier.period}</span>}
                                </div>
                                <p className="text-sm text-gray-400 mt-4">{tier.description}</p>
                            </div>

                            <ul className="space-y-4 mb-8 flex-1">
                                {tier.features.map((feature) => (
                                    <li key={feature} className="flex items-start gap-3 text-sm text-gray-300">
                                        <Check className="w-5 h-5 text-purple-500 shrink-0" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            {tier.name === "Enterprise" ? (
                                <ContactModal subject="Enterprise Inquiry" className="w-full" asChild>
                                    <Button
                                        className={`w-full rounded-xl py-6 ${tier.popular
                                            ? "bg-white text-black hover:bg-gray-200"
                                            : "bg-white/10 hover:bg-white/20 text-white"
                                            }`}
                                    >
                                        {tier.cta}
                                    </Button>
                                </ContactModal>
                            ) : (
                                <Link href="/register" className="w-full">
                                    <Button
                                        className={`w-full rounded-xl py-6 ${tier.popular
                                            ? "bg-white text-black hover:bg-gray-200"
                                            : "bg-white/10 hover:bg-white/20 text-white"
                                            }`}
                                    >
                                        {tier.cta}
                                    </Button>
                                </Link>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
