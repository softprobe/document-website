import { baseOptions } from '@/app/layout.config'
import { source } from '@/app/source'
import { I18nProvider } from 'fumadocs-ui/i18n'
import { DocsLayout } from 'fumadocs-ui/layout'
import { RootToggle } from 'fumadocs-ui/components/layout/root-toggle'
import { RootProvider } from 'fumadocs-ui/provider'
import { Inter } from 'next/font/google'
import { ReactNode } from 'react'
import './global.css'

const inter = Inter({
  subsets: ['latin'],
})

export default function Layout({ params, children }: { params: { lang: string }; children: ReactNode }) {
  return (
    <html lang={params.lang} className={inter.className} suppressHydrationWarning>
      <body>
        <I18nProvider
          locale={params.lang}
          locales={[
            {
              name: 'English',
              locale: 'en',
            },
            {
              name: '中文',
              locale: 'cn',
            },
          ]}
          translations={
            {
              cn: {
                toc: '目录',
                search: '搜索文档',
                lastUpdate: '最后更新于',
                searchNoResult: '无搜索结果',
                previousPage: '上一页',
                nextPage: '下一页',
                chooseLanguage: '选择语言',
              },
            }[params.lang]
          }
        >
          <RootProvider>
            <DocsLayout
              sidebar={{
                banner: (
                  
                  <RootToggle
                    options={[
                      {
                        title: {
                          en: 'Auto Testing',
                          cn: '自动测试',
                        }[params.lang],
                        description: {
                          en: 'Documentation for auto testing',
                          cn: '自动测试文档',
                        }[params.lang],
                        url: '/auto-testing',
                      }, 
                      {
                        title: {
                          en: 'Web Replay',
                          cn: '页面回放',
                        }[params.lang],
                        description: {
                          en: 'Documentation for web replay',
                          cn: '页面回放文档',
                        }[params.lang],
                        url: '/web-replay',
                      },
                    ]}
                  />
                ),
              }}
              tree={source.pageTree[params.lang]}
              {...baseOptions}
            >
              {children}
            </DocsLayout>
          </RootProvider>
        </I18nProvider>
      </body>
    </html>
  )
}
