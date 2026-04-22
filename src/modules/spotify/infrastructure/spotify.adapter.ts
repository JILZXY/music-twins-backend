import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MusicProviderPort, Track } from '../domain/music-provider.port';
@Injectable()
export class SpotifyAdapter implements MusicProviderPort {
  private readonly logger = new Logger(SpotifyAdapter.name);
  private readonly clientId: string;
  private readonly clientSecret: string;
  constructor(private readonly configService: ConfigService) {
    this.clientId = this.configService.get<string>('SPOTIFY_CLIENT_ID') || '';
    this.clientSecret = this.configService.get<string>('SPOTIFY_CLIENT_SECRET') || '';
  }
  async refreshToken(refreshToken: string): Promise<{ access_token: string; expires_in: number; refresh_token?: string }> {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    });
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
    };
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers,
      body: params,
    });
    if (!response.ok) {
      const errorBody = await response.text();
      this.logger.error(`Failed to refresh token: ${errorBody}`);
      throw new Error(`Spotify token refresh failed`);
    }
    return response.json() as Promise<any>;
  }
  async getNowPlaying(accessToken: string): Promise<Track | null> {
    const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (response.status === 204 || response.status === 202) {
      return null;
    }
    if (!response.ok) {
      const text = await response.text();
      this.logger.error(`Failed to get now playing: ${text}`);
      throw new Error(`Spotify currently playing fetch failed`);
    }
    const data = await response.json();
    if (!data || !data.item) return null;
    const track = data.item;
    return {
      trackId: track.id,
      name: track.name,
      artist: track.artists?.[0]?.name || 'Unknown Artist',
      album: track.album?.name || 'Unknown Album',
      imageUrl: track.album?.images?.[0]?.url || null,
      isPlaying: data.is_playing,
    };
  }
  async getRecentlyPlayed(accessToken: string, limit: number = 20): Promise<Track[]> {
    const response = await fetch(`https://api.spotify.com/v1/me/player/recently-played?limit=${limit}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      const text = await response.text();
      this.logger.error(`Failed to get recently played: ${text}`);
      throw new Error(`Spotify recently played fetch failed`);
    }
    const data = await response.json();
    if (!data.items) return [];
    return data.items.map((item: any) => {
      const track = item.track;
      return {
        trackId: track.id,
        name: track.name,
        artist: track.artists?.[0]?.name || 'Unknown Artist',
        album: track.album?.name || 'Unknown Album',
        imageUrl: track.album?.images?.[0]?.url || null,
        isPlaying: false, 
      };
    });
  }
  async getTopTracks(accessToken: string, limit: number = 20): Promise<Track[]> {
    const response = await fetch(`https://api.spotify.com/v1/me/top/tracks?limit=${limit}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      const text = await response.text();
      this.logger.error(`Failed to get top tracks: ${text}`);
      throw new Error(`Spotify top tracks fetch failed`);
    }
    const data = await response.json();
    if (!data.items) return [];
    return data.items.map((track: any) => {
      return {
        trackId: track.id,
        name: track.name,
        artist: track.artists?.[0]?.name || 'Unknown Artist',
        album: track.album?.name || 'Unknown Album',
        imageUrl: track.album?.images?.[0]?.url || null,
        isPlaying: false,
      };
    });
  }
}
