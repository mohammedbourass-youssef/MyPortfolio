import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ArrowRight, Download, Mail, Moon, Search, Sun, X } from 'lucide-react'
import { cvUrl } from '../lib/assets'
import type { Lang, T } from '../lib/i18n'

type SectionLink = { id: string; label: string }
type Item = { id: string; label: string; group: 'sections' | 'actions'; icon: ReactNode; href?: string; download?: boolean; onSelect?: () => void }

export default function CommandPalette({ open, onClose, sections, lang, t, dark, onToggleTheme }: {
  open: boolean
  onClose: () => void
  sections: SectionLink[]
  lang: Lang
  t: T
  dark: boolean
  onToggleTheme: () => void
}) {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const itemRefs = useRef<(HTMLAnchorElement | HTMLButtonElement | null)[]>([])
  const previousFocus = useRef<HTMLElement | null>(null)

  const items = useMemo<Item[]>(() => [
    ...sections.map(section => ({ id: section.id, label: section.label, group: 'sections' as const, icon: <ArrowRight size={16}/>, href: `#${section.id}` })),
    { id: 'cv', label: t.command.cv, group: 'actions' as const, icon: <Download size={16}/>, href: cvUrl(lang), download: true },
    { id: 'contact', label: t.command.contact, group: 'actions' as const, icon: <Mail size={16}/>, href: '#contact' },
    { id: 'theme', label: t.command.theme, group: 'actions' as const, icon: dark ? <Sun size={16}/> : <Moon size={16}/>, onSelect: onToggleTheme },
  ], [sections, t.command.cv, t.command.contact, t.command.theme, lang, dark, onToggleTheme])

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase()
    return needle ? items.filter(item => item.label.toLocaleLowerCase().includes(needle)) : items
  }, [items, query])

  const groups = useMemo(() => [
    { key: 'sections' as const, label: t.command.sections, items: filtered.filter(item => item.group === 'sections') },
    { key: 'actions' as const, label: t.command.actions, items: filtered.filter(item => item.group === 'actions') },
  ].filter(group => group.items.length > 0), [filtered, t.command.sections, t.command.actions])

  const renderedItems = useMemo(() => groups.flatMap(group => group.items), [groups])

  useEffect(() => {
    if (!open) return
    previousFocus.current = document.activeElement as HTMLElement | null
    setQuery('')
    setActiveIndex(0)
    inputRef.current?.focus()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
      previousFocus.current?.focus()
    }
  }, [open])

  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  useEffect(() => {
    if (open) itemRefs.current[activeIndex]?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex, open])

  if (!open) return null

  const activate = (item: Item) => {
    if (item.onSelect) item.onSelect()
    else if (item.href) {
      if (item.download) {
        const link = document.createElement('a')
        link.href = item.href
        link.download = ''
        document.body.appendChild(link)
        link.click()
        link.remove()
      } else {
        window.location.hash = item.href
      }
    }
    onClose()
  }

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') { event.preventDefault(); onClose(); return }
    if (event.key === 'ArrowDown') { event.preventDefault(); setActiveIndex(index => renderedItems.length ? (index + 1) % renderedItems.length : 0); return }
    if (event.key === 'ArrowUp') { event.preventDefault(); setActiveIndex(index => renderedItems.length ? (index - 1 + renderedItems.length) % renderedItems.length : 0); return }
    if (event.key === 'Enter') { event.preventDefault(); const item = renderedItems[activeIndex]; if (item) activate(item) }
  }

  return <div className="command-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
    <section className="command-dialog" role="dialog" aria-modal="true" aria-label={t.command.title}>
      <div className="command-input-row"><Search size={18} aria-hidden="true"/><input ref={inputRef} type="text" value={query} onChange={event => setQuery(event.target.value)} onKeyDown={onInputKeyDown} placeholder={t.command.placeholder} aria-label={t.command.placeholder} aria-controls="command-results" aria-expanded="true" role="combobox" aria-autocomplete="list" aria-activedescendant={renderedItems[activeIndex] ? `command-item-${renderedItems[activeIndex].id}` : undefined}/><button className="icon-button" onClick={onClose} aria-label={t.command.close}><X size={18}/></button></div>
      <div className="command-results" id="command-results" role="listbox" aria-label={t.command.title}>
        {groups.map(group => <div className="command-group" key={group.key}><span className="command-group-label" dir="ltr">{group.label}</span>{group.items.map(item => {
          const itemIndex = renderedItems.indexOf(item)
          const sharedProps = {
            id: `command-item-${item.id}`,
            role: 'option',
            'aria-selected': itemIndex === activeIndex,
            className: 'command-item',
            onMouseEnter: () => setActiveIndex(itemIndex),
            ref: (element: HTMLAnchorElement | HTMLButtonElement | null) => { itemRefs.current[itemIndex] = element },
          }
          if (item.onSelect) return <button {...sharedProps} type="button" key={item.id} onClick={() => { item.onSelect?.(); onClose() }}>{item.icon}<span>{item.label}</span></button>
          return <a {...sharedProps} href={item.href} download={item.download || undefined} key={item.id} onClick={event => { if (!item.download && item.href) { event.preventDefault(); window.location.hash = item.href } onClose() }}>{item.icon}<span>{item.label}</span></a>
        })}</div>)}
        {!renderedItems.length && <p className="command-empty">{t.command.noResults}</p>}
      </div>
    </section>
  </div>
}
