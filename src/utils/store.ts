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

const db = new BGSDB();

export async function addGame(config: EditorState, assets: Assets) {
  return db.games.add({
    assets,
    config,
    gameId: config.id,
    name: config.name,
  });
}

export async function getGameById(gameId: string) {
  return db.games.get(gameId);
}

export async function loadGames() {
  return db.games.toArray();
}

export async function deleteGame(gameId: string) {
  return db.games.delete(gameId);
}

export async function addFavorite(gameId: string) {
  // TODO
}

export async function deleteFavorite(gameId: string) {
  // TODO
}
