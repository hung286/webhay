import React, { useState, useRef } from 'react';
import { MathWorksheet, MathWorksheetQuestion } from '../../types';
import { getWorksheets, saveWorksheets, restoreDefaultWorksheets } from '../../utils/storage';
import { MathText } from '../common/MathText';
import { soundFx } from '../../utils/sound';
import {
  FileText,
  Plus,
  Trash2,
  Edit3,
  Eye,
  EyeOff,
  RotateCcw,
  Sparkles,
  Save,
  Search,
  Filter,
  CheckCircle2,
  BookOpen,
  X,
  HelpCircle,
  FolderOpen,
  Upload,
  Download,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  Layers,
  FileCode,
  AlertCircle
} from 'lucide-react';

interface WorksheetsTabProps {
  onOpenPreview?: (ws?: MathWorksheet) => void;
}

export const WorksheetsTab: React.FC<WorksheetsTabProps> = ({ onOpenPreview }) => {
  const [worksheets, setWorksheets] = useState<MathWorksheet[]>(() => getWorksheets());
  const [selectedGrade, setSelectedGrade] = useState<'Tất cả' | 'Toán 10' | 'Toán 11' | 'Toán 12'>('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');

  // Editing Worksheet Modal State
  const [editingWs, setEditingWs] = useState<MathWorksheet | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Auto Generate Modal State
  const [isAutoGenerateModalOpen, setIsAutoGenerateModalOpen] = useState(false);
  const [genGrade, setGenGrade] = useState<'Toán 10' | 'Toán 11' | 'Toán 12'>('Toán 10');
  const [genTopic, setGenTopic] = useState('Hàm số bậc hai và đồ thị');

  // Import File Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importTargetWsId, setImportTargetWsId] = useState<string>('new');
  const [importText, setImportText] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filtered List
  const filteredList = worksheets.filter(ws => {
    if (selectedGrade !== 'Tất cả' && ws.grade !== selectedGrade) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!ws.title.toLowerCase().includes(q) && !ws.chapter.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  // Toggle publish
  const handleTogglePublish = (id: string) => {
    soundFx.playClick();
    const updated = worksheets.map(ws =>
      ws.id === id ? { ...ws, isPublished: !ws.isPublished, updatedAt: new Date().toISOString() } : ws
    );
    setWorksheets(updated);
    saveWorksheets(updated);
  };

  // Delete worksheet
  const handleDelete = (id: string, title: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa phiếu học tập "${title}" không?`)) return;
    soundFx.playClick();
    const updated = worksheets.filter(ws => ws.id !== id);
    setWorksheets(updated);
    saveWorksheets(updated);
  };

  // Reset default
  const handleResetDefaults = () => {
    if (!confirm('Khôi phục danh sách phiếu học tập về dữ liệu chuẩn SGK ban đầu (đầy đủ 44 bài Toán 10, 11, 12)?')) return;
    soundFx.playClick();
    const defaults = restoreDefaultWorksheets();
    setWorksheets(defaults);
    alert('Đã khôi phục thành công kho phiếu học tập chuẩn SGK với 44 bài học!');
  };

  // Open Create Form
  const handleOpenCreate = () => {
    soundFx.playClick();
    setIsCreatingNew(true);
    setEditingWs({
      id: `ws_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      title: 'Bài mới: ',
      grade: selectedGrade === 'Tất cả' ? 'Toán 10' : selectedGrade,
      chapter: 'Chương mới',
      description: '',
      theorySummary: `### 1. Kiến thức trọng tâm\n- Định nghĩa:\n- Tính chất:\n\n### 2. Các công thức cần nhớ\n- Công thức: $a^2 + b^2 = c^2$`,
      questions: [
        {
          id: `q_${Date.now()}_1`,
          question: 'Câu hỏi củng cố 1...',
          options: ['Phương án A', 'Phương án B', 'Phương án C', 'Phương án D'],
          correctIndex: 0,
          solution: 'Hướng dẫn giải chi tiết cho câu hỏi 1...'
        }
      ],
      isPublished: false, // Mặc định ẩn để giáo viên duyệt
      createdAt: new Date().toISOString()
    });
  };

  // Open Edit Form
  const handleOpenEdit = (ws: MathWorksheet) => {
    soundFx.playClick();
    setIsCreatingNew(false);
    setEditingWs(JSON.parse(JSON.stringify(ws)));
  };

  // Save current editing worksheet
  const handleSaveEditing = () => {
    if (!editingWs) return;
    if (!editingWs.title.trim()) {
      alert('Vui lòng nhập tiêu đề cho phiếu học tập!');
      return;
    }
    soundFx.playCorrect();

    let updated: MathWorksheet[];
    const idx = worksheets.findIndex(w => w.id === editingWs.id);
    if (idx >= 0) {
      updated = [...worksheets];
      updated[idx] = { ...editingWs, updatedAt: new Date().toISOString() };
    } else {
      updated = [
        { ...editingWs, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        ...worksheets
      ];
    }

    setWorksheets(updated);
    saveWorksheets(updated);
    setEditingWs(null);
    alert(`Đã lưu thành công phiếu học tập "${editingWs.title}"!`);
  };

  // Add question to editing worksheet
  const handleAddQuestionRow = () => {
    if (!editingWs) return;
    soundFx.playClick();
    const newQ: MathWorksheetQuestion = {
      id: `q_${Date.now()}_${editingWs.questions.length + 1}`,
      question: `Câu hỏi ${editingWs.questions.length + 1}: `,
      options: ['Phương án A', 'Phương án B', 'Phương án C', 'Phương án D'],
      correctIndex: 0,
      solution: 'Hướng dẫn giải chi tiết...'
    };
    setEditingWs({
      ...editingWs,
      questions: [...editingWs.questions, newQ]
    });
  };

  // Remove question row
  const handleRemoveQuestionRow = (idx: number) => {
    if (!editingWs) return;
    if (editingWs.questions.length <= 1) {
      alert('Phiếu học tập cần có ít nhất 1 câu hỏi!');
      return;
    }
    soundFx.playClick();
    const nextQ = editingWs.questions.filter((_, i) => i !== idx);
    setEditingWs({
      ...editingWs,
      questions: nextQ
    });
  };

  // Move question up/down
  const handleMoveQuestion = (idx: number, direction: 'up' | 'down') => {
    if (!editingWs) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= editingWs.questions.length) return;
    soundFx.playClick();
    const nQ = [...editingWs.questions];
    const temp = nQ[idx];
    nQ[idx] = nQ[targetIdx];
    nQ[targetIdx] = temp;
    setEditingWs({ ...editingWs, questions: nQ });
  };

  // Auto Generate Worksheet (Tự sinh phiếu bài tập)
  const handleAutoGenerate = () => {
    soundFx.playClick();
    setIsAutoGenerateModalOpen(false);

    const newWs: MathWorksheet = {
      id: `ws_auto_${Date.now()}`,
      title: `${genTopic}`,
      grade: genGrade,
      chapter: `Chuyên đề: ${genTopic}`,
      description: `Phiếu học tập tự sinh theo chuyên đề ${genTopic} (${genGrade}) với lý thuyết tóm tắt và bài tập rèn luyện.`,
      theorySummary: `### 1. Kiến thức trọng tâm - ${genTopic}
- Nắm vững định nghĩa và các điều kiện xác định cơ bản của ${genTopic}.
- Áp dụng các tính chất giải nhanh các dạng toán trắc nghiệm tiêu biểu.

### 2. Phương pháp giải toán
- **Bước 1:** Xác định dạng toán và điều kiện bài toán.
- **Bước 2:** Sử dụng các công thức liên quan $f(x)$, đạo hàm hoặc hệ thức lượng để biến đổi.
- **Bước 3:** Đối chiếu điều kiện và chọn đáp án đúng.`,
      questions: [
        {
          id: `q_auto_${Date.now()}_1`,
          question: `Cho bài toán liên quan đến ${genTopic}. Khẳng định nào sau đây là ĐÚNG?`,
          options: [
            'Khẳng định A (Đúng theo định lý chuẩn SGK)',
            'Khẳng định B (Sai do thiếu điều kiện)',
            'Khẳng định C (Sai về dấu)',
            'Khẳng định D (Không đủ giả thiết)'
          ],
          correctIndex: 0,
          solution: `Áp dụng định lý trọng tâm về ${genTopic}: Khẳng định A hoàn toàn chính xác theo định nghĩa SGK.`
        },
        {
          id: `q_auto_${Date.now()}_2`,
          question: `Tính giá trị hoặc giải phương trình thuộc chủ đề ${genTopic}.`,
          options: [
            '$x = 1$',
            '$x = -1$',
            '$x = 2$',
            '$x = 0$'
          ],
          correctIndex: 0,
          solution: `Biến đổi phương trình tương đương: nghiệm thỏa mãn điều kiện bài toán là $x = 1$.`
        }
      ],
      isPublished: false, // MẶC ĐỊNH Ở TRẠNG THÁI ẨN THEO YÊU CẦU ĐỂ GIÁO VIÊN DUYỆT
      createdAt: new Date().toISOString()
    };

    const updated = [newWs, ...worksheets];
    setWorksheets(updated);
    saveWorksheets(updated);
    soundFx.playCorrect();
    alert(`✨ Đã tự sinh phiếu học tập mới: "${newWs.title}" (${newWs.grade})! Phiếu đang ở trạng thái 🔒 ĐANG ẨN để Thầy cô duyệt trước khi công khai cho học sinh.`);
  };

  // ================= PARSE & IMPORT FILE DATA =================
  const parseQuestionsFromText = (raw: string): MathWorksheetQuestion[] => {
    // 1. Kiểm tra xem có phải JSON không
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((item, i) => {
          // Format từ Imath hoặc json chuẩn
          const qText = item.content || item.question || `Câu ${i + 1}`;
          let opts: [string, string, string, string] = ['', '', '', ''];
          let correctIdx = 0;
          if (Array.isArray(item.options)) {
            item.options.slice(0, 4).forEach((op: any, oIdx: number) => {
              opts[oIdx] = typeof op === 'string' ? op : (op.text || op.label || '');
              if (op.is_correct || op.isCorrect) correctIdx = oIdx;
            });
          }
          return {
            id: `q_imp_${Date.now()}_${i}`,
            question: qText,
            options: opts,
            correctIndex: correctIdx,
            solution: item.explanation || item.solution || ''
          };
        });
      }
      if (parsed.questions && Array.isArray(parsed.questions)) {
        return parseQuestionsFromText(JSON.stringify(parsed.questions));
      }
    } catch {
      // Không phải JSON, xử lý dạng Text / Imath format
    }

    // 2. Parser dạng Text thông thường hoặc định dạng trắc nghiệm
    // Nhận diện theo Câu 1:, Câu 2:... hoặc [Câu 1]
    const lines = raw.split(/\r?\n/);
    const questions: MathWorksheetQuestion[] = [];
    let currentQ: Partial<MathWorksheetQuestion> | null = null;
    let currentOptions: string[] = [];
    let currentCorrect = 0;
    let currentSol = '';
    let isReadingSol = false;

    const commitCurrent = () => {
      if (currentQ && currentQ.question) {
        while (currentOptions.length < 4) {
          currentOptions.push(`Phương án ${String.fromCharCode(65 + currentOptions.length)}`);
        }
        questions.push({
          id: `q_imp_${Date.now()}_${questions.length + 1}`,
          question: currentQ.question.trim(),
          options: currentOptions.slice(0, 4) as [string, string, string, string],
          correctIndex: currentCorrect,
          solution: currentSol.trim()
        });
      }
      currentQ = null;
      currentOptions = [];
      currentCorrect = 0;
      currentSol = '';
      isReadingSol = false;
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Nhận diện bắt đầu câu mới
      const qMatch = line.match(/^(?:Câu\s*\d+|Bài\s*\d+|\[Câu\s*\d+\])[:.]?\s*(.*)$/i);
      if (qMatch) {
        commitCurrent();
        currentQ = { question: qMatch[1] || line };
        continue;
      }

      // Nhận diện phương án A., B., C., D. hoặc *A. (đáp án đúng)
      const optMatch = line.match(/^(\*?)\s*([A-D])[\.\)]\s*(.*)$/);
      if (optMatch) {
        isReadingSol = false;
        const isStar = optMatch[1] === '*';
        const optLetter = optMatch[2].toUpperCase();
        const optText = optMatch[3];
        const optIdx = optLetter.charCodeAt(0) - 65;
        currentOptions[optIdx] = optText;
        if (isStar) currentCorrect = optIdx;
        continue;
      }

      // Nhận diện Lời giải / Hướng dẫn
      if (line.match(/^(?:Lời giải|Hướng dẫn giải|Giải chi tiết)[:.]?/i)) {
        isReadingSol = true;
        currentSol += line + '\n';
        continue;
      }

      // Nhận diện Đáp án đúng: A hoặc B...
      const ansMatch = line.match(/^(?:Đáp án|Chọn|ĐA)[:.]?\s*([A-D])/i);
      if (ansMatch) {
        currentCorrect = ansMatch[1].toUpperCase().charCodeAt(0) - 65;
        continue;
      }

      // Nội dung bổ sung
      if (isReadingSol) {
        currentSol += line + '\n';
      } else if (currentQ) {
        currentQ.question += '\n' + line;
      } else {
        // Nếu chưa gặp "Câu x", tạo câu mới
        currentQ = { question: line };
      }
    }
    commitCurrent();
    return questions;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      setImportText(content);
      setImportStatus(`Đã đọc file "${file.name}" (${(file.size / 1024).toFixed(1)} KB)`);
    };
    reader.onerror = () => {
      setImportStatus('❌ Lỗi khi đọc file!');
    };
    reader.readAsText(file);
  };

  const handleApplyImport = () => {
    if (!importText.trim()) {
      alert('Vui lòng chọn file hoặc dán nội dung câu hỏi vào ô!');
      return;
    }

    const parsedQ = parseQuestionsFromText(importText);
    if (parsedQ.length === 0) {
      alert('Không nhận diện được câu hỏi nào từ dữ liệu! Vui lòng kiểm tra lại định dạng (Câu 1:... A. B. C. D.)');
      return;
    }

    soundFx.playCorrect();

    if (importTargetWsId === 'new') {
      // Tạo phiếu mới
      const newWs: MathWorksheet = {
        id: `ws_imp_${Date.now()}`,
        title: `Phiếu nhập từ file (${parsedQ.length} câu)`,
        grade: selectedGrade === 'Tất cả' ? 'Toán 10' : selectedGrade,
        chapter: 'Chuyên đề tự nhập',
        description: `Phiếu bài tập được tải lên từ file dữ liệu với ${parsedQ.length} câu hỏi.`,
        theorySummary: '### Tóm tắt lý thuyết\n(Chưa có lý thuyết tóm tắt, Thầy cô có thể bấm Sửa để bổ sung)',
        questions: parsedQ,
        isPublished: false,
        createdAt: new Date().toISOString()
      };
      const updated = [newWs, ...worksheets];
      setWorksheets(updated);
      saveWorksheets(updated);
      setIsImportModalOpen(false);
      setImportText('');
      setImportStatus(null);
      alert(`🎉 Đã nhập thành công ${parsedQ.length} câu hỏi vào phiếu mới: "${newWs.title}"!`);
    } else {
      // Gộp vào phiếu có sẵn
      const target = worksheets.find(w => w.id === importTargetWsId);
      if (!target) return;
      const updated = worksheets.map(w => {
        if (w.id === importTargetWsId) {
          return {
            ...w,
            questions: [...w.questions, ...parsedQ],
            updatedAt: new Date().toISOString()
          };
        }
        return w;
      });
      setWorksheets(updated);
      saveWorksheets(updated);
      setIsImportModalOpen(false);
      setImportText('');
      setImportStatus(null);
      alert(`🎉 Đã nạp thêm ${parsedQ.length} câu hỏi vào phiếu "${target.title}"!`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar tab */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-black text-slate-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-indigo-600" />
              <span>Quản Lý Phiếu Học Tập Môn Toán</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
              {worksheets.length} phiếu
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Soạn thảo lý thuyết, bài tập KaTeX, tải file dữ liệu lên, tự sinh phiếu bài tập và bảo mật ẩn/hiện với học sinh.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* NÚT TẢI FILE DỮ LIỆU LÊN */}
          <button
            onClick={() => {
              soundFx.playClick();
              setIsImportModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            title="Tải file dữ liệu câu hỏi (JSON, TXT, CSV) để nạp vào phiếu"
          >
            <Upload className="w-4 h-4 text-emerald-200" />
            <span>📥 Tải file dữ liệu lên</span>
          </button>

          <button
            onClick={() => setIsAutoGenerateModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            title="Tự sinh phiếu học tập theo chuyên đề (mặc định ở trạng thái Ẩn)"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>✨ Tự sinh phiếu</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Thêm phiếu mới</span>
          </button>

          <button
            onClick={handleResetDefaults}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition flex items-center gap-1 cursor-pointer"
            title="Khôi phục lại danh sách 44 phiếu học tập chuẩn SGK (Toán 10, 11, 12)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Khôi phục 44 bài SGK</span>
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {(['Tất cả', 'Toán 10', 'Toán 11', 'Toán 12'] as const).map(gr => (
            <button
              key={gr}
              onClick={() => {
                soundFx.playClick();
                setSelectedGrade(gr);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                selectedGrade === gr
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {gr}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên bài, chuyên đề..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition"
          />
        </div>
      </div>

      {/* Table List */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Khối lớp</th>
                <th className="py-3 px-4">Tên Phiếu Học Tập</th>
                <th className="py-3 px-4">Chuyên đề</th>
                <th className="py-3 px-4 text-center">Số câu hỏi</th>
                <th className="py-3 px-4 text-center">Trạng thái (Học sinh)</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Không tìm thấy phiếu học tập nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredList.map(ws => {
                  const gradeBadge =
                    ws.grade === 'Toán 10'
                      ? 'bg-sky-50 text-sky-700 border-sky-200'
                      : ws.grade === 'Toán 11'
                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200';

                  return (
                    <tr key={ws.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 font-bold">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] border ${gradeBadge}`}>
                          {ws.grade}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 max-w-xs">
                        <div className="truncate" title={ws.title}>
                          {ws.title}
                        </div>
                        {ws.externalUrl && (
                          <span className="text-[10px] text-blue-600 font-bold flex items-center gap-1 mt-0.5">
                            <ExternalLink className="w-2.5 h-2.5" />
                            <span>Slide trình chiếu nội bộ</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 max-w-[200px]">
                        <div className="truncate" title={ws.chapter}>
                          {ws.chapter}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                        {ws.questions.length} câu
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleTogglePublish(ws.id)}
                          className={`px-2.5 py-1 rounded-full font-bold text-[10px] border cursor-pointer transition flex items-center gap-1 mx-auto ${
                            ws.isPublished
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                              : 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'
                          }`}
                          title="Nhấn để đổi trạng thái Công khai hoặc Ẩn với học sinh"
                        >
                          {ws.isPublished ? (
                            <>
                              <Eye className="w-3 h-3 text-emerald-600" />
                              <span>Công khai 🟢</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3 h-3 text-amber-600" />
                              <span>Đang ẩn 🔒</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(ws)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition cursor-pointer"
                            title="Sửa nội dung & từng câu hỏi"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(ws.id, ws.title)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition cursor-pointer"
                            title="Xóa phiếu"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL SỬA / THÊM PHIẾU HỌC TẬP TRỰC TIẾP ================= */}
      {editingWs && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-3xl p-5 sm:p-7 max-w-4xl w-full max-h-[94vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-blue-600" />
                  <span>{isCreatingNew ? 'Tạo Phiếu Học Tập Mới' : `Chỉnh Sửa: ${editingWs.title}`}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Hỗ trợ công thức Toán LaTeX/KaTeX dạng <code className="text-blue-600 font-bold">$x^2$</code> hoặc <code className="text-blue-600 font-bold">$$\frac{a}{b}$$</code>
                </p>
              </div>
              <button
                onClick={() => setEditingWs(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Scroll */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {/* Thông tin cơ bản */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Tiêu đề bài học</label>
                  <input
                    type="text"
                    value={editingWs.title}
                    onChange={e => setEditingWs({ ...editingWs, title: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:bg-white focus:border-blue-500 outline-none"
                    placeholder="Ví dụ: Bài 1: Mệnh đề toán học..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Khối lớp</label>
                  <select
                    value={editingWs.grade}
                    onChange={e => setEditingWs({ ...editingWs, grade: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:bg-white focus:border-blue-500 outline-none"
                  >
                    <option value="Toán 10">Toán 10</option>
                    <option value="Toán 11">Toán 11</option>
                    <option value="Toán 12">Toán 12</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Chương / Chuyên đề</label>
                  <input
                    type="text"
                    value={editingWs.chapter}
                    onChange={e => setEditingWs({ ...editingWs, chapter: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:border-blue-500 outline-none"
                    placeholder="Ví dụ: Chương I: Mệnh đề & Tập hợp..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Liên kết ngoài (Tùy chọn)</label>
                  <input
                    type="text"
                    value={editingWs.externalUrl || ''}
                    onChange={e => setEditingWs({ ...editingWs, externalUrl: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:border-blue-500 outline-none"
                    placeholder="https://..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Trạng thái (Học sinh)</label>
                  <div className="flex items-center gap-4 pt-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingWs.isPublished}
                        onChange={e => setEditingWs({ ...editingWs, isPublished: e.target.checked })}
                        className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                      />
                      <span>{editingWs.isPublished ? '🟢 Công khai' : '🔒 Đang ẩn'}</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Tóm tắt lý thuyết (KaTeX) */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                  <span>Tóm tắt lý thuyết trọng tâm (Hỗ trợ Markdown & KaTeX)</span>
                </label>
                <textarea
                  rows={4}
                  value={editingWs.theorySummary}
                  onChange={e => setEditingWs({ ...editingWs, theorySummary: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:bg-white focus:border-blue-500 outline-none"
                  placeholder="Nhập tóm tắt định nghĩa, định lý, công thức KaTeX..."
                />
              </div>

              {/* Danh sách câu hỏi bài tập */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>Danh sách bài tập củng cố ({editingWs.questions.length} câu)</span>
                  </label>
                  <button
                    onClick={handleAddQuestionRow}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Thêm câu hỏi</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {editingWs.questions.map((q, qIdx) => (
                    <div
                      key={q.id || qIdx}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3 relative group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                            Câu {qIdx + 1}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleMoveQuestion(qIdx, 'up')}
                              disabled={qIdx === 0}
                              className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                              title="Di chuyển lên"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleMoveQuestion(qIdx, 'down')}
                              disabled={qIdx === editingWs.questions.length - 1}
                              className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                              title="Di chuyển xuống"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <button
                          onClick={() => handleRemoveQuestionRow(qIdx)}
                          className="text-slate-400 hover:text-rose-600 text-xs font-bold cursor-pointer p-1"
                          title="Xóa câu hỏi này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Đề bài */}
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                          Nội dung đề bài
                        </label>
                        <input
                          type="text"
                          value={q.question}
                          onChange={e => {
                            const nQ = [...editingWs.questions];
                            nQ[qIdx].question = e.target.value;
                            setEditingWs({ ...editingWs, questions: nQ });
                          }}
                          placeholder="Nội dung câu hỏi (chèn $...$ cho công thức)..."
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-medium outline-none focus:border-blue-500"
                        />
                      </div>

                      {/* Các phương án A, B, C, D */}
                      {q.options && (
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                            Các phương án (Tích chọn tròn để đánh dấu ĐÁP ÁN ĐÚNG)
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {q.options.map((opt, oIdx) => (
                              <div key={oIdx} className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200">
                                <label className="text-[10px] font-bold text-slate-600 w-5 text-center">
                                  {String.fromCharCode(65 + oIdx)}
                                </label>
                                <input
                                  type="text"
                                  value={opt}
                                  onChange={e => {
                                    const nQ = [...editingWs.questions];
                                    const nOpts = [...(nQ[qIdx].options || ['', '', '', ''])] as [string, string, string, string];
                                    nOpts[oIdx] = e.target.value;
                                    nQ[qIdx].options = nOpts;
                                    setEditingWs({ ...editingWs, questions: nQ });
                                  }}
                                  className="flex-1 p-1 bg-transparent text-xs outline-none"
                                />
                                <input
                                  type="radio"
                                  name={`correct_${qIdx}`}
                                  checked={q.correctIndex === oIdx}
                                  onChange={() => {
                                    const nQ = [...editingWs.questions];
                                    nQ[qIdx].correctIndex = oIdx;
                                    setEditingWs({ ...editingWs, questions: nQ });
                                  }}
                                  title="Đánh dấu đáp án đúng"
                                  className="w-4 h-4 text-emerald-600 cursor-pointer mr-1"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Lời giải chi tiết */}
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                          Hướng dẫn giải chi tiết (KaTeX)
                        </label>
                        <input
                          type="text"
                          value={q.solution || ''}
                          onChange={e => {
                            const nQ = [...editingWs.questions];
                            nQ[qIdx].solution = e.target.value;
                            setEditingWs({ ...editingWs, questions: nQ });
                          }}
                          placeholder="Hướng dẫn giải chi tiết..."
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-700 outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
              <button
                onClick={() => setEditingWs(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleSaveEditing}
                className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>💾 Lưu Phiếu Học Tập</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL TẢI FILE DỮ LIỆU LÊN (IMPORT) ================= */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Tải File Dữ Liệu Câu Hỏi Lên
                  </h3>
                  <p className="text-xs text-slate-500">
                    Hỗ trợ file JSON (Imath / Edu), file TXT hoặc CSV câu hỏi trắc nghiệm A, B, C, D.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportStatus(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mục tiêu nạp câu hỏi */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Nạp vào đâu?</label>
              <select
                value={importTargetWsId}
                onChange={e => setImportTargetWsId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:bg-white focus:border-emerald-500 outline-none"
              >
                <option value="new">✨ Tạo một phiếu học tập MỚI từ file</option>
                {worksheets.map(w => (
                  <option key={w.id} value={w.id}>
                    Gộp thêm vào phiếu: [{w.grade}] {w.title} ({w.questions.length} câu)
                  </option>
                ))}
              </select>
            </div>

            {/* Chọn file từ máy tính */}
            <div className="p-4 border-2 border-dashed border-emerald-300 rounded-2xl bg-emerald-50/40 text-center space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.txt,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer inline-flex items-center gap-1.5"
              >
                <FolderOpen className="w-4 h-4" />
                <span>Chọn file từ máy tính (.json, .txt, .csv)</span>
              </button>
              {importStatus && (
                <p className="text-xs font-bold text-emerald-800">{importStatus}</p>
              )}
            </div>

            {/* Hoặc Dán nội dung trực tiếp */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Hoặc dán trực tiếp nội dung file vào đây:</span>
                <span className="text-[11px] font-normal text-slate-500">Định dạng text hoặc JSON</span>
              </label>
              <textarea
                rows={6}
                value={importText}
                onChange={e => setImportText(e.target.value)}
                placeholder={`Ví dụ định dạng TXT:\nCâu 1: Số nào là số nguyên tố?\nA. 4\n*B. 7\nC. 9\nD. 10\nLời giải: 7 là số nguyên tố.\n\nHoặc dán mảng JSON [{"content": "...", "options": [...]}]`}
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:bg-white focus:border-emerald-500 outline-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportStatus(null);
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 font-bold text-xs text-slate-600 hover:bg-slate-100 transition"
              >
                Hủy
              </button>
              <button
                onClick={handleApplyImport}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-4 h-4 text-emerald-200" />
                <span>Nạp dữ liệu vào hệ thống</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL TỰ SINH PHIẾU HỌC TẬP (AI / AUTO GENERATOR) ================= */}
      {isAutoGenerateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150 space-y-4">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-2">
                <Sparkles className="w-6 h-6 text-amber-500" />
              </div>
              <h3 className="text-lg font-black text-slate-900">
                ✨ Tự Sinh Phiếu Học Tập Toán
              </h3>
              <p className="text-xs text-slate-500">
                Tự động tạo phiếu bài tập hoàn chỉnh kèm tóm tắt lý thuyết và câu hỏi KaTeX. Phiếu mới sinh sẽ ở trạng thái <strong className="text-amber-600">Đang ẩn</strong> để Thầy cô duyệt trước!
              </p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Khối lớp</label>
                <select
                  value={genGrade}
                  onChange={e => setGenGrade(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:bg-white focus:border-purple-500 outline-none"
                >
                  <option value="Toán 10">Toán 10</option>
                  <option value="Toán 11">Toán 11</option>
                  <option value="Toán 12">Toán 12</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Chuyên đề / Bài học cần sinh</label>
                <input
                  type="text"
                  value={genTopic}
                  onChange={e => setGenTopic(e.target.value)}
                  placeholder="Nhập tên bài hoặc chuyên đề..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:border-purple-500 outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsAutoGenerateModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 font-bold text-xs text-slate-600 hover:bg-slate-100 transition"
              >
                Hủy
              </button>
              <button
                onClick={handleAutoGenerate}
                className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Sinh phiếu ngay</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
