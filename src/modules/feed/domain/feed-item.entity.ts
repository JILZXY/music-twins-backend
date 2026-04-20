export class FeedUser {
  constructor(
    public readonly id: string,
    public readonly displayName: string,
    public readonly avatarUrl: string | null,
  ) {}
}

export class FeedTrack {
  constructor(
    public readonly trackId: string,
    public readonly name: string,
    public readonly artist: string,
    public readonly albumName: string | null,
    public readonly albumImageUrl: string | null,
  ) {}
}

export class FeedItem {
  constructor(
    public readonly playbackEventId: string,
    public readonly user: FeedUser,
    public readonly track: FeedTrack,
    public readonly playedAt: Date,
    public readonly reactions: any[],
    public readonly notesCount: number,
  ) {}
}
