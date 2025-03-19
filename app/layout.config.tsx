import { type HomeLayoutProps } from 'fumadocs-ui/home-layout'
import DocSwitcher from '@/components/DocSwitcher';


export const baseOptions: HomeLayoutProps = {
  nav: {
    title: (
      <div className="group flex items-center">
        <DocSwitcher />
      </div>
    ),
  },
  i18n: true,
  // githubUrl: 'https://github.com/1pone/document',
  // links: [
  //   {
  //     text: 'Website',
  //     url: 'https://www.softprobe.ai?utm_source=docs',
  //     active: 'nested-url',
  //     icon: <GlobeIcon />,
  //   },
  // ],
}
