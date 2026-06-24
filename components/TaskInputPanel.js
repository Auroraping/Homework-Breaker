'use client';

import { useRef } from 'react';
import { AlignLeft, UploadCloud, Trash2 } from 'lucide-react';

export default function TaskInputPanel({
  requirements, setRequirements,
  contextFiles, setContextFiles,
  contextText, setContextText,
  setStatus, setStatusMessage
}) {
  const fileInputRef = useRef(null);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setStatus('parsing');
    setStatusMessage(`Parsing ${files.length} file(s)...`);

    let combinedText = contextText;

    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch('/api/parse', { method: 'POST', body: formData });
        const data = await res.json();
        
        if (data.text) {
          combinedText += `\n--- Content from ${file.name} ---\n${data.text}\n`;
          setContextFiles(prev => [...prev, file.name]);
        } else {
          alert(`Could not parse ${file.name}`);
        }
      } catch (err) {
        alert(`Error parsing ${file.name}: ${err.message}`);
      }
    }

    setContextText(combinedText);
    setStatus('idle');
    setStatusMessage('');
  };

  return (
    <div className="glass-panel">
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <AlignLeft size={20} className="text-gradient" /> Assignment Requirements
      </h3>
      <textarea 
        value={requirements} 
        onChange={e => setRequirements(e.target.value)} 
        rows={5} 
        placeholder="Paste your assignment prompts, questions, or essay topics here..."
      ></textarea>
      
      <div style={{ marginTop: '20px' }}>
        <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>Reference Materials (PDF, DOCX, TXT)</h4>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={() => fileInputRef.current.click()}>
            <UploadCloud size={16} /> Upload Files
          </button>
          <input type="file" multiple ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} accept=".pdf,.docx,.txt,.md" />
          {contextFiles.map((file, idx) => (
            <span key={idx} style={{ background: 'rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: '16px', fontSize: '0.8rem', display: 'flex', alignItems: 'center' }}>
              {file}
            </span>
          ))}
          {contextFiles.length > 0 && (
            <button className="btn btn-secondary" style={{ padding: '6px 12px' }} onClick={() => { setContextFiles([]); setContextText(''); }}>
              <Trash2 size={14} /> Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
