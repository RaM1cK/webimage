import React from 'react';

function Panel({ title, children }) {
  return (
    <div>
      <div className="panel-title">{title}</div>
      {children}
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div className="prop-row">
      <label>{label}</label>
      {children}
    </div>
  );
}

export default function RasterPropertiesPanel({ activeTool, imageInfo, state, actions }) {
  const {
    resizeW, resizeH, resizeScale, interp,
    crop, angle, centerX, centerY,
    brightness, contrast, balance,
    noiseType, noiseAmount, noiseStddev,
    blurType, blurK,
  } = state;

  const {
    setResizeW, setResizeH, setResizeScale, setInterp,
    setCrop, setAngle, setCenterX, setCenterY,
    setBrightness, setContrast, setBalance,
    setNoiseType, setNoiseAmount, setNoiseStddev,
    setBlurType, setBlurK,
    applyTool,
  } = actions;

  if (activeTool === 'resize') {
    return (
      <Panel title="Размер">
        <Row label="W"><input className="form-control" type="number" value={resizeW} onChange={(e) => setResizeW(e.target.value)} /></Row>
        <Row label="H"><input className="form-control" type="number" value={resizeH} onChange={(e) => setResizeH(e.target.value)} /></Row>
        <Row label="%"><input className="form-control" type="number" step="0.1" value={resizeScale} onChange={(e) => setResizeScale(e.target.value)} /></Row>
        <select className="form-select mb-2" value={interp} onChange={(e) => setInterp(e.target.value)}>
          <option value="auto">auto</option>
          <option value="nearest">nearest</option>
          <option value="bilinear">bilinear</option>
          <option value="bicubic">bicubic</option>
        </select>
        <button className="btn btn-sm w-100 mb-1" onClick={() => applyTool('resize', { width: parseInt(resizeW, 10), height: parseInt(resizeH, 10), interpolation: interp })}>По размеру</button>
        <button className="btn btn-sm w-100" onClick={() => applyTool('resize', { scale: parseFloat(resizeScale), interpolation: interp })}>По масштабу</button>
      </Panel>
    );
  }

  if (activeTool === 'crop') {
    return (
      <Panel title="Обрезка">
        <Row label="X"><input className="form-control" type="number" value={crop.x} onChange={(e) => setCrop({ ...crop, x: +e.target.value })} /></Row>
        <Row label="Y"><input className="form-control" type="number" value={crop.y} onChange={(e) => setCrop({ ...crop, y: +e.target.value })} /></Row>
        <Row label="W"><input className="form-control" type="number" value={crop.width} onChange={(e) => setCrop({ ...crop, width: +e.target.value })} /></Row>
        <div className="prop-row mb-2"><label>H</label><input className="form-control" type="number" value={crop.height} onChange={(e) => setCrop({ ...crop, height: +e.target.value })} /></div>
        <button className="btn btn-sm w-100" onClick={() => applyTool('crop', crop)}>Применить (Enter)</button>
        <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>Мышь: выделение. Стрелки: сдвиг.</div>
      </Panel>
    );
  }

  if (activeTool === 'flipH' || activeTool === 'flipV') {
    return (
      <Panel title="Отражение">
        <div className="d-flex gap-1">
          <button className="btn btn-sm w-100" onClick={() => applyTool('flipH', { mode: 'h' })} title="Горизонтально (H)">H</button>
          <button className="btn btn-sm w-100" onClick={() => applyTool('flipV', { mode: 'v' })} title="Вертикально (V)">V</button>
          <button className="btn btn-sm w-100" onClick={() => applyTool('flipH', { mode: 'b' })} title="Оба">HV</button>
        </div>
      </Panel>
    );
  }

  if (activeTool === 'rotate') {
    return (
      <Panel title="Поворот">
        <Row label="°"><input className="form-control" type="number" step="0.1" value={angle} onChange={(e) => setAngle(e.target.value)} /></Row>
        <Row label="CX"><input className="form-control" type="number" placeholder="центр" value={centerX} onChange={(e) => setCenterX(e.target.value)} /></Row>
        <div className="prop-row mb-2"><label>CY</label><input className="form-control" type="number" placeholder="центр" value={centerY} onChange={(e) => setCenterY(e.target.value)} /></div>
        <button className="btn btn-sm w-100" onClick={() => applyTool('rotate', { angle: Number(angle), center: (centerX !== '' && centerY !== '') ? { x: Number(centerX), y: Number(centerY) } : undefined })}>Применить (Enter)</button>
        <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>Стрелки: ±угол.</div>
      </Panel>
    );
  }

  if (activeTool === 'brightness') {
    return (
      <Panel title="Яркость / контраст">
        <label>Яркость: {brightness}</label>
        <input type="range" min="-100" max="100" value={brightness} onChange={(e) => setBrightness(e.target.value)} />
        <label>Контраст: {contrast}</label>
        <input type="range" min="0" max="3" step="0.05" value={contrast} onChange={(e) => setContrast(e.target.value)} />
        <button className="btn btn-sm w-100" onClick={() => applyTool('brightness', { brightness: Number(brightness), contrast: Number(contrast) })}>Применить (Enter)</button>
      </Panel>
    );
  }

  if (activeTool === 'color') {
    return (
      <Panel title="Цвет">
        <label>R: {balance.r}</label>
        <input type="range" min="0" max="3" step="0.05" value={balance.r} onChange={(e) => setBalance({ ...balance, r: +e.target.value })} />
        <label>G: {balance.g}</label>
        <input type="range" min="0" max="3" step="0.05" value={balance.g} onChange={(e) => setBalance({ ...balance, g: +e.target.value })} />
        <label>B: {balance.b}</label>
        <input type="range" min="0" max="3" step="0.05" value={balance.b} onChange={(e) => setBalance({ ...balance, b: +e.target.value })} />
        <button className="btn btn-sm w-100" onClick={() => applyTool('color', balance)}>Применить</button>
      </Panel>
    );
  }

  if (activeTool === 'noise') {
    return (
      <Panel title="Шум">
        <select className="form-select mb-2" value={noiseType} onChange={(e) => setNoiseType(e.target.value)}>
          <option value="gaussian">Gaussian</option>
          <option value="sp">Salt & Pepper</option>
        </select>
        {noiseType === 'gaussian' ? (
          <Row label="σ"><input className="form-control" type="number" value={noiseStddev} onChange={(e) => setNoiseStddev(e.target.value)} /></Row>
        ) : (
          <Row label="%"><input className="form-control" type="number" step="0.01" value={noiseAmount} onChange={(e) => setNoiseAmount(e.target.value)} /></Row>
        )}
        <button className="btn btn-sm w-100 mt-2" onClick={() => applyTool('noise', { type: noiseType, stddev: Number(noiseStddev), amount: Number(noiseAmount) })}>Применить</button>
      </Panel>
    );
  }

  if (activeTool === 'blur') {
    return (
      <Panel title="Размытие">
        <select className="form-select mb-2" value={blurType} onChange={(e) => setBlurType(e.target.value)}>
          <option value="gaussian">Gaussian</option>
          <option value="mean">Mean</option>
          <option value="median">Median</option>
        </select>
        <Row label="K"><input className="form-control" type="number" min="1" step="2" value={blurK} onChange={(e) => setBlurK(e.target.value)} /></Row>
        <button className="btn btn-sm w-100 mt-2" onClick={() => applyTool('blur', { type: blurType, ksize: parseInt(blurK, 10) })}>Применить</button>
      </Panel>
    );
  }

  return <div className="muted" style={{ fontSize: 13 }}>Выберите инструмент</div>;
}
