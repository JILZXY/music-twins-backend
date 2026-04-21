import {
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
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
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');
    res.cookie('spotify_auth_state', state, {
      httpOnly: true,
      maxAge: 3600000,
    });
    res.cookie('spotify_code_verifier', codeVerifier, {
      httpOnly: true,
      maxAge: 3600000,
    });
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
    const cookies = req.cookies as Record<string, string> | undefined;
    const storedState = cookies ? cookies['spotify_auth_state'] : null;
    const codeVerifier = cookies ? cookies['spotify_code_verifier'] : null;
    if (state === null || state !== storedState || !codeVerifier) {
      throw new UnauthorizedException(
        'State mismatch or missing code verifier',
      );
    }
    res.clearCookie('spotify_auth_state');
    res.clearCookie('spotify_code_verifier');
    try {
      const response = await this.authService.handleSpotifyCallback(
        code,
        codeVerifier,
      );

      res.cookie('access_token', response.accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/',
      });

      return res.redirect(302, `${process.env.FRONTEND_URL}/feed`);
    } catch (error) {
      throw new UnauthorizedException((error as Error).message);
    }
  }
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Req() req: Request & { user?: { userId: string } }) {
    const userId = req.user?.userId as string;
    return this.authService.getMe(userId);
  }
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@Req() req: Request, @Res() res: Response) {
    return res.json({ success: true });
  }
}
