const SMTPServer = require("smtp-server").SMTPServer;
const { simpleParser } = require("mailparser"); // For parsing email content
const fs = require("fs"); // For saving email data (optional)
const nodemailer = require("nodemailer"); // Optional: For relaying emails

const server = new SMTPServer({
    allowInsecureAuth: true,
    authOptional: true,

    onConnect(session, cb) {
        console.log(`onConnect`, session.id);
        cb(); // Callback to accept the connection
    },

    onMailFrom(address, session, cb) {
        console.log(`onMailFrom`, address.address, session.id);
        cb(); // Callback to accept the sender
    },

    onRcptTo(address, session, cb) {
        console.log(`onRcptTo`, address.address, session.id);
        cb(); // Callback to accept the recipient
    },

    onData(stream, session, cb) {
        console.log(`onData: Processing email from session: ${session.id}`);

        // Parse the email content
        simpleParser(stream, (err, parsed) => {
            if (err) {
                console.error("Error parsing email:", err);
                return cb(err);
            }

            // Log the parsed email
            console.log("Parsed email:", parsed);

            // Save the email to a database or file (example with file system)
            const emailFile = `email-${session.id}.txt`;
            fs.writeFileSync(emailFile, JSON.stringify(parsed, null, 2), "utf-8");
            console.log(`Email saved to ${emailFile}`);

            // Optional: Relay email using nodemailer
            relayEmail(parsed)
                .then(() => {
                    console.log("Email relayed successfully");
                    cb(); // Acknowledge successful processing
                })
                .catch((relayErr) => {
                    console.error("Error relaying email:", relayErr);
                    cb(relayErr); // Acknowledge failure
                });
        });
    },
});

// Start the SMTP server on port 25
server.listen(25, () => {
    console.log("SMTP Server Running on port 25");
});

// Function to relay email (optional)
async function relayEmail(parsed) {
    const transporter = nodemailer.createTransport({
        host: "smtp.example.com", // Replace with your SMTP relay host
        port: 587,
        secure: false, // Set true for port 465
        auth: {
            user: "username", // Replace with your SMTP username
            pass: "password", // Replace with your SMTP password
        },
    });

    const mailOptions = {
        from: parsed.from.text,
        to: parsed.to.text,
        subject: parsed.subject,
        text: parsed.text,
        html: parsed.html, // Optional: HTML version of the email
    };

    await transporter.sendMail(mailOptions);
}
