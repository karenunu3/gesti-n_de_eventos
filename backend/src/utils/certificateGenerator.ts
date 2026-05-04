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

      // Dimensiones
      const width = doc.page.width;
      const height = doc.page.height;

      // === FONDO GRADIENTE (Azul a Dorado) ===
      doc.rect(0, 0, width, height).fill('#1F295B');

      // === BORDE DECORATIVO ===
      doc.strokeColor('#D4AF37').lineWidth(3);
      doc.rect(30, 30, width - 60, height - 60).stroke();

      doc.strokeColor('#D4AF37').lineWidth(1);
      doc.rect(45, 45, width - 90, height - 90).stroke();

      // === ESQUINAS DECORATIVAS ===
      const cornerSize = 15;
      const corners = [
        { x: 30, y: 30 },
        { x: width - 30, y: 30 },
        { x: 30, y: height - 30 },
        { x: width - 30, y: height - 30 },
      ];

      doc.fillColor('#D4AF37');
      corners.forEach(({ x, y }) => {
        doc.circle(x, y, cornerSize / 2).fill();
      });

      // === ASSETS VISUALES ===
      const logoPath = path.join(__dirname, '../assets/logo.png');
      const selloPath = path.join(__dirname, '../assets/sello.png');

      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, width / 2 - 40, 20, { width: 80 });
      }

      // === CONTENIDO ===
      doc.fillColor('#FFFFFF');

      if (!fs.existsSync(logoPath)) {
        doc.fontSize(20).font('Helvetica-Bold').text('ISTPET', width / 2 - 40, 60, { width: 80, align: 'center' });
      }

      doc.fontSize(12).font('Helvetica').text(
        'Instituto Superior Tecnológico Público "Eleazar Tovar"',
        50,
        100,
        { width: width - 100, align: 'center' }
      );

      // Línea decorativa
      doc.strokeColor('#D4AF37').lineWidth(2);
      doc.moveTo(100, 125).lineTo(width - 100, 125).stroke();

      // Título del certificado
      doc.fontSize(28).font('Helvetica-Bold').fillColor('#D4AF37').text(
        'CERTIFICADO DE PARTICIPACIÓN',
        50,
        155,
        { width: width - 100, align: 'center' }
      );

      doc.fontSize(14).font('Helvetica').fillColor('#FFFFFF').text(
        'EN EVENTO ACADÉMICO',
        50,
        190,
        { width: width - 100, align: 'center' }
      );

      // Contenido principal
      doc.fontSize(12).fillColor('#FFFFFF').font('Helvetica').text(
        'El Instituto Superior Tecnológico Público "Eleazar Tovar"',
        50,
        240,
        { width: width - 100, align: 'center' }
      );

      doc.text('Otorga el presente certificado a:', 50, 265, { width: width - 100, align: 'center' });

      // === ZONA DE NOMBRE (Recuadro decorativo) ===
      doc.rect(100, 295, width - 200, 70).strokeColor('#D4AF37').lineWidth(2).stroke();

      doc.fontSize(22).font('Helvetica-Bold').fillColor('#D4AF37').text(
        options.studentName.toUpperCase(),
        110,
        320,
        { width: width - 220, align: 'center' }
      );

      doc.fontSize(12).font('Helvetica').fillColor('#FFFFFF').text(
        `Carrera: ${options.careerName}`,
        110,
        350,
        { width: width - 220, align: 'center' }
      );

      // Descripción del evento
      doc.fontSize(11).fillColor('#FFFFFF').font('Helvetica').text(
        'Por su participación en el evento:',
        50,
        400,
        { width: width - 100, align: 'center' }
      );

      doc.fontSize(14).font('Helvetica-Bold').fillColor('#D4AF37').text(
        `"${options.eventTitle}"`,
        50,
        425,
        { width: width - 100, align: 'center' }
      );

      // Detalles del evento
      const eventDate = new Date(options.eventDate);
      const dayOfMonth = eventDate.getDate();
      const month = MONTHS_ES[eventDate.getMonth()];
      const year = eventDate.getFullYear();
      const formattedDate = `${dayOfMonth} de ${month} de ${year}`;

      doc.fontSize(11).font('Helvetica').fillColor('#FFFFFF').text(
        `Realizado el: ${formattedDate} | Duración: ${options.hours} hora${options.hours > 1 ? 's' : ''}`,
        50,
        455,
        { width: width - 100, align: 'center' }
      );

      doc.fontSize(12).font('Helvetica-Bold').fillColor('#D4AF37').text(
        `Se han acreditado ${options.hours} hora${options.hours > 1 ? 's' : ''} de actividad académica`,
        50,
        485,
        { width: width - 100, align: 'center' }
      );

      // === CÓDIGO QR Y VERIFICACIÓN ===
      const qrUrl = `${options.frontendUrl}/verify/${options.certificateCode}`;
      const qrDataUrl = await QRCode.toDataURL(qrUrl, {
        errorCorrectionLevel: 'H',
        width: 100,
      });

      // QR Code (lado izquierdo)
      doc.image(qrDataUrl, 70, 520, { width: 100, height: 100 });

      if (fs.existsSync(selloPath)) {
        doc.image(selloPath, width - 170, 470, { width: 100 });
      }

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
          // Fallback para desarrollo: Hash simple si no hay llave
          const hash = crypto.createHash('sha256');
          hash.update(`${options.studentName}|${options.eventTitle}|${options.certificateCode}`);
          signatureBase64 = hash.digest('base64');
        }
      } catch (e) {
        console.error('Error al generar firma:', e);
      }

      // Información de verificación (lado derecho)
      doc.fontSize(10).font('Helvetica').fillColor('#FFFFFF').text(
        'Código de Verificación:',
        190,
        520
      );

      doc.fontSize(8).font('Helvetica-Bold').fillColor('#D4AF37').text(
        options.certificateCode,
        190,
        538,
        { width: width - 260, align: 'left' }
      );

      doc.fontSize(9).font('Helvetica').fillColor('#FFFFFF').text(
        `Fecha de Emisión: ${dayOfMonth}/${eventDate.getMonth() + 1}/${year}`,
        190,
        565
      );

      // Mostrar primeros 40 caracteres de la firma digital
      doc.fontSize(7).font('Helvetica').fillColor('#FFFFFF').text(
        `Firma Digital (SHA256-RSA):`,
        190,
        583
      );
      doc.fontSize(6).font('Helvetica').fillColor('#D4AF37').text(
        signatureBase64.substring(0, 50) + '...',
        190,
        595
      );

      doc.fontSize(8).font('Helvetica').fillColor('#D4AF37').text(
        'verify.istpet.edu.pe',
        190,
        610
      );

      // Línea decorativa final
      doc.strokeColor('#D4AF37').lineWidth(1);
      doc.moveTo(50, 630).lineTo(width - 50, 630).stroke();

      // Pie de página
      doc.fontSize(9).font('Helvetica').fillColor('#D4AF37').text(
        'Emitido por: ISTPET - Sistema de Gestión de Eventos',
        50,
        640,
        { width: width - 100, align: 'center' }
      );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
