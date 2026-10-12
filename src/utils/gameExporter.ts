import { Question, DragDropCategory, DragDropTableRow } from '../types';
import { normalizeMathFormulas } from './documentParser';
import { DEFAULT_WORKSHEETS } from '../data/defaultWorksheets';

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
    id: 'so_do_cay',
    name: '🌳 Sơ Đồ Cây Xác Suất',
    file: '/so_do_cay_xac_suat.html',
    category: 'Mô phỏng Trực quan',
    description: 'Xây dựng và điền xác suất sơ đồ cây phân nhánh trực quan'
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
  customCategories?: DragDropCategory[];
  customDragDropRows?: DragDropTableRow[];
}

/**
 * DATA ADAPTER ENGINE: Dịch mảng câu hỏi và đóng gói vào file HTML gốc
 */
export async function exportStandaloneGameHTML(options: ExportGameOptions): Promise<string> {
  const { templateUrl, gameTitle, teacherName = 'LỚP TOÁN THẦY HÙNG', questions, customCategories, customDragDropRows } = options;

  // 1. Fetch file HTML gốc
  let cleanUrl = templateUrl;
  if (cleanUrl.includes('?')) cleanUrl = cleanUrl.split('?')[0];

  const response = await fetch(cleanUrl);
  if (!response.ok) {
    throw new Error(`Không thể tải template game gốc từ: ${cleanUrl} (Mã lỗi HTTP ${response.status})`);
  }
  let htmlContent = await response.text();

  // 2. WHITE-LABEL TOÀN DIỆN (Thương hiệu chuẩn: TOÁN PRO | LỚP TOÁN THẦY HÙNG | Ký hiệu MH, xóa bỏ triệt để Hưng Yên / HY / Cương Chính trên mọi game)
  const brandOrg = teacherName || 'LỚP TOÁN THẦY HÙNG';
  htmlContent = htmlContent.replace(/Thầy Phạm Trịnh Cương Chính/gi, brandOrg);
  htmlContent = htmlContent.replace(/Phạm Trịnh Cương Chính/gi, brandOrg);
  htmlContent = htmlContent.replace(/Thầy Cương Chính/gi, brandOrg);
  htmlContent = htmlContent.replace(/Thầy Chính/gi, brandOrg);
  htmlContent = htmlContent.replace(/THẦY CHÍNH/gi, brandOrg.toUpperCase());
  htmlContent = htmlContent.replace(/THPT Phạm Ngũ Lão/gi, 'TOÁN PRO');
  htmlContent = htmlContent.replace(/Phạm Ngũ Lão/gi, 'TOÁN PRO');
  htmlContent = htmlContent.replace(/Hưng Yên/gi, 'TOÁN PRO');
  htmlContent = htmlContent.replace(/HƯNG YÊN/gi, 'TOÁN PRO');
  htmlContent = htmlContent.replace(/\bTC\b/g, 'MH');
  htmlContent = htmlContent.replace(/\btc\b/g, 'mh');
  htmlContent = htmlContent.replace(/TC MATHEDU/gi, 'MH MATHEDU');
  
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
    difficulty: q.difficulty === 'Dễ' ? 1 : (q.difficulty === 'Khó' ? 3 : 2),
    imageUrl: q.imageUrl || ''
  }));

  // Sắp xếp câu hỏi theo độ khó tăng dần
  standardizedData.sort((a, b) => a.difficulty - b.difficulty);

  // 4. DATA ADAPTER ENGINE: ÁP DỤNG ADAPTER TƯƠNG ỨNG THEO TỪNG GAME

  // NHÓM 1: Game Đua xe F1 (cấu trúc Đa Chủ Đề & Đa Cấp Độ Tốc Độ)
  if (cleanUrl.includes('game-dua-xe-F1') || cleanUrl.includes('F1')) {
    const topicsMap: Record<string, { easy: any[], medium: any[], hard: any[] }> = {};
    questions.forEach(q => {
      const topicName = q.topic?.trim() || gameTitle;
      if (!topicsMap[topicName]) {
        topicsMap[topicName] = { easy: [], medium: [], hard: [] };
      }
      const diffKey = q.difficulty === 'Dễ' ? 'easy' : (q.difficulty === 'Khó' ? 'hard' : 'medium');
      topicsMap[topicName][diffKey].push({
        q: q.question,
        options: q.options || ['A', 'B', 'C', 'D'],
        correct: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
        explanation: q.explanation || '',
        imageUrl: q.imageUrl || ''
      });
    });

    const injectF1 = `
<script>
// [ADAPTER ENGINE: MULTI-TOPIC ARCHITECTURE - ĐUA XE F1]
window.gameDatabase = ${JSON.stringify(topicsMap, null, 2)};
window.selectedTopic = Object.keys(window.gameDatabase)[0] || "${gameTitle}";
</script>
`;
    htmlContent = injectScriptAtTop(htmlContent, injectF1);
  }

  // NHÓM 2: Game Bảo Vệ Chiến Hào (sinh đề tự động - cấu trúc Đa Chủ Đề, Dữ liệu Tĩnh & Random Bốc 5 câu)
  else if (cleanUrl.includes('chien-hao') || cleanUrl.includes('Bao-ve-chien-hao')) {
    let activeQuestions = [...questions];
    if (activeQuestions.length === 0) {
      try {
        const ws = DEFAULT_WORKSHEETS.find(w => 
          (w.title && (w.title.toLowerCase().includes('lượng giác') || w.title.toLowerCase().includes('luong giac'))) ||
          (w.id && (w.id.includes('luong_giac') || w.id.includes('10_05') || w.id.includes('10_06')))
        ) || DEFAULT_WORKSHEETS.find(w => w.questions && w.questions.length >= 10) || DEFAULT_WORKSHEETS[0];
        
        if (ws && ws.questions && ws.questions.length > 0) {
          activeQuestions = ws.questions.map((q, idx) => ({
            id: q.id || `ws_fb_${idx}`,
            question: q.question,
            options: q.options || ['A', 'B', 'C', 'D'],
            correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
            explanation: q.solution || '',
            difficulty: idx % 3 === 0 ? 'Dễ' : (idx % 3 === 1 ? 'Trung bình' : 'Khó'),
            topic: ws.title || 'Chiến Dịch: Giá Trị Lượng Giác'
          } as Question));
        }
      } catch (e) {
        console.warn('Lỗi lấy worksheet dự phòng:', e);
      }
    }

    const topicsMap: Record<string, { easy: any[], medium: any[], hard: any[] }> = {};
    const defaultTopic = gameTitle || 'Chiến Dịch: Tác Chiến Căn Cứ';

    activeQuestions.forEach(q => {
      const topicName = q.topic?.trim() || defaultTopic;
      if (!topicsMap[topicName]) {
        topicsMap[topicName] = { easy: [], medium: [], hard: [] };
      }
      const diffKey = q.difficulty === 'Dễ' ? 'easy' : (q.difficulty === 'Khó' ? 'hard' : 'medium');
      const cleanQ = normalizeMathFormulas(q.question);
      const cleanOpts = (q.options || ['A', 'B', 'C', 'D']).map(o => normalizeMathFormulas(o));
      const correctIdx = typeof q.correctIndex === 'number' ? q.correctIndex : 0;

      topicsMap[topicName][diffKey].push({
        q: cleanQ,
        options: cleanOpts,
        correct: correctIdx,
        explanation: normalizeMathFormulas(q.explanation || ''),
        imageUrl: q.imageUrl || ''
      });
    });

    // Đảm bảo mỗi cấp độ trong mỗi topic có tối thiểu 5 câu hỏi để random sampling
    Object.keys(topicsMap).forEach(tName => {
      const t = topicsMap[tName];
      const allQs = [...t.easy, ...t.medium, ...t.hard];
      if (allQs.length > 0) {
        while (t.easy.length < 5) {
          t.easy.push(allQs[t.easy.length % allQs.length]);
        }
        while (t.medium.length < 5) {
          t.medium.push(allQs[t.medium.length % allQs.length]);
        }
        while (t.hard.length < 5) {
          t.hard.push(allQs[t.hard.length % allQs.length]);
        }
      }
    });

    const firstTopic = Object.keys(topicsMap)[0] || defaultTopic;
    const battlefieldData = {
      level1: topicsMap[firstTopic]?.easy || [],
      level2: topicsMap[firstTopic]?.medium || [],
      level3: topicsMap[firstTopic]?.hard || []
    };

    const trenchScript = `
<script>
// [ADAPTER ENGINE: MULTI-TOPIC ARCHITECTURE & DATA FALLBACK - BẢO VỆ CHIẾN HÀO]
window.__GAME_TITLE__ = ${JSON.stringify(gameTitle)};
window.__ADMIN_PIN__ = "2806";
window.__INJECTED_BATTLEFIELD_DATA__ = ${JSON.stringify(battlefieldData, null, 2)};
window.__INJECTED_GAME_DATABASE__ = ${JSON.stringify(topicsMap, null, 2)};
window.battlefieldData = JSON.parse(JSON.stringify(window.__INJECTED_BATTLEFIELD_DATA__));
window.gameDatabase = JSON.parse(JSON.stringify(window.__INJECTED_GAME_DATABASE__));
window.selectedTopic = Object.keys(window.gameDatabase)[0] || ${JSON.stringify(gameTitle)};
window.useStaticTopic = true;

(function() {
  function syncBattlefieldDb() {
    if (window.__INJECTED_GAME_DATABASE__ && Object.keys(window.__INJECTED_GAME_DATABASE__).length > 0) {
      window.gameDatabase = JSON.parse(JSON.stringify(window.__INJECTED_GAME_DATABASE__));
      window.selectedTopic = Object.keys(window.gameDatabase)[0] || ${JSON.stringify(gameTitle)};
      window.battlefieldData = JSON.parse(JSON.stringify(window.__INJECTED_BATTLEFIELD_DATA__));
    }
    if (typeof ensureBattlefieldData === 'function') {
      ensureBattlefieldData();
    }
    if (typeof renderTopicMenuCards === 'function') {
      renderTopicMenuCards();
    }
    if (typeof renderCampaignMenu === 'function') {
      renderCampaignMenu();
    }
  }

  function applyAdminSecurity() {
    try {
      const params = new URLSearchParams(window.location.search);
      const isAdmin = params.get('role') === 'admin' || params.get('preview') === 'true' || params.get('admin') === '1';
      const adminBtns = document.querySelectorAll('#btn-admin-gear, #btn-chuyen-de, #btn-admin-gear-overlay, [data-admin-control="true"]');
      adminBtns.forEach(btn => {
        if (isAdmin) {
          btn.classList.remove('hidden');
          btn.style.setProperty('display', 'inline-flex', 'important');
        } else {
          btn.classList.add('hidden');
          btn.style.setProperty('display', 'none', 'important');
        }
      });
    } catch(e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      syncBattlefieldDb();
      applyAdminSecurity();
    });
  } else {
    syncBattlefieldDb();
    applyAdminSecurity();
  }
  window.addEventListener('load', function() {
    syncBattlefieldDb();
    applyAdminSecurity();
  });
})();
</script>
`;
    htmlContent = injectScriptAtTop(htmlContent, trenchScript);
  }
  // NHÓM ĐẠO HÀM CẤP 2 (cấu trúc Đa Chủ Đề & Đa Độ Khó)
  else if (cleanUrl.includes('dao-ham-cap2')) {
    const topicsMap: Record<string, { easy: any[], medium: any[], hard: any[] }> = {};
    questions.forEach(q => {
      const topicName = q.topic?.trim() || gameTitle;
      if (!topicsMap[topicName]) {
        topicsMap[topicName] = { easy: [], medium: [], hard: [] };
      }
      const diffKey = q.difficulty === 'Dễ' ? 'easy' : (q.difficulty === 'Khó' ? 'hard' : 'medium');
      topicsMap[topicName][diffKey].push({
        q: q.question,
        options: q.options || ['A', 'B', 'C', 'D'],
        correct: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
        explanation: q.explanation || ''
      });
    });

    const dhScript = `
<script>
// [ADAPTER ENGINE: MULTI-TOPIC ARCHITECTURE - ĐẠO HÀM CẤP 2]
window.gameDatabase = ${JSON.stringify(topicsMap, null, 2)};
window.selectedTopic = Object.keys(window.gameDatabase)[0] || "${gameTitle}";
window.useStaticTopic = true;
</script>
`;
    htmlContent = injectScriptAtTop(htmlContent, dhScript);
  }

  // NHÓM MARIO PHIÊU LƯU KÝ (cấu trúc Đa Chủ Đề & Đa Độ Khó)
  else if (cleanUrl.includes('mario') || cleanUrl.includes('Gamemario')) {
    const topicsMap: Record<string, { easy: any[], medium: any[], hard: any[] }> = {};
    questions.forEach(q => {
      const topicName = q.topic?.trim() || gameTitle;
      if (!topicsMap[topicName]) {
        topicsMap[topicName] = { easy: [], medium: [], hard: [] };
      }
      const diffKey = q.difficulty === 'Dễ' ? 'easy' : (q.difficulty === 'Khó' ? 'hard' : 'medium');
      topicsMap[topicName][diffKey].push({
        q: q.question,
        options: q.options || ['A', 'B', 'C', 'D'],
        correct: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
        explanation: q.explanation || ''
      });
    });

    const marioScript = `
<script>
// [ADAPTER ENGINE: MULTI-TOPIC ARCHITECTURE - MARIO PHIÊU LƯU KÝ]
window.gameDatabase = ${JSON.stringify(topicsMap, null, 2)};
window.selectedTopic = Object.keys(window.gameDatabase)[0] || "${gameTitle}";
window.useStaticTopic = true;
</script>
`;
    htmlContent = injectScriptAtTop(htmlContent, marioScript);
  }

  // NHÓM TETRIS XẾP GẠCH (cấu trúc Đa Chủ Đề & Đa Độ Khó)
  else if (cleanUrl.includes('tetris') || cleanUrl.includes('Gametetris')) {
    const topicsMap: Record<string, { easy: any[], medium: any[], hard: any[] }> = {};
    questions.forEach(q => {
      const topicName = q.topic?.trim() || gameTitle;
      if (!topicsMap[topicName]) {
        topicsMap[topicName] = { easy: [], medium: [], hard: [] };
      }
      const diffKey = q.difficulty === 'Dễ' ? 'easy' : (q.difficulty === 'Khó' ? 'hard' : 'medium');
      topicsMap[topicName][diffKey].push({
        q: q.question,
        options: q.options || ['A', 'B', 'C', 'D'],
        correct: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
        explanation: q.explanation || ''
      });
    });

    const tetrisScript = `
<script>
// [ADAPTER ENGINE: MULTI-TOPIC ARCHITECTURE - TETRIS XẾP GẠCH]
window.gameDatabase = ${JSON.stringify(topicsMap, null, 2)};
window.selectedTopic = Object.keys(window.gameDatabase)[0] || "${gameTitle}";
window.useStaticTopic = true;
</script>
`;
    htmlContent = injectScriptAtTop(htmlContent, tetrisScript);
  }

  // NHÓM GHÉP CẶP LƯỢNG GIÁC & CÔNG THỨC (cấu trúc Đa Chủ Đề & Đa Độ Khó)
  else if (cleanUrl.includes('ghep-cap')) {
    const topicsMap: Record<string, { easy: any[], medium: any[], hard: any[] }> = {};
    questions.forEach(q => {
      const topicName = q.topic?.trim() || gameTitle;
      if (!topicsMap[topicName]) {
        topicsMap[topicName] = { easy: [], medium: [], hard: [] };
      }
      const diffKey = q.difficulty === 'Dễ' ? 'easy' : (q.difficulty === 'Khó' ? 'hard' : 'medium');
      const correctText = (q.options && typeof q.correctIndex === 'number') ? q.options[q.correctIndex] : (q.options ? q.options[0] : '');
      topicsMap[topicName][diffKey].push({
        id: topicsMap[topicName][diffKey].length + 1,
        left: q.question,
        right: correctText,
        q: q.question,
        options: q.options || ['A', 'B', 'C', 'D'],
        correct: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
        explanation: q.explanation || ''
      });
    });

    const ghepCapScript = `
<script>
// [ADAPTER ENGINE: MULTI-TOPIC ARCHITECTURE - GHÉP CẶP LƯỢNG GIÁC]
window.gameDatabase = ${JSON.stringify(topicsMap, null, 2)};
window.selectedTopic = Object.keys(window.gameDatabase)[0] || "${gameTitle}";
window.useStaticTopic = true;
</script>
`;
    htmlContent = injectScriptAtTop(htmlContent, ghepCapScript);
  }

  // NHÓM 3: Game Sút Penalty (phân chia 3 vòng đấu: Vòng Bảng, Bán Kết, Chung Kết & Data Fallback)
  else if (cleanUrl.includes('sut-pen') || cleanUrl.includes('penalty')) {
    let activeQuestions = [...questions];
    if (activeQuestions.length === 0) {
      try {
        const ws = DEFAULT_WORKSHEETS.find(w => 
          (w.title && (w.title.toLowerCase().includes('lượng giác') || w.title.toLowerCase().includes('luong giac'))) ||
          (w.id && (w.id.includes('luong_giac') || w.id.includes('10_05') || w.id.includes('10_06') || w.id.includes('10_07')))
        ) || DEFAULT_WORKSHEETS.find(w => w.questions && w.questions.length >= 10) || DEFAULT_WORKSHEETS[0];
        
        if (ws && ws.questions && ws.questions.length > 0) {
          activeQuestions = ws.questions.map((q, idx) => ({
            id: q.id || `ws_pen_fb_${idx}`,
            question: q.question,
            options: q.options || ['A', 'B', 'C', 'D'],
            correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
            explanation: q.solution || '',
            difficulty: idx % 3 === 0 ? 'Dễ' : (idx % 3 === 1 ? 'Trung bình' : 'Khó'),
            topic: ws.title || 'Giá Trị Lượng Giác'
          } as Question));
        }
      } catch (e) {
        console.warn('Lỗi lấy worksheet dự phòng cho Sút Penalty:', e);
      }
    }

    let d1 = activeQuestions.filter(q => q.difficulty === 'Dễ');
    let d2 = activeQuestions.filter(q => q.difficulty === 'Trung bình');
    let d3 = activeQuestions.filter(q => q.difficulty === 'Khó');

    if (d1.length === 0 && d2.length === 0 && d3.length === 0 && activeQuestions.length > 0) {
      d1 = activeQuestions.slice(0, Math.ceil(activeQuestions.length / 3));
      d2 = activeQuestions.slice(Math.ceil(activeQuestions.length / 3), Math.ceil((2 * activeQuestions.length) / 3));
      d3 = activeQuestions.slice(Math.ceil((2 * activeQuestions.length) / 3));
    }

    // Đảm bảo mỗi giai đoạn có tối thiểu 5 câu hỏi để random sampling chống học vẹt
    const allPool = [...d1, ...d2, ...d3];
    if (allPool.length > 0) {
      while (d1.length < 5) d1.push(allPool[d1.length % allPool.length]);
      while (d2.length < 5) d2.push(allPool[d2.length % allPool.length]);
      while (d3.length < 5) d3.push(allPool[d3.length % allPool.length]);
    }

    const mapStageQuestions = (list: Question[]) => list.map(q => ({
      q: normalizeMathFormulas(q.question),
      options: (q.options || ['A', 'B', 'C', 'D']).map(o => normalizeMathFormulas(o)),
      correct: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
      explanation: normalizeMathFormulas(q.explanation || ''),
      imageUrl: q.imageUrl || ''
    }));

    const penaltyData = {
      vongBang: mapStageQuestions(d1),
      banKet: mapStageQuestions(d2),
      chungKet: mapStageQuestions(d3)
    };

    const penScript = `
<script>
// [ADAPTER ENGINE: SÚT PENALTY 3 GIAI ĐOẠN & DATA FALLBACK]
window.__GAME_TITLE__ = ${JSON.stringify(gameTitle)};
window.__ADMIN_PIN__ = "2806";
window.__INJECTED_PENALTY_DATA__ = ${JSON.stringify(penaltyData, null, 2)};
window.penaltyDatabase = JSON.parse(JSON.stringify(window.__INJECTED_PENALTY_DATA__));

(function() {
  function syncPenaltyData() {
    if (typeof ensurePenaltyData === 'function') {
      ensurePenaltyData();
    }
  }

  function applyAdminSecurity() {
    try {
      const params = new URLSearchParams(window.location.search);
      const isAdmin = params.get('role') === 'admin' || params.get('preview') === 'true' || params.get('admin') === '1';
      const adminBtns = document.querySelectorAll('#btn-admin-gear, #btn-chuyen-de, #btn-admin-gear-overlay, [data-admin-control="true"]');
      adminBtns.forEach(btn => {
        if (isAdmin) {
          btn.classList.remove('hidden');
          btn.style.setProperty('display', 'inline-flex', 'important');
        } else {
          btn.classList.add('hidden');
          btn.style.setProperty('display', 'none', 'important');
        }
      });
    } catch(e) {}
  }

  function setupAdminHooks() {
    if (typeof setupAdminButtons === 'function') {
      setupAdminButtons();
    }
  }

  function triggerMathTypeset() {
    try {
      if (typeof typesetMath === 'function') {
        typesetMath([document.getElementById('question-panel')]);
      } else if (window.MathJax && window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise().catch(function() {});
      }
    } catch(e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      syncPenaltyData();
      applyAdminSecurity();
      setupAdminHooks();
      triggerMathTypeset();
    });
  } else {
    syncPenaltyData();
    applyAdminSecurity();
    setupAdminHooks();
    triggerMathTypeset();
  }
  window.addEventListener('load', function() {
    syncPenaltyData();
    applyAdminSecurity();
    setupAdminHooks();
    triggerMathTypeset();
  });
})();
</script>
`;
    htmlContent = injectScriptAtTop(htmlContent, penScript);
  }

  // NHÓM 4: Game Bắn Chim (3 Mức Độ, 5 Phương Án A-E & Data Fallback Xác Suất 10)
  else if (cleanUrl.includes('ban-chim') || cleanUrl.includes('bird')) {
    let activeQuestions = [...questions];
    if (activeQuestions.length === 0) {
      try {
        const ws = DEFAULT_WORKSHEETS.find(w => 
          (w.title && (w.title.toLowerCase().includes('xác suất') || w.title.toLowerCase().includes('xac suat'))) ||
          (w.id && (w.id.includes('xac_suat') || w.id.includes('xacsuat') || w.id.includes('10_07') || w.id.includes('10_08')))
        ) || DEFAULT_WORKSHEETS.find(w => w.questions && w.questions.length >= 10) || DEFAULT_WORKSHEETS[0];
        
        if (ws && ws.questions && ws.questions.length > 0) {
          activeQuestions = ws.questions.map((q, idx) => ({
            id: q.id || `ws_bc_fb_${idx}`,
            question: q.question,
            options: q.options || ['A', 'B', 'C', 'D'],
            correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
            explanation: q.solution || '',
            difficulty: idx % 3 === 0 ? 'Dễ' : (idx % 3 === 1 ? 'Trung bình' : 'Khó'),
            topic: ws.title || 'Xác Suất Lớp 10'
          } as Question));
        }
      } catch (e) {
        console.warn('Lỗi lấy worksheet dự phòng cho Bắn Chim:', e);
      }
    }

    let d1 = activeQuestions.filter(q => q.difficulty === 'Dễ');
    let d2 = activeQuestions.filter(q => q.difficulty === 'Trung bình');
    let d3 = activeQuestions.filter(q => q.difficulty === 'Khó');

    if (d1.length === 0 && d2.length === 0 && d3.length === 0 && activeQuestions.length > 0) {
      d1 = activeQuestions.slice(0, Math.ceil(activeQuestions.length / 3));
      d2 = activeQuestions.slice(Math.ceil(activeQuestions.length / 3), Math.ceil((2 * activeQuestions.length) / 3));
      d3 = activeQuestions.slice(Math.ceil((2 * activeQuestions.length) / 3));
    }

    const allPool = [...d1, ...d2, ...d3];
    if (allPool.length > 0) {
      while (d1.length < 5) d1.push(allPool[d1.length % allPool.length]);
      while (d2.length < 5) d2.push(allPool[d2.length % allPool.length]);
      while (d3.length < 5) d3.push(allPool[d3.length % allPool.length]);
    }

    const mapBirdQuestions = (list: Question[]) => list.map(q => {
      let opts = q.options ? [...q.options] : ['A', 'B', 'C', 'D'];
      while (opts.length < 5) {
        opts.push(`Phương án ${String.fromCharCode(65 + opts.length)}`);
      }
      opts = opts.slice(0, 5).map(o => normalizeMathFormulas(o));
      const correctIdx = (typeof q.correctIndex === 'number' && q.correctIndex >= 0 && q.correctIndex < opts.length) ? q.correctIndex : 0;
      const correctText = opts[correctIdx];
      const wrongs = opts.filter((_, i) => i !== correctIdx);
      return {
        q: normalizeMathFormulas(q.question),
        options: opts,
        correct: correctText,
        correctIndex: correctIdx,
        wrongs: wrongs,
        explanation: normalizeMathFormulas(q.explanation || ''),
        imageUrl: q.imageUrl || ''
      };
    });

    const birdDatabase = {
      1: mapBirdQuestions(d1),
      2: mapBirdQuestions(d2),
      3: mapBirdQuestions(d3)
    };

    const flatQuizData = [...d1, ...d2, ...d3].map((q, idx) => {
      let opts = q.options ? [...q.options] : ['A', 'B', 'C', 'D'];
      while (opts.length < 5) opts.push(`Phương án ${String.fromCharCode(65 + opts.length)}`);
      opts = opts.slice(0, 5).map(o => normalizeMathFormulas(o));
      return {
        id: q.id || `bc_q_${idx}`,
        q: normalizeMathFormulas(q.question),
        options: opts,
        correct: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
        explanation: normalizeMathFormulas(q.explanation || ''),
        difficulty: q.difficulty === 'Dễ' ? 1 : (q.difficulty === 'Khó' ? 3 : 2)
      };
    });

    const bcScript = `
<script>
// [ADAPTER ENGINE: BẮN CHIM 3 MỨC ĐỘ, 5 PHƯƠNG ÁN & DATA FALLBACK]
window.__GAME_TITLE__ = ${JSON.stringify(gameTitle)};
window.__ADMIN_PIN__ = "2806";
window.__INJECTED_BIRD_DATA__ = ${JSON.stringify(birdDatabase, null, 2)};
window.birdQuizData = JSON.parse(JSON.stringify(window.__INJECTED_BIRD_DATA__));
window.questionLevels = JSON.parse(JSON.stringify(window.__INJECTED_BIRD_DATA__));
window.quizData = ${JSON.stringify(flatQuizData, null, 2)};

(function() {
  function syncBirdData() {
    if (typeof ensureBirdData === 'function') {
      ensureBirdData();
    }
  }

  function applyAdminSecurity() {
    try {
      const params = new URLSearchParams(window.location.search);
      const isAdmin = params.get('role') === 'admin' || params.get('preview') === 'true' || params.get('admin') === '1';
      const adminBtns = document.querySelectorAll('#btn-admin-gear, #btn-chuyen-de, [data-admin-control="true"]');
      adminBtns.forEach(btn => {
        if (isAdmin) {
          btn.classList.remove('hidden');
          btn.style.setProperty('display', 'inline-flex', 'important');
        } else {
          btn.classList.add('hidden');
          btn.style.setProperty('display', 'none', 'important');
        }
      });
    } catch(e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      syncBirdData();
      applyAdminSecurity();
    });
  } else {
    syncBirdData();
    applyAdminSecurity();
  }
  window.addEventListener('load', function() {
    syncBirdData();
    applyAdminSecurity();
  });
})();
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

  // NHÓM HÁI TÁO LUÂN PHIÊN (cấu trúc Đa Chủ Đề & Đa Độ Khó 2 Đội)
  else if (cleanUrl.includes('hai-tao')) {
    const topicsMap: Record<string, { easy: any[], medium: any[], hard: any[] }> = {};
    questions.forEach(q => {
      const topicName = q.topic?.trim() || gameTitle;
      if (!topicsMap[topicName]) {
        topicsMap[topicName] = { easy: [], medium: [], hard: [] };
      }
      const diffKey = q.difficulty === 'Dễ' ? 'easy' : (q.difficulty === 'Khó' ? 'hard' : 'medium');
      const letters = ['A', 'B', 'C', 'D'];
      const ansLetter = (typeof q.correctIndex === 'number' && q.correctIndex >= 0 && q.correctIndex < 4) ? letters[q.correctIndex] : 'A';
      const opts = (q.options || ['A', 'B', 'C', 'D']).map((o, idx) => `${letters[idx]}. ${o}`);
      const weight = diffKey === 'easy' ? 3 : (diffKey === 'medium' ? 5 : 8);
      const badge = diffKey === 'easy' ? 'Dễ' : (diffKey === 'medium' ? 'Vừa' : 'Khó');
      const color = diffKey === 'easy' ? '#2ecc71' : (diffKey === 'medium' ? '#f39c12' : '#e74c3c');

      topicsMap[topicName][diffKey].push({
        type: 'abcd',
        badge: badge,
        color: color,
        q: q.question,
        opts: opts,
        ans: ansLetter,
        w: weight,
        explanation: q.explanation || ''
      });
    });

    const haiTaoScript = `
<script>
// [ADAPTER ENGINE: MULTI-TOPIC ARCHITECTURE - HÁI TÁO LUÂN PHIÊN]
window.gameDatabase = ${JSON.stringify(topicsMap, null, 2)};
window.selectedTopic = Object.keys(window.gameDatabase)[0] || "${gameTitle}";
window.useStaticTopic = true;
</script>
`;
    htmlContent = injectScriptAtTop(htmlContent, haiTaoScript);
  }


  // NHÓM KÉO CO ĐỐI KHÁNG 2 ĐỘI (cấu trúc Đa Chủ Đề & Đa Độ Khó: Rounds với q1 & q2)
  else if (cleanUrl.includes('keo-co')) {
    const topicsMap: Record<string, { easy: any[], medium: any[], hard: any[] }> = {};
    const letters = ['A', 'B', 'C', 'D'];

    const rawGroups: Record<string, { easy: Question[], medium: Question[], hard: Question[] }> = {};
    questions.forEach(q => {
      const topicName = q.topic?.trim() || gameTitle;
      if (!rawGroups[topicName]) {
        rawGroups[topicName] = { easy: [], medium: [], hard: [] };
      }
      const diffKey = q.difficulty === 'Dễ' ? 'easy' : (q.difficulty === 'Khó' ? 'hard' : 'medium');
      rawGroups[topicName][diffKey].push(q);
    });

    Object.keys(rawGroups).forEach(topicName => {
      topicsMap[topicName] = { easy: [], medium: [], hard: [] };
      (['easy', 'medium', 'hard'] as const).forEach(diffKey => {
        const qList = rawGroups[topicName][diffKey];
        const timeLimit = diffKey === 'easy' ? 30 : (diffKey === 'medium' ? 120 : 180);
        const levelLabel = diffKey === 'easy' ? 'Dễ' : (diffKey === 'medium' ? 'Vừa' : 'Khó');
        const classLabel = diffKey === 'easy' ? 'de' : (diffKey === 'medium' ? 'vua' : 'kho');

        for (let i = 0; i < qList.length; i += 2) {
          const item1 = qList[i];
          const item2 = qList[i + 1] || item1;
          
          const ansLetter1 = (typeof item1.correctIndex === 'number' && item1.correctIndex >= 0 && item1.correctIndex < 4) ? letters[item1.correctIndex] : 'A';
          const opts1 = (item1.options || ['A', 'B', 'C', 'D']).map((o, idx) => `${letters[idx]}. ${o}`);
          
          const ansLetter2 = (typeof item2.correctIndex === 'number' && item2.correctIndex >= 0 && item2.correctIndex < 4) ? letters[item2.correctIndex] : 'A';
          const opts2 = (item2.options || ['A', 'B', 'C', 'D']).map((o, idx) => `${letters[idx]}. ${o}`);

          topicsMap[topicName][diffKey].push({
            type: 'abcd',
            time: timeLimit,
            level: levelLabel,
            class: classLabel,
            q1: {
              text: item1.question,
              options: opts1,
              ans: ansLetter1,
              exp: item1.explanation || ''
            },
            q2: {
              text: item2.question,
              options: opts2,
              ans: ansLetter2,
              exp: item2.explanation || ''
            }
          });
        }
      });
    });

    const tugScript = `
<script>
// [ADAPTER ENGINE: MULTI-TOPIC ARCHITECTURE - KÉO CO ĐỐI KHÁNG 2 ĐỘI]
window.gameDatabase = ${JSON.stringify(topicsMap, null, 2)};
window.selectedTopic = Object.keys(window.gameDatabase)[0] || "${gameTitle}";
</script>
`;
    htmlContent = injectScriptAtTop(htmlContent, tugScript);
  }

  // NHÓM KÉO THẢ TƯƠNG TÁC (cấu trúc Đa Chủ Đề & Đa Cấp Độ GAME_LEVELS)
  else if (cleanUrl.includes('keo-tha')) {
    const topicsMap: Record<string, any> = {};
    const defaultTopic = gameTitle || 'Chuyên đề Tùy Chọn';
    const themeColors = ['blue', 'emerald', 'violet', 'amber', 'rose', 'cyan'];

    // Ưu tiên 1: Sử dụng customDragDropRows (Bảng Phân Cấp Đa Chuyên Đề & Đa Cấp Độ)
    if (customDragDropRows && customDragDropRows.length > 0) {
      const topicGroups: Record<string, DragDropTableRow[]> = {};
      customDragDropRows.forEach(r => {
        const t = r.topic?.trim() || defaultTopic;
        if (!topicGroups[t]) topicGroups[t] = [];
        topicGroups[t].push(r);
      });

      Object.keys(topicGroups).forEach(tName => {
        const rowsInTopic = topicGroups[tName];
        topicsMap[tName] = {};

        // Nhóm các hàng theo Level
        const levelGroups: Record<number, DragDropTableRow[]> = {};
        rowsInTopic.forEach(r => {
          const lvl = r.level && r.level >= 1 ? r.level : 1;
          if (!levelGroups[lvl]) levelGroups[lvl] = [];
          levelGroups[lvl].push(r);
        });

        const sortedLevels = Object.keys(levelGroups).map(Number).sort((a, b) => a - b);
        sortedLevels.forEach(lvl => {
          const rowsAtLvl = levelGroups[lvl];
          const funcs: any[] = [];
          const props: any[] = [];

          rowsAtLvl.forEach((row, rIdx) => {
            const funcId = `f${rIdx + 1}`;
            funcs.push({
              id: funcId,
              tex: normalizeMathFormulas(row.category),
              theme: row.theme || themeColors[rIdx % themeColors.length]
            });

            (row.attributes || []).forEach((attr, aIdx) => {
              props.push({
                id: `p${rIdx + 1}_${aIdx + 1}`,
                funcId: funcId,
                text: normalizeMathFormulas(attr)
              });
            });
          });

          topicsMap[tName][lvl] = {
            title: `Cấp Độ ${lvl}: ${lvl === 1 ? 'Khởi Động' : (lvl >= 4 ? 'Nâng Cao' : 'Tiêu Chuẩn')}`,
            diffBadge: lvl === 1 ? 'Dễ' : (lvl >= 4 ? 'Khó' : 'Vừa'),
            colorTheme: themeColors[(lvl - 1) % themeColors.length],
            time: 180,
            funcs: funcs,
            props: props
          };
        });
      });
    } else if (customCategories && customCategories.length > 0) {
      // Ưu tiên 2: Sử dụng customCategories (Mẫu 2 cột phẳng)
      topicsMap[defaultTopic] = {};
      const chunkSize = 3;
      const totalLevels = Math.min(5, Math.max(1, Math.ceil(customCategories.length / chunkSize)));

      for (let lvl = 1; lvl <= totalLevels; lvl++) {
        const sliceStart = (lvl - 1) * chunkSize;
        const sliceCats = customCategories.slice(sliceStart, sliceStart + chunkSize);
        if (sliceCats.length === 0) break;

        const funcs: any[] = [];
        const props: any[] = [];

        sliceCats.forEach((cat, idx) => {
          const funcId = `f${idx + 1}`;
          funcs.push({
            id: funcId,
            tex: normalizeMathFormulas(cat.title),
            theme: cat.theme || themeColors[idx % themeColors.length]
          });

          (cat.attributes || []).forEach((attr, pIdx) => {
            props.push({
              id: `p${idx + 1}_${pIdx + 1}`,
              funcId: funcId,
              text: normalizeMathFormulas(attr)
            });
          });
        });

        topicsMap[defaultTopic][lvl] = {
          title: `Cấp Độ ${lvl}: ${lvl === 1 ? 'Khởi Động' : (lvl >= 4 ? 'Nâng Cao' : 'Tiêu Chuẩn')}`,
          diffBadge: lvl === 1 ? 'Dễ' : (lvl >= 4 ? 'Khó' : 'Vừa'),
          colorTheme: themeColors[(lvl - 1) % themeColors.length],
          time: 180,
          funcs: funcs,
          props: props
        };
      }
    } else {
      // Ưu tiên 3: Chuyển đổi từ mảng questions tiêu chuẩn
      const groupedByTopic: Record<string, Question[]> = {};
      questions.forEach(q => {
        const tName = q.topic?.trim() || defaultTopic;
        if (!groupedByTopic[tName]) groupedByTopic[tName] = [];
        groupedByTopic[tName].push(q);
      });

      Object.keys(groupedByTopic).forEach(tName => {
        const qList = groupedByTopic[tName];
        topicsMap[tName] = {};

        const chunkSize = 3;
        const totalLevels = Math.min(5, Math.max(1, Math.ceil(qList.length / chunkSize)));

        for (let lvl = 1; lvl <= totalLevels; lvl++) {
          const sliceStart = (lvl - 1) * chunkSize;
          const sliceQuestions = qList.slice(sliceStart, sliceStart + chunkSize);
          if (sliceQuestions.length === 0) break;

          const funcs: any[] = [];
          const props: any[] = [];

          sliceQuestions.forEach((q, idx) => {
            const funcId = `f${idx + 1}`;
            funcs.push({
              id: funcId,
              tex: normalizeMathFormulas(q.question),
              theme: themeColors[idx % themeColors.length]
            });

            (q.options || []).forEach((opt, pIdx) => {
              props.push({
                id: `p${idx + 1}_${pIdx + 1}`,
                funcId: funcId,
                text: normalizeMathFormulas(opt)
              });
            });
          });

          topicsMap[tName][lvl] = {
            title: `Cấp Độ ${lvl}: ${sliceQuestions[0]?.difficulty || 'Tùy Chỉnh'}`,
            diffBadge: lvl === 1 ? 'Dễ' : (lvl >= 4 ? 'Khó' : 'Vừa'),
            colorTheme: themeColors[(lvl - 1) % themeColors.length],
            time: 180,
            funcs: funcs,
            props: props
          };
        }
      });
    }

    const keoThaScript = `
<script>
// [ADAPTER ENGINE: DYNAMIC MULTI-TOPIC ARCHITECTURE - KÉO THẢ TƯƠNG TÁC]
window.__ADMIN_PIN__ = "2806";
window.__INJECTED_GAME_DATABASE__ = ${JSON.stringify(topicsMap, null, 2)};
(function() {
  function syncKeoThaDb() {
    if (typeof window.gameDatabase !== 'undefined' && window.__INJECTED_GAME_DATABASE__ && Object.keys(window.__INJECTED_GAME_DATABASE__).length > 0) {
      window.gameDatabase = JSON.parse(JSON.stringify(window.__INJECTED_GAME_DATABASE__));
      window.selectedTopic = Object.keys(window.gameDatabase)[0] || "${gameTitle}";
      if (typeof window.showOverlay === 'function') {
        window.showOverlay('start');
      }
    }
  }

  // [BƯỚC 3: SECURITY GATE - KHÓA BẢO MẬT NÚT ADMIN CHO HỌC SINH]
  function applyAdminSecurity() {
    try {
      const params = new URLSearchParams(window.location.search);
      const isAdmin = params.get('role') === 'admin' || params.get('preview') === 'true' || params.get('admin') === '1';
      const adminBtns = document.querySelectorAll('#btn-admin-gear, [data-admin-control="true"]');
      adminBtns.forEach(btn => {
        if (isAdmin) {
          btn.classList.remove('hidden');
          btn.style.display = '';
        } else {
          btn.classList.add('hidden');
          btn.style.display = 'none';
        }
      });
    } catch(e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      syncKeoThaDb();
      applyAdminSecurity();
    });
  } else {
    syncKeoThaDb();
    applyAdminSecurity();
  }
  window.addEventListener('load', function() {
    syncKeoThaDb();
    applyAdminSecurity();
  });
})();
</script>
`;
    htmlContent = injectScriptAtTop(htmlContent, keoThaScript);
  }

  // NHÓM NGHIÊNG ĐẦU CHỌN ĐÁP ÁN (cấu trúc Đa Chủ Đề & Đa Độ Khó: left/right/correct)
  else if (cleanUrl.includes('nghieng-dau')) {
    const topicsMap: Record<string, { easy: any[], medium: any[], hard: any[] }> = {};
    const defaultTopic = gameTitle || 'Chuyên đề Tùy Chọn';

    questions.forEach(q => {
      const topicName = q.topic?.trim() || defaultTopic;
      if (!topicsMap[topicName]) {
        topicsMap[topicName] = { easy: [], medium: [], hard: [] };
      }
      const diffKey = q.difficulty === 'Dễ' ? 'easy' : (q.difficulty === 'Khó' ? 'hard' : 'medium');
      
      let leftOpt = 'Đáp án A';
      let rightOpt = 'Đáp án B';
      let correctSide = 'LEFT';

      if (q.options && q.options.length >= 2) {
        const cIdx = typeof q.correctIndex === 'number' ? q.correctIndex : 0;
        if (cIdx === 0) {
          leftOpt = q.options[0];
          rightOpt = q.options[1];
          correctSide = 'LEFT';
        } else if (cIdx === 1) {
          leftOpt = q.options[0];
          rightOpt = q.options[1];
          correctSide = 'RIGHT';
        } else if (cIdx === 2) {
          leftOpt = q.options[2];
          rightOpt = q.options[3] || q.options[0];
          correctSide = 'LEFT';
        } else {
          leftOpt = q.options[2] || q.options[0];
          rightOpt = q.options[3] || q.options[1];
          correctSide = 'RIGHT';
        }
      }

      topicsMap[topicName][diffKey].push({
        text: q.question,
        left: leftOpt,
        right: rightOpt,
        correct: correctSide
      });
    });

    const tiltScript = `
<script>
// [ADAPTER ENGINE: MULTI-TOPIC ARCHITECTURE - NGHIÊNG ĐẦU CHỌN ĐÁP ÁN]
if (typeof window.gameDatabase !== 'undefined') {
  Object.assign(window.gameDatabase, ${JSON.stringify(topicsMap, null, 2)});
  window.selectedTopic = Object.keys(window.gameDatabase)[0] || "${gameTitle}";
}
</script>
`;
    htmlContent = injectScriptAtTop(htmlContent, tiltScript);
  }

  // NHÓM PIKACHU NỐI CẶP ĐẠO HÀM (cấu trúc Đa Chủ Đề: pairs 24+ cặp thẻ cho bàn 48 ô)
  else if (cleanUrl.includes('pikachu')) {
    const topicsMap: Record<string, Record<number, any[]>> = {};
    const defaultTopic = gameTitle || 'Chuyên đề Tùy Chọn';
    const icons = ['fa-cat', 'fa-dog', 'fa-hippo', 'fa-otter', 'fa-kiwi-bird', 'fa-fish', 'fa-dragon', 'fa-spider', 'fa-crow'];
    const colors = ['#ffe600', '#00b8ff', '#ff2a6d', '#01ffc3', '#ff7b00', '#b300ff', '#6a00ff', '#bfff00', '#ff00a0'];

    // Nhóm câu hỏi theo chủ đề
    const groupedByTopic: Record<string, Question[]> = {};
    const activeQuestions = questions.filter(q => !q.isDisabled);
    (activeQuestions.length > 0 ? activeQuestions : questions).forEach(q => {
      const tName = q.topic?.trim() || defaultTopic;
      if (!groupedByTopic[tName]) groupedByTopic[tName] = [];
      groupedByTopic[tName].push(q);
    });

    Object.keys(groupedByTopic).forEach(tName => {
      const qList = groupedByTopic[tName];
      topicsMap[tName] = { 1: [], 2: [], 3: [] };

      // Phân chia theo level (difficulty)
      const byDiff: Record<number, Question[]> = { 1: [], 2: [], 3: [] };
      qList.forEach(q => {
        const d = q.difficulty === 'Dễ' ? 1 : q.difficulty === 'Khó' ? 3 : 2;
        byDiff[d].push(q);
      });

      [1, 2, 3].forEach(lvl => {
        // Nếu level không có câu, dùng chung tất cả
        const source = byDiff[lvl].length > 0 ? byDiff[lvl] : qList;
        const pairs: any[] = source.map((q, i) => {
          const rightText = normalizeMathFormulas(
            (q.options && typeof q.correctIndex === 'number' && q.options[q.correctIndex])
              ? q.options[q.correctIndex]
              : (q.options?.[0] || 'Đáp án')
          );
          return {
            id: i + 1,
            left: normalizeMathFormulas(q.question || ''),
            right: rightText,
            icon: icons[i % icons.length],
            themeColor: colors[i % colors.length]
          };
        });
        topicsMap[tName][lvl] = pairs;
      });
    });

    const pikachuScript = `
<script>
// [ADAPTER ENGINE: MULTI-TOPIC ARCHITECTURE - PIKACHU NỐI CẶP]
// Inject dữ liệu từ Studio vào biến chuẩn
window.__INJECTED_PIKACHU_DATA__ = ${JSON.stringify(topicsMap, null, 2)};
window.pikachuQuizData = window.__INJECTED_PIKACHU_DATA__;
window.__ADMIN_PIN__ = "2806";

// Gán vào gameDatabase nếu đã sẵn sàng, hoặc chờ script load xong
(function applyPikachuData() {
  if (typeof window.gameDatabase !== 'undefined') {
    Object.assign(window.gameDatabase, window.__INJECTED_PIKACHU_DATA__);
    window.selectedTopic = Object.keys(window.gameDatabase)[0] || "${gameTitle}";
    if (typeof window.renderPikachuTopicCards === 'function') window.renderPikachuTopicCards();
  } else {
    window.addEventListener('DOMContentLoaded', function() {
      if (typeof window.gameDatabase !== 'undefined') {
        Object.assign(window.gameDatabase, window.__INJECTED_PIKACHU_DATA__);
        window.selectedTopic = Object.keys(window.gameDatabase)[0] || "${gameTitle}";
        if (typeof window.renderPikachuTopicCards === 'function') window.renderPikachuTopicCards();
        if (typeof window.ensurePikachuData === 'function') window.ensurePikachuData();
      }
    });
  }
})();

// Admin security - áp dụng ngay khi DOM sẵn sàng
(function applyAdminSecurity() {
  function _checkAdmin() {
    try {
      const params = new URLSearchParams(window.location.search);
      const isAdmin = params.get('role') === 'admin' || params.get('admin') === '1' || params.get('preview') === 'true';
      const topbar = document.getElementById('admin-topbar');
      const adminBtns = document.querySelectorAll('#btn-admin-gear, #btn-chuyen-de, [data-admin-control="true"]');
      if (isAdmin) {
        if (topbar) topbar.style.setProperty('display', 'flex', 'important');
        adminBtns.forEach(btn => { btn.classList.remove('hidden'); btn.style.setProperty('display', 'inline-flex', 'important'); });
      } else {
        if (topbar) topbar.style.setProperty('display', 'none', 'important');
        adminBtns.forEach(btn => { btn.classList.add('hidden'); btn.style.setProperty('display', 'none', 'important'); });
      }
    } catch(e) {}
  }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', _checkAdmin); } else { _checkAdmin(); }
})();
<\/script>
`;
    htmlContent = injectScriptAtTop(htmlContent, pikachuScript);
  }

  // NHÓM RẮN SĂN MỒI (Tập hợp 10 & Xác suất 10 - cấu trúc Đa Chủ Đề & Đa Độ Khó: qStr/target/options)
  else if (cleanUrl.includes('ran-san-tap-hop') || cleanUrl.includes('ran-san-xac-suat')) {
    const topicsMap: Record<string, { easy: any[], medium: any[], hard: any[] }> = {};
    const defaultTopic = gameTitle || 'Chuyên đề Tùy Chọn';

    questions.forEach(q => {
      const topicName = q.topic?.trim() || defaultTopic;
      if (!topicsMap[topicName]) {
        topicsMap[topicName] = { easy: [], medium: [], hard: [] };
      }
      const diffKey = q.difficulty === 'Dễ' ? 'easy' : (q.difficulty === 'Khó' ? 'hard' : 'medium');
      const targetAns = (q.options && typeof q.correctIndex === 'number' && q.options[q.correctIndex])
        ? q.options[q.correctIndex]
        : (q.options?.[0] || 'Đáp án');

      topicsMap[topicName][diffKey].push({
        qStr: q.question,
        target: targetAns,
        options: q.options || [targetAns]
      });
    });

    const snakeScript = `
<script>
// [ADAPTER ENGINE: MULTI-TOPIC ARCHITECTURE - RẮN SĂN MỒI]
if (typeof window.gameDatabase !== 'undefined') {
  Object.assign(window.gameDatabase, ${JSON.stringify(topicsMap, null, 2)});
  window.selectedTopic = Object.keys(window.gameDatabase)[0] || "${gameTitle}";
}
</script>
`;
    htmlContent = injectScriptAtTop(htmlContent, snakeScript);
  }

  // NHÓM SƠ ĐỒ CÂY XÁC SUẤT (cấu trúc Đa Chủ Đề & Đa Độ Khó: tree scenarios)
  else if (cleanUrl.includes('so_do_cay') || cleanUrl.includes('so-do-cay')) {
    const topicsMap: Record<string, { easy: any, medium: any, hard: any }> = {};
    const defaultTopic = gameTitle || 'Chuyên đề Tùy Chọn';

    questions.forEach(q => {
      const topicName = q.topic?.trim() || defaultTopic;
      if (!topicsMap[topicName]) {
        topicsMap[topicName] = { easy: null, medium: null, hard: null };
      }
      const diffKey = q.difficulty === 'Dễ' ? 'easy' : (q.difficulty === 'Khó' ? 'hard' : 'medium');
      const targetAns = (q.options && typeof q.correctIndex === 'number' && q.options[q.correctIndex])
        ? q.options[q.correctIndex]
        : (q.options?.[0] || '1/2');

      if (!topicsMap[topicName][diffKey]) {
        topicsMap[topicName][diffKey] = {
          title: q.question,
          desc: q.explanation || q.question,
          task: `Xác định và điền xác suất các nhánh: kết quả chính là ${targetAns}`,
          tree: {
            id: 'root', label: 'Ω', isComplement: false,
            children: [
              {
                id: 'n1', label: 'A', isComplement: false, prob: '', expected: targetAns,
                children: [
                  { id: 'n1_1', label: 'B', isComplement: false, prob: '', expected: targetAns, children: [] },
                  { id: 'n1_2', label: 'B', isComplement: true, prob: '', expected: '', children: [] }
                ]
              },
              {
                id: 'n2', label: 'A', isComplement: true, prob: '', expected: '',
                children: [
                  { id: 'n2_1', label: 'B', isComplement: false, prob: '', expected: targetAns, children: [] },
                  { id: 'n2_2', label: 'B', isComplement: true, prob: '', expected: '', children: [] }
                ]
              }
            ]
          }
        };
      }
    });

    const treeScript = `
<script>
// [ADAPTER ENGINE: MULTI-TOPIC ARCHITECTURE - SƠ ĐỒ CÂY XÁC SUẤT]
if (typeof window.gameDatabase !== 'undefined' && Object.keys(${JSON.stringify(topicsMap)}).length > 0) {
  Object.assign(window.gameDatabase, ${JSON.stringify(topicsMap, null, 2)});
  window.currentTopicName = Object.keys(window.gameDatabase)[0] || "${gameTitle}";
}
</script>
`;
    htmlContent = injectScriptAtTop(htmlContent, treeScript);
  }

  // NHÓM YOGA PHẢN XẠ XÁC SUẤT (cấu trúc Đa Chủ Đề & Đa Độ Khó: TF & MC + Data Fallback)
  else if (cleanUrl.includes('yoga')) {
    const topicsMap: Record<string, { easy: any[], medium: any[], hard: any[] }> = {};
    const defaultTopic = gameTitle || 'Chủ đề 1: Biến Cố Giao, Hợp & Biến Cố Độc Lập';
    const letters = ['A', 'B', 'C', 'D'];

    let activeQuestions = [...questions];
    if (activeQuestions.length === 0) {
      try {
        const ws = DEFAULT_WORKSHEETS.find(w => 
          (w.title && (w.title.toLowerCase().includes('xác suất') || w.title.toLowerCase().includes('xac suat'))) ||
          (w.id && (w.id.includes('xac_suat') || w.id.includes('xacsuat') || w.id.includes('11_') || w.id.includes('10_07')))
        ) || DEFAULT_WORKSHEETS.find(w => w.questions && w.questions.length >= 10) || DEFAULT_WORKSHEETS[0];
        
        if (ws && ws.questions && ws.questions.length > 0) {
          activeQuestions = ws.questions.map((q, idx) => ({
            id: q.id || `ws_yoga_fb_${idx}`,
            question: q.question,
            options: q.options || ['A', 'B', 'C', 'D'],
            correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
            explanation: q.solution || '',
            difficulty: idx % 3 === 0 ? 'Dễ' : (idx % 3 === 1 ? 'Trung bình' : 'Khó'),
            topic: ws.title || defaultTopic
          } as Question));
        }
      } catch (e) {
        console.warn('Lỗi lấy worksheet dự phòng cho Yoga:', e);
      }
    }

    activeQuestions.forEach(q => {
      let topicName = q.topic?.trim() || defaultTopic;
      if (!topicsMap[topicName]) {
        topicsMap[topicName] = { easy: [], medium: [], hard: [] };
      }
      const diffKey = q.difficulty === 'Dễ' ? 'easy' : (q.difficulty === 'Khó' ? 'hard' : 'medium');
      const ansIdx = typeof q.correctIndex === 'number' ? q.correctIndex : 0;
      const ansLetter = letters[ansIdx] || 'A';

      if (q.options && q.options.length === 2) {
        topicsMap[topicName][diffKey].push({
          type: 'TF',
          text: normalizeMathFormulas(q.question),
          left: normalizeMathFormulas(q.options[0] || 'Đúng'),
          right: normalizeMathFormulas(q.options[1] || 'Sai'),
          correct: ansIdx === 0 ? 'LEFT' : 'RIGHT',
          explanation: normalizeMathFormulas(q.explanation || '')
        });
      } else {
        const optsObj = {
          A: normalizeMathFormulas(q.options?.[0] || 'A'),
          B: normalizeMathFormulas(q.options?.[1] || 'B'),
          C: normalizeMathFormulas(q.options?.[2] || 'C'),
          D: normalizeMathFormulas(q.options?.[3] || 'D')
        };
        topicsMap[topicName][diffKey].push({
          type: 'MC',
          text: normalizeMathFormulas(q.question),
          opts: optsObj,
          correct: ansLetter,
          explanation: normalizeMathFormulas(q.explanation || '')
        });
      }
    });

    const yogaScript = `
<script>
// [ADAPTER ENGINE: MULTI-TOPIC ARCHITECTURE - YOGA PHẢN XẠ & DATA FALLBACK]
window.__GAME_TITLE__ = ${JSON.stringify(gameTitle)};
window.__ADMIN_PIN__ = "2806";
window.__INJECTED_YOGA_DATA__ = ${JSON.stringify(topicsMap, null, 2)};
window.gameDatabase = JSON.parse(JSON.stringify(window.__INJECTED_YOGA_DATA__));
window.yogaQuizData = JSON.parse(JSON.stringify(window.__INJECTED_YOGA_DATA__));

(function() {
  function syncYogaData() {
    if (typeof ensureYogaData === 'function') {
      ensureYogaData();
    }
  }

  function applyAdminSecurity() {
    try {
      const params = new URLSearchParams(window.location.search);
      const isAdmin = params.get('role') === 'admin' || params.get('preview') === 'true' || params.get('admin') === '1';
      const adminBtns = document.querySelectorAll('#btn-admin-gear, #btn-chuyen-de, [data-admin-control="true"]');
      adminBtns.forEach(btn => {
        if (isAdmin) {
          btn.classList.remove('hidden');
          btn.style.setProperty('display', 'inline-flex', 'important');
        } else {
          btn.classList.add('hidden');
          btn.style.setProperty('display', 'none', 'important');
        }
      });
    } catch(e) {}
  }

  function setupAdminHooks() {
    if (typeof setupAdminButtons === 'function') {
      setupAdminButtons();
    }
  }

  function triggerMathTypeset() {
    try {
      if (typeof typesetMath === 'function') {
        typesetMath([document.getElementById('game-ui')]);
      } else if (window.MathJax && window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise().catch(function() {});
      }
    } catch(e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      syncYogaData();
      applyAdminSecurity();
      setupAdminHooks();
      triggerMathTypeset();
    });
  } else {
    syncYogaData();
    applyAdminSecurity();
    setupAdminHooks();
    triggerMathTypeset();
  }
  window.addEventListener('load', function() {
    syncYogaData();
    applyAdminSecurity();
    setupAdminHooks();
    triggerMathTypeset();
  });
})();
</script>
`;
    htmlContent = injectScriptAtTop(htmlContent, yogaScript);
  }

  // NHÓM 5b: Game Cờ Cá Ngựa (cấu trúc Đa Câu Hỏi ABCD & Đúng/Sai 4 ý)
  else if (cleanUrl.includes('ca-ngua') || cleanUrl.includes('ca_ngua') || cleanUrl.includes('ngua')) {
    const formattedQuestions = questions.map((q, idx) => {
      const isTF = (q.options && q.options.length === 2) || (typeof q.question === 'string' && q.question.startsWith('ĐÚNG HAY SAI:'));
      return {
        id: q.id || `cn_q_${idx + 1}`,
        q: normalizeMathFormulas(q.question),
        options: (q.options && q.options.length > 0) ? q.options.map(o => normalizeMathFormulas(o)) : ['Đúng', 'Sai'],
        correct: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
        explanation: normalizeMathFormulas(q.explanation || ''),
        difficulty: q.difficulty === 'Dễ' ? 1 : (q.difficulty === 'Khó' ? 3 : 2),
        type: isTF ? 'truefalse' : 'abcd',
        imageUrl: q.imageUrl || ''
      };
    });

    const caNguaScript = `
<script>
// [ADAPTER ENGINE: CỜ CÁ NGỰA - DỮ LIỆU ĐÓNG GÓI & SECURITY GATE]
window.__GAME_TITLE__ = ${JSON.stringify(gameTitle)};
window.__ADMIN_PIN__ = "2806";
window.__INJECTED_CANGUA_DATA__ = ${JSON.stringify(formattedQuestions, null, 2)};
window.quizData = JSON.parse(JSON.stringify(window.__INJECTED_CANGUA_DATA__));
var QUESTION_BANK = window.quizData;
var questions = window.quizData;

(function() {
  function syncCaNguaData() {
    if (window.__INJECTED_CANGUA_DATA__ && window.__INJECTED_CANGUA_DATA__.length > 0) {
      window.quizData = JSON.parse(JSON.stringify(window.__INJECTED_CANGUA_DATA__));
      if (typeof QUESTION_BANK !== 'undefined') {
        QUESTION_BANK = window.quizData;
      }
    }
  }

  function applyAdminSecurity() {
    try {
      const params = new URLSearchParams(window.location.search);
      const isAdmin = params.get('role') === 'admin' || params.get('preview') === 'true' || params.get('admin') === '1';
      const adminTopbar = document.getElementById('admin-topbar');
      const adminControls = document.getElementById('admin-controls');
      const adminBtns = document.querySelectorAll('#btn-admin-gear, #btn-chuyen-de, [data-admin-control="true"]');
      if (isAdmin) {
        if (adminTopbar) adminTopbar.style.setProperty('display', 'flex', 'important');
        if (adminControls) adminControls.style.setProperty('display', 'flex', 'important');
        adminBtns.forEach(btn => {
          btn.classList.remove('hidden');
          btn.style.setProperty('display', 'inline-flex', 'important');
        });
      } else {
        if (adminTopbar) adminTopbar.style.setProperty('display', 'none', 'important');
        if (adminControls) adminControls.style.setProperty('display', 'none', 'important');
        adminBtns.forEach(btn => {
          btn.classList.add('hidden');
          btn.style.setProperty('display', 'none', 'important');
        });
      }
    } catch(e) {}
  }

  function setupAdminButtons() {
    try {
      const gearBtn = document.getElementById('btn-admin-gear');
      if (gearBtn && !gearBtn.dataset.listenerAttached) {
        gearBtn.dataset.listenerAttached = 'true';
        gearBtn.addEventListener('click', function(e) {
          e.preventDefault();
          if (typeof window.openAdminPinPrompt === 'function') {
            window.openAdminPinPrompt();
          } else if (typeof window.toggleAdminModal === 'function') {
            window.toggleAdminModal();
          }
        });
      }
    } catch(e) {}
  }

  function triggerMathTypeset() {
    try {
      if (window.MathJax && window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise().catch(function() {});
      } else if (typeof window.renderMathInElement === 'function') {
        window.renderMathInElement(document.body, {
          delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "$", right: "$", display: false },
            { left: "\\\\(", right: "\\\\)", display: false },
            { left: "\\\\[", right: "\\\\]", display: true }
          ]
        });
      }
    } catch(e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      syncCaNguaData();
      applyAdminSecurity();
      setupAdminButtons();
      triggerMathTypeset();
    });
  } else {
    syncCaNguaData();
    applyAdminSecurity();
    setupAdminButtons();
    triggerMathTypeset();
  }
  window.addEventListener('load', function() {
    syncCaNguaData();
    applyAdminSecurity();
    setupAdminButtons();
    triggerMathTypeset();
  });
})();
</script>
`;
    htmlContent = injectScriptAtTop(htmlContent, caNguaScript);
  }

  // NHÓM 5c: Game Tetris Xếp Gạch (Hỗ trợ Đa Chủ Đề, 3 dạng câu hỏi ABCD, Đúng/Sai, Trả lời ngắn & In-game Editor)
  else if (cleanUrl.includes('tetris') || cleanUrl.includes('Gametetris')) {
    const topicsMap: Record<string, { easy: any[], medium: any[], hard: any[] }> = {};
    const defaultTopic = gameTitle || 'Chuyên đề 1: Hai Mặt Phẳng Vuông Góc';

    questions.forEach(q => {
      const topicName = q.topic?.trim() || defaultTopic;
      if (!topicsMap[topicName]) {
        topicsMap[topicName] = { easy: [], medium: [], hard: [] };
      }
      const diffKey = q.difficulty === 'Dễ' ? 'easy' : (q.difficulty === 'Khó' ? 'hard' : 'medium');
      const isTF = (q.options && q.options.length === 2) || (typeof q.question === 'string' && q.question.startsWith('ĐÚNG HAY SAI:')) || (q as any).type === 'truefalse';
      const isShort = (q.options && q.options.length === 1) || (q as any).type === 'short_answer';

      topicsMap[topicName][diffKey].push({
        id: q.id,
        q: normalizeMathFormulas(q.question),
        options: (q.options && q.options.length > 0) ? q.options.map(o => normalizeMathFormulas(o)) : ['A', 'B', 'C', 'D'],
        correct: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
        explanation: normalizeMathFormulas(q.explanation || ''),
        type: isShort ? 'short_answer' : (isTF ? 'truefalse' : 'abcd'),
        imageUrl: q.imageUrl || ''
      });
    });

    const tetrisScript = `
<script>
// [ADAPTER ENGINE: TETRIS XẾP GẠCH - DỮ LIỆU ĐÓNG GÓI, IN-GAME EDITOR & SECURITY GATE]
window.__GAME_TITLE__ = ${JSON.stringify(gameTitle)};
window.__ADMIN_PIN__ = "2806";
window.__INJECTED_TETRIS_DATA__ = ${JSON.stringify(topicsMap, null, 2)};
window.gameDatabase = JSON.parse(JSON.stringify(window.__INJECTED_TETRIS_DATA__));

(function() {
  function syncTetrisData() {
    if (window.__INJECTED_TETRIS_DATA__ && Object.keys(window.__INJECTED_TETRIS_DATA__).length > 0) {
      window.gameDatabase = JSON.parse(JSON.stringify(window.__INJECTED_TETRIS_DATA__));
      if (!window.selectedTopic || !window.gameDatabase[window.selectedTopic]) {
        window.selectedTopic = Object.keys(window.gameDatabase)[0];
      }
      if (typeof renderTetrisTopicMenuCards === 'function') {
        renderTetrisTopicMenuCards();
      }
      if (typeof selectTetrisTopic === 'function') {
        selectTetrisTopic(window.selectedTopic, false);
      }
    }
  }

  function applyAdminSecurity() {
    try {
      const params = new URLSearchParams(window.location.search);
      const isAdmin = params.get('role') === 'admin' || params.get('preview') === 'true' || params.get('admin') === '1';
      const adminTopbar = document.getElementById('admin-topbar');
      const adminBtns = document.querySelectorAll('#btn-admin-gear, #btn-chuyen-de, [data-admin-control="true"]');
      if (isAdmin) {
        if (adminTopbar) adminTopbar.style.setProperty('display', 'flex', 'important');
        adminBtns.forEach(btn => {
          btn.classList.remove('hidden');
          btn.style.setProperty('display', 'inline-flex', 'important');
        });
      } else {
        if (adminTopbar) adminTopbar.style.setProperty('display', 'none', 'important');
        adminBtns.forEach(btn => {
          btn.classList.add('hidden');
          btn.style.setProperty('display', 'none', 'important');
        });
      }
    } catch(e) {}
  }

  function setupAdminButtons() {
    try {
      const gearBtn = document.getElementById('btn-admin-gear');
      if (gearBtn && !gearBtn.dataset.listenerAttached) {
        gearBtn.dataset.listenerAttached = 'true';
        gearBtn.addEventListener('click', function(e) {
          e.preventDefault();
          if (typeof window.openAdminPinPrompt === 'function') {
            window.openAdminPinPrompt();
          }
        });
      }
      const topicBtn = document.getElementById('btn-chuyen-de');
      if (topicBtn && !topicBtn.dataset.listenerAttached) {
        topicBtn.dataset.listenerAttached = 'true';
        topicBtn.addEventListener('click', function(e) {
          e.preventDefault();
          if (typeof window.openTetrisTopicMenu === 'function') {
            window.openTetrisTopicMenu();
          }
        });
      }
    } catch(e) {}
  }

  function triggerMathTypeset() {
    try {
      if (window.MathJax && window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise().catch(function() {});
      }
    } catch(e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      syncTetrisData();
      applyAdminSecurity();
      setupAdminButtons();
      triggerMathTypeset();
    });
  } else {
    syncTetrisData();
    applyAdminSecurity();
    setupAdminButtons();
    triggerMathTypeset();
  }
  window.addEventListener('load', function() {
    syncTetrisData();
    applyAdminSecurity();
    setupAdminButtons();
    triggerMathTypeset();
  });
})();
</script>
`;
    htmlContent = injectScriptAtTop(htmlContent, tetrisScript);
  }

  // NHÓM 6: CÁC GAME CHUẨN CÒN LẠI (Cầu Cá, Rắn Săn, Mario...)
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
