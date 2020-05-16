import React from 'react';
import { Text, Image, Label, Tag, Circle, Transformer } from 'react-konva';

import { useAsset } from './utils';
import { Assets } from '../../utils/game';
import { PieceTransformer, useTransformer } from './PieceTransformer';
import { BoardItem, CardItem, ImageTokenItem } from '../../types';

interface Props {
  onSelect: () => void;
  onChange: (o: any) => void;
  isSelected: boolean;
  assets: Assets;
  item: BoardItem | CardItem | ImageTokenItem;
}

export function ImagePiece(props: Props) {
  const { isSelected, assets, item, onSelect, onChange } = props;
  const image = useAsset(assets, item);
  const objectRef = React.useRef<any>();
  const handleTransform = useTransformer(objectRef, onChange);

  return (
    <>
      <Image
        id={item.id}
        image={image}
        x={item.x}
        y={item.y}
        width={item.width}
        height={item.height}
        rotation={item.rotation}
        onClick={onSelect}
        onTap={onSelect}
        ref={objectRef}
        draggable
        onDragEnd={handleTransform}
        onTransformEnd={handleTransform}
      />
      <PieceTransformer isSelected={isSelected} objectRef={objectRef} />
    </>
  );
}
