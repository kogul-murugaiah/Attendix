"use client"

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Area, ComposedChart } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const data = [
    { time: "09:00", attendance: 12 },
    { time: "09:30", attendance: 45 },
    { time: "10:00", attendance: 89 },
    { time: "10:30", attendance: 140 },
    { time: "11:00", attendance: 210 },
    { time: "11:30", attendance: 250 },
    { time: "12:00", attendance: 280 },
]

export function AnalyticsChart() {
    return (
        <Card className="col-span-1 md:col-span-3 border-border/50 bg-card/90 backdrop-blur-xl">
            <CardHeader>
                <CardTitle className="font-heading">Real-time Attendance</CardTitle>
                <CardDescription className="text-muted-foreground">Live check-in trends across all gates.</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data}>
                        <defs>
                            <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} vertical={false} />
                        <XAxis
                            dataKey="time"
                            stroke="var(--muted-foreground)"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="var(--muted-foreground)"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value}`}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "var(--card)",
                                border: "1px solid var(--border)",
                                borderRadius: "8px",
                                color: "var(--foreground)"
                            }}
                            labelStyle={{ color: "var(--muted-foreground)" }}
                        />
                        <Area
                            type="monotone"
                            dataKey="attendance"
                            stroke="none"
                            fillOpacity={1}
                            fill="url(#colorAttendance)"
                        />
                        <Line
                            type="monotone"
                            dataKey="attendance"
                            stroke="var(--primary)"
                            strokeWidth={3}
                            dot={false}
                            activeDot={{ r: 6, strokeWidth: 0, fill: "var(--accent)" }}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
