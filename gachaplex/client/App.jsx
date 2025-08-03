import React, { useState, useEffect } from 'react';

const BACKEND_URL = 'https://gachaplexbot.onrender.com'; // your backend URL
const FRONTEND_URL = 'https://your-frontend-url.com'; // your frontend URL

function App() {
  const [githubLoggedIn, setGithubLoggedIn] = useState(false);
  const [discordLoggedIn, setDiscordLoggedIn] = useState(false);
  const [botName, setBotName] = useState('');
  const [botDesc, setBotDesc] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Simple check: you might want to create API endpoints to verify session status
  // For demo, just enable buttons to test OAuth redirect flow

  const handleGithubLogin = () => {
    window.location.href = `${BACKEND_URL}/auth/github`;
  };

  const handleDiscordLogin = () => {
    window.location.href = `${BACKEND_URL}/auth/discord`;
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setRepoUrl('');
    if (!botName || botName.length < 3) {
      setError('Bot name must be at least 3 characters');
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${BACKEND_URL}/generate`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: botName, description: botDesc }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to generate bot');
      }
      const data = await res.json();
      setRepoUrl(data.repoUrl);
    } catch (err) {
      setError(err.message || 'Error generating bot');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: 'auto', padding: 20, fontFamily: 'Arial' }}>
      <h1>GachaPlex Bot Generator</h1>

      <div style={{ marginBottom: 20 }}>
        <button onClick={handleGithubLogin} style={{ marginRight: 10 }}>
          Login with GitHub
        </button>
        <button onClick={handleDiscordLogin}>Login with Discord</button>
      </div>

      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Bot repo name"
          value={botName}
          onChange={e => setBotName(e.target.value)}
          style={{ width: '100%', padding: 8, marginBottom: 10 }}
        />
        <textarea
          placeholder="Bot description (optional)"
          value={botDesc}
          onChange={e => setBotDesc(e.target.value)}
          style={{ width: '100%', padding: 8, minHeight: 80 }}
        />
      </div>

      <button onClick={handleGenerate} disabled={loading}>
        {loading ? 'Generating...' : 'Generate Bot Repo'}
      </button>

      {error && (
        <div style={{ marginTop: 20, color: 'red' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {repoUrl && (
        <div style={{ marginTop: 20 }}>
          <strong>Bot Repo Created:</strong>{' '}
          <a href={repoUrl} target="_blank" rel="noopener noreferrer">
            {repoUrl}
          </a>
        </div>
      )}
    </div>
  );
}

export default App;
