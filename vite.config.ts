import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const absoluteFaviconPaths = {
  name: 'absolute-favicon-paths',
  transformIndexHtml: {
    order: 'post' as const,
    handler: (html: string) => html.replace(/href="\.\/(favicon[^"]*|apple-touch-icon[^"]*)"/g, 'href="/$1"'),
  },
}

export default defineConfig({ base: './', plugins: [react(), absoluteFaviconPaths] })
