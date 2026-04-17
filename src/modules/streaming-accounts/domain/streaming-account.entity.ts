export class StreamingAccount {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly provider: 'SPOTIFY',
    public readonly providerAccountId: string,
    public readonly accessToken: string,
    public readonly refreshToken: string | null,
    public readonly expiresAt: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
