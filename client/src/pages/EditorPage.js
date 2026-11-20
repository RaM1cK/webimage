import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { BackIcon, SaveIcon } from '../components/Icons';
import { useAuth } from '../context/AuthContext';
import { getEditorConfig } from './editor/editorRegistry';
import { saveEditorBlobFromButton, saveWorkBlob } from './editor/editorSave';

export default function EditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [work, setWork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  const getEditorBlobRef = useRef(null);
  const workRef = useRef(null);

  useEffect(() => {
    workRef.current = work;
  }, [work]);

  const loadWork = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get(`/works/${id}`);
      setWork(data.work);
    } catch (e) {
      console.error('Failed to load work:', e);
      alert('Не удалось загрузить работу: ' + e.message);
      navigate('/');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    loadWork();
  }, [loadWork]);

  const registerAutosaveData = useCallback((getter) => {
    getEditorBlobRef.current = getter;
  }, []);

  const saveNow = useCallback(async (isAutosave = false) => {
    const currentWork = workRef.current;
    if (!currentWork || !getEditorBlobRef.current) return;

    try {
      setSaving(true);
      const blob = await getEditorBlobRef.current();
      if (!blob) return;

      await saveWorkBlob({ work: currentWork, blob, isAutosave });
      setLastSaved(new Date());
    } catch (e) {
      console.error(e);
      if (!isAutosave) alert('Ошибка сохранения: ' + e.message);
    } finally {
      setSaving(false);
    }
  }, []);

  useEffect(() => {
    if (!user?.autoSaveEnabled) return undefined;
    const intervalMs = Math.max(5, Number(user.autoSaveInterval || 30)) * 1000;
    const timer = setInterval(() => saveNow(true), intervalMs);
    return () => clearInterval(timer);
  }, [user, saveNow]);

  const handleTitleBlur = async () => {
    if (!work) return;
    try {
      await api.put(`/works/${work.id}`, { title: work.title });
    } catch (e) {
      console.error('Failed to update work title:', e);
    }
  };

  if (loading) return <div className="main-content">Загрузка...</div>;
  if (!work) return null;

  const { factory: Factory, Component: EditorComponent } = getEditorConfig(work.workType);
  const factory = new Factory();

  const editorProps = {
    factory,
    work,
    onSave: async (blob, type) => {
      await saveEditorBlobFromButton({ work, blob, type });
      setLastSaved(new Date());
    },
    onAutosaveData: registerAutosaveData,
  };

  return (
    <div className="app-shell">
      <div className="topbar">
        <div className="d-flex align-items-center gap-2">
          <button className="icon-btn" title="Назад" onClick={() => navigate('/')}>
            <BackIcon />
          </button>
          <input
            className="form-control"
            style={{ width: 260, height: 32 }}
            value={work.title}
            onChange={(e) => setWork({ ...work, title: e.target.value })}
            onBlur={handleTitleBlur}
          />
          <span className="muted" style={{ fontSize: 12 }}>({work.workType})</span>
        </div>

        <div className="d-flex align-items-center gap-2">
          {user?.autoSaveEnabled && (
            <span className="muted" style={{ fontSize: 12 }}>Автосохранение: {user.autoSaveInterval}с</span>
          )}
          {lastSaved && (
            <span className="muted" style={{ fontSize: 12 }}>Сохранено: {lastSaved.toLocaleTimeString()}</span>
          )}
          <button className="btn btn-primary d-flex align-items-center gap-1" onClick={() => saveNow(false)} disabled={saving}>
            <SaveIcon /> {saving ? '...' : 'Сохранить'}
          </button>
        </div>
      </div>

      <EditorComponent {...editorProps} />
    </div>
  );
}
