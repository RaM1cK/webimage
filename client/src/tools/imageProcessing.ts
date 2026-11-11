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