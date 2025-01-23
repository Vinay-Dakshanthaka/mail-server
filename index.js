const SMTPServer = require("smtp-server").SMTPServer;
const { simpleParser } = require("mailparser");
const fs = require("fs");
const path = require("path");

const server = new SMTPServer({
    allowInsecureAuth: true,
    authOptional: true,

    onConnect(session, cb) {
        console.log(`onConnect`, session.id);
        cb(); // Callback function that accepts the connection
    },

    onMailFrom(address, session, cb) {
        console.log(`onMailFrom`, address.address, session.id);
        cb();
    },

    onRcptTo(address, session, cb) {
        console.log(`onRcptTo`, address.address, session.id);
        cb();
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

            cb(); // End the connection successfully
        });
    }
});

// Start the SMTP server
server.listen(25, () => {
    console.log("Server Running on port 25");
});
