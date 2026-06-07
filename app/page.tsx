"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-2xl flex-col items-center justify-center gap-12 py-32 px-16">
        <div className="flex flex-col items-center gap-6 text-center">
          <h1 className="text-5xl font-bold text-black dark:text-zinc-50">⏰ Alarm Clock</h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">Simple and intuitive alarm management</p>
        </div>

        <div className="flex gap-4 flex-col sm:flex-row">
          <Link
            href="/configure"
            className="flex h-12 items-center justify-center rounded-lg bg-black px-8 text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            Create Alarm
          </Link>
        </div>
      </main>
    </div>
  );
}
