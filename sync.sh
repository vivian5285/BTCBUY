#!/bin/bash

echo "🐼 开始检测并同步本地改动到 GitHub..."

# 拉取最新主分支，避免冲突（可选）
git pull origin main

# 添加所有更改
git add .

# 提示用户输入 commit 描述
read -p "✏️ 请输入提交说明（默认：Auto sync）： " msg
msg=${msg:-"Auto sync"}

# 提交
git commit -m "$msg"

# 推送
git push

echo "✅ 已同步至 GitHub！" 