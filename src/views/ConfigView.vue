<template>
  <div class="config-container">
    <div class="config-header">
      <h1>NAS迅雷客户端配置</h1>
    </div>
    
    <div class="config-form">
      <el-form ref="configForm" :model="form" :rules="rules" label-width="120px">
        <!-- NAS连接配置组 -->
        <el-divider content-position="left">NAS连接配置</el-divider>
        <el-form-item label="NAS地址" prop="nasUrl">
          <el-input v-model="form.nasUrl" placeholder="例如: http://192.168.1.100:5000">
            <template #append>
              <el-button @click="testConnection">测试连接</el-button>
            </template>
          </el-input>
          <div class="form-tip">请输入群辉NAS的完整地址，包括http://或https://前缀和端口号</div>
        </el-form-item>
        
        <!-- 迅雷配置组 -->
        <el-divider content-position="left">迅雷配置</el-divider>
        <el-form-item label="下载目录路径" prop="downloadPath">
          <el-input v-model="form.downloadPath" placeholder="例如: \\NAS\download">
            <template #append>
              <el-button @click="browseFolder">浏览</el-button>
            </template>
          </el-input>
          <div class="form-tip">请输入迅雷下载目录的网络路径，通常为共享文件夹路径</div>
        </el-form-item>
        
        <!-- 自动化配置组 -->
        <el-divider content-position="left">自动化配置</el-divider>
        <el-form-item label="拦截下载链接">
          <el-switch v-model="form.autoOpen" active-text="启用" inactive-text="禁用"></el-switch>
          <div class="form-tip">启用后，点击迅雷/磁力链接时将自动打开客户端并添加下载任务</div>
        </el-form-item>
        
        <!-- 账户信息组 -->
        <el-divider content-position="left">账户信息</el-divider>
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="NAS登录用户名"></el-input>
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="NAS登录密码" show-password></el-input>
        </el-form-item>
      </el-form>
      
      <!-- 测试连接结果 -->
      <div v-if="testResult" class="test-result" :class="{ success: testResult.success, error: !testResult.success }">
        <i :class="testResult.success ? 'el-icon-success' : 'el-icon-error'"></i>
        <span>{{ testResult.message }}</span>
      </div>
      
      <!-- 底部操作按钮 -->
      <div class="config-actions">
        <el-button type="primary" @click="saveConfig" :loading="saving">保存配置</el-button>
        <el-button @click="cancel">取消</el-button>
      </div>
    </div>
  </div>
</template>

<script>
import { useConfigStore } from '../store/config';

export default {
  name: 'ConfigView',
  data() {
    return {
      form: {
        nasUrl: '',
        downloadPath: '',
        autoOpen: true,
        username: '',
        password: ''
      },
      rules: {
        nasUrl: [
          { required: true, message: '请输入NAS地址', trigger: 'blur' },
          { pattern: /^https?:\/\/.+/, message: '请输入有效的URL，包含http://或https://', trigger: 'blur' }
        ],
        username: [
          { required: true, message: '请输入用户名', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' }
        ]
      },
      testResult: null,
      saving: false
    }
  },
  created() {
    this.configStore = useConfigStore();
    this.loadConfig();
  },
  methods: {
    // 加载配置
    loadConfig() {
      this.configStore.loadConfig().then((config) => {
        this.form.nasUrl = config.nasUrl;
        this.form.downloadPath = config.downloadPath;
        this.form.autoOpen = config.autoOpen;
        this.form.username = config.username;
        this.form.password = config.password;
      });
    },
    
    // 测试NAS连接
    testConnection() {
      if (!this.form.nasUrl) {
        this.$message.warning('请先输入NAS地址');
        return;
      }
      
      this.testResult = null;
      this.configStore.nasUrl = this.form.nasUrl;
      
      this.configStore.testConnection().then((result) => {
        if (result.success) {
          this.testResult = {
            success: true,
            message: '连接成功！NAS地址可访问。'
          };
        } else {
          let errorMsg = '连接失败！';
          
          if (result.error && result.error.includes('ECONNREFUSED')) {
            errorMsg += '无法连接到NAS，请检查地址是否正确或NAS是否在线。';
          } else if (result.error && result.error.includes('ETIMEDOUT')) {
            errorMsg += '连接超时，请检查网络连接或NAS是否在线。';
          } else if (result.error && result.error.includes('ENOTFOUND')) {
            errorMsg += '找不到NAS主机，请检查地址是否正确。';
          } else if (result.status >= 400) {
            errorMsg += `服务器返回错误状态码: ${result.status}`;
          } else {
            errorMsg += result.error || '未知错误';
          }
          
          this.testResult = {
            success: false,
            message: errorMsg
          };
        }
      });
    },
    
    // 浏览文件夹（在Electron中实际上不会弹出文件夹选择器，这里只是一个提示）
    browseFolder() {
      this.$message.info('请手动输入网络路径，例如: \\\\NAS\\download');
    },
    
    // 保存配置
    saveConfig() {
      this.$refs.configForm.validate((valid) => {
        if (valid) {
          this.saving = true;
          
          // 更新配置存储
          this.configStore.nasUrl = this.form.nasUrl;
          this.configStore.downloadPath = this.form.downloadPath;
          this.configStore.autoOpen = this.form.autoOpen;
          this.configStore.username = this.form.username;
          this.configStore.password = this.form.password;
          
          // 保存配置
          this.configStore.saveConfig().then(() => {
            this.saving = false;
            this.$message.success('配置已保存');
            this.$router.push('/');
          }).catch(() => {
            this.saving = false;
            this.$message.error('保存配置失败');
          });
        } else {
          return false;
        }
      });
    },
    
    // 取消配置
    cancel() {
      // 如果已经配置过，返回主页；否则不做任何操作
      if (this.configStore.isConfigured) {
        this.$router.push('/');
      }
    }
  }
}
</script>

<style scoped>
.config-container {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.config-header {
  text-align: center;
  margin-bottom: 30px;
}

.config-form {
  background-color: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.test-result {
  margin: 20px 0;
  padding: 10px;
  border-radius: 4px;
  display: flex;
  align-items: center;
}

.test-result i {
  margin-right: 10px;
  font-size: 18px;
}

.test-result.success {
  background-color: #f0f9eb;
  color: #67c23a;
  border: 1px solid #e1f3d8;
}

.test-result.error {
  background-color: #fef0f0;
  color: #f56c6c;
  border: 1px solid #fde2e2;
}

.config-actions {
  margin-top: 30px;
  text-align: center;
}
</style>
