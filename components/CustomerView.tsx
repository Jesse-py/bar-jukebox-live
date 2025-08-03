import React, { useState, useEffect } from 'react';
import MusicIcon from './icons/MusicIcon';
import { searchSongs } from '../services/musicbrainzService';
import type { MusicBrainzSong, BlacklistedSong } from '../types';

interface CustomerViewProps {
  handleRequestSong: (title: string, artist: string) => Promise<void>;
  blacklist: BlacklistedSong[];
  isLoading: boolean;
  geminiFact: string | null;
  error: string | null;
  clearMessages: () => void;
}

const CustomerView: React.FC<CustomerViewProps> = ({ handleRequestSong, blacklist, isLoading, geminiFact, error, clearMessages }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MusicBrainzSong[]>([]);
  const [selectedSong, setSelectedSong] = useState<MusicBrainzSong | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchBy, setSearchBy] = useState<'song' | 'artist'>('song');

  const generateSongId = (title: string, artist: string): string => {
    return `${artist.toLowerCase().trim().replace(/\s+/g, '-')}-${title.toLowerCase().trim().replace(/\s+/g, '-')}`;
  };

  // Debounced search effect
  useEffect(() => {
    // Don't search if the query is empty or if it matches the selected song
    if (!query || (selectedSong && `${selectedSong.title} - ${selectedSong.artist}` === query)) {
      setResults([]);
      return;
    }

    // Clear selection if user types again
    if (selectedSong) setSelectedSong(null);

    const debounceSearch = setTimeout(async () => {
      setIsSearching(true);
      setSearchError(null);
      try {
        const songs = await searchSongs(query, searchBy);
        // Filter out blacklisted songs before showing them to the user. [5, 8]
        const filteredSongs = songs.filter(song => {
            const songId = generateSongId(song.title, song.artist);
            return !blacklist.some(blacklistedSong => blacklistedSong.id === songId);
        });
        setResults(filteredSongs);
      } catch (err) {
        setSearchError('Could not fetch song results. Please try again.');
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300); // 300ms debounce timer

    return () => clearTimeout(debounceSearch);
  }, [query, selectedSong, searchBy, blacklist]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSong) {
      handleRequestSong(selectedSong.title, selectedSong.artist);
      setQuery('');
      setSelectedSong(null);
      setResults([]);
    }
  };
  
  const handleManualSubmit = () => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    // Try to parse "Artist - Title"
    const parts = trimmedQuery.split(' - ');
    const artist = parts.length > 1 ? parts.pop()?.trim() || '' : 'Unknown Artist';
    const title = parts.join(' - ').trim();

    const songId = generateSongId(title, artist);
    if (blacklist.some(s => s.id === songId)) {
        setSearchError(`"${title}" is not available for request.`);
        return;
    }

    if (title) {
        handleRequestSong(title, artist);
        setQuery('');
        setSelectedSong(null);
        setResults([]);
    } else {
        setSearchError("Please enter a song title to request.");
    }
  };
  
  const handleSelectSong = (song: MusicBrainzSong) => {
    setSelectedSong(song);
    setQuery(`${song.title} - ${song.artist}`);
    setResults([]); // Hide results list
  };

  const handleInputClick = () => {
    // When user clicks the input, clear the results to hide the dropdown
    if (results.length > 0) {
        setResults([]);
    }
  };

  const handleNewRequest = () => {
    clearMessages();
  };

  const handleSearchByChange = (type: 'song' | 'artist') => {
    setSearchBy(type);
    setQuery('');
    setResults([]);
    setSelectedSong(null);
  };

  if (geminiFact || error) {
    return (
        <div className="w-full max-w-md mx-auto animate-fade-in">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 text-center shadow-lg shadow-cyan-500/10">
                {error ? (
                    <>
                        <h3 className="text-xl font-bold text-red-400 mb-4">Request Blocked</h3>
                        <p className="text-slate-300">{error}</p>
                    </>
                ) : (
                    <>
                        <h3 className="text-xl font-bold text-cyan-400 mb-4">Request Sent!</h3>
                        <p className="text-slate-300 italic">"{geminiFact}"</p>
                    </>
                )}
                <button
                    onClick={handleNewRequest}
                    className="mt-8 w-full bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105"
                >
                    Request Another Song
                </button>
            </div>
        </div>
    );
  }


  return (
    <div className="w-full max-w-md mx-auto animate-fade-in">
      <form onSubmit={handleSubmit} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 space-y-6 shadow-lg shadow-cyan-500/10">
        <div className="text-center">
            <MusicIcon className="w-12 h-12 mx-auto text-cyan-400 mb-2"/>
            <h2 className="text-3xl font-bold tracking-tight">Request a Song</h2>
            <p className="text-slate-400 mt-1">Let the DJ know what you want to hear!</p>
        </div>

        <div>
            <div className="bg-slate-900/50 p-1 rounded-full flex items-center mb-4 border border-slate-700">
                <button
                    type="button"
                    onClick={() => handleSearchByChange('song')}
                    className={`w-1/2 py-1.5 text-sm font-semibold rounded-full transition-colors duration-200 ${searchBy === 'song' ? 'bg-cyan-500 text-slate-900 shadow-md' : 'text-slate-300 hover:bg-slate-700/50'}`}
                >
                    By Song
                </button>
                <button
                    type="button"
                    onClick={() => handleSearchByChange('artist')}
                    className={`w-1/2 py-1.5 text-sm font-semibold rounded-full transition-colors duration-200 ${searchBy === 'artist' ? 'bg-cyan-500 text-slate-900 shadow-md' : 'text-slate-300 hover:bg-slate-700/50'}`}
                >
                    By Artist
                </button>
            </div>
            <div className="relative">
                <label htmlFor="song-search" className="block text-sm font-medium text-slate-300 mb-1">
                    {searchBy === 'song' ? 'Song Title' : 'Artist Name'}
                </label>
                <input
                    type="text"
                    id="song-search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onClick={handleInputClick}
                    placeholder={searchBy === 'song' ? "e.g., Bohemian Rhapsody - Queen" : "e.g., Queen"}
                    required
                    autoComplete="off"
                    className="w-full bg-slate-900/50 border border-slate-600 rounded-lg pl-4 pr-10 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all duration-300"
                />
                {(isSearching || isLoading) && <div className="absolute right-3 top-[42px] w-5 h-5 border-2 border-t-transparent border-cyan-400 rounded-full animate-spin"></div>}

                {/* Search Results */}
                {results.length > 0 && (
                    <ul className="absolute z-10 w-full mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-60 overflow-y-auto animate-fade-in-fast">
                        {results.map((song) => (
                            <li key={song.id} 
                                onClick={() => handleSelectSong(song)}
                                className="px-4 py-3 cursor-pointer hover:bg-cyan-500/10 transition-colors"
                            >
                                <p className="font-semibold text-slate-200">{song.title}</p>
                                <p className="text-sm text-slate-400">{song.artist}</p>
                            </li>
                        ))}
                    </ul>
                )}
                {searchError && <p className="text-red-400 text-sm mt-2">{searchError}</p>}
                </div>
        </div>
        
        <button
          type="submit"
          disabled={isLoading || isSearching || !selectedSong}
          className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-600 disabled:cursor-not-allowed text-slate-900 font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2"
        >
          {isLoading ? (
            <>
                <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                <span>Submitting...</span>
            </>
          ) : (
            <span>Send Request</span>
          )}
        </button>

        {/* Manual submit button */}
        {query && !isSearching && !selectedSong && results.length === 0 && (
            <div className="text-center pt-2">
                <p className="text-slate-400 text-sm mb-2">Can't find it? Request what you typed.</p>
                 <button
                    type="button"
                    onClick={handleManualSubmit}
                    disabled={isLoading}
                    className="w-full bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:cursor-not-allowed text-slate-200 font-bold py-2 px-4 rounded-lg transition-colors duration-300"
                >
                    Request "{query}"
                </button>
                 <p className="text-xs text-slate-500 mt-2">Pro-tip: Format as "Song Title - Artist"</p>
            </div>
        )}
      </form>
    </div>
  );
};

export default CustomerView;