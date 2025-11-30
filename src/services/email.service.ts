import nodemailer from 'nodemailer';

// Gmail con contraseña de aplicación
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.BREVO_FROM_EMAIL, // dl735894@gmail.com
    pass: process.env.GMAIL_APP_PASSWORD // contraseña de aplicación
  }
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
}

export const sendEmail = async (options: EmailOptions) => {
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.BREVO_FROM_NAME}" <${process.env.BREVO_FROM_EMAIL}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments
    });

    console.log('Email enviado exitosamente:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error enviando email:', error);
    throw error;
  }
};

export const sendVerificationEmail = async (email: string, token: string, name: string) => {
  const verificationUrl = `http://localhost:3000/api/auth/verify-email?token=${token}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button { display: inline-block; padding: 12px 24px; background-color: #1976d2; color: white; text-decoration: none; border-radius: 5px; }
          .footer { margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>¡Bienvenido a MoviPass, ${name}!</h2>
          <p>Gracias por registrarte. Para completar tu registro, por favor verifica tu correo electrónico:</p>
          <p><a href="${verificationUrl}" class="button">Verificar Email</a></p>
          <p>O copia y pega este enlace en tu navegador:</p>
          <p>${verificationUrl}</p>
          <div class="footer">
            <p>Si no creaste esta cuenta, puedes ignorar este correo.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: 'Verifica tu correo electrónico - MoviPass',
    html
  });
};

export const sendPasswordResetEmail = async (email: string, token: string, name: string) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button { display: inline-block; padding: 12px 24px; background-color: #dc004e; color: white; text-decoration: none; border-radius: 5px; }
          .footer { margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Recuperación de contraseña</h2>
          <p>Hola ${name},</p>
          <p>Recibimos una solicitud para restablecer tu contraseña. Haz clic en el botón de abajo:</p>
          <p><a href="${resetUrl}" class="button">Restablecer Contraseña</a></p>
          <p>O copia y pega este enlace en tu navegador:</p>
          <p>${resetUrl}</p>
          <p><strong>Este enlace expirará en 1 hora.</strong></p>
          <div class="footer">
            <p>Si no solicitaste esto, ignora este correo.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: 'Recuperación de contraseña - MoviPass',
    html
  });
};

export const sendTicketEmail = async (email: string, ticketPdf: Buffer, ticketData: any) => {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .ticket-info { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>¡Tu boleto está listo!</h2>
          <p>Hola ${ticketData.passengerName},</p>
          <p>Tu boleto ha sido confirmado. Adjunto encontrarás tu boleto en formato PDF.</p>
          <div class="ticket-info">
            <p><strong>Ruta:</strong> ${ticketData.origin} → ${ticketData.destination}</p>
            <p><strong>Fecha:</strong> ${ticketData.date}</p>
            <p><strong>Hora:</strong> ${ticketData.time}</p>
            <p><strong>Asiento:</strong> ${ticketData.seatNumber}</p>
            <p><strong>Total:</strong> $${ticketData.totalPrice}</p>
          </div>
          <p>Presenta tu código QR al momento de abordar.</p>
          <div class="footer">
            <p>¡Buen viaje!</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: `Boleto confirmado - ${ticketData.origin} a ${ticketData.destination}`,
    html,
    attachments: [{
      filename: `ticket-${ticketData.ticketId}.pdf`,
      content: ticketPdf,
      contentType: 'application/pdf'
    }]
  });
};
