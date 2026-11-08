"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import MonsterForm from "@/components/MonsterForm";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Monster } from "@/lib/types";

function EditMonsterContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const monsterId = Number(params?.id);

  const [monster, setMonster] = useState<Monster | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!monsterId || isNaN(monsterId)) {
      setError("無効なモンスターIDです。");
      setLoading(false);
      return;
    }

    const loadMonster = async () => {
      try {
        const data = await api.getMonster(monsterId);
        setMonster(data);
      } catch (err: any) {
        setError(err.message || "モンスターの取得に失敗しました。");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadMonster();
    }
  }, [monsterId, user]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-slate-500 text-sm">読み込み中...</div>
      </div>
    );
  }

  if (error || !monster) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-6xl px-4 pt-20">
          <div className="rounded-xl bg-white p-6 shadow">
            <p className="text-red-600 mb-4">{error || "モンスターが見つかりませんでした。"}</p>
            <button
              onClick={() => router.push("/monsters")}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              一覧に戻る
            </button>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-4 pt-20">
        <MonsterForm mode="edit" initialData={monster} />
      </main>
    </>
  );
}

export default function EditMonsterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-slate-500 text-sm">読み込み中...</div>
        </div>
      }
    >
      <EditMonsterContent />
    </Suspense>
  );
}
