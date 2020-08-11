import _ from 'lodash';
import slug from 'slugid';
import Peer from 'peerjs';
import {
  Card,
  RenderPiece,
  Game,
  GameEvent,
  ClientEvent,
  PlayerPiece,
  Pieces,
  DicePiece,
  CardPiece,
  DeckPiece,
  ChatEvent,
  StackPiece,
  MoneyTokenPiece,
  GamePromptAnswer,
  GamePrompt,
} from '../types';

import { getHostId, getGameId, getInstanceId } from './identity';
import { createPeer } from './peer';

interface GamePeerDataConnection extends Peer.DataConnection {
  send: (event: GameEvent) => void;
  metadata: {
    playerId: string;
    name: string;
    spectator?: boolean;
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

export interface GameState {
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

let curGame: GameState;

export async function createNewGame(
  game: Game,
  options: GameOptions,
  cb: (gameState: GameState) => void
) {
  if (curGame) {
    curGame.peer.disconnect();
  }

  const scenario = game.config.scenarios[game.config.curScenario];
  const hostId = getHostId();
  const gameId = getGameId();
  const peer = await createPeer(getInstanceId(gameId, hostId));
  const { assets, sendAssets } = options;

  peer.on('open', () => {
    const chat: ChatEvent[] = [];
    let hiddenPieces: Pieces = {};
    let pieces: Pieces = Object.values(game.config.pieces).reduce(
      (byId, piece) => {
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
      },
      {}
    );

    let decks: Decks = Object.values(pieces)
      .filter(p => p.type === 'deck')
      .reduce(
        (byId, deck) => ({
          ...byId,
          [deck.id]: {
            ...deck,
            count: 0,
            total: 0,
            cards: [],
            discarded: [],
          },
        }),
        {}
      );

    const shuffleDiscarded = (deckId: string) => {
      decks[deckId].cards.push(...decks[deckId].discarded.splice(0));
      decks[deckId].cards = _.shuffle(decks[deckId].cards);
    };

    const maxPlayers = scenario.players.length;
    const piecesForPlayerCounts: {
      [pieceId: string]: number[];
    } = {};

    Object.values(game.config.pieces).forEach(piece => {
      if (piece.counts) {
        const countExp = (piece.counts || '1').split(',').map((t, index) => {
          const tuple = t.split(':');
          if (tuple.length < 2) {
            tuple.unshift(`${index + 1}`);
          }
          return [parseInt(tuple[0], 10), parseInt(tuple[1], 10)];
        });
        countExp.forEach(([min, count], index) => {
          const max =
            index + 1 < countExp.length
              ? countExp[index + 1][0] - 1
              : maxPlayers;

          piecesForPlayerCounts[piece.id] = new Array(maxPlayers).fill(0);
          for (let i = min; i <= max; i++) {
            piecesForPlayerCounts[piece.id][i] = count;
          }
        });
      }
    });

    const players: Players = {};
    const gameState: GameState = {
      peer,
      hostId,
      gameId,
      pieces,
      board: [],
    };
    const clients: GamePeerDataConnection[] = [];
    const prompts: {
      [promptId: string]: {
        players: string[];
        prompt: GamePrompt;
        answers: {
          [playerId: string]: GamePromptAnswer[];
        };
      };
    } = {};
    const sendToRoom = (event: GameEvent) => {
      clients.forEach(client => client.send(event));
    };

    const getCardsForDeck = (deckId: string) =>
      Object.values(pieces).filter(p => p.deckId === deckId);

    const updateDeckCount = (deckId: string) => {
      const count = decks[deckId].cards.length;
      const piece = pieces[deckId];
      if (!piece) {
        return;
      }
      piece.count = count;
      piece.total = getCardsForDeck(piece.id).length;
      piece.delta++;

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

    const updatePlayerCount = () => {
      const playerCount = Object.keys(players).length;

      for (let pieceId in pieces) {
        const piece = pieces[pieceId];
        if (
          piecesForPlayerCounts[pieceId] ||
          piecesForPlayerCounts[piece.parentId]
        ) {
          delete pieces[pieceId];
        }
      }

      pieces = {
        ...pieces,
        ...Object.entries(piecesForPlayerCounts).reduce((agg, [id, counts]) => {
          const piece = game.config.pieces[id];
          const offset = {
            x: ((piece as any).width || (piece as any).radius * 2) * 1.2,
            y: ((piece as any).height || (piece as any).radius * 2) * 1.2,
          };
          const ret: Pieces = { ...agg };

          for (let i = 0; i < counts[playerCount]; i++) {
            const copy = {
              ...piece,
              x: piece.x + (i % 10) * offset.x,
              y: piece.y + Math.floor(i / 10) * offset.y,
              id: slug.nice(),
              parentId: id,
              delta: 0,
            };
            ret[copy.id] = copy as any;
          }

          return ret;
        }, {}),
      };

      Object.values(decks).forEach(deck => {
        deck.cards = _.shuffle(getCardsForDeck(deck.id).map(c => c.id));
        updateDeckCount(deck.id);
      });

      gameState.board = Object.values(pieces)
        .filter(piece => piece.type !== 'card')
        .map(p => p.id);

      sendToRoom({
        pieces,
        board: gameState.board,
        event: 'player_join',
      });
    };

    curGame = gameState;
    console.log(`Started Game: ${hostId}_${gameId}`);
    cb(gameState);

    peer.on('connection', (conn: GamePeerDataConnection) => {
      const { playerId, name, spectator } = conn.metadata;
      let playerCount;
      let player: Player;

      clients.push(conn);

      if (!spectator) {
        playerCount = Object.keys(players).length + 1;
        player = players[playerId] || {
          conn,
          name: name || `Player ${playerCount}`,
          hand: [],
        };
        players[playerId] = player;
      }

      conn.on('open', () => {
        let playArea: PlayerPiece;
        if (!spectator) {
          const playAreaId = scenario.players[_.size(players) - 1];
          playArea = pieces[playAreaId] as PlayerPiece;
          playArea.playerId = playerId;
          playArea.delta++;
          playArea.name = player.name;
          pieces[playArea.id] = playArea;
          updatePlayerCount();
        }

        const syncConfig = { ...game };
        delete syncConfig.loadAssets;
        delete syncConfig.store;

        try {
          conn.send({
            chat,
            event: 'join',
            game: syncConfig,
            assets: sendAssets ? assets : Object.keys(assets),
            hand: spectator ? [] : player.hand,
            // TODO remove
            player: {
              name: spectator ? 'spectator' : player.name,
            },
          });
        } catch (err) {
          console.error(err);
        }

        if (spectator) {
          conn.send({
            pieces,
            board: gameState.board,
            event: 'player_join',
          });
        } else {
          sendHandCounts();
          sendToRoom({
            event: 'update_piece',
            pieces: {
              [playArea!.id]: playArea!,
            },
          });
        }

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

            case 'transaction':
              try {
                const { amount } = data;
                const { from, to } = data.transaction;
                const fromPiece = pieces[from.id];
                let moneyTemplate = (fromPiece.type === 'money'
                  ? fromPiece
                  : {
                      ...Object.values(pieces).find(p => p.type === 'money'),
                      x: 0, // TODO
                      y: 0, // TODO
                    }) as MoneyTokenPiece;

                if (fromPiece.balance < amount) {
                  console.error('Insufficient Funds');
                  return;
                }

                const toPiece: MoneyTokenPiece | PlayerPiece = to.id
                  ? (pieces[to.id] as MoneyTokenPiece | PlayerPiece)
                  : {
                      ...moneyTemplate,
                      id: slug.nice(),
                      x: moneyTemplate.x + moneyTemplate.width + 40,
                      balance: 0,
                      delta: 0,
                    };

                if (!toPiece) {
                  console.error('Unknown Recipient');
                  return;
                }

                fromPiece.balance -= amount;
                fromPiece.delta++;
                toPiece.balance = (toPiece.balance || 0) + amount;
                toPiece.delta++;

                if (
                  fromPiece.balance === 0 &&
                  Object.values(pieces).find(
                    p => p.type === 'money' && p.id !== fromPiece.id
                  )
                ) {
                  fromPiece.type = 'deleted';
                  sendToRoom({
                    event: 'remove_from_board',
                    ids: [fromPiece.id],
                  });
                }

                sendToRoom({
                  event: 'update_piece',
                  pieces: {
                    [fromPiece.id]: fromPiece,
                    [toPiece.id]: toPiece,
                  },
                });

                if (!to.id) {
                  sendToRoom({
                    event: 'add_to_board',
                    pieces: [toPiece.id],
                  });
                  pieces[toPiece.id] = toPiece;
                }
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
                  gameState.board.push(...Object.keys(diceById));
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
                const remainingDrawCount = count - decks[deckId].cards.length;
                players[playerId].hand.push(
                  ...decks[deckId].cards.splice(0, count)
                );

                if (remainingDrawCount > 0) {
                  shuffleDiscarded(deckId);
                  players[playerId].hand.push(
                    ...decks[deckId].cards.splice(0, remainingDrawCount)
                  );
                }

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
                const remainingDrawCount = count - decks[deckId].cards.length;
                const cardIds = decks[deckId].cards.splice(0, count);

                if (remainingDrawCount > 0) {
                  shuffleDiscarded(deckId);
                  cardIds.push(
                    ...decks[deckId].cards.splice(0, remainingDrawCount)
                  );
                }

                gameState.board.push(...cardIds);

                const p = cardIds
                  .map((id, index) => ({
                    ...pieces[id],
                    faceDown,
                    x: deckPiece.x + deckPiece.width + 50 + index * 40,
                    y: deckPiece.y,
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

            case 'prompt_players':
              try {
                const prompt = { ...data.prompt, id: slug.nice() };
                prompts[prompt.id] = {
                  prompt,
                  answers: {},
                  players: data.players,
                };
                sendToRoom({
                  ...data,
                  prompt,
                });
              } catch (err) {
                console.log(err);
              }
              break;

            case 'prompt_submission':
              try {
                const { answers, promptId } = data;
                const prompt = prompts[promptId];

                if (answers) {
                  prompt.answers[playerId] = answers;
                } else {
                  delete prompt.answers[playerId];
                }

                if (prompt.players.every(id => prompt.answers[id])) {
                  sendToRoom({
                    promptId,
                    results: prompt.answers,
                    event: 'prompt_results',
                  });
                } else {
                  sendToRoom({
                    promptId,
                    results: Object.keys(prompt.answers).reduce(
                      (agg, id) => ({ ...agg, [id]: true }),
                      {}
                    ),
                    event: 'prompt_results',
                  });
                }
              } catch (err) {
                console.log(err);
              }
              break;

            case 'create_stack': {
              try {
                const { ids } = data;
                const top = pieces[ids.slice(-1)[0]];
                const bottom = pieces[ids[0]];
                const stack: StackPiece = {
                  ...top,
                  x: bottom.x,
                  y: bottom.y,
                  id: slug.nice(),
                  type: 'stack',
                  pieces: [
                    ...(bottom.pieces || [bottom.id]),
                    ...(top.pieces || [top.id]),
                  ],
                  counts: null,
                  delta: 0,
                };
                pieces[stack.id] = stack;
                gameState.board = gameState.board.filter(i => !ids.includes(i));
                gameState.board.push(stack.id);
                sendToRoom({
                  ids,
                  event: 'remove_from_board',
                });
                sendToRoom({
                  event: 'update_piece',
                  pieces: {
                    [stack.id]: stack,
                  },
                });
                sendToRoom({
                  pieces: [stack.id],
                  event: 'add_to_board',
                });
              } catch (err) {
                console.log(err);
              }
              break;
            }

            case 'split_stack': {
              try {
                const { id, count } = data;
                const stack = pieces[id];
                const bottom = stack.pieces.slice(0, count - 1);
                const top = stack.pieces.slice(count - 1);

                const piecesToRemove: string[] = [];
                const piecesToAdd: string[] = [];
                const updatedPieces: Pieces = {};

                if (!top.length) {
                  return;
                }

                if (bottom.length === 1) {
                  const [bottomId] = bottom;
                  const bottomPiece = pieces[bottomId];
                  piecesToRemove.push(stack.id);
                  piecesToAdd.push(bottomId);

                  bottomPiece.x = stack.x;
                  bottomPiece.y = stack.y;
                  bottomPiece.delta++;
                  updatedPieces[bottomId] = bottomPiece;
                } else {
                  stack.pieces = bottom;
                  stack.delta++;
                  updatedPieces[stack.id] = stack;
                }

                if (top.length === 1) {
                  const [topId] = top;
                  const topPiece = pieces[topId];
                  piecesToAdd.push(topId);

                  topPiece.x =
                    stack.x + (topPiece.width || topPiece.radius * 2) + 20;
                  topPiece.y = stack.y;
                  topPiece.delta++;
                  updatedPieces[topId] = topPiece;
                } else {
                  const topStack: StackPiece = {
                    ...pieces[top[0]],
                    id: slug.nice(),
                    type: 'stack',
                    pieces: top,
                    counts: null,
                    delta: 0,
                    x: stack.x + (stack.width || stack.radius * 2) + 20,
                    y: stack.y + 50,
                  };
                  pieces[topStack.id] = topStack;
                  updatedPieces[topStack.id] = topStack;
                  piecesToAdd.push(topStack.id);
                }

                sendToRoom({
                  event: 'update_piece',
                  pieces: updatedPieces,
                });
                sendToRoom({
                  event: 'remove_from_board',
                  ids: piecesToRemove,
                });
                sendToRoom({
                  event: 'add_to_board',
                  pieces: piecesToAdd,
                });
              } catch (err) {
                console.log(err);
              }
              break;
            }

            case 'pick_up_cards':
              try {
                const { cardIds } = data;
                gameState.board = gameState.board.filter(
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
                      x: playArea.x + index * 40,
                      y: playArea.y + 50,
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
                gameState.board.push(...cardIds);
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
                    gameState.board = gameState.board.filter(
                      pieceId => pieceId !== id
                    );
                    decks[card.deckId].discarded.push(id);
                  }
                });
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

            case 'discard_played':
              try {
                const { deckId } = data;
                const cardIds = gameState.board
                  .map(id => pieces[id])
                  .filter(p => p.type === 'card' && p.deckId === deckId)
                  .map(c => c.id);
                decks[deckId].discarded.push(...cardIds);
                gameState.board = gameState.board.filter(pieceId =>
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
                shuffleDiscarded(deckId);
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
