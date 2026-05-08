import { sendMail } from './mailer';

const ISTPET_DOMAIN = '@istpet.edu.ec';
const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

/** Devuelve mensaje de error o null si el correo es válido (institucional). */
export function validateInstitutionalEmail(email: string): string | null {
  if (!email) return 'El correo es obligatorio.';
  if (email.length > 254) return 'El correo es demasiado largo.';
  if (!EMAIL_RE.test(email)) return 'Formato de correo inválido.';
  if (!email.toLowerCase().endsWith(ISTPET_DOMAIN)) {
    return `Solo se aceptan correos institucionales (${ISTPET_DOMAIN}).`;
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
