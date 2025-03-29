<template>
  <div class="config-container">
    <el-card class="config-card">
      <template #header>
        <div class="card-header">
          <h2>群辉NAS迅雷客户端配置</h2>
        </div>
      </template>
      
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px" status-icon>
        <!-- NAS连接配置组 -->
        <el-divider content-position="left">NAS连接配置</el-divider>
        
        <el-form-item label="NAS地址" prop="nasUrl">
          <el-input v-model="form.nasUrl" placeholder="例如: http://192.168.1.100:5000">
            <template #append>
              <el-button @click="testConnection" :loading="testing">测试连接</el-button>
            </template>
          </el-input>
        </el-form-item>
        
        <!-- 迅雷配置组 -->
        <el-divider content-position="left">迅雷配置</el-divider>
        
        <el-form-item label="下载目录路径" prop="downloadPath">
          <el-input v-model="form.downloadPath" placeholder="例如: \\NAS\download">
            <template #append>
              <el-button @click="browsePath">浏览</el-button>
            </template>
          </el-input>
        </el-form-item>
        
        <!-- 自动化配置组 -->
        <el-divider content-position="left">自动化配置</el-divider>
        
        <el-form-item label="拦截下载链接">
          <el-switch v-model="form.autoOpenClient" />
          <span class="form-tip">启用后，点击迅雷/BT下载链接时自动打开客户端</span>
        </el-form-item>
        
        <!-- 账户信息组 -->
        <el-divider content-position="left">账户信息</el-divider>
        
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="群辉NAS登录用户名" />
        </el-form-item>
        
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" placeholder="群辉NAS登录密码" type="password" show-password />
        </el-form-item>
        
        <!-- 底部操作按钮 -->
        <el-form-item>
          <el-button type="primary" @click="saveConfig" :loading="saving">保存配置</el-button>
          <el-button @click="cancel">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useConfigStore } from '../store/config'
import { ElMessage } from 'element-plus'

// 使用全局的window.__TAURI__对象
const invoke = window.__TAURI__.invoke
const dialog = window.__TAURI__.dialog

const router = useRouter()
const configStore = useConfigStore()
const formRef = ref(null)

// 表单数据
const form = reactive({
  nasUrl: '',
  downloadPath: '',
  autoOpenClient: true,
  username: '',
  password: ''
})

// 表单验证规则
const rules = {
  nasUrl: [
    { required: true, message: '请输入NAS地址', trigger: 'blur' },
    { pattern: /^https?:\/\/.+/, message: '请输入有效的URL，以http://或https://开头', trigger: 'blur' }
  ],
  downloadPath: [
    { required: true, message: '请输入下载目录路径', trigger: 'blur' }
  ],
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
}

// 状态变量
const testing = ref(false)
const saving = ref(false)

// 测试NAS连接
const testConnection = async () => {
  if (!form.nasUrl) {
    ElMessage.warning('请先输入NAS地址')
    return
  }
  
  testing.value = true
  try {
    console.log("测试NAS连接:", form.nasUrl)
    // 使用Tauri API测试连接
    const result = await invoke('test_nas_connection', { url: form.nasUrl })
    console.log("连接测试结果:", result)
    
    if (result.success) {
      ElMessage.success('连接成功')
    } else {
      // 检查是否使用了代理
      if (result.has_proxy) {
        ElMessage.error('连接失败，发现电脑正在使用代理，请关掉代理后重试')
      } else {
        ElMessage.error('连接失败，请检查NAS地址是否正确')
      }
    }
  } catch (error) {
    console.error("连接测试失败:", error)
    ElMessage.error(`连接测试失败: ${error}`)
  } finally {
    testing.value = false
  }
}

// 浏览网络路径
const browsePath = async () => {
  try {
    console.log("打开文件对话框选择下载目录")
    // 使用Tauri API打开文件对话框
    const selected = await dialog.open({
      directory: true,
      multiple: false,
      title: '选择下载目录'
    })
    
    console.log("选择的目录:", selected)
    if (selected) {
      form.downloadPath = selected
    }
  } catch (error) {
    console.error("选择目录失败:", error)
    ElMessage.error(`选择目录失败: ${error}`)
  }
}

// 保存配置
const saveConfig = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      saving.value = true
      try {
        console.log("保存配置:", form)
        // 使用Tauri API保存配置到config.json文件
        await invoke('save_config', {
          config: {
            nas_url: form.nasUrl,
            download_path: form.downloadPath,
            auto_open_client: form.autoOpenClient,
            username: form.username,
            password: form.password
          }
        })
        
        console.log("配置保存成功，更新Pinia存储")
        // 更新Pinia存储
        configStore.setConfig({
          nasUrl: form.nasUrl,
          downloadPath: form.downloadPath,
          autoOpenClient: form.autoOpenClient,
          username: form.username,
          password: form.password
        })
        
        ElMessage.success('配置保存成功')
        router.push('/')
      } catch (error) {
        console.error("配置保存失败:", error)
        ElMessage.error(`配置保存失败: ${error}`)
      } finally {
        saving.value = false
      }
    } else {
      console.warn("表单验证失败")
      ElMessage.warning('请完成所有必填项')
    }
  })
}

// 取消配置
const cancel = () => {
  // 如果已经有配置，则返回主页面
  if (configStore.isConfigured) {
    console.log("取消配置，返回主页面")
    router.push('/')
  } else {
    // 如果没有配置，显示提示
    console.warn("首次使用需要完成配置")
    ElMessage.warning('首次使用需要完成配置')
  }
}

// 加载已有配置
const loadConfig = async () => {
  try {
    console.log("检查配置文件是否存在")
    // 检查配置文件是否存在
    const exists = await invoke('check_config_exists')
    console.log("配置文件存在:", exists)
    
    if (exists) {
      // 从config.json加载配置
      console.log("从config.json加载配置")
      const config = await invoke('load_config')
      console.log("加载的配置:", config)
      
      if (config) {
        // 将配置加载到表单
        form.nasUrl = config.nas_url
        form.downloadPath = config.download_path
        form.autoOpenClient = config.auto_open_client
        form.username = config.username
        form.password = config.password
        
        // 更新Pinia存储
        configStore.setConfig({
          nasUrl: config.nas_url,
          downloadPath: config.download_path,
          autoOpenClient: config.auto_open_client,
          username: config.username,
          password: config.password
        })
        
        console.log("配置加载成功")
      }
    } else {
      console.log("配置文件不存在，使用默认值")
    }
  } catch (error) {
    console.error("加载配置失败:", error)
    ElMessage.error(`加载配置失败: ${error}`)
  }
}

onMounted(async () => {
  // 组件挂载时加载配置
  console.log("ConfigView组件已挂载，加载配置...")
  await loadConfig()
})
</script>

<style scoped>
.config-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
  background-color: #f5f7fa;
}

.config-card {
  width: 100%;
  max-width: 600px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.form-tip {
  margin-left: 10px;
  color: #909399;
  font-size: 12px;
}
</style>
