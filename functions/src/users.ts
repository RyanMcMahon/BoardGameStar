import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

import { stripe } from './utils';

export const createUserAccount = functions.auth.user().onCreate(async user => {
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

export const updateUser = functions.firestore
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

export const cleanupUser = functions.auth.user().onDelete(async user => {
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
