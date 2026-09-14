/**
 * OTP Verification Email Template (Dark Theme UI Matching)
 * @param {string} doctorName - Doctor ka name
 * @param {string} otp - 6-digit OTP code
 * @returns {string} HTML Template string
 */
export const verifyEmailTemp = (doctorName, otp) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #0d0e11; margin: 0; padding: 20px 0; }
        .container { max-width: 420px; margin: 0 auto; background-color: #16181d; border-radius: 16px; overflow: hidden; font-size: 14px; }
        .header { background-color: #2563eb; color: #ffffff; padding: 28px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 22px; font-weight: 700; line-height: 1.3; }
        .body { padding: 32px 24px; text-align: center; color: #94a3b8; }
        .title { margin: 0 0 16px 0; color: #ffffff; font-size: 20px; font-weight: 700; }
        .text { color: #94a3b8; line-height: 1.5; margin: 8px 0; }
        .otp-box { background-color: #1e2430; border-radius: 8px; display: inline-block; padding: 16px 36px; margin: 24px 0; }
        .otp-code { font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #60a5fa; }
        .warning { color: #ef4444; font-size: 13px; line-height: 1.4; margin-top: 10px; }
        .footer { background-color: #121418; padding: 18px 20px; text-align: center; font-size: 12px; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Vaccination Management<br>System</h1>
        </div>
        <div class="body">
          <div class="title">Verify Your Account</div>
          <p class="text">Hello <strong style="color: #e2e8f0;">Dr. ${doctorName}</strong>,</p>
          <p class="text">Thank you for registering. Please use the verification code below to complete your setup:</p>
          
          <div class="otp-box">
            <span class="otp-code">${otp}</span>
          </div>
          
          <p class="warning">This code is valid for <strong>10 minutes</strong>. Do not share this code with anyone.</p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Vaccination Management System. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;
};