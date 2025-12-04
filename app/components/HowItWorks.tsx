'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function HowItWorks() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30 hover:bg-zinc-200/50 lg:hover:bg-zinc-800/50 transition-colors cursor-pointer"
      >
        How it works
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)}>
          <div 
            className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 max-w-lg w-full shadow-2xl relative" 
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>

            <h2 className="text-2xl font-bold mb-4 text-white">How it works</h2>
            
            <div className="space-y-4 text-zinc-300 text-sm leading-relaxed">
              <p>
                This podcast is generated automatically every day at <span className="text-amber-400 font-semibold">12:00 PM UTC</span>.
              </p>

              <p>
                The pipeline ingests raw <Link href="https://blockchair.com/dumps" target="_blank" className="text-blue-400 hover:underline">Zcash daily data dumps from Blockchair</Link> to analyze network activity.
              </p>

              <p>
                Our <Link href="https://github.com/OOlajide/zcast/blob/main/lib/analytics.py" target="_blank" className="text-blue-400 hover:underline">analytics script</Link> processes this data to extract key metrics like privacy flow, shielded transaction counts, and network throughput.
              </p>
              
              <p>
                The system maintains context of previous days' metrics to identify trends, anomalies, and significant shifts in the ecosystem, ensuring the commentary is relevant and insightful.
              </p>

              <p className="text-zinc-400 italic">
                Orchestrated by a daily pipeline and scheduler to ensure you get fresh intelligence with your morning coffee.
              </p>
            </div>
            
            <div className="mt-6 flex justify-end">
                <button 
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors"
                >
                  Close
                </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
