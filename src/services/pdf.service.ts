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

interface RouteSheetData {
  cooperativaName: string;
  groupName: string;
  startDate: string;
  endDate: string;
  buses: Array<{
    placa: string;
    numeroInterno: string;
  }>;
  schedule: Array<{
    date: string;
    trips: Array<{
      busPlaca: string;
      departureTime: string;
      arrivalTime: string;
      route: string;
      stops: string;
      driver: string;
      passengersCount: number;
    }>;
  }>;
}

export const generateRouteSheetPDF = async (data: RouteSheetData): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 20 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Encabezado
      doc.fontSize(14).font('Helvetica-Bold').text(data.cooperativaName, { align: 'center' });
      doc.moveDown(0.2);
      doc.fontSize(11).font('Helvetica').text(`Hoja de Ruta - ${data.groupName}`, { align: 'center' });
      doc.fontSize(8).text(`Período: ${data.startDate} - ${data.endDate}`, { align: 'center' });
      doc.moveDown(0.5);

      // Organizar: por hora, agrupar frecuencias del mismo bus
      const timeSlots = new Map<string, {
        routesAndStops: string; // Rutas concatenadas con saltos de línea
        dateAssignments: Map<string, string>; // fecha -> bus
      }>();

        for (const day of data.schedule) {
        // Agrupar viajes del mismo día por hora y bus
        const dayByHourAndBus = new Map<string, Map<string, any[]>>();
        
        for (const trip of day.trips) {
          const hourKey = `${trip.departureTime}-${trip.arrivalTime}`;
          if (!dayByHourAndBus.has(hourKey)) {
            dayByHourAndBus.set(hourKey, new Map());
          }
          
          const busMap = dayByHourAndBus.get(hourKey)!;
          if (!busMap.has(trip.busPlaca)) {
            busMap.set(trip.busPlaca, []);
          }
          
          busMap.get(trip.busPlaca)!.push(trip);
        }        // Procesar y crear claves únicas por hora
        for (const [hour, busTrips] of dayByHourAndBus) {
          for (const [busPlaca, trips] of busTrips) {
            // Concatenar rutas del mismo bus
            const routesText = trips.map(t => `${t.route}`).join('\n');
            const stopsText = trips.map(t => t.stops).join('\n');
            
            const key = `${hour}|${routesText}|${stopsText}`;
            
            if (!timeSlots.has(key)) {
              timeSlots.set(key, {
                routesAndStops: `${routesText}|||${stopsText}`, // Separador especial
                dateAssignments: new Map()
              });
            }
            
            timeSlots.get(key)!.dateAssignments.set(day.date, busPlaca);
          }
        }
      }

      // Obtener fechas únicas ordenadas
      const allDates = Array.from(new Set(data.schedule.map(s => s.date))).sort();

      // Calcular anchos dinámicos para que todo quepa en la hoja
      const pageWidth = doc.page.width - 40;
      const hourCol = 40;
      const routeCol = 100;
      const stopsCol = 120;
      const remainingWidth = pageWidth - hourCol - routeCol - stopsCol;
      const dateColWidth = Math.floor(remainingWidth / allDates.length);

      let y = doc.y;

      // Encabezados
      doc.fontSize(8).font('Helvetica-Bold');
      
      // HORA
      doc.rect(20, y, hourCol, 30).stroke();
      doc.text('HORA', 25, y + 11, { width: hourCol - 10 });

      // FRECUENCIAS
      let x = 20 + hourCol;
      doc.rect(x, y, routeCol, 30).stroke();
      doc.text('FRECUENCIAS', x + 5, y + 11, { width: routeCol - 10, align: 'center' });

      // PARADAS
      x += routeCol;
      doc.rect(x, y, stopsCol, 30).stroke();
      doc.text('PARADAS', x + 5, y + 11, { width: stopsCol - 10, align: 'center' });

      // FECHAS (columnas dinámicas)
      x += stopsCol;
      for (const date of allDates) {
        doc.rect(x, y, dateColWidth, 30).stroke();
        const dateObj = new Date(date + 'T00:00:00');
        const formattedDate = dateObj.toLocaleDateString('es-EC', { 
          day: '2-digit', 
          month: '2-digit' 
        });
        doc.text(formattedDate, x + 2, y + 11, { width: dateColWidth - 4, align: 'center' });
        x += dateColWidth;
      }

      y += 30;

      // Datos
      doc.fontSize(6.5).font('Helvetica');
      const sortedSlots = Array.from(timeSlots.entries()).sort((a, b) => {
        const [timeA] = a[0].split('|');
        const [timeB] = b[0].split('|');
        return timeA.localeCompare(timeB);
      });

      for (const [key, slotData] of sortedSlots) {
        const [timeRange, ...rest] = key.split('|');
        const combinedText = slotData.routesAndStops;
        const [routesText, stopsText] = combinedText.split('|||');
        
        // Calcular altura dinámica según número de líneas
        const routeLines = routesText.split('\n');
        const stopsLines = stopsText.split('\n');
        const maxLines = Math.max(routeLines.length, stopsLines.length);
        const rowHeight = Math.max(35, 12 + (maxLines * 10));
        
        // Verificar si necesitamos nueva página
        if (y > doc.page.height - 60) {
          doc.addPage();
          y = 30;
          
          // Repetir encabezados
          doc.fontSize(8).font('Helvetica-Bold');
          doc.rect(20, y, hourCol, 30).stroke();
          doc.text('HORA', 25, y + 11, { width: hourCol - 10 });
          
          x = 20 + hourCol;
          doc.rect(x, y, routeCol, 30).stroke();
          doc.text('FRECUENCIAS', x + 5, y + 11, { width: routeCol - 10, align: 'center' });
          
          x += routeCol;
          doc.rect(x, y, stopsCol, 30).stroke();
          doc.text('PARADAS', x + 5, y + 11, { width: stopsCol - 10, align: 'center' });
          
          x += stopsCol;
          for (const date of allDates) {
            doc.rect(x, y, dateColWidth, 30).stroke();
            const dateObj = new Date(date + 'T00:00:00');
            const formattedDate = dateObj.toLocaleDateString('es-EC', { 
              day: '2-digit', 
              month: '2-digit' 
            });
            doc.text(formattedDate, x + 2, y + 11, { width: dateColWidth - 4, align: 'center' });
            x += dateColWidth;
          }
          
          y += 30;
          doc.fontSize(6.5).font('Helvetica');
        }

        // HORA (Salida - Llegada)
        doc.rect(20, y, hourCol, rowHeight).stroke();
        const [depTime, arrTime] = timeRange.split('-');
        const labelY = y + (rowHeight / 2) - 12;
        doc.fontSize(5).font('Helvetica');
        doc.text('Salida:', 21, labelY, { width: hourCol - 2, align: 'center' });
        doc.fontSize(6.5).font('Helvetica-Bold');
        doc.text(depTime, 21, labelY + 6, { width: hourCol - 2, align: 'center' });
        doc.fontSize(5).font('Helvetica');
        doc.text('Llegada:', 21, labelY + 13, { width: hourCol - 2, align: 'center' });
        doc.fontSize(6.5).font('Helvetica-Bold');
        doc.text(arrTime, 21, labelY + 19, { width: hourCol - 2, align: 'center' });
        doc.fontSize(6.5).font('Helvetica');

        // FRECUENCIAS (múltiples líneas)
        x = 20 + hourCol;
        doc.rect(x, y, routeCol, rowHeight).stroke();
        let textY = y + 5;
        doc.font('Helvetica');
        for (const route of routeLines) {
          doc.text(route, x + 3, textY, { width: routeCol - 6, align: 'left' });
          textY += 10;
        }

        // PARADAS (múltiples líneas)
        x += routeCol;
        doc.rect(x, y, stopsCol, rowHeight).stroke();
        textY = y + 5;
        for (const stop of stopsLines) {
          doc.text(stop, x + 3, textY, { width: stopsCol - 6, align: 'left' });
          textY += 10;
        }

        // BUSES POR FECHA
        x += stopsCol;
        for (const date of allDates) {
          doc.rect(x, y, dateColWidth, rowHeight).stroke();
          const busPlaca = slotData.dateAssignments.get(date);
          if (busPlaca) {
            doc.font('Helvetica-Bold').text(busPlaca, x + 2, y + (rowHeight / 2) - 5, { 
              width: dateColWidth - 4, 
              align: 'center' 
            });
          } else {
            doc.font('Helvetica').text('-', x + 2, y + (rowHeight / 2) - 5, { 
              width: dateColWidth - 4, 
              align: 'center' 
            });
          }
          x += dateColWidth;
        }

        y += rowHeight;
      }

      // Footer
      doc.fontSize(6).font('Helvetica').text(
        `Generado: ${new Date().toLocaleDateString('es-EC')} ${new Date().toLocaleTimeString('es-EC')}`,
        20,
        doc.page.height - 30,
        { align: 'center' }
      );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
