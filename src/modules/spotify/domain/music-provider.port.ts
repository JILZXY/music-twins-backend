export interface Track {
  trackId: string;
  name: string;
  artist: string;
  album: string;
  imageUrl: string | null;
  isPlaying: boolean;
}
export const MUSIC_PROVIDER_PORT = 'MUSIC_PROVIDER_PORT';
export interface MusicProviderPort {
  getNowPlaying(accessToken: string): Promise<Track | null>;
  getRecentlyPlayed(accessToken: string, limit: number): Promise<Track[]>;
  getTopTracks(accessToken: string, limit: number): Promise<Track[]>;
  refreshToken(refreshToken: string): Promise<{
    access_token: string;
    expires_in: number;
    refresh_token?: string;
  }>;
}
