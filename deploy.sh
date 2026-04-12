#!/bin/bash
# 一键部署小游戏到腾讯云 CloudBase
# 使用方法: ./deploy.sh

ENV_ID="becareful-5gg0kklye6d3079d"

echo "🚀 开始部署到腾讯云 CloudBase..."
echo ""

# 部署 index.html
echo "📦 部署 index.html..."
tcb hosting deploy ./index.html /index.html -e $ENV_ID

# 部署 css 目录
echo "📦 部署 css 目录..."
tcb hosting deploy ./css /css -e $ENV_ID

# 部署 js 目录
echo "📦 部署 js 目录..."
tcb hosting deploy ./js /js -e $ENV_ID

# 部署 assets 目录
echo "📦 部署 assets 目录..."
tcb hosting deploy ./assets /assets -e $ENV_ID

echo ""
echo "✅ 部署完成！"
echo ""
echo "🌐 访问地址: https://becareful-5gg0kklye6d3079d-1421412346.tcloudbaseapp.com"
echo ""