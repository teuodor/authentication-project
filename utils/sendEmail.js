const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
    secure: true,
  });

  const mailOptions = {
    from: 'AuthApp <authapp.test.test@gmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  console.log(await transporter.sendMail(mailOptions));
};

module.exports = sendEmail;
