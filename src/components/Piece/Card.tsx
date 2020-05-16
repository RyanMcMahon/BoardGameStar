import React from 'react';
import { Text, Image, Label, Tag, Circle } from 'react-konva';

import { useAsset } from './utils';
import { RenderItem } from '../../types';
import { Assets } from '../../utils/game';

interface Props {
  assets: Assets;
  item: RenderItem;
}

export function Card(props: Props) {
  return 'DEPRECATED';
  // const { item } = props;
  // const image = useAsset(props.assets, item);

  // return (
  //   <Image
  //     id={item.id}
  //     image={image}
  //     x={item.x}
  //     y={item.y}
  //     width={item.width}
  //     height={item.height}
  //   />
  // );
}
