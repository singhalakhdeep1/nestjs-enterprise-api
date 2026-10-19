export interface PostSnapshot {
  id: string;
  title: string;
  content: string;
  published: boolean;
  authorId: string;
  author?: { id: string; name: string } | null;
  tags: { name: string }[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export class PostCreatedEvent {
  constructor(public readonly post: PostSnapshot, public readonly actorId: string) {}
}

export class PostUpdatedEvent {
  constructor(public readonly post: PostSnapshot, public readonly actorId: string, public readonly changes: string[]) {}
}

export class PostDeletedEvent {
  constructor(public readonly postId: string, public readonly actorId: string, public readonly title: string) {}
}

export class CommentAddedEvent {
  constructor(public readonly postId: string, public readonly comment: { id: string; content: string; authorId: string; author?: { name: string } | null; createdAt: Date }) {}
}

export class CommentDeletedEvent {
  constructor(public readonly postId: string, public readonly commentId: string, public readonly actorId: string) {}
}
