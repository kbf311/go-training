"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function Header({ onResetSuccess }: { onResetSuccess?: () => void }) {
  const { user, logout, resetData, flash, setFlash } = useAuth();

  const handleReset = async () => {
    if (!window.confirm("モンスターデータを初期状態に戻します。よろしいですか？")) {
      return;
    }
    try {
      await resetData();
      if (onResetSuccess) {
        onResetSuccess();
      }
    } catch (err: any) {
      alert(err.message || "データ初期化に失敗しました。");
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold">
            <Link
              href="/monsters"
              id="header-title"
              className="text-slate-900 hover:text-indigo-700 transition-colors"
            >
              モンスター図鑑
            </Link>
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500" id="header-username">
              {user?.username}
            </span>
            <button
              type="button"
              id="data-reset-button"
              onClick={handleReset}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 cursor-pointer"
            >
              データ初期化
            </button>
            <button
              type="button"
              id="logout-link"
              onClick={logout}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>

      {flash && (
        <div className="mx-auto max-w-6xl px-4 pt-20">
          <div
            className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
              flash.type === "error"
                ? "bg-red-100 text-red-700"
                : "bg-green-100 text-green-700"
            }`}
            data-flash={flash.type}
          >
            <span>{flash.text}</span>
            <button
              type="button"
              onClick={() => setFlash(null)}
              className="ml-2 font-bold hover:opacity-75"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}

