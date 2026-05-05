import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

export const initMailer = () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    console.log('✉️  Mailer: Custom SMTP (' + process.env.SMTP_USER + ')');
  } else if (process.env.GMAIL_USER && process.env.GMAIL_PASS) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS },
    });
    console.log('✉️  Mailer: Gmail (' + process.env.GMAIL_USER + ')');
  } else {
    transporter = null;
    console.warn('⚠️  Mailer: sin SMTP configurado — los correos se mostrarán en consola.');
  }
};

export const sendMail = async (to: string, subject: string, html: string) => {
  // Inicializar si todavía no se ha hecho
  if (!transporter) {
    initMailer();
  }

  // Si sigue sin transporter (no hay credenciales configuradas), fallback a consola
  if (!transporter) {
    const linkMatch = html.match(/href="([^"]+)"/);
    console.log('\n📧 ── EMAIL (modo desarrollo) ──────────────────');
    console.log('   Para:', to);
    console.log('   Asunto:', subject);
    if (linkMatch) console.log('   Enlace:', linkMatch[1]);
    console.log('────────────────────────────────────────────────\n');
    return { messageId: 'dev-console' };
  }

  const info = await transporter.sendMail({
    from: `"ISTPET Eventos" <${process.env.GMAIL_USER || process.env.SMTP_USER || 'no-reply@istpet.edu.ec'}>`,
    to,
    subject,
    html,
  });

  console.log('✅ Correo enviado:', info.messageId);
  return info;
};
