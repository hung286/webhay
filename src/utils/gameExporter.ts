import { Question } from '../types';

export interface GameTemplateOption {
  id: string;
  name: string;
  file: string;
  category: string;
  description: string;
}

export const GAME_TEMPLATES: GameTemplateOption[] = [
  {
    id: 'f1',
    name: '🏎️ Đua Xe F1 Tốc Độ',
    file: '/game-dua-xe-F1-on-tap-HK2-toan10.html',
    category: 'Vận tốc & Phản xạ',
    description: 'Đua xe giải toán tốc độ cao, hỗ trợ cả câu 4 lựa chọn và Đúng/Sai'
  },
  {
    id: 'sut_pen',
    name: '⚽ Sút Penalty Kịch Tính',
    file: '/sut-pen-gia-tri-luong-giac-cua-goc-tu-0-den-180.html',
    category: 'Đấu trường Thể thao',
    description: '3 vòng đấu Vòng Bảng, Bán Kết, Chung Kết với thủ môn AI phản xạ'
  },
  {
    id: 'chien_hao',
    name: '🛡️ Bảo Vệ Chiến Hào',
    file: '/Game-Bao-ve-chien-hao-gia-tri-luong-giac-tu-0-den-180.html',
    category: 'Bắn súng Chiến thuật',
    description: 'Phòng thủ chiến hào ngăn chặn đợt tấn công của quân địch'
  },
  {
    id: 'trieu_phu_ontap',
    name: '💰 Ai Là Triệu Phú (Ôn Tập)',
    file: '/Ai-la-trieu-phu-on-tap.html',
    category: 'Gameshow Trí tuệ',
    description: 'Leo thang tiền thưởng 15 câu hỏi với 3 quyền trợ giúp kinh điển'
  },
  {
    id: 'trieu_phu_menhde',
    name: '💰 Ai Là Triệu Phú (Mệnh Đề)',
    file: '/ai_la_trieu_phu_menh_de.html',
    category: 'Gameshow Trí tuệ',
    description: 'Chinh phục 15 câu hỏi toán học kịch tính'
  },
  {
    id: 'ban_chim',
    name: '🎯 Bắn Chim Mục Tiêu',
    file: '/ban-chim-xac-suat10.html',
    category: 'Bắn mục tiêu',
    description: 'Ngắm bắn chính xác các mục tiêu chứa đáp án đúng trên bầu trời'
  },
  {
    id: 'ca_ngua',
    name: '🎲 Cờ Cá Ngựa Toán Học',
    file: '/ca-ngua-dao-ham11.html',
    category: 'Board Game',
    description: 'Gieo xúc xắc, trả lời câu hỏi để đưa các chú ngựa về đích'
  },
  {
    id: 'cau_ca',
    name: '🎣 Câu Cá Mũ & Logarit',
    file: '/cau-ca-mu-loga11.html',
    category: 'Thư giãn & Phản xạ',
    description: 'Thả câu bắt những chú cá mang đáp án chính xác dưới đại dương'
  },
  {
    id: 'dao_ham_cap2',
    name: '⚡ Đạo Hàm Cấp 2 Đại Chiến',
    file: '/dao-ham-cap2-toan11.html',
    category: 'Đối kháng',
    description: 'Vượt qua các câu hỏi đạo hàm cấp 2 chinh phục đỉnh cao'
  },
  {
    id: 'mario',
    name: '🍄 Mario Phiêu Lưu Ký',
    file: '/Gamemario_bien-co-giao-bien-co-doc-lap.html',
    category: 'Phiêu lưu vượt ải',
    description: 'Vượt chướng ngại vật giải bài toán để giải cứu công chúa'
  },
  {
    id: 'tetris',
    name: '🧱 Tetris Xếp Gạch Không Gian',
    file: '/Gametetris_Hai-mat-phang-vuong-goc.html',
    category: 'Xếp hình Kinh điển',
    description: 'Xếp các khối hình Tetris kết hợp thử thách hình học không gian'
  },
  {
    id: 'ghep_cap_ctlg',
    name: '🧩 Ghép Cặp Công Thức Lượng Giác',
    file: '/ghep-cap-luong-giac.html',
    category: 'Trí nhớ Thẻ bài',
    description: 'Lật thẻ và tìm các cặp công thức toán học tương đương'
  },
  {
    id: 'ghep_cap_ptlg',
    name: '🧩 Ghép Cặp Phương Trình Lượng Giác',
    file: '/ghep-cap-phuong-trinh-luong-giac.html',
    category: 'Trí nhớ Thẻ bài',
    description: 'Ghép cặp phương trình lượng giác và nghiệm tương ứng'
  },
  {
    id: 'ghep_cap_trai_tim',
    name: '💖 Ghép Cặp Trái Tim Đạo Hàm',
    file: '/ghep-cap-trai-tim-dao-ham11.html',
    category: 'Trí nhớ Thẻ bài',
    description: 'Ghép nối các nửa trái tim công thức đạo hàm chuẩn xác'
  },
  {
    id: 'hai_tao',
    name: '🍎 Hái Táo Luân Phiên',
    file: '/hai-tao-luan-phien.html',
    category: 'Thu hoạch Phản xạ',
    description: 'Hái những quả táo vàng mang câu trả lời đúng vào giỏ'
  },
  {
    id: 'keo_co',
    name: '🤼 Kéo Co Đối Kháng',
    file: '/keo-co-hai.html',
    category: 'Đấu trường 2 Người',
    description: 'Thi đấu đối kháng 2 đội kéo co sôi động trong lớp học'
  },
  {
    id: 'keo_tha_hs',
    name: '🖐️ Kéo Thả Đơn Điệu & Cực Trị',
    file: '/keo-tha-tinh-don-dieu-va-cuc-tri-hs.html',
    category: 'Tương tác Trực quan',
    description: 'Kéo thả các nhãn phân loại tính chất hàm số vào đúng vị trí'
  },
  {
    id: 'nghieng_dau',
    name: '🙃 Nghiêng Đầu Nhị Thức Newton',
    file: '/nghieng-dau-nhi-thuc-newton.html',
    category: 'Thử thách Vui nhộn',
    description: 'Trò chơi phản xạ nghiêng đầu chọn khẳng định đúng'
  },
  {
    id: 'pikachu',
    name: '⚡ Pikachu Nối Hình Đạo Hàm',
    file: '/pikachu-dao-ham.html',
    category: 'Nối hình Cổ điển',
    description: 'Nối các cặp thẻ đạo hàm tương đương theo quy tắc Pikachu'
  },
  {
    id: 'ran_san_tap_hop',
    name: '🐍 Rắn Săn Mồi Tập Hợp',
    file: '/ran-san-tap-hop-10.html',
    category: 'Arcade Cổ điển',
    description: 'Điều khiển chú rắn ăn các quả số thuộc tập hợp chính xác'
  },
  {
    id: 'ran_san_xac_suat',
    name: '🐍 Rắn Săn Mồi Xác Suất',
    file: '/ran-san-xac-suat.html',
    category: 'Arcade Cổ điển',
    description: 'Rèn luyện phản xạ tính xác suất qua từng lượt ăn mồi'
  },
  {
    id: 'yoga',
    name: '🧘 Yoga Phản Xạ Xác Suất',
    file: '/yoga-xac-suat11.html',
    category: 'Vận động Phản xạ',
    description: 'Phản xạ tư thế Yoga rèn luyện xác suất có điều kiện'
  }
];

export interface ExportGameOptions {
  templateUrl: string;
  gameTitle: string;
  teacherName?: string;
  questions: Question[];
}

/**
 * DATA ADAPTER ENGINE: Dịch mảng câu hỏi và đóng gói vào file HTML gốc
 */
export async function exportStandaloneGameHTML(options: ExportGameOptions): Promise<string> {
  const { templateUrl, gameTitle, teacherName = 'LỚP TOÁN THẦY HÙNG', questions } = options;

  // 1. Fetch file HTML gốc
  let cleanUrl = templateUrl;
  if (cleanUrl.includes('?')) cleanUrl = cleanUrl.split('?')[0];

  const response = await fetch(cleanUrl);
  if (!response.ok) {
    throw new Error(`Không thể tải template game gốc từ: ${cleanUrl} (Mã lỗi HTTP ${response.status})`);
  }
  let htmlContent = await response.text();

  // 2. WHITE-LABEL TOÀN DIỆN
  htmlContent = htmlContent.replace(/Thầy Chính/gi, teacherName);
  htmlContent = htmlContent.replace(/THẦY CHÍNH/gi, teacherName.toUpperCase());
  htmlContent = htmlContent.replace(/Hưng Yên/gi, 'TOÁN PRO');
  htmlContent = htmlContent.replace(/HƯNG YÊN/gi, 'TOÁN PRO');
  
  // Thay đổi thẻ <title>
  if (htmlContent.includes('<title>')) {
    htmlContent = htmlContent.replace(/<title>.*?<\/title>/i, `<title>${gameTitle} - ${teacherName}</title>`);
  }

  // 3. Chuẩn hóa mảng quizData chuẩn
  const standardizedData = questions.map((q, idx) => ({
    id: q.id || `q_${idx + 1}`,
    q: q.question,
    options: q.options || ['A', 'B', 'C', 'D'],
    correct: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
    explanation: q.explanation || '',
    difficulty: q.difficulty === 'Dễ' ? 1 : (q.difficulty === 'Khó' ? 3 : 2)
  }));

  // Sắp xếp câu hỏi theo độ khó tăng dần
  standardizedData.sort((a, b) => a.difficulty - b.difficulty);

  // 4. DATA ADAPTER ENGINE: ÁP DỤNG ADAPTER TƯƠNG ỨNG THEO TỪNG GAME

  // NHÓM 1: Game Đua xe F1 (biến rawQuestionData với o, c, sub)
  if (cleanUrl.includes('game-dua-xe-F1') || cleanUrl.includes('F1')) {
    const f1Formatted = standardizedData.map(q => ({
      type: "ABCD",
      q: q.q,
      o: q.options,
      c: q.correct,
      explanation: q.explanation
    }));
    const injectF1 = `
<script>
// [ADAPTER ENGINE: ĐUA XE F1]
window.quizData = ${JSON.stringify(standardizedData, null, 2)};
let rawQuestionData = ${JSON.stringify(f1Formatted, null, 2)};
</script>
`;
    htmlContent = injectScriptAtTop(htmlContent, injectF1);
  }

  // NHÓM 2: Game Bảo Vệ Chiến Hào (sinh đề tự động - chặn generator)
  else if (cleanUrl.includes('chien-hao') || cleanUrl.includes('Bao-ve-chien-hao')) {
    const d1 = standardizedData.filter(q => q.difficulty === 1);
    const d2 = standardizedData.filter(q => q.difficulty === 2);
    const d3 = standardizedData.filter(q => q.difficulty === 3);

    const overrideScript = `
<script>
// [ADAPTER ENGINE: OVERRIDE BẢO VỆ CHIẾN HÀO]
window.quizData = ${JSON.stringify(standardizedData, null, 2)};
let sessionQuestions = {
  level1: ${JSON.stringify(d1.length > 0 ? d1 : standardizedData, null, 2)},
  level2: ${JSON.stringify(d2.length > 0 ? d2 : standardizedData, null, 2)},
  level3: ${JSON.stringify(d3.length > 0 ? d3 : standardizedData, null, 2)}
};
function generateSessionQuestions() {
  // Đã bị đóng băng sang câu hỏi tĩnh tùy chỉnh
}
</script>
`;
    htmlContent = injectScriptAtTop(htmlContent, overrideScript);
  }

  // NHÓM 3: Game Sút Penalty (phân chia 3 vòng đấu: Vòng Bảng, Bán Kết, Chung Kết)
  else if (cleanUrl.includes('sut-pen')) {
    const d1 = standardizedData.filter(q => q.difficulty === 1);
    const d2 = standardizedData.filter(q => q.difficulty === 2);
    const d3 = standardizedData.filter(q => q.difficulty === 3);

    const penScript = `
<script>
// [ADAPTER ENGINE: SÚT PENALTY]
window.quizData = ${JSON.stringify(standardizedData, null, 2)};
window.addEventListener('DOMContentLoaded', function() {
  if (typeof levels !== 'undefined' && Array.isArray(levels)) {
    const q1 = ${JSON.stringify(d1.length > 0 ? d1 : standardizedData)};
    const q2 = ${JSON.stringify(d2.length > 0 ? d2 : standardizedData)};
    const q3 = ${JSON.stringify(d3.length > 0 ? d3 : standardizedData)};
    if (levels.length >= 1) levels[0].questions = q1;
    if (levels.length >= 2) levels[1].questions = q2;
    if (levels.length >= 3) levels[2].questions = q3;
  }
});
</script>
`;
    htmlContent = injectScriptAtTop(htmlContent, penScript);
  }

  // NHÓM 4: Game Bắn Chim (questionLevels theo level 1, 2, 3 với correct & wrongs)
  else if (cleanUrl.includes('ban-chim')) {
    const qlObj: Record<number, any[]> = { 1: [], 2: [], 3: [] };
    standardizedData.forEach(q => {
      const diff = q.difficulty || 1;
      qlObj[diff].push({
        q: q.q,
        correct: q.options[q.correct] || q.options[0],
        wrongs: q.options.filter((_, idx) => idx !== q.correct),
        explanation: q.explanation
      });
    });

    const bcScript = `
<script>
// [ADAPTER ENGINE: BẮN CHIM]
window.quizData = ${JSON.stringify(standardizedData, null, 2)};
const questionLevels = ${JSON.stringify(qlObj, null, 2)};
</script>
`;
    htmlContent = injectScriptAtTop(htmlContent, bcScript);
  }

  // NHÓM 5: Game Ai Là Triệu Phú (easyPool, mediumPool, hardPool)
  else if (cleanUrl.includes('trieu-phu') || cleanUrl.includes('trieu_phu')) {
    const d1 = standardizedData.filter(q => q.difficulty === 1);
    const d2 = standardizedData.filter(q => q.difficulty === 2);
    const d3 = standardizedData.filter(q => q.difficulty === 3);

    const tpScript = `
<script>
// [ADAPTER ENGINE: AI LÀ TRIỆU PHÚ]
window.quizData = ${JSON.stringify(standardizedData, null, 2)};
var easyPool = ${JSON.stringify(d1.length > 0 ? d1 : standardizedData, null, 2)};
var mediumPool = ${JSON.stringify(d2.length > 0 ? d2 : standardizedData, null, 2)};
var hardPool = ${JSON.stringify(d3.length > 0 ? d3 : standardizedData, null, 2)};
var questions = window.quizData;
</script>
`;
    htmlContent = injectScriptAtTop(htmlContent, tpScript);
  }

  // NHÓM 6: CÁC GAME CHUẨN CÒN LẠI (Cá Ngựa, Cầu Cá, Rắn Săn, Tetris, Mario...)
  else {
    const stdScript = `
<script>
// [ADAPTER ENGINE: GAME TOÁN HỌC CHUẨN]
window.quizData = ${JSON.stringify(standardizedData, null, 2)};
var QUESTION_BANK = window.quizData;
var questions = window.quizData;
</script>
`;
    htmlContent = injectScriptAtTop(htmlContent, stdScript);
  }

  return htmlContent;
}

function injectScriptAtTop(html: string, scriptBlock: string): string {
  if (html.includes('<script>')) {
    return html.replace('<script>', `${scriptBlock}\n<script>`);
  } else if (html.includes('<script')) {
    const firstScriptIdx = html.indexOf('<script');
    return html.slice(0, firstScriptIdx) + scriptBlock + '\n' + html.slice(firstScriptIdx);
  } else if (html.includes('</head>')) {
    return html.replace('</head>', `${scriptBlock}\n</head>`);
  } else {
    return scriptBlock + '\n' + html;
  }
}

/**
 * Trình kích hoạt tải tệp trực tiếp về máy tính người dùng
 */
export function downloadFile(content: string, filename: string, mimeType = 'text/html') {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
