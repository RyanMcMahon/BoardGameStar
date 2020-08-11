import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

import { stripe, userFacingMessage, reportError } from './utils';

export const createStripePayment = functions.firestore
  .document('users/{userId}/payments/{pushId}')
  .onCreate(async (snap, context) => {
    try {
      const { amount, tip, currency, gameId, payment_method } = snap.data();
      const fullAmount = amount + tip;
      const netAmount = amount - Math.ceil(amount * 0.029 + 30);
      const netTip = tip - Math.ceil(tip * 0.029);
      const transferAmount = netTip + Math.round(netAmount * 0.75);
      const document = snap.ref.parent.parent;
      if (!document) {
        return;
      }

      console.log('==== get game config =====', gameId);
      const gameRef = await admin
        .firestore()
        .collection('games')
        .doc(gameId)
        .get();
      const { price, config: gameConfig } = gameRef.data()!;

      console.log(price, gameConfig.userId);

      if (amount < price) {
        return;
      }

      const publisherUserId = gameConfig.userId;

      const publisherAccount = (
        await admin
          .firestore()
          .collection('users')
          .doc(publisherUserId)
          .collection('accounts')
          .doc('stripe')
          .get()
      ).data();

      if (!publisherAccount) {
        return;
      }

      const { accountId } = publisherAccount;
      console.log('==== get publisher account =====');
      console.log(accountId);

      const customerRef = await document.get();
      const customerData = customerRef.data();

      console.log('==== get customer data =====');
      if (!customerData) {
        return;
      }
      console.log(customerData.customer_id);
      // Look up the Stripe customer id.
      const customer = customerData.customer_id;
      // Create a charge using the pushId as the idempotency key
      // to protect against double charges.
      const idempotencyKey = context.params.pushId;
      console.log('==== starting payment =====');
      console.log('account id', accountId);
      console.log('customer', customer);
      console.log('amount', amount);
      // console.log('fee', bgsFee);
      const payment = await stripe.paymentIntents.create(
        {
          currency,
          // customer,
          payment_method,
          off_session: false,
          confirm: true,
          amount: fullAmount,
          // application_fee_amount: bgsFee,
          confirmation_method: 'manual',
          transfer_data: {
            amount: transferAmount,
            destination: accountId,
          },
        },
        { idempotencyKey }
      );

      console.log('==== payment complete =====');
      console.log(payment);

      // If the result is successful, write it back to the database.
      await snap.ref.set({ payment }, { merge: true });
    } catch (error) {
      // We want to capture errors and render them in a user-friendly way, while
      // still logging an exception with StackDriver
      console.log(error);
      await snap.ref.set({ error: userFacingMessage(error) }, { merge: true });
      await reportError(error, { user: context.params.userId });
    }
  });

export const confirmStripePayment = functions.firestore
  .document('users/{userId}/payments/{pushId}')
  .onUpdate(async (change, context) => {
    if (change.after.data().payment.status === 'requires_confirmation') {
      const payment = await stripe.paymentIntents.confirm(
        change.after.data().id
      );
      await change.after.ref.set(payment);
    }
  });
