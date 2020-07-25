import _ from 'lodash';
import React from 'react';
import styled from 'styled-components';

import { Viewport } from 'pixi-viewport';
import {
  utils,
  Graphics,
  Texture,
  Container,
  Text,
  Application,
} from 'pixi.js';

import {
  RenderPiece,
  Assets,
  BoardPiece,
  DeckPiece,
  CardPiece,
  ImageTokenPiece,
  RectTokenPiece,
} from '../types';
import { RenderItem, RenderItemPiece } from './render-item';
import { primaryColor } from './style';

interface TableOptions {
  singleSelection?: boolean;
  handleUpdatePiece: (
    piece: Partial<RenderPiece> & { id: string },
    throttled: boolean
  ) => void;
  onDblClickDeck?: (id: string) => void;
  onDblClickCard?: (id: string) => void;
  assets: Assets;
  config: {
    [key: string]: {
      selectable?: boolean;
      draggable?: boolean;
      resizable?: boolean;
      rotatable?: boolean;
    };
  };
}

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

let instance = 1;

export const Table = styled.div({
  overflow: 'hidden',
});

export const useTable = (options: TableOptions) => {
  const { config } = options;
  const [app, setApp] = React.useState<Application>();

  React.useEffect(() => {
    setApp(
      new Application({
        antialias: true, // default: false
        transparent: true, // default: false
      })
    );
  }, []);

  const piecesRef = React.useRef<RenderPiece[]>([]);
  const pieces = piecesRef.current;
  const setPieces = (p: RenderPiece[]) => (piecesRef.current = p);
  // const [pieces, setPieces] = React.useState<RenderPiece[]>([]);
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

  const stageRef = React.createRef<HTMLDivElement>();
  const [stageAttached, setStageAttached] = React.useState(false);
  const [container, setContainer] = React.useState<Container>();

  const updateDimensions = React.useCallback(() => {
    if (!app) {
      return;
    }

    if (container) {
      (container as Viewport).screenWidth =
        document.documentElement.clientWidth;
      (container as Viewport).screenHeight =
        document.documentElement.clientHeight;
    }
    app.renderer.resize(
      document.documentElement.clientWidth,
      document.documentElement.clientHeight
    );
  }, [container, app]);

  React.useEffect(() => {
    if (!stageRef.current || stageAttached || !app) {
      return;
    }

    const stage = app.stage as Container;
    stage.removeChildren(0);

    const container = new Viewport({
      screenWidth: document.documentElement.clientWidth,
      screenHeight: document.documentElement.clientHeight,
      worldWidth: 5000,
      worldHeight: 5000,
      divWheel: stageRef.current,

      interaction: app.renderer.plugins.interaction, // the interaction module is important for wheel to work properly when renderer.view is placed or scaled
    });
    container.sortableChildren = true;
    stage.addChild(container);

    container
      .drag()
      .pinch()
      .wheel()
      .decelerate();

    stageRef.current.appendChild(app.view);
    setStageAttached(true);

    setContainer(container);
  }, [app, stageRef, stageAttached]);

  React.useEffect(() => {
    if (!container) {
      return;
    }

    const piecesById = _.keyBy(piecesRef.current, 'id');
    const renderedPieces = new Set();

    container.children.forEach(child => {
      const piece = child as RenderItem;
      const curPiece = piecesById[piece.id];

      if (!curPiece || curPiece.type === 'deleted') {
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
        onUpdatePiece({ ...p, id: piece.id }, true);
      };
    });

    piecesRef.current
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
              child.on('dblclick', () => options.onDblClickDeck!(piece.id));
            }
            break;
          }

          case 'card': {
            const faceUpTexture = Texture.from(image);
            const deck = piecesById[piece.deckId];
            const faceDownTexture = Texture.from(
              assets[deck.image] || deck.image
            );
            child = new RenderItem({
              ...pieceConfig,
              piece,
              texture: faceUpTexture,
              onSync: (el, curPiece) => {
                el.setDimensions(curPiece as CardPiece);
                if ((curPiece as CardPiece).faceDown) {
                  el.sprite.texture = faceDownTexture;
                } else {
                  el.sprite.texture = faceUpTexture;
                }
              },
            });

            if (options.onDblClickCard) {
              child.on('dblclick', () => options.onDblClickCard!(piece.id));
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

                if (curPiece.stack && el.dragging) {
                  const stackPieces = piecesRef.current.filter(
                    p => p.stack === curPiece.stack && p.id !== curPiece.id
                  ); // TODO use deterministic sort
                  const stackIds = stackPieces.map(p => p.id);
                  const stackRenderItems = (container.children as RenderItem[]).filter(
                    x => stackIds.includes(x.id)
                  );
                  const stack = stackPieces.find(
                    p => Math.hypot(p.x - curPiece.x, p.y - curPiece.y) < 20
                  ) || { id: '' };
                  const nonStackables = stackRenderItems.filter(
                    x => x.id !== stack.id
                  );
                  nonStackables.forEach(x => (x.alpha = 1));

                  if (stack.id) {
                    const stackRender = container.children.find(
                      x => (x as RenderItem).id === stack.id
                    );

                    if (!stackRender) {
                      // TODO
                      return;
                    }

                    console.log('--- stack ----');
                    console.log('add', curPiece.id, 'to', stack.id);
                    console.log(stackRender);
                    stackRender.alpha = 0.5;
                    console.log(
                      stack,
                      Math.hypot(stack.x - curPiece.x, stack.y - curPiece.y)
                    );
                  }
                }
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
            child = new RenderItem({
              ...pieceConfig,
              piece,
              texture: Texture.EMPTY,
              onSync: (el, curPiece) => {
                text.text = curPiece.name;
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
              onSync: () => {},
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
            text.x = 64 - text.width / 2;
            text.y = dieOptions.y;
            child.addChild(text);
            break;
          }

          default:
            return;
        }

        if (child) {
          const selectPiece = () => {
            if (!child.nonSelectClick) {
              onSelectPiece(piece.id);
            }
          };

          child.id = piece.id;
          child.interactive = true;

          if (config[piece.type].selectable) {
            child.on('tap', selectPiece);
            child.on('click', selectPiece);
          }

          child.onUpdate = p => {
            onUpdatePiece({ ...p, id: piece.id }, true);
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
    piecesRef,
    assets,
    config,
    onSelectPiece,
    selectedPieceIds,
    onUpdatePiece,
    options.onDblClickCard,
    options.onDblClickDeck,
  ]);

  React.useEffect(() => {
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [updateDimensions]);

  React.useLayoutEffect(updateDimensions, [app]);

  return {
    instance,
    setPieces,
    container,
    stageRef,
    selectedPieceIds,
    setSelectedPieceIds,
  };
};
