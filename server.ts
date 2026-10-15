import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import path from 'path';
import fs from 'fs';
import fsPromises from 'fs/promises';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '30mb' }));

// Helper to get GenAI client
function getGenAIClient(customApiKey?: string): GoogleGenAI | null {
  const apiKey = (customApiKey && customApiKey.trim().length > 5) ? customApiKey.trim() : process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// 1. API: Check Gemini Status
app.get('/api/gemini/status', (req, res) => {
  const hasServerKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 5);
  res.json({
    hasServerKey,
    defaultModel: 'gemini-3.8-flash',
    supportedModels: [
      { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash (Khuyên dùng - Nhanh & Chính xác)' },
      { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite (Siêu nhanh)' },
      { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro Preview (Suy luận sâu)' }
    ]
  });
});

// 2. API: Test Gemini Connection
app.post('/api/gemini/test', async (req, res) => {
  try {
    const { customApiKey, model = 'gemini-3.8-flash' } = req.body;
    const ai = getGenAIClient(customApiKey);
    if (!ai) {
      return res.status(400).json({ success: false, error: 'Chưa cấu hình GEMINI_API_KEY trên máy chủ hoặc trong phiên làm việc.' });
    }

    const response = await ai.models.generateContent({
      model,
      contents: 'Trả về một chữ duy nhất: OK',
    });

    const text = response.text ? response.text.trim() : '';
    res.json({ success: true, message: 'Kết nối Gemini API thành công!', reply: text });
  } catch (error: any) {
    console.error('Gemini test error:', error);
    res.status(500).json({ success: false, error: error?.message || 'Lỗi kiểm tra kết nối Gemini API' });
  }
});

// 3. API: Analyze Material
app.post('/api/gemini/analyze-material', async (req, res) => {
  try {
    const { materialText, title, customApiKey, model = 'gemini-3.8-flash' } = req.body;
    if (!materialText || materialText.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Nội dung học liệu trống' });
    }

    const ai = getGenAIClient(customApiKey);
    if (!ai) {
      return res.status(400).json({ success: false, error: 'Chưa có Gemini API Key' });
    }

    const prompt = `Bạn là chuyên gia giáo dục. Hãy phân tích tài liệu sau đây mang tiêu đề "${title || 'Học liệu'}":
"${materialText.slice(0, 15000)}"

Hãy trả về phân tích dạng JSON với cấu trúc:
{
  "summary": "Tóm tắt ngắn gọn nội dung trọng tâm (3-5 câu)",
  "keyPoints": ["Luận điểm 1", "Luận điểm 2", "Luận điểm 3", ...],
  "suggestedTopics": ["Chủ đề gợi ý 1", "Chủ đề gợi ý 2", ...],
  "estimatedQuestionCount": 15
}`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const outputText = response.text ? response.text.trim() : '{}';
    const parsed = JSON.parse(outputText);
    res.json({ success: true, analysis: parsed });
  } catch (error: any) {
    console.error('Gemini analyze error:', error);
    res.status(500).json({ success: false, error: error?.message || 'Không thể phân tích học liệu' });
  }
});

// 4. API: AI Question Generator
app.post('/api/gemini/generate-questions', async (req, res) => {
  try {
    const {
      materialText,
      topic = 'Chung',
      source = 'Học liệu AI',
      count = 10,
      difficultyRatio = { easy: 40, medium: 40, hard: 20 },
      additionalPrompt = '',
      customApiKey,
      model = 'gemini-3.8-flash',
    } = req.body;

    const ai = getGenAIClient(customApiKey);
    if (!ai) {
      return res.status(400).json({ success: false, error: 'Chưa có Gemini API Key. Vui lòng thiết lập biến môi trường GEMINI_API_KEY hoặc nhập key trong phiên làm việc.' });
    }

    const targetCount = Math.max(1, Math.min(50, Number(count) || 10));

    const prompt = `Bạn là một chuyên gia khảo thí và sư phạm xuất sắc. Nhiệm vụ của bạn là tạo ${targetCount} câu hỏi trắc nghiệm khách quan 4 lựa chọn (A, B, C, D) dựa trên học liệu sau:

HỌC LIỆU:
${materialText ? materialText.slice(0, 20000) : 'Kiến thức tổng hợp về chủ đề ' + topic}

YÊU CẦU:
1. Số lượng câu hỏi: Đúng ${targetCount} câu hỏi.
2. Tỷ lệ độ khó: Khoảng ${difficultyRatio.easy}% Dễ, ${difficultyRatio.medium}% Trung bình, ${difficultyRatio.hard}% Khó.
3. Độ khó chỉ nhận một trong 3 giá trị: "Dễ", "Trung bình", "Khó".
4. Chủ đề: "${topic}". Nguồn: "${source}".
5. Mỗi câu hỏi phải có 4 phương án rõ ràng (A, B, C, D). Chỉ CÓ ĐÚNG 1 phương án chính xác.
6. Giá trị "correctIndex" là chỉ số đáp án đúng từ 0 đến 3 (0 tương ứng phương án thứ nhất, 1 thứ hai, 2 thứ ba, 3 thứ tư).
7. Có lời giải thích ngắn gọn, sư phạm, chuẩn xác tại trường "explanation".
${additionalPrompt ? `YÊU CẦU BỔ SUNG TỪ GIÁO VIÊN: ${additionalPrompt}` : ''}

Trả về một danh sách các câu hỏi theo đúng định dạng JSON Array.`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING, description: 'Nội dung câu hỏi trắc nghiệm' },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Danh sách 4 phương án lựa chọn A, B, C, D'
              },
              correctIndex: { type: Type.INTEGER, description: 'Chỉ số của đáp án đúng (0, 1, 2 hoặc 3)' },
              explanation: { type: Type.STRING, description: 'Giải thích chi tiết vì sao đáp án đúng' },
              difficulty: { type: Type.STRING, description: 'Dễ, Trung bình hoặc Khó' },
              topic: { type: Type.STRING, description: 'Chủ đề của câu hỏi' }
            },
            required: ['question', 'options', 'correctIndex', 'explanation', 'difficulty']
          }
        }
      }
    });

    const rawText = response.text ? response.text.trim() : '[]';
    let questionsRaw: any[] = [];
    try {
      questionsRaw = JSON.parse(rawText);
    } catch {
      // Fallback regex extraction if needed
      const jsonMatch = rawText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        questionsRaw = JSON.parse(jsonMatch[0]);
      }
    }

    // Format questions into unified Question model with DRAFT status
    const now = Date.now();
    const formattedQuestions = questionsRaw.map((q: any, idx: number) => {
      const options = Array.isArray(q.options) && q.options.length >= 4
        ? q.options.slice(0, 4)
        : [
            q.options?.[0] || 'Phương án A',
            q.options?.[1] || 'Phương án B',
            q.options?.[2] || 'Phương án C',
            q.options?.[3] || 'Phương án D'
          ];
      const correctIndex = (typeof q.correctIndex === 'number' && q.correctIndex >= 0 && q.correctIndex <= 3)
        ? q.correctIndex
        : 0;

      let difficulty: 'Dễ' | 'Trung bình' | 'Khó' = 'Trung bình';
      if (q.difficulty === 'Dễ' || q.difficulty === 'Dễ / Nhận biết') difficulty = 'Dễ';
      else if (q.difficulty === 'Khó' || q.difficulty === 'Vận dụng cao') difficulty = 'Khó';

      return {
        id: `ai_${now}_${idx + 1}`,
        question: q.question || `Câu hỏi số ${idx + 1}`,
        options,
        correctIndex,
        explanation: q.explanation || 'Chưa có giải thích chi tiết.',
        difficulty,
        topic: q.topic || topic || 'Chung',
        source: source || 'AI Question Generator',
        status: 'draft', // DRAFT: giáo viên phải duyệt trước khi xuất bản cho học sinh
        createdAt: new Date().toISOString()
      };
    });

    res.json({
      success: true,
      questions: formattedQuestions,
      count: formattedQuestions.length
    });
  } catch (error: any) {
    console.error('Gemini generate questions error:', error);
    res.status(500).json({ success: false, error: error?.message || 'Lỗi sinh câu hỏi từ Gemini AI' });
  }
});

// 5. API: Duplicate Game Physical HTML File
app.post('/api/games/duplicate', async (req, res) => {
  try {
    const { sourceUrl, newFileName } = req.body;
    if (!sourceUrl || typeof sourceUrl !== 'string') {
      return res.status(400).json({ success: false, error: 'Thiếu đường dẫn file nguồn (sourceUrl)' });
    }

    const cleanSource = path.basename(sourceUrl.split('?')[0]);
    if (!cleanSource.endsWith('.html')) {
      return res.status(400).json({ success: false, error: 'File nguồn phải là định dạng HTML' });
    }

    const publicDir = path.resolve(__dirname, 'public');
    const distDir = path.resolve(__dirname, 'dist');
    const sourcePath = path.join(publicDir, cleanSource);

    if (!fs.existsSync(sourcePath)) {
      return res.status(404).json({ success: false, error: `Không tìm thấy file nguồn: ${cleanSource}` });
    }

    let targetFileName = newFileName ? path.basename(newFileName) : '';
    if (!targetFileName || !targetFileName.endsWith('.html')) {
      const baseName = path.basename(cleanSource, '.html');
      targetFileName = `${baseName}_copy_${Date.now()}.html`;
    }

    const targetPublicPath = path.join(publicDir, targetFileName);
    await fsPromises.copyFile(sourcePath, targetPublicPath);

    // Đồng thời copy sang dist/ nếu dist/ tồn tại
    if (fs.existsSync(distDir)) {
      const targetDistPath = path.join(distDir, targetFileName);
      await fsPromises.copyFile(sourcePath, targetDistPath);
    }

    res.json({
      success: true,
      message: `Đã nhân bản file thành công sang ${targetFileName}`,
      newUrl: `/${targetFileName}`,
      newFileName: targetFileName
    });
  } catch (error: any) {
    console.error('Game duplicate error:', error);
    res.status(500).json({ success: false, error: error?.message || 'Lỗi nhân bản file game' });
  }
});

// 6. API: Delete Game Physical HTML File
app.post('/api/games/delete', async (req, res) => {
  try {
    const { fileUrl } = req.body;
    if (!fileUrl || typeof fileUrl !== 'string') {
      return res.status(400).json({ success: false, error: 'Thiếu đường dẫn file cần xóa (fileUrl)' });
    }

    const cleanFile = path.basename(fileUrl.split('?')[0]);
    if (!cleanFile.endsWith('.html')) {
      return res.status(400).json({ success: false, error: 'Chỉ được phép xóa file HTML' });
    }

    const publicDir = path.resolve(__dirname, 'public');
    const distDir = path.resolve(__dirname, 'dist');
    const publicPath = path.join(publicDir, cleanFile);
    const distPath = path.join(distDir, cleanFile);

    let deletedCount = 0;
    if (fs.existsSync(publicPath)) {
      await fsPromises.unlink(publicPath);
      deletedCount++;
    }
    if (fs.existsSync(distPath)) {
      await fsPromises.unlink(distPath);
      deletedCount++;
    }

    res.json({
      success: true,
      message: `Đã xóa vĩnh viễn file ${cleanFile} khỏi hệ thống (${deletedCount} vị trí lưu trữ)`,
      fileName: cleanFile
    });
  } catch (error: any) {
    console.error('Game delete error:', error);
    res.status(500).json({ success: false, error: error?.message || 'Lỗi xóa file game vật lý' });
  }
});

function formatMathStringToTeX(rawContent: any): any {
  if (typeof rawContent !== 'string') return rawContent;

  let cleanContent = rawContent;

  // ÉP BUỘC: Sử dụng chính xác bộ lọc xử lý dữ liệu từ file mẫu của giáo viên để quét sạch lỗi sinh chữ \f thừa đứng trước \frac
  cleanContent = cleanContent.replace(/\\f\\frac/g, '\\frac')
                             .replace(/\\f\s*\\frac/g, '\\frac')
                             .replace(/\\ffrac/g, '\\frac')
                             .replace(/\\f/g, ''); // Khử sạch các ký tự \f cô độc

  // Phục hồi chữ "frac" nếu hệ thống cũ lỡ làm gãy chữ thành "rac"
  cleanContent = cleanContent.replace(/\brac\b/g, '\\frac').replace(/rac/g, '\\frac');

  // Tự động chèn khoảng trắng mảnh ngăn dính chữ tiếng Việt (Ví dụ: "0trong", "]là:")
  cleanContent = cleanContent.replace(/(\d+)(trong|đoạn|là|có)/g, '$1 $2');
  let cleanStr = cleanContent;
  cleanStr = cleanStr.replace(/(\))(trong|đoạn|là)/g, '$1 $2');
  cleanContent = cleanStr;
  cleanContent = cleanContent.replace(/\]là\:/g, '\] là:');

  // Khử hoàn toàn lỗi lặp dấu gạch chéo (double escape) bảo vệ các ký hiệu \sqrt, \le, \ge, \ne
  cleanContent = cleanContent.replace(/\\\\/g, '\\');

  return cleanContent;
}

function escapeRawLaTeXSlash(rawStr: any): any {
  if (typeof rawStr !== 'string') return rawStr || '';
  let safeStr = formatMathStringToTeX(rawStr);
  safeStr = safeStr.replace(/\\f\\f/g, '').replace(/\\f(?![a-zA-Z])/g, '').replace(/[\u000c\x0c]/g, '');
  const strictKeywords = [
    'frac', 'sqrt', 'cdot', 'ne', 'neq', 'le', 'leq', 'ge', 'geq',
    'perp', 'parallel', 'alpha', 'beta', 'cup', 'cap', 'in'
  ];
  strictKeywords.forEach(keyword => {
    const regexNoSlash = new RegExp(`(?<!\\\\)\\b${keyword}\\b`, 'g');
    safeStr = safeStr.replace(regexNoSlash, `\\\\${keyword}`);
    const regexSingleSlash = new RegExp(`(?<!\\\\)\\\\(?!\\\\)${keyword}\\b`, 'g');
    safeStr = safeStr.replace(regexSingleSlash, `\\\\${keyword}`);
  });
  return safeStr;
}

function sanitizeObjectLaTeXSlashes<T>(obj: T): T {
  if (typeof obj === 'string') return formatMathStringToTeX(escapeRawLaTeXSlash(obj));
  if (Array.isArray(obj)) return obj.map(item => sanitizeObjectLaTeXSlashes(item)) as unknown as T;
  if (obj !== null && typeof obj === 'object') {
    const res: any = {};
    for (const key of Object.keys(obj)) {
      res[key] = sanitizeObjectLaTeXSlashes((obj as any)[key]);
    }
    return res;
  }
  return obj;
}

// 7. API: Sync Physical Game HTML File (Data Override)
app.post('/api/games/sync-html', async (req, res) => {
  try {
    const { fileUrl, htmlContent, quizData, gameDatabase, penaltyDatabase, questions } = req.body;
    if (!fileUrl || typeof fileUrl !== 'string') {
      return res.status(400).json({ success: false, error: 'Thiếu đường dẫn file (fileUrl)' });
    }

    const cleanFile = path.basename(fileUrl.split('?')[0]);
    if (!cleanFile.endsWith('.html')) {
      return res.status(400).json({ success: false, error: 'Chỉ hỗ trợ đồng bộ file định dạng HTML' });
    }

    const publicDir = path.resolve(__dirname, 'public');
    const distDir = path.resolve(__dirname, 'dist');
    const publicPath = path.join(publicDir, cleanFile);

    let finalHtml = htmlContent;

    // Nếu không truyền trực tiếp htmlContent mà truyền dữ liệu JSON
    if (!finalHtml) {
      if (!fs.existsSync(publicPath)) {
        return res.status(404).json({ success: false, error: `Không tìm thấy file nguồn: ${cleanFile}` });
      }

      let existingHtml = await fsPromises.readFile(publicPath, 'utf-8');

      // 1. Đồng bộ quizData
      const effectiveQuizData = quizData || questions;
      if (effectiveQuizData && Array.isArray(effectiveQuizData)) {
        const sanitizedQuiz = sanitizeObjectLaTeXSlashes(effectiveQuizData);
        const jsonStr = JSON.stringify(sanitizedQuiz, null, 2);
        const scriptInject = `<script id="__PHYSICAL_SYNC_QUIZDATA__">\nwindow.quizData = ${jsonStr};\nwindow.__INJECTED_CANGUA_DATA__ = ${jsonStr};\nvar QUESTION_BANK = window.quizData;\nvar questions = window.quizData;\n</script>`;
        
        if (existingHtml.includes('id="__PHYSICAL_SYNC_QUIZDATA__"')) {
          existingHtml = existingHtml.replace(/<script id="__PHYSICAL_SYNC_QUIZDATA__">[\s\S]*?<\/script>/i, scriptInject);
        } else if (existingHtml.includes('</head>')) {
          existingHtml = existingHtml.replace('</head>', `${scriptInject}\n</head>`);
        } else {
          existingHtml = `${scriptInject}\n${existingHtml}`;
        }
      }

      // 2. Đồng bộ gameDatabase
      if (gameDatabase && typeof gameDatabase === 'object') {
        const sanitizedDb = sanitizeObjectLaTeXSlashes(gameDatabase);
        const jsonDbStr = JSON.stringify(sanitizedDb, null, 2);
        const scriptDbInject = `<script id="__PHYSICAL_SYNC_GAMEDATABASE__">\nwindow.gameDatabase = ${jsonDbStr};\nwindow.__INJECTED_TETRIS_DATA__ = ${jsonDbStr};\nwindow.__INJECTED_MARIO_DATA__ = ${jsonDbStr};\nwindow.__INJECTED_GAME_DATABASE__ = ${jsonDbStr};\n</script>`;
        
        if (existingHtml.includes('id="__PHYSICAL_SYNC_GAMEDATABASE__"')) {
          existingHtml = existingHtml.replace(/<script id="__PHYSICAL_SYNC_GAMEDATABASE__">[\s\S]*?<\/script>/i, scriptDbInject);
        } else if (existingHtml.includes('</head>')) {
          existingHtml = existingHtml.replace('</head>', `${scriptDbInject}\n</head>`);
        } else {
          existingHtml = `${scriptDbInject}\n${existingHtml}`;
        }
      }

      // 3. Đồng bộ penaltyDatabase
      if (penaltyDatabase && typeof penaltyDatabase === 'object') {
        const sanitizedPen = sanitizeObjectLaTeXSlashes(penaltyDatabase);
        const jsonPenStr = JSON.stringify(sanitizedPen, null, 2);
        const scriptPenInject = `<script id="__PHYSICAL_SYNC_PENALTY__">\nwindow.penaltyDatabase = ${jsonPenStr};\nvar penaltyDatabase = ${jsonPenStr};\n</script>`;
        if (existingHtml.includes('id="__PHYSICAL_SYNC_PENALTY__"')) {
          existingHtml = existingHtml.replace(/<script id="__PHYSICAL_SYNC_PENALTY__">[\s\S]*?<\/script>/i, scriptPenInject);
        } else if (existingHtml.includes('</head>')) {
          existingHtml = existingHtml.replace('</head>', `${scriptPenInject}\n</head>`);
        } else {
          existingHtml = `${scriptPenInject}\n${existingHtml}`;
        }
      }

      finalHtml = existingHtml;
    }

    if (finalHtml) {
      const teacherMathJaxCore = `
<script>
    window.MathJax = {
        tex: {
            inlineMath: [['\\\\(', '\\\\)'], ['$', '$']],
            displayMath: [['\\\\[', '\\\\]'], ['$$', '$$']],
            processEscapes: true
        },
        options: {
            ignoreHtmlClass: 'tex2jax_ignore',
            processHtmlClass: 'tex2jax_process'
        }
    };
</script>
<script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
<script async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
`;
      const existingMjRegex = /<script\b[^>]*>(?:(?!<\/script>)[\s\S])*?window\.MathJax\s*=(?:(?!<\/script>)[\s\S])*?<\/script>/i;
      if (existingMjRegex.test(finalHtml)) {
        finalHtml = finalHtml.replace(existingMjRegex, () => teacherMathJaxCore.trim());
      }
      if (finalHtml.includes('id="MathJax-script"')) {
        finalHtml = finalHtml.replace(/<script\b[^>]*id=["']MathJax-script["'][^>]*>[\s\S]*?<\/script>/gi, '');
      }
      if (!finalHtml.includes("processHtmlClass: 'tex2jax_process'")) {
        if (finalHtml.includes('</head>')) {
          finalHtml = finalHtml.replace('</head>', () => `${teacherMathJaxCore}\n</head>`);
        } else {
          finalHtml = `${teacherMathJaxCore}\n${finalHtml}`;
        }
      }

      if (!finalHtml.includes('id="mathjax-no-bounding-box-style"')) {
        const mathjaxNoBoxStyle = `
<style id="mathjax-no-bounding-box-style">
/* Triệt tiêu hoàn toàn viền hình chữ nhật gỡ lỗi của MathJax và ép thẳng 1 dòng */
mjx-container, .mjx-chtml, mjx-math, mjx-mo, .zombie-math-text, .tex2jax_process, .math-content, .math-text, .MathJax, [class*="math-"] {
    outline: none !important;
    border: none !important;
    box-shadow: none !important;
    white-space: nowrap !important;
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
</style>
`;
        if (finalHtml.includes('</head>')) {
          finalHtml = finalHtml.replace('</head>', () => `${mathjaxNoBoxStyle}\n</head>`);
        } else {
          finalHtml = `${mathjaxNoBoxStyle}\n${finalHtml}`;
        }
      }
    }

    // Ghi đè vào public/
    await fsPromises.writeFile(publicPath, finalHtml, 'utf-8');

    // Đồng thời ghi đè vào dist/ nếu có
    if (fs.existsSync(distDir)) {
      const distPath = path.join(distDir, cleanFile);
      await fsPromises.writeFile(distPath, finalHtml, 'utf-8');
    }

    res.json({
      success: true,
      message: `Đã ghi đè đồng bộ dữ liệu vào file vật lý ${cleanFile} thành công!`,
      fileName: cleanFile
    });
  } catch (error: any) {
    console.error('Game sync HTML error:', error);
    res.status(500).json({ success: false, error: error?.message || 'Lỗi ghi đè file HTML vật lý' });
  }
});

// Setup Vite or Static
async function start() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EDUCATION APP v3.1 STABLE server running on http://0.0.0.0:${PORT}`);
  });
}

start();
