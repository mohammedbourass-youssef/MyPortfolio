import { useMemo, useState } from 'react'
import { ChevronDown, Download, ExternalLink, FileBadge } from 'lucide-react'
import { certificates, type Certificate } from '../data/certificates'
import { assetUrl } from '../lib/assets'
import type { Lang, T } from '../lib/i18n'
import SectionHeading from './SectionHeading'

const issuerOrder = ['Flutter', 'Programming Advices', 'Oracle', 'MongoDB']

function CertificateCard({ certificate, lang, t }: { certificate: Certificate; lang: Lang; t: T }) {
  const [thumbFailed, setThumbFailed] = useState(false)
  const url = assetUrl(certificate.file)
  const thumb = certificate.thumb ?? `certificates-thumbs/${certificate.id}.jpg`
  return <article className="certificate-card">
    <div className="certificate-thumb">
      <FileBadge className="certificate-placeholder" size={35} aria-hidden="true" />
      {!thumbFailed && <img src={assetUrl(thumb)} alt="" width={520} height={403} loading="lazy" decoding="async" onError={() => setThumbFailed(true)} />}
      <span className="certificate-file-type">PDF</span>
    </div>
    <div className="certificate-card-copy">
      <h3>{certificate.title[lang]}</h3>
      <p>{certificate.issuer}</p>
      {certificate.date && <time>{certificate.date}</time>}
      <div className="certificate-card-actions">
        <a className="button button-outline" href={url} target="_blank" rel="noopener noreferrer"><ExternalLink size={14} />{t.certificates.view}</a>
        <a className="button button-primary" href={url} download><Download size={14} />{t.certificates.download}</a>
      </div>
    </div>
  </article>
}

export default function CertificatesSection({ lang, t }: { lang: Lang; t: T }) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})
  const groups = useMemo(() => {
    const grouped = certificates.reduce<Record<string, Certificate[]>>((result, certificate) => {
      (result[certificate.issuer] ??= []).push(certificate)
      return result
    }, {})
    return Object.entries(grouped).sort(([a], [b]) => {
      const aIndex = issuerOrder.indexOf(a)
      const bIndex = issuerOrder.indexOf(b)
      return (aIndex === -1 ? issuerOrder.length : aIndex) - (bIndex === -1 ? issuerOrder.length : bIndex)
    })
  }, [])
  const toggle = (issuer: string) => setOpenGroups(current => ({ ...current, [issuer]: !current[issuer] }))
  return <>
    <SectionHeading eyebrow={`[ SEC_07 // ${t.sections.certificates} ]`} title={t.certificates.title} subtitle={t.certificates.subtitle} />
    <div className="certificate-groups">{groups.map(([issuer, items]) => {
      const open = Boolean(openGroups[issuer])
      const panelId = `certificate-group-${issuer.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
      return <div className={`certificate-group${open ? ' open' : ''}`} key={issuer}>
        <button className="certificate-group-toggle" aria-expanded={open} aria-controls={panelId} onClick={() => toggle(issuer)}>
          <span className="certificate-group-name">{issuer}</span>
          <span className="certificate-group-count">{String(items.length).padStart(2, '0')}</span>
          <ChevronDown className="certificate-group-chevron" size={17} aria-hidden="true" />
        </button>
        {open && <div className="certificate-group-body" id={panelId}>
          <div className="certificate-grid">{items.map(certificate =>
            <CertificateCard key={certificate.id} certificate={certificate} lang={lang} t={t} />
          )}</div>
        </div>}
      </div>
    })}</div>
  </>
}
