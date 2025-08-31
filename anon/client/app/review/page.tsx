"use client";
// Dynamic review page route: /companies/[slug]/reviews/[id]
import React from "react";
import { motion } from "framer-motion";
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
import Navbar from "@/components/navbar/navbar";
import Footer from "@/components/footer/footer";

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

// Extract Pros/Cons from the freeform body, returning cleaned body + arrays
function extractProsCons(body: string): { text: string; pros: string[]; cons: string[] } {
  const lines = body.split(/\r?\n/);
  const pros: string[] = [];
  const cons: string[] = [];
  const remaining: string[] = [];
  for (const line of lines) {
    if (/^\s*Pros:/i.test(line)) {
      const rest = line.replace(/^\s*Pros:\s*/i, "");
      rest
        .split(/,|\u2022|\s\-\s|;|\|/)
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((p) => pros.push(p));
    } else if (/^\s*Cons:/i.test(line)) {
      const rest = line.replace(/^\s*Cons:\s*/i, "");
      rest
        .split(/,|\u2022|\s\-\s|;|\|/)
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((c) => cons.push(c));
    } else {
      remaining.push(line);
    }
  }
  const text = remaining.join("\n").trim();
  return { text, pros, cons };
}

export default function ReviewPage({ params }: PageProps) {
  // Derive company + review details from slug/id
  const { company, review } = getMockData(params.slug, params.id);
  const { text: cleanBody, pros, cons } = extractProsCons(review.body);

  return (
    <>
      {/* Global header */}
      <Navbar />
      <ReviewPageLayout>
        {/* Page content wrapper */}
        <main className="space-y-6 md:space-y-8">
        {/* Breadcrumbs: Companies > Company > Reviews > Current */}
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          <Breadcrumbs
          items={[
            { label: "Companies", href: "/companies" },
            { label: company.name, href: `/companies/${company.slug}` },
            { label: "Reviews", href: `/companies/${company.slug}/reviews` },
          ]}
          current={`Review #${review.id}`}
          />
        </motion.div>
        {/* Header Area: company + title + meta, distinctly separated */}
        <motion.section
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.05 }}
          className="rounded-2xl border border-gray-200/70 bg-white/90 p-5 shadow-sm dark:border-gray-800 dark:bg-neutral-900/90"
        >
          <div className="space-y-3">
            <CompanyHeaderCompact company={company} />
            <div className="space-y-2">
              <ReviewHeader review={review} />
              <div className="flex flex-wrap items-center gap-2.5 md:gap-3">
                <AuthorAnonBadge verified={review.author.verifiedEmployee} />
                <IntegrityBadge cid={review.integrity.cid} hash={review.integrity.hash} verifyUrl={review.integrity.verifyUrl} />
                {review.timeframe && <TimeframePill from={review.timeframe.from} to={review.timeframe.to} />}
              </div>
            </div>
            <ModerationBanner status={review.status} />
          </div>
        </motion.section>

        {/* Responsive layout: main (2 cols) + sidebar (1 col) on desktop */}
        <div className="grid grid-cols-1 gap-6 md:gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* Main Review Section: body, pros/cons, tags */}
            <motion.article
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="rounded-2xl border border-gray-200/70 bg-white/90 p-6 shadow-md transition hover:shadow-lg dark:border-gray-800 dark:bg-neutral-900/90 backdrop-blur"
            >
              <ReviewBody body={cleanBody} />
              {(pros.length > 0 || cons.length > 0) && (
                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {pros.length > 0 && (
                    <section>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Pros</h3>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-800 dark:text-gray-200">
                        {pros.map((p, i) => (
                          <li key={i}>{p}</li>
                        ))}
                      </ul>
                    </section>
                  )}
                  {cons.length > 0 && (
                    <section>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Cons</h3>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-800 dark:text-gray-200">
                        {cons.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </section>
                  )}
                </div>
              )}
              <div className="mt-6">
                <TagChips tags={review.tags} />
              </div>
            </motion.article>
            {/* Safety notice below tags */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25, delay: 0.05 }}>
              <SafetyNotice visible={review.piiMasked} />
            </motion.div>
            {/* Employer's official response (optional) */}
            {review.officialResponse && (
              <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
                <div className="rounded-2xl border border-indigo-200 bg-indigo-50/80 p-5 shadow-sm dark:border-indigo-900/40 dark:bg-indigo-950/30">
                  <h3 className="mb-2 text-sm font-semibold text-indigo-900 dark:text-indigo-200">
                    Official Response from {company.name} HR
                  </h3>
                  <OfficialResponseBlock
                    body={review.officialResponse.body}
                    author={review.officialResponse.author}
                    publishedAt={review.officialResponse.publishedAt}
                  />
                </div>
              </motion.section>
            )}
            {/* Threaded comments + composer (local state) */}
            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <div className="rounded-2xl border border-gray-200/70 bg-white/90 p-5 shadow-sm dark:border-gray-800 dark:bg-neutral-900/90">
                <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Comments</h3>
                <CommentsSection initial={review.comments as any} />
              </div>
            </motion.section>
            {/* Sticky reactions/bookmark/share/report bar */}
            <ActionBarSticky
              initialLikes={review.reactions?.likes}
              initialDislikes={review.reactions?.dislikes}
              initiallyBookmarked={review.reactions?.bookmarked}
            />
          </div>

          {/* Sidebar (desktop right, mobile below) */}
          <motion.aside
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:col-span-1"
          >
            <RelatedContentSidebar
              aiSummary="Employee sentiment highlights strong mentorship and learning; occasional crunch noted."
              related={[{ id: "r2", title: "Solid onboarding experience", href: "#" }]}
              trendingTags={["culture", "learning", "remote"]}
            />
          </motion.aside>
        </div>
        {/* Footer navigation and site footer at very bottom */}
        <motion.nav initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }} className="mt-8">
          <ReviewFooterNav
            prevHref={`/companies/${company.slug}/reviews/${Number(review.id) - 1}`}
            nextHref={`/companies/${company.slug}/reviews/${Number(review.id) + 1}`}
            backHref={`/companies/${company.slug}`}
          />
        </motion.nav>
        </main>
        <footer className="mt-10">
          <Footer />
        </footer>
      </ReviewPageLayout>
    </>
  );
}
=======
// @ts-nocheck
"use client";

import { useState } from "react";
import Navbar from "@/components/navbar/navbar";
import Footer from "@/components/footer/footer";

export default function ReviewPage() {
	const [company, setCompany] = useState("");
	const [title, setTitle] = useState("");
	const [rating, setRating] = useState(5);
	const [review, setReview] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState(null);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError(null);
		setIsSubmitting(true);
		try {
			console.log("Review submitted:", { company, title, rating, review });
			window.location.href = "/";
		} catch (err) {
			setError("Something went wrong. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<>
			<Navbar />
			<main className="min-h-screen w-full bg-[#121212] text-white">
				<div className="max-w-3xl mx-auto px-4 py-10">
					<header className="mb-8 text-center">
						<h1 className="text-3xl md:text-4xl font-bold">Write a review</h1>
						<p className="mt-2 text-sm text-neutral-300">
							Share your experience to help others make informed decisions.
						</p>
					</header>

					<form onSubmit={handleSubmit} className="space-y-6">
						<div>
							<label htmlFor="company" className="block text-sm font-medium mb-2">
								Company / Project
							</label>
							<input
								id="company"
								type="text"
								value={company}
								onChange={(e) => setCompany(e.target.value)}
								placeholder="e.g., Anondoor"
								className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 outline-none focus:ring-2 focus:ring-neutral-500"
								required
							/>
						</div>

						<div>
							<label htmlFor="title" className="block text-sm font-medium mb-2">
								Title
							</label>
							<input
								id="title"
								type="text"
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								placeholder="Summarize your review"
								className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 outline-none focus:ring-2 focus:ring-neutral-500"
								required
							/>
						</div>

						<div>
							<label htmlFor="rating" className="block text-sm font-medium mb-2">
								Rating
							</label>
							<select
								id="rating"
								value={rating}
								onChange={(e) => setRating(Number(e.target.value))}
								className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 outline-none focus:ring-2 focus:ring-neutral-500"
							>
								{[5, 4, 3, 2, 1].map((r) => (
									<option key={r} value={r}>{`${r} Star${r > 1 ? "s" : ""}`}</option>
								))}
							</select>
						</div>

						<div>
							<label htmlFor="review" className="block text-sm font-medium mb-2">
								Your review
							</label>
							<textarea
								id="review"
								value={review}
								onChange={(e) => setReview(e.target.value)}
								placeholder="Be honest, constructive, and helpful to others."
								rows={8}
								className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 outline-none focus:ring-2 focus:ring-neutral-500 resize-y"
								required
							/>
							<p className="mt-2 text-xs text-neutral-400">Max 5000 characters.</p>
						</div>

						{error && (
							<p className="text-sm text-red-400">{error}</p>
						)}

						<div className="flex items-center gap-3">
							<button
								type="submit"
								disabled={isSubmitting}
								className="inline-flex items-center justify-center rounded-md bg-white text-black px-4 py-2 text-sm font-semibold hover:bg-neutral-200 disabled:opacity-50"
							>
								{isSubmitting ? "Submitting..." : "Submit review"}
							</button>
							<button
								type="button"
								onClick={() => (window.location.href = "/")}
								className="inline-flex items-center justify-center rounded-md border border-neutral-700 px-4 py-2 text-sm font-semibold hover:bg-neutral-900"
							>
								Cancel
							</button>
						</div>
					</form>
				</div>
			</main>
			<Footer />
		</>
	);
} 