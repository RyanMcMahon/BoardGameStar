import { Container, Graphics, utils } from 'pixi.js';
import { primaryColor } from './style';

interface TransformerOptions {
  uniformScaling?: boolean;
  rotatable?: boolean;
  resizable?: boolean;
  dimensions: {
    width: number;
    height: number;
  };
  onTransformStart: () => void;
  onTransformEnd: () => void;
  onTransform: (dimensions: { width: number; height: number }) => void;
  onRotate: (angle: number) => void;
}

const HANDLE_SIZE = 20;

const handleConfigs = [
  // Top Left
  {
    getPosition: () => ({
      x: -HANDLE_SIZE,
      y: -HANDLE_SIZE,
    }),
    constraint: { x: -1, y: -1 },
  },
  // Top Middle
  {
    getPosition: (width: number) => ({
      x: width / 2 - HANDLE_SIZE / 2,
      y: -HANDLE_SIZE,
    }),
    constraint: { x: 0, y: -1 },
  },
  // Top Right
  {
    getPosition: (width: number) => ({
      x: width,
      y: -HANDLE_SIZE,
    }),
    constraint: { x: 1, y: -1 },
  },
  // Middle Right
  {
    getPosition: (width: number, height: number) => ({
      x: width,
      y: height / 2 - HANDLE_SIZE / 2,
    }),
    constraint: { x: 1, y: 0 },
  },
  // Bottom Right
  {
    getPosition: (width: number, height: number) => ({
      x: width,
      y: height,
    }),
    constraint: { x: 1, y: 1 },
  },
  // Bottom Middle
  {
    getPosition: (width: number, height: number) => ({
      x: width / 2 - HANDLE_SIZE / 2,
      y: height,
    }),
    constraint: { x: 0, y: 1 },
  },
  // Bottom Left
  {
    getPosition: (width: number, height: number) => ({
      x: -HANDLE_SIZE,
      y: height,
    }),
    constraint: { x: -1, y: 1 },
  },
  // Middle Left
  {
    getPosition: (width: number, height: number) => ({
      x: -HANDLE_SIZE,
      y: height / 2 - HANDLE_SIZE / 2,
    }),
    constraint: { x: -1, y: 0 },
  },
];

export class Transformer extends Container {
  resizeData: any;
  onTransformStart: () => void;
  onTransformEnd: () => void;
  onTransform: (dimensions: { width: number; height: number }) => void;
  rotating: boolean;
  curDimensions: {
    width: number;
    height: number;
  };

  resizeHandles: {
    handle: Container;
    setPosition: (width: number, height: number) => void;
  }[];

  rotateHandle: Container;

  constructor(options: TransformerOptions) {
    super();
    this.interactive = true;
    this.onTransformStart = options.onTransformStart;
    this.onTransformEnd = options.onTransformEnd;
    this.onTransform = options.onTransform;
    this.rotating = false;
    this.curDimensions = options.dimensions;

    const rotateHandle = new Container();
    rotateHandle.interactive = true;
    rotateHandle.cursor = 'crosshair';
    rotateHandle.y = -40;

    const circleAndLine = new Graphics();
    circleAndLine.beginFill(utils.string2hex(primaryColor));
    circleAndLine.drawCircle(0, 0, HANDLE_SIZE / 1.6);
    circleAndLine.drawRect(-1, 0, 2, 40);
    circleAndLine.beginFill(0xffffff);
    circleAndLine.drawCircle(0, 0, HANDLE_SIZE / 1.6 - 2);
    circleAndLine.endFill();
    rotateHandle.addChild(circleAndLine);

    this.rotateHandle = rotateHandle;

    if (options.rotatable) {
      this.addChild(rotateHandle);
    }

    const handleRotateStart = () => {
      this.rotating = true;
      this.onTransformStart();
    };

    const handleRotateEnd = () => {
      this.rotating = false;
      this.onTransformEnd();
    };

    const handleRotate = (event: any) => {
      if (!this.rotating) {
        return;
      }
      const cursor = event.data.getLocalPosition(this.parent.parent);
      const center = {
        x: this.parent.x,
        y: this.parent.y,
      };
      const x = cursor.x - center.x;
      const y = cursor.y - center.y;
      const angle = Math.abs((Math.atan2(x, y) * 180) / Math.PI - 180);
      options.onRotate(angle);
    };

    rotateHandle
      // events for resize start
      .on('mousedown', handleRotateStart)
      .on('touchstart', handleRotateStart)
      // events for resize end
      .on('mouseup', handleRotateEnd)
      .on('mouseupoutside', handleRotateEnd)
      .on('touchend', handleRotateEnd)
      .on('touchendoutside', handleRotateEnd)
      // events for resize move
      .on('mousemove', handleRotate)
      .on('touchmove', handleRotate);

    this.resizeHandles = [];

    if (options.resizable) {
      handleConfigs.forEach(point => {
        // TODO fix uniform scaling for all handles
        if (
          // options.uniformScaling &&
          point.constraint.x !== 1 ||
          point.constraint.y !== 1
        ) {
          return;
        }

        let resizing = false;
        const handle = new Container();
        handle.interactive = true;
        handle.cursor = 'crosshair';

        const rectangle = new Graphics();
        rectangle.beginFill(utils.string2hex(primaryColor));
        rectangle.drawRect(0, 0, HANDLE_SIZE, HANDLE_SIZE);
        rectangle.beginFill(0xffffff);
        rectangle.drawRect(2, 2, HANDLE_SIZE - 4, HANDLE_SIZE - 4);
        rectangle.endFill();

        handle.addChild(rectangle);

        this.addChild(handle);
        this.resizeHandles.push({
          handle,
          setPosition: (width: number, height: number) => {
            const position = point.getPosition(width, height);
            handle.x = position.x;
            handle.y = position.y;
          },
        });

        const handleResizeStart = (event: any) => {
          resizing = true;

          this.resizeData = {
            startPosition: event.data.getLocalPosition(this.parent),
            constraint: point.constraint,
            curDimensions: { ...this.curDimensions },
          };

          this.onTransformStart();
        };

        const handleResizeEnd = (event: any) => {
          resizing = false;
          this.resizeData = null;
          this.onTransformEnd();
        };

        const handleResizeMove = (event: any) => {
          if (!resizing) {
            return;
          }

          const { startPosition, constraint, curDimensions } = this.resizeData;
          const localPosition = event.data.getLocalPosition(this.parent);
          const diff = {
            x: localPosition.x - startPosition.x,
            y: localPosition.y - startPosition.y,
          };

          if (options.uniformScaling) {
            if (Math.abs(diff.x) > Math.abs(diff.y)) {
              diff.y = diff.x;
            } else {
              diff.x = diff.y;
            }
          }

          const dimensions = {
            width: curDimensions.width + diff.x * constraint.x,
            height: curDimensions.height + diff.y * constraint.y,
          };

          this.rotateHandle.x = dimensions.width / 2;
          this.resizeHandles.forEach(({ setPosition }) =>
            setPosition(dimensions.width, dimensions.height)
          );
          this.onTransform(dimensions);
        };

        handle
          // events for resize start
          .on('mousedown', handleResizeStart)
          .on('touchstart', handleResizeStart)
          // events for resize end
          .on('mouseup', handleResizeEnd)
          .on('mouseupoutside', handleResizeEnd)
          .on('touchend', handleResizeEnd)
          .on('touchendoutside', handleResizeEnd)
          // events for resize move
          .on('mousemove', handleResizeMove)
          .on('touchmove', handleResizeMove);
      });
    }

    this.setDimensions(options.dimensions);
  }

  setDimensions({ width, height }: { width: number; height: number }) {
    this.rotateHandle.x = width / 2;
    this.resizeHandles.forEach(({ setPosition }) => setPosition(width, height));
    this.curDimensions = {
      width,
      height,
    };
  }
}
