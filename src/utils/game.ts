import _ from 'lodash';
import slug from 'slugid';
import Peer from 'peerjs';
import {
  Card,
  RenderPiece,
  GameConfig,
  GameEvent,
  ClientEvent,
  PlayerPiece,
  Pieces,
  CardPiece,
  DeckPiece,
} from '../types';

import { getHostId, getGameId, getInstanceId } from './identity';
import { createPeer } from './peer';

interface GamePeerDataConnection extends Peer.DataConnection {
  send: (event: GameEvent) => void;
  metadata: {
    playerId: string;
    name: string;
  };
}

interface Deck extends DeckPiece {
  cards: string[];
  discarded: string[];
}

interface Player {
  name: string;
  hand: string[];
  conn: GamePeerDataConnection;
}

interface Players {
  [id: string]: Player;
}

interface Decks {
  [id: string]: Deck;
}

export interface Game {
  hostId: string;
  gameId: string;
  peer: Peer;
  board: string[];
  pieces: Pieces;
  // decks: Decks;
  // players: Players;
}

export interface Assets {
  [key: string]: string;
}

interface GameOptions {
  assets: Assets;
  sendAssets: boolean;
}

let curGame: Game;

export function createNewGame(
  config: GameConfig,
  options: GameOptions,
  cb: (game: Game) => void
) {
  if (curGame) {
    curGame.peer.disconnect();
  }

  const hostId = getHostId();
  const gameId = getGameId();
  const peer = createPeer(getInstanceId(gameId, hostId));
  const { assets, sendAssets } = options;

  peer.on('open', () => {
    let pieces: Pieces = Object.values(config.pieces).reduce(
      (byId, piece) => ({
        ...byId,
        [piece.id]: {
          ...piece,
          delta: 0,
        },
      }),
      {}
    );
    Object.values(pieces).forEach(piece => {
      if (piece.type === 'card') {
        for (let i = 1; i < piece.count; i++) {
          const cardCopy = { ...piece, id: slug.nice() };
          console.log('added card', cardCopy);
          pieces[cardCopy.id] = cardCopy;
        }
      }
    });

    const scenario = config.scenarios[config.curScenario];
    const decks: Decks = Object.values(pieces)
      .filter(p => p.type === 'deck')
      .reduce(
        (byId, deck) => ({
          ...byId,
          [deck.id]: {
            ...deck,
            cards: _.shuffle(
              Object.values(pieces)
                .filter(p => p.type === 'card' && p.deckId === deck.id)
                .map(c => c.id)
            ),
            discarded: [],
          },
        }),
        {}
      );
    Object.values(decks).forEach(deck => {
      (pieces[deck.id] as DeckPiece).total = deck.cards.length;
      (pieces[deck.id] as DeckPiece).count = deck.cards.length;
    });

    const players: Players = {};
    const game: Game = {
      peer,
      hostId,
      gameId,
      pieces,
      board: scenario.pieces.filter(pieceId => pieces[pieceId].type !== 'card'),
    };
    const clients: GamePeerDataConnection[] = [];
    const sendToRoom = (event: GameEvent) => {
      clients.forEach(client => client.send(event));
    };

    const updateDeckCount = (deckId: string) => {
      const count = decks[deckId].cards.length;
      const piece = pieces[deckId];
      if (!piece) {
        return;
      }
      piece.count = count;
      piece.delta++;
      console.log('update_piece', piece.delta);
      sendToRoom({
        event: 'update_piece',
        pieces: {
          [piece.id]: piece,
        },
      });
    };

    const sendHandCounts = () => {
      sendToRoom({
        event: 'hand_count',
        counts: Object.entries(players).reduce(
          (counts, [playerId, player]: [string, Player]) => ({
            ...counts,
            [playerId]: player.hand.length,
          }),
          {}
        ),
      });
    };

    curGame = game;
    console.log(`Started Game: ${hostId}_${gameId}`);
    cb(game);

    peer.on('connection', (conn: GamePeerDataConnection) => {
      const { playerId, name } = conn.metadata;
      const player: Player = players[playerId] || {
        conn,
        name: name || `Player ${Object.keys(players).length + 1}`,
        hand: [],
      };
      clients.push(conn);
      players[playerId] = player;

      conn.on('open', () => {
        const playAreaId = scenario.players[_.size(players) - 1];
        const playArea = pieces[playAreaId] as PlayerPiece;
        playArea.playerId = playerId;
        playArea.delta++;
        playArea.name = player.name;

        conn.send({
          assets: sendAssets ? assets : Object.keys(assets),
          pieces,
          event: 'join',
          hand: player.hand,
          board: game.board,
          // TODO remove
          player: {
            name: player.name,
          },
        });

        sendHandCounts();
        sendToRoom({
          event: 'update_piece',
          pieces: {
            [playArea.id]: playArea,
          },
        });

        conn.on('data', (data: ClientEvent) => {
          switch (data.event) {
            case 'request_asset':
              try {
                const { asset } = data;
                conn.send({
                  event: 'asset_loaded',
                  asset: {
                    [asset]: assets[asset],
                  },
                });
              } catch (err) {
                console.log(err);
              }
              break;

            case 'peek_at_deck':
              try {
                const { deckId } = data;
                conn.send({
                  event: 'deck_peek_results',
                  cardIds: _.shuffle(decks[deckId].cards),
                  discardedCardIds: _.shuffle(decks[deckId].discarded),
                });
                sendToRoom({
                  deckId,
                  playerId,
                  event: 'deck_peek',
                });
              } catch (err) {
                console.log(err);
              }
              break;

            case 'take_cards':
              try {
                const { deckId, cardIds } = data;
                const deck = decks[deckId];
                const ids = [
                  ...cardIds.filter(id => deck.cards.includes(id)),
                  ...cardIds.filter(id => deck.discarded.includes(id)),
                ];
                players[playerId].hand.push(...ids);
                deck.cards = deck.cards.filter(id => !cardIds.includes(id));
                deck.discarded = deck.discarded.filter(
                  id => !cardIds.includes(id)
                );
                conn.send({
                  event: 'set_hand',
                  hand: player.hand,
                });
                sendHandCounts();
                updateDeckCount(deckId);
              } catch (err) {
                console.log(err);
              }
              break;

            case 'remove_cards':
              try {
                const { deckId, cardIds } = data;
                const deck = decks[deckId];
                deck.cards = deck.cards.filter(id => !cardIds.includes(id));
                deck.discarded = deck.discarded.filter(
                  id => !cardIds.includes(id)
                );
                updateDeckCount(deckId);
              } catch (err) {
                console.log(err);
              }
              break;

            case 'draw_cards':
              try {
                const { deckId, count } = data;
                console.log(`Player ${playerId} drew ${count} cards`);
                players[playerId].hand.push(
                  ...decks[deckId].cards.splice(0, count)
                );
                conn.send({
                  event: 'set_hand',
                  hand: player.hand,
                });
                sendHandCounts();
                updateDeckCount(deckId);
              } catch (err) {
                console.log(err);
              }
              break;

            case 'draw_cards_to_table':
              try {
                const { deckId, count, faceDown } = data;
                const deckPiece = pieces[deckId];
                const cardIds = decks[deckId].cards.splice(0, count);
                game.board.push(...cardIds);

                const p = cardIds
                  .map((id, index) => ({
                    ...pieces[id],
                    faceDown,
                    x: deckPiece.x + deckPiece.width + 50 + index * 20,
                    y: deckPiece.y + index * 20,
                    width: deckPiece.width,
                    height: deckPiece.height,
                    delta: pieces[id].delta + 1,
                  }))
                  .reduce((agg, piece) => ({ ...agg, [piece.id]: piece }), {});
                pieces = {
                  ...pieces,
                  ...p,
                };
                sendToRoom({
                  event: 'update_piece',
                  pieces: p,
                });
                sendToRoom({
                  event: 'add_to_board',
                  pieces: cardIds,
                });
                updateDeckCount(deckId);
              } catch (err) {
                console.log(err);
              }
              break;

            case 'update_piece':
              try {
                const { pieces: p } = data;
                pieces = {
                  ...pieces,
                  ...p,
                };
                sendToRoom({
                  event: 'update_piece',
                  pieces: p,
                });
              } catch (err) {
                console.log(err);
              }
              break;

            case 'pick_up_cards':
              try {
                const { cardIds } = data;
                game.board = game.board.filter(
                  pieceId => !cardIds.includes(pieceId)
                );
                player.hand.push(...cardIds);
                conn.send({
                  event: 'set_hand',
                  hand: player.hand,
                });
                sendToRoom({
                  event: 'remove_from_board',
                  ids: cardIds,
                });
                sendHandCounts();
              } catch (err) {
                console.log(err);
              }
              break;

            case 'pass_cards':
              try {
                const { cardIds, playerId: receivingPlayerId } = data;
                const receivingPlayer = players[receivingPlayerId];
                player.hand = player.hand.filter(id => !cardIds.includes(id));
                receivingPlayer.hand.push(...cardIds);
                receivingPlayer.conn.send({
                  event: 'set_hand',
                  hand: receivingPlayer.hand,
                });
                conn.send({
                  event: 'set_hand',
                  hand: player.hand,
                });
                sendHandCounts();
              } catch (err) {
                console.log(err);
              }
              break;

            case 'rename_player':
              try {
                const { name } = data;
                player.name = name;
                playArea.name = name;
                playArea.delta++;
                sendToRoom({
                  event: 'update_piece',
                  pieces: {
                    [playArea.id]: playArea,
                  },
                });
              } catch (err) {
                console.log(err);
              }
              break;

            case 'play_cards':
              try {
                const { cardIds, faceDown } = data;
                const cards = player.hand
                  .filter(id => cardIds.includes(id))
                  .map((cardId, index) => {
                    const card = pieces[cardId] as CardPiece;
                    const deck = pieces[card.deckId];

                    return {
                      ...pieces[cardId],
                      faceDown,
                      x: playArea.x + index * 20,
                      y: playArea.y + 50 + index * 20,
                      width: deck.width,
                      height: deck.height,
                      delta: card.delta + 1,
                    };
                  }) as RenderPiece[];
                pieces = {
                  ...pieces,
                  ..._.keyBy(cards, 'id'),
                };
                player.hand = player.hand.filter(id => !cardIds.includes(id));
                game.board.push(...cardIds);
                conn.send({
                  event: 'set_hand',
                  hand: player.hand,
                });
                sendToRoom({
                  event: 'update_piece',
                  pieces: _.keyBy(cards, 'id'),
                });
                sendToRoom({
                  event: 'add_to_board',
                  pieces: cardIds,
                });
                sendHandCounts();
              } catch (err) {
                console.log(err);
              }
              break;

            case 'discard':
              try {
                const { cardIds } = data;
                player.hand = player.hand.filter(id => !cardIds.includes(id));
                cardIds.forEach(id => {
                  const card = pieces[id] as Card;
                  if (decks[card.deckId]) {
                    decks[card.deckId].discarded.push(id);
                  }
                });
                conn.send({
                  event: 'set_hand',
                  hand: player.hand,
                });
                sendHandCounts();
              } catch (err) {
                console.log(err);
              }
              break;

            case 'discard_played':
              try {
                const { deckId } = data;
                const cardIds = Object.values(pieces)
                  .filter(p => p.type === 'card' && p.deckId === deckId)
                  .map(c => c.id);
                decks[deckId].discarded.push(...cardIds);
                game.board = game.board.filter(pieceId =>
                  cardIds.includes(pieceId)
                );
                sendToRoom({
                  event: 'remove_from_board',
                  ids: cardIds,
                });
              } catch (err) {
                console.log(err);
              }
              break;

            case 'shuffle_discarded':
              try {
                const { deckId } = data;
                decks[deckId].cards.push(...decks[deckId].discarded.splice(0));
                decks[deckId].cards = _.shuffle(decks[deckId].cards);
                updateDeckCount(deckId);
              } catch (err) {
                console.log(err);
              }
              break;
          }
        });

        conn.on('error', err => {
          console.log(err);
        });
      });
    });
  });
}
