import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { ReactNode } from 'react';
import { baseOptions } from '@/app/layout.config';
// import { RootToggle } from 'fumadocs-ui/components/layout/root-toggle';
import { RootToggle } from '@/components/RootToggle';
import { source } from '@/lib/source';

export default async function Layout( props: { params: { lang: string }; children: ReactNode }) {

    const params = await props.params;

    return (
        <DocsLayout
            nav={{
                enabled: false,
                component: null,
            }}
            // sidebar={{
            //     banner: (
            //         <RootToggle
            //             options={[
            //                 {
            //                     title: {
            //                         en: 'Home',
            //                         cn: '首页',
            //                     }[params.lang],
            //                     description: {
            //                         en: 'Welcome to use Softprobe',
            //                         cn: '欢迎使用 Softprobe',
            //                     }[params.lang],
            //                     url: '/',
            //                 },
            //                 {
            //                     title: {
            //                         en: 'Auto Testing',
            //                         cn: '自动测试',
            //                     }[params.lang],
            //                     description: {
            //                         en: 'Documentation for auto testing',
            //                         cn: '自动测试文档',
            //                     }[params.lang],
            //                     url: '/auto-testing',
            //                 },
            //                 {
            //                     title: {
            //                         en: 'Web Replay',
            //                         cn: '页面回放',
            //                     }[params.lang],
            //                     description: {
            //                         en: 'Documentation for web replay',
            //                         cn: '页面回放文档',
            //                     }[params.lang],
            //                     url: '/web-replay',
            //                 },
            //             ]}
            //         />
            //     ),
            // }}
            tree={source.pageTree[(await params).lang]}
            {...baseOptions}
        >
            {props.children}
        </DocsLayout>
    );
}
