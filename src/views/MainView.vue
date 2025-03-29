<template>
  <div class="main-container">
    <div class="toolbar">
      <el-button type="primary" @click="openConfig">
        <el-icon><Setting /></el-icon> 配置
      </el-button>
      <el-button @click="openNasWindow" v-if="!nasWindowOpened">
        <el-icon><Link /></el-icon> 打开NAS
      </el-button>
      <div class="url-display" v-if="configStore.nasUrl">
        <span>{{ configStore.nasUrl }}</span>
      </div>
    </div>
    
    <div class="content-container" v-loading="loading">
      <div v-if="!configStore.isConfigured" class="no-config">
        <el-empty description="尚未配置NAS地址">
          <el-button type="primary" @click="openConfig">立即配置</el-button>
        </el-empty>
      </div>
      <div v-else class="nas-info">
        <el-result
          icon="success"
          title="NAS连接成功"
          sub-title="请点击'打开NAS'按钮访问NAS界面"
        >
          <template #extra>
            <el-button type="primary" @click="openNasWindow">打开NAS</el-button>
          </template>
        </el-result>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useConfigStore } from '../store/config'
import { ElMessage } from 'element-plus'
import { Setting, Link } from '@element-plus/icons-vue'

// 使用全局的window.__TAURI__对象
const invoke = window.__TAURI__ && window.__TAURI__.invoke
const tauri = window.__TAURI__

const router = useRouter()
const configStore = useConfigStore()

// 状态变量
const loading = ref(true)
const nasWindowOpened = ref(false)

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
        
        loading.value = false
        
        // 如果配置了自动打开客户端，则自动打开NAS窗口
        if (config.auto_open_client) {
          openNasWindow()
        }
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

// 打开NAS窗口
const openNasWindow = async () => {
  if (!configStore.nasUrl) {
    ElMessage.warning('未配置NAS地址，请先进行配置')
    return
  }
  
  try {
    console.log("正在打开NAS地址:", configStore.nasUrl)
    
    // 使用shell.open打开系统默认浏览器
    if (tauri && tauri.shell) {
      await tauri.shell.open(configStore.nasUrl)
      nasWindowOpened.value = true
      console.log("已在系统浏览器中打开NAS页面")
    } else {
      // 如果tauri.shell不可用，尝试使用window.open
      window.open(configStore.nasUrl, '_blank')
      nasWindowOpened.value = true
      console.log("已在新窗口中打开NAS页面")
    }
  } catch (error) {
    console.error("打开NAS页面失败:", error)
    ElMessage.error(`打开NAS页面失败: ${error}`)
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

.content-container {
  flex: 1;
  position: relative;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
}

.no-config {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.nas-info {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
