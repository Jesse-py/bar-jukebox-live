
import React, { useState, useEffect, useRef } from 'react';
import type { SongRequest, CooldownSong } from '../types';
import PlayIcon from './icons/PlayIcon';
import ClockIcon from './icons/ClockIcon';

interface DjViewProps {
  songRequests: SongRequest[];
  cooldownSongs: CooldownSong[];
  handlePlaySong: (songId: string) => void;
}

const formatTime = (ms: number): string => {
    if (ms <= 0) return "00:00:00";
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
};


const CooldownItem: React.FC<{ song: CooldownSong }> = ({ song }) => {
    const [timeRemaining, setTimeRemaining] = useState(song.cooldownUntil - Date.now());

    useEffect(() => {
        const interval = setInterval(() => {
            const remaining = song.cooldownUntil - Date.now();
            setTimeRemaining(remaining > 0 ? remaining : 0);
        }, 1000);
        return () => clearInterval(interval);
    }, [song.cooldownUntil]);
    
    return (
        <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <div>
                <p className="font-semibold text-slate-300">{song.title}</p>
                <p className="text-sm text-slate-400">{song.artist}</p>
            </div>
            <div className="flex items-center space-x-2 text-yellow-400">
                <ClockIcon className="w-5 h-5"/>
                <span className="font-mono text-sm">{formatTime(timeRemaining)}</span>
            </div>
        </div>
    );
};


const DjView: React.FC<DjViewProps> = ({ songRequests, cooldownSongs, handlePlaySong }) => {
  const sortedRequests = [...songRequests].sort((a, b) => b.requestCount - a.requestCount);
  const requestsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (requestsRef.current) {
      requestsRef.current.scrollTop = 0;
    }
  }, [songRequests]);

  return (
    <div className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
      {/* Top Requests */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 shadow-lg shadow-pink-500/10">
        <h2 className="text-2xl font-bold mb-4 text-pink-400">Top Requests</h2>
        <div ref={requestsRef} className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
            {sortedRequests.length > 0 ? sortedRequests.map((song) => (
                <div key={song.id} className="flex items-center justify-between p-4 bg-slate-900/60 rounded-lg border border-slate-700 group">
                    <div>
                        <p className="font-semibold text-slate-200">{song.title}</p>
                        <p className="text-sm text-slate-400">{song.artist}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <span className="text-lg font-bold bg-pink-500 text-white rounded-full h-8 w-8 flex items-center justify-center">{song.requestCount}</span>
                        <button 
                            onClick={() => handlePlaySong(song.id)}
                            className="bg-green-500 text-white p-2 rounded-full transform transition-all duration-200 hover:bg-green-400 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-50"
                        >
                            <PlayIcon className="w-5 h-5"/>
                        </button>
                    </div>
                </div>
            )) : <p className="text-slate-400 italic text-center py-8">No requests yet. The night is young!</p>}
        </div>
      </div>
      
      {/* On Cooldown */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 shadow-lg shadow-yellow-500/10">
        <h2 className="text-2xl font-bold mb-4 text-yellow-400">On Cooldown</h2>
         <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
            {cooldownSongs.length > 0 ? cooldownSongs.map((song) => (
                <CooldownItem key={song.id} song={song} />
            )) : <p className="text-slate-400 italic text-center py-8">No songs on cooldown.</p>}
        </div>
      </div>
    </div>
  );
};

export default DjView;
