"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import {
  Monster,
  ELEMENTS,
  RARITIES,
  HABITATS,
  ELEMENT_BADGE_CLASSES,
} from "@/lib/types";

function MonstersContent() {
  const { user, loading: authLoading, showFlash } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [monsters, setMonsters] = useState<Monster[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // 検索条件
  const [q, setQ] = useState(searchParams.get("q") || "");
  const [element, setElement] = useState(searchParams.get("element") || "");
  const [rarity, setRarity] = useState<string>(searchParams.get("rarity") || "");
  const [habitat, setHabitat] = useState(searchParams.get("habitat") || "");
  const [sort, setSort] = useState(searchParams.get("sort") || "id");
  const [order, setOrder] = useState(searchParams.get("order") || "asc");
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1", 10));

  // アコーディオン開閉状態（検索条件が入っていれば開く）
  const hasActiveSearch = Boolean(q || element || rarity || habitat);
  const [searchOpen, setSearchOpen] = useState(hasActiveSearch);

  // 説明ツールチップ
  const [activeTooltipId, setActiveTooltipId] = useState<number | null>(null);

  const fetchMonsters = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getMonsters({
        q: q || undefined,
        element: element || undefined,
        rarity: rarity ? parseInt(rarity, 10) : undefined,
        habitat: habitat || undefined,
        sort,
        order,
        page,
        limit: 10,
      });
      setMonsters(res.monsters);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err: any) {
      showFlash(err.message || "モンスター一覧の取得に失敗しました。", "error");
    } finally {
      setLoading(false);
    }
  }, [q, element, rarity, habitat, sort, order, page, showFlash]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchMonsters();
    }
  }, [user, fetchMonsters]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchMonsters();
  };

  const handleClearSearch = () => {
    setQ("");
    setElement("");
    setRarity("");
    setHabitat("");
    setPage(1);
  };

  const handleSort = (column: string) => {
    if (sort === column) {
      setOrder(order === "asc" ? "desc" : "asc");
    } else {
      setSort(column);
      setOrder("asc");
    }
    setPage(1);
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`「${name}」を削除します。よろしいですか？`)) {
      return;
    }
    try {
      await api.deleteMonster(id);
      showFlash("モンスターを削除しました。", "success");
      fetchMonsters();
    } catch (err: any) {
      showFlash(err.message || "削除に失敗しました。", "error");
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-slate-500 text-sm">読み込み中...</div>
      </div>
    );
  }

  const renderStars = (count: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={i < count ? "text-amber-500" : "text-amber-200"}
      >
        {i < count ? "★" : "☆"}
      </span>
    ));
  };

  return (
    <>
      <Header onResetSuccess={fetchMonsters} />

      <main id="page-top" className="mx-auto max-w-6xl px-4 pb-12 pt-20">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">モンスター一覧</h2>
          <Link
            href="/monsters/new"
            id="new-monster-link"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            新規登録
          </Link>
        </div>

        {/* 検索・絞り込みアコーディオン */}
        <div className="mb-4 rounded-xl bg-white shadow">
          <button
            type="button"
            id="search-toggle"
            onClick={() => setSearchOpen(!searchOpen)}
            className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
            aria-expanded={searchOpen}
            aria-controls="search-panel"
          >
            <span className="flex items-center gap-2">
              <svg
                id="search-toggle-icon"
                xmlns="http://www.w3.org/2000/svg"
                className={`h-4 w-4 transition-transform duration-200 ${
                  searchOpen ? "rotate-90" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
              検索条件
              {hasActiveSearch && (
                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                  適用中
                </span>
              )}
            </span>
            <span className="text-xs text-slate-400" id="search-toggle-hint">
              {searchOpen ? "クリックで折りたたむ" : "クリックで展開"}
            </span>
          </button>

          {searchOpen && (
            <div id="search-panel" className="border-t border-slate-200 px-4 pb-4 pt-3">
              <form onSubmit={handleSearchSubmit} id="search-form" className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label htmlFor="search-q" className="mb-1 block text-xs font-medium text-slate-600">
                      名前
                    </label>
                    <input
                      type="text"
                      id="search-q"
                      name="q"
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="部分一致で検索"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                  </div>
                  <div>
                    <label htmlFor="search-element" className="mb-1 block text-xs font-medium text-slate-600">
                      属性
                    </label>
                    <select
                      id="search-element"
                      name="element"
                      value={element}
                      onChange={(e) => setElement(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    >
                      <option value="">すべて</option>
                      {ELEMENTS.map((el) => (
                        <option key={el} value={el}>
                          {el}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="search-rarity" className="mb-1 block text-xs font-medium text-slate-600">
                      レア度
                    </label>
                    <select
                      id="search-rarity"
                      name="rarity"
                      value={rarity}
                      onChange={(e) => setRarity(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    >
                      <option value="">すべて</option>
                      {RARITIES.map((r) => (
                        <option key={r} value={r}>
                          {"★".repeat(r) + "☆".repeat(5 - r)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="search-habitat" className="mb-1 block text-xs font-medium text-slate-600">
                      出現地域
                    </label>
                    <select
                      id="search-habitat"
                      name="habitat"
                      value={habitat}
                      onChange={(e) => setHabitat(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    >
                      <option value="">すべて</option>
                      {HABITATS.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="submit"
                    id="search-submit"
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 cursor-pointer"
                  >
                    検索
                  </button>
                  <button
                    type="button"
                    id="search-reset"
                    onClick={handleClearSearch}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    クリア
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* 件数サマリー */}
        {total > 0 && (
          <p className="mb-3 text-sm text-slate-600" id="list-summary">
            全 {total} 件中 {(page - 1) * 10 + 1}〜{Math.min(page * 10, total)} 件を表示
          </p>
        )}

        {/* テーブル */}
        <div className="overflow-x-auto rounded-xl bg-white shadow">
          <table className="min-w-full divide-y divide-slate-200" id="monsters-table">
            <thead className="bg-slate-50">
              <tr>
                {[
                  { col: "id", label: "ID" },
                  { col: "name", label: "名前" },
                  { col: "element", label: "属性" },
                  { col: "rarity", label: "レア度" },
                  { col: "habitats", label: "出現地域" },
                  { col: "hp", label: "HP" },
                  { col: "attack", label: "攻撃力" },
                ].map(({ col, label }) => (
                  <th
                    key={col}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 cursor-pointer select-none"
                    onClick={() => handleSort(col)}
                  >
                    <span className="inline-flex items-center gap-1 hover:text-indigo-600">
                      {label}
                      {sort === col && (
                        <span className="sort-indicator text-indigo-600">
                          {order === "asc" ? "▲" : "▼"}
                        </span>
                      )}
                    </span>
                  </th>
                ))}
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  説明
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-sm text-slate-500">
                    読み込み中...
                  </td>
                </tr>
              ) : monsters.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-sm text-slate-500">
                    {hasActiveSearch
                      ? "検索条件に一致するモンスターが見つかりません。"
                      : "モンスターが登録されていません。"}
                  </td>
                </tr>
              ) : (
                monsters.map((monster) => (
                  <tr
                    key={monster.id}
                    data-monster-id={monster.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm">{monster.id}</td>
                    <td className="px-4 py-3 text-sm font-medium">{monster.name}</td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                          ELEMENT_BADGE_CLASSES[monster.element] ||
                          "bg-slate-100 text-slate-800"
                        }`}
                        data-element={monster.element}
                      >
                        {monster.element}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className="rarity-stars inline-flex tracking-wide"
                        aria-label={`レア度 ${monster.rarity}`}
                        data-rarity={monster.rarity}
                      >
                        {renderStars(monster.rarity)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{monster.habitats}</td>
                    <td className="px-4 py-3 text-sm" data-field="hp">
                      {monster.hp}
                    </td>
                    <td className="px-4 py-3 text-sm" data-field="attack">
                      {monster.attack}
                    </td>
                    <td className="px-4 py-3 text-sm relative">
                      {monster.description ? (
                        <div className="relative inline-flex">
                          <button
                            type="button"
                            onClick={() =>
                              setActiveTooltipId(
                                activeTooltipId === monster.id ? null : monster.id
                              )
                            }
                            className="description-hover-trigger rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 cursor-pointer"
                            aria-label="説明文を表示"
                            data-testid={`description-icon-${monster.id}`}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                              />
                            </svg>
                          </button>
                          {activeTooltipId === monster.id && (
                            <div
                              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-64 rounded-lg bg-slate-900 px-3 py-2 text-xs text-white shadow-lg"
                              role="tooltip"
                              data-testid={`description-tooltip-${monster.id}`}
                            >
                              {monster.description}
                              <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/monsters/${monster.id}/edit`}
                          className="edit-link rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-100"
                          data-monster-id={monster.id}
                        >
                          編集
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(monster.id, monster.name)}
                          className="delete-button rounded border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50 cursor-pointer"
                          data-monster-id={monster.id}
                        >
                          削除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ページネーション */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              前へ
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium cursor-pointer ${
                  p === page
                    ? "bg-indigo-600 text-white"
                    : "border border-slate-300 text-slate-700 hover:bg-slate-50"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              次へ
            </button>
          </div>
        )}
      </main>
    </>
  );
}

export default function MonstersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-slate-500 text-sm">読み込み中...</div>
        </div>
      }
    >
      <MonstersContent />
    </Suspense>
  );
}
