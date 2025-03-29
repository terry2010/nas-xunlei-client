#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

mod cmd;
mod utils;

use cmd::config::*;
use cmd::fs::*;

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
      test_nas_connection,
      save_config,
      load_config,
      check_config_exists,
      open_download_directory,
      handle_download_link
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
