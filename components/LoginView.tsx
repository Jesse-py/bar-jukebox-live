import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface LoginViewProps {
  onLogin: () => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLoginAttempt = (e: React.FormEvent) => {
    e.preventDefault();
    // Hardcoded credentials as per the request
    if (username === 'Cowboy' && password === 'Thecowboyisthebest') {
      setError('');
      onLogin();
      navigate('/dj', { replace: true });
    } else {
      setError('Invalid username or password.');
      setPassword('');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto animate-fade-in">
      <form onSubmit={handleLoginAttempt} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 space-y-6 shadow-lg shadow-pink-500/10">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-pink-400">DJ Login</h2>
          <p className="text-slate-400 mt-1">Enter your credentials to access the DJ panel.</p>
        </div>
        
        {error && <p className="text-red-400 text-center bg-red-900/50 border border-red-500/50 rounded-md p-3">{error}</p>}

        <div>
          <label htmlFor="username" className="block text-sm font-medium text-slate-300 mb-1">Username</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-pink-500 hover:bg-pink-400 text-slate-900 font-bold py-3 px-4 rounded-lg transition-all"
        >
          Login
        </button>
      </form>
    </div>
  );
};

export default LoginView;