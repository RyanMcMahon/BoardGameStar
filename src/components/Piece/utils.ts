import useImage from 'use-image';

import { Assets } from '../../utils/game';
import { BoardItem, DeckItem, ImageTokenItem, CardItem } from '../../types';
import { prependPrefix } from '../../utils/assets';

export function useAsset(
  assets: Assets,
  item: BoardItem | CardItem | DeckItem | ImageTokenItem
) {
  let [image] = useImage(prependPrefix(assets[item.image || '']));
  return image;
}
