"use client";

import Image from 'next/image';
import brandLogo from '@/public/images/logos/softprobe-logo.png';

function DocSwitcher() {

    return (<div className="flex w-[160px] grayscale group-hover:brightness-100 group-hover:grayscale-0 dark:brightness-125">
        <Image
            src={brandLogo}
            alt="Softprobe Logo"
            width={98}
            onClick={() => {
                window.open('https://www.softprobe.ai?utm_source=docs', '_blank');
            }}
        />
    </div>)
}

export default DocSwitcher;