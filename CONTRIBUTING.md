# 参与贡献

感谢你为 Cluoub Video 提交改进。仓库采用 Apache-2.0，提交贡献即表示你有权提交相关内容，并同意贡献按仓库许可证分发。

## 开始开发

需要 Node.js 22 和 pnpm 10：

```bash
pnpm install --frozen-lockfile
pnpm run dev
```

请从最新 `master` 创建短期分支，不要直接向 `master` 推送：

```bash
git switch master
git pull --ff-only
git switch -c feat/short-description
```

推荐使用 `feat/`、`fix/`、`docs/`、`test/`、`refactor/` 或 `chore/` 前缀。一个 Pull Request 只解决一个清晰问题，避免混入无关格式化或重构。

## 提交前检查

按改动风险运行相关测试，提交 Pull Request 前至少执行完整本地门禁：

```bash
pnpm run lint
pnpm run typecheck
pnpm run check:types
pnpm run test
pnpm run build
pnpm run check:exports
pnpm run check:size
pnpm run test:e2e
```

涉及公共 API 时，应同步更新类型夹具、README 和迁移文档。涉及 UI 时，应覆盖键盘、触摸、窄屏和无障碍状态。不要提交构建产物、密钥、访问令牌或真实用户数据。

## Pull Request

- 使用清晰标题说明可观察的变化。
- 说明动机、实现范围、兼容性影响和验证结果。
- 关联对应 Issue；没有 Issue 时说明背景。
- 确保 `CI / verify` 成功并解决所有评审讨论。
- 分支落后时先更新分支，禁止强推受保护的 `master`。

仓库使用 squash merge。合并后源分支会自动删除。

## 安全问题

不要在公开 Issue 中披露漏洞。请按 [SECURITY.md](SECURITY.md) 使用 GitHub Private Vulnerability Reporting。
