# Pages deployment

默认播放器和 Headless Demo 共用 Vite `base: /cluoub-video/`，并由 `pnpm build:demo` 生成同一份 `demo-dist`。

## GitHub Pages

`.github/workflows/pages.yml` 使用 GitHub 官方 Pages Actions：

- `actions/configure-pages`
- `actions/upload-pages-artifact`
- `actions/deploy-pages`

仓库所有者仍需在 GitHub 仓库设置中选择 **GitHub Actions** 作为 Pages source。只有工作流实际成功部署后才应公开 URL。

## Gitee Pages

先构建并准备与 GitHub 相同的静态产物：

```bash
pnpm run build:demo
pnpm run pages:gitee:prepare
```

准备结果位于 `.pages/gitee`，包含 `.nojekyll`。发布脚本需要一个有写权限的仓库 URL：

```bash
# PowerShell
$env:GITEE_PAGES_REMOTE = 'git@gitee.com:account/repository.git'
pnpm run pages:gitee:publish
```

脚本会把准备目录强制推送到远端 `gh-pages` 分支。运行前应确认远端仓库和分支允许覆盖，并在发布后核对远端分支提交。

推送后，仓库所有者仍需在 Gitee 账号侧开通 / 更新 Pages 服务，并将发布分支设为 `gh-pages`。Gitee Pages 是否可用及审核要求取决于账号当前权限，代码不能代替账号侧开通。
