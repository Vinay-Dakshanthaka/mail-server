// src/email.js

const nodemailer = require('nodemailer');
const fs = require("fs");
const path = require("path");

// SMTP Server Configurations
const transporter = nodemailer.createTransport({
    host: 'mail.totfd.fun',    // Assuming SMTP server is running locally
    port: 25,                   // Use the same port as your SMTP server (Port 25)
    secure: false,              // Set to false if not using TLS
    tls: {
        rejectUnauthorized: false   // Important if you're using self-signed certificates
    }
});

// Function to send an email
const sendEmail = async (from, to, subject, text, html, attachments) => {
    const mailOptions = {
        from: from,       // Sender's email address
        to: to,           // Recipient's email address
        subject: subject, // Subject of the email
        text: text,       // Plain text body
        html: html,       // HTML body
        attachments: attachments  // Attachments array (if any)
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("✅ Email sent: %s", info.messageId);
    } catch (error) {
        console.error("❌ Error sending email:", error);
    }
};

module.exports = sendEmail;
