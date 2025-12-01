// test-paypal-create.js
// Crea un pago en PayPal (sandbox) usando paypal-rest-sdk y muestra la approval URL
// Uso: exportar variables de entorno PAYPAL_MODE, PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET

const paypal = require('paypal-rest-sdk');

paypal.configure({
  mode: process.env.PAYPAL_MODE || 'sandbox',
  client_id: process.env.PAYPAL_CLIENT_ID,
  client_secret: process.env.PAYPAL_CLIENT_SECRET
});

(async () => {
  try {
    const create_payment_json = {
      intent: 'sale',
      payer: { payment_method: 'paypal' },
      redirect_urls: {
        return_url: 'http://localhost:3000/payment/success',
        cancel_url: 'http://localhost:3000/payment/cancel'
      },
      transactions: [{
        item_list: { items: [{ name: 'Prueba MoviPass', sku: 'ticket', price: '10.00', currency: 'USD', quantity: 1 }] },
        amount: { currency: 'USD', total: '10.00' },
        description: 'Pago de prueba MoviPass'
      }]
    };

    paypal.payment.create(create_payment_json, (err, payment) => {
      if (err) {
        console.error('ERROR create:', err.response || err);
        process.exit(1);
      } else {
        console.log('Payment creado OK. ID:', payment.id);
        const approval = payment.links.find(l => l.rel === 'approval_url');
        console.log('Approval URL:', approval ? approval.href : '(no approval url)');
        process.exit(0);
      }
    });
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
