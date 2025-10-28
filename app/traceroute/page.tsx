'use client';

import { useState } from 'react';

interface TracerouteHop {
  hop: number;
  ip: string | null;
  hostname: string | null;
  rtt: string[];
}

interface TracerouteResponse {
  success: boolean;
  target: string;
  hops?: TracerouteHop[];
  error?: string;
}

export default function TraceroutePage() {
  const [target, setTarget] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TracerouteResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!target.trim()) {
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(`/api/traceroute?target=${encodeURIComponent(target)}`);
      const data: TracerouteResponse = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        target,
        error: error instanceof Error ? error.message : 'Failed to fetch traceroute data'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Traceroute Tool
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Trace the network path to any IP address or domain and discover the route packets take
        </p>
      </div>

      {/* Input Card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 mb-8 border border-gray-200 dark:border-gray-800">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="target" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Target Destination
            </label>
            <div className="flex gap-4">
              <input
                type="text"
                id="target"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="e.g., google.com, 8.8.8.8, or 2001:4860:4860::8888"
                className="flex-1 px-5 py-3 border-2 border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !target.trim()}
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all font-semibold"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Tracing...
                  </span>
                ) : (
                  'Start Trace'
                )}
              </button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Quick examples:</span>
            {['google.com', '1.1.1.1', '8.8.8.8'].map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => setTarget(example)}
                className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                disabled={loading}
              >
                {example}
              </button>
            ))}
          </div>
        </form>
      </div>

      {loading && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-12 border border-gray-200 dark:border-gray-800">
          <div className="flex flex-col items-center justify-center space-y-6">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-blue-200 dark:border-blue-900 rounded-full"></div>
              <div className="w-20 h-20 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0"></div>
            </div>
            <div className="text-center">
              <p className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Running traceroute to {target}
              </p>
              <p className="text-gray-600 dark:text-gray-400">This may take up to 60 seconds</p>
            </div>
            <div className="flex gap-2">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                ></div>
              ))}
            </div>
          </div>
        </div>
      )}

      {result && !loading && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          {result.success ? (
            <>
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-6">
                <h2 className="text-2xl font-bold text-white mb-1">
                  Route to {result.target}
                </h2>
                <p className="text-blue-100">
                  {result.hops?.length || 0} links discovered
                </p>
              </div>

              <div className="p-8">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                        <th className="px-4 py-4 text-left text-sm font-bold text-gray-900 dark:text-gray-100">
                          Link
                        </th>
                        <th className="px-4 py-4 text-left text-sm font-bold text-gray-900 dark:text-gray-100">
                          Hostname
                        </th>
                        <th className="px-4 py-4 text-left text-sm font-bold text-gray-900 dark:text-gray-100">
                          IP Address
                        </th>
                        <th className="px-4 py-4 text-left text-sm font-bold text-gray-900 dark:text-gray-100">
                          Round Trip Time
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {result.hops?.map((hop, index) => (
                        <tr key={`link-${index}-${hop.hop}`} className="hover:bg-blue-50 dark:hover:bg-gray-800 transition-colors group">
                          <td className="px-4 py-4">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 font-bold text-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
                              {hop.hop}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm font-mono text-gray-700 dark:text-gray-300">
                            {hop.hostname || (hop.ip ? <span className="text-gray-400">—</span> : <span className="text-gray-400">* * *</span>)}
                          </td>
                          <td className="px-4 py-4 text-sm font-mono text-gray-700 dark:text-gray-300">
                            {hop.ip || <span className="text-gray-400">* * *</span>}
                          </td>
                          <td className="px-4 py-4 text-sm font-mono text-gray-700 dark:text-gray-300">
                            {hop.rtt.length > 0 ? (
                              <div className="flex gap-2">
                                {hop.rtt.map((rtt, i) => (
                                  <span key={i} className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-md">
                                    {rtt} ms
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-400">* * *</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/20 mb-6">
                <svg className="w-10 h-10 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                Traceroute Failed
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                {result.error}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Info Card */}
      <div className="mt-8 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 border border-blue-100 dark:border-gray-700">
        <div className="flex items-start gap-4">
          <div className="text-4xl">💡</div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">
              How Traceroute Works
            </h3>
            <ul className="space-y-2 text-gray-700 dark:text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Supports IPv4 (e.g., 8.8.8.8), IPv6 (e.g., 2001:4860:4860::8888), and domains (e.g., google.com)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold">•</span>
                <span>Shows the network path packets take to reach the destination</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-pink-600 font-bold">•</span>
                <span>Each link represents a router along the path</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>"* * *" indicates a timeout or filtered link (router not responding)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold">•</span>
                <span>Results may vary based on network conditions and routing policies</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
