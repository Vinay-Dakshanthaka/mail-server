const sendEmail = require("./email");

const testEmail = async () => {
    await sendEmail(
        "support@totfd.fun",  // Sender email
        "vinayd098@gmail.com",  // Recipient email
        "Test Email from Nodemailer",  // Subject
        "This is a test email sent using Nodemailer with DKIM.",  // Plain text body
        "<p>This is a <strong>test email</strong> sent using <em>Nodemailer</em> with DKIM.</p>",  // HTML body
        [] // No attachments
    );
};

module.exports = testEmail;
