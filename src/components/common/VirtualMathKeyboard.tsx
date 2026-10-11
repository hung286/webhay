import React, { useState, useEffect, useRef } from 'react';
import { X, Delete, CornerDownLeft, Sparkles, Eye, Calculator } from 'lucide-react';

declare global {
  interface Window {
    katex?: any;
  }
}

interface VirtualMathKeyboardProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (snippet: string) => void;
  onBackspace?: () => void;
  currentValue?: string;
  targetFieldName?: string;
}

export const VirtualMathKeyboard: React.FC<VirtualMathKeyboardProps> = ({
  isOpen,
  onClose,
  onInsert,
  onBackspace,
  currentValue = '',
  targetFieldName = 'Ô nhập liệu'
}) => {
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced' | 'trig' | 'functions' | 'qwerty'>('basic');
  const [isShift, setIsShift] = useState<boolean>(false);
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const previewRef = useRef<HTMLDivElement>(null);

  // Load KaTeX dynamic from CDN for Live Preview
  useEffect(() => {
    if (!window.katex) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js';
      script.onload = () => updatePreview(currentValue);
      document.head.appendChild(script);
    } else {
      updatePreview(currentValue);
    }
  }, [currentValue]);

  const updatePreview = (text: string) => {
    if (!text) {
      setPreviewHtml('<span class="text-slate-400 italic">Nhập công thức hoặc bấm phím để xem trước...</span>');
      return;
    }

    try {
      if (window.katex) {
        // Find $...$ or treat whole string as math if it contains backslashes or math operators
        const cleanText = text.includes('$') 
          ? text.replace(/\$(.*?)\$/g, (_, math) => {
              try { return window.katex.renderToString(math, { throwOnError: false }); }
              catch { return math; }
            })
          : window.katex.renderToString(text, { throwOnError: false });
        setPreviewHtml(cleanText);
      } else {
        setPreviewHtml(`<span>${text}</span>`);
      }
    } catch {
      setPreviewHtml(`<span>${text}</span>`);
    }
  };

  if (!isOpen) return null;

  const basicKeys = [
    { label: '0', val: '0' }, { label: '1', val: '1' }, { label: '2', val: '2' }, { label: '3', val: '3' }, { label: '4', val: '4' },
    { label: '5', val: '5' }, { label: '6', val: '6' }, { label: '7', val: '7' }, { label: '8', val: '8' }, { label: '9', val: '9' },
    { label: 'x', val: 'x' }, { label: 'y', val: 'y' }, { label: 'z', val: 'z' }, { label: 't', val: 't' }, { label: '+', val: ' + ' },
    { label: '-', val: ' - ' }, { label: '×', val: ' \\times ' }, { label: '/', val: '/' }, { label: '=', val: ' = ' }, { label: '≠', val: ' \\ne ' },
    { label: '<', val: ' < ' }, { label: '>', val: ' > ' }, { label: '≤', val: ' \\le ' }, { label: '≥', val: ' \\ge ' }, { label: ',', val: ', ' },
    { label: '(', val: '(' }, { label: ')', val: ')' }, { label: '[', val: '[' }, { label: ']', val: ']' }, { label: '{ }', val: '\\{ \\}' }
  ];

  const advancedKeys = [
    { label: 'a/b (Phân số)', val: '\\frac{a}{b}' },
    { label: '√x (Căn bậc 2)', val: '\\sqrt{x}' },
    { label: 'ⁿ√x (Căn n)', val: '\\sqrt[n]{x}' },
    { label: 'x² (Mũ 2)', val: '^2' },
    { label: 'x³ (Mũ 3)', val: '^3' },
    { label: 'xⁿ (Mũ n)', val: '^{n}' },
    { label: 'xₙ (Chỉ số dưới)', val: '_{n}' },
    { label: 'log_a(b)', val: '\\log_{a}(b)' },
    { label: 'ln(x)', val: '\\ln(x)' },
    { label: 'lg(x)', val: '\\lg(x)' },
    { label: 'e^x', val: 'e^{x}' },
    { label: '|x| (Trị tuyệt đối)', val: '|x|' },
    { label: "y' (Đạo hàm 1)", val: "y'" },
    { label: "y'' (Đạo hàm 2)", val: "y''" },
    { label: 'f(x)', val: 'f(x)' },
    { label: 'C_n^k (Tổ hợp)', val: 'C_{n}^{k}' },
    { label: 'A_n^k (Chỉnh hợp)', val: 'A_{n}^{k}' },
    { label: 'P(A) (Xác suất)', val: 'P(A)' },
    { label: '∫ (Tích phân)', val: '\\int_{a}^{b}' },
    { label: 'lim (Giới hạn)', val: '\\lim_{x \\to x_0}' },
    { label: '∞ (Vô cực)', val: '\\infty' },
    { label: '+∞', val: '+\\infty' },
    { label: '-∞', val: '-\\infty' },
    { label: '→', val: ' \\rightarrow ' },
    { label: '⇒', val: ' \\Rightarrow ' },
    { label: '⇔', val: ' \\Leftrightarrow ' },
    { label: 'Δ (Delta)', val: '\\Delta' }
  ];

  const trigKeys = [
    { label: 'sin', val: '\\sin(x)' },
    { label: 'cos', val: '\\cos(x)' },
    { label: 'tan', val: '\\tan(x)' },
    { label: 'cot', val: '\\cot(x)' },
    { label: 'π (Pi)', val: '\\pi' },
    { label: '2π', val: '2\\pi' },
    { label: 'π/2', val: '\\frac{\\pi}{2}' },
    { label: 'α (Alpha)', val: '\\alpha' },
    { label: 'β (Beta)', val: '\\beta' },
    { label: 'θ (Theta)', val: '\\theta' },
    { label: '∈ (Thuộc)', val: ' \\in ' },
    { label: '∉ (Không thuộc)', val: ' \\notin ' },
    { label: '∪ (Hợp)', val: ' \\cup ' },
    { label: '∩ (Giao)', val: ' \\cap ' },
    { label: '∅ (Rỗng)', val: '\\emptyset' },
    { label: 'ℝ (Số thực)', val: '\\mathbb{R}' },
    { label: 'ℕ (Tự nhiên)', val: '\\mathbb{N}' },
    { label: 'ℤ (Nguyên)', val: '\\mathbb{Z}' },
    { label: '∀ (Với mọi)', val: '\\forall ' },
    { label: '∃ (Tồn tại)', val: '\\exists ' }
  ];

  const functionTemplates = [
    { label: '$y = x^3 - 3x$', val: 'y = x^3 - 3x' },
    { label: '$y = -x^3 + 3x^2$', val: 'y = -x^3 + 3x^2' },
    { label: '$y = x^4 - 2x^2 + 1$', val: 'y = x^4 - 2x^2 + 1' },
    { label: '$y = \\frac{ax+b}{cx+d}$', val: 'y = \\frac{ax+b}{cx+d}' },
    { label: 'Đồng biến trên khoảng', val: 'Hàm số đồng biến trên khoảng ' },
    { label: 'Nghịch biến trên khoảng', val: 'Hàm số nghịch biến trên khoảng ' },
    { label: 'Đạt cực đại tại', val: 'Hàm số đạt cực đại tại $x = $' },
    { label: 'Đạt cực tiểu tại', val: 'Hàm số đạt cực tiểu tại $x = $' },
    { label: 'Giá trị CĐ y_CD =', val: 'Giá trị cực đại của hàm số $y_{CĐ} = $' },
    { label: 'Giá trị CT y_CT =', val: 'Giá trị cực tiểu của hàm số $y_{CT} = $' },
    { label: '(-∞; +∞)', val: '(-\\infty; +\\infty)' },
    { label: 'Đạo hàm y\' > 0, ∀x', val: 'Đạo hàm $y\' > 0, \\forall x \\in \\mathbb{R}$' }
  ];

  const qwertyRow1 = ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'];
  const qwertyRow2 = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'];
  const qwertyRow3 = ['z', 'x', 'c', 'v', 'b', 'n', 'm'];
  const vnSpecialKeys = ['ă', 'â', 'đ', 'ê', 'ô', 'ơ', 'ư', 'á', 'à', 'ả', 'ã', 'ạ', 'é', 'è', 'ẻ', 'ẽ', 'ẹ', 'í', 'ì', 'ỉ', 'ĩ', 'ị', 'ó', 'ò', 'ỏ', 'õ', 'ọ', 'ú', 'ù', 'ủ', 'ũ', 'ụ', 'ý', 'ỳ', 'ỷ', 'ỹ', 'ỵ'];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] bg-slate-900/98 backdrop-blur-2xl border-t-2 border-violet-500/50 shadow-[0_-15px_45px_rgba(0,0,0,0.8)] text-white p-3 sm:p-4 max-h-[85vh] flex flex-col animate-in slide-in-from-bottom-6 duration-200">
      <div className="max-w-5xl mx-auto w-full flex flex-col gap-2.5">
        
        {/* HEADER BÀN PHÍM & LIVE PREVIEW */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-violet-600/30 text-violet-300 border border-violet-500/30">
              <Calculator className="w-4 h-4" />
            </span>
            <div>
              <span className="text-xs font-black uppercase text-slate-300 tracking-wider">
                Bàn Phím Toán Học Ảo
              </span>
              <span className="text-[11px] text-violet-400 ml-2 font-medium">
                (Đang trỏ vào: <b className="text-white">{targetFieldName}</b>)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto flex-wrap">
            <button
              onClick={() => setActiveTab(activeTab === 'qwerty' ? 'basic' : 'qwerty')}
              className="px-2.5 py-1 bg-cyan-900/80 hover:bg-cyan-700 text-cyan-200 hover:text-white rounded-lg text-xs font-black border border-cyan-500/50 transition flex items-center gap-1 cursor-pointer"
              title="Chuyển đổi nhanh giữa Chế độ Toán và Bàn phím QWERTY"
            >
              {activeTab === 'qwerty' ? '∑ Sang Phím Toán' : '🔤 Sang Phím QWERTY'}
            </button>
            <button
              onClick={() => onInsert('$')}
              className="px-2.5 py-1 bg-violet-950/80 hover:bg-violet-700 text-violet-300 hover:text-white rounded-lg text-xs font-bold border border-violet-500/40 transition cursor-pointer"
              title="Chèn dấu bao bọc công thức Toán $"
            >
              Kẹp thẻ $...$
            </button>
            <button
              onClick={onBackspace}
              className="px-2.5 py-1 bg-rose-950/80 hover:bg-rose-700 text-rose-300 hover:text-white rounded-lg text-xs font-bold border border-rose-500/40 flex items-center gap-1 transition"
              title="Xóa 1 ký tự phía trước"
            >
              <Delete className="w-3.5 h-3.5" /> Xóa lùi
            </button>
            <button
              onClick={onClose}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition ml-1"
              title="Đóng bàn phím"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* LIVE PREVIEW KHUNG HIỂN THỊ CÔNG THỨC */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-xl px-3 py-2 flex items-center gap-3 overflow-x-auto min-h-[44px]">
          <span className="text-[10px] font-black uppercase text-amber-400 shrink-0 flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" /> Xem trước:
          </span>
          <div 
            ref={previewRef}
            className="text-sm font-semibold text-emerald-300 overflow-x-auto whitespace-nowrap"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        </div>

        {/* CÁC TAB CHỦ ĐỀ PHÍM */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold custom-scrollbar">
          <button
            onClick={() => setActiveTab('basic')}
            className={`px-3 py-1.5 rounded-lg transition shrink-0 ${
              activeTab === 'basic' 
                ? 'bg-violet-600 text-white shadow-md' 
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
            }`}
          >
            Số & Biến số
          </button>
          <button
            onClick={() => setActiveTab('advanced')}
            className={`px-3 py-1.5 rounded-lg transition shrink-0 ${
              activeTab === 'advanced' 
                ? 'bg-violet-600 text-white shadow-md' 
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
            }`}
          >
            Phép tính & Log & Mũ
          </button>
          <button
            onClick={() => setActiveTab('trig')}
            className={`px-3 py-1.5 rounded-lg transition shrink-0 ${
              activeTab === 'trig' 
                ? 'bg-violet-600 text-white shadow-md' 
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
            }`}
          >
            Lượng giác & Ký hiệu
          </button>
          <button
            onClick={() => setActiveTab('functions')}
            className={`px-3 py-1.5 rounded-lg transition shrink-0 ${
              activeTab === 'functions' 
                ? 'bg-emerald-600 text-white shadow-md' 
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
            }`}
          >
            Mẫu Hàm Số
          </button>
          <button
            onClick={() => setActiveTab('qwerty')}
            className={`px-3.5 py-1.5 rounded-lg transition shrink-0 font-black flex items-center gap-1 ${
              activeTab === 'qwerty' 
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30' 
                : 'bg-cyan-950/70 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-900/80 hover:text-white'
            }`}
          >
            <span>🔤</span> Chữ Cái & Tiếng Việt (QWERTY)
          </button>
        </div>

        {/* LƯỚI PHÍM BẤM */}
        <div className="overflow-y-auto max-h-[38vh] pr-1 custom-scrollbar">
          {activeTab === 'basic' && (
            <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5">
              {basicKeys.map((k, idx) => (
                <button
                  key={idx}
                  onClick={() => onInsert(k.val)}
                  className="py-2.5 px-1 bg-slate-800 hover:bg-violet-600 active:scale-95 text-slate-100 font-black text-sm rounded-xl border border-slate-700/60 shadow-sm transition-all text-center flex items-center justify-center cursor-pointer"
                >
                  {k.label}
                </button>
              ))}
            </div>
          )}

          {activeTab === 'advanced' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-1.5">
              {advancedKeys.map((k, idx) => (
                <button
                  key={idx}
                  onClick={() => onInsert(k.val)}
                  className="py-2.5 px-2 bg-slate-800 hover:bg-violet-600 active:scale-95 text-slate-100 font-bold text-xs rounded-xl border border-slate-700/60 shadow-sm transition-all text-center truncate cursor-pointer"
                  title={k.val}
                >
                  {k.label}
                </button>
              ))}
            </div>
          )}

          {activeTab === 'trig' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-1.5">
              {trigKeys.map((k, idx) => (
                <button
                  key={idx}
                  onClick={() => onInsert(k.val)}
                  className="py-2.5 px-2 bg-slate-800 hover:bg-violet-600 active:scale-95 text-slate-100 font-bold text-xs rounded-xl border border-slate-700/60 shadow-sm transition-all text-center truncate cursor-pointer"
                  title={k.val}
                >
                  {k.label}
                </button>
              ))}
            </div>
          )}

          {activeTab === 'functions' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {functionTemplates.map((k, idx) => (
                <button
                  key={idx}
                  onClick={() => onInsert(k.val)}
                  className="py-2.5 px-3 bg-slate-800/90 hover:bg-emerald-600 active:scale-95 text-slate-100 font-semibold text-xs rounded-xl border border-emerald-500/30 shadow-sm transition-all text-left flex items-center justify-between cursor-pointer"
                  title={k.val}
                >
                  <span className="truncate">{k.label}</span>
                  <span className="text-[10px] text-emerald-400 font-mono ml-1">chèn ↵</span>
                </button>
              ))}
            </div>
          )}

          {/* TAB BÀN PHÍM LAI QWERTY TIẾNG VIỆT TIÊU CHUẨN */}
          {activeTab === 'qwerty' && (
            <div className="flex flex-col gap-1.5">
              {/* Dãy phím số 0-9 */}
              <div className="grid grid-cols-10 gap-1">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map((digit) => (
                  <button
                    key={digit}
                    onClick={() => onInsert(digit)}
                    className="py-2 bg-slate-800 hover:bg-cyan-600 active:scale-95 text-slate-100 font-bold text-xs sm:text-sm rounded-lg border border-slate-700 transition cursor-pointer"
                  >
                    {digit}
                  </button>
                ))}
              </div>

              {/* Hàng QWERTY 1 */}
              <div className="grid grid-cols-10 gap-1">
                {qwertyRow1.map((char) => {
                  const displayChar = isShift ? char.toUpperCase() : char;
                  return (
                    <button
                      key={char}
                      onClick={() => onInsert(displayChar)}
                      className="py-2.5 bg-slate-800 hover:bg-cyan-600 active:scale-95 text-slate-100 font-bold text-xs sm:text-sm rounded-lg border border-slate-700 transition cursor-pointer"
                    >
                      {displayChar}
                    </button>
                  );
                })}
              </div>

              {/* Hàng QWERTY 2 */}
              <div className="grid grid-cols-9 gap-1 px-2 sm:px-6">
                {qwertyRow2.map((char) => {
                  const displayChar = isShift ? char.toUpperCase() : char;
                  return (
                    <button
                      key={char}
                      onClick={() => onInsert(displayChar)}
                      className="py-2.5 bg-slate-800 hover:bg-cyan-600 active:scale-95 text-slate-100 font-bold text-xs sm:text-sm rounded-lg border border-slate-700 transition cursor-pointer"
                    >
                      {displayChar}
                    </button>
                  );
                })}
              </div>

              {/* Hàng QWERTY 3 với Shift & Backspace */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsShift(!isShift)}
                  className={`px-3 py-2.5 rounded-lg text-xs font-black transition cursor-pointer border ${
                    isShift 
                      ? 'bg-amber-500 text-slate-950 border-amber-400' 
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                  title="Bật/Tắt viết hoa (Shift)"
                >
                  ⇧ Shift
                </button>
                <div className="grid grid-cols-7 gap-1 flex-1">
                  {qwertyRow3.map((char) => {
                    const displayChar = isShift ? char.toUpperCase() : char;
                    return (
                      <button
                        key={char}
                        onClick={() => onInsert(displayChar)}
                        className="py-2.5 bg-slate-800 hover:bg-cyan-600 active:scale-95 text-slate-100 font-bold text-xs sm:text-sm rounded-lg border border-slate-700 transition cursor-pointer"
                      >
                        {displayChar}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={onBackspace}
                  className="px-3 py-2.5 bg-rose-950/80 hover:bg-rose-700 text-rose-300 hover:text-white rounded-lg text-xs font-bold border border-rose-500/40 transition flex items-center gap-1 cursor-pointer"
                  title="Xóa 1 ký tự"
                >
                  <Delete className="w-3.5 h-3.5" /> ⌫
                </button>
              </div>

              {/* Ký tự tiếng Việt đặc thù */}
              <div className="flex flex-wrap items-center gap-1 bg-slate-950/60 p-1.5 rounded-xl border border-slate-800 justify-center">
                <span className="text-[10px] font-bold text-cyan-400 px-1">Tiếng Việt:</span>
                {vnSpecialKeys.map((vnChar) => {
                  const displayChar = isShift ? vnChar.toUpperCase() : vnChar;
                  return (
                    <button
                      key={vnChar}
                      onClick={() => onInsert(displayChar)}
                      className="px-2 py-1 bg-slate-800/90 hover:bg-cyan-600 text-slate-200 font-bold text-xs rounded-md border border-slate-700 transition cursor-pointer"
                    >
                      {displayChar}
                    </button>
                  );
                })}
              </div>

              {/* Hàng Spacebar & Dấu câu */}
              <div className="flex items-center gap-1.5 pt-1">
                {['.', ',', ':', ';', '(', ')', '+', '-', '=', '/'].map((punc) => (
                  <button
                    key={punc}
                    onClick={() => onInsert(punc)}
                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-lg border border-slate-700 transition cursor-pointer"
                  >
                    {punc}
                  </button>
                ))}
                <button
                  onClick={() => onInsert(' ')}
                  className="flex-2 py-2 bg-slate-700 hover:bg-cyan-600 active:scale-95 text-white font-bold text-xs rounded-lg border border-slate-600 transition cursor-pointer text-center"
                >
                  Dấu Cách (Space)
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
