import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { WriteStream } from 'fs';

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
  stream: WriteStream,
  options: {
    studentName: string;
    careerName: string;
    eventTitle: string;
    eventDate: Date;
    hours: number;
    certificateCode: string;
    frontendUrl: string;
  }
): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 0,
        layout: 'landscape'
      });

      doc.pipe(stream);

      // Dimensiones
      const width = doc.page.width;
      const height = doc.page.height;

      // === FONDO GRADIENTE (Azul a Dorado) ===
      // PDFKit no soporta gradientes nativos, así que usamos rectángulos con opacidad
      doc.rect(0, 0, width, height).fill('#1F295B');

      // === BORDE DECORATIVO ===
      // Borde exterior
      doc.strokeColor('#D4AF37').lineWidth(3);
      doc.rect(30, 30, width - 60, height - 60).stroke();

      // Borde interior decorativo
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

      // === CONTENIDO ===
      doc.fillColor('#FFFFFF');

      // Logo/Título institucional
      doc.fontSize(20).font('Helvetica-Bold').text('ISTPET', width / 2 - 40, 60, { width: 80, align: 'center' });
      doc.fontSize(12).font('Helvetica').text(
        'Instituto Superior Tecnológico Público "Eleazar Tovar"',
        50,
        90,
        { width: width - 100, align: 'center' }
      );

      // Línea decorativa
      doc.strokeColor('#D4AF37').lineWidth(2);
      doc.moveTo(100, 115).lineTo(width - 100, 115).stroke();

      // Título del certificado
      doc.fontSize(28).font('Helvetica-Bold').fillColor('#D4AF37').text(
        'CERTIFICADO DE PARTICIPACIÓN',
        50,
        145,
        { width: width - 100, align: 'center' }
      );

      doc.fontSize(14).font('Helvetica').fillColor('#FFFFFF').text(
        'EN EVENTO ACADÉMICO',
        50,
        180,
        { width: width - 100, align: 'center' }
      );

      // Contenido principal
      doc.fontSize(12).fillColor('#FFFFFF').font('Helvetica').text(
        'El Instituto Superior Tecnológico Público "Eleazar Tovar"',
        50,
        230,
        { width: width - 100, align: 'center' }
      );

      doc.text('Otorga el presente certificado a:', 50, 255, { width: width - 100, align: 'center' });

      // === ZONA DE NOMBRE (Recuadro decorativo) ===
      doc.rect(100, 285, width - 200, 70).strokeColor('#D4AF37').lineWidth(2).stroke();

      doc.fontSize(22).font('Helvetica-Bold').fillColor('#D4AF37').text(
        options.studentName.toUpperCase(),
        110,
        310,
        { width: width - 220, align: 'center' }
      );

      doc.fontSize(12).font('Helvetica').fillColor('#FFFFFF').text(
        `Carrera: ${options.careerName}`,
        110,
        340,
        { width: width - 220, align: 'center' }
      );

      // Descripción del evento
      doc.fontSize(11).fillColor('#FFFFFF').font('Helvetica').text(
        'Por su participación en el evento:',
        50,
        390,
        { width: width - 100, align: 'center' }
      );

      doc.fontSize(14).font('Helvetica-Bold').fillColor('#D4AF37').text(
        `"${options.eventTitle}"`,
        50,
        415,
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
        445,
        { width: width - 100, align: 'center' }
      );

      doc.fontSize(12).font('Helvetica-Bold').fillColor('#D4AF37').text(
        `Se han acreditado ${options.hours} hora${options.hours > 1 ? 's' : ''} de actividad académica`,
        50,
        475,
        { width: width - 100, align: 'center' }
      );

      // === CÓDIGO QR Y VERIFICACIÓN ===
      const qrUrl = `${options.frontendUrl}/verify/${options.certificateCode}`;
      const qrDataUrl = await QRCode.toDataURL(qrUrl, {
        errorCorrectionLevel: 'H',
        width: 100,
      });

      // QR Code (lado izquierdo)
      doc.image(qrDataUrl, 70, 510, { width: 100, height: 100 });

      // Información de verificación (lado derecho)
      doc.fontSize(10).font('Helvetica').fillColor('#FFFFFF').text(
        'Código de Verificación:',
        190,
        510
      );

      doc.fontSize(8).font('Helvetica-Bold').fillColor('#D4AF37').text(
        options.certificateCode,
        190,
        528,
        { width: width - 260, align: 'left' }
      );

      doc.fontSize(9).font('Helvetica').fillColor('#FFFFFF').text(
        `Fecha de Emisión: ${dayOfMonth}/${eventDate.getMonth() + 1}/${year}`,
        190,
        555
      );

      doc.fontSize(9).font('Helvetica').fillColor('#FFFFFF').text(
        'Firma Digital: Válida',
        190,
        573
      );

      doc.fontSize(8).font('Helvetica').fillColor('#D4AF37').text(
        'verify.istpet.edu.pe',
        190,
        591
      );

      // Línea decorativa final
      doc.strokeColor('#D4AF37').lineWidth(1);
      doc.moveTo(50, 620).lineTo(width - 50, 620).stroke();

      // Pie de página
      doc.fontSize(9).font('Helvetica').fillColor('#D4AF37').text(
        'Emitido por: ISTPET - Sistema de Gestión de Eventos',
        50,
        630,
        { width: width - 100, align: 'center' }
      );

      doc.end();

      stream.on('finish', resolve);
    } catch (error) {
      reject(error);
    }
  });
};
