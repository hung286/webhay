// script.js

// State
let currentState = {
    type: 'cubic',
    params: { a: 1/3, b: -1, c: 0, d: 2 },
    showTangent: false
};

// JXG Board and objects
let board = null;
let graphCurve = null;
let tangentLine = null;
let tangentPoint = null;
let inflectionPoint = null;
let extremaPoints = [];

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
    cubic: {
        labels: ['a', 'b', 'c', 'd'],
        defaultParams: { a: 1/3, b: -1, c: 0, d: 2 },
        fn: (p) => (x) => p.a * Math.pow(x, 3) + p.b * Math.pow(x, 2) + p.c * x + p.d,
        dfn: (p) => (x) => 3 * p.a * Math.pow(x, 2) + 2 * p.b * x + p.c
    },
    rational11: {
        labels: ['a', 'b', 'c', 'd'],
        defaultParams: { a: 1, b: 1, c: 1, d: -1 },
        fn: (p) => (x) => (p.a * x + p.b) / (p.c * x + p.d),
        dfn: (p) => (x) => (p.a * p.d - p.b * p.c) / Math.pow(p.c * x + p.d, 2)
    }
};

// Math Engine to generate solution text and BBT data
const MathEngine = {
    cubic: function(a, b, c, d) {
        let steps = [];
        steps.push(`**1. Tập xác định:** $D = \\mathbb{R}$`);
        let da = 3 * a, db = 2 * b, dc = c;
        steps.push(`**2. Sự biến thiên:**`);
        steps.push(`- Giới hạn: $\\lim\\limits_{x \\to -\\infty} y = ${a > 0 ? '-\\infty' : '+\\infty'}$, $\\lim\\limits_{x \\to +\\infty} y = ${a > 0 ? '+\\infty' : '-\\infty'}$`);
        
        let derivStr = ``;
        if (da !== 0) derivStr += `${da}x^2`;
        if (db > 0) derivStr += ` + ${db}x`; else if (db < 0) derivStr += ` ${db}x`;
        if (dc > 0) derivStr += ` + ${dc}`; else if (dc < 0) derivStr += ` ${dc}`;
        if (derivStr === '') derivStr = '0';
        steps.push(`- Đạo hàm: $y' = ${derivStr}$`);
        
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
                steps.push(`- Điểm cực đại: $x = ${roots[0].toFixed(2)}, y_{CĐ} = ${y1.toFixed(2)}$.`);
                steps.push(`- Điểm cực tiểu: $x = ${roots[1].toFixed(2)}, y_{CT} = ${y2.toFixed(2)}$.`);
            } else {
                steps.push(`- Hàm số **nghịch biến** trên $(-\\infty; ${roots[0].toFixed(2)})$ và $(${roots[1].toFixed(2)}; +\\infty)$.`);
                steps.push(`- Hàm số **đồng biến** trên $(${roots[0].toFixed(2)}; ${roots[1].toFixed(2)})$.`);
                steps.push(`- Điểm cực tiểu: $x = ${roots[0].toFixed(2)}, y_{CT} = ${y1.toFixed(2)}$.`);
                steps.push(`- Điểm cực đại: $x = ${roots[1].toFixed(2)}, y_{CĐ} = ${y2.toFixed(2)}$.`);
            }
        } else if (delta === 0) {
            let x0 = -db / (2 * da);
            steps.push(`- $y' = 0 \\iff x = ${x0.toFixed(2)}$ (nghiệm kép).`);
            steps.push(`- Hàm số **${a > 0 ? 'đồng biến' : 'nghịch biến'}** trên $\\mathbb{R}$, không có cực trị.`);
            bbtData.roots = [x0];
        } else {
            steps.push(`- $y' ${a > 0 ? '> 0' : '< 0} \\forall x \\in \\mathbb{R}$.`);
            steps.push(`- Hàm số **${a > 0 ? 'đồng biến' : 'nghịch biến'}** trên $\\mathbb{R}$, không có cực trị.`);
        }

        let xu = -b / (3 * a);
        let yu = a*Math.pow(xu,3) + b*Math.pow(xu,2) + c*xu + d;
        steps.push(`**3. Đồ thị:**`);
        steps.push(`- Điểm uốn: $U(${xu.toFixed(2)}; ${yu.toFixed(2)})$`);
        
        return { text: steps.join('<br><br>'), bbtData, xu, yu, roots };
    },

    rational11: function(a, b, c, d) {
        let steps = [];
        if (c === 0) return { text: "Cần c ≠ 0 để là hàm phân thức.", bbtData: null };
        let x0 = -d / c;
        let det = a * d - b * c;
        if (det === 0) return { text: "Định thức bằng 0, hàm là hằng số.", bbtData: null };

        steps.push(`**1. Tập xác định:** $D = \\mathbb{R} \\setminus \\{${x0.toFixed(2)}\\}$`);
        steps.push(`**2. Sự biến thiên:**`);
        steps.push(`- Giới hạn và tiệm cận: $\\lim\\limits_{x \\to \\pm\\infty} y = ${(a/c).toFixed(2)} \\implies$ Tiệm cận ngang $y = ${(a/c).toFixed(2)}$`);
        steps.push(`- $\\lim\\limits_{x \\to ${x0.toFixed(2)}^+} y = ${(c > 0 ? (det > 0 ? '+\\infty' : '-\\infty') : (det > 0 ? '-\\infty' : '+\\infty'))} \\implies$ Tiệm cận đứng $x = ${x0.toFixed(2)}$`);
        
        steps.push(`- Đạo hàm: $y' = \\frac{${det}}{( ${c}x ${d>=0?'+':''} ${d} )^2}$`);
        steps.push(`- Do $y' ${det > 0 ? '> 0' : '< 0} \\forall x \\neq ${x0.toFixed(2)}$, hàm số **${det > 0 ? 'đồng biến' : 'nghịch biến'}** trên từng khoảng xác định.`);
        steps.push(`- Hàm số không có cực trị.`);
        steps.push(`**3. Đồ thị:**`);
        steps.push(`- Tâm đối xứng $I(${x0.toFixed(2)}; ${(a/c).toFixed(2)})$.`);
        
        return { text: steps.join('<br><br>'), bbtData: { type: 'rational11', a: a, c: c, x0: x0, y0: a/c, det: det }, x0: x0, y0: a/c };
    }
};

// Render BBT
function renderBBT(bbtData) {
    if (!bbtData) {
        bbtContainer.innerHTML = '';
        return;
    }

    let html = '';
    if (bbtData.type === 'cubic') {
        if (bbtData.roots.length === 2) {
            const r1 = bbtData.roots[0].toFixed(2);
            const r2 = bbtData.roots[1].toFixed(2);
            const y1 = bbtData.extrema[0].toFixed(2);
            const y2 = bbtData.extrema[1].toFixed(2);
            const s = bbtData.a > 0 ? '+' : '-';
            const os = bbtData.a > 0 ? '-' : '+';
            const inf1 = bbtData.a > 0 ? '-\\infty' : '+\\infty';
            const inf2 = bbtData.a > 0 ? '+\\infty' : '-\\infty';

            // SVG Path for arrows
            let arrowPath = '';
            if (bbtData.a > 0) {
                arrowPath = `
                    <line x1="20" y1="60" x2="180" y2="20" stroke="black" stroke-width="1.5" marker-end="url(#arrow)" />
                    <line x1="200" y1="20" x2="380" y2="60" stroke="black" stroke-width="1.5" marker-end="url(#arrow)" />
                    <line x1="400" y1="60" x2="580" y2="20" stroke="black" stroke-width="1.5" marker-end="url(#arrow)" />
                `;
            } else {
                arrowPath = `
                    <line x1="20" y1="20" x2="180" y2="60" stroke="black" stroke-width="1.5" marker-end="url(#arrow)" />
                    <line x1="200" y1="60" x2="380" y2="20" stroke="black" stroke-width="1.5" marker-end="url(#arrow)" />
                    <line x1="400" y1="20" x2="580" y2="60" stroke="black" stroke-width="1.5" marker-end="url(#arrow)" />
                `;
            }

            html = `
            <table class="bbt-table">
                <tr>
                    <th>$x$</th>
                    <td>$-\\infty$</td>
                    <td>$${r1}$</td>
                    <td>$${r2}$</td>
                    <td>$+\\infty$</td>
                </tr>
                <tr>
                    <th>$y'$</th>
                    <td>${s}</td>
                    <td>0</td>
                    <td>${os}</td>
                    <td>0</td>
                    <td>${s}</td>
                </tr>
                <tr>
                    <th>$y$</th>
                    <td colspan="4" class="bbt-svg-container">
                        <svg width="100%" height="80px" viewBox="0 0 600 80" preserveAspectRatio="none">
                            <defs>
                                <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                                    <path d="M 0 0 L 10 5 L 0 10 z" fill="black"/>
                                </marker>
                            </defs>
                            ${arrowPath}
                            <!-- Labels -->
                            <text x="20" y="${bbtData.a>0?75:15}" font-size="14" font-family="serif" text-anchor="middle">$${inf1}$</text>
                            <text x="190" y="${bbtData.a>0?15:75}" font-size="14" font-family="serif" text-anchor="middle">$${y1}$</text>
                            <text x="390" y="${bbtData.a>0?75:15}" font-size="14" font-family="serif" text-anchor="middle">$${y2}$</text>
                            <text x="580" y="${bbtData.a>0?15:75}" font-size="14" font-family="serif" text-anchor="middle">$${inf2}$</text>
                        </svg>
                    </td>
                </tr>
            </table>`;
        } else {
            // Simplified BBT for no roots or 1 root
            const s = bbtData.a > 0 ? '+' : '-';
            const inf1 = bbtData.a > 0 ? '-\\infty' : '+\\infty';
            const inf2 = bbtData.a > 0 ? '+\\infty' : '-\\infty';
            
            html = `
            <table class="bbt-table">
                <tr>
                    <th>$x$</th>
                    <td>$-\\infty$</td>
                    ${bbtData.roots.length === 1 ? `<td>$${bbtData.roots[0].toFixed(2)}$</td>` : ''}
                    <td>$+\\infty$</td>
                </tr>
                <tr>
                    <th>$y'$</th>
                    <td colspan="${bbtData.roots.length === 1 ? 3 : 2}">${bbtData.roots.length === 1 ? s + ' &nbsp;&nbsp;&nbsp;&nbsp; 0 &nbsp;&nbsp;&nbsp;&nbsp; ' + s : s}</td>
                </tr>
                <tr>
                    <th>$y$</th>
                    <td colspan="${bbtData.roots.length === 1 ? 3 : 2}" class="bbt-svg-container">
                        <svg width="100%" height="80px" viewBox="0 0 600 80" preserveAspectRatio="none">
                            <defs>
                                <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                                    <path d="M 0 0 L 10 5 L 0 10 z" fill="black"/>
                                </marker>
                            </defs>
                            <line x1="20" y1="${bbtData.a>0?60:20}" x2="580" y2="${bbtData.a>0?20:60}" stroke="black" stroke-width="1.5" marker-end="url(#arrow)" />
                            <text x="20" y="${bbtData.a>0?75:15}" font-size="14" font-family="serif" text-anchor="middle">$${inf1}$</text>
                            <text x="580" y="${bbtData.a>0?15:75}" font-size="14" font-family="serif" text-anchor="middle">$${inf2}$</text>
                        </svg>
                    </td>
                </tr>
            </table>`;
        }
    } else if (bbtData.type === 'rational11') {
        const s = bbtData.det > 0 ? '+' : '-';
        const y0 = bbtData.y0.toFixed(2);
        
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
                    <svg width="100%" height="80px" viewBox="0 0 600 80" preserveAspectRatio="none">
                        <defs>
                            <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                                <path d="M 0 0 L 10 5 L 0 10 z" fill="black"/>
                            </marker>
                        </defs>
                        ${bbtData.det > 0 ? `
                            <line x1="20" y1="50" x2="280" y2="15" stroke="black" stroke-width="1.5" marker-end="url(#arrow)" />
                            <line x1="320" y1="70" x2="580" y2="30" stroke="black" stroke-width="1.5" marker-end="url(#arrow)" />
                            <text x="20" y="65" font-size="14" font-family="serif" text-anchor="middle">$${y0}$</text>
                            <text x="270" y="15" font-size="14" font-family="serif" text-anchor="middle">$+\\infty$</text>
                            <text x="330" y="75" font-size="14" font-family="serif" text-anchor="middle">$-\\infty$</text>
                            <text x="580" y="25" font-size="14" font-family="serif" text-anchor="middle">$${y0}$</text>
                        ` : `
                            <line x1="20" y1="30" x2="280" y2="70" stroke="black" stroke-width="1.5" marker-end="url(#arrow)" />
                            <line x1="320" y1="15" x2="580" y2="50" stroke="black" stroke-width="1.5" marker-end="url(#arrow)" />
                            <text x="20" y="25" font-size="14" font-family="serif" text-anchor="middle">$${y0}$</text>
                            <text x="270" y="75" font-size="14" font-family="serif" text-anchor="middle">$-\\infty$</text>
                            <text x="330" y="15" font-size="14" font-family="serif" text-anchor="middle">$+\\infty$</text>
                            <text x="580" y="65" font-size="14" font-family="serif" text-anchor="middle">$${y0}$</text>
                        `}
                    </svg>
                </td>
            </tr>
        </table>`;
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
    if (inflectionPoint) board.removeObject(inflectionPoint);
    extremaPoints.forEach(p => board.removeObject(p));
    extremaPoints = [];

    // Draw Function Curve
    graphCurve = board.create('functiongraph', [fn], { 
        strokeColor: '#2563eb', 
        strokeWidth: 2.5,
        highlight: false
    });

    // Mark points for cubic
    if (currentState.type === 'cubic' && result) {
        if (result.xu !== undefined) {
            inflectionPoint = board.create('point', [result.xu, result.yu], {
                name: 'U', size: 2, color: 'purple', label: { offset: [10, 10] }
            });
        }
        if (result.roots && result.roots.length === 2) {
            extremaPoints.push(board.create('point', [result.roots[0], fn(result.roots[0])], {
                name: currentState.params.a > 0 ? 'CĐ' : 'CT', size: 2, color: 'red'
            }));
            extremaPoints.push(board.create('point', [result.roots[1], fn(result.roots[1])], {
                name: currentState.params.a > 0 ? 'CT' : 'CĐ', size: 2, color: 'red'
            }));
        }
    }

    // Tangent Logic
    if (currentState.showTangent) {
        tangentPoint = board.create('glider', [1, fn(1), graphCurve], { 
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
    const { a, b, c, d } = currentState.params;
    let result = null;
    
    // Replace text line breaks
    let formattedText = '';
    
    if (currentState.type === 'cubic') {
        result = MathEngine.cubic(a, b, c, d);
    } else if (currentState.type === 'rational11') {
        result = MathEngine.rational11(a, b, c, d);
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
funcTypeSelect.addEventListener('change', (e) => {
    currentState.type = e.target.value;
    currentState.params = { ...funcConfigs[currentState.type].defaultParams };
    buildInputs();
    updateApp();
});

showTangentCheck.addEventListener('change', (e) => {
    currentState.showTangent = e.target.checked;
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
