// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod cmd;
mod utils;

use cmd::config::*;
use cmd::fs::*;

// 添加打开开发者工具的命令
#[tauri::command]
fn open_devtools(window: tauri::Window) {
    #[cfg(debug_assertions)]
    window.open_devtools();
}

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
      test_nas_connection,
      save_config,
      load_config,
      check_config_exists,
      check_nas_connection_on_startup,
      open_download_directory,
      handle_download_link,
      open_devtools
    ])
    .setup(|_app| {
      // 注册URL协议处理器
      #[cfg(target_os = "windows")]
      {
        // Windows平台注册thunder://和magnet:协议
        // 这里需要在应用安装时通过安装程序进行注册
      }

      #[cfg(target_os = "macos")]
      {
        // macOS平台在Info.plist中配置
      }

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
