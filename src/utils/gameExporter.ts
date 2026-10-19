import { Question, DragDropCategory, DragDropTableRow } from '../types';
import { normalizeMathFormulas, normalizeSystemMathString } from './documentParser';
import { DEFAULT_WORKSHEETS } from '../data/defaultWorksheets';

export { normalizeSystemMathString };

/**
 * BỘ LỌC XỬ LÝ DỌN CHUỖI TOÁN HỌC CHUẨN THEO ĐÚNG NGUYÊN MẪU CỦA GIÁO VIÊN (ANTI-BUG STRINGS)
 * Quét sạch lỗi sinh chữ \f thừa đứng trước \frac, phục hồi rac -> \frac, chèn khoảng trắng, khử double escape
 */
export function formatMathStringToTeX(rawContent: string): string {
  if (typeof rawContent !== 'string') return rawContent;

  let cleanContent = normalizeSystemMathString(rawContent);

  // Khử mã điều khiển form-feed ẩn
  cleanContent = cleanContent.replace(/[\u000c\x0c\f]/g, '');

  // Tiêu diệt triệt để mã rác \d\d, \d\frac, \ddfrac đứng trước phân số, khôi phục vĩnh viễn \frac chuẩn
  cleanContent = cleanContent.replace(/\\+d+\\+d*frac/gi, '\\frac')
                             .replace(/\\+d+\\+d*\\+frac/gi, '\\frac')
                             .replace(/\\+d+\s*\\+frac/gi, '\\frac')
                             .replace(/\\+d+\\+d+(?=\s*\\?frac)/gi, '')
                             .replace(/\\d\\d(?=\s*\\?frac)/gi, '')
                             .replace(/\\ddfrac/gi, '\\frac')
                             .replace(/\\dfrac/gi, '\\frac')
                             .replace(/\\d\\frac/gi, '\\frac');
    // ÉP BUỘC: Sử dụng chính xác bộ lọc xử lý dữ liệu từ file mẫu của giáo viên để quét sạch lỗi sinh chữ \f thừa đứng trước \frac
  cleanContent = cleanContent.replace(/\\f\\frac/g, '\\frac')
                             .replace(/\\f\s*\\frac/g, '\\frac')
                             .replace(/\\ffrac/g, '\\frac')
                             .replace(/\\f(?![a-zA-Z])/g, '') // Khử sạch các ký tự \f cô độc không đi liền từ tố
                             .replace(/\\f(?=\s*\\frac)/g, '');

  // KÍCH HOẠT 2: Tự động phát hiện và bọc khối nhọn cho biểu thức dưới dấu căn (Sửa lỗi đứt vạch ngang trên đỉnh)
  // Biến đổi cấu trúc thô \sqrt x - 1 hoặc √x - 1 thành \sqrt{x-1} chuẩn mực TeX Live
  cleanContent = cleanContent.replace(/\\sqrt\s*x\s*-\s*1/g, '\\sqrt{x-1}')
                             .replace(/√x\s*-\s*1/g, '\\sqrt{x-1}')
                             .replace(/√\s*x\s*-\s*1/g, '\\sqrt{x-1}')
                             .replace(/\\sqrt\s*x\s*\+\s*1/g, '\\sqrt{x+1}')
                             .replace(/√\s*x\s*\+\s*1/g, '\\sqrt{x+1}')
                             .replace(/\\sqrt\s*x\s*-\s*2/g, '\\sqrt{x-2}')
                             .replace(/√\s*x\s*-\s*2/g, '\\sqrt{x-2}')
                             .replace(/\\sqrt\s*([a-zA-Z0-9]+)/g, '\\sqrt{$1}'); // Tổng quát hóa cho biến đơn

  // Phục hồi chữ "frac" nếu hệ thống cũ lỡ làm gãy chữ thành "rac" (bảo vệ không làm nhân đôi chữ \f trong \frac và chống đục thủng \dfrac)
  cleanContent = cleanContent.replace(/(?<![a-zA-Z\\])\brac\b/g, '\\frac')
                             .replace(/(?<![a-zA-Z\\])rac(?=[0-9\\{])/g, '\\frac')
                             .replace(/(?<![a-zA-Z\\])rac/g, '\\frac');

  // Quét dọn lần cuối bảo hiểm không sót \f\frac
  cleanContent = cleanContent.replace(/\\f\\frac/g, '\\frac')
                             .replace(/\\f\s*\\frac/g, '\\frac')
                             .replace(/\\ffrac/g, '\\frac');

  // Tự động chèn khoảng trắng mảnh ngăn dính chữ tiếng Việt (Ví dụ: "0trong", "]là:")
  cleanContent = cleanContent.replace(/(\d+)(trong|đoạn|là|có)/g, '$1 $2');
  let cleanStr = cleanContent;
  cleanStr = cleanStr.replace(/(\))(trong|đoạn|là)/g, '$1 $2');
  cleanContent = cleanStr;
  cleanContent = cleanContent.replace(/([≤|≥|<=|>=|<=|=>])\s*0/g, '$1 0 ');
  cleanContent = cleanContent.replace(/0(trong|đoạn|là)/g, '0 $1');
  cleanContent = cleanContent.replace(/trongđoạn/g, 'trong đoạn');
  cleanContent = cleanContent.replace(/trong\s*đoạn\s*\[/g, 'trong đoạn [');
  cleanContent = cleanContent.replace(/\]là\:/g, '\] là:');
  cleanContent = cleanContent.replace(/\]\s*là\s*:/g, '\] là:');

  // Khử hoàn toàn lỗi lặp dấu gạch chéo (double escape) bảo vệ các ký hiệu \sqrt, \le, \ge, \ne
  cleanContent = cleanContent.replace(/\\\\/g, '\\');

  return cleanContent;
}

/**
 * BỘ LỌC XỬ LÝ KÝ TỰ ESCAPE THÔ (RAW STRING ESCAPE FIX)
 * Bảo toàn dấu gạch chéo ngược '\' cho các từ khóa LaTeX để trình duyệt không nuốt mất
 */
export function escapeRawLaTeXSlash(rawStr: string): string {
  if (typeof rawStr !== 'string') return rawStr || '';

  // Áp dụng bộ dọn chuỗi toán học chuẩn của giáo viên trước
  let safeStr = formatMathStringToTeX(rawStr);

  // Khử sạch mã rác điều khiển \f cũ
  safeStr = safeStr.replace(/\\f\\f/g, '').replace(/\\f(?![a-zA-Z])/g, '').replace(/[\u000c\x0c]/g, '');

  // LẬP TRÌNH BỘ TỪ ĐIỂN ÁNH XẠ VẠN NĂNG (Bảo vệ các từ khóa toán học chuẩn của thầy)
  // Nhân đôi dấu gạch chéo ngược đứng trước các từ khóa LaTeX để trình duyệt không thể bỏ qua
  const strictKeywords = [
    'frac', 'sqrt', 'cdot', 'ne', 'neq', 'le', 'leq', 'ge', 'geq',
    'perp', 'parallel', 'alpha', 'beta', 'cup', 'cap', 'in'
  ];

  strictKeywords.forEach(keyword => {
    // Trường hợp 1: Giáo viên gõ thiếu dấu \ (Ví dụ: frac, sqrt) -> Ép bù thêm thành \\keyword
    const regexNoSlash = new RegExp(`(?<!\\\\)\\b${keyword}\\b`, 'g');
    safeStr = safeStr.replace(regexNoSlash, `\\\\${keyword}`);

    // Trường hợp 2: Có dấu \ đơn nhưng bị trình duyệt dính escape -> Ép nhân đôi thành \\
    const regexSingleSlash = new RegExp(`(?<!\\\\)\\\\(?!\\\\)${keyword}\\b`, 'g');
    safeStr = safeStr.replace(regexSingleSlash, `\\\\${keyword}`);
  });

  return safeStr;
}

export function sanitizeObjectLaTeXSlashes<T>(obj: T): T {
  if (typeof obj === 'string') {
    return formatMathStringToTeX(escapeRawLaTeXSlash(obj)) as unknown as T;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObjectLaTeXSlashes(item)) as unknown as T;
  }
  if (obj !== null && typeof obj === 'object') {
    const res: any = {};
    for (const key of Object.keys(obj)) {
      res[key] = sanitizeObjectLaTeXSlashes((obj as any)[key]);
    }
    return res;
  }
  return obj;
}

export interface GameTemplateOption {
  id: string;
  name: string;
  file: string;
  category: string;
  description: string;
}

export const GAME_TEMPLATES: GameTemplateOption[] = [
  {
    id: 'ice_breaker',
    name: '🧊 Vua Phá Băng (Ice Breaker)',
    file: '/vua-pha-bang-ice-breaker.html',
    category: 'Vượt ải & Sinh tồn',
    description: 'Giải mã mật mã toán học làm tan chảy các khối băng nứt, cứu chú Gấu Bắc Cực sang đảo an toàn'
  },
  {
    id: 'dao_vang',
    name: '⛏️ Đào Vàng Tri Thức (Gold Miner)',
    file: '/dao-vang-tri-thuc.html',
    category: 'Khai khoáng & Phản xạ',
    description: 'Bắn mỏ neo kéo vàng, kim cương và giải toán nhân đôi điểm số'
  },
  {
    id: 'f1',
    name: '🏎️ Đua Xe F1 Tốc Độ',
    file: '/templates/game-dua-xe-f1.html',
    category: 'Vận tốc & Phản xạ',
    description: 'Đua xe giải toán tốc độ cao, hỗ trợ cả câu 4 lựa chọn và Đúng/Sai'
  },
  {
    id: 'sut_pen',
    name: '⚽ Sút Penalty Kịch Tính',
    file: '/templates/game-sut-penalty.html',
    category: 'Đấu trường Thể thao',
    description: '3 vòng đấu Vòng Bảng, Bán Kết, Chung Kết với thủ môn AI phản xạ'
  },
  {
    id: 'chien_hao',
    name: '🛡️ Bảo Vệ Chiến Hào',
    file: '/templates/game-bao-ve-chien-hao.html',
    category: 'Bắn súng Chiến thuật',
    description: 'Phòng thủ chiến hào ngăn chặn đợt tấn công của quân địch'
  },
  {
    id: 'trieu_phu_ontap',
    name: '💰 Ai Là Triệu Phú (Ôn Tập)',
    file: '/templates/Ai-la-trieu-phu-on-tap.html',
    category: 'Gameshow Trí tuệ',
    description: 'Leo thang tiền thưởng 15 câu hỏi với 3 quyền trợ giúp kinh điển'
  },
  {
    id: 'trieu_phu_menhde',
    name: '💰 Ai Là Triệu Phú (Mệnh Đề)',
    file: '/templates/ai_la_trieu_phu_menh_de.html',
    category: 'Gameshow Trí tuệ',
    description: 'Chinh phục 15 câu hỏi toán học kịch tính'
  },
  {
    id: 'ban_chim',
    name: '🎯 Bắn Chim Mục Tiêu',
    file: '/templates/ban-chim-xac-suat10.html',
    category: 'Bắn mục tiêu',
    description: 'Ngắm bắn chính xác các mục tiêu chứa đáp án đúng trên bầu trời'
  },
  {
    id: 'ca_ngua',
    name: '🎲 Cờ Cá Ngựa Toán Học',
    file: '/templates/game-co-ca-ngua.html',
    category: 'Board Game',
    description: 'Gieo xúc xắc, trả lời câu hỏi để đưa các chú ngựa về đích'
  },
  {
    id: 'cau_ca',
    name: '🎣 Câu Cá Mũ & Logarit',
    file: '/templates/cau-ca-mu-loga11.html',
    category: 'Thư giãn & Phản xạ',
    description: 'Thả câu bắt những chú cá mang đáp án chính xác dưới đại dương'
  },
  {
    id: 'dao_ham_cap2',
    name: '⚡ Đạo Hàm Cấp 2 Đại Chiến',
    file: '/templates/dao-ham-cap2-toan11.html',
    category: 'Đối kháng',
    description: 'Vượt qua các câu hỏi đạo hàm cấp 2 chinh phục đỉnh cao'
  },
  {
    id: 'mario',
    name: '🍄 Mario Phiêu Lưu Ký',
    file: '/templates/Gamemario_bien-co-giao-bien-co-doc-lap.html',
    category: 'Phiêu lưu vượt ải',
    description: 'Vượt chướng ngại vật giải bài toán để giải cứu công chúa'
  },
  {
    id: 'tetris',
    name: '🧱 Tetris Xếp Gạch Không Gian',
    file: '/templates/game-xep-gach.html',
    category: 'Xếp hình Kinh điển',
    description: 'Xếp các khối hình Tetris kết hợp thử thách hình học không gian'
  },
  {
    id: 'ghep_cap_ctlg',
    name: '🧩 Ghép Cặp Công Thức Lượng Giác',
    file: '/templates/ghep-cap-luong-giac.html',
    category: 'Trí nhớ Thẻ bài',
    description: 'Lật thẻ và tìm các cặp công thức toán học tương đương'
  },
  {
    id: 'ghep_cap_ptlg',
    name: '🧩 Ghép Cặp Phương Trình Lượng Giác',
    file: '/templates/ghep-cap-phuong-trinh-luong-giac.html',
    category: 'Trí nhớ Thẻ bài',
    description: 'Ghép cặp phương trình lượng giác và nghiệm tương ứng'
  },
  {
    id: 'ghep_cap_trai_tim',
    name: '💖 Ghép Cặp Trái Tim Đạo Hàm',
    file: '/templates/ghep-cap-trai-tim-dao-ham11.html',
    category: 'Trí nhớ Thẻ bài',
    description: 'Ghép nối các nửa trái tim công thức đạo hàm chuẩn xác'
  },
  {
    id: 'hai_tao',
    name: '🍎 Hái Táo Luân Phiên',
    file: '/templates/game-hai-tao.html',
    category: 'Thu hoạch Phản xạ',
    description: 'Hái những quả táo vàng mang câu trả lời đúng vào giỏ'
  },
  {
    id: 'keo_co',
    name: '🤼 Kéo Co Đối Kháng',
    file: '/templates/keo-co-hai.html',
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

  // 1. Fetch file HTML gốc từ public/templates/ hoặc public/
  let cleanUrl = templateUrl;
  if (cleanUrl.includes('?')) cleanUrl = cleanUrl.split('?')[0];

  const possibleUrls = [
    cleanUrl.startsWith('/templates/') ? cleanUrl : `/templates/${cleanUrl.replace(/^\//, '')}`,
    cleanUrl,
    cleanUrl.replace(/^\/templates\//, '/'),
    cleanUrl.startsWith('/') ? cleanUrl : `/${cleanUrl}`
  ];

  // Ánh xạ template paths chuẩn
  const templateMap: Record<string, string[]> = {
    'f1': ['/templates/game-dua-xe-f1.html', '/game-dua-xe-f1.html', '/templates/game-dua-xe-F1-on-tap-HK2-toan10.html', '/game-dua-xe-F1-on-tap-HK2-toan10.html'],
    'chien-hao': ['/templates/game-bao-ve-chien-hao.html', '/game-bao-ve-chien-hao.html', '/templates/Game-Bao-ve-chien-hao-gia-tri-luong-giac-tu-0-den-180.html', '/Game-Bao-ve-chien-hao-gia-tri-luong-giac-tu-0-den-180.html'],
    'sut-pen': ['/templates/game-sut-penalty.html', '/game-sut-penalty.html', '/templates/sut-pen-gia-tri-luong-giac-cua-goc-tu-0-den-180.html', '/sut-pen-gia-tri-luong-giac-cua-goc-tu-0-den-180.html'],
    'ca-ngua': ['/templates/game-co-ca-ngua.html', '/game-co-ca-ngua.html', '/templates/ca-ngua-dao-ham11.html', '/ca-ngua-dao-ham11.html'],
    'tetris': ['/templates/game-xep-gach.html', '/game-xep-gach.html', '/templates/Gametetris_Hai-mat-phang-vuong-goc.html', '/Gametetris_Hai-mat-phang-vuong-goc.html'],
    'hai-tao': ['/templates/game-hai-tao.html', '/game-hai-tao.html', '/templates/hai-tao-luan-phien.html', '/hai-tao-luan-phien.html']
  };

  const lowerUrl = cleanUrl.toLowerCase();
  for (const [key, paths] of Object.entries(templateMap)) {
    if (lowerUrl.includes(key)) {
      possibleUrls.unshift(...paths);
      break;
    }
  }

  let htmlContent = '';
  const triedUrls = Array.from(new Set(possibleUrls));

  for (const url of triedUrls) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        const text = await response.text();
        // Kiểm tra xem phản hồi có phải là file game HTML thực sự hay bị SPA trả về index.html
        if (text && !text.includes('<div id="root"></div>') && (text.includes('<!DOCTYPE html>') || text.includes('<html'))) {
          htmlContent = text;
          break;
        }
      }
    } catch (e) {}
  }

  if (!htmlContent) {
    const response = await fetch(cleanUrl);
    if (!response.ok) {
      throw new Error(`Không thể tải template game gốc từ: ${cleanUrl} (Mã lỗi HTTP ${response.status})`);
    }
    htmlContent = await response.text();
  }

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
  htmlContent = htmlContent.replace(/Nguyễn văn Hà Pro/gi, brandOrg);
  htmlContent = htmlContent.replace(/Nguyễn Văn Hà/gi, brandOrg);
  htmlContent = htmlContent.replace(/THPT Yên Dũng/gi, 'TOÁN PRO');
  htmlContent = htmlContent.replace(/Yên Dũng/gi, 'TOÁN PRO');
  htmlContent = htmlContent.replace(/Hệ Thống Trò Chơi Tri Thức Giảng Dạy/gi, 'HỆ THỐNG TRÒ CHƠI TOÁN HỌC');
  
  // Thay đổi thẻ <title>
  if (htmlContent.includes('<title>')) {
    htmlContent = htmlContent.replace(/<title>.*?<\/title>/i, `<title>${gameTitle} - ${teacherName}</title>`);
  }

  // 3. Chuẩn hóa mảng quizData chuẩn
  const standardizedData = questions.map((q, idx) => ({
    id: q.id || `q_${idx + 1}`,
    q: formatMathStringToTeX(escapeRawLaTeXSlash(q.question)),
    options: (q.options || ['A', 'B', 'C', 'D']).map(o => formatMathStringToTeX(escapeRawLaTeXSlash(o))),
    correct: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
    explanation: formatMathStringToTeX(escapeRawLaTeXSlash(q.explanation || '')),
    difficulty: q.difficulty === 'Dễ' ? 1 : (q.difficulty === 'Khó' ? 3 : 2),
    imageUrl: q.imageUrl || ''
  }));

  // Sắp xếp câu hỏi theo độ khó tăng dần
  standardizedData.sort((a, b) => a.difficulty - b.difficulty);

  // 4. DATA ADAPTER ENGINE: ÁP DỤNG ADAPTER TƯƠNG ỨNG THEO TỪNG GAME
  const isChienHao = cleanUrl.includes('chien-hao') || cleanUrl.includes('Bao-ve-chien-hao') || cleanUrl.includes('chien_hao');
  const isSutPen = cleanUrl.includes('sut-pen') || cleanUrl.includes('penalty') || cleanUrl.includes('sut_pen');
  const isF1 = (cleanUrl.includes('game-dua-xe-F1') || cleanUrl.includes('game-dua-xe-f1') || cleanUrl.includes('/f1') || cleanUrl.includes('_f1') || cleanUrl.endsWith('f1.html')) && !isChienHao && !isSutPen;

  // NHÓM 1: Game Đua xe F1 (cấu trúc Đa Chủ Đề & Đa Cấp Độ Tốc Độ - Chỉ chạy khi đúng là F1)
  if (isF1) {
    const cleanF1Formula = (text: string, isOption = false): string => {
      if (!text || typeof text !== 'string') return text || '';
      let res = text.replace(/\x0C/g, '');
      res = res.replace(/[\u000c\x0c\f]/g, '').trim();

      // Bảo toàn dấu gạch chéo ngược LaTeX (\frac, \sqrt, \ne, ...)
      res = escapeRawLaTeXSlash(res);

      // Chuyển đổi trực tiếp mã lệnh dấu khác (\ne, \neq) thành ký tự Unicode thuần túy ≠
      res = res.replace(/\\+(?:neq|ne)\b/g, ' ≠ ')
               .replace(/\\+(?:neq|ne)(?=[^a-zA-Z]|$)/g, ' ≠ ');
      res = res.replace(/\s*≠\s*/g, ' ≠ ');

      // Quét sạch lỗi sinh chữ \f thừa đứng trước \frac
      res = res.replace(/\\f\\frac/g, '\\frac')
               .replace(/\\f\s*\\frac/g, '\\frac')
               .replace(/\\ffrac/g, '\\frac')
               .replace(/\\f(?![a-zA-Z])/g, '')
               .replace(/\\f(?=\s*\\frac)/g, '');

      // SỬA DỨT ĐIỂM LỖI DẤU CĂN & KÝ TỰ RÁC √/
      res = res.replace(/(?:\\sqrt|√)\s*\/\s*/g, '\\sqrt ');
      res = res.replace(/(?:\\sqrt|√)\s*\(\s*([^()]+?)\s*\)/g, '\\sqrt{$1}');
      res = res.replace(/√/g, '\\sqrt ');
      res = res.replace(/\\sqrt\s*\{\s*x\s*\}\s*-\s*1(?=\s*(?:\\le|\\ge|<=|>=|<|>|=|là|\\text|\)))/gi, '\\sqrt{x - 1}');
      res = res.replace(/\\sqrt\s*\{\s*x\s*\}\s*\+\s*1(?=\s*(?:\\le|\\ge|<=|>=|<|>|=|là|\\text|\)))/gi, '\\sqrt{x + 1}');
      res = res.replace(/\\sqrt\s+([a-zA-Z0-9^]+(?:\s*[\+\-]\s*[a-zA-Z0-9^]+)+)(?=\s*(?:\\le|\\ge|<=|>=|<|>|=|là|\)|$))/g, '\\sqrt{$1}');

      // SỬA DỨT ĐIỂM LỖI PHÂN SỐ BIẾN DẠNG THÀNH SỐ MŨ ^{...}/{...}
      res = res.replace(/\^\{([^{}]+)\}\s*(?:\/|_|\/_)\s*\{([^{}]+)\}/g, '\\frac{$1}{$2}');
      res = res.replace(/\^\{([^{}]+)\}\s*\/\s*([a-zA-Z0-9_\-]+)/g, '\\frac{$1}{$2}');
      res = res.replace(/\^\{([^{}]+)\}\s*\/\s*\(([^()]+)\)/g, '\\frac{$1}{$2}');
      res = res.replace(/\(\s*([xX0-9\s\^+\-*]+?)\s*\)\s*\/\s*\(\s*([xX0-9\s\^+\-*]+?)\s*\)/g, '\\frac{$1}{$2}');
      res = res.replace(/\(\s*([xX0-9\s\^+\-*]+?)\s*\)\s*\/\s*([xX0-9a-zA-Z_\-]+)/g, '\\frac{$1}{$2}');

      res = res.replace(/(?<![a-zA-Z\\])\brac\b/g, '\\frac')
               .replace(/(?<![a-zA-Z\\])rac(?=[0-9\\{])/g, '\\frac')
               .replace(/(?<![a-zA-Z\\])rac/g, '\\frac');

      // Tự động chèn khoảng trắng chuẩn giữa biểu thức toán học và chữ tiếng Việt
      res = res.replace(/\bTìmm\b/g, 'Tìm m')
               .replace(/Tìmm/g, 'Tìm m')
               .replace(/Tìm\s*\\\(m\\\)/g, 'Tìm \\(m\\)')
               .replace(/Tìm\(m\)/g, 'Tìm \\(m\\)')
               .replace(/\bT\s+ìm\s+m\b/g, 'Tìm m')
               .replace(/Tìm\s+m\s+để/g, 'Tìm \\(m\\) để');

      res = res.replace(/(\d+)(trong|đoạn|là|có)/g, '$1 $2')
               .replace(/0trong/g, '0 trong')
               .replace(/trongđoạn/g, 'trong đoạn')
               .replace(/trong\s*đoạn\s*\[/g, 'trong đoạn [')
               .replace(/\]là\:/g, '\] là:')
               .replace(/\]\s*là\s*:/g, '\] là:')
               .replace(/\]là/g, '\] là')
               .replace(/(\\\))\s*(trong|đoạn|là)/g, '$1 $2')
               .replace(/([≤|≥|<=|>=|<=|=>])\s*0/g, '$1 0 ')
               .replace(/(?<=\\\)|0)(trong|đoạn|là)/g, ' $1');

      res = res.replace(/(?<![a-zA-Z\\])frac/g, '\\frac')
               .replace(/(?<!\\)cdot/g, '\\cdot')
               .replace(/(?<!\\)leq/g, '\\leq')
               .replace(/(?<!\\)geq/g, '\\geq')
               .replace(/(?<!\\)sqrt/g, '\\sqrt')
               .replace(/(?<!\\)le\b/g, '\\le')
               .replace(/(?<!\\)ge\b/g, '\\ge')
               .replace(/(?<!\\)pm\b/g, '\\pm')
               .replace(/(?<!\\)infty/g, '\\infty')
               .replace(/(?<!\\)\bOmega\b/g, '\\Omega')
               .replace(/(?<!\\)\bemptyset\b/g, '\\emptyset');

      res = res.replace(/\\\\/g, '\\');
      res = res.replace(/\\dfrac(?=[{\s])/g, '\\frac');

      res = normalizeMathFormulas(res);

      const hasVietnamese = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ]/i.test(res);
      if (isOption) {
        res = res.trim();
        if (!hasVietnamese) {
          if (!res.startsWith('\\(') || !res.endsWith('\\)')) {
            res = res.replace(/^\\\(/, '').replace(/\\\)$/, '').trim();
            res = '\\(' + res + '\\)';
          }
        }
      } else {
        res = res.trim();
        res = res.replace(/\$\$([\s\S]*?)\$\$/g, (_, m) => '\\(' + m.trim() + '\\)');
        res = res.replace(/\$([^\$]+?)\$/g, (_, m) => '\\(' + m.trim() + '\\)');

        // Tự động bọc \( ... \) cho các biểu thức toán học (tam thức bậc hai, hàm số, đạo hàm)
        const mathTokens: string[] = [];
        let sIdx = 0;
        let cleanMath = '';
        while (true) {
          const start = res.indexOf('\\(', sIdx);
          if (start === -1) { cleanMath += res.slice(sIdx); break; }
          const end = res.indexOf('\\)', start + 2);
          if (end === -1) { cleanMath += res.slice(sIdx); break; }
          cleanMath += res.slice(sIdx, start);
          mathTokens.push(res.slice(start, end + 2));
          cleanMath += '___F1_EXPORTER_BLOCK_' + (mathTokens.length - 1) + '___';
          sIdx = end + 2;
        }
        res = cleanMath;

        // Quét các biểu thức toán học chưa bọc:
        // Hàm số, đạo hàm: f(x) = ..., y = ..., y' = ..., f'(x) = ...
        res = res.replace(/(?:f|g|h|y|P|Q)'*\s*(?:\([a-zA-Z0-9_xX\s\+\-]+\))?\s*=\s*[^,;:\.\?\n\r]+?(?=[,;:\.\?\n\r]|\s+với|\s+tại|\s+khi|\s+là|\s+trên|\s+trong|$)/gi, (m) => {
          if (m.includes('___F1_EXPORTER_BLOCK_') || /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ]/.test(m)) return m;
          return '\\(' + m.trim() + '\\)';
        });

        // Biểu thức tam thức bậc hai hoặc số mũ: ax^2 + bx + c, x^2 - 4x + 3
        res = res.replace(/(?<![a-zA-Z0-9_\\])(?:-?[a-zA-Z0-9_()]+\^[0-9a-zA-Z]+(?:\s*[\+\-]\s*[a-zA-Z0-9_\^+\-*\/()]+)+)/g, (m) => {
          if (m.includes('___F1_EXPORTER_BLOCK_') || /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ]/.test(m)) return m;
          return '\\(' + m.trim() + '\\)';
        });

        // Bất phương trình hoặc phương trình: A >= 0, A <= 0, A = 0
        res = res.replace(/(?<![a-zA-Z0-9_\\])(?:[a-zA-Z0-9_\^+\-*\/()\s]+?\s*(?:\\le|\\ge|\\ne|<|>|=)\s*-?[0-9a-zA-Z_\-+]+)/g, (m) => {
          if (m.includes('___F1_EXPORTER_BLOCK_') || /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ]/.test(m)) return m;
          return '\\(' + m.trim() + '\\)';
        });

        // Biểu thức chứa TeX: \dfrac, \sqrt, \Delta, \vec, \mathbb, \in
        res = res.replace(/(?:\\(?:dfrac|frac|sqrt|vec|Delta|mathbb|in|cup|cap|emptyset|infty|pm|cdot)[^{}\s]*(?:\{[^{}]*\})*(?:\s*[\+\-=\*\/]\s*[a-zA-Z0-9_\\{}]*)?)/g, (m) => {
          if (m.includes('___F1_EXPORTER_BLOCK_') || /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ]/.test(m)) return m;
          return '\\(' + m.trim() + '\\)';
        });

        // Khoảng, đoạn tập nghiệm: [a; b], (a; b)
        res = res.replace(/(?<![a-zA-Z0-9_\\])(?:\[|\()\s*-?(?:\\infty|\+\\infty|\d+|[a-zA-Z])\s*;\s*-?(?:\\infty|\+\\infty|\d+|[a-zA-Z])\s*(?:\]|\))/g, (m) => {
          if (m.includes('___F1_EXPORTER_BLOCK_')) return m;
          return '\\(' + m.trim() + '\\)';
        });

        // Phục hồi tokens
        for (let i = 0; i < mathTokens.length; i++) {
          res = res.replace('___F1_EXPORTER_BLOCK_' + i + '___', mathTokens[i]);
        }
        res = res.replace(/\\\)\s*\\\(/g, ' ');
        res = res.replace(/\\\(\s*\\\(([\s\S]*?)\\\)\s*\\\)/g, '\\($1\\)');
      }
      return res;
    };

    const topicsMap: Record<string, { easy: any[], medium: any[], hard: any[] }> = {};
    questions.forEach(q => {
      const topicName = q.topic?.trim() || gameTitle;
      if (!topicsMap[topicName]) {
        topicsMap[topicName] = { easy: [], medium: [], hard: [] };
      }
      const diffKey = q.difficulty === 'Dễ' ? 'easy' : (q.difficulty === 'Khó' ? 'hard' : 'medium');
      topicsMap[topicName][diffKey].push({
        q: cleanF1Formula(q.question, false),
        options: (q.options || ['A', 'B', 'C', 'D']).map(o => cleanF1Formula(o, true)),
        correct: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
        explanation: q.explanation || '',
        imageUrl: q.imageUrl || ''
      });
    });

    const injectF1 = `
<style id="f1-mathjax-white-nowrap">
.question-text, #q-text {
    background: rgba(2, 6, 23, 0.95) !important;
    border: 1px solid #334155 !important;
    color: #ffffff !important;
    line-height: 2 !important;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8) !important;
}
mjx-container,
.mjx-chtml,
.MathJax,
.question-text mjx-container,
#q-text mjx-container,
.answer-btn mjx-container,
.option-card mjx-container {
    display: inline-block !important;
    white-space: nowrap !important;
    word-break: keep-all !important;
    overflow-wrap: normal !important;
    vertical-align: middle !important;
    max-width: 100% !important;
    color: #ffffff !important;
}
mjx-container *,
.mjx-chtml *,
.MathJax *,
.question-text mjx-container *,
#q-text mjx-container *,
.answer-btn mjx-container *,
.option-card mjx-container * {
    white-space: nowrap !important;
    word-break: keep-all !important;
    color: #ffffff !important;
}
mjx-line, mjx-frac mjx-line, mjx-dtable mjx-line, mjx-sqrt > mjx-box {
    border-top-color: #ffffff !important;
    opacity: 1 !important;
    visibility: visible !important;
}
</style>
<script>
// [ADAPTER ENGINE: MULTI-TOPIC ARCHITECTURE - ĐUA XE F1]
window.gameDatabase = ${JSON.stringify(topicsMap, null, 2)};
window.selectedTopic = Object.keys(window.gameDatabase)[0] || "${gameTitle}";
</script>
`;
    htmlContent = injectScriptAtTop(htmlContent, injectF1);
  }
  // NHÓM: Game Vua Phá Băng (Ice Breaker)
  else if (cleanUrl.includes('vua-pha-bang') || cleanUrl.includes('ice-breaker') || cleanUrl.includes('ice_breaker')) {
    const cleanIceFormula = (text: string, isOption = false): string => {
      let res = formatMathStringToTeX(escapeRawLaTeXSlash(text || ''));
      if (isOption && res) {
        res = res.trim();
        const hasVietnamese = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ]/i.test(res);
        if (!hasVietnamese && !res.startsWith('\\(') && !res.endsWith('\\)')) {
          res = '\\(' + res + '\\)';
        }
      }
      return res;
    };

    const iceTopicName = gameTitle || 'Chuyên đề: Vua Phá Băng';
    const iceQuestions = questions.map(q => ({
      q: cleanIceFormula(q.question, false),
      options: (q.options || ['A', 'B', 'C', 'D']).map(o => cleanIceFormula(o, true)),
      correct: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
      explanation: cleanIceFormula(q.explanation || '', false)
    }));

    const iceDatabase = {
      [iceTopicName]: iceQuestions
    };

    const injectIce = `
<script>
// [ADAPTER ENGINE: ICE BREAKER - VUA PHÁ BĂNG]
window.gameDatabase = ${JSON.stringify(iceDatabase, null, 2)};
<\/script>
`;
    htmlContent = injectScriptAtTop(htmlContent, injectIce);
  }
  // NHÓM: Game Đào Vàng Tri Thức (Gold Miner)
  else if (cleanUrl.includes('dao-vang') || cleanUrl.includes('daovang') || cleanUrl.includes('dao_vang')) {
    const cleanDaoVangFormula = (text: string, isOption = false): string => {
      let res = formatMathStringToTeX(escapeRawLaTeXSlash(text || ''));
      if (isOption && res) {
        res = res.trim();
        const hasVietnamese = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ]/i.test(res);
        if (!hasVietnamese && !res.startsWith('\\(') && !res.endsWith('\\)')) {
          res = '\\(' + res + '\\)';
        }
      }
      return res;
    };

    const daoVangTopicName = gameTitle || 'Chuyên đề: Đào Vàng Tri Thức';
    const daoVangQuestions = questions.map(q => ({
      q: cleanDaoVangFormula(q.question, false),
      options: (q.options || ['A', 'B', 'C', 'D']).map(o => cleanDaoVangFormula(o, true)),
      correct: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
      explanation: cleanDaoVangFormula(q.explanation || '', false)
    }));

    const daoVangDatabase = {
      [daoVangTopicName]: daoVangQuestions
    };

    const injectDaoVang = `
<script>
// [ADAPTER ENGINE: ĐÀO VÀNG TRI THỨC - GOLD MINER]
window.gameDatabase = ${JSON.stringify(daoVangDatabase, null, 2)};
<\/script>
`;
    htmlContent = injectScriptAtTop(htmlContent, injectDaoVang);
  }

  // NHÓM 2: Game Bảo Vệ Chiến Hào (sinh đề tự động - cấu trúc Đa Chủ Đề, Dữ liệu Tĩnh & Random Bốc 5 câu)
  else if (isChienHao || cleanUrl.includes('chien-hao') || cleanUrl.includes('Bao-ve-chien-hao')) {
    // GỠ BỎ HOÀN TOÀN MỌI DÒNG CODE CHÈN NHẦM CỤM GIAO DIỆN .f1-championship-ui, START RACE HOẶC XE ĐUA F1
    htmlContent = htmlContent
      .replace(/<div[^>]*class=["'][^"']*f1-championship-ui[^"']*["'][\s\S]*?<\/div>/gi, '')
      .replace(/<div[^>]*id=["']f1-[^"']*["'][\s\S]*?<\/div>/gi, '')
      .replace(/\.f1-championship-ui[^{]*\{[^}]*\}/gi, '')
      .replace(/<button[^>]*class=["'][^"']*f1-[^"']*["'][\s\S]*?<\/button>/gi, '')
      .replace(/<button[^>]*>[^<]*START RACE[^<]*<\/button>/gi, '')
      .replace(/START RACE/g, 'VÀO TRẬN ĐỊA')
      .replace(/xe đua F1/gi, 'Bảo Vệ Chiến Hào');

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

    const cleanChienHaoMathString = (text: string): string => {
      if (!text || typeof text !== 'string') return text || '';
      let cleaned = text.trim();
      cleaned = cleaned.replace(/\\f\\f/g, '').replace(/\\f/g, '');
      cleaned = cleaned.replace(/[\u000c\x0c]/g, '');
      cleaned = cleaned.replace(/(?:^|[^\\])\brac\s*\{/g, (m) => m.replace('rac{', '\\frac{'));
      cleaned = cleaned.replace(/^rac\s*\{/g, '\\frac{');
      cleaned = cleaned.replace(/\brac\b/g, '\\frac');

      // Khắc phục lỗi dính chữ cdot (ví dụ: 10cdot3^x, 10\cdot3^x thành 10 \cdot 3^x)
      cleaned = cleaned.replace(/(\d+)\s*(?:\\cdot|cdot)\s*(\d+(\^[0-9a-zA-Z{}]+)?)/g, '$1 \\cdot $2');
      cleaned = cleaned.replace(/(\d+)cdot(\d+)/g, '$1 \\cdot $2');
      cleaned = cleaned.replace(/(\d+)cdot/g, '$1 \\cdot ');
      cleaned = cleaned.replace(/cdot(\d+)/g, ' \\cdot $1');

      // Khắc phục thiếu dấu gạch chéo ngược cho các token lượng giác và toán học
      cleaned = cleaned.replace(/(?<!\\)sin/g, '\\sin')
                       .replace(/(?<!\\)cos/g, '\\cos')
                       .replace(/(?<!\\)tan/g, '\\tan')
                       .replace(/(?<!\\)cot/g, '\\cot')
                       .replace(/(?<!\\)cdot/g, '\\cdot')
                       .replace(/(?<!\\)sqrt/g, '\\sqrt')
                       .replace(/(?<![a-zA-Z\\])frac/g, '\\frac');

      // Khử display math brackets xung đột
      cleaned = cleaned.replace(/\\\[/g, '').replace(/\\\]/g, '');

      // Vá lỗi tự ý chèn khoảng trắng sau ký tự chữ cái đầu tiên
      cleaned = cleaned.replace(/\bN\s+ếu\b/g, 'Nếu');
      cleaned = cleaned.replace(/\bH\s+ai\b/g, 'Hai');
      cleaned = cleaned.replace(/\bC\s+ho\b/g, 'Cho');
      cleaned = cleaned.replace(/\bC\s+ả\b/g, 'Cả');
      cleaned = cleaned.replace(/\bK\s+hi\b/g, 'Khi');
      cleaned = cleaned.replace(/\bC\s+hỉ\b/g, 'Chỉ');
      cleaned = cleaned.replace(/\bT\s+ính\b/g, 'Tính');
      cleaned = cleaned.replace(/\bT\s+rong\b/g, 'Trong');
      cleaned = cleaned.replace(/\bK\s+hẳng\b/g, 'Khẳng');
      cleaned = cleaned.replace(/\bđ\s+ịnh\b/g, 'định');
      cleaned = cleaned.replace(/\bH\s+ình\b/g, 'Hình');
      cleaned = cleaned.replace(/\bM\s+ặt\b/g, 'Mặt');
      cleaned = cleaned.replace(/\bđ\s+ường\b/g, 'đường');
      cleaned = cleaned.replace(/Hai\s+m\s+ặt\s+ph\s+ẳng/g, 'Hai mặt phẳng');

      // Tự động chuyển đổi các chữ mã TeX thô viết liền
      cleaned = cleaned.replace(/\bAcupB\b/g, 'A \\cup B');
      cleaned = cleaned.replace(/\bAcapB\b/g, 'A \\cap B');
      cleaned = cleaned.replace(/(?<!\\)\bOmega\b/g, '\\Omega');
      cleaned = cleaned.replace(/(?<!\\)\bemptyset\b/g, '\\emptyset');
      cleaned = cleaned.replace(/(?<!\\)\bcup\b/g, '\\cup');
      cleaned = cleaned.replace(/(?<!\\)\bcap\b/g, '\\cap');

      cleaned = normalizeMathFormulas(cleaned);

      if (!cleaned.includes('\\(') && !cleaned.includes('$')) {
        const hasVietnamese = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(cleaned);
        const hasMathTokens = /[\\^_{}]|sin|cos|tan|cot|sqrt|frac|alpha|beta|pi|pm|cdot|circ|degree|le|ge|ne|in|cup|cap|Omega|emptyset/.test(cleaned);
        if (!hasVietnamese && hasMathTokens) {
          cleaned = `\\(${cleaned}\\)`;
        } else if (hasVietnamese && hasMathTokens) {
          cleaned = cleaned.replace(/(\\[a-zA-Z]+(?:\{[^{}]*\}|\[[^\]]*\])*(?:\^[0-9a-zA-Z{}]+|_[0-9a-zA-Z{}]+)*(?:\s*[0-9a-zA-Z+\-*/=()^_{}]+)*)/g, (match) => {
            const tr = match.trim();
            if (!tr || tr.startsWith('\\(')) return match;
            return `\\(${tr}\\)`;
          });
        }
      }
      return cleaned;
    };

    const topicsMap: Record<string, { easy: any[], medium: any[], hard: any[] }> = {};
    const defaultTopic = gameTitle || 'Chiến Dịch: Tác Chiến Căn Cứ';

    activeQuestions.forEach(q => {
      const topicName = q.topic?.trim() || defaultTopic;
      if (!topicsMap[topicName]) {
        topicsMap[topicName] = { easy: [], medium: [], hard: [] };
      }
      const diffKey = q.difficulty === 'Dễ' ? 'easy' : (q.difficulty === 'Khó' ? 'hard' : 'medium');
      const cleanQ = cleanChienHaoMathString(q.question);
      const cleanOpts = (q.options || ['A', 'B', 'C', 'D']).map(o => cleanChienHaoMathString(o));
      const correctIdx = typeof q.correctIndex === 'number' ? q.correctIndex : 0;

      topicsMap[topicName][diffKey].push({
        q: cleanQ,
        options: cleanOpts,
        correct: correctIdx,
        explanation: cleanChienHaoMathString(q.explanation || ''),
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
// TỰ ĐỘNG CHÈN VIEWPORT CHỐNG ZOOM
if (!document.querySelector('meta[name="viewport"]')) {
    const meta = document.createElement('meta');
    meta.name = "viewport";
    meta.content = "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no";
    document.getElementsByTagName('head')[0].appendChild(meta);
}
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
    if (typeof setupMobileControls === 'function') {
      setupMobileControls();
    }
    if (window.MathJax && window.MathJax.typesetPromise) {
      try {
        window.MathJax.typesetPromise().catch(function() {});
      } catch(e) {}
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

  function executeMobileFullscreen() {
    const target = document.getElementById('game-wrapper') || document.querySelector('.apple-game-container, .harvest-game-wrapper, [class*="game-container"]') || document.documentElement;
    if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
      const rfs = target.requestFullscreen || (target as any).webkitRequestFullscreen || (target as any).mozRequestFullScreen || (target as any).msRequestFullscreen;
      if (rfs) {
        try { rfs.call(target).catch(function(){}); } catch(e) {}
      }
    } else {
      const efs = document.exitFullscreen || (document as any).webkitExitFullscreen || (document as any).mozCancelFullScreen || (document as any).msExitFullscreen;
      if (efs) {
        try { efs.call(document).catch(function(){}); } catch(e) {}
      }
    }
  }
  window.executeMobileFullscreen = executeMobileFullscreen;

  window.exitGameOrMenu = function() {
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'EXIT_GAME' }, '*');
      }
    } catch(e) {}
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/trang-chu.html';
    }
  };

  function updateFsUI() {
    const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
    const fsIcon = document.getElementById('fullscreenIcon');
    const fsText = document.getElementById('fullscreenText');
    if (fsIcon) fsIcon.textContent = isFs ? '🗗' : '⛶';
    if (fsText) fsText.textContent = isFs ? 'Thu nhỏ' : 'Toàn màn hình';
  }
  document.addEventListener('fullscreenchange', updateFsUI);
  document.addEventListener('webkitfullscreenchange', updateFsUI);

  function setupFullscreenBtn() {
    const fsBtn = document.getElementById('fullscreenToggleBtn');
    if (fsBtn) {
      fsBtn.onclick = executeMobileFullscreen;
      fsBtn.ontouchstart = function(e) {
        e.preventDefault();
        executeMobileFullscreen();
      };
    }
    if (window.self !== window.top) {
      const topbar = document.getElementById('game-topbar');
      if (topbar) topbar.style.display = 'none';
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      syncBattlefieldDb();
      applyAdminSecurity();
      setupFullscreenBtn();
    });
  } else {
    syncBattlefieldDb();
    applyAdminSecurity();
    setupFullscreenBtn();
  }
  window.addEventListener('load', function() {
    syncBattlefieldDb();
    applyAdminSecurity();
    setupFullscreenBtn();
  });
})();
</script>
`;
    const landscapeStyleFix = `
<!-- BẢN VÁ MOBILE DỌC/NGANG & TOÁN MIKTEX V3.8 -->
<style>
/* TIÊM CSS TỐI ƯU CẢM ỨNG CHỐNG TRỄ 300MS */
button, input[type="button"], select, a, .clickable-game-item, .answer-btn, .shoot-btn, .mobile-touch-btn, .mobile-ans-btn, .mobile-shoot-btn {
    touch-action: manipulation !important;
    -webkit-tap-highlight-color: transparent !important;
}

/* 1. THANH TOPBAR ĐEN TỐI GIẢN CHUẨN HÌNH 1 (CAO TỐI ĐA 35PX, FONT 0.75 - 0.8REM) */
#game-topbar {
    height: 35px !important;
    max-height: 35px !important;
    min-height: 35px !important;
    background: #020617 !important;
    border-bottom: 1px solid #1e293b !important;
    padding: 0 12px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    z-index: 150 !important;
    position: relative !important;
}
#game-topbar button {
    height: 24px !important;
    font-size: 0.75rem !important;
    line-height: 1 !important;
    touch-action: manipulation !important;
}
#game-topbar #topbar-game-title {
    font-size: 0.75rem !important;
    line-height: 1.2 !important;
}

/* 2. KHÔI PHỤC BẢNG ĐÁP ÁN BÁM THEO ZOMBIE CHUẨN HÌNH 2 (MÀU VÀNG RỰC, VIỀN NÂU, CHỮ TOÁN ĐEN SẮC NÉT) */
.zombie-badge-board, .answer-banner {
    background: #fef08a !important; /* Màu vàng rực chuẩn Hình 2 */
    border: 1.5px solid #ca8a04 !important; /* Viền gỗ nâu đậm bóng bẩy */
    border-image: none !important;
    border-radius: 12px !important; /* Bo góc tròn mịn */
    padding: 4px 12px !important;
    display: inline-flex !important;
    flex-direction: row !important;
    align-items: center !important;
    justify-content: flex-start !important;
    gap: 8px !important;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
    width: max-content !important;
    min-width: 140px !important;
    min-height: 40px !important;
    color: #0f172a !important;
    filter: drop-shadow(2px 4px 6px rgba(0,0,0,0.4)) !important;
    margin-left: -15px !important;
}
/* Nhãn tròn chứa chữ cái A, B, C, D màu cam */
.zombie-letter-circle, .label-circle {
    width: 24px !important;
    height: 24px !important;
    border-radius: 50% !important;
    background: #f97316 !important; /* Màu cam nổi bật chuẩn Hình 2 */
    color: #ffffff !important;
    font-weight: bold !important;
    font-size: 0.8rem !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    flex-shrink: 0 !important;
    border: none !important;
    margin-right: 0 !important;
    box-shadow: 0 1px 3px rgba(0,0,0,0.3) !important;
}
/* Biểu thức công thức toán chữ đen bên cạnh nhãn tròn */
.zombie-math-text, .answer-text, .zombie-text {
    color: #0f172a !important; /* Chữ đen đậm cực kỳ dễ đọc trên nền vàng như Hình 2 */
    font-weight: 600 !important;
    font-size: 0.9rem !important;
    white-space: nowrap !important; /* Ép công thức lượng giác phân số, căn thức nằm thẳng hàng ngang */
    display: inline-block !important;
}
/* Ép MathJax hiển thị chữ đen trên bảng zombie */
.zombie-badge-board mjx-container, .answer-banner mjx-container,
.zombie-badge-board mjx-container *, .answer-banner mjx-container *,
.zombie-badge-board .MathJax, .answer-banner .MathJax,
.zombie-badge-board .MathJax *, .answer-banner .MathJax * {
    color: #0f172a !important;
    fill: #0f172a !important;
    white-space: nowrap !important;
}

/* 3. CỤM PHÍM BẤM DÀN HÀNG NGANG CHUẨN HÌNH 2 (PILL DOCK CONTROLS) */
.mobile-controls-dock, .answers-controls-container, #mobile-combat-dock {
    position: fixed !important;
    bottom: 6px !important;
    left: 50% !important;
    transform: translateX(-50%) !important;
    display: flex !important;
    flex-direction: row !important;
    justify-content: center !important;
    align-items: center !important;
    gap: 8px !important;
    background: rgba(15, 23, 42, 0.6) !important;
    backdrop-filter: blur(8px) !important;
    padding: 6px 16px !important;
    border-radius: 30px !important;
    z-index: 99999 !important;
    width: auto !important;
    max-width: 95% !important;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4) !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
}
.mobile-ans-btn, #mobile-combat-dock .mobile-touch-btn:not(.mobile-shoot-btn):not(#m-btn-fire):not(#m-btn-modal) {
    width: 36px !important;
    height: 36px !important;
    border-radius: 50% !important;
    background: #334155 !important;
    color: #ffffff !important;
    font-weight: bold !important;
    font-size: 0.9rem !important;
    border: 1px solid #475569 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    cursor: pointer !important;
    touch-action: manipulation !important;
}
.mobile-shoot-btn, #m-btn-fire {
    padding: 0 16px !important;
    height: 36px !important;
    border-radius: 18px !important;
    background: #ef4444 !important;
    color: #ffffff !important;
    font-weight: bold !important;
    font-size: 0.85rem !important;
    border: none !important;
    text-transform: uppercase !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    cursor: pointer !important;
    touch-action: manipulation !important;
    box-shadow: 0 0 10px rgba(239, 68, 68, 0.4) !important;
}
#m-btn-modal {
    padding: 0 12px !important;
    height: 36px !important;
    border-radius: 18px !important;
    background: #0284c7 !important;
    color: #ffffff !important;
    font-weight: bold !important;
    font-size: 0.8rem !important;
    border: none !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    cursor: pointer !important;
    touch-action: manipulation !important;
}

/* 4. CHO PHÉP CHƠI CẢ DỌC VÀ NGANG - KHUNG CÂU HỎI CUỘN DỌC MƯỢT MÀ */
#question-panel {
    max-height: 75dvh !important;
    overflow-y: auto !important;
    -webkit-overflow-scrolling: touch !important;
}
.question-text, mjx-container {
    white-space: nowrap !important;
    display: inline-block !important;
}
#game-wrapper, .game-warzone-wrapper {
    overflow-y: auto !important;
    -webkit-overflow-scrolling: touch !important;
}

@media (orientation: landscape) and (max-height: 500px) {
  html, body {
    overflow-y: auto !important;
    height: auto !important;
    min-height: 100dvh !important;
    -webkit-overflow-scrolling: touch !important;
  }
  .game-warzone-wrapper, #game-container, #game-wrapper {
    width: 100% !important;
    height: auto !important;
    min-height: 100dvh !important;
    overflow-y: auto !important;
    -webkit-overflow-scrolling: touch !important;
    display: flex !important;
    flex-direction: column !important;
  }
  #environment {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100% !important;
    height: 100% !important;
    z-index: 0 !important;
  }
  #hud-top {
    max-height: 30px !important;
    height: 30px !important;
    padding: 1px 8px !important;
    gap: 4px !important;
    overflow: hidden !important;
    align-items: center !important;
    flex-shrink: 0 !important;
  }
  .esport-panel {
    padding: 1px 6px !important;
    font-size: 0.75rem !important;
    gap: 4px !important;
    border-radius: 4px !important;
  }
  .esport-panel .fa-user-astronaut {
    display: none !important;
  }
  .esport-panel .h-12 {
    height: 14px !important;
    margin: 0 2px !important;
  }
  #hud-top .text-sm {
    font-size: 0.6rem !important;
    line-height: 1 !important;
    margin-bottom: 0 !important;
  }
  #hud-top .text-2xl, #hud-top .text-3xl {
    font-size: 0.75rem !important;
    line-height: 1 !important;
  }
  #hud-top #display-name, #hud-top #display-rank {
    font-size: 0.75rem !important;
    line-height: 1 !important;
  }
  #hud-top .lives-container {
    gap: 2px !important;
  }
  #hud-top .heart-icon {
    font-size: 0.7rem !important;
  }
  #hud-top .w-56 {
    width: 70px !important;
    margin-left: 2px !important;
  }
  #hud-top .w-56 .text-xs {
    font-size: 0.6rem !important;
    line-height: 1 !important;
    margin-bottom: 0 !important;
  }
  #hud-top .w-56 .h-4 {
    height: 4px !important;
  }
  #btn-chuyen-de, #btn-admin-gear {
    padding: 1px 5px !important;
    font-size: 9px !important;
    border-radius: 6px !important;
  }
  #question-panel {
    top: 32px !important;
    width: calc(100% - 16px) !important;
    max-width: 96vw !important;
    padding: 2px 10px !important;
    max-height: 45px !important;
    font-size: 0.8rem !important;
    border-radius: 8px !important;
    border-width: 1px !important;
    flex-shrink: 0 !important;
  }
  #question-panel .absolute.-top-4 {
    font-size: 0.55rem !important;
    padding: 0 4px !important;
    top: -7px !important;
    left: 8px !important;
  }
  #question-text {
    margin-top: 1px !important;
    font-size: 0.8rem !important;
    line-height: 1.2 !important;
  }
  #game-canvas, .canvas-layer, #battle-arena {
    height: 55vh !important;
    max-height: 60vh !important;
    min-height: 160px !important;
    object-fit: contain !important;
    flex: none !important;
    position: relative !important;
    margin-top: 34px !important;
  }
  .target-entity {
    min-width: 150px !important;
    height: 40px !important;
  }
  .zombie-sprite {
    width: 40px !important;
    height: 40px !important;
  }
  .label-circle {
    width: 18px !important;
    height: 18px !important;
    font-size: 0.65rem !important;
    margin-right: 4px !important;
  }
  #player-container {
    width: 70px !important;
    height: 70px !important;
  }
}
</style>
`;
    // Gỡ bỏ hoàn toàn cảnh báo xoay màn hình nếu có
    htmlContent = htmlContent.replace(/<div id="edu-rotate-warning">[\s\S]*?<\/div>/gi, '');
    htmlContent = htmlContent.replace(/#edu-rotate-warning[\s\S]*?}/gi, '');

    // Chèn Topbar đen nếu chưa có
    if (!htmlContent.includes('id="game-topbar"')) {
      const topbarHtml = `
        <header id="game-topbar" class="w-full h-[35px] max-h-[35px] bg-slate-950/95 border-b border-slate-800 text-white flex items-center justify-between px-3 z-[150] shrink-0 backdrop-blur-md select-none">
            <div class="flex items-center gap-2">
                <button id="btn-exit-game" type="button" onclick="window.exitGameOrMenu()" class="h-6 px-2 sm:px-2.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-bold text-[0.75rem] sm:text-[0.8rem] flex items-center gap-1 cursor-pointer transition active:scale-95" title="Rời khỏi trò chơi">
                    ✕ <span class="hidden sm:inline">Rời khỏi trò chơi</span>
                </button>
                <div class="flex items-center gap-1.5">
                    <span class="text-sm">🎮</span>
                    <h1 id="topbar-game-title" class="font-bold text-[0.75rem] sm:text-[0.8rem] text-slate-200 tracking-wide truncate max-w-[200px] sm:max-w-md">${gameTitle}</h1>
                </div>
            </div>
            <div class="flex items-center gap-2">
                <button id="fullscreenToggleBtn" type="button" onclick="executeMobileFullscreen()" class="h-6 px-2 sm:px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-[0.75rem] sm:text-[0.8rem] flex items-center gap-1 cursor-pointer transition active:scale-95" title="Toàn màn hình">
                    <span id="fullscreenIcon">⛶</span> <span id="fullscreenText" class="hidden sm:inline">Toàn màn hình</span>
                </button>
            </div>
        </header>
`;
      if (htmlContent.includes('<div id="game-wrapper"')) {
        htmlContent = htmlContent.replace(/(<div id="game-wrapper"[^>]*>)/i, `$1\n${topbarHtml}`);
      }
    }

    if (!htmlContent.includes('BẢN VÁ MOBILE DỌC/NGANG & TOÁN MIKTEX V3.8')) {
      htmlContent = htmlContent.replace('</head>', `${landscapeStyleFix}\n</head>`);
    }
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

  // NHÓM GHÉP CẶP TRÁI TIM (cấu trúc Dynamic Levels theo bộ đề hoặc Word)
  else if (cleanUrl.includes('trai-tim') || cleanUrl.includes('traitim') || cleanUrl.includes('heart')) {
    const cleanFormula = (text: string): string => {
      if (!text) return '';
      let res = text.replace(/\\f\\f/g, '').replace(/\\f(?![a-zA-Z])/g, '').replace(/[\u000c\x0c]/g, '').trim();
      res = res.replace(/\bracf\(/g, '\\frac{f(')
               .replace(/(?:^|[^\\])\brac\s*\{/g, (m) => m.replace('rac{', '\\frac{'))
               .replace(/^rac\s*\{/g, '\\frac{');
      res = res.replace(/\bN\s+ếu\b/g, 'Nếu')
               .replace(/\bH\s+ai\b/g, 'Hai')
               .replace(/\bC\s+ho\b/g, 'Cho')
               .replace(/\bC\s+ả\b/g, 'Cả')
               .replace(/\bK\s+hi\b/g, 'Khi')
               .replace(/\bC\s+hỉ\b/g, 'Chỉ')
               .replace(/\bT\s+ính\b/g, 'Tính')
               .replace(/\bT\s+rong\b/g, 'Trong')
               .replace(/\bV\s+ới\b/g, 'Với')
               .replace(/\bĐ\s+ạo\b/g, 'Đạo')
               .replace(/\bH\s+àm\b/g, 'Hàm');
      return normalizeMathFormulas(res);
    };

    let activeQuestions = [...questions];
    if (activeQuestions.length === 0) {
      try {
        const ws = DEFAULT_WORKSHEETS.find(w => 
          (w.title && (w.title.toLowerCase().includes('đạo hàm') || w.title.toLowerCase().includes('dao ham'))) ||
          (w.id && (w.id.includes('dao_ham') || w.id.includes('11_')))
        ) || DEFAULT_WORKSHEETS[0];
        
        if (ws && ws.questions && ws.questions.length > 0) {
          activeQuestions = ws.questions.map((q, idx) => ({
            id: q.id || `ws_tt_fb_${idx}`,
            question: q.question,
            options: q.options || ['A', 'B', 'C', 'D'],
            correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
            explanation: q.solution || '',
            topic: ws.title || 'Đạo Hàm Cơ Bản'
          } as Question));
        }
      } catch (e) {
        console.warn('Lỗi lấy worksheet dự phòng cho Ghép Cặp Trái Tim:', e);
      }
    }

    const levelsMap: Record<number | string, { title: string, time: number, pairs: Array<{ id: number, left: string, right: string }> }> = {};
    const uniqueTopics = Array.from(new Set(activeQuestions.map(q => q.topic?.trim() || 'Level 1')));
    
    uniqueTopics.forEach((topicName, idx) => {
      const qs = activeQuestions.filter(q => (q.topic?.trim() || 'Level 1') === topicName);
      levelsMap[idx] = {
        title: topicName.replace(/^Level\s*\d+\s*:\s*/i, '').trim() || topicName,
        time: Math.max(45, Math.min(180, qs.length * 12)),
        pairs: qs.map((q, pIdx) => {
          const correctText = (q.options && typeof q.correctIndex === 'number' && q.options[q.correctIndex]) 
            ? q.options[q.correctIndex] 
            : (q.options ? q.options[0] : '');
          return {
            id: pIdx + 1,
            left: cleanFormula(q.question),
            right: cleanFormula(correctText)
          };
        })
      };
    });

    const traiTimScript = `
<script>
// [ADAPTER ENGINE: DYNAMIC LEVELS ARCHITECTURE - GHÉP CẶP TRÁI TIM]
window.INJECTED_GAME_LEVELS = ${JSON.stringify(levelsMap, null, 2)};
if (window.INJECTED_GAME_LEVELS && Object.keys(window.INJECTED_GAME_LEVELS).length > 0) {
  window.GAME_LEVELS = window.INJECTED_GAME_LEVELS;
}
</script>
`;
    htmlContent = injectScriptAtTop(htmlContent, traiTimScript);
  }

  // NHÓM GHÉP CẶP LƯỢNG GIÁC & CÔNG THỨC (cấu trúc Đa Chủ Đề & Đa Độ Khó)
  else if (cleanUrl.includes('ghep-cap')) {
    const cleanFormula = (text: string): string => {
      if (!text) return '';
      let res = text.replace(/\\f\\f/g, '').replace(/\\f/g, '').replace(/[\u000c\x0c]/g, '').trim();
      res = res.replace(/\bN\s+ếu\b/g, 'Nếu')
               .replace(/\bH\s+ai\b/g, 'Hai')
               .replace(/\bC\s+ho\b/g, 'Cho')
               .replace(/\bC\s+ả\b/g, 'Cả')
               .replace(/\bK\s+hi\b/g, 'Khi')
               .replace(/\bC\s+hỉ\b/g, 'Chỉ')
               .replace(/\bT\s+ính\b/g, 'Tính')
               .replace(/\bT\s+rong\b/g, 'Trong')
               .replace(/\bK\s+hẳng\b/g, 'Khẳng')
               .replace(/\bđ\s+ịnh\b/g, 'định')
               .replace(/\bH\s+ình\b/g, 'Hình')
               .replace(/\bM\s+ặt\b/g, 'Mặt')
               .replace(/\bđ\s+ường\b/g, 'đường')
               .replace(/Hai\s+m\s+ặt\s+ph\s+ẳng/g, 'Hai mặt phẳng');
      res = res.replace(/\bAcupB\b/g, 'A \\cup B')
               .replace(/\bAcapB\b/g, 'A \\cap B')
               .replace(/(?<!\\)\bcdot\b/g, '\\cdot')
               .replace(/(?<!\\)\bOmega\b/g, '\\Omega')
               .replace(/(?<!\\)\bemptyset\b/g, '\\emptyset');
      res = res.replace(/e\^\(([^)]+)\)/g, 'e^{$1}')
               .replace(/e\^\{([^}]+)\}/g, 'e^{$1}')
               .replace(/e\^([a-zA-Z0-9]+)/g, 'e^{$1}')
               .replace(/([a-zA-Z0-9\)])\^\(([^)]+)\)/g, '$1^{$2}')
               .replace(/([a-zA-Z0-9\)])\^\{([^}]+)\}/g, '$1^{$2}')
               .replace(/([a-zA-Z0-9\)])\^([a-zA-Z0-9]+)/g, '$1^{$2}');
      return normalizeMathFormulas(res);
    };

    const topicsMap: Record<string, { easy: any[], medium: any[], hard: any[] }> = {};
    questions.forEach(q => {
      const topicName = q.topic?.trim() || gameTitle;
      if (!topicsMap[topicName]) {
        topicsMap[topicName] = { easy: [], medium: [], hard: [] };
      }
      const diffKey = q.difficulty === 'Dễ' ? 'easy' : (q.difficulty === 'Khó' ? 'hard' : 'medium');
      const correctText = (q.options && typeof q.correctIndex === 'number') ? q.options[q.correctIndex] : (q.options ? q.options[0] : '');
      const cleanedQuestion = cleanFormula(q.question);
      const cleanedCorrect = cleanFormula(correctText);
      topicsMap[topicName][diffKey].push({
        id: topicsMap[topicName][diffKey].length + 1,
        left: cleanedQuestion,
        right: cleanedCorrect,
        q: cleanedQuestion,
        options: (q.options || ['A', 'B', 'C', 'D']).map(o => cleanFormula(o)),
        correct: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
        explanation: cleanFormula(q.explanation || '')
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
  else if (isSutPen || cleanUrl.includes('sut-pen') || cleanUrl.includes('penalty')) {
    // GỠ BỎ HOÀN TOÀN MỌI DÒNG CODE CHÈN NHẦM CỤM GIAO DIỆN .f1-championship-ui, START RACE HOẶC XE ĐUA F1
    htmlContent = htmlContent
      .replace(/<div[^>]*class=["'][^"']*f1-championship-ui[^"']*["'][\s\S]*?<\/div>/gi, '')
      .replace(/<div[^>]*id=["']f1-[^"']*["'][\s\S]*?<\/div>/gi, '')
      .replace(/\.f1-championship-ui[^{]*\{[^}]*\}/gi, '')
      .replace(/<button[^>]*class=["'][^"']*f1-[^"']*["'][\s\S]*?<\/button>/gi, '')
      .replace(/<button[^>]*>[^<]*START RACE[^<]*<\/button>/gi, '')
      .replace(/START RACE/g, 'BẮT ĐẦU SÚT PEN')
      .replace(/xe đua F1/gi, 'Sút Penalty');

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

    const cleanPenaltyMathString = (text: string): string => {
      if (!text || typeof text !== 'string') return text || '';
      let cleaned = text.trim();
      cleaned = cleaned.replace(/\\f\\f/g, '').replace(/\\f/g, '');
      cleaned = cleaned.replace(/[\u000c\x0c]/g, '');
      cleaned = cleaned.replace(/(?:^|[^\\])\brac\s*\{/g, (m) => m.replace('rac{', '\\frac{'));
      cleaned = cleaned.replace(/^rac\s*\{/g, '\\frac{');

      // Vá lỗi tự ý chèn khoảng trắng sau ký tự chữ cái đầu tiên
      cleaned = cleaned.replace(/\bN\s+ếu\b/g, 'Nếu');
      cleaned = cleaned.replace(/\bH\s+ai\b/g, 'Hai');
      cleaned = cleaned.replace(/\bC\s+ho\b/g, 'Cho');
      cleaned = cleaned.replace(/\bC\s+ả\b/g, 'Cả');
      cleaned = cleaned.replace(/\bK\s+hi\b/g, 'Khi');
      cleaned = cleaned.replace(/\bC\s+hỉ\b/g, 'Chỉ');
      cleaned = cleaned.replace(/\bT\s+ính\b/g, 'Tính');
      cleaned = cleaned.replace(/\bT\s+rong\b/g, 'Trong');
      cleaned = cleaned.replace(/\bK\s+hẳng\b/g, 'Khẳng');
      cleaned = cleaned.replace(/\bđ\s+ịnh\b/g, 'định');
      cleaned = cleaned.replace(/\bH\s+ình\b/g, 'Hình');
      cleaned = cleaned.replace(/\bM\s+ặt\b/g, 'Mặt');
      cleaned = cleaned.replace(/\bđ\s+ường\b/g, 'đường');
      cleaned = cleaned.replace(/Hai\s+m\s+ặt\s+ph\s+ẳng/g, 'Hai mặt phẳng');

      // Tự động chuyển đổi các chữ mã TeX thô viết liền
      cleaned = cleaned.replace(/\bAcupB\b/g, 'A \\cup B');
      cleaned = cleaned.replace(/\bAcapB\b/g, 'A \\cap B');
      cleaned = cleaned.replace(/(?<!\\)\bcdot\b/g, '\\cdot');
      cleaned = cleaned.replace(/(?<!\\)\bOmega\b/g, '\\Omega');
      cleaned = cleaned.replace(/(?<!\\)\bemptyset\b/g, '\\emptyset');
      cleaned = cleaned.replace(/(?<!\\)\bcup\b/g, '\\cup');
      cleaned = cleaned.replace(/(?<!\\)\bcap\b/g, '\\cap');

      cleaned = normalizeMathFormulas(cleaned);

      if (!cleaned.includes('\\(') && !cleaned.includes('$')) {
        if (/[\\^_{}]|sin|cos|tan|cot|sqrt|frac|alpha|beta|pi|pm|cdot|circ|degree|le|ge|ne|in|cup|cap|Omega|emptyset/.test(cleaned)) {
          cleaned = `\\(${cleaned}\\)`;
        }
      }
      return cleaned;
    };

    const mapStageQuestions = (list: Question[]) => list.map(q => ({
      q: cleanPenaltyMathString(q.question),
      options: (q.options || ['A', 'B', 'C', 'D']).map(o => cleanPenaltyMathString(o)),
      correct: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
      explanation: cleanPenaltyMathString(q.explanation || ''),
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
  function injectMathNowrapStyle() {
    try {
      if (!document.getElementById('penalty-math-nowrap-style')) {
        const style = document.createElement('style');
        style.id = 'penalty-math-nowrap-style';
        style.textContent = \`
          .game-title-header, .penalty-topbar-title, .quiz-modal-title, .penalty-modal-header-title {
              font-size: clamp(0.85rem, 2vw, 1.1rem) !important;
              white-space: nowrap !important;
              overflow: hidden !important;
              text-overflow: ellipsis !important;
              max-width: 100% !important;
              display: block !important;
              box-sizing: border-box !important;
          }
          .penalty-question-modal, .quiz-box-container, #question-panel {
              position: fixed !important;
              top: 50% !important;
              left: 50% !important;
              transform: translate(-50%, -50%) !important;
              width: 92% !important;
              max-width: 480px !important;
              box-sizing: border-box !important;
              background: rgba(10, 15, 30, 0.95) !important;
              backdrop-filter: blur(16px) !important;
              -webkit-backdrop-filter: blur(16px) !important;
              border: 2px solid rgba(0, 243, 255, 0.5) !important;
              border-radius: 20px !important;
              padding: clamp(14px, 3.5vw, 20px) !important;
              box-shadow: 0 20px 60px rgba(0, 0, 0, 0.85), 0 0 30px rgba(0, 243, 255, 0.25) !important;
              z-index: 100000 !important;
              display: flex !important;
              flex-direction: column !important;
              max-height: 85dvh !important;
              overflow-y: auto !important;
              -webkit-overflow-scrolling: touch !important;
              pointer-events: auto !important;
          }
          #question-panel.hidden {
              display: none !important;
              opacity: 0 !important;
              pointer-events: none !important;
              transform: translate(-50%, 120dvh) scale(0.7) !important;
          }
          .penalty-question-text, .quiz-question-content, .question-text {
              white-space: normal !important;
              word-wrap: break-word !important;
              overflow-wrap: break-word !important;
              font-size: clamp(0.9rem, 2.2vw, 1.05rem) !important;
              color: #ffffff !important;
              font-weight: 700 !important;
              line-height: 1.55 !important;
              margin-bottom: 14px !important;
              text-align: center !important;
              display: block !important;
              width: 100% !important;
              box-sizing: border-box !important;
          }
          .options-grid, #options-container {
              display: grid !important;
              grid-template-columns: repeat(2, 1fr) !important;
              gap: 10px !important;
              width: 100% !important;
              box-sizing: border-box !important;
              margin-top: 4px !important;
          }
          @media (max-width: 520px) {
              .options-grid, #options-container {
                  grid-template-columns: 1fr !important;
                  gap: 8px !important;
              }
          }
          .penalty-answer-btn, .quiz-option-btn, .option-btn {
              white-space: normal !important;
              height: auto !important;
              min-height: 44px !important;
              padding: 8px 12px !important;
              display: flex !important;
              align-items: center !important;
              justify-content: flex-start !important;
              word-break: break-word !important;
              overflow-wrap: break-word !important;
              box-sizing: border-box !important;
              width: 100% !important;
              border-radius: 12px !important;
              border: 1.5px solid #334155 !important;
              background: linear-gradient(145deg, #1e293b, #0f172a) !important;
              color: #ffffff !important;
              cursor: pointer !important;
              transition: all 0.15s ease !important;
          }
          .penalty-answer-btn mjx-container, mjx-container {
              white-space: nowrap !important;
              display: inline-block !important;
          }
          .penalty-controls-bottom, .shoot-direction-buttons, #mobile-penalty-dock {
              position: fixed !important;
              bottom: 0 !important;
              left: 0 !important;
              width: 100% !important;
              padding-bottom: calc(40px + env(safe-area-inset-bottom, 25px)) !important;
              background: rgba(15, 23, 42, 0.88) !important;
              backdrop-filter: blur(10px) !important;
              z-index: 99999 !important;
              box-sizing: border-box !important;
          }
          /* Đề bài tự động xuống dòng */
          .penalty-question-text, .quiz-question-content {
              white-space: normal !important;
              word-wrap: break-word !important;
              overflow-wrap: break-word !important;
              font-size: clamp(0.9rem, 2.2vw, 1.05rem) !important;
          }
          /* Các nút đáp án ABCD tự động dàn hàng hoặc xuống dòng nếu dài, giữ nguyên MathJax thẳng hàng */
          .penalty-answer-btn, .quiz-option-btn {
              white-space: normal !important;
              height: auto !important;
              min-height: 44px !important;
              padding: 8px 12px !important;
              display: flex !important;
              align-items: center !important;
              justify-content: flex-start !important;
          }
          .penalty-answer-btn mjx-container, mjx-container {
              white-space: nowrap !important;
              display: inline-block !important;
          }
          .penalty-controls-bottom, .shoot-direction-buttons {
              position: fixed !important;
              bottom: 0 !important;
              left: 0 !important;
              width: 100% !important;
              padding-bottom: calc(40px + env(safe-area-inset-bottom, 25px)) !important;
              background: rgba(15, 23, 42, 0.88) !important;
              backdrop-filter: blur(10px) !important;
              z-index: 99999 !important;
              box-sizing: border-box !important;
          }
          .question-text .mjx-chtml,
          .question-text mjx-container,
          .option-btn .mjx-chtml,
          .option-btn mjx-container,
          .mjx-chtml,
          mjx-container,
          .MathJax,
          .katex,
          .katex-html {
              white-space: nowrap !important;
              display: inline-block !important;
              max-width: 100% !important;
              vertical-align: middle !important;
          }
          mjx-container *,
          .mjx-chtml *,
          .katex * {
              white-space: nowrap !important;
          }
          .question-box-content {
              word-wrap: break-word;
              overflow-wrap: break-word;
              display: inline-block;
              max-width: 100%;
          }
        \`;
        document.head.appendChild(style);
      }
    } catch(e) {}
  }

  function syncPenaltyData() {
    injectMathNowrapStyle();
    if (typeof ensurePenaltyData === 'function') {
      ensurePenaltyData();
    }
    if (typeof setupMobilePenaltyControls === 'function') {
      setupMobilePenaltyControls();
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
      injectMathNowrapStyle();
      syncPenaltyData();
      applyAdminSecurity();
      setupAdminHooks();
      triggerMathTypeset();
    });
  } else {
    injectMathNowrapStyle();
    syncPenaltyData();
    applyAdminSecurity();
    setupAdminHooks();
    triggerMathTypeset();
  }
  window.addEventListener('load', function() {
    injectMathNowrapStyle();
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

    const cleanBirdMathString = (text: string): string => {
      if (!text || typeof text !== 'string') return text || '';
      let cleaned = text.trim();
      cleaned = cleaned.replace(/\\f\\f/g, '').replace(/\\f/g, '');
      cleaned = cleaned.replace(/[\u000c\x0c]/g, '');
      cleaned = cleaned.replace(/(?:^|[^\\])\brac\s*\{/g, (m) => m.replace('rac{', '\\frac{'));
      cleaned = cleaned.replace(/^rac\s*\{/g, '\\frac{');

      // Vá lỗi tự ý chèn khoảng trắng sau ký tự chữ cái đầu tiên
      cleaned = cleaned.replace(/\bN\s+ếu\b/g, 'Nếu');
      cleaned = cleaned.replace(/\bH\s+ai\b/g, 'Hai');
      cleaned = cleaned.replace(/\bC\s+ho\b/g, 'Cho');
      cleaned = cleaned.replace(/\bC\s+ả\b/g, 'Cả');
      cleaned = cleaned.replace(/\bK\s+hi\b/g, 'Khi');
      cleaned = cleaned.replace(/\bC\s+hỉ\b/g, 'Chỉ');
      cleaned = cleaned.replace(/\bT\s+ính\b/g, 'Tính');
      cleaned = cleaned.replace(/\bT\s+rong\b/g, 'Trong');
      cleaned = cleaned.replace(/\bK\s+hẳng\b/g, 'Khẳng');
      cleaned = cleaned.replace(/\bđ\s+ịnh\b/g, 'định');
      cleaned = cleaned.replace(/\bH\s+ình\b/g, 'Hình');
      cleaned = cleaned.replace(/\bM\s+ặt\b/g, 'Mặt');
      cleaned = cleaned.replace(/\bđ\s+ường\b/g, 'đường');
      cleaned = cleaned.replace(/Hai\s+m\s+ặt\s+ph\s+ẳng/g, 'Hai mặt phẳng');

      // Tự động chuyển đổi các chữ mã TeX thô viết liền
      cleaned = cleaned.replace(/\bAcupB\b/g, 'A \\cup B');
      cleaned = cleaned.replace(/\bAcapB\b/g, 'A \\cap B');
      cleaned = cleaned.replace(/(?<!\\)\bcdot\b/g, '\\cdot');
      cleaned = cleaned.replace(/(?<!\\)\bOmega\b/g, '\\Omega');
      cleaned = cleaned.replace(/(?<!\\)\bemptyset\b/g, '\\emptyset');
      cleaned = cleaned.replace(/(?<!\\)\bcup\b/g, '\\cup');
      cleaned = cleaned.replace(/(?<!\\)\bcap\b/g, '\\cap');

      cleaned = normalizeMathFormulas(cleaned);

      if (!cleaned.includes('\\(') && !cleaned.includes('$')) {
        if (/[\\^_{}]|sin|cos|tan|cot|sqrt|frac|alpha|beta|pi|pm|cdot|circ|degree|le|ge|ne|in|cup|cap|Omega|emptyset/.test(cleaned)) {
          cleaned = `\\(${cleaned}\\)`;
        }
      }
      return cleaned;
    };

    const mapBirdQuestions = (list: Question[]) => list.map(q => {
      let opts = q.options ? [...q.options] : ['A', 'B', 'C', 'D'];
      while (opts.length < 5) {
        opts.push(`Phương án ${String.fromCharCode(65 + opts.length)}`);
      }
      opts = opts.slice(0, 5).map(o => cleanBirdMathString(o));
      const correctIdx = (typeof q.correctIndex === 'number' && q.correctIndex >= 0 && q.correctIndex < opts.length) ? q.correctIndex : 0;
      const correctText = opts[correctIdx];
      const wrongs = opts.filter((_, i) => i !== correctIdx);
      return {
        q: cleanBirdMathString(q.question),
        options: opts,
        correct: correctText,
        correctIndex: correctIdx,
        wrongs: wrongs,
        explanation: cleanBirdMathString(q.explanation || ''),
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
      opts = opts.slice(0, 5).map(o => cleanBirdMathString(o));
      return {
        id: q.id || `bc_q_${idx}`,
        q: cleanBirdMathString(q.question),
        options: opts,
        correct: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
        explanation: cleanBirdMathString(q.explanation || ''),
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
  function injectBirdMathNowrapStyle() {
    try {
      if (!document.getElementById('bird-math-nowrap-style')) {
        const style = document.createElement('style');
        style.id = 'bird-math-nowrap-style';
        style.textContent = \`
          .question-container-box {
              position: absolute !important;
              top: 5px !important;
              left: 50% !important;
              transform: translateX(-50%) !important;
              width: 95% !important;
              max-width: 680px !important;
              max-height: 12vh !important;
              z-index: 20 !important;
              background: rgba(255, 255, 255, 0.92) !important;
              overflow-y: auto !important;
              -webkit-overflow-scrolling: touch !important;
              box-sizing: border-box !important;
          }
          #mobile-bird-dock {
              position: fixed !important;
              bottom: calc(14px + env(safe-area-inset-bottom, 15px)) !important;
              left: 50% !important;
              transform: translateX(-50%) !important;
              z-index: 99999 !important;
              pointer-events: auto !important;
              background: rgba(15, 23, 42, 0.92) !important;
              backdrop-filter: blur(10px) !important;
              -webkit-backdrop-filter: blur(10px) !important;
              padding: 8px 16px !important;
              border-radius: 24px !important;
              border: 2px solid #eab308 !important;
              box-shadow: 0 10px 30px rgba(0,0,0,0.8), 0 0 15px rgba(234, 179, 8, 0.4) !important;
          }
          @media (max-width: 768px) {
              #mobile-bird-dock {
                  display: flex !important;
              }
              .brand-logo {
                  display: none !important;
              }
              .question-container-box {
                  top: max(4px, env(safe-area-inset-top)) !important;
                  font-size: 0.85rem !important;
                  padding: 4px 10px !important;
                  max-height: 12vh !important;
                  width: 95% !important;
              }
              #top-left-hud {
                  position: absolute !important;
                  top: calc(12vh + 8px) !important;
                  left: 6px !important;
                  gap: 4px !important;
              }
              #top-right-hud {
                  position: absolute !important;
                  top: calc(12vh + 8px) !important;
                  right: 6px !important;
                  gap: 4px !important;
              }
              #math-question {
                  font-size: 12.5px !important;
                  line-height: 1.3 !important;
                  max-height: calc(12vh - 12px) !important;
                  overflow-y: auto !important;
                  -webkit-overflow-scrolling: touch !important;
              }
              .pill-box {
                  padding: 2px 8px !important;
              }
          }
          @media (max-height: 520px) and (orientation: landscape) {
              #mobile-bird-dock {
                  display: flex !important;
                  bottom: calc(6px + env(safe-area-inset-bottom, 6px)) !important;
                  padding: 4px 12px !important;
                  gap: 8px !important;
                  transform: translateX(-50%) scale(0.85) !important;
              }
              .mobile-bird-btn {
                  padding: 6px 12px !important;
                  font-size: 11px !important;
              }
              .brand-logo {
                  display: none !important;
              }
              .question-container-box {
                  top: 2px !important;
                  font-size: 0.75rem !important;
                  padding: 2px 8px !important;
                  max-height: 16vh !important;
                  max-width: 60% !important;
                  width: 60% !important;
              }
              #level-badge {
                  font-size: 8px !important;
                  padding: 1px 6px !important;
                  margin-bottom: 2px !important;
              }
              #math-question {
                  font-size: 11px !important;
                  line-height: 1.2 !important;
                  max-height: calc(16vh - 12px) !important;
              }
              #top-left-hud {
                  position: absolute !important;
                  top: 2px !important;
                  left: 4px !important;
                  transform: scale(0.82) !important;
                  transform-origin: top left !important;
                  gap: 3px !important;
              }
              #top-right-hud {
                  position: absolute !important;
                  top: 2px !important;
                  right: 4px !important;
                  transform: scale(0.82) !important;
                  transform-origin: top right !important;
                  gap: 3px !important;
              }
              .pill-box {
                  padding: 2px 6px !important;
              }
          }
          .question-text .mjx-chtml,
          .question-text mjx-container,
          #math-question .mjx-chtml,
          #math-question mjx-container,
          #modal-question-text .mjx-chtml,
          #modal-question-text mjx-container,
          #modal-options-list .mjx-chtml,
          #modal-options-list mjx-container,
          .mjx-chtml,
          mjx-container,
          .MathJax,
          .katex,
          .katex-html {
              white-space: nowrap !important;
              display: inline-block !important;
              max-width: 100% !important;
              vertical-align: middle !important;
          }
          mjx-container *,
          .mjx-chtml *,
          .katex * {
              white-space: nowrap !important;
          }
          .question-box-content {
              word-wrap: break-word;
              overflow-wrap: break-word;
              display: inline-block;
              max-width: 100%;
          }
        \`;
        document.head.appendChild(style);
      }
    } catch(e) {}
  }

  function syncBirdData() {
    injectBirdMathNowrapStyle();
    try {
      var qBox = document.getElementById('math-question-box');
      if (qBox && !qBox.classList.contains('question-container-box')) {
        qBox.classList.add('question-container-box');
      }
    } catch(e) {}
    if (typeof ensureBirdData === 'function') {
      ensureBirdData();
    }
    if (typeof setupMobileBirdControls === 'function') {
      setupMobileBirdControls();
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

  function triggerMathTypeset() {
    try {
      if (window.MathJax && window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise().catch(function() {});
      }
    } catch(e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      injectBirdMathNowrapStyle();
      syncBirdData();
      applyAdminSecurity();
      triggerMathTypeset();
    });
  } else {
    injectBirdMathNowrapStyle();
    syncBirdData();
    applyAdminSecurity();
    triggerMathTypeset();
  }
  window.addEventListener('load', function() {
    injectBirdMathNowrapStyle();
    syncBirdData();
    applyAdminSecurity();
    triggerMathTypeset();
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

  // NHÓM HÁI TÁO LUÂN PHIÊN (cấu trúc Đa Chủ Đề, 3 dạng câu hỏi ABCD, Đúng/Sai ghép đề, Trả lời ngắn, Fallback Data & In-game Editor)
  else if (cleanUrl.includes('hai-tao') || cleanUrl.includes('haitao')) {
    let topicsMap: Record<string, { easy: any[], medium: any[], hard: any[] }> = {};
    let activeQuestions = [...questions];

    // Fallback Data nếu mảng questions trống
    if (!activeQuestions || activeQuestions.length === 0) {
      try {
        const matchingWs = DEFAULT_WORKSHEETS.find((w: any) =>
          (w.title && (w.title.toLowerCase().includes('mũ') || w.title.toLowerCase().includes('logarit') || w.title.toLowerCase().includes('táo') || w.title.toLowerCase().includes('hái táo'))) ||
          (w.id && (w.id.includes('hai-tao') || w.id.includes('mu_logarit') || w.id.includes('11_')))
        ) || DEFAULT_WORKSHEETS[0];

        if (matchingWs && matchingWs.questions && matchingWs.questions.length > 0) {
          activeQuestions = matchingWs.questions.map((q: any, idx: number) => ({
            ...q,
            id: q.id || `ws_haitao_fb_${idx}`,
            topic: q.topic || matchingWs.title || gameTitle,
            difficulty: q.difficulty || (idx % 3 === 0 ? 'Dễ' : (idx % 3 === 1 ? 'Trung bình' : 'Khó'))
          }));
        }
      } catch (e) {
        console.warn('Lỗi lấy worksheet dự phòng cho Hái Táo:', e);
      }
    }

    activeQuestions.forEach(q => {
      const topicName = q.topic?.trim() || gameTitle;
      if (!topicsMap[topicName]) {
        topicsMap[topicName] = { easy: [], medium: [], hard: [] };
      }
      const diffKey = q.difficulty === 'Dễ' ? 'easy' : (q.difficulty === 'Khó' ? 'hard' : 'medium');
      const letters = ['A', 'B', 'C', 'D'];
      const ansLetter = (typeof q.correctIndex === 'number' && q.correctIndex >= 0 && q.correctIndex < 4) ? letters[q.correctIndex] : 'A';
      const opts = (q.options || ['A', 'B', 'C', 'D']).map((o, idx) => {
        const cleanO = normalizeMathFormulas(String(o).replace(/^[A-Da-d][\)\.\:\-]\s*/, '').trim());
        return `${letters[idx]}. ${cleanO}`;
      });
      const weight = diffKey === 'easy' ? 3 : (diffKey === 'medium' ? 5 : 8);
      const badge = diffKey === 'easy' ? 'Dễ' : (diffKey === 'medium' ? 'Vừa' : 'Khó');
      const color = diffKey === 'easy' ? '#2ecc71' : (diffKey === 'medium' ? '#f39c12' : '#e74c3c');

      const isShort = q.type === 'short_answer' || ((q.options || []).length === 1);
      const isTF = q.type === 'truefalse' || ((q.options || []).length === 2) || q.question.startsWith('ĐÚNG HAY SAI:');

      if (isShort) {
        topicsMap[topicName][diffKey].push({
          type: 'short',
          badge: badge,
          color: color,
          q: normalizeMathFormulas(q.question),
          ans: String((q.options && q.options[0]) || '1').trim(),
          w: weight,
          explanation: normalizeMathFormulas(q.explanation || ''),
          imageUrl: q.imageUrl || ''
        });
      } else if (isTF) {
        topicsMap[topicName][diffKey].push({
          type: 'tf',
          badge: badge,
          color: color,
          q: normalizeMathFormulas(q.question),
          stem: normalizeMathFormulas((q as any).stem || q.question),
          opts: (q.options || ['Đúng', 'Sai']).map(o => normalizeMathFormulas(o)),
          ans: q.correctIndex === 0 ? 'Đ' : 'S',
          w: weight,
          explanation: normalizeMathFormulas(q.explanation || ''),
          imageUrl: q.imageUrl || ''
        });
      } else {
        topicsMap[topicName][diffKey].push({
          type: 'abcd',
          badge: badge,
          color: color,
          q: normalizeMathFormulas(q.question),
          opts: opts,
          ans: ansLetter,
          w: weight,
          explanation: normalizeMathFormulas(q.explanation || ''),
          imageUrl: q.imageUrl || ''
        });
      }
    });

    const haiTaoScript = `
<style id="apple-anti-overflow-style">
  /* 1. Ép chống tràn và tự động xuống dòng cho khung chứa câu hỏi / đề bài Hái Táo */
  .apple-game-container .question-container, 
  .harvest-game-wrapper .question-box, 
  [class*="apple"] .question-text, 
  [class*="harvest"] .quiz-content,
  .q-content, .question-box-content, .q-container, .question-text, .q-text {
      width: 100% !important;
      max-width: 100% !important;
      box-sizing: border-box !important;
      white-space: normal !important;
      word-break: break-word !important;
      overflow-wrap: break-word !important;
      line-height: 1.5 !important;
  }

  /* 2. Ép các nút đáp án A, B, C, D tự động xuống dòng, ôm khít trong box ở cả Laptop và Mobile */
  .apple-game-container .answer-btn, 
  .harvest-game-wrapper button[class*="answer"], 
  [class*="apple"] [class*="option"], 
  [class*="harvest"] .answer-option,
  .answer-option, .btn-abcd, .btn-tf-big, .tf-text, .tf-row {
      width: 100% !important;
      max-width: 100% !important;
      height: auto !important;
      min-height: 48px !important;
      padding: 10px 14px !important;
      white-space: normal !important;
      word-break: break-word !important;
      overflow-wrap: break-word !important;
      display: flex !important;
      align-items: center !important;
      text-align: left !important;
      box-sizing: border-box !important;
  }

  /* 3. Khóa cứng công thức MathJax inline bên trong đề bài/đáp án luôn nằm ngang thẳng hàng */
  .apple-game-container mjx-container, 
  .harvest-game-wrapper mjx-container,
  mjx-container, .MathJax, .mjx-chtml {
      white-space: nowrap !important;
      display: inline-block !important;
      vertical-align: middle !important;
  }
</style>
<script>
// [ADAPTER ENGINE: MULTI-TOPIC ARCHITECTURE - HÁI TÁO LUÂN PHIÊN]
window.__GAME_TITLE__ = ${JSON.stringify(gameTitle)};
window.__ADMIN_PIN__ = "2806";
window.__INJECTED_HAITAO_DATA__ = ${JSON.stringify(topicsMap, null, 2)};
if (window.__INJECTED_HAITAO_DATA__ && Object.keys(window.__INJECTED_HAITAO_DATA__).length > 0) {
  window.gameDatabase = JSON.parse(JSON.stringify(window.__INJECTED_HAITAO_DATA__));
  window.selectedTopic = Object.keys(window.gameDatabase)[0] || "${gameTitle}";
}

(function() {
  function syncHaiTaoData() {
    if (window.__INJECTED_HAITAO_DATA__ && Object.keys(window.__INJECTED_HAITAO_DATA__).length > 0) {
      window.gameDatabase = JSON.parse(JSON.stringify(window.__INJECTED_HAITAO_DATA__));
      if (!window.selectedTopic || !window.gameDatabase[window.selectedTopic]) {
        window.selectedTopic = Object.keys(window.gameDatabase)[0];
      }
      if (typeof window.renderAppleTopicCards === 'function') {
        window.renderAppleTopicCards();
      }
      if (typeof window.playAppleTopic === 'function') {
        window.playAppleTopic(window.selectedTopic, 'all');
      }
    }
  }

  function applyAdminSecurity() {
    try {
      const params = new URLSearchParams(window.location.search);
      const isAdmin = params.get('role') === 'admin' || params.get('preview') === 'true' || params.get('admin') === '1' || window.location.hash.includes('admin');
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
      if (gearBtn) {
        gearBtn.onclick = function(e) {
          if (e) { e.preventDefault(); e.stopPropagation(); }
          if (typeof window.openAdminPinPrompt === 'function') {
            window.openAdminPinPrompt();
          }
        };
      }
      const topicBtn = document.getElementById('btn-chuyen-de');
      if (topicBtn) {
        topicBtn.onclick = function(e) {
          if (e) { e.preventDefault(); e.stopPropagation(); }
          if (typeof window.openAppleTopicMenu === 'function') {
            window.openAppleTopicMenu();
          }
        };
      }
    } catch(e) {}
  }

  function setupFullscreen() {
    try {
      let _exporterLastFsTime = 0;
      window.toggleMobileFullscreen = function(e) {
        if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
        const now = Date.now();
        if (now - _exporterLastFsTime < 450) return;
        _exporterLastFsTime = now;

        const doc = document;
        const docEl = document.documentElement;
        const body = document.body;
        const isNative = !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement);
        const isForced = docEl.classList.contains('mobile-fullscreen-forced') || body.classList.contains('mobile-fullscreen-forced');

        if (!isNative && !isForced) {
          docEl.classList.add('mobile-fullscreen-forced');
          body.classList.add('mobile-fullscreen-forced');
          body.style.setProperty('overflow-y', 'auto', 'important');
          body.style.setProperty('-webkit-overflow-scrolling', 'touch', 'important');

          const rfs = docEl.requestFullscreen || docEl.webkitRequestFullscreen || docEl.webkitRequestFullScreen || docEl.mozRequestFullScreen || docEl.msRequestFullscreen;
          if (rfs) {
            try {
              const res = rfs.call(docEl);
              if (res && typeof res.then === 'function') {
                res.then(() => { updateFsUI(); }).catch(function() {});
              }
            } catch(e) {}
          }
          try {
            if (window.self !== window.top && window.parent) {
              window.parent.postMessage({ type: 'TOGGLE_FULLSCREEN', action: 'enter' }, '*');
            }
          } catch(e) {}
          try { window.scrollTo(0, 1); } catch(e) {}
          try {
            if (screen.orientation && typeof screen.orientation.lock === 'function') {
              screen.orientation.lock('landscape').catch(function() {});
            }
          } catch(e) {}
          updateFsUI();
        } else {
          docEl.classList.remove('mobile-fullscreen-forced');
          body.classList.remove('mobile-fullscreen-forced');
          body.style.removeProperty('overflow-y');
          body.style.removeProperty('-webkit-overflow-scrolling');
          if (isNative) {
            const efs = doc.exitFullscreen || doc.webkitExitFullscreen || doc.webkitCancelFullScreen || doc.mozCancelFullScreen || doc.msExitFullscreen;
            if (efs) { try { efs.call(doc); } catch(e) {} }
          }
          try {
            if (window.self !== window.top && window.parent) {
              window.parent.postMessage({ type: 'TOGGLE_FULLSCREEN', action: 'exit' }, '*');
            }
          } catch(e) {}
          try {
            if (screen.orientation && typeof screen.orientation.unlock === 'function') {
              screen.orientation.unlock();
            }
          } catch(e) {}
          updateFsUI();
        }

        const triggerResize = () => {
          try { window.dispatchEvent(new Event('resize')); } catch(e) {}
        };
        triggerResize();
        setTimeout(triggerResize, 100);
        setTimeout(triggerResize, 300);
        setTimeout(triggerResize, 600);
      };

      function updateFsUI() {
        const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement || document.documentElement.classList.contains('mobile-fullscreen-forced'));
        if (isFs) {
          document.body.style.setProperty('overflow-y', 'auto', 'important');
          document.body.style.setProperty('-webkit-overflow-scrolling', 'touch', 'important');
        }
        const fsIcon = document.getElementById('fullscreenIcon');
        const fsText = document.getElementById('fullscreenText');
        if (fsIcon) fsIcon.textContent = isFs ? '🗗' : '⛶';
        if (fsText) fsText.textContent = isFs ? '[ 🗗 ] THU NHỎ' : '[ ⛶ ] TOÀN MÀN HÌNH';
      }

      window.triggerToggleFullscreen = window.toggleMobileFullscreen;
      document.addEventListener('fullscreenchange', updateFsUI);
      document.addEventListener('webkitfullscreenchange', updateFsUI);

      const fsBtn = document.getElementById('fullscreenToggleBtn');
      if (fsBtn && !fsBtn.dataset.fsBound) {
        fsBtn.dataset.fsBound = 'true';
        fsBtn.addEventListener('click', window.toggleMobileFullscreen);
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
      syncHaiTaoData();
      applyAdminSecurity();
      setupAdminButtons();
      setupFullscreen();
      triggerMathTypeset();
    });
  } else {
    syncHaiTaoData();
    applyAdminSecurity();
    setupAdminButtons();
    setupFullscreen();
    triggerMathTypeset();
  }
  window.addEventListener('load', function() {
    syncHaiTaoData();
    applyAdminSecurity();
    setupAdminButtons();
    setupFullscreen();
    triggerMathTypeset();
  });
})();
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
    const cleanFormula = (text: string): string => {
      if (!text) return '';
      let res = text.replace(/[\u000c\x0c]/g, '').trim();

      // Bảo toàn dấu gạch chéo ngược LaTeX (\frac, \sqrt, \ne, ...)
      res = escapeRawLaTeXSlash(res);

      // Chuyển đổi trực tiếp mã lệnh dấu khác (\ne, \neq) thành ký tự Unicode thuần túy ≠
      res = res.replace(/\\+(?:neq|ne)\b/g, ' ≠ ')
               .replace(/\\+(?:neq|ne)(?=[^a-zA-Z]|$)/g, ' ≠ ');
      res = res.replace(/\s*≠\s*/g, ' ≠ ');

      // 1. Quét sạch và tiêu diệt triệt để ký tự rác \f, \f\f bám trên chuỗi
      res = res.replace(/\\f\\f/g, '').replace(/f\\f/g, '');
      res = res.replace(/(\\+f|f)+(?=\\?frac)/g, '');
      res = res.replace(/(\\+f|f)+(?=\\?\()/g, '');
      res = res.replace(/\\f(?![a-zA-Z])/g, '');
      res = res.replace(/\\f\b/g, '');

      // 2. Sửa lỗi dính chữ và khôi phục dấu gạch chéo ngược \ bị thiếu cho mã lệnh LaTeX chuẩn sư phạm
      res = res.replace(/(?<![a-zA-Z\\])rac/g, '\\frac')
               .replace(/\\+rac/g, '\\frac')
               .replace(/\brac\b/g, '\\frac');
      res = res.replace(/(?<![a-zA-Z\\])frac/g, '\\frac');
      res = res.replace(/(?<!\\)cdot/g, '\\cdot');
      res = res.replace(/(?<!\\)forall/g, '\\forall');
      res = res.replace(/(?<!\\)pm/g, '\\pm');
      res = res.replace(/(?<!\\)infty/g, '\\infty');

      // Khử lỗi dính ký tự trước ngoặc phân tách: y\( -> \(y
      res = res.replace(/([a-zA-Z0-9])\\+\(/g, '\\($1');

      // Tiêu diệt triệt để ký tự rác \f bám trước \frac
      res = res.replace(/(\\+f|f)+(?=\\frac)/g, '');

      // 3. Khử hoàn toàn lỗi lặp dấu gạch chéo (double escape) hoặc bọc ngoặc vuông sai quy cách dạng \[...\]
      res = res.replace(/\\\[/g, '').replace(/\\\]/g, '');
      res = res.replace(/\\\\([a-zA-Z])/g, '\\$1');

      res = res.replace(/\bN\s+?u\b/g, 'Nếu')
               .replace(/\bH\s+ai\b/g, 'Hai')
               .replace(/\bC\s+ho\b/g, 'Cho')
               .replace(/\bC\s+?\b/g, 'Có')
               .replace(/\bK\s+hi\b/g, 'Khi')
               .replace(/\bC\s+h?\b/g, 'Chỉ')
               .replace(/\bT\s+ính\b/g, 'Tính')
               .replace(/\bT\s+rong\b/g, 'Trong')
               .replace(/\bK\s+h?ng\b/g, 'Không')
               .replace(/\bd\s+?nh\b/g, 'định')
               .replace(/\bH\s+ình\b/g, 'Hình')
               .replace(/\bM\s+?t\b/g, 'Một')
               .replace(/\bd\s+u?ng\b/g, 'đường')
               .replace(/Hai\s+m\s+?t\s+ph\s+?ng/g, 'Hai mặt phẳng');
      res = res.replace(/\bAcupB\b/g, 'A \\cup B')
               .replace(/\bAcapB\b/g, 'A \\cap B')
               .replace(/(?<!\\)\bcdot\b/g, '\\cdot')
               .replace(/(?<!\\)\bOmega\b/g, '\\Omega')
               .replace(/(?<!\\)\bemptyset\b/g, '\\emptyset');
      res = res.replace(/e\^\(([^)]+)\)/g, 'e^{$1}')
               .replace(/e\^\{([^}]+)\}/g, 'e^{$1}')
               .replace(/e\^([a-zA-Z0-9]+)/g, 'e^{$1}')
               .replace(/([a-zA-Z0-9\)])\^\(([^)]+)\)/g, '$1^{$2}')
               .replace(/([a-zA-Z0-9\)])\^\{([^}]+)\}/g, '$1^{$2}')
               .replace(/([a-zA-Z0-9\)])\^([a-zA-Z0-9]+)/g, '$1^{$2}');

      // Chuyển đổi $...$ thành \(...\) chuẩn của MathJax / KaTeX
      res = res.replace(/\$([^\$]+?)\$/g, (_, m) => '\\(' + m.trim() + '\\)');

      res = res.trim();
      const hasVietnamese = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ]/i.test(res);
      if (!hasVietnamese) {
        if (!res.startsWith('\\(') && !res.endsWith('\\)')) {
          res = '\\(' + res + '\\)';
        }
      } else {
        if (!res.includes('\\(')) {
          if (/[=<>≠]|\\frac|\\forall|\\pm|\\infty|\^|_/.test(res)) {
            const matchEq = res.match(/^([^=<>≠]*?)\s*([a-zA-Z0-9'_\^]+\s*=[^=].*)$/);
            if (matchEq) {
              res = matchEq[1] + ' \\(' + matchEq[2].trim() + '\\)';
            } else {
              res = res.replace(/(-\\frac\{[^}]+\}\{[^}]+\}|\\frac\{[^}]+\}\{[^}]+\})/g, '\\($1\\)');
              if (!res.includes('\\(')) {
                res = '\\(' + res + '\\)';
              }
            }
          }
        }
      }

      return normalizeMathFormulas(res);
    };

    const topicsMap: Record<string, any> = {};
    const defaultTopic = gameTitle || 'Chuyên đề Tùy Chọn';
    const themeColors = ['blue', 'emerald', 'violet', 'amber', 'rose', 'cyan'];

    let activeRows = customDragDropRows;
    let activeCats = customCategories;
    let activeQuestions = questions.filter(q => !q.isDisabled);
    if (activeQuestions.length === 0) activeQuestions = questions;

    // Fallback nếu không có dữ liệu tùy chỉnh từ người dùng
    if ((!activeRows || activeRows.length === 0) && (!activeCats || activeCats.length === 0) && activeQuestions.length === 0) {
      try {
        const ws = DEFAULT_WORKSHEETS.find(w =>
          (w.title && (w.title.toLowerCase().includes('đơn điệu') || w.title.toLowerCase().includes('cực trị') || w.title.toLowerCase().includes('hàm số') || w.title.toLowerCase().includes('kéo thả'))) ||
          (w.id && (w.id.includes('don_dieu') || w.id.includes('cuc_tri') || w.id.includes('12_01')))
        ) || DEFAULT_WORKSHEETS[0];
        if (ws && ws.questions && ws.questions.length > 0) {
          activeQuestions = ws.questions.map((q: any, idx: number) => ({
            id: q.id || `ws_keotha_fb_${idx}`,
            question: q.question,
            options: q.options || [],
            correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
            explanation: q.solution || '',
            difficulty: (q.difficulty || (idx % 3 === 0 ? 'Dễ' : (idx % 3 === 1 ? 'Trung bình' : 'Khó'))) as any,
            topic: q.topic || ws.title || 'Chuyên đề Tùy Chọn'
          } as Question));
        }
      } catch(e) {}
    }

    // Ưu tiên 1: Sử dụng customDragDropRows (Bảng Phân Cấp Đa Chuyên Đề & Đa Cấp Độ)
    if (activeRows && activeRows.length > 0) {
      const topicGroups: Record<string, DragDropTableRow[]> = {};
      activeRows.forEach(r => {
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
              tex: cleanFormula(row.category),
              theme: row.theme || themeColors[rIdx % themeColors.length]
            });

            (row.attributes || []).forEach((attr, aIdx) => {
              props.push({
                id: `p${rIdx + 1}_${aIdx + 1}`,
                funcId: funcId,
                text: cleanFormula(attr)
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
    } else if (activeCats && activeCats.length > 0) {
      // Ưu tiên 2: Sử dụng customCategories (Mẫu 2 cột phẳng)
      topicsMap[defaultTopic] = {};
      const chunkSize = 3;
      const totalLevels = Math.min(5, Math.max(1, Math.ceil(activeCats.length / chunkSize)));

      for (let lvl = 1; lvl <= totalLevels; lvl++) {
        const sliceStart = (lvl - 1) * chunkSize;
        const sliceCats = activeCats.slice(sliceStart, sliceStart + chunkSize);
        if (sliceCats.length === 0) break;

        const funcs: any[] = [];
        const props: any[] = [];

        sliceCats.forEach((cat, idx) => {
          const funcId = `f${idx + 1}`;
          funcs.push({
            id: funcId,
            tex: cleanFormula(cat.title),
            theme: cat.theme || themeColors[idx % themeColors.length]
          });

          (cat.attributes || []).forEach((attr, pIdx) => {
            props.push({
              id: `p${idx + 1}_${pIdx + 1}`,
              funcId: funcId,
              text: cleanFormula(attr)
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
      activeQuestions.forEach(q => {
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
              tex: cleanFormula(q.question),
              theme: themeColors[idx % themeColors.length]
            });

            (q.options || []).forEach((opt, pIdx) => {
              props.push({
                id: `p${idx + 1}_${pIdx + 1}`,
                funcId: funcId,
                text: cleanFormula(opt)
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

// Tiêm CSS Responsive Mobile, 100dvh, Touch scroll & MathJax / KaTeX NoWrap
(function injectKeoThaStyles() {
  try {
    if (!document.getElementById('keo-tha-mobile-fix-style')) {
      const style = document.createElement('style');
      style.id = 'keo-tha-mobile-fix-style';
      style.textContent = \`
        html, body {
            min-height: 100dvh !important;
            height: 100dvh !important;
            max-height: 100dvh !important;
            overflow: hidden !important;
            margin: 0 !important;
            padding: 0 !important;
        }
        .math-text { 
            font-size: 1rem; 
            line-height: 1.5; 
            color: #ffffff;
            font-weight: 500;
        }
        .drag-item mjx-container, .card mjx-container, mjx-container, .mjx-chtml,
        .math-text, .math-content, .katex, .katex-html, mjx-math, .MathJax, .card-func .math-content, .card-prop .math-text { 
            white-space: nowrap !important;
            display: inline-block !important;
            color: #ffffff !important;
        }
        .drag-item mjx-container *, .card mjx-container *, mjx-container *, .mjx-chtml *,
        .math-text *, .math-content *, .katex *, mjx-math *, .MathJax *, .card-func .math-content *, .card-prop .math-text * {
            white-space: nowrap !important;
            color: #ffffff !important;
        }
        .math-text .katex, .math-content .katex, mjx-container { 
            color: #ffffff !important;
            font-family: 'JetBrains Mono', monospace;
            text-shadow: 0 0 10px rgba(255, 255, 255, 0.4);
            font-size: 1.05em;
        }

        /* Khử triệt để lỗi đóng khung viền xung quanh dấu khác \(\ne\) và container toán học */
        mjx-container, 
        .mjx-chtml, 
        .drag-item mjx-container, 
        .card-element mjx-container,
        .card-prop mjx-container,
        .card-func mjx-container,
        mjx-math,
        mjx-mo,
        .drag-item, 
        .card-element, 
        .card-prop, 
        .card-func, 
        .answer-btn, 
        .option-card {
            outline: none !important; /* Xóa bỏ khung viền gỡ lỗi mặc định */
            border: none !important; /* Triệt tiêu mọi vạch khung bao quanh */
            box-shadow: none !important; /* Xóa bóng mờ tạo viền hộp */
            -webkit-tap-highlight-color: transparent !important;
            white-space: nowrap !important; /* Ép biểu thức luôn nằm trên một dòng */
            display: inline-block !important;
            overflow: visible !important; /* Giữ hiển thị trọn vẹn ký tự đuôi không bị cắt chữ */
            box-sizing: border-box !important;
        }

        /* Đảm bảo thẻ kéo thả bọc ngoài tự co giãn theo độ dài thực tế của chữ và công thức */
        .drag-item, [id^="card-"], .card-element, .card-prop {
            width: max-content !important; /* Tự động nở rộng chiều ngang vừa khít theo công thức */
            max-width: 95% !important; /* Chống tràn quá biên màn hình di động */
            padding-left: 12px !important; /* Tạo khoảng trống đệm an toàn sang hai bên */
            padding-right: 12px !important;
        }
        @media (max-width: 768px) {
            body {
                height: 100dvh !important;
                max-height: 100dvh !important;
                overflow: hidden !important;
            }
            .topbar-wrapper {
                height: 40px !important;
                max-height: 40px !important;
                padding: 2px 6px !important;
                display: flex !important;
                flex-direction: row !important;
                flex-wrap: nowrap !important;
                align-items: center !important;
                justify-content: space-between !important;
                overflow: hidden !important;
                background: rgba(5, 5, 5, 0.9) !important;
                backdrop-filter: blur(10px) !important;
                border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
                z-index: 45 !important;
            }
            .brand-badge {
                padding: 2px 5px !important;
                height: 30px !important;
                border-radius: 8px !important;
                gap: 4px !important;
            }
            .brand-icon {
                width: 20px !important;
                height: 20px !important;
                min-width: 20px !important;
                border-radius: 5px !important;
            }
            .brand-text {
                font-size: 0.75rem !important;
                line-height: 1 !important;
            }
            .brand-text-sub {
                display: none !important;
            }
            .system-buttons {
                display: flex !important;
                align-items: center !important;
                gap: 3px !important;
                flex-wrap: nowrap !important;
            }
            .btn-system-topic, .btn-system-fs, #btn-admin-gear {
                padding: 2px 6px !important;
                height: 28px !important;
                font-size: 0.75rem !important;
                border-radius: 6px !important;
                white-space: nowrap !important;
                line-height: 1 !important;
            }
            #header-panel {
                height: 34px !important;
                max-height: 40px !important;
                padding: 2px 4px !important;
                margin: 0 !important;
                border-radius: 8px !important;
                display: flex !important;
                flex-direction: row !important;
                flex-wrap: nowrap !important;
                align-items: center !important;
                gap: 3px !important;
                background: rgba(10, 15, 28, 0.95) !important;
                border: 1px solid rgba(255, 255, 255, 0.1) !important;
            }
            #header-panel > div {
                padding: 2px 5px !important;
                height: 26px !important;
                border-radius: 6px !important;
                font-size: 0.8rem !important;
                display: flex !important;
                align-items: center !important;
                gap: 2px !important;
                white-space: nowrap !important;
            }
            #game-board {
                padding-top: 44px !important;
                padding-bottom: 2px !important;
                padding-left: 4px !important;
                padding-right: 4px !important;
                height: 100dvh !important;
                max-height: 100dvh !important;
                display: flex !important;
                flex-direction: column !important;
                box-sizing: border-box !important;
            }
            #function-nodes {
                width: 100% !important;
                padding: 2px 2px !important;
                gap: 6px !important;
                display: flex !important;
                flex-direction: row !important;
                justify-content: space-between !important;
                align-items: stretch !important;
                shrink: 0 !important;
                max-height: 110px !important;
                z-index: 30 !important;
            }
            .card-func {
                min-width: 0 !important;
                flex: 1 1 0 !important;
                max-width: 33% !important;
                padding: 4px 6px !important;
                border-radius: 10px !important;
                box-shadow: 0 4px 12px rgba(0,0,0,0.5) !important;
            }
            .card-func .math-content {
                font-size: 0.95rem !important;
                margin-bottom: 2px !important;
                white-space: nowrap !important;
                line-height: 1.2 !important;
            }
            .card-func .math-content * {
                white-space: nowrap !important;
            }
            #property-arena {
                flex: 1 1 auto !important;
                width: 100% !important;
                height: calc(100% - 120px) !important;
                margin-top: 4px !important;
                overflow: hidden !important;
                position: relative !important;
                touch-action: none !important;
            }
            .card-prop, .drag-item, [id^="card-"], .card-element {
                padding: 4px 12px !important;
                width: max-content !important;
                max-width: 95% !important;
                min-width: 80px !important;
                font-size: 0.75rem !important;
                border-radius: 8px !important;
                touch-action: none !important;
                box-shadow: 0 4px 14px rgba(0,0,0,0.6) !important;
                box-sizing: border-box !important;
            }
            .card-prop .math-text {
                font-size: 0.75rem !important;
                line-height: 1.2 !important;
                white-space: nowrap !important;
            }
            .card-prop .math-text * {
                white-space: nowrap !important;
            }
            #overlay-content,
            #ingame-editor-modal > div {
                max-height: 85dvh !important;
                overflow-y: auto !important;
                -webkit-overflow-scrolling: touch !important;
            }
        }
      \`;
      document.head.appendChild(style);
    }
  } catch(e) {}
})();

// Xử lý Fullscreen Mobile đa nền tảng
window.toggleMobileFullscreen = function() {
  try {
    const doc = document;
    const el = doc.documentElement;
    const isFs = doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement;
    if (!isFs) {
      if (el.requestFullscreen) { el.requestFullscreen().catch(()=>{}); }
      else if (el.webkitRequestFullscreen) { el.webkitRequestFullscreen(); }
      else if (el.mozRequestFullScreen) { el.mozRequestFullScreen(); }
      else if (el.msRequestFullscreen) { el.msRequestFullscreen(); }
    } else {
      if (doc.exitFullscreen) { doc.exitFullscreen().catch(()=>{}); }
      else if (doc.webkitExitFullscreen) { doc.webkitExitFullscreen(); }
      else if (doc.mozCancelFullScreen) { doc.mozCancelFullScreen(); }
      else if (doc.msExitFullscreen) { doc.msExitFullscreen(); }
    }
  } catch(e) {}
};

(function() {
  function syncKeoThaDb() {
    if (typeof window.gameDatabase !== 'undefined' && window.__INJECTED_GAME_DATABASE__ && Object.keys(window.__INJECTED_GAME_DATABASE__).length > 0) {
      window.gameDatabase = JSON.parse(JSON.stringify(window.__INJECTED_GAME_DATABASE__));
      window.selectedTopic = Object.keys(window.gameDatabase)[0] || "${gameTitle}";
      if (typeof window.showOverlay === 'function') {
        window.showOverlay('start');
      }
    }
    try {
      if (window.MathJax && window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise().catch(function() {});
      }
    } catch(e) {}
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

  // NHÓM PIKACHU NỐI CẶP ĐẠO HÀM / GHÉP CẶP LƯỢNG GIÁC (cấu trúc Đa Chủ Đề: pairs 24+ cặp thẻ cho bàn 48 ô)
  else if (cleanUrl.includes('pikachu')) {
    const cleanFormula = (text: string): string => {
      if (!text) return '';
      let res = text.replace(/[\u000c\x0c]/g, '').trim();
      res = res.replace(/\\f(?=\\frac)/g, '')
               .replace(/\\+rac/g, '\\frac')
               .replace(/(?<![a-zA-Z\\])rac/g, '\\frac')
               .replace(/\\{2,}frac/g, '\\frac');
      res = res.replace(/\bN\s+ếu\b/g, 'Nếu')
               .replace(/\bH\s+ai\b/g, 'Hai')
               .replace(/\bC\s+ho\b/g, 'Cho')
               .replace(/\bC\s+ả\b/g, 'Cả')
               .replace(/\bK\s+hi\b/g, 'Khi')
               .replace(/\bC\s+hỉ\b/g, 'Chỉ')
               .replace(/\bT\s+ính\b/g, 'Tính')
               .replace(/\bT\s+rong\b/g, 'Trong')
               .replace(/\bK\s+hẳng\b/g, 'Khẳng')
               .replace(/\bđ\s+ịnh\b/g, 'định')
               .replace(/\bH\s+ình\b/g, 'Hình')
               .replace(/\bM\s+ặt\b/g, 'Mặt')
               .replace(/\bđ\s+ường\b/g, 'đường')
               .replace(/Hai\s+m\s+ặt\s+ph\s+ẳng/g, 'Hai mặt phẳng');
      res = res.replace(/\bAcupB\b/g, 'A \\cup B')
               .replace(/\bAcapB\b/g, 'A \\cap B')
               .replace(/(?<!\\)\bcdot\b/g, '\\cdot')
               .replace(/(?<!\\)\bOmega\b/g, '\\Omega')
               .replace(/(?<!\\)\bemptyset\b/g, '\\emptyset');
      res = res.replace(/\\?cdot\s*x\^\{n\}\^\{/g, '\\cdot x^{n-1}')
               .replace(/x\^\{n\}\^\{/g, 'x^{n-1}')
               .replace(/x\^\{n\}\^\{-1\}/g, 'x^{n-1}');
      res = res.replace(/e\^\(([^)]+)\)/g, 'e^{$1}')
               .replace(/e\^\{([^}]+)\}/g, 'e^{$1}')
               .replace(/e\^([a-zA-Z0-9]+)/g, 'e^{$1}')
               .replace(/([a-zA-Z0-9\)])\^\(([^)]+)\)/g, '$1^{$2}')
               .replace(/([a-zA-Z0-9\)])\^\{([^}]+)\}/g, '$1^{$2}')
               .replace(/([a-zA-Z0-9\)])\^([a-zA-Z0-9]+)/g, '$1^{$2}');
      return normalizeMathFormulas(res);
    };

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
          const rawRight = (q.options && typeof q.correctIndex === 'number' && q.options[q.correctIndex])
            ? q.options[q.correctIndex]
            : (q.options?.[0] || 'Đáp án');
          const rightText = cleanFormula(rawRight);
          return {
            id: i + 1,
            left: cleanFormula(q.question || ''),
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
// [ADAPTER ENGINE: MULTI-TOPIC ARCHITECTURE - PIKACHU NỐI CẶP & GHÉP CẶP LƯỢNG GIÁC]
// Inject dữ liệu từ Studio vào biến chuẩn
window.__INJECTED_PIKACHU_DATA__ = ${JSON.stringify(topicsMap, null, 2)};
window.pikachuQuizData = window.__INJECTED_PIKACHU_DATA__;
window.__ADMIN_PIN__ = "2806";

// Tiêm CSS Responsive Mobile, 100dvh, Touch scroll & MathJax / KaTeX NoWrap
(function injectPikachuStyles() {
  try {
    if (!document.getElementById('pikachu-mobile-fix-style')) {
      const style = document.createElement('style');
      style.id = 'pikachu-mobile-fix-style';
      style.textContent = \`
        html, body {
            min-height: 100dvh !important;
            height: 100dvh !important;
            max-height: 100dvh !important;
        }
        @media (max-width: 768px) {
            body {
                height: 100dvh !important;
                max-height: 100dvh !important;
                overflow: hidden !important;
            }
            #app {
                height: 100dvh !important;
                max-height: 100dvh !important;
                padding: 4px !important;
                padding-top: 4px !important;
            }
            #game-header {
                padding: 4px 8px !important;
                margin-bottom: 4px !important;
                border-radius: 12px !important;
            }
            .game-tile {
                border-radius: 6px !important;
                border-bottom-width: 2px !important;
            }
            .animal-glass {
                font-size: 70cqmin !important;
            }
            #topic-selection-overlay > div,
            #admin-editor-modal > div,
            #modal-container > div {
                max-height: 80dvh !important;
                overflow-y: auto !important;
                -webkit-overflow-scrolling: touch !important;
            }
        }
        .math-content, .katex, .katex-html, .mjx-chtml, mjx-container {
            white-space: nowrap !important;
            display: inline-block !important;
        }
        .math-content .katex *, .math-content mjx-container *, .katex *, mjx-container * {
            white-space: nowrap !important;
        }
      \`;
      document.head.appendChild(style);
    }
  } catch(e) {}
})();

// Gán vào gameDatabase nếu đã sẵn sàng, hoặc chờ script load xong
(function applyPikachuData() {
  function syncData() {
    if (typeof window.gameDatabase !== 'undefined') {
      Object.assign(window.gameDatabase, window.__INJECTED_PIKACHU_DATA__);
      window.selectedTopic = Object.keys(window.gameDatabase)[0] || "${gameTitle}";
      if (typeof window.renderPikachuTopicCards === 'function') window.renderPikachuTopicCards();
      if (typeof window.ensurePikachuData === 'function') window.ensurePikachuData();
    }
    // Đảm bảo ẩn overlay menu khi bấm chọn level
    const origSelect = window.selectPikachuTopic;
    if (typeof origSelect === 'function' && !origSelect._patched) {
      window.selectPikachuTopic = function(tName, lvl) {
        const overlay = document.getElementById('topic-selection-overlay');
        if (overlay) {
          overlay.style.display = 'none';
          overlay.classList.add('hidden');
        }
        return origSelect.apply(this, arguments);
      };
      window.selectPikachuTopic._patched = true;
    }
    try {
      if (window.MathJax && window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise().catch(function() {});
      }
    } catch(e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncData);
  } else {
    syncData();
  }
  window.addEventListener('load', syncData);
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
    const cleanFormula = (text: string): string => {
      if (!text) return '';
      let res = text.replace(/\\f\\f/g, '').replace(/\\f/g, '').replace(/[\u000c\x0c]/g, '').trim();
      res = res.replace(/\bN\s+?u\b/g, 'Nếu')
               .replace(/\bH\s+ai\b/g, 'Hai')
               .replace(/\bC\s+ho\b/g, 'Cho')
               .replace(/\bC\s+?\b/g, 'Có')
               .replace(/\bK\s+hi\b/g, 'Khi')
               .replace(/\bC\s+h?\b/g, 'Chỉ')
               .replace(/\bT\s+ính\b/g, 'Tính')
               .replace(/\bT\s+rong\b/g, 'Trong')
               .replace(/\bK\s+h?ng\b/g, 'Không')
               .replace(/\bd\s+?nh\b/g, 'định')
               .replace(/\bH\s+ình\b/g, 'Hình')
               .replace(/\bM\s+?t\b/g, 'Một')
               .replace(/\bd\s+u?ng\b/g, 'đường')
               .replace(/Hai\s+m\s+?t\s+ph\s+?ng/g, 'Hai mặt phẳng');
      res = res.replace(/\bAcupB\b/g, 'A \\cup B')
               .replace(/\bAcapB\b/g, 'A \\cap B')
               .replace(/(?<!\\)\bcdot\b/g, '\\cdot')
               .replace(/(?<!\\)\bOmega\b/g, '\\Omega')
               .replace(/(?<!\\)\bemptyset\b/g, '\\emptyset');
      res = res.replace(/e\^\(([^)]+)\)/g, 'e^{$1}')
               .replace(/e\^\{([^}]+)\}/g, 'e^{$1}')
               .replace(/e\^([a-zA-Z0-9]+)/g, 'e^{$1}')
               .replace(/([a-zA-Z0-9\)])\^\(([^)]+)\)/g, '$1^{$2}')
               .replace(/([a-zA-Z0-9\)])\^\{([^}]+)\}/g, '$1^{$2}')
               .replace(/([a-zA-Z0-9\)])\^([a-zA-Z0-9]+)/g, '$1^{$2}');
      return normalizeMathFormulas(res);
    };

    const topicsMap: Record<string, { easy: any[], medium: any[], hard: any[] }> = {};
    const defaultTopic = gameTitle || 'Chủ đề 1: Biến Cố Giao, Hợp & Biến Cố Độc Lập';
    const letters = ['A', 'B', 'C', 'D'];

    let activeQuestions = questions.filter(q => !q.isDisabled);
    if (activeQuestions.length === 0) activeQuestions = [...questions];
    if (activeQuestions.length === 0) {
      try {
        const ws = DEFAULT_WORKSHEETS.find(w => 
          (w.title && (w.title.toLowerCase().includes('xác suất') || w.title.toLowerCase().includes('xac suat'))) ||
          (w.id && (w.id.includes('xac_suat') || w.id.includes('xacsuat') || w.id.includes('11_') || w.id.includes('10_07')))
        ) || DEFAULT_WORKSHEETS.find(w => w.questions && w.questions.length >= 10) || DEFAULT_WORKSHEETS[0];
        
        if (ws && ws.questions && ws.questions.length > 0) {
          activeQuestions = ws.questions.map((q: any, idx: number) => ({
            id: q.id || `ws_yoga_fb_${idx}`,
            question: q.question,
            options: q.options || ['A', 'B', 'C', 'D'],
            correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
            explanation: q.solution || '',
            difficulty: (q.difficulty || (idx % 3 === 0 ? 'Dễ' : (idx % 3 === 1 ? 'Trung bình' : 'Khó'))) as any,
            topic: q.topic || ws.title || defaultTopic
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
          text: cleanFormula(q.question),
          left: cleanFormula(q.options[0] || 'Đúng'),
          right: cleanFormula(q.options[1] || 'Sai'),
          correct: ansIdx === 0 ? 'LEFT' : 'RIGHT',
          explanation: cleanFormula(q.explanation || '')
        });
      } else {
        const optsObj = {
          A: cleanFormula(q.options?.[0] || 'A'),
          B: cleanFormula(q.options?.[1] || 'B'),
          C: cleanFormula(q.options?.[2] || 'C'),
          D: cleanFormula(q.options?.[3] || 'D')
        };
        topicsMap[topicName][diffKey].push({
          type: 'MC',
          text: cleanFormula(q.question),
          opts: optsObj,
          correct: ansLetter,
          explanation: cleanFormula(q.explanation || '')
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

// Tiêm CSS Responsive Mobile, 100dvh, Touch scroll & MathJax / KaTeX NoWrap
(function injectYogaStyles() {
  try {
    if (!document.getElementById('yoga-mobile-fix-style')) {
      const style = document.createElement('style');
      style.id = 'yoga-mobile-fix-style';
      style.textContent = \`
        html, body {
            min-height: 100dvh !important;
            height: 100dvh !important;
            max-height: 100dvh !important;
            overflow: hidden !important;
            margin: 0 !important;
            padding: 0 !important;
        }
        .math-text, .math-content, .katex, .katex-html, .mjx-chtml, mjx-container {
            white-space: nowrap !important;
            display: inline-block !important;
        }
        .math-text .katex *, .math-text mjx-container *, .math-content .katex *, .math-content mjx-container *, .katex *, mjx-container * {
            white-space: nowrap !important;
        }
        /* Khung đen chứa đề bài: Neo lên đỉnh, z-index 50 */
        .question-box, .question-container, #question-text-box {
            position: relative !important;
            z-index: 50 !important;
        }

        /* Khung tròn Camera: Layer dưới khung đề bài (z-index 10) */
        #webcam-container, .camera-circle-wrapper, #camera-wrapper, .camera-container {
            z-index: 10 !important;
        }

        @media (max-width: 768px) {
            body {
                height: 100dvh !important;
                max-height: 100dvh !important;
                overflow: hidden !important;
            }
            #game-ui {
                padding-top: 52px !important;
                justify-content: flex-start !important;
            }
            .brand-title {
                font-size: 13px !important;
                letter-spacing: 0.5px !important;
            }
            /* Neo khung đề bài lên đỉnh, z-index 50 */
            .question-box, .question-container, #question-text-box {
                position: relative !important;
                z-index: 50 !important;
                top: 0 !important;
                margin-top: 4px !important;
                width: 95% !important;
                max-width: 95% !important;
                padding: 8px 12px !important;
                min-height: auto !important;
                border-radius: 16px !important;
            }
            #question-text {
                font-size: 13px !important;
                line-height: 1.35 !important;
                max-height: 18vh !important;
                overflow-y: auto !important;
                -webkit-overflow-scrolling: touch !important;
            }
            /* Khung tròn Camera: hạ layer xuống z-index 10 và thêm khoảng đệm margin-top/top đẩy xuống dưới */
            #camera-wrapper, .camera-circle-wrapper {
                top: 57% !important;
                margin-top: 15px !important;
                z-index: 10 !important;
            }
            .camera-container, #webcam-container {
                width: 170px !important;
                height: 170px !important;
                border-width: 4px !important;
                z-index: 10 !important;
            }
            #layout-tf {
                padding: 0 8px !important;
                top: 57% !important;
            }
            #layout-tf .option-card {
                width: 33% !important;
                padding: 8px 6px !important;
                border-radius: 16px !important;
            }
            #tf-text-left, #tf-text-right {
                font-size: 18px !important;
                margin-bottom: 2px !important;
            }
            #layout-mc .option-card {
                width: 36% !important;
                padding: 5px 6px !important;
                border-radius: 14px !important;
            }
            #mc-A { top: 32% !important; left: 2% !important; }
            #mc-B { top: 32% !important; right: 2% !important; }
            #mc-C { bottom: 6% !important; left: 2% !important; }
            #mc-D { bottom: 6% !important; right: 2% !important; }
            #layout-mc .stickman {
                width: 34px !important;
                height: 34px !important;
                margin-bottom: 2px !important;
            }
            #instruction-hint {
                font-size: 10px !important;
                padding: 3px 8px !important;
                margin-top: 4px !important;
            }
            #topic-selection-overlay > div,
            #admin-editor-modal > div,
            #pin-prompt-modal > div {
                max-height: 80dvh !important;
                overflow-y: auto !important;
                -webkit-overflow-scrolling: touch !important;
            }
            #yoga-topics-grid,
            #editor-questions-list {
                max-height: 60dvh !important;
                overflow-y: auto !important;
                -webkit-overflow-scrolling: touch !important;
            }
        }

        /* TỐI ƯU TOÀN DIỆN KHI XOAY NGANG ĐIỆN THOẠI (LANDSCAPE) */
        @media (orientation: landscape) and (max-height: 500px) {
            body {
                height: 100dvh !important;
                max-height: 100dvh !important;
                overflow: hidden !important;
            }
            #game-ui {
                padding-top: 2px !important;
                justify-content: flex-start !important;
            }
            /* 1. KHUNG ĐỀ BÀI: Neo lên đỉnh, thu hẹp max-height 60px, font-size 0.85rem, z-index 50 */
            .question-box, .question-container, #question-text-box {
                position: relative !important;
                z-index: 50 !important;
                top: 0 !important;
                max-height: 60px !important;
                min-height: unset !important;
                height: auto !important;
                padding: 4px 10px !important;
                margin-top: 2px !important;
                border-radius: 12px !important;
                width: 96% !important;
                max-width: 96% !important;
            }
            #question-text {
                font-size: 0.85rem !important;
                line-height: 1.25 !important;
                max-height: 52px !important;
                overflow-y: auto !important;
                -webkit-overflow-scrolling: touch !important;
            }
            /* 2. KHUNG TRÒN CAMERA: Thu nhỏ đường kính 120px (25vh), dịch chuyển sang góc trái màn hình */
            #camera-wrapper, .camera-circle-wrapper {
                position: absolute !important;
                left: 20px !important;
                top: calc(50% + 24px) !important;
                transform: translateY(-50%) !important;
                right: auto !important;
                bottom: auto !important;
                margin: 0 !important;
                z-index: 10 !important;
            }
            .camera-container, #webcam-container {
                width: 120px !important;
                height: 120px !important;
                border-width: 3px !important;
                z-index: 10 !important;
            }
            .camera-container svg {
                width: 100% !important;
                height: 100% !important;
            }
            #instruction-hint {
                font-size: 9px !important;
                padding: 2px 6px !important;
                margin-top: 3px !important;
                max-width: 125px !important;
                text-align: center !important;
                white-space: normal !important;
                line-height: 1.2 !important;
            }
            /* 3. CÁC Ô ĐÁP ÁN TẠO DÁNG (A, B, C, D): Chuyển sang Grid 2x2 thích ứng, đẩy lên hiển thị rõ ràng */
            #layout-mc {
                position: absolute !important;
                left: 155px !important;
                right: 15px !important;
                top: 66px !important;
                bottom: 6px !important;
                width: calc(100% - 170px) !important;
                max-width: none !important;
                height: auto !important;
                display: grid !important;
                grid-template-columns: repeat(2, 1fr) !important;
                grid-template-rows: repeat(2, 1fr) !important;
                gap: 6px 10px !important;
                align-items: stretch !important;
                justify-items: stretch !important;
                padding: 0 !important;
                transform: none !important;
                z-index: 25 !important;
            }
            #layout-mc.hidden {
                display: none !important;
            }
            #layout-mc .option-card {
                position: relative !important;
                top: auto !important;
                bottom: auto !important;
                left: auto !important;
                right: auto !important;
                width: 100% !important;
                height: 100% !important;
                max-width: none !important;
                max-height: none !important;
                padding: 4px 8px !important;
                border-radius: 12px !important;
                display: flex !important;
                flex-direction: row !important;
                align-items: center !important;
                justify-content: flex-start !important;
                gap: 8px !important;
                box-sizing: border-box !important;
            }
            #layout-mc .stickman {
                width: 36px !important;
                height: 36px !important;
                min-width: 36px !important;
                margin-bottom: 0 !important;
                flex-shrink: 0 !important;
            }
            #layout-mc .option-card > div {
                font-size: 11px !important;
                line-height: 1.2 !important;
                margin-bottom: 0 !important;
                text-align: left !important;
                overflow: hidden !important;
                text-overflow: ellipsis !important;
                display: -webkit-box !important;
                -webkit-line-clamp: 2 !important;
                -webkit-box-orient: vertical !important;
            }
            #layout-mc .option-card .bg-yellow-400,
            #layout-mc .option-card .bg-blue-400,
            #layout-mc .option-card .bg-purple-400,
            #layout-mc .option-card .bg-green-400 {
                padding: 1px 4px !important;
                font-size: 10px !important;
                border-radius: 4px !important;
            }
            /* Dạng Đúng / Sai (TF) khi xoay ngang */
            #layout-tf {
                position: absolute !important;
                left: 155px !important;
                right: 15px !important;
                top: 66px !important;
                bottom: 6px !important;
                width: calc(100% - 170px) !important;
                max-width: none !important;
                height: auto !important;
                display: flex !important;
                flex-direction: row !important;
                gap: 12px !important;
                align-items: center !important;
                justify-content: center !important;
                padding: 0 !important;
                transform: none !important;
                z-index: 25 !important;
            }
            #layout-tf.hidden {
                display: none !important;
            }
            #layout-tf .option-card {
                position: relative !important;
                width: 48% !important;
                height: 85% !important;
                max-height: 140px !important;
                padding: 6px 12px !important;
                border-radius: 16px !important;
                display: flex !important;
                flex-direction: column !important;
                align-items: center !important;
                justify-content: center !important;
            }
            #tf-text-left, #tf-text-right {
                font-size: 18px !important;
                margin-bottom: 2px !important;
            }
            #layout-tf .option-card .text-sm {
                font-size: 9px !important;
                padding: 2px 6px !important;
            }
            /* HUD thu nhỏ khi xoay ngang */
            #top-left-hud {
                top: 3px !important;
                left: 6px !important;
                gap: 4px !important;
            }
            #top-left-hud .logo-avatar, #top-left-hud .w-14 {
                width: 24px !important;
                height: 24px !important;
            }
            #top-left-hud h1 {
                font-size: 11px !important;
            }
            #top-left-hud button, #top-left-hud #fullscreenToggleBtn {
                padding: 1px 5px !important;
                font-size: 9px !important;
            }
            #hud-topic-label {
                display: none !important;
            }
            #top-right-hud {
                top: 3px !important;
                right: 6px !important;
            }
            #top-right-hud .text-3xl {
                font-size: 12px !important;
            }
            #top-right-hud .text-lg {
                font-size: 10px !important;
            }
            #topic-selection-overlay > div,
            #admin-editor-modal > div,
            #pin-prompt-modal > div {
                max-height: 90dvh !important;
            }
            #yoga-topics-grid,
            #editor-questions-list {
                max-height: 55dvh !important;
            }
        }
      \`;
      document.head.appendChild(style);
    }
  } catch(e) {}
})();

// Fullscreen API đa nền tảng cho thiết bị di động
window.toggleMobileFullscreen = function() {
  try {
    const doc = document;
    const el = doc.documentElement;
    const isFs = doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement;
    if (!isFs) {
      if (el.requestFullscreen) { el.requestFullscreen().catch(()=>{}); }
      else if (el.webkitRequestFullscreen) { el.webkitRequestFullscreen(); }
      else if (el.mozRequestFullScreen) { el.mozRequestFullScreen(); }
      else if (el.msRequestFullscreen) { el.msRequestFullscreen(); }
    } else {
      if (doc.exitFullscreen) { doc.exitFullscreen().catch(()=>{}); }
      else if (doc.webkitExitFullscreen) { doc.webkitExitFullscreen(); }
      else if (doc.mozCancelFullScreen) { doc.mozCancelFullScreen(); }
      else if (doc.msExitFullscreen) { doc.msExitFullscreen(); }
    }
  } catch(e) {}
};

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
    htmlContent = htmlContent.replace('id="question-text-box" class="', 'id="question-text-box" class="question-box question-container ');
    htmlContent = htmlContent.replace('id="camera-wrapper" class="', 'id="camera-wrapper" class="camera-circle-wrapper ');
    htmlContent = htmlContent.replace('<div class="camera-container relative">', '<div id="webcam-container" class="camera-container relative">');
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
<style>
/* Khôi phục và ép hiển thị cố định khung câu hỏi Cờ Cá Ngựa */
#modal-container, #modal-container > div, #q-box, #a-box, .quiz-modal-card, .math-modal-box, .question-container, .quiz-box {
  z-index: 99999 !important;
}
#modal-container:not(:empty) {
  display: block !important;
  visibility: visible !important;
  position: absolute !important;
  inset: 0 !important;
  z-index: 99999 !important;
  pointer-events: auto !important;
}

/* 1. KÍCH HOẠT THANH CUỘN LƯỚT CHẠM TỰ DO TRÊN MOBILE (SCROLL VIEWPORT FIX) */
.game-play-screen, .ludo-main-layout, #game-container {
  width: 100% !important;
  height: auto !important;
  min-height: 100dvh !important;
  overflow-y: auto !important;
  -webkit-overflow-scrolling: touch !important;
}

@media (max-width: 768px) {
  html, body {
    height: auto !important;
    min-height: 100dvh !important;
    overflow-x: hidden !important;
    overflow-y: auto !important;
    -webkit-overflow-scrolling: touch !important;
  }
  #app {
    height: auto !important;
    min-height: 100dvh !important;
    overflow-y: visible !important;
    padding-bottom: 70px !important;
  }
}

@media (max-width: 768px) and (orientation: portrait) {
  #ludo-board, .ludo-board {
    width: min(88vw, 48dvh) !important;
    height: min(88vw, 48dvh) !important;
    max-width: min(88vw, 48dvh) !important;
    max-height: min(88vw, 48dvh) !important;
    margin: 0 auto !important;
    padding: 4px !important;
  }
  .ludo-controls-sidebar, .right-panel-controls, .dice-control-zone {
    width: 100% !important;
  }
  #dice-control, .current-turn-box, .dice-wrapper {
    width: 100% !important;
    max-width: 92vw !important;
    margin: 2px auto 0 !important;
  }
}

/* [CHỈ THỊ TỐI CAO: BẺ LAYOUT MOBILE XOAY NGANG THÀNH ĐỒNG BỘ 2 CỘT CHUẨN HÌNH LAPTOP] */
@media screen and (orientation: landscape) and (max-height: 500px) {
  /* 1. ÉP BUỘC KHUNG CHỨA CHÍNH DÀN HÀNG NGANG CHIA 2 CỘT */
  #game-container, 
  .game-play-screen, 
  .ludo-main-layout,
  body {
    display: flex !important;
    flex-direction: row !important; /* Phá vỡ hàng dọc, chuyển sang 2 cột song song như laptop */
    justify-content: space-between !important;
    align-items: center !important;
    width: 100vw !important;
    height: calc(100dvh - 35px) !important; /* Trừ khoảng trống Topbar */
    overflow-x: hidden !important;
    overflow-y: auto !important; /* Bật thanh cuộn vuốt lướt mượt mà chống nuốt nút */
    padding: 2px 10px !important;
    box-sizing: border-box !important;
  }

  #app {
    width: 100vw !important;
    max-width: 100vw !important;
    height: 100% !important;
    padding-bottom: 0 !important;
    display: flex !important;
    flex-direction: column !important;
    overflow: hidden !important;
  }

  #game-container {
    flex: 1 1 auto !important;
    height: calc(100dvh - 35px) !important;
  }

  /* 2. CỘT TRÁI: ĐỊNH VỊ BÀN CỜ VUÔNG VẮN KHÍT MÀN HÌNH */
  .ludo-board-container, 
  .board-wrapper,
  canvas#board-canvas,
  #board-container {
    width: auto !important;
    height: 86vh !important; /* Khống chế chiều cao khít viền điện thoại xoay ngang */
    aspect-ratio: 1 / 1 !important; /* Giữ chuẩn tỷ lệ bàn cờ vuông 10 ngang 10 dọc */
    max-height: 100% !important;
    flex-shrink: 0 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }

  #ludo-board, .ludo-board {
    height: 84vh !important;
    width: 84vh !important;
    max-height: 84vh !important;
    max-width: 84vh !important;
    aspect-ratio: 1 / 1 !important;
    padding: 4px !important;
    margin: 0 !important;
  }

  /* 3. CỘT PHẢI: HIỂN THỊ TRỌN VẸN BẢNG ĐIỂM, LƯỢT ĐI VÀ KHỐI XÚC XẮC ĐỂ GIEO */
  .ludo-controls-sidebar, 
  .right-panel-controls, 
  .sidebar-panel,
  #controls-container,
  .dice-control-zone {
    display: flex !important;
    flex-direction: column !important; /* Xếp dọc các bảng xếp hạng và xúc xắc theo cột phải */
    justify-content: center !important;
    align-items: center !important;
    width: 42% !important; /* Chiếm 42% không gian bên phải bàn cờ */
    height: 100% !important;
    gap: 6px !important;
    overflow-y: auto !important; /* Cho phép học sinh vuốt lướt cuộn dọc ở cột phải nếu màn hình ngắn */
    -webkit-overflow-scrolling: touch !important;
    flex-grow: 1 !important;
  }

  /* Khối hiển thị Xúc xắc ở cột bên phải */
  .current-turn-box, .dice-wrapper, #dice-container, #dice-control {
    background: rgba(15, 23, 42, 0.7) !important;
    border: 1px solid #38bdf8 !important;
    border-radius: 12px !important;
    padding: 6px !important;
    width: 95% !important;
    box-sizing: border-box !important;
  }

  #panel-left, #panel-right { display: none !important; }
  #game-header-bar { height: 32px !important; max-height: 32px !important; margin-bottom: 1px !important; }
  #game-title-header { font-size: 0.75rem !important; max-width: 30vw !important; }
}
</style>
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
      const topicBtn = document.getElementById('btn-chuyen-de');
      if (topicBtn && !topicBtn.dataset.listenerAttached) {
        topicBtn.dataset.listenerAttached = 'true';
        topicBtn.addEventListener('click', function(e) {
          e.preventDefault();
          if (typeof (window as any).openTopicMenu === 'function') {
            (window as any).openTopicMenu();
          } else if (typeof (window as any).renderSetup === 'function') {
            (window as any).renderSetup();
          }
        });
      }
    } catch(e) {}
  }

  function setupDiceClickListeners() {
    try {
      const diceElements = document.querySelectorAll('#dice-container, .dice-view, .dice-wrapper, #dice-element, #mini-dice, .current-turn-box, .dice-cube-wrapper');
      diceElements.forEach(element => {
        if (element && !element.dataset.diceListener) {
          element.dataset.diceListener = 'true';
          element.style.cursor = 'pointer';
          element.addEventListener('click', function(e) {
            if (e.target.tagName !== 'BUTTON') {
              e.preventDefault();
              if (typeof window.rollDice === 'function') { window.rollDice(); }
              else if (typeof (window as any).handleRollDice === 'function') { (window as any).handleRollDice(); }
            }
          });
          element.addEventListener('touchstart', function(e) {
            if (e.target.tagName !== 'BUTTON') {
              if (typeof window.rollDice === 'function') { window.rollDice(); }
              else if (typeof (window as any).handleRollDice === 'function') { (window as any).handleRollDice(); }
            }
          }, { passive: true });
        }
      });
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

  function restoreLudoQuestionDisplay() {
    try {
      const questionContainers = document.querySelectorAll('.question-container, .quiz-box, [class*="question"], [class*="quiz"], [id*="question"]');
      questionContainers.forEach(qc => {
        if ((qc as HTMLElement).id === 'modal-container') {
          if (typeof (window as any).state !== 'undefined' && ((window as any).state.phase === 'question' || (window as any).state.phase === 'show_answer')) {
            (qc as HTMLElement).style.display = 'block';
            (qc as HTMLElement).style.visibility = 'visible';
            (qc as HTMLElement).style.zIndex = '99999';
          }
        } else if ((qc as HTMLElement).id === 'q-box' || (qc as HTMLElement).id === 'a-box' || qc.classList.contains('quiz-modal-card') || qc.classList.contains('math-modal-box')) {
          (qc as HTMLElement).style.display = 'block';
          (qc as HTMLElement).style.visibility = 'visible';
          (qc as HTMLElement).style.zIndex = '99999';
        } else {
          if ((qc as HTMLElement).style.display === 'none' || (qc as HTMLElement).style.visibility === 'hidden') {
            (qc as HTMLElement).style.display = 'block';
            (qc as HTMLElement).style.visibility = 'visible';
          }
          (qc as HTMLElement).style.zIndex = '99999';
        }
      });
      const mc = document.getElementById('modal-container');
      if (mc && typeof (window as any).state !== 'undefined' && ((window as any).state.phase === 'question' || (window as any).state.phase === 'show_answer')) {
        mc.style.display = 'block';
        mc.style.visibility = 'visible';
        mc.style.zIndex = '99999';
      }
    } catch(e) {}
  }
  (window as any).restoreLudoQuestionDisplay = restoreLudoQuestionDisplay;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      syncCaNguaData();
      applyAdminSecurity();
      setupAdminButtons();
      setupDiceClickListeners();
      triggerMathTypeset();
      restoreLudoQuestionDisplay();
      setTimeout(restoreLudoQuestionDisplay, 800);
    });
  } else {
    syncCaNguaData();
    applyAdminSecurity();
    setupAdminButtons();
    setupDiceClickListeners();
    triggerMathTypeset();
    restoreLudoQuestionDisplay();
    setTimeout(restoreLudoQuestionDisplay, 800);
  }
  window.addEventListener('load', function() {
    syncCaNguaData();
    applyAdminSecurity();
    setupAdminButtons();
    setupDiceClickListeners();
    triggerMathTypeset();
    restoreLudoQuestionDisplay();
    setTimeout(restoreLudoQuestionDisplay, 800);
  });
  setInterval(() => {
    setupDiceClickListeners();
    restoreLudoQuestionDisplay();
  }, 1000);
})();
</script>
`;
    htmlContent = injectScriptAtTop(htmlContent, caNguaScript);
  }

  // NHÓM 5c: Game Tetris Xếp Gạch (Hỗ trợ Đa Chủ Đề, 3 dạng câu hỏi ABCD, Đúng/Sai, Trả lời ngắn & In-game Editor)
  // NHÓM 5c: Game Tetris Xếp Gạch (Hỗ trợ Đa Chủ Đề, 3 dạng câu hỏi ABCD, Đúng/Sai, Trả lời ngắn, Fallback Data & In-game Editor)
  else if (cleanUrl.includes('tetris') || cleanUrl.includes('Gametetris')) {
    let activeQuestions = [...questions];
    if (activeQuestions.length === 0) {
      try {
        const ws = DEFAULT_WORKSHEETS.find(w => 
          (w.title && (w.title.toLowerCase().includes('vuông góc') || w.title.toLowerCase().includes('hình học') || w.title.toLowerCase().includes('tetris'))) ||
          (w.id && (w.id.includes('hinh_hoc') || w.id.includes('11_') || w.id.includes('tetris')))
        ) || DEFAULT_WORKSHEETS.find(w => w.questions && w.questions.length >= 10) || DEFAULT_WORKSHEETS[0];
        
        if (ws && ws.questions && ws.questions.length > 0) {
          activeQuestions = ws.questions.map((q, idx) => ({
            id: q.id || `ws_tetris_fb_${idx}`,
            question: q.question,
            options: q.options || ['A', 'B', 'C', 'D'],
            correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
            explanation: q.solution || '',
            difficulty: idx % 3 === 0 ? 'Dễ' : (idx % 3 === 1 ? 'Trung bình' : 'Khó'),
            topic: ws.title || 'Chuyên đề: Hai Mặt Phẳng Vuông Góc'
          } as Question));
        }
      } catch (e) {
        console.warn('Lỗi lấy worksheet dự phòng cho Tetris:', e);
      }
    }

    const topicsMap: Record<string, { easy: any[], medium: any[], hard: any[] }> = {};
    const defaultTopic = gameTitle || 'Chuyên đề: Hai Mặt Phẳng Vuông Góc';

    activeQuestions.forEach(q => {
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
        imageUrl: q.imageUrl || '',
        statements: (q as any).statements || undefined
      });
    });

    const tetrisScript = `
<script>
// [ADAPTER ENGINE: TETRIS XẾP GẠCH - DỮ LIỆU ĐÓNG GÓI, DATA FALLBACK, IN-GAME EDITOR & SECURITY GATE]
window.__GAME_TITLE__ = ${JSON.stringify(gameTitle)};
window.__ADMIN_PIN__ = "2806";
window.__INJECTED_TETRIS_DATA__ = ${JSON.stringify(topicsMap, null, 2)};
if (window.__INJECTED_TETRIS_DATA__ && Object.keys(window.__INJECTED_TETRIS_DATA__).length > 0) {
  window.gameDatabase = JSON.parse(JSON.stringify(window.__INJECTED_TETRIS_DATA__));
}

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
      const isDesktop = (typeof window !== 'undefined' && window.innerWidth >= 768) && !(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
      const isLocalAdmin = typeof localStorage !== 'undefined' && (localStorage.getItem('tetris_is_admin') === 'true' || localStorage.getItem('app_user_role') === 'admin');
      const isAdmin = params.get('role') === 'admin' || params.get('role') === 'teacher' || params.get('preview') === 'true' || params.get('admin') === '1' || isLocalAdmin || (window as any).isAdmin || isDesktop;
      const adminTopbar = document.getElementById('admin-topbar');
      const adminBtns = document.querySelectorAll('#btn-admin-gear, #btn-chuyen-de, #btn-word-template, [data-admin-control="true"]');
      if (isAdmin) {
        if (adminTopbar) {
          adminTopbar.classList.remove('hidden');
          adminTopbar.style.setProperty('display', 'flex', 'important');
        }
        adminBtns.forEach(btn => {
          btn.classList.remove('hidden');
          btn.style.setProperty('display', 'inline-flex', 'important');
        });
      } else {
        if (adminTopbar) {
          adminTopbar.classList.add('hidden');
          adminTopbar.style.setProperty('display', 'none', 'important');
        }
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
      if (gearBtn) {
        gearBtn.onclick = function(e) {
          if (e) { e.preventDefault(); e.stopPropagation(); }
          if (typeof window.openAdminPinPrompt === 'function') {
            window.openAdminPinPrompt();
          }
        };
      }
      const topicBtn = document.getElementById('btn-chuyen-de');
      if (topicBtn) {
        topicBtn.onclick = function(e) {
          if (e) { e.preventDefault(); e.stopPropagation(); }
          if (typeof window.openTetrisTopicMenu === 'function') {
            window.openTetrisTopicMenu();
          }
        };
      }
      const wordBtn = document.getElementById('btn-word-template');
      if (wordBtn) {
        wordBtn.onclick = function(e) {
          if (e) { e.preventDefault(); e.stopPropagation(); }
          if (typeof (window as any).downloadTetrisWordTemplate === 'function') {
            (window as any).downloadTetrisWordTemplate();
          }
        };
      }
    } catch(e) {}
  }

  function setupFullscreen() {
    try {
      let _exporterLastFsTime = 0;
      window.toggleMobileFullscreen = function(e) {
        if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
        const now = Date.now();
        if (now - _exporterLastFsTime < 450) return;
        _exporterLastFsTime = now;

        const doc = document;
        const docEl = document.documentElement;
        const body = document.body;
        const isNative = !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement);
        const isForced = docEl.classList.contains('mobile-fullscreen-forced') || body.classList.contains('mobile-fullscreen-forced');

        if (!isNative && !isForced) {
          docEl.classList.add('mobile-fullscreen-forced');
          body.classList.add('mobile-fullscreen-forced');

          const rfs = docEl.requestFullscreen || docEl.webkitRequestFullscreen || docEl.webkitRequestFullScreen || docEl.mozRequestFullScreen || docEl.msRequestFullscreen;
          if (rfs) {
            try {
              const res = rfs.call(docEl);
              if (res && typeof res.then === 'function') {
                res.then(() => { updateFsUI(); }).catch(function() {});
              }
            } catch(e) {}
          }
          try {
            if (window.self !== window.top && window.parent) {
              window.parent.postMessage({ type: 'TOGGLE_FULLSCREEN', action: 'enter' }, '*');
            }
          } catch(e) {}
          try { window.scrollTo(0, 1); } catch(e) {}
          try {
            if (screen.orientation && typeof screen.orientation.lock === 'function') {
              screen.orientation.lock('landscape').catch(function() {});
            }
          } catch(e) {}
          updateFsUI();
        } else {
          docEl.classList.remove('mobile-fullscreen-forced');
          body.classList.remove('mobile-fullscreen-forced');
          if (isNative) {
            const efs = doc.exitFullscreen || doc.webkitExitFullscreen || doc.webkitCancelFullScreen || doc.mozCancelFullScreen || doc.msExitFullscreen;
            if (efs) { try { efs.call(doc); } catch(e) {} }
          }
          try {
            if (window.self !== window.top && window.parent) {
              window.parent.postMessage({ type: 'TOGGLE_FULLSCREEN', action: 'exit' }, '*');
            }
          } catch(e) {}
          try {
            if (screen.orientation && typeof screen.orientation.unlock === 'function') {
              screen.orientation.unlock();
            }
          } catch(e) {}
          updateFsUI();
        }

        setTimeout(() => {
          try { window.dispatchEvent(new Event('resize')); } catch(e) {}
        }, 180);
      };

      function updateFsUI() {
        const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement || document.documentElement.classList.contains('mobile-fullscreen-forced'));
        const fsIcon = document.getElementById('fullscreenIcon');
        const fsText = document.getElementById('fullscreenText');
        if (fsIcon) fsIcon.textContent = isFs ? '🗗' : '⛶';
        if (fsText) fsText.textContent = isFs ? '[ 🗗 ] THU NHỎ' : '[ ⛶ ] TOÀN MÀN HÌNH';
      }

      window.triggerToggleFullscreen = window.toggleMobileFullscreen;
      document.addEventListener('fullscreenchange', updateFsUI);
      document.addEventListener('webkitfullscreenchange', updateFsUI);

      const fsBtn = document.getElementById('fullscreenToggleBtn');
      if (fsBtn && !fsBtn.dataset.fsBound) {
        fsBtn.dataset.fsBound = 'true';
        fsBtn.addEventListener('click', window.toggleMobileFullscreen);
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

  function injectTetrisMobileStyle() {
    try {
      if (!document.getElementById('tetris-mobile-responsive-style')) {
        const style = document.createElement('style');
        style.id = 'tetris-mobile-responsive-style';
        style.textContent = \`
          @media screen and (max-width: 768px) {
              /* Ép toàn bộ khung sảnh chờ, menu và câu hỏi Tetris không bị tràn */
              .selection-screen-wrapper, .lobby-wrapper, #setup-container, [class*="tetris"], [class*="modal"], [class*="quiz"], div {
                  max-width: 100% !important;
                  box-sizing: border-box !important;
              }

              /* Khung chứa các thẻ chuyên đề sảnh chờ Tetris */
              .topic-card, .level-box, [class*="card"], [class*="item"] {
                  width: 100% !important;
                  max-width: 100% !important;
                  box-sizing: border-box !important;
                  padding: 8px 10px !important;
                  margin: 6px auto !important;
                  word-break: break-word !important;
                  overflow-wrap: break-word !important;
                  white-space: normal !important;
              }

              /* Tiêu đề chuyên đề / Câu hỏi / Đáp án: Bắt buộc co giãn và xuống dòng */
              h1, h2, h3, h4, p, span, div, button, 
              [class*="question"], [class*="answer"], [class*="title"], [class*="text"] {
                  max-width: 100% !important;
                  word-break: break-word !important;
                  overflow-wrap: break-word !important;
                  white-space: normal !important;
                  box-sizing: border-box !important;
              }

              /* Riêng các nút đáp án (A, B, C, D) cho phép hiển thị linh hoạt nhiều dòng */
              .answer-btn, [class*="answer"], [class*="option"], button[class*="choice"], button[class*="option"], button[class*="answer"], .option-btn {
                  width: 100% !important;
                  max-width: 100% !important;
                  height: auto !important;
                  min-height: 50px !important;
                  padding: 10px 14px !important;
                  font-size: 0.85rem !important;
                  line-height: 1.35 !important;
                  white-space: normal !important;
                  word-break: break-word !important;
                  overflow-wrap: break-word !important;
                  box-sizing: border-box !important;
                  display: flex !important;
                  align-items: center !important;
                  text-align: left !important;
              }

              .answer-text-container, .answer-text {
                  display: block !important;
                  width: 100% !important;
                  max-width: 100% !important;
                  height: auto !important;
                  white-space: normal !important;
                  word-break: break-word !important;
                  overflow-wrap: break-word !important;
                  box-sizing: border-box !important;
              }

              /* Hỗ trợ công thức MathJax co giãn và chống tràn trên mobile */
              mjx-container {
                  max-width: 100% !important;
                  box-sizing: border-box !important;
                  overflow-x: auto !important;
                  overflow-y: hidden !important;
                  vertical-align: middle !important;
              }
          }
        \`;
        document.head.appendChild(style);
      }
    } catch(e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      injectTetrisMobileStyle();
      syncTetrisData();
      applyAdminSecurity();
      setupAdminButtons();
      setupFullscreen();
      triggerMathTypeset();
    });
  } else {
    injectTetrisMobileStyle();
    syncTetrisData();
    applyAdminSecurity();
    setupAdminButtons();
    setupFullscreen();
    triggerMathTypeset();
  }
  window.addEventListener('load', function() {
    injectTetrisMobileStyle();
    syncTetrisData();
    applyAdminSecurity();
    setupAdminButtons();
    setupFullscreen();
    triggerMathTypeset();
  });
})();
</script>
`;
    htmlContent = injectScriptAtTop(htmlContent, tetrisScript);
  }

  // NHÓM 5d: Game Mario Math (Hỗ trợ 3 Chuyên đề, 3 dạng câu hỏi ABCD, Đúng/Sai, Trả lời ngắn, Fallback Data, In-game Editor & Auto-Sampling)
  else if (cleanUrl.includes('mario') || cleanUrl.includes('Gamemario')) {
    let activeQuestions = [...questions];
    if (activeQuestions.length === 0) {
      try {
        const ws = DEFAULT_WORKSHEETS.find(w => 
          (w.title && (w.title.toLowerCase().includes('xác suất') || w.title.toLowerCase().includes('biến cố') || w.title.toLowerCase().includes('mario'))) ||
          (w.id && (w.id.includes('xac_suat') || w.id.includes('11_07') || w.id.includes('11_08') || w.id.includes('mario')))
        ) || DEFAULT_WORKSHEETS.find(w => w.questions && w.questions.length >= 8) || DEFAULT_WORKSHEETS[0];
        
        if (ws && ws.questions && ws.questions.length > 0) {
          activeQuestions = ws.questions.map((q, idx) => ({
            id: q.id || `ws_mario_fb_${idx}`,
            question: q.question,
            options: q.options || ['A', 'B', 'C', 'D'],
            correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
            explanation: q.solution || '',
            difficulty: idx % 3 === 0 ? 'Dễ' : (idx % 3 === 1 ? 'Trung bình' : 'Khó'),
            topic: ws.title || 'Chuyên đề 1: Biến cố giao & Biến cố độc lập'
          } as Question));
        }
      } catch (e) {
        console.warn('Lỗi lấy worksheet dự phòng cho Mario:', e);
      }
    }

    const topicsMap: Record<string, { easy: any[], medium: any[], hard: any[] }> = {};
    const defaultTopic = gameTitle || 'Chuyên đề 1: Biến cố giao & Biến cố độc lập';

    activeQuestions.forEach(q => {
      let topicName = q.topic?.trim() || defaultTopic;
      const tLow = topicName.toLowerCase();
      if (tLow.includes('chuyên đề 1') || tLow.includes('chủ đề 1') || (tLow.includes('giao') && tLow.includes('độc lập'))) {
        topicName = 'Chuyên đề 1: Biến cố giao & Biến cố độc lập';
      } else if (tLow.includes('chuyên đề 2') || tLow.includes('chủ đề 2') || (tLow.includes('hợp') && tLow.includes('xung khắc'))) {
        topicName = 'Chuyên đề 2: Biến cố hợp & Biến cố xung khắc';
      } else if (tLow.includes('chuyên đề 3') || tLow.includes('chủ đề 3') || (tLow.includes('cộng') && tLow.includes('nhân'))) {
        topicName = 'Chuyên đề 3: Công thức cộng & nhân xác suất tổng hợp';
      }

      if (!topicsMap[topicName]) {
        topicsMap[topicName] = { easy: [], medium: [], hard: [] };
      }
      const diffKey = q.difficulty === 'Dễ' ? 'easy' : (q.difficulty === 'Khó' ? 'hard' : 'medium');
      const isTF = (q.options && q.options.length === 2) || (typeof q.question === 'string' && q.question.startsWith('ĐÚNG HAY SAI:')) || (q as any).type === 'truefalse';
      const isShort = (q.options && q.options.length === 1) || (q as any).type === 'short_answer';

      topicsMap[topicName][diffKey].push({
        id: q.id,
        q: normalizeMathFormulas(q.question),
        options: (q.options && q.options.length > 0) ? q.options.map(o => {
          let answerString = normalizeMathFormulas(o);
          // Lọc bỏ an toàn ký tự rác \f hoặc \f\f mà không làm gãy lệnh \frac
          if (typeof answerString === 'string') {
            answerString = answerString.replace(/\\f\\f/g, '').replace(/\\f(?![a-zA-Z])/g, '');
            answerString = answerString.replace(/(?:^|[^\\])\brac\s*\{/g, (m) => m.replace('rac{', '\\frac{'));
            answerString = answerString.replace(/^rac\s*\{/g, '\\frac{');
            answerString = answerString.replace(/\bAcapB\b/g, 'A \\cap B').replace(/\bAcupB\b/g, 'A \\cup B');
            answerString = answerString.replace(/(\d*)\s*\\?cdot\s*(\d*)/g, (match, p1, p2) => {
              if (p1 || p2) return (p1 ? p1 + ' ' : '') + '\\cdot' + (p2 ? ' ' + p2 : '');
              return ' \\cdot ';
            });
            answerString = answerString.replace(/(\d*)cdot(\d*)/g, '$1 \\cdot $2');
            answerString = answerString.replace(/(?<!\\)cdot/g, '\\cdot');
            answerString = answerString.replace(/([0-9a-zA-Z\)\}\]])\s*\\cdot/g, '$1 \\cdot');
            answerString = answerString.replace(/\\cdot\s*([0-9a-zA-Z\(\{\\])/g, '\\cdot $1');
            answerString = answerString.replace(/\s*\\cdot\s*/g, ' \\cdot ');
          }
          return answerString;
        }) : ['A', 'B', 'C', 'D'],
        correct: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
        explanation: normalizeMathFormulas(q.explanation || ''),
        type: isShort ? 'short_answer' : (isTF ? 'truefalse' : 'abcd'),
        imageUrl: q.imageUrl || ''
      });
    });

    const marioScript = `
<script>
// [ADAPTER ENGINE: MARIO MATH - DỮ LIỆU ĐÓNG GÓI, DATA FALLBACK, IN-GAME EDITOR & SECURITY GATE]
window.__GAME_TITLE__ = ${JSON.stringify(gameTitle)};
window.__ADMIN_PIN__ = "2806";
window.__INJECTED_MARIO_DATA__ = ${JSON.stringify(topicsMap, null, 2)};
if (window.__INJECTED_MARIO_DATA__ && Object.keys(window.__INJECTED_MARIO_DATA__).length > 0) {
  window.gameDatabase = JSON.parse(JSON.stringify(window.__INJECTED_MARIO_DATA__));
}

(function() {
  function syncMarioData() {
    if (window.__INJECTED_MARIO_DATA__ && Object.keys(window.__INJECTED_MARIO_DATA__).length > 0) {
      window.gameDatabase = JSON.parse(JSON.stringify(window.__INJECTED_MARIO_DATA__));
      if (!window.selectedTopic || !window.gameDatabase[window.selectedTopic]) {
        window.selectedTopic = Object.keys(window.gameDatabase)[0];
      }
      if (typeof renderMarioTopicMenuCards === 'function') {
        renderMarioTopicMenuCards();
      }
      if (typeof selectMarioTopic === 'function') {
        selectMarioTopic(window.selectedTopic, false);
      }
    } else {
      if (typeof ensureMarioDatabase === 'function') {
        ensureMarioDatabase();
      }
      if (typeof renderMarioTopicMenuCards === 'function') {
        renderMarioTopicMenuCards();
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
      if (gearBtn) {
        gearBtn.onclick = function(e) {
          if (e) { e.preventDefault(); e.stopPropagation(); }
          if (typeof window.openAdminPinPrompt === 'function') {
            window.openAdminPinPrompt();
          }
        };
      }
      const topicBtn = document.getElementById('btn-chuyen-de');
      if (topicBtn) {
        topicBtn.onclick = function(e) {
          if (e) { e.preventDefault(); e.stopPropagation(); }
          if (typeof window.openMarioTopicMenu === 'function') {
            window.openMarioTopicMenu();
          }
        };
      }
    } catch(e) {}
  }

  function setupFullscreen() {
    try {
      let _exporterLastFsTime = 0;
      window.toggleMobileFullscreen = function(e) {
        if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
        const now = Date.now();
        if (now - _exporterLastFsTime < 450) return;
        _exporterLastFsTime = now;

        const doc = document;
        const docEl = document.documentElement;
        const body = document.body;
        const isNative = !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement);
        const isForced = docEl.classList.contains('mobile-fullscreen-forced') || body.classList.contains('mobile-fullscreen-forced');

        if (!isNative && !isForced) {
          docEl.classList.add('mobile-fullscreen-forced');
          body.classList.add('mobile-fullscreen-forced');
          body.style.setProperty('overflow-y', 'auto', 'important');
          body.style.setProperty('-webkit-overflow-scrolling', 'touch', 'important');

          const rfs = docEl.requestFullscreen || docEl.webkitRequestFullscreen || docEl.webkitRequestFullScreen || docEl.mozRequestFullScreen || docEl.msRequestFullscreen;
          if (rfs) {
            try {
              const res = rfs.call(docEl);
              if (res && typeof res.then === 'function') {
                res.then(() => { updateFsUI(); }).catch(function() {});
              }
            } catch(e) {}
          }
          try {
            if (window.self !== window.top && window.parent) {
              window.parent.postMessage({ type: 'TOGGLE_FULLSCREEN', action: 'enter' }, '*');
            }
          } catch(e) {}
          try { window.scrollTo(0, 1); } catch(e) {}
          try {
            if (screen.orientation && typeof screen.orientation.lock === 'function') {
              screen.orientation.lock('landscape').catch(function() {});
            }
          } catch(e) {}
          updateFsUI();
        } else {
          docEl.classList.remove('mobile-fullscreen-forced');
          body.classList.remove('mobile-fullscreen-forced');
          body.style.removeProperty('overflow-y');
          body.style.removeProperty('-webkit-overflow-scrolling');
          if (isNative) {
            const efs = doc.exitFullscreen || doc.webkitExitFullscreen || doc.webkitCancelFullScreen || doc.mozCancelFullScreen || doc.msExitFullscreen;
            if (efs) { try { efs.call(doc); } catch(e) {} }
          }
          try {
            if (window.self !== window.top && window.parent) {
              window.parent.postMessage({ type: 'TOGGLE_FULLSCREEN', action: 'exit' }, '*');
            }
          } catch(e) {}
          try {
            if (screen.orientation && typeof screen.orientation.unlock === 'function') {
              screen.orientation.unlock();
            }
          } catch(e) {}
          updateFsUI();
        }

        setTimeout(() => {
          try { window.dispatchEvent(new Event('resize')); } catch(e) {}
        }, 180);
      };

      function updateFsUI() {
        const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement || document.documentElement.classList.contains('mobile-fullscreen-forced'));
        if (isFs) {
          document.body.style.setProperty('overflow-y', 'auto', 'important');
          document.body.style.setProperty('-webkit-overflow-scrolling', 'touch', 'important');
        }
        const fsIcon = document.getElementById('fullscreenIcon');
        const fsText = document.getElementById('fullscreenText');
        if (fsIcon) fsIcon.textContent = isFs ? '🗗' : '⛶';
        if (fsText) fsText.textContent = isFs ? '[ 🗗 ] THU NHỎ' : '[ ⛶ ] TOÀN MÀN HÌNH';
      }

      window.triggerToggleFullscreen = window.toggleMobileFullscreen;
      document.addEventListener('fullscreenchange', updateFsUI);
      document.addEventListener('webkitfullscreenchange', updateFsUI);

      const fsBtn = document.getElementById('fullscreenToggleBtn');
      if (fsBtn && !fsBtn.dataset.fsBound) {
        fsBtn.dataset.fsBound = 'true';
        fsBtn.addEventListener('click', window.toggleMobileFullscreen);
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
      syncMarioData();
      applyAdminSecurity();
      setupAdminButtons();
      setupFullscreen();
      triggerMathTypeset();
    });
  } else {
    syncMarioData();
    applyAdminSecurity();
    setupAdminButtons();
    setupFullscreen();
    triggerMathTypeset();
  }
  window.addEventListener('load', function() {
    syncMarioData();
    applyAdminSecurity();
    setupAdminButtons();
    setupFullscreen();
    triggerMathTypeset();
  });
})();
</script>
`;
    htmlContent = injectScriptAtTop(htmlContent, marioScript);
  }

  // NHÓM 6: CÁC GAME CHUẨN CÒN LẠI (Cầu Cá, Rắn Săn...)
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

  // BỔ SUNG HOOK ĐỒNG BỘ FILE VẬT LÝ VÀO SERVER KHI LƯU ĐỀ BÀI TRONG GAME
  const globalSyncHook = `
<script id="__AUTO_PHYSICAL_SYNC_HOOK__">
(function() {
  function formatMathStringToTeX(rawContent) {
    if (typeof rawContent !== 'string') return rawContent;
    var cleanContent = rawContent;

    // Tiêu diệt triệt để mã rác \d\d, \d\frac, \ddfrac đứng trước phân số, khôi phục vĩnh viễn \frac chuẩn
    cleanContent = cleanContent.replace(/\\+d+\\+d*frac/gi, '\\frac')
                               .replace(/\\+d+\\+d*\\+frac/gi, '\\frac')
                               .replace(/\\+d+\\s*\\+frac/gi, '\\frac')
                               .replace(/\\+d+\\+d+(?=\\s*\\?frac)/gi, '')
                               .replace(/\\d\\d(?=\\s*\\?frac)/gi, '')
                               .replace(/\\ddfrac/gi, '\\frac')
                               .replace(/\\dfrac/gi, '\\frac')
                               .replace(/\\d\\frac/gi, '\\frac');

    // ÉP BUỘC: Sử dụng chính xác bộ lọc xử lý dữ liệu từ file mẫu của giáo viên để quét sạch lỗi sinh chữ \f thừa đứng trước \frac
    cleanContent = cleanContent.replace(/\\f\\frac/g, '\\frac')
                               .replace(/\\f\s*\\frac/g, '\\frac')
                               .replace(/\\ffrac/g, '\\frac')
                               .replace(/\\f/g, ''); // Khử sạch các ký tự \f cô độc

    // Phục hồi chữ "frac" nếu hệ thống cũ lỡ làm gãy chữ thành "rac" (chống nuốt chữ trong \dfrac hay \frac)
    cleanContent = cleanContent.replace(/\\+rac\s*\{/g, '\\frac{')
                               .replace(/(?<![a-zA-Z\\])rac\s*\{/g, '\\frac{');

    // Tự động chèn khoảng trắng mảnh ngăn dính chữ tiếng Việt (Ví dụ: "0trong", "]là:")
    cleanContent = cleanContent.replace(/(\d+)(trong|đoạn|là|có)/g, '$1 $2');
    var cleanStr = cleanContent;
    cleanStr = cleanStr.replace(/(\))(trong|đoạn|là)/g, '$1 $2');
    cleanContent = cleanStr;
    cleanContent = cleanContent.replace(/\]là\:/g, '\] là:');

    // Khử hoàn toàn lỗi lặp dấu gạch chéo (double escape) bảo vệ các ký hiệu \sqrt, \le, \ge, \ne
    cleanContent = cleanContent.replace(/\\\\\\\\/g, '\\\\');

    return cleanContent;
  }
  window.formatMathStringToTeX = formatMathStringToTeX;

  function escapeRawLaTeXSlash(rawStr) {
    if (typeof rawStr !== 'string') return rawStr || '';
    var safeStr = formatMathStringToTeX(rawStr);
    safeStr = safeStr.replace(/\\f\\f/g, '').replace(/\\f(?![a-zA-Z])/g, '').replace(/[\u000c\x0c]/g, '');
    var strictKeywords = ['frac', 'sqrt', 'cdot', 'ne', 'neq', 'le', 'leq', 'ge', 'geq', 'perp', 'parallel', 'alpha', 'beta', 'cup', 'cap', 'in'];
    strictKeywords.forEach(function(keyword) {
      var regexNoSlash = new RegExp('(?<!\\\\)\\\\b' + keyword + '\\\\b', 'g');
      safeStr = safeStr.replace(regexNoSlash, '\\\\\\\\' + keyword);
      var regexSingleSlash = new RegExp('(?<!\\\\)\\\\(?!\\\\)' + keyword + '\\\\b', 'g');
      safeStr = safeStr.replace(regexSingleSlash, '\\\\\\\\' + keyword);
    });
    return safeStr;
  }
  function sanitizeObjectLaTeXSlashes(obj) {
    if (typeof obj === 'string') return formatMathStringToTeX(escapeRawLaTeXSlash(obj));
    if (Array.isArray(obj)) return obj.map(function(item) { return sanitizeObjectLaTeXSlashes(item); });
    if (obj !== null && typeof obj === 'object') {
      var res = {};
      for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          res[key] = sanitizeObjectLaTeXSlashes(obj[key]);
        }
      }
      return res;
    }
    return obj;
  }
  window.escapeRawLaTeXSlash = escapeRawLaTeXSlash;
  window.sanitizeObjectLaTeXSlashes = sanitizeObjectLaTeXSlashes;

  function applyTex2jaxProcess() {
    var selectors = [
      '.question', '.q-text', '.stem', '#question', '#questionText', '#stem', '#q-text',
      '.option', '.answer-btn', '.btn-abcd', '.opt-btn', '.option-btn', '.answer-option',
      '.card', '.card-func', '.card-prop', '.pair-card', '.tile', '.flip-card',
      '.math-content', '.math-text', '[class*="question"]', '[class*="answer"]', '[class*="option"]', '[class*="card"]'
    ];
    selectors.forEach(function(sel) {
      document.querySelectorAll(sel).forEach(function(el) {
        if (!el.classList.contains('tex2jax_process')) {
          el.classList.add('tex2jax_process');
        }
      });
    });
    if (document.body && !document.body.classList.contains('tex2jax_process')) {
      document.body.classList.add('tex2jax_process');
    }
  }

  function triggerMathTypeset() {
    try {
      applyTex2jaxProcess();
      if (window.MathJax && window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise().catch(function() {});
      }
    } catch(e) {}
  }
  function normalizeSystemMathString(rawInput, isCanvas) {
    if (!rawInput || typeof rawInput !== 'string') return rawInput || '';
    var text = rawInput.trim();
    text = text.replace(/\\f\\f/g, '').replace(/\\f/g, '').replace(/[\u000c\x0c]/g, '');
    text = text.replace(/\\?f?rac\{/g, '\\frac{').replace(/\brac\{/g, '\\frac{');
    text = text.replace(/([a-zA-Zà-ỹÀ-Ỹ0-9])\\(\(|\[)/g, '$1 \\$2');
    text = text.replace(/\\(\)|\])([a-zA-Zà-ỹÀ-Ỹ0-9])/g, '\\$1 $2');
    text = text.replace(/([a-zA-Zà-ỹÀ-Ỹ0-9])\$/g, '$1 $');
    text = text.replace(/\$([a-zA-Zà-ỹÀ-Ỹ0-9])/g, '$ $1');
    text = text.replace(/\^\{?([^}]+)\}?\/_?\{?([^}]+)\}?/g, '\\frac{$1}{$2}');
    text = text.replace(/\\sqrt\s*\/?[xX]\s*-\s*1/g, '\\sqrt{x - 1}');
    text = text.replace(/\\sqrt\s+([a-zA-Z0-9]+)\s*([+\-])\s*([a-zA-Z0-9]+)/g, '\\sqrt{$1 $2 $3}');
    text = text.replace(/x\^2/g, 'x^{2}');
    text = text.replace(/(\d*)\s*cdot\s*(\d*)/g, '$1 \\cdot $2');
    text = text.replace(/(?<!\\)cdot/g, '\\cdot');
    text = text.replace(/\\do\b/g, isCanvas ? '°' : '^{\\circ}');
    if (isCanvas) {
      text = text.replace(/\\\(|\\\)|\\\[|\\\]|\$/g, '')
                 .replace(/\^\{\\circ\}|\^\\circ/g, '°')
                 .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
                 .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
                 .replace(/\\cdot/g, '·')
                 .trim();
    } else {
      if (!text.includes('\\(') && !text.includes('$')) {
        if (/[\\^_{}]|sqrt|frac|cdot|circ|le|ge|ne|Omega|cup|cap/.test(text)) {
          text = '\\(' + text + '\\)';
        }
      }
    }
    return text;
  }
  window.normalizeSystemMathString = normalizeSystemMathString;
  window.triggerMathTypeset = triggerMathTypeset;
  window.applyTex2jaxProcess = applyTex2jaxProcess;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      applyTex2jaxProcess();
      triggerMathTypeset();
    });
  } else {
    applyTex2jaxProcess();
    triggerMathTypeset();
  }
  window.addEventListener('load', function() {
    applyTex2jaxProcess();
    triggerMathTypeset();
  });

  try {
    var obs = new MutationObserver(function() {
      applyTex2jaxProcess();
    });
    obs.observe(document.documentElement, { childList: true, subtree: true });
  } catch(e) {}

  function triggerServerPhysicalSync() {
    try {
      var targetPath = window.location.pathname;
      if (!targetPath || targetPath === '/' || !targetPath.includes('.html')) {
        return;
      }
      var payload = {
        fileUrl: targetPath,
        quizData: sanitizeObjectLaTeXSlashes(window.quizData || (typeof QUESTION_BANK !== 'undefined' ? QUESTION_BANK : null)),
        gameDatabase: sanitizeObjectLaTeXSlashes(window.gameDatabase),
        penaltyDatabase: sanitizeObjectLaTeXSlashes((window).penaltyDatabase)
      };
      fetch('/api/games/sync-html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function(res) {
        return res.json();
      }).then(function(data) {
        if (data && data.success) {
          console.log('[PHYSICAL SYNC SUCCESS]', data.message);
        }
      }).catch(function(err) {
        console.warn('[PHYSICAL SYNC OFFLINE]', err);
      });
    } catch(e) {}
  }

  document.addEventListener('click', function(e) {
    var target = e.target;
    if (!target) return;
    var btn = target.closest ? target.closest('button, [role="button"]') : target;
    if (!btn) return;

    var btnId = btn.id || '';
    var btnText = (btn.textContent || '').toUpperCase();
    var btnOnClick = String(btn.getAttribute('onclick') || '');

    if (
      btnId === 'btn-save-questions' ||
      btnId === 'btn-save-data' ||
      btnId === 'btn-save-changes' ||
      btnText.includes('LƯU THAY ĐỔI') ||
      btnText.includes('LƯU CÂU HỎI') ||
      btnText.includes('LƯU DỮ LIỆU') ||
      btnOnClick.includes('saveEditor') ||
      btnOnClick.includes('saveAdmin')
    ) {
      setTimeout(triggerServerPhysicalSync, 300);
      setTimeout(triggerServerPhysicalSync, 1200);
    }
  }, true);

  window.triggerServerPhysicalSync = triggerServerPhysicalSync;
})();
</script>
`;
  htmlContent = injectScriptAtTop(htmlContent, globalSyncHook);

  // 5. TIÊM ĐÚNG CẤU HÌNH MATHJAX CORE THEO FILE MẪU CHUẨN CỦA GIÁO VIÊN
  const teacherMathJaxCore = `
<script>
    window.MathJax = {
        tex: {
            inlineMath: [['\\\\(', '\\\\)'], ['$', '$']],
            displayMath: [['\\\\[', '\\\\]'], ['$$', '$$']],
            processEscapes: true
        },
        options: {
            ignoreHtmlClass: 'tex2jax_ignore|katex|katex-mathml|katex-html',
            processHtmlClass: 'tex2jax_process'
        }
    };
</script>
<script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
`;

  // Thay thế cấu hình cũ nếu có (chỉ khớp chính xác thẻ script chứa window.MathJax, không nuốt các thẻ script trước đó)
  const existingMjConfigRegex = /<script\b[^>]*>(?:(?!<\/script>)[\s\S])*?window\.MathJax\s*=(?:(?!<\/script>)[\s\S])*?<\/script>/i;
  if (existingMjConfigRegex.test(htmlContent)) {
    htmlContent = htmlContent.replace(existingMjConfigRegex, () => teacherMathJaxCore.trim());
  }
  // Gỡ bỏ MathJax-script cũ nếu có
  if (htmlContent.includes('id="MathJax-script"')) {
    htmlContent = htmlContent.replace(/<script\b[^>]*id=["']MathJax-script["'][^>]*>[\s\S]*?<\/script>/gi, '');
  }
  // Nếu chưa có processHtmlClass, tiêm vào
  if (!htmlContent.includes("processHtmlClass: 'tex2jax_process'")) {
    if (htmlContent.includes('</head>')) {
      htmlContent = htmlContent.replace('</head>', () => `${teacherMathJaxCore}\n</head>`);
    } else {
      htmlContent = injectScriptAtTop(htmlContent, teacherMathJaxCore);
    }
  }

  // 6. TIÊM CSS TỐI CAO TRIỆT TIÊU KHUNG VIỀN HỘP MATHJAX VÀ ÉP NẰM THẲNG MỘT DÒNG
  const mathjaxNoBoxStyle = `
<style id="mathjax-no-bounding-box-style">
/* Triệt tiêu hoàn toàn viền hình chữ nhật gỡ lỗi của MathJax và ép thẳng 1 dòng */
mjx-container, .mjx-chtml, mjx-math, mjx-mo, .zombie-math-text, .tex2jax_process, .math-content, .math-text, .MathJax, [class*="math-"] {
    outline: none !important;
    border: none !important;
    box-shadow: none !important;
    display: inline-block !important;
    overflow: visible !important;
}
mjx-line, mjx-frac mjx-line, mjx-dtable mjx-line {
    display: block !important;
    box-sizing: border-box !important;
    min-height: 1px !important;
    height: 0.08em !important;
    border-top: 0.08em solid currentColor !important;
    opacity: 1 !important;
    visibility: visible !important;
    margin: 0.06em 0 !important;
}
mjx-sqrt > mjx-box, mjx-box {
    border-top: 0.08em solid currentColor !important;
    opacity: 1 !important;
    visibility: visible !important;
}

/* ======================================================== */
/* ÉP TIÊU ĐỀ CÂU HỎI & CÔNG THỨC TOÁN TỰ ĐỘNG XUỐNG HÀNG  */
/* ======================================================== */
/* 1. Ép toàn bộ khung chứa câu hỏi co giãn tuyệt đối trong box */
.question-container, .quiz-box, [class*="question"], [class*="modal"], [class*="card"], div {
    max-width: 100% !important;
    box-sizing: border-box !important;
    overflow-x: hidden !important;
}

/* 2. Bắt buộc tiêu đề câu hỏi và các thành phần bên trong phải xuống hàng, không được tràn */
.question-text, [class*="question-text"], h2, h3, p, div[class*="question"] {
    width: 100% !important;
    max-width: 100% !important;
    white-space: normal !important;
    word-break: break-word !important;
    overflow-wrap: break-word !important;
    line-height: 1.5 !important;
}

/* 3. Buộc các khối công thức MathJax / LaTeX tự động xuống hàng theo dòng chảy văn bản */
mjx-container, .MathJax, .MathJax_Display, math {
    max-width: 100% !important;
    white-space: normal !important;
    overflow-x: auto !important;
    overflow-y: hidden !important;
    word-break: break-word !important;
    display: inline-block !important;
    vertical-align: middle !important;
}

/* 4. Đảm bảo các nút đáp án co giãn ôm khít box */
.answer-btn, [class*="answer"], [class*="option"], button[class*="choice"], .grid-cols-2 > div {
    width: 100% !important;
    max-width: 100% !important;
    height: auto !important;
    min-height: 48px !important;
    padding: 10px 14px !important;
    white-space: normal !important;
    word-break: break-word !important;
    box-sizing: border-box !important;
}
</style>
`;
  if (!htmlContent.includes('id="mathjax-no-bounding-box-style"')) {
    if (htmlContent.includes('</head>')) {
      htmlContent = htmlContent.replace('</head>', () => `${mathjaxNoBoxStyle}\n</head>`);
    } else {
      htmlContent = `${mathjaxNoBoxStyle}\n${htmlContent}`;
    }
  }

  return htmlContent;
}

function injectScriptAtTop(html: string, scriptBlock: string): string {
  if (html.includes('<script>')) {
    return html.replace('<script>', () => `${scriptBlock}\n<script>`);
  } else if (html.includes('<script')) {
    const firstScriptIdx = html.indexOf('<script');
    return html.slice(0, firstScriptIdx) + scriptBlock + '\n' + html.slice(firstScriptIdx);
  } else if (html.includes('</head>')) {
    return html.replace('</head>', () => `${scriptBlock}\n</head>`);
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
