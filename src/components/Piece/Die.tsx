import React from 'react';
import { Image, Text, Group, Circle, Transformer } from 'react-konva';
import useImage from 'use-image';

import { useTransformer } from './PieceTransformer';
import { DicePiece } from '../../types';
import { prependPrefix } from '../../utils/assets';
import { primaryColor } from '../../utils/style';

interface Props {
  isSelected: boolean;
  onSelect?: () => void;
  onChange: (o: any) => void;
  draggable?: boolean;
  piece: DicePiece;
}

const optionsByDie: {
  [key: number]: { x: number; y: number; fontSize: number };
} = {
  4: {
    fontSize: 32,
    x: 55,
    y: 65,
  },
  6: {
    fontSize: 68,
    x: 45,
    y: 40,
  },
  8: {
    fontSize: 32,
    x: 55,
    y: 50,
  },
  10: {
    fontSize: 32,
    x: 47,
    y: 60,
  },
  12: {
    fontSize: 32,
    x: 47,
    y: 50,
  },
  20: {
    fontSize: 32,
    x: 45,
    y: 47,
  },
};

export const Die = React.memo((props: Props) => {
  const { draggable, piece, onSelect, isSelected, onChange } = props;
  const { fontSize, x, y } = optionsByDie[piece.faces];
  const [image] = useImage(
    prependPrefix(`d${piece.faces}${piece.hidden ? '_hidden' : ''}.png`)
  );
  const objectRef = React.useRef<any>();
  const groupRef = React.useRef<any>();
  const handleTransform = useTransformer({
    groupRef,
    objectRef,
    fn: onChange,
  });
  const trRef = React.createRef<any>();

  React.useEffect(() => {
    if (isSelected && trRef.current) {
      trRef.current.setNode(objectRef.current);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected, trRef]);

  return (
    <>
      <Group
        draggable={draggable}
        onDragMove={handleTransform}
        x={piece.x}
        y={piece.y}
        zIndex={piece.layer}
        ref={groupRef}
        onClick={onSelect}
        onTap={onSelect}
      >
        <Image
          id={'e'}
          ref={objectRef}
          image={image}
          width={128}
          height={128}
        />
        {piece.faces === 4 && (
          <Circle
            x={x + 10}
            y={y + 15}
            radius={20}
            fill={piece.hidden ? '#000' : primaryColor}
          />
        )}
        <Text
          x={x}
          y={y}
          fill={'#fff'}
          fontSize={fontSize}
          text={
            piece.value < 10 && piece.faces > 9
              ? ` ${piece.value}`
              : `${piece.value}`
          }
        />
        {isSelected && (
          <Transformer
            ref={trRef}
            rotateEnabled={false}
            resizeEnabled={false}
            borderStrokeWidth={2}
          />
        )}
      </Group>
    </>
  );
});
