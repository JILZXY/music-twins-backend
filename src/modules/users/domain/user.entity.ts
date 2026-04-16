export class User {
  constructor(
    public readonly id: string,
    public readonly displayName: string,
    public readonly avatarUrl: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
