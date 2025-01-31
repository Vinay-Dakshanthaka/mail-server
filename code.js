// const SMTPServer = require("smtp-server").SMTPServer;
// const { simpleParser } = require("mailparser"); // For parsing email content
// const fs = require("fs"); // For saving email data (optional)
// const nodemailer = require("nodemailer"); // Optional: For relaying emails

// const server = new SMTPServer({
//     allowInsecureAuth: true,
//     authOptional: true,

//     onConnect(session, cb) {
//         console.log(`onConnect`, session.id);
//         cb(); // Callback to accept the connection
//     },

//     onMailFrom(address, session, cb) {
//         console.log(`onMailFrom`, address.address, session.id);
//         cb(); // Callback to accept the sender
//     },

//     onRcptTo(address, session, cb) {
//         console.log(`onRcptTo`, address.address, session.id);
//         cb(); // Callback to accept the recipient
//     },

//     onData(stream, session, cb) {
//         console.log(`onData: Processing email from session: ${session.id}`);

//         // Parse the email content
//         simpleParser(stream, (err, parsed) => {
//             if (err) {
//                 console.error("Error parsing email:", err);
//                 return cb(err);
//             }

//             // Log the parsed email
//             console.log("Parsed email:", parsed);

//             // Save the email to a database or file (example with file system)
//             const emailFile = `email-${session.id}.txt`;
//             fs.writeFileSync(emailFile, JSON.stringify(parsed, null, 2), "utf-8");
//             console.log(`Email saved to ${emailFile}`);

//             // Optional: Relay email using nodemailer
//             relayEmail(parsed)
//                 .then(() => {
//                     console.log("Email relayed successfully");
//                     cb(); // Acknowledge successful processing
//                 })
//                 .catch((relayErr) => {
//                     console.error("Error relaying email:", relayErr);
//                     cb(relayErr); // Acknowledge failure
//                 });
//         });
//     },
// });

// // Start the SMTP server on port 25
// server.listen(25, () => {
//     console.log("SMTP Server Running on port 25");
// });

// // Function to relay email (optional)
// async function relayEmail(parsed) {
//     const transporter = nodemailer.createTransport({
//         host: "smtp.example.com", // Replace with your SMTP relay host
//         port: 587,
//         secure: false, // Set true for port 465
//         auth: {
//             user: "username", // Replace with your SMTP username
//             pass: "password", // Replace with your SMTP password
//         },
//     });

//     const mailOptions = {
//         from: parsed.from.text,
//         to: parsed.to.text,
//         subject: parsed.subject,
//         text: parsed.text,
//         html: parsed.html, // Optional: HTML version of the email
//     };

//     await transporter.sendMail(mailOptions);
// }

const SMTPServer = require("smtp-server").SMTPServer;
const { simpleParser } = require("mailparser");
const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");

// Create an SMTP server
const server = new SMTPServer({
    allowInsecureAuth: true,
    authOptional: true,

    // Callbacks for various SMTP events
    onConnect(session, cb) {
        console.log(`onConnect`, session.id);
        cb(); // Accept the connection
    },

    onMailFrom(address, session, cb) {
        console.log(`onMailFrom`, address.address, session.id);
        cb(); // Accept the sender's email address
    },

    onRcptTo(address, session, cb) {
        console.log(`onRcptTo`, address.address, session.id);
        cb(); // Accept the recipient's email address
    },

    onData(stream, session, cb) {
        // Parse the email data stream
        simpleParser(stream, async (err, parsed) => {
            if (err) {
                console.error("Error parsing email:", err);
                cb(err); // End the connection with an error
                return;
            }

            console.log(`Subject: ${parsed.subject}`);
            console.log(`From: ${parsed.from.text}`);
            console.log(`To: ${parsed.to.text}`);
            console.log(`Text Body: ${parsed.text}`);
            console.log(`HTML Body: ${parsed.html}`);

            // Directory to store attachments
            const uploadDir = path.join(__dirname, "uploads");

            // Ensure the uploads directory exists
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
                console.log(`Created directory: ${uploadDir}`);
            }

            // Process attachments
            if (parsed.attachments && parsed.attachments.length > 0) {
                console.log("Attachments found:", parsed.attachments.length);

                // Save attachments
                parsed.attachments.forEach((attachment, index) => {
                    const filePath = path.join(
                        uploadDir,
                        `${Date.now()}_${attachment.filename}`
                    );
                    fs.writeFile(filePath, attachment.content, (err) => {
                        if (err) {
                            console.error(`Error saving attachment ${attachment.filename}:`, err);
                        } else {
                            console.log(`Attachment saved: ${filePath}`);
                        }
                    });
                });
            } else {
                console.log("No attachments found.");
            }

            // Send email using nodemailer
            const transporter = nodemailer.createTransport({
                host: "your.smtp.host", // Replace with your SMTP server hostname
                port: 25, // Replace with your SMTP server port
                secure: false, // TLS requires secure:true, false for unsecured port
                ignoreTLS: true, // Prevents attempts to use STARTTLS command
            });

            const mailOptions = {
                from: parsed.from.text,
                to: parsed.to.text,
                subject: parsed.subject,
                text: parsed.text,
                html: parsed.html,
                attachments: parsed.attachments.map(att => ({
                    filename: att.filename,
                    content: att.content,
                })),
            };

            // Send the email
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error("Error sending email:", error);
                    cb(error); // End the SMTP session with an error
                } else {
                    console.log("Email sent:", info.response);
                    cb(); // End the SMTP session successfully
                }
            });
        });
    }
});

// Start the SMTP server
server.listen(25, () => {
    console.log("Server Running on port 25");
});

