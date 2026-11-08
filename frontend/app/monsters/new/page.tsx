"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import MonsterForm from "@/components/MonsterForm";
import { useAuth } from "@/lib/auth-context";

export default function NewMonsterPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-slate-500 text-sm">読み込み中...</div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-4 pt-20">
        <MonsterForm mode="new" />
      </main>
    </>
  );
}

