import cv from '@techstark/opencv-js';

export function toGray(src: cv.Mat): cv.Mat {
    const gray = new cv.Mat();

    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

    return gray;
}