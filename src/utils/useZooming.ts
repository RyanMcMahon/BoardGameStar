import React from 'react';

export function useZooming() {
  const zoomTimerRef = React.useRef<number | null>();
  const [isZooming, setIsZooming] = React.useState<boolean>(false);

  const handleZoom = () => {
    if (zoomTimerRef.current) {
      clearTimeout(zoomTimerRef.current);
    }
    setIsZooming(true);
    zoomTimerRef.current = setTimeout(() => setIsZooming(false), 100);
  };

  return {
    handleZoom,
    isZooming,
  };
}
