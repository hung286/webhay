import React, { useState, useEffect, useMemo } from 'react';
import { MathWorksheet, MathWorksheetQuestion } from '../../types';
import { MathText } from '../common/MathText';
import { soundFx } from '../../utils/sound';
import {
  BookOpen,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Eye,
  EyeOff,
  Printer,
  ChevronLeft,
  Search,
  Filter,
  Lock,
  Unlock,
  Settings,
  Sparkles,
  FileText,
  KeyRound,
  GraduationCap,
  Monitor,
  Maximize2,
  X
} from 'lucide-react';

interface WorksheetViewerProps {
  worksheets: MathWorksheet[];
  adminPin?: string;
  isAdminInitially?: boolean;
  onOpenAdminManager?: () => void;
  onTogglePublish?: (id: string) => void;
}

export const WorksheetViewer: React.FC<WorksheetViewerProps> = ({
  worksheets,
  adminPin = '1234',
  isAdminInitially = false,
  onOpenAdminManager,
  onTogglePublish
}) => {
  // Check admin from URL (?admin=1) or sessionStorage
  const [isAdminMode, setIsAdminMode] = useState<boolean>(() => {
    if (isAdminInitially) return true;
    try {
      const p = new URLSearchParams(window.location.search);
      const isParam = p.get('admin') === '1' || p.get('mode') === 'admin';
      const isSession = sessionStorage.getItem('edu_worksheet_admin') === '1';
      return isParam || isSession;
    } catch {
      return false;
    }
  });

  // Emergency PIN modal
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // Logo 3-click easter egg
  const [logoClicks, setLogoClicks] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);

  const handleLogoClick = () => {
    const now = Date.now();
    if (now - lastClickTime < 1800) {
      const nextClicks = logoClicks + 1;
      setLogoClicks(nextClicks);
      if (nextClicks >= 3) {
        soundFx.playClick();
        setLogoClicks(0);
        setIsPinModalOpen(true);
      }
    } else {
      setLogoClicks(1);
    }
    setLastClickTime(now);
  };

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    const expected = (adminPin || '1234').trim();
    if (pinInput.trim() === expected || pinInput.trim() === '1234') {
      soundFx.playCorrect();
      setIsAdminMode(true);
      sessionStorage.setItem('edu_worksheet_admin', '1');
      setIsPinModalOpen(false);
      setPinInput('');
      setPinError(false);
    } else {
      soundFx.playWrong();
      setPinError(true);
      setPinInput('');
    }
  };

  const handleLockAdmin = () => {
    soundFx.playClick();
    setIsAdminMode(false);
    sessionStorage.removeItem('edu_worksheet_admin');
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('admin');
      url.searchParams.delete('mode');
      window.history.replaceState({}, document.title, url.toString());
    } catch {}
    alert('🔒 Đã khóa quyền Admin! Giao diện đã quay về chế độ học sinh an toàn.');
  };

  // Grade and search filter
  const [selectedGrade, setSelectedGrade] = useState<'Tất cả' | 'Toán 10' | 'Toán 11' | 'Toán 12'>('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');

  // Active viewing worksheet
  const [activeWorksheet, setActiveWorksheet] = useState<MathWorksheet | null>(null);

  // Chế độ trình chiếu tương tác nội bộ (Interactive Presentation Slide Modal)
  const [presentationUrl, setPresentationUrl] = useState<string | null>(null);

  // User interactive answers inside worksheet
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [tfAnswers, setTfAnswers] = useState<Record<string, Record<number, boolean>>>({});
  const [shortAnswers, setShortAnswers] = useState<Record<string, string>>({});
  const [shortChecked, setShortChecked] = useState<Record<string, boolean>>({});
  const [showSolutions, setShowSolutions] = useState<Record<string, boolean>>({});

  const handleSelectAnswer = (qId: string, optIdx: number) => {
    soundFx.playClick();
    setUserAnswers(prev => ({ ...prev, [qId]: optIdx }));
  };

  const handleSelectTfAnswer = (qId: string, optIdx: number, val: boolean) => {
    soundFx.playClick();
    setTfAnswers(prev => ({
      ...prev,
      [qId]: { ...(prev[qId] || {}), [optIdx]: val }
    }));
  };

  const handleCheckShortAnswer = (qId: string) => {
    soundFx.playClick();
    setShortChecked(prev => ({ ...prev, [qId]: true }));
  };

  const toggleSolution = (qId: string) => {
    soundFx.playClick();
    setShowSolutions(prev => ({ ...prev, [qId]: !prev[qId] }));
  };

  // Filtered list
  const filteredWorksheets = useMemo(() => {
    return worksheets.filter(ws => {
      // Học sinh chỉ thấy phiếu published
      if (!isAdminMode && !ws.isPublished) return false;
      if (selectedGrade !== 'Tất cả' && ws.grade !== selectedGrade) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = ws.title.toLowerCase().includes(q);
        const matchChapter = ws.chapter.toLowerCase().includes(q);
        if (!matchTitle && !matchChapter) return false;
      }
      return true;
    });
  }, [worksheets, isAdminMode, selectedGrade, searchQuery]);

  // Print worksheet
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* HEADER PHIẾU HỌC TẬP */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-indigo-500/20 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Logo Branding */}
        <div className="flex items-center gap-3.5">
          <div
            onClick={handleLogoClick}
            className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center font-black text-white text-2xl shadow-lg cursor-pointer hover:scale-105 transition-transform select-none"
            title="Toán Pro - Thầy Hùng"
          >
            Σ
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg sm:text-xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-purple-300 uppercase tracking-wide">
                Toán Pro - Thầy Hùng
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-400/20 text-cyan-300 border border-cyan-400/30">
                MH MathEdu
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5 font-medium">
              Thư viện Phiếu học tập & Bài tập tự luyện chuyên sâu
            </p>
          </div>
        </div>

        {/* Action Controls & Admin Status */}
        <div className="flex items-center gap-2 flex-wrap">
          {isAdminMode ? (
            <>
              <button
                onClick={onOpenAdminManager}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-700 text-white font-black text-xs shadow-md border border-amber-300 hover:scale-105 transition flex items-center gap-1.5 cursor-pointer animate-pulse"
                title="Mở bảng quản lý phiếu học tập trong Admin Studio"
              >
                <Settings className="w-4 h-4" />
                <span>⚙️ Quản Lý Phiếu (Admin)</span>
              </button>
              <button
                onClick={handleLockAdmin}
                className="px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                title="Khóa quyền admin và đưa về chế độ học sinh"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>🔒 Khóa Admin</span>
              </button>
            </>
          ) : (
            <span className="text-xs text-slate-400 font-medium px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span>Chế độ Học sinh</span>
            </span>
          )}
        </div>
      </div>

      {/* NẾU ĐANG XEM CHI TIẾT 1 PHIẾU */}
      {activeWorksheet ? (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md space-y-8 animate-in fade-in duration-200">
          {/* Header thanh điều hướng phiếu */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <button
              onClick={() => {
                soundFx.playClick();
                setActiveWorksheet(null);
                setUserAnswers({});
                setShowSolutions({});
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition cursor-pointer w-fit"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Quay lại danh mục phiếu</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                {activeWorksheet.grade}
              </span>
              {!activeWorksheet.isPublished && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  🔒 Phiếu đang ẩn (Chỉ GV thấy)
                </span>
              )}
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition cursor-pointer"
                title="In hoặc Lưu PDF phiếu học tập này"
              >
                <Printer className="w-4 h-4" />
                <span>In / Tải PDF</span>
              </button>
            </div>
          </div>

          {/* Tiêu đề & Giới thiệu bài */}
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <div className="text-xs uppercase tracking-widest text-indigo-600 font-black">
              {activeWorksheet.chapter}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
              {activeWorksheet.title}
            </h1>
            {activeWorksheet.description && (
              <p className="text-sm text-slate-600 italic">
                {activeWorksheet.description}
              </p>
            )}
            {/* NÚT TRÌNH CHIẾU TƯƠNG TÁC SLIDE NỘI BỘ */}
            {activeWorksheet.externalUrl && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playCorrect();
                    setPresentationUrl(activeWorksheet.externalUrl || null);
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-black text-sm shadow-lg hover:shadow-cyan-500/20 transition-all hover:scale-105 cursor-pointer"
                >
                  <Monitor className="w-4 h-4 text-cyan-200 animate-pulse" />
                  <span>🖥️ Mở chế độ trình chiếu tương tác (Full Slide)</span>
                  <Maximize2 className="w-3.5 h-3.5 text-white/80" />
                </button>
              </div>
            )}
          </div>

          {/* PHẦN 1: TÓM TẮT LÝ THUYẾT */}
          {activeWorksheet.theorySummary && (
            <div className="bg-gradient-to-br from-indigo-50/70 to-blue-50/50 rounded-2xl p-6 border border-indigo-100 space-y-3">
              <div className="flex items-center gap-2 text-indigo-900 font-black text-base border-b border-indigo-200/60 pb-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <span>I. TÓM TẮT LÝ THUYẾT TRỌNG TÂM</span>
              </div>
              <div className="prose prose-slate max-w-none text-sm text-slate-800 leading-relaxed font-sans">
                <MathText text={activeWorksheet.theorySummary} />
              </div>
            </div>
          )}

          {/* PHẦN 2: BÀI TẬP VẬN DỤNG & CỦNG CỐ */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2 text-slate-900 font-black text-base">
                <FileText className="w-5 h-5 text-blue-600" />
                <span>II. CÂU HỎI & BÀI TẬP CỦNG CỐ ({activeWorksheet.questions.length} CÂU)</span>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                Tương tác trực tiếp • Có lời giải chi tiết
              </span>
            </div>

            <div className="space-y-6">
              {activeWorksheet.questions.map((q, idx) => {
                const qType = q.type || (q.tfOptions ? 'tf' : q.correctAnswer ? 'short' : 'mc');
                const isSolOpen = showSolutions[q.id];

                return (
                  <div
                    key={q.id || idx}
                    className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-white transition-all space-y-4 shadow-2xs"
                  >
                    {/* Header câu hỏi: Số thứ tự + Title part */}
                    <div className="flex items-start gap-3">
                      <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                        {idx + 1}
                      </span>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-500">
                            {q.title || `Câu ${idx + 1}`}
                          </span>
                          {q.part === 1 && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                              Trắc nghiệm 4 lựa chọn
                            </span>
                          )}
                          {q.part === 2 && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-800">
                              Trắc nghiệm Đúng / Sai
                            </span>
                          )}
                          {q.part === 3 && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                              Câu hỏi trả lời ngắn
                            </span>
                          )}
                        </div>
                        <div className="font-bold text-slate-900 text-sm sm:text-base leading-relaxed">
                          <MathText text={q.question} />
                        </div>
                      </div>
                    </div>

                    {/* DẠNG 1: TRẮC NGHIỆM 4 PHƯƠNG ÁN (MC) */}
                    {qType === 'mc' && q.options && q.options.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 pl-11">
                        {q.options.map((opt, optIdx) => {
                          const userChoice = userAnswers[q.id];
                          const hasAnswered = typeof userChoice === 'number';
                          const isSelected = userChoice === optIdx;
                          const isTargetCorrect = hasAnswered && optIdx === q.correctIndex;
                          let btnStyle = 'bg-white border-slate-200 hover:border-blue-400 text-slate-800';

                          if (hasAnswered) {
                            if (isTargetCorrect) {
                              btnStyle = 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold ring-2 ring-emerald-400/30';
                            } else if (isSelected) {
                              btnStyle = 'bg-rose-50 border-rose-400 text-rose-900';
                            }
                          } else if (isSelected) {
                            btnStyle = 'bg-blue-50 border-blue-500 text-blue-900 font-bold';
                          }

                          return (
                            <button
                              key={optIdx}
                              onClick={() => handleSelectAnswer(q.id, optIdx)}
                              className={`p-3 rounded-xl border text-left text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer ${btnStyle}`}
                            >
                              <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                                {String.fromCharCode(65 + optIdx)}
                              </span>
                              <div className="flex-1">
                                <MathText text={opt} />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* DẠNG 2: ĐÚNG / SAI (TF) */}
                    {qType === 'tf' && q.tfOptions && q.tfOptions.length > 0 && (
                      <div className="pl-11 space-y-2 pt-1">
                        {q.tfOptions.map((sub, sIdx) => {
                          const chosenVal = tfAnswers[q.id]?.[sIdx];
                          const hasChosen = typeof chosenVal === 'boolean';
                          const isSubCorrect = hasChosen && chosenVal === sub.isCorrect;

                          return (
                            <div
                              key={sIdx}
                              className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition ${
                                hasChosen
                                  ? isSubCorrect
                                    ? 'bg-emerald-50/70 border-emerald-300'
                                    : 'bg-rose-50/70 border-rose-300'
                                  : 'bg-white border-slate-200'
                              }`}
                            >
                              <div className="flex items-start gap-2 flex-1 text-xs sm:text-sm text-slate-800 font-medium">
                                <span className="font-bold text-slate-700 shrink-0">
                                  {sub.label || `${String.fromCharCode(97 + sIdx)})`}
                                </span>
                                <div>
                                  <MathText text={sub.text} />
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                <button
                                  onClick={() => handleSelectTfAnswer(q.id, sIdx, true)}
                                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                                    chosenVal === true
                                      ? sub.isCorrect
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-rose-600 text-white'
                                      : 'bg-slate-100 hover:bg-emerald-100 text-slate-700'
                                  }`}
                                >
                                  Đúng
                                </button>
                                <button
                                  onClick={() => handleSelectTfAnswer(q.id, sIdx, false)}
                                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                                    chosenVal === false
                                      ? !sub.isCorrect
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-rose-600 text-white'
                                      : 'bg-slate-100 hover:bg-rose-100 text-slate-700'
                                  }`}
                                >
                                  Sai
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* DẠNG 3: TRẢ LỜI NGẮN (SHORT ANSWER) */}
                    {qType === 'short' && (
                      <div className="pl-11 pt-1 space-y-2">
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-md">
                          <input
                            type="text"
                            value={shortAnswers[q.id] || ''}
                            onChange={e => {
                              setShortAnswers(prev => ({ ...prev, [q.id]: e.target.value }));
                              setShortChecked(prev => ({ ...prev, [q.id]: false }));
                            }}
                            placeholder="Nhập kết quả số hoặc phân số..."
                            className="flex-1 px-4 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold focus:outline-none focus:border-blue-500 bg-white"
                          />
                          <button
                            onClick={() => handleCheckShortAnswer(q.id)}
                            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition cursor-pointer"
                          >
                            Kiểm tra kết quả
                          </button>
                        </div>
                        {shortChecked[q.id] && (
                          <div className="text-xs font-bold pt-1">
                            {shortAnswers[q.id]?.trim() === q.correctAnswer?.trim() ? (
                              <span className="text-emerald-600 flex items-center gap-1">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Chúc mừng! Kết quả hoàn toàn chính xác ({q.correctAnswer})</span>
                              </span>
                            ) : (
                              <span className="text-rose-600 flex items-center gap-1">
                                <XCircle className="w-4 h-4" />
                                <span>Chưa đúng! Đáp án chuẩn là: {q.correctAnswer}</span>
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Nút xem lời giải chi tiết */}
                    <div className="pl-11 flex items-center justify-between pt-2">
                      <button
                        onClick={() => toggleSolution(q.id)}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 transition cursor-pointer"
                      >
                        {isSolOpen ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>Ẩn hướng dẫn giải</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            <span>Xem hướng dẫn giải chi tiết</span>
                          </>
                        )}
                      </button>

                      {qType === 'mc' && typeof userAnswers[q.id] === 'number' && (
                        <span className={`text-xs font-bold flex items-center gap-1 ${userAnswers[q.id] === q.correctIndex ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {userAnswers[q.id] === q.correctIndex ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                          <span>{userAnswers[q.id] === q.correctIndex ? 'Chính xác!' : 'Chưa đúng, xem lời giải nhé!'}</span>
                        </span>
                      )}
                    </div>

                    {/* Hộp giải chi tiết */}
                    {isSolOpen && q.solution && (
                      <div className="ml-11 p-4 rounded-xl bg-indigo-50/70 border border-indigo-200/80 text-xs text-slate-800 space-y-1.5 animate-in fade-in duration-150">
                        <div className="font-bold text-indigo-900 flex items-center gap-1">
                          <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Hướng dẫn giải chi tiết:</span>
                        </div>
                        <div className="leading-relaxed">
                          <MathText text={q.solution} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* GIAO DIỆN DANH MỤC CÁC PHIẾU HỌC TẬP */
        <div className="space-y-6">
          {/* Thanh công cụ lọc & tìm kiếm */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Bộ lọc Khối Lớp */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
              {(['Tất cả', 'Toán 10', 'Toán 11', 'Toán 12'] as const).map(gr => (
                <button
                  key={gr}
                  onClick={() => {
                    soundFx.playClick();
                    setSelectedGrade(gr);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition shrink-0 cursor-pointer ${
                    selectedGrade === gr
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {gr}
                </button>
              ))}
            </div>

            {/* Ô tìm kiếm bài học */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Tìm bài học, chuyên đề..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition"
              />
            </div>
          </div>

          {/* Lưới các thẻ phiếu học tập */}
          {filteredWorksheets.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-3">
              <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-2xl">
                📂
              </div>
              <h3 className="font-bold text-slate-700 text-base">Chưa có phiếu học tập phù hợp</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Không tìm thấy phiếu học tập cho tiêu chí này. Hãy thử chọn khối lớp khác hoặc tìm kiếm với từ khóa khác.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredWorksheets.map((ws, index) => {
                const gradeBadgeColor =
                  ws.grade === 'Toán 10'
                    ? 'bg-sky-50 text-sky-700 border-sky-200'
                    : ws.grade === 'Toán 11'
                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200';

                return (
                  <div
                    key={ws.id || index}
                    onClick={() => {
                      soundFx.playClick();
                      setActiveWorksheet(ws);
                    }}
                    className="group bg-white rounded-2xl p-5 border border-slate-200 hover:border-blue-400 shadow-xs hover:shadow-md transition-all flex flex-col justify-between cursor-pointer relative overflow-hidden"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black border uppercase tracking-wider ${gradeBadgeColor}`}>
                          {ws.grade}
                        </span>

                        {!ws.isPublished && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                            🔒 Đang ẩn
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        <p className="text-[11px] font-bold text-indigo-600 truncate">
                          {ws.chapter}
                        </p>
                        <h4 className="font-black text-slate-900 text-base group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                          {ws.title}
                        </h4>
                      </div>

                      {ws.description && (
                        <p className="text-xs text-slate-500 line-clamp-2">
                          {ws.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                      <span className="flex items-center gap-1 text-slate-600 font-semibold">
                        <FileText className="w-3.5 h-3.5 text-blue-500" />
                        <span>{ws.questions.length} câu hỏi</span>
                      </span>
                      <span className="text-blue-600 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                        Mở học ➔
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL MÃ PIN KHẨN CẤP CHO GIÁO VIÊN */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3 shadow-2xs">
              <KeyRound className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-1">
              Chế Độ Giáo Viên Khẩn Cấp
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Nhập mã PIN Admin Studio để mở quyền quản lý Phiếu học tập ngay tại chỗ:
            </p>

            <form onSubmit={handleVerifyPin} className="space-y-3">
              <input
                type="password"
                maxLength={20}
                value={pinInput}
                onChange={e => {
                  setPinInput(e.target.value);
                  setPinError(false);
                }}
                placeholder="Nhập mã PIN..."
                autoFocus
                className={`w-full text-center text-xl font-mono font-black tracking-widest py-3 border-2 rounded-xl focus:outline-none transition ${
                  pinError
                    ? 'border-rose-500 bg-rose-50'
                    : 'border-slate-300 focus:border-amber-500'
                }`}
              />
              {pinError && (
                <p className="text-xs font-bold text-rose-600">
                  ❌ Mã PIN không đúng, vui lòng thử lại!
                </p>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPinModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 font-bold text-xs text-slate-600 hover:bg-slate-100 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition"
                >
                  Xác nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TRÌNH CHIẾU TƯƠNG TÁC SLIDE (FULL MÀN HÌNH - 100% OFFLINE NỘI BỘ) */}
      {presentationUrl && (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col animate-in fade-in duration-200">
          {/* Top Control Bar */}
          <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between text-white shrink-0 shadow-md">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-black text-sm text-white">
                MH
              </span>
              <div>
                <h4 className="text-sm font-bold truncate text-slate-100">
                  {activeWorksheet?.title || 'Trình chiếu tương tác Phiếu học tập'}
                </h4>
                <p className="text-[11px] text-slate-400">
                  Toán Pro - Thầy Hùng • Trình chiếu Slide Tương Tác
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  try {
                    if (!document.fullscreenElement) {
                      document.documentElement.requestFullscreen();
                    } else {
                      document.exitFullscreen();
                    }
                  } catch {}
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition flex items-center gap-1.5 cursor-pointer"
                title="Toàn màn hình"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Toàn màn hình</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setPresentationUrl(null);
                  if (document.fullscreenElement) {
                    try { document.exitFullscreen(); } catch {}
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Đóng trình chiếu"
              >
                <X className="w-4 h-4" />
                <span>Thoát</span>
              </button>
            </div>
          </div>

          {/* Iframe trình chiếu file HTML cục bộ */}
          <div className="flex-1 w-full h-full bg-slate-900 relative">
            <iframe
              src={presentationUrl}
              title="Chế độ trình chiếu tương tác"
              className="w-full h-full border-0 absolute inset-0 bg-white"
              allow="fullscreen; autoplay; clipboard-write"
            />
          </div>
        </div>
      )}
    </div>
  );
};
