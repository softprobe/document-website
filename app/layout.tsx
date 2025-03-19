import { I18nProvider, Translations } from 'fumadocs-ui/i18n'
import { RootProvider } from 'fumadocs-ui/provider';
import { Inter } from 'next/font/google'
import { ReactNode } from 'react'
import './global.css'

const inter = Inter({
  subsets: ['latin'],
})

const cn: Partial<Translations> = {
  toc: '目录',
  search: '搜索文档',
  lastUpdate: '最后更新于',
  searchNoResult: '无搜索结果',
  previousPage: '上一页',
  nextPage: '下一页',
  chooseLanguage: '选择语言',
};

const locales=[
  {
    name: 'English',
    locale: 'en',
  },
  {
    name: '中文',
    locale: 'cn',
  },
];

export default async function Layout({ params, children }: { params: { lang: string }; children: ReactNode }) {
  const lang = (await params).lang;
  
  return (
    <html lang={lang} className={inter.className} suppressHydrationWarning>
      <body>
        <I18nProvider
          locale={lang}
          locales={locales}
          translations={{ cn }[lang]}
        >
          <RootProvider>
            {children}
          </RootProvider>
        </I18nProvider>
      </body>
    </html >
  )
}
