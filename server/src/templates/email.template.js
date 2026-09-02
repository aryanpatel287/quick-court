const baseStyles = `font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #fafafb; padding: 20px; color: #111827; margin: 0;`;
const cardStyles = `max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);`;
const headerStyles = `background-color: #111827; color: #ffffff; padding: 30px; text-align: center;`;
const titleStyles = `margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;`;
const contentStyles = `padding: 40px 30px; text-align: left;`;
const textStyles = `font-size: 16px; line-height: 1.6; margin-bottom: 24px; color: #374151;`;
const buttonStyles = `display: inline-block; padding: 14px 32px; background-color: #111827; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; letter-spacing: 0.5px;`;
const linkFallbackStyles = `font-size: 13px; color: #6b7280; margin-top: 20px; word-break: break-all; line-height: 1.5;`;
const footerStyles = `padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; background-color: #f3f4f6;`;
const noteStyles = `font-size: 14px; color: #6b7280; margin-top: 30px; line-height: 1.5;`;
const otpBoxStyles = `display: block; font-family: monospace; font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #111827; background-color: #f3f4f6; padding: 16px 24px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 24px auto; text-align: center; width: max-content;`;

const emailStyles = `
  body { ${baseStyles} }
  .container { ${cardStyles} }
  .header { ${headerStyles} }
  .header h1 { ${titleStyles} }
  .content { ${contentStyles} }
  .content p { ${textStyles} }
  .btn-wrapper { text-align: center; margin: 40px 0; }
  .btn { ${buttonStyles} }
  .link-fallback { ${linkFallbackStyles} }
  .footer { ${footerStyles} }
  .note { ${noteStyles} }
  .otp-box { ${otpBoxStyles} }
`;

export const otpEmailTemplate = (otp) => {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Verification Code</title>
      <style>
        ${emailStyles}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>APEX</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>Thank you for choosing Apex. Please use the following one-time password (OTP) code to complete your email verification process:</p>
          <div class="otp-box">${otp}</div>
          <p>This verification code is valid for 10 minutes. For security reasons, please do not share this OTP with anyone.</p>
          <p class="note">If you did not request this code, you can safely ignore this email.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Apex. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const forgotPasswordOtpEmailTemplate = (otp) => {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
      <style>
        ${emailStyles}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>APEX</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>We received a request to reset the password for your Apex account. Use the following one-time password (OTP) code to complete the reset process:</p>
          <div class="otp-box">${otp}</div>
          <p>This code expires in 10 minutes. If you did not make this request, your account is still secure and you can safely ignore this email.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Apex. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const recoverAccountOtpEmailTemplate = (otp) => {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Recover Your Account</title>
      <style>
        ${emailStyles}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>APEX</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>We received a request to recover your deleted Apex account. Use the following one-time password (OTP) code to reactivate your account:</p>
          <div class="otp-box">${otp}</div>
          <p>This code expires in 10 minutes. Once verified, your account and all associated data will be fully recovered.</p>
          <p class="note">If you did not initiate this recovery process, please contact support immediately.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Apex. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const accountRecoveredEmailTemplate = () => {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Account Successfully Recovered</title>
      <style>
        ${emailStyles}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>APEX</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>We are pleased to inform you that your Apex account associated with this email address has been successfully recovered and reactivated.</p>
          <p>You can now log in using your password.</p>
          <p class="note">If you did not initiate this action, please contact support immediately.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Apex. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};
