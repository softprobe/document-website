'use client';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { ChevronsUpDown } from 'lucide-react';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { twMerge } from 'tailwind-merge';
import { isActive } from './isActive';
// import { useSidebar } from './contexts/sidebar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
export function RootToggle({ options, placeholder, ...props }: any) {
    const [open, setOpen] = useState(false);
    // const { closeOnRedirect } = useSidebar();
    const pathname = usePathname();
    const selected = useMemo(() => {
        return options.findLast((item: any) => item.urls
            ? item.urls.has(pathname.endsWith('/') ? pathname.slice(0, -1) : pathname)
            : isActive(item.url, pathname, true));
    }, [options, pathname]);
    const onClick = () => {
        // closeOnRedirect.current = false;
        setOpen(false);
    };
    const item = selected ? _jsx(Item, { ...selected }) : placeholder;
    return (_jsxs(Popover, {
        open: open, onOpenChange: setOpen, children: [item ? (_jsxs(PopoverTrigger, { ...props, className: twMerge('flex flex-row items-center gap-2.5 rounded-lg ps-2 pe-4 py-1.5 hover:bg-fd-accent/50 hover:text-fd-accent-foreground', props.className), children: [item, _jsx(ChevronsUpDown, { className: "size-4 text-fd-muted-foreground" })] })) : null, _jsx(PopoverContent, {
            className: "w-(--radix-popover-trigger-width) overflow-hidden p-0", children: options.map((item) => (_jsx(Link, {
                href: item.url, onClick: onClick, ...item.props, className: twMerge('flex w-full flex-row items-center gap-2 px-2 py-1.5', selected === item
                    ? 'bg-fd-accent text-fd-accent-foreground'
                    : 'hover:bg-fd-accent/50', item.props?.className), children: _jsx(Item, { ...item })
            }, item.url)))
        })]
    }));
}
function Item(props: any) {
    return (_jsxs(_Fragment, { children: [props.icon, _jsxs("div", { className: "flex-1 text-start", children: [_jsx("p", { className: "text-sm font-medium", children: props.title }), props.description ? (_jsx("p", { className: "text-xs text-fd-muted-foreground", children: props.description })) : null] })] }));
}
