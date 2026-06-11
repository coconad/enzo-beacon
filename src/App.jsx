import { useState, useEffect, useRef } from 'react';
import { useBeacon } from './hooks/useBeacon.js';
import Sidebar from './components/Sidebar.jsx';
import Toast, { useToast } from './components/Toast.jsx';
import Modal from './components/Modal.jsx';
import DigestView from './components/views/DigestView.jsx';
import InboxView from './components/views/InboxView.jsx';
import KanbanView from './components/views/KanbanView.jsx';
import OutreachView from './components/views/OutreachView.jsx';
import SettingsView from './components/views/SettingsView.jsx';

export default function App() {
  const [view, setView] = useState('digest');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [outreachId, setOutreachId] = useState(null);
  const { msg, visible, toast } = useToast();

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
    resetToSeed,
  } = useBeacon();

  function openAdd() {
    setEditingId(null);
    setModalOpen(true);
  }

  function openEdit(id) {
    setEditingId(id);
    setModalOpen(true);
  }

  function openDraft(id) {
    setOutreachId(id);
    setView('outreach');
  }

  const editingRecord = editingId ? state.records.find(r => r.id === editingId) : null;

  return (
    <div className="shell">
      <Sidebar view={view} setView={setView} />
      <main className="main">
        {view === 'digest' && (
          <DigestView
            state={state}
            setEarliestOnly={setEarliestOnly}
            onAdd={openAdd}
            onDraft={openDraft}
            onEdit={openEdit}
          />
        )}
        {view === 'inbox' && (
          <InboxView
            state={state}
            onAdd={openAdd}
            onEdit={openEdit}
            onDraft={openDraft}
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
        {view === 'outreach' && (
          <OutreachView
            state={state}
            selectedId={outreachId}
            setSelectedId={setOutreachId}
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
    </div>
  );
}
