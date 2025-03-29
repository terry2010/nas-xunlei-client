<template>
  <div class="main-container">
    <div class="toolbar">
      <el-button type="primary" @click="openConfig">
        <el-icon><Setting /></el-icon> 配置
      </el-button>
    </div>
    
    <div class="webview-container" v-loading="loading">
      <div v-if="!configStore.isConfigured" class="no-config">
        <el-empty description="尚未配置NAS地址">
          <el-button type="primary" @click="openConfig">立即配置</el-button>
        </el-empty>
      </div>
      <div v-else class="webview-placeholder">
        <!-- Tauri会自动处理webview，这里只是一个占位符 -->
        <p>WebView将在这里显示</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useConfigStore } from '../store/config'
import { ElMessage } from 'element-plus'
import { Setting } from '@element-plus/icons-vue'

// 使用全局的window.__TAURI__对象
const invoke = window.__TAURI__.invoke

const router = useRouter()
const configStore = useConfigStore()

// 状态变量
const loading = ref(true)

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
        loading.value = false
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

// 打开配置页面
const openConfig = () => {
  router.push('/config')
}

onMounted(async () => {
  // 组件挂载时检查配置是否存在
  console.log("MainView组件已挂载，检查配置...")
  await checkConfigExists()
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
}

.toolbar .el-button {
  margin-right: 10px;
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

.webview-placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  background-color: #f5f7fa;
  color: #909399;
}
</style>
