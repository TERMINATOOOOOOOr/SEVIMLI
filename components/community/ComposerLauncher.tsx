"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { PenLine, Sparkles, X } from "lucide-react";
import type { CommunityPost, Product, Viewer } from "@/lib/types";
import { useLang } from "@/components/LangProvider";
import PostComposer from "@/components/community/PostComposer";

interface Props {
  products: Product[];
  viewer: Viewer | null;
  onCreated?: (post: CommunityPost) => void;
  requireAuth?: () => boolean;
}

/** Компактная кнопка над лентой; форма поста выплывает в окне и не занимает место на странице. */
export default function ComposerLauncher({
  products,
  viewer,
  onCreated,
  requireAuth,
}: Props) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);

  // Пока окно открыто: страница под ним не прокручивается, Esc закрывает
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-4 text-left transition-colors hover:border-primary/40"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-light text-primary">
          <Sparkles size={18} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-neutral-900">
            {t.composer.openTitle}
          </span>
          <span className="line-clamp-2 block text-sm text-neutral-500">
            {t.composer.openHint}
          </span>
        </span>
        <span className="btn-primary shrink-0 !px-4 !py-2 text-sm">
          <PenLine size={16} /> {t.composer.openBtn}
        </span>
      </button>

      {/* Портал в body: страница сообщества — отдельный слой (isolate), внутри него окно оказалось бы под нижним меню */}
      {open &&
        createPortal(
          <div
            className="animate-backdrop-in fixed inset-0 z-[100] flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
            onClick={() => setOpen(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label={t.composer.title}
              className="animate-sheet-up max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl sm:max-w-xl sm:rounded-3xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-primary" />
                  <h2 className="font-semibold text-neutral-900">
                    {t.composer.title}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100"
                  aria-label={t.composer.close}
                >
                  <X size={20} />
                </button>
              </div>
              <PostComposer
                bare
                products={products}
                viewer={viewer}
                onCreated={onCreated}
                requireAuth={requireAuth}
                onDone={() => setOpen(false)}
              />
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
