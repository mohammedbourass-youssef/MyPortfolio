export default function SectionHeading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return <div className="section-heading"><span className="eyebrow" dir="ltr">{eyebrow}</span><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>
}
