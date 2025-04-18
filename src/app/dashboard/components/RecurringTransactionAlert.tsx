import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { fetchUnconfirmedPatterns } from "@/utils/api";

export default function RecurringTransactionAlert() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken || "";

  const [unconfirmedPatterns, setUnconfirmedPatterns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    const loadUnconfirmedPatterns = async () => {
      try {
        setLoading(true);
        const patterns = await fetchUnconfirmedPatterns(token);
        setUnconfirmedPatterns(patterns);
      } catch (err) {
        console.error("Error fetching unconfirmed patterns:", err);
        setError("Failed to load recurring transaction patterns");
      } finally {
        setLoading(false);
      }
    };

    loadUnconfirmedPatterns();
  }, [token]);

  if (unconfirmedPatterns.length === 0) return null;

  return (
    <div className="mb-6" data-testid="recurring-transaction-alert">
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-blue-500"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-blue-800">
              Recurring Transactions Detected
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                We've detected {unconfirmedPatterns.length} potential recurring
                transaction patterns. Would you like to review them?
              </p>
            </div>
            <div className="mt-4">
              <Link
                href="/recurring-transactions/review-patterns"
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Review Patterns
              </Link>
            </div>
          </div>
        </div>
      </div>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
}
