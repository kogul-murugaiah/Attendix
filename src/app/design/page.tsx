"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MoveRight, Play, Settings, User } from "lucide-react";

export default function DesignSystemPage() {
    return (
        <div className="min-h-screen bg-background p-12 text-foreground space-y-12">

            {/* Header */}
            <div className="space-y-4">
                <h1 className="text-5xl font-heading font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                    Attendix Design System
                </h1>
                <p className="text-xl text-muted-foreground font-sans max-w-2xl">
                    The new "Tech Glass" vocabulary. Deep space backgrounds, neon accents, and functional typography.
                </p>
            </div>

            {/* Colors Section */}
            <section className="space-y-6">
                <h2 className="text-3xl font-heading font-bold">Colors & Palette</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    <ColorSwatch name="Primary" variable="bg-primary" />
                    <ColorSwatch name="Accent" variable="bg-accent" />
                    <ColorSwatch name="Secondary" variable="bg-secondary" />
                    <ColorSwatch name="Destructive" variable="bg-destructive" />
                    <ColorSwatch name="Background" variable="bg-background" border />
                    <ColorSwatch name="Card" variable="bg-card" border />
                </div>
            </section>

            {/* Typography Section */}
            <section className="space-y-6">
                <h2 className="text-3xl font-heading font-bold">Typography</h2>
                <div className="grid md:grid-cols-2 gap-8">
                    <Card className="p-6 space-y-4 border-l-4 border-l-primary/50">
                        <Badge variant="outline">Headings (Space Grotesk)</Badge>
                        <div className="space-y-2">
                            <h1 className="text-4xl font-heading font-bold">Heading 1</h1>
                            <h2 className="text-3xl font-heading font-bold">Heading 2</h2>
                            <h3 className="text-2xl font-heading font-semibold">Heading 3</h3>
                        </div>
                    </Card>
                    <Card className="p-6 space-y-4 border-l-4 border-l-accent/50">
                        <Badge variant="outline">Body (Inter)</Badge>
                        <div className="space-y-4 font-sans text-muted-foreground">
                            <p className="leading-relaxed">
                                The quick brown fox jumps over the lazy dog. Efficiency is key in attendance management.
                                We prioritize <strong>clarity</strong>, <em>speed</em>, and <u>precision</u>.
                            </p>
                            <p className="text-sm">Small text for captions or metadata.</p>
                        </div>
                    </Card>
                </div>
            </section>

            {/* Components Section */}
            <section className="space-y-6">
                <h2 className="text-3xl font-heading font-bold">Core Components</h2>
                <div className="grid md:grid-cols-3 gap-6">

                    {/* Card 1: Standard */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Glass Card</CardTitle>
                            <CardDescription>Default container style</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-400">Content floats on a semi-transparent layer with a subtle gradient border.</p>
                        </CardContent>
                        <CardFooter className="flex gap-2">
                            <Button>Action</Button>
                            <Button variant="ghost">Cancel</Button>
                        </CardFooter>
                    </Card>

                    {/* Card 2: Interactive */}
                    <Card className="group hover:border-primary/50 transition-all duration-300">
                        <CardHeader>
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Play className="w-5 h-5 text-primary fill-primary" />
                            </div>
                            <CardTitle>Interactive State</CardTitle>
                            <CardDescription>Hover me to see effects</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col gap-2">
                                <div className="h-2 w-full bg-secondary rounded overflow-hidden">
                                    <div className="h-full bg-primary w-2/3 animate-pulse"></div>
                                </div>
                                <span className="text-xs text-right text-primary">Processing...</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Card 3: Dashboard Widget */}
                    <Card className="border-accent/20 bg-accent/5">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-accent">Total Scans</CardTitle>
                            <User className="h-4 w-4 text-accent" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-heading font-bold text-white">1,248</div>
                            <p className="text-xs text-accent/70 mt-1 flex items-center gap-1">
                                <MoveRight className="w-3 h-3" /> +12% from last hour
                            </p>
                        </CardContent>
                    </Card>

                </div>
            </section>

            {/* Buttons */}
            <section className="space-y-6">
                <h2 className="text-3xl font-heading font-bold">Buttons & Inputs</h2>
                <div className="flex flex-wrap gap-4 items-center">
                    <Button>Primary Action</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="destructive">Destructive</Button>
                    <Button className="rounded-full">Rounded Full</Button>
                    <Button size="icon" variant="outline"><Settings className="w-4 h-4" /></Button>
                </div>
            </section>

        </div>
    );
}

function ColorSwatch({ name, variable, border = false }: { name: string, variable: string, border?: boolean }) {
    return (
        <div className="space-y-2 group">
            <div className={`h-24 rounded-xl ${variable} ${border ? 'border border-white/20' : ''} shadow-lg group-hover:scale-105 transition-transform`} />
            <div className="space-y-1">
                <p className="font-heading font-bold">{name}</p>
                <p className="text-xs font-mono text-muted-foreground">{variable}</p>
            </div>
        </div>
    )
}
