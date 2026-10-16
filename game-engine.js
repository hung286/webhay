// game-engine.js
// NỀN TẢNG TIÊM CÂU HỎI THÔNG MINH (DATA ADAPTER ENGINE) & CHỐNG TRÙNG LẶP CÂU HỎI
// Tự động nhận diện cấu trúc từng trò chơi (F1, Chiến Hào, Sút Pen, Triệu Phú, Cá Ngựa...)
// và chuyển đổi dữ liệu câu hỏi phù hợp mà không cần sửa mã nguồn gốc của game.

(function() {
  // ========================================================
  // BỘ LỌC CHUỖI TOÀN CỤC (GLOBAL PICMATH SANITIZER)
  // ========================================================
  window.formatPicMathGlobal = function(rawInput, isCanvas = false) {
    if (!rawInput || typeof rawInput !== 'string') return rawInput || '';
    let text = rawInput.trim();

    // 1. Khử ký tự rác form-feed \f và phục hồi \frac
    text = text.replace(/\\f\\f/g, '').replace(/\\f/g, '').replace(/[\u000c\x0c]/g, '');
    text = text.replace(/\\?f?rac\{/g, '\\frac{');
    text = text.replace(/\brac\{/g, '\\frac{');

    // 2. Chuyển đổi toàn bộ \( ... \), \[ ... \] hoặc $ đơn về chuẩn $$ ... $$
    text = text.replace(/\\\(|\\\[/g, () => '$$');
    text = text.replace(/\\\)|\\\]/g, () => '$$');
    text = text.replace(/(?<!\$)\$(?!\$)(.*?)(?<!\$)\$(?!\$)/g, (m, g1) => '$$' + g1 + '$$');

    // 3. Vá lỗi dính chữ cdot, ký hiệu độ \do, căn thức và phân số mũ
    text = text.replace(/(\d*)\s*cdot\s*(\d*)/g, '$1 \\cdot $2');
    text = text.replace(/(?<!\\)cdot/g, '\\cdot');
    text = text.replace(/(?<!\\)Omega/g, '\\Omega');
    text = text.replace(/(?<!\\)emptyset/g, '\\emptyset');
    text = text.replace(/(?<!\\)cup/g, '\\cup');
    text = text.replace(/(?<!\\)cap/g, '\\cap');
    text = text.replace(/\\do\b/g, isCanvas ? '°' : '^{\\circ}');
    text = text.replace(/\\sqrt\s*\/?[xX]\s*-\s*1/g, '\\sqrt{x - 1}');
    text = text.replace(/\\sqrt\s+([a-zA-Z0-9]+)\s*([+\-])\s*([a-zA-Z0-9]+)/g, '\\sqrt{$1 $2 $3}');
    text = text.replace(/\^\{?([^}]+)\}?\/_?\{?([^}]+)\}?/g, '\\frac{$1}{$2}');
    text = text.replace(/x\^2/g, 'x^{2}');
    text = text.replace(/\\\\/g, '\\');

    // 4. Tách khoảng trắng chống dính chữ tiếng Việt với cặp dấu $$
    text = text.replace(/([a-zA-Zà-ỹÀ-Ỹ0-9])\$\$/g, (m, p1) => p1 + ' $$');
    text = text.replace(/\$\$([a-zA-Zà-ỹÀ-Ỹ0-9])/g, (m, p1) => '$$ ' + p1);

    // 5. Nếu vẽ lên HTML5 Canvas (biển Zombie, gạch Tetris): lọc sạch dấu $$ và mã LaTeX sang ký tự đọc được
    if (isCanvas) {
      text = text.replace(/\$\$/g, '')
                 .replace(/\^\{\\circ\}|\^\\circ/g, '°')
                 .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
                 .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
                 .replace(/\\cdot/g, '·')
                 .replace(/\\le/g, '≤').replace(/\\ge/g, '≥')
                 .trim();
      return text;
    }

    // 6. Tự động bọc $$ ... $$ nếu chuỗi là biểu thức toán chưa có delimiter
    if (!text.includes('$$')) {
      if (/[\\^_{}]|sqrt|frac|cdot|circ|le|ge|ne|Omega|cup|cap/.test(text)) {
        text = '$$' + text + '$$';
      }
    }

    return text;
  };
  window.normalizeSystemMathString = window.formatPicMathGlobal;
  window.formatMathStringToTeX = window.formatPicMathGlobal;

  const urlParams = new URLSearchParams(window.location.search);
  const toolId = urlParams.get('toolId');
  
  let customQuestions = [];
  
  if (toolId) {
    const rawData = localStorage.getItem('edu_teaching_tools_v38');
    if (rawData) {
      try {
        const tools = JSON.parse(rawData);
        const myTool = tools.find(t => t.id === toolId);
        
        if (myTool && myTool.customQuestions && myTool.customQuestions.length > 0) {
          console.log(`[GameEngine Adapter] Đã tìm thấy ${myTool.customQuestions.length} câu hỏi tùy chỉnh cho game: ${myTool.name} (id: ${toolId})`);
          
          customQuestions = myTool.customQuestions.map((q, idx) => ({
            id: q.id || `q_${idx}`,
            q: normalizeSystemMathString(q.question, false),
            options: (q.options || ['A', 'B', 'C', 'D']).map(o => normalizeSystemMathString(o, false)),
            correct: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
            explanation: normalizeSystemMathString(q.explanation || "", false),
            difficulty: q.difficulty === 'Dễ' ? 1 : (q.difficulty === 'Khó' ? 3 : 2)
          }));
        }
      } catch (e) {
        console.error("[GameEngine] Lỗi đọc dữ liệu câu hỏi:", e);
      }
    }
  }

  // Khởi chạy Data Adapter Engine khi DOM đã sẵn sàng
  window.addEventListener('DOMContentLoaded', () => {
    if (customQuestions.length === 0) return;

    // Gán biến toàn cục chuẩn cho mọi game
    window.quizData = customQuestions;

    // 1. NHÓM BIẾN VIẾT TẮT (VD: Đua xe F1 dùng rawQuestionData với o, c, sub)
    if (typeof rawQuestionData !== 'undefined' || (typeof state !== 'undefined' && state.questions)) {
      try {
        const adaptedF1 = customQuestions.map(q => ({
          type: "ABCD",
          q: q.q,
          o: q.options,
          c: q.correct,
          explanation: q.explanation
        }));
        if (typeof rawQuestionData !== 'undefined') {
          rawQuestionData.length = 0;
          rawQuestionData.push(...adaptedF1);
        }
        if (typeof state !== 'undefined' && state.questions) {
          state.questions = adaptedF1;
        }
        console.log("[GameEngine Adapter] Đã áp dụng câu hỏi cho nhóm Game F1 (o, c)");
      } catch (e) {
        console.error("[GameEngine] Lỗi adapter F1:", e);
      }
    }

    // 2. NHÓM SINH ĐỀ TỰ ĐỘNG (VD: Bảo vệ chiến hào dùng generateSessionQuestions, sessionQuestions)
    if (typeof sessionQuestions !== 'undefined') {
      try {
        const d1 = customQuestions.filter(q => q.difficulty === 1);
        const d2 = customQuestions.filter(q => q.difficulty === 2);
        const d3 = customQuestions.filter(q => q.difficulty === 3);
        sessionQuestions['level1'] = d1.length > 0 ? d1 : customQuestions;
        sessionQuestions['level2'] = d2.length > 0 ? d2 : customQuestions;
        sessionQuestions['level3'] = d3.length > 0 ? d3 : customQuestions;

        // Override hàm sinh đề ngẫu nhiên nếu có
        if (typeof generateSessionQuestions === 'function') {
          window.generateSessionQuestions = function() {
            sessionQuestions['level1'] = d1.length > 0 ? d1 : customQuestions;
            sessionQuestions['level2'] = d2.length > 0 ? d2 : customQuestions;
            sessionQuestions['level3'] = d3.length > 0 ? d3 : customQuestions;
          };
        }
        console.log("[GameEngine Adapter] Đã áp dụng câu hỏi và ngắt generator cho Bảo Vệ Chiến Hào");
      } catch (e) {
        console.error("[GameEngine] Lỗi adapter Chiến Hào:", e);
      }
    }

    // 3. NHÓM LEVEL PHÂN ĐỘ KHÓ (VD: Sút Pen dùng levels[0..2].questions)
    if (typeof levels !== 'undefined' && Array.isArray(levels)) {
      try {
        const d1 = customQuestions.filter(q => q.difficulty === 1);
        const d2 = customQuestions.filter(q => q.difficulty === 2);
        const d3 = customQuestions.filter(q => q.difficulty === 3);
        if (levels.length >= 1 && d1.length > 0) levels[0].questions = d1;
        if (levels.length >= 2 && d2.length > 0) levels[1].questions = d2;
        if (levels.length >= 3 && d3.length > 0) levels[2].questions = d3;
        console.log("[GameEngine Adapter] Đã áp dụng câu hỏi cho Sút Pen levels");
      } catch (e) {
        console.error("[GameEngine] Lỗi adapter levels:", e);
      }
    }

    // 4. NHÓM QUESTION LEVELS (VD: Bắn chim dùng questionLevels[1..3] với correct & wrongs)
    if (typeof questionLevels !== 'undefined') {
      try {
        for (let k in questionLevels) questionLevels[k] = [];
        customQuestions.forEach(q => {
          const diff = q.difficulty || 1;
          if (!questionLevels[diff]) questionLevels[diff] = [];
          questionLevels[diff].push({
            q: q.q,
            correct: q.options[q.correct] || q.options[0],
            wrongs: q.options.filter((_, idx) => idx !== q.correct),
            explanation: q.explanation
          });
        });
        console.log("[GameEngine Adapter] Đã áp dụng câu hỏi cho Bắn Chim (questionLevels)");
      } catch (e) {
        console.error("[GameEngine] Lỗi adapter questionLevels:", e);
      }
    }

    // 5. NHÓM POOLS (VD: Ai là triệu phú dùng easyPool, mediumPool, hardPool)
    if (typeof easyPool !== 'undefined') {
      try {
        const d1 = customQuestions.filter(q => q.difficulty === 1);
        const d2 = customQuestions.filter(q => q.difficulty === 2);
        const d3 = customQuestions.filter(q => q.difficulty === 3);
        easyPool = d1.length > 0 ? d1 : customQuestions;
        if (typeof mediumPool !== 'undefined') mediumPool = d2.length > 0 ? d2 : customQuestions;
        if (typeof hardPool !== 'undefined') hardPool = d3.length > 0 ? d3 : customQuestions;
        console.log("[GameEngine Adapter] Đã áp dụng câu hỏi cho Ai Là Triệu Phú (pools)");
      } catch (e) {
        console.error("[GameEngine] Lỗi adapter pools:", e);
      }
    }

    // 6. NHÓM CHUẨN: QUESTION_BANK (VD: Cá ngựa, Cầu cá, Rắn săn, Đạo hàm cấp 2...)
    if (typeof QUESTION_BANK !== 'undefined') {
      try {
        QUESTION_BANK.length = 0;
        QUESTION_BANK.push(...customQuestions);
        // Trộn đề chống trùng lặp
        QUESTION_BANK.sort(() => Math.random() - 0.5);
        console.log("[GameEngine Adapter] Đã áp dụng câu hỏi cho QUESTION_BANK");
      } catch (e) {
        console.error("[GameEngine] Lỗi adapter QUESTION_BANK:", e);
      }
    }

    // 7. NHÓM CHUẨN: questions
    if (typeof questions !== 'undefined' && Array.isArray(questions)) {
      try {
        questions.length = 0;
        questions.push(...customQuestions);
        questions.sort((a, b) => (a.difficulty || 2) - (b.difficulty || 2));
        console.log("[GameEngine Adapter] Đã áp dụng câu hỏi cho mảng questions");
      } catch (e) {
        console.error("[GameEngine] Lỗi adapter questions:", e);
      }
    }

    // Phát sự kiện toàn cục để game nhận biết cập nhật
    window.dispatchEvent(new CustomEvent('customQuestionsLoaded', { detail: customQuestions }));
  });

  // ========================================================
  // HỆ THỐNG DỌN DẸP SẠCH TRẠNG THÁI & THOÁT GAME (GLOBAL CLEANUP ON EXIT)
  // ========================================================
  function exitToMainMenu() {
    // 1. Dừng triệt để toàn bộ vòng lặp requestAnimationFrame và bộ đếm thời gian
    if (window.gameLoopId) cancelAnimationFrame(window.gameLoopId);
    if (window.animationFrameId) cancelAnimationFrame(window.animationFrameId);
    if (window.gameInterval) clearInterval(window.gameInterval);
    if (window.gameTimer) clearTimeout(window.gameTimer);
    try {
      const maxId = setTimeout(function(){}, 0);
      for (let i = 0; i <= maxId; i++) {
        clearTimeout(i);
        clearInterval(i);
      }
      const maxRaf = requestAnimationFrame(function(){});
      for (let i = 0; i <= maxRaf; i++) {
        cancelAnimationFrame(i);
      }
    } catch(e) {}

    // 2. Tắt toàn bộ âm thanh đang phát ngầm
    if (window.currentAudio) {
      try { window.currentAudio.pause(); window.currentAudio.currentTime = 0; } catch(e) {}
    }
    document.querySelectorAll('audio').forEach(function(a) {
      try { a.pause(); a.currentTime = 0; } catch(e) {}
    });
    if (window.SoundEngine && typeof window.SoundEngine.stopAll === 'function') {
      try { window.SoundEngine.stopAll(); } catch(e) {}
    }

    // 3. Xóa cờ trạng thái game đang chơi trong LocalStorage/SessionStorage
    try {
      localStorage.removeItem('active_game_id');
      localStorage.removeItem('current_playing_game');
      sessionStorage.removeItem('active_game_id');
      window.activeGame = null;
    } catch(e) {}

    // 4. Xóa sạch tham số game trên thanh địa chỉ URL (không làm reload trang)
    if (window.location.hash || window.location.search) {
      try { history.pushState("", document.title, window.location.pathname); } catch(e) {}
    }

    // Gửi thông báo thoát game về cửa sổ cha (nếu chạy trong iframe của LearningGamesMode hoặc trang-chu)
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'EXIT_GAME' }, '*');
      }
    } catch(e) {}

    // 5. Ẩn tất cả các container game và hiển thị lại Menu chính (Dashboard)
    document.querySelectorAll('.game-container, .game-screen, canvas').forEach(function(el) {
      el.style.display = 'none';
      el.classList.add('hidden');
    });

    const mainMenu = document.getElementById('main-menu') || 
                     document.getElementById('hub-container') || 
                     document.querySelector('.dashboard') || 
                     document.getElementById('main-dashboard') || 
                     document.getElementById('topic-selection-overlay') || 
                     document.getElementById('start-screen');
    if (mainMenu) {
      mainMenu.style.display = 'block';
      mainMenu.classList.remove('hidden');
    } else if (window.self === window.top) {
      // Nếu chơi trực tiếp độc lập không có khung Menu nội bộ, chuyển hướng về trang chủ
      window.location.href = '/trang-chu.html';
    }
  }

  window.exitToMainMenu = exitToMainMenu;
  window.exitGame = exitToMainMenu;
  window.returnToMenu = exitToMainMenu;
  window.exitGameOrMenu = exitToMainMenu;
})();
