import { DisplayObject } from 'pixi.js';
import { RenderPiece } from '../../types';

export class Piece extends DisplayObject {
  id: string;
  data: any;
  dragging: boolean;

  constructor(options: RenderPiece) {
    super();
    this.id = options.id;
    this.dragging = false;

    // events for drag start
    this.on('mousedown', this.onDragStart)
      .on('touchstart', this.onDragStart)
      // events for drag end
      .on('mouseup', this.onDragEnd)
      .on('mouseupoutside', this.onDragEnd)
      .on('touchend', this.onDragEnd)
      .on('touchendoutside', this.onDragEnd)
      // events for drag move
      .on('mousemove', this.onDragMove)
      .on('touchmove', this.onDragMove);
  }

  onDragStart(event: any) {
    this.data = event.data;
    this.dragging = true;
  }

  onDragEnd() {
    this.dragging = false;
    this.data = null;
  }

  onDragMove() {
    if (this.dragging) {
      const newPosition = this.data.getLocalPosition(this.parent);
      this.position.x = newPosition.x;
      this.position.y = newPosition.y;
    }
  }
}
