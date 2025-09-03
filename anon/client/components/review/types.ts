export type Company = {
  name: string;
  slug: string;
  isClaimed?: boolean;
  isFollowed?: boolean;
};

export type ReviewStatus = "published" | "needs_review" | "blocked" | "deleted";

export type ReviewData = {
  id: string;
  title?: string;
  body: string;
  publishedAt: string; // ISO date
  status: ReviewStatus;
  author: { verifiedEmployee: boolean };
  integrity: { cid: string; hash: string; verifyUrl?: string };
  tags: string[];
  timeframe?: { from?: string; to?: string };
  piiMasked?: boolean;
  reactions?: { likes: number; dislikes: number; bookmarked?: boolean };
  officialResponse?: { body: string; author: string; publishedAt: string } | null;
  comments?: Array<{
    id: string;
    author: string; // anon handle
    body: string;
    publishedAt: string;
    replies?: Array<{ id: string; author: string; body: string; publishedAt: string }>;
  }>;
};
