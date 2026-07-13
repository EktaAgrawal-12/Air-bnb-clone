const nodemailer = require("nodemailer");

module.exports.sendEmail = async ({ to, subject, text, html }) => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (emailUser && emailPass) {
    // Configured SMTP Transporter (e.g. Gmail)
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || "gmail",
      auth: {
        user: emailUser,
        pass: emailPass
      }
    });

    const mailOptions = {
      from: `"Wanderlust Support" <${emailUser}>`,
      to,
      subject,
      text,
      html
    };

    console.log(`[MailService] Sending SMTP email to: ${to}`);
    await transporter.sendMail(mailOptions);
    return { success: true };
  } else {
    // Generate Ethereal testing account dynamically
    try {
      console.log("[MailService] Generating Ethereal test mail account...");
      const testAccount = await nodemailer.createTestAccount();
      
      const transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });

      const mailOptions = {
        from: '"Wanderlust Support" <support@wanderlust.com>',
        to,
        subject,
        text,
        html
      };

      const info = await transporter.sendMail(mailOptions);
      const previewUrl = nodemailer.getTestMessageUrl(info);

      console.log("\n==================================================");
      console.log("📨  ETHEREAL TEST MAIL SENT");
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Preview URL: ${previewUrl}`);
      console.log("==================================================\n");

      return { success: true, previewUrl };
    } catch (err) {
      console.error("[MailService] Ethereal mail generation failed, logging to console:", err.message);
  
      console.log("\n==================================================");
      console.log("📨  DEVELOPMENT MAIL SERVICE FALLBACK");
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log("--------------------------------------------------");
      console.log(`Text Body:\n${text}`);
      console.log("==================================================\n");
      return { success: true };
    }
  }
};
