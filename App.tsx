import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import CustomerView from './components/CustomerView';
import DjView from './components/DjView';
import type { SongRequest, CooldownSong, BlacklistedSong } from './types';
import { getFunFact } from './services/geminiService';

const DjViewWrapper: React.FC<{
  songRequests: SongRequest[];
  cooldownSongs: CooldownSong[];
  blacklist: BlacklistedSong[];
  handlePlaySong: (songId: string) => void;
  handleAddToBlacklist: (title: string, artist: string) => void;
  handleRemoveFromBlacklist: (songId: string) => void;
}> = (props) => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);

  if (queryParams.get('djMode') !== 'true') {
    return <Navigate to="/" replace />;
  }

  return <DjView {...props} />;
};

const App: React.FC = () => {
  const [songRequests, setSongRequests] = useState<SongRequest[]>(() => {
    try {
      const saved = localStorage.getItem('songRequests');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [cooldownSongs, setCooldownSongs] = useState<CooldownSong[]>(() => {
    try {
      const saved = localStorage.getItem('cooldownSongs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [blacklist, setBlacklist] = useState<BlacklistedSong[]>(() => {
    try {
      const saved = localStorage.getItem('blacklist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // State for customer view feedback
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [geminiFact, setGeminiFact] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const COOLDOWN_DURATION = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

  // Persist state to localStorage
  useEffect(() => {
    localStorage.setItem('songRequests', JSON.stringify(songRequests));
  }, [songRequests]);

  useEffect(() => {
    localStorage.setItem('cooldownSongs', JSON.stringify(cooldownSongs));
  }, [cooldownSongs]);

  useEffect(() => {
    localStorage.setItem('blacklist', JSON.stringify(blacklist));
  }, [blacklist]);

  // Listen for changes from other tabs
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'songRequests' && e.newValue) {
        setSongRequests(JSON.parse(e.newValue));
      }
      if (e.key === 'cooldownSongs' && e.newValue) {
        setCooldownSongs(JSON.parse(e.newValue));
      }
      if (e.key === 'blacklist' && e.newValue) {
        setBlacklist(JSON.parse(e.newValue));
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);


  // Periodically clean up expired cooldowns
  useEffect(() => {
    const interval = setInterval(() => {
      setCooldownSongs(prev => prev.filter(song => song.cooldownUntil > Date.now()));
    }, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const clearMessages = useCallback(() => {
    setGeminiFact(null);
    setError(null);
  }, []);
  
  const generateSongId = (title: string, artist: string) => {
    return `${artist.toLowerCase().trim().replace(/\s+/g, '-')}-${title.toLowerCase().trim().replace(/\s+/g, '-')}`;
  };

  const handleRequestSong = useCallback(async (title: string, artist: string) => {
    clearMessages();
    setIsLoading(true);

    const songId = generateSongId(title, artist);

    if (blacklist.some(song => song.id === songId)) {
        setError(`"${title}" is not available for request.`);
        setIsLoading(false);
        return;
    }

    if (cooldownSongs.some(song => song.id === songId)) {
      setError(`"${title}" was played recently. Please wait a bit before requesting it again.`);
      setIsLoading(false);
      return;
    }

    // Fetch fun fact while processing the request
    const factPromise = getFunFact(title, artist);

    setSongRequests(prev => {
      const existingRequest = prev.find(req => req.id === songId);
      if (existingRequest) {
        return prev.map(req =>
          req.id === songId ? { ...req, requestCount: req.requestCount + 1 } : req
        );
      }
      return [...prev, { id: songId, title, artist, requestCount: 1 }];
    });
    
    const fact = await factPromise;
    setGeminiFact(fact);
    setIsLoading(false);
  }, [cooldownSongs, blacklist, clearMessages]);

  const handlePlaySong = useCallback((songId: string) => {
    const songToPlay = songRequests.find(req => req.id === songId);
    if (!songToPlay) return;

    // Remove from requests
    setSongRequests(prev => prev.filter(req => req.id !== songId));

    // Add to cooldown
    setCooldownSongs(prev => [...prev, {
      ...songToPlay,
      cooldownUntil: Date.now() + COOLDOWN_DURATION,
    }]);
  }, [songRequests, COOLDOWN_DURATION]);

  const handleAddToBlacklist = useCallback((title: string, artist: string) => {
    const songId = generateSongId(title, artist);
    const blacklistedSong: BlacklistedSong = { id: songId, title, artist };

    setBlacklist(prev => {
        if (prev.some(s => s.id === songId)) {
            return prev; // Already blacklisted
        }
        return [...prev, blacklistedSong];
    });

    // Also remove any pending requests for this song
    setSongRequests(prev => prev.filter(req => req.id !== songId));
  }, []);

  const handleRemoveFromBlacklist = useCallback((songId: string) => {
    setBlacklist(prev => prev.filter(song => song.id !== songId));
  }, []);
  
  const NavLinks = () => {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const isDj = location.pathname === '/dj' && queryParams.get('djMode') === 'true';
    const view = isDj ? 'dj' : 'customer';

    const linkClasses = (buttonView: 'customer' | 'dj') => {
        const base = "px-6 py-2 rounded-full font-semibold transition-all duration-300";
        const activeClasses = view === buttonView ? `text-slate-900 shadow-lg` : 'bg-transparent text-slate-300';
        const colorClass = buttonView === 'customer' ? 'bg-cyan-400' : 'bg-pink-400';
        return `${base} ${view === buttonView ? colorClass : ''} ${activeClasses}`;
    };

    return (
        <div className="flex justify-center mb-10">
            <div className="bg-slate-800 p-1.5 rounded-full flex items-center space-x-2 border border-slate-700">
                <Link to="/" className={linkClasses('customer')}>
                    Customer
                </Link>
                {isDj && (
                    <Link to="/dj?djMode=true" className={linkClasses('dj')}>
                        DJ
                    </Link>
                )}
            </div>
        </div>
    );
  };

  return (
    <Router>
      <div className="min-h-screen p-4 sm:p-6 md:p-8 bg-gradient-to-br from-slate-900 to-slate-800">
          <header className="text-center mb-8">
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-500">
                  Bar Jukebox Live
              </h1>
          </header>

          <NavLinks />

          <main>
              <Routes>
                  <Route path="/" element={
                      <CustomerView 
                          handleRequestSong={handleRequestSong} 
                          blacklist={blacklist}
                          isLoading={isLoading}
                          geminiFact={geminiFact}
                          error={error}
                          clearMessages={clearMessages}
                      />
                  } />
                  <Route path="/dj" element={
                      <DjViewWrapper 
                          songRequests={songRequests} 
                          cooldownSongs={cooldownSongs}
                          blacklist={blacklist}
                          handlePlaySong={handlePlaySong}
                          handleAddToBlacklist={handleAddToBlacklist}
                          handleRemoveFromBlacklist={handleRemoveFromBlacklist}
                      />
                  } />
              </Routes>
          </main>
          
          <footer className="text-center text-slate-500 mt-12 text-sm">
              <p>Powered by React, Tailwind, and Gemini</p>
          </footer>
      </div>
    </Router>
  );
};

export default App;