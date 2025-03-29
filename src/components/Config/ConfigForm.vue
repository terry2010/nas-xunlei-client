<template>
  <el-form ref="form" :model="formData" :rules="rules" label-width="120px">
    <el-form-item label="NAS地址" prop="nasUrl">
      <el-input v-model="formData.nasUrl" placeholder="例如: http://192.168.1.100:5000" />
      <div class="form-tip">请输入群辉NAS的完整地址，包括http://或https://前缀和端口号</div>
    </el-form-item>
    
    <el-form-item label="下载目录路径" prop="downloadPath">
      <el-input v-model="formData.downloadPath" placeholder="例如: \\NAS\download" />
      <div class="form-tip">请输入迅雷下载目录的网络路径，通常为共享文件夹路径</div>
    </el-form-item>
    
    <el-form-item label="自动打开客户端">
      <el-switch v-model="formData.autoOpen" />
      <div class="form-tip">启用后，点击迅雷/磁力链接时将自动打开客户端并添加下载任务</div>
    </el-form-item>
    
    <el-form-item label="用户名" prop="username">
      <el-input v-model="formData.username" placeholder="NAS登录用户名" />
    </el-form-item>
    
    <el-form-item label="密码" prop="password">
      <el-input v-model="formData.password" type="password" placeholder="NAS登录密码" show-password />
    </el-form-item>
    
    <el-form-item>
      <el-button type="primary" @click="submitForm">保存</el-button>
      <el-button @click="resetForm">重置</el-button>
    </el-form-item>
  </el-form>
</template>

<script>
export default {
  name: 'ConfigForm',
  props: {
    initialData: {
      type: Object,
      default: () => ({
        nasUrl: '',
        downloadPath: '',
        autoOpen: true,
        username: '',
        password: ''
      })
    }
  },
  data() {
    return {
      formData: { ...this.initialData },
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
      }
    }
  },
  watch: {
    initialData: {
      handler(newVal) {
        this.formData = { ...newVal };
      },
      deep: true
    }
  },
  methods: {
    submitForm() {
      this.$refs.form.validate((valid) => {
        if (valid) {
          this.$emit('submit', { ...this.formData });
        } else {
          return false;
        }
      });
    },
    resetForm() {
      this.$refs.form.resetFields();
      this.formData = { ...this.initialData };
    }
  }
}
</script>

<style scoped>
.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}
</style>
