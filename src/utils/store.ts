import Dexie from 'dexie';
import { Game, Assets, PublicGame } from '../types';

interface DBFavorite {
  gameId: string;
}

interface DBGame {
  gameId: string;
  name: string;
  config: Game;
}

interface DBAssets {
  gameId: string;
  assets: Assets;
}

interface DBGameAsset {
  id: string;
  asset: string;
}

class BGSDB extends Dexie {
  favorites: Dexie.Table<DBFavorite, string>;
  games: Dexie.Table<DBGame, string>;
  assets: Dexie.Table<DBAssets, string>;
  gameAsset: Dexie.Table<DBGameAsset, string>;

  constructor() {
    super('BGS');
    this.version(3).stores({
      favorites: '&gameId',
      games: '&gameId,name,config',
      assets: '&gameId,assets',
      gameAsset: '&id,asset',
    });
    this.favorites = this.table('favorites');
    this.games = this.table('games');
    this.assets = this.table('assets');
    this.gameAsset = this.table('gameAsset');
  }
}

let dbResolve: (db: BGSDB) => void;
let getDB = new Promise<BGSDB>((resolve) => {
  dbResolve = resolve;
});

const resolveMockDB = () =>
  dbResolve({
    isMock: true,
    games: {
      add: () => {},
      get: () => {},
      toArray: () => [],
    },
    favorites: {
      // TODO
    },
  } as any);

if (global.indexedDB) {
  const testDB = indexedDB.open('test');
  testDB.onerror = resolveMockDB;
  testDB.onsuccess = function () {
    const db = new BGSDB();
    dbResolve(db);
  };
} else {
  resolveMockDB();
}

export async function addGame(game: Game | PublicGame, assets: Assets) {
  await deleteGame(game.id);
  const db = await getDB;
  await db.games.add({
    config: game,
    gameId: game.id,
    name: game.name,
  });
  await db.assets.add({
    gameId: game.id,
    assets,
  });
}

export async function getCachedAsset(
  gameId: string,
  version: string,
  name: string
) {
  const assetPath = `${gameId}:${version}:${name}`;
  const db = await getDB;
  return db.gameAsset.get(assetPath);
}

export async function cacheAsset(
  gameId: string,
  version: string,
  name: string,
  asset: string
) {
  const assetPath = `${gameId}:${version}:${name}`;
  const db = await getDB;
  await db.gameAsset.delete(assetPath);
  return db.gameAsset.add({ id: assetPath, asset });
}

export async function getGameById(gameId: string) {
  return (await getDB).games.get(gameId);
}

export async function loadAssets(gameId: string) {
  return (await (await getDB).assets.get(gameId))?.assets || {};
}

export async function loadGames() {
  return (await getDB).games.toArray();
}

export async function deleteGame(gameId: string) {
  const db = await getDB;
  await db.assets.delete(gameId);
  return db.games.delete(gameId);
}

export async function addFavorite(gameId: string) {
  // TODO
}

export async function deleteFavorite(gameId: string) {
  // TODO
}
