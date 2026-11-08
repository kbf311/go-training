"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ELEMENTS, RARITIES, HABITATS, MonsterPayload, Monster } from "@/lib/types";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

interface MonsterFormProps {
  initialData?: Monster;
  mode: "new" | "edit";
}

export default function MonsterForm({ initialData, mode }: MonsterFormProps) {
  const router = useRouter();
  const { showFlash } = useAuth();

  const [name, setName] = useState(initialData?.name || "");
  const [element, setElement] = useState(initialData?.element || "");
  const [rarity, setRarity] = useState<number>(initialData?.rarity || 3);
  const [habitats, setHabitats] = useState<string[]>(
    initialData?.habitat_list || []
  );
  const [hp, setHp] = useState<number | string>(
    initialData?.hp !== undefined ? initialData.hp : 100
  );
  const [attack, setAttack] = useState<number | string>(
    initialData?.attack !== undefined ? initialData.attack : 50
  );
  const [description, setDescription] = useState(initialData?.description || "");

  // 編集モードでのモーダル用state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempDescription, setTempDescription] = useState(description);

  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleHabitatToggle = (habitat: string) => {
    if (habitats.includes(habitat)) {
      setHabitats(habitats.filter((h) => h !== habitat));
    } else {
      setHabitats([...habitats, habitat]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    const validationErrors: string[] = [];
    if (!name.trim()) validationErrors.push("名前は必須です。");
    if (!element) validationErrors.push("属性を選択してください。");
    if (!rarity) validationErrors.push("レア度を選択してください。");
    if (habitats.length === 0) validationErrors.push("出現地域を1つ以上選択してください。");
    if (hp === "" || Number(hp) < 0) validationErrors.push("HPは0以上の数値で入力してください。");
    if (attack === "" || Number(attack) < 0) validationErrors.push("攻撃力は0以上の数値で入力してください。");

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSubmitting(true);
    const payload: MonsterPayload = {
      name: name.trim(),
      element,
      rarity: Number(rarity),
      habitats,
      hp: Number(hp),
      attack: Number(attack),
      description: description.trim(),
    };

    try {
      if (mode === "new") {
        await api.createMonster(payload);
        showFlash("モンスターを登録しました。", "success");
      } else if (initialData?.id) {
        await api.updateMonster(initialData.id, payload);
        showFlash("モンスターを更新しました。", "success");
      }
      router.push("/monsters");
    } catch (err: any) {
      const msgs = err.message ? err.message.split("\n") : ["保存に失敗しました。"];
      setErrors(msgs);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (count: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < count ? "text-amber-500" : "text-amber-200"}>
        {i < count ? "★" : "☆"}
      </span>
    ));
  };

  return (
    <div className="mx-auto max-w-2xl pb-12">
      <h2 className="mb-6 text-lg font-semibold text-slate-900">
        {mode === "new" ? "モンスター新規登録" : "モンスター編集"}
      </h2>

      {errors.length > 0 && (
        <div className="mb-4 space-y-1">
          {errors.map((msg, i) => (
            <p
              key={i}
              className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700"
              data-flash="error"
            >
              {msg}
            </p>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 rounded-xl bg-white p-6 shadow" id="monster-form">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-700">
            名前 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>

        <div>
          <label htmlFor="element" className="mb-1 block text-sm font-medium text-slate-700">
            属性 <span className="text-red-500">*</span>
          </label>
          <select
            id="element"
            name="element"
            required
            value={element}
            onChange={(e) => setElement(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          >
            <option value="">選択してください</option>
            {ELEMENTS.map((el) => (
              <option key={el} value={el}>
                {el}
              </option>
            ))}
          </select>
        </div>

        <div>
          <span className="mb-2 block text-sm font-medium text-slate-700">
            レア度 <span className="text-red-500">*</span>
          </span>
          <div className="flex gap-4">
            {RARITIES.map((r) => (
              <label key={r} className="inline-flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="rarity"
                  value={r}
                  required
                  checked={rarity === r}
                  onChange={() => setRarity(r)}
                  className="text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <span className="rarity-stars inline-flex tracking-wide" aria-label={`レア度 ${r}`}>
                  {renderStars(r)}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <span className="mb-2 block text-sm font-medium text-slate-700">
            出現地域 <span className="text-red-500">*</span>
          </span>
          <div className="flex flex-wrap gap-4">
            {HABITATS.map((habitat) => (
              <label key={habitat} className="inline-flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  name="habitats"
                  value={habitat}
                  checked={habitats.includes(habitat)}
                  onChange={() => handleHabitatToggle(habitat)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                {habitat}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="hp" className="mb-1 block text-sm font-medium text-slate-700">
            HP <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="hp"
            name="hp"
            min={0}
            required
            value={hp}
            onChange={(e) => setHp(e.target.value === "" ? "" : Number(e.target.value))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>

        <div>
          <label htmlFor="attack" className="mb-1 block text-sm font-medium text-slate-700">
            攻撃力 <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="attack"
            name="attack"
            min={0}
            required
            value={attack}
            onChange={(e) => setAttack(e.target.value === "" ? "" : Number(e.target.value))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>

        {mode === "new" ? (
          <div>
            <label htmlFor="description" className="mb-1 block text-sm font-medium text-slate-700">
              説明文
            </label>
            <textarea
              id="description"
              name="description"
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>
        ) : (
          <div>
            <span className="mb-1 block text-sm font-medium text-slate-700">説明文</span>
            <p
              id="description-preview"
              className="mb-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 whitespace-pre-wrap min-h-[4rem]"
            >
              {description || "（未入力）"}
            </p>
            <button
              type="button"
              id="description-edit-button"
              onClick={() => {
                setTempDescription(description);
                setIsModalOpen(true);
              }}
              className="rounded-lg border border-indigo-300 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50 cursor-pointer"
            >
              説明文を編集
            </button>
          </div>
        )}

        {/* 編集時のモーダル */}
        {isModalOpen && (
          <div
            id="description-modal"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            role="dialog"
            aria-modal="true"
            aria-labelledby="description-modal-title"
          >
            <div className="mx-4 w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
              <h3 id="description-modal-title" className="mb-4 text-lg font-semibold text-slate-900">
                説明文の編集
              </h3>
              <textarea
                id="modal-description"
                rows={8}
                value={tempDescription}
                onChange={(e) => setTempDescription(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
              <div className="mt-4 flex justify-end gap-3">
                <button
                  type="button"
                  id="description-modal-cancel"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  id="description-modal-apply"
                  onClick={() => {
                    setDescription(tempDescription);
                    setIsModalOpen(false);
                  }}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 cursor-pointer"
                >
                  適用
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            id="monster-form-submit"
            disabled={submitting}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
          >
            {submitting ? "保存中..." : mode === "new" ? "保存" : "更新"}
          </button>
          <Link
            href="/monsters"
            id="monster-form-cancel"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 inline-flex items-center"
          >
            キャンセル
          </Link>
        </div>
      </form>
    </div>
  );
}

