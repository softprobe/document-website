import DocSwitcher from '@/components/DocSwitcher';
import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

export const baseOptions: BaseLayoutProps = {
  nav: {
    title: (
      <div className="group flex items-center ml-2 -mt-1 mb-2">
        <DocSwitcher />
      </div>
    ),
  },
  // i18n: true,
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
