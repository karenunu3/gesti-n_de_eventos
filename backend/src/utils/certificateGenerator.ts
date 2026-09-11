import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { EMBEDDED_BG_BASE64 } from '../assets/certificate_bg_base64';

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
        '/app/src/assets/certificate_background.png',
        '/app/dist/assets/certificate_background.png',
      ];

      const bgPath = possibleBgPaths.find(p => fs.existsSync(p));
      if (bgPath) {
        doc.image(bgPath, 0, 0, { width, height });
      } else {
        // Fallback garantizado mediante Buffer Base64 embebido
        const imgBuffer = Buffer.from(EMBEDDED_BG_BASE64, 'base64');
        doc.image(imgBuffer, 0, 0, { width, height });
      }

      // === 1. NOMBRE DEL ALUMNO ===
      // Ubicado centrado sobre la primera línea dorada (Y = 246 pt)
      const studentNameUpper = (options.studentName || '').toUpperCase();
      doc.fontSize(22).font('Helvetica-Bold').fillColor('#1A2C56')
         .text(studentNameUpper, 60, 246, { width: width - 120, align: 'center' });

      // === 2. TÍTULO DEL EVENTO ===
      // Ubicado centrado sobre la segunda línea dorada (Y = 326 pt)
      const eventTitleText = options.eventTitle || 'Evento Institucional ISTPET';
      doc.fontSize(17).font('Helvetica-Bold').fillColor('#1A2C56')
         .text(eventTitleText, 60, 326, { width: width - 120, align: 'center' });

      // === 3. FECHA DEL EVENTO ===
      // Ubicada limpiamente sobre la línea de fecha (Y = 377 pt)
      const dateObj = new Date(options.eventDate);
      const day = dateObj.getDate();
      const month = MONTHS_ES[dateObj.getMonth()] || 'septiembre';
      const year = dateObj.getFullYear();
      const dateText = `Realizado el día ${day} de ${month} de ${year}, en las instalaciones del ISTPET.`;

      doc.fontSize(11).font('Helvetica-Oblique').fillColor('#1A2C56')
         .text(dateText, 60, 377, { width: width - 120, align: 'center' });

      // === 4. RESPONSABLE Y DIRECTOR ===
      // Nombres posicionados ARRIBA de la línea de firma (Y = 460 pt)
      const respName = options.responsibleName || 'Coordinación del Evento';
      const respRole = options.responsibleRole || 'Responsable Académico';
      const dirName = options.directorName || 'Dirección Institucional';
      const dirRole = options.directorRole || 'Rectorado ISTPET';

      doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#1A2C56')
         .text(respName, 170, 460, { width: 220, align: 'center' });
      doc.fontSize(8).font('Helvetica').fillColor('#444444')
         .text(respRole, 170, 472, { width: 220, align: 'center' });

      doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#1A2C56')
         .text(dirName, 450, 460, { width: 220, align: 'center' });
      doc.fontSize(8).font('Helvetica').fillColor('#444444')
         .text(dirRole, 450, 472, { width: 220, align: 'center' });

      // === 5. CÓDIGO QR DE AUTENTICIDAD ===
      // Ubicado exactamente dentro del recuadro blanco inferior derecho
      const qrUrl = `${options.frontendUrl}/verify/${options.certificateCode}`;
      const qrDataUrl = await QRCode.toDataURL(qrUrl, {
        errorCorrectionLevel: 'H',
        margin: 0
      });

      doc.image(qrDataUrl, 696, 406, { width: 92, height: 92 });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
