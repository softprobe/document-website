"use client";

import Image from 'next/image';
import brandLogo from '@/public/images/logos/softprobe-logo.png';

function DocSwitcher() {

    const renderLogo = () => {
        return (<div className="flex flex-1 w-[220px] justify-center grayscale group-hover:brightness-100 group-hover:grayscale-0 dark:brightness-125">
            <Image
                src={brandLogo}
                alt="Softprobe Logo"
                width={128}
                onClick={() => {
                    window.open('https://www.softprobe.ai?utm_source=docs', '_blank');
                }}
            />
        </div>)
    }

    return (
        <>
            {renderLogo()}
        </>
    )
}

export default DocSwitcher;