'use client';

import { Cpu, User } from 'lucide-react';

export default function SettingsPanel({
  apiKey, setApiKey,
  baseUrl, setBaseUrl,
  model, setModel,
  persona, setPersona,
  saveSettings
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }} className="animate-fade-in">
      <div className="glass-panel">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <Cpu size={20} className="text-gradient" /> API Settings
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>API Key</label>
            <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="sk-..." />
          </div>
          <div>
            <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Base URL</label>
            <input type="text" value={baseUrl} onChange={e => setBaseUrl(e.target.value)} placeholder="https://api.openai.com/v1" />
          </div>
          <div>
            <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Model</label>
            <input type="text" value={model} onChange={e => setModel(e.target.value)} placeholder="gpt-3.5-turbo" />
          </div>
          <button className="btn btn-secondary" onClick={saveSettings}>Save Settings</button>
        </div>
      </div>

      <div className="glass-panel">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <User size={20} className="text-gradient" /> Student Persona
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Education Level</label>
            <input type="text" value={persona.level} onChange={e => setPersona({...persona, level: e.target.value})} placeholder="e.g. Primary School, College" />
          </div>
          <div>
            <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Writing Style</label>
            <input type="text" value={persona.style} onChange={e => setPersona({...persona, style: e.target.value})} placeholder="e.g. Casual, Academic, Immature" />
          </div>
          <div>
            <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Important Constraints</label>
            <textarea value={persona.constraints} onChange={e => setPersona({...persona, constraints: e.target.value})} rows={3} placeholder="What should the AI avoid?"></textarea>
          </div>
        </div>
      </div>
    </div>
  );
}
