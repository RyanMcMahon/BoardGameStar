import _ from 'lodash';
import axios from 'axios';
import { initializeApp } from '@firebase/app';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  getAuth,
  initializeAuth,
} from '@firebase/auth';
import type { User } from '@firebase/auth';
import { getFirestore, runTransaction } from '@firebase/firestore';
import type { Transaction } from '@firebase/firestore';
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadString,
} from '@firebase/storage';
import {
  addDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  setDoc,
  collection,
} from 'firebase/firestore';
// import 'firebase/auth';
// import 'firebase/firestore';
// import 'firebase/storage';
import React from 'react';
import { Game, Assets, PublicGame, PublishableGame } from '../types';
// import { PaymentMetho } from '@stripe/stripe-js';
import { addGame, cacheAsset } from './store';
import { getDatabase } from 'firebase/database';

const firebaseServer = `https://us-central1-boardgamestar-21111.cloudfunctions.net`;

const firebaseApp = initializeApp({
  apiKey: 'AIzaSyAeH5C7Uaem7FN2OpIQAUE2uIDQEGbvSoY',
  authDomain: 'boardgamestar-21111.firebaseapp.com',
  databaseURL: 'https://boardgamestar-21111.firebaseio.com',
  projectId: 'boardgamestar-21111',
  storageBucket: 'boardgamestar-21111.appspot.com',
  messagingSenderId: '78022014928',
  appId: '1:78022014928:web:d729d5cd3ae1fe595babd5',
});

export const db = getFirestore();
export const realtimeDb = getDatabase();
const storage = getStorage();

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
  return createUserWithEmailAndPassword(getAuth(), form.email, form.password);
}

export async function logIn(email: string, password: string) {
  return signInWithEmailAndPassword(getAuth(), email, password);
}

export async function signOut() {
  return getAuth().signOut();
}

export async function resetPassword(email: string) {
  return sendPasswordResetEmail(getAuth(), email);
}

export async function sendVerificationEmail(user: User) {
  return sendEmailVerification(user);
}

export function useUser() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [userSettings, setUserSettings] = React.useState<UserSettings | null>();
  const [currentUser, setCurrentUser] = React.useState<User | null>();
  const [permissions, setPermissions] = React.useState<Permissions>({
    creator: false,
    publisher: false,
  });

  React.useEffect(() => {
    getAuth().onAuthStateChanged(async (user) => {
      if (user) {
        console.log('reload token');
        await user.getIdToken(true);
        const userSettings = await getUserSettings(user);
        const { claims } = (await user.getIdTokenResult(true)) as any;
        setUserSettings(userSettings as unknown as UserSettings);
        setPermissions({
          creator: claims.creator,
          publisher: claims.publisher,
        });
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

export function withTransaction(
  fn: (transaction: Transaction) => Promise<unknown>
) {
  return runTransaction(db, fn);
}

export function getCurrentUser() {
  return getAuth().currentUser;
}

export async function getCurrentUserSettings() {
  return getUserSettings(getAuth().currentUser);
}

export async function getUserSettings(user: User | null) {
  if (!user) {
    return null;
  }

  const userSettingsRef = doc(db, 'users', user.uid);
  const userSettings = await (await getDoc(userSettingsRef)).data();
  return userSettings;
}

export async function updateUserSettings(userSettings: Partial<UserSettings>) {
  const user = getCurrentUser();
  if (!user || !user.uid) {
    return {};
  }

  const userSettingsRef = doc(db, 'users', user.uid);
  return setDoc(userSettingsRef, userSettings, { merge: true });
}

export async function getAllGames(): Promise<PublicGame[]> {
  return (await getDocs(collection(db, 'games'))).docs.map((doc) =>
    doc.data()
  ) as unknown as PublicGame[];
}

export async function getGame(
  gameId: string
): Promise<{ game: PublicGame; user: any }> {
  const gameRef = doc(db, 'games', gameId);
  const game = (await (await getDoc(gameRef)).data()) as PublicGame;

  if (!game || !game.userId) {
    return {} as any;
  }

  const userRef = doc(db, 'users', game.userId);
  const user = await (await getDoc(userRef)).data();

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

export async function getDownloadUrl(
  userId: string,
  gameId: string,
  src: string
) {
  const path = `users/${userId}/games/${gameId}/public/${src}`;
  return getDownloadURL(ref(storage, path));
}

export async function publishGame(game: PublishableGame, assets: Assets) {
  const gameId = game.id;
  const userId = getCurrentUser()?.uid;
  const thumbnail = game.thumbnail;
  const banner = game.banner;
  const files = game.files;
  const rules = game.rules;

  const gameData = {
    ...game,
    userId,
    thumbnail: thumbnail ? '_thumbnail' : null,
    banner: banner ? '_banner' : null,
    rules: rules ? '_rules' : null,
    files: [], // TODO files.map(file => file.name),
    config: {
      ...game.config,
      prompts: game.config.prompts || null,
      currency: game.config.currency || null,
    },
  };

  if (rules && getFileSizeMB(rules) > 5) {
    throw new Error(`Rules PDF is too large. Max 5mb.`);
  }

  if (banner && getFileSizeMB(banner) > 1) {
    throw new Error(`Banner is too large. Max 1mb.`);
  }

  if (thumbnail && getFileSizeMB(thumbnail) > 1) {
    throw new Error(`Thumbnail is too large. Max 1mb.`);
  }

  // check file sizes
  for (let name in assets) {
    if (getFileSizeMB(assets[name]) > 1) {
      throw new Error(`${name} is too large. Max 1mb.`);
    }
  }

  const gameRef = doc(db, 'games', gameId);
  await setDoc(gameRef, gameData);

  const folder = game.price > 0 ? 'private' : 'public';
  const basePath = `users/${userId}/games/${gameId}/${folder}/`;
  const storageRef = ref(storage, basePath); //firebase.storage().ref();

  if (rules) {
    const rulesRef = ref(storageRef, '_rules');
    await uploadString(rulesRef, rules, 'data_url');
  }

  if (banner) {
    const bannerRef = ref(storageRef, '_banner');
    await uploadString(bannerRef, banner, 'data_url');
  }

  if (thumbnail) {
    const thumbnailRef = ref(storageRef, '_thumbnail');
    await uploadString(thumbnailRef, thumbnail, 'data_url');
  }

  await Promise.all(
    files.map((file) => {
      const fileRef = ref(storageRef, file.name);
      return uploadString(fileRef, file.content, 'data_url');
    })
  );

  return Promise.all(
    Object.entries(assets).map(([name, content]) => {
      const entriesRef = ref(storageRef, name);
      return uploadString(entriesRef, content, 'data_url');
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
    return {} as any;
  }

  // const { uid } = currentUser;
  // return await (
  //   await firebase
  //     .firestore()
  //     .collection('users')
  //     .doc(uid)
  //     .get()
  // ).data();
}

export async function getUserProfile(userId?: string) {
  return {} as any;
  // const userProfilePromise = firebase
  //   .firestore()
  //   .collection('users')
  //   .doc(userId)
  //   .get();
  // const userGamesPromise = firebase
  //   .firestore()
  //   .collection('games')
  //   .where('config.userId', '==', userId)
  //   .get();
  // const profile = (await userProfilePromise).data() as UserSettings;
  // const games = (await userGamesPromise).docs.map(x => x.data()) as Game[];
  // return {
  //   profile,
  //   games,
  // };
}

export async function buyGame(
  game: PublicGame,
  // paymentMethod: PaymentMethod,
  tip: number,
  tax: number // TODO
) {
  // const { uid } = getCurrentUser()!;
  // await firebase.auth().applyActionCode;
  // await firebase
  //   .firestore()
  //   .collection('users')
  //   .doc(uid)
  //   .collection('payments')
  //   .add({
  //     tip,
  //     tax,
  //     amount: game.price,
  //     currency: 'usd',
  //     payment_method: paymentMethod.id,
  //     gameId: game.id,
  //   });
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
    // eslint-disable-next-line no-loop-func
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
    await cacheAsset(gameId, game.version, key, image);
    curPrecentage += percentStep;
    if (curPrecentage > 100) {
      curPrecentage = 100;
    }
    progress(curPrecentage);
    loadedAssets[key] = image;
  }

  if (game.thumbnail) {
    const thumbnailUrl = await getDownloadUrl(
      game.userId,
      game.id,
      `_thumbnail`
    );
    const thumbnail = await getBase64FromImageUrl(thumbnailUrl);
    game.thumbnail = thumbnail;
  }

  await addGame(game, loadedAssets);
}

function getBase64FromImageUrl(url: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();

    img.setAttribute('crossOrigin', 'anonymous');

    img.onload = function () {
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

function getFileSizeMB(file: string) {
  return new TextEncoder().encode(file).length / 1024 / 1024;
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
