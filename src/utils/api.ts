import _ from 'lodash';
import axios from 'axios';
import * as firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';
import 'firebase/storage';
import React from 'react';
import { Game, Assets, PublicGame, PublishableGame } from '../types';
import { PaymentMethod } from '@stripe/stripe-js';
import { addGame } from './store';

const firebaseConfig = {
  apiKey: 'AIzaSyAeH5C7Uaem7FN2OpIQAUE2uIDQEGbvSoY',
  authDomain: 'boardgamestar-21111.firebaseapp.com',
  databaseURL: 'https://boardgamestar-21111.firebaseio.com',
  projectId: 'boardgamestar-21111',
  storageBucket: 'boardgamestar-21111.appspot.com',
  messagingSenderId: '78022014928',
  appId: '1:78022014928:web:d729d5cd3ae1fe595babd5',
};

const firebaseServer = `https://us-central1-boardgamestar-21111.cloudfunctions.net`;

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
  email: string;
  password: string;
}

export async function signUp(form: SignUpForm) {
  const x = await firebase
    .auth()
    .createUserWithEmailAndPassword(form.email, form.password);
}

export async function logIn(email: string, password: string) {
  return firebase.auth().signInWithEmailAndPassword(email, password);
}

export async function signOut() {
  return firebase.auth().signOut();
}

export async function resetPassword(email: string) {}

export async function sendVerificationEmail() {
  firebase.auth().currentUser?.sendEmailVerification({
    url: 'https://boardgamestar.com/my-account',
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

export async function getAllGames(): Promise<PublicGame[]> {
  return ((
    await firebase
      .firestore()
      .collection('games')
      .get()
  ).docs.map(doc => doc.data()) as unknown) as PublicGame[];
}

export async function getGame(
  gameId: string
): Promise<{ game: PublicGame; user: any }> {
  const game = (
    await firebase
      .firestore()
      .collection('games')
      .doc(gameId)
      .get()
  ).data() as PublicGame;

  if (!game || !game.userId) {
    return {} as any;
  }

  const user = (
    await firebase
      .firestore()
      .collection('users')
      .doc(game.userId)
      .get()
  ).data();

  return {
    game,
    user,
  };
}

export async function getUserGames(userId: string) {
  // TODO
}

export async function getGameStats(gameId: string) {
  // TODO
}

export async function getImageUrl(userId: string, gameId: string, src: string) {
  const storageRef = firebase.storage().ref();
  const path = `users/${userId}/games/${gameId}/public/${src}`;
  return storageRef.child(path).getDownloadURL();
}

export async function publishGame(game: PublishableGame, assets: Assets) {
  const gameId = game.id;
  const userId = getCurrentUser()?.uid;
  const thumbnail = game.thumbnail;
  const banner = game.banner;
  const files = game.files;

  const gameData = {
    ...game,
    userId,
    thumbnail: thumbnail ? '_thumbnail' : null,
    banner: banner ? '_banner' : null,
    files: files.map(file => file.name),
    config: {
      ...game.config,
      prompts: game.config.prompts || null,
      currency: game.config.currency || null,
    },
  };

  await firebase
    .firestore()
    .collection('games')
    .doc(gameId)
    .set(gameData);

  const storageRef = firebase.storage().ref();
  const folder = game.price > 0 ? 'private' : 'public';
  const basePath = `users/${userId}/games/${gameId}/${folder}`;

  if (banner) {
    await storageRef.child(`${basePath}/_banner`).putString(banner, 'data_url');
  }

  if (thumbnail) {
    await storageRef
      .child(`${basePath}/_thumbnail`)
      .putString(thumbnail, 'data_url');
  }

  await Promise.all(
    files.map(file =>
      storageRef
        .child(`${basePath}/${file.name}`)
        .putString(file.content, 'data_url')
    )
  );

  return Promise.all(
    Object.entries(assets).map(([name, content]) => {
      return storageRef
        .child(`${basePath}/${name}`)
        .putString(content, 'data_url');
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
  game: PublicGame,
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

export async function getIceServers() {
  const response = await axios.get(`${firebaseServer}/servers`);
  const { data } = response;
  return data.iceServers;
}

export async function downloadGame(
  gameId: string,
  progress: (percentage: number) => void
) {
  let curPrecentage = 0;
  progress(curPrecentage);

  for (let i = 0; i < 10; i++) {
    const delay = (i + 1) * _.random(400, 800);
    setTimeout(() => {
      curPrecentage += 1;
      progress(curPrecentage);
    }, delay);
  }

  const { data } = await axios.get(`${firebaseServer}/games/${gameId}`);
  const { game, assets } = data;
  const assetList = Object.entries(assets);
  const percentStep = 90 / assetList.length;
  const loadedAssets = {} as any;

  while (assetList.length) {
    const [key, url] = assetList.pop() as any;
    const image = await getBase64FromImageUrl(url as string);
    curPrecentage += percentStep;
    if (curPrecentage > 100) {
      curPrecentage = 100;
    }
    progress(curPrecentage);
    loadedAssets[key] = image;
  }

  const thumbnailUrl = await getImageUrl(game.userId, game.id, `_thumbnail`);
  const thumbnail = await getBase64FromImageUrl(thumbnailUrl);
  game.thumbnail = thumbnail;

  await addGame(game, loadedAssets);
}

function getBase64FromImageUrl(url: string) {
  return new Promise(resolve => {
    const img = new Image();

    img.setAttribute('crossOrigin', 'anonymous');

    img.onload = function() {
      const canvas = document.createElement('canvas');
      canvas.width = (this as any).width;
      canvas.height = (this as any).height;

      const ctx = canvas.getContext('2d') as any;
      ctx.drawImage(this, 0, 0);

      const dataURL = canvas.toDataURL('image/png');

      resolve(dataURL);
    };

    img.src = url;
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
