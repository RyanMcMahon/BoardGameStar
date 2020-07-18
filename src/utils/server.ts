import * as firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';
import 'firebase/storage';
import React from 'react';
import { Game, Assets } from '../types';
import { PaymentMethod } from '@stripe/stripe-js';

const firebaseConfig = {
  apiKey: 'AIzaSyAeH5C7Uaem7FN2OpIQAUE2uIDQEGbvSoY',
  authDomain: 'boardgamestar-21111.firebaseapp.com',
  databaseURL: 'https://boardgamestar-21111.firebaseio.com',
  projectId: 'boardgamestar-21111',
  storageBucket: 'boardgamestar-21111.appspot.com',
  messagingSenderId: '78022014928',
  appId: '1:78022014928:web:d729d5cd3ae1fe595babd5',
};

firebase.initializeApp(firebaseConfig);

interface StripeAccount {
  id: 'stripe';
  userId: string;
  state: string;
}

export interface UserSettings {
  displayName: string;
  profile: string;
  public: boolean;
}

export interface Permissions {
  creator: boolean;
  publisher: boolean;
}

export interface SignUpForm {
  // displayName: string;
  email: string;
  password: string;
}

export async function signUp(form: SignUpForm) {
  const x = await firebase
    .auth()
    .createUserWithEmailAndPassword(form.email, form.password);
  // TODO set display name
}

export async function logIn(email: string, password: string) {
  return firebase.auth().signInWithEmailAndPassword(email, password);
}

export async function signOut() {
  return firebase.auth().signOut();
}

export async function resetPassword(email: string) {
  // TODO
}

export async function sendVerificationEmail() {
  firebase.auth().currentUser?.sendEmailVerification({
    url: 'http://localhost:3000/my-account',
  });
}

export function useUser() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [userSettings, setUserSettings] = React.useState<UserSettings | null>();
  const [currentUser, setCurrentUser] = React.useState<firebase.User | null>();
  const [permissions, setPermissions] = React.useState<Permissions>({
    creator: false,
    publisher: false,
  });

  React.useEffect(() => {
    firebase.auth().onAuthStateChanged(async user => {
      if (user) {
        console.log('reload token');
        await user.getIdToken(true);
        const userSettings = await (
          await firebase
            .firestore()
            .collection('users')
            .doc(user.uid)
            .get()
        ).data();
        const { claims: permissions } = (await user.getIdTokenResult()) as any;
        setUserSettings((userSettings as unknown) as UserSettings);
        setPermissions(permissions);
      } else {
        setUserSettings(null);
      }
      setCurrentUser(user);
      setIsLoading(false);
    });
  }, []);

  return {
    isLoading,
    currentUser,
    userSettings,
    permissions,
  };
}

export function getCurrentUser() {
  return firebase.auth().currentUser;
}

export async function getUserSettings() {
  return (
    await firebase
      .firestore()
      .collection('users')
      .doc(getCurrentUser()?.uid)
      .get()
  ).data();
}

export async function updateUserSettings(userSettings: Partial<UserSettings>) {
  await firebase
    .firestore()
    .collection('users')
    .doc(getCurrentUser()?.uid)
    .set(userSettings, { merge: true });
}

export async function getAllGames(): Promise<Game[]> {
  return ((
    await firebase
      .firestore()
      .collection('games')
      .get()
  ).docs.map(doc => doc.data()) as unknown) as Game[];
}

export async function getUserGames(userId: string) {
  // TODO
}

export async function getGameStats(gameId: string) {
  // TODO
}

export async function publishGame(game: Game, assets: Assets) {
  const gameId = game.id;
  const userId = getCurrentUser()?.uid;

  await firebase
    .firestore()
    .collection('games')
    .doc(gameId)
    .set(game);

  const storageRef = firebase.storage().ref();

  return Promise.all(
    Object.entries(assets).map(([name, content]) => {
      const folder = game.price > 0 ? 'private' : 'public';
      const assetRef = storageRef.child(
        `users/${userId}/games/${gameId}/${folder}/${name}`
      );
      return assetRef.putString(content, 'data_url');
    })
  );
}

export async function updatePublishedGame(game: any) {
  // TODO
}

export async function deletePublishedGame(gameId: string) {
  // TODO
}

export async function getCustomerData() {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    return;
  }

  const { uid } = currentUser;
  return await (
    await firebase
      .firestore()
      .collection('users')
      .doc(uid)
      .get()
  ).data();
}

export async function getUserProfile(userId: string) {
  const userProfilePromise = firebase
    .firestore()
    .collection('users')
    .doc(userId)
    .get();

  const userGamesPromise = firebase
    .firestore()
    .collection('games')
    .where('config.userId', '==', userId)
    .get();

  const profile = (await userProfilePromise).data() as UserSettings;
  const games = (await userGamesPromise).docs.map(x => x.data()) as Game[];

  return {
    profile,
    games,
  };
}

export async function buyGame(
  game: Game,
  paymentMethod: PaymentMethod,
  tip: number,
  tax: number // TODO
) {
  const { uid } = getCurrentUser()!;

  await firebase.auth().applyActionCode;

  await firebase
    .firestore()
    .collection('users')
    .doc(uid)
    .collection('payments')
    .add({
      tip,
      tax,
      amount: game.price,
      currency: 'usd',
      payment_method: paymentMethod.id,
      gameId: game.id,
    });
}

// export async function requestOAuth() {
//   const userId = getCurrentUser()?.uid;

//   const { state } = (await firebase
//     .firestore()
//     .collection('users')
//     .doc(userId)
//     .collection('accounts')
//     .add({
//       userId,
//       id: 'stripe',
//     })) as StripeAccount;
//   // const { id } = await firebase
//   //   .firestore()
//   //   .collection('stripe_customers')
//   //   .doc(userId)
//   //   .collection('publisher_accounts')
//   //   .add({
//   //     userId,
//   //   });
//   return id;
// }
