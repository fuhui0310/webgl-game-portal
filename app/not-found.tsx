import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-full flex-1 flex-col items-center justify-center bg-zinc-950 px-6 py-16 text-center text-zinc-100">
      <p className="font-mono text-7xl font-bold tracking-[0.2em] text-lime-400 sm:text-8xl">
        404
      </p>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight sm:text-3xl">
        找不到頁面
      </h1>
      <p className="mt-4 max-w-md text-sm leading-7 text-zinc-400 sm:text-base">
        這裡什麼都沒有，但首頁有一台街機可以打發時間。
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex min-h-11 items-center justify-center rounded-full border border-lime-400 px-6 py-2.5 font-mono text-sm tracking-widest text-lime-300 transition-colors hover:bg-lime-400 hover:text-zinc-950"
      >
        回首頁玩街機
      </Link>
    </main>
  );
}
