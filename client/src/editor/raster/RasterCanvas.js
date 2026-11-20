import cv from '@techstark/opencv-js';
import BaseCanvas from '../core/BaseCanvas';

export default class RasterCanvas extends BaseCanvas {
  constructor() {
    super('raster');
    this.src = null; // current cv.Mat
    this.imageElement = null;
    this.filename = 'image.png';
  }

  loadFromFile(file) {
    return new Promise((resolve, reject) => {
      const objectUrl = URL.createObjectURL(file);
      const img = new Image();

      img.onload = () => {
        try {
          this.replaceMat(cv.imread(img));
          this.imageElement = img;
          this.filename = file.name || 'image.png';
          URL.revokeObjectURL(objectUrl);
          resolve(this.src);
        } catch (error) {
          URL.revokeObjectURL(objectUrl);
          reject(error);
        }
      };

      img.onerror = (error) => {
        URL.revokeObjectURL(objectUrl);
        reject(error);
      };

      img.src = objectUrl;
    });
  }

  loadFromImageElement(img) {
    this.replaceMat(cv.imread(img));
    this.imageElement = img;
    return this.src;
  }

  renderTo(canvasElement) {
    if (!canvasElement || !this.src) return;
    cv.imshow(canvasElement, this.src);
  }

  getMat() {
    return this.src;
  }

  setMat(mat) {
    this.replaceMat(mat);
  }

  replaceMat(mat) {
    if (this.src && this.src !== mat) {
      try {
        this.src.delete();
      } catch (error) {
        console.warn('Failed to delete previous cv.Mat:', error);
      }
    }
    this.src = mat;
  }

  cloneMat() {
    return this.src ? this.src.clone() : null;
  }

  toDataURL(type = 'image/png', quality) {
    if (!this.src) return null;
    const canvas = document.createElement('canvas');
    cv.imshow(canvas, this.src);
    if (type === 'image/jpeg') return canvas.toDataURL(type, quality ?? 0.92);
    return canvas.toDataURL(type);
  }

  exportDataURL(type = 'image/png', quality) {
    return this.toDataURL(type, quality);
  }

  exportBlob(type = 'image/png', quality = 0.92) {
    return new Promise((resolve) => {
      if (!this.src) {
        resolve(null);
        return;
      }
      const canvas = document.createElement('canvas');
      cv.imshow(canvas, this.src);
      canvas.toBlob((blob) => resolve(blob), type, quality);
    });
  }

  toBlob(type = 'image/png', quality = 0.92) {
    return this.exportBlob(type, quality);
  }

  destroy() {
    if (!this.src) return;
    try {
      this.src.delete();
    } catch (error) {
      console.warn('Failed to delete cv.Mat on destroy:', error);
    } finally {
      this.src = null;
    }
  }
}
