import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import AutosaveSettings from './home/AutosaveSettings';
import CreateWorkModal from './home/CreateWorkModal';
import HomeHeader from './home/HomeHeader';
import WorksGrid from './home/WorksGrid';

export default function HomePage() {
  const { user, logout, updateSettings } = useAuth();
  const navigate = useNavigate();

  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('Untitled');
  const [newType, setNewType] = useState('raster');
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(user?.autoSaveEnabled ?? true);
  const [autoSaveInterval, setAutoSaveInterval] = useState(user?.autoSaveInterval ?? 30);

  const loadWorks = async () => {
    setLoading(true);
    try {
      const data = await api.get('/works');
      setWorks(data.works || []);
    } catch (e) {
      console.error('Failed to load works:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorks();
  }, []);

  useEffect(() => {
    setAutoSaveEnabled(user?.autoSaveEnabled ?? true);
    setAutoSaveInterval(user?.autoSaveInterval ?? 30);
  }, [user]);

  const createWork = async (e) => {
    e.preventDefault();
    try {
      const data = await api.post('/works', { title: newTitle || 'Untitled', workType: newType });
      setShowCreate(false);
      navigate(`/editor/${data.work.id}`);
    } catch (err) {
      console.error('Failed to create work:', err);
      alert(err.message);
    }
  };

  const deleteWork = async (id) => {
    if (!window.confirm('Удалить работу?')) return;
    try {
      await api.delete(`/works/${id}`);
      setWorks((current) => current.filter((work) => work.id !== id));
    } catch (err) {
      console.error('Failed to delete work:', err);
      alert(err.message);
    }
  };

  const saveSettings = async () => {
    try {
      await updateSettings({ autoSaveEnabled, autoSaveInterval: Number(autoSaveInterval) });
    } catch (e) {
      console.error('Failed to save settings:', e);
      alert(e.message);
    }
  };

  return (
    <div className="app-shell">
      <HomeHeader username={user?.username} onCreate={() => setShowCreate(true)} onLogout={logout} />

      <div className="main-content">
        <div className="d-flex justify-content-between align-items-end mb-3">
          <h4 className="m-0">Мои работы</h4>
          <AutosaveSettings
            enabled={autoSaveEnabled}
            interval={autoSaveInterval}
            onEnabledChange={setAutoSaveEnabled}
            onIntervalChange={setAutoSaveInterval}
            onSave={saveSettings}
          />
        </div>

        {showCreate && (
          <CreateWorkModal
            title={newTitle}
            workType={newType}
            onTitleChange={setNewTitle}
            onTypeChange={setNewType}
            onSubmit={createWork}
            onCancel={() => setShowCreate(false)}
          />
        )}

        <WorksGrid
          works={works}
          loading={loading}
          onOpen={(workId) => navigate(`/editor/${workId}`)}
          onDelete={deleteWork}
        />
      </div>
    </div>
  );
}
