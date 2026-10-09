// script.js

// State
let currentState = {
    type: 'cubic',
    params: { a: 1/3, b: -1, c: 0, d: 2, e: 0 },
    showTangent: false
};

// JXG Board and objects
let board = null;
let graphCurve = null;
let tangentLine = null;
let tangentPoint = null;
let extraPoints = [];

// DOM Elements
const funcTypeSelect = document.getElementById('func-type');
const coefInputsDiv = document.getElementById('coef-inputs');
const showTangentCheck = document.getElementById('show-tangent');
const solutionOutput = document.getElementById('solution-output');
const bbtContainer = document.getElementById('bbt-container');
const tangentInfoBox = document.getElementById('tangent-info');
const tangentMathBox = document.getElementById('tangent-math');

// Function configurations
const funcConfigs = {
    linear: {
        labels: ['a', 'b'],
        defaultParams: { a: 2, b: -3 },
        fn: (p) => (x) => p.a * x + p.b,
        dfn: (p) => (x) => p.a
    },
    quadratic: {
        labels: ['a', 'b', 'c'],
        defaultParams: { a: 1, b: -4, c: 3 },
        fn: (p) => (x) => p.a * x * x + p.b * x + p.c,
        dfn: (p) => (x) => 2 * p.a * x + p.b
    },
    cubic: {
        labels: ['a', 'b', 'c', 'd'],
        defaultParams: { a: 1/3, b: -1, c: 0, d: 2 },
        fn: (p) => (x) => p.a * Math.pow(x, 3) + p.b * Math.pow(x, 2) + p.c * x + p.d,
        dfn: (p) => (x) => 3 * p.a * Math.pow(x, 2) + 2 * p.b * x + p.c
    },
    quartic: {
        labels: ['a', 'b', 'c'],
        defaultParams: { a: 1, b: -2, c: -3 },
        fn: (p) => (x) => p.a * Math.pow(x, 4) + p.b * Math.pow(x, 2) + p.c,
        dfn: (p) => (x) => 4 * p.a * Math.pow(x, 3) + 2 * p.b * x
    },
    rational11: {
        labels: ['a', 'b', 'c', 'd'],
        defaultParams: { a: 1, b: 1, c: 1, d: -1 },
        fn: (p) => (x) => (p.a * x + p.b) / (p.c * x + p.d),
        dfn: (p) => (x) => (p.a * p.d - p.b * p.c) / Math.pow(p.c * x + p.d, 2)
    },
    rational21: {
        labels: ['a', 'b', 'c', 'd', 'e'],
        defaultParams: { a: 1, b: -2, c: 2, d: 1, e: -1 },
        fn: (p) => (x) => (p.a * x * x + p.b * x + p.c) / (p.d * x + p.e),
        dfn: (p) => (x) => {
            const u = p.a * x * x + p.b * x + p.c;
            const du = 2 * p.a * x + p.b;
            const v = p.d * x + p.e;
            const dv = p.d;
            return (du * v - u * dv) / Math.pow(v, 2);
        }
    },
    exponential: {
        labels: ['a'],
        defaultParams: { a: 2 },
        fn: (p) => (x) => Math.pow(p.a, x),
        dfn: (p) => (x) => Math.pow(p.a, x) * Math.log(p.a)
    },
    logarithmic: {
        labels: ['a'],
        defaultParams: { a: 2 },
        fn: (p) => (x) => Math.log(x) / Math.log(p.a),
        dfn: (p) => (x) => 1 / (x * Math.log(p.a))
    }
};

// Math Engine
const MathEngine = {
    linear: function(a, b) {
        let steps = [];
        steps.push(`**1. Tập xác định:** $D = \\mathbb{R}$`);
        steps.push(`**2. Sự biến thiên:**`);
        steps.push(`- Đạo hàm: $y' = ${a}$`);
        steps.push(`- Do $y' ${a > 0 ? '> 0' : '< 0}$, hàm số **${a > 0 ? 'đồng biến' : 'nghịch biến'}** trên $\\mathbb{R}$.`);
        steps.push(`- Hàm số không có cực trị.`);
        steps.push(`**3. Đồ thị:** Đường thẳng đi qua $(0; ${b})$ và $(${a !== 0 ? (-b/a).toFixed(2) : 0}; 0)$.`);
        return { text: steps.join('<br><br>'), bbtData: { type: 'linear', a } };
    },

    quadratic: function(a, b, c) {
        let steps = [];
        let xv = -b / (2 * a);
        let yv = a * xv * xv + b * xv + c;
        steps.push(`**1. Tập xác định:** $D = \\mathbb{R}$`);
        steps.push(`**2. Sự biến thiên:**`);
        steps.push(`- Đạo hàm: $y' = ${2*a}x ${b >= 0 ? '+ ' + b : b}$`);
        steps.push(`- $y' = 0 \\iff x = ${xv.toFixed(2)}$`);
        steps.push(`- Đỉnh Parabol: $I(${xv.toFixed(2)}; ${yv.toFixed(2)})$`);
        if (a > 0) {
            steps.push(`- Hàm số **nghịch biến** trên $(-\\infty; ${xv.toFixed(2)})$ và **đồng biến** trên $(${xv.toFixed(2)}; +\\infty)$.`);
            steps.push(`- Cực tiểu tại $x = ${xv.toFixed(2)}, y_{CT} = ${yv.toFixed(2)}$.`);
        } else {
            steps.push(`- Hàm số **đồng biến** trên $(-\\infty; ${xv.toFixed(2)})$ và **nghịch biến** trên $(${xv.toFixed(2)}; +\\infty)$.`);
            steps.push(`- Cực đại tại $x = ${xv.toFixed(2)}, y_{CĐ} = ${yv.toFixed(2)}$.`);
        }
        steps.push(`**3. Đồ thị:** Parabol nhận đường thẳng $x = ${xv.toFixed(2)}$ làm trục đối xứng.`);
        return { text: steps.join('<br><br>'), bbtData: { type: 'quadratic', a, xv, yv } };
    },

    cubic: function(a, b, c, d) {
        let steps = [];
        steps.push(`**1. Tập xác định:** $D = \\mathbb{R}$`);
        let da = 3 * a, db = 2 * b, dc = c;
        steps.push(`**2. Sự biến thiên:**`);
        steps.push(`- Giới hạn: $\\lim\\limits_{x \\to -\\infty} y = ${a > 0 ? '-\\infty' : '+\\infty'}$, $\\lim\\limits_{x \\to +\\infty} y = ${a > 0 ? '+\\infty' : '-\\infty'}$`);
        
        steps.push(`- Đạo hàm: $y' = ${da}x^2 ${db >= 0 ? '+ ' + db : db}x ${dc >= 0 ? '+ ' + dc : dc}$`);
        
        let delta = db * db - 4 * da * dc;
        let roots = [];
        let bbtData = { type: 'cubic', a: a, roots: [], extrema: [] };

        if (delta > 0) {
            let x1 = (-db - Math.sqrt(delta)) / (2 * da);
            let x2 = (-db + Math.sqrt(delta)) / (2 * da);
            roots = [Math.min(x1, x2), Math.max(x1, x2)];
            let y1 = a*Math.pow(roots[0],3) + b*Math.pow(roots[0],2) + c*roots[0] + d;
            let y2 = a*Math.pow(roots[1],3) + b*Math.pow(roots[1],2) + c*roots[1] + d;
            bbtData.roots = roots;
            bbtData.extrema = [y1, y2];
            
            steps.push(`- $y' = 0 \\iff \\begin{cases} x = ${roots[0].toFixed(2)} \\\\ x = ${roots[1].toFixed(2)} \\end{cases}$`);
            if (a > 0) {
                steps.push(`- Hàm số **đồng biến** trên $(-\\infty; ${roots[0].toFixed(2)})$ và $(${roots[1].toFixed(2)}; +\\infty)$.`);
                steps.push(`- Hàm số **nghịch biến** trên $(${roots[0].toFixed(2)}; ${roots[1].toFixed(2)})$.`);
                steps.push(`- Cực đại: $x = ${roots[0].toFixed(2)}, y_{CĐ} = ${y1.toFixed(2)}$.`);
                steps.push(`- Cực tiểu: $x = ${roots[1].toFixed(2)}, y_{CT} = ${y2.toFixed(2)}$.`);
            } else {
                steps.push(`- Hàm số **nghịch biến** trên $(-\\infty; ${roots[0].toFixed(2)})$ và $(${roots[1].toFixed(2)}; +\\infty)$.`);
                steps.push(`- Hàm số **đồng biến** trên $(${roots[0].toFixed(2)}; ${roots[1].toFixed(2)})$.`);
                steps.push(`- Cực tiểu: $x = ${roots[0].toFixed(2)}, y_{CT} = ${y1.toFixed(2)}$.`);
                steps.push(`- Cực đại: $x = ${roots[1].toFixed(2)}, y_{CĐ} = ${y2.toFixed(2)}$.`);
            }
        } else if (delta === 0) {
            let x0 = -db / (2 * da);
            steps.push(`- $y' = 0 \\iff x = ${x0.toFixed(2)}$ (nghiệm kép).`);
            steps.push(`- Hàm số **${a > 0 ? 'đồng biến' : 'nghịch biến'}** trên $\\mathbb{R}$, không có cực trị.`);
            bbtData.roots = [x0];
        } else {
            steps.push(`- Hàm số **${a > 0 ? 'đồng biến' : 'nghịch biến'}** trên $\\mathbb{R}$, không có cực trị.`);
        }

        let xu = -b / (3 * a);
        let yu = a*Math.pow(xu,3) + b*Math.pow(xu,2) + c*xu + d;
        steps.push(`**3. Đồ thị:**`);
        steps.push(`- Điểm uốn: $U(${xu.toFixed(2)}; ${yu.toFixed(2)})$`);
        
        return { text: steps.join('<br><br>'), bbtData, xu, yu, roots };
    },

    quartic: function(a, b, c) {
        let steps = [];
        steps.push(`**1. Tập xác định:** $D = \\mathbb{R}$`);
        steps.push(`**2. Sự biến thiên:**`);
        steps.push(`- Đạo hàm: $y' = ${4*a}x^3 ${2*b >= 0 ? '+ ' + 2*b : 2*b}x$`);
        
        let roots = [0];
        let extrema = [c];
        
        if (-b / (2 * a) > 0) {
            let x1 = Math.sqrt(-b / (2 * a));
            roots = [-x1, 0, x1];
            let y1 = a*Math.pow(x1, 4) + b*x1*x1 + c;
            extrema = [y1, c, y1];
            steps.push(`- $y' = 0 \\iff x = 0$ hoặc $x = \\pm ${x1.toFixed(2)}$ (Có 3 điểm cực trị).`);
        } else {
            steps.push(`- $y' = 0 \\iff x = 0$ (Có 1 điểm cực trị).`);
        }
        steps.push(`**3. Đồ thị:** Nhận trục $Oy$ làm trục đối xứng.`);
        
        return { text: steps.join('<br><br>'), bbtData: { type: 'quartic', a, roots, extrema } };
    },

    rational11: function(a, b, c, d) {
        let steps = [];
        if (c === 0) return { text: "Cần c ≠ 0 để là hàm phân thức.", bbtData: null };
        let x0 = -d / c;
        let det = a * d - b * c;
        
        steps.push(`**1. Tập xác định:** $D = \\mathbb{R} \\setminus \\{${x0.toFixed(2)}\\}$`);
        steps.push(`**2. Sự biến thiên:**`);
        steps.push(`- Đạo hàm: $y' = \\frac{${det}}{(cx + d)^2}$`);
        steps.push(`- TCĐ: $x = ${x0.toFixed(2)}$, TCN: $y = ${(a/c).toFixed(2)}$`);
        steps.push(`- Do $y' ${det > 0 ? '> 0' : '< 0}$, hàm số **${det > 0 ? 'đồng biến' : 'nghịch biến'}** trên từng khoảng xác định.`);
        steps.push(`- Hàm số không có cực trị.`);
        steps.push(`**3. Đồ thị:** Tâm đối xứng $I(${x0.toFixed(2)}; ${(a/c).toFixed(2)})$.`);
        
        return { text: steps.join('<br><br>'), bbtData: { type: 'rational11', a, c, x0, y0: a/c, det }, x0, y0: a/c };
    },

    rational21: function(a, b, c, d, e) {
        let steps = [];
        let x0 = -e / d;
        let A = a / d;
        let B = (b - A * e) / d;
        steps.push(`**1. Tập xác định:** $D = \\mathbb{R} \\setminus \\{${x0.toFixed(2)}\\}$`);
        steps.push(`**2. Sự biến thiên:**`);
        steps.push(`- TCĐ: $x = ${x0.toFixed(2)}$`);
        steps.push(`- TCX: $y = ${A.toFixed(2)}x ${B >= 0 ? '+ ' + B.toFixed(2) : B.toFixed(2)}$`);
        steps.push(`**3. Đồ thị:** Tâm đối xứng là giao điểm 2 tiệm cận.`);
        
        return { text: steps.join('<br><br>'), bbtData: { type: 'rational21', x0, A, B }, x0 };
    },

    exponential: function(a) {
        if (a <= 0 || a === 1) return { text: "Cần cơ số a > 0 và a ≠ 1", bbtData: null };
        return { 
            text: `**1. TXĐ:** $D = \\mathbb{R}$<br><br>**2. Biến thiên:** $y' = ${a}^x \\ln(${a})$<br><br>- TCN: $y = 0$<br><br>- Hàm số **${a > 1 ? 'đồng biến' : 'nghịch biến'}** trên $\\mathbb{R}$.<br><br>**3. Đồ thị:** Qua $(0; 1)$ và $(1; ${a})$.`,
            bbtData: { type: 'exponential', a }
        };
    },

    logarithmic: function(a) {
        if (a <= 0 || a === 1) return { text: "Cần cơ số a > 0 và a ≠ 1", bbtData: null };
        return { 
            text: `**1. TXĐ:** $D = (0; +\\infty)$<br><br>**2. Biến thiên:** $y' = \\frac{1}{x \\ln(${a})}$<br><br>- TCĐ: $x = 0$<br><br>- Hàm số **${a > 1 ? 'đồng biến' : 'nghịch biến'}** trên $(0; +\\infty)$.<br><br>**3. Đồ thị:** Qua $(1; 0)$ và $(${a}; 1)$.`,
            bbtData: { type: 'logarithmic', a }
        };
    }
};

// Render BBT Generic fallback if not fully drawn
function renderBBT(bbtData) {
    if (!bbtData) {
        bbtContainer.innerHTML = '';
        return;
    }

    let html = '';
    // Lấy nguyên logic vẽ bảng của cubic, rational11 từ code cũ và làm thêm các hàm khác một cách đơn giản
    
    if (['linear', 'exponential', 'logarithmic'].includes(bbtData.type) || (bbtData.type === 'cubic' && bbtData.roots.length <= 1) || (bbtData.type === 'quartic' && bbtData.roots.length === 1)) {
        let isIncreasing = bbtData.a > (bbtData.type === 'exponential' || bbtData.type === 'logarithmic' ? 1 : 0);
        const s = isIncreasing ? '+' : '-';
        const y1 = isIncreasing ? '-\\infty' : '+\\infty';
        const y2 = isIncreasing ? '+\\infty' : '-\\infty';
        
        let startX = bbtData.type === 'logarithmic' ? '0' : '-\\infty';

        html = `
        <table class="bbt-table">
            <tr><th>$x$</th><td>$${startX}$</td><td>$+\\infty$</td></tr>
            <tr><th>$y'$</th><td colspan="2">${s}</td></tr>
            <tr>
                <th>$y$</th>
                <td colspan="2" class="bbt-svg-container">
                    <svg width="100%" height="80px" viewBox="0 0 600 80" preserveAspectRatio="none">
                        <defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="black"/></marker></defs>
                        <line x1="20" y1="${isIncreasing?60:20}" x2="580" y2="${isIncreasing?20:60}" stroke="black" stroke-width="1.5" marker-end="url(#arrow)" />
                        <text x="30" y="${isIncreasing?75:15}" font-size="14" font-family="serif" text-anchor="middle">$${bbtData.type==='exponential'?'0':y1}$</text>
                        <text x="570" y="${isIncreasing?15:75}" font-size="14" font-family="serif" text-anchor="middle">$${y2}$</text>
                    </svg>
                </td>
            </tr>
        </table>`;
    } 
    else if (bbtData.type === 'quadratic' || (bbtData.type === 'cubic' && bbtData.roots.length === 2)) {
        // Draw 3 columns
        let r1, r2, y1, y2, isUp, s1, s2, s3;
        
        if (bbtData.type === 'quadratic') {
            r1 = bbtData.xv.toFixed(2);
            y1 = bbtData.yv.toFixed(2);
            isUp = bbtData.a > 0;
            
            html = `
            <table class="bbt-table">
                <tr><th>$x$</th><td>$-\\infty$</td><td>$${r1}$</td><td>$+\\infty$</td></tr>
                <tr><th>$y'$</th><td>${isUp?'-':'+'}</td><td>0</td><td>${isUp?'+':'-'}</td></tr>
                <tr>
                    <th>$y$</th>
                    <td colspan="3" class="bbt-svg-container">
                        <svg width="100%" height="80px" viewBox="0 0 600 80" preserveAspectRatio="none">
                            <defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="black"/></marker></defs>
                            <line x1="20" y1="${isUp?20:60}" x2="280" y2="${isUp?60:20}" stroke="black" stroke-width="1.5" marker-end="url(#arrow)" />
                            <line x1="320" y1="${isUp?60:20}" x2="580" y2="${isUp?20:60}" stroke="black" stroke-width="1.5" marker-end="url(#arrow)" />
                            <text x="30" y="${isUp?15:75}" font-size="14" font-family="serif" text-anchor="middle">$+\\infty$</text>
                            <text x="300" y="${isUp?75:15}" font-size="14" font-family="serif" text-anchor="middle">$${y1}$</text>
                            <text x="570" y="${isUp?15:75}" font-size="14" font-family="serif" text-anchor="middle">$+\\infty$</text>
                        </svg>
                    </td>
                </tr>
            </table>`;
        } else {
            // Cubic 2 roots
            r1 = bbtData.roots[0].toFixed(2); r2 = bbtData.roots[1].toFixed(2);
            y1 = bbtData.extrema[0].toFixed(2); y2 = bbtData.extrema[1].toFixed(2);
            let s = bbtData.a > 0 ? '+' : '-';
            let os = bbtData.a > 0 ? '-' : '+';
            let inf1 = bbtData.a > 0 ? '-\\infty' : '+\\infty';
            let inf2 = bbtData.a > 0 ? '+\\infty' : '-\\infty';
            
            html = `
            <table class="bbt-table">
                <tr><th>$x$</th><td>$-\\infty$</td><td>$${r1}$</td><td>$${r2}$</td><td>$+\\infty$</td></tr>
                <tr><th>$y'$</th><td>${s}</td><td>0</td><td>${os}</td><td>0</td><td>${s}</td></tr>
                <tr>
                    <th>$y$</th>
                    <td colspan="4" class="bbt-svg-container">
                        <svg width="100%" height="80px" viewBox="0 0 600 80" preserveAspectRatio="none">
                            <defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="black"/></marker></defs>
                            ${bbtData.a > 0 ? `
                                <line x1="20" y1="60" x2="180" y2="20" stroke="black" stroke-width="1.5" marker-end="url(#arrow)" />
                                <line x1="200" y1="20" x2="380" y2="60" stroke="black" stroke-width="1.5" marker-end="url(#arrow)" />
                                <line x1="400" y1="60" x2="580" y2="20" stroke="black" stroke-width="1.5" marker-end="url(#arrow)" />
                            ` : `
                                <line x1="20" y1="20" x2="180" y2="60" stroke="black" stroke-width="1.5" marker-end="url(#arrow)" />
                                <line x1="200" y1="60" x2="380" y2="20" stroke="black" stroke-width="1.5" marker-end="url(#arrow)" />
                                <line x1="400" y1="20" x2="580" y2="60" stroke="black" stroke-width="1.5" marker-end="url(#arrow)" />
                            `}
                            <text x="20" y="${bbtData.a>0?75:15}" font-size="14" font-family="serif" text-anchor="middle">$${inf1}$</text>
                            <text x="190" y="${bbtData.a>0?15:75}" font-size="14" font-family="serif" text-anchor="middle">$${y1}$</text>
                            <text x="390" y="${bbtData.a>0?75:15}" font-size="14" font-family="serif" text-anchor="middle">$${y2}$</text>
                            <text x="580" y="${bbtData.a>0?15:75}" font-size="14" font-family="serif" text-anchor="middle">$${inf2}$</text>
                        </svg>
                    </td>
                </tr>
            </table>`;
        }
    }
    else if (bbtData.type === 'quartic' && bbtData.roots.length === 3) {
        let [r1, r2, r3] = bbtData.roots.map(r => r.toFixed(2));
        let [y1, y2, y3] = bbtData.extrema.map(y => y.toFixed(2));
        let isUp = bbtData.a > 0;
        
        html = `
        <table class="bbt-table" style="font-size: 14px;">
            <tr><th>$x$</th><td>$-\\infty$</td><td>$${r1}$</td><td>$${r2}$</td><td>$${r3}$</td><td>$+\\infty$</td></tr>
            <tr><th>$y'$</th><td>${isUp?'-':'+'}</td><td>0</td><td>${isUp?'+':'-'}</td><td>0</td><td>${isUp?'-':'+'}</td><td>0</td><td>${isUp?'+':'-'}</td></tr>
            <tr>
                <th>$y$</th>
                <td colspan="5" style="text-align: center; padding: 10px;">
                    Biến thiên đồ thị hình chữ ${isUp?'W':'M'}
                </td>
            </tr>
        </table>`;
    }
    else if (bbtData.type === 'rational11' || bbtData.type === 'rational21') {
        const s = bbtData.det > 0 ? '+' : '-';
        
        html = `
        <table class="bbt-table">
            <tr>
                <th>$x$</th>
                <td style="width: 35%">$-\\infty$</td>
                <td style="width: 10%">$${bbtData.x0.toFixed(2)}$</td>
                <td style="width: 35%">$+\\infty$</td>
            </tr>
            <tr>
                <th>$y'$</th>
                <td>${s}</td>
                <td style="border-left: 2px double #999; border-right: 2px double #999;">||</td>
                <td>${s}</td>
            </tr>
            <tr>
                <th>$y$</th>
                <td colspan="3" class="bbt-svg-container" style="padding:0; position: relative;">
                    <div style="position: absolute; left: 50%; top: 0; bottom: 0; width: 4px; border-left: 2px double #999; transform: translateX(-50%);"></div>
                    <div style="padding: 20px;">Hàm số ${bbtData.det > 0 ? 'đồng biến' : 'nghịch biến'} trên từng khoảng xác định.</div>
                </td>
            </tr>
        </table>`;
    } else {
        html = `<div class="text-center italic text-gray-500 py-2">Bảng biến thiên đang được xây dựng cho dạng hàm này.</div>`;
    }

    bbtContainer.innerHTML = html;
}

// Build UI Inputs
function buildInputs() {
    const config = funcConfigs[currentState.type];
    coefInputsDiv.innerHTML = '';
    config.labels.forEach(lbl => {
        const div = document.createElement('div');
        div.className = 'flex flex-col';
        div.innerHTML = `
            <label class="text-xs text-gray-500 font-serif italic">${lbl}</label>
            <input type="number" step="0.1" id="input-${lbl}" value="${currentState.params[lbl]}" 
                class="border rounded p-1 text-center font-semibold text-gray-700 bg-gray-50 focus:bg-white focus:ring-1 focus:ring-blue-400 focus:outline-none">
        `;
        coefInputsDiv.appendChild(div);
        
        document.getElementById(`input-${lbl}`).addEventListener('input', (e) => {
            currentState.params[lbl] = parseFloat(e.target.value) || 0;
            updateApp();
        });
    });
}

// Initialize Graph
function initGraph() {
    if (board) JXG.JSXGraph.freeBoard(board);
    
    board = JXG.JSXGraph.initBoard('jxgbox', {
        boundingbox: [-6, 6, 6, -6],
        axis: true,
        showCopyright: false,
        keepaspectratio: true,
        pan: { enabled: true },
        zoom: { enabled: true }
    });
}

// Update Graph Elements
function updateGraph(result) {
    const fn = funcConfigs[currentState.type].fn(currentState.params);
    const dfn = funcConfigs[currentState.type].dfn(currentState.params);
    
    // Clear old elements
    if (graphCurve) board.removeObject(graphCurve);
    if (tangentLine) board.removeObject(tangentLine);
    if (tangentPoint) board.removeObject(tangentPoint);
    extraPoints.forEach(p => board.removeObject(p));
    extraPoints = [];

    // Logarithmic specific domain handler for graph
    let bounds = [-10, 10];
    if (currentState.type === 'logarithmic') bounds = [0.0001, 10];

    // Draw Function Curve
    graphCurve = board.create('functiongraph', [fn, bounds[0], bounds[1]], { 
        strokeColor: '#2563eb', 
        strokeWidth: 2.5,
        highlight: false
    });

    // Mark specific points
    if (result && result.bbtData) {
        if (result.bbtData.roots && result.bbtData.extrema) {
            for (let i = 0; i < result.bbtData.roots.length; i++) {
                extraPoints.push(board.create('point', [result.bbtData.roots[i], result.bbtData.extrema[i]], {
                    name: 'Cực trị', size: 2, color: 'red'
                }));
            }
        }
    }

    // Tangent Logic
    if (currentState.showTangent) {
        let defaultX = currentState.type === 'logarithmic' ? 1 : 1;
        tangentPoint = board.create('glider', [defaultX, fn(defaultX), graphCurve], { 
            name: 'M', 
            size: 4, 
            color: 'red',
            showInfobox: false
        });
        
        tangentLine = board.create('tangent', [tangentPoint], { 
            strokeColor: '#ef4444', 
            strokeWidth: 1.5,
            dash: 2
        });

        tangentInfoBox.classList.remove('hidden');
        
        // Update Tangent Math Info on drag
        const updateTangentInfo = () => {
            const x0 = tangentPoint.X();
            const y0 = tangentPoint.Y();
            const k = dfn(x0);
            const m = y0 - k * x0;
            
            tangentMathBox.innerHTML = `
                <span>$M(${x0.toFixed(2)}; ${y0.toFixed(2)})$</span>
                <span>$k = ${k.toFixed(2)}$</span>
                <span class="text-blue-600 font-semibold">$y = ${k.toFixed(2)}x ${m >= 0 ? '+' : '-'} ${Math.abs(m).toFixed(2)}$</span>
            `;
            renderMathInElement(tangentMathBox, { delimiters: [{left: "$", right: "$", display: false}] });
        };
        
        tangentPoint.on('drag', updateTangentInfo);
        updateTangentInfo();
    } else {
        tangentInfoBox.classList.add('hidden');
    }
}

// Main Update Loop
function updateApp() {
    // 1. Math Engine
    const { a, b, c, d, e } = currentState.params;
    let result = null;
    
    if (MathEngine[currentState.type]) {
        result = MathEngine[currentState.type](a, b, c, d, e);
    }

    if (result) {
        // Render Output Text
        solutionOutput.innerHTML = result.text;
        
        // Render BBT
        renderBBT(result.bbtData);
        
        // Render KaTeX for Output and BBT
        renderMathInElement(solutionOutput, { delimiters: [{left: "$", right: "$", display: false}] });
        renderMathInElement(bbtContainer, { delimiters: [{left: "$", right: "$", display: false}] });
    }

    // 2. Update Graph
    updateGraph(result);
}

// Event Listeners
funcTypeSelect.addEventListener('change', (ev) => {
    currentState.type = ev.target.value;
    currentState.params = { ...funcConfigs[currentState.type].defaultParams };
    buildInputs();
    updateApp();
});

showTangentCheck.addEventListener('change', (ev) => {
    currentState.showTangent = ev.target.checked;
    updateApp();
});

document.getElementById('zoom-in').addEventListener('click', () => board.zoomIn());
document.getElementById('zoom-out').addEventListener('click', () => board.zoomOut());
document.getElementById('reset-view').addEventListener('click', () => {
    board.setBoundingBox([-6, 6, 6, -6]);
});

// Init
buildInputs();
initGraph();
updateApp();
