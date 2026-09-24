"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { GiftCard } from "@/components/gift/GiftCard";
import { GiftCardSkeleton } from "@/components/gift/GiftCardSkeleton";
import styles from "./page.module.css";
import type { ApiResponse } from "@/types";
import type { GiftPageOffset } from "@/server/services/gift.service";

const DEFAULT_LIMIT = 10;

async function fetchGifts(page: number, limit: number): Promise<GiftPageOffset> {
  const res = await fetch(`/api/v1/gifts?page=${page}&limit=${limit}`);
  const json: ApiResponse<GiftPageOffset> = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data;
}

export default function DashboardPage() {
  const [page, setPage] = useState(1);

  const { data, status, isFetching, isStale, refetch } = useQuery({
    queryKey: ["gifts", page],
    queryFn: () => fetchGifts(page, DEFAULT_LIMIT),
  });

  // ── Loading (initial fetch) ──────────────────────────────────────────────
  if (status === "pending") {
    return (
      <div className={styles.page}>
        <div className="container">
          <h1 className={styles.title}>Your Gifts</h1>
          {/* Accessible live region so screen readers announce loading */}
          <div className={styles.grid} aria-live="polite" aria-busy="true">
            <GiftCardSkeleton count={DEFAULT_LIMIT} />
          </div>
        </div>
      </div>
    );
  }

  // ── Error / failed fetch ─────────────────────────────────────────────────
  if (status === "error") {
    return (
      <div className={styles.page}>
        <div className="container">
          <h1 className={styles.title}>Your Gifts</h1>
          <div className={styles.errorState} role="alert">
            <p className={styles.errorMessage}>Failed to load your gifts. Please try again.</p>
            <button
              className="btn btn--secondary"
              onClick={() => refetch()}
              aria-label="Retry loading gifts"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { data: gifts, total, totalPages } = data!;

  return (
    <div className={styles.page}>
      <div className="container">
        <h1 className={styles.title}>Your Gifts</h1>

        {/* Stale banner — shown when cached data is being refreshed in background */}
        {isStale && isFetching && (
          <p className={styles.staleBanner} aria-live="polite" aria-atomic="true">
            Refreshing…
          </p>
        )}

        {gifts.length === 0 ? (
          // ── Empty state ───────────────────────────────────────────────────
          <div className={styles.empty} role="status" aria-label="No gifts found">
            <div className={styles.emptyIconWrapper} aria-hidden="true">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="8" width="18" height="4" rx="1" />
                <path d="M12 8v13" />
                <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
                <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5" />
              </svg>
            </div>
            <h2 className={styles.emptyTitle}>No gifts yet</h2>
            <p className={styles.emptyDescription}>
              Brighten someone&apos;s day by sending a surprise cash gift!
            </p>
            <Link href="/send" className="btn btn--primary">
              Send your first gift!
            </Link>
          </div>
        ) : (
          <>
            <p className={styles.count}>
              Showing {(page - 1) * DEFAULT_LIMIT + 1}–{Math.min(page * DEFAULT_LIMIT, total)} of{" "}
              {total} gifts
            </p>

            {/* Skeleton overlay while paginating (keeps layout stable) */}
            <div className={styles.grid} aria-live="polite" aria-busy={isFetching}>
              {isFetching ? (
                <GiftCardSkeleton count={DEFAULT_LIMIT} />
              ) : (
                gifts.map((gift) => <GiftCard key={gift.id} gift={gift} perspective="sender" />)
              )}
            </div>

            <div className={styles.pagination}>
              <button
                className="btn btn--secondary"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || isFetching}
                aria-label="Previous page"
              >
                ← Previous
              </button>
              <span aria-live="polite" aria-atomic="true">
                Page {page} of {totalPages}
              </span>
              <button
                className="btn btn--secondary"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages || isFetching}
                aria-label="Next page"
              >
                Next →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
