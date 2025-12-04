import fs from 'fs';
import path from 'path';
import Link from 'next/link';

export const revalidate = 3600; // Revalidate every hour

export default function DailyPodcastPage() {
  interface Episode {
    filename: string;
    dateStr: string;
    formattedDate: string;
    url: string;
  }

  const podcastDir = path.join(process.cwd(), 'public', 'podcasts');
  let episodes: Episode[] = [];

  if (fs.existsSync(podcastDir)) {
    const files = fs.readdirSync(podcastDir).filter(file => file.endsWith('.mp3'));
    episodes = files.map(file => {
      // Extract date from filename: zcash_daily_podcast_YYYYMMDD.mp3
      const match = file.match(/(\d{8})\.mp3$/);
      const dateStr = match ? match[1] : '';
      const formattedDate = dateStr 
        ? new Date(dateStr.slice(0, 4) + '-' + dateStr.slice(4, 6) + '-' + dateStr.slice(6, 8)).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) 
        : 'Unknown Date';
      
      return {
        filename: file,
        dateStr,
        formattedDate,
        url: `/podcasts/${file}`
      };
    }).sort((a, b) => b.dateStr.localeCompare(a.dateStr));
  }

  const latestEpisode = episodes[0];

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-zinc-900 text-white">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
          Zcash Daily Intelligence
        </p>
      </div>

      <div className="mt-16 flex flex-col items-center">
        <h1 className="text-4xl font-bold mb-8">Daily On-Chain Report</h1>

        {latestEpisode ? (
          <div className="bg-zinc-800 p-8 rounded-2xl shadow-xl w-full max-w-md border border-zinc-700">
            <h2 className="text-2xl font-semibold mb-2">Latest Episode</h2>
            <p className="text-zinc-400 mb-6">{latestEpisode.formattedDate}</p>
            
            <audio controls className="w-full mb-4">
              <source src={latestEpisode.url} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
            
            <div className="text-xs text-zinc-500 text-center">
              Auto-generated from on-chain metrics.
            </div>
          </div>
        ) : (
          <div className="text-center p-12 border border-dashed border-zinc-700 rounded-xl">
            <p className="text-xl mb-2">No episodes available yet.</p>
            <p className="text-zinc-500">The pipeline runs daily at 12:00 PM UTC.</p>
          </div>
        )}

        <div className="mt-12 w-full max-w-md">
          <h3 className="text-xl font-semibold mb-4 border-b border-zinc-700 pb-2">Archives</h3>
          <ul className="space-y-2">
            {episodes.slice(1).map((ep) => (
              <li key={ep.filename} className="flex justify-between items-center p-3 hover:bg-zinc-800 rounded transition">
                <span>{ep.formattedDate}</span>
                <Link href={ep.url} className="text-blue-400 hover:underline" target="_blank">
                  Play
                </Link>
              </li>
            ))}
            {episodes.length <= 1 && <p className="text-zinc-500 italic">No older episodes.</p>}
          </ul>
        </div>
      </div>
    </main>
  );
}
