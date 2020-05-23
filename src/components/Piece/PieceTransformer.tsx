import React from 'react';
import { Transformer } from 'react-konva';

interface Props {
  isSelected: boolean;
  rotateEnabled?: boolean;
  objectRef: React.MutableRefObject<any>;
}

interface ObjectUpdate {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export function useTransformer({
  objectRef,
  groupRef,
  fn,
}: {
  objectRef: React.MutableRefObject<any>;
  groupRef?: React.MutableRefObject<any>;
  fn: (o: ObjectUpdate) => void;
}) {
  return () => {
    const node = objectRef.current;
    const groupNode = groupRef && groupRef.current;
    const rotation = node.rotation();
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Reset Scale
    node.scaleX(1);
    node.scaleY(1);

    // Reset sub-node positions
    if (groupNode && (scaleX !== 1 || scaleY !== 1)) {
      // console.log(rotation, scaleX, scaleY);
      node.x(0);
      node.y(0);
    }

    fn({
      rotation,
      width: Math.max(5, node.width() * scaleX),
      height: Math.max(5, node.height() * scaleY),
      x: groupNode ? groupNode.x() : node.x(),
      y: groupNode ? groupNode.y() : node.y(),
    });
  };
}

export function PieceTransformer(props: Props) {
  const trRef = React.createRef<any>();
  const { isSelected, objectRef } = props;

  React.useEffect(() => {
    if (isSelected && trRef.current) {
      trRef.current.setNode(objectRef.current);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected, trRef, objectRef]);

  if (!isSelected) {
    return null;
  }

  return (
    <Transformer
      ref={trRef}
      borderStrokeWidth={2}
      rotateEnabled={props.rotateEnabled}
      boundBoxFunc={(oldBox: any, newBox: any) => {
        // limit resize
        if (newBox.width < 5 || newBox.height < 5) {
          return oldBox;
        }
        return newBox;
      }}
    />
  );
}
