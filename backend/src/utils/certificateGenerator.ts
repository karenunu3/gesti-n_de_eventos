import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// Colores ISTPET
const COLORS = {
  primary: '#1F295B',      // Azul ISTPET
  secondary: '#D4AF37',    // Dorado ISTPET
  dark: '#0F1829',         // Azul oscuro
  light: '#F5F7FA',        // Gris claro
  text: '#1A202C',         // Texto oscuro
};

// Meses en español
const MONTHS_ES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

export const generateProfessionalCertificate = async (
  options: {
    studentName: string;
    careerName: string;
    eventTitle: string;
    eventDate: Date;
    hours: number;
    certificateCode: string;
    frontendUrl: string;
  }
): Promise<Buffer> => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 0,
        layout: 'landscape'
      });

      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      const width = doc.page.width; // 841.89
      const height = doc.page.height; // 595.28

      // === FONDO BLANCO ELEGANTE ===
      doc.rect(0, 0, width, height).fill('#FAFAFC');

      // === BORDES DECORATIVOS ===
      // Borde externo grueso azul
      doc.strokeColor('#1F295B').lineWidth(4);
      doc.rect(40, 40, width - 80, height - 80).stroke();

      // Borde interno fino dorado
      doc.strokeColor('#D4AF37').lineWidth(1.5);
      doc.rect(48, 48, width - 96, height - 96).stroke();

      // === ASSETS VISUALES ===
      const logoPath = path.join(__dirname, '../assets/logo.png');
      const selloPath = path.join(__dirname, '../assets/sello.png');

      if (fs.existsSync(logoPath)) {
        // Logo superior centrado
        doc.image(logoPath, width / 2 - 110, 60, { width: 220 });
      } else {
        doc.fontSize(24).font('Helvetica-Bold').fillColor('#1F295B').text('ISTPET', 0, 80, { align: 'center' });
      }

      // === ENCABEZADO ===
      doc.moveDown(4);
      doc.fontSize(12).font('Helvetica').fillColor('#666666').text(
        'El Instituto Superior Tecnológico Público "Eleazar Tovar"',
        0, 160,
        { align: 'center' }
      );
      doc.fontSize(11).font('Helvetica-Oblique').fillColor('#888888').text(
        'Otorga el presente',
        0, 180,
        { align: 'center' }
      );

      // === TÍTULO PRINCIPAL ===
      doc.fontSize(32).font('Helvetica-Bold').fillColor('#1F295B').text(
        'CERTIFICADO DE PARTICIPACIÓN',
        0, 215,
        { align: 'center', characterSpacing: 2 }
      );

      // === DATOS DEL ALUMNO ===
      doc.fontSize(12).font('Helvetica').fillColor('#666666').text(
        'A nombre de:',
        0, 270,
        { align: 'center' }
      );

      // Nombre del alumno destacado
      doc.fontSize(26).font('Helvetica-Bold').fillColor('#D4AF37').text(
        options.studentName.toUpperCase(),
        0, 290,
        { align: 'center' }
      );

      // Línea dorada debajo del nombre
      doc.strokeColor('#D4AF37').lineWidth(1);
      doc.moveTo(width / 2 - 180, 325).lineTo(width / 2 + 180, 325).stroke();

      doc.fontSize(12).font('Helvetica').fillColor('#666666').text(
        `Carrera: ${options.careerName}`,
        0, 335,
        { align: 'center' }
      );

      // === DETALLES DEL EVENTO ===
      doc.fontSize(12).fillColor('#444444').font('Helvetica').text(
        'Por haber aprobado satisfactoriamente el evento académico:',
        0, 380,
        { align: 'center' }
      );

      doc.fontSize(16).font('Helvetica-Bold').fillColor('#1F295B').text(
        `"${options.eventTitle}"`,
        0, 400,
        { align: 'center' }
      );

      const eventDate = new Date(options.eventDate);
      const dayOfMonth = eventDate.getDate();
      const month = MONTHS_ES[eventDate.getMonth()];
      const year = eventDate.getFullYear();
      const formattedDate = `${dayOfMonth} de ${month} de ${year}`;

      doc.fontSize(11).font('Helvetica').fillColor('#666666').text(
        `Realizado el ${formattedDate} con una duración de ${options.hours} hora${options.hours > 1 ? 's' : ''} académicas.`,
        0, 425,
        { align: 'center' }
      );

      // === SELLO ===
      if (fs.existsSync(selloPath)) {
        doc.image(selloPath, width - 180, height - 190, { width: 110 });
      }

      // === CÓDIGO QR Y VERIFICACIÓN (Abajo a la izquierda, bien posicionado) ===
      const qrUrl = `${options.frontendUrl}/verify/${options.certificateCode}`;
      const qrDataUrl = await QRCode.toDataURL(qrUrl, {
        errorCorrectionLevel: 'H',
        width: 90,
        margin: 1
      });

      const qrY = height - 150; // Posición Y segura (595 - 150 = 445)
      doc.image(qrDataUrl, 80, qrY, { width: 80, height: 80 });

      // === FIRMA DIGITAL RSA ===
      let signatureBase64 = 'N/A';
      try {
        const privateKey = process.env.PRIVATE_KEY;
        if (privateKey) {
          const dataToSign = `${options.studentName}|${options.eventTitle}|${options.certificateCode}`;
          const sign = crypto.createSign('SHA256');
          sign.update(dataToSign);
          sign.end();
          signatureBase64 = sign.sign(privateKey, 'base64');
        } else {
          const hash = crypto.createHash('sha256');
          hash.update(`${options.studentName}|${options.eventTitle}|${options.certificateCode}`);
          signatureBase64 = hash.digest('base64');
        }
      } catch (e) {
        console.error('Error al generar firma:', e);
      }

      // Textos de verificación junto al QR
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#1F295B').text(
        'CÓDIGO DE VERIFICACIÓN:',
        170, qrY + 10
      );
      doc.fontSize(9).font('Helvetica').fillColor('#666666').text(
        options.certificateCode,
        170, qrY + 22
      );

      doc.fontSize(7).font('Helvetica-Bold').fillColor('#1F295B').text(
        'FIRMA DIGITAL (SHA256):',
        170, qrY + 40
      );
      doc.fontSize(6).font('Helvetica').fillColor('#888888').text(
        signatureBase64.substring(0, 55) + '...',
        170, qrY + 50
      );

      doc.fontSize(8).font('Helvetica').fillColor('#D4AF37').text(
        'Valide este certificado en: verify.istpet.edu.ec',
        170, qrY + 65
      );

      // === FIRMA AUTORIZADA ===
      doc.strokeColor('#1F295B').lineWidth(1);
      doc.moveTo(width / 2 - 100, height - 90).lineTo(width / 2 + 100, height - 90).stroke();
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#1F295B').text(
        'COORDINACIÓN ACADÉMICA',
        0, height - 85,
        { align: 'center' }
      );
      doc.fontSize(8).font('Helvetica').fillColor('#666666').text(
        'ISTPET - Excelencia Académica',
        0, height - 73,
        { align: 'center' }
      );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
