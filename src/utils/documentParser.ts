import { Question, Difficulty, DragDropCategory, DragDropTableRow } from '../types';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';

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
 * BÓC TÁCH LINK HÌNH ẢNH HOẶC THẺ ẢNH TỪ VĂN BẢN
 */
export function extractImageUrl(text: string): { cleanText: string; imageUrl?: string } {
  if (!text || typeof text !== 'string') return { cleanText: '' };
  let cleanText = text;
  let imageUrl: string | undefined = undefined;

  // Match [img:URL]
  const tagMatch = cleanText.match(/\[img:\s*(https?:\/\/[^\]\s]+)\]/i);
  if (tagMatch) {
    imageUrl = tagMatch[1];
    cleanText = cleanText.replace(tagMatch[0], '').trim();
  } else {
    // Match <img src="URL"...>
    const htmlImgMatch = cleanText.match(/<img[^>]+src=["'](https?:\/\/[^"'>]+)["'][^>]*>/i);
    if (htmlImgMatch) {
      imageUrl = htmlImgMatch[1];
      cleanText = cleanText.replace(htmlImgMatch[0], '').trim();
    } else {
      // Match standalone image URLs ending in .png, .jpg, .jpeg, .webp, .svg
      const urlMatch = cleanText.match(/(https?:\/\/[^\s]+?\.(?:png|jpe?g|webp|svg|gif)(?:\?[^\s]*)?)/i);
      if (urlMatch) {
        imageUrl = urlMatch[1];
        cleanText = cleanText.replace(urlMatch[0], '').trim();
      }
    }
  }

  return { cleanText, imageUrl };
}

/**
 * CHUẨN HÓA CÔNG THỨC TOÁN HỌC TỪ TEX SANG MATHJAX/KATEX (AUTO LATEX PARSER)
 * - Tự động nhận diện công thức TeX thô (\frac, \sqrt, \alpha, \Delta, \sin, \cos, \log...)
 * - Chuyển đổi $formula$ và $$formula$$ thành chuẩn \( ... \)
 * - Tự động bọc công thức TeX trần để hiển thị trực quan 100%
 */
export function normalizeMathFormulas(text: string): string {
  if (!text || typeof text !== 'string') return '';
  let str = text.trim();

  // 0. Làm sạch triệt để control characters và Form Feed \x0c / \f bị lỗi khi parser JS/Word/Excel
  str = str.replace(/[\u000c\x0c]+rac/g, '\\frac');
  str = str.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '');
  // Lọc bỏ hoàn toàn các cụm ký tự \f hoặc \f\f nếu có xuất hiện trong chuỗi đáp án
  str = str.replace(/\\f\\f/g, '').replace(/\\f/g, '');
  str = str.replace(/(?:^|[^\\])\brac\s*\{/g, (m) => m.replace('rac{', '\\frac{'));
  str = str.replace(/^rac\s*\{/g, '\\frac{');

  // Sửa chữa các chuỗi lỗi font/TeX đã bị hỏng trước đó (ví dụ: {\(\frac\){sqrt{3}}{2}})
  str = str.replace(/\{\s*\\?\(\\?frac\\?\)\s*\{/gi, '\\frac{');
  str = str.replace(/\{\s*\\?\(\\?sqrt\\?\)\s*\{/gi, '\\sqrt{');
  str = str.replace(/\{\s*\\?\((\\[a-zA-Z]+)\\?\)\s*/gi, '$1');
  str = str.replace(/\{\s*\\frac\s*([^{}]+)\s*\}\s*\{\s*([^{}]+)\s*\}/gi, '\\frac{$1}{$2}');

  // 0a. Sửa lỗi dấu gạch chéo đỏ: Lọc sạch ký tự gạch chéo lỗi dạng \ ( ... \ ) hoặc \ ( P(A) \ )
  str = str.replace(/\\+\s*\(\s*/g, '\\(');
  str = str.replace(/\s*\\+\s*\)/g, '\\)');
  str = str.replace(/\\+\s+([a-zA-Z0-9])/g, '$1');
  str = str.replace(/\\+P\s*\(/g, 'P(');

  // Sửa lỗi cách chữ đầu câu & dính chữ tiếng Việt với biến toán
  str = str.replace(/\bN\s+ếu\b/gi, 'Nếu');
  str = str.replace(/\bC\s+ả\b/gi, 'Cả');
  str = str.replace(/\bK\s+hi\b/gi, 'Khi');
  str = str.replace(/\bC\s+hỉ\b/gi, 'Chỉ');
  str = str.replace(/([a-zàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ])([A-Z])(?=[^a-zà-ỹ]|\s|$)/g, '$1 $2');
  str = str.replace(/(^|\s|\()([A-Z])(và|hoặc|độc|không|xảy|khi|thì|cùng|với|giao|hợp|đồng)\b/g, '$1$2 $3');

  // 0b. Tự động chuyển đổi các ký hiệu toán:
  // Omega -> \Omega, emptyset -> \emptyset
  str = str.replace(/(^|[^\\a-zA-Z])Omega\b/g, '$1\\Omega');
  str = str.replace(/(^|[^\\a-zA-Z])emptyset\b/g, '$1\\emptyset');

  // overlineAcapoverlineB và các biến thể -> \overline{A} \cap \overline{B}
  str = str.replace(/overlineAcapoverlineB/gi, '\\overline{A} \\cap \\overline{B}');
  str = str.replace(/overlineAcupoverlineB/gi, '\\overline{A} \\cup \\overline{B}');
  str = str.replace(/\\?overline\s*\{?A\}?\s*\\?cap\s*\\?overline\s*\{?B\}?/gi, '\\overline{A} \\cap \\overline{B}');
  str = str.replace(/\\?overline\s*\{?A\}?\s*\\?cup\s*\\?overline\s*\{?B\}?/gi, '\\overline{A} \\cup \\overline{B}');
  str = str.replace(/\\?overline\s*([A-Za-z])\b/g, '\\overline{$1}');

  // AcupB -> A \cup B, AcapB -> A \cap B
  str = str.replace(/\b([A-Z])cap([A-Z])\b/gi, '$1 \\cap $2');
  str = str.replace(/\b([A-Z])cup([A-Z])\b/gi, '$1 \\cup $2');
  str = str.replace(/([A-Z])\s*\\?cap\s*([A-Z])/gi, '$1 \\cap $2');
  str = str.replace(/([A-Z])\s*\\?cup\s*([A-Z])/gi, '$1 \\cup $2');

  // 0c. Tự động sửa mã ký hiệu dấu nhân: chuyển từ chữ thô cdot hoặc . thành \cdot
  str = str.replace(/([0-9a-zA-Z\)\}\]])\s*\\?cdot\s*([0-9a-zA-Z\(\{\\])/g, '$1 \\cdot $2');
  str = str.replace(/(P\([^\)]+\))\s*\.\s*(P\([^\)]+\))/g, '$1 \\cdot $2');
  str = str.replace(/(P\([^\)]+\))\s*\*\s*(P\([^\)]+\))/g, '$1 \\cdot $2');
  str = str.replace(/\bcdot\b/g, '\\cdot');

  // 0d. Chuẩn hóa số mũ cơ số e và các lũy thừa: e^(3x) -> e^{3x}, e^(-x) -> e^{-x}, (x+1)^3 -> (x+1)^{3}
  str = str.replace(/e\^\(([^)]+)\)/g, 'e^{$1}');
  str = str.replace(/e\^([a-zA-Z0-9]+)/g, 'e^{$1}');
  str = str.replace(/([a-zA-Z0-9\)])\^\(([^)]+)\)/g, '$1^{$2}');
  // Ký tự số mũ Unicode
  str = str.replace(/²ˣ/g, '^{2x}');
  str = str.replace(/⁻¹/g, '^{-1}');
  str = str.replace(/ˣ/g, '^{x}');
  str = str.replace(/ᵘ/g, '^{u}');
  str = str.replace(/ⁿ/g, '^{n}');
  str = str.replace(/¹/g, '^{1}');
  str = str.replace(/²/g, '^{2}');
  str = str.replace(/³/g, '^{3}');
  str = str.replace(/⁴/g, '^{4}');
  str = str.replace(/⁵/g, '^{5}');
  str = str.replace(/⁶/g, '^{6}');
  str = str.replace(/⁷/g, '^{7}');
  str = str.replace(/⁸/g, '^{8}');
  str = str.replace(/⁹/g, '^{9}');
  str = str.replace(/⁰/g, '^{0}');
  str = str.replace(/∫/g, '\\int ');

  // 0e. Chuẩn hóa phân số nguyên: a/b hoặc [A]. a/b -> \( \frac{a}{b} \)
  if (/^[-+]?\d+\s*\/\s*\d+$/.test(str)) {
    const parts = str.split('/');
    return `\\( \\frac{${parts[0].trim()}}{${parts[1].trim()}} \\)`;
  }
  if (/^([A-D]\.\s*)([-+]?\d+)\s*\/\s*(\d+)$/.test(str)) {
    return str.replace(/^([A-D]\.\s*)([-+]?\d+)\s*\/\s*(\d+)$/, (_, prefix, num, den) => {
      return `${prefix}\\( \\frac{${num.trim()}}{${den.trim()}} \\)`;
    });
  }

  // 0f. Chuẩn hóa số nguyên hoặc số thập phân đơn thuần (e.g. 0.75, 0.20, 25, 51.4%)
  if (/^[-+]?\d+(?:\.\d+)?%?$/.test(str)) {
    if (str.endsWith('%')) {
      const numPart = str.slice(0, -1);
      return `\\( ${numPart}\\% \\)`;
    }
    return `\\( ${str} \\)`;
  }
  if (/^([A-D]\.\s*)([-+]?\d+(?:\.\d+)?%?)$/.test(str)) {
    return str.replace(/^([A-D]\.\s*)([-+]?\d+(?:\.\d+)?)(%?)$/, (_, prefix, num, pct) => {
      return pct ? `${prefix}\\( ${num}\\% \\)` : `${prefix}\\( ${num} \\)`;
    });
  }

  // 1. Chuyển đổi $$...$$ thành \(...\) tránh làm vỡ layout thẻ game
  str = str.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => `\\(${math.trim()}\\)`);

  // 2. Chuyển đổi $...$ thành \(...\)
  str = str.replace(/\$([^\$]+?)\$/g, (_, math) => `\\(${math.trim()}\\)`);

  // 3. Nếu chuỗi đã được bọc hoàn chỉnh trong \(...\)
  if (/^\\\([\s\S]*?\\\)$/.test(str)) {
    return str;
  }

  // 4. Nếu toàn bộ chuỗi là phương trình hoặc phân số/căn thức toán học thuần
  // Ví dụ: \frac{1}{2}, \frac{\sqrt{3}}{2}, -\frac{1}{2}, y = x^3 - 3x, \sin 30^\circ, \sqrt{3}
  const isPureMath = /^[-+]?(?:\\frac\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}\{[^{}]*\}|\\sqrt(?:\[[^\]]+\])?\{[^{}]*\}|\\?[a-zA-Z]+(?:\^\{?[^{}]*\}?|_\{?[^{}]*\}?)?|[0-9a-zA-Z\s+\-*\/=^_{}\\()[\]|.,;:<>!])+$/;
  const hasTexSymbol = /\\[a-zA-Z]+|\^|_|\/|√|π|α|β|Delta|sin|cos|tan|cot/.test(str);

  if (!str.includes('\\(') && (str.startsWith('\\') || (hasTexSymbol && isPureMath.test(str)))) {
    // Không chứa chữ tiếng Việt có dấu
    if (!/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(str)) {
      return `\\(${str}\\)`;
    }
  }

  // 5. Nếu chuỗi là câu hỏi tiếng Việt có chứa công thức TeX trần
  // Ví dụ: "Giá trị của \sin 30^\circ bằng bao nhiêu?"
  if (!str.includes('\\(') && /\\[a-zA-Z]+/.test(str)) {
    // Bọc an toàn các lệnh TeX độc lập
    str = str.replace(/(\\[a-zA-Z]+(?:\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\})*(?:\^\{?[^{}]*\}?|_\{?[^{}]*\}?)*(?:\s*[0-9a-zA-Z^\-_+\/=()]+)*)/g, (match) => {
      const trimmed = match.trim();
      if (!trimmed || trimmed.startsWith('\\(')) return match;
      return `\\(${trimmed}\\)`;
    });
  }

  // 6. Chuẩn hóa làm sạch các dấu ngoặc kép lặp lại nếu có
  str = str.replace(/\\\(\s*\\\(([\s\S]*?)\\\)\s*\\\)/g, '\\($1\\)');
  str = str.replace(/\\\(\s*\\\(([\s\S]*?)\\\)\s*\)/g, '\\($1\\)');
  str = str.replace(/\\\(\s*\$([\s\S]*?)\$\s*\\\)/g, '\\($1\\)');

  return str;
}

/**
 * BỘ PHÂN TÍCH THÔNG MINH ĐA CẤP (HIERARCHICAL TREE PARSER)
 * Cấp 1: Chuyên đề
 * Cấp 2: Cấp độ (L1 -> L5 hoặc Dễ / Vừa / Khó)
 * Cấp 3: Cặp ghép đôi [Thẻ tiêu đề gốc] + [Các thẻ thuộc tính đúng]
 * Hoặc Trắc nghiệm tiêu chuẩn (Câu 1, A, B, C, D)
 * Tự động chuẩn hóa toàn bộ công thức toán học qua normalizeMathFormulas
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
      const options = currentProps.map(p => normalizeMathFormulas(p));
      while (options.length < 4) {
        options.push(normalizeMathFormulas(`Thuộc tính mở rộng ${options.length + 1}`));
      }

      result.push({
        id: `pair_${Date.now()}_${result.length + 1}`,
        question: normalizeMathFormulas(currentRootCard),
        options: options.slice(0, 4) as [string, string, string, string],
        correctIndex: 0,
        explanation: `Thuộc tính đúng của: ${normalizeMathFormulas(currentRootCard)}`,
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

  // KIỂM TRA ĐỊNH DẠNG BẢNG EXCEL/CSV CÓ CÁC CỘT: [Chuyên đề, Cấp độ, Thẻ gốc, Thuộc tính 1-4, Độ khó]
  const isExcelTable = lines.some(l => {
    const lower = l.toLowerCase();
    return (lower.includes('chuyên đề') || lower.includes('chủ đề')) && 
           (lower.includes('thẻ gốc') || lower.includes('hàm số') || lower.includes('thuộc tính'));
  });

  if (isExcelTable) {
    let headerFound = false;
    for (const line of lines) {
      const cols = (line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(','))
        .map(c => c.replace(/^"|"$/g, '').trim());

      const lower0 = (cols[0] || '').toLowerCase();
      if (!headerFound && (lower0.includes('chuyên đề') || lower0.includes('chủ đề'))) {
        headerFound = true;
        continue;
      }

      if (cols.length >= 4) {
        const topicCol = cols[0] || defaultTopic;
        const levelCol = cols[1] || 'L1';
        const rootCol = cols[2];
        const prop1 = cols[3];
        const prop2 = cols[4] || '';
        const prop3 = cols[5] || '';
        const prop4 = cols[6] || '';
        const diffCol = cols[7] || '';

        if (!rootCol || !prop1) continue;

        let diff: Difficulty = 'Trung bình';
        const lvlLower = (levelCol + ' ' + diffCol).toLowerCase();
        if (lvlLower.includes('dễ') || lvlLower.includes('l1') || lvlLower.includes('level 1')) diff = 'Dễ';
        else if (lvlLower.includes('khó') || lvlLower.includes('l4') || lvlLower.includes('l5')) diff = 'Khó';

        const propsList = [prop1, prop2, prop3, prop4].filter(Boolean);
        while (propsList.length < 4) {
          propsList.push(`Thuộc tính mở rộng ${propsList.length + 1}`);
        }

        result.push({
          id: `excel_${Date.now()}_${result.length + 1}`,
          question: normalizeMathFormulas(rootCol),
          options: [
            normalizeMathFormulas(propsList[0]),
            normalizeMathFormulas(propsList[1]),
            normalizeMathFormulas(propsList[2]),
            normalizeMathFormulas(propsList[3])
          ],
          correctIndex: 0,
          explanation: `Thuộc tính của: ${normalizeMathFormulas(rootCol)}`,
          difficulty: diff,
          topic: topicCol,
          source: defaultTopic,
          status: 'published',
          createdAt: new Date().toISOString()
        });
      }
    }

    if (result.length > 0) return result;
  }

  // KIỂM TRA DẠNG 2 CỘT CHO GAME KÉO THẢ (Hộp / Phương trình & Thuộc tính)
  const isTwoColCandidate = !/(?:Câu\s+\d+|[0-9]{1,3}\.)[:.]?/i.test(rawText) && (rawText.includes(';') || rawText.includes('\t') || rawText.includes('|'));
  if (isTwoColCandidate) {
    const twoColCats = parseDragDropFromText(rawText);
    if (twoColCats.length > 0) {
      return twoColCats.map((cat, idx) => {
        const opts = [...cat.attributes];
        while (opts.length < 4) {
          opts.push(`Thuộc tính mở rộng ${opts.length + 1}`);
        }
        return {
          id: `pair_${Date.now()}_${idx + 1}`,
          question: cat.title || 'Câu hỏi',
          options: opts.slice(0, 4) as [string, string, string, string],
          correctIndex: 0,
          explanation: `Thuộc tính của: ${cat.title}`,
          difficulty: idx < 2 ? 'Dễ' : (idx < 4 ? 'Trung bình' : 'Khó'),
          topic: defaultTopic,
          source: defaultTopic,
          status: 'published',
          createdAt: new Date().toISOString()
        };
      });
    }
  }

  // =====================================================================
  // KIỂM TRA DẠNG ĐÚNG/SAI 4 Ý (BẢNG 2 CỘT × 9 DÒNG)
  // Cấu trúc mỗi câu hỏi lớn gồm 9 dòng liên tiếp:
  //   Dòng 1  : cột 2 = lời dẫn tổng quát
  //   Dòng 2,4,6,8: cột 2 = phát biểu A,B,C,D
  //   Dòng 3,5,7,9: cột 1 = "đúng"/"sai" | cột 2 = giải thích
  // =====================================================================
  const isStandardMCQCheck = /(?:Câu\s+\d+|[0-9]{1,3}\.)[:.]?/i.test(rawText) && /[A-D][\.:\)]/i.test(rawText);
  const hasTrueFalseKeywords = (rawText.match(/\b(đúng|sai)\b/gi) || []).length >= 3;
  const hasTwoColSeparator = rawText.includes('\t') || rawText.includes(';') || rawText.includes('|');
  const isTrueFalseTable = hasTrueFalseKeywords && hasTwoColSeparator && !isStandardMCQCheck;

  if (isTrueFalseTable) {
    const tfResult: Question[] = [];
    const allRows = rawText.split(/\r?\n/).filter(r => r.trim().length > 0);

    const getSep = (row: string): string => {
      if (row.includes('\t')) return '\t';
      if (row.includes(';')) return ';';
      return '|';
    };

    const splitRow = (row: string): [string, string] => {
      const sep = getSep(row);
      const parts = row.split(sep).map(p => p.trim());
      return [parts[0] || '', parts[1] || ''];
    };

    let i = 0;
    while (i + 8 < allRows.length) {
      const block9 = allRows.slice(i, i + 9);
      const [, titleRaw] = splitRow(block9[0]);
      const title = normalizeMathFormulas(titleRaw || block9[0].trim());

      const labels = ['A', 'B', 'C', 'D'];
      for (let s = 0; s < 4; s++) {
        const stmtRowIdx = 1 + s * 2;
        const ansRowIdx  = 2 + s * 2;
        if (stmtRowIdx >= block9.length || ansRowIdx >= block9.length) break;

        const [, stmtRaw] = splitRow(block9[stmtRowIdx]);
        const [ansRaw, explRaw] = splitRow(block9[ansRowIdx]);

        const statementText  = normalizeMathFormulas(stmtRaw || block9[stmtRowIdx].trim());
        const answerText     = (ansRaw || '').toLowerCase().trim();
        const explanationText = normalizeMathFormulas(explRaw || '');
        const isCorrect = answerText.includes('đúng');

        if (!statementText) continue;

        const difficulty: Difficulty = s < 2 ? 'Dễ' : (s < 3 ? 'Trung bình' : 'Khó');
        tfResult.push({
          id: `tf_${Date.now()}_${i}_${s}`,
          question: `ĐÚNG HAY SAI: ${title} → Phát biểu ${labels[s]}: ${statementText}`,
          options: ['ĐÚNG', 'SAI'],
          correctIndex: isCorrect ? 0 : 1,
          explanation: explanationText || `Phát biểu ${labels[s]} là ${isCorrect ? 'ĐÚNG' : 'SAI'}.`,
          difficulty,
          topic: defaultTopic,
          source: defaultTopic,
          status: 'published',
          createdAt: new Date().toISOString()
        } as Question);
      }
      i += 9;
    }

    if (tfResult.length > 0) return tfResult;
  }

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

    // CẤP 3 (tiếp): Các thẻ thuộc tính đúng đi kèm (Bắt đầu bằng -, *, +, hoặc số thứ tự)
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

/**
 * SINH VÀ TẢI FILE WORD (.DOCX) MẪU CHUẨN BẢNG 4 CỘT PHÂN CẤP
 * Cột 1: Tên Chuyên Đề
 * Cột 2: Cấp độ / Mức độ (Level 1 -> 5)
 * Cột 3: Hộp Đề Bài / Phương Trình
 * Cột 4: Các Nhãn Thuộc Tính Đúng (Phân tách bằng dấu phẩy)
 */
export async function downloadWordTemplate(): Promise<void> {
  const tableRows: TableRow[] = [
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          width: { size: 2600, type: WidthType.DXA },
          shading: { fill: "1E3A8A" },
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: "Cột 1: Tên Chuyên Đề",
                  bold: true,
                  color: "FFFFFF",
                  size: 20
                })
              ]
            })
          ]
        }),
        new TableCell({
          width: { size: 1400, type: WidthType.DXA },
          shading: { fill: "4C1D95" },
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: "Cột 2: Cấp Độ",
                  bold: true,
                  color: "FFFFFF",
                  size: 20
                })
              ]
            })
          ]
        }),
        new TableCell({
          width: { size: 2600, type: WidthType.DXA },
          shading: { fill: "0F766E" },
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: "Cột 3: Hộp / Phương Trình",
                  bold: true,
                  color: "FFFFFF",
                  size: 20
                })
              ]
            })
          ]
        }),
        new TableCell({
          width: { size: 4400, type: WidthType.DXA },
          shading: { fill: "065F46" },
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: "Cột 4: Các Thuộc Tính Đúng (phân tách bằng dấu phẩy)",
                  bold: true,
                  color: "FFFFFF",
                  size: 20
                })
              ]
            })
          ]
        })
      ]
    }),
    // HÀNG 1: CHUYÊN ĐỀ 1 - LEVEL 1
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Chuyên đề 1: Tính Đơn Điệu & Cực Trị", bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Level 1" })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "y = x^3 - 3x", bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Đạt cực đại tại x = -1, Đạt cực tiểu tại x = 1, Đồng biến trên khoảng (1; +\\infty), Nghịch biến trên khoảng (-1; 1)" })] })] })
      ]
    }),
    // HÀNG 2: CHUYÊN ĐỀ 1 - LEVEL 1
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Chuyên đề 1: Tính Đơn Điệu & Cực Trị", bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Level 1" })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "y = -x^3 + 3x^2", bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Đạt cực đại tại x = 2, Đạt cực tiểu tại x = 0, Đồng biến trên khoảng (0; 2), Giá trị cực đại bằng 4" })] })] })
      ]
    }),
    // HÀNG 3: CHUYÊN ĐỀ 1 - LEVEL 2
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Chuyên đề 1: Tính Đơn Điệu & Cực Trị", bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Level 2" })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "y = x^4 - 2x^2 + 1", bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Có 3 điểm cực trị, Đạt cực đại tại x = 0, Đạt cực tiểu tại x = \\pm 1, Đồng biến trên (-1; 0)" })] })] })
      ]
    }),
    // HÀNG 4: CHUYÊN ĐỀ 2 - LEVEL 1
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Chuyên đề 2: Tiệm Cận & Khảo Sát", bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Level 1" })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "y = \\frac{2x+1}{x-1}", bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Tiệm cận đứng x = 1, Tiệm cận ngang y = 2, Nghịch biến trên từng khoảng xác định, Không có cực trị" })] })] })
      ]
    }),
    // HÀNG 5: CHUYÊN ĐỀ 3 - LEVEL 1
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Chuyên đề 3: Min Max & Tập Xác Định", bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Level 1" })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "y = \\sqrt{4 - x^2}", bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Tập xác định D = [-2; 2], Giá trị lớn nhất y = 2 tại x = 0, Giá trị nhỏ nhất y = 0 tại x = \\pm 2, Đồng biến trên (-2; 0)" })] })] })
      ]
    })
  ];

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: "MẪU BẢNG SOẠN ĐỀ GAME KÉO THẢ (CHUẨN 4 CỘT PHÂN CẤP)",
                bold: true,
                size: 26,
                color: "1E3A8A"
              })
            ],
            spacing: { after: 150 }
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Hướng dẫn: Cột 1: Tên Chuyên Đề (Hệ thống tự động thêm/bớt chuyên đề theo file này). Cột 2: Cấp Độ (Level 1 đến Level 5). Cột 3: Hộp Đề Bài / Phương Trình. Cột 4: Các Nhãn Thuộc Tính Đúng (phân tách nhau bằng dấu phẩy). Thầy cô có thể gõ trực tiếp công thức TeX thô (\\frac{a}{b}, \\sqrt{x}, x^2...), hệ thống sẽ tự động chuyển đổi sang MathJax/KaTeX trực quan 100%!",
                size: 19,
                color: "4B5563"
              })
            ],
            spacing: { after: 200 }
          }),
          new Table({
            rows: tableRows,
            width: { size: 11000, type: WidthType.DXA }
          })
        ]
      }
    ]
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, "Mau_De_Thi_Keo_Tha_4_Cot.docx");
}

/**
 * SINH VÀ TẢI FILE EXCEL (.XLSX) MẪU CHUẨN BẢNG 4 CỘT PHÂN CẤP
 * Cột 1: Tên Chuyên Đề
 * Cột 2: Cấp độ / Mức độ (Level 1 -> 5)
 * Cột 3: Hộp Đề Bài / Phương Trình (Category)
 * Cột 4: Các Nhãn Thuộc Tính Đúng (Attributes - Phân tách bằng dấu phẩy)
 */
export async function downloadExcelTemplate(): Promise<void> {
  const { XLSX } = await loadDocumentLibraries();
  const headers = [
    "Tên Chuyên Đề",
    "Cấp Độ (Level)",
    "Hộp Đề Bài / Phương Trình (Category)",
    "Các Nhãn Thuộc Tính Đúng (Attributes - Phân tách bằng dấu phẩy)"
  ];

  const sampleRows = [
    [
      "Chuyên đề 1: Tính Đơn Điệu & Cực Trị",
      "Level 1",
      "y = x^3 - 3x",
      "Đạt cực đại tại x = -1, Đạt cực tiểu tại x = 1, Đồng biến trên khoảng (1; +\\infty), Nghịch biến trên khoảng (-1; 1)"
    ],
    [
      "Chuyên đề 1: Tính Đơn Điệu & Cực Trị",
      "Level 1",
      "y = -x^3 + 3x^2",
      "Đạt cực đại tại x = 2, Đạt cực tiểu tại x = 0, Đồng biến trên khoảng (0; 2), Giá trị cực đại bằng 4"
    ],
    [
      "Chuyên đề 1: Tính Đơn Điệu & Cực Trị",
      "Level 1",
      "y = x^3 + 3x + 1",
      "Hàm số luôn đồng biến trên R, Không có điểm cực trị, Đạo hàm y' = 3x^2 + 3 > 0, Điểm uốn I(0; 1)"
    ],
    [
      "Chuyên đề 1: Tính Đơn Điệu & Cực Trị",
      "Level 2",
      "y = x^4 - 2x^2 + 1",
      "Có 3 điểm cực trị, Đạt cực đại tại x = 0, Đạt cực tiểu tại x = \\pm 1, Đồng biến trên (-1; 0)"
    ],
    [
      "Chuyên đề 1: Tính Đơn Điệu & Cực Trị",
      "Level 2",
      "y = -x^4 + 4x^2",
      "Có 1 điểm cực đại, Đạt cực đại tại x = \\pm \\sqrt{2}, Đạt cực tiểu tại x = 0, Nghịch biến trên (\\sqrt{2}; +\\infty)"
    ],
    [
      "Chuyên đề 2: Tiệm Cận & Khảo Sát Đồ Thị",
      "Level 1",
      "y = \\frac{2x+1}{x-1}",
      "Tiệm cận đứng x = 1, Tiệm cận ngang y = 2, Nghịch biến trên từng khoảng xác định, Không có cực trị"
    ],
    [
      "Chuyên đề 2: Tiệm Cận & Khảo Sát Đồ Thị",
      "Level 1",
      "y = \\frac{x-2}{x+1}",
      "Tiệm cận đứng x = -1, Tiệm cận ngang y = 1, Đồng biến trên từng khoảng xác định, Giao trục Oy tại (0; -2)"
    ],
    [
      "Chuyên đề 2: Tiệm Cận & Khảo Sát Đồ Thị",
      "Level 2",
      "y = \\frac{x^2 - 3x + 2}{x - 1}",
      "Đồ thị là đường thẳng có lỗ thủng tại x = 1, Rút gọn y = x - 2, Cắt Ox tại x = 2, Không có đường tiệm cận"
    ],
    [
      "Chuyên đề 3: Min Max & Tập Xác Định",
      "Level 1",
      "y = \\sqrt{4 - x^2}",
      "Tập xác định D = [-2; 2], Giá trị lớn nhất y = 2 tại x = 0, Giá trị nhỏ nhất y = 0 tại x = \\pm 2, Đồng biến trên (-2; 0)"
    ],
    [
      "Chuyên đề 3: Min Max & Tập Xác Định",
      "Level 1",
      "y = \\sqrt{x^2 - 2x + 5}",
      "Tập xác định D = R, Giá trị nhỏ nhất y = 2 tại x = 1, Không có giá trị lớn nhất, Đồng biến trên (1; +\\infty)"
    ]
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
  ws['!cols'] = [
    { wch: 35 },
    { wch: 15 },
    { wch: 35 },
    { wch: 90 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Mau_Keo_Tha_4_Cot");
  XLSX.writeFile(wb, "Mau_De_Thi_Keo_Tha_4_Cot.xlsx");
}

/**
 * TẠO BẢNG CÂU HỎI 7 DÒNG x 2 CỘT CHO GAME BẢO VỆ CHIẾN HÀO (DOCX) - ĐEN TRẮNG TIÊU CHUẨN
 */
function createChienHaoQuestionTable(qNum: number, qText: string, optA: string, optB: string, optC: string, optD: string, exp: string, ans: string): Table {
  return new Table({
    width: { size: 10000, type: WidthType.DXA },
    rows: [
      // Dòng 1: Câu [N] | Nội dung câu hỏi (chấp nhận mã TeX và Link ảnh)
      new TableRow({
        children: [
          new TableCell({
            width: { size: 2000, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: `Câu ${qNum}`, bold: true, color: "000000", size: 21 })] })]
          }),
          new TableCell({
            width: { size: 8000, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: qText, color: "000000", size: 21 })] })]
          })
        ]
      }),
      // Dòng 2: A) | Nội dung A
      new TableRow({
        children: [
          new TableCell({
            width: { size: 2000, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: "A)", bold: true, color: "000000" })] })]
          }),
          new TableCell({
            width: { size: 8000, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: optA, color: "000000" })] })]
          })
        ]
      }),
      // Dòng 3: B) | Nội dung B
      new TableRow({
        children: [
          new TableCell({
            width: { size: 2000, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: "B)", bold: true, color: "000000" })] })]
          }),
          new TableCell({
            width: { size: 8000, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: optB, color: "000000" })] })]
          })
        ]
      }),
      // Dòng 4: C) | Nội dung C
      new TableRow({
        children: [
          new TableCell({
            width: { size: 2000, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: "C)", bold: true, color: "000000" })] })]
          }),
          new TableCell({
            width: { size: 8000, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: optC, color: "000000" })] })]
          })
        ]
      }),
      // Dòng 5: D) | Nội dung D
      new TableRow({
        children: [
          new TableCell({
            width: { size: 2000, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: "D)", bold: true, color: "000000" })] })]
          }),
          new TableCell({
            width: { size: 8000, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: optD, color: "000000" })] })]
          })
        ]
      }),
      // Dòng 6: Lời giải | Hướng dẫn giải chi tiết
      new TableRow({
        children: [
          new TableCell({
            width: { size: 2000, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: "Lời giải", bold: true, color: "000000" })] })]
          }),
          new TableCell({
            width: { size: 8000, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: exp, color: "000000" })] })]
          })
        ]
      }),
      // Dòng 7: Đáp án | Ký tự đáp án đúng
      new TableRow({
        children: [
          new TableCell({
            width: { size: 2000, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: "Đáp án", bold: true, color: "000000" })] })]
          }),
          new TableCell({
            width: { size: 8000, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: ans, bold: true, color: "000000" })] })]
          })
        ]
      })
    ]
  });
}

/**
 * HÀM TẠO BẢNG CÂU HỎI 8 DÒNG x 2 CỘT CHO GAME BẮN CHIM
 * Dòng 1: Câu [Số]: [Mức độ] | Nội dung câu hỏi
 * Dòng 2, 3, 4, 5, 6: A, B, C, D, E | Nội dung 5 đáp án tương ứng 5 chú chim
 * Dòng 7: Lời giải | Hướng dẫn giải chi tiết
 * Dòng 8: Đáp án | Ký tự duy nhất (A, B, C, D hoặc E)
 */
function createBanChimQuestionTable(
  qNum: number,
  levelText: string,
  qText: string,
  optA: string,
  optB: string,
  optC: string,
  optD: string,
  optE: string,
  exp: string,
  ans: string
): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 8, color: "888888" },
      bottom: { style: BorderStyle.SINGLE, size: 8, color: "888888" },
      left: { style: BorderStyle.SINGLE, size: 8, color: "888888" },
      right: { style: BorderStyle.SINGLE, size: 8, color: "888888" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" },
      insideVertical: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" }
    },
    rows: [
      // Dòng 1: Câu [Số]: [Mức độ] | Nội dung câu hỏi
      new TableRow({
        children: [
          new TableCell({
            width: { size: 2200, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: `Câu ${qNum}: [${levelText}]`, bold: true, color: "000000", size: 21 })] })]
          }),
          new TableCell({
            width: { size: 7800, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: qText, color: "000000", size: 21 })] })]
          })
        ]
      }),
      // Dòng 2: A | Đáp án A
      new TableRow({
        children: [
          new TableCell({
            width: { size: 2200, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: "A", bold: true, color: "000000" })] })]
          }),
          new TableCell({
            width: { size: 7800, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: optA, color: "000000" })] })]
          })
        ]
      }),
      // Dòng 3: B | Đáp án B
      new TableRow({
        children: [
          new TableCell({
            width: { size: 2200, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: "B", bold: true, color: "000000" })] })]
          }),
          new TableCell({
            width: { size: 7800, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: optB, color: "000000" })] })]
          })
        ]
      }),
      // Dòng 4: C | Đáp án C
      new TableRow({
        children: [
          new TableCell({
            width: { size: 2200, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: "C", bold: true, color: "000000" })] })]
          }),
          new TableCell({
            width: { size: 7800, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: optC, color: "000000" })] })]
          })
        ]
      }),
      // Dòng 5: D | Đáp án D
      new TableRow({
        children: [
          new TableCell({
            width: { size: 2200, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: "D", bold: true, color: "000000" })] })]
          }),
          new TableCell({
            width: { size: 7800, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: optD, color: "000000" })] })]
          })
        ]
      }),
      // Dòng 6: E | Đáp án E
      new TableRow({
        children: [
          new TableCell({
            width: { size: 2200, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: "E", bold: true, color: "000000" })] })]
          }),
          new TableCell({
            width: { size: 7800, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: optE, color: "000000" })] })]
          })
        ]
      }),
      // Dòng 7: Lời giải | Hướng dẫn giải
      new TableRow({
        children: [
          new TableCell({
            width: { size: 2200, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: "Lời giải", bold: true, color: "000000" })] })]
          }),
          new TableCell({
            width: { size: 7800, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: exp, color: "000000" })] })]
          })
        ]
      }),
      // Dòng 8: Đáp án | Ký tự đáp án đúng
      new TableRow({
        children: [
          new TableCell({
            width: { size: 2200, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: "Đáp án", bold: true, color: "000000" })] })]
          }),
          new TableCell({
            width: { size: 7800, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: ans, bold: true, color: "000000" })] })]
          })
        ]
      })
    ]
  });
}

/**
 * SINH VÀ TẢI FILE WORD (.DOCX) MẪU CHUẨN BẢNG 7 DÒNG x 2 CỘT CHO GAME BẢO VỆ CHIẾN HÀO
 */
export async function downloadChienHaoWordTemplate(): Promise<void> {
  const sectionsContent: any[] = [
    new Paragraph({
      children: [
        new TextRun({
          text: "MẪU ĐỀ GAME BẢO VỆ CHIẾN HÀO (CHUẨN BẢNG 7 DÒNG x 2 CỘT)",
          bold: true,
          size: 26,
          color: "000000"
        })
      ],
      spacing: { after: 120 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "Chỉ thị cấu trúc bảng: Mỗi câu hỏi tương ứng 1 bảng gồm 2 cột x 7 dòng. Dòng 1: Câu [Số] | Đề bài (chấp nhận mã TeX và Link ảnh <img>). Dòng 2, 3, 4, 5: A), B), C), D) | Nội dung các đáp án. Dòng 6: Lời giải | Hướng dẫn giải chi tiết. Dòng 7: Đáp án | Ký tự duy nhất (A, B, C hoặc D).",
          size: 19,
          color: "333333"
        })
      ],
      spacing: { after: 200 }
    }),

    // HEADING LEVEL 1
    new Paragraph({
      children: [new TextRun({ text: "PHẦN 1: MỨC ĐỘ 1 (DỄ)", bold: true, color: "000000", size: 24 })],
      spacing: { before: 200, after: 120 }
    }),
    createChienHaoQuestionTable(
      1,
      "Cho góc \\alpha \\in [0^\\circ; 180^\\circ]. Khẳng định nào sau đây là SAI?",
      "\\sin(180^\\circ - \\alpha) = \\sin \\alpha",
      "\\cos(180^\\circ - \\alpha) = -\\cos \\alpha",
      "\\tan(180^\\circ - \\alpha) = \\tan \\alpha",
      "\\cot(180^\\circ - \\alpha) = -\\cot \\alpha",
      "Ta có \\tan(180^\\circ - \\alpha) = -\\tan \\alpha, do đó khẳng định C là khẳng định sai.",
      "C"
    ),
    new Paragraph({ text: "", spacing: { after: 150 } }),
    createChienHaoQuestionTable(
      2,
      "Giá trị của \\cos 60^\\circ + \\sin 30^\\circ bằng bao nhiêu?",
      "1",
      "\\frac{1}{2}",
      "\\frac{\\sqrt{3}}{2}",
      "\\sqrt{3}",
      "Ta có \\cos 60^\\circ = \\frac{1}{2} và \\sin 30^\\circ = \\frac{1}{2}. Do đó tổng bằng 1/2 + 1/2 = 1.",
      "A"
    ),

    // HEADING LEVEL 2
    new Paragraph({
      children: [new TextRun({ text: "PHẦN 2: MỨC ĐỘ 2 (TRUNG BÌNH)", bold: true, color: "000000", size: 24 })],
      spacing: { before: 250, after: 120 }
    }),
    createChienHaoQuestionTable(
      3,
      "Cho tam giác ABC có AB = 3, AC = 4, góc A = 90 độ. Độ dài cạnh BC bằng:",
      "5",
      "7",
      "\\sqrt{7}",
      "25",
      "Áp dụng định lý Pytago: BC = \\sqrt{AB^2 + AC^2} = \\sqrt{3^2 + 4^2} = 5.",
      "A"
    ),
    new Paragraph({ text: "", spacing: { after: 150 } }),
    createChienHaoQuestionTable(
      4,
      "Tính diện tích tam giác ABC có a = 4, b = 5 và góc C = 30 độ:",
      "5",
      "10",
      "20",
      "5\\sqrt{3}",
      "Diện tích S = \\frac{1}{2}ab\\sin C = \\frac{1}{2} \\cdot 4 \\cdot 5 \\cdot \\sin 30^\\circ = 10 \\cdot \\frac{1}{2} = 5.",
      "A"
    ),

    // HEADING LEVEL 3
    new Paragraph({
      children: [new TextRun({ text: "PHẦN 3: MỨC ĐỘ 3 (KHÓ)", bold: true, color: "000000", size: 24 })],
      spacing: { before: 250, after: 120 }
    }),
    createChienHaoQuestionTable(
      5,
      "Kéo một vật nặng với lực F = 2000 N, dây cáp hợp góc 60 độ so với phương ngang. Công thực hiện khi vật đi được quãng đường 500 m là:",
      "0.5 \\cdot 10^6\\text{ J}",
      "1.0 \\cdot 10^6\\text{ J}",
      "0.5\\sqrt{3} \\cdot 10^6\\text{ J}",
      "2.0 \\cdot 10^6\\text{ J}",
      "Công A = F \\cdot s \\cdot \\cos \\alpha = 2000 \\cdot 500 \\cdot \\cos 60^\\circ = 10^6 \\cdot 0.5 = 0.5 \\cdot 10^6\\text{ J}.",
      "A"
    )
  ];

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: sectionsContent
      }
    ]
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, "Mau_Bao_Ve_Chien_Hao_7_Dong.docx");
}

/**
 * SINH VÀ TẢI FILE EXCEL (.XLSX) MẪU CHO GAME BẢO VỆ CHIẾN HÀO
 */
export async function downloadChienHaoExcelTemplate(): Promise<void> {
  const { XLSX } = await loadDocumentLibraries();
  const headers = [
    "Mức Độ (Level 1, Level 2, Level 3)",
    "Nội Dung Câu Hỏi (Hỗ trợ TeX)",
    "Link/Tên Ảnh (Tùy chọn)",
    "Lựa Chọn A",
    "Lựa Chọn B",
    "Lựa Chọn C",
    "Lựa Chọn D",
    "Đáp Án Đúng (A, B, C, hoặc D)",
    "Lời Giải Chi Tiết"
  ];

  const sampleRows = [
    [
      "Level 1",
      "Cho góc \\alpha \\in [0^\\circ; 180^\\circ]. Khẳng định nào sau đây là SAI?",
      "",
      "\\sin(180^\\circ - \\alpha) = \\sin \\alpha",
      "\\cos(180^\\circ - \\alpha) = -\\cos \\alpha",
      "\\tan(180^\\circ - \\alpha) = \\tan \\alpha",
      "\\cot(180^\\circ - \\alpha) = -\\cot \\alpha",
      "C",
      "Ta có \\tan(180^\\circ - \\alpha) = -\\tan \\alpha, do đó khẳng định C là sai."
    ],
    [
      "Level 1",
      "Giá trị của \\cos 60^\\circ + \\sin 30^\\circ bằng bao nhiêu?",
      "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600",
      "1",
      "\\frac{1}{2}",
      "\\frac{\\sqrt{3}}{2}",
      "\\sqrt{3}",
      "A",
      "Ta có \\cos 60^\\circ = 1/2 và \\sin 30^\\circ = 1/2, tổng bằng 1."
    ],
    [
      "Level 2",
      "Cho tam giác ABC có a = 3, b = 4, C = 90 độ. Cạnh c bằng:",
      "",
      "5",
      "7",
      "\\sqrt{7}",
      "25",
      "A",
      "Theo định lý Pytago: c = \\sqrt{3^2 + 4^2} = 5."
    ],
    [
      "Level 2",
      "Tính diện tích tam giác ABC biết a = 4, b = 5, C = 30 độ:",
      "",
      "5",
      "10",
      "20",
      "5\\sqrt{3}",
      "A",
      "S = 1/2 * a * b * \\sin C = 1/2 * 4 * 5 * 1/2 = 5."
    ],
    [
      "Level 3",
      "Kéo sà lan lực F = 2000 N, cáp hợp góc 60 độ. Công A sinh ra khi đi 500 m là:",
      "",
      "0.5 * 10^6 J",
      "1.0 * 10^6 J",
      "0.5\\sqrt{3} * 10^6 J",
      "2.0 * 10^6 J",
      "A",
      "A = F * s * \\cos 60 = 2000 * 500 * 0.5 = 0.5 * 10^6 J."
    ]
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
  ws['!cols'] = [
    { wch: 18 },
    { wch: 45 },
    { wch: 30 },
    { wch: 25 },
    { wch: 25 },
    { wch: 25 },
    { wch: 25 },
    { wch: 12 },
    { wch: 45 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Mau_Bao_Ve_Chien_Hao");
  XLSX.writeFile(wb, "Mau_Bao_Ve_Chien_Hao.xlsx");
}

/**
 * SINH VÀ TẢI FILE WORD (.DOCX) MẪU CHUẨN BẢNG 7 DÒNG x 2 CỘT CHO GAME SÚT PENALTY (3 GIAI ĐOẠN ĐỘ KHÓ)
 */
export async function downloadSutPenWordTemplate(): Promise<void> {
  const sectionsContent: any[] = [
    new Paragraph({
      children: [
        new TextRun({
          text: "MẪU ĐỀ GAME SÚT PENALTY (CHUẨN BẢNG 7 DÒNG x 2 CỘT)",
          bold: true,
          size: 26,
          color: "000000"
        })
      ],
      spacing: { after: 120 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "Chỉ thị cấu trúc bảng: Mỗi câu hỏi tương ứng 1 bảng gồm 2 cột x 7 dòng. Dòng 1: Câu [Số] | Đề bài (chấp nhận mã TeX và Link ảnh <img>). Dòng 2, 3, 4, 5: A), B), C), D) | Nội dung các đáp án. Dòng 6: Lời giải | Hướng dẫn giải chi tiết (Hiển thị khi sút trượt). Dòng 7: Đáp án | Ký tự duy nhất (A, B, C hoặc D).",
          size: 19,
          color: "333333"
        })
      ],
      spacing: { after: 200 }
    }),

    // HEADING LEVEL 1: VÒNG BẢNG
    new Paragraph({
      children: [new TextRun({ text: "PHẦN 1: MỨC ĐỘ 1 (DỄ)", bold: true, color: "000000", size: 24 })],
      spacing: { before: 200, after: 120 }
    }),
    createChienHaoQuestionTable(
      1,
      "Giá trị của \\sin 30^\\circ bằng bao nhiêu?",
      "\\frac{1}{2}",
      "\\frac{\\sqrt{3}}{2}",
      "1",
      "\\frac{\\sqrt{2}}{2}",
      "Theo bảng giá trị lượng giác các góc đặc biệt: \\sin 30^\\circ = \\frac{1}{2}.",
      "A"
    ),
    new Paragraph({ text: "", spacing: { after: 150 } }),
    createChienHaoQuestionTable(
      2,
      "Giá trị của \\cos 60^\\circ bằng bao nhiêu?",
      "\\frac{1}{2}",
      "0",
      "\\frac{\\sqrt{3}}{2}",
      "-1",
      "Theo bảng giá trị lượng giác: \\cos 60^\\circ = \\frac{1}{2}.",
      "A"
    ),

    // HEADING LEVEL 2: BÁN KẾT
    new Paragraph({
      children: [new TextRun({ text: "PHẦN 2: MỨC ĐỘ 2 (TRUNG BÌNH)", bold: true, color: "000000", size: 24 })],
      spacing: { before: 250, after: 120 }
    }),
    createChienHaoQuestionTable(
      3,
      "Giá trị của \\sin 150^\\circ bằng bao nhiêu?",
      "\\frac{1}{2}",
      "-\\frac{1}{2}",
      "\\frac{\\sqrt{3}}{2}",
      "0",
      "Ta có \\sin 150^\\circ = \\sin(180^\\circ - 30^\\circ) = \\sin 30^\\circ = \\frac{1}{2}.",
      "A"
    ),
    new Paragraph({ text: "", spacing: { after: 150 } }),
    createChienHaoQuestionTable(
      4,
      "Giá trị của \\cos 120^\\circ bằng bao nhiêu?",
      "-\\frac{1}{2}",
      "\\frac{1}{2}",
      "-\\frac{\\sqrt{3}}{2}",
      "0",
      "Ta có \\cos 120^\\circ = -\\cos(180^\\circ - 120^\\circ) = -\\cos 60^\\circ = -\\frac{1}{2}.",
      "A"
    ),

    // HEADING LEVEL 3: CHUNG KẾT
    new Paragraph({
      children: [new TextRun({ text: "PHẦN 3: MỨC ĐỘ 3 (KHÓ)", bold: true, color: "000000", size: 24 })],
      spacing: { before: 250, after: 120 }
    }),
    createChienHaoQuestionTable(
      5,
      "Cho góc tù \\alpha có \\sin \\alpha = \\frac{3}{5}. Tính \\cos \\alpha:",
      "-\\frac{4}{5}",
      "\\frac{4}{5}",
      "\\frac{1}{5}",
      "-\\frac{3}{5}",
      "Vì \\alpha là góc tù (90^\\circ < \\alpha < 180^\\circ) nên \\cos \\alpha < 0. Do đó \\cos \\alpha = -\\sqrt{1 - \\sin^2 \\alpha} = -\\frac{4}{5}.",
      "A"
    )
  ];

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: sectionsContent
      }
    ]
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, "Mau_Sut_Penalty_7_Dong.docx");
}

/**
 * SINH VÀ TẢI FILE EXCEL (.XLSX) MẪU CHO GAME SÚT PENALTY
 */
export async function downloadSutPenExcelTemplate(): Promise<void> {
  const { XLSX } = await loadDocumentLibraries();
  const headers = [
    "Mức Độ (Level 1, Level 2, Level 3)",
    "Nội Dung Câu Hỏi (Hỗ trợ TeX)",
    "Link/Tên Ảnh (Tùy chọn)",
    "Lựa Chọn A",
    "Lựa Chọn B",
    "Lựa Chọn C",
    "Lựa Chọn D",
    "Đáp Án Đúng (A, B, C, hoặc D)",
    "Lời Giải Chi Tiết"
  ];

  const sampleRows = [
    [
      "Level 1",
      "Giá trị của \\sin 30^\\circ bằng bao nhiêu?",
      "",
      "\\frac{1}{2}",
      "\\frac{\\sqrt{3}}{2}",
      "1",
      "\\frac{\\sqrt{2}}{2}",
      "A",
      "\\sin 30^\\circ = 1/2."
    ],
    [
      "Level 1",
      "Giá trị của \\cos 60^\\circ bằng bao nhiêu?",
      "",
      "\\frac{1}{2}",
      "0",
      "\\frac{\\sqrt{3}}{2}",
      "-1",
      "A",
      "\\cos 60^\\circ = 1/2."
    ],
    [
      "Level 2",
      "Giá trị của \\sin 150^\\circ bằng bao nhiêu?",
      "",
      "\\frac{1}{2}",
      "-\\frac{1}{2}",
      "\\frac{\\sqrt{3}}{2}",
      "0",
      "A",
      "\\sin 150^\\circ = \\sin(180^\\circ - 30^\\circ) = 1/2."
    ],
    [
      "Level 2",
      "Giá trị của \\cos 120^\\circ bằng bao nhiêu?",
      "",
      "-\\frac{1}{2}",
      "\\frac{1}{2}",
      "-\\frac{\\sqrt{3}}{2}",
      "0",
      "A",
      "\\cos 120^\\circ = -\\cos 60^\\circ = -1/2."
    ],
    [
      "Level 3",
      "Cho góc tù \\alpha có \\sin \\alpha = \\frac{3}{5}. Tính \\cos \\alpha:",
      "",
      "-\\frac{4}{5}",
      "\\frac{4}{5}",
      "\\frac{1}{5}",
      "-\\frac{3}{5}",
      "A",
      "Góc tù có \\cos < 0 nên \\cos \\alpha = -4/5."
    ]
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
  ws['!cols'] = [
    { wch: 18 },
    { wch: 45 },
    { wch: 30 },
    { wch: 25 },
    { wch: 25 },
    { wch: 25 },
    { wch: 25 },
    { wch: 12 },
    { wch: 45 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Mau_Sut_Penalty");
  XLSX.writeFile(wb, "Mau_Sut_Penalty.xlsx");
}

/**
 * SINH VÀ TẢI FILE WORD (.DOCX) MẪU CHUẨN BẢNG 8 DÒNG x 2 CỘT CHO GAME BẮN CHIM (3 MỨC ĐỘ ĐỘ KHÓ)
 */
export async function downloadBanChimWordTemplate(): Promise<void> {
  const sectionsContent: any[] = [
    new Paragraph({
      children: [
        new TextRun({
          text: "MẪU ĐỀ GAME BẮN CHIM (CHUẨN BẢNG 8 DÒNG x 2 CỘT)",
          bold: true,
          size: 26,
          color: "000000"
        })
      ],
      spacing: { after: 120 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "Chỉ thị cấu trúc bảng: Mỗi câu hỏi tương ứng 1 bảng gồm 2 cột x 8 dòng. Dòng 1: Câu [Số]: [Mức độ] | Đề bài (chấp nhận mã TeX và Link ảnh <img>). Dòng 2, 3, 4, 5, 6: A, B, C, D, E | Nội dung 5 đáp án hiển thị trên 5 con chim. Dòng 7: Lời giải | Hướng dẫn giải chi tiết (Hiển thị khi kết thúc sớm hoặc làm sai). Dòng 8: Đáp án | Ký tự duy nhất (A, B, C, D hoặc E).",
          size: 19,
          color: "333333"
        })
      ],
      spacing: { after: 200 }
    }),

    // HEADING LEVEL 1
    new Paragraph({
      children: [new TextRun({ text: "PHẦN 1: MỨC ĐỘ 1 (DỄ)", bold: true, color: "000000", size: 24 })],
      spacing: { before: 200, after: 120 }
    }),
    createBanChimQuestionTable(
      1,
      "Dễ",
      "Gieo một con xúc xắc cân đối, đồng chất. Số phần tử của không gian mẫu \\( n(\\Omega) \\) bằng bao nhiêu?",
      "6",
      "1",
      "36",
      "12",
      "8",
      "Không gian mẫu khi gieo một con xúc xắc là \\( \\Omega = \\{1, 2, 3, 4, 5, 6\\} \\), do đó \\( n(\\Omega) = 6 \\).",
      "A"
    ),
    new Paragraph({ text: "", spacing: { after: 150 } }),
    createBanChimQuestionTable(
      2,
      "Dễ",
      "Gieo một con xúc xắc. Gọi A là biến cố 'Xuất hiện mặt chẵn'. Số phần tử \\( n(A) \\) bằng bao nhiêu?",
      "3",
      "2",
      "4",
      "6",
      "1",
      "Các mặt chẵn là \\{2, 4, 6\\}, do đó \\( n(A) = 3 \\).",
      "A"
    ),

    // HEADING LEVEL 2
    new Paragraph({
      children: [new TextRun({ text: "PHẦN 2: MỨC ĐỘ 2 (TRUNG BÌNH)", bold: true, color: "000000", size: 24 })],
      spacing: { before: 250, after: 120 }
    }),
    createBanChimQuestionTable(
      3,
      "Trung bình",
      "Một hộp có 4 viên bi Xanh và 3 viên bi Đỏ. Lấy ngẫu nhiên 2 viên bi. Số phần tử của không gian mẫu \\( n(\\Omega) \\) bằng:",
      "21",
      "12",
      "7",
      "42",
      "14",
      "Số phần tử của không gian mẫu là \\( C_7^2 = 21 \\).",
      "A"
    ),
    new Paragraph({ text: "", spacing: { after: 150 } }),
    createBanChimQuestionTable(
      4,
      "Trung bình",
      "Một hộp có 4 viên bi Xanh và 3 viên bi Đỏ. Lấy ngẫu nhiên 2 viên bi. Xác suất để cả 2 viên bi đều là màu Xanh bằng:",
      "2/7",
      "1/7",
      "4/7",
      "3/7",
      "5/7",
      "Số cách chọn 2 viên bi Xanh là \\( C_4^2 = 6 \\). Xác suất bằng \\( 6/21 = 2/7 \\).",
      "A"
    ),

    // HEADING LEVEL 3
    new Paragraph({
      children: [new TextRun({ text: "PHẦN 3: MỨC ĐỘ 3 (KHÓ)", bold: true, color: "000000", size: 24 })],
      spacing: { before: 250, after: 120 }
    }),
    createBanChimQuestionTable(
      5,
      "Khó",
      "Cho hai biến cố độc lập A và B. Biết \\( P(A) = 0.4 \\) và \\( P(B) = 0.5 \\). Tính xác suất \\( P(A \\cap B) \\).",
      "0.2",
      "0.9",
      "0.1",
      "0.45",
      "0.25",
      "Vì A và B độc lập nên \\( P(A \\cap B) = P(A) \\cdot P(B) = 0.4 \\times 0.5 = 0.2 \\).",
      "A"
    )
  ];

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: sectionsContent
      }
    ]
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, "Mau_Ban_Chim_8_Dong.docx");
}

/**
 * SINH VÀ TẢI FILE EXCEL (.XLSX) MẪU CHO GAME BẮN CHIM
 */
export async function downloadBanChimExcelTemplate(): Promise<void> {
  const { XLSX } = await loadDocumentLibraries();
  const headers = [
    "Mức Độ (Level 1, Level 2, Level 3)",
    "Nội Dung Câu Hỏi (Hỗ trợ TeX)",
    "Link/Tên Ảnh (Tùy chọn)",
    "Lựa Chọn A",
    "Lựa Chọn B",
    "Lựa Chọn C",
    "Lựa Chọn D",
    "Lựa Chọn E",
    "Đáp Án Đúng (A, B, C, D hoặc E)",
    "Lời Giải Chi Tiết"
  ];

  const sampleRows = [
    [
      "Level 1",
      "Gieo một con xúc xắc. Số phần tử của không gian mẫu bằng bao nhiêu?",
      "",
      "6",
      "1",
      "36",
      "12",
      "8",
      "A",
      "Không gian mẫu gồm 6 phần tử."
    ],
    [
      "Level 1",
      "Gieo một con xúc xắc. Gọi A là biến cố 'Xuất hiện mặt chẵn'. Số phần tử n(A) bằng:",
      "",
      "3",
      "2",
      "4",
      "6",
      "1",
      "A",
      "Có 3 mặt chẵn: 2, 4, 6."
    ],
    [
      "Level 2",
      "Một hộp có 4 bi Xanh, 3 bi Đỏ. Lấy ngẫu nhiên 2 viên bi. Số phần tử n(Ω) bằng:",
      "",
      "21",
      "12",
      "7",
      "42",
      "14",
      "A",
      "C(7,2) = 21."
    ],
    [
      "Level 3",
      "Cho hai biến cố độc lập A và B có P(A)=0.4, P(B)=0.5. Tính P(A ∩ B):",
      "",
      "0.2",
      "0.9",
      "0.1",
      "0.45",
      "0.25",
      "A",
      "P(A ∩ B) = P(A)*P(B) = 0.2."
    ]
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
  ws['!cols'] = [
    { wch: 18 },
    { wch: 45 },
    { wch: 30 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 12 },
    { wch: 45 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Mau_Ban_Chim");
  XLSX.writeFile(wb, "Mau_Ban_Chim.xlsx");
}

/**
 * HÀM TẠO BẢNG CÂU HỎI ĐÚNG / SAI 9 DÒNG x 2 CỘT CHO GAME YOGA (DOCX) - ĐEN TRẮNG TIÊU CHUẨN
 */
function createYogaTFQuestionTable(
  qNum: number,
  levelText: string,
  stem: string,
  stmtA: string, ansA: string, expA: string,
  stmtB: string, ansB: string, expB: string,
  stmtC: string, ansC: string, expC: string,
  stmtD: string, ansD: string, expD: string
): Table {
  return new Table({
    width: { size: 10000, type: WidthType.DXA },
    rows: [
      // Dòng 1: Câu [N] (Đ/S): [Mức độ] | Thân bài (Stem)
      new TableRow({
        children: [
          new TableCell({
            width: { size: 2500, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: `Câu ${qNum} (Đ/S): [${levelText}]`, bold: true, color: "000000", size: 21 })] })]
          }),
          new TableCell({
            width: { size: 7500, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: stem, color: "000000", size: 21 })] })]
          })
        ]
      }),
      // Dòng 2: a) | Phát biểu a
      new TableRow({
        children: [
          new TableCell({
            width: { size: 2500, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: "a)", bold: true, color: "000000" })] })]
          }),
          new TableCell({
            width: { size: 7500, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: stmtA, color: "000000" })] })]
          })
        ]
      }),
      // Dòng 3: Đúng/Sai | ansA + expA
      new TableRow({
        children: [
          new TableCell({
            width: { size: 2500, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: "Đúng/Sai", bold: true, color: "000000" })] })]
          }),
          new TableCell({
            width: { size: 7500, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: `${ansA} - ${expA}`, color: "000000" })] })]
          })
        ]
      }),
      // Dòng 4: b) | Phát biểu b
      new TableRow({
        children: [
          new TableCell({
            width: { size: 2500, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: "b)", bold: true, color: "000000" })] })]
          }),
          new TableCell({
            width: { size: 7500, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: stmtB, color: "000000" })] })]
          })
        ]
      }),
      // Dòng 5: Đúng/Sai | ansB + expB
      new TableRow({
        children: [
          new TableCell({
            width: { size: 2500, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: "Đúng/Sai", bold: true, color: "000000" })] })]
          }),
          new TableCell({
            width: { size: 7500, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: `${ansB} - ${expB}`, color: "000000" })] })]
          })
        ]
      }),
      // Dòng 6: c) | Phát biểu c
      new TableRow({
        children: [
          new TableCell({
            width: { size: 2500, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: "c)", bold: true, color: "000000" })] })]
          }),
          new TableCell({
            width: { size: 7500, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: stmtC, color: "000000" })] })]
          })
        ]
      }),
      // Dòng 7: Đúng/Sai | ansC + expC
      new TableRow({
        children: [
          new TableCell({
            width: { size: 2500, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: "Đúng/Sai", bold: true, color: "000000" })] })]
          }),
          new TableCell({
            width: { size: 7500, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: `${ansC} - ${expC}`, color: "000000" })] })]
          })
        ]
      }),
      // Dòng 8: d) | Phát biểu d
      new TableRow({
        children: [
          new TableCell({
            width: { size: 2500, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: "d)", bold: true, color: "000000" })] })]
          }),
          new TableCell({
            width: { size: 7500, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: stmtD, color: "000000" })] })]
          })
        ]
      }),
      // Dòng 9: Đúng/Sai | ansD + expD
      new TableRow({
        children: [
          new TableCell({
            width: { size: 2500, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: "Đúng/Sai", bold: true, color: "000000" })] })]
          }),
          new TableCell({
            width: { size: 7500, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: `${ansD} - ${expD}`, color: "000000" })] })]
          })
        ]
      })
    ]
  });
}

/**
 * SINH VÀ TẢI FILE WORD (.DOCX) MẪU CHO GAME AI YOGA VẬN ĐỘNG (CHUẨN BẢNG ĐEN TRẮNG MC & ĐÚNG/SAI 4 Ý)
 */
export async function downloadYogaWordTemplate(): Promise<void> {
  const sectionsContent: any[] = [
    new Paragraph({
      children: [
        new TextRun({
          text: "MẪU ĐỀ GAME AI YOGA VẬN ĐỘNG (CHUẨN BẢNG ĐEN TRẮNG ĐA DẠNG MC & ĐÚNG/SAI)",
          bold: true,
          size: 26,
          color: "000000"
        })
      ],
      spacing: { after: 120 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "Chỉ thị cấu trúc: Hỗ trợ song song 2 dạng bảng chuẩn đen trắng (không đổ màu ô):\n" +
                "1. Dạng Trắc nghiệm 4 lựa chọn (MC): Bảng 2 cột x 7 dòng (Dòng 1: Câu [N]: [Mức độ] | Đề bài; Dòng 2..5: A), B), C), D) | 4 đáp án; Dòng 6: Lời giải; Dòng 7: Đáp án đúng A/B/C/D).\n" +
                "2. Dạng Đúng/Sai 4 ý (TF): Bảng 2 cột x 9 dòng (Dòng 1: Câu [N] (Đ/S): [Mức độ] | Ngữ cảnh chung; Dòng 2, 4, 6, 8: a), b), c), d); Dòng 3, 5, 7, 9: Đúng/Sai | Ghi 'Đúng' hoặc 'Sai' kèm lời giải).\n" +
                "Hệ thống tự động bóc tách thành 4 bài tập phản xạ nghiêng đầu cho mỗi câu Đúng/Sai khi chơi và nhận diện 3 chuyên đề x 3 cấp độ (Dễ, Vừa, Khó).",
          size: 19,
          color: "333333"
        })
      ],
      spacing: { after: 200 }
    }),

    // ==========================================
    // CHUYÊN ĐỀ 1
    // ==========================================
    new Paragraph({
      children: [new TextRun({ text: "CHỦ ĐỀ 1: BIẾN CỐ GIAO, HỢP & BIẾN CỐ ĐỘC LẬP", bold: true, color: "000000", size: 24 })],
      spacing: { before: 200, after: 120 }
    }),
    new Paragraph({
      children: [new TextRun({ text: "PHẦN 1: MỨC ĐỘ 1 (DỄ)", bold: true, color: "000000", size: 22 })],
      spacing: { before: 100, after: 100 }
    }),
    createYogaTFQuestionTable(
      1,
      "Dễ",
      "Cho hai biến cố A và B bất kỳ trong phép thử. Xét tính Đúng/Sai của các mệnh đề sau:",
      "Nếu A và B xung khắc thì \\( P(A \\cap B) = 0 \\).", "Đúng", "Hai biến cố xung khắc không thể cùng xảy ra.",
      "Nếu A và B độc lập thì \\( P(A \\cap B) = P(A) \\cdot P(B) \\).", "Đúng", "Theo định nghĩa hai biến cố độc lập.",
      "Hai biến cố xung khắc luôn luôn là hai biến cố độc lập.", "Sai", "Hai biến cố xung khắc không độc lập nếu xác suất lớn hơn 0.",
      "Ta luôn có \\( P(A \\cup B) = P(A) + P(B) - P(A \\cap B) \\).", "Đúng", "Công thức cộng xác suất tổng quát."
    ),
    new Paragraph({ text: "", spacing: { after: 150 } }),
    createChienHaoQuestionTable(
      2,
      "Cho \\( A, B \\) là hai biến cố xung khắc có \\( P(A) = 0.3 \\) và \\( P(B) = 0.4 \\). Giá trị \\( P(A \\cup B) \\) bằng:",
      "0.7",
      "0.12",
      "0.1",
      "0.8",
      "Vì A và B xung khắc nên \\( P(A \\cup B) = P(A) + P(B) = 0.3 + 0.4 = 0.7 \\).",
      "A"
    ),

    new Paragraph({
      children: [new TextRun({ text: "PHẦN 2: MỨC ĐỘ 2 (TRUNG BÌNH)", bold: true, color: "000000", size: 22 })],
      spacing: { before: 200, after: 100 }
    }),
    createYogaTFQuestionTable(
      3,
      "Trung bình",
      "Hai xạ thủ bắn bia độc lập. Xác suất bắn trúng của người 1 là 0.8, người 2 là 0.7. Xét tính Đúng/Sai:",
      "Xác suất để cả hai người cùng bắn trúng bia là 0.56.", "Đúng", "\\( P = 0.8 \\times 0.7 = 0.56 \\).",
      "Xác suất để cả hai người cùng bắn trượt là 0.06.", "Đúng", "\\( P = (1 - 0.8) \\times (1 - 0.7) = 0.06 \\).",
      "Xác suất có ít nhất một người bắn trúng bia là 0.94.", "Đúng", "\\( 1 - 0.06 = 0.94 \\).",
      "Xác suất có đúng một người bắn trúng bia là 0.50.", "Sai", "\\( 0.8 \\times 0.3 + 0.2 \\times 0.7 = 0.38 \\)."
    ),
    new Paragraph({ text: "", spacing: { after: 150 } }),
    createChienHaoQuestionTable(
      4,
      "Gieo 2 đồng xu cân đối, đồng chất. Xác suất xuất hiện ít nhất một mặt sấp bằng:",
      "3/4",
      "1/4",
      "1/2",
      "1",
      "Không gian mẫu gồm 4 phần tử. Biến cố đối cả hai ngửa gồm 1 phần tử. XS bằng 1 - 1/4 = 3/4.",
      "A"
    ),

    new Paragraph({
      children: [new TextRun({ text: "PHẦN 3: MỨC ĐỘ 3 (KHÓ)", bold: true, color: "000000", size: 22 })],
      spacing: { before: 200, after: 100 }
    }),
    createChienHaoQuestionTable(
      5,
      "Bắn 3 phát đạn độc lập với xác suất trúng mỗi phát là 0.6. Xác suất trúng đúng 2 phát là:",
      "0.432",
      "0.216",
      "0.288",
      "0.144",
      "Áp dụng phân bố nhị thức: \\( C_3^2 \\times 0.6^2 \\times 0.4 = 3 \\times 0.36 \\times 0.4 = 0.432 \\).",
      "A"
    ),

    // ==========================================
    // CHUYÊN ĐỀ 2
    // ==========================================
    new Paragraph({
      children: [new TextRun({ text: "CHỦ ĐỀ 2: XÁC SUẤT CÓ ĐIỀU KIỆN & CÔNG THỨC TOÀN PHẦN", bold: true, color: "000000", size: 24 })],
      spacing: { before: 250, after: 120 }
    }),
    new Paragraph({
      children: [new TextRun({ text: "PHẦN 1: MỨC ĐỘ 1 (DỄ)", bold: true, color: "000000", size: 22 })],
      spacing: { before: 100, after: 100 }
    }),
    createChienHaoQuestionTable(
      6,
      "Cho \\( P(A \\cap B) = 0.2 \\) và \\( P(B) = 0.5 \\). Xác suất có điều kiện \\( P(A|B) \\) bằng:",
      "0.4",
      "0.1",
      "0.7",
      "0.25",
      "Ta có \\( P(A|B) = \\frac{P(A \\cap B)}{P(B)} = \\frac{0.2}{0.5} = 0.4 \\).",
      "A"
    ),

    new Paragraph({
      children: [new TextRun({ text: "PHẦN 2: MỨC ĐỘ 2 (TRUNG BÌNH)", bold: true, color: "000000", size: 22 })],
      spacing: { before: 200, after: 100 }
    }),
    createYogaTFQuestionTable(
      7,
      "Trung bình",
      "Hộp có 3 bi đỏ và 2 bi xanh. Lấy lần lượt 2 viên không hoàn lại. A: 'Bi 1 đỏ', B: 'Bi 2 xanh'. Xét tính Đúng/Sai:",
      "Xác suất \\( P(A) = 3/5 \\).", "Đúng", "Ban đầu có 3 viên đỏ trên tổng số 5 viên.",
      "Xác suất có điều kiện \\( P(B|A) = 1/2 \\).", "Đúng", "Sau khi lấy 1 đỏ, hộp còn 2 đỏ và 2 xanh nên XS là 2/4 = 1/2.",
      "Xác suất \\( P(A \\cap B) = 3/10 \\).", "Đúng", "\\( P(A \\cap B) = P(A) \\cdot P(B|A) = 3/5 \\times 1/2 = 3/10 \\).",
      "Hai biến cố A và B độc lập với nhau.", "Sai", "Vì lấy không hoàn lại nên kết quả lần 1 làm thay đổi xác suất lần 2."
    ),

    new Paragraph({
      children: [new TextRun({ text: "PHẦN 3: MỨC ĐỘ 3 (KHÓ)", bold: true, color: "000000", size: 22 })],
      spacing: { before: 200, after: 100 }
    }),
    createChienHaoQuestionTable(
      8,
      "Cho \\( P(A) = 0.4, P(B|A) = 0.6, P(B|\\overline{A}) = 0.3 \\). Giá trị \\( P(B) \\) theo công thức toàn phần bằng:",
      "0.42",
      "0.36",
      "0.48",
      "0.50",
      "\\( P(B) = P(A)P(B|A) + P(\\overline{A})P(B|\\overline{A}) = 0.4 \\times 0.6 + 0.6 \\times 0.3 = 0.42 \\).",
      "A"
    ),

    // ==========================================
    // CHUYÊN ĐỀ 3
    // ==========================================
    new Paragraph({
      children: [new TextRun({ text: "CHỦ ĐỀ 3: ÔN TẬP TỔNG HỢP XÁC SUẤT & QUY TẮC ĐẾM", bold: true, color: "000000", size: 24 })],
      spacing: { before: 250, after: 120 }
    }),
    new Paragraph({
      children: [new TextRun({ text: "PHẦN 1: MỨC ĐỘ 1 (DỄ)", bold: true, color: "000000", size: 22 })],
      spacing: { before: 100, after: 100 }
    }),
    createChienHaoQuestionTable(
      9,
      "Có 5 bạn nam và 4 bạn nữ. Số cách chọn 1 bạn làm lớp trưởng là:",
      "9",
      "20",
      "5",
      "4",
      "Theo quy tắc cộng: 5 + 4 = 9 cách.",
      "A"
    ),

    new Paragraph({
      children: [new TextRun({ text: "PHẦN 2: MỨC ĐỘ 2 (TRUNG BÌNH)", bold: true, color: "000000", size: 22 })],
      spacing: { before: 200, after: 100 }
    }),
    createChienHaoQuestionTable(
      10,
      "Từ tập hợp \\{1, 2, 3, 4, 5, 6\\} lập được bao nhiêu số tự nhiên chẵn gồm 3 chữ số khác nhau?",
      "60",
      "120",
      "30",
      "90",
      "Chữ số cuối có 3 cách (2, 4, 6), hai chữ số đầu có \\( A_5^2 = 20 \\) cách. Số các số là 3 * 20 = 60.",
      "A"
    ),

    new Paragraph({
      children: [new TextRun({ text: "PHẦN 3: MỨC ĐỘ 3 (KHÓ)", bold: true, color: "000000", size: 22 })],
      spacing: { before: 200, after: 100 }
    }),
    createYogaTFQuestionTable(
      11,
      "Khó",
      "Cho đa giác lồi có 10 đỉnh. Xét tính Đúng/Sai của các mệnh đề sau:",
      "Số tam giác có các đỉnh là đỉnh của đa giác bằng \\( C_{10}^3 = 120 \\).", "Đúng", "Chọn 3 đỉnh bất kỳ từ 10 đỉnh tạo thành 1 tam giác.",
      "Số đoạn thẳng nối 2 đỉnh bất kỳ của đa giác là 45.", "Đúng", "\\( C_{10}^2 = 45 \\).",
      "Số đường chéo của đa giác lồi bằng 35.", "Đúng", "\\( C_{10}^2 - 10 = 35 \\).",
      "Số tam giác không có cạnh nào là cạnh của đa giác là 60.", "Sai", "Số tam giác không có cạnh chung là \\( C_{10}^3 - 10 \\times 8 + 10 = 50 \\)."
    )
  ];

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: sectionsContent
      }
    ]
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, "Mau_Game_Yoga_Xac_Suat_11.docx");
}

/**
 * SINH VÀ TẢI FILE EXCEL (.XLSX) MẪU CHO GAME AI YOGA VẬN ĐỘNG
 */
export async function downloadYogaExcelTemplate(): Promise<void> {
  const { XLSX } = await loadDocumentLibraries();
  const headers = [
    "Chuyên Đề",
    "Mức Độ (Dễ, Trung bình, Khó)",
    "Dạng Câu (MC hoặc TF)",
    "Nội Dung Câu Hỏi / Ngữ Cảnh Chung",
    "Lựa Chọn A / Ý a)",
    "Lựa Chọn B / Ý b)",
    "Lựa Chọn C / Ý c)",
    "Lựa Chọn D / Ý d)",
    "Đáp Án Đúng (A, B, C, D hoặc Đ, S)",
    "Lời Giải Chi Tiết"
  ];

  const sampleRows = [
    [
      "Chủ đề 1: Biến Cố Giao, Hợp & Biến Cố Độc Lập",
      "Dễ",
      "TF",
      "Cho hai biến cố A và B bất kỳ trong phép thử. Xét tính Đúng/Sai của các khẳng định sau:",
      "Nếu A và B xung khắc thì P(A ∩ B) = 0.",
      "Nếu A và B độc lập thì P(A ∩ B) = P(A) * P(B).",
      "Hai biến cố xung khắc luôn là hai biến cố độc lập.",
      "Ta luôn có P(A ∪ B) = P(A) + P(B) - P(A ∩ B).",
      "Đúng, Đúng, Sai, Đúng",
      "Theo quy tắc và định nghĩa biến cố xung khắc, độc lập."
    ],
    [
      "Chủ đề 1: Biến Cố Giao, Hợp & Biến Cố Độc Lập",
      "Dễ",
      "MC",
      "Cho A, B xung khắc có P(A) = 0.3 và P(B) = 0.4. Giá trị P(A ∪ B) bằng:",
      "0.7",
      "0.12",
      "0.1",
      "0.8",
      "A",
      "P(A ∪ B) = P(A) + P(B) = 0.3 + 0.4 = 0.7."
    ],
    [
      "Chủ đề 1: Biến Cố Giao, Hợp & Biến Cố Độc Lập",
      "Trung bình",
      "TF",
      "Hai xạ thủ bắn bia độc lập có XS trúng là 0.8 và 0.7. Xét tính Đúng/Sai:",
      "XS cả hai người cùng trúng là 0.56.",
      "XS cả hai người cùng trượt là 0.06.",
      "XS có ít nhất một người trúng là 0.94.",
      "XS có đúng một người trúng là 0.50.",
      "Đúng, Đúng, Đúng, Sai",
      "Sử dụng công thức độc lập và biến cố đối."
    ],
    [
      "Chủ đề 1: Biến Cố Giao, Hợp & Biến Cố Độc Lập",
      "Khó",
      "MC",
      "Bắn 3 phát đạn độc lập có XS trúng mỗi phát là 0.6. XS trúng đúng 2 phát là:",
      "0.432",
      "0.216",
      "0.288",
      "0.144",
      "A",
      "C(3,2) * 0.6^2 * 0.4 = 0.432."
    ],
    [
      "Chủ đề 2: Xác Suất Có Điều Kiện & Công Thức Toàn Phần",
      "Dễ",
      "MC",
      "Cho P(A ∩ B) = 0.2 và P(B) = 0.5. Giá trị P(A|B) bằng:",
      "0.4",
      "0.1",
      "0.7",
      "0.25",
      "A",
      "P(A|B) = P(AB)/P(B) = 0.2/0.5 = 0.4."
    ],
    [
      "Chủ đề 2: Xác Suất Có Điều Kiện & Công Thức Toàn Phần",
      "Trung bình",
      "TF",
      "Hộp có 3 bi đỏ, 2 bi xanh. Lấy lần lượt 2 viên không hoàn lại. A: 'Bi 1 đỏ', B: 'Bi 2 xanh':",
      "Xác suất P(A) = 3/5.",
      "Xác suất P(B|A) = 1/2.",
      "Xác suất P(A ∩ B) = 3/10.",
      "Hai biến cố A và B độc lập.",
      "Đúng, Đúng, Đúng, Sai",
      "Vì lấy không hoàn lại nên hai biến cố phụ thuộc."
    ],
    [
      "Chủ đề 2: Xác Suất Có Điều Kiện & Công Thức Toàn Phần",
      "Khó",
      "MC",
      "Cho P(A)=0.4, P(B|A)=0.6, P(B|A đối)=0.3. Giá trị P(B) theo công thức toàn phần bằng:",
      "0.42",
      "0.36",
      "0.48",
      "0.50",
      "A",
      "P(B) = 0.4*0.6 + 0.6*0.3 = 0.42."
    ],
    [
      "Chủ đề 3: Ôn Tập Tổng Hợp Xác Suất & Quy Tắc Đếm",
      "Dễ",
      "MC",
      "Có 5 bạn nam và 4 bạn nữ. Số cách chọn 1 bạn làm lớp trưởng là:",
      "9",
      "20",
      "5",
      "4",
      "A",
      "Quy tắc cộng: 5 + 4 = 9."
    ],
    [
      "Chủ đề 3: Ôn Tập Tổng Hợp Xác Suất & Quy Tắc Đếm",
      "Trung bình",
      "MC",
      "Từ {1,2,3,4,5,6} lập được bao nhiêu số tự nhiên chẵn có 3 chữ số khác nhau?",
      "60",
      "120",
      "30",
      "90",
      "A",
      "3 * A(5,2) = 60."
    ],
    [
      "Chủ đề 3: Ôn Tập Tổng Hợp Xác Suất & Quy Tắc Đếm",
      "Khó",
      "TF",
      "Cho đa giác lồi có 10 đỉnh. Xét tính Đúng/Sai:",
      "Số tam giác tạo thành là C(10,3) = 120.",
      "Số đoạn thẳng nối 2 đỉnh là 45.",
      "Số đường chéo là 35.",
      "Số tam giác không có cạnh chung là 60.",
      "Đúng, Đúng, Đúng, Sai",
      "Số tam giác không có cạnh chung là 50."
    ]
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
  ws['!cols'] = [
    { wch: 35 },
    { wch: 18 },
    { wch: 12 },
    { wch: 45 },
    { wch: 25 },
    { wch: 25 },
    { wch: 25 },
    { wch: 25 },
    { wch: 20 },
    { wch: 40 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Mau_Game_Yoga");
  XLSX.writeFile(wb, "Mau_Game_Yoga_Xac_Suat_11.xlsx");
}

/**
 * HÀM TẠO BẢNG CÂU HỎI ĐÚNG / SAI 9 DÒNG x 2 CỘT CHO GAME CỜ CÁ NGỰA (DOCX) - ĐEN TRẮNG TIÊU CHUẨN
 * Khớp 100% cấu trúc Bảng Đúng/Sai 4 ý (Bảng 2 cột x 9 dòng)
 */
function createCaNguaTFQuestionTable(
  qNum: number,
  stem: string,
  stmtA: string, ansA: string, expA: string,
  stmtB: string, ansB: string, expB: string,
  stmtC: string, ansC: string, expC: string,
  stmtD: string, ansD: string, expD: string
): Table {
  return new Table({
    width: { size: 10000, type: WidthType.DXA },
    rows: [
      // Dòng 1: Cột 1: Câu [N] | Cột 2: Lời dẫn / Đề bài tổng quát
      new TableRow({
        children: [
          new TableCell({
            width: { size: 2000, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: `Câu ${qNum}`, bold: true, color: "000000", size: 21 })] })]
          }),
          new TableCell({
            width: { size: 8000, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: stem, color: "000000", size: 21 })] })]
          })
        ]
      }),
      // Dòng 2: A) | Phát biểu A
      new TableRow({
        children: [
          new TableCell({
            width: { size: 2000, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: "A)", bold: true, color: "000000" })] })]
          }),
          new TableCell({
            width: { size: 8000, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: stmtA, color: "000000" })] })]
          })
        ]
      }),
      // Dòng 3: Đúng/Sai | Lời giải chi tiết A
      new TableRow({
        children: [
          new TableCell({
            width: { size: 2000, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: ansA, bold: true, color: "000000" })] })]
          }),
          new TableCell({
            width: { size: 8000, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: expA, color: "000000" })] })]
          })
        ]
      }),
      // Dòng 4: B) | Phát biểu B
      new TableRow({
        children: [
          new TableCell({
            width: { size: 2000, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: "B)", bold: true, color: "000000" })] })]
          }),
          new TableCell({
            width: { size: 8000, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: stmtB, color: "000000" })] })]
          })
        ]
      }),
      // Dòng 5: Đúng/Sai | Lời giải chi tiết B
      new TableRow({
        children: [
          new TableCell({
            width: { size: 2000, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: ansB, bold: true, color: "000000" })] })]
          }),
          new TableCell({
            width: { size: 8000, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: expB, color: "000000" })] })]
          })
        ]
      }),
      // Dòng 6: C) | Phát biểu C
      new TableRow({
        children: [
          new TableCell({
            width: { size: 2000, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: "C)", bold: true, color: "000000" })] })]
          }),
          new TableCell({
            width: { size: 8000, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: stmtC, color: "000000" })] })]
          })
        ]
      }),
      // Dòng 7: Đúng/Sai | Lời giải chi tiết C
      new TableRow({
        children: [
          new TableCell({
            width: { size: 2000, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: ansC, bold: true, color: "000000" })] })]
          }),
          new TableCell({
            width: { size: 8000, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: expC, color: "000000" })] })]
          })
        ]
      }),
      // Dòng 8: D) | Phát biểu D
      new TableRow({
        children: [
          new TableCell({
            width: { size: 2000, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: "D)", bold: true, color: "000000" })] })]
          }),
          new TableCell({
            width: { size: 8000, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: stmtD, color: "000000" })] })]
          })
        ]
      }),
      // Dòng 9: Đúng/Sai | Lời giải chi tiết D
      new TableRow({
        children: [
          new TableCell({
            width: { size: 2000, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: ansD, bold: true, color: "000000" })] })]
          }),
          new TableCell({
            width: { size: 8000, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: expD, color: "000000" })] })]
          })
        ]
      })
    ]
  });
}

/**
 * SINH VÀ TẢI FILE WORD (.DOCX) MẪU CHO GAME CỜ CÁ NGỰA (CHUẨN BẢNG ĐÚNG/SAI 9 DÒNG x 2 CỘT)
 * Định dạng văn bản đen trắng tiêu chuẩn, không tô màu nền bảng
 */
export async function downloadCaNguaWordTemplate(): Promise<void> {
  const sectionsContent: any[] = [
    new Paragraph({
      children: [
        new TextRun({
          text: "MẪU ĐỀ GAME CỜ CÁ NGỰA TOÁN HỌC (CHUẨN BẢNG ĐÚNG/SAI 9 DÒNG x 2 CỘT)",
          bold: true,
          size: 26,
          color: "000000"
        })
      ],
      spacing: { after: 120 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "HƯỚNG DẪN ĐỊNH DẠNG BẢNG ĐÚNG / SAI 4 Ý (BẢNG 2 CỘT x 9 DÒNG):\n" +
                "• Bảng tiêu chuẩn đen trắng, không tô màu nền bảng.\n" +
                "• Dòng 1: Cột 1 ghi 'Câu [Số]' | Cột 2 ghi Lời dẫn / Đề bài tổng quát (Hỗ trợ công thức TeX: \\( ... \\) và chèn ảnh qua thẻ <img>).\n" +
                "• Dòng 2: Cột 1 ghi 'A)' | Cột 2 ghi nội dung phát biểu của ý A.\n" +
                "• Dòng 3: Cột 1 ghi kết quả 'Đúng' hoặc 'Sai' | Cột 2 ghi 'Lời giải' chi tiết cho riêng ý A.\n" +
                "• Dòng 4, 5: Tương tự cho ý 'B)' và Kết quả/Lời giải của ý B.\n" +
                "• Dòng 6, 7: Tương tự cho ý 'C)' và Kết quả/Lời giải của ý C.\n" +
                "• Dòng 8, 9: Tương tự cho ý 'D)' và Kết quả/Lời giải của ý D.\n" +
                "Hệ thống sẽ tự động bóc tách từng ý kết hợp lời dẫn dòng 1 để sinh các câu hỏi Đúng/Sai độc lập cho game Cờ Cá Ngựa.",
          size: 19,
          color: "333333"
        })
      ],
      spacing: { after: 200 }
    }),

    // Bảng Câu 1
    createCaNguaTFQuestionTable(
      1,
      "Cho hàm số bậc hai \\( y = -x^2 - 4x + 5 \\) có đồ thị là parabol \\( (P) \\). Xét tính Đúng/Sai của các khẳng định sau:",
      "Trục đối xứng của parabol \\( (P) \\) là đường thẳng \\( x = -2 \\).",
      "Đúng",
      "Trục đối xứng là \\( x = -\\frac{b}{2a} = -\\frac{-4}{2(-1)} = -2 \\).",
      "Tọa độ đỉnh của parabol \\( (P) \\) là \\( I(-2; 9) \\).",
      "Đúng",
      "Thay \\( x = -2 \\) vào hàm số: \\( y = -(-2)^2 - 4(-2) + 5 = -4 + 8 + 5 = 9 \\).",
      "Hàm số đồng biến trên khoảng \\( (-2; +\\infty) \\).",
      "Sai",
      "Vì hệ số \\( a = -1 < 0 \\) nên bề lõm quay xuống dưới, hàm số đồng biến trên \\( (-\\infty; -2) \\) và nghịch biến trên \\( (-2; +\\infty) \\).",
      "Đồ thị hàm số cắt trục hoành tại hai điểm phân biệt có tọa độ \\( (1; 0) \\) và \\( (-5; 0) \\).",
      "Đúng",
      "Phương trình hoành độ giao điểm: \\( -x^2 - 4x + 5 = 0 \\Leftrightarrow x = 1 \\) hoặc \\( x = -5 \\)."
    ),
    new Paragraph({ text: "", spacing: { after: 150 } }),

    // Bảng Câu 2
    createCaNguaTFQuestionTable(
      2,
      "Cho hàm số bậc ba \\( y = f(x) = x^3 - 3x^2 + 2 \\). Xét tính Đúng/Sai của các mệnh đề sau:",
      "Đạo hàm của hàm số là \\( f'(x) = 3x^2 - 6x \\).",
      "Đúng",
      "Ta có \\( (x^3)' = 3x^2 \\) và \\( (-3x^2)' = -6x \\), \\( (2)' = 0 \\).",
      "Phương trình \\( f'(x) = 0 \\) có hai nghiệm phân biệt \\( x = 0 \\) và \\( x = 2 \\).",
      "Đúng",
      "Giải \\( 3x^2 - 6x = 0 \\Leftrightarrow 3x(x - 2) = 0 \\Leftrightarrow x = 0 \\) hoặc \\( x = 2 \\).",
      "Hàm số đồng biến trên khoảng \\( (0; 2) \\).",
      "Sai",
      "Trên khoảng \\( (0; 2) \\), \\( f'(x) < 0 \\) nên hàm số nghịch biến trên khoảng \\( (0; 2) \\).",
      "Hệ số góc của tiếp tuyến tại điểm có hoành độ \\( x_0 = 1 \\) bằng \\( -3 \\).",
      "Đúng",
      "Hệ số góc tiếp tuyến là \\( k = f'(1) = 3(1)^2 - 6(1) = -3 \\)."
    ),
    new Paragraph({ text: "", spacing: { after: 150 } }),

    // Bảng Câu 3
    createCaNguaTFQuestionTable(
      3,
      "Cho hàm số phân thức \\( y = \\frac{2x + 1}{x - 1} \\). Xét tính Đúng/Sai của các mệnh đề sau:",
      "Tập xác định của hàm số là \\( D = \\mathbb{R} \\setminus \\{1\\} \\).",
      "Đúng",
      "Điều kiện xác định: mẫu số \\( x - 1 \\neq 0 \\Leftrightarrow x \\neq 1 \\).",
      "Đạo hàm của hàm số là \\( y' = \\frac{-3}{(x - 1)^2} \\).",
      "Đúng",
      "Áp dụng công thức: \\( y' = \\frac{2(-1) - 1(1)}{(x-1)^2} = \\frac{-3}{(x-1)^2} \\).",
      "Hàm số đồng biến trên từng khoảng xác định.",
      "Sai",
      "Vì \\( y' = \\frac{-3}{(x - 1)^2} < 0 \\) với mọi \\( x \\neq 1 \\) nên hàm số nghịch biến trên từng khoảng xác định.",
      "Tiệm cận đứng là đường thẳng \\( x = 1 \\) và tiệm cận ngang là đường thẳng \\( y = 2 \\).",
      "Đúng",
      "Ta có \\( \\lim_{x \\to 1^+} y = +\\infty \\Rightarrow x = 1 \\) là TCĐ; \\( \\lim_{x \\to \\pm\\infty} y = 2 \\Rightarrow y = 2 \\) là TCN."
    )
  ];

  const doc = new Document({
    sections: [{ properties: {}, children: sectionsContent }]
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, "Mau_Game_Co_Ca_Ngua_Bang_Dung_Sai_9_Dong.docx");
}

export async function downloadCaNguaExcelTemplate(): Promise<void> {
  const { XLSX } = await loadDocumentLibraries();
  const rows = [
    ["Cột 1: Câu / Ý", "Cột 2: Nội dung phát biểu / Lời dẫn", "Cột 3: Kết quả Đúng / Sai", "Cột 4: Lời giải chi tiết"],
    ["Câu 1", "Cho hàm số y = -x^2 - 4x + 5. Xét tính Đúng/Sai của các mệnh đề sau:", "", ""],
    ["A)", "Trục đối xứng của parabol là đường thẳng x = -2.", "Đúng", "x = -b/(2a) = -2."],
    ["B)", "Tọa độ đỉnh của parabol là I(-2; 9).", "Đúng", "Thay x = -2 vào y = 9."],
    ["C)", "Hàm số đồng biến trên khoảng (-2; +\\infty).", "Sai", "a = -1 < 0 nên nghịch biến trên (-2; +\\infty)."],
    ["D)", "Đồ thị cắt trục hoành tại hai điểm (1; 0) và (-5; 0).", "Đúng", "-x^2 - 4x + 5 = 0 <=> x = 1 hoặc x = -5."],
    ["Câu 2", "Cho hàm số y = x^3 - 3x^2 + 2. Xét tính Đúng/Sai:", "", ""],
    ["A)", "Đạo hàm là f'(x) = 3x^2 - 6x.", "Đúng", "(x^3)' = 3x^2, (-3x^2)' = -6x."],
    ["B)", "f'(x) = 0 có hai nghiệm phân biệt x = 0 và x = 2.", "Đúng", "3x(x - 2) = 0 <=> x = 0 hoặc x = 2."],
    ["C)", "Hàm số đồng biến trên khoảng (0; 2).", "Sai", "f'(x) < 0 trên (0; 2) nên hàm số nghịch biến."],
    ["D)", "Hệ số góc tiếp tuyến tại x0 = 1 bằng -3.", "Đúng", "k = f'(1) = 3(1)^2 - 6(1) = -3."]
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 15 }, { wch: 50 }, { wch: 25 }, { wch: 45 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Co_Ca_Ngua_9_Dong");
  XLSX.writeFile(wb, "Mau_Game_Co_Ca_Ngua_Bang_Dung_Sai_9_Dong.xlsx");
}

/**
 * TẢI FILE MẪU THEO ĐÚNG TỪNG GAME ĐANG CHỌN (KHÔNG DÙNG CHUNG)
 */
export async function downloadGameWordTemplate(gameIdentifier: string): Promise<void> {
  const cleanId = (gameIdentifier || '').toLowerCase();
  if (cleanId.includes('hai-tao') || cleanId.includes('hai_tao') || cleanId.includes('haitao') || cleanId.includes('apple')) {
    return downloadHaiTaoWordTemplate();
  }
  if (cleanId.includes('ca-ngua') || cleanId.includes('ca_ngua') || cleanId.includes('ngua')) {
    return downloadCaNguaWordTemplate();
  }
  if (cleanId.includes('mario') || cleanId.includes('gamemario')) {
    return downloadMarioWordTemplate();
  }
  if (cleanId.includes('tetris') || cleanId.includes('gametetris')) {
    return downloadTetrisWordTemplate();
  }
  if (cleanId.includes('pikachu') || cleanId.includes('pika')) {
    return downloadPikachuWordTemplate();
  }
  if (cleanId.includes('yoga')) {
    return downloadYogaWordTemplate();
  }
  if (cleanId.includes('ban-chim') || cleanId.includes('ban_chim') || cleanId.includes('bird')) {
    return downloadBanChimWordTemplate();
  }
  if (cleanId.includes('sut-pen') || cleanId.includes('sut_pen') || cleanId.includes('penalty')) {
    return downloadSutPenWordTemplate();
  }
  if (cleanId.includes('chien-hao') || cleanId.includes('chien_hao') || cleanId.includes('bao-ve')) {
    return downloadChienHaoWordTemplate();
  }
  if (cleanId.includes('keo-tha') || cleanId.includes('keo_tha')) {
    return downloadWordTemplate();
  }
  return downloadChienHaoWordTemplate(); // Default multiple choice
}

export async function downloadGameExcelTemplate(gameIdentifier: string): Promise<void> {
  const cleanId = (gameIdentifier || '').toLowerCase();
  if (cleanId.includes('hai-tao') || cleanId.includes('hai_tao') || cleanId.includes('haitao') || cleanId.includes('apple')) {
    return downloadHaiTaoExcelTemplate();
  }
  if (cleanId.includes('ca-ngua') || cleanId.includes('ca_ngua') || cleanId.includes('ngua')) {
    return downloadCaNguaExcelTemplate();
  }
  if (cleanId.includes('mario') || cleanId.includes('gamemario')) {
    return downloadMarioExcelTemplate();
  }
  if (cleanId.includes('tetris') || cleanId.includes('gametetris')) {
    return downloadTetrisExcelTemplate();
  }
  if (cleanId.includes('pikachu') || cleanId.includes('pika')) {
    return downloadPikachuExcelTemplate();
  }
  if (cleanId.includes('yoga')) {
    return downloadYogaExcelTemplate();
  }
  if (cleanId.includes('ban-chim') || cleanId.includes('ban_chim') || cleanId.includes('bird')) {
    return downloadBanChimExcelTemplate();
  }
  if (cleanId.includes('sut-pen') || cleanId.includes('sut_pen') || cleanId.includes('penalty')) {
    return downloadSutPenExcelTemplate();
  }
  if (cleanId.includes('chien-hao') || cleanId.includes('chien_hao') || cleanId.includes('bao-ve')) {
    return downloadChienHaoExcelTemplate();
  }
  if (cleanId.includes('keo-tha') || cleanId.includes('keo_tha')) {
    return downloadExcelTemplate();
  }
  return downloadChienHaoExcelTemplate();
}

/**
 * HÀM TẠO BẢNG CÂU HỎI TRẮC NGHIỆM ABCD 7 DÒNG x 2 CỘT CHO GAME TETRIS (DOCX) - ĐEN TRẮNG TIÊU CHUẨN
 */
function createTetrisMCQTable(
  qNum: number,
  stem: string,
  optA: string,
  optB: string,
  optC: string,
  optD: string,
  exp: string,
  ans: string
): Table {
  return new Table({
    width: { size: 10000, type: WidthType.DXA },
    rows: [
      // Dòng 1: Câu [N] (TN) | Đề bài
      new TableRow({
        children: [
          new TableCell({
            width: { size: 2000, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: `Câu ${qNum} (TN)`, bold: true, color: "000000", size: 21 })] })]
          }),
          new TableCell({
            width: { size: 8000, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: stem, color: "000000", size: 21 })] })]
          })
        ]
      }),
      // Dòng 2: A) | Đáp án A
      new TableRow({
        children: [
          new TableCell({
            width: { size: 2000, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: "A)", bold: true, color: "000000" })] })]
          }),
          new TableCell({
            width: { size: 8000, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: optA, color: "000000" })] })]
          })
        ]
      }),
      // Dòng 3: B) | Đáp án B
      new TableRow({
        children: [
          new TableCell({
            width: { size: 2000, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: "B)", bold: true, color: "000000" })] })]
          }),
          new TableCell({
            width: { size: 8000, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: optB, color: "000000" })] })]
          })
        ]
      }),
      // Dòng 4: C) | Đáp án C
      new TableRow({
        children: [
          new TableCell({
            width: { size: 2000, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: "C)", bold: true, color: "000000" })] })]
          }),
          new TableCell({
            width: { size: 8000, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: optC, color: "000000" })] })]
          })
        ]
      }),
      // Dòng 5: D) | Đáp án D
      new TableRow({
        children: [
          new TableCell({
            width: { size: 2000, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: "D)", bold: true, color: "000000" })] })]
          }),
          new TableCell({
            width: { size: 8000, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: optD, color: "000000" })] })]
          })
        ]
      }),
      // Dòng 6: Lời giải | Hướng dẫn giải chi tiết
      new TableRow({
        children: [
          new TableCell({
            width: { size: 2000, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: "Lời giải", bold: true, color: "000000" })] })]
          }),
          new TableCell({
            width: { size: 8000, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: exp, color: "000000" })] })]
          })
        ]
      }),
      // Dòng 7: Đáp án | Ký tự đáp án đúng (A, B, C, D)
      new TableRow({
        children: [
          new TableCell({
            width: { size: 2000, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: "Đáp án", bold: true, color: "000000" })] })]
          }),
          new TableCell({
            width: { size: 8000, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: ans, bold: true, color: "000000" })] })]
          })
        ]
      })
    ]
  });
}

/**
 * HÀM TẠO BẢNG CÂU HỎI ĐÚNG / SAI 9 DÒNG x 2 CỘT CHO GAME TETRIS (DOCX) - ĐEN TRẮNG TIÊU CHUẨN
 */
function createTetrisTFQuestionTable(
  qNum: number,
  stem: string,
  stmtA: string, ansA: string, expA: string,
  stmtB: string, ansB: string, expB: string,
  stmtC: string, ansC: string, expC: string,
  stmtD: string, ansD: string, expD: string
): Table {
  return new Table({
    width: { size: 10000, type: WidthType.DXA },
    rows: [
      // Dòng 1: Cột 1: Câu [N] (Đ/S) | Cột 2: Lời dẫn / Đề bài tổng quát
      new TableRow({
        children: [
          new TableCell({
            width: { size: 2000, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: `Câu ${qNum} (Đ/S)`, bold: true, color: "000000", size: 21 })] })]
          }),
          new TableCell({
            width: { size: 8000, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: stem, color: "000000", size: 21 })] })]
          })
        ]
      }),
      // Dòng 2: A) | Phát biểu A
      new TableRow({
        children: [
          new TableCell({
            width: { size: 2000, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: "A)", bold: true, color: "000000" })] })]
          }),
          new TableCell({
            width: { size: 8000, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: stmtA, color: "000000" })] })]
          })
        ]
      }),
      // Dòng 3: Đúng/Sai | Lời giải chi tiết A
      new TableRow({
        children: [
          new TableCell({
            width: { size: 2000, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: ansA, bold: true, color: "000000" })] })]
          }),
          new TableCell({
            width: { size: 8000, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: expA, color: "000000" })] })]
          })
        ]
      }),
      // Dòng 4: B) | Phát biểu B
      new TableRow({
        children: [
          new TableCell({
            width: { size: 2000, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: "B)", bold: true, color: "000000" })] })]
          }),
          new TableCell({
            width: { size: 8000, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: stmtB, color: "000000" })] })]
          })
        ]
      }),
      // Dòng 5: Đúng/Sai | Lời giải chi tiết B
      new TableRow({
        children: [
          new TableCell({
            width: { size: 2000, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: ansB, bold: true, color: "000000" })] })]
          }),
          new TableCell({
            width: { size: 8000, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: expB, color: "000000" })] })]
          })
        ]
      }),
      // Dòng 6: C) | Phát biểu C
      new TableRow({
        children: [
          new TableCell({
            width: { size: 2000, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: "C)", bold: true, color: "000000" })] })]
          }),
          new TableCell({
            width: { size: 8000, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: stmtC, color: "000000" })] })]
          })
        ]
      }),
      // Dòng 7: Đúng/Sai | Lời giải chi tiết C
      new TableRow({
        children: [
          new TableCell({
            width: { size: 2000, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: ansC, bold: true, color: "000000" })] })]
          }),
          new TableCell({
            width: { size: 8000, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: expC, color: "000000" })] })]
          })
        ]
      }),
      // Dòng 8: D) | Phát biểu D
      new TableRow({
        children: [
          new TableCell({
            width: { size: 2000, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: "D)", bold: true, color: "000000" })] })]
          }),
          new TableCell({
            width: { size: 8000, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: stmtD, color: "000000" })] })]
          })
        ]
      }),
      // Dòng 9: Đúng/Sai | Lời giải chi tiết D
      new TableRow({
        children: [
          new TableCell({
            width: { size: 2000, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: ansD, bold: true, color: "000000" })] })]
          }),
          new TableCell({
            width: { size: 8000, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: expD, color: "000000" })] })]
          })
        ]
      })
    ]
  });
}

/**
 * HÀM TẠO BẢNG CÂU HỎI TRẢ LỜI NGẮN 3 DÒNG x 2 CỘT CHO GAME TETRIS (DOCX) - ĐEN TRẮNG TIÊU CHUẨN
 */
function createTetrisShortAnswerTable(qNum: number, stem: string, answerNum: string, exp: string): Table {
  return new Table({
    width: { size: 10000, type: WidthType.DXA },
    rows: [
      // Dòng 1: Câu [N] (TLN) | Đề bài
      new TableRow({
        children: [
          new TableCell({
            width: { size: 2000, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: `Câu ${qNum} (TLN)`, bold: true, color: "000000", size: 21 })] })]
          }),
          new TableCell({
            width: { size: 8000, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: stem, color: "000000", size: 21 })] })]
          })
        ]
      }),
      // Dòng 2: Đáp án số | Giá trị số (tối đa 4 ký tự)
      new TableRow({
        children: [
          new TableCell({
            width: { size: 2000, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: "Đáp án số", bold: true, color: "000000" })] })]
          }),
          new TableCell({
            width: { size: 8000, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: answerNum, bold: true, color: "000000" })] })]
          })
        ]
      }),
      // Dòng 3: Lời giải | Chi tiết
      new TableRow({
        children: [
          new TableCell({
            width: { size: 2000, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: "Lời giải", bold: true, color: "000000" })] })]
          }),
          new TableCell({
            width: { size: 8000, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: exp, color: "000000" })] })]
          })
        ]
      })
    ]
  });
}

/**
 * SINH VÀ TẢI FILE WORD (.DOCX) MẪU CHO GAME TETRIS (CHUẨN 3 DẠNG BẢNG ĐEN TRẮNG)
 */
export async function downloadTetrisWordTemplate(): Promise<void> {
  const sectionsContent: any[] = [
    new Paragraph({
      children: [
        new TextRun({
          text: "MẪU ĐỀ GAME TETRIS XẾP GẠCH (CHUẨN 3 DẠNG BẢNG ĐEN TRẮNG)",
          bold: true,
          size: 26,
          color: "000000"
        })
      ],
      spacing: { after: 120 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "Chỉ thị cấu trúc chuẩn đen trắng (không tô màu nền ô, viền đơn rõ ràng):\n" +
                "1. DẠNG TRẮC NGHIỆM ABCD (Bảng 2 cột x 7 dòng): Dòng 1: Câu [N] (TN) | Đề bài; Dòng 2..5: A), B), C), D); Dòng 6: Lời giải; Dòng 7: Đáp án A/B/C/D.\n" +
                "2. DẠNG ĐÚNG / SAI 4 Ý (Bảng 2 cột x 9 dòng): Dòng 1: Câu [N] (Đ/S) | Lời dẫn chung; Dòng 2, 4, 6, 8: A), B), C), D); Dòng 3, 5, 7, 9: Đúng/Sai | Kết quả Đúng/Sai kèm lời giải. Hệ thống ghép lời dẫn với từng phát biểu độc lập khi chơi!\n" +
                "3. DẠNG TRẢ LỜI NGẮN (Bảng 2 cột x 3 dòng): Dòng 1: Câu [N] (TLN) | Đề bài; Dòng 2: Đáp án số | Số kết quả (tối đa 4 ký tự, VD: 12, -3.5, 0.2); Dòng 3: Lời giải | Chi tiết.",
          size: 19,
          color: "333333"
        })
      ],
      spacing: { after: 200 }
    }),

    // PHẦN 1: TRẮC NGHIỆM ABCD
    new Paragraph({
      children: [new TextRun({ text: "PHẦN 1: CÂU HỎI TRẮC NGHIỆM ABCD (BẢNG 7 DÒNG x 2 CỘT)", bold: true, color: "000000", size: 24 })],
      spacing: { before: 200, after: 120 }
    }),
    createTetrisMCQTable(
      1,
      "Cho hình chóp \\( S.ABC \\) có \\( SA \\perp (ABC) \\). Mặt phẳng \\( (SAB) \\) vuông góc với mặt phẳng nào sau đây?",
      "\\( (ABC) \\)",
      "\\( (SBC) \\)",
      "\\( (SAC) \\)",
      "Chưa đủ dữ kiện",
      "Vì \\( SA \\perp (ABC) \\) và \\( SA \\subset (SAB) \\) nên \\( (SAB) \\perp (ABC) \\).",
      "A"
    ),
    new Paragraph({ text: "", spacing: { after: 150 } }),

    // PHẦN 2: ĐÚNG / SAI 4 Ý
    new Paragraph({
      children: [new TextRun({ text: "PHẦN 2: CÂU HỎI ĐÚNG / SAI (4 Ý) (BẢNG 9 DÒNG x 2 CỘT)", bold: true, color: "000000", size: 24 })],
      spacing: { before: 250, after: 120 }
    }),
    createTetrisTFQuestionTable(
      2,
      "Cho hình chóp \\( S.ABCD \\) có đáy \\( ABCD \\) là hình vuông tâm \\( O \\), cạnh \\( a \\) và \\( SO \\perp (ABCD) \\). Xét tính Đúng/Sai của các khẳng định sau:",
      "Đường thẳng \\( SO \\) vuông góc với mặt phẳng \\( (ABCD) \\).", "Đúng", "Theo giả thiết đề bài cho \\( SO \\perp (ABCD) \\).",
      "Mặt phẳng \\( (SAC) \\) vuông góc với mặt phẳng \\( (SBD) \\).", "Đúng", "Vì đáy là hình vuông nên \\( AC \\perp BD \\), lại có \\( SO \\perp AC \\) nên \\( AC \\perp (SBD) \\), suy ra \\( (SAC) \\perp (SBD) \\).",
      "Góc giữa hai mặt phẳng \\( (SAB) \\) và \\( (ABCD) \\) bằng \\( 90^\\circ \\).", "Sai", "Mặt phẳng \\( (SAB) \\) không vuông góc với đáy vì \\( O \\) không thuộc \\( AB \\).",
      "Tam giác \\( SBD \\) là tam giác cân tại \\( S \\).", "Đúng", "Vì \\( O \\) là trung điểm \\( BD \\) và \\( SO \\perp BD \\) nên \\( SB = SD \\)."
    ),
    new Paragraph({ text: "", spacing: { after: 150 } }),

    // PHẦN 3: TRẢ LỜI NGẮN
    new Paragraph({
      children: [new TextRun({ text: "PHẦN 3: CÂU HỎI TRẢ LỜI NGẮN (BẢNG 3 DÒNG x 2 CỘT)", bold: true, color: "000000", size: 24 })],
      spacing: { before: 250, after: 120 }
    }),
    createTetrisShortAnswerTable(
      3,
      "Cho hai mặt phẳng \\( (P) \\) và \\( (Q) \\) vuông góc với nhau. Góc giữa hai mặt phẳng đó bằng bao nhiêu độ?",
      "90",
      "Theo định nghĩa, hai mặt phẳng vuông góc với nhau khi và chỉ khi góc giữa chúng bằng 90 độ."
    )
  ];

  const doc = new Document({
    sections: [{ properties: {}, children: sectionsContent }]
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, "Mau_Game_Tetris_3_Dang_Cau_Hoi.docx");
}

/**
 * SINH VÀ TẢI FILE EXCEL (.XLSX) MẪU CHO GAME TETRIS (3 DẠNG CÂU HỎI)
 */
export async function downloadTetrisExcelTemplate(): Promise<void> {
  const { XLSX } = await loadDocumentLibraries();
  const rows = [
    ["Loại Dạng", "Cột 1: Câu / Ý", "Cột 2: Nội dung phát biểu / Đề bài", "Cột 3: Đáp án (A/B/C/D hoặc Đúng/Sai hoặc Số)", "Cột 4: Lời giải chi tiết"],
    // Dạng 1: MC
    ["MC", "Câu 1", "Cho hình chóp S.ABC có SA vuông góc với (ABC). Mặt phẳng (SAB) vuông góc với mặt phẳng nào?", "A", "SA vuông góc (ABC) và SA thuộc (SAB) nên (SAB) vuông góc (ABC)."],
    ["MC", "A)", "(ABC)", "", ""],
    ["MC", "B)", "(SBC)", "", ""],
    ["MC", "C)", "(SAC)", "", ""],
    ["MC", "D)", "Chưa đủ dữ kiện", "", ""],
    // Dạng 2: TF
    ["TF", "Câu 2", "Cho hình chóp S.ABCD đáy ABCD là hình vuông tâm O, SO vuông góc (ABCD). Xét tính Đúng/Sai:", "", ""],
    ["TF", "A)", "Đường thẳng SO vuông góc với mặt phẳng (ABCD).", "Đúng", "Theo giả thiết đề bài."],
    ["TF", "B)", "Mặt phẳng (SAC) vuông góc với mặt phẳng (SBD).", "Đúng", "AC vuông góc BD và AC vuông góc SO nên AC vuông góc (SBD)."],
    ["TF", "C)", "Góc giữa (SAB) và (ABCD) bằng 90 độ.", "Sai", "(SAB) không vuông góc với đáy."],
    ["TF", "D)", "Tam giác SBD là tam giác cân tại S.", "Đúng", "SO là đường cao đồng thời là trung tuyến."],
    // Dạng 3: SHORT
    ["SHORT", "Câu 3", "Hai mặt phẳng vuông góc với nhau thì góc giữa chúng bằng bao nhiêu độ?", "90", "Theo định nghĩa góc giữa 2 mặt phẳng vuông góc là 90 độ."]
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 12 }, { wch: 15 }, { wch: 55 }, { wch: 25 }, { wch: 45 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Tetris_3_Dang_De");
  XLSX.writeFile(wb, "Mau_Game_Tetris_3_Dang_Cau_Hoi.xlsx");
}

/**
 * SINH VÀ TẢI FILE WORD (.DOCX) MẪU CHO GAME MARIO PHIÊU LƯU KÝ (CHUẨN 3 CHUYÊN ĐỀ x 3 DẠNG BẢNG ĐEN TRẮNG)
 */
export async function downloadMarioWordTemplate(): Promise<void> {
  const sectionsContent: any[] = [
    new Paragraph({
      children: [
        new TextRun({
          text: "MẪU ĐỀ GAME MARIO PHIÊU LƯU KÝ (CHUẨN 3 CHUYÊN ĐỀ x 3 DẠNG BẢNG ĐEN TRẮNG)",
          bold: true,
          size: 26,
          color: "000000"
        })
      ],
      spacing: { after: 120 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "HƯỚNG DẪN CẤU TRÚC SOẠN ĐỀ CHO GAME MARIO:\n" +
                "1. Game bao gồm 3 Chuyên đề (World): Chuyên đề 1 (Biến cố giao & độc lập), Chuyên đề 2 (Biến cố hợp & xung khắc), Chuyên đề 3 (Công thức cộng & nhân tổng hợp).\n" +
                "2. Mỗi Chuyên đề hỗ trợ 3 dạng câu hỏi chuẩn đen trắng (không tô màu nền ô, viền đơn rõ ràng):\n" +
                "   - DẠNG TRẮC NGHIỆM ABCD (Bảng 7 dòng x 2 cột): Dòng 1: Câu [N] (TN) | Đề bài; Dòng 2..5: A), B), C), D); Dòng 6: Lời giải; Dòng 7: Đáp án A/B/C/D.\n" +
                "   - DẠNG ĐÚNG / SAI 4 Ý (Bảng 9 dòng x 2 cột): Dòng 1: Câu [N] (Đ/S) | Lời dẫn chung; Dòng 2, 4, 6, 8: A), B), C), D); Dòng 3, 5, 7, 9: Đúng/Sai | Lời giải chi tiết. Hệ thống ghép lời dẫn với từng phát biểu độc lập khi chơi!\n" +
                "   - DẠNG TRẢ LỜI NGẮN / ĐIỀN SỐ (Bảng 3 dòng x 2 cột): Dòng 1: Câu [N] (TLN) | Đề bài; Dòng 2: Đáp án số | Số kết quả (tối đa 4 ký tự); Dòng 3: Lời giải.\n" +
                "3. THUẬT TOÁN AUTO-SAMPLING: Mỗi World cố định 8 khối gạch '?' (3 Dễ, 3 Vừa, 2 Khó). Thầy cô có thể soạn bao nhiêu câu tùy ý, Mario Engine sẽ tự động bốc ngẫu nhiên đúng 3 Dễ, 3 Vừa, 2 Khó rải vào map gạch theo độ khó tăng dần!",
          size: 19,
          color: "333333"
        })
      ],
      spacing: { after: 220 }
    }),

    // WORLD 1
    new Paragraph({
      children: [new TextRun({ text: "CHUYÊN ĐỀ 1: BIẾN CỐ GIAO & BIẾN CỐ ĐỘC LẬP (WORLD 1)", bold: true, color: "000000", size: 24 })],
      spacing: { before: 200, after: 120 }
    }),
    createTetrisMCQTable(
      1,
      "Cho hai biến cố \\( A \\) và \\( B \\). Biến cố giao \\( AB \\) (hoặc \\( A \\cap B \\)) là biến cố:",
      "Cả \\( A \\) và \\( B \\) cùng xảy ra",
      "Chỉ có \\( A \\) hoặc \\( B \\) xảy ra",
      "Ít nhất một trong hai biến cố xảy ra",
      "\\( A \\) xảy ra nhưng \\( B \\) không xảy ra",
      "Biến cố giao AB xảy ra khi và chỉ khi cả A và B đồng thời xảy ra.",
      "A"
    ),
    new Paragraph({ text: "", spacing: { after: 120 } }),
    createTetrisTFQuestionTable(
      2,
      "Hai xạ thủ bắn bia độc lập. Xác suất bắn trúng của người 1 là \\( 0.7 \\), người 2 là \\( 0.8 \\). Xét tính Đúng/Sai của các khẳng định sau:",
      "Xác suất cả hai người cùng bắn trúng bằng \\( 0.56 \\).", "Đúng", "P = 0.7 * 0.8 = 0.56.",
      "Xác suất cả hai người đều bắn trượt bằng \\( 0.06 \\).", "Đúng", "P = (1 - 0.7)*(1 - 0.8) = 0.3 * 0.2 = 0.06.",
      "Xác suất người 1 bắn trúng và người 2 bắn trượt bằng \\( 0.14 \\).", "Đúng", "P = 0.7 * (1 - 0.8) = 0.14.",
      "Xác suất có ít nhất một người bắn trúng bằng \\( 0.90 \\).", "Sai", "P = 1 - 0.06 = 0.94."
    ),
    new Paragraph({ text: "", spacing: { after: 120 } }),
    createTetrisShortAnswerTable(
      3,
      "Cho hai biến cố độc lập \\( A \\) và \\( B \\) có \\( P(A) = 0.4 \\) và \\( P(B) = 0.5 \\). Giá trị của \\( P(AB) \\) bằng bao nhiêu?",
      "0.2",
      "P(AB) = P(A) * P(B) = 0.4 * 0.5 = 0.2."
    ),
    new Paragraph({ text: "", spacing: { after: 200 } }),

    // WORLD 2
    new Paragraph({
      children: [new TextRun({ text: "CHUYÊN ĐỀ 2: BIẾN CỐ HỢP & BIẾN CỐ XUNG KHẮC (WORLD 2)", bold: true, color: "000000", size: 24 })],
      spacing: { before: 200, after: 120 }
    }),
    createTetrisMCQTable(
      4,
      "Hai biến cố \\( A \\) và \\( B \\) được gọi là xung khắc khi và chỉ khi:",
      "\\( A \\cap B = \\emptyset \\)",
      "\\( A \\cup B = \\Omega \\)",
      "\\( P(A) + P(B) = 1 \\)",
      "\\( P(AB) = P(A) \\cdot P(B) \\)",
      "Hai biến cố xung khắc không thể đồng thời xảy ra.",
      "A"
    ),
    new Paragraph({ text: "", spacing: { after: 120 } }),
    createTetrisTFQuestionTable(
      5,
      "Cho \\( A, B \\) là hai biến cố xung khắc có \\( P(A) = 0.25 \\) và \\( P(B) = 0.45 \\). Xét tính Đúng/Sai của các khẳng định sau:",
      "Biến cố giao có xác suất \\( P(AB) = 0 \\).", "Đúng", "Hai biến cố xung khắc không thể đồng thời xảy ra.",
      "Xác suất biến cố hợp \\( P(A \\cup B) = 0.70 \\).", "Đúng", "P(A U B) = P(A) + P(B) = 0.25 + 0.45 = 0.70.",
      "Xác suất biến cố hợp \\( P(A \\cup B) = P(A) \\cdot P(B) \\).", "Sai", "Công thức nhân chỉ đúng cho hai biến cố độc lập.",
      "Biến cố đối của \\( A \\) có xác suất là \\( 0.75 \\).", "Đúng", "P(not A) = 1 - 0.25 = 0.75."
    ),
    new Paragraph({ text: "", spacing: { after: 120 } }),
    createTetrisShortAnswerTable(
      6,
      "Cho hai biến cố \\( A \\) và \\( B \\) thỏa mãn \\( P(A) = 0.5 \\), \\( P(B) = 0.6 \\) và \\( P(A \\cup B) = 0.8 \\). Xác suất của biến cố đối \\( \\overline{A} \\cap \\overline{B} \\) bằng bao nhiêu?",
      "0.2",
      "Theo luật De Morgan: not(A) cap not(B) = not(A cup B) => P = 1 - 0.8 = 0.2."
    ),
    new Paragraph({ text: "", spacing: { after: 200 } }),

    // WORLD 3
    new Paragraph({
      children: [new TextRun({ text: "CHUYÊN ĐỀ 3: CÔNG THỨC CỘNG & NHÂN XÁC SUẤT TỔNG HỢP (WORLD 3)", bold: true, color: "000000", size: 24 })],
      spacing: { before: 200, after: 120 }
    }),
    createTetrisMCQTable(
      7,
      "Cho biến cố \\( A \\) có \\( P(A) = 0.7 \\). Xác suất của biến cố đối \\( \\overline{A} \\) là:",
      "\\( 0.3 \\)",
      "\\( 0.7 \\)",
      "\\( -0.7 \\)",
      "\\( 1.7 \\)",
      "P(not A) = 1 - P(A) = 1 - 0.7 = 0.3.",
      "A"
    ),
    new Paragraph({ text: "", spacing: { after: 120 } }),
    createTetrisTFQuestionTable(
      8,
      "Hai bạn An và Bình độc lập cùng giải một bài toán. Xác suất An giải được là \\( 0.8 \\), Bình giải được là \\( 0.7 \\). Xét tính Đúng/Sai:",
      "Xác suất cả hai bạn cùng giải được là \\( 0.56 \\).", "Đúng", "P = 0.8 * 0.7 = 0.56.",
      "Xác suất cả hai bạn đều không giải được là \\( 0.06 \\).", "Đúng", "P = (1 - 0.8)*(1 - 0.7) = 0.06.",
      "Xác suất bài toán được giải quyết là \\( 0.94 \\).", "Đúng", "P = 1 - 0.06 = 0.94.",
      "Xác suất chỉ có đúng một bạn giải được là \\( 0.40 \\).", "Sai", "P = 0.8*0.3 + 0.2*0.7 = 0.38."
    ),
    new Paragraph({ text: "", spacing: { after: 120 } }),
    createTetrisShortAnswerTable(
      9,
      "Một xạ thủ bắn 3 phát độc lập với xác suất trúng mỗi phát là \\( 0.8 \\). Xác suất người đó không bắn trúng phát nào bằng bao nhiêu?",
      "0.008",
      "P = (1 - 0.8)^3 = 0.2^3 = 0.008."
    )
  ];

  const doc = new Document({
    sections: [{ properties: {}, children: sectionsContent }]
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, "Mau_Game_Mario_3_Chuyen_De_3_Dang_De.docx");
}

/**
 * SINH VÀ TẢI FILE EXCEL (.XLSX) MẪU CHO GAME MARIO PHIÊU LƯU KÝ (3 CHUYÊN ĐỀ x 3 DẠNG CÂU HỎI)
 */
export async function downloadMarioExcelTemplate(): Promise<void> {
  const { XLSX } = await loadDocumentLibraries();
  const rows = [
    ["Chuyên đề", "Loại Dạng", "Cột 1: Câu / Ý", "Cột 2: Nội dung phát biểu / Đề bài", "Cột 3: Đáp án (A/B/C/D hoặc Đúng/Sai hoặc Số)", "Cột 4: Lời giải chi tiết"],
    // World 1
    ["Chuyên đề 1: Biến cố giao & Biến cố độc lập", "MC", "Câu 1", "Cho hai biến cố A và B. Biến cố giao AB là biến cố:", "A", "Cả A và B đồng thời xảy ra."],
    ["Chuyên đề 1: Biến cố giao & Biến cố độc lập", "MC", "A)", "Cả A và B cùng xảy ra", "", ""],
    ["Chuyên đề 1: Biến cố giao & Biến cố độc lập", "MC", "B)", "Chỉ có A hoặc B xảy ra", "", ""],
    ["Chuyên đề 1: Biến cố giao & Biến cố độc lập", "MC", "C)", "Ít nhất một trong hai biến cố xảy ra", "", ""],
    ["Chuyên đề 1: Biến cố giao & Biến cố độc lập", "MC", "D)", "A xảy ra nhưng B không xảy ra", "", ""],
    ["Chuyên đề 1: Biến cố giao & Biến cố độc lập", "TF", "Câu 2", "Hai xạ thủ bắn bia độc lập với xác suất trúng là 0.7 và 0.8. Xét tính Đúng/Sai:", "", ""],
    ["Chuyên đề 1: Biến cố giao & Biến cố độc lập", "TF", "A)", "Xác suất cả hai người cùng bắn trúng bằng 0.56.", "Đúng", "P = 0.7 * 0.8 = 0.56."],
    ["Chuyên đề 1: Biến cố giao & Biến cố độc lập", "TF", "B)", "Xác suất cả hai người đều bắn trượt bằng 0.06.", "Đúng", "P = 0.3 * 0.2 = 0.06."],
    ["Chuyên đề 1: Biến cố giao & Biến cố độc lập", "TF", "C)", "Xác suất người 1 bắn trúng và người 2 bắn trượt bằng 0.14.", "Đúng", "P = 0.7 * 0.2 = 0.14."],
    ["Chuyên đề 1: Biến cố giao & Biến cố độc lập", "TF", "D)", "Xác suất có ít nhất một người bắn trúng bằng 0.90.", "Sai", "P = 1 - 0.06 = 0.94."],
    ["Chuyên đề 1: Biến cố giao & Biến cố độc lập", "SHORT", "Câu 3", "Cho hai biến cố độc lập A và B có P(A) = 0.4 và P(B) = 0.5. Giá trị P(AB) bằng bao nhiêu?", "0.2", "P(AB) = 0.4 * 0.5 = 0.2."],
    // World 2
    ["Chuyên đề 2: Biến cố hợp & Biến cố xung khắc", "MC", "Câu 4", "Hai biến cố A và B được gọi là xung khắc khi và chỉ khi:", "A", "Hai biến cố xung khắc không thể đồng thời xảy ra."],
    ["Chuyên đề 2: Biến cố hợp & Biến cố xung khắc", "MC", "A)", "A ∩ B = ∅", "", ""],
    ["Chuyên đề 2: Biến cố hợp & Biến cố xung khắc", "MC", "B)", "A ∪ B = Ω", "", ""],
    ["Chuyên đề 2: Biến cố hợp & Biến cố xung khắc", "MC", "C)", "P(A) + P(B) = 1", "", ""],
    ["Chuyên đề 2: Biến cố hợp & Biến cố xung khắc", "MC", "D)", "P(AB) = P(A) . P(B)", "", ""],
    ["Chuyên đề 2: Biến cố hợp & Biến cố xung khắc", "TF", "Câu 5", "Cho A, B là hai biến cố xung khắc có P(A) = 0.25 và P(B) = 0.45. Xét tính Đúng/Sai:", "", ""],
    ["Chuyên đề 2: Biến cố hợp & Biến cố xung khắc", "TF", "A)", "Biến cố giao có xác suất P(AB) = 0.", "Đúng", "Hai biến cố xung khắc không thể đồng thời xảy ra."],
    ["Chuyên đề 2: Biến cố hợp & Biến cố xung khắc", "TF", "B)", "Xác suất biến cố hợp P(A ∪ B) = 0.70.", "Đúng", "P = 0.25 + 0.45 = 0.70."],
    ["Chuyên đề 2: Biến cố hợp & Biến cố xung khắc", "TF", "C)", "Xác suất biến cố hợp P(A ∪ B) = P(A) . P(B).", "Sai", "Công thức nhân chỉ áp dụng cho biến cố độc lập."],
    ["Chuyên đề 2: Biến cố hợp & Biến cố xung khắc", "TF", "D)", "Biến cố đối của A có xác suất là 0.75.", "Đúng", "P = 1 - 0.25 = 0.75."],
    ["Chuyên đề 2: Biến cố hợp & Biến cố xung khắc", "SHORT", "Câu 6", "Cho hai biến cố A và B thỏa mãn P(A) = 0.5, P(B) = 0.6 và P(A ∪ B) = 0.8. Xác suất của biến cố đối A gạch đầu giao B gạch đầu bằng bao nhiêu?", "0.2", "P = 1 - 0.8 = 0.2."],
    // World 3
    ["Chuyên đề 3: Công thức cộng & nhân xác suất tổng hợp", "MC", "Câu 7", "Cho biến cố A có P(A) = 0.7. Xác suất của biến cố đối A gạch đầu là:", "A", "P(not A) = 1 - 0.7 = 0.3."],
    ["Chuyên đề 3: Công thức cộng & nhân xác suất tổng hợp", "MC", "A)", "0.3", "", ""],
    ["Chuyên đề 3: Công thức cộng & nhân xác suất tổng hợp", "MC", "B)", "0.7", "", ""],
    ["Chuyên đề 3: Công thức cộng & nhân xác suất tổng hợp", "MC", "C)", "-0.7", "", ""],
    ["Chuyên đề 3: Công thức cộng & nhân xác suất tổng hợp", "MC", "D)", "1.7", "", ""],
    ["Chuyên đề 3: Công thức cộng & nhân xác suất tổng hợp", "TF", "Câu 8", "Hai bạn An và Bình độc lập cùng giải bài toán với xác suất 0.8 và 0.7. Xét tính Đúng/Sai:", "", ""],
    ["Chuyên đề 3: Công thức cộng & nhân xác suất tổng hợp", "TF", "A)", "Xác suất cả hai bạn cùng giải được là 0.56.", "Đúng", "P = 0.8 * 0.7 = 0.56."],
    ["Chuyên đề 3: Công thức cộng & nhân xác suất tổng hợp", "TF", "B)", "Xác suất cả hai bạn đều không giải được là 0.06.", "Đúng", "P = (1 - 0.8)*(1 - 0.7) = 0.06."],
    ["Chuyên đề 3: Công thức cộng & nhân xác suất tổng hợp", "TF", "C)", "Xác suất bài toán được giải quyết là 0.94.", "Đúng", "P = 1 - 0.06 = 0.94."],
    ["Chuyên đề 3: Công thức cộng & nhân xác suất tổng hợp", "TF", "D)", "Xác suất chỉ có đúng một bạn giải được là 0.40.", "Sai", "P = 0.8*0.3 + 0.2*0.7 = 0.38."],
    ["Chuyên đề 3: Công thức cộng & nhân xác suất tổng hợp", "SHORT", "Câu 9", "Một xạ thủ bắn 3 phát độc lập với xác suất trúng mỗi phát là 0.8. Xác suất người đó không bắn trúng phát nào bằng bao nhiêu?", "0.008", "P = (1 - 0.8)^3 = 0.008."]
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 35 }, { wch: 12 }, { wch: 15 }, { wch: 55 }, { wch: 25 }, { wch: 45 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Mario_3_Chuyen_De");
  XLSX.writeFile(wb, "Mau_Game_Mario_3_Chuyen_De_3_Dang_De.xlsx");
}

/**
 * SINH VÀ TẢI FILE WORD (.DOCX) MẪU CHO GAME HÁI TÁO LUÂN PHIÊN (3 CHUYÊN ĐỀ x 3 DẠNG BẢNG ĐEN TRẮNG)
 */
export async function downloadHaiTaoWordTemplate(): Promise<void> {
  const sectionsContent: any[] = [
    new Paragraph({
      children: [
        new TextRun({
          text: "MẪU ĐỀ GAME HÁI TÁO LUÂN PHIÊN (CHUẨN 3 CHUYÊN ĐỀ x 3 DẠNG BẢNG ĐEN TRẮNG)",
          bold: true,
          size: 26,
          color: "000000"
        })
      ],
      spacing: { after: 120 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "HƯỚNG DẪN CẤU TRÚC SOẠN ĐỀ CHO GAME HÁI TÁO LUÂN PHIÊN:\n" +
                "1. Game bao gồm 3 Chuyên đề (Chủ đề): Chủ đề 1 (Phương trình & Bất phương trình Mũ), Chủ đề 2 (Phương trình & Bất phương trình Logarit), Chủ đề 3 (Bài toán Lãi kép & Ứng dụng Thực tế).\n" +
                "2. Mỗi Chuyên đề hỗ trợ 3 dạng câu hỏi chuẩn đen trắng (không tô màu nền ô, viền đơn rõ ràng):\n" +
                "   - DẠNG TRẮC NGHIỆM ABCD (Bảng 7 dòng x 2 cột): Dòng 1: Câu [N] (TN) | Đề bài; Dòng 2..5: A), B), C), D); Dòng 6: Lời giải; Dòng 7: Đáp án A/B/C/D.\n" +
                "   - DẠNG ĐÚNG / SAI 4 Ý (Bảng 9 dòng x 2 cột): Dòng 1: Câu [N] (Đ/S) | Lời dẫn chung; Dòng 2, 4, 6, 8: A), B), C), D); Dòng 3, 5, 7, 9: Đúng/Sai | Lời giải chi tiết. Game tự động ghép lời dẫn dòng 1 với 1 ý ngẫu nhiên thành khẳng định khi thi đấu!\n" +
                "   - DẠNG TRẢ LỜI NGẮN / ĐIỀN SỐ (Bảng 3 dòng x 2 cột): Dòng 1: Câu [N] (TLN) | Đề bài; Dòng 2: Đáp án số | Số kết quả (tối đa 4-8 ký tự); Dòng 3: Lời giải. Hệ thống hiển thị 4 ô vuông trống điền số, coi dấu '.' và dấu ',' như nhau!\n" +
                "3. THUẬT TOÁN AUTO-SAMPLING: Game hỗ trợ kho câu hỏi không giới hạn. Khi vào trận đấu luân phiên, hệ thống tự động bốc ngẫu nhiên từ kho đề để phân phối vào cây táo cho hai đội, chống học sinh học vẹt!",
          size: 19,
          color: "333333"
        })
      ],
      spacing: { after: 220 }
    }),

    // CHỦ ĐỀ 1
    new Paragraph({
      children: [new TextRun({ text: "CHỦ ĐỀ 1: PHƯƠNG TRÌNH & BẤT PHƯƠNG TRÌNH MŨ", bold: true, color: "000000", size: 24 })],
      spacing: { before: 200, after: 120 }
    }),
    createTetrisMCQTable(
      1,
      "Nghiệm của phương trình \\( 3^{x+1} = 27 \\) là:",
      "\\( x = 1 \\)",
      "\\( x = 2 \\)",
      "\\( x = 3 \\)",
      "\\( x = 4 \\)",
      "\\( 3^{x+1} = 3^3 \\Rightarrow x+1=3 \\Rightarrow x=2 \\).",
      "B"
    ),
    new Paragraph({ text: "", spacing: { after: 120 } }),
    createTetrisTFQuestionTable(
      2,
      "Cho phương trình \\( 4^x - 3 \\cdot 2^x + 2 = 0 \\). Xét tính Đúng/Sai của các khẳng định sau:",
      "Đặt \\( t = 2^x \\ (t>0) \\), ta được phương trình \\( t^2 - 3t + 2 = 0 \\).", "Đúng", "Ta có \\( 4^x = (2^x)^2 = t^2 \\).",
      "Phương trình bậc hai theo t có nghiệm \\( t=1 \\) và \\( t=-2 \\).", "Sai", "Nghiệm của phương trình là t = 1 và t = 2.",
      "Phương trình ban đầu có nghiệm \\( x=0 \\) và \\( x=1 \\).", "Đúng", "\\( 2^x = 1 \\Rightarrow x = 0 \\); \\( 2^x = 2 \\Rightarrow x = 1 \\).",
      "Tổng các nghiệm của phương trình bằng 2.", "Sai", "Tổng các nghiệm bằng 0 + 1 = 1."
    ),
    new Paragraph({ text: "", spacing: { after: 120 } }),
    createTetrisShortAnswerTable(
      3,
      "Tổng tất cả các nghiệm của phương trình \\( 2^{x^2 - x} = 4 \\) bằng bao nhiêu?",
      "1",
      "\\( 2^{x^2 - x} = 2^2 \\Rightarrow x^2 - x - 2 = 0 \\Rightarrow x_1 + x_2 = 1 \\)."
    ),
    new Paragraph({ text: "", spacing: { after: 200 } }),

    // CHỦ ĐỀ 2
    new Paragraph({
      children: [new TextRun({ text: "CHỦ ĐỀ 2: PHƯƠNG TRÌNH & BẤT PHƯƠNG TRÌNH LOGARIT", bold: true, color: "000000", size: 24 })],
      spacing: { before: 200, after: 120 }
    }),
    createTetrisMCQTable(
      4,
      "Nghiệm của phương trình \\( \\log_2(x+3) = 3 \\) là:",
      "\\( x = 5 \\)",
      "\\( x = 6 \\)",
      "\\( x = 8 \\)",
      "\\( x = 11 \\)",
      "\\( x + 3 = 2^3 = 8 \\Rightarrow x = 5 \\).",
      "A"
    ),
    new Paragraph({ text: "", spacing: { after: 120 } }),
    createTetrisTFQuestionTable(
      5,
      "Cho bất phương trình \\( \\log_2(x-1) + \\log_2(x+1) < 3 \\). Xét tính Đúng/Sai của các khẳng định sau:",
      "Điều kiện xác định là \\( x > 1 \\).", "Đúng", "Điều kiện: x - 1 > 0 và x + 1 > 0 => x > 1.",
      "Bất phương trình tương đương \\( x^2 - 1 < 3 \\).", "Sai", "Tương đương log_2(x^2 - 1) < 3 => x^2 - 1 < 8.",
      "Tập nghiệm của bất phương trình là \\( (1; 3) \\).", "Đúng", "x^2 < 9 và x > 1 => 1 < x < 3.",
      "Bất phương trình có 2 nghiệm nguyên.", "Sai", "Chỉ có nghiệm nguyên x = 2 (1 nghiệm nguyên)."
    ),
    new Paragraph({ text: "", spacing: { after: 120 } }),
    createTetrisShortAnswerTable(
      6,
      "Tổng tất cả các nghiệm của phương trình \\( \\log_2(x^2 - 6x) = 4 \\) bằng bao nhiêu?",
      "6",
      "x^2 - 6x = 16 => x^2 - 6x - 16 = 0 => x_1 + x_2 = 6."
    ),
    new Paragraph({ text: "", spacing: { after: 200 } }),

    // CHỦ ĐỀ 3
    new Paragraph({
      children: [new TextRun({ text: "CHỦ ĐỀ 3: BÀI TOÁN LÃI KÉP & ỨNG DỤNG THỰC TẾ", bold: true, color: "000000", size: 24 })],
      spacing: { before: 200, after: 120 }
    }),
    createTetrisMCQTable(
      7,
      "Công thức tính số tiền cả vốn lẫn lãi sau n kỳ hạn gửi theo thể thức lãi kép là:",
      "\\( T = A(1+r)^n \\)",
      "\\( T = A(1+nr) \\)",
      "\\( T = A + nr \\)",
      "\\( T = A(1-r)^n \\)",
      "Công thức lãi kép chuẩn: T = A(1+r)^n.",
      "A"
    ),
    new Paragraph({ text: "", spacing: { after: 120 } }),
    createTetrisTFQuestionTable(
      8,
      "Một người gửi 50 triệu đồng vào ngân hàng với lãi suất lãi kép 7%/năm. Xét tính Đúng/Sai của các khẳng định sau:",
      "Sau 2 năm số tiền nhận được là \\( 50 \\cdot (1+0.07)^2 \\) triệu đồng.", "Đúng", "Áp dụng công thức T = A(1+r)^2.",
      "Số tiền lãi sau năm thứ nhất là 3.5 triệu đồng.", "Đúng", "Lãi năm 1: 50 * 0.07 = 3.5 triệu.",
      "Số tiền sau 2 năm vượt quá 60 triệu đồng.", "Sai", "50 * (1.07)^2 = 57.245 triệu < 60 triệu.",
      "Cần ít nhất 11 năm để số tiền nhận được gấp đôi ban đầu.", "Đúng", "(1.07)^n >= 2 => n >= ln 2 / ln 1.07 = 10.24 => cần 11 năm."
    ),
    new Paragraph({ text: "", spacing: { after: 120 } }),
    createTetrisShortAnswerTable(
      9,
      "Cường độ âm tăng gấp 1000 lần thì mức cường độ âm L tăng thêm bao nhiêu dB?",
      "30",
      "delta L = 10 * log(1000) = 10 * 3 = 30 dB."
    )
  ];

  const doc = new Document({
    sections: [{ properties: {}, children: sectionsContent }]
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, "Mau_Game_Hai_Tao_Luan_Phien_3_Dang_De.docx");
}

/**
 * SINH VÀ TẢI FILE EXCEL (.XLSX) MẪU CHO GAME HÁI TÁO LUÂN PHIÊN (3 CHUYÊN ĐỀ x 3 DẠNG CÂU HỎI)
 */
export async function downloadHaiTaoExcelTemplate(): Promise<void> {
  const { XLSX } = await loadDocumentLibraries();
  const rows = [
    ["Chuyên đề", "Loại Dạng", "Cột 1: Câu / Ý", "Cột 2: Nội dung phát biểu / Đề bài", "Cột 3: Đáp án (A/B/C/D hoặc Đúng/Sai hoặc Số)", "Cột 4: Lời giải chi tiết"],
    // Chủ đề 1
    ["Chủ đề 1: Phương trình & Bất phương trình Mũ", "MC", "Câu 1", "Nghiệm của phương trình 3^{x+1} = 27 là:", "B", "3^{x+1} = 3^3 => x+1=3 => x=2."],
    ["Chủ đề 1: Phương trình & Bất phương trình Mũ", "MC", "A)", "x = 1", "", ""],
    ["Chủ đề 1: Phương trình & Bất phương trình Mũ", "MC", "B)", "x = 2", "", ""],
    ["Chủ đề 1: Phương trình & Bất phương trình Mũ", "MC", "C)", "x = 3", "", ""],
    ["Chủ đề 1: Phương trình & Bất phương trình Mũ", "MC", "D)", "x = 4", "", ""],
    ["Chủ đề 1: Phương trình & Bất phương trình Mũ", "TF", "Câu 2", "Cho phương trình 4^x - 3 . 2^x + 2 = 0. Xét tính Đúng/Sai:", "", ""],
    ["Chủ đề 1: Phương trình & Bất phương trình Mũ", "TF", "A)", "Đặt t = 2^x (t>0), ta được t^2 - 3t + 2 = 0.", "Đúng", "4^x = t^2."],
    ["Chủ đề 1: Phương trình & Bất phương trình Mũ", "TF", "B)", "Phương trình bậc hai có nghiệm t=1 và t=-2.", "Sai", "Nghiệm t=1 và t=2."],
    ["Chủ đề 1: Phương trình & Bất phương trình Mũ", "TF", "C)", "Phương trình ban đầu có nghiệm x=0 và x=1.", "Đúng", "2^x = 1 => x=0; 2^x = 2 => x=1."],
    ["Chủ đề 1: Phương trình & Bất phương trình Mũ", "TF", "D)", "Tổng các nghiệm của phương trình bằng 2.", "Sai", "Tổng các nghiệm bằng 1."],
    ["Chủ đề 1: Phương trình & Bất phương trình Mũ", "SHORT", "Câu 3", "Tổng các nghiệm của phương trình 2^{x^2 - x} = 4 bằng bao nhiêu?", "1", "x^2 - x = 2 => x_1 + x_2 = 1."],
    // Chủ đề 2
    ["Chủ đề 2: Phương trình & Bất phương trình Logarit", "MC", "Câu 4", "Nghiệm của phương trình log_2(x+3) = 3 là:", "A", "x+3 = 8 => x = 5."],
    ["Chủ đề 2: Phương trình & Bất phương trình Logarit", "MC", "A)", "x = 5", "", ""],
    ["Chủ đề 2: Phương trình & Bất phương trình Logarit", "MC", "B)", "x = 6", "", ""],
    ["Chủ đề 2: Phương trình & Bất phương trình Logarit", "MC", "C)", "x = 8", "", ""],
    ["Chủ đề 2: Phương trình & Bất phương trình Logarit", "MC", "D)", "x = 11", "", ""],
    ["Chủ đề 2: Phương trình & Bất phương trình Logarit", "TF", "Câu 5", "Cho bất phương trình log_2(x-1) + log_2(x+1) < 3. Xét tính Đúng/Sai:", "", ""],
    ["Chủ đề 2: Phương trình & Bất phương trình Logarit", "TF", "A)", "Điều kiện xác định là x > 1.", "Đúng", "x > 1."],
    ["Chủ đề 2: Phương trình & Bất phương trình Logarit", "TF", "B)", "Bất phương trình tương đương x^2 - 1 < 3.", "Sai", "log_2(x^2 - 1) < 3 => x^2 - 1 < 8."],
    ["Chủ đề 2: Phương trình & Bất phương trình Logarit", "TF", "C)", "Tập nghiệm là (1; 3).", "Đúng", "1 < x < 3."],
    ["Chủ đề 2: Phương trình & Bất phương trình Logarit", "TF", "D)", "Bất phương trình có 2 nghiệm nguyên.", "Sai", "Chỉ có x = 2."],
    ["Chủ đề 2: Phương trình & Bất phương trình Logarit", "SHORT", "Câu 6", "Tổng các nghiệm của phương trình log_2(x^2 - 6x) = 4 bằng bao nhiêu?", "6", "x_1 + x_2 = 6."],
    // Chủ đề 3
    ["Chủ đề 3: Bài toán Lãi kép & Ứng dụng Thực tế", "MC", "Câu 7", "Công thức tính số tiền nhận được sau n kỳ hạn lãi kép là:", "A", "T = A(1+r)^n."],
    ["Chủ đề 3: Bài toán Lãi kép & Ứng dụng Thực tế", "MC", "A)", "T = A(1+r)^n", "", ""],
    ["Chủ đề 3: Bài toán Lãi kép & Ứng dụng Thực tế", "MC", "B)", "T = A(1+nr)", "", ""],
    ["Chủ đề 3: Bài toán Lãi kép & Ứng dụng Thực tế", "MC", "C)", "T = A + nr", "", ""],
    ["Chủ đề 3: Bài toán Lãi kép & Ứng dụng Thực tế", "MC", "D)", "T = A(1-r)^n", "", ""],
    ["Chủ đề 3: Bài toán Lãi kép & Ứng dụng Thực tế", "TF", "Câu 8", "Gửi 50 triệu đồng lãi kép 7%/năm. Xét tính Đúng/Sai:", "", ""],
    ["Chủ đề 3: Bài toán Lãi kép & Ứng dụng Thực tế", "TF", "A)", "Sau 2 năm số tiền là 50 . (1+0.07)^2 triệu.", "Đúng", "T = A(1+r)^2."],
    ["Chủ đề 3: Bài toán Lãi kép & Ứng dụng Thực tế", "TF", "B)", "Số tiền lãi sau năm thứ 1 là 3.5 triệu.", "Đúng", "50 * 0.07 = 3.5."],
    ["Chủ đề 3: Bài toán Lãi kép & Ứng dụng Thực tế", "TF", "C)", "Số tiền sau 2 năm vượt quá 60 triệu.", "Sai", "57.245 triệu < 60."],
    ["Chủ đề 3: Bài toán Lãi kép & Ứng dụng Thực tế", "TF", "D)", "Cần ít nhất 11 năm để số tiền gấp đôi.", "Đúng", "n >= 10.24 => 11 năm."],
    ["Chủ đề 3: Bài toán Lãi kép & Ứng dụng Thực tế", "SHORT", "Câu 9", "Cường độ âm tăng 1000 lần thì mức cường độ âm tăng thêm bao nhiêu dB?", "30", "10 * log(1000) = 30 dB."]
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 38 }, { wch: 12 }, { wch: 15 }, { wch: 55 }, { wch: 25 }, { wch: 45 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Hai_Tao_3_Chuyen_De");
  XLSX.writeFile(wb, "Mau_Game_Hai_Tao_3_Chuyen_De_3_Dang_De.xlsx");
}

/**
 * BỘ PARSER FILE WORD (.DOCX) CHUẨN BẢNG ĐÚNG/SAI 9 DÒNG x 2 CỘT CHO GAME CỜ CÁ NGỰA
 * Trích xuất lời dẫn dòng 1 kết hợp từng ý dòng 2,4,6,8 kèm kết quả dòng 3,5,7,9 để sinh câu hỏi Đúng/Sai độc lập
 */
export async function parseCaNguaFromDocx(file: File): Promise<Question[]> {
  const { mammoth } = await loadDocumentLibraries();
  const arrayBuffer = await file.arrayBuffer();
  const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
  const html = htmlResult.value || '';

  const questions: Question[] = [];

  if (html.includes('<table')) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const tables = Array.from(doc.querySelectorAll('table'));

    tables.forEach((table, tIdx) => {
      const rows = Array.from(table.querySelectorAll('tr'));
      if (rows.length < 3) return;

      const blocks: Element[][] = [];
      let curBlock: Element[] = [];

      rows.forEach((row) => {
        const cells = Array.from(row.querySelectorAll('td, th'));
        const col1 = cells.length > 0 ? (cells[0].textContent || '').trim().toLowerCase() : '';
        const isStart = /^câu\s*\d+/i.test(col1) || col1.startsWith('câu');

        if (isStart && curBlock.length >= 3) {
          blocks.push(curBlock);
          curBlock = [row];
        } else {
          curBlock.push(row);
        }
      });
      if (curBlock.length >= 3) {
        blocks.push(curBlock);
      } else if (blocks.length === 0 && rows.length >= 9) {
        for (let i = 0; i < rows.length; i += 9) {
          const chunk = rows.slice(i, i + 9);
          if (chunk.length >= 3) blocks.push(chunk);
        }
      }

      blocks.forEach((blockRows, bIdx) => {
        const rowCount = blockRows.length;
        const firstRowCells = Array.from(blockRows[0].querySelectorAll('td, th'));
        if (firstRowCells.length < 2) return;

        let stem = (firstRowCells[1].textContent || '').trim();
        let stemImg = '';
        const imgEl = firstRowCells[1].querySelector('img');
        if (imgEl && imgEl.getAttribute('src')) {
          stemImg = imgEl.getAttribute('src') || '';
        }

        const is9RowFormat = rowCount >= 5 && blockRows.some((r, idx) => {
          if (idx === 0) return false;
          const c = Array.from(r.querySelectorAll('td, th'));
          const text0 = (c[0]?.textContent || '').trim().toLowerCase();
          return text0.includes('đúng') || text0.includes('sai') || text0.startsWith('a)') || text0.startsWith('b)');
        });

        if (is9RowFormat) {
          const items: { letter: string; text: string; isCorrect: boolean; explanation: string; img?: string }[] = [];
          
          let curLetter = '';
          let curText = '';
          let curImg = '';

          for (let r = 1; r < blockRows.length; r++) {
            const cells = Array.from(blockRows[r].querySelectorAll('td, th'));
            if (cells.length < 2) continue;
            const c0 = (cells[0].textContent || '').trim();
            const c1 = (cells[1].textContent || '').trim();
            const c0Lower = c0.toLowerCase();
            const itemImgEl = cells[1].querySelector('img');
            const itemImg = itemImgEl ? (itemImgEl.getAttribute('src') || '') : '';

            const letterMatch = c0.match(/^[a-dA-D][\)\.\:\-]?$/i);
            const isAnsRow = c0Lower.includes('đúng') || c0Lower.includes('sai') || c0Lower.includes('true') || c0Lower.includes('false');

            if (letterMatch) {
              curLetter = letterMatch[0].replace(/[\)\.\:\-]/g, '').toUpperCase();
              curText = c1;
              curImg = itemImg;
            } else if (isAnsRow || (curLetter && !isAnsRow && (c1.toLowerCase().includes('đúng') || c1.toLowerCase().includes('sai')))) {
              const isCorrect = c0Lower.includes('đúng') || c0Lower.includes('true') || (!c0Lower.includes('sai') && c1.toLowerCase().startsWith('đúng'));
              const exp = c1;
              const effectiveLetter = curLetter || String.fromCharCode(65 + items.length);

              items.push({
                letter: effectiveLetter,
                text: curText,
                isCorrect: isCorrect,
                explanation: exp,
                img: curImg || stemImg
              });

              curLetter = '';
              curText = '';
              curImg = '';
            } else if (!curLetter && c0Lower) {
              const combinedMatch = c0.match(/^([a-dA-D])[\)\.\:\-]?\s*(đúng|sai)/i);
              if (combinedMatch) {
                const letStr = combinedMatch[1].toUpperCase();
                const isCor = combinedMatch[2].toLowerCase() === 'đúng';
                items.push({
                  letter: letStr,
                  text: c1,
                  isCorrect: isCor,
                  explanation: '',
                  img: itemImg || stemImg
                });
              }
            }
          }

          items.forEach((item, itemIdx) => {
            const cleanStem = normalizeMathFormulas(stem);
            const cleanText = normalizeMathFormulas(item.text);
            const questionStr = `ĐÚNG HAY SAI: ${cleanStem ? cleanStem + ' ' : ''}[Ý ${item.letter}]: ${cleanText}`;
            const cleanExp = normalizeMathFormulas(item.explanation);

            questions.push({
              id: `cn_docx_${Date.now()}_${bIdx}_${itemIdx}`,
              question: questionStr,
              options: ['Đúng', 'Sai'],
              correctIndex: item.isCorrect ? 0 : 1,
              explanation: cleanExp,
              difficulty: itemIdx === 0 ? 'Dễ' : (itemIdx === 3 ? 'Khó' : 'Trung bình'),
              topic: 'Cờ Cá Ngựa - Đúng/Sai 4 Ý',
              source: 'Word Import (9 dòng)',
              status: 'published',
              createdAt: new Date().toISOString(),
              imageUrl: item.img || stemImg || undefined
            });
          });
        } else if (rowCount >= 6) {
          let optA = '';
          let optB = '';
          let optC = '';
          let optD = '';
          let explanation = '';
          let answerLetter = 'A';

          blockRows.slice(1).forEach((row) => {
            const cells = Array.from(row.querySelectorAll('td, th'));
            if (cells.length < 2) return;
            const c0 = (cells[0].textContent || '').trim().toLowerCase();
            const c1 = (cells[1].textContent || '').trim();

            if (c0.startsWith('a') || c0 === 'a)') optA = c1;
            else if (c0.startsWith('b') || c0 === 'b)') optB = c1;
            else if (c0.startsWith('c') || c0 === 'c)') optC = c1;
            else if (c0.startsWith('d') || c0 === 'd)') optD = c1;
            else if (c0.includes('lời giải') || c0.includes('giải thích')) explanation = c1;
            else if (c0.includes('đáp án') || c0.includes('kết quả')) {
              const m = c1.match(/[A-D]/i);
              if (m) answerLetter = m[0].toUpperCase();
            }
          });

          if (optA && optB) {
            const letIdx = ['A', 'B', 'C', 'D'].indexOf(answerLetter);
            questions.push({
              id: `cn_docx_mc_${Date.now()}_${bIdx}`,
              question: normalizeMathFormulas(stem),
              options: [
                normalizeMathFormulas(optA),
                normalizeMathFormulas(optB),
                normalizeMathFormulas(optC || 'Đáp án C'),
                normalizeMathFormulas(optD || 'Đáp án D')
              ],
              correctIndex: letIdx >= 0 ? letIdx : 0,
              explanation: normalizeMathFormulas(explanation),
              difficulty: 'Trung bình',
              topic: 'Cờ Cá Ngựa - Trắc Nghiệm',
              source: 'Word Import (Trắc nghiệm)',
              status: 'published',
              createdAt: new Date().toISOString(),
              imageUrl: stemImg || undefined
            });
          }
        }
      });
    });
  }

  if (questions.length === 0) {
    const rawText = await extractTextFromDocx(file);
    return parseDocumentQuestions(rawText, 'Cờ Cá Ngựa');
  }

  return questions;
}

export async function parseCaNguaFromExcel(file: File): Promise<Question[]> {
  const { XLSX } = await loadDocumentLibraries();
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  const questions: Question[] = [];
  let currentStem = '';

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row || row.length === 0) continue;
    const col0 = String(row[0] || '').trim();
    const col1 = String(row[1] || '').trim();
    const col2 = String(row[2] || '').trim();
    const col3 = String(row[3] || '').trim();

    if (/^câu\s*\d+/i.test(col0) || col0.toLowerCase().startsWith('câu')) {
      currentStem = col1 || col0;
      continue;
    }

    const letterMatch = col0.match(/^[a-dA-D][\)\.\:\-]?$/i);
    if (letterMatch && col1) {
      const letChar = letterMatch[0].replace(/[\)\.\:\-]/g, '').toUpperCase();
      const isCorrect = col2.toLowerCase().includes('đúng') || col2.toLowerCase().includes('true');
      const exp = col3 || (col2.toLowerCase().includes('đúng') || col2.toLowerCase().includes('sai') ? '' : col2);

      const qText = `ĐÚNG HAY SAI: ${currentStem ? currentStem + ' ' : ''}[Ý ${letChar}]: ${col1}`;
      questions.push({
        id: `cn_xlsx_${Date.now()}_${i}`,
        question: normalizeMathFormulas(qText),
        options: ['Đúng', 'Sai'],
        correctIndex: isCorrect ? 0 : 1,
        explanation: normalizeMathFormulas(exp),
        difficulty: 'Trung bình',
        topic: 'Cờ Cá Ngựa - Đúng/Sai',
        source: 'Excel Import',
        status: 'published',
        createdAt: new Date().toISOString()
      });
    }
  }

  if (questions.length === 0) {
    const csv = XLSX.utils.sheet_to_csv(sheet);
    return parseDocumentQuestions(csv, 'Cờ Cá Ngựa');
  }

  return questions;
}

/**
 * BỘ PARSER FILE WORD (.DOCX) CHUẨN 3 DẠNG BẢNG CHO GAME TETRIS
 * (7 dòng MC, 9 dòng TF ghép đề thông minh, 3 dòng Short Answer)
 */
export async function parseTetrisFromDocx(file: File): Promise<Question[]> {
  const { mammoth } = await loadDocumentLibraries();
  const arrayBuffer = await file.arrayBuffer();
  const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
  const html = htmlResult.value || '';

  const questions: Question[] = [];

  if (html.includes('<table')) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const tables = Array.from(doc.querySelectorAll('table'));

    tables.forEach((table, tIdx) => {
      const rows = Array.from(table.querySelectorAll('tr'));
      if (rows.length < 2) return;

      const blocks: Element[][] = [];
      let curBlock: Element[] = [];

      rows.forEach((row) => {
        const cells = Array.from(row.querySelectorAll('td, th'));
        const col1 = cells.length > 0 ? (cells[0].textContent || '').trim().toLowerCase() : '';
        const isStart = /^câu\s*\d+/i.test(col1) || col1.startsWith('câu');

        if (isStart && curBlock.length >= 2) {
          blocks.push(curBlock);
          curBlock = [row];
        } else {
          curBlock.push(row);
        }
      });
      if (curBlock.length >= 2) {
        blocks.push(curBlock);
      }

      const effectiveBlocks = blocks.length > 0 ? blocks : [rows];

      effectiveBlocks.forEach((blockRows, bIdx) => {
        const rowCount = blockRows.length;
        const firstRowCells = Array.from(blockRows[0].querySelectorAll('td, th'));
        if (firstRowCells.length < 2) return;

        let stem = (firstRowCells[1].textContent || '').trim();
        let stemImg = '';
        const imgEl = firstRowCells[1].querySelector('img');
        if (imgEl && imgEl.getAttribute('src')) {
          stemImg = imgEl.getAttribute('src') || '';
        }

        // Kiểm tra Dạng 3: Trả lời ngắn (3 dòng hoặc có nhãn Đáp án số / TLN)
        const isShortAnswer = rowCount <= 4 && blockRows.some(r => {
          const c0 = (r.querySelector('td, th')?.textContent || '').toLowerCase();
          return c0.includes('đáp án số') || c0.includes('giá trị số') || c0.includes('số kết quả') || c0.includes('tln');
        });

        // Kiểm tra Dạng 2: Đúng / Sai 4 ý (9 dòng hoặc chứa A, B, C, D kèm Đúng/Sai)
        const is9RowTF = !isShortAnswer && rowCount >= 5 && blockRows.some((r, idx) => {
          if (idx === 0) return false;
          const c = Array.from(r.querySelectorAll('td, th'));
          const text0 = (c[0]?.textContent || '').trim().toLowerCase();
          return text0.includes('đúng') || text0.includes('sai') || text0.startsWith('a)') || text0.startsWith('b)');
        });

        if (isShortAnswer) {
          let ansNum = '';
          let explanation = '';
          blockRows.slice(1).forEach(r => {
            const cells = Array.from(r.querySelectorAll('td, th'));
            if (cells.length < 2) return;
            const c0 = (cells[0].textContent || '').toLowerCase();
            const c1 = (cells[1].textContent || '').trim();
            if (c0.includes('đáp án') || c0.includes('giá trị') || c0.includes('kết quả')) {
              ansNum = c1;
            } else if (c0.includes('lời giải') || c0.includes('chi tiết')) {
              explanation = c1;
            }
          });

          if (ansNum) {
            questions.push({
              id: `tetris_short_${Date.now()}_${tIdx}_${bIdx}`,
              question: normalizeMathFormulas(stem),
              options: [ansNum.trim()],
              correctIndex: 0,
              explanation: normalizeMathFormulas(explanation),
              difficulty: 'Trung bình',
              topic: 'Tetris - Trả Lời Ngắn',
              source: 'Word Import (TLN 3 dòng)',
              status: 'published',
              createdAt: new Date().toISOString(),
              type: 'short_answer',
              imageUrl: stemImg || undefined
            });
          }
        } else if (is9RowTF) {
          // Bóc tách Đúng/Sai ghép đề thông minh
          const items: { letter: string; text: string; isCorrect: boolean; explanation: string; img?: string }[] = [];
          let curLetter = '';
          let curText = '';
          let curImg = '';

          for (let r = 1; r < blockRows.length; r++) {
            const cells = Array.from(blockRows[r].querySelectorAll('td, th'));
            if (cells.length < 2) continue;
            const c0 = (cells[0].textContent || '').trim();
            const c1 = (cells[1].textContent || '').trim();
            const c0Lower = c0.toLowerCase();
            const itemImgEl = cells[1].querySelector('img');
            const itemImg = itemImgEl ? (itemImgEl.getAttribute('src') || '') : '';

            const letterMatch = c0.match(/^[a-dA-D][\)\.\:\-]?$/i);
            const isAnsRow = c0Lower.includes('đúng') || c0Lower.includes('sai') || c0Lower.includes('true') || c0Lower.includes('false');

            if (letterMatch) {
              curLetter = letterMatch[0].replace(/[\)\.\:\-]/g, '').toUpperCase();
              curText = c1;
              curImg = itemImg;
            } else if (isAnsRow || (curLetter && !isAnsRow && (c1.toLowerCase().includes('đúng') || c1.toLowerCase().includes('sai')))) {
              const isCorrect = c0Lower.includes('đúng') || c0Lower.includes('true') || (!c0Lower.includes('sai') && c1.toLowerCase().startsWith('đúng'));
              const exp = c1;
              const effectiveLetter = curLetter || String.fromCharCode(65 + items.length);

              items.push({
                letter: effectiveLetter,
                text: curText,
                isCorrect: isCorrect,
                explanation: exp,
                img: curImg || stemImg
              });

              curLetter = '';
              curText = '';
              curImg = '';
            } else if (!curLetter && c0Lower) {
              const combinedMatch = c0.match(/^([a-dA-D])[\)\.\:\-]?\s*(đúng|sai)/i);
              if (combinedMatch) {
                const letStr = combinedMatch[1].toUpperCase();
                const isCor = combinedMatch[2].toLowerCase() === 'đúng';
                items.push({
                  letter: letStr,
                  text: c1,
                  isCorrect: isCor,
                  explanation: '',
                  img: itemImg || stemImg
                });
              }
            }
          }

          items.forEach((item, itemIdx) => {
            const cleanStem = normalizeMathFormulas(stem);
            const cleanText = normalizeMathFormulas(item.text);
            const questionStr = `ĐÚNG HAY SAI: ${cleanStem ? cleanStem + ' ' : ''}[Ý ${item.letter}]: ${cleanText}`;
            const cleanExp = normalizeMathFormulas(item.explanation);

            questions.push({
              id: `tetris_tf_${Date.now()}_${tIdx}_${bIdx}_${itemIdx}`,
              question: questionStr,
              options: ['Đúng', 'Sai'],
              correctIndex: item.isCorrect ? 0 : 1,
              explanation: cleanExp,
              difficulty: itemIdx === 0 ? 'Dễ' : (itemIdx === 3 ? 'Khó' : 'Trung bình'),
              topic: 'Tetris - Đúng/Sai 4 Ý',
              source: 'Word Import (Đ/S 9 dòng)',
              status: 'published',
              createdAt: new Date().toISOString(),
              type: 'truefalse',
              imageUrl: item.img || stemImg || undefined
            });
          });
        } else if (rowCount >= 5) {
          // Dạng 1: Trắc nghiệm ABCD 7 dòng
          let optA = '';
          let optB = '';
          let optC = '';
          let optD = '';
          let explanation = '';
          let answerLetter = 'A';

          blockRows.slice(1).forEach((row) => {
            const cells = Array.from(row.querySelectorAll('td, th'));
            if (cells.length < 2) return;
            const c0 = (cells[0].textContent || '').trim().toLowerCase();
            const c1 = (cells[1].textContent || '').trim();

            if (c0.startsWith('a') || c0 === 'a)') optA = c1;
            else if (c0.startsWith('b') || c0 === 'b)') optB = c1;
            else if (c0.startsWith('c') || c0 === 'c)') optC = c1;
            else if (c0.startsWith('d') || c0 === 'd)') optD = c1;
            else if (c0.includes('lời giải') || c0.includes('giải thích')) explanation = c1;
            else if (c0.includes('đáp án') || c0.includes('kết quả')) {
              const m = c1.match(/[A-D]/i);
              if (m) answerLetter = m[0].toUpperCase();
            }
          });

          if (optA && optB) {
            const letIdx = ['A', 'B', 'C', 'D'].indexOf(answerLetter);
            questions.push({
              id: `tetris_mc_${Date.now()}_${tIdx}_${bIdx}`,
              question: normalizeMathFormulas(stem),
              options: [
                normalizeMathFormulas(optA),
                normalizeMathFormulas(optB),
                normalizeMathFormulas(optC || 'Đáp án C'),
                normalizeMathFormulas(optD || 'Đáp án D')
              ],
              correctIndex: letIdx >= 0 ? letIdx : 0,
              explanation: normalizeMathFormulas(explanation),
              difficulty: 'Trung bình',
              topic: 'Tetris - Trắc Nghiệm',
              source: 'Word Import (TN 7 dòng)',
              status: 'published',
              createdAt: new Date().toISOString(),
              type: 'abcd',
              imageUrl: stemImg || undefined
            });
          }
        }
      });
    });
  }

  if (questions.length === 0) {
    const rawText = await extractTextFromDocx(file);
    return parseDocumentQuestions(rawText, 'Tetris Xếp Gạch');
  }

  return questions;
}

export async function parseTetrisFromExcel(file: File): Promise<Question[]> {
  const { XLSX } = await loadDocumentLibraries();
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  const questions: Question[] = [];
  let currentStem = '';
  let currentType = 'MC';

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row || row.length === 0) continue;
    const col0 = String(row[0] || '').trim();
    const col1 = String(row[1] || '').trim();
    const col2 = String(row[2] || '').trim();
    const col3 = String(row[3] || '').trim();
    const col4 = String(row[4] || '').trim();

    const col0Upper = col0.toUpperCase();
    if (col0Upper === 'MC' || col0Upper === 'TF' || col0Upper === 'SHORT') {
      currentType = col0Upper;
    }

    if (/^câu\s*\d+/i.test(col1) || col1.toLowerCase().startsWith('câu')) {
      currentStem = col2 || col1;
      if (currentType === 'SHORT' || col0Upper === 'SHORT' || (!col0 && col3 && !isNaN(Number(col3)))) {
        questions.push({
          id: `tetris_xl_short_${Date.now()}_${i}`,
          question: normalizeMathFormulas(currentStem),
          options: [col3.trim()],
          correctIndex: 0,
          explanation: normalizeMathFormulas(col4),
          difficulty: 'Trung bình',
          topic: 'Tetris - Trả Lời Ngắn',
          source: 'Excel Import',
          status: 'published',
          createdAt: new Date().toISOString(),
          type: 'short_answer'
        });
      }
      continue;
    }

    const letterMatch = col1.match(/^[a-dA-D][\)\.\:\-]?$/i);
    if (letterMatch && col2) {
      const letChar = letterMatch[0].replace(/[\)\.\:\-]/g, '').toUpperCase();
      const isTF = currentType === 'TF' || col3.toLowerCase().includes('đúng') || col3.toLowerCase().includes('sai');

      if (isTF) {
        const isCorrect = col3.toLowerCase().includes('đúng') || col3.toLowerCase().includes('true');
        const exp = col4 || (col3.toLowerCase().includes('đúng') || col3.toLowerCase().includes('sai') ? '' : col3);
        const qText = `ĐÚNG HAY SAI: ${currentStem ? currentStem + ' ' : ''}[Ý ${letChar}]: ${col2}`;

        questions.push({
          id: `tetris_xl_tf_${Date.now()}_${i}`,
          question: normalizeMathFormulas(qText),
          options: ['Đúng', 'Sai'],
          correctIndex: isCorrect ? 0 : 1,
          explanation: normalizeMathFormulas(exp),
          difficulty: 'Trung bình',
          topic: 'Tetris - Đúng/Sai',
          source: 'Excel Import',
          status: 'published',
          createdAt: new Date().toISOString(),
          type: 'truefalse'
        });
      }
    }
  }

  if (questions.length === 0) {
    const csv = XLSX.utils.sheet_to_csv(sheet);
    return parseDocumentQuestions(csv, 'Tetris Xếp Gạch');
  }

  return questions;
}

/**
 * BỘ PARSER FILE WORD (.DOCX) CHUẨN 3 CHUYÊN ĐỀ x 3 DẠNG BẢNG CHO GAME MARIO PHIÊU LƯU KÝ
 * (7 dòng MC, 9 dòng TF ghép đề thông minh, 3 dòng Short Answer)
 */
export async function parseMarioFromDocx(file: File): Promise<Question[]> {
  const { mammoth } = await loadDocumentLibraries();
  const arrayBuffer = await file.arrayBuffer();
  const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
  const html = htmlResult.value || '';

  const questions: Question[] = [];

  if (html.includes('<table')) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const tables = Array.from(doc.querySelectorAll('table'));

    let currentTopic = 'Chuyên đề 1: Biến cố giao & Biến cố độc lập';
    let currentDifficulty: Difficulty = 'Dễ';

    tables.forEach((table, tIdx) => {
      // Xác định Chuyên đề và Mức độ từ các thẻ heading / đoạn văn phía trước bảng
      let prevEl = table.previousElementSibling;
      while (prevEl) {
        const text = (prevEl.textContent || '').trim().toLowerCase();
        if (text.includes('chuyên đề 1') || text.includes('chủ đề 1') || (text.includes('biến cố giao') && text.includes('độc lập'))) {
          currentTopic = 'Chuyên đề 1: Biến cố giao & Biến cố độc lập';
        } else if (text.includes('chuyên đề 2') || text.includes('chủ đề 2') || (text.includes('biến cố hợp') && text.includes('xung khắc'))) {
          currentTopic = 'Chuyên đề 2: Biến cố hợp & Biến cố xung khắc';
        } else if (text.includes('chuyên đề 3') || text.includes('chủ đề 3') || (text.includes('công thức cộng') && text.includes('nhân'))) {
          currentTopic = 'Chuyên đề 3: Công thức cộng & nhân xác suất tổng hợp';
        }

        if (text.includes('mức độ 1') || text.includes('level 1') || text.includes('dễ') || text.includes('easy')) {
          currentDifficulty = 'Dễ';
        } else if (text.includes('mức độ 3') || text.includes('level 3') || text.includes('khó') || text.includes('hard')) {
          currentDifficulty = 'Khó';
        } else if (text.includes('mức độ 2') || text.includes('level 2') || text.includes('vừa') || text.includes('trung bình') || text.includes('medium')) {
          currentDifficulty = 'Trung bình';
        }

        if (text.includes('chuyên đề') || text.includes('chủ đề') || text.includes('world') || text.includes('mức độ')) break;
        prevEl = prevEl.previousElementSibling;
      }

      const rows = Array.from(table.querySelectorAll('tr'));
      if (rows.length < 2) return;

      const blocks: Element[][] = [];
      let curBlock: Element[] = [];

      rows.forEach((row) => {
        const cells = Array.from(row.querySelectorAll('td, th'));
        const col1 = cells.length > 0 ? (cells[0].textContent || '').trim().toLowerCase() : '';
        const isStart = /^câu\s*\d+/i.test(col1) || col1.startsWith('câu');

        if (isStart && curBlock.length >= 2) {
          blocks.push(curBlock);
          curBlock = [row];
        } else {
          curBlock.push(row);
        }
      });
      if (curBlock.length >= 2) {
        blocks.push(curBlock);
      }

      const effectiveBlocks = blocks.length > 0 ? blocks : [rows];

      effectiveBlocks.forEach((blockRows, bIdx) => {
        const rowCount = blockRows.length;
        const firstRowCells = Array.from(blockRows[0].querySelectorAll('td, th'));
        if (firstRowCells.length < 2) return;

        let stem = (firstRowCells[1].textContent || '').trim();
        let stemImg = '';
        const imgEl = firstRowCells[1].querySelector('img');
        if (imgEl && imgEl.getAttribute('src')) {
          stemImg = imgEl.getAttribute('src') || '';
        }

        const isShortAnswer = rowCount <= 4 && blockRows.some(r => {
          const c0 = (r.querySelector('td, th')?.textContent || '').toLowerCase();
          return c0.includes('đáp án số') || c0.includes('giá trị số') || c0.includes('số kết quả') || c0.includes('tln');
        });

        const is9RowTF = !isShortAnswer && rowCount >= 5 && blockRows.some((r, idx) => {
          if (idx === 0) return false;
          const c = Array.from(r.querySelectorAll('td, th'));
          const text0 = (c[0]?.textContent || '').trim().toLowerCase();
          return text0.includes('đúng') || text0.includes('sai') || text0.startsWith('a)') || text0.startsWith('b)');
        });

        if (isShortAnswer) {
          let ansNum = '';
          let explanation = '';
          blockRows.slice(1).forEach(r => {
            const cells = Array.from(r.querySelectorAll('td, th'));
            if (cells.length < 2) return;
            const c0 = (cells[0].textContent || '').toLowerCase();
            const c1 = (cells[1].textContent || '').trim();
            if (c0.includes('đáp án') || c0.includes('giá trị') || c0.includes('kết quả')) {
              ansNum = c1;
            } else if (c0.includes('lời giải') || c0.includes('chi tiết')) {
              explanation = c1;
            }
          });

          if (ansNum) {
            questions.push({
              id: `mario_short_${Date.now()}_${tIdx}_${bIdx}`,
              question: normalizeMathFormulas(stem),
              options: [ansNum.trim()],
              correctIndex: 0,
              explanation: normalizeMathFormulas(explanation),
              difficulty: currentDifficulty,
              topic: currentTopic,
              source: 'Word Import (TLN 3 dòng)',
              status: 'published',
              createdAt: new Date().toISOString(),
              type: 'short_answer',
              imageUrl: stemImg || undefined
            });
          }
        } else if (is9RowTF) {
          const items: { letter: string; text: string; isCorrect: boolean; explanation: string; img?: string }[] = [];
          let curLetter = '';
          let curText = '';
          let curImg = '';

          for (let r = 1; r < blockRows.length; r++) {
            const cells = Array.from(blockRows[r].querySelectorAll('td, th'));
            if (cells.length < 2) continue;
            const c0 = (cells[0].textContent || '').trim();
            const c1 = (cells[1].textContent || '').trim();
            const c0Lower = c0.toLowerCase();
            const itemImgEl = cells[1].querySelector('img');
            const itemImg = itemImgEl ? (itemImgEl.getAttribute('src') || '') : '';

            const letterMatch = c0.match(/^[a-dA-D][\)\.\:\-]?$/i);
            const isAnsRow = c0Lower.includes('đúng') || c0Lower.includes('sai') || c0Lower.includes('true') || c0Lower.includes('false');

            if (letterMatch) {
              curLetter = letterMatch[0].replace(/[\)\.\:\-]/g, '').toUpperCase();
              curText = c1;
              curImg = itemImg;
            } else if (isAnsRow || (curLetter && !isAnsRow && (c1.toLowerCase().includes('đúng') || c1.toLowerCase().includes('sai')))) {
              const isCorrect = c0Lower.includes('đúng') || c0Lower.includes('true') || (!c0Lower.includes('sai') && c1.toLowerCase().startsWith('đúng'));
              const exp = c1;
              const effectiveLetter = curLetter || String.fromCharCode(65 + items.length);

              items.push({
                letter: effectiveLetter,
                text: curText,
                isCorrect: isCorrect,
                explanation: exp,
                img: curImg || stemImg
              });

              curLetter = '';
              curText = '';
              curImg = '';
            } else if (!curLetter && c0Lower) {
              const combinedMatch = c0.match(/^([a-dA-D])[\)\.\:\-]?\s*(đúng|sai)/i);
              if (combinedMatch) {
                const letStr = combinedMatch[1].toUpperCase();
                const isCor = combinedMatch[2].toLowerCase() === 'đúng';
                items.push({
                  letter: letStr,
                  text: c1,
                  isCorrect: isCor,
                  explanation: '',
                  img: itemImg || stemImg
                });
              }
            }
          }

          items.forEach((item, itemIdx) => {
            const cleanStem = normalizeMathFormulas(stem);
            const cleanText = normalizeMathFormulas(item.text);
            const questionStr = `ĐÚNG HAY SAI: ${cleanStem ? cleanStem + ' ' : ''}[Ý ${item.letter}]: ${cleanText}`;
            const cleanExp = normalizeMathFormulas(item.explanation);

            questions.push({
              id: `mario_tf_${Date.now()}_${tIdx}_${bIdx}_${itemIdx}`,
              question: questionStr,
              options: ['Đúng', 'Sai'],
              correctIndex: item.isCorrect ? 0 : 1,
              explanation: cleanExp,
              difficulty: currentDifficulty,
              topic: currentTopic,
              source: 'Word Import (Đ/S 9 dòng)',
              status: 'published',
              createdAt: new Date().toISOString(),
              type: 'truefalse',
              imageUrl: item.img || stemImg || undefined
            });
          });
        } else if (rowCount >= 5) {
          let optA = '';
          let optB = '';
          let optC = '';
          let optD = '';
          let explanation = '';
          let answerLetter = 'A';

          blockRows.slice(1).forEach((row) => {
            const cells = Array.from(row.querySelectorAll('td, th'));
            if (cells.length < 2) return;
            const c0 = (cells[0].textContent || '').trim().toLowerCase();
            const c1 = (cells[1].textContent || '').trim();

            if (c0.startsWith('a') || c0 === 'a)') optA = c1;
            else if (c0.startsWith('b') || c0 === 'b)') optB = c1;
            else if (c0.startsWith('c') || c0 === 'c)') optC = c1;
            else if (c0.startsWith('d') || c0 === 'd)') optD = c1;
            else if (c0.includes('lời giải') || c0.includes('giải thích')) explanation = c1;
            else if (c0.includes('đáp án') || c0.includes('kết quả')) {
              const m = c1.match(/[A-D]/i);
              if (m) answerLetter = m[0].toUpperCase();
            }
          });

          if (optA && optB) {
            const letIdx = ['A', 'B', 'C', 'D'].indexOf(answerLetter);
            questions.push({
              id: `mario_mc_${Date.now()}_${tIdx}_${bIdx}`,
              question: normalizeMathFormulas(stem),
              options: [
                normalizeMathFormulas(optA),
                normalizeMathFormulas(optB),
                normalizeMathFormulas(optC || 'Đáp án C'),
                normalizeMathFormulas(optD || 'Đáp án D')
              ],
              correctIndex: letIdx >= 0 ? letIdx : 0,
              explanation: normalizeMathFormulas(explanation),
              difficulty: currentDifficulty,
              topic: currentTopic,
              source: 'Word Import (TN 7 dòng)',
              status: 'published',
              createdAt: new Date().toISOString(),
              type: 'abcd',
              imageUrl: stemImg || undefined
            });
          }
        }
      });
    });
  }

  if (questions.length === 0) {
    const rawText = await extractTextFromDocx(file);
    return parseDocumentQuestions(rawText, 'Mario Xác Suất');
  }

  return questions;
}

/**
 * BỘ PARSER FILE EXCEL (.XLSX) CHO GAME MARIO PHIÊU LƯU KÝ (3 CHUYÊN ĐỀ x 3 DẠNG CÂU HỎI)
 */
export async function parseMarioFromExcel(file: File): Promise<Question[]> {
  const { XLSX } = await loadDocumentLibraries();
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  const questions: Question[] = [];
  let currentTopic = 'Chuyên đề 1: Biến cố giao & Biến cố độc lập';
  let currentStem = '';
  let currentType = 'MC';

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row || row.length === 0) continue;
    const col0 = String(row[0] || '').trim();
    const col1 = String(row[1] || '').trim();
    const col2 = String(row[2] || '').trim();
    const col3 = String(row[3] || '').trim();
    const col4 = String(row[4] || '').trim();
    const col5 = String(row[5] || '').trim();

    if (col0.toLowerCase().includes('chuyên đề 1') || col0.toLowerCase().includes('biến cố giao')) {
      currentTopic = 'Chuyên đề 1: Biến cố giao & Biến cố độc lập';
    } else if (col0.toLowerCase().includes('chuyên đề 2') || col0.toLowerCase().includes('biến cố hợp')) {
      currentTopic = 'Chuyên đề 2: Biến cố hợp & Biến cố xung khắc';
    } else if (col0.toLowerCase().includes('chuyên đề 3') || col0.toLowerCase().includes('công thức cộng')) {
      currentTopic = 'Chuyên đề 3: Công thức cộng & nhân xác suất tổng hợp';
    }

    const typeStr = (col1 || col0).toUpperCase();
    if (typeStr === 'SHORT' || typeStr.includes('TLN') || typeStr.includes('TRẢ LỜI NGẮN')) {
      currentType = 'SHORT';
      const stemText = col3 || col2;
      const ansNum = col4 || col3;
      const exp = col5 || col4 || '';
      if (stemText && ansNum && !ansNum.toLowerCase().includes('đáp án')) {
        questions.push({
          id: `mario_xl_short_${Date.now()}_${i}`,
          question: normalizeMathFormulas(stemText),
          options: [ansNum.trim()],
          correctIndex: 0,
          explanation: normalizeMathFormulas(exp),
          difficulty: 'Trung bình',
          topic: currentTopic,
          source: 'Excel Import',
          status: 'published',
          createdAt: new Date().toISOString(),
          type: 'short_answer'
        });
      }
      continue;
    }

    if (typeStr === 'TF' || typeStr.includes('Đ/S') || typeStr.includes('ĐÚNG')) {
      currentType = 'TF';
    } else if (typeStr === 'MC' || typeStr.includes('TRẮC NGHIỆM')) {
      currentType = 'MC';
    }

    const cellCol1 = col2 || col1;
    const cellCol2 = col3 || col2;

    if (/^câu\s*\d+/i.test(cellCol1) || cellCol1.toLowerCase().startsWith('câu')) {
      currentStem = cellCol2 || cellCol1;

      if (currentType === 'MC' && (col4 || col3) && !['a)', 'b)', 'c)', 'd)'].includes(String(col4 || col3).toLowerCase())) {
        const ansLetter = String(col4 || col3).toUpperCase().charAt(0);
        const exp = col5 || col4 || '';

        const optA = String(rawRows[i + 1]?.[3] || rawRows[i + 1]?.[2] || 'A');
        const optB = String(rawRows[i + 2]?.[3] || rawRows[i + 2]?.[2] || 'B');
        const optC = String(rawRows[i + 3]?.[3] || rawRows[i + 3]?.[2] || 'C');
        const optD = String(rawRows[i + 4]?.[3] || rawRows[i + 4]?.[2] || 'D');

        const letIdx = ['A', 'B', 'C', 'D'].indexOf(ansLetter);
        questions.push({
          id: `mario_xl_mc_${Date.now()}_${i}`,
          question: normalizeMathFormulas(currentStem),
          options: [
            normalizeMathFormulas(optA),
            normalizeMathFormulas(optB),
            normalizeMathFormulas(optC),
            normalizeMathFormulas(optD)
          ],
          correctIndex: letIdx >= 0 ? letIdx : 0,
          explanation: normalizeMathFormulas(exp),
          difficulty: 'Trung bình',
          topic: currentTopic,
          source: 'Excel Import',
          status: 'published',
          createdAt: new Date().toISOString(),
          type: 'abcd'
        });
        i += 4;
      }
      continue;
    }

    const letterMatch = cellCol1.match(/^[a-dA-D][\)\.\:\-]?$/i);
    if (letterMatch && cellCol2) {
      const letChar = letterMatch[0].replace(/[\)\.\:\-]/g, '').toUpperCase();
      const colAns = col4 || col3;
      const isTF = currentType === 'TF' || colAns.toLowerCase().includes('đúng') || colAns.toLowerCase().includes('sai');

      if (isTF) {
        const isCorrect = colAns.toLowerCase().includes('đúng') || colAns.toLowerCase().includes('true');
        const exp = col5 || (colAns.toLowerCase().includes('đúng') || colAns.toLowerCase().includes('sai') ? '' : colAns);
        const qText = `ĐÚNG HAY SAI: ${currentStem ? currentStem + ' ' : ''}[Ý ${letChar}]: ${cellCol2}`;

        questions.push({
          id: `mario_xl_tf_${Date.now()}_${i}`,
          question: normalizeMathFormulas(qText),
          options: ['Đúng', 'Sai'],
          correctIndex: isCorrect ? 0 : 1,
          explanation: normalizeMathFormulas(exp),
          difficulty: 'Trung bình',
          topic: currentTopic,
          source: 'Excel Import',
          status: 'published',
          createdAt: new Date().toISOString(),
          type: 'truefalse'
        });
      }
    }
  }

  if (questions.length === 0) {
    const csv = XLSX.utils.sheet_to_csv(sheet);
    return parseDocumentQuestions(csv, 'Mario Xác Suất');
  }

  return questions;
}

/**
 * BỘ PARSER FILE WORD (.DOCX) CHUẨN 3 BẢNG (ABCD 7 DÒNG, ĐÚNG/SAI 9 DÒNG, TLN 3 DÒNG) CHO GAME HÁI TÁO LUÂN PHIÊN
 */
export async function parseHaiTaoFromDocx(file: File): Promise<Question[]> {
  const { mammoth } = await loadDocumentLibraries();
  const arrayBuffer = await file.arrayBuffer();
  const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
  const html = htmlResult.value || '';

  const questions: Question[] = [];

  if (html.includes('<table')) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const tables = Array.from(doc.querySelectorAll('table'));

    let currentTopic = 'Chủ đề 1: Phương trình & Bất phương trình Mũ';
    let currentDifficulty: Difficulty = 'Dễ';

    tables.forEach((table, tIdx) => {
      let prevEl = table.previousElementSibling;
      while (prevEl) {
        const text = (prevEl.textContent || '').trim().toLowerCase();
        if (text.includes('chủ đề 1') || text.includes('chuyên đề 1') || text.includes('phương trình mũ') || (text.includes('mũ') && !text.includes('logarit'))) {
          currentTopic = 'Chủ đề 1: Phương trình & Bất phương trình Mũ';
        } else if (text.includes('chủ đề 2') || text.includes('chuyên đề 2') || text.includes('logarit')) {
          currentTopic = 'Chủ đề 2: Phương trình & Bất phương trình Logarit';
        } else if (text.includes('chủ đề 3') || text.includes('chuyên đề 3') || text.includes('lãi kép') || text.includes('thực tế')) {
          currentTopic = 'Chủ đề 3: Bài toán Lãi kép & Ứng dụng Thực tế';
        } else if (text.includes('chủ đề') || text.includes('chuyên đề')) {
          currentTopic = (prevEl.textContent || '').trim();
        }

        if (text.includes('mức độ 1') || text.includes('level 1') || text.includes('dễ') || text.includes('easy')) {
          currentDifficulty = 'Dễ';
        } else if (text.includes('mức độ 3') || text.includes('level 3') || text.includes('khó') || text.includes('hard')) {
          currentDifficulty = 'Khó';
        } else if (text.includes('mức độ 2') || text.includes('level 2') || text.includes('vừa') || text.includes('trung bình') || text.includes('medium')) {
          currentDifficulty = 'Trung bình';
        }

        if (text.includes('chuyên đề') || text.includes('chủ đề') || text.includes('mức độ')) break;
        prevEl = prevEl.previousElementSibling;
      }

      const rows = Array.from(table.querySelectorAll('tr'));
      if (rows.length < 2) return;

      const blocks: Element[][] = [];
      let curBlock: Element[] = [];

      rows.forEach((row) => {
        const cells = Array.from(row.querySelectorAll('td, th'));
        const col1 = cells.length > 0 ? (cells[0].textContent || '').trim().toLowerCase() : '';
        const isStart = /^câu\s*\d+/i.test(col1) || col1.startsWith('câu');

        if (isStart && curBlock.length >= 2) {
          blocks.push(curBlock);
          curBlock = [row];
        } else {
          curBlock.push(row);
        }
      });
      if (curBlock.length >= 2) {
        blocks.push(curBlock);
      }

      const effectiveBlocks = blocks.length > 0 ? blocks : [rows];

      effectiveBlocks.forEach((blockRows, bIdx) => {
        const rowCount = blockRows.length;
        const firstRowCells = Array.from(blockRows[0].querySelectorAll('td, th'));
        if (firstRowCells.length < 2) return;

        let stem = (firstRowCells[1].textContent || '').trim();
        let stemImg = '';
        const imgEl = firstRowCells[1].querySelector('img');
        if (imgEl && imgEl.getAttribute('src')) {
          stemImg = imgEl.getAttribute('src') || '';
        }

        const isShortAnswer = rowCount <= 4 && blockRows.some(r => {
          const c0 = (r.querySelector('td, th')?.textContent || '').toLowerCase();
          return c0.includes('đáp án số') || c0.includes('giá trị số') || c0.includes('số kết quả') || c0.includes('tln');
        });

        const is9RowTF = !isShortAnswer && rowCount >= 5 && blockRows.some((r, idx) => {
          if (idx === 0) return false;
          const c = Array.from(r.querySelectorAll('td, th'));
          const text0 = (c[0]?.textContent || '').trim().toLowerCase();
          return text0.includes('đúng') || text0.includes('sai') || text0.startsWith('a)') || text0.startsWith('b)');
        });

        if (isShortAnswer) {
          let ansNum = '';
          let explanation = '';
          blockRows.slice(1).forEach(r => {
            const cells = Array.from(r.querySelectorAll('td, th'));
            if (cells.length < 2) return;
            const c0 = (cells[0].textContent || '').toLowerCase();
            const c1 = (cells[1].textContent || '').trim();
            if (c0.includes('đáp án') || c0.includes('giá trị') || c0.includes('kết quả')) {
              ansNum = c1;
            } else if (c0.includes('lời giải') || c0.includes('chi tiết')) {
              explanation = c1;
            }
          });

          if (ansNum) {
            questions.push({
              id: `haitao_short_${Date.now()}_${tIdx}_${bIdx}`,
              question: normalizeMathFormulas(stem),
              options: [ansNum.trim()],
              correctIndex: 0,
              explanation: normalizeMathFormulas(explanation),
              difficulty: currentDifficulty,
              topic: currentTopic,
              source: 'Word Import (TLN 3 dòng)',
              status: 'published',
              createdAt: new Date().toISOString(),
              type: 'short_answer',
              imageUrl: stemImg || undefined
            });
          }
        } else if (is9RowTF) {
          const items: { letter: string; text: string; isCorrect: boolean; explanation: string; img?: string }[] = [];
          let curLetter = '';
          let curText = '';
          let curImg = '';

          for (let r = 1; r < blockRows.length; r++) {
            const cells = Array.from(blockRows[r].querySelectorAll('td, th'));
            if (cells.length < 2) continue;
            const c0 = (cells[0].textContent || '').trim();
            const c1 = (cells[1].textContent || '').trim();
            const c0Lower = c0.toLowerCase();
            const itemImgEl = cells[1].querySelector('img');
            const itemImg = itemImgEl ? (itemImgEl.getAttribute('src') || '') : '';

            const letterMatch = c0.match(/^[a-dA-D][\)\.\:\-]?$/i);
            const isAnsRow = c0Lower.includes('đúng') || c0Lower.includes('sai') || c0Lower.includes('true') || c0Lower.includes('false');

            if (letterMatch) {
              curLetter = letterMatch[0].replace(/[\)\.\:\-]/g, '').toUpperCase();
              curText = c1;
              curImg = itemImg;
            } else if (isAnsRow || (curLetter && !isAnsRow && (c1.toLowerCase().includes('đúng') || c1.toLowerCase().includes('sai')))) {
              const isCorrect = c0Lower.includes('đúng') || c0Lower.includes('true') || (!c0Lower.includes('sai') && c1.toLowerCase().startsWith('đúng'));
              const exp = c1;
              const effectiveLetter = curLetter || String.fromCharCode(65 + items.length);

              items.push({
                letter: effectiveLetter,
                text: curText,
                isCorrect: isCorrect,
                explanation: exp,
                img: curImg || stemImg
              });

              curLetter = '';
              curText = '';
              curImg = '';
            } else if (!curLetter && c0Lower) {
              const combinedMatch = c0.match(/^([a-dA-D])[\)\.\:\-]?\s*(đúng|sai)/i);
              if (combinedMatch) {
                const letStr = combinedMatch[1].toUpperCase();
                const isCor = combinedMatch[2].toLowerCase() === 'đúng';
                items.push({
                  letter: letStr,
                  text: c1,
                  isCorrect: isCor,
                  explanation: '',
                  img: itemImg || stemImg
                });
              }
            }
          }

          items.forEach((item, itemIdx) => {
            const cleanStem = normalizeMathFormulas(stem);
            const cleanText = normalizeMathFormulas(item.text);
            const questionStr = `ĐÚNG HAY SAI: ${cleanStem ? cleanStem + ' ' : ''}[Ý ${item.letter}]: ${cleanText}`;
            const cleanExp = normalizeMathFormulas(item.explanation);

            questions.push({
              id: `haitao_tf_${Date.now()}_${tIdx}_${bIdx}_${itemIdx}`,
              question: questionStr,
              options: ['Đúng', 'Sai'],
              correctIndex: item.isCorrect ? 0 : 1,
              explanation: cleanExp,
              difficulty: currentDifficulty,
              topic: currentTopic,
              source: 'Word Import (Đ/S 9 dòng)',
              status: 'published',
              createdAt: new Date().toISOString(),
              type: 'truefalse',
              imageUrl: item.img || stemImg || undefined
            });
          });
        } else if (rowCount >= 5) {
          let optA = '';
          let optB = '';
          let optC = '';
          let optD = '';
          let explanation = '';
          let answerLetter = 'A';

          blockRows.slice(1).forEach((row) => {
            const cells = Array.from(row.querySelectorAll('td, th'));
            if (cells.length < 2) return;
            const c0 = (cells[0].textContent || '').trim().toLowerCase();
            const c1 = (cells[1].textContent || '').trim();

            if (c0.startsWith('a') || c0 === 'a)') optA = c1;
            else if (c0.startsWith('b') || c0 === 'b)') optB = c1;
            else if (c0.startsWith('c') || c0 === 'c)') optC = c1;
            else if (c0.startsWith('d') || c0 === 'd)') optD = c1;
            else if (c0.includes('lời giải') || c0.includes('giải thích')) explanation = c1;
            else if (c0.includes('đáp án') || c0.includes('kết quả')) {
              const m = c1.match(/[A-D]/i);
              if (m) answerLetter = m[0].toUpperCase();
            }
          });

          const optList = [optA, optB, optC, optD].filter(Boolean);
          if (optList.length >= 2) {
            const letIdx = ['A', 'B', 'C', 'D'].indexOf(answerLetter);
            questions.push({
              id: `haitao_mc_${Date.now()}_${tIdx}_${bIdx}`,
              question: normalizeMathFormulas(stem),
              options: [
                normalizeMathFormulas(optA || 'A'),
                normalizeMathFormulas(optB || 'B'),
                normalizeMathFormulas(optC || 'C'),
                normalizeMathFormulas(optD || 'D')
              ],
              correctIndex: letIdx >= 0 ? letIdx : 0,
              explanation: normalizeMathFormulas(explanation),
              difficulty: currentDifficulty,
              topic: currentTopic,
              source: 'Word Import (MCQ 7 dòng)',
              status: 'published',
              createdAt: new Date().toISOString(),
              type: 'abcd',
              imageUrl: stemImg || undefined
            });
          }
        }
      });
    });
  }

  if (questions.length === 0) {
    const rawText = html.replace(/<[^>]+>/g, '\n');
    return parseDocumentQuestions(rawText, 'Hái Táo Luân Phiên');
  }

  return questions;
}

/**
 * BỘ PARSER FILE EXCEL (.XLSX) CHUẨN 3 DẠNG CÂU HỎI CHO GAME HÁI TÁO LUÂN PHIÊN
 */
export async function parseHaiTaoFromExcel(file: File): Promise<Question[]> {
  const { XLSX } = await loadDocumentLibraries();
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  const questions: Question[] = [];
  let currentTopic = 'Chủ đề 1: Phương trình & Bất phương trình Mũ';
  let currentStem = '';
  let currentType = 'MC';

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row || row.length === 0) continue;
    const col0 = String(row[0] || '').trim();
    const col1 = String(row[1] || '').trim();
    const col2 = String(row[2] || '').trim();
    const col3 = String(row[3] || '').trim();
    const col4 = String(row[4] || '').trim();
    const col5 = String(row[5] || '').trim();

    if (col0.toLowerCase().includes('chủ đề 1') || col0.toLowerCase().includes('chuyên đề 1') || (col0.toLowerCase().includes('mũ') && !col0.toLowerCase().includes('logarit'))) {
      currentTopic = 'Chủ đề 1: Phương trình & Bất phương trình Mũ';
    } else if (col0.toLowerCase().includes('chủ đề 2') || col0.toLowerCase().includes('chuyên đề 2') || col0.toLowerCase().includes('logarit')) {
      currentTopic = 'Chủ đề 2: Phương trình & Bất phương trình Logarit';
    } else if (col0.toLowerCase().includes('chủ đề 3') || col0.toLowerCase().includes('chuyên đề 3') || col0.toLowerCase().includes('lãi kép') || col0.toLowerCase().includes('thực tế')) {
      currentTopic = 'Chủ đề 3: Bài toán Lãi kép & Ứng dụng Thực tế';
    } else if (col0 && (col0.toLowerCase().includes('chủ đề') || col0.toLowerCase().includes('chuyên đề'))) {
      currentTopic = col0;
    }

    const typeStr = (col1 || col0).toUpperCase();
    if (typeStr === 'SHORT' || typeStr.includes('TLN') || typeStr.includes('TRẢ LỜI NGẮN')) {
      currentType = 'SHORT';
      const stemText = col3 || col2;
      const ansNum = col4 || col3;
      const exp = col5 || col4 || '';
      if (stemText && ansNum && !ansNum.toLowerCase().includes('đáp án')) {
        questions.push({
          id: `haitao_xl_short_${Date.now()}_${i}`,
          question: normalizeMathFormulas(stemText),
          options: [ansNum.trim()],
          correctIndex: 0,
          explanation: normalizeMathFormulas(exp),
          difficulty: 'Khó',
          topic: currentTopic,
          source: 'Excel Import (TLN 3 dòng)',
          status: 'published',
          createdAt: new Date().toISOString(),
          type: 'short_answer'
        });
      }
      continue;
    } else if (typeStr === 'TF' || typeStr.includes('ĐÚNG') || typeStr.includes('Đ/S')) {
      currentType = 'TF';
    } else if (typeStr === 'MC' || typeStr.includes('TRẮC NGHIỆM') || typeStr.includes('TN')) {
      currentType = 'MC';
    }

    const cellCol1 = col2 || col1;
    const cellCol2 = col3 || col2;

    if (/^câu\s*\d+/i.test(cellCol1) || cellCol1.toLowerCase().startsWith('câu')) {
      currentStem = cellCol2 || cellCol1;

      if (currentType === 'MC' && (col4 || col3) && !['a)', 'b)', 'c)', 'd)'].includes(String(col4 || col3).toLowerCase())) {
        const ansLetter = String(col4 || col3).toUpperCase().charAt(0);
        const exp = col5 || col4 || '';

        const optA = String(rawRows[i + 1]?.[3] || rawRows[i + 1]?.[2] || 'A');
        const optB = String(rawRows[i + 2]?.[3] || rawRows[i + 2]?.[2] || 'B');
        const optC = String(rawRows[i + 3]?.[3] || rawRows[i + 3]?.[2] || 'C');
        const optD = String(rawRows[i + 4]?.[3] || rawRows[i + 4]?.[2] || 'D');

        const letIdx = ['A', 'B', 'C', 'D'].indexOf(ansLetter);
        questions.push({
          id: `haitao_xl_mc_${Date.now()}_${i}`,
          question: normalizeMathFormulas(currentStem),
          options: [
            normalizeMathFormulas(optA),
            normalizeMathFormulas(optB),
            normalizeMathFormulas(optC),
            normalizeMathFormulas(optD)
          ],
          correctIndex: letIdx >= 0 ? letIdx : 0,
          explanation: normalizeMathFormulas(exp),
          difficulty: 'Dễ',
          topic: currentTopic,
          source: 'Excel Import (MCQ)',
          status: 'published',
          createdAt: new Date().toISOString(),
          type: 'abcd'
        });
        i += 4;
      }
      continue;
    }

    const letterMatch = cellCol1.match(/^[a-dA-D][\)\.\:\-]?$/i);
    if (letterMatch && cellCol2) {
      const letChar = letterMatch[0].replace(/[\)\.\:\-]/g, '').toUpperCase();
      const colAns = col4 || col3;
      const isTF = currentType === 'TF' || colAns.toLowerCase().includes('đúng') || colAns.toLowerCase().includes('sai');

      if (isTF) {
        const isCorrect = colAns.toLowerCase().includes('đúng') || colAns.toLowerCase().includes('true');
        const exp = col5 || (colAns.toLowerCase().includes('đúng') || colAns.toLowerCase().includes('sai') ? '' : colAns);
        const qText = `ĐÚNG HAY SAI: ${currentStem ? currentStem + ' ' : ''}[Ý ${letChar}]: ${cellCol2}`;

        questions.push({
          id: `haitao_xl_tf_${Date.now()}_${i}`,
          question: normalizeMathFormulas(qText),
          options: ['Đúng', 'Sai'],
          correctIndex: isCorrect ? 0 : 1,
          explanation: normalizeMathFormulas(exp),
          difficulty: 'Trung bình',
          topic: currentTopic,
          source: 'Excel Import (Đ/S 9 dòng)',
          status: 'published',
          createdAt: new Date().toISOString(),
          type: 'truefalse'
        });
      }
    }
  }

  if (questions.length === 0) {
    const csv = XLSX.utils.sheet_to_csv(sheet);
    return parseDocumentQuestions(csv, 'Hái Táo Luân Phiên');
  }

  return questions;
}

/**
 * BỘ PARSER FILE WORD (.DOCX) CHUẨN BẢNG 7 DÒNG x 2 CỘT CHO GAME BẢO VỆ CHIẾN HÀO
 */
export async function parseChienHaoFromDocx(file: File): Promise<Question[]> {
  const { mammoth } = await loadDocumentLibraries();
  const arrayBuffer = await file.arrayBuffer();
  const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
  const html = htmlResult.value || '';

  const questions: Question[] = [];

  if (html.includes('<table')) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const tables = Array.from(doc.querySelectorAll('table'));

    let currentDifficulty: Difficulty = 'Dễ';

    tables.forEach((table, tIdx) => {
      // Kiểm tra tiêu đề phía trước bảng để gán độ khó
      let prevEl = table.previousElementSibling;
      while (prevEl) {
        const pText = (prevEl.textContent || '').toLowerCase();
        if (pText.includes('mức độ 1') || pText.includes('phần 1') || pText.includes('level 1') || pText.includes('dễ')) {
          currentDifficulty = 'Dễ'; break;
        } else if (pText.includes('mức độ 2') || pText.includes('phần 2') || pText.includes('level 2') || pText.includes('vừa') || pText.includes('trung bình')) {
          currentDifficulty = 'Trung bình'; break;
        } else if (pText.includes('mức độ 3') || pText.includes('phần 3') || pText.includes('level 3') || pText.includes('khó')) {
          currentDifficulty = 'Khó'; break;
        }
        prevEl = prevEl.previousElementSibling;
      }

      const rows = Array.from(table.querySelectorAll('tr'));
      if (rows.length < 5) return;

      // Hỗ trợ cả 2 dạng: Mỗi câu 1 bảng riêng HOẶC nhiều câu gộp trong 1 bảng (chia theo "Câu [Số]" hoặc cụm 7 dòng)
      const questionBlocks: Element[][] = [];
      let currentBlock: Element[] = [];

      rows.forEach((row) => {
        const cells = Array.from(row.querySelectorAll('td, th'));
        const col1Text = cells.length > 0 ? (cells[0].textContent || '').trim().toLowerCase() : '';
        const isQuestionStart = col1Text.startsWith('câu') || /^câu\s*\d+/i.test(col1Text);

        if (isQuestionStart && currentBlock.length >= 5) {
          questionBlocks.push(currentBlock);
          currentBlock = [row];
        } else {
          currentBlock.push(row);
        }
      });
      if (currentBlock.length >= 5) {
        questionBlocks.push(currentBlock);
      } else if (questionBlocks.length === 0 && rows.length >= 5) {
        // Fallback: chunk theo 7 dòng nếu bảng không có từ khóa "Câu"
        for (let i = 0; i < rows.length; i += 7) {
          const chunk = rows.slice(i, i + 7);
          if (chunk.length >= 5) questionBlocks.push(chunk);
        }
      }

      questionBlocks.forEach((blockRows) => {
        let qText = '';
        let optA = '';
        let optB = '';
        let optC = '';
        let optD = '';
        let explanation = '';
        let answerLetter = 'A';
        let detectedImgUrl: string | undefined = undefined;

        blockRows.forEach((row, rIdx) => {
          const cells = Array.from(row.querySelectorAll('td, th'));
          if (cells.length < 2) return;
          const col1Text = (cells[0].textContent || '').trim().toLowerCase();
          const col2Text = (cells[1].textContent || '').trim();

          // Bóc tách ảnh từ thẻ img trong HTML
          const imgEl = cells[1].querySelector('img');
          if (imgEl && imgEl.getAttribute('src')) {
            detectedImgUrl = imgEl.getAttribute('src') || undefined;
          }

          if (rIdx === 0 || col1Text.startsWith('câu')) {
            qText = col2Text;
          } else if (col1Text.startsWith('a') || (rIdx === 1 && !optA)) {
            optA = col2Text;
          } else if (col1Text.startsWith('b') || (rIdx === 2 && !optB)) {
            optB = col2Text;
          } else if (col1Text.startsWith('c') || (rIdx === 3 && !optC)) {
            optC = col2Text;
          } else if (col1Text.startsWith('d') || (rIdx === 4 && !optD)) {
            optD = col2Text;
          } else if (col1Text.includes('lời giải') || col1Text.includes('giải thích') || rIdx === 5) {
            explanation = col2Text;
          } else if (col1Text.includes('đáp án') || col1Text.includes('chọn') || rIdx === 6) {
            // Dòng 7: Cột 2 ghi duy nhất chữ cái đáp án đúng (A, B, C, hoặc D)
            const extracted = col2Text.replace(/[^A-Da-d]/g, '').toUpperCase().charAt(0);
            if (extracted) answerLetter = extracted;
          }
        });

        if (!qText) return;

        // Trích xuất link ảnh từ văn bản nếu chưa có thẻ img
        const { cleanText, imageUrl } = extractImageUrl(qText);
        qText = cleanText;
        if (!detectedImgUrl && imageUrl) detectedImgUrl = imageUrl;

        // Tính correctIndex
        let correctIndex = 0;
        if (answerLetter === 'B') correctIndex = 1;
        else if (answerLetter === 'C') correctIndex = 2;
        else if (answerLetter === 'D') correctIndex = 3;

        // Nếu không có heading thì phân bố theo số thứ tự câu hỏi
        const diff: Difficulty = currentDifficulty || (questions.length < 5 ? 'Dễ' : (questions.length < 10 ? 'Trung bình' : 'Khó'));

        questions.push({
          id: `chienhao_${Date.now()}_${questions.length + 1}`,
          question: normalizeMathFormulas(qText),
          options: [
            normalizeMathFormulas(optA || 'Lựa chọn A'),
            normalizeMathFormulas(optB || 'Lựa chọn B'),
            normalizeMathFormulas(optC || 'Lựa chọn C'),
            normalizeMathFormulas(optD || 'Lựa chọn D')
          ],
          correctIndex,
          explanation: normalizeMathFormulas(explanation),
          difficulty: diff,
          topic: 'Bảo Vệ Chiến Hào',
          source: 'Bảo Vệ Chiến Hào',
          status: 'published',
          createdAt: new Date().toISOString(),
          imageUrl: detectedImgUrl
        });
      });
    });
  }

  // Fallback nếu không có bảng
  if (questions.length === 0) {
    const rawResult = await mammoth.extractRawText({ arrayBuffer });
    return parseDocumentQuestions(rawResult.value || '', 'Bảo Vệ Chiến Hào');
  }

  return questions;
}

/**
 * BỘ PARSER FILE EXCEL (.XLSX) CHO GAME BẢO VỆ CHIẾN HÀO
 */
export async function parseChienHaoFromExcel(file: File): Promise<Question[]> {
  const { XLSX } = await loadDocumentLibraries();
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  const questions: Question[] = [];

  rows.forEach((row, idx) => {
    if (!row || row.length === 0) return;
    const col0 = String(row[0] || '').trim();
    const col1 = String(row[1] || '').trim();

    // Bỏ qua dòng tiêu đề
    if (idx === 0 && (col0.toLowerCase().includes('mức độ') || col1.toLowerCase().includes('nội dung'))) return;

    let diff: Difficulty = 'Dễ';
    let qText = '';
    let imgUrl: string | undefined = undefined;
    let optA = '';
    let optB = '';
    let optC = '';
    let optD = '';
    let ansLetter = 'A';
    let explanation = '';

    if (row.length >= 8) {
      const lvlStr = col0.toLowerCase();
      if (lvlStr.includes('3') || lvlStr.includes('khó') || lvlStr.includes('hard')) diff = 'Khó';
      else if (lvlStr.includes('2') || lvlStr.includes('vừa') || lvlStr.includes('trung')) diff = 'Trung bình';
      else diff = 'Dễ';

      qText = col1;
      imgUrl = String(row[2] || '').trim() || undefined;
      optA = String(row[3] || '').trim();
      optB = String(row[4] || '').trim();
      optC = String(row[5] || '').trim();
      optD = String(row[6] || '').trim();
      ansLetter = String(row[7] || '').trim().toUpperCase().charAt(0) || 'A';
      explanation = String(row[8] || '').trim();
    } else if (row.length >= 6) {
      qText = col0;
      optA = col1;
      optB = String(row[2] || '').trim();
      optC = String(row[3] || '').trim();
      optD = String(row[4] || '').trim();
      ansLetter = String(row[5] || '').trim().toUpperCase().charAt(0) || 'A';
      explanation = String(row[6] || '').trim();
    }

    if (!qText) return;

    const { cleanText, imageUrl: parsedImg } = extractImageUrl(qText);
    qText = cleanText;
    if (!imgUrl && parsedImg) imgUrl = parsedImg;

    let correctIndex = 0;
    if (ansLetter === 'B') correctIndex = 1;
    else if (ansLetter === 'C') correctIndex = 2;
    else if (ansLetter === 'D') correctIndex = 3;

    questions.push({
      id: `chienhao_xl_${Date.now()}_${idx + 1}`,
      question: normalizeMathFormulas(qText),
      options: [
        normalizeMathFormulas(optA || 'Lựa chọn A'),
        normalizeMathFormulas(optB || 'Lựa chọn B'),
        normalizeMathFormulas(optC || 'Lựa chọn C'),
        normalizeMathFormulas(optD || 'Lựa chọn D')
      ],
      correctIndex,
      explanation: normalizeMathFormulas(explanation),
      difficulty: diff,
      topic: 'Bảo Vệ Chiến Hào',
      source: 'Bảo Vệ Chiến Hào',
      status: 'published',
      createdAt: new Date().toISOString(),
      imageUrl: imgUrl
    });
  });

  return questions;
}

/**
 * BỘ PARSER FILE WORD (.DOCX) CHUẨN BẢNG 7 DÒNG x 2 CỘT CHO GAME SÚT PENALTY
 * Hỗ trợ 3 phần phân cấp: Vòng Bảng (Dễ), Bán Kết (Trung bình), Chung Kết (Khó)
 */
export async function parseSutPenFromDocx(file: File): Promise<Question[]> {
  const { mammoth } = await loadDocumentLibraries();
  const arrayBuffer = await file.arrayBuffer();
  const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
  const html = htmlResult.value || '';

  const questions: Question[] = [];

  if (html.includes('<table')) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const tables = Array.from(doc.querySelectorAll('table'));

    let currentDifficulty: Difficulty = 'Dễ';

    tables.forEach((table) => {
      // Kiểm tra tiêu đề phía trước bảng để gán độ khó / giai đoạn
      let prevEl = table.previousElementSibling;
      while (prevEl) {
        const pText = (prevEl.textContent || '').toLowerCase();
        if (pText.includes('vòng bảng') || pText.includes('mức độ 1') || pText.includes('phần 1') || pText.includes('level 1') || pText.includes('dễ')) {
          currentDifficulty = 'Dễ'; break;
        } else if (pText.includes('bán kết') || pText.includes('mức độ 2') || pText.includes('phần 2') || pText.includes('level 2') || pText.includes('vừa') || pText.includes('trung bình')) {
          currentDifficulty = 'Trung bình'; break;
        } else if (pText.includes('chung kết') || pText.includes('mức độ 3') || pText.includes('phần 3') || pText.includes('level 3') || pText.includes('khó')) {
          currentDifficulty = 'Khó'; break;
        }
        prevEl = prevEl.previousElementSibling;
      }

      const rows = Array.from(table.querySelectorAll('tr'));
      if (rows.length < 5) return;

      const questionBlocks: Element[][] = [];
      let currentBlock: Element[] = [];

      rows.forEach((row) => {
        const cells = Array.from(row.querySelectorAll('td, th'));
        const col1Text = cells.length > 0 ? (cells[0].textContent || '').trim().toLowerCase() : '';
        const isQuestionStart = col1Text.startsWith('câu') || /^câu\s*\d+/i.test(col1Text);

        if (isQuestionStart && currentBlock.length >= 5) {
          questionBlocks.push(currentBlock);
          currentBlock = [row];
        } else {
          currentBlock.push(row);
        }
      });
      if (currentBlock.length >= 5) {
        questionBlocks.push(currentBlock);
      } else if (questionBlocks.length === 0 && rows.length >= 5) {
        for (let i = 0; i < rows.length; i += 7) {
          const chunk = rows.slice(i, i + 7);
          if (chunk.length >= 5) questionBlocks.push(chunk);
        }
      }

      questionBlocks.forEach((blockRows) => {
        let qText = '';
        let optA = '';
        let optB = '';
        let optC = '';
        let optD = '';
        let explanation = '';
        let answerLetter = 'A';
        let detectedImgUrl: string | undefined = undefined;

        blockRows.forEach((row, rIdx) => {
          const cells = Array.from(row.querySelectorAll('td, th'));
          if (cells.length < 2) return;
          const col1Text = (cells[0].textContent || '').trim().toLowerCase();
          const col2Text = (cells[1].textContent || '').trim();

          const imgEl = cells[1].querySelector('img');
          if (imgEl && imgEl.getAttribute('src')) {
            detectedImgUrl = imgEl.getAttribute('src') || undefined;
          }

          if (rIdx === 0 || col1Text.startsWith('câu')) {
            qText = col2Text;
          } else if (col1Text.startsWith('a') || (rIdx === 1 && !optA)) {
            optA = col2Text;
          } else if (col1Text.startsWith('b') || (rIdx === 2 && !optB)) {
            optB = col2Text;
          } else if (col1Text.startsWith('c') || (rIdx === 3 && !optC)) {
            optC = col2Text;
          } else if (col1Text.startsWith('d') || (rIdx === 4 && !optD)) {
            optD = col2Text;
          } else if (col1Text.includes('lời giải') || col1Text.includes('giải thích') || rIdx === 5) {
            explanation = col2Text;
          } else if (col1Text.includes('đáp án') || col1Text.includes('chọn') || rIdx === 6) {
            const match = col2Text.match(/(?:chọn|đáp án|câu)?\s*([A-D])\b/i) || col2Text.match(/\b([A-D])\b/i);
            if (match) {
              answerLetter = match[1].toUpperCase();
            } else {
              const cleaned = col2Text.replace(/^(?:đáp án|chọn|câu)\s*/i, '');
              const charMatch = cleaned.match(/[A-D]/i);
              if (charMatch) answerLetter = charMatch[0].toUpperCase();
            }
          }
        });

        if (!qText) return;

        const { cleanText, imageUrl } = extractImageUrl(qText);
        qText = cleanText;
        if (!detectedImgUrl && imageUrl) detectedImgUrl = imageUrl;

        let correctIndex = 0;
        if (answerLetter === 'B') correctIndex = 1;
        else if (answerLetter === 'C') correctIndex = 2;
        else if (answerLetter === 'D') correctIndex = 3;

        const diff: Difficulty = currentDifficulty || (questions.length < 5 ? 'Dễ' : (questions.length < 10 ? 'Trung bình' : 'Khó'));

        questions.push({
          id: `sutpen_${Date.now()}_${questions.length + 1}`,
          question: normalizeMathFormulas(qText),
          options: [
            normalizeMathFormulas(optA || 'Lựa chọn A'),
            normalizeMathFormulas(optB || 'Lựa chọn B'),
            normalizeMathFormulas(optC || 'Lựa chọn C'),
            normalizeMathFormulas(optD || 'Lựa chọn D')
          ],
          correctIndex,
          explanation: normalizeMathFormulas(explanation),
          difficulty: diff,
          topic: 'Sút Penalty',
          source: 'Sút Penalty',
          status: 'published',
          createdAt: new Date().toISOString(),
          imageUrl: detectedImgUrl
        });
      });
    });
  }

  if (questions.length === 0) {
    const rawResult = await mammoth.extractRawText({ arrayBuffer });
    return parseDocumentQuestions(rawResult.value || '', 'Sút Penalty');
  }

  return questions;
}

/**
 * BỘ PARSER FILE EXCEL (.XLSX) CHO GAME SÚT PENALTY
 */
export async function parseSutPenFromExcel(file: File): Promise<Question[]> {
  const { XLSX } = await loadDocumentLibraries();
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  const questions: Question[] = [];

  rows.forEach((row, idx) => {
    if (!row || row.length === 0) return;
    const col0 = String(row[0] || '').trim();
    const col1 = String(row[1] || '').trim();

    if (idx === 0 && (col0.toLowerCase().includes('mức độ') || col0.toLowerCase().includes('giai đoạn') || col1.toLowerCase().includes('nội dung'))) return;

    let diff: Difficulty = 'Dễ';
    let qText = '';
    let imgUrl: string | undefined = undefined;
    let optA = '';
    let optB = '';
    let optC = '';
    let optD = '';
    let ansLetter = 'A';
    let explanation = '';

    if (row.length >= 8) {
      const lvlStr = col0.toLowerCase();
      if (lvlStr.includes('3') || lvlStr.includes('khó') || lvlStr.includes('chung kết')) diff = 'Khó';
      else if (lvlStr.includes('2') || lvlStr.includes('vừa') || lvlStr.includes('trung') || lvlStr.includes('bán kết')) diff = 'Trung bình';
      else diff = 'Dễ';

      qText = col1;
      imgUrl = String(row[2] || '').trim() || undefined;
      optA = String(row[3] || '').trim();
      optB = String(row[4] || '').trim();
      optC = String(row[5] || '').trim();
      const rawAns1 = String(row[7] || '').trim();
      const match1 = rawAns1.match(/(?:chọn|đáp án|câu)?\s*([A-D])\b/i) || rawAns1.match(/([A-D])/i);
      ansLetter = match1 ? match1[1].toUpperCase() : 'A';
      explanation = String(row[8] || '').trim();
    } else if (row.length >= 6) {
      qText = col0;
      optA = col1;
      optB = String(row[2] || '').trim();
      optC = String(row[3] || '').trim();
      optD = String(row[4] || '').trim();
      const rawAns2 = String(row[5] || '').trim();
      const match2 = rawAns2.match(/(?:chọn|đáp án|câu)?\s*([A-D])\b/i) || rawAns2.match(/([A-D])/i);
      ansLetter = match2 ? match2[1].toUpperCase() : 'A';
      explanation = String(row[6] || '').trim();
    }

    if (!qText) return;

    const { cleanText, imageUrl: parsedImg } = extractImageUrl(qText);
    qText = cleanText;
    if (!imgUrl && parsedImg) imgUrl = parsedImg;

    let correctIndex = 0;
    if (ansLetter === 'B') correctIndex = 1;
    else if (ansLetter === 'C') correctIndex = 2;
    else if (ansLetter === 'D') correctIndex = 3;

    questions.push({
      id: `sutpen_xl_${Date.now()}_${idx + 1}`,
      question: normalizeMathFormulas(qText),
      options: [
        normalizeMathFormulas(optA || 'Lựa chọn A'),
        normalizeMathFormulas(optB || 'Lựa chọn B'),
        normalizeMathFormulas(optC || 'Lựa chọn C'),
        normalizeMathFormulas(optD || 'Lựa chọn D')
      ],
      correctIndex,
      explanation: normalizeMathFormulas(explanation),
      difficulty: diff,
      topic: 'Sút Penalty',
      source: 'Sút Penalty',
      status: 'published',
      createdAt: new Date().toISOString(),
      imageUrl: imgUrl
    });
  });

  return questions;
}

/**
 * BỘ PARSER FILE WORD (.DOCX) CHUẨN BẢNG 8 DÒNG x 2 CỘT CHO GAME BẮN CHIM
 * Hỗ trợ nhận diện 5 đáp án A, B, C, D, E, lời giải dòng 7, đáp án đúng dòng 8
 */
export async function parseBanChimFromDocx(file: File): Promise<Question[]> {
  const { mammoth } = await loadDocumentLibraries();
  const arrayBuffer = await file.arrayBuffer();
  const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
  const html = htmlResult.value || '';

  const questions: Question[] = [];

  if (html.includes('<table')) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const tables = Array.from(doc.querySelectorAll('table'));

    let currentDifficulty: Difficulty = 'Dễ';

    tables.forEach((table) => {
      // Kiểm tra tiêu đề phía trước bảng để gán độ khó
      let prevEl = table.previousElementSibling;
      while (prevEl) {
        const pText = (prevEl.textContent || '').toLowerCase();
        if (pText.includes('mức độ 1') || pText.includes('phần 1') || pText.includes('level 1') || pText.includes('dễ')) {
          currentDifficulty = 'Dễ'; break;
        } else if (pText.includes('mức độ 2') || pText.includes('phần 2') || pText.includes('level 2') || pText.includes('vừa') || pText.includes('trung bình')) {
          currentDifficulty = 'Trung bình'; break;
        } else if (pText.includes('mức độ 3') || pText.includes('phần 3') || pText.includes('level 3') || pText.includes('khó')) {
          currentDifficulty = 'Khó'; break;
        }
        prevEl = prevEl.previousElementSibling;
      }

      const rows = Array.from(table.querySelectorAll('tr'));
      if (rows.length < 5) return;

      const questionBlocks: Element[][] = [];
      let currentBlock: Element[] = [];

      rows.forEach((row) => {
        const cells = Array.from(row.querySelectorAll('td, th'));
        const col1Text = cells.length > 0 ? (cells[0].textContent || '').trim().toLowerCase() : '';
        const isQuestionStart = col1Text.startsWith('câu') || /^câu\s*\d+/i.test(col1Text);

        if (isQuestionStart && currentBlock.length >= 5) {
          questionBlocks.push(currentBlock);
          currentBlock = [row];
        } else {
          currentBlock.push(row);
        }
      });
      if (currentBlock.length >= 5) {
        questionBlocks.push(currentBlock);
      } else if (questionBlocks.length === 0 && rows.length >= 5) {
        for (let i = 0; i < rows.length; i += 8) {
          const chunk = rows.slice(i, i + 8);
          if (chunk.length >= 5) questionBlocks.push(chunk);
        }
      }

      questionBlocks.forEach((blockRows) => {
        let qText = '';
        let optA = '';
        let optB = '';
        let optC = '';
        let optD = '';
        let optE = '';
        let explanation = '';
        let answerLetter = 'A';
        let detectedImgUrl: string | undefined = undefined;
        let detectedDiff: Difficulty | null = null;

        blockRows.forEach((row, rIdx) => {
          const cells = Array.from(row.querySelectorAll('td, th'));
          if (cells.length < 2) return;
          const col1Raw = (cells[0].textContent || '').trim();
          const col1Text = col1Raw.toLowerCase();
          const col2Text = (cells[1].textContent || '').trim();

          // Trích xuất độ khó từ Cột 1 của Dòng 1 nếu có ghi [Mức độ ...]
          if (rIdx === 0 || col1Text.startsWith('câu')) {
            if (col1Text.includes('mức 1') || col1Text.includes('dễ') || col1Text.includes('level 1')) detectedDiff = 'Dễ';
            else if (col1Text.includes('mức 2') || col1Text.includes('vừa') || col1Text.includes('trung bình') || col1Text.includes('level 2')) detectedDiff = 'Trung bình';
            else if (col1Text.includes('mức 3') || col1Text.includes('khó') || col1Text.includes('level 3')) detectedDiff = 'Khó';
          }

          // Bóc tách ảnh từ thẻ img trong HTML
          const imgEl = cells[1].querySelector('img');
          if (imgEl && imgEl.getAttribute('src')) {
            detectedImgUrl = imgEl.getAttribute('src') || undefined;
          }

          if (rIdx === 0 || col1Text.startsWith('câu')) {
            qText = col2Text;
          } else if (col1Text === 'a' || col1Text.startsWith('a)') || col1Text.startsWith('a.') || (rIdx === 1 && !optA)) {
            optA = col2Text;
          } else if (col1Text === 'b' || col1Text.startsWith('b)') || col1Text.startsWith('b.') || (rIdx === 2 && !optB)) {
            optB = col2Text;
          } else if (col1Text === 'c' || col1Text.startsWith('c)') || col1Text.startsWith('c.') || (rIdx === 3 && !optC)) {
            optC = col2Text;
          } else if (col1Text === 'd' || col1Text.startsWith('d)') || col1Text.startsWith('d.') || (rIdx === 4 && !optD)) {
            optD = col2Text;
          } else if (col1Text === 'e' || col1Text.startsWith('e)') || col1Text.startsWith('e.') || (rIdx === 5 && !optE && !col1Text.includes('lời giải'))) {
            optE = col2Text;
          } else if (col1Text.includes('lời giải') || col1Text.includes('giải thích') || rIdx === 6) {
            explanation = col2Text;
          } else if (col1Text.includes('đáp án') || col1Text.includes('chọn') || rIdx === 7) {
            // Dòng 8: Cột 2 ghi duy nhất chữ cái đáp án đúng (A, B, C, D hoặc E)
            const extracted = col2Text.replace(/[^A-Ea-e]/g, '').toUpperCase().charAt(0);
            if (extracted) answerLetter = extracted;
          }
        });

        if (!qText) return;

        // Trích xuất link ảnh từ văn bản nếu chưa có thẻ img
        const { cleanText, imageUrl } = extractImageUrl(qText);
        qText = cleanText;
        if (!detectedImgUrl && imageUrl) detectedImgUrl = imageUrl;

        let correctIndex = 0;
        if (answerLetter === 'B') correctIndex = 1;
        else if (answerLetter === 'C') correctIndex = 2;
        else if (answerLetter === 'D') correctIndex = 3;
        else if (answerLetter === 'E') correctIndex = 4;

        const diff: Difficulty = detectedDiff || currentDifficulty || (questions.length < 5 ? 'Dễ' : (questions.length < 10 ? 'Trung bình' : 'Khó'));

        questions.push({
          id: `banchim_${Date.now()}_${questions.length + 1}`,
          question: normalizeMathFormulas(qText),
          options: [
            normalizeMathFormulas(optA || 'Lựa chọn A'),
            normalizeMathFormulas(optB || 'Lựa chọn B'),
            normalizeMathFormulas(optC || 'Lựa chọn C'),
            normalizeMathFormulas(optD || 'Lựa chọn D'),
            normalizeMathFormulas(optE || 'Lựa chọn E')
          ],
          correctIndex,
          explanation: normalizeMathFormulas(explanation),
          difficulty: diff,
          topic: 'Bắn Chim Xác Suất',
          source: 'Bắn Chim',
          status: 'published',
          createdAt: new Date().toISOString(),
          imageUrl: detectedImgUrl
        });
      });
    });
  }

  if (questions.length === 0) {
    const rawResult = await mammoth.extractRawText({ arrayBuffer });
    return parseDocumentQuestions(rawResult.value || '', 'Bắn Chim');
  }

  return questions;
}

/**
 * BỘ PARSER FILE EXCEL (.XLSX) CHO GAME BẮN CHIM (HỖ TRỢ 5 ĐÁP ÁN A, B, C, D, E)
 */
export async function parseBanChimFromExcel(file: File): Promise<Question[]> {
  const { XLSX } = await loadDocumentLibraries();
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  const questions: Question[] = [];

  rows.forEach((row, idx) => {
    if (!row || row.length === 0) return;
    const col0 = String(row[0] || '').trim();
    const col1 = String(row[1] || '').trim();

    if (idx === 0 && (col0.toLowerCase().includes('mức độ') || col1.toLowerCase().includes('nội dung'))) return;

    let diff: Difficulty = 'Dễ';
    let qText = '';
    let imgUrl: string | undefined = undefined;
    let optA = '';
    let optB = '';
    let optC = '';
    let optD = '';
    let optE = '';
    let ansLetter = 'A';
    let explanation = '';

    if (row.length >= 9) {
      const lvlStr = col0.toLowerCase();
      if (lvlStr.includes('3') || lvlStr.includes('khó')) diff = 'Khó';
      else if (lvlStr.includes('2') || lvlStr.includes('vừa') || lvlStr.includes('trung')) diff = 'Trung bình';
      else diff = 'Dễ';

      qText = col1;
      imgUrl = String(row[2] || '').trim() || undefined;
      optA = String(row[3] || '').trim();
      optB = String(row[4] || '').trim();
      optC = String(row[5] || '').trim();
      optD = String(row[6] || '').trim();
      optE = String(row[7] || '').trim();
      ansLetter = String(row[8] || '').trim().toUpperCase().charAt(0) || 'A';
      explanation = String(row[9] || '').trim();
    } else if (row.length >= 7) {
      qText = col0;
      optA = col1;
      optB = String(row[2] || '').trim();
      optC = String(row[3] || '').trim();
      optD = String(row[4] || '').trim();
      optE = String(row[5] || '').trim();
      ansLetter = String(row[6] || '').trim().toUpperCase().charAt(0) || 'A';
      explanation = String(row[7] || '').trim();
    }

    if (!qText) return;

    const { cleanText, imageUrl: parsedImg } = extractImageUrl(qText);
    qText = cleanText;
    if (!imgUrl && parsedImg) imgUrl = parsedImg;

    let correctIndex = 0;
    if (ansLetter === 'B') correctIndex = 1;
    else if (ansLetter === 'C') correctIndex = 2;
    else if (ansLetter === 'D') correctIndex = 3;
    else if (ansLetter === 'E') correctIndex = 4;

    questions.push({
      id: `banchim_xl_${Date.now()}_${idx + 1}`,
      question: normalizeMathFormulas(qText),
      options: [
        normalizeMathFormulas(optA || 'Lựa chọn A'),
        normalizeMathFormulas(optB || 'Lựa chọn B'),
        normalizeMathFormulas(optC || 'Lựa chọn C'),
        normalizeMathFormulas(optD || 'Lựa chọn D'),
        normalizeMathFormulas(optE || 'Lựa chọn E')
      ],
      correctIndex,
      explanation: normalizeMathFormulas(explanation),
      difficulty: diff,
      topic: 'Bắn Chim Xác Suất',
      source: 'Bắn Chim',
      status: 'published',
      createdAt: new Date().toISOString(),
      imageUrl: imgUrl
    });
  });

  return questions;
}

/**
 * BỘ PARSER FILE WORD (.DOCX) CHO GAME AI YOGA VẬN ĐỘNG (SONG SONG 7 DÒNG MC VÀ 9 DÒNG TF 4 Ý)
 * Tự động bóc tách và sinh 4 câu hỏi trắc nghiệm Đúng/Sai độc lập cho mỗi câu hỏi 9 dòng
 */
export async function parseYogaFromDocx(file: File): Promise<Question[]> {
  const { mammoth } = await loadDocumentLibraries();
  const arrayBuffer = await file.arrayBuffer();
  const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
  const html = htmlResult.value || '';
  const questions: Question[] = [];

  if (html.includes('<table')) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const tables = Array.from(doc.querySelectorAll('table'));

    let currentTopic = 'Chủ đề 1: Biến Cố Giao, Hợp & Biến Cố Độc Lập';
    let currentDifficulty: Difficulty = 'Dễ';

    tables.forEach((table) => {
      // Tìm heading / tiêu đề gần nhất phía trước bảng để xác định Chủ đề và Độ khó
      let prevEl = table.previousElementSibling;
      while (prevEl) {
        const text = (prevEl.textContent || '').trim().toLowerCase();
        if (text.includes('chủ đề 1') || text.includes('chuyên đề 1') || text.includes('giao, hợp') || text.includes('biến cố độc lập')) {
          currentTopic = 'Chủ đề 1: Biến Cố Giao, Hợp & Biến Cố Độc Lập';
        } else if (text.includes('chủ đề 2') || text.includes('chuyên đề 2') || text.includes('điều kiện') || text.includes('toàn phần')) {
          currentTopic = 'Chủ đề 2: Xác Suất Có Điều Kiện & Công Thức Toàn Phần';
        } else if (text.includes('chủ đề 3') || text.includes('chuyên đề 3') || text.includes('tổng hợp') || text.includes('quy tắc đếm')) {
          currentTopic = 'Chủ đề 3: Ôn Tập Tổng Hợp Xác Suất & Quy Tắc Đếm';
        }

        if (text.includes('mức độ 1') || text.includes('level 1') || text.includes('dễ') || text.includes('phần 1')) {
          currentDifficulty = 'Dễ';
        } else if (text.includes('mức độ 2') || text.includes('level 2') || text.includes('trung bình') || text.includes('vừa') || text.includes('phần 2')) {
          currentDifficulty = 'Trung bình';
        } else if (text.includes('mức độ 3') || text.includes('level 3') || text.includes('khó') || text.includes('phần 3')) {
          currentDifficulty = 'Khó';
        }

        if (text.includes('chuyên đề') || text.includes('chủ đề') || text.includes('mức độ')) break;
        prevEl = prevEl.previousElementSibling;
      }

      const rows = Array.from(table.querySelectorAll('tr'));
      if (rows.length < 5) return;

      // Chia bảng thành các khối câu hỏi (dựa vào từ khóa "Câu [N]" ở dòng đầu tiên)
      const questionBlocks: Element[][] = [];
      let currentBlock: Element[] = [];

      rows.forEach((row) => {
        const cells = Array.from(row.querySelectorAll('td, th'));
        const col1Text = cells.length > 0 ? (cells[0].textContent || '').trim().toLowerCase() : '';
        const isQuestionStart = col1Text.startsWith('câu') || /^câu\s*\d+/i.test(col1Text);

        if (isQuestionStart && currentBlock.length >= 5) {
          questionBlocks.push(currentBlock);
          currentBlock = [row];
        } else {
          currentBlock.push(row);
        }
      });
      if (currentBlock.length >= 5) {
        questionBlocks.push(currentBlock);
      } else if (questionBlocks.length === 0 && rows.length >= 5) {
        if (rows.length % 9 === 0) {
          for (let i = 0; i < rows.length; i += 9) questionBlocks.push(rows.slice(i, i + 9));
        } else {
          for (let i = 0; i < rows.length; i += 7) questionBlocks.push(rows.slice(i, i + 7));
        }
      }

      questionBlocks.forEach((blockRows) => {
        const firstCol1 = blockRows.length > 0 && blockRows[0].children.length > 0 
          ? (blockRows[0].children[0].textContent || '').trim().toLowerCase() : '';
        
        let blockDiff = currentDifficulty;
        if (firstCol1.includes('dễ') || firstCol1.includes('mức 1')) blockDiff = 'Dễ';
        else if (firstCol1.includes('vừa') || firstCol1.includes('trung bình') || firstCol1.includes('mức 2')) blockDiff = 'Trung bình';
        else if (firstCol1.includes('khó') || firstCol1.includes('mức 3')) blockDiff = 'Khó';

        const isTF = firstCol1.includes('đ/s') || firstCol1.includes('đúng/sai') || blockRows.length >= 9;

        if (isTF && blockRows.length >= 8) {
          // BẢNG 9 DÒNG: ĐÚNG / SAI 4 Ý -> TỰ ĐỘNG SINH 4 CÂU HỎI GAMEPLAY
          let stem = '';
          const statements: { label: string; text: string; isTrue: boolean; explanation: string }[] = [];
          
          if (blockRows[0].children.length >= 2) {
            stem = (blockRows[0].children[1].textContent || '').trim();
          }

          const labels = ['a', 'b', 'c', 'd'];
          for (let i = 0; i < 4; i++) {
            const rowStmtIdx = 1 + i * 2;
            const rowAnsIdx = 2 + i * 2;
            let stmtText = '';
            let ansText = '';

            if (blockRows[rowStmtIdx] && blockRows[rowStmtIdx].children.length >= 2) {
              stmtText = (blockRows[rowStmtIdx].children[1].textContent || '').trim();
            }
            if (blockRows[rowAnsIdx] && blockRows[rowAnsIdx].children.length >= 2) {
              ansText = (blockRows[rowAnsIdx].children[1].textContent || '').trim();
            }

            if (stmtText) {
              const lowerAns = ansText.toLowerCase();
              const isTrue = lowerAns.startsWith('đúng') || lowerAns.includes('đúng') || lowerAns.startsWith('d') || lowerAns === 't' || lowerAns === 'true';
              statements.push({
                label: labels[i],
                text: stmtText,
                isTrue,
                explanation: ansText
              });
            }
          }

          // Sinh gameplay: tạo 4 câu hỏi độc lập kết hợp stem + statement
          statements.forEach((st) => {
            questions.push({
              id: `yoga_tf_${Date.now()}_${questions.length + 1}`,
              question: normalizeMathFormulas(`${stem}\n\nPhát biểu ${st.label}): ${st.text}`),
              options: ['Đúng', 'Sai'],
              correctIndex: st.isTrue ? 0 : 1,
              explanation: normalizeMathFormulas(st.explanation),
              difficulty: blockDiff,
              topic: currentTopic,
              source: 'Yoga TF',
              status: 'published',
              createdAt: new Date().toISOString()
            });
          });
        } else {
          // BẢNG 7 DÒNG: TRẮC NGHIỆM ABCD
          let qText = '';
          let optA = '', optB = '', optC = '', optD = '';
          let explanation = '';
          let answerLetter = 'A';
          let detectedImgUrl: string | undefined = undefined;

          blockRows.forEach((row, rIdx) => {
            const cells = Array.from(row.querySelectorAll('td, th'));
            if (cells.length < 2) return;
            const col1Text = (cells[0].textContent || '').trim().toLowerCase();
            const col2Text = (cells[1].textContent || '').trim();

            const imgEl = cells[1].querySelector('img');
            if (imgEl && imgEl.getAttribute('src')) {
              detectedImgUrl = imgEl.getAttribute('src') || undefined;
            }

            if (rIdx === 0 || col1Text.startsWith('câu')) {
              qText = col2Text;
            } else if (col1Text.startsWith('a') || (rIdx === 1 && !optA)) {
              optA = col2Text;
            } else if (col1Text.startsWith('b') || (rIdx === 2 && !optB)) {
              optB = col2Text;
            } else if (col1Text.startsWith('c') || (rIdx === 3 && !optC)) {
              optC = col2Text;
            } else if (col1Text.startsWith('d') || (rIdx === 4 && !optD)) {
              optD = col2Text;
            } else if (col1Text.includes('lời giải') || col1Text.includes('giải thích') || rIdx === 5) {
              explanation = col2Text;
            } else if (col1Text.includes('đáp án') || col1Text.includes('chọn') || rIdx === 6) {
              const match = col2Text.match(/(?:chọn|đáp án|câu)?\s*([A-D])\b/i) || col2Text.match(/\b([A-D])\b/i);
              if (match) {
                answerLetter = match[1].toUpperCase();
              } else {
                const charMatch = col2Text.replace(/[^A-Da-d]/g, '').toUpperCase().charAt(0);
                if (charMatch) answerLetter = charMatch;
              }
            }
          });

          if (qText) {
            const { cleanText, imageUrl } = extractImageUrl(qText);
            qText = cleanText;
            if (!detectedImgUrl && imageUrl) detectedImgUrl = imageUrl;

            let correctIndex = 0;
            if (answerLetter === 'B') correctIndex = 1;
            else if (answerLetter === 'C') correctIndex = 2;
            else if (answerLetter === 'D') correctIndex = 3;

            questions.push({
              id: `yoga_mc_${Date.now()}_${questions.length + 1}`,
              question: normalizeMathFormulas(qText),
              options: [
                normalizeMathFormulas(optA || 'Lựa chọn A'),
                normalizeMathFormulas(optB || 'Lựa chọn B'),
                normalizeMathFormulas(optC || 'Lựa chọn C'),
                normalizeMathFormulas(optD || 'Lựa chọn D')
              ],
              correctIndex,
              explanation: normalizeMathFormulas(explanation),
              difficulty: blockDiff,
              topic: currentTopic,
              source: 'Yoga MC',
              status: 'published',
              createdAt: new Date().toISOString(),
              imageUrl: detectedImgUrl
            });
          }
        }
      });
    });
  }

  if (questions.length === 0) {
    const rawResult = await mammoth.extractRawText({ arrayBuffer });
    return parseDocumentQuestions(rawResult.value || '', 'Game Yoga');
  }

  return questions;
}

/**
 * BỘ PARSER FILE EXCEL (.XLSX) CHO GAME AI YOGA VẬN ĐỘNG (HỖ TRỢ SONG SONG MC VÀ TF)
 */
export async function parseYogaFromExcel(file: File): Promise<Question[]> {
  const { XLSX } = await loadDocumentLibraries();
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  const questions: Question[] = [];

  rows.forEach((row, idx) => {
    if (!row || row.length === 0) return;
    const col0 = String(row[0] || '').trim();
    const col1 = String(row[1] || '').trim();
    const col2 = String(row[2] || '').trim();

    if (idx === 0 && (col0.toLowerCase().includes('chuyên đề') || col1.toLowerCase().includes('mức độ') || col2.toLowerCase().includes('dạng câu'))) return;

    let topic = 'Chủ đề 1: Biến Cố Giao, Hợp & Biến Cố Độc Lập';
    if (col0.includes('2') || col0.toLowerCase().includes('điều kiện')) topic = 'Chủ đề 2: Xác Suất Có Điều Kiện & Công Thức Toàn Phần';
    else if (col0.includes('3') || col0.toLowerCase().includes('tổng hợp') || col0.toLowerCase().includes('đếm')) topic = 'Chủ đề 3: Ôn Tập Tổng Hợp Xác Suất & Quy Tắc Đếm';
    else if (col0) topic = col0;

    let diff: Difficulty = 'Dễ';
    const lvlStr = col1.toLowerCase();
    if (lvlStr.includes('3') || lvlStr.includes('khó')) diff = 'Khó';
    else if (lvlStr.includes('2') || lvlStr.includes('vừa') || lvlStr.includes('trung')) diff = 'Trung bình';

    const qType = col2.toUpperCase();
    const qText = String(row[3] || '').trim();
    if (!qText) return;

    if (qType === 'TF') {
      const stA = String(row[4] || '').trim();
      const stB = String(row[5] || '').trim();
      const stC = String(row[6] || '').trim();
      const stD = String(row[7] || '').trim();
      const ansRaw = String(row[8] || '').trim();
      const exp = String(row[9] || '').trim();

      const ansParts = ansRaw.split(/[,;\s]+/).map(s => s.trim().toUpperCase());
      const statements = [
        { label: 'a', text: stA, isTrue: ansParts[0]?.startsWith('Đ') || ansParts[0] === 'D' || ansParts[0] === 'T' },
        { label: 'b', text: stB, isTrue: ansParts[1]?.startsWith('Đ') || ansParts[1] === 'D' || ansParts[1] === 'T' },
        { label: 'c', text: stC, isTrue: ansParts[2]?.startsWith('Đ') || ansParts[2] === 'D' || ansParts[2] === 'T' },
        { label: 'd', text: stD, isTrue: ansParts[3]?.startsWith('Đ') || ansParts[3] === 'D' || ansParts[3] === 'T' },
      ];

      statements.forEach(st => {
        if (st.text) {
          questions.push({
            id: `yoga_xl_tf_${Date.now()}_${questions.length + 1}`,
            question: normalizeMathFormulas(`${qText}\n\nPhát biểu ${st.label}): ${st.text}`),
            options: ['Đúng', 'Sai'],
            correctIndex: st.isTrue ? 0 : 1,
            explanation: normalizeMathFormulas(exp),
            difficulty: diff,
            topic: topic,
            source: 'Yoga TF',
            status: 'published',
            createdAt: new Date().toISOString()
          });
        }
      });
    } else {
      const optA = String(row[4] || '').trim();
      const optB = String(row[5] || '').trim();
      const optC = String(row[6] || '').trim();
      const optD = String(row[7] || '').trim();
      const ansLetter = String(row[8] || '').trim().toUpperCase().charAt(0) || 'A';
      const exp = String(row[9] || '').trim();

      let correctIndex = 0;
      if (ansLetter === 'B') correctIndex = 1;
      else if (ansLetter === 'C') correctIndex = 2;
      else if (ansLetter === 'D') correctIndex = 3;

      questions.push({
        id: `yoga_xl_mc_${Date.now()}_${questions.length + 1}`,
        question: normalizeMathFormulas(qText),
        options: [
          normalizeMathFormulas(optA || 'A'),
          normalizeMathFormulas(optB || 'B'),
          normalizeMathFormulas(optC || 'C'),
          normalizeMathFormulas(optD || 'D')
        ],
        correctIndex,
        explanation: normalizeMathFormulas(exp),
        difficulty: diff,
        topic: topic,
        source: 'Yoga MC',
        status: 'published',
        createdAt: new Date().toISOString()
      });
    }
  });

  return questions;
}

/**
 * BỘ PARSER FILE EXCEL (.XLSX) DẠNG BẢNG 4 CỘT PHÂN CẤP CHO GAME KÉO THẢ
 * Tự động quét và chuẩn hóa toàn bộ công thức TeX thô sang MathJax/KaTeX
 * Động hóa số lượng chuyên đề dựa trên các tên chuyên đề riêng biệt tại Cột 1
 */
export async function parseDragDropFromExcel(file: File): Promise<DragDropTableRow[]> {
  const { XLSX } = await loadDocumentLibraries();
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  const result: DragDropTableRow[] = [];
  const themeColors = ['blue', 'emerald', 'violet', 'amber', 'rose', 'cyan'];

  rows.forEach((row, idx) => {
    if (!row || row.length === 0) return;
    const col0 = String(row[0] || '').trim();
    const col1 = String(row[1] || '').trim();
    const col2 = String(row[2] || '').trim();
    const col3 = String(row[3] || '').trim();

    // Bỏ qua dòng tiêu đề
    const combined = (col0 + ' ' + col1 + ' ' + col2 + ' ' + col3).toLowerCase();
    if (idx === 0 && (combined.includes('chuyên đề') || combined.includes('level') || combined.includes('cột') || combined.includes('phương trình'))) {
      return;
    }

    let topic = 'Chuyên đề 1: Tính Đơn Điệu & Cực Trị';
    let level = 1;
    let category = '';
    let attrsRaw = '';

    if (row.length >= 4) {
      topic = col0 || 'Chuyên đề Tùy Chọn';
      const lvlNum = parseInt(col1.replace(/[^0-9]/g, ''));
      level = isNaN(lvlNum) || lvlNum < 1 ? 1 : Math.min(5, lvlNum);
      category = col2;
      attrsRaw = col3;
    } else if (row.length === 3) {
      topic = col0;
      category = col1;
      attrsRaw = col2;
    } else if (row.length >= 2) {
      category = col0;
      attrsRaw = col1;
    } else {
      category = col0;
    }

    if (!category) return;

    let attributes: string[] = [];
    if (attrsRaw.includes(';')) {
      attributes = attrsRaw.split(';').map(a => a.trim()).filter(Boolean);
    } else if (attrsRaw.includes(',')) {
      attributes = attrsRaw.split(',').map(a => a.trim()).filter(Boolean);
    } else if (attrsRaw.includes('\n')) {
      attributes = attrsRaw.split('\n').map(a => a.trim()).filter(Boolean);
    } else if (attrsRaw) {
      attributes = [attrsRaw];
    }

    const normCategory = normalizeMathFormulas(category);
    const normAttrs = attributes.map(a => normalizeMathFormulas(a));

    result.push({
      id: `row_${Date.now()}_${result.length + 1}`,
      topic,
      level,
      category: normCategory,
      title: normCategory,
      theme: themeColors[result.length % themeColors.length],
      attributes: normAttrs.length > 0 ? normAttrs : [
        'Thuộc tính 1 (Đúng)',
        'Thuộc tính 2 (Đúng)',
        'Thuộc tính 3 (Đúng)',
        'Thuộc tính 4 (Đúng)'
      ]
    });
  });

  return result;
}

/**
 * BỘ PARSER FILE WORD (.DOCX) DẠNG BẢNG 4 CỘT PHÂN CẤP CHO GAME KÉO THẢ
 * Quét toàn bộ thẻ table từ Word, chuẩn hóa công thức TeX thô sang MathJax/KaTeX
 */
export async function parseDragDropFromDocx(file: File): Promise<DragDropTableRow[]> {
  const { mammoth } = await loadDocumentLibraries();
  const arrayBuffer = await file.arrayBuffer();

  const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
  const html = htmlResult.value || '';

  const themeColors = ['blue', 'emerald', 'violet', 'amber', 'rose', 'cyan'];
  const result: DragDropTableRow[] = [];

  if (html.includes('<tr')) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const trElements = Array.from(doc.querySelectorAll('tr'));

    trElements.forEach((tr, idx) => {
      const cells = Array.from(tr.querySelectorAll('td, th')).map(c => c.textContent?.trim() || '');
      if (cells.length === 0) return;

      const combined = cells.join(' ').toLowerCase();
      if (idx === 0 && (combined.includes('chuyên đề') || combined.includes('level') || combined.includes('cột') || combined.includes('phương trình'))) {
        return;
      }

      let topic = 'Chuyên đề 1: Tính Đơn Điệu & Cực Trị';
      let level = 1;
      let category = '';
      let attrsRaw = '';

      if (cells.length >= 4) {
        topic = cells[0] || 'Chuyên đề Tùy Chọn';
        const lvlNum = parseInt(cells[1].replace(/[^0-9]/g, ''));
        level = isNaN(lvlNum) || lvlNum < 1 ? 1 : Math.min(5, lvlNum);
        category = cells[2];
        attrsRaw = cells[3];
      } else if (cells.length === 3) {
        topic = cells[0];
        category = cells[1];
        attrsRaw = cells[2];
      } else if (cells.length >= 2) {
        category = cells[0];
        attrsRaw = cells[1];
      } else {
        category = cells[0];
      }

      if (!category) return;

      let attributes: string[] = [];
      if (attrsRaw.includes(';')) {
        attributes = attrsRaw.split(';').map(a => a.trim()).filter(Boolean);
      } else if (attrsRaw.includes(',')) {
        attributes = attrsRaw.split(',').map(a => a.trim()).filter(Boolean);
      } else if (attrsRaw.includes('\n')) {
        attributes = attrsRaw.split('\n').map(a => a.trim()).filter(Boolean);
      } else if (attrsRaw) {
        attributes = [attrsRaw];
      }

      const normCategory = normalizeMathFormulas(category);
      const normAttrs = attributes.map(a => normalizeMathFormulas(a));

      result.push({
        id: `row_${Date.now()}_${result.length + 1}`,
        topic,
        level,
        category: normCategory,
        title: normCategory,
        theme: themeColors[result.length % themeColors.length],
        attributes: normAttrs.length > 0 ? normAttrs : [
          'Thuộc tính 1 (Đúng)',
          'Thuộc tính 2 (Đúng)',
          'Thuộc tính 3 (Đúng)',
          'Thuộc tính 4 (Đúng)'
        ]
      });
    });
  }

  // Fallback nếu không có bảng HTML
  if (result.length === 0) {
    const rawResult = await mammoth.extractRawText({ arrayBuffer });
    return parseDragDropFromText(rawResult.value || '');
  }

  return result;
}

/**
 * BỘ PHÂN TÍCH VĂN BẢN THÔ / DÁN DỮ LIỆU NHANH CHO GAME KÉO THẢ (HỖ TRỢ 4 CỘT VÀ 2 CỘT)
 * Tự động chuyển đổi công thức thô sang \( ... \) chuẩn KaTeX/MathJax
 */
export function parseDragDropFromText(rawText: string): DragDropTableRow[] {
  if (!rawText || !rawText.trim()) return [];
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const result: DragDropTableRow[] = [];
  const themeColors = ['blue', 'emerald', 'violet', 'amber', 'rose', 'cyan'];

  lines.forEach((line, idx) => {
    const lower = line.toLowerCase();
    if (idx === 0 && (lower.includes('hộp phân loại') || lower.includes('chuyên đề') || (lower.includes('cột 1') && lower.includes('cột 2')) || (lower.includes('phương trình') && lower.includes('thuộc tính')))) {
      return;
    }

    let topic = 'Chuyên đề 1: Tính Đơn Điệu & Cực Trị';
    let level = 1;
    let category = '';
    let attrsRaw = '';

    // Trường hợp 1: Phân tách bằng tab (\t) từ Excel/Word copy ra
    if (line.includes('\t')) {
      const parts = line.split('\t').map(p => p.trim()).filter(Boolean);
      if (parts.length >= 4) {
        topic = parts[0];
        const lvlNum = parseInt(parts[1].replace(/[^0-9]/g, ''));
        level = isNaN(lvlNum) || lvlNum < 1 ? 1 : Math.min(5, lvlNum);
        category = parts[2];
        attrsRaw = parts.slice(3).join(';');
      } else if (parts.length === 3) {
        topic = parts[0];
        category = parts[1];
        attrsRaw = parts[2];
      } else if (parts.length >= 2) {
        category = parts[0];
        attrsRaw = parts.slice(1).join(';');
      } else {
        category = parts[0];
      }
    }
    // Trường hợp 2: Phân tách bằng dấu gạch đứng | (Markdown / Bảng)
    else if (line.includes('|')) {
      const parts = line.split('|').map(p => p.trim()).filter(Boolean);
      if (parts.length >= 4) {
        topic = parts[0];
        const lvlNum = parseInt(parts[1].replace(/[^0-9]/g, ''));
        level = isNaN(lvlNum) || lvlNum < 1 ? 1 : Math.min(5, lvlNum);
        category = parts[2];
        attrsRaw = parts.slice(3).join(';');
      } else if (parts.length >= 2) {
        category = parts[0];
        attrsRaw = parts.slice(1).join(';');
      } else {
        category = parts[0];
      }
    }
    // Trường hợp 3: Phân tách bằng dấu hai chấm :
    else if (line.includes(':') && !line.startsWith('http')) {
      const colonIdx = line.indexOf(':');
      category = line.substring(0, colonIdx).trim();
      attrsRaw = line.substring(colonIdx + 1).trim();
    }
    // Trường hợp 4: Phân tách bằng dấu chấm phẩy ;
    else if (line.includes(';')) {
      const parts = line.split(';').map(p => p.trim()).filter(Boolean);
      category = parts[0] || '';
      attrsRaw = parts.slice(1).join(';');
    } else {
      category = line;
    }

    if (!category) return;

    let attributes: string[] = [];
    if (attrsRaw.includes(';')) {
      attributes = attrsRaw.split(';').map(p => p.trim()).filter(Boolean);
    } else if (attrsRaw.includes(',')) {
      attributes = attrsRaw.split(',').map(p => p.trim()).filter(Boolean);
    } else if (attrsRaw.includes('\n')) {
      attributes = attrsRaw.split('\n').map(p => p.trim()).filter(Boolean);
    } else if (attrsRaw) {
      attributes = [attrsRaw];
    }

    const normCategory = normalizeMathFormulas(category);
    const normAttrs = attributes.map(p => normalizeMathFormulas(p));

    result.push({
      id: `row_${Date.now()}_${result.length + 1}`,
      topic,
      level,
      category: normCategory,
      title: normCategory,
      theme: themeColors[result.length % themeColors.length],
      attributes: normAttrs.length > 0 ? normAttrs : [
        'Thuộc tính 1 (Đúng)',
        'Thuộc tính 2 (Đúng)',
        'Thuộc tính 3 (Đúng)',
        'Thuộc tính 4 (Đúng)'
      ]
    });
  });

  return result;
}

/**
 * HÀM TẠO BẢNG DÀI 2 CỘT CHO GAME PIKACHU NỐI CẶP (DOCX) - ĐEN TRẮNG CHUẨN
 */
function createPikachuTopicTable(
  topicName: string,
  levels: { level: string; pairs: [string, string][] }[]
): Table {
  const rows: TableRow[] = [];

  // Dòng 1: Chủ đề | Tên chủ đề
  rows.push(
    new TableRow({
      children: [
        new TableCell({
          width: { size: 4000, type: WidthType.DXA },
          children: [new Paragraph({ children: [new TextRun({ text: "Chủ đề", bold: true, color: "000000", size: 22 })] })]
        }),
        new TableCell({
          width: { size: 6000, type: WidthType.DXA },
          children: [new Paragraph({ children: [new TextRun({ text: topicName, bold: true, color: "000000", size: 22 })] })]
        })
      ]
    })
  );

  // Duyệt qua từng mức độ và các cặp nối
  levels.forEach(lvl => {
    // Dòng Mức độ: Mức độ | Dễ / Trung bình / Khó
    rows.push(
      new TableRow({
        children: [
          new TableCell({
            width: { size: 4000, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: "Mức độ", bold: true, color: "000000", size: 21 })] })]
          }),
          new TableCell({
            width: { size: 6000, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: lvl.level, bold: true, color: "000000", size: 21 })] })]
          })
        ]
      })
    );

    // Các cặp nối: Vế trái | Vế phải
    lvl.pairs.forEach(([left, right]) => {
      rows.push(
        new TableRow({
          children: [
            new TableCell({
              width: { size: 4000, type: WidthType.DXA },
              children: [new Paragraph({ children: [new TextRun({ text: left, color: "000000", size: 20 })] })]
            }),
            new TableCell({
              width: { size: 6000, type: WidthType.DXA },
              children: [new Paragraph({ children: [new TextRun({ text: right, color: "000000", size: 20 })] })]
            })
          ]
        })
      );
    });
  });

  return new Table({
    width: { size: 10000, type: WidthType.DXA },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" }
    },
    rows
  });
}

/**
 * TẠO VÀ TẢI FILE MẪU WORD (.DOCX) ĐEN TRẮNG BẢNG DÀI CHO GAME PIKACHU NỐI CẶP
 */
export async function downloadPikachuWordTemplate(): Promise<void> {
  const topic1PairsEasy: [string, string][] = [
    ["(C)'", "0"],
    ["(x^n)'", "n \\cdot x^{n-1}"],
    ["(\\sqrt{x})'", "\\frac{1}{2\\sqrt{x}}"],
    ["(\\frac{1}{x})'", "-\\frac{1}{x^2}"],
    ["(5)'", "0"],
    ["(x^3)'", "3x^2"],
    ["(4\\sqrt{x})'", "\\frac{2}{\\sqrt{x}}"],
    ["(\\frac{3}{x})'", "-\\frac{3}{x^2}"],
    ["(u+v)'", "u' + v'"],
    ["(u-v)'", "u' - v'"],
    ["(u \\cdot v)'", "u'v + uv'"],
    ["(\\frac{u}{v})'", "\\frac{u'v - uv'}{v^2}"],
    ["(x^2 + x)'", "2x + 1"],
    ["(x^3 - x)'", "3x^2 - 1"],
    ["(x \\cdot \\sin x)'", "\\sin x + x\\cos x"],
    ["(\\frac{x}{e^x})'", "\\frac{1-x}{e^x}"],
    ["(\\sin x)'", "\\cos x"],
    ["(\\cos x)'", "-\\sin x"],
    ["(\\tan x)'", "\\frac{1}{\\cos^2 x}"],
    ["(e^x)'", "e^x"],
    ["(2\\sin x)'", "2\\cos x"],
    ["(3\\cos x)'", "-3\\sin x"],
    ["(2\\tan x)'", "\\frac{2}{\\cos^2 x}"],
    ["(5e^x)'", "5e^x"],
    ["(7x)'", "7"],
    ["(x^4)'", "4x^3"]
  ];

  const topic1PairsMedium: [string, string][] = [
    ["(u^n)'", "n \\cdot u^{n-1} \\cdot u'"],
    ["(\\sqrt{u})'", "\\frac{u'}{2\\sqrt{u}}"],
    ["(\\frac{1}{u})'", "-\\frac{u'}{u^2}"],
    ["(e^u)'", "u' \\cdot e^u"],
    ["((2x+1)^3)'", "6(2x+1)^2"],
    ["(\\sqrt{x^2+1})'", "\\frac{x}{\\sqrt{x^2+1}}"],
    ["(\\frac{1}{2x-1})'", "-\\frac{2}{(2x-1)^2}"],
    ["(e^{2x})'", "2e^{2x}"],
    ["(\\sin u)'", "u' \\cdot \\cos u"],
    ["(\\cos u)'", "-u' \\cdot \\sin u"],
    ["(\\tan u)'", "\\frac{u'}{\\cos^2 u}"],
    ["(\\cot u)'", "-\\frac{u'}{\\sin^2 u}"],
    ["(\\sin 3x)'", "3\\cos 3x"],
    ["(\\cos x^2)'", "-2x\\sin x^2"],
    ["(\\tan 2x)'", "\\frac{2}{\\cos^2 2x}"],
    ["(\\cot 3x)'", "-\\frac{3}{\\sin^2 3x}"],
    ["(\\ln x)'", "\\frac{1}{x}"],
    ["(\\ln u)'", "\\frac{u'}{u}"],
    ["(a^x)'", "a^x \\cdot \\ln a"],
    ["(\\log_a x)'", "\\frac{1}{x \\ln a}"],
    ["(3\\ln x)'", "\\frac{3}{x}"],
    ["(\\ln(x^2+1))'", "\\frac{2x}{x^2+1}"],
    ["(2^x)'", "2^x \\cdot \\ln 2"],
    ["(\\log_2 x)'", "\\frac{1}{x \\ln 2}"],
    ["(e^{3x})'", "3e^{3x}"],
    ["(\\ln(2x+1))'", "\\frac{2}{2x+1}"]
  ];

  const topic1PairsHard: [string, string][] = [
    ["(\\frac{x+1}{x-1})'", "-\\frac{2}{(x-1)^2}"],
    ["(\\frac{2x-3}{x+2})'", "\\frac{7}{(x+2)^2}"],
    ["(\\frac{x}{2x+1})'", "\\frac{1}{(2x+1)^2}"],
    ["(\\frac{3x+1}{2-x})'", "\\frac{7}{(2-x)^2}"],
    ["(\\frac{x^2+1}{x})'", "\\frac{x^2-1}{x^2}"],
    ["(\\frac{x^2-x+1}{x-1})'", "\\frac{x^2-2x}{(x-1)^2}"],
    ["(\\frac{1}{x^2+2})'", "-\\frac{2x}{(x^2+2)^2}"],
    ["(\\frac{x}{x^2+1})'", "\\frac{1-x^2}{(x^2+1)^2}"],
    ["(\\sqrt{2x+3})'", "\\frac{1}{\\sqrt{2x+3}}"],
    ["(\\sqrt{4-x^2})'", "-\\frac{x}{\\sqrt{4-x^2}}"],
    ["(x\\sqrt{x})'", "\\frac{3\\sqrt{x}}{2}"],
    ["(\\sqrt{x^3+1})'", "\\frac{3x^2}{2\\sqrt{x^3+1}}"],
    ["(\\frac{1}{\\sqrt{x}})'", "-\\frac{1}{2x\\sqrt{x}}"],
    ["(\\sqrt{x^2+4x})'", "\\frac{x+2}{\\sqrt{x^2+4x}}"],
    ["(\\sin^2 x)'", "\\sin 2x"],
    ["(\\cos^2 x)'", "-\\sin 2x"],
    ["(\\tan^2 x)'", "\\frac{2\\sin x}{\\cos^3 x}"],
    ["(\\sin^3 x)'", "3\\sin^2 x \\cdot \\cos x"],
    ["(e^{x^2})'", "2x \\cdot e^{x^2}"],
    ["(\\ln^2 x)'", "\\frac{2\\ln x}{x}"],
    ["(x \\cdot e^{-x})'", "e^{-x}(1-x)"],
    ["(\\ln(\\sin x))'", "\\cot x"],
    ["(\\sqrt{\\ln x})'", "\\frac{1}{2x\\sqrt{\\ln x}}"],
    ["(x \\cdot 2^x)'", "2^x(1 + x\\ln 2)"],
    ["(\\cos^3 x)'", "-3\\cos^2 x \\cdot \\sin x"],
    ["(e^{\\sin x})'", "\\cos x \\cdot e^{\\sin x}"]
  ];

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: "MẪU SOẠN ĐỀ GAME PIKACHU TOÁN HỌC (CHUẨN BẢNG DÀI 2 CỘT)",
                bold: true,
                size: 26,
                color: "000000"
              })
            ],
            spacing: { after: 120 }
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "HƯỚNG DẪN: Mỗi bảng đại diện cho 1 Chủ đề. Cột 1 ghi 'Chủ đề' | Cột 2 ghi Tên chủ đề. Dòng tiếp theo ghi 'Mức độ' | 'Dễ' (hoặc 'Trung bình', 'Khó'). Các dòng sau là các CẶP NỐI CHÍNH XÁC (Cột 1: Vế trái | Cột 2: Vế phải). Bảng chơi Pikachu bắt buộc có 24 cặp thẻ (48 ô). Thầy cô có thể soạn nhiều hơn 24 cặp thẻ, hệ thống sẽ tự động CHỌN NGẪU NHIÊN 24 cặp chống học vẹt!",
                color: "000000",
                size: 20
              })
            ],
            spacing: { after: 200 }
          }),

          // BẢNG 1
          createPikachuTopicTable("Chủ đề 1: Đạo Hàm Các Hàm Số & Hàm Hợp", [
            { level: "Dễ", pairs: topic1PairsEasy },
            { level: "Trung bình", pairs: topic1PairsMedium },
            { level: "Khó", pairs: topic1PairsHard }
          ]),
          new Paragraph({ text: "", spacing: { after: 250 } }),

          // BẢNG 2
          createPikachuTopicTable("Chủ đề 2: Nguyên Hàm & Tích Phân Cơ Bản", [
            {
              level: "Dễ",
              pairs: [
                ["\\int 0 \\, dx", "C"],
                ["\\int 1 \\, dx", "x + C"],
                ["\\int x \\, dx", "\\frac{x^2}{2} + C"],
                ["\\int x^2 \\, dx", "\\frac{x^3}{3} + C"],
                ["\\int 4 \\, dx", "4x + C"],
                ["\\int 2x \\, dx", "x^2 + C"],
                ["\\int 3x^2 \\, dx", "x^3 + C"],
                ["\\int 4x^3 \\, dx", "x^4 + C"],
                ["\\int \\frac{1}{x} \\, dx", "\\ln|x| + C"],
                ["\\int e^x \\, dx", "e^x + C"],
                ["\\int a^x \\, dx", "\\frac{a^x}{\\ln a} + C"],
                ["\\int 2^x \\, dx", "\\frac{2^x}{\\ln 2} + C"],
                ["\\int \\sin x \\, dx", "-\\cos x + C"],
                ["\\int \\cos x \\, dx", "\\sin x + C"],
                ["\\int \\frac{1}{\\cos^2 x} \\, dx", "\\tan x + C"],
                ["\\int \\frac{1}{\\sin^2 x} \\, dx", "-\\cot x + C"],
                ["\\int 2\\sin x \\, dx", "-2\\cos x + C"],
                ["\\int 3\\cos x \\, dx", "3\\sin x + C"],
                ["\\int 5^x \\, dx", "\\frac{5^x}{\\ln 5} + C"],
                ["\\int 3e^x \\, dx", "3e^x + C"],
                ["\\int 5x^4 \\, dx", "x^5 + C"],
                ["\\int \\frac{2}{x} \\, dx", "2\\ln|x| + C"],
                ["\\int 6x \\, dx", "3x^2 + C"],
                ["\\int 7 \\, dx", "7x + C"]
              ]
            },
            {
              level: "Trung bình",
              pairs: [
                ["\\int e^{2x} \\, dx", "\\frac{1}{2}e^{2x} + C"],
                ["\\int e^{3x} \\, dx", "\\frac{1}{3}e^{3x} + C"],
                ["\\int e^{-x} \\, dx", "-e^{-x} + C"],
                ["\\int 2e^{2x} \\, dx", "e^{2x} + C"],
                ["\\int (2x+1) \\, dx", "x^2 + x + C"],
                ["\\int (3x^2-2) \\, dx", "x^3 - 2x + C"],
                ["\\int \\sin 2x \\, dx", "-\\frac{1}{2}\\cos 2x + C"],
                ["\\int \\cos 2x \\, dx", "\\frac{1}{2}\\sin 2x + C"],
                ["\\int \\frac{1}{x+1} \\, dx", "\\ln|x+1| + C"],
                ["\\int \\frac{1}{2x-1} \\, dx", "\\frac{1}{2}\\ln|2x-1| + C"],
                ["\\int \\frac{1}{x^2} \\, dx", "-\\frac{1}{x} + C"],
                ["\\int \\frac{1}{\\sqrt{x}} \\, dx", "2\\sqrt{x} + C"],
                ["\\int \\sqrt{x} \\, dx", "\\frac{2}{3}x\\sqrt{x} + C"],
                ["\\int (4x-3) \\, dx", "2x^2 - 3x + C"],
                ["\\int \\sin 3x \\, dx", "-\\frac{1}{3}\\cos 3x + C"],
                ["\\int \\cos 4x \\, dx", "\\frac{1}{4}\\sin 4x + C"],
                ["\\int (6x^2+1) \\, dx", "2x^3 + x + C"],
                ["\\int \\frac{2}{2x+3} \\, dx", "\\ln|2x+3| + C"],
                ["\\int 3\\sqrt{x} \\, dx", "2x\\sqrt{x} + C"],
                ["\\int \\frac{2}{x^2} \\, dx", "-\\frac{2}{x} + C"],
                ["\\int \\frac{3}{\\sqrt{x}} \\, dx", "6\\sqrt{x} + C"],
                ["\\int e^{4x} \\, dx", "\\frac{1}{4}e^{4x} + C"],
                ["\\int \\cos 3x \\, dx", "\\frac{1}{3}\\sin 3x + C"],
                ["\\int \\sin 4x \\, dx", "-\\frac{1}{4}\\cos 4x + C"]
              ]
            },
            {
              level: "Khó",
              pairs: [
                ["\\int 2x \\cdot e^{x^2} \\, dx", "e^{x^2} + C"],
                ["\\int \\frac{2x}{x^2+1} \\, dx", "\\ln(x^2+1) + C"],
                ["\\int 2x\\sqrt{x^2+1} \\, dx", "\\frac{2}{3}(x^2+1)\\sqrt{x^2+1} + C"],
                ["\\int \\sin x \\cos x \\, dx", "\\frac{1}{2}\\sin^2 x + C"],
                ["\\int \\frac{\\ln x}{x} \\, dx", "\\frac{\\ln^2 x}{2} + C"],
                ["\\int \\tan x \\, dx", "-\\ln|\\cos x| + C"],
                ["\\int \\cot x \\, dx", "\\ln|\\sin x| + C"],
                ["\\int e^{\\sin x}\\cos x \\, dx", "e^{\\sin x} + C"],
                ["\\int (2x+3)^4 \\, dx", "\\frac{(2x+3)^5}{10} + C"],
                ["\\int (3x-1)^5 \\, dx", "\\frac{(3x-1)^6}{18} + C"],
                ["\\int \\sqrt{2x+1} \\, dx", "\\frac{1}{3}(2x+1)\\sqrt{2x+1} + C"],
                ["\\int \\frac{1}{(x-2)^2} \\, dx", "-\\frac{1}{x-2} + C"],
                ["\\int x \\cdot e^x \\, dx", "e^x(x-1) + C"],
                ["\\int x \\cdot \\cos x \\, dx", "x\\sin x + \\cos x + C"],
                ["\\int x \\cdot \\sin x \\, dx", "-x\\cos x + \\sin x + C"],
                ["\\int \\ln x \\, dx", "x\\ln x - x + C"],
                ["\\int (x+1)e^x \\, dx", "x \\cdot e^x + C"],
                ["\\int 2x\\ln x \\, dx", "x^2\\ln x - \\frac{x^2}{2} + C"],
                ["\\int \\frac{e^x}{e^x+1} \\, dx", "\\ln(e^x+1) + C"],
                ["\\int \\frac{1}{x\\ln x} \\, dx", "\\ln|\\ln x| + C"],
                ["\\int \\frac{3x^2}{x^3+1} \\, dx", "\\ln|x^3+1| + C"],
                ["\\int x \\cdot e^{2x} \\, dx", "\\frac{e^{2x}}{4}(2x-1) + C"],
                ["\\int \\cos^2 x \\, dx", "\\frac{x}{2} + \\frac{\\sin 2x}{4} + C"],
                ["\\int \\sin^2 x \\, dx", "\\frac{x}{2} - \\frac{\\sin 2x}{4} + C"]
              ]
            }
          ])
        ]
      }
    ]
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, "Mau_Game_Pikachu_Toan_Hoc.docx");
}

/**
 * TẠO VÀ TẢI FILE MẪU EXCEL (.XLSX) CHO GAME PIKACHU NỐI CẶP
 */
export async function downloadPikachuExcelTemplate(): Promise<void> {
  const { XLSX } = await loadDocumentLibraries();
  const headers = ["Chủ đề", "Mức độ", "Vế trái (Hàm số / Công thức)", "Vế phải (Đạo hàm / Kết quả)"];

  const sampleRows = [
    // Chủ đề 1: Dễ
    ["Chủ đề 1: Đạo Hàm Các Hàm Số & Hàm Hợp", "Dễ", "(C)'", "0"],
    ["Chủ đề 1: Đạo Hàm Các Hàm Số & Hàm Hợp", "Dễ", "(x^n)'", "n \\cdot x^{n-1}"],
    ["Chủ đề 1: Đạo Hàm Các Hàm Số & Hàm Hợp", "Dễ", "(\\sqrt{x})'", "\\frac{1}{2\\sqrt{x}}"],
    ["Chủ đề 1: Đạo Hàm Các Hàm Số & Hàm Hợp", "Dễ", "(\\frac{1}{x})'", "-\\frac{1}{x^2}"],
    ["Chủ đề 1: Đạo Hàm Các Hàm Số & Hàm Hợp", "Dễ", "(5)'", "0"],
    ["Chủ đề 1: Đạo Hàm Các Hàm Số & Hàm Hợp", "Dễ", "(x^3)'", "3x^2"],
    ["Chủ đề 1: Đạo Hàm Các Hàm Số & Hàm Hợp", "Dễ", "(u+v)'", "u' + v'"],
    ["Chủ đề 1: Đạo Hàm Các Hàm Số & Hàm Hợp", "Dễ", "(\\sin x)'", "\\cos x"],
    ["Chủ đề 1: Đạo Hàm Các Hàm Số & Hàm Hợp", "Dễ", "(\\cos x)'", "-\\sin x"],
    ["Chủ đề 1: Đạo Hàm Các Hàm Số & Hàm Hợp", "Dễ", "(e^x)'", "e^x"],

    // Chủ đề 1: Trung bình
    ["Chủ đề 1: Đạo Hàm Các Hàm Số & Hàm Hợp", "Trung bình", "(u^n)'", "n \\cdot u^{n-1} \\cdot u'"],
    ["Chủ đề 1: Đạo Hàm Các Hàm Số & Hàm Hợp", "Trung bình", "(\\sqrt{u})'", "\\frac{u'}{2\\sqrt{u}}"],
    ["Chủ đề 1: Đạo Hàm Các Hàm Số & Hàm Hợp", "Trung bình", "(e^u)'", "u' \\cdot e^u"],
    ["Chủ đề 1: Đạo Hàm Các Hàm Số & Hàm Hợp", "Trung bình", "((2x+1)^3)'", "6(2x+1)^2"],
    ["Chủ đề 1: Đạo Hàm Các Hàm Số & Hàm Hợp", "Trung bình", "(\\sin 3x)'", "3\\cos 3x"],
    ["Chủ đề 1: Đạo Hàm Các Hàm Số & Hàm Hợp", "Trung bình", "(\\ln x)'", "\\frac{1}{x}"],
    ["Chủ đề 1: Đạo Hàm Các Hàm Số & Hàm Hợp", "Trung bình", "(2^x)'", "2^x \\cdot \\ln 2"],

    // Chủ đề 1: Khó
    ["Chủ đề 1: Đạo Hàm Các Hàm Số & Hàm Hợp", "Khó", "(\\frac{x+1}{x-1})'", "-\\frac{2}{(x-1)^2}"],
    ["Chủ đề 1: Đạo Hàm Các Hàm Số & Hàm Hợp", "Khó", "(\\sqrt{2x+3})'", "\\frac{1}{\\sqrt{2x+3}}"],
    ["Chủ đề 1: Đạo Hàm Các Hàm Số & Hàm Hợp", "Khó", "(\\sin^2 x)'", "\\sin 2x"],
    ["Chủ đề 1: Đạo Hàm Các Hàm Số & Hàm Hợp", "Khó", "(e^{x^2})'", "2x \\cdot e^{x^2}"],
    ["Chủ đề 1: Đạo Hàm Các Hàm Số & Hàm Hợp", "Khó", "(x \\cdot e^{-x})'", "e^{-x}(1-x)"],

    // Chủ đề 2: Dễ
    ["Chủ đề 2: Nguyên Hàm & Tích Phân Cơ Bản", "Dễ", "\\int 0 \\, dx", "C"],
    ["Chủ đề 2: Nguyên Hàm & Tích Phân Cơ Bản", "Dễ", "\\int 1 \\, dx", "x + C"],
    ["Chủ đề 2: Nguyên Hàm & Tích Phân Cơ Bản", "Dễ", "\\int x \\, dx", "\\frac{x^2}{2} + C"],
    ["Chủ đề 2: Nguyên Hàm & Tích Phân Cơ Bản", "Dễ", "\\int \\frac{1}{x} \\, dx", "\\ln|x| + C"],
    ["Chủ đề 2: Nguyên Hàm & Tích Phân Cơ Bản", "Dễ", "\\int e^x \\, dx", "e^x + C"],
    ["Chủ đề 2: Nguyên Hàm & Tích Phân Cơ Bản", "Dễ", "\\int \\sin x \\, dx", "-\\cos x + C"],
    ["Chủ đề 2: Nguyên Hàm & Tích Phân Cơ Bản", "Dễ", "\\int \\cos x \\, dx", "\\sin x + C"],

    // Chủ đề 2: Trung bình
    ["Chủ đề 2: Nguyên Hàm & Tích Phân Cơ Bản", "Trung bình", "\\int e^{2x} \\, dx", "\\frac{1}{2}e^{2x} + C"],
    ["Chủ đề 2: Nguyên Hàm & Tích Phân Cơ Bản", "Trung bình", "\\int (2x+1) \\, dx", "x^2 + x + C"],
    ["Chủ đề 2: Nguyên Hàm & Tích Phân Cơ Bản", "Trung bình", "\\int \\sin 2x \\, dx", "-\\frac{1}{2}\\cos 2x + C"],
    ["Chủ đề 2: Nguyên Hàm & Tích Phân Cơ Bản", "Trung bình", "\\int \\frac{1}{x+1} \\, dx", "\\ln|x+1| + C"],

    // Chủ đề 2: Khó
    ["Chủ đề 2: Nguyên Hàm & Tích Phân Cơ Bản", "Khó", "\\int 2x \\cdot e^{x^2} \\, dx", "e^{x^2} + C"],
    ["Chủ đề 2: Nguyên Hàm & Tích Phân Cơ Bản", "Khó", "\\int \\frac{2x}{x^2+1} \\, dx", "\\ln(x^2+1) + C"],
    ["Chủ đề 2: Nguyên Hàm & Tích Phân Cơ Bản", "Khó", "\\int x \\cdot e^x \\, dx", "e^x(x-1) + C"]
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
  ws['!cols'] = [
    { wch: 38 },
    { wch: 16 },
    { wch: 35 },
    { wch: 35 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Mau_Pikachu");
  XLSX.writeFile(wb, "Mau_Game_Pikachu_Toan_Hoc.xlsx");
}

/**
 * BỘ PARSER FILE WORD (.DOCX) CHUẨN BẢNG DÀI 2 CỘT CHO GAME PIKACHU
 */
export async function parsePikachuFromDocx(file: File): Promise<Question[]> {
  const { mammoth } = await loadDocumentLibraries();
  const arrayBuffer = await file.arrayBuffer();
  const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
  const html = htmlResult.value || '';
  const questions: Question[] = [];

  if (html.includes('<table')) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const tables = Array.from(doc.querySelectorAll('table'));

    let currentTopic = 'Chủ đề 1: Đạo Hàm Các Hàm Số & Hàm Hợp';
    let currentDifficulty: Difficulty = 'Dễ';

    tables.forEach((table, tIdx) => {
      // Kiểm tra tiêu đề phía trước bảng nếu có
      let prevEl = table.previousElementSibling;
      while (prevEl) {
        const text = (prevEl.textContent || '').trim();
        if (/chủ đề|chuyên đề/i.test(text)) {
          currentTopic = text.replace(/^(chủ đề|chuyên đề)\s*\d*[:\-\s]*/i, '').trim() || text;
          break;
        }
        prevEl = prevEl.previousElementSibling;
      }

      const rows = Array.from(table.querySelectorAll('tr'));
      rows.forEach((row) => {
        const cells = Array.from(row.querySelectorAll('td, th'));
        if (cells.length < 2) return;

        const col1 = (cells[0].textContent || '').trim();
        const col2 = (cells[1].textContent || '').trim();

        if (!col1 && !col2) return;

        const col1Low = col1.toLowerCase();
        // Kiểm tra dòng Chủ đề
        if (col1Low === 'chủ đề' || col1Low.startsWith('chủ đề') || col1Low === 'chuyên đề') {
          if (col2) currentTopic = col2;
          return;
        }

        // Kiểm tra dòng Mức độ
        if (col1Low === 'mức độ' || col1Low.startsWith('mức độ') || col1Low === 'cấp độ' || col1Low === 'level') {
          const col2Low = col2.toLowerCase();
          if (col2Low.includes('dễ') || col2Low.includes('1') || col2Low.includes('easy')) {
            currentDifficulty = 'Dễ';
          } else if (col2Low.includes('khó') || col2Low.includes('3') || col2Low.includes('hard')) {
            currentDifficulty = 'Khó';
          } else {
            currentDifficulty = 'Trung bình';
          }
          return;
        }

        // Cặp nối hợp lệ: Vế trái (Hàm số) | Vế phải (Đạo hàm/Kết quả)
        if (col1 && col2) {
          questions.push({
            id: `pika_${Date.now()}_${tIdx}_${questions.length + 1}`,
            question: normalizeMathFormulas(col1),
            options: [normalizeMathFormulas(col2)],
            correctIndex: 0,
            explanation: `Cặp nối: ${col1} <-> ${col2}`,
            source: 'Pikachu',
            status: 'published',
            topic: currentTopic,
            difficulty: currentDifficulty,
            type: 'MULTIPLE_CHOICE'
          });
        }
      });
    });
  }

  // Fallback: nếu không thấy table, bóc tách theo dòng văn bản
  if (questions.length === 0) {
    const rawText = await extractTextFromDocx(file);
    const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
    let curTopic = 'Chủ đề 1: Đạo Hàm Các Hàm Số';
    let curDiff: Difficulty = 'Dễ';

    lines.forEach((line) => {
      if (/^chủ đề|^chuyên đề/i.test(line)) {
        curTopic = line;
        return;
      }
      if (/^mức độ|^cấp độ|^level/i.test(line)) {
        const lLow = line.toLowerCase();
        if (lLow.includes('dễ') || lLow.includes('1')) curDiff = 'Dễ';
        else if (lLow.includes('khó') || lLow.includes('3')) curDiff = 'Khó';
        else curDiff = 'Trung bình';
        return;
      }
      if (line.includes('|') || line.includes('\t') || line.includes(';')) {
        const parts = line.split(/[|\t;]/).map(p => p.trim()).filter(Boolean);
        if (parts.length >= 2) {
          questions.push({
            id: `pika_txt_${Date.now()}_${questions.length + 1}`,
            question: normalizeMathFormulas(parts[0]),
            options: [normalizeMathFormulas(parts[1])],
            correctIndex: 0,
            explanation: `Cặp nối: ${parts[0]} <-> ${parts[1]}`,
            source: 'Pikachu',
            status: 'published',
            topic: curTopic,
            difficulty: curDiff,
            type: 'MULTIPLE_CHOICE'
          });
        }
      }
    });
  }

  return questions;
}

/**
 * BỘ PARSER FILE EXCEL (.XLSX) CHO GAME PIKACHU NỐI CẶP
 */
export async function parsePikachuFromExcel(file: File): Promise<Question[]> {
  const { XLSX } = await loadDocumentLibraries();
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

  const questions: Question[] = [];
  let currentTopic = 'Chủ đề 1: Đạo Hàm Các Hàm Số';
  let currentDifficulty: Difficulty = 'Dễ';

  rawRows.forEach((row, rIdx) => {
    if (!row || row.length === 0) return;
    const col0 = String(row[0] || '').trim();
    const col1 = String(row[1] || '').trim();
    const col2 = String(row[2] || '').trim();
    const col3 = String(row[3] || '').trim();

    // Bỏ qua dòng tiêu đề chung
    if (rIdx === 0 && (col0.toLowerCase().includes('chủ đề') && col1.toLowerCase().includes('mức độ') && col2.toLowerCase().includes('vế'))) {
      return;
    }

    // Định dạng 4 cột chuẩn: [Chủ đề, Mức độ, Vế trái, Vế phải]
    if (row.length >= 4 && col2 && col3) {
      if (col0) currentTopic = col0;
      if (col1) {
        const dLow = col1.toLowerCase();
        if (dLow.includes('dễ') || dLow.includes('1')) currentDifficulty = 'Dễ';
        else if (dLow.includes('khó') || dLow.includes('3')) currentDifficulty = 'Khó';
        else currentDifficulty = 'Trung bình';
      }

      questions.push({
        id: `pika_xl_${Date.now()}_${questions.length + 1}`,
        question: normalizeMathFormulas(col2),
        options: [normalizeMathFormulas(col3)],
        correctIndex: 0,
        explanation: `Cặp nối: ${col2} <-> ${col3}`,
        source: 'Pikachu',
        status: 'published',
        topic: currentTopic,
        difficulty: currentDifficulty,
        type: 'MULTIPLE_CHOICE'
      });
      return;
    }

    // Định dạng 2 cột: [Cột 1, Cột 2]
    if (col0 && col1) {
      const c0Low = col0.toLowerCase();
      if (c0Low === 'chủ đề' || c0Low.startsWith('chủ đề')) {
        currentTopic = col1;
        return;
      }
      if (c0Low === 'mức độ' || c0Low.startsWith('mức độ')) {
        const c1Low = col1.toLowerCase();
        if (c1Low.includes('dễ') || c1Low.includes('1')) currentDifficulty = 'Dễ';
        else if (c1Low.includes('khó') || c1Low.includes('3')) currentDifficulty = 'Khó';
        else currentDifficulty = 'Trung bình';
        return;
      }

      questions.push({
        id: `pika_xl2_${Date.now()}_${questions.length + 1}`,
        question: normalizeMathFormulas(col0),
        options: [normalizeMathFormulas(col1)],
        correctIndex: 0,
        explanation: `Cặp nối: ${col0} <-> ${col1}`,
        source: 'Pikachu',
        status: 'published',
        topic: currentTopic,
        difficulty: currentDifficulty,
        type: 'MULTIPLE_CHOICE'
      });
    }
  });

  return questions;
}
