import React from 'react';
import { Rect } from 'react-konva';

import { PieceTransformer, useTransformer } from './PieceTransformer';
import { RectTokenPiece } from '../../types';

interface Props {
  onSelect?: () => void;
  onChange: (o: any) => void;
  isSelected?: boolean;
  piece: RectTokenPiece;
}

export function RectPiece(props: Props) {
  const { isSelected, piece, onSelect, onChange } = props;
  const objectRef = React.useRef<any>();
  const handleTransform = useTransformer({
    objectRef,
    fn: onChange || (() => {}),
  });

  return (
    <>
      <Rect
        id={piece.id}
        x={piece.x}
        y={piece.y}
        width={piece.width}
        height={piece.height}
        rotation={piece.rotation}
        fill={piece.color}
        onClick={onSelect}
        onTap={onSelect}
        ref={objectRef}
        draggable
        onDragMove={handleTransform}
        onTransform={handleTransform}
      />
      <PieceTransformer
        isSelected={isSelected || false}
        rotateEnabled={true}
        objectRef={objectRef}
      />
    </>
  );
}
