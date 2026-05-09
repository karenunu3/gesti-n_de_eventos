import { sendMail } from './mailer';

const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

const DISPOSABLE_DOMAINS = [
  'mailinator.com', 'guerrillamail.com', 'guerrillamail.info', 'guerrillamail.biz', 'guerrillamail.org',
  '10minutemail.com', '10minutemail.net', 'tempmail.com', 'tempmail.net', 'temp-mail.org',
  'throwawaymail.com', 'yopmail.com', 'maildrop.cc', 'sharklasers.com', 'getnada.com',
  'trashmail.com', 'fakeinbox.com', 'tempinbox.com', 'spam4.me', 'mintemail.com',
  'dropmail.me', 'tempr.email', 'tmpmail.org', 'mohmal.com', 'inboxbear.com',
];

const FAKE_PATTERNS = [
  /^test@/i, /^asdf@/i, /^qwerty@/i, /^abc@/i, /^xyz@/i,
  /@test\./i, /@example\./i, /@asdf\./i,
  /^[a-z]{1,2}@[a-z]{1,2}\.[a-z]{2,3}$/i,
];

/**
 * Validación de correo: acepta cualquier dominio (gmail, hotmail, @istpet.edu.ec, etc.)
 * pero rechaza dominios desechables y patrones obviamente falsos.
 * Mantiene el nombre `validateInstitutionalEmail` por compatibilidad con los imports existentes.
 */
export function validateInstitutionalEmail(email: string): string | null {
  if (!email) return 'El correo es obligatorio.';
  const trimmed = email.trim().toLowerCase();
  if (trimmed.length > 254) return 'El correo es demasiado largo.';
  if (!EMAIL_RE.test(trimmed)) return 'Formato de correo inválido.';

  const domain = trimmed.split('@')[1];
  if (!domain) return 'Formato de correo inválido.';

  if (DISPOSABLE_DOMAINS.some(d => domain === d || domain.endsWith('.' + d))) {
    return 'No se aceptan correos de dominios temporales o desechables.';
  }

  if (FAKE_PATTERNS.some(re => re.test(trimmed))) {
    return 'Por favor ingresa un correo electrónico real.';
  }

  return null;
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  SECRETARIA: 'Secretaria',
  DOCENTE: 'Docente',
  ALUMNO: 'Alumno',
};

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://istpet-eventos.vercel.app';

/** Correo de bienvenida (auto-registro o creación por admin). */
export async function sendWelcomeEmail(opts: {
  to: string;
  firstName: string;
  lastName: string;
  role: string;
  createdByAdmin?: boolean;
  tempPassword?: string;
}) {
  const { to, firstName, lastName, role, createdByAdmin, tempPassword } = opts;
  const fullName = `${firstName} ${lastName}`;
  const roleLabel = ROLE_LABELS[role] || role;

  const html = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#f1f5f9;padding:24px">
      <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0">
        <div style="background:linear-gradient(135deg,#1e3a8a,#1e40af);color:#fff;padding:28px;text-align:center">
          <h1 style="margin:0;font-size:22px;font-weight:800;letter-spacing:-0.5px">Bienvenido a ISTPET Eventos</h1>
          <p style="margin:6px 0 0;color:#cbd5e1;font-size:14px">Sistema de Gestión y Control de Asistencia</p>
        </div>
        <div style="padding:28px">
          <p style="margin:0 0 12px;font-size:16px;color:#0f172a">Hola <strong>${fullName}</strong>,</p>
          <p style="margin:0 0 16px;color:#334155;line-height:1.5">
            ${createdByAdmin
              ? 'Un administrador ha creado tu cuenta en el sistema de eventos del Instituto Superior Tecnológico Pedro Traversari.'
              : 'Tu registro ha sido completado con éxito. ¡Te damos la bienvenida!'}
          </p>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin:16px 0">
            <p style="margin:0 0 6px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px">Datos de tu cuenta</p>
            <p style="margin:4px 0;color:#0f172a"><strong>Correo:</strong> ${to}</p>
            <p style="margin:4px 0;color:#0f172a"><strong>Rol asignado:</strong> ${roleLabel}</p>
            ${tempPassword
              ? `<p style="margin:4px 0;color:#0f172a"><strong>Contraseña temporal:</strong> <code style="background:#fef3c7;padding:2px 6px;border-radius:4px;font-family:monospace">${tempPassword}</code></p>
                 <p style="margin:8px 0 0;font-size:12px;color:#b45309">⚠️ Por seguridad, cámbiala al iniciar sesión.</p>`
              : ''}
          </div>
          <div style="text-align:center;margin:24px 0">
            <a href="${FRONTEND_URL}/login" style="display:inline-block;background:#1e3a8a;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px">Iniciar sesión</a>
          </div>
          <p style="margin:0;color:#64748b;font-size:13px;line-height:1.5">
            Si tienes problemas para acceder, contacta a la secretaría del instituto.
          </p>
        </div>
        <div style="background:#f8fafc;padding:16px;text-align:center;font-size:11px;color:#94a3b8;border-top:1px solid #e2e8f0">
          ISTPET — Instituto Superior Tecnológico "Mayor Pedro Traversari"<br>
          Este correo fue generado automáticamente. No responder.
        </div>
      </div>
    </div>
  `;

  try {
    await sendMail(to, '¡Bienvenido a ISTPET Eventos!', html);
  } catch (err) {
    console.error('Error enviando correo de bienvenida:', err);
    // No lanzamos: el registro debe completarse aunque el correo falle
  }
}

/** Plantilla base reutilizable. */
function buildEmailLayout(opts: { title: string; subtitle?: string; bodyHtml: string; ctaLabel?: string; ctaUrl?: string; footerNote?: string }) {
  const { title, subtitle, bodyHtml, ctaLabel, ctaUrl, footerNote } = opts;
  return `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#f1f5f9;padding:24px">
      <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0">
        <div style="background:linear-gradient(135deg,#1e3a8a,#1e40af);color:#fff;padding:28px;text-align:center">
          <h1 style="margin:0;font-size:22px;font-weight:800;letter-spacing:-0.5px">${title}</h1>
          ${subtitle ? `<p style="margin:6px 0 0;color:#cbd5e1;font-size:14px">${subtitle}</p>` : ''}
        </div>
        <div style="padding:28px">
          ${bodyHtml}
          ${ctaLabel && ctaUrl ? `
          <div style="text-align:center;margin:24px 0">
            <a href="${ctaUrl}" style="display:inline-block;background:#1e3a8a;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px">${ctaLabel}</a>
          </div>` : ''}
          ${footerNote ? `<p style="margin:0;color:#64748b;font-size:13px;line-height:1.5">${footerNote}</p>` : ''}
        </div>
        <div style="background:#f8fafc;padding:16px;text-align:center;font-size:11px;color:#94a3b8;border-top:1px solid #e2e8f0">
          ISTPET — Instituto Superior Tecnológico "Mayor Pedro Traversari"<br>
          Este correo fue generado automáticamente. No responder.
        </div>
      </div>
    </div>
  `;
}

/** Correo con enlace para restablecer contraseña. */
export async function sendPasswordResetEmail(opts: { to: string; firstName: string; resetUrl: string }) {
  const { to, firstName, resetUrl } = opts;
  const html = buildEmailLayout({
    title: 'Recuperación de Contraseña',
    subtitle: 'Sistema de Eventos ISTPET',
    bodyHtml: `
      <p style="margin:0 0 12px;font-size:16px;color:#0f172a">Hola <strong>${firstName}</strong>,</p>
      <p style="margin:0 0 16px;color:#334155;line-height:1.5">
        Recibimos una solicitud para restablecer la contraseña de tu cuenta. Si no fuiste tú, ignora este mensaje y tu contraseña seguirá siendo la misma.
      </p>
      <p style="margin:0 0 16px;color:#334155;line-height:1.5">
        Para crear una nueva contraseña haz clic en el botón. Este enlace es <strong>válido por 1 hora</strong>.
      </p>`,
    ctaLabel: 'Restablecer contraseña',
    ctaUrl: resetUrl,
    footerNote: `Si el botón no funciona, copia y pega este enlace en tu navegador:<br><span style="font-family:monospace;color:#1e3a8a;word-break:break-all;font-size:11px">${resetUrl}</span>`,
  });
  try {
    await sendMail(to, 'Recuperación de Contraseña - ISTPET Eventos', html);
  } catch (err) {
    console.error('Error enviando correo de reset:', err);
    throw err;
  }
}

/** Correo de confirmación cuando el usuario cambió su contraseña exitosamente. */
export async function sendPasswordChangedEmail(opts: { to: string; firstName: string; ipAddress?: string }) {
  const { to, firstName, ipAddress } = opts;
  const when = new Date().toLocaleString('es-EC', { timeZone: 'America/Guayaquil', dateStyle: 'long', timeStyle: 'short' });
  const html = buildEmailLayout({
    title: 'Contraseña actualizada',
    subtitle: 'Sistema de Eventos ISTPET',
    bodyHtml: `
      <p style="margin:0 0 12px;font-size:16px;color:#0f172a">Hola <strong>${firstName}</strong>,</p>
      <p style="margin:0 0 16px;color:#334155;line-height:1.5">
        Te confirmamos que la contraseña de tu cuenta fue actualizada exitosamente.
      </p>
      <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:12px;padding:16px;margin:16px 0">
        <p style="margin:0 0 6px;font-size:12px;color:#16a34a;text-transform:uppercase;letter-spacing:0.5px">Detalles del cambio</p>
        <p style="margin:4px 0;color:#0f172a"><strong>Cuando:</strong> ${when}</p>
        ${ipAddress ? `<p style="margin:4px 0;color:#0f172a"><strong>IP:</strong> ${ipAddress}</p>` : ''}
      </div>
      <div style="background:#fef3c7;border:1px solid #fbbf24;border-radius:12px;padding:14px;margin:16px 0">
        <p style="margin:0;color:#92400e;font-size:13px"><strong>⚠️ ¿No fuiste tú?</strong> Si no realizaste este cambio, contacta a la secretaría del instituto inmediatamente — tu cuenta podría estar comprometida.</p>
      </div>`,
    ctaLabel: 'Iniciar sesión',
    ctaUrl: `${FRONTEND_URL}/login`,
  });
  try {
    await sendMail(to, 'Tu contraseña fue actualizada - ISTPET Eventos', html);
  } catch (err) {
    console.error('Error enviando correo de confirmación de cambio:', err);
  }
}
