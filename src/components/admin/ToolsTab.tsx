import React, { useState, useEffect } from 'react';
import { TeachingTool, ToolType, ToolCategory } from '../../types';
import { getTeachingTools, saveTeachingTools } from '../../utils/storage';
import { getToolEmbedUrl } from '../../utils/tools';
import { Plus, Trash2, Edit2, ExternalLink, Gamepad2, Wrench, CheckCircle, Eye, Search, Sparkles } from 'lucide-react';
import { soundFx } from '../../utils/sound';

export interface PairItem {
  id: number;
  left: string;
  right: string;
}

const DEFAULT_CTLG_PAIRS: PairItem[] = [
  { id: 1, left: "\\sin^2 x + \\cos^2 x", right: "1" },
  { id: 2, left: "\\sin(2x)", right: "2\\sin x \\cos x" },
  { id: 3, left: "\\cos(2x)", right: "\\cos^2 x - \\sin^2 x" },
  { id: 4, left: "1 + \\tan^2 x", right: "\\frac{1}{\\cos^2 x}" },
  { id: 5, left: "1 + \\cot^2 x", right: "\\frac{1}{\\sin^2 x}" },
  { id: 6, left: "\\tan x", right: "\\frac{\\sin x}{\\cos x}" },
  { id: 7, left: "\\cot x", right: "\\frac{\\cos x}{\\sin x}" },
  { id: 8, left: "\\tan x \\cdot \\cot x", right: "1" }
];

const DEFAULT_PTLG_PAIRS: PairItem[] = [
  { id: 1, left: "\\sin x = 3", right: "\\text{Vô nghiệm do } 3 > 1" },
  { id: 2, left: "\\sin x = -2", right: "\\text{Vô nghiệm do } -2 < -1" },
  { id: 3, left: "\\sin x = \\frac{1}{3}", right: "\\text{Có nghiệm do } \\left|\\frac{1}{3}\\right| \\le 1" },
  { id: 4, left: "\\sin x = -\\frac{\\sqrt{2}}{2}", right: "\\text{Có nghiệm do } \\left|-\\frac{\\sqrt{2}}{2}\\right| \\le 1" },
  { id: 5, left: "\\sin x = \\pi", right: "\\text{Vô nghiệm do } \\pi > 1" },
  { id: 6, left: "\\sin x = 1", right: "x = \\frac{\\pi}{2} + k2\\pi" },
  { id: 7, left: "\\sin x = -1", right: "x = -\\frac{\\pi}{2} + k2\\pi" },
  { id: 8, left: "\\sin x = 0", right: "x = k\\pi" }
];

const DEFAULT_DAOHAM_PAIRS: PairItem[] = [
  { id: 1, left: "\\left( C \\right)'", right: "0" },
  { id: 2, left: "\\left( x^n \\right)'", right: "n \\cdot x^{n-1}" },
  { id: 3, left: "\\left( \\sqrt{x} \\right)'", right: "\\frac{1}{2\\sqrt{x}}" },
  { id: 4, left: "\\left( \\sin x \\right)'", right: "\\cos x" },
  { id: 5, left: "\\left( \\cos x \\right)'", right: "-\\sin x" },
  { id: 6, left: "\\left( e^x \\right)'", right: "e^x" },
  { id: 7, left: "\\left( \\ln x \\right)'", right: "\\frac{1}{x}" },
  { id: 8, left: "\\left( \\tan x \\right)'", right: "\\frac{1}{\\cos^2 x}" }
];

export const ToolsTab: React.FC = () => {
  const [tools, setTools] = useState<TeachingTool[]>([]);
  const [previewTool, setPreviewTool] = useState<TeachingTool | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTool, setCurrentTool] = useState<Partial<TeachingTool>>({});
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Quản lý sửa cặp bài trực tiếp ngay tại Admin Studio
  const [editingPairsData, setEditingPairsData] = useState<{
    toolName: string;
    storageKey: string;
    pairs: PairItem[];
  } | null>(null);

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

  // Xác định game ghép cặp có hỗ trợ sửa dữ liệu
  const getGameStorageKey = (tool: TeachingTool): string | null => {
    if (tool.id === 'tool_ghep_cap_luong_giac' || tool.url.includes('ghep-cap-luong-giac')) {
      return 'custom_pairs_ctlg';
    }
    if (tool.id === 'tool_ghep_cap_pt_luong_giac' || tool.url.includes('ghep-cap-phuong-trinh-luong-giac')) {
      return 'custom_pairs_ptlg';
    }
    if (tool.id === 'tool_ghep_cap_trai_tim_dao_ham11' || tool.url.includes('ghep-cap-trai-tim-dao-ham11')) {
      return 'custom_pairs_dao_ham_11';
    }
    return null;
  };

  const handleOpenPairEditor = (tool: TeachingTool) => {
    const key = getGameStorageKey(tool);
    if (!key) return;
    soundFx.playClick();

    let initialPairs: PairItem[] = DEFAULT_CTLG_PAIRS;
    if (key === 'custom_pairs_ptlg') initialPairs = DEFAULT_PTLG_PAIRS;
    else if (key === 'custom_pairs_dao_ham_11') initialPairs = DEFAULT_DAOHAM_PAIRS;
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 2) {
          initialPairs = parsed;
        }
      }
    } catch (e) {}

    setEditingPairsData({
      toolName: tool.name,
      storageKey: key,
      pairs: JSON.parse(JSON.stringify(initialPairs))
    });
  };

  const handleAddPairRow = () => {
    if (!editingPairsData) return;
    soundFx.playClick();
    setEditingPairsData({
      ...editingPairsData,
      pairs: [
        ...editingPairsData.pairs,
        { id: Date.now(), left: '', right: '' }
      ]
    });
  };

  const handleRemovePairRow = (index: number) => {
    if (!editingPairsData) return;
    if (editingPairsData.pairs.length <= 2) {
      alert('Cần giữ lại ít nhất 2 cặp bài!');
      return;
    }
    soundFx.playClick();
    const nextPairs = editingPairsData.pairs.filter((_, i) => i !== index);
    setEditingPairsData({
      ...editingPairsData,
      pairs: nextPairs
    });
  };

  const handleUpdatePairField = (index: number, field: 'left' | 'right', value: string) => {
    if (!editingPairsData) return;
    const nextPairs = [...editingPairsData.pairs];
    nextPairs[index] = { ...nextPairs[index], [field]: value };
    setEditingPairsData({
      ...editingPairsData,
      pairs: nextPairs
    });
  };

  const handleResetPairsDefault = () => {
    if (!editingPairsData) return;
    let defaults = DEFAULT_CTLG_PAIRS;
    if (editingPairsData.storageKey === 'custom_pairs_ptlg') defaults = DEFAULT_PTLG_PAIRS;
    else if (editingPairsData.storageKey === 'custom_pairs_dao_ham_11') defaults = DEFAULT_DAOHAM_PAIRS;
    localStorage.removeItem(editingPairsData.storageKey);
    setEditingPairsData({
      ...editingPairsData,
      pairs: JSON.parse(JSON.stringify(defaults))
    });
    alert('Đã khôi phục dữ liệu gốc!');
  };

  const handleSavePairs = () => {
    if (!editingPairsData) return;
    const valid = editingPairsData.pairs.filter(p => p.left.trim() && p.right.trim());
    if (valid.length < 2) {
      alert('Vui lòng nhập ít nhất 2 cặp bài hoàn chỉnh!');
      return;
    }
    soundFx.playCorrect();
    localStorage.setItem(editingPairsData.storageKey, JSON.stringify(valid));
    alert(`Đã lưu thành công ${valid.length} cặp bài cho "${editingPairsData.toolName}"! Trò chơi sẽ áp dụng ngay.`);
    setEditingPairsData(null);
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
            
            <div className="flex justify-between items-center pt-3 border-t border-slate-100 flex-wrap gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => {
                    setPreviewTool(tool);
                    soundFx.playClick();
                  }}
                  className="text-xs font-bold text-violet-600 hover:text-violet-800 flex items-center gap-1.5 transition"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Xem thử & Cài đặt</span>
                </button>

                {getGameStorageKey(tool) && (
                  <button
                    onClick={() => handleOpenPairEditor(tool)}
                    className="text-xs font-black text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-xl flex items-center gap-1.5 transition shadow-2xs"
                    title="Chỉnh sửa trực tiếp danh sách cặp bài công thức"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Sửa cặp bài</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setCurrentTool(tool);
                    setIsEditing(true);
                    soundFx.playClick();
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                  title="Chỉnh sửa cấu hình"
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

      {/* Modal Xem trước Preview ở Chế độ Quản trị */}
      {previewTool && (
        <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-xs flex flex-col p-4 md:p-6 animate-in fade-in duration-200">
          <div className="flex justify-between items-center mb-3 max-w-6xl mx-auto w-full">
            <div className="flex items-center gap-2">
              <h3 className="text-white text-lg font-black truncate max-w-md">{previewTool.name}</h3>
              {getCategoryBadge(previewTool.category)}
              <span className="hidden sm:inline text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                👑 Quyền Quản trị Admin
              </span>
            </div>
            <button 
              onClick={() => { setPreviewTool(null); soundFx.playClick(); }} 
              className="px-4 py-2 bg-rose-600 text-white rounded-xl font-bold text-sm hover:bg-rose-700 transition"
            >
              ✕ Đóng xem thử
            </button>
          </div>
          <div className="flex-1 bg-slate-950 rounded-2xl overflow-hidden max-w-6xl mx-auto w-full relative shadow-2xl border border-slate-800">
            {(() => {
              let url = getToolEmbedUrl(previewTool);
              if (url && (url.includes('.html') || url.startsWith('/') || url.startsWith('http'))) {
                const sep = url.includes('?') ? '&' : '?';
                url = `${url}${sep}admin=1`;
              }
              return (
                <iframe 
                  src={url} 
                  className="absolute inset-0 w-full h-full border-0" 
                  allowFullScreen
                  title={previewTool.name}
                />
              );
            })()}
          </div>
        </div>
      )}

      {/* Modal Quản lý / Sửa Cặp Bài Trực Tiếp Trên Admin Studio */}
      {editingPairsData && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-5 sm:p-7 max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border-4 border-amber-300">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 mb-3">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                  <span>⚙️ Quản Lý Cặp Bài:</span>
                  <span className="text-amber-600">{editingPairsData.toolName}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Chỉnh sửa trực tiếp công thức. Hỗ trợ cú pháp LaTeX (ví dụ: <code className="text-amber-700 font-mono">\sin(2x)</code>, <code className="text-amber-700 font-mono">\cos(x)</code>).
                </p>
              </div>
              <button
                onClick={() => { setEditingPairsData(null); soundFx.playClick(); }}
                className="text-slate-400 hover:text-slate-700 text-2xl font-black px-2 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Danh sách cặp bài */}
            <div className="overflow-y-auto flex-grow mb-4 pr-1 space-y-2.5 custom-scrollbar max-h-[60vh]">
              {editingPairsData.pairs.map((pair, idx) => (
                <div key={pair.id || idx} className="flex gap-2 items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200 hover:border-amber-300 transition">
                  <div className="font-black text-amber-700 w-6 text-center text-xs shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block mb-0.5">Thẻ 1 (Vế trái / Đề bài)</span>
                      <input
                        type="text"
                        value={pair.left}
                        onChange={e => handleUpdatePairField(idx, 'left', e.target.value)}
                        placeholder="Ví dụ: \sin^2 x + \cos^2 x"
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-mono font-bold outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block mb-0.5">Thẻ 2 (Vế phải / Đáp án)</span>
                      <input
                        type="text"
                        value={pair.right}
                        onChange={e => handleUpdatePairField(idx, 'right', e.target.value)}
                        placeholder="Ví dụ: 1"
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-mono font-bold outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemovePairRow(idx)}
                    className="w-8 h-8 shrink-0 bg-rose-100 hover:bg-rose-200 text-rose-600 rounded-lg font-black text-sm flex items-center justify-center cursor-pointer transition"
                    title="Xóa cặp bài này"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {/* Thanh điều khiển dưới cùng */}
            <div className="flex flex-wrap justify-between items-center pt-3 border-t border-slate-200 gap-2">
              <button
                type="button"
                onClick={handleAddPairRow}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs sm:text-sm transition shadow-2xs cursor-pointer flex items-center gap-1.5"
              >
                <span>+ Thêm cặp mới</span>
              </button>

              <div className="flex gap-2 flex-wrap items-center">
                <button
                  type="button"
                  onClick={handleResetPairsDefault}
                  className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer"
                >
                  Khôi phục gốc SGK
                </button>
                <button
                  type="button"
                  onClick={() => { setEditingPairsData(null); soundFx.playClick(); }}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleSavePairs}
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:brightness-110 text-white rounded-xl font-black text-xs sm:text-sm shadow-md transition cursor-pointer flex items-center gap-1.5"
                >
                  <span>💾 Lưu & Cập Nhật Game</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
