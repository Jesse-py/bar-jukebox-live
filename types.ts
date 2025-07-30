
export interface SongRequest {
  id: string; // "artist-title"
  title: string;
  artist: string;
  requestCount: number;
}

export interface CooldownSong {
  id: string; // "artist-title"
  title: string;
  artist: string;
  cooldownUntil: number; // Timestamp
}

export interface MusicBrainzSong {
  id: string; // MBID from MusicBrainz
  title: string;
  artist: string;
}
