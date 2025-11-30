import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

interface TicketData {
  ticketId: string;
  passengerName: string;
  passengerCedula: string;
  cooperativaName: string;
  origin: string;
  destination: string;
  date: string;
  time: string;
  seatNumber: number;
  busPlaca: string;
  totalPrice: number;
  qrCode: string;
}

export const generateTicketPDF = async (data: TicketData): Promise<Buffer> => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Generar QR Code
      const qrCodeDataUrl = await QRCode.toDataURL(data.qrCode);
      const qrCodeBuffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');

      // Encabezado
      doc.fontSize(24).font('Helvetica-Bold').text(data.cooperativaName, { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(18).font('Helvetica').text('BOLETO DE VIAJE', { align: 'center' });
      doc.moveDown(2);

      // Información del pasajero
      doc.fontSize(12).font('Helvetica-Bold').text('INFORMACIÓN DEL PASAJERO');
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica');
      doc.text(`Nombre: ${data.passengerName}`);
      doc.text(`Cédula: ${data.passengerCedula}`);
      doc.text(`No. Ticket: ${data.ticketId}`);
      doc.moveDown(1.5);

      // Información del viaje
      doc.fontSize(12).font('Helvetica-Bold').text('INFORMACIÓN DEL VIAJE');
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica');
      doc.text(`Origen: ${data.origin}`);
      doc.text(`Destino: ${data.destination}`);
      doc.text(`Fecha: ${data.date}`);
      doc.text(`Hora: ${data.time}`);
      doc.text(`Bus: ${data.busPlaca}`);
      doc.text(`Asiento No. ${data.seatNumber}`, { continued: true });
      doc.fontSize(14).font('Helvetica-Bold').text(`    Total: $${data.totalPrice}`, { align: 'right' });
      doc.moveDown(2);

      // QR Code
      doc.fontSize(12).font('Helvetica-Bold').text('CÓDIGO QR', { align: 'center' });
      doc.moveDown(0.5);
      doc.image(qrCodeBuffer, doc.page.width / 2 - 75, doc.y, { width: 150, height: 150 });
      doc.moveDown(10);

      // Footer
      doc.fontSize(8).font('Helvetica').text(
        'Presente este boleto al momento de abordar. Conserve su boleto durante todo el viaje.',
        { align: 'center' }
      );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
