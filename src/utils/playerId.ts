import slug from 'slugid';

export function getId(key: string) {
  return slug.nice();

  // let id = localStorage.getPiece(key);

  // if (!id) {
  //   id = slug.nice() as string;
  //   localStorage.setPiece(key, id);
  // }

  // return id;
}

export const getHostId = () => getId('hostId');
export const getPlayerId = () => getId('playerId');
