import _ from 'lodash';
import Peer from 'peerjs';
import {
  Card,
  RenderItem,
  GameConfig,
  CardOption,
  GameEvent,
  ClientEvent,
  PlayerItem,
} from '../types';

import { getHostId } from './playerId';
import { createPeer } from './peer';

interface GamePeerDataConnection extends Peer.DataConnection {
  send: (event: GameEvent) => void;
}

interface Deck {
  cards: Card[];
  discarded: Card[];
}

interface Player {
  name: string;
  hand: Card[];
  conn: GamePeerDataConnection;
}

interface Game {
  id: string;
  peer: Peer;
  board: RenderItem[];
  decks: {
    [id: string]: Deck;
  };
  players: {
    [id: string]: Player;
  };
}

export interface Assets {
  [key: string]: string;
}

interface GameOptions {
  assets: Assets;
  sendAssets: boolean;
}

let curGame: Game;

export function newGame(
  config: GameConfig,
  options: GameOptions,
  cb: (game: Game) => void
) {
  if (curGame) {
    curGame.peer.disconnect();
  }

  const peer = createPeer(getHostId());
  const { assets, sendAssets } = options;

  peer.on('open', gameId => {
    let idCount = 0;
    const decks: { [id: string]: Deck } = config.decks.reduce((byId, deck) => {
      return {
        ...byId,
        [deck.id]: {
          ...deck,
          discarded: [],
          cards: _.shuffle(
            (deck.cards as []).reduce(
              (cards: Card[], card: CardOption | string) => {
                const count = typeof card === 'string' ? 1 : card.count;
                const image = typeof card === 'string' ? card : card.image;
                return [
                  ...cards,
                  ...[...Array(count)].map(_ => ({
                    image,
                    id: `card_${idCount++}`,
                    type: 'card',
                    deckId: deck.id,
                    width: 200,
                    height: 300,
                    x: 0,
                    y: 0,
                    delta: 0,
                  })),
                ];
              },
              []
            )
          ),
        },
      };
    }, {});

    const game: Game = {
      peer,
      decks,
      id: gameId,
      players: {},
      board: [
        ...config.board,
        ...config.decks.map(deck => ({
          type: 'deck',
          id: deck.id,
          name: deck.name,
          image: deck.image,
          x: deck.x,
          y: deck.y,
          delta: 0,
          width: deck.width,
          height: deck.height,
          count: decks[deck.id].cards.length,
          total: decks[deck.id].cards.length,
        })),
      ] as RenderItem[],
    };
    const clients: GamePeerDataConnection[] = [];
    const sendToRoom = (event: GameEvent) => {
      clients.forEach(client => client.send(event));
    };
    const updateDeckCount = (deckId: string) => {
      const count = decks[deckId].cards.length;
      const item = game.board.find(item => item.id === deckId);
      if (!item) {
        return;
      }
      item.count = count;
      item.delta++;
      console.log('update_item', item.delta);
      sendToRoom({
        event: 'update_item',
        item: {
          count,
          id: deckId,
          delta: item.delta,
        },
      });
    };
    const sendHandCounts = () => {
      sendToRoom({
        event: 'hand_count',
        counts: Object.entries(game.players).reduce(
          (counts, [playerId, player]: [string, Player]) => ({
            ...counts,
            [playerId]: player.hand.length,
          }),
          {}
        ),
      });
    };

    curGame = game;
    console.log(`Started Game: ${gameId}`);
    cb(game);

    peer.on('connection', (conn: GamePeerDataConnection) => {
      const playerId = conn.peer;
      const player: Player = {
        conn,
        name: `Player ${Object.keys(game.players).length + 1}`,
        hand: [],
      };
      clients.push(conn);
      game.players[playerId] = player;

      conn.on('open', () => {
        const playerCount = _.size(game.players);
        const playerConfig = config.players[playerCount - 1];
        const playerArea = {
          id: playerId,
          type: 'player',
          name: player.name,
          x: playerConfig.x,
          y: playerConfig.y,
          fill: playerConfig.color,
          rotation: 0,
          layer: 5,
          delta: 0,
        };

        conn.send({
          assets: sendAssets ? assets : Object.keys(assets),
          event: 'join',
          hand: [],
          board: game.board,
          player: {
            name: player.name,
          },
        });

        game.board.push(playerArea as RenderItem);
        sendHandCounts();
        sendToRoom({
          event: 'add_to_board',
          items: [playerArea as RenderItem],
        });
      });

      conn.on('data', (data: ClientEvent) => {
        switch (data.event) {
          case 'request_asset':
            const { asset } = data;
            conn.send({
              event: 'asset_loaded',
              asset: {
                [asset]: assets[asset],
              },
            });
            break;
          case 'draw_cards':
            const { deckId, count } = data;
            try {
              console.log(`Player ${playerId} drew ${count} cards`);
              game.players[playerId].hand.push(
                ...game.decks[deckId].cards.splice(0, count)
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

          case 'update_item':
            try {
              const { item } = data;
              const boardItem = game.board.find(({ id }) => item.id === id);
              console.log('update_item received', item.delta);
              if (boardItem) {
                for (let prop in item) {
                  boardItem[prop] = item[prop];
                }
                boardItem.delta++;
                sendToRoom({
                  event: 'update_item',
                  item: boardItem,
                });
              }
            } catch (err) {
              console.log(err);
            }
            break;
          case 'pick_up_cards':
            try {
              const { cardIds } = data;
              const cards = game.board.filter(item =>
                cardIds.includes(item.id)
              ) as Card[];
              game.board = game.board.filter(
                item => !cardIds.includes(item.id)
              );
              player.hand.push(...cards);
              conn.send({
                event: 'set_hand',
                hand: player.hand,
              });
              sendToRoom({
                event: 'remove_from_board',
                ids: cards.map(x => x.id),
              });
              sendHandCounts();
            } catch (err) {
              console.log(err);
            }
            break;
          case 'rename_player':
            try {
              const { name } = data;
              const playerArea = game.board.find(
                item => item.id === playerId
              ) as PlayerItem;
              player.name = name;
              if (playerArea) {
                playerArea.name = name;
                playerArea.delta++;
                sendToRoom({
                  event: 'update_item',
                  item: {
                    name,
                    id: playerArea.id,
                    delta: playerArea.delta,
                  },
                });
              }
            } catch (err) {
              console.log(err);
            }
            break;
          case 'play_cards':
            try {
              const { cardIds } = data;
              const playerArea = game.board.find(item => item.id === playerId);
              if (!playerArea) {
                return;
              }
              const cards = player.hand
                .filter(card => cardIds.includes(card.id))
                .map((card, index) => ({
                  ...card,
                  x: playerArea.x + index * 10,
                  y: playerArea.y + 50 + index * 10,
                })) as RenderItem[];
              player.hand = player.hand.filter(
                card => !cardIds.includes(card.id)
              );
              game.board.push(...cards);
              conn.send({
                event: 'set_hand',
                hand: player.hand,
              });
              sendToRoom({
                event: 'add_to_board',
                items: cards,
              });
              sendHandCounts();
            } catch (err) {
              console.log(err);
            }
            break;
          case 'discard':
            try {
              const { cardIds } = data;
              const cards = player.hand
                .filter(card => cardIds.includes(card.id))
                .map(card => ({
                  ...card,
                  x: 0,
                  y: 0,
                }));
              player.hand = player.hand.filter(
                card => !cardIds.includes(card.id)
              );
              cards.forEach((card: Card) => {
                decks[card.deckId].discarded.push(card);
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
              const cards = (game.board.filter(
                item => (item as Card).deckId === deckId
              ) as unknown) as Card[];
              decks[deckId].discarded.push(...cards);
              game.board = game.board.filter(
                item => (item as Card).deckId !== deckId
              );
              sendToRoom({
                event: 'remove_from_board',
                ids: cards.map(x => x.id),
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
}
