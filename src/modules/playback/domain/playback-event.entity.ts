export class PlaybackEvent {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly trackId: string,
    public readonly name: string,
    public readonly artist: string,
    public readonly albumName: string | null,
    public readonly albumImageUrl: string | null,
    public readonly playedAt: Date,
  ) {}
}
