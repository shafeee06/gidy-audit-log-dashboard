import { useEffect, useRef, useState } from 'react';
import { FileJson, Layers, RefreshCw, Upload, X } from 'lucide-react';
import { bulkUpload } from '../services/api';

export function UploadModal({ open, onClose, onUploaded, onSuccess, existingCount = 0 }) {
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [recordCount, setRecordCount] = useState(0);
  const [mode, setMode] = useState('append');
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setMode(existingCount > 0 ? 'append' : 'replace');
      setMessage('');
      setMessageType('');
    }
  }, [open, existingCount]);

  if (!open) return null;

  async function selectFile(nextFile) {
    setFile(nextFile || null);
    setMessage('');
    setMessageType('');
    setRecordCount(0);
    if (!nextFile) return;

    try {
      const records = JSON.parse(await nextFile.text());
      if (!Array.isArray(records)) throw new Error('The JSON root must be an array.');
      if (records.length === 0) throw new Error('The JSON array must contain at least one record.');
      if (records.length > 10000) throw new Error('A maximum of 10,000 records is allowed per request.');
      setRecordCount(records.length);
    } catch (error) {
      setMessageType('error');
      setMessage(error.message || 'The selected file is not valid JSON.');
    }
  }

  async function submit() {
    if (!file) {
      setMessageType('error');
      return setMessage('Choose a JSON file containing an array of audit logs.');
    }

    setBusy(true);
    setMessage('');
    setMessageType('');
    try {
      const records = JSON.parse(await file.text());
      if (!Array.isArray(records)) throw new Error('The JSON root must be an array.');
      if (records.length < 1 || records.length > 10000) throw new Error('The file must contain between 1 and 10,000 records.');

      const result = await bulkUpload(records, existingCount > 0 ? mode : 'replace', (event) => {
        if (event.total) setProgress(Math.round((event.loaded / event.total) * 100));
      });

      const elapsed = result.processingTimeMs ? ` in ${(result.processingTimeMs / 1000).toFixed(2)} seconds` : '';
      const successText = result.mode === 'replace'
        ? `${result.deletedCount.toLocaleString()} old records removed and ${result.insertedCount.toLocaleString()} new records uploaded${elapsed}.`
        : `${result.insertedCount.toLocaleString()} records added${elapsed}. The database now contains ${result.totalCount.toLocaleString()} records.`;

      setMessageType('success');
      setMessage(successText);
      await onUploaded();
      onSuccess?.(successText);
      setFile(null);
      setRecordCount(0);
      setProgress(0);
      if (fileRef.current) fileRef.current.value = '';
      setTimeout(onClose, 800);
    } catch (error) {
      setMessageType('error');
      const details = error.response?.data?.errors?.[0];
      setMessage(details ? `${details.path}: ${details.message}` : (error.response?.data?.message || error.message || 'Upload failed.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={busy ? undefined : onClose}>
      <section className="modal" role="dialog" aria-modal="true" aria-label="Bulk upload audit logs" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div><p className="eyebrow">DATA INGESTION</p><h2>Bulk upload logs</h2></div>
          <button className="icon-button" onClick={onClose} disabled={busy} aria-label="Close"><X /></button>
        </div>
        <p className="muted">Upload a JSON array with up to 10,000 records in one request.</p>

        <button className="drop-zone" type="button" disabled={busy} onClick={() => fileRef.current?.click()}>
          <FileJson size={34} />
          <strong>{file ? file.name : 'Choose a JSON file'}</strong>
          <span>{file ? `${recordCount.toLocaleString()} records • ${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Click to browse'}</span>
        </button>
        <input ref={fileRef} hidden type="file" accept="application/json,.json" onChange={(e) => selectFile(e.target.files?.[0] || null)} />

        {existingCount > 0 && file && recordCount > 0 && (
          <div className="upload-choice">
            <p><strong>{existingCount.toLocaleString()} records already exist.</strong> Choose how to handle the new file:</p>
            <label className={mode === 'append' ? 'selected' : ''}>
              <input type="radio" name="upload-mode" value="append" checked={mode === 'append'} onChange={() => setMode('append')} />
              <Layers size={20} />
              <span><strong>Add to existing data</strong><small>Keep the current {existingCount.toLocaleString()} records and add these {recordCount.toLocaleString()} records.</small></span>
            </label>
            <label className={mode === 'replace' ? 'selected danger-choice' : ''}>
              <input type="radio" name="upload-mode" value="replace" checked={mode === 'replace'} onChange={() => setMode('replace')} />
              <RefreshCw size={20} />
              <span><strong>Replace existing data</strong><small>Delete all {existingCount.toLocaleString()} current records and keep only these {recordCount.toLocaleString()} records.</small></span>
            </label>
          </div>
        )}

        {busy && <div className="progress"><div style={{ width: `${progress}%` }} /></div>}
        {message && <p className={`upload-message ${messageType}`}>{message}</p>}
        <div className="modal-actions">
          <button className="secondary-button" disabled={busy} onClick={onClose}>Cancel</button>
          <button className="primary-button" disabled={busy || !file || recordCount === 0} onClick={submit}>
            <Upload size={17} /> {busy ? (progress < 100 ? `Uploading ${progress}%...` : 'Processing records...') : (existingCount > 0 && mode === 'replace' ? 'Replace and upload' : 'Upload logs')}
          </button>
        </div>
      </section>
    </div>
  );
}
