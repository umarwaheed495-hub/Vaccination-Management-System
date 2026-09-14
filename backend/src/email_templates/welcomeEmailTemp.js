/**
 * Account Verification Success / Welcome Email Template (Dark Theme UI Matching)
 * @param {string} doctorName - Doctor ka name
 * @returns {string} HTML Template string
 */
export const welcomeEmailTemp = (doctorName) => {
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
        .success-icon { font-size: 48px; margin-bottom: 12px; }
        .title { margin: 0 0 16px 0; color: #ffffff; font-size: 20px; font-weight: 700; }
        .text { color: #94a3b8; line-height: 1.5; margin: 8px 0; }
        .footer { background-color: #121418; padding: 18px 20px; text-align: center; font-size: 12px; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Vaccination Management<br>System</h1>
        </div>
        <div class="body">
          <div class="success-icon">🎉</div>
          <div class="title">Welcome Aboard!</div>
          <p class="text">Dear <strong style="color: #e2e8f0;">Dr. ${doctorName}</strong>,</p>
          <p class="text">Your email has been successfully verified! You can now sign in to your portal and start managing patient vaccinations seamlessly.</p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Vaccination Management System. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;
};