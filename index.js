// const SMTPServer = require("smtp-server").SMTPServer;
// const { simpleParser } = require("mailparser");
// const fs = require("fs");
// const path = require("path");

// const server = new SMTPServer({
//     allowInsecureAuth: true,
//     authOptional: true,

//     onConnect(session, cb) {
//         console.log(`onConnect`, session.id);
//         cb(); // Callback function that accepts the connection
//     },

//     onMailFrom(address, session, cb) {
//         console.log(`onMailFrom`, address.address, session.id);
//         cb();
//     },

//     onRcptTo(address, session, cb) {
//         console.log(`onRcptTo`, address.address, session.id);
//         cb();
//     },

//     onData(stream, session, cb) {
//         // Parse the email data stream
//         simpleParser(stream, async (err, parsed) => {
//             if (err) {
//                 console.error("Error parsing email:", err);
//                 cb(err); // End the connection with an error
//                 return;
//             }

//             console.log(`Subject: ${parsed.subject}`);
//             console.log(`From: ${parsed.from.text}`);
//             console.log(`To: ${parsed.to.text}`);
//             console.log(`Text Body: ${parsed.text}`);
//             console.log(`HTML Body: ${parsed.html}`);

//             // Directory to store attachments
//             const uploadDir = path.join(__dirname, "uploads");

//             // Ensure the uploads directory exists
//             if (!fs.existsSync(uploadDir)) {
//                 fs.mkdirSync(uploadDir, { recursive: true });
//                 console.log(`Created directory: ${uploadDir}`);
//             }

//             // Process attachments
//             if (parsed.attachments && parsed.attachments.length > 0) {
//                 console.log("Attachments found:", parsed.attachments.length);

//                 // Save attachments
//                 parsed.attachments.forEach((attachment, index) => {
//                     const filePath = path.join(
//                         uploadDir,
//                         `${Date.now()}_${attachment.filename}`
//                     );
//                     fs.writeFile(filePath, attachment.content, (err) => {
//                         if (err) {
//                             console.error(`Error saving attachment ${attachment.filename}:`, err);
//                         } else {
//                             console.log(`Attachment saved: ${filePath}`);
//                         }
//                     });
//                 });
//             } else {
//                 console.log("No attachments found.");
//             }

//             cb(); // End the connection successfully
//         });
//     }
// });

// // Start the SMTP server
// server.listen(25, () => {
//     console.log("Server Running on port 25");
// });


// const SMTPServer = require("smtp-server").SMTPServer;
// const { simpleParser } = require("mailparser");
// const fs = require("fs");
// const path = require("path");
// const dns = require("dns");

// // ✅ Allowed domains (Popular Email Providers & Your Domain)
// const allowedDomains = [
//     "gmail.com", "outlook.com", "yahoo.com", "hotmail.com",
//     "aol.com", "icloud.com", "zoho.com", "protonmail.com",
//     "gmx.com", "yandex.com", "mail.com", "rediffmail.com",
//     "totfd.fun", "totfd.com" // ✅ Your custom domain
// ];

// // 🚫 Blocked spam email addresses
// const blockedEmails = ["spameri@tiscali.it"];

// // 📌 Max email size to avoid large spam emails (10MB)
// const MAX_EMAIL_SIZE = 10 * 1024 * 1024;

// // ✅ Function to check if an email domain has valid MX records
// const isValidEmailDomain = (domain, callback) => {
//     dns.resolveMx(domain, (err, addresses) => {
//         if (err || !addresses.length) {
//             callback(false); // ❌ Invalid domain
//         } else {
//             callback(true); // ✅ Valid domain
//         }
//     });
// };

// // 🚀 Start SMTP Server
// const server = new SMTPServer({
//     allowInsecureAuth: false, // 🔒 Secure Authentication
//     authOptional: true,

//     // 🚫 Restrict Suspicious Connections
//     onConnect(session, cb) {
//         console.log(`🔗 Connection Attempt from: ${session.remoteAddress}`);

//         if (session.remoteAddress === "blacklisted-ip") {
//             console.log(`🚫 Blocked IP: ${session.remoteAddress}`);
//             return cb(new Error("Connection from this IP is blocked"));
//         }
//         cb();
//     },

//     // ✅ Validate Sender Email
//     onMailFrom(address, session, cb) {
//         console.log(`📩 Email From: ${address.address}`);

//         // 🚫 Block specific spam emails
//         if (blockedEmails.includes(address.address)) {
//             console.log(`🚫 Rejected spam email from ${address.address}`);
//             return cb(new Error("Unauthorized sender"));
//         }

//         // ✅ Check sender's domain
//         const domain = address.address.split("@")[1];

//         // ✅ Allow common email providers immediately
//         if (allowedDomains.includes(domain)) {
//             return cb();
//         }

//         // 🔍 Validate unknown domains dynamically using MX records
//         isValidEmailDomain(domain, (isValid) => {
//             if (!isValid) {
//                 console.log(`🚫 Rejected email from invalid domain: ${domain}`);
//                 return cb(new Error("Unauthorized domain"));
//             }
//             cb();
//         });
//     },

//     // ✅ Validate Recipient Email
//     onRcptTo(address, session, cb) {
//         console.log(`📥 Email To: ${address.address}`);

//         // ✅ Check if recipient domain has valid MX records
//         const domain = address.address.split("@")[1];
//         dns.resolveMx(domain, (err, addresses) => {
//             if (err || addresses.length === 0) {
//                 console.log(`🚫 Invalid recipient domain: ${domain}`);
//                 return cb(new Error("Invalid recipient domain"));
//             }
//             cb();
//         });
//     },

//     // 📩 Process Email Data
//     onData(stream, session, cb) {
//         let emailSize = 0;

//         stream.on("data", (chunk) => {
//             emailSize += chunk.length;
//             if (emailSize > MAX_EMAIL_SIZE) {
//                 console.log("🚫 Email size exceeded limit, rejecting...");
//                 stream.destroy();
//                 return cb(new Error("Email too large"));
//             }
//         });

//         simpleParser(stream, async (err, parsed) => {
//             if (err) {
//                 console.error("❌ Error parsing email:", err);
//                 return cb(err);
//             }

//             // 🚫 Reject emails without subject or content
//             if (!parsed.subject || (!parsed.text && !parsed.html)) {
//                 console.log("🚫 Email rejected due to missing content.");
//                 return cb(new Error("Email missing subject or body"));
//             }

//             console.log(`📜 Subject: ${parsed.subject}`);
//             console.log(`👤 From: ${parsed.from.text}`);
//             console.log(`📧 To: ${parsed.to.text}`);
//             console.log(`📝 Text Body: ${parsed.text}`);
//             console.log(`🌐 HTML Body: ${parsed.html ? "Yes" : "No"}`);

//             // ✅ Securely Save Attachments
//             const uploadDir = path.join(__dirname, "uploads");
//             if (!fs.existsSync(uploadDir)) {
//                 fs.mkdirSync(uploadDir, { recursive: true });
//                 console.log(`📂 Created directory: ${uploadDir}`);
//             }

//             if (parsed.attachments && parsed.attachments.length > 0) {
//                 console.log("📎 Attachments found:", parsed.attachments.length);

//                 parsed.attachments.forEach((attachment, index) => {
//                     // ✅ Allow only safe file extensions
//                     const allowedExtensions = [".pdf", ".jpg", ".png", ".txt"];
//                     const ext = path.extname(attachment.filename).toLowerCase();
//                     if (!allowedExtensions.includes(ext)) {
//                         console.log(`🚫 Blocked attachment: ${attachment.filename}`);
//                         return;
//                     }

//                     // 📁 Save file securely
//                     const filePath = path.join(uploadDir, `${Date.now()}_${attachment.filename}`);
//                     fs.writeFile(filePath, attachment.content, (err) => {
//                         if (err) {
//                             console.error(`❌ Error saving attachment ${attachment.filename}:`, err);
//                         } else {
//                             console.log(`✅ Attachment saved: ${filePath}`);
//                         }
//                     });
//                 });
//             } else {
//                 console.log("🔍 No attachments found.");
//             }

//             cb(); // ✅ Successfully process email
//         });
//     },
// });

// // 🚀 Start SMTP Server on Port 25 (Root Access Required)
// server.listen(25, () => {
//     console.log("🚀 Secure SMTP Server Running on Port 25");
// });


const SMTPServer = require("smtp-server").SMTPServer;
const { simpleParser } = require("mailparser");
const nodemailer = require('nodemailer');
const fs = require("fs");
const path = require("path");
const dns = require("dns");
const tls = require("tls");

// ✅ Allowed domains (Popular Email Providers & Your Domain)
const allowedDomains = [
    "gmail.com", "outlook.com", "yahoo.com", "hotmail.com",
    "aol.com", "icloud.com", "zoho.com", "protonmail.com",
    "gmx.com", "yandex.com", "mail.com", "rediffmail.com",
    "totfd.fun", "totfd.com" // ✅ Your custom domain
];

// 🚫 Blocked spam email addresses
const blockedEmails = ["spameri@tiscali.it"];

// 📌 Max email size to avoid large spam emails (10MB)
const MAX_EMAIL_SIZE = 10 * 1024 * 1024;

// ✅ Function to check if an email domain has valid MX records
const isValidEmailDomain = (domain, callback) => {
    dns.resolveMx(domain, (err, addresses) => {
        if (err || !addresses.length) {
            callback(false); // ❌ Invalid domain
        } else {
            callback(true); // ✅ Valid domain
        }
    });
};

// 🚀 Start SMTP Server
const server = new SMTPServer({
    // secure: true, // 🔒 Enable TLS
    secure: false, // 🔒 Enable TLS
    allowInsecureAuth: true, // 🔒 Disable insecure authentication
    authOptional: true, // 🔒 Require authentication
    size: MAX_EMAIL_SIZE, // 📌 Limit email size

    // 🔑 Load SSL/TLS certificates
    key: fs.readFileSync(path.join(__dirname, "ssl", "server.key")),
    cert: fs.readFileSync(path.join(__dirname, "ssl", "server.crt")),

    // 🚫 Restrict Suspicious Connections
    onConnect(session, cb) {
        console.log(`🔗 Connection Attempt from: ${session.remoteAddress}`);
        cb();
    },

    // ✅ Validate Sender Email
    onMailFrom(address, session, cb) {
        console.log(`📩 Email From: ${address.address}`);

        // 🚫 Block specific spam emails
        if (blockedEmails.includes(address.address)) {
            console.log(`🚫 Rejected spam email from ${address.address}`);
            return cb(new Error("Unauthorized sender"));
        }

        // ✅ Check sender's domain
        const domain = address.address.split("@")[1];
        isValidEmailDomain(domain, (isValid) => {
            if (!isValid) {
                console.log(`🚫 Rejected email from invalid domain: ${domain}`);
                return cb(new Error("Unauthorized domain"));
            }
            cb();
        });
    },

    // ✅ Validate Recipient Email
    onRcptTo(address, session, cb) {
        console.log(`📥 Email To: ${address.address}`);

        // ✅ Check if recipient domain has valid MX records
        const domain = address.address.split("@")[1];
        dns.resolveMx(domain, (err, addresses) => {
            if (err || addresses.length === 0) {
                console.log(`🚫 Invalid recipient domain: ${domain}`);
                return cb(new Error("Invalid recipient domain"));
            }
            cb();
        });
    },

    // 📩 Process Email Data
    onData(stream, session, cb) {
        let emailSize = 0;

        stream.on("data", (chunk) => {
            emailSize += chunk.length;
            if (emailSize > MAX_EMAIL_SIZE) {
                console.log("🚫 Email size exceeded limit, rejecting...");
                stream.destroy();
                return cb(new Error("Email too large"));
            }
        });

        simpleParser(stream, async (err, parsed) => {
            if (err) {
                console.error("❌ Error parsing email:", err);
                return cb(err);
            }

            // 🚫 Reject emails without subject or content
            if (!parsed.subject || (!parsed.text && !parsed.html)) {
                console.log("🚫 Email rejected due to missing content.");
                return cb(new Error("Email missing subject or body"));
            }

            console.log(`📜 Subject: ${parsed.subject}`);
            console.log(`👤 From: ${parsed.from.text}`);
            console.log(`📧 To: ${parsed.to.text}`);
            console.log(`📝 Text Body: ${parsed.text}`);
            console.log(`🌐 HTML Body: ${parsed.html ? "Yes" : "No"}`);

            // ✅ Securely Save Attachments
            const uploadDir = path.join(__dirname, "uploads");
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
                console.log(`📂 Created directory: ${uploadDir}`);
            }

            if (parsed.attachments && parsed.attachments.length > 0) {
                console.log("📎 Attachments found:", parsed.attachments.length);

                parsed.attachments.forEach((attachment, index) => {
                    // ✅ Allow only safe file extensions
                    const allowedExtensions = [".pdf", ".jpg", ".png", ".txt"];
                    const ext = path.extname(attachment.filename).toLowerCase();
                    if (!allowedExtensions.includes(ext)) {
                        console.log(`🚫 Blocked attachment: ${attachment.filename}`);
                        return;
                    }

                    // 📁 Save file securely
                    const filePath = path.join(uploadDir, `${Date.now()}_${attachment.filename}`);
                    fs.writeFile(filePath, attachment.content, (err) => {
                        if (err) {
                            console.error(`❌ Error saving attachment ${attachment.filename}:`, err);
                        } else {
                            console.log(`✅ Attachment saved: ${filePath}`);
                        }
                    });
                });
            } else {
                console.log("🔍 No attachments found.");
            }

            cb(); // ✅ Successfully process email
        });
    },
});


// SMTP Server Configurations
const transporter = nodemailer.createTransport({
    host: 'localhost',    // Assuming SMTP server is running locally
    port: 25,            // Use the same port as your SMTP server (Port 25)
    secure: false,       // Set to false if not using TLS
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

// Example usage
const from = 'support@totfd.fun';
const to = 'vinayd098@gmail.com';
const subject = 'Test Email Subject';
const text = 'This is a plain text body of the email';
const html = '<p>This is an HTML body of the email</p>';
const attachments = [
    {
        filename: 'testfile.txt',
        content: 'Hello world!', // File content as string (use Buffer for binary data)
    }
];

// Send the email
try {
    sendEmail(from, to, subject, text, html);
} catch (error) {
    console.log(error)   
}


// 🚀 Start SMTP Server on Port 25 (Recommended for TLS)
server.listen(25, () => {
    console.log("🚀 Secure SMTP Server Running on Port 25");
});