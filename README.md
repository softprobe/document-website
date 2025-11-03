# document

This is a Next.js application generated with
[Create Fumadocs](https://github.com/fuma-nama/fumadocs).

Run development server:

```bash
npm run dev
# or
pnpm dev
# or
yarn dev
```

Open http://localhost:3000 with your browser to see the result.

## Learn More

To learn more about Next.js and Fumadocs, take a look at the following
resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js
  features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [Fumadocs](https://fumadocs.vercel.app) - learn about Fumadocs


## Deploy Note

- 运行 sh release.sh 自动打最新tag，并推到github
- 在[Deploy仓库](https://github.com/softprobe/deployment-k8s)更新最新最版本，文件是：pro/saas/doc/deployment.yaml，更新containers/image的后缀为刚刚更新的tag
- 将Deployment仓库推上去会开始触发pipeline自动发布
- 如果过几分钟没发布可去[Argo平台](https://argocd.softprobe.ai/applications/argocd/doc?view=tree)手动点一下SYNC按钮触发发布
- 如果发布失败需要去业务Github Action看下是否是打包失败