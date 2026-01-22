import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"

const tiers = [
    {
        name: "Starter",
        price: "Free",
        description: "Perfect for small clubs and meetups.",
        features: [
            "Up to 100 participants/month",
            "1 Active Event",
            "Basic QR Scanning",
            "Email Support",
            "Standard Analytics"
        ],
        cta: "Start for Free",
        popular: false
    },
    {
        name: "Pro",
        price: "$29",
        period: "/mo",
        description: "For growing organizations and colleges.",
        features: [
            "Unlimited participants",
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
            "Dedicated Server Instance",
            "SLA Guarantee",
            "Custom API Access",
            "24/7 Phone Support",
            "White-label Solution",
            "On-site Assistance"
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {tiers.map((tier) => (
                        <div
                            key={tier.name}
                            className={`relative p-8 rounded-3xl border backdrop-blur-sm flex flex-col ${tier.popular
                                    ? "bg-white/5 border-purple-500/50 shadow-2xl shadow-purple-500/10 scale-105 z-10"
                                    : "bg-black/20 border-white/10"
                                }`}
                        >
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

                            <Button
                                className={`w-full rounded-xl py-6 ${tier.popular
                                        ? "bg-white text-black hover:bg-gray-200"
                                        : "bg-white/10 hover:bg-white/20 text-white"
                                    }`}
                            >
                                {tier.cta}
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
