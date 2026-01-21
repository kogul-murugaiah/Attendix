import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { generateQRCode } from '@/lib/qr-code'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { participantId, email, name, eventName, participantCode, organizationName, eventDateTime, venue } = body

        if (!email || !participantCode) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Generate QR Code
        const qrCodeDataUrl = await generateQRCode(participantCode)

        // Basic HTML Email Template
        // Note: For production, consider using a proper email template library like react-email
        const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                <div style="background: linear-gradient(90deg, #8b5cf6, #06b6d4); padding: 20px; text-align: center;">
                    <h1 style="color: white; margin: 0;">${organizationName || 'Event Ticket'}</h1>
                </div>
                <div style="padding: 30px; text-align: center;">
                    <h2 style="color: #333;">Hello ${name || 'Participant'},</h2>
                    <p style="color: #666;">Here is your ticket for <strong>${eventName}</strong>.</p>
                    
                    <div style="background-color: #f9fafb; padding: 20px; margin: 20px 0; border-radius: 8px; display: inline-block;">
                        <img src="${qrCodeDataUrl}" alt="Ticket QR Code" style="width: 200px; height: 200px;" />
                        <p style="font-family: monospace; font-size: 18px; font-weight: bold; margin-top: 10px; color: #333;">${participantCode}</p>
                    </div>

                    <div style="text-align: left; margin-top: 20px; color: #555;">
                        <p><strong>Event:</strong> ${eventName}</p>
                        <p><strong>Date:</strong> ${eventDateTime ? new Date(eventDateTime).toLocaleString() : 'TBA'}</p>
                        <p><strong>Venue:</strong> ${venue || 'TBA'}</p>
                    </div>

                    <p style="color: #666; font-size: 14px; margin-top: 30px;">
                        Please present this QR code at the entrance for check-in.
                    </p>
                </div>
                <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #999;">
                    Powered by Attendix
                </div>
            </div>
        `

        let data;
        let error;

        if (process.env.RESEND_API_KEY) {
            const result = await resend.emails.send({
                from: 'Attendix <onboarding@resend.dev>', // Default Resend testing domain
                to: email,
                subject: `Your Ticket for ${eventName}`,
                html: htmlContent,
            })
            data = result.data
            error = result.error
        } else {
            console.log('[Mock Email] Would have sent email to:', email);
            console.log('[Mock Email] Subject:', `Your Ticket for ${eventName}`);
            // Mock success response if no API key
            data = { id: 'mock-email-id' }
        }

        if (error) {
            console.error('Resend API Error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, data })

    } catch (err: any) {
        console.error('Send ticket error:', err)
        return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
    }
}
