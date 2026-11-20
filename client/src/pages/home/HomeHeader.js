import React from 'react';
import { LogoutIcon } from '../../components/Icons';

export default function HomeHeader({ username, onCreate, onLogout }) {
  return (
    <div className="topbar">
      <div>
        <button className="btn btn-primary" onClick={onCreate}>Создать / Create</button>
      </div>
      <div className="d-flex align-items-center gap-2">
        <span>{username}</span>
        <button className="icon-btn" title="Logout" onClick={onLogout}>
          <LogoutIcon />
        </button>
      </div>
    </div>
  );
}
