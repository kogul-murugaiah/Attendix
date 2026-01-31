import { NextRequest, NextResponse } from 'next/server'
import * as brevo from '@getbrevo/brevo'
import QRCode from 'qrcode'
import { createAdminClient } from '@/lib/supabase/admin'

const DEFAULT_EMAIL_TEMPLATE = `Dear {name},
Thank you for registering with {org_name}!
{event_details}
Your unique participant code is:
{code_box}
Please find your QR code ticket attached. Present it at the venue for entry.
See you at the event!`;

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { participantId, email, name, eventName, participantCode, organizationName, organizationId } = body

        if (!email || !participantCode) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const supabase = createAdminClient();

        // 1. Fetch Registered Events Details
        let eventDetailsHTML = '';
        try {
            const { data: regEvents, error: regError } = await supabase
                .from('event_registrations')
                .select(`
                    event_id,
                    events (
                        event_name,
                        venue,
                        event_datetime
                    )
                `)
                .eq('participant_id', participantId);

            if (regEvents && regEvents.length > 0) {
                const eventList = regEvents.map((re: any) => {
                    const e = Array.isArray(re.events) ? re.events[0] : re.events;
                    return e?.event_name;
                }).filter(Boolean);

                const firstEventData = Array.isArray(regEvents[0].events) ? regEvents[0].events[0] : regEvents[0].events;

                if (firstEventData) {
                    // Format Date & Time
                    const eventDate = new Date(firstEventData.event_datetime).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });
                    const eventTime = new Date(firstEventData.event_datetime).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                    });

                    eventDetailsHTML = `
                        <div style="margin: 15px 0;">
                            <p style="margin: 0 0 5px 0; font-size: 13px; color: #6b7280; font-weight: 700; text-transform: uppercase;">Registered Events</p>
                            <ul style="margin: 0; padding: 0; list-style-type: none;">
                                ${eventList.map((name: string) => `<li style="margin-bottom: 2px; color: #111827; font-size: 14px; font-weight: 500;"><span style="color: #7c3aed; margin-right: 6px;">•</span> ${name}</li>`).join('')}
                            </ul>
                            <div style="margin-top: 10px;">
                                <p style="margin: 0; font-size: 14px; color: #374151;">📍 <strong>Venue:</strong> ${firstEventData.venue}</p>
                                <p style="margin: 5px 0 0 0; font-size: 14px; color: #374151;">🕒 <strong>Time:</strong> ${eventDate}, ${eventTime}</p>
                            </div>
                        </div>
                    `;
                }
            }
        } catch (dbErr) {
            console.error('Error fetching event details for email:', dbErr);
        }

        // Fetch organization's custom template if organizationId is provided
        let emailBody = DEFAULT_EMAIL_TEMPLATE;
        if (organizationId) {
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
            <div style="margin: 15px 0; text-align: center;">
                <div style="padding: 10px 20px; background: #1a1a24; border-radius: 10px; display: inline-block; border: 1px solid #7c3aed40;">
                    <p style="margin: 0; color: #9ca3af; font-weight: 600; font-size: 10px; text-transform: uppercase; letter-spacing: 2px;">Ticket Code</p>
                    <p style="margin: 2px 0 0 0; font-family: 'Courier New', monospace; font-size: 20px; font-weight: 700; color: #a78bfa; letter-spacing: 3px;">
                        ${participantCode}
                    </p>
                </div>
            </div>
        `;

        // Replace template variables
        let formattedBody = emailBody
            .replace(/\{name\}/g, name || 'Participant')
            .replace(/\{org_name\}/g, organizationName || 'Event')
            .replace(/\{event_details\}/g, eventDetailsHTML);

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
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #f0f0f0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
                <div style="background: linear-gradient(135deg, #7c3aed, #0891b2); padding: 25px 20px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">${organizationName || 'Event Ticket'}</h1>
                    <div style="display: inline-block; margin-top: 10px; padding: 4px 12px; background: rgba(255,255,255,0.15); border-radius: 100px; color: white; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; backdrop-filter: blur(4px);">Registration Confirmed</div>
                </div>
                
                <div style="padding: 25px; background-color: #ffffff;">
                    <!-- Email Content Area -->
                    <div style="color: #374151; line-height: 1.5; font-size: 15px; white-space: pre-wrap;">${formattedBody}</div>

                    <!-- Professional Footer/Closing -->
                    <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #f3f4f6;">
                        <p style="margin: 0; font-size: 13px; color: #6b7280; font-weight: 500;">Best regards,</p>
                        <p style="margin: 2px 0 0 0; font-size: 16px; color: #7c3aed; font-weight: 800;">${organizationName} Team</p>
                    </div>

                    <div style="margin-top: 20px; padding: 12px; background-color: #f9fafb; border-radius: 10px; border-left: 4px solid #7c3aed;">
                        <p style="margin: 0; font-size: 11px; color: #6b7280; line-height: 1.4;">
                            <strong>Note:</strong> Your unique QR ticket is attached. Please keep it ready for scanning at the entrance.
                        </p>
                    </div>
                </div>
                
                <div style="background-color: #f3f4f6; padding: 15px; text-align: center;">
                    <p style="margin: 0; font-size: 10px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">
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
