// test-send-email.js
// Script independiente para probar SMTP localmente.
// Uso (PowerShell):
//  $env:SMTP_HOST='smtp.gmail.com'
//  $env:SMTP_PORT='465'
//  $env:SMTP_SECURE='true'
//  $env:SMTP_USER='tuemail@gmail.com'
//  $env:SMTP_PASS='tu_app_password'
//  $env:BREVO_FROM_EMAIL='tuemail@gmail.com'
//  node test-send-email.js


$env:SMTP_HOST='smtp.gmail.com'
$env:SMTP_PORT='587'
$env:SMTP_SECURE='false'
$env:SMTP_USER='dl735894@gmail.com'
$env:SMTP_PASS='mckh spen pnne tvyu'
$env:BREVO_FROM_EMAIL='dl735894@gmail.com'

require('dotenv').config();
const nodemailer = require('nodemailer');

(async () => {
  try {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined;
    const smtpSecure = process.env.SMTP_SECURE === 'true';
    const smtpUser = process.env.SMTP_USER || process.env.BREVO_FROM_EMAIL;
    const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;

    let transporterOptions = {};
    if (smtpHost && smtpPort && smtpUser && smtpPass) {
      transporterOptions = {
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure === true || smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass },
        connectionTimeout: 30000,
        greetingTimeout: 30000,
        socketTimeout: 30000
      };
    } else {
      transporterOptions = {
        service: 'gmail',
        auth: { user: process.env.BREVO_FROM_EMAIL, pass: process.env.GMAIL_APP_PASSWORD },
        connectionTimeout: 30000,
        greetingTimeout: 30000,
        socketTimeout: 30000
      };
    }

    console.log('Transporter config:', {
      host: transporterOptions.host || '(gmail service)',
      port: transporterOptions.port,
      secure: transporterOptions.secure,
      user: smtpUser ? '(provided)' : '(not provided)'
    });

    const transporter = nodemailer.createTransport(transporterOptions);

    console.log('Verificando conexión SMTP...');
    await transporter.verify();
    console.log('VERIFICACIÓN OK. Intentando enviar correo de prueba...');

    const from = process.env.BREVO_FROM_EMAIL || smtpUser || 'no-reply@example.com';
    const to = 'dlopez2466366@gmail.com'; // destinatario solicitado

    const info = await transporter.sendMail({
      from: `MoviPass <${from}>`,
      to,
      subject: 'Prueba de envío - MoviPass',
      text: `Este es un correo de prueba enviado desde test-send-email.js - ${new Date().toISOString()}`,
      html: `<p>Este es un <strong>correo de prueba</strong> enviado desde <em>test-send-email.js</em> - ${new Date().toISOString()}</p>`
    });

    console.log('Correo enviado OK:', info && info.messageId ? info.messageId : info);
  } catch (err) {
    console.error('ERROR en test-send-email:', err && err.message ? err.message : err);
    if (err && err.response) console.error('SMTP response:', err.response);
    process.exitCode = 1;
  }
})();