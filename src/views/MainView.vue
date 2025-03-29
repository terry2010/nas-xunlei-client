<template>
  <div class="main-container">
    <div class="toolbar">
      <el-button type="primary" @click="refresh" :disabled="loading">
        <el-icon><Refresh /></el-icon> 刷新
      </el-button>
      <el-button @click="goBack" :disabled="!canGoBack || loading">
        <el-icon><Back /></el-icon> 返回
      </el-button>
      <el-button @click="openConfig">
        <el-icon><Setting /></el-icon> 配置
      </el-button>
      <el-button type="success" @click="openDownloadFolder" :disabled="!isXunleiPage">
        <el-icon><Folder /></el-icon> 打开下载目录
      </el-button>
    </div>
    
    <div class="webview-container" v-loading="loading">
      <div v-if="!configStore.isConfigured" class="no-config">
        <el-empty description="尚未配置NAS地址">
          <el-button type="primary" @click="openConfig">立即配置</el-button>
        </el-empty>
      </div>
      <!-- WebView将由Tauri在此处注入 -->
      <div id="webview-container" v-else></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useConfigStore } from '../store/config'
import { ElMessage } from 'element-plus'
import { Refresh, Back, Setting, Folder } from '@element-plus/icons-vue'
import { detectLoginPage, isUsernameInputPage, isPasswordInputPage, autoFillUsername, autoFillPassword } from '../utils/auth'
import { injectOpenFolderButton, isXunleiAppPage } from '../utils/webview'

// 导入Tauri API
import { invoke, window } from '@tauri-apps/api'

const router = useRouter()
const configStore = useConfigStore()

// 状态变量
const loading = ref(true)
const canGoBack = ref(false)
const isXunleiPage = ref(false)
const webviewEl = ref(null)

// 刷新WebView
const refresh = () => {
  if (webviewEl.value) {
    loading.value = true
    webviewEl.value.reload()
  }
}

// 返回上一页
const goBack = () => {
  if (webviewEl.value && canGoBack.value) {
    webviewEl.value.goBack()
  }
}

// 打开配置页面
const openConfig = () => {
  router.push('/config')
}

// 打开下载目录
const openDownloadFolder = async () => {
  try {
    await invoke('open_download_directory', { path: configStore.downloadPath })
    ElMessage.success('已打开下载目录')
  } catch (error) {
    ElMessage.error(`打开下载目录失败: ${error}`)
  }
}

// 处理WebView导航事件
const handleNavigation = (event) => {
  const url = event.url
  
  // 更新状态
  canGoBack.value = webviewEl.value.canGoBack()
  isXunleiPage.value = isXunleiAppPage(url)
  
  // 处理登录页面
  if (detectLoginPage(url)) {
    // 注入自动登录脚本
    webviewEl.value.executeScript(`
      const checkAndFillLoginForm = () => {
        if (document.querySelector('#username')) {
          // 用户名输入页面
          document.querySelector('#username').value = "${configStore.username}";
          document.querySelector('#btn-login').click();
        } else if (document.querySelector('#password')) {
          // 密码输入页面
          document.querySelector('#password').value = "${configStore.password}";
          document.querySelector('#btn-login').click();
        }
      };
      
      // 等待DOM加载完成
      if (document.readyState === 'complete') {
        checkAndFillLoginForm();
      } else {
        document.addEventListener('DOMContentLoaded', checkAndFillLoginForm);
      }
    `)
  }
  
  // 处理迅雷应用页面
  if (isXunleiPage.value) {
    // 注入"打开下载目录"按钮
    webviewEl.value.executeScript(`
      // 等待DOM加载完成
      const injectButton = () => {
        // 检查是否已存在按钮
        if (document.querySelector('#open-download-folder')) {
          return;
        }
        
        // 查找工具栏
        const toolbar = document.querySelector('.toolbar');
        if (!toolbar) {
          console.warn('未找到迅雷应用工具栏，无法注入按钮');
          return;
        }
        
        // 创建按钮
        const button = document.createElement('button');
        button.id = 'open-download-folder';
        button.className = 'el-button el-button--primary';
        button.innerHTML = '<span>打开下载目录</span>';
        button.style.marginLeft = '10px';
        
        // 添加点击事件，通过window.external通知Tauri
        button.addEventListener('click', () => {
          window.location.href = 'tauri://open-download-folder';
        });
        
        // 插入到工具栏
        toolbar.appendChild(button);
      };
      
      if (document.readyState === 'complete') {
        injectButton();
      } else {
        document.addEventListener('DOMContentLoaded', injectButton);
      }
    `)
  }
}

// 处理WebView加载完成事件
const handleLoadEnd = () => {
  loading.value = false
}

// 初始化WebView
const initWebView = async () => {
  if (!configStore.isConfigured) {
    return
  }
  
  // 创建WebView
  const webview = document.createElement('webview')
  webview.id = 'webview'
  webview.src = configStore.nasUrl
  webview.style.width = '100%'
  webview.style.height = '100%'
  
  // 添加事件监听
  webview.addEventListener('did-start-loading', () => {
    loading.value = true
  })
  
  webview.addEventListener('did-finish-load', handleLoadEnd)
  webview.addEventListener('did-navigate', handleNavigation)
  webview.addEventListener('did-navigate-in-page', handleNavigation)
  
  // 处理特殊URL协议
  webview.addEventListener('will-navigate', (event) => {
    if (event.url.startsWith('tauri://open-download-folder')) {
      event.preventDefault()
      openDownloadFolder()
    }
  })
  
  // 将WebView添加到容器
  const container = document.getElementById('webview-container')
  if (container) {
    container.innerHTML = ''
    container.appendChild(webview)
    webviewEl.value = webview
  }
}

// 监听配置变化
watch(() => configStore.isConfigured, (newValue) => {
  if (newValue) {
    initWebView()
  }
})

onMounted(() => {
  // 检查配置，如果已配置则初始化WebView
  if (configStore.isConfigured) {
    initWebView()
  } else {
    loading.value = false
  }
})

onUnmounted(() => {
  // 清理WebView事件监听
  if (webviewEl.value) {
    webviewEl.value.removeEventListener('did-finish-load', handleLoadEnd)
    webviewEl.value.removeEventListener('did-navigate', handleNavigation)
    webviewEl.value.removeEventListener('did-navigate-in-page', handleNavigation)
  }
})
</script>

<style scoped>
.main-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
}

.toolbar {
  display: flex;
  padding: 10px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
}

.webview-container {
  flex: 1;
  position: relative;
}

.no-config {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

#webview {
  border: none;
  outline: none;
}
</style>
