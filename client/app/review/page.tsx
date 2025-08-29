"use client";

import React from "react";
import { ReviewComposer } from "@/components/review/ReviewComposer";
import { ReviewData } from "@/lib/review/types";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";

export default function ReviewPage() {
  const router = useRouter();

  const handleSubmit = async (reviewData: ReviewData) => {
    console.log("Review submitted:", reviewData);
    // Here you would typically save the review to your database
    // For now, we'll just redirect back to the home page
    router.push("/");
  };

  const handleCancel = () => {
    router.push("/");
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[radial-gradient(circle,_#797474,_#e6e1e1,_#979191)] animate-smoke">
        <div className="max-w-4xl mx-auto py-8 px-4">
          <div className="mb-8 text-center">
            <h1 className="text-lp-h2 font-black text-white mb-4 uppercase">
              Write a Review
            </h1>
            <p className="text-lp-sub font-medium text-grayscale-100 max-w-2xl mx-auto">
              Share your thoughts and experiences with the community. Your review will help others make informed decisions.
            </p>
          </div>

          <ReviewComposer
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            maxLength={5000}
          />
        </div>
      </main>
    </>
  );
}
