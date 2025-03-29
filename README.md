# 群辉NAS迅雷客户端

基于Tauri框架开发的Windows和macOS平台客户端应用，提供更便捷的方式来控制群辉NAS迅雷应用。

## 功能特点

- 自动登录群辉NAS系统
- 集成迅雷网页应用
- 一键打开下载目录
- 拦截并处理迅雷/BT下载链接
- 简洁美观的界面

## 开发环境要求

### Windows
- Node.js v16.0.0+
- npm 或 yarn
- Git
- Rust 环境 (rustup)
- Microsoft Visual Studio C++ 构建工具
- WebView2 组件

### macOS
- Node.js v16.0.0+
- npm 或 yarn
- Git
- Rust 环境 (rustup)
- Xcode 命令行工具

## 开发指南

1. 安装依赖
```bash
npm install
```

2. 启动开发服务器
```bash
npm run tauri dev
```

3. 构建应用
```bash
npm run tauri build
```

## 配置说明

首次启动应用时，需要进行以下配置：

1. NAS地址：群辉NAS的访问地址，例如 http://192.168.50.100:5000
2. 下载目录路径：迅雷下载文件保存的网络路径
3. 自动打开客户端：是否在点击迅雷/BT下载链接时自动打开客户端
4. 用户名和密码：群辉NAS的登录凭证

## 许可证

apache
