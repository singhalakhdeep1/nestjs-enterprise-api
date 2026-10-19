export class CreatePostCommand {
  constructor(
    public readonly title: string,
    public readonly content: string,
    public readonly authorId: string,
    public readonly tags: string[] = [],
    public readonly published = true,
  ) {}
}

export class UpdatePostCommand {
  constructor(
    public readonly id: string,
    public readonly actorId: string,
    public readonly actorRole: string,
    public readonly changes: { title?: string; content?: string; tags?: string[]; published?: boolean },
  ) {}
}

export class DeletePostCommand {
  constructor(public readonly id: string, public readonly actorId: string, public readonly actorRole: string) {}
}

export class AddCommentCommand {
  constructor(public readonly postId: string, public readonly authorId: string, public readonly content: string) {}
}

export class DeleteCommentCommand {
  constructor(public readonly commentId: string, public readonly actorId: string, public readonly actorRole: string) {}
}
