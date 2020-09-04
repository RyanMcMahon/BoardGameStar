import * as _ from 'lodash';
import React from 'react';
import Peer from 'peerjs';
import { Loader } from 'pixi.js';

import { getInstanceId, getIdentity } from './identity';

import {
  GameEvent,
  ClientEvent,
  ChatEvent,
  Game,
  Assets,
  Pieces,
  PromptPlayersEvent,
  PromptResultsEvent,
} from '../types';
import { createPeer } from './peer';
import { getCachedAsset, cacheAsset } from './store';

interface ClientPeerDataConnection extends Peer.DataConnection {
  send: (event: ClientEvent) => void;
}

interface ClientState {
  isLoaded: boolean;
  game: Game | null;
  board: string[];
  assets: Assets;
  pendingAssets: string[];
  cachedAssets: string[];
  requestAsset: string;
  pieces: Pieces;
  chat: ChatEvent[];
  myHand: string[];
  handCounts: { [key: string]: number };
  myDice: string[];
  diceCounts: { [key: string]: number };
  peekingPlayers: {
    [key: string]: string;
  };
  peekingCards: string[];
  peekingDiscardedCards: string[];
  activePrompts: PromptPlayersEvent[];
  promptResults: {
    [promptId: string]: PromptResultsEvent;
  };
  renderCount: number;
}

function clientReducer(state: ClientState, data: GameEvent) {
  switch (data.event) {
    case 'prompt_players': {
      return {
        ...state,
        activePrompts: [...state.activePrompts, data],
      };
    }

    case 'clear_prompt_result': {
      return {
        ...state,
        activePrompts: state.activePrompts.slice(1),
      };
    }

    case 'prompt_results': {
      return {
        ...state,
        promptResults: {
          ...state.promptResults,
          [data.promptId]: data,
        },
      };
    }

    case 'set_request_asset': {
      return {
        ...state,
        requestAsset: data.asset,
      };
    }

    case 'asset_loaded': {
      const { asset, loadedFromCache } = data;
      const assets = { ...state.assets };
      let cachedAssets = [...state.cachedAssets];
      let pendingAssets = [...state.pendingAssets];

      Object.entries(asset).forEach(([key, value]) => {
        assets[key] = value;
        pendingAssets = pendingAssets.filter(a => a !== key);
        if (loadedFromCache) {
          cachedAssets.push(key);
        }
      });

      return {
        ...state,
        assets,
        pendingAssets,
        cachedAssets,
      };
    }

    case 'set_board_event': {
      return {
        ...state,
        board: data.board,
        renderCount: state.renderCount + 1,
      };
    }

    case 'player_join': {
      const { board: b, pieces: p } = data;
      return {
        ...state,
        pieces: p,
        board: b,
        renderCount: state.renderCount + 1,
      };
    }

    case 'join': {
      const { assets: a, game: g, hand, chat: c } = data;

      const newState = {
        ...state,
        chat: c,
        myHand: hand,
        game: g,
        renderCount: state.renderCount + 1,
      };

      if (Array.isArray(a)) {
        newState.pendingAssets = a;
      }

      return newState;
    }

    case 'chat': {
      return {
        ...state,
        chat: [...state.chat, data],
      };
    }

    case 'add_to_board': {
      const { pieces } = data;
      return {
        ...state,
        board: [...state.board, ...pieces],
        renderCount: state.renderCount + 1,
      };
    }

    case 'hand_count': {
      const { counts: c } = data;
      return {
        ...state,
        handCounts: {
          ...state.handCounts,
          ...c,
        },
        renderCount: state.renderCount + 1,
      };
    }

    case 'set_dice': {
      const { diceIds } = data;
      return {
        ...state,
        myDice: diceIds,
        renderCount: state.renderCount + 1,
      };
    }

    case 'dice_counts': {
      const { counts: c } = data;
      return {
        ...state,
        diceCounts: {
          ...state.diceCounts,
          ...c,
        },
        renderCount: state.renderCount + 1,
      };
    }

    // case 'deck_peek': {
    //   const { deckId, playerId, peeking } = data;
    //   return {
    //     ...state,
    //     peekingPlayers: {
    //       ...state.peekingPlayers,
    //       [playerId]: peeking ? deckId : '',
    //     },
    //     renderCount: state.renderCount + 1,
    //   };
    // }

    case 'deck_peek_results': {
      const { cardIds, discardedCardIds } = data;
      return {
        ...state,
        peekingCards: cardIds,
        peekingDiscardedCards: discardedCardIds,
        renderCount: state.renderCount + 1,
      };
    }

    case 'remove_from_board': {
      const { ids } = data;
      const boardCopy = [...state.board];
      ids.forEach(id => {
        const index = boardCopy.findIndex(pieceId => pieceId === id);
        if (index > -1) {
          boardCopy.splice(index, 1);
        }
      });
      return {
        ...state,
        board: boardCopy,
        renderCount: state.renderCount + 1,
      };
    }

    case 'set_hand': {
      const { hand: h } = data;
      return {
        ...state,
        myHand: h,
        renderCount: state.renderCount + 1,
      };
    }

    case 'update_piece': {
      const { pieces: updatedPieces } = data;
      const { pieces } = state;
      const u = { ...updatedPieces };
      for (let i in u) {
        if (pieces[i] && u[i].delta <= pieces[i].delta) {
          delete u[i];
        }
      }
      return {
        ...state,
        pieces: {
          ...pieces,
          ...u,
        },
        renderCount: state.renderCount + 1,
      };
    }

    case 'local_piece_update': {
      return {
        ...state,
        pieces: {
          ...state.pieces,
          ...data.pieces,
        },
        renderCount: state.renderCount + 1,
      };
    }

    case 'load_complete': {
      return { ...state, isLoaded: true };
    }

    default: {
      console.error('unhandled event', data);
      return state;
    }
  }
}

export function useGameClient(
  gameId: string,
  hostId: string,
  spectator?: boolean
) {
  const [failedConnection, setFailedConnection] = React.useState(false);
  const [checkTimeout, setCheckTimeout] = React.useState(false);
  const [playerId, setPlayerId] = React.useState<string>('');
  const [percentLoaded, setPercentLoaded] = React.useState<number>(5);
  const [conn, setConn] = React.useState<ClientPeerDataConnection>();

  const [state, dispatch] = React.useReducer<
    React.Reducer<ClientState, GameEvent>,
    ClientState
  >(
    clientReducer,
    {
      requestAsset: '',
      board: [],
      pieces: {},
      assets: {},
      chat: [],
      isLoaded: false,
      game: null,
      pendingAssets: [],
      cachedAssets: [],
      myHand: [],
      handCounts: {},
      myDice: [],
      diceCounts: {},
      peekingPlayers: {},
      peekingCards: [],
      peekingDiscardedCards: [],
      activePrompts: [],
      promptResults: {},
      renderCount: 0,
    },
    (state: ClientState) => state
  );
  const {
    board,
    pieces,
    assets,
    chat,
    isLoaded,
    game,
    pendingAssets,
    cachedAssets,
    myHand,
    handCounts,
    myDice,
    diceCounts,
    peekingPlayers,
    peekingCards,
    peekingDiscardedCards,
    activePrompts,
    promptResults,
    renderCount,
  } = state;

  const clearPrompt = () => dispatch({ event: 'clear_prompt_result' });

  const updatePieces = (p: Pieces) =>
    dispatch({ event: 'local_piece_update', pieces: p });

  const requestAsset = React.useCallback(
    (asset: string) => {
      if (!conn || !game) {
        throw new Error(
          'Time Paradox: requesting assets before connection established'
        );
      }
      if (assets[asset]) {
        return;
      }

      const loadAsset = async () => {
        const a = await getCachedAsset(game.id, game.version.toString(), asset);

        if (a) {
          dispatch({
            event: 'asset_loaded',
            loadedFromCache: true,
            asset: { [asset]: a.asset },
          });
          return;
        }

        conn.send({
          asset,
          event: 'request_asset',
        });
      };
      loadAsset();
    },
    [conn, assets, game]
  );

  React.useEffect(() => {
    if (state.requestAsset) {
      requestAsset(state.requestAsset);
    }
  }, [state.requestAsset, requestAsset]);

  React.useEffect(() => {
    if (isLoaded) {
      return;
    }

    const checkForAssets = async () => {
      if (pendingAssets.length) {
        setPercentLoaded(
          percent => percent + (100 - percent) / pendingAssets.length
        );
        dispatch({
          event: 'set_request_asset',
          asset: pendingAssets[0],
        });
      } else if (game) {
        Loader.shared.reset();

        for (let name in assets) {
          Loader.shared.add(name, assets[name]);
          if (!cachedAssets.includes(name)) {
            await cacheAsset(
              game.id,
              game.version.toString(),
              name,
              assets[name]
            );
          }
        }

        Loader.shared.load(() => {
          dispatch({
            event: 'load_complete',
          });
        });
      }
    };
    checkForAssets();
  }, [pendingAssets, cachedAssets, requestAsset, assets, isLoaded, game]);

  React.useEffect(() => {
    const initPeer = async () => {
      try {
        const { instanceId, playerId, name } = getIdentity();
        const peer = await createPeer(instanceId);

        peer.on('open', () => {
          const conn = peer.connect(getInstanceId(gameId, hostId), {
            metadata: {
              playerId,
              name,
              spectator,
            },
            reliable: true,
          });
          conn.on('data', dispatch);
          conn.on('error', err => {
            console.log(err);
            setFailedConnection(true);
          });
          setConn(conn);
          setPlayerId(playerId);
          setPercentLoaded(5);
        });

        peer.on('error', err => {
          console.log(err);
          setFailedConnection(true);
        });

        setTimeout(() => setCheckTimeout(true), 10 * 1000);
      } catch (err) {
        console.log(err);
        setFailedConnection(true);
        debugger;
      }
    };
    initPeer();
  }, [gameId, hostId, spectator]);

  React.useEffect(() => {
    if (checkTimeout && !isLoaded && !_.size(assets)) {
      setFailedConnection(true);
    }
  }, [checkTimeout, isLoaded, assets]);

  return {
    playerId,
    conn,
    isLoaded,
    game,
    chat,
    board,
    pieces,
    updatePieces,
    myHand,
    assets,
    percentLoaded,
    handCounts,
    failedConnection,
    myDice,
    diceCounts,
    peekingPlayers,
    peekingCards,
    peekingDiscardedCards,
    activePrompts,
    promptResults,
    clearPrompt,
    renderCount,
  };
}
