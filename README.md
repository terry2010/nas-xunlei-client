# 群辉NAS迅雷客户端

这是一款基于Electron框架开发的Windows和macOS平台客户端应用，旨在提供更便捷的方式来控制群辉NAS迅雷应用。通过集成网页功能和本地系统交互，为用户提供更流畅的下载管理体验。

## 功能特点

- **配置管理**：保存NAS地址、迅雷下载目录等配置信息
- **自动登录**：记住用户凭证，自动完成NAS登录流程
- **一键打开下载目录**：直接从客户端打开NAS上的迅雷下载目录
- **下载链接拦截**：拦截系统中的迅雷/BT下载链接，自动添加到下载任务
- **简洁界面**：集成NAS迅雷网页界面，提供更好的桌面体验

## 系统要求

### Windows
- Windows 10及以上
- 64位系统
- 最小内存要求：4GB

### macOS
- macOS 10.15 (Catalina)及以上
- 64位系统
- 最小内存要求：4GB

## 开发环境搭建

1. 安装Node.js (v16.0.0+)
2. 克隆仓库：`git clone <仓库地址>`
3. 安装依赖：`npm install`
4. 启动开发服务器：`npm run dev`

## 构建应用

- Windows版本：`npm run build:win`
- macOS版本：`npm run build:mac`

## 项目结构

```
src/
├── assets/         # 静态资源
├── components/     # Vue组件
│   ├── Config/     # 配置相关组件
│   └── Main/       # 主界面组件
├── router/         # 路由配置
├── store/          # 状态管理
├── utils/          # 工具函数
│   ├── auth.js     # 认证相关
│   └── webview.js  # WebView交互
├── views/          # 页面视图
│   ├── ConfigView.vue  # 配置页面
│   └── MainView.vue    # 主界面
└── App.vue         # 根组件

src-electron/
├── main.js         # Electron主进程
└── preload.js      # 预加载脚本
```

## 使用说明

1. 首次启动时，需要配置NAS地址和登录凭证
2. 配置完成后，应用会自动连接到NAS并显示迅雷应用界面
3. 可以通过顶部控制栏的按钮进行导航、刷新和打开下载目录
4. 点击系统中的迅雷/磁力链接时，应用会自动打开并添加下载任务

## 许可证

MIT
