import { ClientEvent } from '../../types';

let onConnectionCb: (c: any) => any;
let onDataCb: (c: any) => any;

export const conn = {
  metadata: {
    playerId: 'a',
    name: 'a',
  },
  on: (method: string, cb: () => any) => {
    switch (method) {
      case 'open':
        cb();
        break;
      case 'data':
        onDataCb = cb;
        break;
    }
  },
  send: jest.fn(),
};

export const onConnection = () => onConnectionCb(conn);
export const onData = (data: ClientEvent) => onDataCb(data);

export function createPeer() {
  return {
    on: (method: string, cb: (c?: any) => any) => {
      switch (method) {
        case 'open':
          cb();
          break;

        case 'connection':
          onConnectionCb = cb;
          break;
      }
    },
  };
}
