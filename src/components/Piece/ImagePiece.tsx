import React from 'react';
import { Image } from 'react-konva';

import { useAsset } from './utils';
import { Assets } from '../../utils/game';
import { PieceTransformer, useTransformer } from './PieceTransformer';
import { BoardPiece, CardPiece, ImageTokenPiece } from '../../types';

interface Props {
  onSelect?: () => void;
  onChange?: (o: any) => void;
  onDblClick?: () => void;
  draggable?: boolean;
  isSelected?: boolean;
  assets: Assets;
  piece: BoardPiece | CardPiece | ImageTokenPiece;
}

export const ImagePiece = React.memo((props: Props) => {
  const {
    draggable,
    isSelected,
    assets,
    piece,
    onSelect,
    onDblClick,
    onChange,
  } = props;
  const image = useAsset(assets, piece);
  const objectRef = React.useRef<any>();
  const handleTransform = useTransformer(objectRef, onChange || (() => {}));

  return (
    <>
      <Image
        id={piece.id}
        image={image}
        x={piece.x}
        y={piece.y}
        width={piece.width}
        height={piece.height}
        rotation={piece.rotation}
        onClick={onSelect}
        onTap={onSelect}
        onDblClick={onDblClick}
        onDblTap={onDblClick}
        ref={objectRef}
        draggable={draggable}
        onDragMove={handleTransform}
        onTransform={handleTransform}
      />
      <PieceTransformer
        isSelected={isSelected || false}
        objectRef={objectRef}
      />
    </>
  );
});
