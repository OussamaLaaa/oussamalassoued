export interface FrameEngineConfig {
  zoomFactor?: number;
  objectFit?: 'cover' | 'contain';
}

type FrameSource = HTMLImageElement | HTMLVideoElement | HTMLCanvasElement;

const getSourceSize = (source: FrameSource) => {
  if (source instanceof HTMLVideoElement) {
    return { width: source.videoWidth, height: source.videoHeight };
  }
  if (source instanceof HTMLImageElement) {
    return { width: source.naturalWidth || source.width, height: source.naturalHeight || source.height };
  }
  return { width: source.width, height: source.height };
};

export function drawCoverFrame(
  ctx: CanvasRenderingContext2D,
  image: FrameSource,
  config: FrameEngineConfig = {}
) {
  const { zoomFactor = 1, objectFit = 'cover' } = config;

  const canvasObj = ctx.canvas;
  const cw = canvasObj.width;
  const ch = canvasObj.height;
  const { width: iw, height: ih } = getSourceSize(image);

  if (!iw || !ih) {
    return;
  }

  let scale = 1;
  if (objectFit === 'contain') {
    scale = Math.min(cw / iw, ch / ih);
  } else {
    scale = Math.max(cw / iw, ch / ih);
  }
  scale *= zoomFactor;

  const scaledW = iw * scale;
  const scaledH = ih * scale;

  // Center horizontally and vertically
  const dx = (cw - scaledW) / 2;
  const dy = (ch - scaledH) / 2;

  // Clear context and draw image
  ctx.clearRect(0, 0, cw, ch);
  
  // Smoothing optimizations - use 'low' for better FPS
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'low';

  ctx.drawImage(image, dx, dy, scaledW, scaledH);
}
