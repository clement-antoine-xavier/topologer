'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface TracerouteHistoryItem {
  id: string;
  targetIp: string;
  targetHostname: string | null;
  createdAt: string;
  linkCount: number;
}

interface HistoryResponse {
  success: boolean;
  results?: TracerouteHistoryItem[];
  error?: string;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<TracerouteHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/traceroute/history');
      const data: HistoryResponse = await response.json();

      if (data.success && data.results) {
        setHistory(data.results);
      } else {
        setError(data.error || 'Failed to fetch history');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Traceroute History
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Browse all your previous traceroute requests and results
          </p>
        </div>
        <Link
          href="/traceroute"
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all font-semibold"
        >
          + New Traceroute
        </Link>
      </div>

      {loading && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-12 border border-gray-200 dark:border-gray-800">
          <div className="flex flex-col items-center justify-center space-y-6">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-purple-200 dark:border-purple-900 rounded-full"></div>
              <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin absolute top-0"></div>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-lg">Loading history...</p>
          </div>
        </div>
      )}

      {error && !loading && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-12 border border-gray-200 dark:border-gray-800">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/20 mb-6">
              <svg className="w-10 h-10 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              Failed to Load
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
            <button
              onClick={fetchHistory}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {!loading && !error && history.length === 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-16 border border-gray-200 dark:border-gray-800">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 mb-6">
              <svg className="w-12 h-12 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              No History Yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              Your traceroute history is empty. Run your first traceroute to start building your network topology map.
            </p>
            <Link
              href="/traceroute"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all font-semibold"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              Run Your First Traceroute
            </Link>
          </div>
        </div>
      )}

      {!loading && !error && history.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500 to-pink-600 px-8 py-6">
            <h2 className="text-2xl font-bold text-white">
              {history.length} Traceroute{history.length !== 1 ? 's' : ''}
            </h2>
            <p className="text-purple-100">Complete traceroute history</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 dark:text-gray-100">
                    Target IP
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 dark:text-gray-100">
                    Hostname
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 dark:text-gray-100">
                    Links
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 dark:text-gray-100">
                    Date & Time
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {history.map((item, index) => (
                  <tr 
                    key={item.id} 
                    className="hover:bg-purple-50 dark:hover:bg-gray-800 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <code className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg font-mono text-sm group-hover:bg-purple-100 dark:group-hover:bg-purple-900/20 transition-colors">
                        {item.targetIp}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {item.targetHostname || <span className="text-gray-400">—</span>}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center justify-center min-w-[3rem] px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r from-blue-100 to-purple-100 text-purple-700 dark:from-blue-900/30 dark:to-purple-900/30 dark:text-purple-300">
                        {item.linkCount}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formatDate(item.createdAt)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
