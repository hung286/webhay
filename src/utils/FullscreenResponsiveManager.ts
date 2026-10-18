/**
 * HỆ THỐNG QUẢN LÝ BỐ CỤC VÀ FULLSCREEN CHỐNG XUNG ĐỘT
 * Thiết kế bởi Chuyên gia Game Web HTML5
 */

interface CustomWindow extends Window {
  myGameInstance?: { resize: () => void };
  renderCanvasGame?: () => void;
  toggleGameFullscreen?: () => void;
}

const declareWindow = (typeof window !== 'undefined' ? window : {}) as unknown as CustomWindow;

const LayoutManager = {
  // 1. Kiểm tra môi trường Iframe (Vercel nhúng)
  isIframe(): boolean {
    return window.self !== window.top;
  },

  // 2. Lấy khung chứa gốc của Game
  getGameWrapper(): HTMLElement {
    return document.getElementById('game-wrapper') || 
           document.querySelector('.apple-game-container') || 
           document.documentElement;
  },

  // 3. Kiểm tra trạng thái Fullscreen thực tế từ trình duyệt
  checkCurrentFullscreen(): boolean {
    return !!(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement
    );
  },

  // 4. Hàm xử lý logic Phân tách thiết bị (Laptop vs Mobile / Chia đôi cửa sổ)
  updateResponsiveState(): void {
    const isFsActive = this.checkCurrentFullscreen() || document.body.classList.contains('is-fullscreen-active');
    
    if (isFsActive) {
      // Khi bật Fullscreen: Khóa cứng chế độ Laptop 100%, cấm tuyệt đối nhảy sang Mobile
      document.body.classList.remove('forced-mobile-layout');
      document.body.classList.add('forced-laptop-layout', 'is-fullscreen-active');
    } else {
      // Khi ở chế độ thường (hoặc chia đôi màn hình): Dựa vào bề ngang thực tế để chuyển giao diện
      document.body.classList.remove('forced-laptop-layout');
      if (window.innerWidth < 850) {
        document.body.classList.add('forced-mobile-layout');
      } else {
        document.body.classList.remove('forced-mobile-layout');
      }
      document.body.classList.remove('is-fullscreen-active');
    }

    // Kích hoạt vẽ lại Canvas hoặc Game nếu hệ thống có hàm dựng sẵn (đợi layout ổn định)
    if (declareWindow.myGameInstance?.resize) declareWindow.myGameInstance.resize();
    if (declareWindow.renderCanvasGame) declareWindow.renderCanvasGame();
  },

  // 5. Hàm Debounce chống nhiễu/chớp giật khi co giãn màn hình
  debounce(fn: (...args: any[]) => void, delay: number) {
    let timeoutId: any;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
  },

  // 6. Hàm kích hoạt / Thoát toàn màn hình an toàn
  async toggleFullscreen(): Promise<void> {
    // Nếu game chạy trong Iframe, gửi thông điệp ủy quyền cho trang mẹ xử lý phóng to iframe
    if (this.isIframe()) {
      window.parent.postMessage({ type: 'TOGGLE_FULLSCREEN' }, '*');
      return;
    }

    // Nếu chạy độc lập, tự xử lý Fullscreen API
    const el = this.getGameWrapper();
    if (!this.checkCurrentFullscreen()) {
      try {
        if (el.requestFullscreen) await el.requestFullscreen();
        else if ((el as any).webkitRequestFullscreen) await (el as any).webkitRequestFullscreen();
        else if ((el as any).mozRequestFullScreen) await (el as any).mozRequestFullScreen();
        else if ((el as any).msRequestFullscreen) await (el as any).msRequestFullscreen();
      } catch (err: any) {
        console.warn('[LayoutManager] Không thể vào Fullscreen:', err.message);
      }
    } else {
      try {
        if (document.exitFullscreen) await document.exitFullscreen();
        else if ((document as any).webkitExitFullscreen) await (document as any).webkitExitFullscreen();
        else if ((document as any).mozCancelFullScreen) await (document as any).mozCancelFullScreen();
        else if ((document as any).msExitFullscreen) await (document as any).msExitFullscreen();
      } catch (err: any) {
        console.warn('[LayoutManager] Không thể thoát Fullscreen:', err.message);
      }
    }
  },

  // 7. Đồng bộ hóa văn bản hiển thị trên nút bấm UI
  syncButtonUI(): void {
    const isFs = this.checkCurrentFullscreen();
    const btnText = document.getElementById('fullscreenText') || document.querySelector('#fs-btn span:last-child');
    const btnIcon = document.getElementById('fullscreenIcon') || document.querySelector('#fs-btn span:first-child');
    
    if (btnText) btnText.textContent = isFs ? 'Thu nhỏ' : 'Toàn màn hình';
    if (btnIcon) btnIcon.textContent = isFs ? '🗗' : '⛶';
  }
};

// --- ĐĂNG KÝ CÁC BỘ LẮNG NGHE SỰ KIỆN TỰ ĐỘNG KHÔNG XUNG ĐỘT ---

if (typeof window !== 'undefined') {
  // Lắng nghe thay đổi Fullscreen để đổi Class và đồng bộ UI
  ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'].forEach(evt => {
    document.addEventListener(evt, () => {
      LayoutManager.updateResponsiveState();
      LayoutManager.syncButtonUI();
    });
  });

  // Lắng nghe sự kiện co giãn / chia đôi màn hình với Debounce 180ms chặn chớp giật
  window.addEventListener('resize', LayoutManager.debounce(() => {
    LayoutManager.updateResponsiveState();
  }, 180));

  // Khởi chạy kiểm tra cấu hình ngay khi tải trang
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      LayoutManager.updateResponsiveState();
    });
  } else {
    LayoutManager.updateResponsiveState();
  }

  // Xuất hàm ra window để HTML onclick="toggleGameFullscreen()" chạy trực tiếp
  declareWindow.toggleGameFullscreen = () => LayoutManager.toggleFullscreen();
}

export default LayoutManager;
