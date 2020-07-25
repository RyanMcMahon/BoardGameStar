import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

import { stripe } from './utils';

export const oauth = functions.https.onRequest(async (req, res) => {
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
