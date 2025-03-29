/**
 * 认证相关工具函数
 */

/**
 * 检测当前页面是否为登录页面
 * @param {string} url - 当前页面URL
 * @returns {boolean} - 是否为登录页面
 */
export function detectLoginPage(url) {
  return url.includes('/webman/login.cgi');
}

/**
 * 检测当前页面是否为用户名输入页面
 * @param {Document} document - 当前页面文档对象
 * @returns {boolean} - 是否为用户名输入页面
 */
export function isUsernameInputPage(document) {
  const usernameInput = document.querySelector('#username');
  return !!usernameInput;
}

/**
 * 检测当前页面是否为密码输入页面
 * @param {Document} document - 当前页面文档对象
 * @returns {boolean} - 是否为密码输入页面
 */
export function isPasswordInputPage(document) {
  const passwordInput = document.querySelector('#password');
  return !!passwordInput;
}

/**
 * 自动填充用户名并提交
 * @param {Document} document - 当前页面文档对象
 * @param {string} username - 用户名
 */
export function autoFillUsername(document, username) {
  const usernameInput = document.querySelector('#username');
  if (usernameInput) {
    usernameInput.value = username;
    const submitButton = document.querySelector('#btn-login');
    if (submitButton) {
      submitButton.click();
    }
  }
}

/**
 * 自动填充密码并提交
 * @param {Document} document - 当前页面文档对象
 * @param {string} password - 密码
 */
export function autoFillPassword(document, password) {
  const passwordInput = document.querySelector('#password');
  if (passwordInput) {
    passwordInput.value = password;
    const submitButton = document.querySelector('#btn-login');
    if (submitButton) {
      submitButton.click();
    }
  }
}

/**
 * 检测是否已登录成功
 * @param {string} url - 当前页面URL
 * @returns {boolean} - 是否已登录成功
 */
export function isLoggedIn(url) {
  return !url.includes('/webman/login.cgi') && url.includes('/webman/index.cgi');
}
