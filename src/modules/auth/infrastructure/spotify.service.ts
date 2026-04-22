import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
  expires_in: number;
  refresh_token: string;
}
export interface SpotifyUserProfile {
  id: string;
  display_name: string;
  email: string;
  images: Array<{ url: string; height: number | null; width: number | null }>;
}
@Injectable()
export class SpotifyService {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;
  constructor(private readonly configService: ConfigService) {
    this.clientId = this.configService.get<string>('SPOTIFY_CLIENT_ID') || '';
    this.clientSecret = this.configService.get<string>('SPOTIFY_CLIENT_SECRET') || '';
    this.redirectUri = this.configService.get<string>('SPOTIFY_CALLBACK_URL') || '';
  }
  getAuthorizationUrl(state: string, codeChallenge: string): string {
    const scopes = [
      'user-read-private',
      'user-read-email',
      'user-read-currently-playing',
      'user-read-recently-played',
      'user-top-read',
    ].join(' ');
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      scope: scopes,
      redirect_uri: this.redirectUri,
      state: state,
      code_challenge_method: 'S256',
      code_challenge: codeChallenge,
    });
    return `https://accounts.spotify.com/authorize?${params.toString()}`;
  }
  async exchangeCodeForToken(code: string, codeVerifier: string): Promise<SpotifyTokenResponse> {
    const params = new URLSearchParams({
      client_id: this.clientId,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: this.redirectUri,
      code_verifier: codeVerifier,
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
      throw new Error(`Spotify token exchange failed: ${errorBody}`);
    }
    return response.json() as Promise<SpotifyTokenResponse>;
  }
  async getUserProfile(accessToken: string): Promise<SpotifyUserProfile> {
    const response = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Spotify profile fetch failed: ${errorBody}`);
    }
    return response.json() as Promise<SpotifyUserProfile>;
  }
}
