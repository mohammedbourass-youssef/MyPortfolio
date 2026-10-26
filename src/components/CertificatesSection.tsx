import { useMemo, useState } from 'react'
import { Download, ExternalLink, FileBadge } from 'lucide-react'
import { certificates, type Certificate } from '../data/certificates'
import { assetUrl } from '../lib/assets'
import type { Lang, T } from '../lib/i18n'
import SectionHeading from './SectionHeading'

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
  const groups = useMemo(() => certificates.reduce<Record<string, Certificate[]>>((result, certificate) => {
    (result[certificate.issuer] ??= []).push(certificate)
    return result
  }, {}), [])
  return <>
    <SectionHeading eyebrow={`[ SEC_07 // ${t.sections.certificates} ]`} title={t.certificates.title} subtitle={t.certificates.subtitle} />
    <div className="certificate-groups">{Object.entries(groups).map(([issuer, items]) =>
      <div className="certificate-group" key={issuer}>
        <h3>{issuer}</h3>
        <div className="certificate-grid">{items.map(certificate =>
          <CertificateCard key={certificate.id} certificate={certificate} lang={lang} t={t} />
        )}</div>
      </div>
    )}</div>
  </>
}
