import { Question, Difficulty, DragDropCategory, DragDropTableRow } from '../types';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType } from 'docx';
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

  // 0. Sửa chữa các chuỗi lỗi font/TeX đã bị hỏng trước đó (ví dụ: {\(\frac\){sqrt{3}}{2}})
  str = str.replace(/\{\s*\\?\(\\?frac\\?\)\s*\{/gi, '\\frac{');
  str = str.replace(/\{\s*\\?\(\\?sqrt\\?\)\s*\{/gi, '\\sqrt{');
  str = str.replace(/\{\s*\\?\((\\[a-zA-Z]+)\\?\)\s*/gi, '$1');
  str = str.replace(/\{\s*\\frac\s*([^{}]+)\s*\}\s*\{\s*([^{}]+)\s*\}/gi, '\\frac{$1}{$2}');

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
          question: cat.title,
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
 * TẢI FILE MẪU THEO ĐÚNG TỪNG GAME ĐANG CHỌN (KHÔNG DÙNG CHUNG)
 */
export async function downloadGameWordTemplate(gameIdentifier: string): Promise<void> {
  const cleanId = (gameIdentifier || '').toLowerCase();
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
            const extracted = col2Text.replace(/[^A-Da-d]/g, '').toUpperCase().charAt(0);
            if (extracted) answerLetter = extracted;
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
