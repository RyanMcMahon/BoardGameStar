import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Logging } from '@google-cloud/logging';
import Stripe from 'stripe';

admin.initializeApp();

const logging = new Logging({
  projectId: process.env.GCLOUD_PROJECT,
});

const stripe = new Stripe(functions.config().stripe.secret, {
  apiVersion: '2020-03-02',
});

exports.createUserAccount = functions.auth.user().onCreate(async user => {
  await admin
    .firestore()
    .collection('users')
    .doc(user.uid)
    .set({
      userId: user.uid,
      displayName: user.displayName || '',
      profile: '',
      public: false,
    });
});

exports.updateUser = functions.firestore
  .document('users/{userId}')
  .onUpdate(async (snap, context) => {
    const before = snap.before.data();
    const after = snap.after.data();
    const { userId } = context.params;
    console.log('--------------- public user ----------------');
    console.log('user id', userId);
    const { emailVerified } = await admin.auth().getUser(userId);
    console.log(before.public, after.public, after.displayName, emailVerified);
    if (!before.public && after.public && after.displayName && emailVerified) {
      console.log('set creator account');
      await admin.auth().setCustomUserClaims(userId, { creator: true });
    } else if (before.public && !after.public) {
      // TODO - only prevent change if user has published games
      await snap.after.ref.set({ public: true }, { merge: true });
    }
  });

exports.updateGame = functions.firestore
  .document('games/{gameId}')
  .onCreate(async (snap, context) => {
    const { gameId } = context.params;
    const { version } = snap.data();
    console.log(gameId, version);
    await admin
      .firestore()
      .collection('games')
      .doc(gameId)
      .collection('versions')
      .doc(`${version}`)
      .set(snap.data());
    await snap.ref.set(
      { config: admin.firestore.FieldValue.delete() },
      { merge: true }
    );
  });

exports.createStripePayment = functions.firestore
  .document('users/{userId}/payments/{pushId}')
  .onCreate(async (snap, context) => {
    try {
      const {
        amount,
        tip,
        // tipSplit,
        currency,
        gameId,
        payment_method,
      } = snap.data();
      const fullAmount = amount + tip;
      const netAmount = amount - Math.ceil(amount * 0.029 + 30);
      const netTip = tip - Math.ceil(tip * 0.029);
      const transferAmount = netTip + Math.round(netAmount * 0.75);
      // if (tipSplit < 0 || tipSplit > 1) {
      //   return;
      // }

      // const bgsFee = Math.round(amount * 0.25 + tip * (1 - tipSplit));
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

exports.confirmStripePayment = functions.firestore
  .document('users/{userId}/payments/{pushId}')
  .onUpdate(async (change, context) => {
    if (change.after.data().payment.status === 'requires_confirmation') {
      const payment = await stripe.paymentIntents.confirm(
        change.after.data().id
      );
      await change.after.ref.set(payment);
    }
  });

exports.cleanupUser = functions.auth.user().onDelete(async user => {
  const dbRef = admin.firestore().collection('users');
  const customer = (await dbRef.doc(user.uid).get()).data();
  await stripe.customers.del(customer!.customer_id);
  // Delete the customers payments & payment methods in firestore.
  const accounts = await dbRef
    .doc(user.uid)
    .collection('accounts')
    .get();
  accounts.forEach(snap => snap.ref.delete());

  const payments = await dbRef
    .doc(user.uid)
    .collection('payments')
    .get();
  payments.forEach(snap => snap.ref.delete());

  await dbRef.doc(user.uid).delete();
  return;
});

/**
 *
 */
exports.oauth = functions.https.onRequest(async (req, res) => {
  try {
    const { code, state } = req.query as { code: string; state: string };
    if (!code || !state) {
      res.send('Invalid Params');
      return;
    }
    const userId = state;

    const publisherAccount = await admin
      .firestore()
      .collection('users')
      .doc(userId)
      .collection('accounts')
      .doc('stripe')
      .get();

    // if (!publisherAccount.data()) {
    //   // throw new Error('Inavlid Publisher Account');
    //   res.statusCode = 403;
    //   res.send('Inavlid Publisher Account');
    // }

    const response = await stripe.oauth.token({
      code,
      grant_type: 'authorization_code',
    });
    const accountId = response.stripe_user_id;
    await publisherAccount.ref.set({ accountId }, { merge: true });
    await admin
      .auth()
      .setCustomUserClaims(userId, { publisher: true, creator: true });

    res.redirect('http://localhost:3000/my-account');
  } catch (err) {
    res.send(err.message);
  }
});

/**
 * To keep on top of errors, we should raise a verbose error report with Stackdriver rather
 * than simply relying on console.error. This will calculate users affected + send you email
 * alerts, if you've opted into receiving them.
 */

// [START reporterror]

function reportError(err: any, context = {}) {
  // This is the name of the StackDriver log stream that will receive the log
  // entry. This name can be any valid log stream name, but must contain "err"
  // in order for the error to be picked up by StackDriver Error Reporting.
  const logName = 'errors';
  const log = logging.log(logName);

  // https://cloud.google.com/logging/docs/api/ref_v2beta1/rest/v2beta1/MonitoredResource
  const metadata = {
    resource: {
      type: 'cloud_function',
      labels: {
        function_name: process.env.FUNCTION_NAME || 'unknown_function',
      },
    },
  };

  // https://cloud.google.com/error-reporting/reference/rest/v1beta1/ErrorEvent
  const errorEvent = {
    message: err.stack,
    serviceContext: {
      service: process.env.FUNCTION_NAME,
      resourceType: 'cloud_function',
    },
    context: context,
  };

  // Write the error log entry
  return new Promise((resolve, reject) => {
    log.write(log.entry(metadata, errorEvent), (error: any) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

// [END reporterror]

/**
 * Sanitize the error message for the user.
 */
function userFacingMessage(error: any) {
  return error.type
    ? error.message
    : 'An error occurred, developers have been alerted';
}
