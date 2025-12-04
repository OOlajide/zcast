import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import HowItWorks from './components/HowItWorks';

export const revalidate = 3600; // Revalidate every hour

export default function DailyPodcastPage() {
  interface Metrics {
    privacy_metrics: {
      net_privacy_flow: number;
      shielded_transactions_count: number;
    };
    network_throughput_metrics: {
      total_zec_transferred: number;
      num_unique_active_addresses: number;
    };
  }

  interface Episode {
    filename: string;
    dateStr: string;
    formattedDate: string;
    url: string;
    metrics?: Metrics;
  }

  const podcastDir = path.join(process.cwd(), 'public', 'podcasts');
  const rootDir = process.cwd();
  let episodes: Episode[] = [];

  if (fs.existsSync(podcastDir)) {
    // Support both mp3 and wav
    const files = fs.readdirSync(podcastDir).filter(file => file.endsWith('.mp3') || file.endsWith('.wav'));
    episodes = files.map(file => {
      // Extract date from filename: zcash_daily_podcast_YYYYMMDD.wav or .mp3
      const match = file.match(/(\d{8})\.(mp3|wav)$/);
      const dateStr = match ? match[1] : '';
      const formattedDate = dateStr 
        ? new Date(dateStr.slice(0, 4) + '-' + dateStr.slice(4, 6) + '-' + dateStr.slice(6, 8)).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) 
        : 'Unknown Date';

      
      // Try to read metrics
      let metrics: Metrics | undefined;
      try {
        if (dateStr) {
          const metricsPath = path.join(rootDir, `metrics_${dateStr}.json`);
          if (fs.existsSync(metricsPath)) {
            metrics = JSON.parse(fs.readFileSync(metricsPath, 'utf-8'));
          }
        }
      } catch (e) {
        console.error(`Error reading metrics for ${dateStr}`, e);
      }

      return {
        filename: file,
        dateStr,
        formattedDate,
        url: `/podcasts/${file}`,
        metrics
      };
    }).sort((a, b) => b.dateStr.localeCompare(a.dateStr));
  }

  const latestEpisode = episodes[0];

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 md:p-24 bg-zinc-900 text-white">
      <div className="z-10 w-full max-w-5xl items-center justify-end font-mono text-sm lg:flex mb-12">
        <HowItWorks />
      </div>

      <div className="flex flex-col items-center w-full max-w-3xl">
        <h1 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-yellow-500 to-amber-600 bg-clip-text text-transparent">Zcast 🎙️</h1>

        {latestEpisode ? (
          <div className="w-full space-y-6">
            {/* Main Player Card */}
            <div className="bg-zinc-800 p-8 rounded-3xl shadow-2xl border border-zinc-700">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                 <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Latest Episode</h2>
                    <p className="text-zinc-400">{latestEpisode.formattedDate}</p>
                 </div>
                 <span className="mt-2 md:mt-0 px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs font-semibold uppercase tracking-wider border border-amber-500/20">
                    Zcash Daily Data Podcast
                 </span>
              </div>
              
              <div className="bg-zinc-900/50 rounded-xl p-2 mb-6 border border-zinc-700/50">
                <audio controls className="w-full">
                    <source src={latestEpisode.url} type={latestEpisode.filename.endsWith('.wav') ? "audio/wav" : "audio/mpeg"} />
                    Your browser does not support the audio element.
                </audio>
              </div>

              {/* Metrics Grid */}
              {latestEpisode.metrics && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-700/50">
                        <div className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Active Addrs</div>
                        <div className="text-xl font-mono font-semibold text-white">
                            {latestEpisode.metrics.network_throughput_metrics.num_unique_active_addresses.toLocaleString()}
                        </div>
                    </div>
                    <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-700/50">
                        <div className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Shielded Txs</div>
                        <div className="text-xl font-mono font-semibold text-green-400">
                            {latestEpisode.metrics.privacy_metrics.shielded_transactions_count.toLocaleString()}
                        </div>
                    </div>
                    <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-700/50">
                        <div className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Volume</div>
                        <div className="text-lg font-mono font-semibold text-blue-400 break-all">
                             {(latestEpisode.metrics.network_throughput_metrics.total_zec_transferred / 1e8).toLocaleString(undefined, { maximumFractionDigits: 0 })} ZEC
                        </div>
                    </div>
                    <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-700/50">
                        <div className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Net Privacy</div>
                        <div className={`text-lg font-mono font-semibold break-all ${latestEpisode.metrics.privacy_metrics.net_privacy_flow >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {(latestEpisode.metrics.privacy_metrics.net_privacy_flow / 1e8).toLocaleString(undefined, { maximumFractionDigits: 0 })} ZEC
                        </div>
                    </div>
                </div>
              )}
              
              <div className="mt-6 text-xs text-zinc-500 text-center flex items-center justify-center gap-1">
                Data provided by
                <Link href="https://blockchair.com/dumps" target="_blank" className="flex items-center hover:text-zinc-300 transition-colors font-medium">
                   Blockchair
                   <img src="/blockchair_logo.svg" alt="Blockchair" className="h-4 ml-1.5" />
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center p-12 border border-dashed border-zinc-700 rounded-xl w-full">
            <p className="text-xl mb-2">No episodes available yet.</p>
            <p className="text-zinc-500">The pipeline runs daily at 12:00 PM UTC.</p>
          </div>
        )}

        <div className="mt-16 w-full">
          <h3 className="text-xl font-semibold mb-6 border-b border-zinc-700 pb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
            Archives
          </h3>
          <div className="grid gap-4">
            {episodes.slice(1).map((ep) => (
              <div key={ep.filename} className="flex flex-col sm:flex-row justify-between items-center p-4 bg-zinc-800/50 hover:bg-zinc-800 rounded-xl transition border border-zinc-700/30">
                <div className="flex flex-col mb-3 sm:mb-0">
                    <span className="font-medium">{ep.formattedDate}</span>
                    {ep.metrics && (
                        <span className="text-xs text-zinc-500">
                            {(ep.metrics.network_throughput_metrics.total_zec_transferred / 1e8).toLocaleString(undefined, { maximumFractionDigits: 0 })} ZEC Transferred • {ep.metrics.privacy_metrics.shielded_transactions_count} Shielded Txs
                        </span>
                    )}
                </div>
                <Link href={ep.url} className="flex items-center px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm transition-colors" target="_blank">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  Play Episode
                </Link>
              </div>
            ))}
            {episodes.length <= 1 && <p className="text-zinc-500 italic text-center py-8">No older episodes in the archive.</p>}
          </div>
        </div>

        <footer className="mt-20 mb-8 text-zinc-600 text-sm">
            <Link href="https://github.com/OOlajide/zcast" target="_blank" className="flex items-center gap-2 hover:text-zinc-400 transition-colors">
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                Source Code
            </Link>
        </footer>
      </div>
    </main>
  );
}