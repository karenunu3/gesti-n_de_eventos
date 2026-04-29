import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter;

export const initMailer = async () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    console.log('Servidor de correos configurado (Custom SMTP)');
  } else {
    // Generate test Ethereal account
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user, // generated ethereal user
        pass: testAccount.pass, // generated ethereal password
      },
    });
    console.log('Servidor de correos configurado (Ethereal Test) — preview en https://ethereal.email');
  }
};

export const sendMail = async (to: string, subject: string, html: string) => {
  if (!transporter) await initMailer();
  
  const info = await transporter.sendMail({
    from: '"ISTPET Eventos" <no-reply@istpet.edu.ec>',
    to,
    subject,
    html,
  });

  console.log('Message sent: %s', info.messageId);
  // Preview only available when sending through an Ethereal account
  console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  return info;
};
