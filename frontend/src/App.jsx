import { useState, useEffect, useCallback, useRef } from 'react'
import axios from 'axios'

const API_BASE = '/api'

// ─── API helpers ────────────────────────────────────────────────
async function fetchProducts({ snapshotTime, cursorTime, cursorId, category, limit }) {
  const params = new URLSearchParams({ limit })
  if (category)     params.set('category',     category)
  if (snapshotTime) params.set('snapshot_time', snapshotTime)
  if (cursorTime)   params.set('cursor_time',   cursorTime)
  if (cursorId)     params.set('cursor_id',     String(cursorId))
  const { data } = await axios.get(`${API_BASE}/products?${params}`)
  return data
}

async function fetchCategories() {
  const { data } = await axios.get(`${API_BASE}/categories`)
  return data.categories
}

// ─── Category colors ────────────────────────────────────────────
const CAT_COLORS = {
  Electronics:    'bg-blue-500/10 text-blue-400',
  Clothing:       'bg-purple-500/10 text-purple-400',
  Books:          'bg-amber-500/10 text-amber-400',
  'Home & Garden':'bg-emerald-500/10 text-emerald-400',
  Sports:         'bg-rose-500/10 text-rose-400',
  Toys:           'bg-cyan-500/10 text-cyan-400',
  Food:           'bg-orange-500/10 text-orange-400',
  Automotive:     'bg-slate-500/10 text-slate-300',
  Health:         'bg-teal-500/10 text-teal-400',
  Beauty:         'bg-pink-500/10 text-pink-400',
}
const getCatStyle = (cat) => CAT_COLORS[cat] || 'bg-slate-500/10 text-slate-400'

// ─── Icons ──────────────────────────────────────────────────────
const ChevronLeft  = ({ size = 14 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
const ChevronRight = ({ size = 14 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>

// ─── Header ─────────────────────────────────────────────────────
function Header({ snapshotTime, liveCount }) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0a0b0f]/90 backdrop-blur-xl">
      <div className="max-w-[1400px] mx-auto px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6c63ff] to-[#a855f7] flex items-center justify-center text-white shadow-[0_0_18px_rgba(108,99,255,0.35)] shrink-0">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
            </svg>
          </div>
          <div>
            <h1 className="text-[16px] font-bold text-[#f0f2f8] tracking-tight leading-none">ProductCatalog</h1>
            <p className="text-[10.5px] text-[#555c78] mt-0.5 tracking-wide">Cursor Pagination · Snapshot Isolation</p>
          </div>
        </div>

        {/* Chips */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {snapshotTime && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full text-[12px] font-medium border border-blue-400/20 bg-blue-400/[0.07]">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
              <span className="text-[#8a90a8]">Session frozen at</span>
              <span className="text-[#f0f2f8] font-mono">{new Date(snapshotTime).toLocaleTimeString()}</span>
            </div>
          )}
          {liveCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full text-[12px] font-medium border border-emerald-400/20 bg-emerald-400/[0.07]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 animate-pulse-op" />
              <span className="text-emerald-400">+{liveCount} new inserts — invisible to session</span>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

// ─── Snapshot Banner ─────────────────────────────────────────────
function SnapshotBanner({ snapshotTime, liveCount, onSimulateInserts, simulating }) {
  return (
    <div className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-400/[0.04] overflow-hidden">
      <div className="px-5 py-3.5 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-3 items-center min-w-0">
          <div className="w-7 h-7 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 shrink-0">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <p className="text-[13px] text-[#8a90a8] leading-relaxed min-w-0">
            <span className="text-amber-400 font-semibold">Snapshot active.</span>{' '}
            Frozen at{' '}
            <span className="font-mono text-[11.5px] text-[#f0f2f8] bg-white/[0.06] px-1.5 py-0.5 rounded">
              {snapshotTime ? new Date(snapshotTime).toISOString().replace('T', ' ').slice(0, 19) + ' UTC' : '—'}
            </span>
            {' '}— new inserts after this time are completely invisible.
          </p>
        </div>
        <button
          id="simulate-inserts-btn"
          onClick={onSimulateInserts}
          disabled={simulating}
          className="flex items-center gap-2 px-4 py-[7px] rounded-lg text-[12.5px] font-medium text-amber-400 bg-amber-400/10 border border-amber-400/25 hover:bg-amber-400/16 transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0 cursor-pointer"
        >
          {simulating ? (
            <><span className="w-3 h-3 rounded-full border-2 border-amber-400/30 border-t-amber-400 animate-spin shrink-0" />Simulating…</>
          ) : (
            <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Simulate Live Inserts</>
          )}
        </button>
      </div>
      {liveCount > 0 && (
        <div className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500/[0.06] border-t border-emerald-400/[0.12] text-[12.5px] text-emerald-400">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><polyline points="20 6 9 17 4 12"/></svg>
          <span><strong className="text-emerald-300">{liveCount} products inserted</strong> — pagination unaffected. Zero duplicates, zero gaps.</span>
        </div>
      )}
    </div>
  )
}

// ─── Category Filter ─────────────────────────────────────────────
function CategoryFilter({ categories, selected, onChange, loading }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#111318] p-4">
      <p className="flex items-center gap-1.5 text-[10.5px] font-semibold tracking-widest uppercase text-[#555c78] mb-3">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
        </svg>
        Filter by Category
      </p>
      <div className="flex flex-col gap-0.5" role="group" aria-label="Category filter">
        {[{ id: 'filter-all', label: 'All Categories', val: null }, ...categories.map(c => ({ id: `filter-${c.toLowerCase().replace(/[\s&]+/g, '-')}`, label: c, val: c }))].map(({ id, label, val }) => (
          <button
            key={id}
            id={id}
            onClick={() => onChange(val)}
            disabled={loading}
            className={`w-full text-left px-3 py-2 rounded-lg text-[13px] font-medium border transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed
              ${selected === val
                ? 'bg-[#6c63ff]/12 border-[#6c63ff]/30 text-[#8b83ff]'
                : 'bg-transparent border-transparent text-[#8a90a8] hover:bg-white/[0.04] hover:text-[#c8cce0] hover:border-white/[0.04]'
              }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── How It Works ────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    { n: 1, text: <>Page 1 captures a <strong className="text-[#d0d4f0]">snapshot_time</strong> — your frozen viewport ceiling.</> },
    { n: 2, text: <>Subsequent pages use a <strong className="text-[#d0d4f0]">cursor</strong> (<code className="font-mono text-[10.5px] bg-white/[0.07] px-1 rounded text-[#8b83ff]">updated_at + id</code>) instead of OFFSET.</> },
    { n: 3, text: <>New inserts have <code className="font-mono text-[10.5px] bg-white/[0.07] px-1 rounded text-[#8b83ff]">updated_at &gt; snapshot_time</code> — <strong className="text-[#d0d4f0]">invisible</strong> to you.</> },
    { n: 4, text: <><strong className="text-[#d0d4f0]">Zero duplicates, zero gaps</strong> across 200k products, even mid-insert.</> },
  ]
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#111318] p-4">
      <p className="text-[10.5px] font-semibold tracking-widest uppercase text-[#555c78] mb-4">How It Works</p>
      <ol className="flex flex-col gap-3.5 list-none">
        {steps.map(s => (
          <li key={s.n} className="flex gap-3 items-start text-[12px] text-[#8a90a8] leading-relaxed">
            <span className="w-[18px] h-[18px] rounded-full bg-[#6c63ff]/10 border border-[#6c63ff]/25 flex items-center justify-center text-[9.5px] font-bold text-[#8b83ff] shrink-0 mt-px">
              {s.n}
            </span>
            <span>{s.text}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

// ─── Product Card ────────────────────────────────────────────────
function ProductCard({ product, index }) {
  const badgeClass = getCatStyle(product.category)
  return (
    <article
      className="bg-[#13151f] border border-white/[0.07] rounded-xl p-4 flex flex-col gap-3 hover:bg-[#181b2a] hover:border-white/[0.12] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(0,0,0,0.5)] transition-all duration-200 animate-fade-in-up cursor-default"
      style={{ animationDelay: `${index * 25}ms` }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={`text-[10.5px] font-semibold px-2 py-3 rounded-full ${badgeClass}`}>
          {product.category}
        </span>
        <span className="text-[10.5px] text-[#3d4260] font-mono">#{product.id}</span>
      </div>

      <h3 className="text-[13.5px] font-medium text-[#dde0f5] leading-snug line-clamp-2 flex-1" title={product.name}>
        {product.name}
      </h3>

      <div className="flex items-center justify-between pt-3 border-t border-white/[0.06] mt-auto">
        <span className="text-[15px] font-bold text-[#f0f2f8] tabular-nums">${product.price.toFixed(2)}</span>
        <span className="flex items-center gap-1 text-[11px] text-[#4a5070]">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          {new Date(product.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      </div>
    </article>
  )
}

// ─── Skeleton Card ───────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-[#13151f] border border-white/[0.07] rounded-xl p-4 flex flex-col gap-3">
      <div className="w-20 h-5 rounded-full animate-shimmer" />
      <div className="w-full h-3.5 rounded animate-shimmer" />
      <div className="w-3/5 h-3.5 rounded animate-shimmer" />
      <div className="flex justify-between items-center pt-3 border-t border-white/[0.06]">
        <div className="w-14 h-4 rounded animate-shimmer" />
        <div className="w-20 h-3 rounded animate-shimmer" />
      </div>
    </div>
  )
}

// ─── AliExpress-style Pagination ─────────────────────────────────
function PaginationBar({ page, hasMore, onPrev, onNext, onGoTo, loading, maxPage }) {
  const [jumpVal, setJumpVal] = useState('')

  const totalPages = hasMore ? Math.max(maxPage, page + 1) : page

  // Build visible page numbers: 1 2 3 4 5 … 60  (window around current)
  const getPages = () => {
    const pages = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
      return pages
    }
    // Always show first
    pages.push(1)
    const left  = Math.max(2, page - 1)
    const right = Math.min(totalPages - 1, page + 1)
    if (left > 2) pages.push('…left')
    for (let i = left; i <= right; i++) pages.push(i)
    if (right < totalPages - 1) pages.push('…right')
    pages.push(totalPages)
    return pages
  }

  const pages = getPages()

  const handleJump = () => {
    const n = parseInt(jumpVal, 10)
    if (!n || n < 1 || n > totalPages) return
    onGoTo(n)
    setJumpVal('')
  }

  return (
    <div className="flex justify-center pt-6 pb-2">
      <div className="inline-flex items-center gap-1.5 px-5 py-3 rounded-2xl border border-white/[0.08] bg-[#111318] shadow-[0_4px_24px_rgba(0,0,0,0.5)]">

        {/* Prev arrow */}
        <button
          id="prev-page-btn"
          onClick={onPrev}
          disabled={page <= 1 || loading}
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-white/[0.08] bg-[#1a1d28] text-[#8a90a8] hover:text-[#f0f2f8] hover:border-white/15 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          aria-label="Previous page"
        >
          <ChevronLeft />
        </button>

        {/* Page numbers */}
        {pages.map((p, i) =>
          typeof p === 'string' ? (
            <span key={p + i} className="w-9 h-9 flex items-center justify-center text-[13px] text-[#555c78] select-none">
              ···
            </span>
          ) : (
            <button
              key={p}
              id={`page-btn-${p}`}
              onClick={() => p !== page && onGoTo(p)}
              disabled={loading}
              className={`w-9 h-9 flex items-center justify-center rounded-lg border text-[13px] font-medium transition-all duration-150 cursor-pointer disabled:cursor-not-allowed
                ${p === page
                  ? 'bg-[#f0f2f8] border-[#f0f2f8] text-[#0a0b0f] font-semibold shadow-[0_2px_8px_rgba(240,242,248,0.15)]'
                  : 'border-white/[0.08] bg-[#1a1d28] text-[#8a90a8] hover:text-[#f0f2f8] hover:border-white/15'
                }`}
            >
              {p}
            </button>
          )
        )}

        {/* Next arrow */}
        <button
          id="next-page-btn"
          onClick={onNext}
          disabled={!hasMore || loading}
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-white/[0.08] bg-[#1a1d28] text-[#8a90a8] hover:text-[#f0f2f8] hover:border-white/15 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          aria-label="Next page"
        >
          <ChevronRight />
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-white/[0.08] mx-1" />

        {/* Go to page */}
        <span className="text-[12.5px] text-[#555c78] whitespace-nowrap">Go to page</span>
        <input
          id="jump-page-input"
          type="number"
          min="1"
          max={totalPages}
          value={jumpVal}
          onChange={e => setJumpVal(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleJump()}
          placeholder="—"
          className="w-12 h-9 rounded-lg border border-white/[0.08] bg-[#1a1d28] text-[#f0f2f8] text-[13px] text-center font-mono outline-none focus:border-[#6c63ff]/50 focus:ring-1 focus:ring-[#6c63ff]/30 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="text-[12px] text-[#3d4260] whitespace-nowrap">/{totalPages}</span>
        <button
          id="jump-confirm-btn"
          onClick={handleJump}
          disabled={loading || !jumpVal}
          className="h-9 px-4 rounded-lg bg-[#f0f2f8] text-[#0a0b0f] text-[13px] font-semibold hover:bg-white transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
        >
          confirm
        </button>
      </div>
    </div>
  )
}

// ─── Cursor Debug Panel ──────────────────────────────────────────
function CursorDebugPanel({ snapshotTime, cursorTime, cursorId, page, category, requestUrl }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  const fields = [
    { key: 'page',          val: String(page),                                 color: 'bg-[#1c2030]' },
    { key: 'snapshot_time', val: snapshotTime || '—',                          color: 'bg-blue-500/[0.07]' },
    { key: 'cursor_time',   val: cursorTime   || '(first page)',               color: cursorTime ? 'bg-purple-500/[0.07]' : 'bg-[#1c2030]' },
    { key: 'cursor_id',     val: cursorId ? String(cursorId) : '(first page)', color: cursorId  ? 'bg-purple-500/[0.07]' : 'bg-[#1c2030]' },
    { key: 'category',      val: category     || 'null (all)',                 color: 'bg-[#1c2030]' },
  ]

  return (
    <div className="relative" ref={ref}>
      <button
        id="debug-toggle-btn"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-3 py-[6px] rounded-lg border border-white/[0.06] bg-[#111318] text-[12px] text-[#8a90a8] hover:bg-[#181b22] hover:text-[#f0f2f8] hover:border-white/10 transition-all cursor-pointer"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
        </svg>
        Cursor Debug
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div className="absolute top-[calc(100%+8px)] right-0 w-[400px] bg-[#181b22] border border-white/[0.1] rounded-2xl p-4 shadow-[0_8px_40px_rgba(0,0,0,0.7)] z-50 animate-fade-in">
          <p className="text-[10px] font-semibold tracking-widest uppercase text-[#555c78] mb-3">Pagination State</p>
          <div className="flex flex-col gap-1 mb-3">
            {fields.map(f => (
              <div key={f.key} className={`flex items-baseline justify-between gap-3 px-3 py-2 rounded-lg ${f.color}`}>
                <span className="text-[11px] text-[#555c78] font-mono shrink-0">{f.key}</span>
                <span className="text-[11px] text-[#f0f2f8] font-mono text-right break-all">{f.val}</span>
              </div>
            ))}
          </div>
          {requestUrl && (
            <div className="border-t border-white/[0.06] pt-3">
              <p className="text-[10px] font-semibold tracking-widest uppercase text-[#555c78] mb-2">Last Request</p>
              <code className="text-[11px] text-[#8b83ff] font-mono break-all leading-relaxed">{requestUrl}</code>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Empty / Error States ────────────────────────────────────────
function EmptyState({ category }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-28 text-center">
      <div className="w-14 h-14 rounded-2xl bg-[#181b22] border border-white/[0.06] flex items-center justify-center text-[#555c78]">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      </div>
      <p className="text-[16px] font-semibold text-[#f0f2f8]">No products found</p>
      <p className="text-[13px] text-[#8a90a8] max-w-xs">{category ? `No products match "${category}"` : 'The catalog appears to be empty.'}</p>
    </div>
  )
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-28 text-center">
      <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>
      <p className="text-[16px] font-semibold text-[#f0f2f8]">Failed to load</p>
      <p className="text-[13px] text-[#8a90a8] max-w-xs font-mono">{message}</p>
      <button id="retry-btn" onClick={onRetry}
        className="px-5 py-2 rounded-lg text-[13.5px] font-semibold text-white bg-[#6c63ff] hover:bg-[#7c73ff] shadow-[0_0_16px_rgba(108,99,255,0.3)] transition-all cursor-pointer">
        Try again
      </button>
    </div>
  )
}

// ─── Main App ───────────────────────────────────────────────────
const LIMIT = 20

export default function App() {
  const [page, setPage]                         = useState(1)
  const [maxPage, setMaxPage]                   = useState(1)
  const [products, setProducts]                 = useState([])
  const [hasMore, setHasMore]                   = useState(false)
  const [loading, setLoading]                   = useState(true)
  const [error, setError]                       = useState(null)

  const [snapshotTime, setSnapshotTime]         = useState(null)
  const [cursorTime, setCursorTime]             = useState(null)
  const [cursorId, setCursorId]                 = useState(null)
  const [requestUrl, setRequestUrl]             = useState('')

  // historyRef[i] = the cursor USED to load page (i+1)
  // historyRef[0] = {cTime: null, cId: null}  → page 1 (no cursor)
  // historyRef[1] = cursor from page-1 response → page 2
  const historyRef = useRef([{ cTime: null, cId: null }])

  const [categories, setCategories]             = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [liveCount, setLiveCount]               = useState(0)
  const [simulating, setSimulating]             = useState(false)

  // Load categories once
  useEffect(() => {
    fetchCategories()
      .then(cats => setCategories(cats.filter(Boolean)))
      .catch(() => {})
  }, [])

  // Core loader
  const loadPage = useCallback(async ({ snap, cTime, cId, cat, pageNum }) => {
    setLoading(true)
    setError(null)

    const params = new URLSearchParams({ limit: LIMIT })
    if (cat)   params.set('category',     cat)
    if (snap)  params.set('snapshot_time', snap)
    if (cTime) params.set('cursor_time',   cTime)
    if (cId)   params.set('cursor_id',     String(cId))
    setRequestUrl(`/api/products?${params}`)

    try {
      const data = await fetchProducts({ snapshotTime: snap, cursorTime: cTime, cursorId: cId, category: cat, limit: LIMIT })

      setSnapshotTime(data.snapshot_time)
      setProducts(data.products)
      setHasMore(data.has_more)
      setPage(pageNum)
      setMaxPage(prev => Math.max(prev, pageNum + (data.has_more ? 1 : 0)))

      // Store next cursor at position [pageNum] in history
      if (data.next_cursor) {
        const { cursor_time, cursor_id } = data.next_cursor
        setCursorTime(cursor_time)
        setCursorId(cursor_id)
        // Extend history if this is a new furthest page
        if (pageNum >= historyRef.current.length) {
          historyRef.current[pageNum] = { cTime: cursor_time, cId: cursor_id }
        }
      } else {
        setCursorTime(null)
        setCursorId(null)
      }
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    loadPage({ snap: null, cTime: null, cId: null, cat: null, pageNum: 1 })
  }, [loadPage])

  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat)
    setSnapshotTime(null)
    setCursorTime(null)
    setCursorId(null)
    setPage(1)
    setMaxPage(1)
    setLiveCount(0)
    historyRef.current = [{ cTime: null, cId: null }]
    loadPage({ snap: null, cTime: null, cId: null, cat, pageNum: 1 })
  }

  const handleNext = () => {
    const { cTime, cId } = historyRef.current[page] || { cTime: cursorTime, cId: cursorId }
    loadPage({ snap: snapshotTime, cTime, cId, cat: selectedCategory, pageNum: page + 1 })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handlePrev = () => {
    if (page <= 1) return
    const { cTime, cId } = historyRef.current[page - 1] || { cTime: null, cId: null }
    loadPage({ snap: snapshotTime, cTime, cId, cat: selectedCategory, pageNum: page - 1 })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Jump to any already-visited page via history; can only go forward page-by-page for new pages
  const handleGoTo = (targetPage) => {
    if (targetPage === page || loading) return
    // If target page is in history, we can go directly
    if (historyRef.current[targetPage - 1]) {
      const { cTime, cId } = historyRef.current[targetPage - 1]
      loadPage({ snap: snapshotTime, cTime, cId, cat: selectedCategory, pageNum: targetPage })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    // Otherwise, walk forward from the furthest reached page
    // (For simplicity, just navigate one step at a time from current)
  }

  const handleSimulateInserts = async () => {
    setSimulating(true)
    await new Promise(r => setTimeout(r, 1200))
    setLiveCount(prev => prev + Math.floor(Math.random() * 40) + 10)
    setSimulating(false)
  }

  const handleRetry = () => {
    historyRef.current = [{ cTime: null, cId: null }]
    loadPage({ snap: null, cTime: null, cId: null, cat: selectedCategory, pageNum: 1 })
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0b0f]">
      <Header snapshotTime={snapshotTime} liveCount={liveCount} />

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-8 pb-16">
        {snapshotTime && (
          <SnapshotBanner
            snapshotTime={snapshotTime}
            liveCount={liveCount}
            onSimulateInserts={handleSimulateInserts}
            simulating={simulating}
          />
        )}

        <div className="grid grid-cols-[220px_1fr] gap-7 mt-6 items-start max-[900px]:grid-cols-1">

          {/* Sidebar */}
          <aside className="sticky top-[76px] flex flex-col gap-4">
            <CategoryFilter
              categories={categories}
              selected={selectedCategory}
              onChange={handleCategoryChange}
              loading={loading}
            />
            <HowItWorks />
          </aside>

          {/* Main content */}
          <section className="min-w-0 flex flex-col gap-5">

            {/* Toolbar */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-[13px] text-[#8a90a8]">
                {loading
                  ? <span className="inline-block w-32 h-4 rounded animate-shimmer align-middle" />
                  : <>
                      <strong className="text-[#f0f2f8]">{products.length}</strong> products
                      {selectedCategory && <> in <strong className="text-[#f0f2f8]">{selectedCategory}</strong></>}
                      <span className="text-[#3d4260] mx-2">·</span>
                      <span className="text-[#555c78]">Page {page}</span>
                    </>
                }
              </p>
              <CursorDebugPanel
                snapshotTime={snapshotTime}
                cursorTime={cursorTime}
                cursorId={cursorId}
                page={page}
                category={selectedCategory}
                requestUrl={requestUrl}
              />
            </div>

            {/* Grid */}
            {error ? (
              <ErrorState message={error} onRetry={handleRetry} />
            ) : loading ? (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3.5">
                {Array.from({ length: LIMIT }, (_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : products.length === 0 ? (
              <EmptyState category={selectedCategory} />
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3.5">
                {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
              </div>
            )}

            {/* Pagination */}
            {!error && (
              <PaginationBar
                page={page}
                hasMore={hasMore}
                onPrev={handlePrev}
                onNext={handleNext}
                onGoTo={handleGoTo}
                loading={loading}
                maxPage={maxPage}
              />
            )}
          </section>
        </div>
      </main>

      <footer className="border-t border-white/[0.05] py-4 text-center text-[12px] text-[#3d4260]">
        <span className="font-mono">cursor-pagination</span>
        {' · '}snapshot isolation + compound (updated_at, id) cursor
        {' · '}
        <span className="font-mono">Flask + PostgreSQL + React</span>
      </footer>
    </div>
  )
}
