export const PAGE_VERSION_CREATED_EVENT = 'page.version.created';

export class PageVersionCreatedEvent {
  constructor(
    public readonly pageId: string,
    public readonly versionId: string,
    public readonly authorId: string,
    public readonly title: string,
    public readonly content: string,
    public readonly changeSummary: string | null,
    public readonly updatedAt: Date,
  ) {}
}
