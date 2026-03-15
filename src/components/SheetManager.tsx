import { useState, useRef, useCallback } from 'react';
import type { SheetData } from '../types/sheet';
import { Spreadsheet, type SpreadsheetRef } from './Spreadsheet';
import * as api from '../api/sheets';

export function SheetManager() {
  const spreadsheetRef = useRef<SpreadsheetRef>(null);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [currentName, setCurrentName] = useState<string>('');
  const [initialData, setInitialData] = useState<SheetData | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const [saveAsOpen, setSaveAsOpen] = useState(false);
  const [saveAsName, setSaveAsName] = useState('');
  const [list, setList] = useState<api.SheetMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const loadSheet = useCallback(async (id: string) => {
    setError(null);
    setLoading(true);
    try {
      const doc = await api.getSheet(id);
      setInitialData({
        grid: (doc.data?.grid as SheetData['grid']) || {},
        rowComments: (doc.data?.rowComments as SheetData['rowComments']) || {},
        rowAttachments: (doc.data?.rowAttachments as SheetData['rowAttachments']) || {},
      });
      setCurrentId(doc.id);
      setCurrentName(doc.name || 'Untitled');
      setListOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  const openList = useCallback(async () => {
    setError(null);
    setListOpen(true);
    setLoading(true);
    try {
      const { sheets } = await api.listSheets();
      setList(sheets || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to list sheets');
      setList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleNew = useCallback(() => {
    setInitialData({ grid: {}, rowComments: {}, rowAttachments: {} });
    setCurrentId(null);
    setCurrentName('');
    setListOpen(false);
    setSaveAsOpen(false);
    setError(null);
  }, []);

  const handleSave = useCallback(async () => {
    const ref = spreadsheetRef.current;
    if (!ref) return;
    const data = ref.getData();
    setError(null);
    setLoading(true);
    try {
      if (currentId) {
        await api.updateSheet(currentId, currentName, data);
      } else {
        const name = saveAsName.trim() || 'Untitled';
        const meta = await api.createSheet(name, data);
        setCurrentId(meta.id);
        setCurrentName(meta.name);
        setSaveAsOpen(false);
        setSaveAsName('');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setLoading(false);
    }
  }, [currentId, currentName, saveAsName]);

  const handleSaveAs = useCallback(() => {
    setSaveAsName(currentName || '');
    setSaveAsOpen(true);
  }, [currentName]);

  const handleSaveAsConfirm = useCallback(async () => {
    const ref = spreadsheetRef.current;
    if (!ref) return;
    const name = saveAsName.trim() || 'Untitled';
    setError(null);
    setLoading(true);
    try {
      const data = ref.getData();
      const meta = await api.createSheet(name, data);
      setCurrentId(meta.id);
      setCurrentName(meta.name);
      setSaveAsOpen(false);
      setSaveAsName('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setLoading(false);
    }
  }, [saveAsName]);

  return (
    <div className="sheet-manager">
      <div className="sheet-manager-bar">
        <div className="sheet-manager-buttons">
          <button type="button" className="sheet-manager-btn" onClick={handleNew}>New</button>
          <button type="button" className="sheet-manager-btn" onClick={openList}>Open</button>
          <button type="button" className="sheet-manager-btn" onClick={() => currentId ? handleSave() : setSaveAsOpen(true)}>Save</button>
          <button type="button" className="sheet-manager-btn" onClick={handleSaveAs}>Save as</button>
        </div>
        {currentName && <span className="sheet-manager-title">{currentName}</span>}
        {error && (
          <span className="sheet-manager-error">
            {error}
            <button type="button" className="sheet-manager-error-dismiss" onClick={clearError} aria-label="Dismiss">×</button>
          </span>
        )}
      </div>

      <Spreadsheet ref={spreadsheetRef} initialData={initialData} />

      {listOpen && (
        <div className="sheet-manager-overlay" onClick={() => setListOpen(false)}>
          <div className="sheet-manager-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Open sheet</h3>
            {loading ? <p>Loading…</p> : list.length === 0 ? <p>No saved sheets.</p> : (
              <ul className="sheet-manager-list">
                {list.map((s) => (
                  <li key={s.id}>
                    <button type="button" className="sheet-manager-list-btn" onClick={() => loadSheet(s.id)}>
                      <span className="sheet-manager-list-name">{s.name}</span>
                      <span className="sheet-manager-list-date">{new Date(s.updatedAt).toLocaleString()}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button type="button" className="sheet-manager-btn" onClick={() => setListOpen(false)}>Cancel</button>
          </div>
        </div>
      )}

      {saveAsOpen && (
        <div className="sheet-manager-overlay" onClick={() => setSaveAsOpen(false)}>
          <div className="sheet-manager-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Save as</h3>
            <input
              type="text"
              className="sheet-manager-input"
              value={saveAsName}
              onChange={(e) => setSaveAsName(e.target.value)}
              placeholder="Sheet name"
              autoFocus
            />
            <div className="sheet-manager-modal-actions">
              <button type="button" className="sheet-manager-btn" onClick={handleSaveAsConfirm}>Save</button>
              <button type="button" className="sheet-manager-btn" onClick={() => setSaveAsOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
