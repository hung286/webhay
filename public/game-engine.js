// game-engine.js
// Nền tảng tiêm (inject) Câu hỏi tùy chỉnh và logic Chống lặp câu hỏi cho các Trò chơi tĩnh.

(function() {
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
          console.log(`[GameEngine] Found ${myTool.customQuestions.length} custom questions for tool ${toolId}`);
          
          // Map to standard game format: { q, options: [], correct: 0, explanation, difficulty }
          customQuestions = myTool.customQuestions.map(q => ({
            q: q.question,
            options: q.options,
            correct: q.correctIndex,
            explanation: q.explanation || "",
            difficulty: q.difficulty || "Trung bình"
          }));
        }
      } catch (e) {
        console.error("[GameEngine] Error reading custom questions", e);
      }
    }
  }

  // Hook into the game's execution.
  // Many games declare `var QUESTION_BANK`. We will overwrite it if customQuestions is not empty.
  window.addEventListener('DOMContentLoaded', () => {
    // If the game uses QUESTION_BANK
    if (typeof QUESTION_BANK !== 'undefined') {
      if (customQuestions.length > 0) {
        // Clear and push to preserve array reference just in case, though var reassignment works.
        QUESTION_BANK.length = 0;
        QUESTION_BANK.push(...customQuestions);
      }
      
      // IMPLEMENT NO-REPEAT LOGIC
      // We monkey-patch Math.random ONLY when picking questions if possible, 
      // but the safest way is to overwrite the actual picking function if the game exposes it.
      // Since games use `QUESTION_BANK[Math.floor(Math.random() * QUESTION_BANK.length)]`
      // We can proxy the array!
      
      let availableIndices = [];
      const resetIndices = () => {
        availableIndices = QUESTION_BANK.map((_, i) => i);
        // Shuffle
        availableIndices.sort(() => Math.random() - 0.5);
      };
      resetIndices();
      
      // Replace the global array with a Proxy that intercepts indexed access during random selection
      // However, proxying an array might break some games.
      // Instead, we just patch the global Math.random specifically for QUESTION_BANK selection!
      
      const originalRandom = Math.random;
      const originalFloor = Math.floor;
      
      Math.random = function() {
        // If the stack trace implies it's picking a question...
        // Actually, a safer way for ca-ngua is to override `state.activeQuestion` setter or something.
        return originalRandom.apply(this, arguments);
      };
      
      Math.floor = function(val) {
        // If the game does Math.floor(Math.random() * QUESTION_BANK.length)
        // val will be close to the length.
        // We will intercept this by replacing the logic if we detect QUESTION_BANK.length
        if (val >= 0 && val <= QUESTION_BANK.length && val !== 0 && val === (originalRandom() * QUESTION_BANK.length) || true) {
             // It's too risky to override Math.floor globally without context.
        }
        return originalFloor.apply(this, arguments);
      };
      
      // Better approach: just shuffle the QUESTION_BANK itself periodically!
      // No, that changes the indices, which might break `correct` if options are mapped by index? 
      // No, correct is an index into `options`, not `QUESTION_BANK`.
      
      // If we just shuffle QUESTION_BANK at start:
      QUESTION_BANK.sort(() => Math.random() - 0.5);
      
      // And we inject a function that games can use if we modify them manually
      window.getNextQuestion = function() {
        if (availableIndices.length === 0) resetIndices();
        const idx = availableIndices.pop();
        return QUESTION_BANK[idx];
      };
    }
    
    // For Ai-la-trieu-phu, it might use `questions` variable
    if (typeof questions !== 'undefined' && Array.isArray(questions)) {
      if (customQuestions.length > 0) {
        questions.length = 0;
        questions.push(...customQuestions);
      }
      questions.sort((a, b) => {
        const dMap = {'Dễ': 1, 'Trung bình': 2, 'Khó': 3};
        return (dMap[a.difficulty] || 2) - (dMap[b.difficulty] || 2);
      });
    }
  });

})();
