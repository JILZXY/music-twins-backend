import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { UserSearchService } from '../application/user-search.service';
import { JwtAuthGuard } from '../../auth/presentation/guards/jwt-auth.guard';
import type { Request } from 'express';
import { ApiTags, ApiOperation, ApiCookieAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('Users')
@ApiCookieAuth()
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly userSearchService: UserSearchService) {}

  @ApiOperation({ summary: 'Buscar usuarios' })
  @ApiQuery({ name: 'q', required: true, description: 'Término de búsqueda' })
  @ApiQuery({ name: 'limit', required: false, description: 'Límite de resultados (por defecto 20)' })
  @Get('search')
  search(@Query('q') query: string, @Query('limit') limit: string, @Req() req: any) {
    const l = limit ? parseInt(limit, 10) : 20;
    return this.userSearchService.searchUsers(query, req.user.userId, l);
  }
}
