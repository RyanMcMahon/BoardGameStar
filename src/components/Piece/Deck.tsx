import React from 'react';
import { Text, Image, Label, Tag } from 'react-konva';

import { useAsset } from './utils';
import { Assets } from '../../utils/game';
import { PieceTransformer, useTransformer } from './PieceTransformer';
import { DeckItem } from '../../types';

interface Props {
  assets: Assets;
  item: DeckItem;
  isSelected?: boolean;
  onSelect?: () => void;
  onChange: (o: any) => void;
  onDblClick: () => void;
  onContextMenu?: (e: any) => void;
}

export function Deck(props: Props) {
  const {
    item,
    onSelect,
    assets,
    isSelected,
    onChange,
    onDblClick,
    onContextMenu,
  } = props;
  // const [
  const image = useAsset(assets, item);
  const objectRef = React.useRef<any>();
  const handleTransform = useTransformer(objectRef, onChange);

  return (
    <>
      <Label x={item.x} y={item.y - 40}>
        <Tag fill="#111" lineJoin="round" />
        <Text
          text={`${item.count || 0} of ${item.total || 0} cards remaining`}
          fontSize={22}
          padding={5}
          fill="white"
        />
      </Label>

      <Image
        id={item.id}
        ref={objectRef}
        image={image}
        x={item.x}
        y={item.y}
        width={item.width}
        height={item.height}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragMove={handleTransform}
        onDblClick={onDblClick}
        onDblTap={onDblClick}
        onContextMenu={e => {
          e.evt.preventDefault();

          if (onContextMenu) {
            onContextMenu(e);
          }
        }}
      />
      <PieceTransformer
        isSelected={isSelected || false}
        objectRef={objectRef}
      />
    </>
  );
}
