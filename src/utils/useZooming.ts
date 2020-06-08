import React from 'react';

// TODO evaluate performance
// export function useZooming() {
//   const zoomTimerRef = React.useRef<number | null>();
//   const [isZooming, setIsZooming] = React.useState<boolean>(false);

//   const handleZoom = () => {
//     if (zoomTimerRef.current) {
//       clearTimeout(zoomTimerRef.current);
//     }
//     setIsZooming(true);
//     zoomTimerRef.current = setTimeout(() => setIsZooming(false), 100);
//   };

//   return {
//     handleZoom,
//     isZooming,
//   };
// }

export function useZooming() {
  const [zoomTimer, setZoomTimer] = React.useState<number | null>(null);

  // Trigger rerender for Transformer anchors
  const handleZoom = () => {
    if (zoomTimer) {
      clearTimeout(zoomTimer);
    }
    setZoomTimer(setTimeout(() => setZoomTimer(null), 100));
  };

  return {
    handleZoom,
    isZooming: !!zoomTimer,
  };
}
