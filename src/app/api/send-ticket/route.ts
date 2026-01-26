import { NextRequest, NextResponse } from 'next/server'
import * as brevo from '@getbrevo/brevo'
import QRCode from 'qrcode'
import { createAdminClient } from '@/lib/supabase/admin'

const DEFAULT_EMAIL_TEMPLATE = `Dear {name},

Thank you for registering with {org_name}! We are excited to have you join us. 

Your unique participant code is:
{code_box}

Please find your QR code ticket attached to this email. Present it at the venue for entry.

See you at the event!`;

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { participantId, email, name, eventName, participantCode, organizationName, organizationId } = body

        if (!email || !participantCode) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Fetch organization's custom template if organizationId is provided
        let emailBody = DEFAULT_EMAIL_TEMPLATE;
        if (organizationId) {
            const supabase = createAdminClient();
            const { data: org } = await supabase
                .from('organizations')
                .select('email_template')
                .eq('id', organizationId)
                .single();

            if (org?.email_template) {
                emailBody = org.email_template;
            }
        }

        // Styled Ticket Code Box HTML
        const ticketBoxHTML = `
            <div style="margin: 20px 0; text-align: center;">
                <div style="padding: 15px 25px; background: #1a1a24; border-radius: 12px; display: inline-block; border: 1px solid #7c3aed40; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                    <p style="margin: 0; color: #9ca3af; font-weight: 600; font-size: 10px; text-transform: uppercase; letter-spacing: 2px;">Ticket Code</p>
                    <p style="margin: 5px 0 0 0; font-family: 'Courier New', monospace; font-size: 24px; font-weight: 700; color: #a78bfa; letter-spacing: 3px;">
                        ${participantCode}
                    </p>
                </div>
            </div>
        `;

        // Replace template variables
        let formattedBody = emailBody
            .replace(/\{name\}/g, name || 'Participant')
            .replace(/\{org_name\}/g, organizationName || 'Event');

        // Handle {code_box} specifically
        if (formattedBody.includes('{code_box}')) {
            formattedBody = formattedBody.replace(/\{code_box\}/g, ticketBoxHTML);
        } else {
            // Fallback: append box at end if placeholder is missing, but before closing
            formattedBody = formattedBody + '\n\n' + ticketBoxHTML;
        }

        // Also allow raw {code} if they just want the text
        formattedBody = formattedBody.replace(/\{code\}/g, participantCode);

        // Generate QR Code as buffer (for attachment)
        const qrCodeBuffer = await QRCode.toBuffer(participantCode)
        const qrCodeBase64 = qrCodeBuffer.toString('base64')

        // HTML Email Template - Wraps the custom body in a professional container
        const htmlContent = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #f0f0f0; border-radius: 16px; overflow: hidden; background-color: #ffffff; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">
                <div style="background: linear-gradient(135deg, #7c3aed, #0891b2); padding: 40px 20px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">${organizationName || 'Event Ticket'}</h1>
                    <div style="display: inline-block; margin-top: 15px; padding: 6px 16px; background: rgba(255,255,255,0.15); border-radius: 100px; color: white; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; backdrop-filter: blur(4px);">Registration Confirmed</div>
                </div>
                
                <div style="padding: 40px; background-color: #ffffff;">
                    <!-- Email Content Area -->
                    <div style="color: #374151; line-height: 1.8; font-size: 16px; white-space: pre-wrap;">${formattedBody}</div>

                    <!-- Professional Footer/Closing -->
                    <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #f3f4f6;">
                        <p style="margin: 0; font-size: 14px; color: #6b7280; font-weight: 500;">Best regards,</p>
                        <p style="margin: 4px 0 0 0; font-size: 18px; color: #7c3aed; font-weight: 800;">${organizationName} Team</p>
                    </div>

                    <div style="margin-top: 30px; padding: 15px; background-color: #f9fafb; border-radius: 12px; border-left: 4px solid #7c3aed;">
                        <p style="margin: 0; font-size: 12px; color: #6b7280; line-height: 1.5;">
                            <strong>Note:</strong> Your unique QR ticket is attached to this email. Please download it and keep it ready for scanning at the entrance.
                        </p>
                    </div>
                </div>
                
                <div style="background-color: #f3f4f6; padding: 25px; text-align: center;">
                    <p style="margin: 0; font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">
                        Powered by <a href="#" style="color: #7c3aed; text-decoration: none;">Attendix</a>
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

        const supabase = createAdminClient();

        try {
            // Send email
            const result = await apiInstance.sendTransacEmail(sendSmtpEmail)

            // Update status to sent
            if (participantId) {
                await supabase
                    .from('student_registrations')
                    .update({
                        email_status: 'sent',
                        email_sent_at: new Date().toISOString(),
                        email_error: null
                    })
                    .eq('id', participantId);
            }

            return NextResponse.json({ success: true, data: result })
        } catch (emailErr: any) {
            console.error('Email sending failed:', emailErr);

            // Mark as failed in DB but return success:true to not block the registration flow
            if (participantId) {
                await supabase
                    .from('student_registrations')
                    .update({
                        email_status: 'failed',
                        email_error: emailErr.message || 'Unknown error'
                    })
                    .eq('id', participantId);
            }

            // Still return 200/success so the UI doesn't show an error to the student
            return NextResponse.json({
                success: true,
                warning: 'Email queued for retry',
                error: emailErr.message
            });
        }

    } catch (err: any) {
        console.error('API error:', err)
        return NextResponse.json({
            error: err.message || 'Internal server error',
        }, { status: 500 })
    }
}
