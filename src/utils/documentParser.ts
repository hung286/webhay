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
 * CHUẨN HÓA CÔNG THỨC TOÁN HỌC TỪ TEX SANG MATHJAX/KATEX (AUTO LATEX PARSER)
 * - Tự động nhận diện công thức TeX thô (\\frac, \\sqrt, x^2, v.v.)
 * - Chuyển đổi $formula$ và $$formula$$ thành chuẩn \\( ... \\)
 * - Tự động bọc công thức TeX trần để hiển thị trực quan 100%
 */
export function normalizeMathFormulas(text: string): string {
  if (!text || typeof text !== 'string') return '';
  let str = text.trim();

  // 1. Chuyển đổi $$...$$ thành \(...\) tránh làm vỡ layout thẻ game
  str = str.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => `\\(${math.trim()}\\)`);

  // 2. Chuyển đổi $...$ thành \(...\)
  str = str.replace(/\$([^\$]+?)\$/g, (_, math) => `\\(${math.trim()}\\)`);

  // 3. Nếu toàn bộ chuỗi là phương trình/hàm số toán học chưa có delimiter:
  // Ví dụ: y = x^3 - 3x hoặc f(x) = x^2 - 1 hoặc y' = 3x^2 - 6x
  if (!str.includes('\\(') && !str.includes('$')) {
    if (/^(?:y|f\(x\)|g\(x\)|s\(t\)|v\(t\)|a\(t\)|h\(t\)|Q\(t\)|u_n)\s*=/i.test(str)) {
      return `\\(${str}\\)`;
    }
    // Dạng phương trình đường thẳng hoặc mặt phẳng: \frac{x-1}{2} = ... hoặc 2x + 3y - z = 0
    if (/^[xyz\d\s+\-*\/=^_{}\\()[\],.;:><|]+$/.test(str) && (str.includes('=') || str.includes('\\frac'))) {
      if (!str.includes(' ') || str.split(' ').length <= 4) {
        return `\\(${str}\\)`;
      }
    }
  }

  // 4. Quét các lệnh TeX trần còn sót lại bên trong văn bản tiếng Việt
  // Ví dụ: Đạo hàm y' = \frac{5}{(x+2)^2} trên khoảng (1; +\infty)
  const latexCommands = /\\(?:frac\{[^{}]+\}\{[^{}]+\}|sqrt\{[^{}]+\}|mathbb\{[^{}]+\}|vec\{[^{}]+\}|sin|cos|tan|cot|lim|int|sum|pi|alpha|beta|infty|Delta|pm|times|le|ge|ne|in|notin|forall|exists)(?:[^\s,;.()]*)/g;
  if (!str.includes('\\(') && latexCommands.test(str)) {
    str = str.replace(/(?:(?:y'|y''|x|k)\s*=\s*)?(\\(?:frac|sqrt|sin|cos|tan|cot|mathbb|vec)[^,\n]+?)(?=[\s,;.]|$)/g, (match) => {
      if (match.startsWith('\\(')) return match;
      return `\\(${match.trim()}\\)`;
    });
  }

  // 5. Chuẩn hóa làm sạch các dấu ngoặc kép lặp lại nếu có
  str = str.replace(/\\\(\s*\\\((.*?)\\\)\s*\\\)/g, '\\($1\\)');
  str = str.replace(/\\\(\s*\$(.*?)\$\s*\\\)/g, '\\($1\\)');

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
