import React, { useState, useRef } from 'react';
import { TeachingTool, Question, Difficulty } from '../../types';
import { X, FileUp, Plus, Trash2, Save, FileDown, Sparkles, Download, Shuffle, FileText, CheckCircle2, Calculator, Loader2 } from 'lucide-react';
import { soundFx } from '../../utils/sound';
import { GAME_TEMPLATES, exportStandaloneGameHTML, downloadFile } from '../../utils/gameExporter';
import { VirtualMathKeyboard } from '../common/VirtualMathKeyboard';
import { 
  extractTextFromDocx, 
  extractTextFromExcel, 
  parseDocumentQuestions, 
  normalizeMathFormulas, 
  downloadWordTemplate, 
  downloadExcelTemplate 
} from '../../utils/documentParser';

interface GameQuestionModalProps {
  tool: TeachingTool;
  onClose: () => void;
  onSave: (toolId: string, questions: Question[], newToolName?: string) => void;
  onDuplicateAsNewGame?: (newTool: TeachingTool) => void;
}

export const GameQuestionModal: React.FC<GameQuestionModalProps> = ({
  tool,
  onClose,
  onSave,
  onDuplicateAsNewGame
}) => {
  const [questions, setQuestions] = useState<Question[]>(tool.customQuestions || []);
  const [gameTitle, setGameTitle] = useState(tool.name);
  const [selectedTemplateUrl, setSelectedTemplateUrl] = useState(tool.url || GAME_TEMPLATES[0].file);
  const [isExporting, setIsExporting] = useState(false);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [rawTextToParse, setRawTextToParse] = useState('');
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [isParsingDoc, setIsParsingDoc] = useState(false);
  const [activeTarget, setActiveTarget] = useState<{
    id: string;
    field: 'question' | 'explanation' | 'option';
    optIndex?: number;
    fieldName: string;
  } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tìm template hiện tại
  const currentTemplate = GAME_TEMPLATES.find(t => t.file === selectedTemplateUrl) || GAME_TEMPLATES[0];

  // --- SMART TEXT PARSER (Nhận diện đề bài văn bản thô / Word) ---
  const handleParseRawText = () => {
    if (!rawTextToParse.trim()) {
      alert('Vui lòng dán nội dung câu hỏi vào khung!');
      return;
    }

    try {
      const parsedList: Question[] = [];
      // Tách theo Câu 1, Câu 2... hoặc 1. 2.
      const blocks = rawTextToParse.split(/(?:^|\n)(?:Câu\s+\d+|[0-9]{1,3}\.)[:.]?/gi).filter(b => b.trim().length > 0);

      blocks.forEach((block, idx) => {
        const lines = block.trim().split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length === 0) return;

        let questionText = lines[0];
        let options = ['A', 'B', 'C', 'D'];
        let correctIndex = 0;
        let explanation = '';
        const fullBlock = lines.join(' ');

        // Tìm lời giải nếu có
        const solMatch = fullBlock.match(/(?:Lời giải|Giải thích|Hướng dẫn)[:\s]+([\s\S]*)$/i);
        if (solMatch) {
          explanation = solMatch[1].trim();
        }

        // Tìm các đáp án A, B, C, D
        const optA = fullBlock.match(/[A][\.:\)]\s*(\*?)(.*?)(?=[B][\.:\)]|$)/i);
        const optB = fullBlock.match(/[B][\.:\)]\s*(\*?)(.*?)(?=[C][\.:\)]|$)/i);
        const optC = fullBlock.match(/[C][\.:\)]\s*(\*?)(.*?)(?=[D][\.:\)]|$)/i);
        const optD = fullBlock.match(/[D][\.:\)]\s*(\*?)(.*?)(?=(?:Lời giải|Giải thích|$))/i);

        if (optA && optB && optC && optD) {
          options = [optA[2].trim(), optB[2].trim(), optC[2].trim(), optD[2].trim()];
          if (optA[1] === '*') correctIndex = 0;
          else if (optB[1] === '*') correctIndex = 1;
          else if (optC[1] === '*') correctIndex = 2;
          else if (optD[1] === '*') correctIndex = 3;
          else if (/chọn\s+A/i.test(explanation)) correctIndex = 0;
          else if (/chọn\s+B/i.test(explanation)) correctIndex = 1;
          else if (/chọn\s+C/i.test(explanation)) correctIndex = 2;
          else if (/chọn\s+D/i.test(explanation)) correctIndex = 3;
        }

        parsedList.push({
          id: `raw_${Date.now()}_${idx}`,
          question: normalizeMathFormulas(questionText),
          options: [
            normalizeMathFormulas(options[0]),
            normalizeMathFormulas(options[1]),
            normalizeMathFormulas(options[2]),
            normalizeMathFormulas(options[3])
          ],
          correctIndex,
          explanation: normalizeMathFormulas(explanation),
          difficulty: idx < 5 ? 'Dễ' : (idx < 12 ? 'Trung bình' : 'Khó'),
          topic: 'Toán học',
          source: gameTitle,
          status: 'published',
          createdAt: new Date().toISOString()
        });
      });

      if (parsedList.length > 0) {
        setQuestions([...questions, ...parsedList]);
        setShowPasteModal(false);
        setRawTextToParse('');
        soundFx.playCorrect();
        alert(`🎉 Phân tích thành công ${parsedList.length} câu hỏi! Dữ liệu đã được nạp vào bảng.`);
      } else {
        alert('Không nhận diện được cấu trúc câu hỏi. Thầy hãy kiểm tra định dạng Câu 1. ... A. ... B. ...');
      }
    } catch (e: any) {
      alert(`Lỗi phân tích: ${e?.message}`);
    }
  };

  // --- CSV IMPORT ---
  const handleImportCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
        if (lines.length <= 1) throw new Error('File rỗng hoặc không có dữ liệu');

        const newQuestions: Question[] = [];
        for (let i = 1; i < lines.length; i++) {
          const row = lines[i];
          const match = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || row.split(',');
          const clean = match.map(m => m.replace(/^"|"$/g, '').trim());

          if (clean.length >= 6) {
            const questionText = clean[0];
            const optA = clean[1] || 'A';
            const optB = clean[2] || 'B';
            const optC = clean[3] || 'C';
            const optD = clean[4] || 'D';
            const corStr = clean[5]?.toUpperCase();
            const explanation = clean[6] || '';
            const difficulty: Difficulty = (clean[7] === 'Dễ' || clean[7] === 'Khó') ? clean[7] as Difficulty : 'Trung bình';
            const topic = clean[8] || 'Chung';

            let correctIndex = 0;
            if (corStr === 'B' || corStr === '1') correctIndex = 1;
            if (corStr === 'C' || corStr === '2') correctIndex = 2;
            if (corStr === 'D' || corStr === '3') correctIndex = 3;

            newQuestions.push({
              id: `csv_${Date.now()}_${i}`,
              question: normalizeMathFormulas(questionText),
              options: [
                normalizeMathFormulas(optA),
                normalizeMathFormulas(optB),
                normalizeMathFormulas(optC),
                normalizeMathFormulas(optD)
              ],
              correctIndex,
              explanation: normalizeMathFormulas(explanation),
              difficulty,
              topic,
              source: gameTitle,
              status: 'published',
              createdAt: new Date().toISOString()
            });
          }
        }

        if (newQuestions.length > 0) {
          setQuestions([...questions, ...newQuestions]);
          soundFx.playCorrect();
          alert(`Đã nhập thành công ${newQuestions.length} câu hỏi từ file CSV!`);
        } else {
          alert('Không tìm thấy câu hỏi hợp lệ trong file CSV.');
        }
      } catch (err: any) {
        alert(`Lỗi đọc file CSV: ${err?.message}`);
      }
    };
    reader.readAsText(file);
  };

  // --- SMART IMPORT WORD (.DOCX) & EXCEL (.XLSX) THEO MẪU PHÂN CẤP ---
  const handleImportDocumentFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingDoc(true);
    soundFx.playClick();

    try {
      let rawText = '';
      const ext = file.name.split('.').pop()?.toLowerCase();

      if (ext === 'docx') {
        rawText = await extractTextFromDocx(file);
      } else if (ext === 'xlsx' || ext === 'xls') {
        rawText = await extractTextFromExcel(file);
      } else if (ext === 'csv') {
        rawText = await file.text();
      } else {
        throw new Error('Định dạng file không được hỗ trợ. Vui lòng chọn .docx, .xlsx, .xls hoặc .csv');
      }

      const parsedQuestions = parseDocumentQuestions(rawText, gameTitle);
      if (parsedQuestions.length === 0) {
        throw new Error('Không bóc tách được câu hỏi hoặc cấu trúc ghép đôi hợp lệ từ file.');
      }

      setQuestions(prev => [...prev, ...parsedQuestions]);
      soundFx.playCorrect();
      alert(`🎉 ĐÃ NHẬP THÀNH CÔNG ${parsedQuestions.length} CÂU HỎI / CẶP THẺ TỪ FILE:\n"${file.name}"!\n\nCấu trúc Chuyên đề, Cấp độ và Công thức toán học đã được giữ nguyên vẹn.`);
    } catch (err: any) {
      console.error(err);
      alert(`Lỗi đọc file tài liệu: ${err?.message || 'Có lỗi xảy ra khi xử lý tài liệu.'}`);
    } finally {
      setIsParsingDoc(false);
      if (e.target) e.target.value = '';
    }
  };

  // --- BÀN PHÍM CÔNG THỨC TOÁN HỌC ẢO (VIRTUAL MATH KEYBOARD LOGIC) ---
  const handleInsertMath = (snippet: string) => {
    if (!activeTarget) return;
    const { id, field, optIndex } = activeTarget;

    if (field === 'question') {
      const q = questions.find(item => item.id === id);
      if (!q) return;
      handleUpdate(id, 'question', q.question + snippet);
    } else if (field === 'explanation') {
      const q = questions.find(item => item.id === id);
      if (!q) return;
      handleUpdate(id, 'explanation', (q.explanation || '') + snippet);
    } else if (field === 'option' && typeof optIndex === 'number') {
      const q = questions.find(item => item.id === id);
      if (!q) return;
      const currentOpt = q.options[optIndex] || '';
      handleUpdateOption(id, optIndex, currentOpt + snippet);
    }
  };

  const handleBackspace = () => {
    if (!activeTarget) return;
    const { id, field, optIndex } = activeTarget;

    if (field === 'question') {
      const q = questions.find(item => item.id === id);
      if (!q || !q.question) return;
      handleUpdate(id, 'question', q.question.slice(0, -1));
    } else if (field === 'explanation') {
      const q = questions.find(item => item.id === id);
      if (!q || !q.explanation) return;
      handleUpdate(id, 'explanation', q.explanation.slice(0, -1));
    } else if (field === 'option' && typeof optIndex === 'number') {
      const q = questions.find(item => item.id === id);
      if (!q) return;
      const currentOpt = q.options[optIndex] || '';
      handleUpdateOption(id, optIndex, currentOpt.slice(0, -1));
    }
  };

  const getCurrentTargetValue = (): string => {
    if (!activeTarget) return '';
    const { id, field, optIndex } = activeTarget;
    const q = questions.find(item => item.id === id);
    if (!q) return '';
    if (field === 'question') return q.question;
    if (field === 'explanation') return q.explanation || '';
    if (field === 'option' && typeof optIndex === 'number') return q.options[optIndex] || '';
    return '';
  };

  // --- CSV TEMPLATE ---
  const exportTemplate = () => {
    const headers = ['Câu hỏi', 'Đáp án A', 'Đáp án B', 'Đáp án C', 'Đáp án D', 'Đúng (A/B/C/D)', 'Giải thích', 'Độ khó (Dễ/Trung bình/Khó)', 'Chủ đề'];
    const sample = ['1 + 1 bằng mấy?', '1', '2', '3', '4', 'B', 'Vì 1+1=2', 'Dễ', 'Toán học'];
    const csvContent = '\uFEFF' + headers.join(',') + '\n' + sample.join(',');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Mau_Cau_Hoi_${gameTitle.replace(/\s+/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- CRUD CÂU HỎI ---
  const handleAddEmpty = () => {
    setQuestions([
      {
        id: `q_${Date.now()}`,
        question: 'Câu hỏi toán học mới...',
        options: ['Lựa chọn A', 'Lựa chọn B', 'Lựa chọn C', 'Lựa chọn D'],
        correctIndex: 0,
        explanation: '',
        difficulty: 'Trung bình',
        topic: 'Toán học',
        source: gameTitle,
        status: 'published',
        createdAt: new Date().toISOString()
      },
      ...questions
    ]);
    soundFx.playClick();
  };

  const handleShuffle = () => {
    if (questions.length <= 1) return;
    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    setQuestions(shuffled);
    soundFx.playClick();
    alert('Đã xáo trộn ngẫu nhiên thứ tự các câu hỏi!');
  };

  const handleRemove = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
    soundFx.playClick();
  };

  const handleUpdate = (id: string, field: string, value: any) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  const handleUpdateOption = (id: string, optIndex: number, value: string) => {
    setQuestions(questions.map(q => {
      if (q.id === id) {
        const newOpts = [...q.options] as [string, string, string, string];
        newOpts[optIndex] = value;
        return { ...q, options: newOpts };
      }
      return q;
    }));
  };

  // --- HÀNH ĐỘNG 1: LƯU VÀO WEB QUẢN TRỊ ---
  const handleSaveToWeb = () => {
    if (questions.length === 0) {
      if (!confirm('Bộ câu hỏi hiện đang trống. Trò chơi sẽ chạy bằng ngân hàng câu hỏi mặc định. Bạn có muốn tiếp tục?')) {
        return;
      }
    }
    soundFx.playCorrect();
    onSave(tool.id, questions, gameTitle);
  };

  // --- HÀNH ĐỘNG 2: SAO CHÉP TẠO GAME MỚI CHO CHỦ ĐỀ KHÁC ---
  const handleDuplicateToNewGame = () => {
    if (!onDuplicateAsNewGame) return;
    const newTool: TeachingTool = {
      id: 'tool_custom_' + Date.now(),
      name: gameTitle + ' (Bản Mới)',
      type: 'iframe',
      category: 'tro-choi',
      url: selectedTemplateUrl,
      description: `Trò chơi ${currentTemplate.name} với bộ câu hỏi chủ đề tùy chỉnh.`,
      isActive: true,
      createdAt: new Date().toISOString(),
      customQuestions: questions
    };
    onDuplicateAsNewGame(newTool);
    soundFx.playCorrect();
    alert(`🎉 Đã tạo thành công trò chơi mới "${newTool.name}" trong danh mục Trò chơi học tập!`);
    onClose();
  };

  // --- HÀNH ĐỘNG 3: XUẤT FILE HTML TRÒ CHƠI ĐỘC LẬP 1 NÚT BẤM (STANDALONE HTML) ---
  const handleExportStandaloneHTML = async () => {
    if (questions.length === 0) {
      alert('Vui lòng thêm ít nhất 1 câu hỏi trước khi xuất file!');
      return;
    }

    setIsExporting(true);
    soundFx.playClick();

    try {
      // Chạy Data Adapter Engine tự động phân tích và nhúng dữ liệu
      const htmlString = await exportStandaloneGameHTML({
        templateUrl: selectedTemplateUrl,
        gameTitle: gameTitle,
        teacherName: 'LỚP TOÁN THẦY HÙNG',
        questions: questions
      });

      // Tải tệp xuống máy tính
      const safeFilename = `${gameTitle.toLowerCase().replace(/[^a-z0-9]/gi, '_')}_custom.html`;
      downloadFile(htmlString, safeFilename, 'text/html');

      soundFx.playCorrect();
      alert(`⚡ XUẤT FILE THÀNH CÔNG!\n\nĐã tải xuống file: ${safeFilename}\n\nThầy có thể:\n1. Mở trực tiếp trên máy tính để chơi ngay (không cần mạng).\n2. Kéo thả file này đè lên Vercel để cập nhật vĩnh viễn!`);
    } catch (err: any) {
      console.error(err);
      alert(`Lỗi xuất file HTML: ${err?.message || 'Không thể tải template trò chơi gốc.'}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-3 sm:p-5">
      <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border-2 border-violet-200 animate-in zoom-in-95 duration-200">
        
        {/* HEADER CÔNG CỤ */}
        <div className="flex justify-between items-center p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-slate-900 via-violet-950 to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-violet-600/40 rounded-2xl border border-violet-400/30 text-amber-300">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Studio Tạo Trò Chơi Tự Động (1 Nút Bấm)
                </h3>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 tracking-wider">
                  Pro Engine v3.8
                </span>
              </div>
              <p className="text-xs text-violet-200/80 font-medium mt-0.5">
                Tự động đóng gói câu hỏi, chuyển đổi cấu trúc (Data Adapter) và xuất bản game độc lập
              </p>
            </div>
          </div>
          <button 
            onClick={() => { soundFx.playClick(); onClose(); }} 
            className="p-2 hover:bg-white/10 rounded-full transition text-slate-300 hover:text-white cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* CẤU HÌNH TRÒ CHƠI & CHỌN TEMPLATE */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <span>1. Tên Trò Chơi Mới Cho Chủ Đề Này</span>
            </label>
            <input
              type="text"
              value={gameTitle}
              onChange={(e) => setGameTitle(e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:border-violet-600 focus:ring-2 focus:ring-violet-200 outline-none"
              placeholder="VD: Đua xe F1 - Ôn tập Lượng giác Lớp 10..."
            />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <span>2. Chọn Mẫu Trò Chơi Nền Tảng (23 Game)</span>
            </label>
            <select
              value={selectedTemplateUrl}
              onChange={(e) => {
                setSelectedTemplateUrl(e.target.value);
                soundFx.playClick();
              }}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-violet-900 focus:border-violet-600 focus:ring-2 focus:ring-violet-200 outline-none cursor-pointer"
            >
              {GAME_TEMPLATES.map((tmpl) => (
                <option key={tmpl.id} value={tmpl.file}>
                  {tmpl.name} ({tmpl.category})
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2 text-xs text-slate-500 bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
            <span className="font-medium">
              💡 <b>Template hiện tại:</b> <span className="text-violet-700 font-bold">{currentTemplate.name}</span> — {currentTemplate.description}
            </span>
            <span className="font-mono text-[11px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
              File: {currentTemplate.file}
            </span>
          </div>
        </div>

        {/* THANH CÔNG CỤ SOẠN & NHẬP DỮ LIỆU */}
        <div className="flex gap-2 p-3 sm:p-4 border-b border-slate-200 bg-white items-center flex-wrap">
          <button 
            type="button"
            onClick={exportTemplate} 
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Tải file Excel/CSV mẫu chuẩn để điền câu hỏi"
          >
            <FileDown className="w-4 h-4 text-slate-500" /> Tải CSV mẫu
          </button>

          {/* NÚT TẢI FILE MẪU WORD (.DOCX) - YÊU CẦU 3 */}
          <button
            type="button"
            onClick={async () => {
              try {
                soundFx.playClick();
                await downloadWordTemplate();
              } catch (err: any) {
                console.error(err);
                alert(`Lỗi tạo file Word mẫu: ${err?.message || 'Không thể tạo file docx'}`);
              }
            }}
            className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-1.5 cursor-pointer border border-blue-200 shadow-2xs active:scale-95"
            title="Tải file Word (.docx) mẫu chuẩn cấu trúc phân cấp: Chuyên đề -> Cấp độ -> Cặp ghép đôi"
          >
            <FileDown className="w-4 h-4 text-blue-600" />
            <span>📥 Tải File Word (.docx) Mẫu</span>
          </button>

          {/* NÚT TẢI FILE MẪU EXCEL (.XLSX) - YÊU CẦU 3 */}
          <button
            type="button"
            onClick={async () => {
              try {
                soundFx.playClick();
                await downloadExcelTemplate();
              } catch (err: any) {
                console.error(err);
                alert(`Lỗi tạo file Excel mẫu: ${err?.message || 'Không thể tạo file xlsx'}`);
              }
            }}
            className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-1.5 cursor-pointer border border-emerald-200 shadow-2xs active:scale-95"
            title="Tải file Excel (.xlsx) mẫu chuẩn cấu trúc phân cấp: Chuyên đề, Cấp độ, Thẻ gốc, Thuộc tính 1-4"
          >
            <FileDown className="w-4 h-4 text-emerald-600" />
            <span>📥 Tải File Excel (.xlsx) Mẫu</span>
          </button>
          
          <label className={`px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-1.5 cursor-pointer border shadow-2xs ${
            isParsingDoc 
              ? 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse' 
              : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
          }`}>
            {isParsingDoc ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />}
            <span>{isParsingDoc ? 'Đang bóc tách file...' : 'Nhập Word (.docx) / Excel (.xlsx)'}</span>
            <input 
              type="file" 
              accept=".docx,.xlsx,.xls,.csv" 
              ref={fileInputRef} 
              onChange={handleImportDocumentFile} 
              className="hidden" 
              disabled={isParsingDoc}
            />
          </label>

          <button
            onClick={() => setShowKeyboard(!showKeyboard)}
            className={`px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-1.5 border shadow-2xs cursor-pointer ${
              showKeyboard 
                ? 'bg-violet-600 text-white border-violet-500 shadow-[0_0_15px_rgba(124,58,237,0.35)]' 
                : 'bg-violet-50 hover:bg-violet-100 text-violet-700 border-violet-200'
            }`}
            title="Bật/Tắt Bàn Phím Công Thức Toán Học Ảo"
          >
            <Calculator className="w-4 h-4" /> Bàn Phím Toán Ảo
          </button>

          <button 
            onClick={() => setShowPasteModal(true)} 
            className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-1.5 border border-purple-200 cursor-pointer shadow-2xs"
            title="Dán nhanh đề bài Word, văn bản thô theo dạng Câu 1. A. B. C. D."
          >
            <FileText className="w-4 h-4" /> Dán đề bài nhanh (Parser)
          </button>

          <button 
            onClick={handleShuffle} 
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-1.5 cursor-pointer"
            title="Trộn thứ tự câu hỏi chống học vẹt"
          >
            <Shuffle className="w-4 h-4" /> Xáo trộn
          </button>

          <button 
            onClick={handleAddEmpty} 
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-1.5 shadow-sm shadow-emerald-200 ml-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" /> + Thêm câu hỏi
          </button>
        </div>

        {/* DANH SÁCH CÂU HỎI */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-slate-50 space-y-4 custom-scrollbar">
          {questions.length === 0 ? (
            <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border-2 border-dashed border-slate-200 p-8">
              <Sparkles className="w-12 h-12 text-violet-300 mx-auto mb-3" />
              <p className="font-bold text-base text-slate-600">Chưa có câu hỏi tùy chỉnh nào</p>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Thầy có thể bấm <b>"Dán đề bài nhanh (Parser)"</b>, <b>"Nhập từ CSV"</b> hoặc <b>"+ Thêm câu hỏi"</b> để thiết kế bộ câu hỏi riêng cho chủ đề bài giảng!
              </p>
            </div>
          ) : (
            questions.map((q, index) => (
              <div key={q.id || index} className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs relative group hover:border-violet-300 transition">
                <button 
                  onClick={() => handleRemove(q.id)} 
                  className="absolute top-4 right-4 p-2 text-slate-300 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition cursor-pointer"
                  title="Xóa câu hỏi này"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                
                <div className="mb-3 pr-10 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-xs px-2.5 py-1 rounded-lg bg-violet-100 text-violet-800">
                      CÂU {index + 1}
                    </span>
                    <select
                      value={q.difficulty}
                      onChange={(e) => handleUpdate(q.id, 'difficulty', e.target.value)}
                      className={`text-xs font-bold px-2 py-1 rounded-lg border outline-none cursor-pointer ${
                        q.difficulty === 'Dễ' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : q.difficulty === 'Khó' 
                          ? 'bg-rose-50 text-rose-700 border-rose-200' 
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      <option value="Dễ">Mức độ: Dễ</option>
                      <option value="Trung bình">Mức độ: Trung bình</option>
                      <option value="Khó">Mức độ: Khó</option>
                    </select>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">
                    (Click chọn hình tròn để đặt đáp án đúng)
                  </span>
                </div>

                <div className="mb-3">
                  <textarea
                    value={q.question}
                    onChange={(e) => handleUpdate(q.id, 'question', e.target.value)}
                    onFocus={() => {
                      setActiveTarget({ id: q.id, field: 'question', fieldName: `Đề bài Câu ${index + 1}` });
                      setShowKeyboard(true);
                    }}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none min-h-[64px]"
                    placeholder="Nhập nội dung câu hỏi (hỗ trợ công thức LaTeX: \sin x, \frac{a}{b}...)..."
                  />
                </div>

                {/* 4 LỰA CHỌN TRẮC NGHIỆM */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3">
                  {q.options.map((opt, oIdx) => {
                    const isCorrect = q.correctIndex === oIdx;
                    return (
                      <div 
                        key={oIdx} 
                        className={`flex items-center gap-2 p-1.5 rounded-xl border transition ${
                          isCorrect ? 'border-emerald-400 bg-emerald-50/60' : 'border-slate-200 bg-white'
                        }`}
                      >
                        <label className="flex items-center gap-1.5 cursor-pointer pl-1">
                          <input
                            type="radio"
                            name={`correct_${q.id}`}
                            checked={isCorrect}
                            onChange={() => handleUpdate(q.id, 'correctIndex', oIdx)}
                            className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                          <span className={`text-xs font-black w-4 text-center ${isCorrect ? 'text-emerald-700' : 'text-slate-500'}`}>
                            {String.fromCharCode(65 + oIdx)}.
                          </span>
                        </label>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => handleUpdateOption(q.id, oIdx, e.target.value)}
                          onFocus={() => {
                            setActiveTarget({ id: q.id, field: 'option', optIndex: oIdx, fieldName: `Câu ${index + 1} - Đáp án ${String.fromCharCode(65 + oIdx)}` });
                            setShowKeyboard(true);
                          }}
                          className={`flex-1 p-2 rounded-lg text-xs font-medium outline-none bg-transparent ${
                            isCorrect ? 'text-emerald-900 font-bold' : 'text-slate-800'
                          }`}
                          placeholder={`Lựa chọn ${String.fromCharCode(65 + oIdx)}...`}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* GIẢI THÍCH CHI TIẾT */}
                <div>
                  <input
                    type="text"
                    value={q.explanation || ''}
                    onChange={(e) => handleUpdate(q.id, 'explanation', e.target.value)}
                    onFocus={() => {
                      setActiveTarget({ id: q.id, field: 'explanation', fieldName: `Câu ${index + 1} - Lời giải chi tiết` });
                      setShowKeyboard(true);
                    }}
                    className="w-full p-2 border border-slate-200 rounded-xl text-xs text-slate-600 focus:border-violet-400 outline-none"
                    placeholder="Lời giải / giải thích chi tiết (tùy chọn)..."
                  />
                </div>
              </div>
            ))
          )}
        </div>

        {/* FOOTER ĐIỀU KHIỂN & 2 NÚT HÀNH ĐỘNG 1 BẤM */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-white flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="text-xs text-slate-500 font-bold">
            Tổng cộng: <span className="text-violet-700 text-sm">{questions.length}</span> câu hỏi đã cấu hình
          </div>
          
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
            <button 
              onClick={() => { soundFx.playClick(); onClose(); }} 
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-bold text-xs sm:text-sm hover:bg-slate-50 transition cursor-pointer"
            >
              Đóng
            </button>

            {onDuplicateAsNewGame && (
              <button
                onClick={handleDuplicateToNewGame}
                className="px-4 py-2.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 font-black text-xs sm:text-sm transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Tạo thêm 1 trò chơi mới độc lập vào trang web"
              >
                <span>➕ Nhân bản thành Game mới</span>
              </button>
            )}

            <button
              onClick={handleSaveToWeb}
              className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-black text-xs sm:text-sm shadow-md shadow-violet-200 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" /> Lưu Vào Web
            </button>

            {/* NÚT TỐI THƯỢNG: XUẤT FILE HTML TRÒ CHƠI HOÀN CHỈNH (1 NÚT BẤM) */}
            <button
              onClick={handleExportStandaloneHTML}
              disabled={isExporting}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs sm:text-sm shadow-lg shadow-emerald-200 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4 animate-bounce" />
              <span>{isExporting ? 'Đang Đóng Gói...' : '⚡ XUẤT FILE HTML (1 Nút Bấm)'}</span>
            </button>
          </div>
        </div>

      </div>

      {/* MODAL CON: DÁN ĐỀ BÀI VĂN BẢN (SMART PARSER) */}
      {showPasteModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-2xl w-full flex flex-col shadow-2xl border-4 border-violet-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 mb-3">
              <div>
                <h4 className="text-base sm:text-lg font-black text-slate-800 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-violet-600" />
                  <span>Dán Đề Bài Văn Bản Thô (Smart Parser)</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tự động nhận diện câu hỏi trắc nghiệm từ file Word, văn bản hoặc tài liệu có sẵn.
                </p>
              </div>
              <button 
                onClick={() => setShowPasteModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xl font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mb-3 text-[11px] text-slate-500 bg-violet-50 p-3 rounded-xl border border-violet-100">
              💡 <b>Mẫu định dạng hỗ trợ:</b><br />
              <code className="text-violet-800 font-mono">
                Câu 1. Tìm khẳng định đúng?<br />
                A. *cos80 &gt; 0 &nbsp;&nbsp; B. cos80 &lt; 0 &nbsp;&nbsp; C. tan80 &lt; 0 &nbsp;&nbsp; D. cot80 &lt; 0<br />
                Lời giải: Chọn A...
              </code>
              <br /><span className="text-slate-400 font-italic">(Dấu * đứng trước phương án sẽ được nhận diện là đáp án đúng)</span>
            </div>

            <textarea
              rows={10}
              value={rawTextToParse}
              onChange={(e) => setRawTextToParse(e.target.value)}
              placeholder="Dán nội dung câu hỏi từ Word / Text vào đây..."
              className="w-full p-3 border border-slate-300 rounded-xl text-xs font-mono focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none mb-4"
            />

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                onClick={() => setShowPasteModal(false)}
                className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleParseRawText}
                className="px-5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:brightness-110 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" /> Phân Tích & Nạp Vào Game
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BÀN PHÍM CÔNG THỨC TOÁN HỌC ẢO (VIRTUAL MATH KEYBOARD) */}
      <VirtualMathKeyboard
        isOpen={showKeyboard}
        onClose={() => setShowKeyboard(false)}
        onInsert={handleInsertMath}
        onBackspace={handleBackspace}
        currentValue={getCurrentTargetValue()}
        targetFieldName={activeTarget?.fieldName || 'Ô nhập liệu'}
      />

    </div>
  );
};
