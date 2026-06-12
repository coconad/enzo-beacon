import { useState, useEffect, useRef, useCallback } from 'react';
import { useBeacon } from './hooks/useBeacon.js';
import { csvToRecords } from './utils/csv.js';
import Sidebar from './components/Sidebar.jsx';
import GradientBackground from './components/ui/GradientBackground.jsx';
import Toast, { useToast } from './components/Toast.jsx';
import Modal from './components/Modal.jsx';
import DigestView from './components/views/DigestView.jsx';
import InboxView from './components/views/InboxView.jsx';
import KanbanView from './components/views/KanbanView.jsx';
import SettingsView from './components/views/SettingsView.jsx';

export default function App() {
  const [view, setView] = useState('digest');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const { msg, visible, toast } = useToast();

  const {
    state,
    updateRecord,
    moveRecord,
    resetWeights,
    setWeights,
    setDigestSize,
    setSlackWebhook,
    setEarliestOnly,
    importState,
    addRecords,
    resetToSeed,
  } = useBeacon();

  // Toast when the Sales Navigator extension injects new leads
  const prevCountRef = useRef(null);
  useEffect(() => {
    if (prevCountRef.current === null) {
      prevCountRef.current = state.records.length;
      return;
    }
    const diff = state.records.length - prevCountRef.current;
    if (diff > 0) {
      toast(`✓ ${diff} lead${diff !== 1 ? 's' : ''} imported from Sales Navigator`);
      prevCountRef.current = state.records.length;
    }
  }, [state.records.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- CSV import: drag-drop anywhere, or one click on "Import CSV" ----
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const dragDepth = useRef(0);

  const importCsvFile = useCallback(async (file) => {
    if (!file) return;
    const text = await file.text();
    const { records, skipped } = csvToRecords(text);
    if (!records.length) {
      toast(skipped > 0 ? 'No usable rows in that CSV' : 'Could not read that CSV — is it comma-separated with a header row?');
      return;
    }
    const added = addRecords(records);
    // Pre-bump the count so the storage-event toast doesn't double-fire
    if (prevCountRef.current !== null) prevCountRef.current += added;
    const dupes = records.length - added;
    if (added === 0) {
      toast(`All ${records.length} lead${records.length !== 1 ? 's' : ''} already in Beacon`);
      return;
    }
    toast(`✓ ${added} lead${added !== 1 ? 's' : ''} imported${dupes ? ` · ${dupes} duplicate${dupes !== 1 ? 's' : ''} skipped` : ''}`);
    setView('inbox');
  }, [addRecords, toast]);

  useEffect(() => {
    function onDragEnter(e) {
      if (e.dataTransfer?.types?.includes('Files')) {
        dragDepth.current++;
        setDragOver(true);
      }
    }
    function onDragLeave() {
      dragDepth.current = Math.max(0, dragDepth.current - 1);
      if (dragDepth.current === 0) setDragOver(false);
    }
    function onDragOver(e) { e.preventDefault(); }
    function onDrop(e) {
      e.preventDefault();
      dragDepth.current = 0;
      setDragOver(false);
      const file = [...(e.dataTransfer?.files || [])].find(f => /\.(csv|tsv|txt)$/i.test(f.name));
      if (file) importCsvFile(file);
    }
    window.addEventListener('dragenter', onDragEnter);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragenter', onDragEnter);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('drop', onDrop);
    };
  }, [importCsvFile]);

  function openImport() {
    fileInputRef.current?.click();
  }

  function openAdd() {
    setEditingId(null);
    setModalOpen(true);
  }

  function openEdit(id) {
    setEditingId(id);
    setModalOpen(true);
  }

  const editingRecord = editingId ? state.records.find(r => r.id === editingId) : null;

  return (
    <div className="shell">
      <GradientBackground />
      <Sidebar view={view} setView={setView} />
      <main className="main">
        {view === 'digest' && (
          <DigestView
            state={state}
            setEarliestOnly={setEarliestOnly}
            onAdd={openAdd}
            onImport={openImport}
            onEdit={openEdit}
          />
        )}
        {view === 'inbox' && (
          <InboxView
            state={state}
            onAdd={openAdd}
            onImport={openImport}
            onEdit={openEdit}
          />
        )}
        {view === 'kanban' && (
          <KanbanView
            state={state}
            moveRecord={moveRecord}
            onEdit={openEdit}
            onToast={toast}
          />
        )}
        {view === 'settings' && (
          <SettingsView
            state={state}
            setWeights={setWeights}
            resetWeights={resetWeights}
            setDigestSize={setDigestSize}
            setSlackWebhook={setSlackWebhook}
            importState={importState}
            resetToSeed={resetToSeed}
            onToast={toast}
          />
        )}
      </main>

      <Modal
        open={modalOpen}
        record={editingRecord}
        onSave={updateRecord}
        onClose={() => setModalOpen(false)}
        onToast={toast}
      />
      <Toast msg={msg} visible={visible} />

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.tsv,.txt,text/csv"
        style={{ display: 'none' }}
        onChange={e => { importCsvFile(e.target.files[0]); e.target.value = ''; }}
      />
      {dragOver && (
        <div className="drop-overlay" aria-hidden="true">
          <div className="drop-overlay-card">
            <div className="drop-overlay-icon">⇪</div>
            Drop your Sales Navigator CSV to import
          </div>
        </div>
      )}
    </div>
  );
}
