import React from 'react';
import { Text, Image, Label, Tag, Circle } from 'react-konva';
import useImage from 'use-image';
import { RenderItem, ContextMenuItem } from '../../types';
import * as _ from 'lodash';
import { imagePrefix } from '../../utils/meta';

interface Props {
  assets: { [key: string]: string };
  item: RenderItem;
  handCounts: { [key: string]: number };
  onMove: (id: string, x: number, y: number) => void;
  onDeckPrompt?: (id: string) => void;
  onRename?: (name: string) => void;
  onPickUpCard?: (id: string) => void;
  onShuffleDiscarded?: (id: string) => void;
  onDiscardPlayed?: (id: string) => void;
  onContextMenu?: (
    x: number,
    y: number,
    contextMenuItems: ContextMenuItem[]
  ) => void;
}

export function BoardItem(props: Props) {
  return 'DEPRECATED';
  // const { assets, item } = props;
  // let [image] = useImage(imagePrefix + assets[item.image || ''] || '');

  // const handleDragMove = _.throttle((e: any) => {
  //   props.onMove(item.id, e.target.attrs.x, e.target.attrs.y);
  // }, 80);

  // const handleDrawCards = () => {
  //   if (item.type !== 'deck' || !props.onDeckPrompt) {
  //     return;
  //   }
  //   props.onDeckPrompt(item.id);
  // };

  // const handlePickUpCard = () => {
  //   if (!props.onPickUpCard) {
  //     return;
  //   }
  //   props.onPickUpCard(item.id);
  // };

  // switch (item.type) {
  //   case 'board':
  //     return (
  //       <Image
  //         id={item.id}
  //         image={image}
  //         x={item.x}
  //         y={item.y}
  //         width={item.width}
  //         height={item.height}
  //       />
  //     );
  //   case 'card':
  //     return (
  //       <Image
  //         id={item.id}
  //         image={image}
  //         x={item.x}
  //         y={item.y}
  //         width={item.width}
  //         height={item.height}
  //         onDragMove={handleDragMove}
  //         onDblClick={handlePickUpCard}
  //         draggable
  //       />
  //     );
  //   case 'deck':
  //     return (
  //       <>
  //         <Label x={item.x} y={item.y}>
  //           <Tag fill="#111" lineJoin="round" />
  //           <Text
  //             text={`${item.count} of ${item.total} cards remaining`}
  //             fontSize={22}
  //             padding={5}
  //             fill="white"
  //           />
  //         </Label>

  //         <Image
  //           id={item.id}
  //           image={image}
  //           x={item.x}
  //           y={item.y + 40}
  //           width={item.width}
  //           height={item.height}
  //           onDblClick={handleDrawCards}
  //           onContextMenu={e => {
  //             // do not show native context
  //             e.evt.preventDefault();
  //             if (props.onContextMenu) {
  //               props.onContextMenu(e.evt.clientX, e.evt.clientY, [
  //                 {
  //                   label: 'Draw Cards',
  //                   fn: handleDrawCards,
  //                 },
  //                 // {
  //                 //   label: "Play Face Up",
  //                 //   fn: () => {
  //                 //     console.log("face down");
  //                 //   }
  //                 // },
  //                 // {
  //                 //   label: "Play Face Down",
  //                 //   fn: () => {
  //                 //     console.log("face up");
  //                 //   }
  //                 // },
  //                 {
  //                   label: 'Shuffle Discarded',
  //                   fn: () => {
  //                     console.log('context shuffle');
  //                     if (props.onShuffleDiscarded) {
  //                       props.onShuffleDiscarded(item.id);
  //                     }
  //                   },
  //                 },
  //                 {
  //                   label: 'Discard Played Cards',
  //                   fn: () => {
  //                     console.log('discard played');
  //                     if (props.onDiscardPlayed) {
  //                       props.onDiscardPlayed(item.id);
  //                     }
  //                   },
  //                 },
  //               ]);
  //             }
  //           }}
  //         />
  //       </>
  //     );
  //   case 'piece':
  //     return (
  //       <Circle
  //         id={item.id}
  //         x={item.x}
  //         y={item.y}
  //         radius={item.width / 2}
  //         fill={item.fill}
  //         onDragMove={handleDragMove}
  //         draggable
  //       />
  //     );
  //   case 'player':
  //     return (
  //       <Label x={item.x} y={item.y} draggable onDragMove={handleDragMove}>
  //         <Tag fill={item.fill} lineJoin="round" />
  //         <Text
  //           text={`${item.name} (${props.handCounts[item.id] ||
  //             0} cards in hand)`}
  //           fontSize={22}
  //           padding={5}
  //           fill="white"
  //         />
  //       </Label>
  //     );
  //   default:
  //     return null;
  // }
}
