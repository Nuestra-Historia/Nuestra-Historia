export function calcularTamano(
  ancho: number,
  alto: number,
  maxLado: number
): { ancho: number; alto: number } {
  if (ancho <= 0 || alto <= 0 || maxLado <= 0) {
    return { ancho: Math.max(0, ancho), alto: Math.max(0, alto) };
  }

  // No agrandar si ambos lados son menores o iguales al máximo
  if (ancho <= maxLado && alto <= maxLado) {
    return { ancho: Math.round(ancho), alto: Math.round(alto) };
  }

  if (ancho >= alto) {
    const ratio = maxLado / ancho;
    return {
      ancho: maxLado,
      alto: Math.max(1, Math.round(alto * ratio)),
    };
  } else {
    const ratio = maxLado / alto;
    return {
      ancho: Math.max(1, Math.round(ancho * ratio)),
      alto: maxLado,
    };
  }
}

export interface ImagenProcesada {
  full: Blob;
  thumb: Blob;
  formato: 'webp' | 'jpeg';
  ancho: number;
  alto: number;
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Fallo al exportar canvas'));
        }
      },
      type,
      quality
    );
  });
}

function renderCanvas(
  source: CanvasImageSource,
  targetWidth: number,
  targetHeight: number
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('No se pudo inicializar contexto 2D');
  }
  ctx.drawImage(source, 0, 0, targetWidth, targetHeight);
  return canvas;
}

export async function procesarImagen(file: File): Promise<ImagenProcesada> {
  // Rechazar archivos mayores a 40 MB antes de decodificar
  const MAX_BYTES = 40 * 1024 * 1024;
  if (file.size > MAX_BYTES) {
    throw new Error('No se pudo procesar esta foto');
  }

  let source: ImageBitmap | HTMLImageElement | null = null;
  let originalWidth = 0;
  let originalHeight = 0;

  try {
    if (typeof createImageBitmap !== 'undefined') {
      try {
        source = await createImageBitmap(file, {
          imageOrientation: 'from-image',
        });
        originalWidth = source.width;
        originalHeight = source.height;
      } catch {
        source = null;
      }
    }

    if (!source) {
      source = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
          URL.revokeObjectURL(url);
          resolve(img);
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error('No se pudo procesar esta foto'));
        };
        img.src = url;
      });
      originalWidth = source.naturalWidth;
      originalHeight = source.naturalHeight;
    }

    if (originalWidth <= 0 || originalHeight <= 0) {
      throw new Error('Dimensiones de imagen inválidas');
    }

    // Dimensiones full (máximo 1600 px) y thumb (máximo 600 px)
    const dimFull = calcularTamano(originalWidth, originalHeight, 1600);
    const dimThumb = calcularTamano(originalWidth, originalHeight, 600);

    const canvasFull = renderCanvas(source, dimFull.ancho, dimFull.alto);
    const canvasThumb = renderCanvas(source, dimThumb.ancho, dimThumb.alto);

    // Intentar WebP primero
    let blobFull = await canvasToBlob(canvasFull, 'image/webp', 0.8);
    let blobThumb = await canvasToBlob(canvasThumb, 'image/webp', 0.75);

    // En Safari, canvas no codifica WebP y devuelve image/png.
    // Si no es image/webp, recodificar ambas en JPEG
    let formato: 'webp' | 'jpeg' = 'webp';
    if (blobFull.type !== 'image/webp' || blobThumb.type !== 'image/webp') {
      blobFull = await canvasToBlob(canvasFull, 'image/jpeg', 0.82);
      blobThumb = await canvasToBlob(canvasThumb, 'image/jpeg', 0.78);
      formato = 'jpeg';
    }

    return {
      full: blobFull,
      thumb: blobThumb,
      formato,
      ancho: dimFull.ancho,
      alto: dimFull.alto,
    };
  } catch (err) {
    if (
      err instanceof Error &&
      err.message === 'No se pudo procesar esta foto'
    ) {
      throw err;
    }
    throw new Error('No se pudo procesar esta foto');
  } finally {
    if (source && 'close' in source && typeof source.close === 'function') {
      source.close();
    }
  }
}
