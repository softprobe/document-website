import React from 'react'
import { DocsThemeConfig } from 'nextra-theme-docs'

const config: DocsThemeConfig = {
  logo: <span>Softprobe Documentation</span>,
  project: {
    link: 'https://github.com/softprobe/document-website',
  },
  docsRepositoryBase: 'https://github.com/softprobe/document-website',
  footer: {
    text: 'Softprobe Documentation',
  },
  useNextSeoProps() {
    return {
      titleTemplate: '%s – Softprobe'
    }
  },
  i18n: [
    { locale: 'en', text: 'English' },
    { locale: 'cn', text: '中文' }
  ],
  search: {
    placeholder: 'Search documentation...'
  },
  sidebar: {
    defaultMenuCollapseLevel: 1,
  },
  toc: {
    title: 'On this page'
  },
  head: (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta property="og:title" content="Softprobe Documentation" />
      <meta property="og:description" content="Comprehensive documentation for Softprobe products" />
    </>
  ),
  editLink: {
    text: 'Edit this page on GitHub →'
  },
  feedback: {
    content: 'Question? Give us feedback →',
    labels: 'feedback'
  }
}

export default config
