import { resendClient } from '../config/resend';
import { ENV } from '../config/env';

interface SendOtpEmailParams {
  toEmail: string;
  adminName: string;
  otpCode: string;
  expiryMinutes?: number;
}

export const sendOtpEmail = async ({
  toEmail,
  adminName,
  otpCode,
  expiryMinutes = 5,
}: SendOtpEmailParams): Promise<boolean> => {
  const fromEmail = ENV.RESEND_FROM_EMAIL;
  const subject = `[ExamCenter Security] Kode Verifikasi OTP MFA: ${otpCode}`;

  const plainText = `Halo ${adminName},\n\nKode OTP verifikasi masuk Admin ExamCenter Anda adalah: ${otpCode}\n\nKode ini berlaku selama ${expiryMinutes} menit dan hanya dapat digunakan sekali. Jangan pernah memberikan kode ini kepada siapa pun demi keamanan akun Anda.\n\nSalam,\nExamCenter Security Team`;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="utf-8">
      <title>ExamCenter Multi-Factor Authentication</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #0f172a; }
        .card { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(15, 29, 46, 0.08); }
        .header { background: linear-gradient(135deg, #070e17 0%, #0f1d2e 50%, #1e3a8a 100%); padding: 36px 24px; text-align: center; color: #ffffff; }
        .badge { display: inline-block; background: rgba(59, 130, 246, 0.2); border: 1px solid rgba(147, 197, 253, 0.3); color: #93c5fd; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; padding: 4px 12px; border-radius: 9999px; margin-bottom: 12px; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
        .header p { margin: 6px 0 0; font-size: 13px; color: #cbd5e1; }
        .content { padding: 32px 28px; }
        .greeting { font-size: 16px; margin-bottom: 12px; font-weight: 700; color: #0f172a; }
        .text { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
        .otp-container { background: #f8fafc; border: 2px dashed #2563eb; border-radius: 12px; padding: 24px 16px; text-align: center; margin: 24px 0; }
        .otp-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b; margin-bottom: 8px; }
        .otp-code { font-size: 40px; font-weight: 900; letter-spacing: 10px; color: #1d4ed8; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace; margin: 4px 0; }
        .expiry-badge { display: inline-block; background-color: #fee2e2; color: #991b1b; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 9999px; margin-top: 10px; }
        .security-notice { background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 14px 16px; font-size: 12px; color: #166534; border-radius: 6px; margin-top: 24px; line-height: 1.5; }
        .footer { text-align: center; padding: 20px; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; background: #fafafa; }
        .footer a { color: #2563eb; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div class="badge">Official Security Dispatch</div>
          <h1>ExamCenter Security</h1>
          <p>Otentikasi Multi-Faktor (MFA) Administrator</p>
        </div>
        <div class="content">
          <div class="greeting">Halo, ${adminName}</div>
          <p class="text">
            Sistem mendeteksi permintaan masuk ke <strong>Portal Administrator ExamCenter</strong>. Demi keamanan data ujian dan perlindungan akun Anda, silakan gunakan kode One-Time Password (OTP) berikut untuk menyelesaikan verifikasi:
          </p>
          <div class="otp-container">
            <div class="otp-label">Kode Verifikasi Masuk</div>
            <div class="otp-code">${otpCode}</div>
            <div class="expiry-badge">⏱ Berlaku selama ${expiryMinutes} Menit</div>
          </div>
          <div class="security-notice">
            <strong>Pemberitahuan Keamanan Penting:</strong>
            <br>
            • Kode ini hanya dapat digunakan satu kali (single-use).
            <br>
            • Jangan pernah memberikan kode ini kepada siapa pun. Staf ExamCenter tidak akan pernah meminta kode OTP Anda.
            <br>
            • Jika Anda tidak merasa melakukan permintaan masuk ini, mohon segera amankan password akun Anda.
          </div>
        </div>
        <div class="footer">
          Dikirim secara aman melalui <strong>Resend Email API</strong> • &copy; ${new Date().getFullYear()} ExamCenter Systems.
        </div>
      </div>
    </body>
    </html>
  `;

  // If RESEND_API_KEY is configured, dispatch via Resend API
  if (ENV.isConfigured.resend) {
    try {
      const response = await resendClient.emails.send({
        from: fromEmail,
        to: [toEmail],
        subject,
        text: plainText,
        html: htmlContent,
      });

      if (response.error) {
        console.error('❌ [Resend API Error]:', response.error);
        // Fallback to console log in dev if Resend returns domain restriction error
        console.log(`⚠️ FALLBACK: Current OTP for ${toEmail} is [ ${otpCode} ]`);
        return true;
      }

      console.log(`✅ [Resend API Email Sent] To: ${toEmail} | Id: ${response.data?.id}`);
      return true;
    } catch (error: any) {
      console.error('❌ [Failed to send OTP via Resend]:', error?.message || error);
      console.log(`⚠️ FALLBACK: Current OTP for ${toEmail} is [ ${otpCode} ]`);
      return true;
    }
  }

  // Development / Pending Credentials Fallback
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📧 [RESEND EMAIL DISPATCHER - RESEND_API_KEY PENDING CONFIG]');
  console.log(`From: ${fromEmail}`);
  console.log(`To: ${toEmail}`);
  console.log(`Subject: ${subject}`);
  console.log(`🔐 OTP Code: [ ${otpCode} ] (Valid ${expiryMinutes} mins)`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  return true;
};
