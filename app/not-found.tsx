import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-full flex-1 flex-col items-center justify-center bg-black px-6 py-16 text-center text-white">
      <style>{`
        @keyframes notfound-glitch {
          0%, 86%, 100% { transform: none; clip-path: inset(0); opacity: 1; }
          88% { transform: translate(-5px, 1px); clip-path: inset(18% 0 52% 0); opacity: 0.85; }
          91% { transform: translate(5px, -2px); clip-path: inset(62% 0 8% 0); opacity: 1; }
          94% { transform: translate(-2px, 0); opacity: 0.2; }
          97% { transform: none; opacity: 1; }
        }
        @keyframes notfound-flicker {
          0%, 18%, 22%, 100% { opacity: 1; }
          20% { opacity: 0.12; }
        }
        .not-found-glitch {
          position: relative;
          animation: notfound-glitch 2.6s steps(1, end) infinite, notfound-flicker 4s infinite;
        }
        .not-found-glitch::before,
        .not-found-glitch::after {
          content: attr(data-text);
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          overflow: hidden;
        }
        .not-found-glitch::before {
          transform: translate(3px, 0);
          clip-path: inset(0 0 58% 0);
          opacity: 0.7;
        }
        .not-found-glitch::after {
          transform: translate(-3px, 0);
          clip-path: inset(62% 0 0 0);
          opacity: 0.7;
        }
      `}</style>
      <p
        className="not-found-glitch font-mono text-7xl font-bold tracking-[0.2em] text-white sm:text-8xl"
        data-text="404"
      >
        404
      </p>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight sm:text-3xl">
        找不到頁面
      </h1>
      <p className="mt-4 max-w-md text-sm leading-7 text-white sm:text-base">
        這裡什麼都沒有，但首頁有一隻兔子。
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex min-h-11 items-center justify-center rounded-none border-2 border-white px-6 py-2.5 font-mono text-sm tracking-widest text-white transition-colors hover:bg-white hover:text-black"
      >
        回首頁找兔子
      </Link>
    </main>
  );
}
