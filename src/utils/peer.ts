import Peer from 'peerjs';
import { getIceServers } from './api';

export async function createPeer(id: string): Promise<Peer> {
  const iceServers = await getIceServers();
  const peerOptions: Peer.PeerJSOption = {
    host: 'bgspeer.azurewebsites.net',
    secure: true,
    path: 'myapp',
    config: {
      iceServers,
    },
  };

  return new Peer(id, peerOptions);
}
