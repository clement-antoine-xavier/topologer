'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Router {
  id: string;
  ipAddress: string;
  hostname: string | null;
  asn: number | null;
  country: string | null;
  region: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
  pathCount: number;
}

interface RoutersResponse {
  success: boolean;
  routers?: Router[];
  error?: string;
}

export default function RoutersPage() {
  const [routers, setRouters] = useState<Router[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState({ country: '', city: '' });

  useEffect(() => {
    fetchRouters();
  }, []);

  const fetchRouters = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filter.country) params.set('country', filter.country);
      if (filter.city) params.set('city', filter.city);

      const response = await fetch(`/api/routers?${params.toString()}`);
      const data: RoutersResponse = await response.json();

      if (data.success && data.routers) {
        setRouters(data.routers);
      } else {
        setError(data.error || 'Failed to fetch routers');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch routers');
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRouters();
  };

  return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Discovered Routers
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Explore network routers discovered through traceroutes with detailed geolocation data
          </p>
        </div>

        {/* Filter Form */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 mb-8 border border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              🔍 Filter Routers
            </h3>
            <form onSubmit={handleFilter} className="flex flex-wrap gap-4">
            <input
              type="text"
              placeholder="Country code (e.g., US, CN)"
              value={filter.country}
              onChange={(e) => setFilter({ ...filter, country: e.target.value })}
                className="flex-1 min-w-[200px] px-4 py-3 border-2 border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 transition-all"
            />
            <input
              type="text"
              placeholder="City"
              value={filter.city}
              onChange={(e) => setFilter({ ...filter, city: e.target.value })}
                className="flex-1 min-w-[200px] px-4 py-3 border-2 border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 transition-all"
            />
            <button
              type="submit"
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all font-semibold"
            >
              Filter
            </button>
            <button
              type="button"
              onClick={() => {
                setFilter({ country: '', city: '' });
                setTimeout(fetchRouters, 0);
              }}
                className="px-8 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all font-semibold"
            >
              Clear
            </button>
          </form>
        </div>

        {loading && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-12 border border-gray-200 dark:border-gray-800">
              <div className="flex flex-col items-center justify-center space-y-6">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-green-200 dark:border-green-900 rounded-full"></div>
                  <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin absolute top-0"></div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-lg">Loading routers...</p>
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
                <p className="text-gray-600 dark:text-gray-400">{error}</p>
            </div>
          </div>
        )}

        {!loading && !error && routers.length === 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-16 border border-gray-200 dark:border-gray-800">
            <div className="text-center">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900/20 dark:to-blue-900/20 mb-6">
                <svg className="w-12 h-12 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                No routers found
              </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                  No routers match your filter criteria. Try adjusting your filters or run traceroutes to discover network routers.
              </p>
              <Link
             href="/traceroute"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all font-semibold"
              >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                Run Traceroute
              </Link>
            </div>
          </div>
        )}

        {!loading && !error && routers.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-blue-600 px-8 py-6">
                <h2 className="text-2xl font-bold text-white">
                  {routers.length} Router{routers.length !== 1 ? 's' : ''} Discovered
                </h2>
                <p className="text-green-100">Network infrastructure mapping</p>
              </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 dark:text-gray-100">
                      IP Address
                    </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 dark:text-gray-100">
                      Hostname
                    </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 dark:text-gray-100">
                      Location
                    </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 dark:text-gray-100">
                      Coordinates
                    </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 dark:text-gray-100">
                      Timezone
                    </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 dark:text-gray-100">
                      Paths
                    </th>
                  </tr>
                </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {routers.map((router) => {
                    const location = [router.city, router.region, router.country]
                      .filter(Boolean)
                      .join(', ');
                    
                    return (
                        <tr key={router.id} className="hover:bg-green-50 dark:hover:bg-gray-800 transition-colors group">
                        <td className="px-6 py-4">
                            <code className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg font-mono text-sm group-hover:bg-green-100 dark:group-hover:bg-green-900/20 transition-colors">
                            {router.ipAddress}
                            </code>
                        </td>
                        <td className="px-6 py-4">
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                            {router.hostname || '—'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {location ? (
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                {location}
                              </span>
                            </div>
                          ) : (
                              <span className="text-sm text-gray-500">Private/Unknown</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {router.latitude && router.longitude ? (
                              <span className="text-xs font-mono text-gray-600 dark:text-gray-400">
                              {router.latitude.toFixed(4)}, {router.longitude.toFixed(4)}
                            </span>
                          ) : (
                              <span className="text-sm text-gray-500">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                            {router.timezone || '—'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                            <span className="inline-flex items-center justify-center min-w-[3rem] px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r from-green-100 to-blue-100 text-blue-700 dark:from-green-900/30 dark:to-blue-900/30 dark:text-blue-300">
                            {router.pathCount}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

          <div className="mt-8 bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 border border-green-100 dark:border-gray-700">
            <div className="flex items-start gap-4">
              <div className="text-4xl">💡</div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">
                  About Router Discovery
                </h3>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">•</span>
                    <span>Location data is automatically discovered using GeoIP databases</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>Private IP addresses (10.x.x.x, 192.168.x.x, etc.) are excluded from storage</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 font-bold">•</span>
                    <span>Coordinates enable geographic mapping of network topology</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-pink-600 font-bold">•</span>
                    <span>Path count indicates how many traceroute paths traverse this router</span>
                  </li>
                </ul>
              </div>
            </div>
        </div>
      </div>
  );
}
