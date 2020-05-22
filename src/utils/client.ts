import * as _ from 'lodash';
import React from 'react';
import Peer from 'peerjs';

import { getInstanceId, getIdentity } from './identity';

import {
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

export function useGameClient(gameId: string, hostId: string) {
  const [failedConnection, setFailedConnection] = React.useState(false);
  const [checkTimeout, setCheckTimeout] = React.useState(false);
  const [playerId, setPlayerId] = React.useState<string>('');
  const [percentLoaded, setPercentLoaded] = React.useState<number>(5);
  const [conn, setConn] = React.useState<ClientPeerDataConnection>();
  const [assets, setAssets] = React.useState<{ [key: string]: string }>({});
  const [pieces, setPieces] = React.useState<{ [key: string]: RenderPiece }>(
    {}
  );
  const [pendingAssets, setPendingAssets] = React.useState<string[]>([]);
  const [board, setBoard] = React.useState<string[]>([]);
  const [myHand, setMyHand] = React.useState<string[]>([]);
  const [handCounts, setHandCounts] = React.useState<{ [key: string]: number }>(
    {}
  );

  const requestAsset = React.useCallback(
    (asset: string) => {
      if (!conn) {
        throw new Error(
          'Time Paradox: requesting assets before connection established'
        );
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
        setBoard(b => [...b, ...pieces]);
        break;
      case 'hand_count':
        const { counts: c } = data as HandCountEvent;
        setHandCounts(counts => ({ ...counts, ...c }));
        break;
      case 'join':
        const { assets: a, hand, board: b, pieces: p } = data as JoinEvent;
        setPieces(p);
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
        setBoard(b => {
          const boardCopy = [...b];
          ids.forEach(id => {
            const index = boardCopy.findIndex(pieceId => pieceId === id);
            boardCopy.splice(index, 1, 'deleted');
          });
          return boardCopy;
        });
        break;
      case 'set_hand':
        const { hand: h } = data as SetHandEvent;
        setMyHand(h);
        break;
      case 'update_piece':
        const { pieces: updatedPieces } = data as UpdatePieceEvent;
        setPieces(p => {
          const u = { ...updatedPieces };
          for (let i in u) {
            if (p[i] && u[i].delta <= p[i].delta) {
              delete u[i];
            }
          }
          return {
            ...p,
            ...u,
          };
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
    const { instanceId, playerId, name } = getIdentity();
    const peer = createPeer(instanceId);

    peer.on('open', () => {
      const conn = peer.connect(getInstanceId(gameId, hostId), {
        metadata: {
          playerId,
          name,
        },
        reliable: true,
      });
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
  }, [gameId, hostId, processEvent]);

  React.useEffect(() => {
    if (checkTimeout && !board.length) {
      setFailedConnection(true);
    }
  }, [checkTimeout, board]);

  return {
    playerId,
    conn,
    board,
    pieces,
    setPieces,
    myHand,
    assets,
    percentLoaded,
    handCounts,
    failedConnection,
  };
}
