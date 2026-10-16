import React, { useState, useEffect, useRef } from 'react';
import { soundFx } from '../../utils/sound';
import { 
  Gamepad2, 
  Maximize, 
  Minimize, 
  RefreshCw, 
  ExternalLink, 
  ShieldCheck, 
  Play, 
  Layers, 
  CheckCircle2, 
  Sparkles,
  Flame,
  ArrowRight
} from 'lucide-react';

/**
 * RESET TOÀN BỘ BỘ NHỚ ĐỆM VÀ KHỞI TẠO ĐÚNG CONTAINER GAME (ROUTER REBOOT FIX)
 * Tiêm bộ dọn dẹp môi trường trước khi nạp mã nguồn mới
 */
export function switchActiveGameTemplate(newGameId: string, gameType: string): string {
    console.log("Đang giải phóng bộ nhớ game cũ, chuyển sang game mới ID:", newGameId);
    
    // 1. Khai tử hoàn toàn Canvas cũ và các vòng lặp requestAnimationFrame còn sót lại của xe F1
    if ((window as any).gameLoopInterval) {
        clearInterval((window as any).gameLoopInterval);
        (window as any).gameLoopInterval = null;
    }
    if ((window as any).cancelAnimationFrame && (window as any).myReqAnimationId) {
        (window as any).cancelAnimationFrame((window as any).myReqAnimationId);
        (window as any).myReqAnimationId = null;
    }
    if ((window as any).cancelAnimationFrame && (window as any).animationFrameId) {
        (window as any).cancelAnimationFrame((window as any).animationFrameId);
        (window as any).animationFrameId = null;
    }
    
    // 2. Làm sạch bộ nhớ đệm tạm thời để tránh dính đè dữ liệu kho đề giữa các môn
    try {
        localStorage.removeItem('current_active_runtime_game');
        localStorage.removeItem('activeGameType');
        sessionStorage.removeItem('current_active_runtime_game');
    } catch (e) {
        console.warn('Không thể xóa runtime storage:', e);
    }
    
    // 3. ĐỒNG BỘ NẠP ĐÚNG FILE ASSET: Ép buộc hệ thống phải đọc chính xác template HTML tương ứng với gameType
    // Tuyệt đối không được gán cứng đường dẫn trỏ về file F1 Racing
    const templatePaths: Record<string, string> = {
        'f1': 'game-dua-xe-f1.html',
        'chien-hao': 'game-bao-ve-chien-hao.html',
        'sut-pen': 'game-sut-penalty.html',
        'ca-ngua': 'game-co-ca-ngua.html',
        'tetris': 'game-xep-gach.html',
        'hai-tao': 'game-hai-tao.html'
    };
    
    const targetTemplate = templatePaths[gameType] || 'index.html';
    return targetTemplate;
}

export interface GameOption {
  id: string;
  gameType: 'f1' | 'chien-hao' | 'sut-pen' | 'ca-ngua' | 'tetris' | 'hai-tao';
  title: string;
  subtitle: string;
  templateFile: string;
  badge: string;
  color: string;
  icon: string;
}

export const GAME_DASHBOARD_PRESETS: GameOption[] = [
  {
    id: 'game_chien_hao',
    gameType: 'chien-hao',
    title: 'Bảo Vệ Chiến Hào',
    subtitle: 'Phòng thủ chiến hào căn cứ, giải toán lượng giác & câu hỏi tổng hợp',
    templateFile: 'game-bao-ve-chien-hao.html',
    badge: 'Chiến Thuật Quân Sự',
    color: 'from-amber-600 to-emerald-700',
    icon: '🛡️'
  },
  {
    id: 'game_sut_pen',
    gameType: 'sut-pen',
    title: 'Sút Penalty Kịch Tính',
    subtitle: '3 vòng Vòng Bảng, Bán Kết, Chung Kết với thủ môn AI phản xạ',
    templateFile: 'game-sut-penalty.html',
    badge: 'Thể Thao & Phản Xạ',
    color: 'from-blue-600 to-cyan-600',
    icon: '⚽'
  },
  {
    id: 'game_f1',
    gameType: 'f1',
    title: 'Đua Xe F1 Tốc Độ',
    subtitle: 'Giải toán tốc độ cao, hỗ trợ 4 lựa chọn và Đúng/Sai',
    templateFile: 'game-dua-xe-f1.html',
    badge: 'Tốc Độ F1',
    color: 'from-red-600 to-orange-600',
    icon: '🏎️'
  },
  {
    id: 'game_ca_ngua',
    gameType: 'ca-ngua',
    title: 'Cờ Cá Ngựa Toán Học',
    subtitle: 'Đổ xúc xắc, trả lời câu hỏi và đưa các chú ngựa về đích an toàn',
    templateFile: 'game-co-ca-ngua.html',
    badge: 'Board Game Dân Gian',
    color: 'from-emerald-600 to-teal-700',
    icon: '🎲'
  },
  {
    id: 'game_tetris',
    gameType: 'tetris',
    title: 'Tetris Xếp Gạch Không Gian',
    subtitle: 'Xếp các khối hình Tetris kết hợp thử thách hình học không gian',
    templateFile: 'game-xep-gach.html',
    badge: 'Xếp Hình Kinh Điển',
    color: 'from-purple-600 to-indigo-700',
    icon: '🧱'
  },
  {
    id: 'game_hai_tao',
    gameType: 'hai-tao',
    title: 'Hái Táo Luân Phiên',
    subtitle: 'Thu hoạch táo mang đáp án chính xác vào giỏ, thi đua 2 đội',
    templateFile: 'game-hai-tao.html',
    badge: 'Thu Hoạch Lớp Học',
    color: 'from-rose-600 to-pink-600',
    icon: '🍎'
  }
];

export const GameDashboard: React.FC = () => {
  const [activeGame, setActiveGame] = useState<GameOption>(GAME_DASHBOARD_PRESETS[0]);
  const [iframeKey, setIframeKey] = useState<number>(Date.now());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const iframeContainerRef = useRef<HTMLDivElement>(null);

  // Khởi tạo container và làm sạch bộ nhớ khi chuyển game
  const handleSelectGame = (game: GameOption) => {
    soundFx.playClick();
    
    // GỌI HÀM CHUYỂN ĐỔI CHUẨN CỦA HẠ TẦNG HỆ THỐNG
    const templateFileName = switchActiveGameTemplate(game.id, game.gameType);
    
    setActiveGame(game);
    // Ép iframe unmount và mount lại từ đầu bằng unique timestamp key
    setIframeKey(Date.now());
    
    // Đường dẫn tương đối an toàn hỗ trợ cả dev và production
    const baseUrl = import.meta.env.BASE_URL || '/';
    const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    setCurrentUrl(`${cleanBase}${templateFileName}?role=admin&preview=true&admin=1&t=${Date.now()}`);
  };

  useEffect(() => {
    // Khởi tạo game đầu tiên an toàn
    handleSelectGame(GAME_DASHBOARD_PRESETS[0]);
  }, []);

  const handleReload = () => {
    soundFx.playClick();
    const templateFileName = switchActiveGameTemplate(activeGame.id, activeGame.gameType);
    setIframeKey(Date.now());
    const baseUrl = import.meta.env.BASE_URL || '/';
    const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    setCurrentUrl(`${cleanBase}${templateFileName}?role=admin&preview=true&admin=1&t=${Date.now()}`);
  };

  const toggleFullscreen = () => {
    soundFx.playClick();
    const elem = iframeContainerRef.current as any;
    if (!elem) return;

    const doc = document as any;
    const isFs = !!(doc.fullscreenElement || doc.webkitFullscreenElement);

    if (!isFs) {
      const rfs = elem.requestFullscreen || elem.webkitRequestFullscreen;
      if (rfs) rfs.call(elem).catch(() => {});
      setIsFullscreen(true);
    } else {
      const efs = doc.exitFullscreen || doc.webkitExitFullscreen;
      if (efs) efs.call(doc).catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Tiêu đề & Giới thiệu Dashboard Studio */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-white flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-500 to-indigo-500 flex items-center justify-center text-3xl shadow-lg shadow-indigo-500/30 shrink-0">
            🎮
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30 mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>ROUTER REBOOT FIX: ISOLATED GAME TEMPLATES</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">Dashboard Studio: Trình Quản Lý & Định Tuyến Game</h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Mỗi trò chơi được cô lập file HTML/JS hoàn toàn độc lập. Tự động dọn sạch vòng lặp Canvas/F1 trước khi nạp game mới.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReload}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 active:scale-95 cursor-pointer"
            title="Giải phóng bộ nhớ và nạp lại game"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Khởi động lại (Reboot)</span>
          </button>
        </div>
      </div>

      {/* Danh sách các tab chọn nhanh Game */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {GAME_DASHBOARD_PRESETS.map((game) => {
          const isActive = activeGame.id === game.id;
          return (
            <button
              key={game.id}
              onClick={() => handleSelectGame(game)}
              className={`p-3.5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between cursor-pointer relative overflow-hidden ${
                isActive
                  ? 'bg-slate-900 border-indigo-500 shadow-lg shadow-indigo-500/20 ring-2 ring-indigo-500/40 text-white'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 hover:border-slate-300 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{game.icon}</span>
                {isActive && (
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                )}
              </div>
              <div>
                <span className={`text-[10px] font-black uppercase tracking-wider block mb-0.5 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`}>
                  {game.badge}
                </span>
                <h4 className="font-extrabold text-xs sm:text-sm truncate">
                  {game.title}
                </h4>
              </div>
            </button>
          );
        })}
      </div>

      {/* Vùng hiển thị Container Game Cô Lập (Isolated Iframe View) */}
      <div 
        ref={iframeContainerRef}
        className="bg-slate-950 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl flex flex-col h-[750px] relative transition-all"
      >
        {/* Topbar của Container Game */}
        <div className="h-[42px] max-h-[42px] min-h-[42px] bg-slate-900/95 border-b border-slate-800 px-4 flex items-center justify-between text-white select-none z-20 shrink-0 backdrop-blur-md">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <span className="text-lg">{activeGame.icon}</span>
            <div className="flex items-center gap-2 truncate">
              <span className="font-black text-sm text-white truncate max-w-xs sm:max-w-md">
                {activeGame.title}
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-mono font-bold">
                {activeGame.templateFile}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReload}
              className="h-7 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition flex items-center gap-1 border border-slate-700 active:scale-95 cursor-pointer"
              title="Khởi động lại Container"
            >
              <RefreshCw className="w-3 h-3" />
              <span className="hidden sm:inline">Reset</span>
            </button>

            <a
              href={currentUrl}
              target="_blank"
              rel="noreferrer"
              className="h-7 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition flex items-center gap-1 border border-slate-700 active:scale-95"
              title="Mở toàn màn hình trong tab mới"
            >
              <ExternalLink className="w-3 h-3" />
              <span className="hidden sm:inline">Tab mới</span>
            </a>

            <button
              onClick={toggleFullscreen}
              className="h-7 px-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs active:scale-95 cursor-pointer"
              title="Toàn màn hình"
            >
              {isFullscreen ? <Minimize className="w-3 h-3" /> : <Maximize className="w-3 h-3" />}
              <span className="hidden sm:inline">{isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}</span>
            </button>
          </div>
        </div>

        {/* Khung Iframe độc lập hoàn toàn với key động để tránh dính cache hay canvas cũ */}
        <div className="flex-1 w-full h-full relative bg-slate-950">
          {currentUrl ? (
            <iframe
              key={`game_iframe_${activeGame.id}_${iframeKey}`}
              src={currentUrl}
              className="absolute inset-0 w-full h-full border-0 bg-slate-950"
              allowFullScreen
              allow="fullscreen; screen-wake-lock; orientation; autoplay;"
              title={activeGame.title}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-slate-500">
              <span className="animate-spin text-2xl mr-2">⟳</span>
              <span>Đang thiết lập môi trường game cô lập...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
