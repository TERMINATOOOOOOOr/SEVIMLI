'use client'

import { useRef, useState } from 'react'
import { Sparkles, ImagePlus, X } from 'lucide-react'
import type { PostKind, Product } from '@/lib/types'
import { useCommunity } from '@/store/community'
import { useLang } from '@/components/LangProvider'
import { productName } from '@/lib/product-i18n'
import { cn } from '@/lib/utils'

const MAX_IMAGES = 2

/** Файл → сжатый dataURL (длинная сторона 900px), чтобы не раздувать localStorage. */
function fileToDataUrl(file: File, maxSide = 900): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.82))
    }
    img.onerror = (e) => {
      URL.revokeObjectURL(url)
      reject(e)
    }
    img.src = url
  })
}

export default function PostComposer({ products }: { products: Product[] }) {
  const { lang, t } = useLang()
  const addPost = useCommunity((s) => s.addPost)
  const authorName = useCommunity((s) => s.authorName)
  const setAuthorName = useCommunity((s) => s.setAuthorName)

  const [kind, setKind] = useState<PostKind>('review')
  const [text, setText] = useState('')
  const [tags, setTags] = useState('')
  const [productId, setProductId] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [sent, setSent] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const KINDS: { id: PostKind; label: string }[] = [
    { id: 'review', label: t.community.kindReview },
    { id: 'question', label: t.community.kindQuestion },
    { id: 'tip', label: t.community.kindTip },
  ]

  const PLACEHOLDER: Record<PostKind, string> = {
    review: t.composer.placeholderReview,
    question: t.composer.placeholderQuestion,
    tip: t.composer.placeholderTip,
  }

  async function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    // accept="image/*" — лишь подсказка UI; отсеиваем не-картинки явно
    // (плюс canvas-реэнкод ниже гарантирует чистый JPEG без чужих payload'ов)
    const files = Array.from(e.target.files ?? [])
      .filter((f) => f.type.startsWith('image/'))
      .slice(0, MAX_IMAGES - images.length)
    e.target.value = ''
    for (const f of files) {
      try {
        const dataUrl = await fileToDataUrl(f)
        setImages((prev) => (prev.length < MAX_IMAGES ? [...prev, dataUrl] : prev))
      } catch {
        /* битый файл — пропускаем */
      }
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const value = text.trim()
    if (!value) return
    addPost({
      kind,
      text: value,
      tags: tags
        .split(/[,\s]+/)
        .map((tg) => tg.replace(/^#/, '').trim().toLowerCase())
        .filter(Boolean)
        .slice(0, 5),
      product_id: productId || null,
      images,
    })
    setText('')
    setTags('')
    setProductId('')
    setImages([])
    setSent(true)
    setTimeout(() => setSent(false), 2500)
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-neutral-200 bg-white p-5">
      <div className="flex items-center gap-2">
        <Sparkles size={18} className="text-primary" />
        <h2 className="font-semibold text-neutral-900">{t.composer.title}</h2>
      </div>

      {/* Тип поста */}
      <div className="mt-4 flex gap-1.5">
        {KINDS.map((k) => (
          <button
            key={k.id}
            type="button"
            onClick={() => setKind(k.id)}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
              kind === k.id
                ? 'bg-primary text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200',
            )}
          >
            {k.label}
          </button>
        ))}
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        placeholder={PLACEHOLDER[kind]}
        className="input mt-4 resize-none"
      />

      {/* Прикреплённые фото */}
      {images.length > 0 && (
        <div className="mt-3 flex gap-2">
          {images.map((src, i) => (
            <div key={i} className="relative h-20 w-20 overflow-hidden rounded-xl border border-neutral-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                className="absolute right-1 top-1 rounded-full bg-neutral-900/70 p-0.5 text-white hover:bg-neutral-900"
                aria-label="✕"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-neutral-600">{t.composer.yourName}</label>
          <input
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            className="input !py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-neutral-600">{t.composer.tags}</label>
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder={t.composer.tagsPlaceholder}
            className="input !py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-neutral-600">{t.composer.product}</label>
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="input !py-2 text-sm"
          >
            <option value="">{t.composer.noProduct}</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {productName(p, lang)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button type="submit" disabled={!text.trim()} className="btn-primary !py-2.5 text-sm">
          {t.composer.publish}
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={images.length >= MAX_IMAGES}
          className="flex items-center gap-1.5 rounded-full bg-neutral-100 px-4 py-2.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-200 disabled:opacity-40"
        >
          <ImagePlus size={16} />
          {t.composer.addPhoto}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          onChange={onPickFiles}
          className="hidden"
        />
        {sent && <span className="text-sm text-secondary">{t.composer.published}</span>}
      </div>
    </form>
  )
}
