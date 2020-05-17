import * as _ from 'lodash';
import React from 'react';
import Peer from 'peerjs';

import { getPlayerId } from './playerId';

import {
  Card,
  RenderPiece,
  JoinEvent,
  SetHandEvent,
  UpdatePieceEvent,
  RemoveFromBoardEvent,
  AddToBoardEvent,
  HandCountEvent,
  AssetLoadedEvent,
  GameEvent,
  ClientEvent,
} from '../types';
import { createPeer } from './peer';

let tempAssets: {
  [key: string]: string;
} = {};

interface ClientPeerDataConnection extends Peer.DataConnection {
  send: (event: ClientEvent) => void;
}

export function useGameClient(gameId: string) {
  const [failedConnection, setFailedConnection] = React.useState(false);
  const [checkTimeout, setCheckTimeout] = React.useState(false);
  const [playerId, setPlayerId] = React.useState<string>('');
  const [percentLoaded, setPercentLoaded] = React.useState<number>(5);
  const [conn, setConn] = React.useState<ClientPeerDataConnection>();
  const [assets, setAssets] = React.useState<{ [key: string]: string }>({});
  const [pendingAssets, setPendingAssets] = React.useState<string[]>([]);
  const [board, setBoard] = React.useState<RenderPiece[]>([]);
  const [myHand, setMyHand] = React.useState<Card[]>([]);
  const [handCounts, setHandCounts] = React.useState<{ [key: string]: number }>(
    {}
  );

  const requestAsset = React.useCallback(
    (asset: string) => {
      if (!conn) {
        return;
        // throw new Error(
        //   'Time Paradox: requesting assets before connection established'
        // );
      }
      conn.send({
        asset,
        event: 'request_asset',
      });
    },
    [conn]
  );

  const processEvent = React.useCallback((data: GameEvent) => {
    const { event } = data;
    console.log(data);
    switch (event) {
      case 'asset_loaded':
        const { asset } = data as AssetLoadedEvent;
        Object.entries(asset).forEach(([key, value]) => {
          setPendingAssets(pending => pending.filter(a => a !== key));
          tempAssets[key] = value;
        });
        break;
      case 'add_to_board':
        const { pieces } = data as AddToBoardEvent;
        setBoard((b: RenderPiece[]) => [...b, ...pieces]);
        break;
      case 'hand_count':
        const { counts: c } = data as HandCountEvent;
        setHandCounts(counts => ({ ...counts, ...c }));
        break;
      case 'join':
        const { assets: a, hand, board: b } = data as JoinEvent;
        setMyHand(hand);
        setBoard(prevBoard => [...b, ...prevBoard]);
        if (Array.isArray(a)) {
          setPendingAssets(a);
        } else {
          // Fake loader to give time to read "Facts"
          setTimeout(
            () => setPercentLoaded(_.random(20, 30)),
            _.random(500, 1200)
          );
          setTimeout(
            () => setPercentLoaded(_.random(50, 70)),
            _.random(1500, 2000)
          );
          setTimeout(
            () => setPercentLoaded(_.random(80, 99)),
            _.random(2200, 3000)
          );
          setTimeout(() => setAssets(a), _.random(3100, 3500));
        }
        break;
      case 'remove_from_board':
        const { ids } = data as RemoveFromBoardEvent;
        setBoard((b: RenderPiece[]) => {
          const boardCopy = [...b];
          ids.forEach(id => {
            const index = boardCopy.findIndex(piece => piece.id === id);
            boardCopy.splice(index, 1, {
              type: 'deleted',
              id: _.uniqueId('deleted_'),
              delta: 0,
              x: 0,
              y: 0,
              rotation: 0,
              layer: 0,
            });
          });
          return boardCopy;
        });
        break;
      case 'set_hand':
        const { hand: h } = data as SetHandEvent;
        setMyHand(h);
        break;
      case 'update_piece':
        const { piece } = data as UpdatePieceEvent;
        console.log('update_piece', piece.delta);
        setBoard((b: RenderPiece[]) => {
          // Preserve render order to maintain drag controls
          const index = b.findIndex(({ id }) => piece.id === id);
          const boardCopy = [...b];
          if (index > -1 && boardCopy[index].delta < piece.delta) {
            boardCopy.splice(index, 1, {
              ...boardCopy[index],
              ...piece,
            } as RenderPiece);
          }
          return boardCopy;
        });
        break;
    }
  }, []);

  React.useEffect(() => {
    if (pendingAssets.length) {
      setPercentLoaded(
        percent => percent + ((100 - percent) / pendingAssets.length + 1)
      );
      requestAsset(pendingAssets[0]);
    } else if (_.size(tempAssets)) {
      setAssets(tempAssets);
    }
  }, [pendingAssets, requestAsset]);

  React.useEffect(() => {
    const peer = createPeer(getPlayerId());

    peer.on('open', playerId => {
      const conn = peer.connect(gameId, { reliable: true });
      conn.on('data', processEvent);
      conn.on('error', err => {
        console.log(err);
        setFailedConnection(true);
      });
      setConn(conn);
      setPlayerId(playerId);
      setPercentLoaded(5);
    });

    setTimeout(() => setCheckTimeout(true), 10 * 1000);
  }, [gameId, processEvent]);

  React.useEffect(() => {
    if (checkTimeout && !board.length) {
      setFailedConnection(true);
    }
  }, [checkTimeout, board]);

  return {
    playerId,
    conn,
    board,
    setBoard,
    myHand,
    assets,
    percentLoaded,
    handCounts,
    failedConnection,
  };
}
