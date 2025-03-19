import { type HomeLayoutProps } from 'fumadocs-ui/home-layout'
import { GlobeIcon, SlackIcon } from 'lucide-react'
import brandLogo from '@/public/images/logos/softprobe-logo.png'
import Image from 'next/image';

function SoftprobeIcon() {
  return (
    <div className="flex justify-center grayscale group-hover:brightness-100 group-hover:grayscale-0 dark:brightness-125">
      <Image
        src={brandLogo}
        alt="Softprobe Logo"
        width={98}
      />
    </div>
  )
}

export const baseOptions: HomeLayoutProps = {
  nav: {
    title: (
      <div className="group">
        <SoftprobeIcon />
        {/* <span>Softprobe</span> */}
      </div>
    ),
  },
  i18n: true,
  // githubUrl: 'https://github.com/1pone/document',
  links: [
    {
      text: 'Website',
      url: 'https://www.softprobe.ai?utm_source=docs',
      active: 'nested-url',
      icon: <GlobeIcon />,
    },
    // {
    //   text: 'Slack',
    //   url: 'https://arexcommunity.slack.com',
    //   active: 'nested-url',
    //   icon: <SlackIcon />,
    // },
  ],
}
