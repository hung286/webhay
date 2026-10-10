import { AppConfig, Question, PlayHistory, StudentProfile, TeachingTool, MathWorksheet } from '../types';
import { DEFAULT_QUESTIONS_50 } from '../data/defaultQuestions';
import { DEFAULT_WORKSHEETS } from '../data/defaultWorksheets';

const KEY_CONFIG = 'edu_app_config_v32';
const KEY_QUESTIONS = 'edu_question_bank_v32';
const KEY_HISTORY = 'edu_play_history_v32';
const KEY_STUDENT = 'edu_student_profile_v32';
const KEY_GEMINI_KEY = 'edu_gemini_session_key';

export const DEFAULT_CONFIG: AppConfig = {
  appName: 'TOÁN PRO',
  shortDesc: 'Không để ai bị bỏ lại phía sau',
  orgName: 'LỚP TOÁN THẦY HÙNG',
  topBadge: 'EDUCATION APP v3.1 STABLE',
  themeColor: 'blue',
  logoUrl: '',
  adminPin: '1234',
  showStudentInfoInHeader: true,
  soundEnabled: true,
  allowStudentReview: true,
  defaultTestCount: 20,
  defaultTestTimePerQuestion: 20,
};

export const DEFAULT_STUDENT: StudentProfile = {
  name: 'Học sinh',
  className: 'Lớp 12A1',
};

// --- APP CONFIG STORAGE WITH VERIFIED PERSISTENCE (Step 32) ---

export function getAppConfig(): AppConfig {
  try {
    const raw = localStorage.getItem(KEY_CONFIG);
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch (e) {
    console.error('Error reading app config:', e);
    return DEFAULT_CONFIG;
  }
}

/**
 * Step 32: Cơ chế lưu cấu hình ổn định
 * NHẬP CẤU HÌNH → LƯU → ĐỌC LẠI → XÁC MINH → CẬP NHẬT GIAO DIỆN → THÔNG BÁO KẾT QUẢ
 */
export function saveAppConfigVerified(newConfig: AppConfig): { success: boolean; message: string } {
  try {
    const jsonStr = JSON.stringify(newConfig);
    // 1. Lưu
    localStorage.setItem(KEY_CONFIG, jsonStr);

    // 2. Đọc lại
    const readBack = localStorage.getItem(KEY_CONFIG);
    if (!readBack) {
      throw new Error('Dữ liệu không tồn tại sau khi ghi vào LocalStorage.');
    }

    // 3. Xác minh
    const parsed = JSON.parse(readBack);
    if (parsed.appName !== newConfig.appName || parsed.adminPin !== newConfig.adminPin) {
      throw new Error('Cấu hình đọc lại không khớp với dữ liệu đã lưu.');
    }

    return { success: true, message: 'Đã lưu cấu hình và xác minh hệ thống thành công!' };
  } catch (error: any) {
    console.error('Lỗi lưu cấu hình:', error);
    return {
      success: false,
      message: `Lỗi lưu cấu hình: ${error?.message || 'Bộ nhớ trình duyệt có thể đã bị chặn hoặc đầy dung lượng.'}`
    };
  }
}

// --- LOGO OPTIMIZER (Step 33) ---
export function optimizeImage(file: File, maxWidth = 256, maxHeight = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(e.target?.result as string);
        }
        ctx.drawImage(img, 0, 0, width, height);
        // Nén sang JPEG chất lượng 0.82 để siêu nhẹ cho LocalStorage
        const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
        resolve(optimizedDataUrl);
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// --- QUESTION BANK STORAGE ---

export function getQuestionBank(): Question[] {
  try {
    const raw = localStorage.getItem(KEY_QUESTIONS);
    if (!raw) {
      // Khởi tạo 50 câu mặc định lần đầu
      localStorage.setItem(KEY_QUESTIONS, JSON.stringify(DEFAULT_QUESTIONS_50));
      return DEFAULT_QUESTIONS_50;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(KEY_QUESTIONS, JSON.stringify(DEFAULT_QUESTIONS_50));
      return DEFAULT_QUESTIONS_50;
    }
    return parsed;
  } catch {
    return DEFAULT_QUESTIONS_50;
  }
}

export function saveQuestionBank(questions: Question[]): boolean {
  try {
    localStorage.setItem(KEY_QUESTIONS, JSON.stringify(questions));
    return true;
  } catch (e) {
    console.error('Error saving question bank:', e);
    return false;
  }
}

export function restore50DefaultQuestions(): Question[] {
  saveQuestionBank(DEFAULT_QUESTIONS_50);
  return DEFAULT_QUESTIONS_50;
}

// --- STUDENT PROFILE ---

export function getStudentProfile(): StudentProfile {
  try {
    const raw = localStorage.getItem(KEY_STUDENT);
    if (!raw) return DEFAULT_STUDENT;
    return { ...DEFAULT_STUDENT, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_STUDENT;
  }
}

export function saveStudentProfile(profile: StudentProfile): void {
  try {
    localStorage.setItem(KEY_STUDENT, JSON.stringify(profile));
  } catch (e) {
    console.error('Error saving student profile:', e);
  }
}

// --- PLAY HISTORY ---

export function getPlayHistory(): PlayHistory[] {
  try {
    const raw = localStorage.getItem(KEY_HISTORY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addPlayHistory(item: Omit<PlayHistory, 'id' | 'timestamp'>): PlayHistory {
  const history = getPlayHistory();
  const newItem: PlayHistory = {
    ...item,
    id: `play_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toLocaleString('vi-VN')
  };
  history.unshift(newItem);
  // Keep last 300 entries
  if (history.length > 300) history.pop();
  try {
    localStorage.setItem(KEY_HISTORY, JSON.stringify(history));
  } catch {}
  return newItem;
}

export function deletePlayHistory(ids: string[]): PlayHistory[] {
  const idSet = new Set(ids);
  const remaining = getPlayHistory().filter(item => !idSet.has(item.id));
  try {
    localStorage.setItem(KEY_HISTORY, JSON.stringify(remaining));
  } catch {}
  return remaining;
}

export function clearAllPlayHistory(): void {
  try {
    localStorage.removeItem(KEY_HISTORY);
  } catch {}
}

// CSV Export for History with UTF-8 BOM for Excel
export function exportHistoryToCsv(history: PlayHistory[]): void {
  const headers = ['ID', 'Học sinh', 'Lớp', 'Chế độ', 'Điểm', 'Tổng số', 'Độ chính xác (%)', 'Thời gian (giây)', 'Ghi chú', 'Thời điểm'];
  const rows = history.map(h => [
    `"${h.id}"`,
    `"${h.studentName.replace(/"/g, '""')}"`,
    `"${h.className.replace(/"/g, '""')}"`,
    `"${h.mode}"`,
    h.score,
    h.total,
    `${h.accuracy}%`,
    h.timeSpentSeconds,
    `"${(h.details || '').replace(/"/g, '""')}"`,
    `"${h.timestamp}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Lich_su_hoc_tap_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// CSV Export for Question Bank
export function exportQuestionsToCsv(questions: Question[]): void {
  const headers = ['Câu hỏi', 'Phương án A', 'Phương án B', 'Phương án C', 'Phương án D', 'Đáp án đúng (A/B/C/D)', 'Giải thích', 'Độ khó', 'Chủ đề', 'Nguồn', 'Trạng thái'];
  const labels = ['A', 'B', 'C', 'D'];
  const rows = questions.map(q => [
    `"${q.question.replace(/"/g, '""')}"`,
    `"${(q.options[0] || '').replace(/"/g, '""')}"`,
    `"${(q.options[1] || '').replace(/"/g, '""')}"`,
    `"${(q.options[2] || '').replace(/"/g, '""')}"`,
    `"${(q.options[3] || '').replace(/"/g, '""')}"`,
    `"${labels[q.correctIndex] || 'A'}"`,
    `"${(q.explanation || '').replace(/"/g, '""')}"`,
    `"${q.difficulty}"`,
    `"${(q.topic || '').replace(/"/g, '""')}"`,
    `"${(q.source || '').replace(/"/g, '""')}"`,
    `"${q.status}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Ngan_hang_cau_hoi_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// JSON Backup & Restore
export function createSystemBackup(): string {
  const config = getAppConfig();
  const questions = getQuestionBank();
  const history = getPlayHistory();

  const backupData = {
    version: '3.1-stable',
    exportedAt: new Date().toISOString(),
    config,
    questions,
    history
    // Note: Gemini API key is intentionally excluded for security
  };

  return JSON.stringify(backupData, null, 2);
}

export function restoreSystemBackup(jsonStr: string): { success: boolean; message: string } {
  try {
    const data = JSON.parse(jsonStr);
    if (!data || typeof data !== 'object') {
      return { success: false, message: 'Tệp sao lưu không hợp lệ.' };
    }

    if (data.config) {
      saveAppConfigVerified(data.config);
    }
    if (Array.isArray(data.questions)) {
      saveQuestionBank(data.questions);
    }
    if (Array.isArray(data.history)) {
      localStorage.setItem(KEY_HISTORY, JSON.stringify(data.history));
    }

    return { success: true, message: 'Khôi phục toàn bộ hệ thống thành công!' };
  } catch (e: any) {
    return { success: false, message: `Lỗi khôi phục: ${e?.message || 'Tệp sao lưu bị hỏng'}` };
  }
}

// Session Gemini Key
export function getSessionGeminiKey(): string {
  try {
    return sessionStorage.getItem(KEY_GEMINI_KEY) || localStorage.getItem(KEY_GEMINI_KEY) || '';
  } catch {
    return '';
  }
}

export function setSessionGeminiKey(key: string): void {
  try {
    sessionStorage.setItem(KEY_GEMINI_KEY, key);
    localStorage.setItem(KEY_GEMINI_KEY, key);
  } catch {}
}

export function clearSessionGeminiKey(): void {
  try {
    sessionStorage.removeItem(KEY_GEMINI_KEY);
    localStorage.removeItem(KEY_GEMINI_KEY);
  } catch {}
}

// Factory Reset (Step 29)
export function factoryResetSystem(): void {
  try {
    localStorage.removeItem(KEY_CONFIG);
    localStorage.removeItem(KEY_QUESTIONS);
    localStorage.removeItem(KEY_HISTORY);
    localStorage.removeItem(KEY_STUDENT);
    localStorage.removeItem(KEY_GEMINI_KEY);
    sessionStorage.removeItem(KEY_GEMINI_KEY);
  } catch {}
}
const KEY_TOOLS = 'edu_teaching_tools_v40';

export const DEFAULT_TOOLS: TeachingTool[] = [
  // --- NHÓM TRÒ CHƠI TOÁN 10 ---
  {
    id: 'tool_bao_ve_chien_hao_10',
    name: 'Bảo Vệ Chiến Hào: Giá Trị Lượng Giác',
    type: 'iframe',
    category: 'tro-choi',
    url: '/Game-Bao-ve-chien-hao-gia-tri-luong-giac-tu-0-den-180.html',
    description: 'Game phòng thủ chiến hào: Luyện tập giá trị lượng giác góc 0° đến 180° (Toán 10)',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'tool_sut_pen_luong_giac_10',
    name: 'Sút Pen: Giá Trị Lượng Giác 0°-180°',
    type: 'iframe',
    category: 'tro-choi',
    url: '/sut-pen-gia-tri-luong-giac-cua-goc-tu-0-den-180.html',
    description: 'Game bóng đá sút luân lưu: Giá trị lượng giác của một góc từ 0° đến 180° (Toán 10)',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'tool_ai_la_trieu_phu_menh_de_10',
    name: 'Ai Là Triệu Phú: Mệnh Đề',
    type: 'iframe',
    category: 'tro-choi',
    url: '/ai_la_trieu_phu_menh_de.html',
    description: 'Gameshow Ai Là Triệu Phú chuyên đề Mệnh đề & Tập hợp (Toán 10)',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'tool_ai_la_trieu_phu_on_tap_10',
    name: 'Ai Là Triệu Phú: Ôn Tập 3 Chuyên Đề',
    type: 'iframe',
    category: 'tro-choi',
    url: '/Ai-la-trieu-phu-on-tap.html',
    description: 'Gameshow Ai Là Triệu Phú ôn tập 3 chủ đề chuyên đề Toán 10',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'tool_ban_chim_xac_suat_10',
    name: 'Bắn Chim Xác Suất Lớp 10',
    type: 'iframe',
    category: 'tro-choi',
    url: '/ban-chim-xac-suat10.html',
    description: 'Game bắn chim tính xác suất biến cố và hoán vị tổ hợp (Toán 10)',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'tool_dua_xe_f1_hk2_10',
    name: 'Đua Xe F1: Ôn Tập Học Kỳ 2',
    type: 'iframe',
    category: 'tro-choi',
    url: '/game-dua-xe-F1-on-tap-HK2-toan10.html',
    description: 'Game đua xe F1 tốc độ cao ôn tập kiến thức tổng hợp HK2 Toán 10',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'tool_nghieng_dau_newton_10',
    name: 'Nghiêng Đầu Chọn Đáp Án: Nhị Thức Newton',
    type: 'iframe',
    category: 'tro-choi',
    url: '/nghieng-dau-nhi-thuc-newton.html',
    description: 'Game tương tác chuyển động/phím ôn tập công thức Nhị thức Newton (Toán 10)',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'tool_ran_san_tap_hop_10',
    name: 'Rắn Săn Tập Hợp',
    type: 'iframe',
    category: 'tro-choi',
    url: '/ran-san-tap-hop-10.html',
    description: 'Game rắn săn mồi cổ điển vượt chướng ngại vật lý thuyết Tập hợp (Toán 10)',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'tool_ran_san_xac_suat_10',
    name: 'Rắn Săn Xác Suất Lớp 10',
    type: 'iframe',
    category: 'tro-choi',
    url: '/ran-san-xac-suat.html',
    description: 'Game rắn săn mồi thu thập đáp án đúng xác suất cổ điển (Toán 10)',
    isActive: true,
    createdAt: new Date().toISOString()
  },

  // --- NHÓM TRÒ CHƠI TOÁN 11 ---
  {
    id: 'tool_ghep_cap_luong_giac',
    name: 'Ghép Cặp Công Thức Lượng Giác',
    type: 'iframe',
    category: 'tro-choi',
    url: '/ghep-cap-luong-giac.html',
    description: 'Trò chơi lật thẻ ghép cặp công thức lượng giác (Toán 11) - Hỗ trợ Admin sửa cặp bài',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'tool_ghep_cap_pt_luong_giac',
    name: 'Ghép Cặp Phương Trình Lượng Giác',
    type: 'iframe',
    category: 'tro-choi',
    url: '/ghep-cap-phuong-trinh-luong-giac.html',
    description: 'Trò chơi lật thẻ ghép cặp nghiệm phương trình lượng giác cơ bản (Toán 11) - Hỗ trợ Admin',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'tool_ghep_cap_trai_tim_dao_ham11',
    name: 'Ghép Cặp Trái Tim: Đạo Hàm',
    type: 'iframe',
    category: 'tro-choi',
    url: '/ghep-cap-trai-tim-dao-ham11.html',
    description: 'Trò chơi ghép đôi trái tim bay lượn: Công thức và quy tắc Đạo hàm (Toán 11) - Hỗ trợ Admin',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'tool_ca_ngua_dao_ham_11',
    name: 'Cờ Cá Ngựa Đạo Hàm',
    type: 'iframe',
    category: 'tro-choi',
    url: '/ca-ngua-dao-ham11.html',
    description: 'Trò chơi cờ cá ngựa luyện tập công thức và bài tập Đạo hàm Toán 11',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'tool_cau_ca_mu_loga_11',
    name: 'Câu Cá: Mũ & Logarit Full Chương',
    type: 'iframe',
    category: 'tro-choi',
    url: '/cau-ca-mu-loga11.html',
    description: 'Game câu cá giải nhanh công thức hàm số mũ và logarit toàn bộ chương (Toán 11)',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'tool_dao_ham_cap2_dance_11',
    name: 'Cyber Dance: Đạo Hàm Cấp 2',
    type: 'iframe',
    category: 'tro-choi',
    url: '/dao-ham-cap2-toan11.html',
    description: 'Game nhịp điệu âm nhạc Cyber Dance rèn luyện phản xạ Đạo hàm cấp 2 (Toán 11)',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'tool_mario_xac_suat_11',
    name: 'Mario: Biến Cố Giao & Biến Cố Độc Lập',
    type: 'iframe',
    category: 'tro-choi',
    url: '/Gamemario_bien-co-giao-bien-co-doc-lap.html',
    description: 'Game phiêu lưu Mario thu thập nấm tính xác suất biến cố giao, độc lập (Toán 11)',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'tool_tetris_hai_mp_vuong_goc_11',
    name: 'Xếp Gạch Tetris: Hai Mặt Phẳng Vuông Góc',
    type: 'iframe',
    category: 'tro-choi',
    url: '/Gametetris_Hai-mat-phang-vuong-goc.html',
    description: 'Game xếp gạch Tetris giải câu hỏi hình học không gian hai mặt phẳng vuông góc (Toán 11)',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'tool_hai_tao_luan_phien_11',
    name: 'Hội Thi Thu Hoạch Táo: Mũ & Logarit',
    type: 'iframe',
    category: 'tro-choi',
    url: '/hai-tao-luan-phien.html',
    description: 'Hội thi thu hoạch táo thi đấu luân phiên giải toán Mũ và Logarit (Toán 11)',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'tool_keo_co_hai_mp_11',
    name: 'Kéo Co: Hai Mặt Phẳng Vuông Góc',
    type: 'iframe',
    category: 'tro-choi',
    url: '/keo-co-hai.html',
    description: 'Game kéo co đối kháng 2 đội thi đua tính chất hai mặt phẳng vuông góc (Toán 11)',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'tool_pikachu_dao_ham_11',
    name: 'Pikachu Đạo Hàm',
    type: 'iframe',
    category: 'tro-choi',
    url: '/pikachu-dao-ham.html',
    description: 'Game nối hình Pikachu kinh điển nối các cặp đạo hàm tương đương (Toán 11)',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'tool_yoga_xac_suat_11',
    name: 'Yoga Xác Suất 11',
    type: 'iframe',
    category: 'tro-choi',
    url: '/yoga-xac-suat11.html',
    description: 'Game vận động phản xạ tư thế Yoga rèn luyện xác suất có điều kiện (Toán 11)',
    isActive: true,
    createdAt: new Date().toISOString()
  },

  // --- NHÓM TRÒ CHƠI TOÁN 12 ---
  {
    id: 'tool_keo_tha_don_dieu_cuc_tri_12',
    name: 'Kéo Thả: Tính Đơn Điệu & Cực Trị',
    type: 'iframe',
    category: 'tro-choi',
    url: '/keo-tha-tinh-don-dieu-va-cuc-tri-hs.html',
    description: 'Tương tác kéo thả nhận diện khoảng đồng biến nghịch biến và cực trị hàm số (Toán 12)',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'tool_duong_tron',
    name: 'Phương Trình Đường Tròn',
    type: 'iframe',
    category: 'thao-tac',
    url: '/phuong_trinh_duong_tron.html',
    description: 'Trợ lý giải phương trình đường tròn',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'tool_the_tich',
    name: 'Tính Thể Tích',
    type: 'iframe',
    category: 'thao-tac',
    url: '/tinh_the_tich.html',
    description: 'Tính thể tích khối chóp, lăng trụ',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'tool_dien_tich_tam_giac',
    name: 'Diện Tích Tam Giác',
    type: 'iframe',
    category: 'thao-tac',
    url: '/dien_tich_tam_giac.html',
    description: 'Tính diện tích tam giác',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'tool_lai_kep',
    name: 'Lãi Đơn & Lãi Kép',
    type: 'iframe',
    category: 'thao-tac',
    url: '/lai_don_lai_kep.html',
    description: 'Bài toán gửi tiết kiệm, trả góp',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'tool_thong_ke_promax',
    name: 'Trợ lý Thống kê Promax',
    type: 'iframe',
    category: 'thao-tac',
    url: '/tro_ly_thong_ke_101112.html',
    description: 'Công cụ tính toán và hiển thị thống kê',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'tool_so_do_cay_123',
    name: 'Sơ đồ cây xác suất',
    type: 'iframe',
    category: 'thao-tac',
    url: '/so_do_cay_xac_suat.html',
    description: 'Công cụ vẽ sơ đồ cây xác suất',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'tool_khao_sat_ham_so_12',
    name: 'Khảo sát hàm số',
    type: 'iframe',
    category: 'thao-tac',
    url: '/khao_sat_ham_so_12.html',
    description: 'Công cụ vẽ đồ thị và khảo sát hàm số',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'tool_default_geogebra_2',
    name: 'Giải toán phương trình mặt cầu',
    type: 'iframe',
    category: 'thao-tac',
    url: '/phuong-trinh-mat-cau.html',
    description: 'Trợ lý mô phỏng hình học không gian 3D, giải toán phương trình mặt cầu',
    isActive: true,
    createdAt: new Date().toISOString()
  },
{
    id: 'tool_default_geogebra_1',
    name: 'Miền nghiệm hệ bất phương trình 2 ẩn',
    type: 'geogebra',
    category: 'thao-tac',
    url: 'https://www.geogebra.org/classic/xuzqeffb',
    description: 'Công cụ tính toán và vẽ miền nghiệm hệ bất phương trình',
    isActive: true,
    createdAt: new Date().toISOString()
  }
];

export function getTeachingTools(): TeachingTool[] {
  try {
    const raw = localStorage.getItem(KEY_TOOLS);
    if (!raw) {
      localStorage.setItem(KEY_TOOLS, JSON.stringify(DEFAULT_TOOLS));
      return DEFAULT_TOOLS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(KEY_TOOLS, JSON.stringify(DEFAULT_TOOLS));
      return DEFAULT_TOOLS;
    }
    return parsed;
  } catch {
    return DEFAULT_TOOLS;
  }
}

export function saveTeachingTools(tools: TeachingTool[]): boolean {
  try {
    localStorage.setItem(KEY_TOOLS, JSON.stringify(tools));
    return true;
  } catch (e) {
    console.error('Error saving tools:', e);
    return false;
  }
}

// --- MATH WORKSHEETS (PHIẾU HỌC TẬP MÔN TOÁN) ---
const KEY_WORKSHEETS = 'edu_math_worksheets_v40';

export function getWorksheets(): MathWorksheet[] {
  try {
    const raw = localStorage.getItem(KEY_WORKSHEETS);
    if (!raw) {
      localStorage.setItem(KEY_WORKSHEETS, JSON.stringify(DEFAULT_WORKSHEETS));
      return DEFAULT_WORKSHEETS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(KEY_WORKSHEETS, JSON.stringify(DEFAULT_WORKSHEETS));
      return DEFAULT_WORKSHEETS;
    }
    return parsed;
  } catch {
    return DEFAULT_WORKSHEETS;
  }
}

export function saveWorksheets(worksheets: MathWorksheet[]): boolean {
  try {
    localStorage.setItem(KEY_WORKSHEETS, JSON.stringify(worksheets));
    return true;
  } catch (e) {
    console.error('Error saving worksheets:', e);
    return false;
  }
}

export function restoreDefaultWorksheets(): MathWorksheet[] {
  saveWorksheets(DEFAULT_WORKSHEETS);
  return DEFAULT_WORKSHEETS;
}

export function addOrUpdateWorksheet(ws: MathWorksheet): MathWorksheet[] {
  const current = getWorksheets();
  const index = current.findIndex(w => w.id === ws.id);
  let updated: MathWorksheet[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = { ...ws, updatedAt: new Date().toISOString() };
  } else {
    updated = [
      { ...ws, id: ws.id || `ws_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, createdAt: new Date().toISOString() },
      ...current
    ];
  }
  saveWorksheets(updated);
  return updated;
}

export function deleteWorksheet(id: string): MathWorksheet[] {
  const current = getWorksheets();
  const updated = current.filter(w => w.id !== id);
  saveWorksheets(updated);
  return updated;
}

export function togglePublishWorksheet(id: string): MathWorksheet[] {
  const current = getWorksheets();
  const updated = current.map(w => w.id === id ? { ...w, isPublished: !w.isPublished, updatedAt: new Date().toISOString() } : w);
  saveWorksheets(updated);
  return updated;
}

