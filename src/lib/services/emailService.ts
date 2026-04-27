
'use server';

import { Resend } from 'resend';

// Use environment variable for the API key.
// For this prototype, we'll use the key directly as requested.
// In a production app, this MUST be an environment variable.
const resendApiKey = process.env.RESEND_API_KEY || "re_KVFiWuoX_EHSiAqBEeCaNugpAHjnWXsxC";
const resend = new Resend(resendApiKey);

// Re-usable email sending function using Resend SDK
export async function sendEmail(mailOptions: { to: string | string[]; subject: string; html: string; }) {
  if (!resendApiKey) {
    console.error('[emailService] RESEND_API_KEY is not configured.');
    return { success: false, error: 'Email service is not available.' };
  }
  
  try {
    const { data, error } = await resend.emails.send({
      from: 'noreply@assesly.com', // Changed from 'Assesly <onboarding@resend.dev>'
      to: mailOptions.to,
      subject: mailOptions.subject,
      html: mailOptions.html,
    });

    if (error) {
      console.error('[emailService] Resend API Error:', error);
      return { success: false, error: error.message };
    }
    
    console.log('[emailService] Email sent successfully via Resend:', data);
    return { success: true, data };
  } catch (error: any) {
    console.error('[emailService] Error sending email with Resend:', error);
    return { success: false, error: 'Failed to send email.' };
  }
}

export async function sendInvitationEmail({ to, inviterName, formName, formLink }: { to: string; inviterName: string; formName: string; formLink: string; }) {
  const subject = `You've been invited to collaborate on "${formName}"`;
  const html = `
  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <h2 style="color: #D8130E;">Collaboration Invitation</h2>
    <p>Hello,</p>
    <p>
      <strong>${inviterName}</strong> has invited you to collaborate on the form:
      <strong>"${formName}"</strong> on 
      <a href="https://assesly.com" target="_blank" style="color: #D8130E; text-decoration: none; font-weight: bold;">
        Assesly.com
      </a>
    </p>
    <p>Click the button below to accept the invitation and start collaborating.</p>
    <a href="${formLink}" style="display: inline-block; padding: 12px 24px; font-size: 16px; color: #fff; background-color: #D8130E; text-decoration: none; border-radius: 5px;">
      Accept Invitation
    </a>
    <p>If you were not expecting this invitation, you can safely ignore this email.</p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
    <p style="font-size: 12px; color: #777;">
      This email was sent from   
      <a href="https://assesly.com" target="_blank" style="color: #D8130E; text-decoration: none; font-weight: bold;">
        Assesly.com
      </a>
       Please do not reply directly to this email.
    </p>
  </div>
`;


  return sendEmail({ to, subject, html });
}


export async function sendEmailChangeConfirmationEmail(to: string) {
   const mailOptions = {
      to: to,
      subject: 'Your Assesly Email Has Been Successfully Changed',
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2>Assesly Account Update</h2>
          <p>This is a confirmation that the email address for your Assesly account has been successfully changed to this address.</p>
          <p>If you did not authorize this change, please contact our support team immediately.</p>
        </div>
      `,
    };

  return await sendEmail(mailOptions);
}
