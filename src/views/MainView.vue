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
        loadNasPage(config.nas_url)
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

// 加载NAS页面
const loadNasPage = async (url) => {
  if (!url) {
    console.error("URL为空，无法加载NAS页面")
    return
  }
  
  try {
    console.log("开始加载NAS页面:", url)
    currentUrl.value = url
    loading.value = true
    
    // 使用Rust命令加载NAS页面
    await invoke('open_nas_page', { url })
    
    // 设置延时，等待页面加载完成
    setTimeout(() => {
      loading.value = false
      console.log("NAS页面加载完成")
    }, 2000)
  } catch (error) {
    console.error("加载NAS页面失败:", error)
    ElMessage.error(`加载NAS页面失败: ${error}`)
    loading.value = false
  }
}

// 导航控制函数
const goBack = async () => {
  try {
    if (canGoBack.value) {
      loading.value = true
      
      // 使用history.back()
      if (window.history && window.history.back) {
        window.history.back()
      }
      
      setTimeout(() => {
        loading.value = false
      }, 1000)
    }
  } catch (error) {
    console.error("后退失败:", error)
    loading.value = false
  }
}

const goForward = async () => {
  try {
    if (canGoForward.value) {
      loading.value = true
      
      // 使用history.forward()
      if (window.history && window.history.forward) {
        window.history.forward()
      }
      
      setTimeout(() => {
        loading.value = false
      }, 1000)
    }
  } catch (error) {
    console.error("前进失败:", error)
    loading.value = false
  }
}

const refresh = async () => {
  try {
    loading.value = true
    
    // 重新加载当前页面
    if (currentUrl.value) {
      await loadNasPage(currentUrl.value)
    }
  } catch (error) {
    console.error("刷新失败:", error)
    loading.value = false
  }
}

// 打开配置页面
const openConfig = () => {
  router.push('/config')
}

// 更新导航状态
const updateNavigationState = () => {
  // 简化处理，假设始终可以后退，不能前进
  canGoBack.value = true
  canGoForward.value = false
}

// 监听URL变化
watch(currentUrl, (newUrl) => {
  console.log('当前URL变化:', newUrl)
  updateNavigationState()
})

onMounted(async () => {
  // 组件挂载时检查配置是否存在
  console.log("MainView组件已挂载，检查配置...")
  await checkConfigExists()
  
  // 监听window的popstate事件
  window.addEventListener('popstate', () => {
    updateNavigationState()
  })
})

onUnmounted(() => {
  // 移除事件监听
  window.removeEventListener('popstate', () => {})
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
