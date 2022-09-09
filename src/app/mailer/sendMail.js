const _ = require('lodash');
const fs = require('fs');
const nodemailer = require('nodemailer');
const smtpTransport = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: "testovictest866@gmail.com",
        pass: "xruwjoodzdvkigge"
    }
});

let mail = {
    from: "Milberger <milberger@gmail.com>",
}

module.exports = async ({ to, subject, heading = '', body }) => {
    let htmlBody = "";
    for (const value of Object.values(body)) {
        const bodyItemText = value.text;
        const bodyItemValue = value.value;
        const template = bodyItemValue ? `<p><span style="font-weight:bold">${bodyItemText}:</span> ${bodyItemValue}</p>` : `<p>${bodyItemText}</p>`
        htmlBody += template;
    };

    let html;

    try {
        html = await fs.readFileSync("src/templates/email.html");
        const tmpl = _.template(html);
        const email = tmpl({ heading, body: htmlBody });
        const options = Object.assign({
            html: email,
            to,
            subject
        }, mail);
        await smtpTransport.sendMail(options);
    } catch(err) {
        console.log('err');
        throw err;
    };
}