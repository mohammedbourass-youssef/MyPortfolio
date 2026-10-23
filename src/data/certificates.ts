export type Certificate = {
  title: { en: string; fr: string; ar: string }
  issuer: string
  date: string
  /** Filename or relative path under public/, for example "certificates/course.pdf". */
  file: string
  /** Optional thumbnail filename or relative path under public/. Defaults to the file. */
  thumb?: string
  verifyUrl?: string
}

// Add certificate details here and place the matching files under public/.
export const certificates: Certificate[] = []
