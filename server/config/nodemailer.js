import nodemailer from 'nodemailer';

// Create transporter with Gmail SMTP (most common for education apps)
// You can also use other SMTP services like SendGrid, Mailgun, etc.
const transporter = nodemailer.createTransport({
   service: 'gmail',
   auth: {
      user: process.env.EMAIL_USER, // Your Gmail address
      pass: process.env.EMAIL_PASS  // App password (not regular password)
   }
});

// Verify transporter configuration
transporter.verify((error, success) => {
   if (error) {
      console.log('❌ Email transporter configuration error:', error.message);
      console.log('📧 Make sure EMAIL_USER and EMAIL_PASS are set in .env');
   } else {
      console.log('✅ Email transporter is ready to send messages');
   }
});

// Send email helper function
export const sendEmail = async ({ to, subject, html, text }) => {
   try {
      const mailOptions = {
         from: `"CampusRoots" <${process.env.EMAIL_USER}>`,
         to,
         subject,
         html,
         text: text || html.replace(/<[^>]*>/g, '') // Fallback plain text
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('📧 Email sent successfully:', info.messageId);
      return { success: true, messageId: info.messageId };
   } catch (error) {
      console.error('❌ Failed to send email:', error.message);
      throw new Error('Failed to send email. Please try again later.');
   }
};

// Send OTP email with beautiful template
export const sendOtpEmail = async (email, otp, name = 'User') => {
   const subject = 'Verify Your Email - CampusRoots';
   
   const html = `
<!DOCTYPE html>
<html>
<head>
   <meta charset="utf-8">
   <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
   <table role="presentation" style="width: 100%; border-collapse: collapse;">
      <tr>
         <td align="center" style="padding: 40px 0;">
            <table role="presentation" style="width: 100%; max-width: 500px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
               <!-- Header -->
               <tr>
                  <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); border-radius: 16px 16px 0 0;">
                     <div style="width: 60px; height: 60px; background-color: rgba(255, 255, 255, 0.2); border-radius: 12px; display: inline-block; line-height: 60px;">
                        <span style="font-size: 24px; font-weight: bold; color: #ffffff;">CR</span>
                     </div>
                     <h1 style="margin: 20px 0 0; font-size: 24px; font-weight: 600; color: #ffffff;">CampusRoots</h1>
                     <p style="margin: 8px 0 0; font-size: 14px; color: rgba(255, 255, 255, 0.8);">CHARUSAT Alumni Network</p>
                  </td>
               </tr>
               
               <!-- Content -->
               <tr>
                  <td style="padding: 40px;">
                     <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #18181b;">Verify Your Email</h2>
                     <p style="margin: 0 0 24px; font-size: 15px; color: #52525b; line-height: 1.6;">
                        Hi ${name},<br><br>
                        Welcome to CampusRoots! Use the following OTP to verify your email address and complete your registration.
                     </p>
                     
                     <!-- OTP Box -->
                     <div style="background-color: #f4f4f5; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
                        <p style="margin: 0 0 8px; font-size: 13px; color: #71717a; text-transform: uppercase; letter-spacing: 1px;">Your Verification Code</p>
                        <div style="font-size: 36px; font-weight: 700; color: #3b82f6; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                           ${otp}
                        </div>
                     </div>
                     
                     <p style="margin: 0 0 8px; font-size: 14px; color: #71717a;">
                        ⏰ This code expires in <strong>10 minutes</strong>
                     </p>
                     <p style="margin: 0; font-size: 14px; color: #71717a;">
                        🔒 If you didn't request this, please ignore this email.
                     </p>
                  </td>
               </tr>
               
               <!-- Footer -->
               <tr>
                  <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 16px 16px; text-align: center; border-top: 1px solid #e4e4e7;">
                     <p style="margin: 0; font-size: 13px; color: #a1a1aa;">
                        © ${new Date().getFullYear()} CampusRoots. All rights reserved.
                     </p>
                     <p style="margin: 8px 0 0; font-size: 12px; color: #a1a1aa;">
                        CHARUSAT Alumni Network
                     </p>
                  </td>
               </tr>
            </table>
         </td>
      </tr>
   </table>
</body>
</html>
   `;

   // Console log for development/debugging
   console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
   console.log('📧 EMAIL OTP VERIFICATION');
   console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
   console.log(`📬 To: ${email}`);
   console.log(`🔐 OTP: ${otp}`);
   console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

   return await sendEmail({ to: email, subject, html });
};

export default transporter;
