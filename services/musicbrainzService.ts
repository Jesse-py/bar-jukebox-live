import type { MusicBrainzSong } from '../types';

const API_BASE_URL = 'https://musicbrainz.org/ws/2';

// MusicBrainz API requires a User-Agent header for all requests.
// See: https://musicbrainz.org/doc/XML_Web_Service/Rate_Limiting
const APP_USER_AGENT = 'BarJukeboxLive/1.0 ( https://example.com/contact )';

export const searchSongs = async (query: string, searchBy: 'song' | 'artist'): Promise<MusicBrainzSong[]> => {
  if (!query.trim()) {
    return [];
  }

  // Use Lucene syntax for targeted searches. artist:"query" or recording:"query"
  // This will search for songs (recordings) but prioritize the artist or title field.
  const searchField = searchBy === 'artist' ? 'artist' : 'recording';
  const luceneQuery = `${searchField}:"${query}"`;
  const encodedQuery = encodeURIComponent(luceneQuery);

  const url = `${API_BASE_URL}/recording/?query=${encodedQuery}&fmt=json&limit=15`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': APP_USER_AGENT,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`MusicBrainz API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.recordings && data.recordings.length > 0) {
      // Map the response to our clean MusicBrainzSong type
      return data.recordings.map((rec: any) => ({
        id: rec.id,
        title: rec.title,
        artist: rec['artist-credit']?.map((artist: any) => artist.name).join(', ') || 'Unknown Artist',
      }));
    }
    return [];
  } catch (error) {
    console.error("Failed to search songs on MusicBrainz:", error);
    // Propagate the error to be handled by the UI
    throw error;
  }
};