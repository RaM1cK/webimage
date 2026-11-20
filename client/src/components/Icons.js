import React from 'react';

export const LogoutIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

export const SaveIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);

export const BackIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

export const ToolIcon = ({ type }) => {
  const common = { viewBox: "0 0 24 24", width: 20, height: 20, fill: "none", stroke: "currentColor", strokeWidth: 1.8 };
  switch (type) {
    case 'select': return <svg {...common}><path d="M4 4l7 16 2-6 6-2z"/></svg>;
    case 'open': return <svg {...common}><path d="M3 7h6l2 2h10v8a2 2 0 0 1-2 2H3z"/><path d="M3 7V5a2 2 0 0 1 2-2h4l2 2"/></svg>;
    case 'resize': return <svg {...common}><rect x="4" y="4" width="10" height="10"/><path d="M14 14l6 6M16 20h4v-4"/></svg>;
    case 'crop': return <svg {...common}><path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M2 6h14a2 2 0 0 1 2 2v14"/></svg>;
    case 'flipH': return <svg {...common}><path d="M12 3v18"/><path d="M4 7l4 5-4 5z"/><path d="M20 7l-4 5 4 5z"/></svg>;
    case 'flipV': return <svg {...common}><path d="M3 12h18"/><path d="M7 4l5 4 5-4z"/><path d="M7 20l5-4 5 4z"/></svg>;
    case 'move': return <svg {...common}><path d="M12 3v18M3 12h18"/><polyline points="9 6 12 3 15 6"/><polyline points="9 18 12 21 15 18"/><polyline points="6 9 3 12 6 15"/><polyline points="18 9 21 12 18 15"/></svg>;
    case 'scale': return <svg {...common}><path d="M21 21l-6-6M21 16v5h-5"/><path d="M3 3l6 6M3 8V3h5"/><rect x="8" y="8" width="8" height="8"/></svg>;
    case 'rotate': return <svg {...common}><path d="M3 12a9 9 0 1 0 3-6.7"/><polyline points="3 4 3 10 9 10"/></svg>;
    case 'brightness': return <svg {...common}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>;
    case 'blur': return <svg {...common}><circle cx="7" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="17" cy="12" r="2"/></svg>;
    case 'noise': return <svg {...common}><rect x="4" y="4" width="16" height="16"/><path d="M7 7h.01M11 9h.01M15 7h.01M8 13h.01M12 15h.01M16 12h.01"/></svg>;
    case 'save': return <SaveIcon />;
    case 'rect': return <svg {...common}><rect x="4" y="6" width="16" height="12"/></svg>;
    case 'ellipse': return <svg {...common}><ellipse cx="12" cy="12" rx="8" ry="5"/></svg>;
    case 'line': return <svg {...common}><line x1="5" y1="19" x2="19" y2="5"/></svg>;
    case 'text': return <svg {...common}><path d="M4 6h16M12 6v12M8 18h8"/></svg>;
    case 'polyline': return <svg {...common}><polyline points="4,18 9,8 14,14 20,6"/></svg>;
    case 'polygon': return <svg {...common}><polygon points="12,4 20,9 17,18 7,18 4,9"/></svg>;
    case 'star': return <svg {...common}><polygon points="12,3 14.8,8.8 21,9.3 16.2,13.2 17.8,19.2 12,15.8 6.2,19.2 7.8,13.2 3,9.3 9.2,8.8"/></svg>;
    case 'cube': return <svg {...common}><path d="M12 3l8 4v10l-8 4-8-4V7z"/><path d="M12 21V11"/><path d="M20 7l-8 4-8-4"/></svg>;
    case 'sphere': return <svg {...common}><circle cx="12" cy="12" r="8"/><ellipse cx="12" cy="12" rx="8" ry="3"/></svg>;
    case 'cylinder': return <svg {...common}><ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6"/></svg>;
    case 'cone': return <svg {...common}><ellipse cx="12" cy="18" rx="7" ry="3"/><path d="M5 18L12 4l7 14"/></svg>;
    case 'torus': return <svg {...common}><ellipse cx="12" cy="12" rx="8" ry="4"/><ellipse cx="12" cy="12" rx="4" ry="1.8"/></svg>;
    case 'undo': return <svg {...common}><path d="M9 14L4 9l5-5"/><path d="M4 9h10a5 5 0 1 1 0 10h-3"/></svg>;
    case 'redo': return <svg {...common}><path d="M15 14l5-5-5-5"/><path d="M20 9H10a5 5 0 1 0 0 10h3"/></svg>;
    default: return <svg {...common}><circle cx="12" cy="12" r="8"/></svg>;
  }
};
