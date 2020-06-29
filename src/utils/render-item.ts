import _ from 'lodash';
import { Container, Sprite, Texture, Graphics, utils, Point } from 'pixi.js';

import { RenderPiece } from '../types';
import { primaryColor } from './style';
import { Transformer } from './Transformer';

export type RenderItemPiece = RenderPiece & { height: number; width: number };

interface ImagePieceOptions {
  piece: RenderItemPiece;
  texture: Texture;
  uniformScaling?: boolean;
  draggable?: boolean;
  rotatable?: boolean;
  resizable?: boolean;
  onSync: (el: RenderItem, curPiece: RenderPiece) => void;
  restrictTransform?: (dimensions: {
    curPiece: RenderPiece;
    width: number;
    height: number;
  }) => { width: number; height: number };
}

export class RenderItem extends Container {
  id: string;
  piece!: RenderItemPiece;
  data: any;
  resizeData: any;
  nonSelectClick: boolean;
  dragging: boolean;
  dragEnabled: boolean;
  onTransformStart?: () => void;
  onTransformEnd?: () => void;
  onUpdate?: (rect: {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
  }) => void;
  transforming: boolean;
  sprite: Sprite;
  transformer: Transformer;
  arrow: Graphics;
  outline: Graphics;
  locked?: boolean;
  tempDragDisabled?: boolean;
  sendUpdateThrottled: () => void;
  onSync: (curPiece: RenderPiece) => void;

  constructor({
    piece,
    texture,
    uniformScaling,
    draggable,
    rotatable,
    resizable,
    onSync,
    restrictTransform,
  }: ImagePieceOptions) {
    super();
    this.id = piece.id;
    this.cursor = 'grab';
    this.nonSelectClick = false;
    this.dragging = false;
    this.interactive = true;
    this.dragEnabled = true;
    this.tempDragDisabled = false;
    this.transforming = false;
    this.outline = new Graphics();
    this.onSync = (curPiece: RenderPiece) => onSync(this, curPiece);
    this.sendUpdateThrottled = _.throttle(this.sendUpdate, 50, {
      leading: false,
      trailing: true,
    });

    const sprite = new Sprite(texture);
    sprite.x = 0;
    sprite.y = 0;
    sprite.height = piece.height;
    sprite.width = piece.width;
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
        this.nonSelectClick = false;
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
        .on('mousedown', this.handleDragStart)
        .on('touchstart', this.handleDragStart)
        // events for drag end
        .on('mouseup', this.handleDragEnd)
        .on('mouseupoutside', this.handleDragEnd)
        .on('touchend', this.handleDragEnd)
        .on('touchendoutside', this.handleDragEnd)
        // events for drag move
        .on('mousemove', this.handleDragMove)
        .on('touchmove', this.handleDragMove);
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

  handleDragStart(event: any) {
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

  handleDragEnd() {
    this.dragging = false;
    this.data = null;
    this.cursor = 'grab';
    this.zIndex = this.piece.layer;
    // this.removeChild(this.arrow);

    if (this.onTransformEnd) {
      this.onTransformEnd();
    }
  }

  handleDragMove(event: any) {
    const { touches = [] } = event.data?.originalEvent || {};
    const pointer = event.data.getLocalPosition(this.parent);

    if (
      !this.data ||
      pointer.x !== this.data.pointer.x ||
      pointer.y !== this.data.pointer.y
    ) {
      this.nonSelectClick = true;
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

  select() {
    this.addChild(this.transformer);
    this.addChild(this.outline);
    this.updateOutline();
  }

  deselect() {
    this.removeChild(this.transformer);
    this.removeChild(this.outline);
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
    this.onSync(piece);
  }

  sendUpdate() {
    if (this.onUpdate) {
      this.onUpdate({ rotation: 0, ...this.piece });
    }
  }
}
