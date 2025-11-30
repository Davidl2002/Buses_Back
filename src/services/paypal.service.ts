// @ts-ignore: no type declarations for 'paypal-rest-sdk'
import paypal from 'paypal-rest-sdk';

paypal.configure({
  mode: process.env.PAYPAL_MODE || 'sandbox',
  client_id: process.env.PAYPAL_CLIENT_ID!,
  client_secret: process.env.PAYPAL_CLIENT_SECRET!
});

interface PaymentData {
  amount: number;
  description: string;
  returnUrl: string;
  cancelUrl: string;
}

export const createPayment = (data: PaymentData): Promise<any> => {
  return new Promise((resolve, reject) => {
    const create_payment_json = {
      intent: 'sale',
      payer: {
        payment_method: 'paypal'
      },
      redirect_urls: {
        return_url: data.returnUrl,
        cancel_url: data.cancelUrl
      },
      transactions: [{
        item_list: {
          items: [{
            name: data.description,
            sku: 'ticket',
            price: data.amount.toFixed(2),
            currency: 'USD',
            quantity: 1
          }]
        },
        amount: {
          currency: 'USD',
          total: data.amount.toFixed(2)
        },
        description: data.description
      }]
    };

    paypal.payment.create(create_payment_json, (error: any, payment: any) => {
      if (error) {
        reject(error);
      } else {
        resolve(payment);
      }
    });
  });
};

export const executePayment = (paymentId: string, payerId: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    const execute_payment_json = {
      payer_id: payerId
    };

    paypal.payment.execute(paymentId, execute_payment_json, (error: any, payment: any) => {
      if (error) {
        reject(error);
      } else {
        resolve(payment);
      }
    });
  });
};

export const refundPayment = (saleId: string, amount: number): Promise<any> => {
  return new Promise((resolve, reject) => {
    const refund_details = {
      amount: {
        total: amount.toFixed(2),
        currency: 'USD'
      }
    };

    paypal.sale.refund(saleId, refund_details, (error: any, refund: any) => {
      if (error) {
        reject(error);
      } else {
        resolve(refund);
      }
    });
  });
};
