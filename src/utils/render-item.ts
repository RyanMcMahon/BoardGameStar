import _ from 'lodash';
import {
  Container,
  Sprite,
  Texture,
  Graphics,
  utils,
  Point,
  Text,
} from 'pixi.js';

import { RenderPiece } from '../types';
import { primaryColor } from './style';
import { Transformer } from './Transformer';

export type RenderItemPiece = RenderPiece & { height: number; width: number };

interface RenderItemOptions {
  piece: RenderItemPiece;
  texture: Texture;
  uniformScaling?: boolean;
  draggable?: boolean;
  rotatable?: boolean;
  resizable?: boolean;
  onSync: (el: RenderItem, curPiece: RenderPiece) => void;
  onDragEnd?: () => void;
  onSplitStack?: (count: number) => void;
  // restrictTransform?: (dimensions: {
  //   curPiece: RenderPiece;
  //   width: number;
  //   height: number;
  // }) => { width: number; height: number };
}

export class RenderItem extends Container {
  id: string;
  piece!: RenderItemPiece;
  data: any;
  resizeData: any;
  nonSelectClick: boolean;
  clickInPlace: boolean;
  dblClicking: boolean;
  dragging: boolean;
  dragEnabled: boolean;
  onTransformStart?: () => void;
  onTransformEnd?: () => void;
  onUpdate?: (
    props:
      | {
          x: number;
          y: number;
          width: number;
          height: number;
          rotation: number;
        }
      | {
          x: number;
          y: number;
          radius: number;
          rotation: number;
        }
  ) => void;
  transforming: boolean;
  sprite: Sprite;
  transformer: Transformer;
  arrow: Graphics;
  outline: Graphics;
  stackMenu?: Container;
  stackContainer?: Container;
  peekContainer?: Container;
  locked?: boolean;
  isSelected?: boolean;
  hasFocus?: boolean;
  tempDragDisabled?: boolean;
  sendUpdateThrottled: () => void;
  onSync: (curPiece: RenderPiece) => void;
  onDragEnd?: () => void;
  onSplitStack?: (count: number) => void;

  constructor({
    piece,
    texture,
    uniformScaling,
    draggable,
    rotatable,
    resizable,
    onSync,
    onDragEnd,
    onSplitStack,
  }: RenderItemOptions) {
    super();
    this.id = piece.id;
    this.cursor = 'grab';
    this.nonSelectClick = false;
    this.clickInPlace = false;
    this.dblClicking = false;
    this.dragging = false;
    this.interactive = true;
    this.dragEnabled = true;
    this.tempDragDisabled = false;
    this.transforming = false;
    this.outline = new Graphics();
    this.onSync = (curPiece: RenderPiece) => onSync(this, curPiece);
    this.onDragEnd = onDragEnd;
    this.onSplitStack = onSplitStack;
    this.sendUpdateThrottled = _.throttle(this.sendUpdate, 50, {
      leading: false,
      trailing: true,
    });

    const sprite = new Sprite(texture);
    sprite.x = 0;
    sprite.y = 0;
    sprite.height = piece.height;
    sprite.width = piece.width;
    sprite.scale.set(1);
    this.sprite = sprite;
    this.addChild(sprite);

    const arrow = new Graphics();
    arrow.beginFill(utils.string2hex(primaryColor));
    arrow.drawPolygon([
      new Point(-40, -80),
      new Point(0, 0),
      new Point(40, -80),
      new Point(0, -40),
    ]);
    arrow.y = -10;
    this.arrow = arrow;

    const transformer = new Transformer({
      uniformScaling,
      rotatable,
      resizable,
      dimensions: piece,

      onRotate: (angle: number) => {
        this.updatePiece({ ...this.piece, rotation: angle });
      },

      onTransform: dimensions => {
        this.updateOutline();
        this.updatePiece({ ...this.piece, ...dimensions });
      },

      onTransformStart: () => {
        this.nonSelectClick = true;
        this.transforming = true;
        if (this.onTransformStart) {
          this.onTransformStart();
        }
      },

      onTransformEnd: () => {
        this.transforming = false;
        transformer.setDimensions(this.sprite);
        if (this.onTransformEnd) {
          this.onTransformEnd();
        }
      },
    });

    this.transformer = transformer;
    this.setPiece(piece);

    if (draggable) {
      this
        // events for drag start
        .on('mousedown', this.handleMouseDown)
        .on('touchstart', this.handleMouseDown)
        // events for drag end
        .on('mouseup', this.handleMouseUp)
        .on('mouseupoutside', this.handleMouseUp)
        .on('touchend', this.handleMouseUp)
        .on('touchendoutside', this.handleMouseUp)
        // events for drag move
        .on('mousemove', this.handleMouseMove)
        .on('touchmove', this.handleMouseMove);
    }
  }

  updateOutline() {
    const transformerColor = utils.string2hex(primaryColor);
    const outline = this.outline;
    outline.clear();
    outline.beginFill(transformerColor);
    outline.drawRect(0, -2, this.piece.width, 2);
    outline.drawRect(0, this.piece.height, this.piece.width, 2);
    outline.drawRect(this.piece.width, 0, 2, this.piece.height);
    outline.drawRect(-2, 0, 2, this.piece.height);
    this.outline = outline;
  }

  handleMouseDown(event: any) {
    const pointer = event.data.getLocalPosition(this.parent);
    const pointerOffset = {
      x: pointer.x + this.piece.width / 2 - this.x,
      y: pointer.y + this.piece.height / 2 - this.y,
    };
    this.data = {
      ...event.data,
      pointer,
      pointerOffset,
    };

    this.nonSelectClick = false;
    this.clickInPlace = true;

    if (!this.dragEnabled || this.transforming || this.locked) {
      return;
    }

    this.dragging = true;
    this.cursor = 'grabbing';
    this.zIndex = 9999;

    // if (event.data?.originalEvent?.touches?.length) {
    // this.arrow.x = this.piece.width / 2;
    // this.addChild(this.arrow);
    // }

    if (this.onTransformStart) {
      this.onTransformStart();
    }
  }

  handleMouseUp() {
    if (this.dragging && this.onDragEnd) {
      this.onDragEnd();
    }

    this.dragging = false;
    this.data = null;
    this.cursor = 'grab';
    this.zIndex = this.piece.layer;
    // this.removeChild(this.arrow);

    if (this.clickInPlace) {
      this.checkDblClick();
    }

    if (this.onTransformEnd) {
      this.onTransformEnd();
    }
  }

  handleMouseMove(event: any) {
    const { touches = [] } = event.data?.originalEvent || {};
    const pointer = event.data.getLocalPosition(this.parent);

    if (
      !this.data ||
      pointer.x !== this.data.pointer.x ||
      pointer.y !== this.data.pointer.y
    ) {
      this.nonSelectClick = true;
    } else {
      this.clickInPlace = false;
    }

    if (touches.length > 1) {
      this.dragging = false;
    }

    if (!this.dragging || (this.parent as any).isPinching) {
      return;
    }

    const newPos = {
      x: pointer.x - this.data.pointerOffset.x,
      y: pointer.y - this.data.pointerOffset.y,
    };

    this.updatePiece({ ...this.piece, ...newPos });
  }

  checkDblClick() {
    if (this.dblClicking) {
      this.nonSelectClick = true;
      this.emit('dblclick');
    } else {
      this.dblClicking = true;
      setTimeout(() => (this.dblClicking = false), 500);
    }
  }

  checkForStackMenu() {
    if (
      !this.onSplitStack ||
      !this.piece.pieces ||
      (this.piece.pieces.length || 0) < 2
    ) {
      return;
    }

    if (this.hasFocus || this.isSelected) {
      if (this.stackMenu) {
        this.stackMenu.destroy();
      }

      const stackCount = this.piece.pieces.length;
      const menu = new Container();
      for (let i = 0; i < stackCount; i++) {
        const stackItem = new Graphics();
        stackItem.beginFill(0x000000);
        stackItem.drawRoundedRect(
          (this.piece.width || this.piece.radius * 2) + 10,
          i * 20,
          30,
          18,
          4
        );
        stackItem.alpha = 0.4;
        stackItem.endFill();
        stackItem.interactive = true;

        if (i !== stackCount - 1) {
          stackItem.on('mouseover', () => {
            menu.children.forEach((child, index) => {
              if (index <= i) {
                child.alpha = 0.8;
              }
            });
          });
          stackItem.on('mouseout', () => {
            menu.children.forEach((child, index) => {
              if (index <= i) {
                child.alpha = 0.4;
              }
            });
          });
          stackItem.on('touchend', () => {
            this.nonSelectClick = true;
            this.onSplitStack!(stackCount - i);
          });
          stackItem.on('mouseup', () => {
            this.nonSelectClick = true;
            this.onSplitStack!(stackCount - i);
          });
        }
        menu.addChild(stackItem);
      }

      this.addChild(menu);
      this.stackMenu = menu;
    } else if (this.stackMenu) {
      this.stackMenu.destroy();
    }
  }

  select() {
    this.isSelected = true;
    this.addChild(this.transformer);
    this.addChild(this.outline);
    this.updateOutline();
    this.checkForStackMenu();
  }

  deselect() {
    this.isSelected = false;
    this.removeChild(this.transformer);
    this.removeChild(this.outline);
    this.checkForStackMenu();
  }

  setStack(count?: number) {
    this.clearStack();
    count = count || this.piece.pieces?.length;

    if (count) {
      const stackContainer = new Container();
      const circle = new Graphics();
      circle.beginFill(utils.string2hex('#000'));
      circle.lineStyle(0);
      circle.drawCircle(-6, -6, 16);
      circle.endFill();
      const stackCount = new Text(`${count}`, {
        fontSize: '18px',
        fill: 'white',
        align: 'center',
      });
      stackCount.x = -6;
      stackCount.y = -6;
      stackCount.anchor.set(0.5);

      stackContainer.addChild(circle);
      stackContainer.addChild(stackCount);
      this.stackContainer = stackContainer;
      this.addChild(this.stackContainer);
    }
  }

  clearStack() {
    if (this.stackContainer) {
      this.removeChild(this.stackContainer);
      delete this.stackContainer;
    }
  }

  setPeeking(names: string[]) {
    console.log('set peeking', names);
    if (!names.length) {
      if (this.peekContainer) {
        this.removeChild(this.peekContainer);
      }
      return;
    }

    if (!this.peekContainer) {
      this.peekContainer = new Container();
      this.addChild(this.peekContainer);
    }

    this.peekContainer.removeChildren();
    names.forEach((name, index) => {
      const text = new Text(`👁 ${name}`, {
        fontFamily: 'Arial',
        fontSize: 20,
        fill: 0xffffff,
        lineJoin: 'bevel',
        miterLimit: 0,
        strokeThickness: 4,
      });
      text.x = 10;
      text.y = this.piece.height - 30 * (index + 1);
      this.peekContainer!.addChild(text);
    });
  }

  setPosition(point: { x: number; y: number }) {
    this.x = point.x + this.piece.width / 2;
    this.y = point.y + this.piece.height / 2;
  }

  setDimensions({ width, height }: { width: number; height: number }) {
    this.sprite.width = width;
    this.sprite.height = height;
    this.pivot.set(width / 2, height / 2);
  }

  updatePiece(newPiece: Partial<RenderItemPiece>) {
    // TODO move this to circle config
    if (this.piece.type === 'circle' && newPiece.width) {
      newPiece.radius = newPiece.width / 2;
    }

    this.setPiece({
      ...this.piece,
      ...newPiece,
    } as RenderItemPiece);

    this.sendUpdateThrottled();
  }

  setPiece(piece: RenderItemPiece) {
    this.piece = { ...piece };
    this.angle = piece.rotation || 0;
    this.zIndex = piece.layer;
    this.setPosition(piece);
    this.setDimensions(piece);
    this.setStack();
    this.onSync(piece);
  }

  sendUpdate() {
    if (this.onUpdate) {
      this.onUpdate({
        rotation: this.piece.rotation || 0,
        x: this.piece.x,
        y: this.piece.y,
        ...(this.piece.type === 'circle'
          ? {
              radius: this.piece.radius,
            }
          : {
              height: this.piece.height,
              width: this.piece.width,
            }),
      });
    }
  }
}
