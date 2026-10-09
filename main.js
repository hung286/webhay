const funcTypeSelect = document.getElementById('funcType');
const dynamicInputsDiv = document.getElementById('dynamic-inputs');
const mathOutputDiv = document.getElementById('math-output');
const canvas = document.getElementById('plot');
const ctx = canvas.getContext('2d');

let currentCoeffs = {};
let scale = 45;
let origin = { x: 0, y: 0 };
let currentStepIndex = 0; // 0, 1, 2
let currentAnalysis = { steps: [], points: [], eq: "" };

// Chuyển đổi "1/3" thành 0.3333...
function parseFraction(str) {
    if (!str) return 0;
    str = str.replace(',', '.');
    if (str.includes('/')) {
        let parts = str.split('/');
        let num = parseFloat(parts[0]);
        let den = parseFloat(parts[1]);
        if (den === 0) return 0;
        return num / den;
    }
    return parseFloat(str) || 0;
}

function init() {
    const resizeCanvas = () => {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
        origin = { x: canvas.width / 2, y: canvas.height / 2 };
        functionPlot(); 
    };
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    funcTypeSelect.addEventListener('change', (e) => renderInputs(e.target.value));
    
    document.getElementById('btn-prev').addEventListener('click', () => {
        if (currentStepIndex > 0) { currentStepIndex--; renderSteps(); }
    });
    document.getElementById('btn-next').addEventListener('click', () => {
        if (currentStepIndex < currentAnalysis.steps.length - 1) { currentStepIndex++; renderSteps(); }
    });
    document.getElementById('btn-all').addEventListener('click', () => {
        currentStepIndex = currentAnalysis.steps.length - 1; renderSteps();
    });

    renderInputs('cubic');
}

function renderInputs(functionType) {
    dynamicInputsDiv.innerHTML = '';
    let inputsDef = [];
    if (functionType === 'cubic') {
        inputsDef = [
            { id: 'a', label: 'a', value: '1/3' },
            { id: 'b', label: 'b', value: '-1' },
            { id: 'c', label: 'c', value: '0' },
            { id: 'd', label: 'd', value: '2' }
        ];
    } else if (functionType === 'rational11') {
        inputsDef = [
            { id: 'a', label: 'a', value: '2' },
            { id: 'b', label: 'b', value: '-1' },
            { id: 'c', label: 'c', value: '1' },
            { id: 'd', label: 'd', value: '1' }
        ];
    }

    inputsDef.forEach(def => {
        currentCoeffs[def.id] = parseFraction(def.value);
        const group = document.createElement('div');
        group.className = 'form-group';
        group.innerHTML = `
            <label>${def.label}</label>
            <input type="text" id="val_${def.id}" value="${def.value}">
        `;
        dynamicInputsDiv.appendChild(group);

        document.getElementById(`val_${def.id}`).addEventListener('input', (e) => {
            currentCoeffs[def.id] = parseFraction(e.target.value);
            updateLogicAndRender();
        });
    });

    updateLogicAndRender();
}

function updateLogicAndRender() {
    let type = funcTypeSelect.value;
    
    if(type === 'cubic') {
        currentAnalysis = MathCore.analyzeCubic(currentCoeffs.a, currentCoeffs.b, currentCoeffs.c, currentCoeffs.d);
    } else if(type === 'rational11') {
        currentAnalysis = MathCore.analyzeRational11(currentCoeffs.a, currentCoeffs.b, currentCoeffs.c, currentCoeffs.d);
    }

    document.getElementById('func-equation').innerHTML = currentAnalysis.eq;
    if(window.renderMathInElement) {
        renderMathInElement(document.getElementById('func-equation'), {delimiters: [{left: "$", right: "$", display: false}]});
    }

    // Reset step
    currentStepIndex = 0;
    renderSteps();
}

function renderSteps() {
    mathOutputDiv.innerHTML = '';
    for(let i = 0; i <= currentStepIndex; i++) {
        if(currentAnalysis.steps[i]) {
            let div = document.createElement('div');
            div.className = 'step-block';
            div.innerHTML = currentAnalysis.steps[i];
            mathOutputDiv.appendChild(div);
        }
    }
    
    if (window.renderMathInElement) {
        renderMathInElement(mathOutputDiv, {
            delimiters: [ {left: "$$", right: "$$", display: true}, {left: "$", right: "$", display: false} ],
            throwOnError: false
        });
    }
    functionPlot();
}

function functionPlot() {
    let w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Lưới
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for(let x = origin.x % scale; x < w; x += scale) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
    for(let y = origin.y % scale; y < h; y += scale) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
    ctx.stroke();

    // Trục toạ độ
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, origin.y); ctx.lineTo(w, origin.y);
    ctx.moveTo(origin.x, 0); ctx.lineTo(origin.x, h);
    ctx.stroke();

    // Text trục
    ctx.fillStyle = '#fff';
    ctx.font = '14px sans-serif';
    ctx.fillText('O', origin.x - 15, origin.y + 15);
    ctx.fillText('x', w - 15, origin.y - 10);
    ctx.fillText('y', origin.x + 10, 15);

    // Đánh số trục
    ctx.font = '11px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    let step = 1;
    for(let i = step; i < w/scale; i+=step) {
        ctx.fillText(i, origin.x + i*scale - 3, origin.y + 15);
        ctx.fillText(-i, origin.x - i*scale - 8, origin.y + 15);
    }
    for(let i = step; i < h/scale; i+=step) {
        ctx.fillText(i, origin.x - 18, origin.y - i*scale + 4);
        ctx.fillText(-i, origin.x - 22, origin.y + i*scale + 4);
    }

    // Nếu vẽ BBT chưa xong, chưa vẽ tiệm cận
    if(currentAnalysis.asymp && currentStepIndex >= 1) {
        let px = origin.x + currentAnalysis.asymp.v * scale;
        let py = origin.y - currentAnalysis.asymp.h * scale;
        
        ctx.strokeStyle = '#ff007f';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(px, 0); ctx.lineTo(px, h);
        ctx.moveTo(0, py); ctx.lineTo(w, py);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    // Đồ thị
    ctx.strokeStyle = '#00f6ff';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#00f6ff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    
    let type = funcTypeSelect.value;
    let isFirst = true, lastPy = null;

    for (let px = -5; px <= w + 5; px += 2) {
        let mx = (px - origin.x) / scale;
        let my = MathCore.evaluate(type, currentCoeffs, mx);
        let py = origin.y - my * scale;

        if (isNaN(my) || Math.abs(my * scale) > 20000) {
            isFirst = true; continue;
        }

        if (isFirst) { ctx.moveTo(px, py); isFirst = false; }
        else {
            if (lastPy !== null && Math.abs(py - lastPy) > h) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        lastPy = py;
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Các điểm đặc biệt
    if (currentStepIndex >= 2 && currentAnalysis.points) {
        currentAnalysis.points.forEach(pt => {
            let px = origin.x + pt.x * scale;
            let py = origin.y - pt.y * scale;
            
            ctx.fillStyle = '#ff007f';
            ctx.beginPath();
            ctx.arc(px, py, 4, 0, Math.PI*2);
            ctx.fill();
            
            ctx.fillStyle = '#ffb3d9';
            ctx.fillText(pt.label, px + 5, py - 5);
        });
    }
}

window.grapherZoom = function(factor) {
    origin.x = canvas.width/2 - (canvas.width/2 - origin.x) * factor;
    origin.y = canvas.height/2 - (canvas.height/2 - origin.y) * factor;
    scale *= factor;
    functionPlot();
}

window.onload = init;
