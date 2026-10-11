import React, { useState, useRef } from 'react';
import { TeachingTool, Question, Difficulty, DragDropCategory } from '../../types';
import { X, FileUp, Plus, Trash2, Save, FileDown, Sparkles, Download, Shuffle, FileText, CheckCircle2, Calculator, Loader2 } from 'lucide-react';
import { soundFx } from '../../utils/sound';
import { GAME_TEMPLATES, exportStandaloneGameHTML, downloadFile } from '../../utils/gameExporter';
import { VirtualMathKeyboard } from '../common/VirtualMathKeyboard';
import { 
  extractTextFromDocx, 
  extractTextFromExcel, 
  parseDocumentQuestions, 
  parseDragDropFromText,
  normalizeMathFormulas, 
  downloadWordTemplate, 
  downloadExcelTemplate 
} from '../../utils/documentParser';

// Bộ xem trước công thức KaTeX thời gian thực
const MathLivePreview: React.FC<{ formula: string }> = ({ formula }) => {
  if (!formula || !formula.trim()) return null;
  let html = '';
  if (typeof window !== 'undefined' && (window as any).katex) {
    try {
      const clean = formula.replace(/^\\\(/, '').replace(/\\\)$/, '').replace(/^\$/, '').replace(/\$$/, '');
      html = (window as any).katex.renderToString(clean, { throwOnError: false });
    } catch (e) {}
  }
  return (
    <div className="mt-1 px-2.5 py-1 bg-cyan-950/40 border border-cyan-500/30 rounded-lg flex items-center gap-2">
      <span className="text-[10px] uppercase font-bold text-cyan-400 shrink-0">Hiển thị KaTeX:</span>
      {html ? (
        <span className="text-xs text-cyan-200" dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <span className="text-xs font-mono text-cyan-200 font-bold">{formula}</span>
      )}
    </div>
  );
};

interface GameQuestionModalProps {
  tool: TeachingTool;
  onClose: () => void;
  onSave: (toolId: string, questions: Question[], newToolName?: string, customDragDrop?: DragDropCategory[]) => void;
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

  // Nhận diện chế độ Kéo Thả Phân Loại Thuộc Tính
  const isDragDropMode = selectedTemplateUrl.includes('keo-tha');

  // Quản lý cấu trúc Phân Loại Động (Category - Attributes) chuẩn game Kéo Thả
  const [categories, setCategories] = useState<DragDropCategory[]>(() => {
    if (tool.customDragDrop && tool.customDragDrop.length > 0) {
      return tool.customDragDrop;
    }
    if (tool.customQuestions && tool.customQuestions.length > 0) {
      return tool.customQuestions.map((q, idx) => ({
        id: `cat_${idx + 1}`,
        title: q.question,
        theme: ['blue', 'emerald', 'violet', 'amber', 'rose', 'cyan'][idx % 6],
        attributes: (q.options || []).filter(Boolean)
      }));
    }
    return [
      {
        id: 'cat_1',
        title: 'y = x^3 - 3x',
        theme: 'blue',
        attributes: [
          'Hàm số đạt cực đại tại x = -1',
          'Hàm số đạt cực tiểu tại x = 1',
          'Hàm số đồng biến trên khoảng (1; +\\infty)',
          'Hàm số nghịch biến trên khoảng (-1; 1)'
        ]
      },
      {
        id: 'cat_2',
        title: 'y = -x^3 + 3x^2',
        theme: 'emerald',
        attributes: [
          'Hàm số đạt cực đại tại x = 2',
          'Hàm số đạt cực tiểu tại x = 0',
          'Hàm số đồng biến trên khoảng (0; 2)',
          'Giá trị cực đại bằng 4'
        ]
      },
      {
        id: 'cat_3',
        title: 'y = x^4 - 2x^2 + 1',
        theme: 'violet',
        attributes: [
          'Hàm số có 3 điểm cực trị',
          'Hàm số đạt cực đại tại x = 0',
          'Hàm số có 2 điểm cực tiểu',
          'Hàm số đồng biến trên khoảng (-1; 0)'
        ]
      }
    ];
  });

  const [activeTarget, setActiveTarget] = useState<{
    id: string;
    field: 'question' | 'explanation' | 'option' | 'category_title' | 'category_attribute';
    optIndex?: number;
    attrIndex?: number;
    fieldName: string;
  } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tìm template hiện tại
  const currentTemplate = GAME_TEMPLATES.find(t => t.file === selectedTemplateUrl) || GAME_TEMPLATES[0];

  // --- CRUD CHO HỘP PHÂN LOẠI & THUỘC TÍNH (KÉO THẢ MODE) ---
  const handleAddCategory = () => {
    const themeColors = ['blue', 'emerald', 'violet', 'amber', 'rose', 'cyan'];
    setCategories(prev => [
      ...prev,
      {
        id: `cat_${Date.now()}`,
        title: 'y = x^2 - 1',
        theme: themeColors[prev.length % themeColors.length],
        attributes: [
          'Thuộc tính đúng 1',
          'Thuộc tính đúng 2'
        ]
      }
    ]);
    soundFx.playClick();
  };

  const handleRemoveCategory = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
    soundFx.playClick();
  };

  const handleUpdateCategoryTitle = (id: string, title: string) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, title } : c));
  };

  const handleUpdateCategoryTheme = (id: string, theme: string) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, theme } : c));
  };

  const handleAddAttribute = (catId: string) => {
    setCategories(prev => prev.map(c => {
      if (c.id === catId) {
        return {
          ...c,
          attributes: [...c.attributes, `Thuộc tính đúng ${c.attributes.length + 1}`]
        };
      }
      return c;
    }));
    soundFx.playClick();
  };

  const handleRemoveAttribute = (catId: string, attrIdx: number) => {
    setCategories(prev => prev.map(c => {
      if (c.id === catId) {
        return {
          ...c,
          attributes: c.attributes.filter((_, idx) => idx !== attrIdx)
        };
      }
      return c;
    }));
    soundFx.playClick();
  };

  const handleUpdateAttribute = (catId: string, attrIdx: number, val: string) => {
    setCategories(prev => prev.map(c => {
      if (c.id === catId) {
        const nextAttrs = [...c.attributes];
        nextAttrs[attrIdx] = val;
        return { ...c, attributes: nextAttrs };
      }
      return c;
    }));
  };

  // --- SMART TEXT PARSER (Nhận diện đề bài văn bản thô / Word / 2 Cột) ---
  const handleParseRawText = () => {
    if (!rawTextToParse.trim()) {
      alert('Vui lòng dán nội dung vào khung!');
      return;
    }

    try {
      if (isDragDropMode) {
        // Phân tích văn bản 2 cột cho game Kéo Thả
        const parsedCats = parseDragDropFromText(rawTextToParse);
        if (parsedCats.length > 0) {
          setCategories(prev => [...prev, ...parsedCats]);
          setShowPasteModal(false);
          setRawTextToParse('');
          soundFx.playCorrect();
          alert(`🎉 Phân tích thành công ${parsedCats.length} hộp phân loại và các thuộc tính! Đã nạp vào bảng.`);
        } else {
          alert('Không nhận diện được định dạng Kéo Thả. Thầy vui lòng định dạng: Cột 1: Tên hộp / Phương trình, Cột 2: Các thuộc tính phân tách bằng dấu chấm phẩy ; hoặc dấu phẩy!');
        }
      } else {
        // Phân tích trắc nghiệm A, B, C, D cho các game khác
        const parsedList: Question[] = [];
        const blocks = rawTextToParse.split(/(?:^|\n)(?:Câu\s+\d+|[0-9]{1,3}\.)[:.]?/gi).filter(b => b.trim().length > 0);

        blocks.forEach((block, idx) => {
          const lines = block.trim().split('\n').map(l => l.trim()).filter(Boolean);
          if (lines.length === 0) return;

          let questionText = lines[0];
          let options = ['A', 'B', 'C', 'D'];
          let correctIndex = 0;
          let explanation = '';
          const fullBlock = lines.join(' ');

          const solMatch = fullBlock.match(/(?:Lời giải|Giải thích|Hướng dẫn)[:\s]+([\s\S]*)$/i);
          if (solMatch) explanation = solMatch[1].trim();

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
      }
    } catch (e: any) {
      alert(`Lỗi phân tích: ${e?.message}`);
    }
  };

  // --- SMART IMPORT WORD (.DOCX) & EXCEL (.XLSX) THEO MẪU 2 CỘT ---
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

      if (isDragDropMode) {
        const parsedCats = parseDragDropFromText(rawText);
        if (parsedCats.length > 0) {
          setCategories(prev => [...prev, ...parsedCats]);
          soundFx.playCorrect();
          alert(`🎉 ĐÃ NHẬP THÀNH CÔNG ${parsedCats.length} HỘP PHÂN LOẠI & THUỘC TÍNH TỪ FILE:\n"${file.name}"!\n\nToàn bộ công thức toán học TeX đã được chuẩn hóa KaTeX tự động.`);
        } else {
          // Thử chuyển đổi từ câu hỏi trắc nghiệm nếu file có dạng cũ
          const parsedQuestions = parseDocumentQuestions(rawText, gameTitle);
          if (parsedQuestions.length > 0) {
            const convertedCats: DragDropCategory[] = parsedQuestions.map((q, idx) => ({
              id: `cat_${idx + 1}`,
              title: q.question,
              theme: ['blue', 'emerald', 'violet', 'amber', 'rose', 'cyan'][idx % 6],
              attributes: q.options || []
            }));
            setCategories(prev => [...prev, ...convertedCats]);
            soundFx.playCorrect();
            alert(`🎉 ĐÃ NHẬP THÀNH CÔNG ${convertedCats.length} HỘP PHÂN LOẠI TỪ FILE "${file.name}"!`);
          } else {
            throw new Error('Không bóc tách được dữ liệu phân loại hợp lệ từ file.');
          }
        }
      } else {
        const parsedQuestions = parseDocumentQuestions(rawText, gameTitle);
        if (parsedQuestions.length === 0) {
          throw new Error('Không bóc tách được câu hỏi hoặc cấu trúc ghép đôi hợp lệ từ file.');
        }
        setQuestions(prev => [...prev, ...parsedQuestions]);
        soundFx.playCorrect();
        alert(`🎉 ĐÃ NHẬP THÀNH CÔNG ${parsedQuestions.length} CÂU HỎI TỪ FILE:\n"${file.name}"!`);
      }
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
    const { id, field, optIndex, attrIndex } = activeTarget;

    if (field === 'category_title') {
      setCategories(prev => prev.map(c => c.id === id ? { ...c, title: c.title + snippet } : c));
    } else if (field === 'category_attribute' && typeof attrIndex === 'number') {
      setCategories(prev => prev.map(c => {
        if (c.id !== id) return c;
        const nextAttrs = [...c.attributes];
        nextAttrs[attrIndex] = (nextAttrs[attrIndex] || '') + snippet;
        return { ...c, attributes: nextAttrs };
      }));
    } else if (field === 'question') {
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
    const { id, field, optIndex, attrIndex } = activeTarget;

    if (field === 'category_title') {
      setCategories(prev => prev.map(c => c.id === id ? { ...c, title: c.title.slice(0, -1) } : c));
    } else if (field === 'category_attribute' && typeof attrIndex === 'number') {
      setCategories(prev => prev.map(c => {
        if (c.id !== id) return c;
        const nextAttrs = [...c.attributes];
        nextAttrs[attrIndex] = (nextAttrs[attrIndex] || '').slice(0, -1);
        return { ...c, attributes: nextAttrs };
      }));
    } else if (field === 'question') {
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
    const { id, field, optIndex, attrIndex } = activeTarget;

    if (field === 'category_title') {
      const cat = categories.find(c => c.id === id);
      return cat ? cat.title : '';
    }
    if (field === 'category_attribute' && typeof attrIndex === 'number') {
      const cat = categories.find(c => c.id === id);
      return cat ? (cat.attributes[attrIndex] || '') : '';
    }
    const q = questions.find(item => item.id === id);
    if (!q) return '';
    if (field === 'question') return q.question;
    if (field === 'explanation') return q.explanation || '';
    if (field === 'option' && typeof optIndex === 'number') return q.options[optIndex] || '';
    return '';
  };

  // --- CRUD CÂU HỎI TRẮC NGHIỆM TIÊU CHUẨN ---
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
    if (isDragDropMode) {
      if (categories.length === 0) {
        if (!confirm('Chưa có hộp phân loại nào. Trò chơi sẽ chạy bằng ngân hàng chuyên đề mặc định. Bạn có muốn tiếp tục?')) {
          return;
        }
      }
      // Đồng bộ sang Question[] để tương thích toàn hệ thống
      const mappedQuestions: Question[] = categories.map((cat, idx) => {
        const opts = [...cat.attributes];
        while (opts.length < 4) {
          opts.push(`Thuộc tính mở rộng ${opts.length + 1}`);
        }
        return {
          id: cat.id || `q_cat_${idx + 1}`,
          question: normalizeMathFormulas(cat.title),
          options: opts.slice(0, 4).map(o => normalizeMathFormulas(o)) as [string, string, string, string],
          correctIndex: 0,
          explanation: cat.attributes.map(a => normalizeMathFormulas(a)).join('; '),
          difficulty: idx === 0 ? 'Dễ' : (idx < 3 ? 'Trung bình' : 'Khó'),
          topic: gameTitle,
          source: gameTitle,
          status: 'published',
          createdAt: new Date().toISOString()
        };
      });

      soundFx.playCorrect();
      onSave(tool.id, mappedQuestions, gameTitle, categories);
    } else {
      if (questions.length === 0) {
        if (!confirm('Bộ câu hỏi hiện đang trống. Trò chơi sẽ chạy bằng ngân hàng câu hỏi mặc định. Bạn có muốn tiếp tục?')) {
          return;
        }
      }
      soundFx.playCorrect();
      onSave(tool.id, questions, gameTitle);
    }
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
      description: `Trò chơi ${currentTemplate.name} với dữ liệu tùy chỉnh.`,
      isActive: true,
      createdAt: new Date().toISOString(),
      customQuestions: questions,
      customDragDrop: isDragDropMode ? categories : undefined
    };
    onDuplicateAsNewGame(newTool);
    soundFx.playCorrect();
    alert(`🎉 Đã tạo thành công trò chơi mới "${newTool.name}" trong danh mục Trò chơi học tập!`);
    onClose();
  };

  // --- HÀNH ĐỘNG 3: XUẤT FILE HTML TRÒ CHƠI ĐỘC LẬP 1 NÚT BẤM (STANDALONE HTML) ---
  const handleExportStandaloneHTML = async () => {
    if (isDragDropMode && categories.length === 0) {
      alert('Vui lòng thêm ít nhất 1 hộp phân loại trước khi xuất file!');
      return;
    }
    if (!isDragDropMode && questions.length === 0) {
      alert('Vui lòng thêm ít nhất 1 câu hỏi trước khi xuất file!');
      return;
    }

    setIsExporting(true);
    soundFx.playClick();

    try {
      // Chạy Data Adapter Engine tự động phân tích và nhúng dữ liệu kèm Security Gate
      const htmlString = await exportStandaloneGameHTML({
        templateUrl: selectedTemplateUrl,
        gameTitle: gameTitle,
        teacherName: 'LỚP TOÁN THẦY HÙNG',
        questions: questions,
        customCategories: isDragDropMode ? categories : undefined
      });

      // Tải tệp xuống máy tính
      const safeFilename = `${gameTitle.toLowerCase().replace(/[^a-z0-9]/gi, '_')}_custom.html`;
      downloadFile(htmlString, safeFilename, 'text/html');

      soundFx.playCorrect();
      alert(`⚡ XUẤT FILE THÀNH CÔNG!\n\nĐã tải xuống file: ${safeFilename}\n\nThầy có thể:\n1. Mở trực tiếp trên máy tính để chơi ngay.\n2. Kéo thả file này đè lên Vercel để cập nhật vĩnh viễn!\n(Nút Quản trị ⚙️ được tự động khóa bảo mật, chỉ hiện khi thêm ?role=admin).`);
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
                  {isDragDropMode ? 'Drag & Drop Engine' : 'Pro Engine v3.8'}
                </span>
              </div>
              <p className="text-xs text-violet-200/80 font-medium mt-0.5">
                {isDragDropMode 
                  ? 'Quản trị Hộp Phân Loại (Category) & Nhãn Thuộc Tính Đúng chuẩn kiến trúc Game Kéo Thả'
                  : 'Tự động đóng gói câu hỏi, chuyển đổi cấu trúc (Data Adapter) và xuất bản game độc lập'}
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

        {/* QUY TRÌNH 3 BƯỚC TẠO GAME TỰ ĐỘNG (WORDWALL MODEL) */}
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-3">
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-violet-600 text-white flex items-center justify-center text-[10px] font-black">1</span>
                <span>BƯỚC 1: Đặt Tên Trò Chơi / Chuyên Đề Mới</span>
              </label>
              <input
                type="text"
                value={gameTitle}
                onChange={(e) => setGameTitle(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:border-violet-600 focus:ring-2 focus:ring-violet-200 outline-none"
                placeholder="VD: Kéo Thả Đơn Điệu & Cực Trị..."
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-violet-600 text-white flex items-center justify-center text-[10px] font-black">2</span>
                <span>BƯỚC 2: Chọn Dạng Trò Chơi (23 Mẫu Game)</span>
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
          </div>

          <div className="text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black">3</span>
              <span className="font-bold text-slate-800">BƯỚC 3:</span>
              <span className="font-medium text-slate-600">Tải file đề bài (Word/Excel 2 cột) ➔ Hệ thống tự bóc tách ➔ Bấm</span>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-black text-[11px]">⚡ XUẤT FILE HTML</span>
              <span className="font-medium text-slate-600">là hoàn thành!</span>
            </div>
            <span className="font-mono text-[11px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
              Engine: {currentTemplate.file}
            </span>
          </div>
        </div>

        {/* THANH CÔNG CỤ SOẠN & NHẬP DỮ LIỆU */}
        <div className="flex gap-2 p-3 sm:p-4 border-b border-slate-200 bg-white items-center flex-wrap">
          {/* NÚT TẢI FILE MẪU WORD (.DOCX) CHUẨN 2 CỘT */}
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
            title="Tải file Word (.docx) mẫu chuẩn 2 cột: Cột 1: Tên hộp/Phương trình, Cột 2: Các thuộc tính đúng"
          >
            <FileDown className="w-4 h-4 text-blue-600" />
            <span>📥 Tải File Word (.docx) Mẫu</span>
          </button>

          {/* NÚT TẢI FILE MẪU EXCEL (.XLSX) CHUẨN 2 CỘT */}
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
            title="Tải file Excel (.xlsx) mẫu chuẩn 2 cột: Cột 1: Tên hộp/Phương trình, Cột 2: Các thuộc tính đúng"
          >
            <FileDown className="w-4 h-4 text-emerald-600" />
            <span>📥 Tải File Excel (.xlsx) Mẫu</span>
          </button>
          
          {/* NÚT NHẬP WORD / EXCEL */}
          <label className={`px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-1.5 cursor-pointer border shadow-2xs ${
            isParsingDoc 
              ? 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse' 
              : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
          }`}>
            {isParsingDoc ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4 text-indigo-600" />}
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

          {/* BẬT BÀN PHÍM CÔNG THỨC TOÁN HỌC ẢO */}
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

          {/* DÁN ĐỀ BÀI NHANH */}
          <button 
            onClick={() => setShowPasteModal(true)} 
            className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-1.5 border border-purple-200 cursor-pointer shadow-2xs"
            title="Dán nhanh nội dung 2 cột hoặc văn bản để hệ thống tự động bóc tách"
          >
            <FileText className="w-4 h-4" /> Dán dữ liệu nhanh (Parser)
          </button>

          {/* NÚT THÊM NỘI DUNG MỚI */}
          {isDragDropMode ? (
            <button 
              onClick={handleAddCategory} 
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-1.5 shadow-sm shadow-cyan-200 ml-auto cursor-pointer"
            >
              <Plus className="w-4 h-4" /> + Thêm Hộp Phân Loại
            </button>
          ) : (
            <>
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
            </>
          )}
        </div>

        {/* THÂN BẢNG SOẠN THẢO */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-slate-50 space-y-4 custom-scrollbar">
          {/* CHẾ ĐỘ 1: KÉO THẢ PHÂN LOẠI THUỘC TÍNH (CATEGORY & ATTRIBUTES) */}
          {isDragDropMode ? (
            categories.length === 0 ? (
              <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border-2 border-dashed border-slate-200 p-8">
                <Sparkles className="w-12 h-12 text-cyan-400 mx-auto mb-3" />
                <p className="font-bold text-base text-slate-700">Chưa có Hộp Phân Loại nào</p>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  Thầy hãy bấm <b>"+ Thêm Hộp Phân Loại"</b>, <b>"Nhập Word / Excel"</b> hoặc <b>"Dán dữ liệu nhanh"</b> để tạo các cặp hộp phân loại và thuộc tính!
                </p>
              </div>
            ) : (
              categories.map((cat, cIdx) => (
                <div key={cat.id || cIdx} className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-slate-200 shadow-sm relative hover:border-cyan-400 transition-all">
                  <div className="flex items-center justify-between mb-3 border-b pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-xs px-2.5 py-1 rounded-lg bg-cyan-100 text-cyan-800 uppercase tracking-wide">
                        HỘP {cIdx + 1}
                      </span>
                      <select
                        value={cat.theme || 'blue'}
                        onChange={(e) => handleUpdateCategoryTheme(cat.id, e.target.value)}
                        className="text-xs font-bold px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 outline-none cursor-pointer"
                      >
                        <option value="blue">🎨 Màu: Xanh Dương (Blue)</option>
                        <option value="emerald">🎨 Màu: Xanh Ngọc (Emerald)</option>
                        <option value="violet">🎨 Màu: Tím (Violet)</option>
                        <option value="amber">🎨 Màu: Vàng Cam (Amber)</option>
                        <option value="rose">🎨 Màu: Hồng Đỏ (Rose)</option>
                        <option value="cyan">🎨 Màu: Lam Sáng (Cyan)</option>
                      </select>
                    </div>

                    <button
                      onClick={() => handleRemoveCategory(cat.id)}
                      className="p-1.5 text-slate-300 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition cursor-pointer"
                      title="Xóa hộp này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* TÊN HỘP / PHƯƠNG TRÌNH */}
                  <div className="mb-4">
                    <label className="block text-xs font-black text-slate-700 mb-1">
                      Tên Hộp / Phương Trình / Khái Niệm:
                    </label>
                    <input
                      type="text"
                      value={cat.title}
                      onChange={(e) => handleUpdateCategoryTitle(cat.id, e.target.value)}
                      onFocus={() => {
                        setActiveTarget({
                          id: cat.id,
                          field: 'category_title',
                          fieldName: `Hộp ${cIdx + 1}: Tên Hộp / Phương Trình`
                        });
                        setShowKeyboard(true);
                      }}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:border-cyan-500 focus:bg-white outline-none font-mono"
                      placeholder="VD: y = x^3 - 3x hoặc f(x) = ... (hỗ trợ TeX \frac, \sqrt)"
                    />
                    <MathLivePreview formula={cat.title} />
                  </div>

                  {/* DANH SÁCH THUỘC TÍNH ĐÚNG */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black text-slate-600 uppercase tracking-wide">
                        Các Nhãn Thuộc Tính Đúng Thuộc Về Hộp Này ({cat.attributes.length}):
                      </span>
                      <button
                        onClick={() => handleAddAttribute(cat.id)}
                        className="text-xs font-bold text-cyan-600 hover:text-cyan-700 flex items-center gap-1 cursor-pointer bg-cyan-50 px-2 py-1 rounded-lg border border-cyan-200"
                      >
                        <Plus className="w-3.5 h-3.5" /> Thêm thuộc tính
                      </button>
                    </div>

                    <div className="space-y-2">
                      {cat.attributes.map((attr, aIdx) => (
                        <div key={aIdx} className="flex flex-col bg-slate-50 p-2 rounded-xl border border-slate-200">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200 shrink-0">
                              #{aIdx + 1}
                            </span>
                            <input
                              type="text"
                              value={attr}
                              onChange={(e) => handleUpdateAttribute(cat.id, aIdx, e.target.value)}
                              onFocus={() => {
                                setActiveTarget({
                                  id: cat.id,
                                  field: 'category_attribute',
                                  attrIndex: aIdx,
                                  fieldName: `Hộp ${cIdx + 1} - Thuộc tính #${aIdx + 1}`
                                });
                                setShowKeyboard(true);
                              }}
                              className="flex-1 p-1.5 text-xs text-slate-800 bg-white border border-slate-300 rounded-lg outline-none focus:border-cyan-500 font-medium"
                              placeholder="Nhập nội dung thuộc tính đúng..."
                            />
                            <button
                              onClick={() => handleRemoveAttribute(cat.id, aIdx)}
                              className="text-slate-300 hover:text-rose-500 p-1 rounded hover:bg-white transition"
                              title="Xóa thuộc tính này"
                            >
                              ✕
                            </button>
                          </div>
                          <MathLivePreview formula={attr} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )
          ) : (
            /* CHẾ ĐỘ 2: TRẮC NGHIỆM TIÊU CHUẨN (A, B, C, D CHO CÁC GAME KHÁC) */
            questions.length === 0 ? (
              <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border-2 border-dashed border-slate-200 p-8">
                <Sparkles className="w-12 h-12 text-violet-300 mx-auto mb-3" />
                <p className="font-bold text-base text-slate-600">Chưa có câu hỏi tùy chỉnh nào</p>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  Thầy có thể bấm <b>"Dán dữ liệu nhanh"</b>, <b>"Nhập Word / Excel"</b> hoặc <b>"+ Thêm câu hỏi"</b> để thiết kế bộ câu hỏi riêng!
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
                    <MathLivePreview formula={q.question} />
                  </div>

                  {/* 4 PHƯƠNG ÁN LỰA CHỌN */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3">
                    {q.options.map((opt, oIdx) => {
                      const isCorrect = q.correctIndex === oIdx;
                      return (
                        <div 
                          key={oIdx} 
                          className={`flex items-center gap-2 p-2 rounded-xl border transition ${
                            isCorrect 
                              ? 'bg-emerald-50/70 border-emerald-400 ring-2 ring-emerald-100' 
                              : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => handleUpdate(q.id, 'correctIndex', oIdx)}
                            className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs transition cursor-pointer shrink-0 ${
                              isCorrect 
                                ? 'bg-emerald-600 text-white shadow-sm' 
                                : 'bg-white border-2 border-slate-300 text-slate-400 hover:border-emerald-400'
                            }`}
                          >
                            {String.fromCharCode(65 + oIdx)}
                          </button>
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
            )
          )}
        </div>

        {/* FOOTER ĐIỀU KHIỂN & 2 NÚT HÀNH ĐỘNG 1 BẤM */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-white flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="text-xs text-slate-500 font-bold">
            {isDragDropMode ? (
              <>Tổng cộng: <span className="text-cyan-700 text-sm font-black">{categories.length}</span> hộp phân loại ({categories.reduce((acc, c) => acc + c.attributes.length, 0)} thuộc tính)</>
            ) : (
              <>Tổng cộng: <span className="text-violet-700 text-sm font-black">{questions.length}</span> câu hỏi đã cấu hình</>
            )}
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
                  <span>{isDragDropMode ? 'Dán Dữ Liệu 2 Cột Kéo Thả (Smart Parser)' : 'Dán Đề Bài Văn Bản Thô (Smart Parser)'}</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isDragDropMode 
                    ? 'Tự động nhận diện Hộp Phân Loại và Thuộc Tính từ dữ liệu 2 cột hoặc dấu chấm phẩy ;'
                    : 'Tự động nhận diện câu hỏi trắc nghiệm từ file Word, văn bản hoặc tài liệu có sẵn.'}
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
              {isDragDropMode ? (
                <code className="text-violet-800 font-mono">
                  y = x^3 - 3x ; Đạt cực đại tại x = -1 ; Đạt cực tiểu tại x = 1 ; Đồng biến trên (1; +\infty)<br />
                  y = x^4 - 2x^2 ; Có 3 điểm cực trị ; Đạt cực đại tại x = 0
                </code>
              ) : (
                <code className="text-violet-800 font-mono">
                  Câu 1. Tìm khẳng định đúng?<br />
                  A. *cos80 &gt; 0 &nbsp;&nbsp; B. cos80 &lt; 0 &nbsp;&nbsp; C. tan80 &lt; 0 &nbsp;&nbsp; D. cot80 &lt; 0<br />
                  Lời giải: Chọn A...
                </code>
              )}
            </div>

            <textarea
              rows={10}
              value={rawTextToParse}
              onChange={(e) => setRawTextToParse(e.target.value)}
              placeholder={isDragDropMode ? "Dán dữ liệu 2 cột (Tên hộp ; Các thuộc tính)..." : "Dán nội dung câu hỏi từ Word / Text vào đây..."}
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
                <CheckCircle2 className="w-4 h-4" /> Phân Tích & Nạp Vào Bảng
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
