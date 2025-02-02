const dns = require("dns");

// 🚫 Blocked spam email addresses
const blockedEmails = ["spameri@tiscali.it"];

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

module.exports = {
    isValidEmailDomain,
    blockedEmails
};
