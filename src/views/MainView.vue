<template>
  <div class="main-container">
    <div class="toolbar">
      <el-button type="primary" @click="openConfig">
        <el-icon><Setting /></el-icon> 配置
      </el-button>
      <el-button @click="goBack" :disabled="!canGoBack">
        <el-icon><ArrowLeft /></el-icon> 后退
      </el-button>
      <el-button @click="goForward" :disabled="!canGoForward">
        <el-icon><ArrowRight /></el-icon> 前进
      </el-button>
      <el-button @click="refresh">
        <el-icon><Refresh /></el-icon> 刷新
      </el-button>
      <div class="url-display" v-if="currentUrl">
        <span>{{ currentUrl }}</span>
      </div>
    </div>
    
    <div class="webview-container" v-loading="loading">
      <div v-if="!configStore.isConfigured" class="no-config">
        <el-empty description="尚未配置NAS地址">
          <el-button type="primary" @click="openConfig">立即配置</el-button>
        </el-empty>
      </div>
      <div v-else class="webview-content" id="webview-container"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useConfigStore } from '../store/config'
import { ElMessage } from 'element-plus'
import { Setting, ArrowLeft, ArrowRight, Refresh } from '@element-plus/icons-vue'

// 使用全局的window.__TAURI__对象
const invoke = window.__TAURI__ && window.__TAURI__.invoke
const tauri = window.__TAURI__

const router = useRouter()
const configStore = useConfigStore()

// 状态变量
const loading = ref(true)
const currentUrl = ref('')
const canGoBack = ref(false)
const canGoForward = ref(false)
let webviewElement = null

// 检查配置是否存在
const checkConfigExists = async () => {
  try {
    console.log("检查配置是否存在...")
    const exists = await invoke('check_config_exists')
    console.log("配置存在:", exists)
    
    if (!exists) {
      // 如果配置不存在，跳转到配置页面
      console.log("配置不存在，跳转到配置页面")
      router.push('/config')
    } else {
      // 如果配置存在，加载配置
      console.log("配置存在，加载配置")
      const config = await invoke('load_config')
      if (config) {
        console.log("配置加载成功:", config)
        configStore.setConfig({
          nasUrl: config.nas_url,
          downloadPath: config.download_path,
          autoOpenClient: config.auto_open_client,
          username: config.username,
          password: config.password
        })
        
        // 检查是否需要打开调试窗口
        if (config.debug && config.debug_open_console) {
          console.log("调试模式：尝试打开调试窗口")
          try {
            // 使用自定义的open_devtools命令
            await invoke('open_devtools')
            console.log("调试窗口已打开")
          } catch (error) {
            console.error("打开调试窗口失败:", error)
          }
        }
        
        // 检查NAS连接是否可用
        console.log("检查NAS连接是否可用...")
        const connectionOk = await invoke('check_nas_connection_on_startup')
        console.log("NAS连接检查结果:", connectionOk)
        
        if (!connectionOk) {
          // 如果连接失败，显示提示并跳转到配置页面
          ElMessage.warning('无法连接到NAS，请检查网络或配置')
          console.log("NAS连接失败，跳转到配置页面")
          router.push('/config')
          return
        }
        
        // 加载NAS地址
        loadWebView(config.nas_url)
      } else {
        // 配置加载失败，跳转到配置页面
        console.log("配置加载失败，跳转到配置页面")
        router.push('/config')
      }
    }
  } catch (error) {
    console.error("检查配置失败:", error)
    ElMessage.error(`检查配置失败: ${error}`)
    // 出错时也跳转到配置页面
    router.push('/config')
  }
}

// 加载WebView
const loadWebView = (url) => {
  if (!url) {
    console.error("URL为空，无法加载WebView")
    return
  }
  
  try {
    console.log("开始加载WebView:", url)
    currentUrl.value = url
    
    // 创建WebView元素
    const container = document.getElementById('webview-container')
    if (!container) {
      console.error("找不到WebView容器")
      return
    }
    
    // 清空容器
    container.innerHTML = ''
    
    // 创建iframe元素
    webviewElement = document.createElement('iframe')
    webviewElement.src = url
    webviewElement.style.width = '100%'
    webviewElement.style.height = '100%'
    webviewElement.style.border = 'none'
    
    // 添加事件监听器
    webviewElement.addEventListener('load', () => {
      console.log('WebView加载完成')
      loading.value = false
      updateNavigationState()
    })
    
    webviewElement.addEventListener('error', (error) => {
      console.error('WebView加载错误:', error)
      ElMessage.error(`WebView加载错误: ${error}`)
      loading.value = false
    })
    
    // 将iframe添加到容器中
    container.appendChild(webviewElement)
    console.log("WebView加载成功")
  } catch (error) {
    console.error("WebView加载失败:", error)
    ElMessage.error(`WebView加载失败: ${error}`)
    loading.value = false
  }
}

// 更新导航状态
const updateNavigationState = () => {
  try {
    if (webviewElement) {
      // 由于跨域限制，可能无法直接访问iframe的历史记录
      // 这里使用简化的逻辑
      canGoBack.value = true  // 假设始终可以后退
      canGoForward.value = false  // 假设始终不能前进
    }
  } catch (error) {
    console.error("获取导航状态失败:", error)
  }
}

// 导航控制函数
const goBack = () => {
  if (webviewElement && canGoBack.value) {
    try {
      // 使用iframe的contentWindow.history.back()
      // 但由于跨域限制，可能无法访问
      // 这里使用简化的方法，直接重新加载上一个URL
      loading.value = true
      webviewElement.contentWindow.history.back()
    } catch (error) {
      console.error("后退失败:", error)
      // 如果后退失败，可以尝试重新加载当前URL
      if (currentUrl.value) {
        webviewElement.src = currentUrl.value
      }
    }
  }
}

const goForward = () => {
  if (webviewElement && canGoForward.value) {
    try {
      loading.value = true
      webviewElement.contentWindow.history.forward()
    } catch (error) {
      console.error("前进失败:", error)
    }
  }
}

const refresh = () => {
  if (webviewElement) {
    try {
      loading.value = true
      // 重新加载iframe
      webviewElement.src = webviewElement.src
    } catch (error) {
      console.error("刷新失败:", error)
      loading.value = false
    }
  }
}

// 打开配置页面
const openConfig = () => {
  router.push('/config')
}

// 监听currentUrl变化
watch(currentUrl, (newUrl) => {
  console.log('currentUrl变化:', newUrl)
})

onMounted(async () => {
  // 组件挂载时检查配置是否存在
  console.log("MainView组件已挂载，检查配置...")
  await checkConfigExists()
})

onUnmounted(() => {
  // 组件卸载时清理资源
  if (webviewElement) {
    webviewElement.removeEventListener('load', () => {})
    webviewElement.removeEventListener('error', () => {})
  }
})
</script>

<style scoped>
.main-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}

.toolbar {
  display: flex;
  padding: 10px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
  align-items: center;
}

.toolbar .el-button {
  margin-right: 10px;
}

.url-display {
  flex: 1;
  margin-left: 10px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #606266;
  font-size: 14px;
}

.webview-container {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.no-config {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.webview-content {
  width: 100%;
  height: 100%;
  background-color: #fff;
}
</style>
