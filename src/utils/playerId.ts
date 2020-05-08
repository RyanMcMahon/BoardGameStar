import slug from 'slugid';

export function getId(key: string) {
  return slug.nice();

  // let id = localStorage.getItem(key);

  // if (!id) {
  //   id = slug.nice() as string;
  //   localStorage.setItem(key, id);
  // }

  // return id;
}

export const getHostId = () => getId('hostId');
export const getPlayerId = () => getId('playerId');
