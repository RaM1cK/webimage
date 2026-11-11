import cv from '@techstark/opencv-js';

export function loadImage(file: Blob | MediaSource): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();

        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
    });
}

export function toGray(src: cv.Mat): cv.Mat {
    const gray = new cv.Mat();

    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

    return gray;
}