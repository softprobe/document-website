"use client";

import Image from 'next/image';
import brandLogo from '@/public/images/logos/softprobe-logo.png';

function DocSwitcher() {

    const renderLogo = () => {
        return (<div className="flex justify-center grayscale group-hover:brightness-100 group-hover:grayscale-0 dark:brightness-125">
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

    return (
        <>
            {renderLogo()}
            <div className="ml-8 mt-4">
                <div>
                    <p>Select Product</p>
                </div>
                <select
                    className="text-sm bg-transparent border-none text-gray-500 dark:text-gray-400"
                    onChange={(e) => {
                        window.location.href = e.target.value
                    }}
                >
                    <option value="/docs">Auto Testing</option>
                    <option value="/api">Web Replay</option>
                </select>
            </div>
        </>
    )
}

export default DocSwitcher;