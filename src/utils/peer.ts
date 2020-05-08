import Peer from 'peerjs';

const peerOptions = {
  host: 'bgspeer.azurewebsites.net',
  secure: true,
  path: 'myapp',
};

export function createPeer(id: string): Peer {
  return new Peer(id, peerOptions);
}
