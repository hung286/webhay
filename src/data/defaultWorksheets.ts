import { MathWorksheet } from '../types';

export const DEFAULT_WORKSHEETS: MathWorksheet[] = [
  // ==================== TOÁN 10 ====================
  {
    id: 'ws_10_01',
    title: 'Bài 1: Mệnh đề & Mệnh đề chứa biến',
    grade: 'Toán 10',
    chapter: 'Chương I: Mệnh đề & Tập hợp',
    description: 'Nắm vững khái niệm mệnh đề toán học, mệnh đề phủ định, mệnh đề kéo theo và mệnh đề tương đương.',
    theorySummary: `### 1. Khái niệm Mệnh đề
- **Mệnh đề toán học** là một khẳng định đúng hoặc một khẳng định sai. Một mệnh đề không thể vừa đúng vừa sai.
- Câu cảm thán, câu hỏi, câu mệnh lệnh **không phải** là mệnh đề.

### 2. Mệnh đề phủ định
- Kí hiệu phủ định của mệnh đề $P$ là $\\overline{P}$.
- Nếu $P$ đúng thì $\\overline{P}$ sai; nếu $P$ sai thì $\\overline{P}$ đúng.

### 3. Mệnh đề kéo theo & Mệnh đề tương đương
- Mệnh đề "$P$ kéo theo $Q$", kí hiệu $P \\Rightarrow Q$. Mệnh đề này chỉ sai khi $P$ đúng mà $Q$ sai.
- Mệnh đề đảo của $P \\Rightarrow Q$ là $Q \\Rightarrow P$.
- Mệnh đề tương đương $P \\Leftrightarrow Q$ đúng khi cả hai cùng đúng hoặc cùng sai.

### 4. Kí hiệu $\\forall$ (với mọi) và $\\exists$ (tồn tại)
- Phủ định của "$\\forall x \\in X, P(x)$" là "$\\exists x \\in X, \\overline{P(x)}$".
- Phủ định của "$\\exists x \\in X, P(x)$" là "$\\forall x \\in X, \\overline{P(x)}$".`,
    questions: [
      {
        id: 'q_10_01_1',
        question: 'Trong các câu sau, câu nào là mệnh đề toán học?',
        options: [
          'Hôm nay trời đẹp quá!',
          'Bạn đã làm bài tập chưa?',
          '$2026$ là một số chia hết cho $2$.',
          'Hãy chú ý nghe giảng!'
        ],
        correctIndex: 2,
        solution: 'Đáp án C là một khẳng định chắc chắn đúng về mặt toán học ($2026$ là số chẵn chia hết cho $2$), do đó nó là mệnh đề toán học.'
      },
      {
        id: 'q_10_01_2',
        question: 'Phủ định của mệnh đề "$P: \\forall x \\in \\mathbb{R}, x^2 + 1 > 0$" là mệnh đề nào?',
        options: [
          '$\\overline{P}: \\exists x \\in \\mathbb{R}, x^2 + 1 \\le 0$',
          '$\\overline{P}: \\forall x \\in \\mathbb{R}, x^2 + 1 \\le 0$',
          '$\\overline{P}: \\exists x \\in \\mathbb{R}, x^2 + 1 < 0$',
          '$\\overline{P}: \\exists x \\in \\mathbb{R}, x^2 + 1 = 0$'
        ],
        correctIndex: 0,
        solution: 'Phủ định của lượng từ $\\forall$ là $\\exists$, phủ định của dấu $>$ là dấu $\\le$. Vậy $\\overline{P}: \\exists x \\in \\mathbb{R}, x^2 + 1 \\le 0$.'
      },
      {
        id: 'q_10_01_3',
        question: 'Mệnh đề nào sau đây là mệnh đề ĐÚNG?',
        options: [
          '$\\forall n \\in \\mathbb{N}, n^2 > n$',
          '$\\exists x \\in \\mathbb{R}, x^2 - 4x + 4 = 0$',
          'Tam giác có ba góc vuông',
          '$\\sqrt{2}$ là một số hữu tỉ'
        ],
        correctIndex: 1,
        solution: 'Phương trình $x^2 - 4x + 4 = (x-2)^2 = 0$ có nghiệm thực $x = 2$, nên tồn tại số thực thỏa mãn phương trình. Mệnh đề B đúng.'
      }
    ],
    isPublished: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'ws_10_02',
    title: 'Bài 2: Tập hợp & Các phép toán trên tập hợp',
    grade: 'Toán 10',
    chapter: 'Chương I: Mệnh đề & Tập hợp',
    description: 'Xác định tập hợp, tập con, các phép giao, hợp, hiệu và phần bù của tập hợp.',
    theorySummary: `### 1. Khái niệm Tập hợp & Tập con
- $A \\subset B \\Leftrightarrow (\\forall x \\in A \\Rightarrow x \\in B)$.
- Tập hợp rỗng $\\emptyset \\subset A$ với mọi tập hợp $A$.

### 2. Các phép toán trên tập hợp
- **Giao:** $A \\cap B = \\{ x \\mid x \\in A \\text{ và } x \\in B \\}$.
- **Hợp:** $A \\cup B = \\{ x \\mid x \\in A \\text{ hoặc } x \\in B \\}$.
- **Hiệu:** $A \\setminus B = \\{ x \\mid x \\in A \\text{ và } x \\notin B \\}$.
- **Phần bù:** Nếu $A \\subset E$ thì $C_E A = E \\setminus A$.

### 3. Các tập con của $\\mathbb{R}$
- Đoạn $[a; b] = \\{ x \\in \\mathbb{R} \\mid a \\le x \\le b \\}$.
- Khoảng $(a; b) = \\{ x \\in \\mathbb{R} \\mid a < x < b \\}$.
- Nửa khoảng $[a; b) = \\{ x \\in \\mathbb{R} \\mid a \\le x < b \\}$.`,
    questions: [
      {
        id: 'q_10_02_1',
        question: 'Cho hai tập hợp $A = [-2; 3]$ và $B = (1; 5)$. Tìm tập hợp $A \\cap B$.',
        options: [
          '$[-2; 5)$',
          '$(1; 3]$',
          '$[-2; 1]$',
          '$(3; 5)$'
        ],
        correctIndex: 1,
        solution: 'Giao của hai tập hợp là phần tử thuộc cả hai tập: $A \\cap B = [-2; 3] \\cap (1; 5) = (1; 3]$.'
      },
      {
        id: 'q_10_02_2',
        question: 'Cho $A = \\{1; 2; 3; 4\\}$ và $B = \\{3; 4; 5; 6\\}$. Tìm tập hợp $A \\setminus B$.',
        options: [
          '\\{1; 2\\}',
          '\\{5; 6\\}',
          '\\{3; 4\\}',
          '\\{1; 2; 5; 6\\}'
        ],
        correctIndex: 0,
        solution: 'Hiệu $A \\setminus B$ gồm các phần tử thuộc $A$ nhưng không thuộc $B$: $\\{1; 2\\}$.'
      }
    ],
    isPublished: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'ws_10_03',
    title: 'Bài 3: Giá trị lượng giác của một góc từ 0° đến 180°',
    grade: 'Toán 10',
    chapter: 'Chương III: Hệ thức lượng trong tam giác',
    description: 'Khái niệm sin, cos, tan, cot trên nửa đường tròn đơn vị và các góc bù nhau, phụ nhau.',
    theorySummary: `### 1. Định nghĩa trên nửa đường tròn đơn vị
Với mỗi góc $\\alpha$ ($0^\\circ \\le \\alpha \\le 180^\\circ$), điểm $M(x_0; y_0)$ trên nửa đường tròn đơn vị sao cho $\\widehat{xOM} = \\alpha$:
- $\\sin \\alpha = y_0$
- $\\cos \\alpha = x_0$
- $\\tan \\alpha = \\frac{\\sin \\alpha}{\\cos \\alpha} = \\frac{y_0}{x_0}$ (với $\\alpha \\ne 90^\\circ$)
- $\\cot \\alpha = \\frac{\\cos \\alpha}{\\sin \\alpha} = \\frac{x_0}{y_0}$ (với $\\alpha \\ne 0^\\circ, 180^\\circ$)

### 2. Tính chất hai góc bù nhau (tổng bằng $180^\\circ$)
- $\\sin(180^\\circ - \\alpha) = \\sin \\alpha$
- $\\cos(180^\\circ - \\alpha) = -\\cos \\alpha$
- $\\tan(180^\\circ - \\alpha) = -\\tan \\alpha$
- $\\cot(180^\\circ - \\alpha) = -\\cot \\alpha$

### 3. Các hệ thức lượng giác cơ bản
- $\\sin^2 \\alpha + \\cos^2 \\alpha = 1$
- $1 + \\tan^2 \\alpha = \\frac{1}{\\cos^2 \\alpha}$ ($\\alpha \\ne 90^\\circ$)
- $\\tan \\alpha \\cdot \\cot \\alpha = 1$`,
    questions: [
      {
        id: 'q_10_03_1',
        question: 'Tính giá trị của $\\cos(120^\\circ)$.',
        options: [
          '$\\frac{1}{2}$',
          '$-\\frac{1}{2}$',
          '$\\frac{\\sqrt{3}}{2}$',
          '$-\\frac{\\sqrt{3}}{2}$'
        ],
        correctIndex: 1,
        solution: 'Áp dụng công thức hai góc bù: $\\cos(120^\\circ) = -\\cos(180^\\circ - 120^\\circ) = -\\cos(60^\\circ) = -\\frac{1}{2}$.'
      },
      {
        id: 'q_10_03_2',
        question: 'Cho biết $\\sin \\alpha = \\frac{3}{5}$ với $90^\\circ < \\alpha < 180^\\circ$. Tính $\\cos \\alpha$.',
        options: [
          '$\\frac{4}{5}$',
          '$-\\frac{4}{5}$',
          '$\\frac{2}{5}$',
          '$-\\frac{2}{5}$'
        ],
        correctIndex: 1,
        solution: 'Vì $90^\\circ < \\alpha < 180^\\circ$ nên $\\cos \\alpha < 0$. Ta có $\\cos \\alpha = -\\sqrt{1 - \\sin^2 \\alpha} = -\\sqrt{1 - \\frac{9}{25}} = -\\frac{4}{5}$.'
      }
    ],
    isPublished: true,
    createdAt: new Date().toISOString()
  },

  // ==================== TOÁN 11 ====================
  {
    id: 'ws_11_01',
    title: 'Bài 1: Công thức Lượng Giác & Phương Trình Lượng Giác Cơ Bản',
    grade: 'Toán 11',
    chapter: 'Chương I: Hàm số lượng giác & Phương trình lượng giác',
    description: 'Hệ thống công thức cộng, nhân đôi, biến đổi tích thành tổng và nghiệm phương trình lượng giác.',
    theorySummary: `### 1. Công thức cộng
- $\\sin(a \\pm b) = \\sin a \\cos b \\pm \\cos a \\sin b$
- $\\cos(a \\pm b) = \\cos a \\cos b \\mp \\sin a \\sin b$
- $\\tan(a \\pm b) = \\frac{\\tan a \\pm \\tan b}{1 \\mp \\tan a \\tan b}$

### 2. Công thức nhân đôi & hạ bậc
- $\\sin(2a) = 2\\sin a \\cos a$
- $\\cos(2a) = \\cos^2 a - \\sin^2 a = 2\\cos^2 a - 1 = 1 - 2\\sin^2 a$
- $\\sin^2 a = \\frac{1 - \\cos(2a)}{2}, \\quad \\cos^2 a = \\frac{1 + \\cos(2a)}{2}$

### 3. Nghiệm phương trình cơ bản
- $\\sin x = \\sin \\alpha \\Leftrightarrow \\left[ \\begin{array}{l} x = \\alpha + k2\\pi \\\\ x = \\pi - \\alpha + k2\\pi \\end{array} \\right. (k \\in \\mathbb{Z})$
- $\\cos x = \\cos \\alpha \\Leftrightarrow x = \\pm \\alpha + k2\\pi \\ (k \\in \\mathbb{Z})$
- $\\tan x = \\tan \\alpha \\Leftrightarrow x = \\alpha + k\\pi \\ (k \\in \\mathbb{Z})$`,
    questions: [
      {
        id: 'q_11_01_1',
        question: 'Rút gọn biểu thức $P = \\sin(x + \\frac{\\pi}{3}) - \\sin(x - \\frac{\\pi}{3})$.',
        options: [
          '$\\sqrt{3}\\cos x$',
          '$\\sqrt{3}\\sin x$',
          '$\\cos x$',
          '$\\sin x$'
        ],
        correctIndex: 0,
        solution: 'Áp dụng công thức biến đổi hiệu thành tích: $\\sin A - \\sin B = 2\\cos\\frac{A+B}{2}\\sin\\frac{A-B}{2} = 2\\cos x \\sin(\\frac{\\pi}{3}) = 2\\cos x \\cdot \\frac{\\sqrt{3}}{2} = \\sqrt{3}\\cos x$.'
      },
      {
        id: 'q_11_01_2',
        question: 'Giải phương trình $\\cos x = \\frac{1}{2}$.',
        options: [
          '$x = \\pm \\frac{\\pi}{3} + k2\\pi \\ (k \\in \\mathbb{Z})$',
          '$x = \\pm \\frac{\\pi}{6} + k2\\pi \\ (k \\in \\mathbb{Z})$',
          '$x = \\frac{\\pi}{3} + k\\pi \\ (k \\in \\mathbb{Z})$',
          '$x = \\pm \\frac{2\\pi}{3} + k2\\pi \\ (k \\in \\mathbb{Z})$'
        ],
        correctIndex: 0,
        solution: 'Vì $\\cos(\\frac{\\pi}{3}) = \\frac{1}{2}$ nên nghiệm là $x = \\pm \\frac{\\pi}{3} + k2\\pi \\ (k \\in \\mathbb{Z})$.'
      }
    ],
    isPublished: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'ws_11_02',
    title: 'Bài 2: Đạo Hàm & Quy Tắc Tính Đạo Hàm',
    grade: 'Toán 11',
    chapter: 'Chương VII: Đạo hàm',
    description: 'Quy tắc đạo hàm tổng, hiệu, tích, thương, hàm hợp và bảng đạo hàm các hàm số sơ cấp.',
    theorySummary: `### 1. Bảng đạo hàm các hàm sơ cấp cơ bản
- $(C)' = 0$ ($C$ là hằng số)
- $(x^n)' = n \\cdot x^{n-1}$
- $(\\sqrt{x})' = \\frac{1}{2\\sqrt{x}}$
- $(\\frac{1}{x})' = -\\frac{1}{x^2}$
- $(\\sin x)' = \\cos x, \\quad (\\cos x)' = -\\sin x$
- $(\\tan x)' = \\frac{1}{\\cos^2 x}, \\quad (\\cot x)' = -\\frac{1}{\\sin^2 x}$
- $(e^x)' = e^x, \\quad (a^x)' = a^x \\ln a$
- $(\\ln x)' = \\frac{1}{x}, \\quad (\\log_a x)' = \\frac{1}{x \\ln a}$

### 2. Các quy tắc tính đạo hàm
- $(u \\pm v)' = u' \\pm v'$
- $(uv)' = u'v + uv'$
- $(ku)' = k \\cdot u'$
- $(\\frac{u}{v})' = \\frac{u'v - uv'}{v^2}$
- **Đạo hàm hàm hợp:** $y'_x = y'_u \\cdot u'_x$`,
    questions: [
      {
        id: 'q_11_02_1',
        question: 'Tính đạo hàm của hàm số $f(x) = x^3 - 3x^2 + 2x - 5$.',
        options: [
          '$f\'(x) = 3x^2 - 6x + 2$',
          '$f\'(x) = 3x^2 - 3x + 2$',
          '$f\'(x) = x^2 - 6x + 2$',
          '$f\'(x) = 3x^2 - 6x$'
        ],
        correctIndex: 0,
        solution: 'Áp dụng $(x^3)\' = 3x^2$, $(x^2)\' = 2x$, $(x)\' = 1$, $(5)\' = 0$: $f\'(x) = 3x^2 - 6x + 2$.'
      },
      {
        id: 'q_11_02_2',
        question: 'Tính đạo hàm của hàm số $y = \\sin(2x + 1)$.',
        options: [
          '$y\' = 2\\cos(2x + 1)$',
          '$y\' = \\cos(2x + 1)$',
          '$y\' = -2\\cos(2x + 1)$',
          '$y\' = 2\\sin(2x + 1)$'
        ],
        correctIndex: 0,
        solution: 'Áp dụng đạo hàm hàm hợp $(\\sin u)\' = u\' \\cdot \\cos u$: với $u = 2x + 1 \\Rightarrow u\' = 2$. Do đó $y\' = 2\\cos(2x + 1)$.'
      }
    ],
    isPublished: true,
    createdAt: new Date().toISOString()
  },

  // ==================== TOÁN 12 ====================
  {
    id: 'ws_12_01',
    title: 'Bài 1: Tính Đơn Điệu & Cực Trị Của Hàm Số',
    grade: 'Toán 12',
    chapter: 'Chương I: Ứng dụng đạo hàm khảo sát hàm số',
    description: 'Điều kiện cần và đủ để hàm số đồng biến, nghịch biến; quy tắc tìm điểm cực đại, cực tiểu.',
    theorySummary: `### 1. Tính đơn điệu của hàm số
Cho hàm số $y = f(x)$ có đạo hàm trên khoảng $K$:
- Nếu $f'(x) > 0, \\forall x \\in K$ thì hàm số **đồng biến** trên $K$.
- Nếu $f'(x) < 0, \\forall x \\in K$ thì hàm số **nghịch biến** trên $K$.
- Nếu $f'(x) = 0, \\forall x \\in K$ thì hàm số không đổi (hằng số) trên $K$.
- Mở rộng: Nếu $f'(x) \\ge 0$ (hoặc $\\le 0$), $\\forall x \\in K$ và dấu bằng chỉ xảy ra tại hữu hạn điểm thì hàm số đồng biến (hoặc nghịch biến) trên $K$.

### 2. Cực trị của hàm số
- Nếu $f'(x_0) = 0$ và $f'(x)$ đổi dấu từ **dương sang âm** khi $x$ qua $x_0$ thì $x_0$ là **điểm cực đại**.
- Nếu $f'(x_0) = 0$ và $f'(x)$ đổi dấu từ **âm sang dương** khi $x$ qua $x_0$ thì $x_0$ là **điểm cực tiểu**.`,
    questions: [
      {
        id: 'q_12_01_1',
        question: 'Hàm số $y = x^3 - 3x + 2$ đồng biến trên khoảng nào sau đây?',
        options: [
          '$(-\\infty; -1)$ và $(1; +\\infty)$',
          '$(-1; 1)$',
          '$(-\\infty; 1)$',
          '$(-1; +\\infty)$'
        ],
        correctIndex: 0,
        solution: 'Ta có $y\' = 3x^2 - 3 = 3(x^2 - 1)$. $y\' > 0 \\Leftrightarrow x^2 > 1 \\Leftrightarrow x \\in (-\\infty; -1) \\cup (1; +\\infty)$. Vậy hàm số đồng biến trên $(-\\infty; -1)$ và $(1; +\\infty)$.'
      },
      {
        id: 'q_12_01_2',
        question: 'Tìm toạ độ điểm cực đại của đồ thị hàm số $y = -x^3 + 3x^2 + 1$.',
        options: [
          '$(2; 5)$',
          '$(0; 1)$',
          '$(2; 1)$',
          '$(-2; 21)$'
        ],
        correctIndex: 0,
        solution: 'Ta có $y\' = -3x^2 + 6x = -3x(x - 2)$. $y\' = 0 \\Leftrightarrow x = 0$ hoặc $x = 2$. Bảng biến thiên cho thấy tại $x = 2$, đạo hàm đổi dấu từ dương sang âm, do đó $x = 2$ là điểm cực đại. Giá trị cực đại $y(2) = -8 + 12 + 1 = 5$. Toạ độ điểm cực đại là $(2; 5)$.'
      }
    ],
    isPublished: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'ws_12_02',
    title: 'Bài 2: Giá Trị Lớn Nhất & Giá Trị Nhỏ Nhất Của Hàm Số',
    grade: 'Toán 12',
    chapter: 'Chương I: Ứng dụng đạo hàm khảo sát hàm số',
    description: 'Quy tắc tìm GTLN và GTNN của hàm số liên tục trên một đoạn $[a; b]$ và trên khoảng mở.',
    theorySummary: `### 1. Định nghĩa
- Số $M$ là giá trị lớn nhất (GTLN) của $f(x)$ trên $D$ nếu $f(x) \\le M, \\forall x \\in D$ và $\\exists x_0 \\in D$ sao cho $f(x_0) = M$. Kí hiệu $M = \\max_{D} f(x)$.
- Số $m$ là giá trị nhỏ nhất (GTNN) của $f(x)$ trên $D$ nếu $f(x) \\ge m, \\forall x \\in D$ và $\\exists x_0 \\in D$ sao cho $f(x_0) = m$. Kí hiệu $m = \\min_{D} f(x)$.

### 2. Quy tắc tìm GTLN, GTNN trên đoạn $[a; b]$
1. Tính đạo hàm $f'(x)$.
2. Tìm các điểm $x_1, x_2, ..., x_n \\in (a; b)$ mà tại đó $f'(x) = 0$ hoặc đạo hàm không xác định.
3. Tính các giá trị $f(a), f(b), f(x_1), ..., f(x_n)$.
4. So sánh: Số lớn nhất trong các giá trị trên là $\\max_{[a; b]} f(x)$, số nhỏ nhất là $\\min_{[a; b]} f(x)$.`,
    questions: [
      {
        id: 'q_12_02_1',
        question: 'Tìm giá trị nhỏ nhất của hàm số $f(x) = x^4 - 2x^2 + 3$ trên đoạn $[0; 2]$.',
        options: [
          '$2$',
          '$3$',
          '$11$',
          '$1$'
        ],
        correctIndex: 0,
        solution: 'Ta có $f\'(x) = 4x^3 - 4x = 4x(x^2 - 1)$. Trên $(0; 2)$, nghiệm của $f\'(x) = 0$ là $x = 1$. Tính: $f(0) = 3$, $f(1) = 2$, $f(2) = 11$. Vậy $\\min_{[0; 2]} f(x) = f(1) = 2$.'
      }
    ],
    isPublished: true,
    createdAt: new Date().toISOString()
  }
];
