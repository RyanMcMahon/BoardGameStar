import useImage from 'use-image';

import { imagePrefix } from '../../utils/meta';
import { Assets } from '../../utils/game';
import {
  RenderItem,
  BoardItem,
  DeckItem,
  ImageTokenItem,
  CardItem,
} from '../../types';

export function useAsset(
  assets: Assets,
  item: BoardItem | CardItem | DeckItem | ImageTokenItem
) {
  let [image] = useImage(assets[item.image || ''] || '');
  return image;
}
