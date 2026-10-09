import React, { useState, useEffect } from 'react';
import { TeachingTool, ToolType, ToolCategory } from '../../types';
import { getTeachingTools, saveTeachingTools } from '../../utils/storage';
import { getToolEmbedUrl } from '../../utils/tools';
import { Plus, Trash2, Edit2, ExternalLink, Gamepad2, Wrench, CheckCircle, Eye, Search, Sparkles } from 'lucide-react';
import { soundFx } from '../../utils/sound';

export const ToolsTab: React.FC = () => {
  const [tools, setTools] = useState<TeachingTool[]>([]);
  const [previewTool, setPreviewTool] = useState<TeachingTool | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTool, setCurrentTool] = useState<Partial<TeachingTool>>({});
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setTools(getTeachingTools());
  }, []);

  const handleOpenAddGame = () => {
    setCurrentTool({
      type: 'iframe',
      category: 'tro-choi',
      isActive: true,
      name: '',
      url: '',
      description: ''
    });
    setIsEditing(true);
    soundFx.playClick();
  };

  const handleOpenAddTool = () => {
    setCurrentTool({
      type: 'iframe',
      category: 'thao-tac',
      isActive: true,
      name: '',
      url: '',
      description: ''
    });
    setIsEditing(true);
    soundFx.playClick();
  };

  const handleSave = () => {
    if (!currentTool.name?.trim() || !currentTool.url?.trim()) {
      alert('Vui lòng nhập tên và đường dẫn công cụ/trò chơi!');
      return;
    }
    
    let updatedTools: TeachingTool[];
    if (currentTool.id) {
      updatedTools = tools.map(t => t.id === currentTool.id ? { ...t, ...currentTool } as TeachingTool : t);
    } else {
      const newTool: TeachingTool = {
        id: 'tool_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        name: currentTool.name.trim(),
        type: currentTool.type || 'iframe',
        category: currentTool.category || 'tro-choi',
        url: currentTool.url.trim(),
        description: currentTool.description?.trim() || '',
        isActive: currentTool.isActive ?? true,
        createdAt: new Date().toISOString()
      };
      updatedTools = [newTool, ...tools];
    }
    
    setTools(updatedTools);
    saveTeachingTools(updatedTools);
    setIsEditing(false);
    setCurrentTool({});
    soundFx.playCorrect();
  };

  const handleDelete = (tool: TeachingTool) => {
    if (confirm(`Bạn có chắc muốn xóa "${tool.name}"?\nHành động này sẽ gỡ bỏ khỏi giao diện người dùng.`)) {
      const updatedTools = tools.filter(t => t.id !== tool.id);
      setTools(updatedTools);
      saveTeachingTools(updatedTools);
      soundFx.playClick();
    }
  };

  const filteredTools = tools.filter(t => {
    const matchCat = filterCategory === 'all' || (t.category || 'khac') === filterCategory;
    const matchSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const getCategoryBadge = (cat?: ToolCategory) => {
    switch (cat) {
      case 'tro-choi':
        return <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-700 flex items-center gap-1">🎮 Trò chơi</span>;
      case 'thao-tac':
        return <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700">📐 Thao tác</span>;
      case 'mo-phong':
        return <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">🧊 Mô phỏng 3D</span>;
      case 'chon-hs':
        return <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700">🎯 Chọn HS</span>;
      default:
        return <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">Khác</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200">
        <div>
          <h3 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
            <span>Quản lý Công cụ & Trò chơi Học tập</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Thêm, chỉnh sửa hoặc xóa các trò chơi và công cụ hiển thị cho học sinh và giáo viên
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleOpenAddGame}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-md shadow-violet-200 transition"
          >
            <Gamepad2 className="w-4 h-4" />
            + Thêm Trò chơi mới
          </button>
          
          <button
            onClick={handleOpenAddTool}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition"
          >
            <Plus className="w-4 h-4" />
            + Thêm Công cụ khác
          </button>
        </div>
      </div>

      {/* Form Thêm / Chỉnh sửa */}
      {isEditing && (
        <div className="bg-slate-50 p-6 rounded-2xl border-2 border-violet-200 shadow-sm space-y-5 animate-in fade-in duration-200">
          <div className="flex justify-between items-center border-b border-slate-200 pb-3">
            <h4 className="font-black text-slate-800 text-base flex items-center gap-2">
              {currentTool.category === 'tro-choi' ? <Gamepad2 className="w-5 h-5 text-violet-600" /> : <Wrench className="w-5 h-5 text-blue-600" />}
              {currentTool.id ? 'Chỉnh sửa: ' + currentTool.name : (currentTool.category === 'tro-choi' ? 'Thêm Trò chơi Học tập mới' : 'Thêm Công cụ mới')}
            </h4>
            <span className="text-xs text-slate-400 font-medium">* Các trường bắt buộc điền</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tên hiển thị <span className="text-red-500">*</span>
              </label>
              <input
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-violet-500 outline-none"
                value={currentTool.name || ''}
                onChange={e => setCurrentTool({...currentTool, name: e.target.value})}
                placeholder="VD: Cờ cá ngựa Đạo hàm, Khảo sát hàm số..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Chuyên mục <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-violet-500 outline-none"
                value={currentTool.category || 'tro-choi'}
                onChange={e => setCurrentTool({...currentTool, category: e.target.value as any})}
              >
                <option value="tro-choi">🎮 Trò chơi Dạy học (Hiển thị ở mục Trò chơi học tập)</option>
                <option value="thao-tac">📐 Trợ lý Thao tác (Hiển thị ở mục Giáo viên)</option>
                <option value="mo-phong">🧊 Mô phỏng 3D (Hiển thị ở mục Giáo viên)</option>
                <option value="chon-hs">🎯 Chọn học sinh (Hiển thị ở mục Giáo viên)</option>
                <option value="khac">Khác</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Hình thức hiển thị / nhúng <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-violet-500 outline-none"
                value={currentTool.type || 'iframe'}
                onChange={e => setCurrentTool({...currentTool, type: e.target.value as ToolType})}
              >
                <option value="iframe">Nhúng trực tiếp (Iframe HTML nội bộ hoặc URL)</option>
                <option value="geogebra">Geogebra Applet</option>
                <option value="url">Mở tab mới (Link ngoài)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Trạng thái hiển thị
              </label>
              <select
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-violet-500 outline-none"
                value={currentTool.isActive ? 'active' : 'inactive'}
                onChange={e => setCurrentTool({...currentTool, isActive: e.target.value === 'active'})}
              >
                <option value="active">🟢 Đang hoạt động (Hiển thị cho học sinh)</option>
                <option value="inactive">⚪ Đang ẩn (Tạm dừng)</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Đường dẫn tệp hoặc URL <span className="text-red-500">*</span>
              </label>
              <input
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-violet-500 outline-none"
                value={currentTool.url || ''}
                onChange={e => setCurrentTool({...currentTool, url: e.target.value})}
                placeholder="VD: /ca-ngua-dao-ham11.html (file trong public/) hoặc link https://..."
              />
              <p className="text-[11px] text-slate-500 mt-1">
                💡 <b>Mẹo:</b> Đối với file HTML đặt trong thư mục <code>public/</code>, bạn chỉ cần gõ <code>/tên-file.html</code>.
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mô tả ngắn gọn về trò chơi / công cụ
              </label>
              <textarea
                rows={2}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                value={currentTool.description || ''}
                onChange={e => setCurrentTool({...currentTool, description: e.target.value})}
                placeholder="VD: Trò chơi cờ cá ngựa toán học giúp học sinh ôn tập đạo hàm lớp 11 qua từng lượt gieo xúc xắc..."
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              onClick={() => { setIsEditing(false); soundFx.playClick(); }}
              className="px-5 py-2.5 border border-slate-300 bg-white hover:bg-slate-100 rounded-xl text-xs sm:text-sm font-bold text-slate-700 transition"
            >
              Hủy bỏ
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs sm:text-sm font-black shadow-md shadow-violet-200 transition"
            >
              Lưu dữ liệu
            </button>
          </div>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => { setFilterCategory('all'); soundFx.playClick(); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              filterCategory === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tất cả ({tools.length})
          </button>
          <button
            onClick={() => { setFilterCategory('tro-choi'); soundFx.playClick(); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition whitespace-nowrap flex items-center gap-1 ${
              filterCategory === 'tro-choi'
                ? 'bg-violet-600 text-white shadow-sm shadow-violet-200'
                : 'bg-violet-50 text-violet-700 hover:bg-violet-100'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            Trò chơi ({tools.filter(t => t.category === 'tro-choi').length})
          </button>
          <button
            onClick={() => { setFilterCategory('thao-tac'); soundFx.playClick(); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              filterCategory === 'thao-tac'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Thao tác ({tools.filter(t => t.category === 'thao-tac').length})
          </button>
          <button
            onClick={() => { setFilterCategory('mo-phong'); soundFx.playClick(); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              filterCategory === 'mo-phong'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Mô phỏng 3D ({tools.filter(t => t.category === 'mo-phong').length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Tìm tên hoặc mô tả..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs font-medium border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* Grid of Tools & Games */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTools.map(tool => (
          <div
            key={tool.id}
            className={`border rounded-2xl p-5 bg-white shadow-2xs hover:shadow-md transition-all flex flex-col justify-between ${
              tool.category === 'tro-choi' ? 'border-violet-200 hover:border-violet-400' : 'border-slate-200'
            }`}
          >
            <div>
              <div className="flex justify-between items-start gap-2 mb-2">
                <h4 className="font-black text-slate-800 text-sm sm:text-base leading-snug">
                  {tool.name}
                </h4>
                <div className="shrink-0 flex items-center gap-1">
                  {getCategoryBadge(tool.category)}
                </div>
              </div>

              <p className="text-xs text-slate-500 mb-3 line-clamp-2 leading-relaxed">
                {tool.description || 'Chưa có mô tả chi tiết.'}
              </p>

              <div className="text-[11px] text-slate-400 font-mono truncate bg-slate-50 px-2 py-1 rounded-lg mb-3">
                {tool.url}
              </div>
            </div>
            
            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  setPreviewTool(tool);
                  soundFx.playClick();
                }}
                className="text-xs font-bold text-violet-600 hover:text-violet-800 flex items-center gap-1.5 transition"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Xem thử</span>
              </button>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setCurrentTool(tool);
                    setIsEditing(true);
                    soundFx.playClick();
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                  title="Chỉnh sửa"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(tool)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                  title="Xóa vĩnh viễn"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredTools.length === 0 && (
          <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-slate-200 text-slate-500 text-sm">
            <Gamepad2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            Không có công cụ hoặc trò chơi nào phù hợp với bộ lọc.
          </div>
        )}
      </div>

      {/* Modal Xem trước Preview */}
      {previewTool && (
        <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-xs flex flex-col p-4 md:p-6 animate-in fade-in duration-200">
          <div className="flex justify-between items-center mb-3 max-w-6xl mx-auto w-full">
            <div className="flex items-center gap-2">
              <h3 className="text-white text-lg font-black truncate max-w-md">{previewTool.name}</h3>
              {getCategoryBadge(previewTool.category)}
            </div>
            <button 
              onClick={() => { setPreviewTool(null); soundFx.playClick(); }} 
              className="px-4 py-2 bg-rose-600 text-white rounded-xl font-bold text-sm hover:bg-rose-700 transition"
            >
              ✕ Đóng xem thử
            </button>
          </div>
          <div className="flex-1 bg-slate-950 rounded-2xl overflow-hidden max-w-6xl mx-auto w-full relative shadow-2xl border border-slate-800">
            <iframe 
              src={getToolEmbedUrl(previewTool)} 
              className="absolute inset-0 w-full h-full border-0" 
              allowFullScreen
              title={previewTool.name}
            />
          </div>
        </div>
      )}
    </div>
  );
};
