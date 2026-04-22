import { Controller, Get, Post, Query, Req, Res, UseGuards, UnauthorizedException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from '../application/auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import * as crypto from 'crypto';
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Get('spotify/login')
  loginSpotify(@Res() res: Response) {
    const state = crypto.randomBytes(16).toString('hex');
    const codeVerifier = crypto.randomBytes(32).toString('hex');
    const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
    res.cookie('spotify_auth_state', state, { httpOnly: true, maxAge: 3600000 });
    res.cookie('spotify_code_verifier', codeVerifier, { httpOnly: true, maxAge: 3600000 });
    const authUrl = this.authService.getSpotifyAuthUrl(state, codeChallenge);
    return res.redirect(authUrl);
  }
  @Get('spotify/callback')
  async callbackSpotify(
    @Query('code') code: string,
    @Query('state') state: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const storedState = req.cookies ? req.cookies['spotify_auth_state'] : null;
    const codeVerifier = req.cookies ? req.cookies['spotify_code_verifier'] : null;
    if (state === null || state !== storedState || !codeVerifier) {
      throw new UnauthorizedException('State mismatch or missing code verifier');
    }
    res.clearCookie('spotify_auth_state');
    res.clearCookie('spotify_code_verifier');
    try {
      const response = await this.authService.handleSpotifyCallback(code, codeVerifier);
      
      const frontendUrl = process.env.CORS_ORIGIN?.split(',')[0] || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/auth-loading?token=${response.accessToken}`);
    } catch (error) {
      throw new UnauthorizedException((error as Error).message);
    }
  }
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Req() req: any) {
    return this.authService.getMe(req.user.userId);
  }
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Req() req: any, @Res() res: Response) {
    return res.json({ success: true });
  }
}
