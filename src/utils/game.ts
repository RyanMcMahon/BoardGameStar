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
  DicePiece,
  CardPiece,
  DeckPiece,
  ChatEvent,
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

  const scenario = config.scenarios[config.curScenario];
  const hostId = getHostId();
  const gameId = getGameId();
  const peer = createPeer(getInstanceId(gameId, hostId));
  const { assets, sendAssets } = options;

  peer.on('open', () => {
    const chat: ChatEvent[] = [];
    let hiddenPieces: Pieces = {};
    let pieces: Pieces = Object.values(config.pieces).reduce((byId, piece) => {
      if (piece.type !== 'card') {
        return {
          ...byId,
          [piece.id]: {
            ...piece,
            delta: 0,
          },
        };
      } else {
        return byId;
      }
    }, {});

    const decks: Decks = Object.values(pieces)
      .filter(p => p.type === 'deck')
      .reduce(
        (byId, deck) => ({
          ...byId,
          [deck.id]: {
            ...deck,
            cards: [],
            discarded: [],
          },
        }),
        {}
      );
    Object.values(decks).forEach(deck => {
      (pieces[deck.id] as DeckPiece).total = 0; //deck.cards.length;
      (pieces[deck.id] as DeckPiece).count = 0; //deck.cards.length;
    });

    // Create Cards
    const maxPlayers = scenario.players.length;
    const cardsForPlayerCounts: {
      [deckId: string]: {
        [playerCount: number]: string[];
      };
    } = Object.keys(decks)
      .map(deckId => [
        deckId,
        [...Array(maxPlayers)].reduce(
          (agg, x, index) => ({
            ...agg,
            [index + 1]: [],
          }),
          {}
        ),
      ])
      .reduce(
        (agg, [deckId, cardMap]) => ({
          ...agg,
          [deckId]: cardMap,
        }),
        {}
      );

    Object.values(config.pieces).forEach(piece => {
      if (piece.type === 'card') {
        const countExp = (piece.counts || '1').split(',').map((t, index) => {
          const tuple = t.split(':');
          if (tuple.length < 2) {
            tuple.unshift(`${index + 1}`);
          }
          return [parseInt(tuple[0], 10), parseInt(tuple[1], 10)];
        });
        console.log(countExp);
        countExp.forEach(([min, count], index) => {
          const max =
            index + 1 < countExp.length
              ? countExp[index + 1][0] - 1
              : maxPlayers;
          console.log(min, max, count);
          for (let i = min; i <= max; i++) {
            for (let k = 0; k < count; k++) {
              const cardCopy = {
                ...piece,
                id: slug.nice(),
                parentId: piece.id,
                delta: 0,
              };
              cardsForPlayerCounts[piece.deckId][i].push(cardCopy.id);
              pieces[cardCopy.id] = cardCopy;
            }
          }
        });
      }
    });
    console.log(cardsForPlayerCounts);

    const players: Players = {};
    const game: Game = {
      peer,
      hostId,
      gameId,
      pieces,
      board: scenario.pieces.filter(
        pieceId => pieces[pieceId] && pieces[pieceId].type !== 'card'
      ),
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
      piece.total = cardsForPlayerCounts[deckId][_.size(players)].length;
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
      const playerCount = Object.keys(players).length + 1;
      const player: Player = players[playerId] || {
        conn,
        name: name || `Player ${playerCount}`,
        hand: [],
      };
      clients.push(conn);
      players[playerId] = player;

      conn.on('open', () => {
        const playAreaId = scenario.players[_.size(players) - 1];
        let playArea = pieces[playAreaId] as PlayerPiece;
        playArea.playerId = playerId;
        playArea.delta++;
        playArea.name = player.name;

        const syncConfig = { ...config };
        delete syncConfig.loadAssets;
        delete syncConfig.store;

        // look at cards and adjust to player counts
        Object.values(decks).forEach(deck => {
          deck.cards = _.shuffle(cardsForPlayerCounts[deck.id][playerCount]);
          updateDeckCount(deck.id);
        });

        console.log(pieces);
        conn.send({
          pieces,
          chat,
          event: 'join',
          config: syncConfig,
          assets: sendAssets ? assets : Object.keys(assets),
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

            case 'chat':
              try {
                chat.push(data);
                sendToRoom(data);
              } catch (err) {
                console.log(err);
              }
              break;

            case 'roll_dice':
              try {
                const { dice, hidden } = data;
                const dicePieces: DicePiece[] = Object.entries(dice)
                  .filter(([faces, count]) => count > 0)
                  .reduce((agg, [faces, count], setIndex) => {
                    const d: DicePiece[] = [...Array(count)].map(
                      (x, index) => ({
                        hidden,
                        id: slug.nice(),
                        type: 'die',
                        faces: parseInt(faces, 10),
                        value: _.random(1, parseInt(faces, 10)),
                        delta: 0,
                        x: playArea.x + index * 150,
                        y: playArea.y + 50 + setIndex * 150,
                        layer: 6,
                      })
                    );
                    return [...agg, ...d];
                  }, [] as DicePiece[]);
                const diceById = (_.keyBy(
                  dicePieces,
                  'id'
                ) as unknown) as Pieces;

                conn.send({
                  event: 'set_dice',
                  diceIds: Object.keys(diceById),
                });

                const send = hidden ? conn.send : sendToRoom;
                send({
                  event: 'update_piece',
                  pieces: diceById,
                });
                send({
                  event: 'add_to_board',
                  pieces: Object.keys(diceById),
                });

                if (hidden) {
                  hiddenPieces = {
                    ...hiddenPieces,
                    ...diceById,
                  };
                } else {
                  pieces = {
                    ...pieces,
                    ...diceById,
                  };
                  game.board.push(...Object.keys(diceById));
                }
              } catch (err) {
                console.log(err);
              }
              break;

            // TODO
            // case 'reveal_pieces':
            //   try {
            //     const { pieceIds } = data;

            //     // TODO
            //   } catch (err) {
            //     console.log(err);
            //   }
            //   break;

            case 'peek_at_deck':
              try {
                const { deckId, peeking } = data;
                if (peeking) {
                  conn.send({
                    event: 'deck_peek_results',
                    cardIds: _.shuffle(decks[deckId].cards),
                    discardedCardIds: _.shuffle(decks[deckId].discarded),
                  });
                } else {
                  conn.send({
                    event: 'deck_peek_results',
                    cardIds: [],
                    discardedCardIds: [],
                  });
                }
                sendToRoom({
                  deckId,
                  playerId,
                  peeking,
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
                  .reduce(
                    (agg, piece) => ({
                      ...agg,
                      [(piece as RenderPiece).id]: piece,
                    }),
                    {}
                  );
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
                Object.values(p).forEach(piece => {
                  if (playArea.id === piece.id) {
                    playArea = piece as PlayerPiece;
                  }
                });
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
                const cardIds = game.board
                  .map(id => pieces[id])
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
