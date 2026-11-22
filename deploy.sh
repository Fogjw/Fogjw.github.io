#!/usr/bin/env bash
# Hexo 一键部署（Linux / macOS 版，等价于 Windows 的 deploy.bat）
# 用法：
#   ./deploy.sh            清理 -> 生成 -> 强制推送到 GitHub Pages（pages 分支）
#   ./deploy.sh --dry-run  只清理并生成，不推送（用于本地检查产物）
set -euo pipefail

cd "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")"

DRY_RUN=0
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    -h|--help) sed -n '2,5p' "$0"; exit 0 ;;
    *) echo "未知参数：$arg（可用：--dry-run）" >&2; exit 2 ;;
  esac
done

if ! command -v hexo >/dev/null 2>&1; then
  echo "找不到 hexo 命令。请先在本目录执行：npm ci" >&2
  exit 1
fi

echo "=== 清理缓存 ==="
hexo clean

echo "=== 生成静态文件 ==="
hexo generate

if [ "$DRY_RUN" -eq 1 ]; then
  echo "=== 已跳过部署（--dry-run）==="
  exit 0
fi

echo "=== 推送到 GitHub Pages（pages 分支，强制覆盖）==="
hexo deploy

echo
echo "=== 完成！1-3 分钟后访问 https://fogjw.github.io ==="
