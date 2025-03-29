use serde::{Deserialize, Serialize};
use reqwest::blocking::Client;
use std::time::Duration;
use tauri::command;
use crate::utils::error::Result;
use std::fs;
use std::path::PathBuf;
use tauri::api::path;

#[derive(Debug, Serialize, Deserialize)]
pub struct Config {
    pub nas_url: String,
    pub download_path: String,
    pub auto_open_client: bool,
    pub username: String,
    pub password: String,
    #[serde(default)]
    pub debug: bool,
    #[serde(default)]
    pub debug_open_console: bool,
}

/// 获取配置文件路径
fn get_config_path() -> Result<PathBuf> {
    let mut config = tauri::Config::default();
    config.tauri.bundle.identifier = "com.nas-xunlei-client.app".into();
    
    let app_dir = path::app_data_dir(&config).ok_or_else(|| {
        std::io::Error::new(std::io::ErrorKind::NotFound, "无法获取应用目录")
    })?;
    
    Ok(app_dir.join("config.json"))
}

/// 测试NAS连接
#[command]
pub fn test_nas_connection(url: String) -> Result<serde_json::Value> {
    // 读取配置文件，检查是否开启调试模式
    let debug = match load_config() {
        Ok(Some(config)) => config.debug,
        _ => false,
    };
    
    if debug {
        println!("调试模式: 测试NAS连接 URL: {}", url);
    }
    
    // 检测是否使用了代理
    let proxy_env = std::env::var("HTTP_PROXY").or_else(|_| std::env::var("http_proxy"));
    let https_proxy_env = std::env::var("HTTPS_PROXY").or_else(|_| std::env::var("https_proxy"));
    let has_proxy = proxy_env.is_ok() || https_proxy_env.is_ok();
    
    if debug && has_proxy {
        println!("调试模式: 检测到系统代理设置");
        if let Ok(proxy) = proxy_env {
            println!("调试模式: HTTP_PROXY={}", proxy);
        }
        if let Ok(proxy) = https_proxy_env {
            println!("调试模式: HTTPS_PROXY={}", proxy);
        }
    }
    
    let client = Client::builder()
        .timeout(Duration::from_secs(10))
        .danger_accept_invalid_certs(true) // 接受无效的SSL证书
        .build()?;
    
    if debug {
        println!("调试模式: 已创建HTTP客户端");
    }
    
    let request = client.get(&url)
        .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36");
    
    if debug {
        println!("调试模式: 发送请求: {:?}", request);
    }
    
    let response = request.send();
    
    match response {
        Ok(res) => {
            let status = res.status();
            let success = status.is_success();
            
            if debug {
                println!("调试模式: 收到响应: 状态码 {}, 成功: {}", status, success);
                
                if let Ok(text) = res.text() {
                    if text.len() > 500 {
                        println!("调试模式: 响应内容(前500字符): {}", &text[..500]);
                    } else {
                        println!("调试模式: 响应内容: {}", text);
                    }
                }
            }
            
            let result = serde_json::json!({
                "success": success,
                "has_proxy": has_proxy
            });
            
            Ok(result)
        },
        Err(err) => {
            if debug {
                println!("调试模式: 请求失败: {:?}", err);
                
                // 打印更详细的错误信息
                if let Some(status) = err.status() {
                    println!("调试模式: HTTP状态码: {}", status);
                }
                
                if err.is_timeout() {
                    println!("调试模式: 连接超时");
                }
                
                if err.is_connect() {
                    println!("调试模式: 连接错误");
                }
                
                if err.is_redirect() {
                    println!("调试模式: 重定向错误");
                }
            }
            
            let result = serde_json::json!({
                "success": false,
                "has_proxy": has_proxy,
                "error": format!("{:?}", err)
            });
            
            Ok(result)
        }
    }
}

/// 保存配置到config.json文件
#[command]
pub fn save_config(config: Config) -> Result<()> {
    let config_path = get_config_path()?;
    
    // 确保目录存在
    if let Some(parent) = config_path.parent() {
        fs::create_dir_all(parent)?;
    }
    
    // 将配置序列化为JSON并写入文件
    let json = serde_json::to_string_pretty(&config)?;
    fs::write(config_path, json)?;
    
    Ok(())
}

/// 从config.json文件加载配置
#[command]
pub fn load_config() -> Result<Option<Config>> {
    let config_path = get_config_path()?;
    
    if !config_path.exists() {
        return Ok(None);
    }
    
    let json = fs::read_to_string(config_path)?;
    let config = serde_json::from_str(&json)?;
    
    Ok(Some(config))
}

/// 检查配置是否存在
#[command]
pub fn check_config_exists() -> Result<bool> {
    let config_path = get_config_path()?;
    Ok(config_path.exists())
}

/// 在应用启动时检查NAS连接
#[command]
pub fn check_nas_connection_on_startup() -> Result<bool> {
    // 加载配置
    let config = match load_config()? {
        Some(config) => config,
        None => return Ok(false), // 如果配置不存在，返回false
    };
    
    let debug = config.debug;
    let url = config.nas_url.clone();
    
    if debug {
        println!("调试模式: 应用启动时检查NAS连接: {}", url);
    }
    
    // 检测是否使用了代理
    let proxy_env = std::env::var("HTTP_PROXY").or_else(|_| std::env::var("http_proxy"));
    let https_proxy_env = std::env::var("HTTPS_PROXY").or_else(|_| std::env::var("https_proxy"));
    let has_proxy = proxy_env.is_ok() || https_proxy_env.is_ok();
    
    if debug && has_proxy {
        println!("调试模式: 检测到系统代理设置，可能会影响连接测试");
    }
    
    // 创建HTTP客户端
    let client = Client::builder()
        .timeout(Duration::from_secs(5)) // 启动时使用较短的超时时间
        .danger_accept_invalid_certs(true)
        .build()?;
    
    if debug {
        println!("调试模式: 已创建HTTP客户端用于启动检查");
    }
    
    // 发送请求
    let request = client.get(&url)
        .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36");
    
    let response = request.send();
    
    match response {
        Ok(res) => {
            let success = res.status().is_success();
            
            if debug {
                println!("调试模式: 启动检查NAS连接结果: {}", if success { "成功" } else { "失败" });
            }
            
            Ok(success)
        },
        Err(err) => {
            if debug {
                println!("调试模式: 启动检查NAS连接失败: {:?}", err);
            }
            
            Ok(false)
        }
    }
}
