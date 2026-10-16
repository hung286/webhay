import React, { useState, useEffect } from 'react';
import { TeachingTool, StudentProfile } from '../types';
import { getTeachingTools } from '../utils/storage';
import { getToolEmbedUrl } from '../utils/tools';
import { soundFx } from '../utils/sound';
import {
  Gamepad2,
  ExternalLink,
  Search,
  Maximize,
  Minimize,
  Sparkles,
  Trophy,
  Play,
  Flame,
  Layers,
  GraduationCap,
  Swords,
  Dice5
} from 'lucide-react';

import { switchActiveGameTemplate } from './admin/GameDashboard';

function detectGameType(tool: TeachingTool): string {
  const text = `${tool.id} ${tool.name} ${tool.url}`.toLowerCase();
  if (text.includes('chien-hao') || text.includes('chien_hao') || text.includes('chiến hào')) return 'chien-hao';
  if (text.includes('sut-pen') || text.includes('sut_pen') || text.includes('penalty') || text.includes('sút pen')) return 'sut-pen';
  if (text.includes('ca-ngua') || text.includes('ca_ngua') || text.includes('cá ngựa')) return 'ca-ngua';
  if (text.includes('tetris') || text.includes('xep-gach') || text.includes('xếp gạch')) return 'tetris';
  if (text.includes('hai-tao') || text.includes('hai_tao') || text.includes('hái táo')) return 'hai-tao';
  if (text.includes('f1') || text.includes('dua-xe') || text.includes('đua xe')) return 'f1';
  return 'other';
}

interface LearningGamesModeProps {
  student?: StudentProfile;
}

export const LearningGamesMode: React.FC<LearningGamesModeProps> = ({ student }) => {
  const [games, setGames] = useState<TeachingTool[]>([]);
  const [activeGame, setActiveGame] = useState<TeachingTool | null>(null);
  const [activeNonce, setActiveNonce] = useState<number>(Date.now());
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState<'all' | '10' | '11' | '12'>('all');
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    // Lấy các công cụ thuộc danh mục trò chơi ('tro-choi')
    const allTools = getTeachingTools().filter(t => t.isActive);
    const gameTools = allTools.filter(t => t.category === 'tro-choi');
    
    // Nếu chưa có game nào được phân loại, lấy ít nhất game cờ cá ngựa nếu có
    if (gameTools.length === 0) {
      const fallback = allTools.filter(t => t.id.includes('ca_ngua') || t.url.includes('ca-ngua'));
      setGames(fallback);
    } else {
      setGames(gameTools);
    }
  }, []);

  const toggleFullscreen = () => {
    const docEl = document.documentElement as any;
    const doc = document as any;
    const isNative = !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement);
    
    if (!isNative) {
      const rfs = docEl.requestFullscreen || docEl.webkitRequestFullscreen || docEl.mozRequestFullScreen || docEl.msRequestFullscreen;
      if (rfs) {
        try { rfs.call(docEl).catch(() => {}); } catch(e) {}
      }
      setIsFullscreen(true);
    } else {
      const efs = doc.exitFullscreen || doc.webkitExitFullscreen || doc.mozCancelFullScreen || doc.msExitFullscreen;
      if (efs) {
        try { efs.call(doc).catch(() => {}); } catch(e) {}
      }
      setIsFullscreen(false);
    }
  };

  const handleExitGame = () => {
    soundFx.playClick();
    switchActiveGameTemplate('none', 'none');
    setActiveGame(null);
  };

  useEffect(() => {
    const handleMsg = (e: MessageEvent) => {
      if (e.data && e.data.type === 'TOGGLE_FULLSCREEN') {
        toggleFullscreen();
      } else if (e.data && e.data.type === 'EXIT_GAME') {
        handleExitGame();
      }
    };
    window.addEventListener('message', handleMsg);
    return () => window.removeEventListener('message', handleMsg);
  }, []);

  const handlePlayGame = (game: TeachingTool) => {
    soundFx.playClick();
    // TIÊM BỘ DỌN DẸP MÔI TRƯỜNG VÀ GIẢI PHÓNG CANVAS / F1 CŨ TRƯỚC KHI NẠP GAME MỚI
    const gType = detectGameType(game);
    switchActiveGameTemplate(game.id, gType);
    setActiveNonce(Date.now());

    if (game.type === 'url') {
      window.open(game.url, '_blank');
    } else {
      setActiveGame(game);
    }
  };

  const filteredGames = games.filter(game => {
    const matchSearch = game.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (game.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    if (gradeFilter === 'all') return matchSearch;
    const gradeKeyword = `toán ${gradeFilter}`.toLowerCase();
    const shortGrade = `lớp ${gradeFilter}`.toLowerCase();
    const numGrade = `${gradeFilter}`.toLowerCase();
    const text = `${game.name} ${game.description}`.toLowerCase();
    return matchSearch && (text.includes(gradeKeyword) || text.includes(shortGrade) || text.includes(numGrade));
  });

  // IFRAME FULLSCREEN VIEW KHI ĐANG CHƠI GAME
  if (activeGame) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col h-screen w-screen animate-in fade-in duration-200">
        <div className="flex justify-between items-center px-3 h-[35px] max-h-[35px] bg-slate-900 border-b border-slate-800 shadow-xl relative z-20 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleExitGame}
              className="h-6 px-2.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-lg transition font-bold border border-rose-500/30 flex items-center gap-1.5 text-[0.75rem] sm:text-[0.8rem]"
            >
              ✕ <span className="hidden sm:inline">Rời khỏi trò chơi</span>
            </button>
            <div className="flex items-center gap-1.5">
              <span className="p-1 rounded-md bg-violet-500/20 text-violet-400">
                <Gamepad2 className="w-3.5 h-3.5" />
              </span>
              <h3 className="text-[0.75rem] sm:text-[0.8rem] font-black text-white truncate max-w-xs sm:max-w-md">
                {activeGame.name}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleFullscreen}
              className="h-6 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition font-semibold text-[0.75rem] sm:text-[0.8rem] flex items-center gap-1.5"
            >
              {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}</span>
            </button>
          </div>
        </div>

        <div className="flex-grow w-full relative bg-slate-950">
          {(() => {
            const src = getToolEmbedUrl(activeGame);
            return (
              <iframe
                key={`isolated_game_${activeGame.id}_${activeNonce}`}
                src={src}
                width="100%"
                height="100%"
                style={{ border: 'none', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                allowFullScreen
                allow="fullscreen; screen-wake-lock; orientation;"
                title={activeGame.name}
              />
            );
          })()}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Banner góc Trò chơi */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 p-6 sm:p-10 text-white shadow-xl shadow-purple-200 mb-8">
        <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-32 h-32 bg-yellow-300/10 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-black uppercase tracking-wider mb-4 border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            Đấu trí tương tác & Vừa học vừa chơi
          </div>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight mb-3">
            Khu Trò Chơi Học Tập
          </h2>
          <p className="text-white/80 text-sm sm:text-base leading-relaxed">
            Khám phá các trò chơi toán học tương tác, cờ cá ngựa, giải đố thử thách tư duy giúp ghi nhớ kiến thức và công thức tự nhiên, không nhàm chán!
          </p>
        </div>
      </div>

      {/* Toolbar: Bộ lọc & Tìm kiếm */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Lọc Khối Lớp */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            onClick={() => { soundFx.playClick(); setGradeFilter('all'); }}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
              gradeFilter === 'all'
                ? 'bg-violet-600 text-white shadow-sm shadow-violet-200'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tất cả trò chơi
          </button>
          <button
            onClick={() => { soundFx.playClick(); setGradeFilter('10'); }}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
              gradeFilter === '10'
                ? 'bg-violet-600 text-white shadow-sm shadow-violet-200'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Toán 10
          </button>
          <button
            onClick={() => { soundFx.playClick(); setGradeFilter('11'); }}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
              gradeFilter === '11'
                ? 'bg-violet-600 text-white shadow-sm shadow-violet-200'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Toán 11
          </button>
          <button
            onClick={() => { soundFx.playClick(); setGradeFilter('12'); }}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
              gradeFilter === '12'
                ? 'bg-violet-600 text-white shadow-sm shadow-violet-200'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Toán 12
          </button>
        </div>

        {/* Ô Tìm Kiếm */}
        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="Tìm trò chơi..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none text-xs sm:text-sm font-medium"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Lưới danh sách trò chơi */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGames.map(game => (
          <div
            key={game.id}
            className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs hover:shadow-xl hover:border-violet-300 transition-all duration-300 flex flex-col justify-between group"
          >
            <div>
              {/* Thẻ Header */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-500 to-fuchsia-500 text-white flex items-center justify-center shadow-md shadow-violet-200 group-hover:scale-105 transition-transform duration-300">
                  <Dice5 className="w-8 h-8" />
                </div>
                <span className="px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 text-[11px] font-black border border-violet-100">
                  Đang hoạt động
                </span>
              </div>

              {/* Tên game & mô tả */}
              <h3 className="text-lg font-black text-slate-800 mb-2 group-hover:text-violet-700 transition-colors">
                {game.name}
              </h3>
              <p className="text-slate-500 text-xs sm:text-sm line-clamp-3 leading-relaxed mb-4">
                {game.description || 'Trò chơi rèn luyện toán học tương tác trực quan.'}
              </p>
            </div>

            {/* Nút Chơi Ngay */}
            <button
              onClick={() => handlePlayGame(game)}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold text-sm shadow-md shadow-violet-200 flex items-center justify-center gap-2 group-hover:translate-y-[-2px] transition-all duration-200"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Bắt đầu chơi</span>
            </button>
          </div>
        ))}

        {filteredGames.length === 0 && (
          <div className="col-span-full bg-white rounded-3xl border border-slate-200 p-12 text-center">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
              <Gamepad2 className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-slate-700 mb-1">
              Chưa tìm thấy trò chơi nào
            </h4>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
              Không có trò chơi nào khớp với bộ lọc hiện tại. Giáo viên có thể thêm trò chơi mới vào danh mục "Trò chơi Dạy học" trong Admin Studio.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
