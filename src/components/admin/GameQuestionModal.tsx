import React, { useState, useRef, useMemo } from 'react';
import { TeachingTool, Question, Difficulty, DragDropCategory, DragDropTableRow } from '../../types';
import { X, FileUp, Plus, Trash2, Save, FileDown, Sparkles, Download, Shuffle, FileText, CheckCircle2, Calculator, Loader2, Edit3, FolderPlus, FolderMinus } from 'lucide-react';
import { soundFx } from '../../utils/sound';
import { GAME_TEMPLATES, exportStandaloneGameHTML, downloadFile } from '../../utils/gameExporter';
import { VirtualMathKeyboard } from '../common/VirtualMathKeyboard';
import { 
  extractTextFromDocx, 
  extractTextFromExcel, 
  parseDocumentQuestions, 
  parseDragDropFromText,
  parseDragDropFromExcel,
  parseDragDropFromDocx,
  parseChienHaoFromDocx,
  parseChienHaoFromExcel,
  parseSutPenFromDocx,
  parseSutPenFromExcel,
  parseBanChimFromDocx,
  parseBanChimFromExcel,
  parseYogaFromDocx,
  parseYogaFromExcel,
  parsePikachuFromDocx,
  parsePikachuFromExcel,
  parseCaNguaFromDocx,
  parseCaNguaFromExcel,
  parseTetrisFromDocx,
  parseTetrisFromExcel,
  parseMarioFromDocx,
  parseMarioFromExcel,
  parseHaiTaoFromDocx,
  parseHaiTaoFromExcel,
  normalizeMathFormulas, 
  downloadWordTemplate, 
  downloadExcelTemplate,
  downloadGameWordTemplate,
  downloadGameExcelTemplate,
  downloadCaNguaWordTemplate,
  downloadCaNguaExcelTemplate,
  downloadTetrisWordTemplate,
  downloadTetrisExcelTemplate,
  downloadMarioWordTemplate,
  downloadMarioExcelTemplate,
  downloadHaiTaoWordTemplate,
  downloadHaiTaoExcelTemplate,
  downloadPikachuWordTemplate,
  downloadPikachuExcelTemplate,
  parseTraiTimFromDocx,
  parseTraiTimFromExcel,
  downloadTraiTimWordTemplate
} from '../../utils/documentParser';

// Bộ xem trước công thức KaTeX thời gian thực
const MathLivePreview: React.FC<{ formula: string }> = ({ formula }) => {
  if (!formula || !formula.trim()) return null;
  let html = '';
  if (typeof window !== 'undefined' && (window as any).katex) {
    try {
      let clean = formula.replace(/\\f\\f/g, '').replace(/\\f/g, '');
      clean = clean.replace(/[\u000c\x0c]/g, '');
      clean = clean.replace(/(?:^|[^\\])\brac\s*\{/g, (m) => m.replace('rac{', '\\frac{'));
      clean = clean.replace(/^rac\s*\{/g, '\\frac{');
      clean = clean.replace(/\bN\s+ếu\b/g, 'Nếu').replace(/\bH\s+ai\b/g, 'Hai').replace(/\bC\s+ho\b/g, 'Cho').replace(/\bC\s+ả\b/g, 'Cả').replace(/\bK\s+hi\b/g, 'Khi').replace(/\bC\s+hỉ\b/g, 'Chỉ').replace(/\bT\s+ính\b/g, 'Tính').replace(/\bT\s+rong\b/g, 'Trong').replace(/\bK\s+hẳng\b/g, 'Khẳng').replace(/\bđ\s+ịnh\b/g, 'định').replace(/\bH\s+ình\b/g, 'Hình').replace(/\bM\s+ặt\b/g, 'Mặt').replace(/\bđ\s+ường\b/g, 'đường').replace(/Hai\s+m\s+ặt\s+ph\s+ẳng/g, 'Hai mặt phẳng');
      clean = clean.replace(/\bAcupB\b/g, 'A \\cup B').replace(/\bAcapB\b/g, 'A \\cap B').replace(/(?<!\\)\bcdot\b/g, '\\cdot').replace(/(?<!\\)\bOmega\b/g, '\\Omega').replace(/(?<!\\)\bemptyset\b/g, '\\emptyset');
      clean = clean.replace(/e\^\(([^)]+)\)/g, 'e^{$1}').replace(/e\^\{([^}]+)\}/g, 'e^{$1}').replace(/e\^([a-zA-Z0-9]+)/g, 'e^{$1}');
      clean = clean.replace(/([a-zA-Z0-9\)])\^\(([^)]+)\)/g, '$1^{$2}').replace(/([a-zA-Z0-9\)])\^\{([^}]+)\}/g, '$1^{$2}').replace(/([a-zA-Z0-9\)])\^([a-zA-Z0-9]+)/g, '$1^{$2}');
      clean = clean.replace(/^\\\(/, '').replace(/\\\)$/, '').replace(/^\$/, '').replace(/\$$/, '');
      html = (window as any).katex.renderToString(clean, { throwOnError: false });
    } catch (e) {}
  }
  return (
    <div className="mt-1 px-2.5 py-1 bg-cyan-950/40 border border-cyan-500/30 rounded-lg flex items-center gap-2">
      <span className="text-[10px] uppercase font-bold text-cyan-400 shrink-0">Hiển thị KaTeX:</span>
      {html ? (
        <span className="text-xs text-cyan-200 whitespace-nowrap inline-block" dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <span className="text-xs font-mono text-cyan-200 font-bold whitespace-nowrap inline-block">{formula}</span>
      )}
    </div>
  );
};

interface GameQuestionModalProps {
  tool: TeachingTool;
  onClose: () => void;
  onSave: (toolId: string, questions: Question[], newToolName?: string, customDragDrop?: DragDropCategory[], customDragDropRows?: DragDropTableRow[]) => void;
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

  // Nhận diện chế độ Kéo Thả, Bảo Vệ Chiến Hào, Sút Penalty, Bắn Chim, Yoga Vận Động, Ghép Cặp Trái Tim, Pikachu, Cờ Cá Ngựa & Tetris
  const isDragDropMode = selectedTemplateUrl.includes('keo-tha');
  const isChienHaoMode = selectedTemplateUrl.includes('chien-hao') || selectedTemplateUrl.includes('Bao-ve-chien-hao');
  const isSutPenMode = selectedTemplateUrl.includes('sut-pen') || selectedTemplateUrl.includes('penalty');
  const isBanChimMode = selectedTemplateUrl.includes('ban-chim') || selectedTemplateUrl.includes('bird');
  const isYogaMode = selectedTemplateUrl.includes('yoga');
  const isTraiTimMode = selectedTemplateUrl.includes('trai-tim') || selectedTemplateUrl.includes('trai_tim') || selectedTemplateUrl.includes('traitim') || selectedTemplateUrl.includes('heart');
  const isPikachuMode = (selectedTemplateUrl.includes('pikachu') || selectedTemplateUrl.includes('ghep-cap')) && !isTraiTimMode;
  const isCaNguaMode = selectedTemplateUrl.includes('ca-ngua') || selectedTemplateUrl.includes('ca_ngua') || selectedTemplateUrl.includes('ngua');
  const isTetrisMode = selectedTemplateUrl.includes('tetris') || selectedTemplateUrl.includes('Gametetris');
  const isMarioMode = selectedTemplateUrl.includes('mario') || selectedTemplateUrl.includes('Gamemario');
  const isHaiTaoMode = selectedTemplateUrl.includes('hai-tao') || selectedTemplateUrl.includes('hai_tao') || selectedTemplateUrl.includes('haitao') || selectedTemplateUrl.includes('apple');
  const [chienHaoLevelFilter, setChienHaoLevelFilter] = useState<'ALL' | 'Dễ' | 'Trung bình' | 'Khó'>('ALL');
  const [sutPenLevelFilter, setSutPenLevelFilter] = useState<'ALL' | 'Dễ' | 'Trung bình' | 'Khó'>('ALL');
  const [banChimLevelFilter, setBanChimLevelFilter] = useState<'ALL' | 'Dễ' | 'Trung bình' | 'Khó'>('ALL');
  const [yogaFilter, setYogaFilter] = useState<'ALL' | 'MC' | 'TF' | 'Dễ' | 'Trung bình' | 'Khó'>('ALL');
  const [traiTimLevelFilter, setTraiTimLevelFilter] = useState<string>('ALL');
  const [pikachuLevelFilter, setPikachuLevelFilter] = useState<'ALL' | 'Dễ' | 'Trung bình' | 'Khó'>('ALL');
  const [caNguaFilter, setCaNguaFilter] = useState<'ALL' | 'MC' | 'TF' | 'Dễ' | 'Trung bình' | 'Khó'>('ALL');
  const [tetrisFilter, setTetrisFilter] = useState<'ALL' | 'MC' | 'TF' | 'SHORT' | 'Dễ' | 'Trung bình' | 'Khó'>('ALL');
  const [marioFilter, setMarioFilter] = useState<'ALL' | 'MC' | 'TF' | 'SHORT' | 'Dễ' | 'Trung bình' | 'Khó'>('ALL');
  const [haiTaoFilter, setHaiTaoFilter] = useState<'ALL' | 'MC' | 'TF' | 'SHORT' | 'Dễ' | 'Trung bình' | 'Khó'>('ALL');

  const traiTimLevels = useMemo(() => {
    const set = new Set<string>();
    questions.forEach(q => {
      if (q.topic && q.topic.trim()) set.add(q.topic.trim());
    });
    return Array.from(set);
  }, [questions]);

  const chienHaoCounts = useMemo(() => {
    return {
      easy: questions.filter(q => q.difficulty === 'Dễ').length,
      medium: questions.filter(q => q.difficulty === 'Trung bình').length,
      hard: questions.filter(q => q.difficulty === 'Khó').length
    };
  }, [questions]);

  const banChimCounts = useMemo(() => {
    return {
      easy: questions.filter(q => q.difficulty === 'Dễ').length,
      medium: questions.filter(q => q.difficulty === 'Trung bình').length,
      hard: questions.filter(q => q.difficulty === 'Khó').length
    };
  }, [questions]);

  const yogaCounts = useMemo(() => {
    return {
      mc: questions.filter(q => (q.options || []).length > 2).length,
      tf: questions.filter(q => (q.options || []).length === 2).length,
      easy: questions.filter(q => q.difficulty === 'Dễ').length,
      medium: questions.filter(q => q.difficulty === 'Trung bình').length,
      hard: questions.filter(q => q.difficulty === 'Khó').length
    };
  }, [questions]);

  const pikachuCounts = useMemo(() => {
    return {
      easy: questions.filter(q => q.difficulty === 'Dễ').length,
      medium: questions.filter(q => q.difficulty === 'Trung bình').length,
      hard: questions.filter(q => q.difficulty === 'Khó').length
    };
  }, [questions]);

  const caNguaCounts = useMemo(() => {
    return {
      mc: questions.filter(q => (q.options || []).length > 2 && !q.question.startsWith('ĐÚNG HAY SAI:')).length,
      tf: questions.filter(q => (q.options || []).length === 2 || q.question.startsWith('ĐÚNG HAY SAI:')).length,
      easy: questions.filter(q => q.difficulty === 'Dễ').length,
      medium: questions.filter(q => q.difficulty === 'Trung bình').length,
      hard: questions.filter(q => q.difficulty === 'Khó').length
    };
  }, [questions]);

  const tetrisCounts = useMemo(() => {
    return {
      mc: questions.filter(q => (q.options || []).length > 2 && !q.question.startsWith('ĐÚNG HAY SAI:')).length,
      tf: questions.filter(q => (q.options || []).length === 2 || q.question.startsWith('ĐÚNG HAY SAI:')).length,
      short: questions.filter(q => (q.options || []).length === 1 || (q as any).type === 'short_answer').length,
      easy: questions.filter(q => q.difficulty === 'Dễ').length,
      medium: questions.filter(q => q.difficulty === 'Trung bình').length,
      hard: questions.filter(q => q.difficulty === 'Khó').length
    };
  }, [questions]);

  const marioCounts = useMemo(() => {
    return {
      mc: questions.filter(q => (q.options || []).length > 2 && !q.question.startsWith('ĐÚNG HAY SAI:')).length,
      tf: questions.filter(q => (q.options || []).length === 2 || q.question.startsWith('ĐÚNG HAY SAI:')).length,
      short: questions.filter(q => (q.options || []).length === 1 || (q as any).type === 'short_answer').length,
      easy: questions.filter(q => q.difficulty === 'Dễ').length,
      medium: questions.filter(q => q.difficulty === 'Trung bình').length,
      hard: questions.filter(q => q.difficulty === 'Khó').length
    };
  }, [questions]);

  const haiTaoCounts = useMemo(() => {
    return {
      mc: questions.filter(q => (q.options || []).length > 2 && !q.question.startsWith('ĐÚNG HAY SAI:')).length,
      tf: questions.filter(q => (q.options || []).length === 2 || q.question.startsWith('ĐÚNG HAY SAI:')).length,
      short: questions.filter(q => (q.options || []).length === 1 || (q as any).type === 'short_answer').length,
      easy: questions.filter(q => q.difficulty === 'Dễ').length,
      medium: questions.filter(q => q.difficulty === 'Trung bình').length,
      hard: questions.filter(q => q.difficulty === 'Khó').length
    };
  }, [questions]);

  const displayedQuestions = useMemo(() => {
    if (isChienHaoMode && chienHaoLevelFilter !== 'ALL') {
      return questions.filter(q => q.difficulty === chienHaoLevelFilter);
    }
    if (isSutPenMode && sutPenLevelFilter !== 'ALL') {
      return questions.filter(q => q.difficulty === sutPenLevelFilter);
    }
    if (isBanChimMode && banChimLevelFilter !== 'ALL') {
      return questions.filter(q => q.difficulty === banChimLevelFilter);
    }
    if (isYogaMode && yogaFilter !== 'ALL') {
      if (yogaFilter === 'MC') return questions.filter(q => (q.options || []).length > 2);
      if (yogaFilter === 'TF') return questions.filter(q => (q.options || []).length === 2);
      return questions.filter(q => q.difficulty === yogaFilter);
    }
    if (isTraiTimMode && traiTimLevelFilter !== 'ALL') {
      return questions.filter(q => (q.topic?.trim() || '') === traiTimLevelFilter);
    }
    if (isPikachuMode && pikachuLevelFilter !== 'ALL') {
      return questions.filter(q => q.difficulty === pikachuLevelFilter);
    }
    if (isCaNguaMode && caNguaFilter !== 'ALL') {
      if (caNguaFilter === 'MC') return questions.filter(q => (q.options || []).length > 2 && !q.question.startsWith('ĐÚNG HAY SAI:'));
      if (caNguaFilter === 'TF') return questions.filter(q => (q.options || []).length === 2 || q.question.startsWith('ĐÚNG HAY SAI:'));
      return questions.filter(q => q.difficulty === caNguaFilter);
    }
    if (isTetrisMode && tetrisFilter !== 'ALL') {
      if (tetrisFilter === 'MC') return questions.filter(q => (q.options || []).length > 2 && !q.question.startsWith('ĐÚNG HAY SAI:'));
      if (tetrisFilter === 'TF') return questions.filter(q => (q.options || []).length === 2 || q.question.startsWith('ĐÚNG HAY SAI:'));
      if (tetrisFilter === 'SHORT') return questions.filter(q => (q.options || []).length === 1 || (q as any).type === 'short_answer');
      return questions.filter(q => q.difficulty === tetrisFilter);
    }
    if (isMarioMode && marioFilter !== 'ALL') {
      if (marioFilter === 'MC') return questions.filter(q => (q.options || []).length > 2 && !q.question.startsWith('ĐÚNG HAY SAI:'));
      if (marioFilter === 'TF') return questions.filter(q => (q.options || []).length === 2 || q.question.startsWith('ĐÚNG HAY SAI:'));
      if (marioFilter === 'SHORT') return questions.filter(q => (q.options || []).length === 1 || (q as any).type === 'short_answer');
      return questions.filter(q => q.difficulty === marioFilter);
    }
    if (isHaiTaoMode && haiTaoFilter !== 'ALL') {
      if (haiTaoFilter === 'MC') return questions.filter(q => (q.options || []).length > 2 && !q.question.startsWith('ĐÚNG HAY SAI:'));
      if (haiTaoFilter === 'TF') return questions.filter(q => (q.options || []).length === 2 || q.question.startsWith('ĐÚNG HAY SAI:'));
      if (haiTaoFilter === 'SHORT') return questions.filter(q => (q.options || []).length === 1 || (q as any).type === 'short_answer');
      return questions.filter(q => q.difficulty === haiTaoFilter);
    }
    return questions;
  }, [questions, isChienHaoMode, chienHaoLevelFilter, isSutPenMode, sutPenLevelFilter, isBanChimMode, banChimLevelFilter, isYogaMode, yogaFilter, isTraiTimMode, traiTimLevelFilter, isPikachuMode, pikachuLevelFilter, isCaNguaMode, caNguaFilter, isTetrisMode, tetrisFilter, isMarioMode, marioFilter, isHaiTaoMode, haiTaoFilter]);

  // Quản lý Bảng Phân Cấp Đa Chuyên Đề & Đa Cấp Độ (Hierarchical Table View)
  const [tableRows, setTableRows] = useState<DragDropTableRow[]>(() => {
    if (tool.customDragDropRows && tool.customDragDropRows.length > 0) {
      return tool.customDragDropRows;
    }
    if (tool.customDragDrop && tool.customDragDrop.length > 0) {
      return tool.customDragDrop.map((cat, idx) => ({
        id: cat.id || `row_${idx + 1}`,
        topic: 'Chuyên đề 1: Tính Đơn Điệu & Cực Trị',
        level: Math.floor(idx / 3) + 1,
        category: cat.title,
        title: cat.title,
        theme: cat.theme || ['blue', 'emerald', 'violet', 'amber', 'rose', 'cyan'][idx % 6],
        attributes: cat.attributes || []
      }));
    }
    return [
      {
        id: 'row_1',
        topic: 'Chuyên đề 1: Tính Đơn Điệu & Cực Trị',
        level: 1,
        category: 'y = x^3 - 3x',
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
        id: 'row_2',
        topic: 'Chuyên đề 1: Tính Đơn Điệu & Cực Trị',
        level: 1,
        category: 'y = -x^3 + 3x^2',
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
        id: 'row_3',
        topic: 'Chuyên đề 1: Tính Đơn Điệu & Cực Trị',
        level: 2,
        category: 'y = x^4 - 2x^2 + 1',
        title: 'y = x^4 - 2x^2 + 1',
        theme: 'violet',
        attributes: [
          'Hàm số có 3 điểm cực trị',
          'Hàm số đạt cực đại tại x = 0',
          'Hàm số có 2 điểm cực tiểu',
          'Hàm số đồng biến trên khoảng (-1; 0)'
        ]
      },
      {
        id: 'row_4',
        topic: 'Chuyên đề 2: Tiệm Cận & Khảo Sát Đồ Thị',
        level: 1,
        category: 'y = \\frac{2x+1}{x-1}',
        title: 'y = \\frac{2x+1}{x-1}',
        theme: 'amber',
        attributes: [
          'Tiệm cận đứng x = 1',
          'Tiệm cận ngang y = 2',
          'Nghịch biến trên từng khoảng xác định',
          'Hàm số không có cực trị'
        ]
      },
      {
        id: 'row_5',
        topic: 'Chuyên đề 2: Tiệm Cận & Khảo Sát Đồ Thị',
        level: 1,
        category: 'y = \\frac{x-2}{x+1}',
        title: 'y = \\frac{x-2}{x+1}',
        theme: 'rose',
        attributes: [
          'Tiệm cận đứng x = -1',
          'Tiệm cận ngang y = 1',
          'Đồng biến trên từng khoảng xác định',
          'Giao trục Oy tại (0; -2)'
        ]
      }
    ];
  });

  const [activeTopicFilter, setActiveTopicFilter] = useState<string>('ALL');

  // Danh sách các chuyên đề riêng biệt tự động co giãn từ dữ liệu
  const distinctTopics = useMemo(() => {
    const list: string[] = [];
    tableRows.forEach(r => {
      const t = r.topic?.trim();
      if (t && !list.includes(t)) list.push(t);
    });
    return list.length > 0 ? list : ['Chuyên đề 1: Tính Đơn Điệu & Cực Trị'];
  }, [tableRows]);

  // Bộ lọc hàng theo chuyên đề
  const filteredRows = useMemo(() => {
    if (activeTopicFilter === 'ALL') return tableRows;
    return tableRows.filter(r => r.topic === activeTopicFilter);
  }, [tableRows, activeTopicFilter]);

  // Backward compatibility categories
  const categories: DragDropCategory[] = useMemo(() => {
    return tableRows.map(r => ({
      id: r.id,
      title: r.category,
      theme: r.theme,
      attributes: r.attributes
    }));
  }, [tableRows]);

  const [activeTarget, setActiveTarget] = useState<{
    id: string;
    field: 'question' | 'explanation' | 'option' | 'row_category' | 'row_attribute' | 'row_topic';
    optIndex?: number;
    attrIndex?: number;
    fieldName: string;
  } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeInputElRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  // Auto-clear placeholder khi click/focus vào ô nhập liệu và khôi phục khi blur nếu trống
  const handleFieldFocus = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
    targetMeta: {
      id: string;
      field: 'question' | 'explanation' | 'option' | 'row_category' | 'row_attribute' | 'row_topic';
      optIndex?: number;
      attrIndex?: number;
      fieldName: string;
    }
  ) => {
    activeInputElRef.current = e.target;
    if (e.target.placeholder) {
      e.target.dataset.origPlaceholder = e.target.placeholder;
      e.target.placeholder = '';
    }
    setActiveTarget(targetMeta);
    setShowKeyboard(true);
  };

  const handleFieldBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!e.target.value && e.target.dataset.origPlaceholder) {
      e.target.placeholder = e.target.dataset.origPlaceholder;
    }
  };

  // Tìm template hiện tại
  const currentTemplate = GAME_TEMPLATES.find(t => t.file === selectedTemplateUrl) || GAME_TEMPLATES[0];

  // --- THAO TÁC QUẢN TRỊ CHUYÊN ĐỀ (TOPIC MANAGEMENT CRUD) ---
  const handleAddTopic = () => {
    const defaultName = `Chuyên đề ${distinctTopics.length + 1}: Chuyên Đề Mới`;
    const topicName = prompt('Nhập tên chuyên đề mới cần thêm:', defaultName);
    if (!topicName || !topicName.trim()) return;
    const trimmed = topicName.trim();
    if (distinctTopics.includes(trimmed)) {
      alert('Chuyên đề này đã tồn tại trong danh sách!');
      setActiveTopicFilter(trimmed);
      return;
    }
    const themeColors = ['blue', 'emerald', 'violet', 'amber', 'rose', 'cyan'];
    const newRow: DragDropTableRow = {
      id: `row_${Date.now()}`,
      topic: trimmed,
      level: 1,
      category: 'y = x^2 - 1',
      title: 'y = x^2 - 1',
      theme: themeColors[tableRows.length % themeColors.length],
      attributes: ['Thuộc tính 1 (Đúng)', 'Thuộc tính 2 (Đúng)']
    };
    setTableRows(prev => [...prev, newRow]);
    setActiveTopicFilter(trimmed);
    soundFx.playCorrect();
  };

  const handleDeleteTopic = (topicToDelete: string) => {
    if (distinctTopics.length <= 1) {
      alert('Trò chơi cần có ít nhất 1 chuyên đề để vận hành!');
      return;
    }
    if (!confirm(`Bạn có chắc chắn muốn xóa chuyên đề "${topicToDelete}" và toàn bộ ${tableRows.filter(r => r.topic === topicToDelete).length} hàng trong chuyên đề này?`)) return;
    setTableRows(prev => prev.filter(r => r.topic !== topicToDelete));
    setActiveTopicFilter('ALL');
    soundFx.playClick();
  };

  const handleRenameTopic = (oldTopic: string) => {
    const newName = prompt(`Nhập tên mới cho chuyên đề "${oldTopic}":`, oldTopic);
    if (!newName || !newName.trim() || newName === oldTopic) return;
    const trimmed = newName.trim();
    setTableRows(prev => prev.map(r => r.topic === oldTopic ? { ...r, topic: trimmed } : r));
    if (activeTopicFilter === oldTopic) setActiveTopicFilter(trimmed);
    soundFx.playClick();
  };

  // --- THAO TÁC QUẢN TRỊ HÀNG TRONG BẢNG (GRID ROW CRUD) ---
  const handleAddRow = (targetTopic?: string, targetLevel?: number) => {
    const topic = targetTopic || (activeTopicFilter !== 'ALL' ? activeTopicFilter : distinctTopics[0]);
    const themeColors = ['blue', 'emerald', 'violet', 'amber', 'rose', 'cyan'];
    const newRow: DragDropTableRow = {
      id: `row_${Date.now()}`,
      topic: topic,
      level: targetLevel || 1,
      category: 'y = x^2 - 1',
      title: 'y = x^2 - 1',
      theme: themeColors[tableRows.length % themeColors.length],
      attributes: ['Thuộc tính đúng 1', 'Thuộc tính đúng 2']
    };
    setTableRows(prev => [...prev, newRow]);
    soundFx.playClick();
  };

  const handleDeleteRow = (id: string) => {
    if (tableRows.length <= 1) {
      alert('Bảng cần duy trì ít nhất 1 hàng dữ liệu!');
      return;
    }
    setTableRows(prev => prev.filter(r => r.id !== id));
    soundFx.playClick();
  };

  const handleUpdateRow = (id: string, field: keyof DragDropTableRow, value: any) => {
    setTableRows(prev => prev.map(r => {
      if (r.id !== id) return r;
      const updated = { ...r, [field]: value };
      if (field === 'category') updated.title = value;
      return updated;
    }));
  };

  const handleAddAttributeToRow = (rowId: string) => {
    setTableRows(prev => prev.map(r => {
      if (r.id !== rowId) return r;
      return {
        ...r,
        attributes: [...r.attributes, `Thuộc tính đúng ${r.attributes.length + 1}`]
      };
    }));
    soundFx.playClick();
  };

  const handleRemoveAttributeFromRow = (rowId: string, attrIdx: number) => {
    setTableRows(prev => prev.map(r => {
      if (r.id !== rowId) return r;
      return {
        ...r,
        attributes: r.attributes.filter((_, idx) => idx !== attrIdx)
      };
    }));
    soundFx.playClick();
  };

  const handleUpdateAttributeInRow = (rowId: string, attrIdx: number, val: string) => {
    setTableRows(prev => prev.map(r => {
      if (r.id !== rowId) return r;
      const nextAttrs = [...r.attributes];
      nextAttrs[attrIdx] = val;
      return { ...r, attributes: nextAttrs };
    }));
  };

  // --- SMART TEXT PARSER (Nhận diện đề bài văn bản thô / Dán dữ liệu nhanh) ---
  const handleParseRawText = () => {
    if (!rawTextToParse.trim()) {
      alert('Vui lòng dán nội dung vào khung!');
      return;
    }

    try {
      if (isDragDropMode) {
        const parsedRows = parseDragDropFromText(rawTextToParse);
        if (parsedRows.length > 0) {
          setTableRows(prev => [...prev, ...parsedRows]);
          setShowPasteModal(false);
          setRawTextToParse('');
          const foundTopics = Array.from(new Set(parsedRows.map(r => r.topic.trim()).filter(Boolean)));
          soundFx.playCorrect();
          alert(`🎉 Phân tích thành công ${parsedRows.length} hàng dữ liệu từ ${foundTopics.length} chuyên đề! Đã nạp vào Bảng Quản Trị.`);
        } else {
          alert('Không nhận diện được định dạng Kéo Thả. Thầy vui lòng định dạng bảng: Cột 1: Chuyên đề, Cột 2: Level, Cột 3: Hộp/Phương trình, Cột 4: Thuộc tính (phân tách bằng dấu phẩy)!');
        }
      } else {
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

  // --- SMART IMPORT WORD (.DOCX) & EXCEL (.XLSX) THEO MẪU BẢNG 4 CỘT PHÂN CẤP ---
  const handleImportDocumentFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingDoc(true);
    soundFx.playClick();

    try {
      const ext = file.name.split('.').pop()?.toLowerCase();

      if (isDragDropMode) {
        let parsedRows: DragDropTableRow[] = [];
        if (ext === 'xlsx' || ext === 'xls') {
          parsedRows = await parseDragDropFromExcel(file);
        } else if (ext === 'docx') {
          parsedRows = await parseDragDropFromDocx(file);
        } else if (ext === 'csv') {
          const csvText = await file.text();
          parsedRows = parseDragDropFromText(csvText);
        } else {
          throw new Error('Định dạng file không được hỗ trợ. Vui lòng chọn .docx, .xlsx, .xls hoặc .csv');
        }

        if (parsedRows.length > 0) {
          setTableRows(parsedRows);
          const foundTopics = Array.from(new Set(parsedRows.map(r => r.topic.trim()).filter(Boolean)));
          setActiveTopicFilter('ALL');
          soundFx.playCorrect();
          alert(`🎉 ĐÃ NHẬP THÀNH CÔNG ${parsedRows.length} HÀNG DỮ LIỆU TỪ FILE:\n"${file.name}"!\n\nPhát hiện ${foundTopics.length} chuyên đề: ${foundTopics.join(', ')}.\nHệ thống đã tự động thêm/bớt và co giãn số lượng chuyên đề và màn chơi tương ứng!`);
        } else {
          throw new Error('Không bóc tách được bảng dữ liệu hợp lệ từ file. Thầy cô vui lòng kiểm tra file theo mẫu tải về.');
        }
      } else if (isChienHaoMode) {
        let parsedQuestions: Question[] = [];
        if (ext === 'docx') {
          parsedQuestions = await parseChienHaoFromDocx(file);
        } else if (ext === 'xlsx' || ext === 'xls') {
          parsedQuestions = await parseChienHaoFromExcel(file);
        } else {
          const rawText = await file.text();
          parsedQuestions = parseDocumentQuestions(rawText, gameTitle);
        }

        if (parsedQuestions.length === 0) {
          throw new Error('Không bóc tách được câu hỏi từ bảng 7 dòng x 2 cột của file. Vui lòng tải file mẫu để kiểm tra.');
        }
        setQuestions(prev => [...prev, ...parsedQuestions]);
        soundFx.playCorrect();
        alert(`🎉 ĐÃ NHẬP THÀNH CÔNG ${parsedQuestions.length} CÂU HỎI BẢO VỆ CHIẾN HÀO TỪ FILE:\n"${file.name}"!`);
      } else if (isSutPenMode) {
        let parsedQuestions: Question[] = [];
        if (ext === 'docx') {
          parsedQuestions = await parseSutPenFromDocx(file);
        } else if (ext === 'xlsx' || ext === 'xls') {
          parsedQuestions = await parseSutPenFromExcel(file);
        } else {
          const rawText = await file.text();
          parsedQuestions = parseDocumentQuestions(rawText, gameTitle);
        }

        if (parsedQuestions.length === 0) {
          throw new Error('Không bóc tách được câu hỏi từ bảng 7 dòng x 2 cột của file. Vui lòng tải file mẫu để kiểm tra.');
        }
        setQuestions(prev => [...prev, ...parsedQuestions]);
        soundFx.playCorrect();
        alert(`🎉 ĐÃ NHẬP THÀNH CÔNG ${parsedQuestions.length} CÂU HỎI SÚT PENALTY TỪ FILE:\n"${file.name}"!`);
      } else if (isBanChimMode) {
        let parsedQuestions: Question[] = [];
        if (ext === 'docx') {
          parsedQuestions = await parseBanChimFromDocx(file);
        } else if (ext === 'xlsx' || ext === 'xls') {
          parsedQuestions = await parseBanChimFromExcel(file);
        } else {
          const rawText = await file.text();
          parsedQuestions = parseDocumentQuestions(rawText, gameTitle);
        }

        if (parsedQuestions.length === 0) {
          throw new Error('Không bóc tách được câu hỏi từ bảng 8 dòng x 2 cột của file. Vui lòng tải file mẫu để kiểm tra.');
        }
        setQuestions(prev => [...prev, ...parsedQuestions]);
        soundFx.playCorrect();
        alert(`🎉 ĐÃ NHẬP THÀNH CÔNG ${parsedQuestions.length} CÂU HỎI BẮN CHIM TỪ FILE:\n"${file.name}"!`);
      } else if (isYogaMode) {
        let parsedQuestions: Question[] = [];
        if (ext === 'docx') {
          parsedQuestions = await parseYogaFromDocx(file);
        } else if (ext === 'xlsx' || ext === 'xls') {
          parsedQuestions = await parseYogaFromExcel(file);
        } else {
          const rawText = await file.text();
          parsedQuestions = parseDocumentQuestions(rawText, gameTitle);
        }

        if (parsedQuestions.length === 0) {
          throw new Error('Không bóc tách được câu hỏi từ file. Vui lòng tải file mẫu để kiểm tra.');
        }
        setQuestions(prev => [...prev, ...parsedQuestions]);
        soundFx.playCorrect();
        alert(`🎉 ĐÃ NHẬP THÀNH CÔNG ${parsedQuestions.length} CÂU HỎI GAME YOGA TỪ FILE:\n"${file.name}"!`);
      } else if (isTraiTimMode) {
        let parsedQuestions: Question[] = [];
        if (ext === 'docx') {
          parsedQuestions = await parseTraiTimFromDocx(file);
        } else if (ext === 'xlsx' || ext === 'xls') {
          parsedQuestions = await parseTraiTimFromExcel(file);
        } else {
          const rawText = await file.text();
          parsedQuestions = parseDocumentQuestions(rawText, gameTitle);
        }

        if (parsedQuestions.length === 0) {
          throw new Error('Không bóc tách được cặp nối từ bảng dài 2 cột của file Word. Vui lòng tải file mẫu để kiểm tra.');
        }
        setQuestions(prev => [...prev, ...parsedQuestions]);
        soundFx.playCorrect();
        alert(`🎉 ĐÃ NHẬP THÀNH CÔNG ${parsedQuestions.length} CẶP BÀI GHÉP CẶP TRÁI TIM TỪ FILE:\n"${file.name}"!`);
      } else if (isPikachuMode) {
        let parsedQuestions: Question[] = [];
        if (ext === 'docx') {
          parsedQuestions = await parsePikachuFromDocx(file);
        } else if (ext === 'xlsx' || ext === 'xls') {
          parsedQuestions = await parsePikachuFromExcel(file);
        } else {
          const rawText = await file.text();
          parsedQuestions = parseDocumentQuestions(rawText, gameTitle);
        }

        if (parsedQuestions.length === 0) {
          throw new Error('Không bóc tách được cặp nối từ bảng dài 2 cột của file. Vui lòng tải file mẫu để kiểm tra.');
        }
        setQuestions(prev => [...prev, ...parsedQuestions]);
        soundFx.playCorrect();
      } else if (isCaNguaMode) {
        let parsedQuestions: Question[] = [];
        if (ext === 'docx') {
          parsedQuestions = await parseCaNguaFromDocx(file);
        } else if (ext === 'xlsx' || ext === 'xls') {
          parsedQuestions = await parseCaNguaFromExcel(file);
        } else {
          const rawText = await file.text();
          parsedQuestions = parseDocumentQuestions(rawText, gameTitle);
        }

        if (parsedQuestions.length === 0) {
          throw new Error('Không bóc tách được câu hỏi từ bảng 9 dòng x 2 cột của file. Vui lòng tải file mẫu để kiểm tra.');
        }
        setQuestions(prev => [...prev, ...parsedQuestions]);
        soundFx.playCorrect();
        alert(`🎉 ĐÃ NHẬP THÀNH CÔNG ${parsedQuestions.length} CÂU HỎI GAME CỜ CÁ NGỰA TỪ FILE:\n"${file.name}"!\nBao gồm cả các câu Đúng/Sai 4 ý và Trắc nghiệm ABCD.`);
      } else if (isTetrisMode) {
        let parsedQuestions: Question[] = [];
        if (ext === 'docx') {
          parsedQuestions = await parseTetrisFromDocx(file);
        } else if (ext === 'xlsx' || ext === 'xls') {
          parsedQuestions = await parseTetrisFromExcel(file);
        } else {
          const rawText = await file.text();
          parsedQuestions = parseDocumentQuestions(rawText, gameTitle);
        }

        if (parsedQuestions.length === 0) {
          throw new Error('Không bóc tách được câu hỏi từ file Tetris. Vui lòng tải file mẫu để kiểm tra.');
        }
        setQuestions(prev => [...prev, ...parsedQuestions]);
        soundFx.playCorrect();
        alert(`🎉 ĐÃ NHẬP THÀNH CÔNG ${parsedQuestions.length} CÂU HỎI GAME TETRIS TỪ FILE:\n"${file.name}"!\nBao gồm cả các dạng Trắc nghiệm ABCD, Đúng/Sai 4 ý và Trả lời ngắn.`);
      } else if (isMarioMode) {
        let parsedQuestions: Question[] = [];
        if (ext === 'docx') {
          parsedQuestions = await parseMarioFromDocx(file);
        } else if (ext === 'xlsx' || ext === 'xls') {
          parsedQuestions = await parseMarioFromExcel(file);
        } else {
          const rawText = await file.text();
          parsedQuestions = parseDocumentQuestions(rawText, gameTitle);
        }

        if (parsedQuestions.length === 0) {
          throw new Error('Không bóc tách được câu hỏi từ file Mario. Vui lòng tải file mẫu để kiểm tra.');
        }
        setQuestions(prev => [...prev, ...parsedQuestions]);
        soundFx.playCorrect();
        alert(`🎉 ĐÃ NHẬP THÀNH CÔNG ${parsedQuestions.length} CÂU HỎI GAME MARIO TỪ FILE:\n"${file.name}"!\nBao gồm 3 Chuyên đề và 3 dạng câu hỏi (ABCD, Đúng/Sai, Trả lời ngắn).`);
      } else if (isHaiTaoMode) {
        let parsedQuestions: Question[] = [];
        if (ext === 'docx') {
          parsedQuestions = await parseHaiTaoFromDocx(file);
        } else if (ext === 'xlsx' || ext === 'xls') {
          parsedQuestions = await parseHaiTaoFromExcel(file);
        } else {
          const rawText = await file.text();
          parsedQuestions = parseDocumentQuestions(rawText, gameTitle);
        }

        if (parsedQuestions.length === 0) {
          throw new Error('Không bóc tách được câu hỏi từ file Hái Táo Luân Phiên. Vui lòng tải file mẫu để kiểm tra.');
        }
        setQuestions(prev => [...prev, ...parsedQuestions]);
        soundFx.playCorrect();
        alert(`🎉 ĐÃ NHẬP THÀNH CÔNG ${parsedQuestions.length} CÂU HỎI GAME HÁI TÁO LUÂN PHIÊN TỪ FILE:\n"${file.name}"!\nBao gồm 3 Chuyên đề và 3 dạng câu hỏi (ABCD, Đúng/Sai, Trả lời ngắn).`);
      } else {
        let rawText = '';
        if (ext === 'docx') {
          rawText = await extractTextFromDocx(file);
        } else if (ext === 'xlsx' || ext === 'xls') {
          rawText = await extractTextFromExcel(file);
        } else if (ext === 'csv') {
          rawText = await file.text();
        }
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
  const handleInsertMath = (snippet: string, replaceCount: number = 0) => {
    if (!activeTarget) return;
    const { id, field, optIndex, attrIndex } = activeTarget;
    const inputEl = activeInputElRef.current;

    let currentVal = getCurrentTargetValue();
    let start = currentVal.length;
    let end = currentVal.length;

    if (inputEl) {
      start = inputEl.selectionStart ?? currentVal.length;
      end = inputEl.selectionEnd ?? currentVal.length;
    }

    if (replaceCount > 0 && start >= replaceCount) {
      start -= replaceCount;
    }

    const newVal = currentVal.slice(0, start) + snippet + currentVal.slice(end);
    const newCursor = start + snippet.length;

    if (field === 'row_category') {
      handleUpdateRow(id, 'category', newVal);
    } else if (field === 'row_attribute' && typeof attrIndex === 'number') {
      handleUpdateAttributeInRow(id, attrIndex, newVal);
    } else if (field === 'row_topic') {
      handleUpdateRow(id, 'topic', newVal);
    } else if (field === 'question') {
      handleUpdate(id, 'question', newVal);
    } else if (field === 'explanation') {
      handleUpdate(id, 'explanation', newVal);
    } else if (field === 'option' && typeof optIndex === 'number') {
      handleUpdateOption(id, optIndex, newVal);
    }

    if (inputEl) {
      requestAnimationFrame(() => {
        inputEl.focus();
        inputEl.setSelectionRange(newCursor, newCursor);
      });
    }
  };

  const handleBackspace = () => {
    if (!activeTarget) return;
    const { id, field, optIndex, attrIndex } = activeTarget;
    const inputEl = activeInputElRef.current;

    let currentVal = getCurrentTargetValue();
    let start = currentVal.length;
    let end = currentVal.length;

    if (inputEl) {
      start = inputEl.selectionStart ?? currentVal.length;
      end = inputEl.selectionEnd ?? currentVal.length;
    }

    if (start === 0 && end === 0) return;

    let newVal = '';
    let newCursor = start;

    if (start < end) {
      newVal = currentVal.slice(0, start) + currentVal.slice(end);
      newCursor = start;
    } else {
      newVal = currentVal.slice(0, start - 1) + currentVal.slice(start);
      newCursor = start - 1;
    }

    if (field === 'row_category') {
      handleUpdateRow(id, 'category', newVal);
    } else if (field === 'row_attribute' && typeof attrIndex === 'number') {
      handleUpdateAttributeInRow(id, attrIndex, newVal);
    } else if (field === 'row_topic') {
      handleUpdateRow(id, 'topic', newVal);
    } else if (field === 'question') {
      handleUpdate(id, 'question', newVal);
    } else if (field === 'explanation') {
      handleUpdate(id, 'explanation', newVal);
    } else if (field === 'option' && typeof optIndex === 'number') {
      handleUpdateOption(id, optIndex, newVal);
    }

    if (inputEl) {
      requestAnimationFrame(() => {
        inputEl.focus();
        inputEl.setSelectionRange(newCursor, newCursor);
      });
    }
  };

  const getCurrentTargetValue = (): string => {
    if (!activeTarget) return '';
    const { id, field, optIndex, attrIndex } = activeTarget;

    if (field === 'row_category') {
      const r = tableRows.find(item => item.id === id);
      return r ? r.category : '';
    }
    if (field === 'row_attribute' && typeof attrIndex === 'number') {
      const r = tableRows.find(item => item.id === id);
      return r ? (r.attributes[attrIndex] || '') : '';
    }
    if (field === 'row_topic') {
      const r = tableRows.find(item => item.id === id);
      return r ? r.topic : '';
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
    const defaultDiff: Difficulty = isChienHaoMode
      ? (chienHaoLevelFilter !== 'ALL' ? chienHaoLevelFilter : 'Dễ')
      : isSutPenMode
      ? (sutPenLevelFilter !== 'ALL' ? sutPenLevelFilter : 'Dễ')
      : isBanChimMode
      ? (banChimLevelFilter !== 'ALL' ? banChimLevelFilter : 'Dễ')
      : 'Trung bình';

    const defaultOpts = isBanChimMode ? ['', '', '', '', ''] : ['', '', '', ''];

    setQuestions([
      {
        id: `q_${Date.now()}`,
        question: '',
        options: defaultOpts,
        correctIndex: 0,
        explanation: '',
        difficulty: defaultDiff,
        topic: isChienHaoMode ? 'Bảo Vệ Chiến Hào' : isSutPenMode ? 'Sút Penalty' : isBanChimMode ? 'Bắn Chim Xác Suất' : 'Toán học',
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
        const newOpts = [...q.options];
        newOpts[optIndex] = value;
        return { ...q, options: newOpts };
      }
      return q;
    }));
  };

  // --- HÀNH ĐỘNG 1: LƯU VÀO WEB QUẢN TRỊ ---
  const handleSaveToWeb = () => {
    if (isDragDropMode) {
      if (tableRows.length === 0) {
        if (!confirm('Chưa có hàng dữ liệu nào. Trò chơi sẽ chạy bằng ngân hàng chuyên đề mặc định. Bạn có muốn tiếp tục?')) {
          return;
        }
      }
      // Đồng bộ sang Question[] để tương thích toàn hệ thống
      const mappedQuestions: Question[] = tableRows.map((r, idx) => {
        const opts = [...r.attributes];
        while (opts.length < 4) {
          opts.push(`Thuộc tính mở rộng ${opts.length + 1}`);
        }
        return {
          id: r.id || `q_row_${idx + 1}`,
          question: normalizeMathFormulas(r.category),
          options: opts.slice(0, 4).map(o => normalizeMathFormulas(o)) as [string, string, string, string],
          correctIndex: 0,
          explanation: r.attributes.map(a => normalizeMathFormulas(a)).join('; '),
          difficulty: r.level === 1 ? 'Dễ' : (r.level <= 3 ? 'Trung bình' : 'Khó'),
          topic: r.topic || gameTitle,
          source: gameTitle,
          status: 'published',
          createdAt: new Date().toISOString()
        };
      });

      const mappedCats: DragDropCategory[] = tableRows.map(r => ({
        id: r.id,
        title: r.category,
        theme: r.theme,
        attributes: r.attributes
      }));

      soundFx.playCorrect();
      onSave(tool.id, mappedQuestions, gameTitle, mappedCats, tableRows);
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
    const mappedCats: DragDropCategory[] = tableRows.map(r => ({
      id: r.id,
      title: r.category,
      theme: r.theme,
      attributes: r.attributes
    }));

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
      customDragDrop: isDragDropMode ? mappedCats : undefined,
      customDragDropRows: isDragDropMode ? tableRows : undefined
    };
    onDuplicateAsNewGame(newTool);
    soundFx.playCorrect();
    alert(`🎉 Đã tạo thành công trò chơi mới "${newTool.name}" trong danh mục Trò chơi học tập!`);
    onClose();
  };

  // --- HÀNH ĐỘNG 3: XUẤT FILE HTML TRÒ CHƠI ĐỘC LẬP 1 NÚT BẤM (STANDALONE HTML) ---
  const handleExportStandaloneHTML = async () => {
    if (isDragDropMode && tableRows.length === 0) {
      alert('Vui lòng thêm ít nhất 1 hàng dữ liệu trước khi xuất file!');
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
        customCategories: isDragDropMode ? tableRows.map(r => ({ id: r.id, title: r.category, attributes: r.attributes, theme: r.theme })) : undefined,
        customDragDropRows: isDragDropMode ? tableRows : undefined
      });

      // Tải tệp xuống máy tính
      const safeFilename = `${gameTitle.toLowerCase().replace(/[^a-z0-9]/gi, '_')}_custom.html`;
      downloadFile(htmlString, safeFilename, 'text/html');

      soundFx.playCorrect();
      alert(`⚡ XUẤT FILE THÀNH CÔNG!\n\nĐã tải xuống file: ${safeFilename}\n\nThầy có thể:\n1. Mở trực tiếp trên máy tính để chơi ngay (tự động nhận diện ${distinctTopics.length} chuyên đề).\n2. Kéo thả file này đè lên Vercel để cập nhật vĩnh viễn!\n(Nút Quản trị ⚙️ được tự động khóa bảo mật, chỉ hiện khi thêm ?role=admin).`);
    } catch (err: any) {
      console.error(err);
      alert(`Lỗi xuất file HTML: ${err?.message || 'Không thể tải template trò chơi gốc.'}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-2 sm:p-5 h-[100dvh] max-h-[100dvh] overflow-hidden">
      <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[80dvh] sm:max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border-2 border-violet-200 animate-in zoom-in-95 duration-200">
        
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
              <span className="font-medium text-slate-600">Tải file đề bài (Word/Excel Bảng 4 Cột) hoặc chỉnh sửa trực tiếp ➔ Hệ thống tự động co giãn chuyên đề ➔ Bấm</span>
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
          {/* NÚT TẢI FILE MẪU WORD (.DOCX) CHUẨN RIÊNG TỪNG GAME */}
          <button
            type="button"
            onClick={async () => {
              try {
                soundFx.playClick();
                await downloadGameWordTemplate(selectedTemplateUrl);
              } catch (err: any) {
                console.error(err);
                alert(`Lỗi tạo file Word mẫu: ${err?.message || 'Không thể tạo file docx'}`);
              }
            }}
            className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-1.5 cursor-pointer border border-blue-200 shadow-2xs active:scale-95"
            title="Tải file Word (.docx) mẫu chuẩn theo trò chơi đang chọn"
          >
            <FileDown className="w-4 h-4 text-blue-600" />
            <span>📥 Tải File Word (.docx) Mẫu</span>
          </button>

          {/* NÚT TẢI FILE MẪU EXCEL (.XLSX) CHUẨN RIÊNG TỪNG GAME */}
          <button
            type="button"
            onClick={async () => {
              try {
                soundFx.playClick();
                await downloadGameExcelTemplate(selectedTemplateUrl);
              } catch (err: any) {
                console.error(err);
                alert(`Lỗi tạo file Excel mẫu: ${err?.message || 'Không thể tạo file xlsx'}`);
              }
            }}
            className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-1.5 cursor-pointer border border-emerald-200 shadow-2xs active:scale-95"
            title="Tải file Excel (.xlsx) mẫu chuẩn theo trò chơi đang chọn"
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
            title="Dán nhanh nội dung bảng 4 cột hoặc văn bản để hệ thống tự động bóc tách"
          >
            <FileText className="w-4 h-4" /> Dán dữ liệu nhanh (Parser)
          </button>

          {/* NÚT THÊM NỘI DUNG MỚI */}
          {isDragDropMode ? (
            <div className="flex items-center gap-2 ml-auto">
              <button 
                onClick={handleAddTopic} 
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-1.5 shadow-sm shadow-indigo-200 cursor-pointer"
                title="Thêm một chuyên đề học tập mới vào hệ thống"
              >
                <FolderPlus className="w-4 h-4" /> + Thêm Chuyên Đề Mới
              </button>
              <button 
                onClick={() => handleAddRow(activeTopicFilter !== 'ALL' ? activeTopicFilter : distinctTopics[0])} 
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-1.5 shadow-sm shadow-cyan-200 cursor-pointer"
                title="Thêm một hàng câu hỏi vào bảng phân cấp"
              >
                <Plus className="w-4 h-4" /> + Thêm Dòng Vào Bảng
              </button>
            </div>
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
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 bg-slate-50 space-y-4 custom-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
          {/* CHẾ ĐỘ 1: KÉO THẢ PHÂN LOẠI THUỘC TÍNH (GRID / TABLE VIEW & QUẢN LÝ CHUYÊN ĐỀ ĐỘNG) */}
          {isDragDropMode ? (
            <div className="space-y-4">
              {/* THANH ĐIỀU HƯỚNG & QUẢN LÝ CHUYÊN ĐỀ (TOPIC MANAGEMENT BAR) */}
              <div className="bg-white rounded-2xl border-2 border-slate-200 p-4 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-cyan-500 animate-pulse" />
                    <span className="font-black text-xs sm:text-sm text-slate-800 uppercase tracking-wide">
                      DANH SÁCH CHUYÊN ĐỀ ({distinctTopics.length} Chuyên Đề Đang Có)
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={handleAddTopic}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl font-bold text-xs transition flex items-center gap-1 cursor-pointer"
                      title="Thêm một chuyên đề học tập mới"
                    >
                      <FolderPlus className="w-3.5 h-3.5" /> + Thêm Chuyên Đề Mới
                    </button>
                    {activeTopicFilter !== 'ALL' && (
                      <>
                        <button
                          onClick={() => handleRenameTopic(activeTopicFilter)}
                          className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl font-bold text-xs transition flex items-center gap-1 cursor-pointer"
                          title="Đổi tên chuyên đề đang chọn"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> ✏️ Đổi tên
                        </button>
                        <button
                          onClick={() => handleDeleteTopic(activeTopicFilter)}
                          className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold text-xs transition flex items-center gap-1 cursor-pointer"
                          title="Xóa chuyên đề đang chọn"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> ❌ Xóa Chuyên Đề
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* TAB CHỌN CHUYÊN ĐỀ */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
                  <button
                    onClick={() => { setActiveTopicFilter('ALL'); soundFx.playClick(); }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition shrink-0 cursor-pointer ${
                      activeTopicFilter === 'ALL'
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    Tất cả ({tableRows.length} dòng)
                  </button>
                  {distinctTopics.map((topic, tIdx) => {
                    const rowCount = tableRows.filter(r => r.topic === topic).length;
                    const isActive = activeTopicFilter === topic;
                    return (
                      <button
                        key={tIdx}
                        onClick={() => { setActiveTopicFilter(topic); soundFx.playClick(); }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-2 cursor-pointer ${
                          isActive
                            ? 'bg-cyan-600 text-white shadow-sm shadow-cyan-200'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        <span>{topic}</span>
                        <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${isActive ? 'bg-cyan-800 text-cyan-100' : 'bg-slate-200 text-slate-600'}`}>
                          {rowCount}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* BẢNG DỮ LIỆU ĐỀ BÀI (GRID / TABLE VIEW 4 CỘT CHUẨN) */}
              {filteredRows.length === 0 ? (
                <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border-2 border-dashed border-slate-200 p-8">
                  <Sparkles className="w-12 h-12 text-cyan-400 mx-auto mb-3" />
                  <p className="font-bold text-base text-slate-700">Chưa có dòng dữ liệu nào trong chuyên đề này</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                    Thầy cô hãy bấm <b>"+ Thêm Dòng Vào Bảng"</b> hoặc <b>"Nhập Word / Excel"</b> để tạo các bài toán phân loại và thuộc tính!
                  </p>
                  <button
                    onClick={() => handleAddRow(activeTopicFilter !== 'ALL' ? activeTopicFilter : distinctTopics[0])}
                    className="mt-4 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold rounded-xl inline-flex items-center gap-1.5 shadow-sm"
                  >
                    <Plus className="w-4 h-4" /> Thêm Dòng Đầu Tiên
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase text-slate-700">
                        BẢNG DỮ LIỆU ĐỀ BÀI (DẠNG BẢNG 4 CỘT PHÂN CẤP)
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800">
                        {filteredRows.length} dòng
                      </span>
                    </div>
                    <button
                      onClick={() => handleAddRow(activeTopicFilter !== 'ALL' ? activeTopicFilter : distinctTopics[0])}
                      className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" /> + Thêm Dòng Mới
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 text-[11px] font-black uppercase tracking-wider border-b border-slate-200">
                          <th className="p-3 w-12 text-center">STT</th>
                          <th className="p-3 w-52">Cột 1: Chuyên Đề</th>
                          <th className="p-3 w-28 text-center">Cột 2: Cấp Độ</th>
                          <th className="p-3 min-w-[260px]">Cột 3: Hộp Đề Bài / Phương Trình</th>
                          <th className="p-3 min-w-[320px]">Cột 4: Các Nhãn Thuộc Tính Đúng (Đáp Án)</th>
                          <th className="p-3 w-16 text-center">Xóa</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-xs">
                        {filteredRows.map((row, rIdx) => (
                          <tr key={row.id || rIdx} className="hover:bg-slate-50/80 transition-colors align-top">
                            {/* STT */}
                            <td className="p-3 text-center font-black text-slate-400">
                              {rIdx + 1}
                            </td>

                            {/* CỘT 1: CHUYÊN ĐỀ */}
                            <td className="p-3">
                              <select
                                value={row.topic}
                                onChange={(e) => handleUpdateRow(row.id, 'topic', e.target.value)}
                                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-800 text-xs outline-none focus:border-cyan-500 mb-1"
                              >
                                {distinctTopics.map((top, tIdx) => (
                                  <option key={tIdx} value={top}>{top}</option>
                                ))}
                              </select>
                              <input
                                type="text"
                                value={row.topic}
                                onChange={(e) => handleUpdateRow(row.id, 'topic', e.target.value)}
                                onFocus={(e) => handleFieldFocus(e, {
                                  id: row.id,
                                  field: 'row_topic',
                                  fieldName: `Dòng ${rIdx + 1}: Chuyên Đề`
                                })}
                                onBlur={handleFieldBlur}
                                placeholder="Hoặc gõ tên chuyên đề mới..."
                                className="w-full p-1.5 bg-white border border-slate-200 rounded text-[11px] text-slate-600 outline-none focus:border-cyan-500 font-medium"
                              />
                            </td>

                            {/* CỘT 2: CẤP ĐỘ / MỨC ĐỘ */}
                            <td className="p-3 text-center">
                              <select
                                value={row.level}
                                onChange={(e) => handleUpdateRow(row.id, 'level', Number(e.target.value))}
                                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-800 text-xs text-center outline-none focus:border-cyan-500 cursor-pointer"
                              >
                                <option value={1}>Level 1</option>
                                <option value={2}>Level 2</option>
                                <option value={3}>Level 3</option>
                                <option value={4}>Level 4</option>
                                <option value={5}>Level 5</option>
                              </select>
                              <span className="block mt-1 text-[10px] text-slate-400 font-bold">
                                {row.level === 1 ? 'Nhận biết' : row.level === 2 ? 'Thông hiểu' : row.level === 3 ? 'Vận dụng' : 'Nâng cao'}
                              </span>
                            </td>

                            {/* CỘT 3: HỘP ĐỀ BÀI / PHƯƠNG TRÌNH */}
                            <td className="p-3">
                              <div className="flex items-center gap-2 mb-1.5">
                                <input
                                  type="text"
                                  value={row.category}
                                  onChange={(e) => handleUpdateRow(row.id, 'category', e.target.value)}
                                  onFocus={(e) => handleFieldFocus(e, {
                                    id: row.id,
                                    field: 'row_category',
                                    fieldName: `Dòng ${rIdx + 1}: Hộp Đề Bài / Phương Trình`
                                  })}
                                  onBlur={handleFieldBlur}
                                  placeholder="VD: y = x^3 - 3x hoặc f(x) = \frac{1}{x}..."
                                  className="flex-1 p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 text-xs outline-none focus:border-cyan-500 focus:bg-white"
                                />
                                <select
                                  value={row.theme || 'blue'}
                                  onChange={(e) => handleUpdateRow(row.id, 'theme', e.target.value)}
                                  className="p-1.5 border border-slate-200 rounded-lg text-[11px] font-bold bg-white text-slate-600 cursor-pointer"
                                  title="Màu sắc hộp trong game"
                                >
                                  <option value="blue">Xanh dương</option>
                                  <option value="emerald">Xanh ngọc</option>
                                  <option value="violet">Tím</option>
                                  <option value="amber">Vàng cam</option>
                                  <option value="rose">Hồng đỏ</option>
                                  <option value="cyan">Lam sáng</option>
                                </select>
                              </div>
                              <input
                                type="text"
                                value={row.imageUrl || ''}
                                onChange={(e) => handleUpdateRow(row.id, 'imageUrl', e.target.value)}
                                placeholder="🖼️ Link ảnh minh họa (tùy chọn)..."
                                className="w-full p-1.5 bg-white border border-slate-200 rounded text-[11px] text-slate-600 outline-none focus:border-cyan-500 mb-1"
                              />
                              {row.imageUrl && (
                                <div className="mb-1 p-1 bg-slate-50 border border-slate-200 rounded max-w-[150px]">
                                  <img src={row.imageUrl} alt="Minh họa" className="max-h-20 rounded object-contain mx-auto" onError={(e) => (e.currentTarget.style.display = 'none')} />
                                </div>
                              )}
                              <MathLivePreview formula={row.category} />
                            </td>

                            {/* CỘT 4: CÁC NHÃN THUỘC TÍNH ĐÚNG */}
                            <td className="p-3">
                              <div className="space-y-1.5">
                                {row.attributes.map((attr, aIdx) => (
                                  <div key={aIdx} className="bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[10px] font-bold text-slate-400 shrink-0">#{aIdx + 1}</span>
                                      <input
                                        type="text"
                                        value={attr}
                                        onChange={(e) => handleUpdateAttributeInRow(row.id, aIdx, e.target.value)}
                                        onFocus={(e) => handleFieldFocus(e, {
                                          id: row.id,
                                          field: 'row_attribute',
                                          attrIndex: aIdx,
                                          fieldName: `Dòng ${rIdx + 1} - Nhãn #${aIdx + 1}`
                                        })}
                                        onBlur={handleFieldBlur}
                                        placeholder="Thuộc tính đúng..."
                                        className="flex-1 p-1 bg-white border border-slate-300 rounded text-xs text-slate-800 outline-none focus:border-cyan-500"
                                      />
                                      <button
                                        onClick={() => handleRemoveAttributeFromRow(row.id, aIdx)}
                                        className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-slate-200 cursor-pointer"
                                        title="Xóa nhãn này"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                    <MathLivePreview formula={attr} />
                                  </div>
                                ))}
                                <button
                                  onClick={() => handleAddAttributeToRow(row.id)}
                                  className="w-full py-1 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 rounded-lg text-[11px] font-bold border border-cyan-200 flex items-center justify-center gap-1 cursor-pointer transition"
                                >
                                  <Plus className="w-3 h-3" /> Thêm nhãn đúng
                                </button>
                              </div>
                            </td>

                            {/* THAO TÁC XÓA DÒNG */}
                            <td className="p-3 text-center">
                              <button
                                onClick={() => handleDeleteRow(row.id)}
                                className="p-2 text-slate-300 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition cursor-pointer"
                                title="Xóa dòng này khỏi bảng"
                              >
                                <Trash2 className="w-4 h-4 mx-auto" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
                    <span className="text-xs text-slate-500 font-bold">
                      Hiển thị {filteredRows.length} / {tableRows.length} dòng dữ liệu
                    </span>
                    <button
                      onClick={() => handleAddRow(activeTopicFilter !== 'ALL' ? activeTopicFilter : distinctTopics[0])}
                      className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm shadow-cyan-200"
                    >
                      <Plus className="w-4 h-4" /> + Thêm Dòng Mới
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* CHẾ ĐỘ 2: TRẮC NGHIỆM TIÊU CHUẨN (A, B, C, D CHO CÁC GAME KHÁC) */
            <div className="space-y-4">
              {isChienHaoMode && (
                <div className="bg-white rounded-2xl border-2 border-slate-200 p-4 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-cyan-500 animate-pulse" />
                      <span className="font-black text-xs sm:text-sm text-slate-800 uppercase tracking-wide">
                        PHÂN CẤP ĐỘ KHÓ CHIẾN DỊCH (BẢO VỆ CHIẾN HÀO)
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                      💡 Tự động chọn ngẫu nhiên đúng 5 câu/mức độ làm bia bắn Zombies
                    </span>
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                    <button
                      onClick={() => { setChienHaoLevelFilter('ALL'); soundFx.playClick(); }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition shrink-0 cursor-pointer ${
                        chienHaoLevelFilter === 'ALL'
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      Tất cả ({questions.length} câu)
                    </button>
                    <button
                      onClick={() => { setChienHaoLevelFilter('Dễ'); soundFx.playClick(); }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                        chienHaoLevelFilter === 'Dễ'
                          ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200 font-black'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      <span>🟢 PHẦN 1: MỨC ĐỘ 1 (DỄ)</span>
                      <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${chienHaoLevelFilter === 'Dễ' ? 'bg-emerald-800 text-white' : 'bg-emerald-200 text-emerald-800'}`}>
                        {chienHaoCounts.easy}
                      </span>
                    </button>
                    <button
                      onClick={() => { setChienHaoLevelFilter('Trung bình'); soundFx.playClick(); }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                        chienHaoLevelFilter === 'Trung bình'
                          ? 'bg-amber-600 text-white shadow-sm shadow-amber-200 font-black'
                          : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200'
                      }`}
                    >
                      <span>🟡 PHẦN 2: MỨC ĐỘ 2 (TRUNG BÌNH)</span>
                      <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${chienHaoLevelFilter === 'Trung bình' ? 'bg-amber-800 text-white' : 'bg-amber-200 text-amber-800'}`}>
                        {chienHaoCounts.medium}
                      </span>
                    </button>
                    <button
                      onClick={() => { setChienHaoLevelFilter('Khó'); soundFx.playClick(); }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                        chienHaoLevelFilter === 'Khó'
                          ? 'bg-rose-600 text-white shadow-sm shadow-rose-200 font-black'
                          : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                      }`}
                    >
                      <span>🔴 PHẦN 3: MỨC ĐỘ 3 (KHÓ)</span>
                      <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${chienHaoLevelFilter === 'Khó' ? 'bg-rose-800 text-white' : 'bg-rose-200 text-rose-800'}`}>
                        {chienHaoCounts.hard}
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {isSutPenMode && (
                <div className="bg-white rounded-2xl border-2 border-slate-200 p-4 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="font-black text-xs sm:text-sm text-slate-800 uppercase tracking-wide">
                        3 GIAI ĐOẠN GIẢI ĐẤU PENALTY (CHIA THEO ĐỘ KHÓ)
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                      ⚽ Tự động bốc ngẫu nhiên đúng 5 câu/giai đoạn làm bia sút bóng chống học vẹt
                    </span>
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                    <button
                      onClick={() => { setSutPenLevelFilter('ALL'); soundFx.playClick(); }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition shrink-0 cursor-pointer ${
                        sutPenLevelFilter === 'ALL'
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      Tất cả ({questions.length} câu)
                    </button>
                    <button
                      onClick={() => { setSutPenLevelFilter('Dễ'); soundFx.playClick(); }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                        sutPenLevelFilter === 'Dễ'
                          ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200 font-black'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      <span>🟢 PHẦN 1: MỨC ĐỘ 1 (DỄ) - VÒNG BẢNG</span>
                      <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${sutPenLevelFilter === 'Dễ' ? 'bg-emerald-800 text-white' : 'bg-emerald-200 text-emerald-800'}`}>
                        {chienHaoCounts.easy}
                      </span>
                    </button>
                    <button
                      onClick={() => { setSutPenLevelFilter('Trung bình'); soundFx.playClick(); }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                        sutPenLevelFilter === 'Trung bình'
                          ? 'bg-amber-600 text-white shadow-sm shadow-amber-200 font-black'
                          : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200'
                      }`}
                    >
                      <span>🟡 PHẦN 2: MỨC ĐỘ 2 (TRUNG BÌNH) - BÁN KẾT</span>
                      <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${sutPenLevelFilter === 'Trung bình' ? 'bg-amber-800 text-white' : 'bg-amber-200 text-amber-800'}`}>
                        {chienHaoCounts.medium}
                      </span>
                    </button>
                    <button
                      onClick={() => { setSutPenLevelFilter('Khó'); soundFx.playClick(); }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                        sutPenLevelFilter === 'Khó'
                          ? 'bg-rose-600 text-white shadow-sm shadow-rose-200 font-black'
                          : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                      }`}
                    >
                      <span>🔴 PHẦN 3: MỨC ĐỘ 3 (KHÓ) - CHUNG KẾT</span>
                      <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${sutPenLevelFilter === 'Khó' ? 'bg-rose-800 text-white' : 'bg-rose-200 text-rose-800'}`}>
                        {chienHaoCounts.hard}
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {isBanChimMode && (
                <div className="bg-white rounded-2xl border-2 border-slate-200 p-4 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
                      <span className="font-black text-xs sm:text-sm text-slate-800 uppercase tracking-wide">
                        3 MỨC ĐỘ GAME BẮN CHIM (BẢNG 8 DÒNG X 2 CỘT)
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                      🎯 Mỗi câu gồm 5 phương án A, B, C, D, E tương ứng 5 chú chim bay đồng thời
                    </span>
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                    <button
                      onClick={() => { setBanChimLevelFilter('ALL'); soundFx.playClick(); }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition shrink-0 cursor-pointer ${
                        banChimLevelFilter === 'ALL'
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      Tất cả ({questions.length} câu)
                    </button>
                    <button
                      onClick={() => { setBanChimLevelFilter('Dễ'); soundFx.playClick(); }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                        banChimLevelFilter === 'Dễ'
                          ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200 font-black'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      <span>🟢 PHẦN 1: MỨC ĐỘ 1 (DỄ)</span>
                      <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${banChimLevelFilter === 'Dễ' ? 'bg-emerald-800 text-white' : 'bg-emerald-200 text-emerald-800'}`}>
                        {banChimCounts.easy}
                      </span>
                    </button>
                    <button
                      onClick={() => { setBanChimLevelFilter('Trung bình'); soundFx.playClick(); }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                        banChimLevelFilter === 'Trung bình'
                          ? 'bg-amber-600 text-white shadow-sm shadow-amber-200 font-black'
                          : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200'
                      }`}
                    >
                      <span>🟡 PHẦN 2: MỨC ĐỘ 2 (TRUNG BÌNH)</span>
                      <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${banChimLevelFilter === 'Trung bình' ? 'bg-amber-800 text-white' : 'bg-amber-200 text-amber-800'}`}>
                        {banChimCounts.medium}
                      </span>
                    </button>
                    <button
                      onClick={() => { setBanChimLevelFilter('Khó'); soundFx.playClick(); }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                        banChimLevelFilter === 'Khó'
                          ? 'bg-rose-600 text-white shadow-sm shadow-rose-200 font-black'
                          : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                      }`}
                    >
                      <span>🔴 PHẦN 3: MỨC ĐỘ 3 (KHÓ)</span>
                      <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${banChimLevelFilter === 'Khó' ? 'bg-rose-800 text-white' : 'bg-rose-200 text-rose-800'}`}>
                        {banChimCounts.hard}
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {isYogaMode && (
                <div className="bg-white rounded-2xl border-2 border-slate-200 p-4 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-teal-500 animate-pulse" />
                      <span className="font-black text-xs sm:text-sm text-slate-800 uppercase tracking-wide">
                        BỘ LỌC DẠNG CÂU & ĐỘ KHÓ GAME YOGA VẬN ĐỘNG
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                      🧘 Hỗ trợ song song Trắc nghiệm 4 lựa chọn (MC) và Đúng / Sai (TF)
                    </span>
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                    <button
                      onClick={() => { setYogaFilter('ALL'); soundFx.playClick(); }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition shrink-0 cursor-pointer ${
                        yogaFilter === 'ALL'
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      Tất cả ({questions.length} câu)
                    </button>
                    <button
                      onClick={() => { setYogaFilter('MC'); soundFx.playClick(); }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                        yogaFilter === 'MC'
                          ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200 font-black'
                          : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                      }`}
                    >
                      <span>🏃 Trắc nghiệm ABCD ({yogaCounts.mc})</span>
                    </button>
                    <button
                      onClick={() => { setYogaFilter('TF'); soundFx.playClick(); }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                        yogaFilter === 'TF'
                          ? 'bg-teal-600 text-white shadow-sm shadow-teal-200 font-black'
                          : 'bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200'
                      }`}
                    >
                      <span>✅ Đúng / Sai TF ({yogaCounts.tf})</span>
                    </button>
                    <button
                      onClick={() => { setYogaFilter('Dễ'); soundFx.playClick(); }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                        yogaFilter === 'Dễ'
                          ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200 font-black'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      <span>🟢 Dễ ({yogaCounts.easy})</span>
                    </button>
                    <button
                      onClick={() => { setYogaFilter('Trung bình'); soundFx.playClick(); }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                        yogaFilter === 'Trung bình'
                          ? 'bg-amber-600 text-white shadow-sm shadow-amber-200 font-black'
                          : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200'
                      }`}
                    >
                      <span>🟡 Vừa ({yogaCounts.medium})</span>
                    </button>
                    <button
                      onClick={() => { setYogaFilter('Khó'); soundFx.playClick(); }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                        yogaFilter === 'Khó'
                          ? 'bg-rose-600 text-white shadow-sm shadow-rose-200 font-black'
                          : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                      }`}
                    >
                      <span>🔴 Khó ({yogaCounts.hard})</span>
                    </button>
                  </div>
                </div>
              )}

              {isCaNguaMode && (
                <div className="bg-white rounded-2xl border-2 border-slate-200 p-4 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
                      <span className="font-black text-xs sm:text-sm text-slate-800 uppercase tracking-wide">
                        BỘ LỌC DẠNG CÂU & ĐỘ KHÓ GAME CỜ CÁ NGỰA
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                      🎲 Hỗ trợ Trắc nghiệm ABCD & Bảng Đúng / Sai (4 ý - 9 dòng)
                    </span>
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                    <button
                      onClick={() => { setCaNguaFilter('ALL'); soundFx.playClick(); }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition shrink-0 cursor-pointer ${
                        caNguaFilter === 'ALL'
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      Tất cả ({questions.length} câu)
                    </button>
                    <button
                      onClick={() => { setCaNguaFilter('MC'); soundFx.playClick(); }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                        caNguaFilter === 'MC'
                          ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200 font-black'
                          : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                      }`}
                    >
                      <span>🎯 CÂU HỎI TRẮC NGHIỆM ABCD ({caNguaCounts.mc})</span>
                    </button>
                    <button
                      onClick={() => { setCaNguaFilter('TF'); soundFx.playClick(); }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                        caNguaFilter === 'TF'
                          ? 'bg-blue-600 text-white shadow-sm shadow-blue-200 font-black'
                          : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
                      }`}
                    >
                      <span>✅ CÂU HỎI ĐÚNG SAI (4 Ý) ({caNguaCounts.tf})</span>
                    </button>
                    <button
                      onClick={() => { setCaNguaFilter('Dễ'); soundFx.playClick(); }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                        caNguaFilter === 'Dễ'
                          ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200 font-black'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      <span>🟢 Dễ ({caNguaCounts.easy})</span>
                    </button>
                    <button
                      onClick={() => { setCaNguaFilter('Trung bình'); soundFx.playClick(); }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                        caNguaFilter === 'Trung bình'
                          ? 'bg-amber-600 text-white shadow-sm shadow-amber-200 font-black'
                          : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200'
                      }`}
                    >
                      <span>🟡 Vừa ({caNguaCounts.medium})</span>
                    </button>
                    <button
                      onClick={() => { setCaNguaFilter('Khó'); soundFx.playClick(); }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                        caNguaFilter === 'Khó'
                          ? 'bg-rose-600 text-white shadow-sm shadow-rose-200 font-black'
                          : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                      }`}
                    >
                      <span>🔴 Khó ({caNguaCounts.hard})</span>
                    </button>
                  </div>
                </div>
              )}

              {isTetrisMode && (
                <div className="bg-white rounded-2xl border-2 border-slate-200 p-4 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-cyan-500 animate-pulse" />
                      <span className="font-black text-xs sm:text-sm text-slate-800 uppercase tracking-wide">
                        BỘ LỌC 3 DẠNG CÂU & ĐỘ KHÓ GAME TETRIS
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                      🧱 Hỗ trợ Trắc nghiệm ABCD (7 dòng), Đúng/Sai (9 dòng) & Trả lời ngắn (3 dòng)
                    </span>
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                    <button
                      onClick={() => { setTetrisFilter('ALL'); soundFx.playClick(); }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition shrink-0 cursor-pointer ${
                        tetrisFilter === 'ALL'
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      Tất cả ({questions.length} câu)
                    </button>
                    <button
                      onClick={() => { setTetrisFilter('MC'); soundFx.playClick(); }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                        tetrisFilter === 'MC'
                          ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200 font-black'
                          : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                      }`}
                    >
                      <span>🎯 TRẮC NGHIỆM ABCD ({tetrisCounts.mc})</span>
                    </button>
                    <button
                      onClick={() => { setTetrisFilter('TF'); soundFx.playClick(); }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                        tetrisFilter === 'TF'
                          ? 'bg-blue-600 text-white shadow-sm shadow-blue-200 font-black'
                          : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
                      }`}
                    >
                      <span>✅ ĐÚNG / SAI 4 Ý ({tetrisCounts.tf})</span>
                    </button>
                    <button
                      onClick={() => { setTetrisFilter('SHORT'); soundFx.playClick(); }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                        tetrisFilter === 'SHORT'
                          ? 'bg-amber-600 text-white shadow-sm shadow-amber-200 font-black'
                          : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200'
                      }`}
                    >
                      <span>🔢 TRẢ LỜI NGẮN ({tetrisCounts.short})</span>
                    </button>
                    <button
                      onClick={() => { setTetrisFilter('Dễ'); soundFx.playClick(); }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                        tetrisFilter === 'Dễ'
                          ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200 font-black'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      <span>🟢 Dễ ({tetrisCounts.easy})</span>
                    </button>
                    <button
                      onClick={() => { setTetrisFilter('Trung bình'); soundFx.playClick(); }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                        tetrisFilter === 'Trung bình'
                          ? 'bg-amber-600 text-white shadow-sm shadow-amber-200 font-black'
                          : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200'
                      }`}
                    >
                      <span>🟡 Vừa ({tetrisCounts.medium})</span>
                    </button>
                    <button
                      onClick={() => { setTetrisFilter('Khó'); soundFx.playClick(); }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                        tetrisFilter === 'Khó'
                          ? 'bg-rose-600 text-white shadow-sm shadow-rose-200 font-black'
                          : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                      }`}
                    >
                      <span>🔴 Khó ({tetrisCounts.hard})</span>
                    </button>
                  </div>
                </div>
              )}

              {isMarioMode && (
                <div className="bg-white rounded-2xl border-2 border-slate-200 p-4 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
                      <span className="font-black text-xs sm:text-sm text-slate-800 uppercase tracking-wide">
                        BỘ LỌC 3 DẠNG CÂU & ĐỘ KHÓ GAME MARIO
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                      🍄 Hỗ trợ 3 Chuyên đề: Trắc nghiệm ABCD (7 dòng), Đúng/Sai (9 dòng) & Trả lời ngắn (3 dòng)
                    </span>
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                    <button
                      onClick={() => { setMarioFilter('ALL'); soundFx.playClick(); }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition shrink-0 cursor-pointer ${
                        marioFilter === 'ALL'
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      Tất cả ({questions.length} câu)
                    </button>
                    <button
                      onClick={() => { setMarioFilter('MC'); soundFx.playClick(); }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                        marioFilter === 'MC'
                          ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200 font-black'
                          : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                      }`}
                    >
                      <span>🎯 TRẮC NGHIỆM ABCD ({marioCounts.mc})</span>
                    </button>
                    <button
                      onClick={() => { setMarioFilter('TF'); soundFx.playClick(); }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                        marioFilter === 'TF'
                          ? 'bg-blue-600 text-white shadow-sm shadow-blue-200 font-black'
                          : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
                      }`}
                    >
                      <span>✅ ĐÚNG / SAI 4 Ý ({marioCounts.tf})</span>
                    </button>
                    <button
                      onClick={() => { setMarioFilter('SHORT'); soundFx.playClick(); }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                        marioFilter === 'SHORT'
                          ? 'bg-amber-600 text-white shadow-sm shadow-amber-200 font-black'
                          : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200'
                      }`}
                    >
                      <span>🔢 TRẢ LỜI NGẮN ({marioCounts.short})</span>
                    </button>
                    <button
                      onClick={() => { setMarioFilter('Dễ'); soundFx.playClick(); }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                        marioFilter === 'Dễ'
                          ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200 font-black'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      <span>🟢 Dễ ({marioCounts.easy})</span>
                    </button>
                    <button
                      onClick={() => { setMarioFilter('Trung bình'); soundFx.playClick(); }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                        marioFilter === 'Trung bình'
                          ? 'bg-amber-600 text-white shadow-sm shadow-amber-200 font-black'
                          : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200'
                      }`}
                    >
                      <span>🟡 Vừa ({marioCounts.medium})</span>
                    </button>
                    <button
                      onClick={() => { setMarioFilter('Khó'); soundFx.playClick(); }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                        marioFilter === 'Khó'
                          ? 'bg-rose-600 text-white shadow-sm shadow-rose-200 font-black'
                          : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                      }`}
                    >
                      <span>🔴 Khó ({marioCounts.hard})</span>
                    </button>
                  </div>
                </div>
              )}

              {isHaiTaoMode && (
                <div className="bg-white rounded-2xl border-2 border-slate-200 p-4 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="font-black text-xs sm:text-sm text-slate-800 uppercase tracking-wide">
                        BỘ LỌC 3 DẠNG CÂU & ĐỘ KHÓ GAME HÁI TÁO LUÂN PHIÊN
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                      🍎 Chuẩn 3 Dạng: Trắc nghiệm ABCD • Đúng/Sai ghép đề • Trả lời ngắn
                    </span>
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                    <button
                      onClick={() => { setHaiTaoFilter('ALL'); soundFx.playClick(); }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                        haiTaoFilter === 'ALL'
                          ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200 font-black'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      TẤT CẢ ({questions.length})
                    </button>
                    <button
                      onClick={() => { setHaiTaoFilter('MC'); soundFx.playClick(); }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                        haiTaoFilter === 'MC'
                          ? 'bg-blue-600 text-white shadow-sm shadow-blue-200 font-black'
                          : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
                      }`}
                    >
                      <span>🔘 TRẮC NGHIỆM ABCD ({haiTaoCounts.mc})</span>
                    </button>
                    <button
                      onClick={() => { setHaiTaoFilter('TF'); soundFx.playClick(); }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                        haiTaoFilter === 'TF'
                          ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200 font-black'
                          : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                      }`}
                    >
                      <span>⚖️ ĐÚNG / SAI ({haiTaoCounts.tf})</span>
                    </button>
                    <button
                      onClick={() => { setHaiTaoFilter('SHORT'); soundFx.playClick(); }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                        haiTaoFilter === 'SHORT'
                          ? 'bg-purple-600 text-white shadow-sm shadow-purple-200 font-black'
                          : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200'
                      }`}
                    >
                      <span>🔢 TRẢ LỜI NGẮN ({haiTaoCounts.short})</span>
                    </button>
                    <div className="w-px h-5 bg-slate-300 mx-1 shrink-0" />
                    <button
                      onClick={() => { setHaiTaoFilter('Dễ'); soundFx.playClick(); }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                        haiTaoFilter === 'Dễ'
                          ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200 font-black'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      <span>🟢 Dễ ({haiTaoCounts.easy})</span>
                    </button>
                    <button
                      onClick={() => { setHaiTaoFilter('Trung bình'); soundFx.playClick(); }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                        haiTaoFilter === 'Trung bình'
                          ? 'bg-amber-600 text-white shadow-sm shadow-amber-200 font-black'
                          : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200'
                      }`}
                    >
                      <span>🟡 Vừa ({haiTaoCounts.medium})</span>
                    </button>
                    <button
                      onClick={() => { setHaiTaoFilter('Khó'); soundFx.playClick(); }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                        haiTaoFilter === 'Khó'
                          ? 'bg-rose-600 text-white shadow-sm shadow-rose-200 font-black'
                          : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                      }`}
                    >
                      <span>🔴 Khó ({haiTaoCounts.hard})</span>
                    </button>
                  </div>
                </div>
              )}

              {isTraiTimMode && (
                <div className="bg-white rounded-2xl border-2 border-rose-200 p-4 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3 border-b border-rose-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
                      <span className="font-black text-xs sm:text-sm text-rose-800 uppercase tracking-wide">
                        BỘ LỌC LEVEL GAME GHÉP CẶP TRÁI TIM
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                      💖 Bảng dài 2 Cột • So khớp Multi-Match đa đáp án cùng giá trị
                    </span>
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                    <button
                      onClick={() => { setTraiTimLevelFilter('ALL'); soundFx.playClick(); }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition shrink-0 cursor-pointer ${
                        traiTimLevelFilter === 'ALL'
                          ? 'bg-rose-600 text-white shadow-sm'
                          : 'bg-rose-50 hover:bg-rose-100 text-rose-700'
                      }`}
                    >
                      Tất cả ({questions.length} cặp)
                    </button>
                    {traiTimLevels.map((lvl) => {
                      const count = questions.filter(q => (q.topic?.trim() || '') === lvl).length;
                      return (
                        <button
                          key={lvl}
                          onClick={() => { setTraiTimLevelFilter(lvl); soundFx.playClick(); }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                            traiTimLevelFilter === lvl
                              ? 'bg-rose-600 text-white shadow-sm font-black'
                              : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                          }`}
                        >
                          <span>{lvl} ({count})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {isPikachuMode && (
                <div className="bg-white rounded-2xl border-2 border-slate-200 p-4 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-cyan-500 animate-pulse" />
                      <span className="font-black text-xs sm:text-sm text-slate-800 uppercase tracking-wide">
                        BỘ LỌC CẤP ĐỘ GAME PIKACHU TOÁN HỌC
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                      ⚡ Bảng 48 ô • Tự động chọn ngẫu nhiên 24 cặp thẻ mỗi lượt
                    </span>
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                    <button
                      onClick={() => { setPikachuLevelFilter('ALL'); soundFx.playClick(); }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition shrink-0 cursor-pointer ${
                        pikachuLevelFilter === 'ALL'
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      Tất cả ({questions.length} cặp)
                    </button>
                    <button
                      onClick={() => { setPikachuLevelFilter('Dễ'); soundFx.playClick(); }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                        pikachuLevelFilter === 'Dễ'
                          ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200 font-black'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      <span>🟢 Level 1: Dễ ({pikachuCounts.easy})</span>
                    </button>
                    <button
                      onClick={() => { setPikachuLevelFilter('Trung bình'); soundFx.playClick(); }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                        pikachuLevelFilter === 'Trung bình'
                          ? 'bg-amber-600 text-white shadow-sm shadow-amber-200 font-black'
                          : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200'
                      }`}
                    >
                      <span>🟡 Level 2: Vừa ({pikachuCounts.medium})</span>
                    </button>
                    <button
                      onClick={() => { setPikachuLevelFilter('Khó'); soundFx.playClick(); }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                        pikachuLevelFilter === 'Khó'
                          ? 'bg-rose-600 text-white shadow-sm shadow-rose-200 font-black'
                          : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                      }`}
                    >
                      <span>🔴 Level 3: Khó ({pikachuCounts.hard})</span>
                    </button>
                  </div>
                </div>
              )}

              {displayedQuestions.length === 0 ? (
                <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border-2 border-dashed border-slate-200 p-8">
                  <Sparkles className="w-12 h-12 text-violet-300 mx-auto mb-3" />
                  <p className="font-bold text-base text-slate-600">Chưa có câu hỏi nào trong danh sách</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                    Thầy có thể bấm <b>"+ Thêm câu hỏi"</b>, <b>"Dán dữ liệu nhanh"</b> hoặc <b>"Nhập Word / Excel"</b> để bổ sung câu hỏi!
                  </p>
                  <button
                    onClick={handleAddEmpty}
                    className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl inline-flex items-center gap-1.5 shadow-sm"
                  >
                    <Plus className="w-4 h-4" /> Thêm câu hỏi mới
                  </button>
                </div>
              ) : (
                displayedQuestions.map((q, index) => (
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
                        onFocus={(e) => handleFieldFocus(e, { id: q.id, field: 'question', fieldName: `Đề bài Câu ${index + 1}` })}
                        onBlur={handleFieldBlur}
                        className="w-full p-2.5 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none min-h-[64px]"
                        placeholder="Nhập nội dung câu hỏi (hỗ trợ công thức LaTeX: \sin x, \frac{a}{b}...)..."
                      />
                      <div className="mt-2">
                        <input
                          type="text"
                          value={q.imageUrl || ''}
                          onChange={(e) => handleUpdate(q.id, 'imageUrl', e.target.value)}
                          placeholder="🖼️ Link hình ảnh minh họa (URL https://... hoặc để trống)..."
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:border-violet-400 focus:bg-white outline-none"
                        />
                        {q.imageUrl && (
                          <div className="mt-1.5 p-1 bg-slate-100 rounded-xl max-w-xs border border-slate-200">
                            <img src={q.imageUrl} alt="Minh họa câu hỏi" className="max-h-32 rounded-lg object-contain mx-auto" onError={(e) => (e.currentTarget.style.display = 'none')} />
                          </div>
                        )}
                      </div>
                      <MathLivePreview formula={q.question} />
                    </div>

                    {/* CÁC PHƯƠNG ÁN LỰA CHỌN */}
                    <div className={`grid gap-2.5 mb-3 ${isBanChimMode ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'}`}>
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
                              onFocus={(e) => handleFieldFocus(e, { id: q.id, field: 'option', optIndex: oIdx, fieldName: `Câu ${index + 1} - Đáp án ${String.fromCharCode(65 + oIdx)}` })}
                              onBlur={handleFieldBlur}
                              className={`flex-1 p-2 rounded-lg text-xs font-medium outline-none bg-transparent ${
                                isCorrect ? 'text-emerald-900 font-bold' : 'text-slate-800'
                              }`}
                              placeholder={`Lựa chọn ${String.fromCharCode(65 + oIdx)}...`}
                            />
                          </div>
                        );
                      })}
                      {isBanChimMode && q.options.length < 5 && (
                        <button
                          type="button"
                          onClick={() => {
                            const nextOpts = [...q.options];
                            while (nextOpts.length < 5) nextOpts.push('');
                            handleUpdate(q.id, 'options', nextOpts);
                          }}
                          className="p-2 bg-amber-50 hover:bg-amber-100 border border-dashed border-amber-300 rounded-xl text-amber-700 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                        >
                          + Bổ sung lựa chọn E (5 chú chim)
                        </button>
                      )}
                    </div>

                    {/* GIẢI THÍCH CHI TIẾT */}
                    <div>
                      <input
                        type="text"
                        value={q.explanation || ''}
                        onChange={(e) => handleUpdate(q.id, 'explanation', e.target.value)}
                        onFocus={(e) => handleFieldFocus(e, { id: q.id, field: 'explanation', fieldName: `Câu ${index + 1} - Lời giải chi tiết` })}
                        onBlur={handleFieldBlur}
                        className="w-full p-2 border border-slate-200 rounded-xl text-xs text-slate-600 focus:border-violet-400 outline-none"
                        placeholder="Lời giải / giải thích chi tiết (tùy chọn)..."
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* FOOTER ĐIỀU KHIỂN & 2 NÚT HÀNH ĐỘNG 1 BẤM */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-white flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="text-xs text-slate-500 font-bold">
            {isDragDropMode ? (
              <>
                Tổng cộng: <span className="text-indigo-700 text-sm font-black">{distinctTopics.length}</span> chuyên đề | <span className="text-cyan-700 text-sm font-black">{tableRows.length}</span> hộp đề bài | <span className="text-emerald-700 text-sm font-black">{tableRows.reduce((acc, r) => acc + r.attributes.length, 0)}</span> nhãn thuộc tính
              </>
            ) : isChienHaoMode ? (
              <>
                Bảo Vệ Chiến Hào: <span className="text-emerald-600 font-bold">{chienHaoCounts.easy} Dễ</span> | <span className="text-amber-600 font-bold">{chienHaoCounts.medium} Vừa</span> | <span className="text-rose-600 font-bold">{chienHaoCounts.hard} Khó</span> (Tổng: <span className="text-violet-700 font-black">{questions.length}</span> câu hỏi)
              </>
            ) : isSutPenMode ? (
              <>
                Sút Penalty: <span className="text-emerald-600 font-bold">{chienHaoCounts.easy} Vòng Bảng</span> | <span className="text-amber-600 font-bold">{chienHaoCounts.medium} Bán Kết</span> | <span className="text-rose-600 font-bold">{chienHaoCounts.hard} Chung Kết</span> (Tổng: <span className="text-violet-700 font-black">{questions.length}</span> câu hỏi)
              </>
            ) : isBanChimMode ? (
              <>
                Bắn Chim Xác Suất: <span className="text-emerald-600 font-bold">{banChimCounts.easy} Dễ</span> | <span className="text-amber-600 font-bold">{banChimCounts.medium} Vừa</span> | <span className="text-rose-600 font-bold">{banChimCounts.hard} Khó</span> (Tổng: <span className="text-violet-700 font-black">{questions.length}</span> câu hỏi)
              </>
            ) : isCaNguaMode ? (
              <>
                🎲 Cờ Cá Ngựa: <span className="text-indigo-600 font-bold">{caNguaCounts.mc} Trắc nghiệm ABCD</span> | <span className="text-blue-600 font-bold">{caNguaCounts.tf} Đúng/Sai (4 ý)</span> (Tổng: <span className="text-violet-700 font-black">{questions.length}</span> câu hỏi)
              </>
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
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-2xl w-full max-h-[80dvh] sm:max-h-[85vh] overflow-y-auto flex flex-col shadow-2xl border-4 border-violet-200" style={{ WebkitOverflowScrolling: 'touch' }}>
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
