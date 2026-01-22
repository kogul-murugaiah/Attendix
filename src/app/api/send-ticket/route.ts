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

        // Handle event display logic
        let displayEventText = eventName
        let isMultipleEvents = false

        if (Array.isArray(eventName)) {
            isMultipleEvents = eventName.length > 1
            displayEventText = eventName.join(', ')
        } else if (typeof eventName === 'string') {
            isMultipleEvents = eventName.includes(',') || eventName.includes('Multiple')
            displayEventText = eventName
        }

        // HTML Email Template - Cleaned up and customized
        const htmlContent = `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
                <div style="background: linear-gradient(135deg, #7c3aed, #0891b2); padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px;">${organizationName || 'Event Ticket'}</h1>
                    <p style="color: rgba(255,255,255,0.9); margin-top: 10px; font-size: 14px;">Registration Confirmed</p>
                </div>
                
                <div style="padding: 40px 30px; text-align: center;">
                    <h2 style="color: #1f2937; font-size: 20px; marginBottom: 10px;">Hello ${name || 'Participant'},</h2>
                    <p style="color: #4b5563; line-height: 1.6;">
                        This is your official ticket for your registration with <strong>${organizationName}</strong>.
                    </p>
                    
                    <p style="color: #4b5563; margin-top: 5px;">
                        Thank you for registering! We are excited to have you join us.
                    </p>

                    <div style="margin: 30px 0; padding: 20px; background: #f3f4f6; border-radius: 12px; display: inline-block;">
                        <p style="margin: 0; color: #374151; font-weight: 600;">Ticket Code:</p>
                        <p style="margin: 5px 0 0 0; font-family: monospace; font-size: 24px; font-weight: 700; color: #7c3aed; letter-spacing: 2px;">
                            ${participantCode}
                        </p>
                    </div>

                    <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
                        <strong>Note:</strong> Your QR Code ticket is attached to this email. 
                        <br>
                        Please download and present it at the entrance for check-in.
                    </p>
                </div>
                
                <div style="background-color: #f9fafb; padding: 20px; text-align: center;">
                    <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                        Powered by <strong style="color: #7c3aed;">Attendix</strong>
                    </p>
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
        sendSmtpEmail.subject = `Your Ticket for ${organizationName}`
        sendSmtpEmail.sender = {
            name: organizationName || 'Attendix',
            email: process.env.BREVO_SENDER_EMAIL || 'noreply@yourbusiness.com'
        }
        sendSmtpEmail.to = [{ email: email, name: name || 'Participant' }]
        sendSmtpEmail.htmlContent = htmlContent

        // Attach QR code with dynamic name
        const sanitizedName = (name || 'ticket').replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_');
        sendSmtpEmail.attachment = [{
            content: qrCodeBase64,
            name: `${sanitizedName}.png`,
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
