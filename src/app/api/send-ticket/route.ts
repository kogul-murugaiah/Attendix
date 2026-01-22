import { NextRequest, NextResponse } from 'next/server'
import * as brevo from '@getbrevo/brevo'
import QRCode from 'qrcode'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { participantId, email, name, eventName, participantCode, organizationName, eventDateTime, venue } = body

        if (!email || !participantCode) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Generate QR Code as both data URL (for display) and buffer (for attachment)
        const qrCodeDataUrl = await QRCode.toDataURL(participantCode)
        const qrCodeBuffer = await QRCode.toBuffer(participantCode)
        const qrCodeBase64 = qrCodeBuffer.toString('base64')

        // HTML Email Template - use data URL for inline display
        const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                <div style="background: linear-gradient(90deg, #8b5cf6, #06b6d4); padding: 20px; text-align: center;">
                    <h1 style="color: white; margin: 0;">${organizationName || 'Event Ticket'}</h1>
                </div>
                <div style="padding: 30px; text-align: center;">
                    <h2 style="color: #333;">Hello ${name || 'Participant'},</h2>
                    <p style="color: #666;">Here is your ticket for <strong>${eventName}</strong>.</p>
                    
                    <div style="background-color: #f9fafb; padding: 20px; margin: 20px 0; border-radius: 8px; display: inline-block;">
                        <img src="${qrCodeDataUrl}" alt="Ticket QR Code" style="width: 200px; height: 200px; display: block;" />
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
                    <p style="color: #999; font-size: 12px; margin-top: 10px;">
                        If the QR code doesn't display, please check the attached image.
                    </p>
                </div>
                <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #999;">
                    Powered by Attendix
                </div>
            </div>
        `

        // Initialize Brevo API
        const apiInstance = new brevo.TransactionalEmailsApi()
        apiInstance.setApiKey(
            brevo.TransactionalEmailsApiApiKeys.apiKey,
            process.env.BREVO_API_KEY!
        )

        // Prepare email with inline attachment
        const sendSmtpEmail = new brevo.SendSmtpEmail()
        sendSmtpEmail.subject = `Your Ticket for ${eventName}`
        sendSmtpEmail.sender = {
            name: organizationName || 'Attendix',
            email: process.env.BREVO_SENDER_EMAIL || 'noreply@yourbusiness.com'
        }
        sendSmtpEmail.to = [{ email: email, name: name || 'Participant' }]
        sendSmtpEmail.htmlContent = htmlContent

        // Attach QR code as inline image (Brevo automatically makes attachments available for CID referencing)
        sendSmtpEmail.attachment = [{
            content: qrCodeBase64,
            name: 'qrcode.png',
        }]

        // Send email
        const result = await apiInstance.sendTransacEmail(sendSmtpEmail)

        return NextResponse.json({ success: true, data: result })

    } catch (err: any) {
        console.error('Brevo email error:', err)
        return NextResponse.json({
            error: err.message || 'Failed to send email',
            details: err.response?.body || err
        }, { status: 500 })
    }
}
