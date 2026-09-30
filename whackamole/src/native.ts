interface NativeWindow {
  close(): Promise<void>;
  isFullscreen(): Promise<boolean>;
  setFullscreen(value: boolean): Promise<void>;
}
declare global {
  interface Window {
    __TAURI__?: { window: { getCurrentWindow(): NativeWindow } };
  }
}
export const isDesktop = () => !!window.__TAURI__;
export async function exitApp(): Promise<boolean> {
  if (window.__TAURI__) {
    await window.__TAURI__.window.getCurrentWindow().close();
    return true;
  }
  if (document.fullscreenElement) await document.exitFullscreen();
  return false;
}
export async function toggleFullscreen(): Promise<void> {
  if (window.__TAURI__) {
    const win = window.__TAURI__.window.getCurrentWindow();
    await win.setFullscreen(!(await win.isFullscreen()));
  } else if (document.fullscreenElement) await document.exitFullscreen();
  else await document.documentElement.requestFullscreen();
}
