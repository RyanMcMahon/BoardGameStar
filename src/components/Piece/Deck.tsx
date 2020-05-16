import React from 'react';
import { Text, Image, Label, Tag, Circle } from 'react-konva';

import { useAsset } from './utils';
import { RenderItem, DeckItem } from '../../types';
import { Assets } from '../../utils/game';
import { PieceTransformer, useTransformer } from './PieceTransformer';

interface Props {
  assets: Assets;
  item: DeckItem;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (o: any) => void;
  onDblClick: () => void;
}

export function Deck(props: Props) {
  const { item, onSelect, assets, isSelected, onChange, onDblClick } = props;
  // const [
  const image = useAsset(props.assets, item);
  const objectRef = React.useRef<any>();
  const handleTransform = useTransformer(objectRef, onChange);

  return (
    <>
      <Label x={item.x} y={item.y - 40}>
        <Tag fill="#111" lineJoin="round" />
        <Text
          text={`${item.count} of ${item.total} cards remaining`}
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
        onDragEnd={handleTransform}
        onDblClick={onDblClick}
        onDblTap={onDblClick}
        onContextMenu={e => {
          // do not show native context
          e.evt.preventDefault();
          // if (props.onContextMenu) {
          //   props.onContextMenu(e.evt.clientX, e.evt.clientY, [
          //     {
          //       label: 'Draw Cards',
          //       fn: handleDrawCards,
          //     },
          //     // {
          //     //   label: "Play Face Up",
          //     //   fn: () => {
          //     //     console.log("face down");
          //     //   }
          //     // },
          //     // {
          //     //   label: "Play Face Down",
          //     //   fn: () => {
          //     //     console.log("face up");
          //     //   }
          //     // },
          //     // {
          //     //   label: 'Shuffle Discarded',
          //     //   fn: () => {
          //     //     console.log('context shuffle');
          //     //     if (props.onShuffleDiscarded) {
          //     //       props.onShuffleDiscarded(item.id);
          //     //     }
          //     //   },
          //     // },
          //     // {
          //     //   label: 'Discard Played Cards',
          //     //   fn: () => {
          //     //     console.log('discard played');
          //     //     if (props.onDiscardPlayed) {
          //     //       props.onDiscardPlayed(item.id);
          //     //     }
          //     //   },
          //     // },
          //   ]);
          // }
        }}
      />
      <PieceTransformer isSelected={isSelected} objectRef={objectRef} />
    </>
  );
}
