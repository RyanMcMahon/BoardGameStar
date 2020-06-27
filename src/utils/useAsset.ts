import useImage from 'use-image';

import { Assets } from './game';
import { BoardPiece, DeckPiece, ImageTokenPiece, CardPiece } from '../types';
import { prependPrefix } from './assets';

export function useAsset(
  assets: Assets,
  piece: BoardPiece | CardPiece | DeckPiece | ImageTokenPiece
) {
  let [image] = useImage(prependPrefix(assets[piece.image || '']));
  return image;
}
