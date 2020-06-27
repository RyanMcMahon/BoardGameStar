import _ from 'lodash';
import React from 'react';

import { Viewport } from 'pixi-viewport';
// import Konva from 'konva';
// import { Stage, Layer } from 'react-konva';
import {
  utils,
  Graphics,
  Texture,
  Container,
  Text,
  Application,
  Sprite,
  Rectangle,
  ParticleContainer,
  DisplayObject,
} from 'pixi.js';

import { Stage } from '@inlet/react-pixi';
// import { useAppContext } from '../App/AppContext';
import {
  RenderPiece,
  Assets,
  BoardPiece,
  DeckPiece,
  CardPiece,
  ImageTokenOption,
  ImageTokenPiece,
  RectTokenPiece,
} from '../types';
import { RenderItem, RenderItemPiece } from './render-item';
import { primaryColor } from './style';

interface TableOptions {
  // isLoaded?: boolean;
  // selectedPieceIds?: Set<string>;
  // children: React.ReactNode;
  singleSelection?: boolean;
  handleUpdatePiece: (piece: RenderPiece, throttled: boolean) => void;
  onDblClickDeck?: (id: string) => void;
  onDblClickCard?: (id: string) => void;
  // handleSelectPiece: (id: string) => void;
  // pieces: RenderPiece[];
  assets: Assets;
  handCounts: { [key: string]: number };
  // onZoom: () => void;
  config: {
    [key: string]: {
      selectable?: boolean;
      draggable?: boolean;
      resizable?: boolean;
      rotatable?: boolean;
    };
  };
}

let app = new Application({
  antialias: true, // default: false
  transparent: true, // default: false
});

const ZOOM_RATE = 1.02;

const optionsByDie: {
  [key: number]: { y: number; fontSize: number };
} = {
  4: {
    fontSize: 32,
    y: 65,
  },
  6: {
    fontSize: 68,
    y: 35,
  },
  8: {
    fontSize: 32,
    y: 45,
  },
  10: {
    fontSize: 32,
    y: 60,
  },
  12: {
    fontSize: 32,
    y: 46,
  },
  20: {
    fontSize: 32,
    y: 43,
  },
};

// by default Konva prevent some events when node is dragging
// it improve the performance and work well for 95% of cases
// we need to enable all events on Konva, even when we are dragging a node
// so it triggers touchmove correctly
// (Konva as any).hitOnDragEnabled = true;

function getDistance(p1: Touch, p2: Touch) {
  return Math.sqrt(
    Math.pow(p2.clientX - p1.clientX, 2) + Math.pow(p2.clientY - p1.clientY, 2)
  );
}

let scaleDist = 0;

class ISprite extends Sprite {
  id?: string;
}

let instance = 1;
let activeId: string;

// export const Table = React.forwardRef((props: Props, ref: any) => {
export const useTable = (options: TableOptions) => {
  // const [scaleDist, setScaleDist] = React.useState<number>(0);
  // const {
  //   // selectedPieceIds,
  //   // pieces,
  //   // assets,
  //   // config,
  // } = props;
  const { config } = options;
  const [pieces, setPieces] = React.useState<RenderPiece[]>([]);
  // const [assets, setAssets] = React.useState<Assets>({});
  // const [config, setConfig] = React.useState<{
  //   [key: string]: {
  //     selectable?: boolean;
  //     draggable?: boolean;
  //     resizable?: boolean;
  //     rotatable?: boolean;
  //   };
  // }>({});
  const onUpdatePiece = options.handleUpdatePiece;

  const assets = options.assets;

  const [selectedPieceIds, setSelectedPieceIds] = React.useState<Set<string>>(
    new Set()
  );

  const onSelectPiece = React.useCallback(
    (id: string) =>
      setSelectedPieceIds(s => {
        if (options.singleSelection) {
          if (s.has(id)) {
            return new Set();
          } else {
            return new Set([id]);
          }
        }

        const ids = new Set(s);
        if (ids.has(id)) {
          ids.delete(id);
        } else {
          ids.add(id);
        }
        return ids;
      }),
    [setSelectedPieceIds, options.singleSelection]
  );
  // const { state, dispatch } = useAppContext();
  const dragLayerRef = React.createRef<any>();
  const stageRef = React.createRef<HTMLDivElement>();
  const [stageAttached, setStageAttached] = React.useState(false);
  const [container, setContainer] = React.useState<Container>();
  const [zoomInit, setZoomInit] = React.useState(false);
  // const [dimensions, setDimensions] = React.useState({
  //   width: 200,
  //   height: 200,
  // });

  const updateDimensions = React.useCallback(() => {
    // setDimensions({
    //   width: window.innerWidth,
    //   height: window.innerHeight,
    // });
    app.renderer.resize(window.innerWidth, window.innerHeight);
  }, []);

  React.useEffect(() => {
    if (!stageRef.current || stageAttached) {
      return;
    }

    const stage = app.stage as Container;
    stage.removeChildren(0);

    const container = new Viewport({
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      worldWidth: 5000,
      worldHeight: 5000,
      divWheel: stageRef.current,

      interaction: app.renderer.plugins.interaction, // the interaction module is important for wheel to work properly when renderer.view is placed or scaled
    });
    stage.addChild(container);

    container
      .drag()
      .pinch()
      .wheel()
      .decelerate();

    container.on('pinch-start', () =>
      container.children.forEach(child => (child.interactive = false))
    );
    container.on('pinch-end', () =>
      container.children.forEach(child => (child.interactive = true))
    );
    // container.on('pointercancel', () =>
    //   container.children.forEach(child => (child.interactive = true))
    // );
    stageRef.current.appendChild(app.view);
    setStageAttached(true);

    setContainer(container);
  }, [stageRef, stageAttached]);

  React.useEffect(() => {
    if (!container) {
      return;
    }

    // console.log(pieces.filter(x => x.type === 'die'));
    const piecesById = _.keyBy(pieces, 'id');
    const renderedPieces = new Set();

    container.children.forEach(child => {
      const piece = child as RenderItem;
      const curPiece = piecesById[piece.id];

      if (!curPiece || curPiece.type === 'deleted') {
        // console.log('removing', (child as RenderItem).id);
        container.removeChild(child);
        return;
      }

      renderedPieces.add(piece.id);
      piece.locked = curPiece.locked;

      if (!piece.transforming && !piece.dragging) {
        const renderItemPiece = curPiece;

        if (curPiece.type === 'circle') {
          renderItemPiece.width = curPiece.radius * 2;
          renderItemPiece.height = curPiece.radius * 2;
        } else if (curPiece.type === 'die') {
          renderItemPiece.width = 128;
          renderItemPiece.height = 128;
        } else if (curPiece.type === 'player') {
          const text = piece.getChildAt(piece.children.length - 1) as Text;
          renderItemPiece.width = text.width + 28;
          renderItemPiece.height = text.height + 14;
        }

        piece.setPiece(renderItemPiece as RenderItemPiece);

        if (selectedPieceIds?.has(piece.id)) {
          piece.select();
        } else {
          piece.deselect();
        }
      }

      piece.onUpdate = p => {
        activeId = piece.id;
        onUpdatePiece({ ...piecesById[piece.id], ...p }, true);
      };
    });

    pieces
      .filter(p => !renderedPieces.has(p.id))
      .forEach(piece => {
        let child: RenderItem;
        const image = assets[piece.image] || piece.image;
        const pieceConfig = config[piece.type];

        switch (piece.type) {
          case 'board': {
            child = new RenderItem({
              ...pieceConfig,
              piece,
              texture: Texture.from(image),
              onSync: (el, curPiece) => {
                el.setDimensions(curPiece as BoardPiece);
              },
            });
            child.interactive = false;
            break;
          }

          case 'deck': {
            const counts = new Container();
            child = new RenderItem({
              ...pieceConfig,
              piece,
              texture: Texture.from(image),
              onSync: (el, curPiece) => {
                el.setDimensions(curPiece as DeckPiece);
                counts.removeChildren(0);

                const countPosition = { x: curPiece.width / 2, y: 70 };
                const circle = new Graphics();
                circle.beginFill(0x000000);
                circle.lineStyle(0);
                circle.drawCircle(countPosition.x, countPosition.y, 60);
                circle.alpha = 0.5;
                circle.endFill();
                counts.addChild(circle);

                const divider = new Graphics();
                divider.beginFill(0xffffff);
                divider.drawRect(countPosition.x - 35, countPosition.y, 70, 4);
                divider.endFill();
                counts.addChild(divider);
                const cardCount = new Text(`${curPiece.count || 0}`, {
                  fontSize: '38px',
                  fill: 'white',
                  align: 'center',
                });
                cardCount.x = countPosition.x;
                cardCount.y = countPosition.y - 25;
                cardCount.anchor.set(0.5);
                counts.addChild(cardCount);

                const cardTotal = new Text(`${curPiece.total || 0}`, {
                  fontSize: '38px',
                  fill: 'white',
                  align: 'center',
                });
                cardTotal.x = countPosition.x;
                cardTotal.y = countPosition.y + 25;
                cardTotal.anchor.set(0.5);
                counts.addChild(cardTotal);
              },
            });
            child.addChild(counts);

            if (options.onDblClickDeck) {
              let doubleClick = false;
              const onDoubleClick = () => {
                if (doubleClick) {
                  options.onDblClickDeck!(piece.id);
                } else {
                  doubleClick = true;
                  setTimeout(() => (doubleClick = false), 600);
                }
              };

              child.on('click', onDoubleClick);
              child.on('tap', onDoubleClick);
            }
            break;
          }

          case 'card': {
            child = new RenderItem({
              ...pieceConfig,
              piece,
              texture: Texture.from(image),
              onSync: (el, curPiece) => {
                el.setDimensions(curPiece as CardPiece);
              },
            });

            if (options.onDblClickCard) {
              let doubleClick = false;
              const onDoubleClick = () => {
                if (doubleClick) {
                  options.onDblClickCard!(piece.id);
                } else {
                  doubleClick = true;
                  setTimeout(() => (doubleClick = false), 600);
                }
              };

              child.on('click', onDoubleClick);
              child.on('tap', onDoubleClick);
            }
            break;
          }

          case 'image': {
            child = new RenderItem({
              ...pieceConfig,
              piece,
              texture: Texture.from(image),
              onSync: (el, curPiece) => {
                el.setDimensions(curPiece as ImageTokenPiece);
              },
            });
            child.scale.copyFrom(container.scale);
            break;
          }

          case 'rect': {
            child = new RenderItem({
              ...pieceConfig,
              piece,
              texture: Texture.WHITE,
              onSync: (el, curPiece) => {
                el.setDimensions(curPiece as RectTokenPiece);
              },
            });

            child.sprite.tint = utils.string2hex(piece.color);
            break;
          }

          case 'circle': {
            const circle = new Graphics();
            child = new RenderItem({
              ...pieceConfig,
              piece: {
                ...piece,
                width: piece.radius * 2,
                height: piece.radius * 2,
              },
              uniformScaling: true,
              texture: Texture.EMPTY,
              onSync: (el, curPiece) => {
                circle.clear();
                circle.beginFill(utils.string2hex(curPiece.color));
                circle.lineStyle(0);
                circle.drawCircle(
                  curPiece.radius,
                  curPiece.radius,
                  curPiece.radius
                );
                circle.endFill();
                el.setDimensions({
                  ...curPiece,
                  height: curPiece.radius * 2,
                  width: curPiece.radius * 2,
                });
              },
            });
            child.addChild(circle);
            break;
          }

          case 'player': {
            const text = new Text(``, {
              fontFamily: 'Arial',
              fontSize: 28,
              fill: 0xffffff,
              align: 'center',
            });
            text.x = 14;
            text.y = 7;
            const rect = new Graphics();
            // rect.beginFill(utils.string2hex(piece.color));
            // rect.drawRoundedRect(-14, -7, text.width + 28, text.height + 14, 8);
            // rect.endFill();
            child = new RenderItem({
              ...pieceConfig,
              piece,
              texture: Texture.EMPTY,
              onSync: (el, curPiece) => {
                text.text = `${curPiece.name} (${options.handCounts[
                  curPiece.playerId || ''
                ] || 0} cards in hand)`;
                rect.clear();
                rect.beginFill(utils.string2hex(curPiece.color));
                rect.drawRoundedRect(
                  0,
                  0,
                  text.width + 28,
                  text.height + 14,
                  8
                );
                rect.endFill();
              },
            });
            child.addChild(rect);
            child.addChild(text);

            break;
          }

          case 'die': {
            const dieOptions = optionsByDie[piece.faces];
            child = new RenderItem({
              ...pieceConfig,
              piece: { ...piece, width: 128, height: 128 },
              texture: Texture.from(
                `d${piece.faces}${piece.hidden ? '_hidden' : ''}.png`
              ),
              onSync: (el, curPiece) => {
                // console.log('sync die', curPiece);
                // el.sprite.width = 128;
                // el.sprite.height = 128;
              },
            });

            if (piece.faces === 4) {
              const circle = new Graphics();

              circle.beginFill(utils.string2hex(primaryColor));
              circle.lineStyle(0);
              circle.drawCircle(64, 80, 30);
              circle.endFill();
              child.addChild(circle);
            }
            const text = new Text(`${piece.value}`, {
              fontFamily: 'Arial',
              fontSize: dieOptions.fontSize,
              fill: 0xffffff,
              align: 'center',
            });
            // text.pivot.set(0.5);
            text.x = 64 - text.width / 2;
            text.y = dieOptions.y;
            child.addChild(text);
            break;
          }

          default:
            return;
        }

        if (child) {
          // if (_.size(pieceConfig) === 0) {
          //   child.interactive = false;
          // }

          const selectPiece = () => {
            if (!child.nonSelectClick) {
              onSelectPiece(piece.id);
            }
          };

          // setInterval(() => {
          //   child.x += _.random(10, -10);
          //   child.y += _.random(10, -10);
          // }, 50);

          child.id = piece.id;
          child.interactive = true;

          if (config[piece.type].selectable) {
            child.on('tap', selectPiece);
            child.on('click', selectPiece);
          }

          child.onUpdate = p => {
            activeId = piece.id;
            onUpdatePiece({ ...piece, ...p }, true);
          };

          child.onTransformStart = () => {
            container.interactive = false;
          };
          child.onTransformEnd = () => {
            container.interactive = true;
          };
          container.addChild(child);
        }
      });
  }, [
    container,
    pieces,
    assets,
    config,
    onSelectPiece,
    selectedPieceIds,
    onUpdatePiece,
    options.handCounts,
    options.onDblClickCard,
    options.onDblClickDeck,
  ]);

  React.useEffect(() => {
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [updateDimensions]);

  React.useLayoutEffect(updateDimensions, []);

  return {
    instance,
    setPieces,
    // setConfig,
    // setAssets,
    container,
    stageRef,
    selectedPieceIds,
    setSelectedPieceIds,
  };
};
