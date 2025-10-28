'use client';

import Link from "next/link";
import dynamic from "next/dynamic";

// Import map component dynamically to avoid SSR issues with Leaflet
const NetworkMap = dynamic(() => import("@/components/NetworkMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[600px] flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading map...</p>
      </div>
    </div>
  ),
});

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
          Network Topology Mapper
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
          Visualize internet infrastructure in real-time. Discover routers, trace network paths,
          and explore the global topology of the internet.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatsCard
          icon="🌐"
          title="Global Coverage"
          description="Map routers worldwide"
          gradient="from-blue-500 to-cyan-500"
        />
        <StatsCard
          icon="⚡"
          title="Real-time"
          description="Live network topology"
          gradient="from-purple-500 to-pink-500"
        />
        <StatsCard
          icon="🔍"
          title="Deep Analysis"
          description="Detailed path insights"
          gradient="from-orange-500 to-red-500"
        />
      </div>

      {/* Map Section */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 mb-8 border border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Live Network Map
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Interactive visualization of discovered routers and network links
            </p>
          </div>
          <Link
            href="/traceroute"
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg hover:scale-105 transition-all"
          >
            Run Traceroute
          </Link>
        </div>
        
        <NetworkMap />
        
        <div className="mt-6 flex flex-wrap gap-6 text-sm">
          <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 px-4 py-2 rounded-lg">
            <div className="w-6 h-6 rounded-full bg-red-500 border-2 border-red-600 shadow-lg"></div>
            <span className="text-gray-700 dark:text-gray-300">
              <strong>Routers</strong> · Size indicates connection count
            </span>
          </div>
          <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 px-4 py-2 rounded-lg">
            <div className="w-8 h-1 bg-blue-500 rounded-full shadow-lg"></div>
            <span className="text-gray-700 dark:text-gray-300">
              <strong>Links</strong> · Network connections
            </span>
          </div>
          <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 px-4 py-2 rounded-lg">
            <span className="text-gray-700 dark:text-gray-300">
              💡 <strong>Tip:</strong> Click markers for details
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ActionCard
          href="/traceroute"
          icon="🔍"
          title="Traceroute Tool"
          description="Trace network paths to any destination"
          color="blue"
        />
        <ActionCard
          href="/history"
          icon="📊"
          title="Traceroute History"
          description="View past traceroute results"
          color="purple"
        />
        <ActionCard
          href="/routers"
          icon="🌐"
          title="Router Database"
          description="Browse discovered routers"
          color="pink"
        />
      </div>
    </div>
  );
}

function StatsCard({ icon, title, description, gradient }: {
  icon: string;
  title: string;
  description: string;
  gradient: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-800 hover:shadow-xl transition-shadow">
      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-2xl mb-4`}>
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400 text-sm">{description}</p>
    </div>
  );
}

function ActionCard({ href, icon, title, description, color }: {
  href: string;
  icon: string;
  title: string;
  description: string;
  color: string;
}) {
  const colorClasses = {
    blue: 'from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600',
    purple: 'from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600',
    pink: 'from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600',
  }[color];

  return (
    <Link
      href={href}
      className={`group block bg-gradient-to-br ${colorClasses} rounded-xl p-6 shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all`}
    >
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-white/90 text-sm">{description}</p>
      <div className="mt-4 flex items-center text-white font-semibold">
        <span>Get started</span>
        <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}
