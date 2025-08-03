import React, { useState } from 'react';
import axios from 'axios';

const BACKEND_URL = 'https://gachaplexbot.onrender.com'; // change to your backend URL
axios.defaults.withCredentials = true;

export default function App() {
  const [repoName, setRepoName] = useState('');
  const [desc, setDesc] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const generateBot = async () => {
    if (!repoName.trim()) {
      alert('Please enter a repo name');
      return;
    }
    setLoading(true);
    setRepoUrl('');
    try {
      const res = await axios.post(`${BACKEND_URL}/generate`, {
        name: repoName,
        description: desc,
      });
      setRepoUrl(res.data.repoUrl);
    } catch (e) {
      alert(e.response?.data || 'Error generating bot. Make sure you are logged in with GitHub.');
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 600, margin: 'auto', padding: 20, fontFamily: 'Arial, sans-serif' }}>
      <h1>GachaPlex Bot Generator</h1>

      <p>
        <a href={`${BACKEND_URL}/auth/github`} style={{ marginRight: 10 }}>Login with GitHub</a>
        <a href={`${BACKEND_URL}/auth/discord`}>Login with Discord</a>
      </p>

      <input
        type="text"
        placeholder="New repo name (e.g. my-cool-bot)"
        value={repoName}
        onChange={e => setRepoName(e.target.value)}
        style={{ width: '100%', padding: 8, marginBottom: 10 }}
      />

      <textarea
        placeholder="Describe your bot (optional)"
        rows={4}
        value={desc}
        onChange={e => setDesc(e.target.value)}
        style={{ width: '100%', padding: 8, marginBottom: 10 }}
      />

      <button onClick={generateBot} disabled={loading} style={{ padding: '10px 20px' }}>
        {loading ? 'Generating...' : 'Generate Bot'}
      </button>

      {repoUrl && (
        <p style={{ marginTop: 20 }}>
          Your bot repo is ready: <a href={repoUrl} target="_blank" rel="noreferrer">{repoUrl}</a>
        </p>
      )}
    </div>
  );
}
