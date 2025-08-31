"use client";
// Dynamic review page route: /companies/[slug]/reviews/[id]
import React from "react";
import ReviewPageLayout from "@/components/review/ReviewPageLayout";
import Breadcrumbs from "@/components/review/Breadcrumbs";
import CompanyHeaderCompact from "@/components/review/CompanyHeaderCompact";
import ReviewHeader from "@/components/review/ReviewHeader";
import AuthorAnonBadge from "@/components/review/AuthorAnonBadge";
import IntegrityBadge from "@/components/review/IntegrityBadge";
import ReviewBody from "@/components/review/ReviewBody";
import TagChips from "@/components/review/TagChips";
import TimeframePill from "@/components/review/TimeframePill";
import SafetyNotice from "@/components/review/SafetyNotice";
import ActionBarSticky from "@/components/review/ActionBarSticky";
import OfficialResponseBlock from "@/components/review/OfficialResponseBlock";
import CommentsSection from "@/components/review/CommentsSection";
import RelatedContentSidebar from "@/components/review/RelatedContentSidebar";
import ModerationBanner from "@/components/review/ModerationBanner";
import ReviewFooterNav from "@/components/review/ReviewFooterNav";
import type { Company, ReviewData } from "@/components/review/types";

// Next.js app router provides params for dynamic segments
type PageProps = { params: { slug: string; id: string } };

// Placeholder data source. TODO: replace with server fetch by slug/id.
function getMockData(slug: string, id: string): { company: Company; review: ReviewData } {
  return {
    company: { name: "Acme Corp", slug, isClaimed: true, isFollowed: false },
    review: {
      id,
      title: "Great team and learning opportunities",
      body:
        "I worked at Acme for 2 years. The culture emphasized ownership and continuous improvement. Work-life balance varied by team but generally respectful. Benefits were competitive.\n\nPros: supportive peers, good mentorship\nCons: release crunches occasionally",
      publishedAt: new Date().toISOString(),
      status: "published",
      author: { verifiedEmployee: true },
      integrity: { cid: "bafy...cid", hash: "0x1234567890abcdef", verifyUrl: "#" },
      tags: ["culture", "learning", "mentorship"],
      timeframe: { from: "2019", to: "2021" },
      piiMasked: false,
      reactions: { likes: 12, dislikes: 1, bookmarked: false },
      officialResponse: {
        body: "Thanks for sharing your experience. We're improving release planning to reduce crunch.",
        author: "Acme HR",
        publishedAt: new Date().toISOString(),
      },
      comments: [
        { id: "c1", author: "anon1", body: "Agree on the mentorship!", publishedAt: new Date().toISOString() },
      ],
    },
  };
}

export default function ReviewPage({ params }: PageProps) {
  // Derive company + review details from slug/id
  const { company, review } = getMockData(params.slug, params.id);

  return (
    <ReviewPageLayout>
      {/* Page content wrapper */}
      <div className="space-y-4">
        {/* Breadcrumbs: Companies > Company > Reviews > Current */}
        <Breadcrumbs
          items={[
            { label: "Companies", href: "/companies" },
            { label: company.name, href: `/companies/${company.slug}` },
            { label: "Reviews", href: `/companies/${company.slug}/reviews` },
          ]}
          current={`Review #${review.id}`}
        />
        {/* Company header + moderation banner */}
        <CompanyHeaderCompact company={company} />
        <ModerationBanner status={review.status} />

        {/* Responsive layout: main (2 cols) + sidebar (1 col) on desktop */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            {/* Title, published time, status */}
            <ReviewHeader review={review} />
            {/* Meta badges: author verification, integrity, timeframe */}
            <div className="flex flex-wrap items-center gap-3">
              <AuthorAnonBadge verified={review.author.verifiedEmployee} />
              <IntegrityBadge cid={review.integrity.cid} hash={review.integrity.hash} verifyUrl={review.integrity.verifyUrl} />
              {review.timeframe && <TimeframePill from={review.timeframe.from} to={review.timeframe.to} />}
            </div>

            {/* Review body card */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-neutral-900">
              <ReviewBody body={review.body} />
            </div>

            {/* Tags + safety notice */}
            <TagChips tags={review.tags} />
            <SafetyNotice visible={review.piiMasked} />
            {/* Employer's official response (optional) */}
            {review.officialResponse && (
              <OfficialResponseBlock
                body={review.officialResponse.body}
                author={review.officialResponse.author}
                publishedAt={review.officialResponse.publishedAt}
              />
            )}
            {/* Threaded comments + composer (local state) */}
            <CommentsSection initial={review.comments as any} />
            {/* Navigation within review list */}
            <ReviewFooterNav
              prevHref={`/companies/${company.slug}/reviews/${Number(review.id) - 1}`}
              nextHref={`/companies/${company.slug}/reviews/${Number(review.id) + 1}`}
              backHref={`/companies/${company.slug}`}
            />
            {/* Sticky reactions/bookmark/share/report bar */}
            <ActionBarSticky
              initialLikes={review.reactions?.likes}
              initialDislikes={review.reactions?.dislikes}
              initiallyBookmarked={review.reactions?.bookmarked}
            />
          </div>

          {/* Sidebar (desktop right, mobile below) */}
          <div className="lg:col-span-1">
            <RelatedContentSidebar
              aiSummary="Employee sentiment highlights strong mentorship and learning; occasional crunch noted."
              related={[{ id: "r2", title: "Solid onboarding experience", href: "#" }]}
              trendingTags={["culture", "learning", "remote"]}
            />
          </div>
        </div>
      </div>
    </ReviewPageLayout>
  );
}
