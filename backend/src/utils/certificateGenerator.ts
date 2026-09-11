import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';

const MONTHS_ES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

export interface CertificateOptions {
  studentName: string;
  careerName?: string;
  eventTitle: string;
  eventDate: Date | string;
  hours?: number;
  certificateCode: string;
  frontendUrl: string;
  responsibleName?: string;
  responsibleRole?: string;
  directorName?: string;
  directorRole?: string;
}

export const generateProfessionalCertificate = async (
  options: CertificateOptions
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

      const width = doc.page.width;   // 841.89
      const height = doc.page.height; // 595.28

      // === FONDO BASE INSTITUCIONAL ===
      const possibleBgPaths = [
        path.join(__dirname, '../assets/certificate_background.png'),
        path.join(__dirname, '../../src/assets/certificate_background.png'),
        path.join(process.cwd(), 'src/assets/certificate_background.png'),
        path.join(process.cwd(), 'dist/assets/certificate_background.png'),
        path.join(process.cwd(), 'backend/src/assets/certificate_background.png'),
        path.join(process.cwd(), 'backend/dist/assets/certificate_background.png'),
      ];

      const bgPath = possibleBgPaths.find(p => fs.existsSync(p));
      if (bgPath) {
        doc.image(bgPath, 0, 0, { width, height });
      } else {
        console.warn('certificate_background.png no fue encontrado en:', possibleBgPaths);
        doc.rect(0, 0, width, height).fill('#FAFAFC');
      }

      // === 1. NOMBRE DEL ALUMNO ===
      // Se ubica centrado sobre la primera línea dorada
      const studentNameUpper = (options.studentName || '').toUpperCase();
      doc.fontSize(22).font('Helvetica-Bold').fillColor('#1A2C56')
         .text(studentNameUpper, 80, 240, { width: width - 160, align: 'center' });

      // === 2. TÍTULO DEL EVENTO ===
      // Se ubica centrado sobre la segunda línea dorada
      const eventTitleText = options.eventTitle || 'Evento Institucional ISTPET';
      doc.fontSize(17).font('Helvetica-Bold').fillColor('#1A2C56')
         .text(eventTitleText, 80, 310, { width: width - 160, align: 'center' });

      // === 3. FECHA DEL EVENTO ===
      // Parche sutil para tapar la línea de guiones del fondo
      doc.rect(140, 373, width - 280, 22).fill('#FAFAFC');

      const dateObj = new Date(options.eventDate);
      const day = dateObj.getDate();
      const month = MONTHS_ES[dateObj.getMonth()] || 'marzo';
      const year = dateObj.getFullYear();
      const dateText = `Realizado el día ${day} de ${month} de ${year}, en las instalaciones del ISTPET.`;

      doc.fontSize(11.5).font('Helvetica-Oblique').fillColor('#222222')
         .text(dateText, 80, 377, { width: width - 160, align: 'center' });

      // === 4. RESPONSABLE Y DIRECTOR ===
      const respName = options.responsibleName || 'Coordinación del Evento';
      const respRole = options.responsibleRole || 'Responsable Académico';
      const dirName = options.directorName || 'Dirección / Rectorado';
      const dirRole = options.directorRole || 'ISTPET Excelencia Académica';

      doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#1A2C56')
         .text(respName, 170, 484, { width: 220, align: 'center' });
      doc.fontSize(8).font('Helvetica').fillColor('#555555')
         .text(respRole, 170, 497, { width: 220, align: 'center' });

      doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#1A2C56')
         .text(dirName, 450, 484, { width: 220, align: 'center' });
      doc.fontSize(8).font('Helvetica').fillColor('#555555')
         .text(dirRole, 450, 497, { width: 220, align: 'center' });

      // === 5. CÓDIGO QR DE AUTENTICIDAD ===
      const qrUrl = `${options.frontendUrl}/verify/${options.certificateCode}`;
      const qrDataUrl = await QRCode.toDataURL(qrUrl, {
        errorCorrectionLevel: 'H',
        margin: 0
      });

      // Recuadro blanco inferior derecho
      doc.image(qrDataUrl, 698, 404, { width: 96, height: 96 });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
