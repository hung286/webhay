const MathCore = {
    formatCoeff: function(val, isFirst = false, includeX = true) {
        if (val === 0) return "";
        let sign = val > 0 ? (isFirst ? "" : " + ") : (isFirst ? "-" : " - ");
        let absVal = Math.abs(val);
        let num = (absVal === 1 && includeX) ? "" : absVal;
        return sign + num;
    },
    
    analyzeCubic: function(a, b, c, d) {
        if (a === 0) return { eq: "", steps: ["Hệ số a phải khác 0"], points: [] };
        
        let eq = `y = ${this.formatCoeff(a,true,true)}x^3 ${this.formatCoeff(b,false,true)}x^2 ${this.formatCoeff(c,false,true)}x ${this.formatCoeff(d,false,false)}`;
        let steps = [];
        let points = [];
        
        // Step 1
        steps.push(`<b>1. Tập xác định:</b> $D = \\mathbb{R}$`);
        
        // Step 2
        let yPrimeStr = `${this.formatCoeff(3*a,true,true)}x^2 ${this.formatCoeff(2*b,3*a===0,true)}x ${this.formatCoeff(c,3*a===0&&2*b===0,false)}`;
        if(yPrimeStr.trim() === "") yPrimeStr = "0";
        
        let delta = (2*b)*(2*b) - 4*(3*a)*c;
        let roots = [];
        let ptStr = ``;
        
        if (delta > 0) {
            let x1 = (-(2*b) - Math.sqrt(delta)) / (2*(3*a));
            let x2 = (-(2*b) + Math.sqrt(delta)) / (2*(3*a));
            roots = [x1, x2].sort((i, j) => i - j);
            ptStr = `$y' = 0 \\Leftrightarrow x_1 = ${roots[0]}; x_2 = ${roots[1]}$`; // Giả sử nghiệm nguyên cho hiển thị mượt
        } else if (delta === 0) {
            roots = [-(2*b) / (2*(3*a))];
            ptStr = `$y' = 0$ có nghiệm kép $x = ${roots[0]}$`;
        } else {
            ptStr = `$y' = 0$ vô nghiệm ($\\Delta < 0$)`;
        }

        let limPos = a > 0 ? "+\\infty" : "-\\infty";
        let limNeg = a > 0 ? "-\\infty" : "+\\infty";

        // BBT
        let bbt = '<table class="bbt-table">';
        let getY = (x) => a*x*x*x + b*x*x + c*x + d;
        
        if (roots.length === 2) {
            let y1 = getY(roots[0]), y2 = getY(roots[1]);
            let s1 = a>0?"+":"-", s2 = a>0?"-":"+", s3 = a>0?"+":"-";
            points.push({x: roots[0], y: y1, label: (a>0?"CĐ":"CT")});
            points.push({x: roots[1], y: y2, label: (a>0?"CT":"CĐ")});

            if(a>0) {
                bbt += `<tr><td class="w-12">$x$</td><td>$-\\infty$</td><td></td><td>$${roots[0].toFixed(2)}$</td><td></td><td>$${roots[1].toFixed(2)}$</td><td></td><td>$+\\infty$</td></tr>
                         <tr><td>$y'$</td><td></td><td style="color:#00f6ff">$${s1}$</td><td>$0$</td><td style="color:#00f6ff">$${s2}$</td><td>$0$</td><td style="color:#00f6ff">$${s3}$</td><td></td></tr>
                         <tr class="h-24"><td>$y$</td><td class="align-bottom">$-\\infty$</td><td class="align-middle">$\\nearrow$</td><td class="align-top">$${y1.toFixed(2)}$</td><td class="align-middle">$\\searrow$</td><td class="align-bottom">$${y2.toFixed(2)}$</td><td class="align-middle">$\\nearrow$</td><td class="align-top">$+\\infty$</td></tr>`;
            } else {
                bbt += `<tr><td class="w-12">$x$</td><td>$-\\infty$</td><td></td><td>$${roots[0].toFixed(2)}$</td><td></td><td>$${roots[1].toFixed(2)}$</td><td></td><td>$+\\infty$</td></tr>
                         <tr><td>$y'$</td><td></td><td style="color:#00f6ff">$${s1}$</td><td>$0$</td><td style="color:#00f6ff">$${s2}$</td><td>$0$</td><td style="color:#00f6ff">$${s3}$</td><td></td></tr>
                         <tr class="h-24"><td>$y$</td><td class="align-top">$+\\infty$</td><td class="align-middle">$\\searrow$</td><td class="align-bottom">$${y1.toFixed(2)}$</td><td class="align-middle">$\\nearrow$</td><td class="align-top">$${y2.toFixed(2)}$</td><td class="align-middle">$\\searrow$</td><td class="align-bottom">$-\\infty$</td></tr>`;
            }
        } else {
            let s = a>0?"+":"-", ar = a>0?"\\nearrow":"\\searrow";
            bbt += `<tr><td class="w-12">$x$</td><td>$-\\infty$</td><td></td><td>$+\\infty$</td></tr>
                     <tr><td>$y'$</td><td></td><td style="color:#00f6ff">$${s}$</td><td></td></tr>
                     <tr class="h-24"><td>$y$</td><td class="${a>0?'align-bottom':'align-top'}">$${limNeg}$</td><td class="align-middle">$${ar}$</td><td class="${a>0?'align-top':'align-bottom'}">$${limPos}$</td></tr>`;
        }
        bbt += '</table>';

        steps.push(`<b>2. Sự biến thiên:</b><br>
                    • Giới hạn: $\\lim\\limits_{x \\to \\pm\\infty} y = \\pm\\infty$ (tuỳ hướng)<br>
                    • Đạo hàm: $y' = ${yPrimeStr}$<br>
                    • ${ptStr}<br>${bbt}`);

        // Step 3
        let uX = -b / (3*a);
        let uY = getY(uX);
        points.push({x: uX, y: uY, label: "I"});
        steps.push(`<b>3. Đồ thị:</b><br>
                    • Điểm uốn: $I(${uX.toFixed(2)}; ${uY.toFixed(2)})$<br>
                    • Cực trị & Các điểm phụ đã được đánh dấu.`);

        return { eq: `$${eq}$`, steps, points };
    },

    analyzeRational11: function(a, b, c, d) {
        if (c === 0) return { eq:"", steps: ["Hệ số c phải khác 0"], points: [] };
        let D = a*d - b*c;
        if (D === 0) return { eq:"", steps: ["Hàm số suy biến (ad - bc = 0)"], points: [] };
        
        let eq = `y = \\frac{${a}x ${b>=0?'+'+b:b}}{${c}x ${d>=0?'+'+d:d}}`;
        let steps = [];
        let points = [];
        let x0 = -d/c;
        let y0 = a/c;

        steps.push(`<b>1. Tập xác định:</b> $D = \\mathbb{R} \\setminus \\{${x0.toFixed(2)}\\}$`);
        
        let s = D>0?"+":"-", ar = D>0?"\\nearrow":"\\searrow";
        let bbt = '<table class="bbt-table">';
        bbt += `<tr><td class="w-12">$x$</td><td>$-\\infty$</td><td></td><td class="w-16">$${x0.toFixed(2)}$</td><td></td><td>$+\\infty$</td></tr>`;
        bbt += `<tr><td>$y'$</td><td></td><td style="color:#00f6ff">$${s}$</td><td class="dbl-line"></td><td style="color:#00f6ff">$${s}$</td><td></td></tr>`;
        if (D>0) {
            bbt += `<tr class="h-24"><td>$y$</td><td class="align-bottom">$${y0.toFixed(2)}$</td><td class="align-middle">$${ar}$</td><td class="dbl-line text-xs"><span style="position:absolute; top:4px; right:4px;">$+\\infty$</span><span style="position:absolute; bottom:4px; left:4px;">$-\\infty$</span></td><td class="align-middle">$${ar}$</td><td class="align-top">$${y0.toFixed(2)}$</td></tr>`;
        } else {
            bbt += `<tr class="h-24"><td>$y$</td><td class="align-top">$${y0.toFixed(2)}$</td><td class="align-middle">$${ar}$</td><td class="dbl-line text-xs"><span style="position:absolute; bottom:4px; right:4px;">$-\\infty$</span><span style="position:absolute; top:4px; left:4px;">$+\\infty$</span></td><td class="align-middle">$${ar}$</td><td class="align-bottom">$${y0.toFixed(2)}$</td></tr>`;
        }
        bbt += '</table>';

        steps.push(`<b>2. Sự biến thiên:</b><br>
                    • TCĐ: $x = ${x0.toFixed(2)}$, TCN: $y = ${y0.toFixed(2)}$<br>
                    • Đạo hàm: $y' = \\frac{${D}}{(${c}x ${d>=0?'+'+d:d})^2} ${D>0?'>':'<'} 0$<br>
                    ${bbt}`);

        steps.push(`<b>3. Đồ thị:</b><br>
                    • Tâm đối xứng là giao hai tiệm cận $I(${x0.toFixed(2)}; ${y0.toFixed(2)})$.`);
        
        points.push({x: x0, y: y0, label: "I"});
        
        return { eq: `$${eq}$`, steps, points, asymp: {v: x0, h: y0} };
    },

    evaluate: function(type, coeffs, x) {
        let {a, b, c, d} = coeffs;
        if(type === 'cubic') return a*x*x*x + b*x*x + c*x + d;
        if(type === 'rational11') return (a*x + b)/(c*x + d);
        return 0;
    }
};
