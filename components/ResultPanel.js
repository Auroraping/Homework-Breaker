'use client';

import { CheckCircle2, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { marked } from 'marked';

export default function ResultPanel({ resultText, status }) {
  const exportDocx = async () => {
    if (!resultText) return;
    try {
      const html = marked(resultText);
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html })
      });
      
      if (!res.ok) throw new Error('Failed to generate DOCX');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'assignment.docx';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert(`Export error: ${err.message}`);
    }
  };

  if (!resultText) return null;

  return (
    <div className="glass-panel" style={{ marginTop: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
          <CheckCircle2 size={20} color="#10b981" /> Final Output
        </h3>
        <button className="btn btn-primary" onClick={exportDocx} disabled={status !== 'done'}>
          <Download size={16} /> Export to Word
        </button>
      </div>
      <div style={{ 
        background: 'rgba(0,0,0,0.2)', 
        padding: '20px', 
        borderRadius: '8px',
        lineHeight: '1.6',
        maxHeight: '500px',
        overflowY: 'auto'
      }}>
        <ReactMarkdown>{resultText}</ReactMarkdown>
      </div>
    </div>
  );
}
