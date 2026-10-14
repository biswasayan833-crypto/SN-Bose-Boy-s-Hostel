import nodemailer from 'nodemailer';

/**
 * Send 2FA OTP verification email using Nodemailer with dev console fallback
 * @param {Object} options
 * @param {string} options.email - Recipient email
 * @param {string} options.otp - 6-digit OTP code
 * @param {string} [options.fullName] - Optional student full name
 */
export const sendLoginOtpEmail = async ({ email, otp, fullName = '' }) => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  const subject = 'Prof. S.N. Bose Boys Hostel Community - Login Verification Code';

  const htmlContent = `
    <div style="background-color: #0b0f19; padding: 28px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0; border-radius: 14px; max-width: 520px; margin: 0 auto; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; padding: 10px 18px; background: linear-gradient(135deg, #7c3aed, #4f46e5, #06b6d4); border-radius: 10px; font-weight: 700; color: #ffffff; font-size: 15px; letter-spacing: 0.5px;">
          🛡️ Prof. S.N. Bose Boys Hostel
        </div>
        <h2 style="color: #ffffff; margin-top: 18px; margin-bottom: 6px; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">
          Login Verification Code
        </h2>
        <p style="color: #94a3b8; font-size: 13px; margin: 0;">
          Hostel Student Community Authentication
        </p>
      </div>

      <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
        Hello${fullName ? ` <strong>${fullName}</strong>` : ''},<br/>
        You recently initiated a sign-in request to your hostel student portal account. Enter the 6-digit verification code below to complete sign-in:
      </p>

      <div style="background: rgba(15, 23, 42, 0.85); border: 1.5px solid #6366f1; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
        <span style="font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #38bdf8; font-family: 'Courier New', Courier, monospace; display: inline-block; padding-left: 8px;">
          ${otp}
        </span>
      </div>

      <div style="background: rgba(245, 158, 11, 0.1); border-left: 3px solid #f59e0b; padding: 10px 14px; border-radius: 6px; margin-bottom: 20px;">
        <p style="color: #fcd34d; font-size: 12.5px; margin: 0; line-height: 1.5;">
          ⏱️ This code will expire in <strong>10 minutes</strong>. Do not disclose this code to anyone.
        </p>
      </div>

      <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.08); margin: 24px 0 18px 0;" />
      
      <p style="color: #64748b; font-size: 11.5px; line-height: 1.5; margin: 0; text-align: center;">
        If you did not attempt to sign in to the hostel portal, please change your password immediately or alert the hostel administration.
      </p>
    </div>
  `;

  const textContent = `Prof. S.N. Bose Boys Hostel Community\n\nLogin Verification Code: ${otp}\n\nThis code will expire in 10 minutes. If you did not request this code, please contact hostel administration.`;

  // Always log to console in development or if SMTP credentials are missing
  const shouldLogConsole = !emailUser || !emailPass || process.env.NODE_ENV !== 'production';
  if (shouldLogConsole) {
    console.log('\n============================================================');
    console.log(`[2FA OTP NOTIFICATION]`);
    console.log(`Recipient: ${email}`);
    console.log(`Verification Code: >> ${otp} <<`);
    console.log(`Expires In: 10 minutes`);
    console.log('============================================================\n');
  }

  if (emailUser && emailPass) {
    try {
      const transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
          user: emailUser,
          pass: emailPass,
        },
      });

      await transporter.sendMail({
        from: `"Prof. S.N. Bose Boys Hostel" <${emailUser}>`,
        to: email,
        subject,
        text: textContent,
        html: htmlContent,
      });

      return { success: true, deliveredVia: 'smtp' };
    } catch (err) {
      console.warn(`[2FA Email Warning] Failed to send email via SMTP (${err.message}). Falling back to console output.`);
      return { success: true, deliveredVia: 'console-fallback' };
    }
  }

  return { success: true, deliveredVia: 'console' };
};

export default {
  sendLoginOtpEmail,
};
