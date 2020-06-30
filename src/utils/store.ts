import Dexie from 'dexie';
import { EditorState, Assets } from '../types';

interface DBFavorite {
  gameId: string;
}

interface DBGame {
  gameId: string;
  name: string;
  config: EditorState;
  assets: Assets;
}

class BGSDB extends Dexie {
  favorites: Dexie.Table<DBFavorite, string>;
  games: Dexie.Table<DBGame, string>;

  constructor() {
    super('BGS');
    this.version(1).stores({
      favorites: '&gameId',
      games: '&gameId,name,config,assets',
    });
    this.favorites = this.table('favorites');
    this.games = this.table('games');
  }
}

let dbResolve: (db: BGSDB) => void;
let getDB = new Promise<BGSDB>(resolve => {
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

if (window.indexedDB) {
  const testDB = indexedDB.open('test');
  testDB.onerror = resolveMockDB;
  testDB.onsuccess = function() {
    const db = new BGSDB();
    dbResolve(db);
  };
} else {
  resolveMockDB();
}

export async function addGame(config: EditorState, assets: Assets) {
  await deleteGame(config.id);
  return (await getDB).games.add({
    assets,
    config,
    gameId: config.id,
    name: config.name,
  });
}

export async function getGameById(gameId: string) {
  return (await getDB).games.get(gameId);
}

export async function loadGames() {
  return (await getDB).games.toArray();
}

export async function deleteGame(gameId: string) {
  return (await getDB).games.delete(gameId);
}

export async function addFavorite(gameId: string) {
  // TODO
}

export async function deleteFavorite(gameId: string) {
  // TODO
}
