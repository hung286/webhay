import React, { useState, useRef } from 'react';
import { TeachingTool, Question, Difficulty } from '../../types';
import { X, FileUp, Plus, Trash2, Save, FileDown } from 'lucide-react';
import { soundFx } from '../../utils/sound';

interface GameQuestionModalProps {
  tool: TeachingTool;
  onClose: () => void;
  onSave: (toolId: string, questions: Question[]) => void;
}

export const GameQuestionModal: React.FC<GameQuestionModalProps> = ({ tool, onClose, onSave }) => {
  const [questions, setQuestions] = useState<Question[]>(tool.customQuestions || []);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
            if (corStr === 'B') correctIndex = 1;
            if (corStr === 'C') correctIndex = 2;
            if (corStr === 'D') correctIndex = 3;

            newQuestions.push({
              id: `csv_${Date.now()}_${i}`,
              question: questionText,
              options: [optA, optB, optC, optD],
              correctIndex,
              explanation,
              difficulty,
              topic,
              source: tool.name,
              status: 'published',
              createdAt: new Date().toISOString()
            });
          }
        }

        if (newQuestions.length > 0) {
          setQuestions([...questions, ...newQuestions]);
          alert(`Đã nhập thành công ${newQuestions.length} câu hỏi!`);
        } else {
          alert('Không tìm thấy câu hỏi hợp lệ trong file CSV.');
        }
      } catch (err: any) {
        alert(`Lỗi đọc file CSV: ${err?.message}`);
      }
    };
    reader.readAsText(file);
  };

  const exportTemplate = () => {
    const headers = ['Câu hỏi', 'Đáp án A', 'Đáp án B', 'Đáp án C', 'Đáp án D', 'Đúng (A/B/C/D)', 'Giải thích', 'Độ khó (Dễ/Trung bình/Khó)', 'Chủ đề'];
    const sample = ['1 + 1 bằng mấy?', '1', '2', '3', '4', 'B', 'Vì 1+1=2', 'Dễ', 'Toán học'];
    const csvContent = '\uFEFF' + headers.join(',') + '\n' + sample.join(',');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Mau_Cau_Hoi_${tool.name}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAddEmpty = () => {
    setQuestions([
      {
        id: `q_${Date.now()}`,
        question: 'Câu hỏi mới...',
        options: ['A', 'B', 'C', 'D'],
        correctIndex: 0,
        difficulty: 'Trung bình',
        topic: 'Chung',
        source: tool.name,
        status: 'published',
        createdAt: new Date().toISOString()
      },
      ...questions
    ]);
  };

  const handleRemove = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-slate-100 bg-slate-50">
          <div>
            <h3 className="text-xl font-black text-slate-800">Quản lý Câu hỏi Game</h3>
            <p className="text-sm text-slate-500 font-medium mt-1 text-brand-primary">{tool.name}</p>
          </div>
          <button onClick={() => { soundFx.playClick(); onClose(); }} className="p-2 hover:bg-slate-200 rounded-full transition cursor-pointer">
            <X className="w-6 h-6 text-slate-500" />
          </button>
        </div>

        <div className="flex gap-2 p-4 border-b border-slate-200 bg-white items-center flex-wrap">
          <button onClick={exportTemplate} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition flex items-center gap-2">
            <FileDown className="w-4 h-4" /> Tải CSV mẫu
          </button>
          
          <label className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-bold text-sm transition flex items-center gap-2 cursor-pointer border border-blue-200">
            <FileUp className="w-4 h-4" /> Nhập từ CSV
            <input type="file" accept=".csv" ref={fileInputRef} onChange={handleImportCsv} className="hidden" />
          </label>

          <button onClick={handleAddEmpty} className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl font-bold text-sm transition flex items-center gap-2 border border-emerald-200 ml-auto">
            <Plus className="w-4 h-4" /> Thêm câu hỏi
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 space-y-4">
          {questions.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p>Trò chơi này đang sử dụng câu hỏi mặc định.</p>
              <p className="text-sm mt-2">Thêm câu hỏi tùy chỉnh để ghi đè lên bộ mặc định.</p>
            </div>
          ) : (
            questions.map((q, index) => (
              <div key={q.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative group">
                <button onClick={() => handleRemove(q.id)} className="absolute top-4 right-4 p-1.5 text-rose-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition opacity-0 group-hover:opacity-100">
                  <Trash2 className="w-4 h-4" />
                </button>
                
                <div className="mb-3 pr-8">
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Câu {index + 1}</label>
                  <textarea
                    value={q.question}
                    onChange={(e) => handleUpdate(q.id, 'question', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 min-h-[60px]"
                    placeholder="Nội dung câu hỏi..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  {q.options.map((opt, oIdx) => (
                    <div key={oIdx} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`correct_${q.id}`}
                        checked={q.correctIndex === oIdx}
                        onChange={() => handleUpdate(q.id, 'correctIndex', oIdx)}
                        className="w-4 h-4 text-blue-600 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => handleUpdateOption(q.id, oIdx, e.target.value)}
                        className={`flex-1 p-2 border rounded-lg text-sm ${q.correctIndex === oIdx ? 'border-blue-400 bg-blue-50' : 'border-slate-300'}`}
                        placeholder={`Đáp án ${String.fromCharCode(65 + oIdx)}`}
                      />
                    </div>
                  ))}
                </div>
                
                <div className="flex gap-4">
                  <div className="w-1/3">
                    <label className="block text-xs font-bold text-slate-500 mb-1">Độ khó</label>
                    <select
                      value={q.difficulty}
                      onChange={(e) => handleUpdate(q.id, 'difficulty', e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white"
                    >
                      <option value="Dễ">Dễ</option>
                      <option value="Trung bình">Trung bình</option>
                      <option value="Khó">Khó</option>
                    </select>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 sm:p-6 border-t border-slate-200 bg-white flex justify-between items-center">
          <div className="text-sm text-slate-500 font-medium">Tổng: {questions.length} câu hỏi tùy chỉnh</div>
          <div className="flex gap-3">
            <button onClick={() => { soundFx.playClick(); onClose(); }} className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition">
              Hủy
            </button>
            <button
              onClick={() => { soundFx.playCorrect(); onSave(tool.id, questions); }}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black hover:brightness-110 shadow-md shadow-blue-200 transition flex items-center gap-2"
            >
              <Save className="w-5 h-5" /> Lưu Thay Đổi
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
