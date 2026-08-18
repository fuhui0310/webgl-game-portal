import { GameClient } from "@/app/play/GameClient";
import { redirect } from "next/navigation";
import { extractPlayToken, verifyPlayToken } from "@/lib/play-auth";
import {
  generateGamePresignedUrl,
  getGameBuildObjectKeys,
} from "@/lib/s3-game";

export const metadata = {
  title: "Play Now",
};

function InvalidOrExpiredLink() {
  return (
    <main className="flex min-h-full flex-1 flex-col items-center justify-center bg-zinc-950 px-6 text-center text-zinc-100">
      <div className="max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/80 p-10 shadow-xl">
        <h1 className="text-2xl font-semibold tracking-tight">
          連結無效或已過期
        </h1>
        <p className="mt-4 text-sm leading-6 text-zinc-400">
          這個遊戲連結無法使用。請向管理員索取一組新的遊玩連結後再試一次。
        </p>
      </div>
    </main>
  );
}

function GameLoadError() {
  return (
    <main className="flex min-h-full flex-1 flex-col items-center justify-center bg-zinc-950 px-6 text-center text-zinc-100">
      <div className="max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/80 p-10 shadow-xl">
        <h1 className="text-2xl font-semibold tracking-tight">
          遊戲暫時無法載入
        </h1>
        <p className="mt-4 text-sm leading-6 text-zinc-400">
          驗證已通過，但遊戲檔案網址產生失敗。請稍後再試，或聯繫管理員。
        </p>
      </div>
    </main>
  );
}

export default async function PlayPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const { token } = await searchParams;
  const playToken = extractPlayToken(token);

  if (!playToken || !verifyPlayToken(playToken)) {
    if (token) {
      redirect("/play");
    }
    return <InvalidOrExpiredLink />;
  }

  const gamePrefix = process.env.MM_S3_GAME_PREFIX;
  if (!gamePrefix) {
    throw new Error("Missing required environment variable: MM_S3_GAME_PREFIX");
  }

  let preSignedUrls;

  try {
    const keys = getGameBuildObjectKeys(gamePrefix);
    preSignedUrls = await Promise.all([
      generateGamePresignedUrl(keys.loaderKey),
      generateGamePresignedUrl(keys.dataKey),
      generateGamePresignedUrl(keys.frameworkKey),
      generateGamePresignedUrl(keys.codeKey),
    ]);
  } catch {
    return <GameLoadError />;
  }

  const [loaderUrl, dataUrl, frameworkUrl, codeUrl] = preSignedUrls;

  return (
    <GameClient
      loaderUrl={loaderUrl}
      dataUrl={dataUrl}
      frameworkUrl={frameworkUrl}
      codeUrl={codeUrl}
    />
  );
}
