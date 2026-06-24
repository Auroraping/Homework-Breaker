'use client';

import { useState, useEffect } from 'react';
import { Play } from 'lucide-react';

import SettingsPanel from '@/components/SettingsPanel';
import TaskInputPanel from '@/components/TaskInputPanel';
import ResultPanel from '@/components/ResultPanel';

export default function Home() {
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('https://api.openai.com/v1');
  const [model, setModel] = useState('gpt-3.5-turbo');

  const [persona, setPersona] = useState({
    level: 'College Freshman',
    style: 'Casual but Academic',
    constraints: 'Avoid using extremely advanced vocabulary or PhD-level analysis. Keep it natural.'
  });

  const [requirements, setRequirements] = useState('');
  const [contextFiles, setContextFiles] = useState([]);
  const [contextText, setContextText] = useState('');

  const [status, setStatus] = useState('idle'); // idle, parsing, agent_drafting, agent_reflecting, done, error
  const [statusMessage, setStatusMessage] = useState('');
  const [resultText, setResultText] = useState('');

  // Load API key from local storage if exists
  useEffect(() => {
    const savedKey = localStorage.getItem('hw_api_key');
    const savedUrl = localStorage.getItem('hw_base_url');
    const savedModel = localStorage.getItem('hw_model');
    if (savedKey) setApiKey(savedKey);
    if (savedUrl) setBaseUrl(savedUrl);
    if (savedModel) setModel(savedModel);
  }, []);

  const saveSettings = () => {
    localStorage.setItem('hw_api_key', apiKey);
    localStorage.setItem('hw_base_url', baseUrl);
    localStorage.setItem('hw_model', model);
    alert('Settings saved successfully!');
  };

  const startAgent = async () => {
    if (!apiKey) return alert('Please enter your API Key in the Settings panel.');
    if (!requirements) return alert('Please enter the assignment requirements.');

    setStatus('agent_drafting');
    setStatusMessage('Connecting to AI Agent...');
    setResultText('');

    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey, baseUrl, model, persona, requirements, contextText
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to connect to Agent');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let done = false;
      let finalOutput = '';

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('event: status')) {
              const data = JSON.parse(lines[lines.indexOf(line) + 1].replace('data: ', ''));
              setStatus(data.step === 'reflecting' ? 'agent_reflecting' : 'agent_drafting');
              setStatusMessage(data.message);
            } else if (line.startsWith('event: token')) {
              const data = JSON.parse(lines[lines.indexOf(line) + 1].replace('data: ', ''));
              finalOutput += data.text;
              setResultText(finalOutput);
            } else if (line.startsWith('event: done')) {
              setStatus('done');
              setStatusMessage('Assignment completed successfully!');
            } else if (line.startsWith('event: error')) {
              const data = JSON.parse(lines[lines.indexOf(line) + 1].replace('data: ', ''));
              throw new Error(data.message);
            }
          }
        }
      }
    } catch (err) {
      setStatus('error');
      setStatusMessage(`Error: ${err.message}`);
    }
  };

  return (
    <div className="main-container">
      
      <header style={{ textAlign: 'center', marginBottom: '40px' }} className="animate-fade-in">
        <h1 className="text-gradient page-title" style={{ fontSize: '3rem', marginBottom: '10px' }}>Homework-Breaker</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>Your intelligent, undercover assignment agent</p>
      </header>

      <div className="grid-layout">
        
        {/* Left Column: Settings & Persona */}
        <SettingsPanel 
          apiKey={apiKey} setApiKey={setApiKey}
          baseUrl={baseUrl} setBaseUrl={setBaseUrl}
          model={model} setModel={setModel}
          persona={persona} setPersona={setPersona}
          saveSettings={saveSettings}
        />

        {/* Right Column: Workflow */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }} className="animate-fade-in">
          
          <TaskInputPanel 
            requirements={requirements} setRequirements={setRequirements}
            contextFiles={contextFiles} setContextFiles={setContextFiles}
            contextText={contextText} setContextText={setContextText}
            setStatus={setStatus} setStatusMessage={setStatusMessage}
          />

          <div style={{ textAlign: 'center' }}>
            <button 
              className={`btn btn-primary ${['agent_drafting', 'agent_reflecting'].includes(status) ? 'animate-pulse-glow' : ''}`}
              style={{ fontSize: '1.2rem', padding: '16px 40px', borderRadius: '30px' }}
              onClick={startAgent}
              disabled={status === 'parsing' || status === 'agent_drafting' || status === 'agent_reflecting'}
            >
              <Play size={24} /> {status === 'idle' || status === 'done' || status === 'error' ? 'Start Agent Workflow' : 'Agent is Working...'}
            </button>
            {statusMessage && (
              <p style={{ marginTop: '15px', color: status === 'error' ? '#ef4444' : 'var(--text-secondary)' }}>
                {statusMessage}
              </p>
            )}
          </div>

          <ResultPanel resultText={resultText} status={status} />

        </div>
      </div>
    </div>
  );
}
