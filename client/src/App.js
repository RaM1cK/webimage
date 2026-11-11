import { useRef } from 'react';
import { loadImage } from './tools/imageProcessing.ts';
import './App.css';
import cv from '@techstark/opencv-js';

function App() {
  const canvas = useRef(null);

  const handleChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const img = await loadImage(file)
    const src = cv.imread(img)

    cv.imshow(canvas.current, src)
  }

  return (
    <div>
      <input type='file' accept='image/*' onChange={handleChange}/>
      <canvas ref={canvas}/>
    </div>
  );
}

export default App;
