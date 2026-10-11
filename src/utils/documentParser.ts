import { Question, Difficulty } from '../types';

declare global {
  interface Window {
    mammoth?: any;
    XLSX?: any;
  }
}

/**
 * Tự động nạp thư viện xử lý tài liệu từ CDN an toàn
 */
export async function loadDocumentLibraries(): Promise<{ mammoth: any; XLSX: any }> {
  const loadScript = (src: string, globalName: string) => {
    return new Promise((resolve, reject) => {
      if ((window as any)[globalName]) return resolve((window as any)[globalName]);
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        existing.addEventListener('load', () => resolve((window as any)[globalName]));
        existing.addEventListener('error', reject);
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = () => resolve((window as any)[globalName]);
      script.onerror = () => reject(new Error(`Không thể tải thư viện từ: ${src}`));
      document.head.appendChild(script);
    });
  };

  const [mammoth, XLSX] = await Promise.all([
    loadScript('https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js', 'mammoth'),
    loadScript('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js', 'XLSX')
  ]);

  return { mammoth, XLSX };
}

/**
 * Đọc nội dung thô từ file Word (.docx)
 */
export async function extractTextFromDocx(file: File): Promise<string> {
  const { mammoth } = await loadDocumentLibraries();
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value || '';
}

/**
 * Đọc nội dung thô từ file Excel (.xlsx, .xls)
 */
export async function extractTextFromExcel(file: File): Promise<string> {
  const { XLSX } = await loadDocumentLibraries();
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  // Chuyển sang dạng CSV hoặc text để phân tích linh hoạt
  return XLSX.utils.sheet_to_csv(worksheet);
}

/**
 * BỘ PHÂN TÍCH THÔNG MINH ĐA CẤP (HIERARCHICAL TREE PARSER)
 * Cấp 1: Chuyên đề
 * Cấp 2: Cấp độ (L1 -> L5 hoặc Dễ / Vừa / Khó)
 * Cấp 3: Cặp ghép đôi [Thẻ tiêu đề gốc] + [Các thẻ thuộc tính đúng]
 * Hoặc Trắc nghiệm tiêu chuẩn (Câu 1, A, B, C, D)
 */
export function parseDocumentQuestions(rawText: string, defaultTopic: string = 'Toán học'): Question[] {
  if (!rawText || !rawText.trim()) return [];

  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const result: Question[] = [];

  let currentTopic = defaultTopic;
  let currentDifficulty: Difficulty = 'Trung bình';
  let currentRootCard: string | null = null;
  let currentProps: string[] = [];

  const flushCurrentPair = () => {
    if (currentRootCard && currentProps.length > 0) {
      // Đảm bảo tối thiểu 4 lựa chọn cho cặp ghép đôi
      const options = [...currentProps];
      while (options.length < 4) {
        options.push(`Thuộc tính mở rộng ${options.length + 1}`);
      }

      result.push({
        id: `pair_${Date.now()}_${result.length + 1}`,
        question: currentRootCard,
        options: options.slice(0, 4) as [string, string, string, string],
        correctIndex: 0,
        explanation: `Thuộc tính của: ${currentRootCard}`,
        difficulty: currentDifficulty,
        topic: currentTopic,
        source: defaultTopic,
        status: 'published',
        createdAt: new Date().toISOString()
      });

      currentRootCard = null;
      currentProps = [];
    }
  };

  // KIỂM TRA DẠNG TRẮC NGHIỆM TIÊU CHUẨN (CÂU 1. ... A. ... B. ...)
  const isStandardMCQ = /(?:Câu\s+\d+|[0-9]{1,3}\.)[:.]?/i.test(rawText) && /[A-D][\.:\)]/i.test(rawText);

  if (isStandardMCQ) {
    const blocks = rawText.split(/(?:^|\n)(?:Câu\s+\d+|[0-9]{1,3}\.)[:.]?/gi).filter(b => b.trim().length > 0);
    blocks.forEach((block, idx) => {
      const bLines = block.trim().split('\n').map(l => l.trim()).filter(Boolean);
      if (bLines.length === 0) return;

      let questionText = bLines[0];
      let options = ['Lựa chọn A', 'Lựa chọn B', 'Lựa chọn C', 'Lựa chọn D'];
      let correctIndex = 0;
      let explanation = '';
      const fullBlock = bLines.join(' ');

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

      result.push({
        id: `mcq_${Date.now()}_${idx}`,
        question: questionText,
        options: [options[0], options[1], options[2], options[3]],
        correctIndex,
        explanation,
        difficulty: idx < 5 ? 'Dễ' : (idx < 12 ? 'Trung bình' : 'Khó'),
        topic: defaultTopic,
        source: defaultTopic,
        status: 'published',
        createdAt: new Date().toISOString()
      });
    });

    return result;
  }

  // DẠNG CÂY PHÂN CẤP KÉO THẢ TƯƠNG TÁC (CHUYÊN ĐỀ -> CẤP ĐỘ -> THẺ GỐC -> THUỘC TÍNH)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // CẤP 1: Nhận diện Chuyên đề / Chủ đề
    const topicMatch = line.match(/(?:Chuyên đề|Chủ đề|Topic)\s*\d*[:\s-]+(.*)/i);
    if (topicMatch) {
      flushCurrentPair();
      currentTopic = topicMatch[1].trim() || defaultTopic;
      continue;
    }

    // CẤP 2: Nhận diện Cấp độ / Độ khó (L1 -> L5 hoặc Dễ, Vừa, Khó)
    const levelMatch = line.match(/(?:Cấp độ|Level|Mức độ|Ải|L)\s*(\d+|Dễ|Trung bình|Khó|Vừa)[:\s-]*(.*)/i);
    if (levelMatch) {
      flushCurrentPair();
      const lvlStr = levelMatch[1].toLowerCase();
      if (lvlStr === '1' || lvlStr === 'dễ') currentDifficulty = 'Dễ';
      else if (lvlStr === '4' || lvlStr === '5' || lvlStr === 'khó') currentDifficulty = 'Khó';
      else currentDifficulty = 'Trung bình';
      continue;
    }

    // CẤP 3: Thẻ tiêu đề gốc (Ví dụ: "Hàm số: y = x^3 - 3x" hoặc "Hàm số 1: ..." hoặc "Thẻ gốc: ...")
    const rootMatch = line.match(/(?:Hàm số|Thẻ gốc|Đề bài|Khái niệm|F\d+)\s*\d*[:\s-]+(.*)/i) || 
                      line.match(/^[•\*\-]?\s*(y\s*=.*|f\(x\)\s*=.*)/i);
    if (rootMatch) {
      flushCurrentPair();
      currentRootCard = rootMatch[1].trim();
      continue;
    }

    // CẤP 3 (tiếp): Các thẻ thuộc tính đúng đi kèm (Bắt đầu bằng -, *, +, hoặc tab)
    const propMatch = line.match(/^[-\*•\+]\s+(.*)/) || line.match(/^\d+[\.\)]\s+(.*)/);
    if (propMatch && currentRootCard) {
      currentProps.push(propMatch[1].trim());
      continue;
    }

    // Nếu không khớp pattern trên mà trước đó đã có rootCard, bổ sung làm thuộc tính
    if (currentRootCard && line.length > 3 && !line.includes(':')) {
      currentProps.push(line);
    }
  }

  flushCurrentPair();
  return result;
}
