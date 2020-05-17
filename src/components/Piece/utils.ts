import useImage from 'use-image';

import { Assets } from '../../utils/game';
import { BoardPiece, DeckPiece, ImageTokenPiece, CardPiece } from '../../types';
import { prependPrefix } from '../../utils/assets';

export function useAsset(
  assets: Assets,
  piece: BoardPiece | CardPiece | DeckPiece | ImageTokenPiece
) {
  let [image] = useImage(prependPrefix(assets[piece.image || '']));
  return image;
}
