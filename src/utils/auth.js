/**
 * 认证相关工具函数
 */

/**
 * 检测当前页面是否为登录页面
 * @param {string} url - 当前页面URL
 * @returns {boolean} - 是否为登录页面
 */
export function isLoginPage(url) {
  return url.includes('login') || url.includes('auth') || url.includes('signin');
}

/**
 * 检测登录页面类型
 * @param {string} url - 当前页面URL
 * @param {Document} document - 页面DOM文档
 * @returns {string} - 登录页面类型：'username'、'password'或'unknown'
 */
export function detectLoginStep(url, document) {
  // 检查URL中的线索
  if (url.includes('username') || url.includes('account')) {
    return 'username';
  }
  
  if (url.includes('password')) {
    return 'password';
  }
  
  // 检查DOM中的线索
  const passwordInput = document.querySelector('input[type="password"]');
  const usernameInput = document.querySelector('input[type="text"], input[name="username"], input[id="username"]');
  
  if (passwordInput && usernameInput) {
    // 如果同时存在用户名和密码输入框，可能是单页面登录
    return 'both';
  } else if (passwordInput) {
    return 'password';
  } else if (usernameInput) {
    return 'username';
  }
  
  return 'unknown';
}

/**
 * 自动填充登录表单
 * @param {Document} document - 页面DOM文档
 * @param {string} step - 登录步骤：'username'、'password'或'both'
 * @param {Object} credentials - 登录凭证对象
 * @param {string} credentials.username - 用户名
 * @param {string} credentials.password - 密码
 * @returns {boolean} - 是否成功填充表单
 */
export function fillLoginForm(document, step, credentials) {
  let filled = false;
  
  if (step === 'username' || step === 'both') {
    const usernameInput = document.querySelector('input[type="text"], input[name="username"], input[id="username"]');
    if (usernameInput && credentials.username) {
      usernameInput.value = credentials.username;
      // 触发输入事件
      usernameInput.dispatchEvent(new Event('input', { bubbles: true }));
      filled = true;
    }
  }
  
  if (step === 'password' || step === 'both') {
    const passwordInput = document.querySelector('input[type="password"], input[name="password"], input[id="password"]');
    if (passwordInput && credentials.password) {
      passwordInput.value = credentials.password;
      // 触发输入事件
      passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
      filled = true;
    }
  }
  
  return filled;
}

/**
 * 提交登录表单
 * @param {Document} document - 页面DOM文档
 * @returns {boolean} - 是否成功提交表单
 */
export function submitLoginForm(document) {
  // 尝试查找登录按钮
  const loginButton = document.querySelector(
    'button[type="submit"], input[type="submit"], button:contains("登录"), button:contains("Login")'
  );
  
  if (loginButton) {
    loginButton.click();
    return true;
  }
  
  // 如果没有找到登录按钮，尝试提交表单
  const form = document.querySelector('form');
  if (form) {
    form.submit();
    return true;
  }
  
  return false;
}
