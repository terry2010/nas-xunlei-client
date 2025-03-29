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

// 导入Tauri API
import { invoke, dialog } from '@tauri-apps/api'

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
    // 使用Tauri API测试连接
    const result = await invoke('test_nas_connection', { url: form.nasUrl })
    if (result) {
      ElMessage.success('连接成功')
    } else {
      ElMessage.error('连接失败')
    }
  } catch (error) {
    ElMessage.error(`连接测试失败: ${error}`)
  } finally {
    testing.value = false
  }
}

// 浏览网络路径
const browsePath = async () => {
  try {
    // 使用Tauri API打开文件对话框
    const selected = await dialog.open({
      directory: true,
      multiple: false,
      title: '选择下载目录'
    })
    
    if (selected) {
      form.downloadPath = selected
    }
  } catch (error) {
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
        // 使用Tauri API保存配置到安全存储
        await invoke('save_config', {
          config: {
            nasUrl: form.nasUrl,
            downloadPath: form.downloadPath,
            autoOpenClient: form.autoOpenClient,
            username: form.username,
            password: form.password
          }
        })
        
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
        ElMessage.error(`配置保存失败: ${error}`)
      } finally {
        saving.value = false
      }
    } else {
      ElMessage.warning('请完成所有必填项')
    }
  })
}

// 取消配置
const cancel = () => {
  router.push('/')
}

onMounted(() => {
  // 如果已有配置，则加载到表单
  if (configStore.isConfigured) {
    form.nasUrl = configStore.nasUrl
    form.downloadPath = configStore.downloadPath
    form.autoOpenClient = configStore.autoOpenClient
    form.username = configStore.username
    // 密码不从本地存储加载，需要用户重新输入
  }
})
</script>

<style scoped>
.config-container {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.config-card {
  margin-bottom: 20px;
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

.el-divider {
  margin: 24px 0;
}
</style>
