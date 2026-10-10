import { MathWorksheet } from '../types';

export const DEFAULT_WORKSHEETS: MathWorksheet[] = [
  // =========================================================================
  // ============================ TOÁN 10 (16 BÀI) ============================
  // =========================================================================
  {
    id: 'ws_10_01',
    title: 'Bài 1: Mệnh đề & Mệnh đề chứa biến',
    grade: 'Toán 10',
    chapter: 'Chương I: Mệnh đề & Tập hợp',
    description: 'Nắm vững khái niệm mệnh đề toán học, mệnh đề phủ định, mệnh đề kéo theo và mệnh đề tương đương.',
    externalUrl: 'https://phieu-hoc-tap-mon-toanthpt.netlify.app/phieu-hoc-tap-toan10/bai-1-menh-de.html',
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
        question: 'Trong các phát biểu sau phát biểu nào là mệnh đề đúng?',
        options: [
          'Bạn Linh có thích học môn Tiếng Anh không?.',
          '${7}$ là số nguyên tố.',
          '${64}$ chia hết cho ${6}$.',
          'Phương trình ${3 x^{2} - 12 x + 9=0}$ vô nghiệm.'
        ],
        correctIndex: 1,
        solution: 'Đáp án B: $7$ là số nguyên tố là khẳng định hoàn toàn chính xác. Câu A là câu hỏi; câu C sai vì 64 không chia hết cho 6; câu D sai vì phương trình có nghiệm x=1, x=3.'
      },
      {
        id: 'q_10_01_2',
        question: 'Phủ định của mệnh đề "${55}$ là số chẵn" là:',
        options: [
          '${55}$ không phải là số tự nhiên.',
          '${55}$ là số lẻ.',
          '${55}$ là số nguyên tố.',
          '${55}$ là số hữu tỉ.'
        ],
        correctIndex: 1,
        solution: 'Phủ định của "là số chẵn" đối với số nguyên là "là số lẻ". Vậy mệnh đề phủ định là "${55}$ là số lẻ".'
      },
      {
        id: 'q_10_01_3',
        question: 'Mệnh đề phủ định của mệnh đề "$P: \\exists x \\in \\mathbb{Q}: \\sqrt{4 x + 4} = 9 x - 1$" là:',
        options: [
          '$\\forall x \\in \\mathbb{Q}: \\sqrt{4 x + 4} \\ne 9 x - 1$.',
          '$\\forall x \\in \\mathbb{Q}: \\sqrt{4 x + 4} > 9 x - 1$.',
          '$\\forall x \\in \\mathbb{Q}: \\sqrt{4 x + 4} \\le 9 x - 1$.',
          '$\\forall x \\in \\mathbb{Q}: \\sqrt{4 x + 4} < 9 x - 1$.'
        ],
        correctIndex: 0,
        solution: 'Phủ định của $\\exists$ là $\\forall$, phủ định của dấu bằng $=$ là dấu khác $\\ne$. Vậy $\\overline{P}: \\forall x \\in \\mathbb{Q}: \\sqrt{4 x + 4} \\ne 9 x - 1$.'
      }
    ],
    isPublished: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'ws_10_02',
    title: 'Bài 2: Tập hợp',
    grade: 'Toán 10',
    chapter: 'Chương I: Mệnh đề & Tập hợp',
    description: 'Khái niệm tập hợp, phần tử thuộc tập hợp, cách xác định tập hợp và tập hợp rỗng.',
    externalUrl: 'https://phieu-hoc-tap-mon-toanthpt.netlify.app/phieu-hoc-tap-toan10/bai-2-tap-hop.html',
    theorySummary: `### 1. Khái niệm Tập hợp
- Tập hợp là khái niệm cơ bản của toán học. Ta thường dùng các chữ cái in hoa $A, B, C...$ để đặt tên tập hợp.
- $a \\in A$: phần tử $a$ thuộc tập hợp $A$.
- $a \\notin A$: phần tử $a$ không thuộc tập hợp $A$.
- Tập hợp không chứa phần tử nào gọi là **tập rỗng**, kí hiệu là $\\emptyset$.

### 2. Các cách xác định tập hợp
- **Liệt kê các phần tử:** Ví dụ $A = \\{1, 2, 3, 4, 5\\}$.
- **Chỉ ra tính chất đặc trưng:** Ví dụ $B = \\{x \\in \\mathbb{R} \\mid x^2 - 4 = 0\\}$.`,
    questions: [
      {
        id: 'q_10_02_1',
        question: 'Tập hợp các nghiệm thực của phương trình $x^2 - 5x + 6 = 0$ viết theo cách liệt kê là:',
        options: [
          '$\\{2; 3\\}$',
          '$\\{1; 6\\}$',
          '$\\{-2; -3\\}$',
          '$\\{2; -3\\}$'
        ],
        correctIndex: 0,
        solution: 'Giải phương trình $x^2 - 5x + 6 = 0 \\Leftrightarrow (x-2)(x-3) = 0 \\Leftrightarrow x = 2$ hoặc $x = 3$. Vậy tập nghiệm là $\\{2; 3\\}$.'
      },
      {
        id: 'q_10_02_2',
        question: 'Tập hợp nào sau đây là tập hợp rỗng?',
        options: [
          '$A = \\{x \\in \\mathbb{R} \\mid x^2 + 1 = 0\\}$',
          '$B = \\{x \\in \\mathbb{N} \\mid x \\le 0\\}$',
          '$C = \\{x \\in \\mathbb{Z} \\mid |x| < 1\\}$',
          '$D = \\{x \\in \\mathbb{Q} \\mid x^2 = 4\\}$'
        ],
        correctIndex: 0,
        solution: 'Vì $x^2 + 1 \\ge 1 > 0$ với mọi $x \\in \\mathbb{R}$ nên phương trình $x^2 + 1 = 0$ vô nghiệm thực. Tập $A = \\emptyset$.'
      }
    ],
    isPublished: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'ws_10_03',
    title: 'Bài 2: Các phép toán trên các tập hợp',
    grade: 'Toán 10',
    chapter: 'Chương I: Mệnh đề & Tập hợp',
    description: 'Phép giao, phép hợp, phép hiệu và phần bù của các tập hợp, biểu diễn bằng sơ đồ Venn.',
    externalUrl: 'https://phieu-hoc-tap-mon-toanthpt.netlify.app/phieu-hoc-tap-toan10/bai-2-cac-phep-toan-tren-cac-tap-hop.html',
    theorySummary: `### 1. Phép Giao (Intersection)
- $A \\cap B = \\{x \\mid x \\in A \\text{ và } x \\in B\\}$.

### 2. Phép Hợp (Union)
- $A \\cup B = \\{x \\mid x \\in A \\text{ hoặc } x \\in B\\}$.

### 3. Phép Hiệu (Difference) & Phần bù
- Hiệu của $A$ và $B$: $A \\setminus B = \\{x \\mid x \\in A \\text{ và } x \\notin B\\}$.
- Khi $B \\subset A$, hiệu $A \\setminus B$ gọi là phần bù của $B$ trong $A$, kí hiệu $C_A B$.`,
    questions: [
      {
        id: 'q_10_03_1',
        question: 'Cho hai tập hợp $A = \\{1, 2, 3, 4\\}$ và $B = \\{3, 4, 5, 6\\}$. Khi đó $A \\setminus B$ bằng:',
        options: [
          '$\\{1, 2\\}$',
          '$\\{3, 4\\}$',
          '$\\{5, 6\\}$',
          '$\\{1, 2, 5, 6\\}$'
        ],
        correctIndex: 0,
        solution: '$A \\setminus B$ gồm các phần tử thuộc $A$ nhưng không thuộc $B$. Ta loại bỏ 3 và 4, còn lại $\\{1, 2\\}$.'
      }
    ],
    isPublished: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'ws_10_04',
    title: 'Bài 2: Các tập con đặc biệt của R',
    grade: 'Toán 10',
    chapter: 'Chương I: Mệnh đề & Tập hợp',
    description: 'Khoảng, đoạn, nửa khoảng trên trục số thực và các phép toán giao hợp khoảng đoạn.',
    externalUrl: 'https://phieu-hoc-tap-mon-toanthpt.netlify.app/phieu-hoc-tap-toan10/bai-2-cac-tap-con-dac-biet-cua-R.html',
    theorySummary: `### Các tập con của tập số thực $\\mathbb{R}$
- **Đoạn:** $[a; b] = \\{x \\in \\mathbb{R} \\mid a \\le x \\le b\\}$.
- **Khoảng:** $(a; b) = \\{x \\in \\mathbb{R} \\mid a < x < b\\}$; $(-\\infty; a) = \\{x \\in \\mathbb{R} \\mid x < a\\}$; $(a; +\\infty) = \\{x \\in \\mathbb{R} \\mid x > a\\}$.
- **Nửa khoảng:** $[a; b) = \\{x \\in \\mathbb{R} \\mid a \\le x < b\\}$; $(a; b] = \\{x \\in \\mathbb{R} \\mid a < x \\le b\\}$; $[a; +\\infty) = \\{x \\in \\mathbb{R} \\mid x \\ge a\\}$.`,
    questions: [
      {
        id: 'q_10_04_1',
        question: 'Giao của hai tập hợp $A = [-3; 2]$ và $B = (0; 5)$ là:',
        options: [
          '$(0; 2]$',
          '$[-3; 5)$',
          '$(0; 2)$',
          '$[-3; 0]$'
        ],
        correctIndex: 0,
        solution: 'Ta lấy phần chung của $[-3; 2]$ và $(0; 5)$ là $(0; 2]$.'
      }
    ],
    isPublished: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'ws_10_05',
    title: 'Bài 3: Bất phương trình bậc nhất hai ẩn',
    grade: 'Toán 10',
    chapter: 'Chương II: Bất phương trình & Hệ BPT bậc nhất hai ẩn',
    description: 'Dạng tổng quát $ax + by \\le c$, biểu diễn miền nghiệm của bất phương trình trên mặt phẳng tọa độ Oxy.',
    externalUrl: 'https://phieu-hoc-tap-mon-toanthpt.netlify.app/phieu-hoc-tap-toan10/bai-3-bat-phuong-trinh-bac-nhat-hai-an.html',
    theorySummary: `### 1. Bất phương trình bậc nhất hai ẩn
- Dạng tổng quát: $ax + by < c$ (hoặc $\\le, >, \\ge$) với $a, b$ không đồng thời bằng 0.

### 2. Biểu diễn miền nghiệm trên Oxy
- Vẽ đường thẳng $d: ax + by = c$.
- Chọn một điểm kiểm tra $M(x_0; y_0)$ không thuộc $d$ (thường chọn gốc $O(0; 0)$).
- Tính $ax_0 + by_0$ so sánh với $c$ để xác định nửa mặt phẳng bờ $d$ chứa miền nghiệm.`,
    questions: [
      {
        id: 'q_10_05_1',
        question: 'Điểm nào sau đây thuộc miền nghiệm của bất phương trình $2x - 3y + 6 > 0$?',
        options: [
          '$O(0; 0)$',
          '$A(-4; 0)$',
          '$B(0; 3)$',
          '$C(-5; -1)$'
        ],
        correctIndex: 0,
        solution: 'Thay tọa độ điểm $O(0; 0)$ vào BPT: $2(0) - 3(0) + 6 = 6 > 0$ (thỏa mãn). Vậy điểm $O$ thuộc miền nghiệm.'
      }
    ],
    isPublished: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'ws_10_06',
    title: 'Bài 4: Hệ bất phương trình bậc nhất hai ẩn',
    grade: 'Toán 10',
    chapter: 'Chương II: Bất phương trình & Hệ BPT bậc nhất hai ẩn',
    description: 'Xác định miền nghiệm của hệ BPT, bài toán quy hoạch tuyến tính tìm giá trị lớn nhất, nhỏ nhất.',
    externalUrl: 'https://phieu-hoc-tap-mon-toanthpt.netlify.app/phieu-hoc-tap-toan10/bai-4-he-bat-phuong-trinh-bac-nhat-hai-an.html',
    theorySummary: `### 1. Hệ bất phương trình bậc nhất hai ẩn
- Miền nghiệm của hệ là giao của các miền nghiệm của từng bất phương trình trong hệ.
- Miền nghiệm thường là một đa giác (tam giác, tứ giác...).

### 2. Ứng dụng tối ưu hóa
- Biểu thức $F(x, y) = ax + by$ đạt giá trị lớn nhất hoặc nhỏ nhất tại một trong các đỉnh của miền nghiệm đa giác.`,
    questions: [
      {
        id: 'q_10_06_1',
        question: 'Miền nghiệm của hệ $\\begin{cases} x \\ge 0 \\\\ y \\ge 0 \\\\ x + y \\le 4 \\end{cases}$ là một hình gì trên mặt phẳng tọa độ?',
        options: [
          'Một tam giác vuông cân',
          'Một hình vuông',
          'Một hình thang',
          'Một nửa mặt phẳng'
        ],
        correctIndex: 0,
        solution: 'Miền nghiệm giới hạn bởi các trục $Ox, Oy$ và đường thẳng $x + y = 4$, tạo thành tam giác với các đỉnh $(0,0), (4,0), (0,4)$ là tam giác vuông cân tại $O$.'
      }
    ],
    isPublished: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'ws_10_07',
    title: 'Bài 5: Giá trị lượng giác của một góc từ 0° đến 180°',
    grade: 'Toán 10',
    chapter: 'Chương III: Hệ thức lượng trong tam giác',
    description: 'Nửa đường tròn đơn vị, định nghĩa $\\sin, \\cos, \\tan, \\cot$, góc phụ nhau và bù nhau.',
    externalUrl: 'https://phieu-hoc-tap-mon-toanthpt.netlify.app/phieu-hoc-tap-toan10/bai-5-gia-tri-luong-giac-cua-mot-goc-tu-0-den-180.html',
    theorySummary: `### 1. Nửa đường tròn đơn vị
- Điểm $M(x_0; y_0)$ trên nửa đường tròn đơn vị tương ứng góc $\\alpha$:
  - $\\sin \\alpha = y_0$
  - $\\cos \\alpha = x_0$
  - $\\tan \\alpha = \\frac{y_0}{x_0} = \\frac{\\sin \\alpha}{\\cos \\alpha}$ ($x_0 \\ne 0$)
  - $\\cot \\alpha = \\frac{x_0}{y_0} = \\frac{\\cos \\alpha}{\\sin \\alpha}$ ($y_0 \\ne 0$)

### 2. Hai góc bù nhau ($\\alpha$ và $180^\\circ - \\alpha$)
- $\\sin(180^\\circ - \\alpha) = \\sin \\alpha$
- $\\cos(180^\\circ - \\alpha) = -\\cos \\alpha$
- $\\tan(180^\\circ - \\alpha) = -\\tan \\alpha$`,
    questions: [
      {
        id: 'q_10_07_1',
        question: 'Giá trị của $\\cos 120^\\circ$ bằng bao nhiêu?',
        options: [
          '$-\\frac{1}{2}$',
          '$\\frac{1}{2}$',
          '$-\\frac{\\sqrt{3}}{2}$',
          '$\\frac{\\sqrt{3}}{2}$'
        ],
        correctIndex: 0,
        solution: '$\\cos 120^\\circ = -\\cos(180^\\circ - 120^\\circ) = -\\cos 60^\\circ = -\\frac{1}{2}$.'
      }
    ],
    isPublished: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'ws_10_08',
    title: 'Bài 6: Hệ thức lượng trong tam giác',
    grade: 'Toán 10',
    chapter: 'Chương III: Hệ thức lượng trong tam giác',
    description: 'Định lí côsin, định lí sin, các công thức tính diện tích tam giác và bán kính đường tròn ngoại tiếp, nội tiếp.',
    externalUrl: 'https://phieu-hoc-tap-mon-toanthpt.netlify.app/phieu-hoc-tap-toan10/bai-6-he-thuc-luong-trong-tam-giac.html',
    theorySummary: `### 1. Định lí Côsin
- $a^2 = b^2 + c^2 - 2bc \\cos A$

### 2. Định lí Sin
- $\\frac{a}{\\sin A} = \\frac{b}{\\sin B} = \\frac{c}{\\sin C} = 2R$

### 3. Công thức diện tích tam giác
- $S = \\frac{1}{2}ab \\sin C = \\frac{abc}{4R} = pr = \\sqrt{p(p-a)(p-b)(p-c)}$`,
    questions: [
      {
        id: 'q_10_08_1',
        question: 'Tam giác $ABC$ có $b = 6, c = 8, \\widehat{A} = 60^\\circ$. Cạnh $a$ bằng:',
        options: [
          '$2\\sqrt{13}$',
          '$2\\sqrt{37}$',
          '$10$',
          '$2\\sqrt{7}$'
        ],
        correctIndex: 0,
        solution: '$a^2 = b^2 + c^2 - 2bc\\cos A = 36 + 64 - 2(6)(8)\\cos 60^\\circ = 100 - 48 = 52 \\Rightarrow a = \\sqrt{52} = 2\\sqrt{13}$.'
      }
    ],
    isPublished: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'ws_10_09',
    title: 'Bài 7: Các khái niệm mở đầu về Véctơ',
    grade: 'Toán 10',
    chapter: 'Chương IV: Véctơ',
    description: 'Định nghĩa véctơ, phương, hướng, độ dài, véctơ cùng phương, cùng hướng, hai véctơ bằng nhau và véctơ-không.',
    externalUrl: 'https://phieu-hoc-tap-mon-toanthpt.netlify.app/phieu-hoc-tap-toan10/bai-7-cac-khai-niem-mo-dau.html',
    theorySummary: `### 1. Khái niệm Véctơ
- Véctơ là một đoạn thẳng có hướng.
- Độ dài của véctơ $\\vec{a}$ kí hiệu là $|\\vec{a}|$.
- Véctơ có điểm đầu và điểm cuối trùng nhau là **véctơ-không**, kí hiệu $\\vec{0}$.

### 2. Hai véctơ cùng phương, bằng nhau
- Hai véctơ cùng phương nếu giá của chúng song song hoặc trùng nhau.
- Hai véctơ bằng nhau nếu chúng cùng hướng và cùng độ dài: $\\vec{a} = \\vec{b}$.`,
    questions: [
      {
        id: 'q_10_09_1',
        question: 'Cho hình bình hành $ABCD$. Khẳng định nào sau đây là ĐÚNG?',
        options: [
          '$\\vec{AB} = \\vec{DC}$',
          '$\\vec{AB} = \\vec{CD}$',
          '$\\vec{AD} = \\vec{CB}$',
          '$\\vec{AC} = \\vec{BD}$'
        ],
        correctIndex: 0,
        solution: 'Trong hình bình hành $ABCD$, đoạn $AB$ song song và bằng $DC$, đồng thời hướng từ $A$ sang $B$ cùng hướng từ $D$ sang $C$. Do đó $\\vec{AB} = \\vec{DC}$.'
      }
    ],
    isPublished: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'ws_10_10',
    title: 'Bài 8: Tổng và hiệu của hai véctơ',
    grade: 'Toán 10',
    chapter: 'Chương IV: Véctơ',
    description: 'Quy tắc ba điểm, quy tắc hình bình hành, véctơ đối và phép trừ véctơ.',
    externalUrl: 'https://phieu-hoc-tap-mon-toanthpt.netlify.app/phieu-hoc-tap-toan10/bai-8-tong-va-hieu-cua-hai-vecto.html',
    theorySummary: `### 1. Quy tắc Ba điểm & Hình bình hành
- Quy tắc cộng 3 điểm: $\\vec{AB} + \\vec{BC} = \\vec{AC}$.
- Quy tắc hình bình hành: Nếu $ABCD$ là hình bình hành thì $\\vec{AB} + \\vec{AD} = \\vec{AC}$.

### 2. Hiệu hai véctơ
- Quy tắc trừ 3 điểm chung gốc: $\\vec{AB} - \\vec{AC} = \\vec{CB}$.`,
    questions: [
      {
        id: 'q_10_10_1',
        question: 'Cho tam giác $ABC$. Rút gọn biểu thức $\\vec{AB} + \\vec{BC} + \\vec{CA}$ ta được:',
        options: [
          '$\\vec{0}$',
          '$\\vec{AB}$',
          '$2\\vec{AC}$',
          '$\\vec{AA}$'
        ],
        correctIndex: 0,
        solution: '$\\vec{AB} + \\vec{BC} + \\vec{CA} = \\vec{AC} + \\vec{CA} = \\vec{AA} = \\vec{0}$.'
      }
    ],
    isPublished: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'ws_10_11',
    title: 'Bài 9: Tích của một véctơ với một số',
    grade: 'Toán 10',
    chapter: 'Chương IV: Véctơ',
    description: 'Định nghĩa tích $k\\vec{a}$, tính chất trung điểm, trọng tâm và điều kiện hai véctơ cùng phương.',
    externalUrl: 'https://phieu-hoc-tap-mon-toanthpt.netlify.app/phieu-hoc-tap-toan10/bai-9-tich-cua-mot-vecto-voi-mot-so.html',
    theorySummary: `### 1. Tích $k\\vec{a}$
- $|k\\vec{a}| = |k| \\cdot |\\vec{a}|$.
- Cùng hướng nếu $k > 0$, ngược hướng nếu $k < 0$.

### 2. Điểm đặc biệt
- $I$ là trung điểm $AB \\Leftrightarrow \\vec{IA} + \\vec{IB} = \\vec{0} \\Leftrightarrow \\vec{MA} + \\vec{MB} = 2\\vec{MI}$.
- $G$ là trọng tâm $\\triangle ABC \\Leftrightarrow \\vec{GA} + \\vec{GB} + \\vec{GC} = \\vec{0} \\Leftrightarrow \\vec{MA} + \\vec{MB} + \\vec{MC} = 3\\vec{MG}$.`,
    questions: [
      {
        id: 'q_10_11_1',
        question: 'Cho $I$ là trung điểm của đoạn thẳng $AB$. Với điểm $M$ tùy ý, khẳng định nào đúng?',
        options: [
          '$\\vec{MA} + \\vec{MB} = 2\\vec{MI}$',
          '$\\vec{MA} + \\vec{MB} = \\vec{MI}$',
          '$\\vec{MA} + \\vec{MB} = -2\\vec{MI}$',
          '$\\vec{MA} - \\vec{MB} = 2\\vec{MI}$'
        ],
        correctIndex: 0,
        solution: 'Theo tính chất trung điểm đoạn thẳng, với mọi điểm $M$ ta có $\\vec{MA} + \\vec{MB} = 2\\vec{MI}$.'
      }
    ],
    isPublished: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'ws_10_12',
    title: 'Bài 10: Véctơ trong mặt phẳng tọa độ',
    grade: 'Toán 10',
    chapter: 'Chương IV: Véctơ',
    description: 'Tọa độ véctơ, tọa độ điểm, các phép toán cộng trừ véctơ và tọa độ trung điểm, trọng tâm.',
    externalUrl: 'https://phieu-hoc-tap-mon-toanthpt.netlify.app/phieu-hoc-tap-toan10/bai-10-vecto-trong-mat-phang-toa-do.html',
    theorySummary: `### 1. Tọa độ của véctơ & điểm
- $\\vec{u} = x\\vec{i} + y\\vec{j} \\Leftrightarrow \\vec{u} = (x; y)$.
- $A(x_A; y_A), B(x_B; y_B) \\Rightarrow \\vec{AB} = (x_B - x_A; y_B - y_A)$.

### 2. Tọa độ trung điểm & Trọng tâm
- Trung điểm $I$: $x_I = \\frac{x_A + x_B}{2}, y_I = \\frac{y_A + y_B}{2}$.
- Trọng tâm $G$: $x_G = \\frac{x_A + x_B + x_C}{3}, y_G = \\frac{y_A + y_B + y_C}{3}$.`,
    questions: [
      {
        id: 'q_10_12_1',
        question: 'Cho $A(1; 3)$ và $B(5; -1)$. Tọa độ của véctơ $\\vec{AB}$ là:',
        options: [
          '$(4; -4)$',
          '$(6; 2)$',
          '$(3; 1)$',
          '$(-4; 4)$'
        ],
        correctIndex: 0,
        solution: '$\\vec{AB} = (x_B - x_A; y_B - y_A) = (5 - 1; -1 - 3) = (4; -4)$.'
      }
    ],
    isPublished: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'ws_10_13',
    title: 'Bài 11: Tích vô hướng của hai véctơ',
    grade: 'Toán 10',
    chapter: 'Chương IV: Véctơ',
    description: 'Công thức tích vô hướng $\\vec{a} \\cdot \\vec{b} = |\\vec{a}||\\vec{b}|\\cos(\\vec{a}, \\vec{b})$, góc giữa hai véctơ và điều kiện vuông góc.',
    externalUrl: 'https://phieu-hoc-tap-mon-toanthpt.netlify.app/phieu-hoc-tap-toan10/bai-11-tich-vo-huong-cua-hai-vecto.html',
    theorySummary: `### 1. Định nghĩa Tích vô hướng
- $\\vec{a} \\cdot \\vec{b} = |\\vec{a}| \\cdot |\\vec{b}| \\cdot \\cos(\\vec{a}, \\vec{b})$.
- Tọa độ: $\\vec{a} = (x_1; y_1), \\vec{b} = (x_2; y_2) \\Rightarrow \\vec{a} \\cdot \\vec{b} = x_1 x_2 + y_1 y_2$.

### 2. Điều kiện vuông góc & Góc
- $\\vec{a} \\perp \\vec{b} \\Leftrightarrow \\vec{a} \\cdot \\vec{b} = 0 \\Leftrightarrow x_1 x_2 + y_1 y_2 = 0$.
- $\\cos(\\vec{a}, \\vec{b}) = \\frac{x_1 x_2 + y_1 y_2}{\\sqrt{x_1^2 + y_1^2} \\cdot \\sqrt{x_2^2 + y_2^2}}$.`,
    questions: [
      {
        id: 'q_10_13_1',
        question: 'Cho $\\vec{a} = (2; -3)$ và $\\vec{b} = (3; 2)$. Khi đó $\\vec{a} \\cdot \\vec{b}$ bằng:',
        options: [
          '$0$',
          '$12$',
          '$-12$',
          '$6$'
        ],
        correctIndex: 0,
        solution: '$\\vec{a} \\cdot \\vec{b} = 2(3) + (-3)(2) = 6 - 6 = 0$. Hai véctơ này vuông góc nhau.'
      }
    ],
    isPublished: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'ws_10_14',
    title: 'Bài 12: Số gần đúng và sai số',
    grade: 'Toán 10',
    chapter: 'Chương V: Các số đặc trưng đo xu thế trung tâm và độ phân tán',
    description: 'Khái niệm số gần đúng, sai số tuyệt đối, sai số tương đối và quy tắc làm tròn số.',
    externalUrl: 'https://phieu-hoc-tap-mon-toanthpt.netlify.app/phieu-hoc-tap-toan10/bai-12-so-gan-dung-va-sai-so.html',
    theorySummary: `### 1. Sai số tuyệt đối & Độ chính xác
- $\\Delta_a = |\\bar{a} - a| \\le d$.
- Viết số gần đúng dưới dạng $a \\pm d$.

### 2. Quy tắc làm tròn số
- Nếu chữ số ngay sau hàng làm tròn nhỏ hơn 5 thì giữ nguyên chữ số hàng làm tròn.
- Nếu lớn hơn hoặc bằng 5 thì tăng thêm 1 đơn vị.`,
    questions: [
      {
        id: 'q_10_14_1',
        question: 'Làm tròn số $a = 3.14159$ đến hàng phần trăm (chữ số thập phân thứ hai):',
        options: [
          '$3.14$',
          '$3.15$',
          '$3.142$',
          '$3.1$'
        ],
        correctIndex: 0,
        solution: 'Chữ số ngay sau hàng phần trăm là 1 (< 5), nên làm tròn giữ nguyên thành 3.14.'
      }
    ],
    isPublished: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'ws_10_15',
    title: 'Bài 13: Các số đặc trưng đo xu thế trung tâm',
    grade: 'Toán 10',
    chapter: 'Chương V: Các số đặc trưng đo xu thế trung tâm và độ phân tán',
    description: 'Số trung bình cộng, trung vị, tứ phân vị và mốt của mẫu số liệu không ghép nhóm.',
    externalUrl: 'https://phieu-hoc-tap-mon-toanthpt.netlify.app/phieu-hoc-tap-toan10/bai-13-cac-so-dac-trung-do-xu-the-trung-tam.html',
    theorySummary: `### 1. Số trung bình $\\bar{x}$
- $\\bar{x} = \\frac{x_1 + x_2 + ... + x_n}{n}$.

### 2. Trung vị $M_e$ & Tứ phân vị
- Sắp xếp mẫu tăng dần. Nếu $n$ lẻ, $M_e$ là giá trị ở chính giữa; nếu $n$ chẵn, $M_e$ là trung bình của 2 giá trị ở giữa.
- Tứ phân vị gồm $Q_1, Q_2 (= M_e), Q_3$.

### 3. Mốt $M_o$
- Giá trị có tần số xuất hiện nhiều nhất trong mẫu.`,
    questions: [
      {
        id: 'q_10_15_1',
        question: 'Tìm trung vị của mẫu số liệu: $2, 4, 7, 8, 9, 10, 14$.',
        options: [
          '$8$',
          '$7$',
          '$9$',
          '$7.7$'
        ],
        correctIndex: 0,
        solution: 'Mẫu có $n = 7$ (lẻ), giá trị ở vị trí thứ 4 là 8. Do đó trung vị $M_e = 8$.'
      }
    ],
    isPublished: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'ws_10_16',
    title: 'Bài 14: Các số đặc trưng đo độ phân tán',
    grade: 'Toán 10',
    chapter: 'Chương V: Các số đặc trưng đo xu thế trung tâm và độ phân tán',
    description: 'Khoảng biến thiên, khoảng tứ phân vị, phương sai và độ lệch chuẩn của mẫu số liệu.',
    externalUrl: 'https://phieu-hoc-tap-mon-toanthpt.netlify.app/phieu-hoc-tap-toan10/bai-14-cac-so-dac-trung-do-do-phan-tan.html',
    theorySummary: `### 1. Khoảng biến thiên & Khoảng tứ phân vị
- Khoảng biến thiên: $R = x_{\\max} - x_{\\min}$.
- Khoảng tứ phân vị: $\\Delta_Q = Q_3 - Q_1$.

### 2. Phương sai $s^2$ & Độ lệch chuẩn $s$
- Phương sai: $s^2 = \\frac{1}{n} \\sum_{i=1}^n (x_i - \\bar{x})^2$.
- Độ lệch chuẩn: $s = \\sqrt{s^2}$. Đo độ phân tán của mẫu quanh giá trị trung bình.`,
    questions: [
      {
        id: 'q_10_16_1',
        question: 'Khoảng biến thiên của mẫu số liệu $5, 8, 9, 12, 17, 25$ là:',
        options: [
          '$20$',
          '$25$',
          '$5$',
          '$14$'
        ],
        correctIndex: 0,
        solution: '$R = x_{\\max} - x_{\\min} = 25 - 5 = 20$.'
      }
    ],
    isPublished: true,
    createdAt: new Date().toISOString()
  },

  // =========================================================================
  // ============================ TOÁN 11 (17 BÀI) ============================
  // =========================================================================
  {
    id: 'ws_11_01',
    title: 'Bài 1: Góc lượng giác',
    grade: 'Toán 11',
    chapter: 'Chương I: Hàm số lượng giác & Phương trình lượng giác',
    description: 'Khái niệm góc lượng giác, số đo của góc lượng giác, đơn vị radian và đường tròn lượng giác.',
    externalUrl: 'https://phieu-hoc-tap-mon-toanthpt.netlify.app/phieu-hoc-tap-toan11/bai-1-goc-luong-giac.html',
    theorySummary: `### 1. Góc lượng giác & Đơn vị Radian
- $1^\\circ = \\frac{\\pi}{180}$ rad; $1$ rad $= \\left(\\frac{180}{\\pi}\\right)^\\circ$.
- Công thức độ dài cung tròn bán kính $R$: $l = R \\cdot \\alpha$ (với $\\alpha$ tính bằng rad).

### 2. Đường tròn lượng giác
- Đường tròn định hướng tâm $O$, bán kính $R = 1$, điểm gốc $A(1; 0)$.
- Chiều dương là chiều ngược chiều kim đồng hồ.`,
    questions: [
      {
        id: 'q_11_01_1',
        question: 'Đổi góc $60^\\circ$ sang đơn vị radian:',
        options: [
          '$\\frac{\\pi}{3}$',
          '$\\frac{\\pi}{6}$',
          '$\\frac{\\pi}{4}$',
          '$\\frac{2\\pi}{3}$'
        ],
        correctIndex: 0,
        solution: '$60^\\circ = 60 \\cdot \\frac{\\pi}{180} = \\frac{\\pi}{3}$ rad.'
      }
    ],
    isPublished: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'ws_11_02',
    title: 'Bài 1: Giá trị lượng giác của góc lượng giác',
    grade: 'Toán 11',
    chapter: 'Chương I: Hàm số lượng giác & Phương trình lượng giác',
    description: 'Định nghĩa $\\sin, \\cos, \\tan, \\cot$ trên đường tròn lượng giác và các hệ thức lượng giác cơ bản.',
    externalUrl: 'https://phieu-hoc-tap-mon-toanthpt.netlify.app/phieu-hoc-tap-toan11/bai-1-gia-tri-luong-giac-cua-goc-luong-giac.html',
    theorySummary: `### 1. Các hệ thức cơ bản
- $\\sin^2 \\alpha + \\cos^2 \\alpha = 1$
- $1 + \\tan^2 \\alpha = \\frac{1}{\\cos^2 \\alpha}$ ($\\alpha \\ne \\frac{\\pi}{2} + k\\pi$)
- $1 + \\cot^2 \\alpha = \\frac{1}{\\sin^2 \\alpha}$ ($\\alpha \\ne k\\pi$)
- $\\tan \\alpha \\cdot \\cot \\alpha = 1$`,
    questions: [
      {
        id: 'q_11_02_1',
        question: 'Cho $\\cos \\alpha = \\frac{3}{5}$ với $0 < \\alpha < \\frac{\\pi}{2}$. Tính $\\sin \\alpha$:',
        options: [
          '$\\frac{4}{5}$',
          '$-\\frac{4}{5}$',
          '$\\frac{2}{5}$',
          '$\\frac{16}{25}$'
        ],
        correctIndex: 0,
        solution: 'Vì $0 < \\alpha < \\frac{\\pi}{2}$ nên $\\sin \\alpha > 0$. $\\sin \\alpha = \\sqrt{1 - \\cos^2 \\alpha} = \\sqrt{1 - \\frac{9}{25}} = \\frac{4}{5}$.'
      }
    ],
    isPublished: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'ws_11_03',
    title: 'Bài 2: Công thức lượng giác',
    grade: 'Toán 11',
    chapter: 'Chương I: Hàm số lượng giác & Phương trình lượng giác',
    description: 'Công thức cộng, công thức nhân đôi, công thức hạ bậc, công thức biến đổi tích thành tổng và tổng thành tích.',
    externalUrl: 'https://phieu-hoc-tap-mon-toanthpt.netlify.app/phieu-hoc-tap-toan11/bai-2-cong-thuc-luong-giac.html',
    theorySummary: `### 1. Công thức cộng
- $\\cos(a \\pm b) = \\cos a \\cos b \\mp \\sin a \\sin b$
- $\\sin(a \\pm b) = \\sin a \\cos b \\pm \\cos a \\sin b$

### 2. Công thức nhân đôi & Hạ bậc
- $\\sin 2a = 2\\sin a \\cos a$
- $\\cos 2a = \\cos^2 a - \\sin^2 a = 2\\cos^2 a - 1 = 1 - 2\\sin^2 a$
- $\\cos^2 a = \\frac{1 + \\cos 2a}{2}; \\quad \\sin^2 a = \\frac{1 - \\cos 2a}{2}$`,
    questions: [
      {
        id: 'q_11_03_1',
        question: 'Rút gọn biểu thức $P = \\sin a \\cos b - \\cos a \\sin b$ ta được:',
        options: [
          '$\\sin(a - b)$',
          '$\\sin(a + b)$',
          '$\\cos(a - b)$',
          '$\\cos(a + b)$'
        ],
        correctIndex: 0,
        solution: 'Theo công thức cộng sin: $\\sin(a - b) = \\sin a \\cos b - \\cos a \\sin b$.'
      }
    ],
    isPublished: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'ws_11_04',
    title: 'Bài 3: Hàm số lượng giác',
    grade: 'Toán 11',
    chapter: 'Chương I: Hàm số lượng giác & Phương trình lượng giác',
    description: 'Tập xác định, tính chẵn lẻ, chu kì tuần hoàn và đồ thị của $y = \\sin x, \\cos x, \\tan x, \\cot x$.',
    externalUrl: 'https://phieu-hoc-tap-mon-toanthpt.netlify.app/phieu-hoc-tap-toan11/bai-3-ham-so-luong-giac.html',
    theorySummary: `### Chu kì và tính chẵn lẻ
- $y = \\sin x$: hàm số lẻ, chu kì $T = 2\\pi$, tập xác định $D = \\mathbb{R}$.
- $y = \\cos x$: hàm số chẵn, chu kì $T = 2\\pi$, tập xác định $D = \\mathbb{R}$.
- $y = \\tan x$: hàm số lẻ, chu kì $T = \\pi$, tập xác định $D = \\mathbb{R} \\setminus \\{\\frac{\\pi}{2} + k\\pi\\}$.`,
    questions: [
      {
        id: 'q_11_04_1',
        question: 'Tập xác định của hàm số $y = \\tan x$ là:',
        options: [
          '$D = \\mathbb{R} \\setminus \\left\\{\\frac{\\pi}{2} + k\\pi, k \\in \\mathbb{Z}\\right\\}$',
          '$D = \\mathbb{R} \\setminus \\{k\\pi, k \\in \\mathbb{Z}\\}$',
          '$D = \\mathbb{R}$',
          '$D = [-1; 1]$'
        ],
        correctIndex: 0,
        solution: '$\\tan x = \\frac{\\sin x}{\\cos x}$, điều kiện $\\cos x \\ne 0 \\Leftrightarrow x \\ne \\frac{\\pi}{2} + k\\pi$.'
      }
    ],
    isPublished: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'ws_11_05',
    title: 'Bài 4: Phương trình lượng giác cơ bản',
    grade: 'Toán 11',
    chapter: 'Chương I: Hàm số lượng giác & Phương trình lượng giác',
    description: 'Nghiệm của các phương trình $\\sin x = m, \\cos x = m, \\tan x = m, \\cot x = m$.',
    externalUrl: 'https://phieu-hoc-tap-mon-toanthpt.netlify.app/phieu-hoc-tap-toan11/bai-4-phuong-trinh-luong-giac-co-ban.html',
    theorySummary: `### Công thức nghiệm
- $\\sin x = \\sin \\alpha \\Leftrightarrow \\begin{cases} x = \\alpha + k2\\pi \\\\ x = \\pi - \\alpha + k2\\pi \\end{cases} (k \\in \\mathbb{Z})$
- $\\cos x = \\cos \\alpha \\Leftrightarrow x = \\pm \\alpha + k2\\pi (k \\in \\mathbb{Z})$
- $\\tan x = \\tan \\alpha \\Leftrightarrow x = \\alpha + k\\pi (k \\in \\mathbb{Z})$`,
    questions: [
      {
        id: 'q_11_05_1',
        question: 'Nghiệm của phương trình $\\sin x = 0$ là:',
        options: [
          '$x = k\\pi, k \\in \\mathbb{Z}$',
          '$x = \\frac{\\pi}{2} + k\\pi, k \\in \\mathbb{Z}$',
          '$x = k2\\pi, k \\in \\mathbb{Z}$',
          '$x = \\frac{\\pi}{2} + k2\\pi, k \\in \\mathbb{Z}$'
        ],
        correctIndex: 0,
        solution: '$\\sin x = 0 \\Leftrightarrow x = k\\pi (k \\in \\mathbb{Z})$.'
      }
    ],
    isPublished: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'ws_11_06',
    title: 'Bài 5: Dãy số',
    grade: 'Toán 11',
    chapter: 'Chương II: Dãy số. Cấp số cộng và Cấp số nhân',
    description: 'Định nghĩa dãy số, cách cho dãy số, dãy số tăng, dãy số giảm và dãy số bị chặn.',
    externalUrl: 'https://phieu-hoc-tap-mon-toanthpt.netlify.app/phieu-hoc-tap-toan11/bai-5-day-so.html',
    theorySummary: `### 1. Dãy số tăng / giảm
- Dãy $(u_n)$ tăng $\\Leftrightarrow u_{n+1} > u_n$ với mọi $n \\ge 1$.
- Dãy $(u_n)$ giảm $\\Leftrightarrow u_{n+1} < u_n$ với mọi $n \\ge 1$.

### 2. Dãy số bị chặn
- Bị chặn trên nếu $\\exists M: u_n \\le M$. Bị chặn dưới nếu $\\exists m: u_n \\ge m$.`,
    questions: [
      {
        id: 'q_11_06_1',
        question: 'Cho dãy số $(u_n)$ với $u_n = 2n + 1$. Số hạng thứ 3 của dãy là:',
        options: [
          '$7$',
          '$5$',
          '$9$',
          '$3$'
        ],
        correctIndex: 0,
        solution: '$u_3 = 2(3) + 1 = 7$.'
      }
    ],
    isPublished: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'ws_11_07',
    title: 'Bài 6: Cấp số cộng',
    grade: 'Toán 11',
    chapter: 'Chương II: Dãy số. Cấp số cộng và Cấp số nhân',
    description: 'Định nghĩa công sai $d$, số hạng tổng quát $u_n = u_1 + (n-1)d$ và tổng $n$ số hạng đầu $S_n$.',
    externalUrl: 'https://phieu-hoc-tap-mon-toanthpt.netlify.app/phieu-hoc-tap-toan11/bai-6-cap-so-cong.html',
    theorySummary: `### Cấp số cộng (CSC)
- Định nghĩa: $u_{n+1} = u_n + d$.
- Số hạng tổng quát: $u_n = u_1 + (n - 1)d$.
- Tổng $n$ số hạng đầu: $S_n = \\frac{n(u_1 + u_n)}{2} = \\frac{n[2u_1 + (n-1)d]}{2}$.`,
    questions: [
      {
        id: 'q_11_07_1',
        question: 'Cho cấp số cộng có $u_1 = 3$ và công sai $d = 4$. Số hạng thứ 5 là:',
        options: [
          '$19$',
          '$15$',
          '$23$',
          '$17$'
        ],
        correctIndex: 0,
        solution: '$u_5 = u_1 + 4d = 3 + 4(4) = 19$.'
      }
    ],
    isPublished: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'ws_11_08',
    title: 'Bài 7: Cấp số nhân',
    grade: 'Toán 11',
    chapter: 'Chương II: Dãy số. Cấp số cộng và Cấp số nhân',
    description: 'Định nghĩa công bội $q$, số hạng tổng quát $u_n = u_1 \\cdot q^{n-1}$ và tổng $S_n$.',
    externalUrl: 'https://phieu-hoc-tap-mon-toanthpt.netlify.app/phieu-hoc-tap-toan11/bai-7-cap-so-nhan.html',
    theorySummary: `### Cấp số nhân (CSN)
- Định nghĩa: $u_{n+1} = u_n \\cdot q$.
- Số hạng tổng quát: $u_n = u_1 \\cdot q^{n-1}$.
- Tổng $n$ số hạng đầu ($q \\ne 1$): $S_n = \\frac{u_1(1 - q^n)}{1 - q}$.`,
    questions: [
      {
        id: 'q_11_08_1',
        question: 'Cho cấp số nhân có $u_1 = 2$ và công bội $q = 3$. Số hạng $u_4$ bằng:',
        options: [
          '$54$',
          '$18$',
          '$162$',
          '$24$'
        ],
        correctIndex: 0,
        solution: '$u_4 = u_1 \\cdot q^3 = 2 \\cdot 3^3 = 2 \\cdot 27 = 54$.'
      }
    ],
    isPublished: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'ws_11_09',
    title: 'Bài 8: Mẫu số liệu ghép nhóm',
    grade: 'Toán 11',
    chapter: 'Chương III: Các số đặc trưng đo xu thế trung tâm của mẫu số liệu ghép nhóm',
    description: 'Khái niệm nhóm, tần số, độ dài nhóm, giá trị đại diện và bảng phân bố ghép nhóm.',
    externalUrl: 'https://phieu-hoc-tap-mon-toanthpt.netlify.app/phieu-hoc-tap-toan11/bai-8-mau-so-lieu-ghep-nhom.html',
    theorySummary: `### 1. Bảng số liệu ghép nhóm
- Nhóm $[a; b)$ có giá trị đại diện $c = \\frac{a + b}{2}$, độ dài nhóm $l = b - a$.
- Tần số $m_i$ là số quan sát rơi vào nhóm tương ứng.`,
    questions: [
      {
        id: 'q_11_09_1',
        question: 'Giá trị đại diện của nhóm $[20; 30)$ là:',
        options: [
          '$25$',
          '$20$',
          '$30$',
          '$10$'
        ],
        correctIndex: 0,
        solution: '$c = \\frac{20 + 30}{2} = 25$.'
      }
    ],
    isPublished: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'ws_11_10',
    title: 'Bài 9: Các số đặc trưng đo xu thế trung tâm (Ghép nhóm)',
    grade: 'Toán 11',
    chapter: 'Chương III: Các số đặc trưng đo xu thế trung tâm của mẫu số liệu ghép nhóm',
    description: 'Số trung bình, trung vị, tứ phân vị và mốt của mẫu số liệu ghép nhóm.',
    externalUrl: 'https://phieu-hoc-tap-mon-toanthpt.netlify.app/phieu-hoc-tap-toan11/bai-9-cac-so-dac-trung-do-xu-the-trung-tam.html',
    theorySummary: `### Công thức
- Số trung bình: $\\bar{x} = \\frac{\\sum m_i c_i}{n}$.
- Trung vị ghép nhóm: $M_e = u_m + \\frac{\\frac{n}{2} - C}{n_m} \\cdot (u_{m+1} - u_m)$.`,
    questions: [
      {
        id: 'q_11_10_1',
        question: 'Trong mẫu ghép nhóm, số trung bình được tính xấp xỉ bằng:',
        options: [
          'Trung bình có trọng số của các giá trị đại diện',
          'Trung vị của các đầu mút nhóm',
          'Giá trị xuất hiện nhiều nhất',
          'Hiệu của hai đầu mút'
        ],
        correctIndex: 0,
        solution: 'Ta dùng giá trị đại diện của từng nhóm nhân với tần số tương ứng rồi chia cho tổng kích thước mẫu $n$.'
      }
    ],
    isPublished: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'ws_11_11',
    title: 'Bài 10: Đường thẳng và mặt phẳng trong không gian',
    grade: 'Toán 11',
    chapter: 'Chương IV: Quan hệ song song trong không gian',
    description: 'Các tiên đề hình học không gian, cách xác định mặt phẳng và giao tuyến của hai mặt phẳng.',
    externalUrl: 'https://phieu-hoc-tap-mon-toanthpt.netlify.app/phieu-hoc-tap-toan11/bai-10-duong-thang-va-mat-phang-trong-khong-gian.html',
    theorySummary: `### Cách xác định một mặt phẳng
- Qua ba điểm không thẳng hàng.
- Qua một đường thẳng và một điểm nằm ngoài đường thẳng đó.
- Qua hai đường thẳng cắt nhau hoặc song song.`,
    questions: [
      {
        id: 'q_11_11_1',
        question: 'Có bao nhiêu mặt phẳng đi qua 3 điểm phân biệt không thẳng hàng?',
        options: [
          'Duy nhất 1 mặt phẳng',
          'Vô số mặt phẳng',
          '2 mặt phẳng',
          'Không có mặt phẳng nào'
        ],
        correctIndex: 0,
        solution: 'Theo tiên đề hình học không gian, có một và chỉ một mặt phẳng đi qua 3 điểm không thẳng hàng.'
      }
    ],
    isPublished: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'ws_11_12',
    title: 'Bài 11: Hai đường thẳng song song',
    grade: 'Toán 11',
    chapter: 'Chương IV: Quan hệ song song trong không gian',
    description: 'Vị trí tương đối của hai đường thẳng trong không gian: cắt nhau, song song, trùng nhau và chéo nhau.',
    externalUrl: 'https://phieu-hoc-tap-mon-toanthpt.netlify.app/phieu-hoc-tap-toan11/bai-11-hai-duong-thang-song-song.html',
    theorySummary: `### Hai đường thẳng chéo nhau
- Hai đường thẳng gọi là chéo nhau nếu chúng không đồng phẳng (không cùng nằm trên bất kì mặt phẳng nào).`,
    questions: [
      {
        id: 'q_11_12_1',
        question: 'Hai đường thẳng không có điểm chung trong không gian thì:',
        options: [
          'Song song hoặc chéo nhau',
          'Chắc chắn song song',
          'Chắc chắn chéo nhau',
          'Cắt nhau'
        ],
        correctIndex: 0,
        solution: 'Nếu cùng nằm trên một mặt phẳng thì chúng song song; nếu không cùng nằm trên mặt phẳng nào thì chúng chéo nhau.'
      }
    ],
    isPublished: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'ws_11_13',
    title: 'Bài 12: Đường thẳng và mặt phẳng song song',
    grade: 'Toán 11',
    chapter: 'Chương IV: Quan hệ song song trong không gian',
    description: 'Điều kiện để đường thẳng song song với mặt phẳng, định lí giao tuyến song song.',
    externalUrl: 'https://phieu-hoc-tap-mon-toanthpt.netlify.app/phieu-hoc-tap-toan11/bai-12-duong-thang-va-mat-phang-song-song.html',
    theorySummary: `### Định lí nhận biết $d \\parallel (\\alpha)$
- Nếu đường thẳng $d$ không nằm trong $(\\alpha)$ và song song với một đường thẳng $d'$ nằm trong $(\\alpha)$ thì $d \\parallel (\\alpha)$.`,
    questions: [
      {
        id: 'q_11_13_1',
        question: 'Để chứng minh đường thẳng $d$ song song với $(\\alpha)$, ta cần chứng minh:',
        options: [
          '$d \\not\\subset (\\alpha)$ và $d$ song song với một đường thẳng $d\' \\subset (\\alpha)$',
          '$d$ cắt $(\\alpha)$ tại 1 điểm',
          '$d$ vuông góc với $(\\alpha)$',
          '$d$ chứa trong $(\\alpha)$'
        ],
        correctIndex: 0,
        solution: 'Định lí cơ bản: $d \\not\\subset (\\alpha)$ và $d \\parallel d\' \\subset (\\alpha) \\Rightarrow d \\parallel (\\alpha)$.'
      }
    ],
    isPublished: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'ws_11_14',
    title: 'Bài 13: Hai mặt phẳng song song',
    grade: 'Toán 11',
    chapter: 'Chương IV: Quan hệ song song trong không gian',
    description: 'Điều kiện hai mặt phẳng song song, tính chất và định lí Ta-lét trong không gian.',
    externalUrl: 'https://phieu-hoc-tap-mon-toanthpt.netlify.app/phieu-hoc-tap-toan11/bai-13-hai-mat-phang-song-song.html',
    theorySummary: `### Điều kiện $(\\alpha) \\parallel (\\beta)$
- Nếu $(\\alpha)$ chứa hai đường thẳng cắt nhau cùng song song với $(\\beta)$ thì $(\\alpha) \\parallel (\\beta)$.`,
    questions: [
      {
        id: 'q_11_14_1',
        question: 'Nếu mặt phẳng $(P)$ song song với $(Q)$ thì mọi đường thẳng trong $(P)$ đều:',
        options: [
          'Song song với $(Q)$',
          'Cắt $(Q)$',
          'Vuông góc với $(Q)$',
          'Nằm trong $(Q)$'
        ],
        correctIndex: 0,
        solution: 'Do $(P) \\cap (Q) = \\emptyset$, bất kì đường thẳng $a \\subset (P)$ đều không có điểm chung với $(Q)$, tức $a \\parallel (Q)$.'
      }
    ],
    isPublished: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'ws_11_15',
    title: 'Bài 14: Phép chiếu song song',
    grade: 'Toán 11',
    chapter: 'Chương IV: Quan hệ song song trong không gian',
    description: 'Định nghĩa phép chiếu song song, phương chiếu, mặt phẳng chiếu và hình biểu diễn của các hình không gian.',
    externalUrl: 'https://phieu-hoc-tap-mon-toanthpt.netlify.app/phieu-hoc-tap-toan11/bai-14-phep-chieu-song-song.html',
    theorySummary: `### Tính chất phép chiếu song song
- Biến đường thẳng thành đường thẳng (hoặc điểm).
- Bảo toàn quan hệ song song của hai đường thẳng.
- Bảo toàn tỉ số độ dài của hai đoạn thẳng cùng nằm trên một đường thẳng hoặc trên hai đường thẳng song song.`,
    questions: [
      {
        id: 'q_11_15_1',
        question: 'Hình chiếu song song của một hình bình hành có thể là hình nào sau đây?',
        options: [
          'Hình bình hành hoặc đoạn thẳng',
          'Hình tam giác',
          'Hình thang vuông',
          'Đường tròn'
        ],
        correctIndex: 0,
        solution: 'Phép chiếu song song bảo toàn tính song song, do đó biến hình bình hành thành hình bình hành (hoặc thành đoạn thẳng nếu phương chiếu song song với mặt phẳng chứa hình).'
      }
    ],
    isPublished: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'ws_11_16',
    title: 'Bài 15: Giới hạn của dãy số',
    grade: 'Toán 11',
    chapter: 'Chương V: Giới hạn. Hàm số liên tục',
    description: 'Định nghĩa $\\lim u_n = a$, các định lí về giới hạn hữu hạn, giới hạn vô cực và tổng của cấp số nhân lùi vô hạn.',
    externalUrl: 'https://phieu-hoc-tap-mon-toanthpt.netlify.app/phieu-hoc-tap-toan11/bai-15-gioi-han-cua-day-so.html',
    theorySummary: `### Các giới hạn cơ bản
- $\\lim \\frac{1}{n^k} = 0 (k > 0)$.
- $\\lim q^n = 0$ nếu $|q| < 1$.
- Tổng cấp số nhân lùi vô hạn ($|q| < 1$): $S = \\frac{u_1}{1 - q}$.`,
    questions: [
      {
        id: 'q_11_16_1',
        question: 'Tính giới hạn $L = \\lim \\frac{2n + 1}{n + 3}$:',
        options: [
          '$2$',
          '$1$',
          '$0$',
          '$+\\infty$'
        ],
        correctIndex: 0,
        solution: 'Chia cả tử và mẫu cho $n$: $L = \\lim \\frac{2 + \\frac{1}{n}}{1 + \\frac{3}{n}} = \\frac{2 + 0}{1 + 0} = 2$.'
      }
    ],
    isPublished: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'ws_11_17',
    title: 'Bài 16: Giới hạn của hàm số',
    grade: 'Toán 11',
    chapter: 'Chương V: Giới hạn. Hàm số liên tục',
    description: 'Giới hạn hàm số tại một điểm, giới hạn một bên, giới hạn tại vô cực và các dạng vô định $\\frac{0}{0}, \\frac{\\infty}{\\infty}$.',
    externalUrl: 'https://phieu-hoc-tap-mon-toanthpt.netlify.app/phieu-hoc-tap-toan11/bai-16-gioi-han-cua-ham-so.html',
    theorySummary: `### Giới hạn tại một điểm
- $\\lim_{x \\to x_0} f(x) = L \\Leftrightarrow \\lim_{x \\to x_0^+} f(x) = \\lim_{x \\to x_0^-} f(x) = L$.
- Dạng vô định $\\frac{0}{0}$: phân tích thành nhân tử $(x - x_0)$ hoặc nhân liên hợp để triệt tiêu.`,
    questions: [
      {
        id: 'q_11_17_1',
        question: 'Tính $\\lim_{x \\to 2} \\frac{x^2 - 4}{x - 2}$:',
        options: [
          '$4$',
          '$0$',
          '$2$',
          'Không tồn tại'
        ],
        correctIndex: 0,
        solution: '$\\lim_{x \\to 2} \\frac{(x-2)(x+2)}{x-2} = \\lim_{x \\to 2} (x + 2) = 4$.'
      }
    ],
    isPublished: true,
    createdAt: new Date().toISOString()
  },

  // =========================================================================
  // ============================ TOÁN 12 (11 BÀI) ============================
  // =========================================================================
  {
    id: 'ws_12_01',
    title: 'Bài 1: Tính đơn điệu và cực trị của hàm số',
    grade: 'Toán 12',
    chapter: 'Chương I: Ứng dụng đạo hàm để khảo sát và vẽ đồ thị hàm số',
    description: 'Điều kiện đủ để hàm số đồng biến, nghịch biến; cực đại, cực tiểu và quy tắc tìm cực trị bằng đạo hàm cấp 1, cấp 2.',
    externalUrl: 'https://phieu-hoc-tap-mon-toanthpt.netlify.app/phieu-hoc-tap-toan12/bai-1-tinh-don-dieu-va-cuc-tri-cua-ham-so.html',
    theorySummary: `### 1. Tính đơn điệu
- $y' > 0$ trên $(a; b) \\Rightarrow$ hàm số đồng biến trên $(a; b)$.
- $y' < 0$ trên $(a; b) \\Rightarrow$ hàm số nghịch biến trên $(a; b)$.

### 2. Cực trị của hàm số
- Nếu $y'$ đổi dấu từ $+$ sang $-$ qua $x_0$ thì $x_0$ là điểm **cực đại**.
- Nếu $y'$ đổi dấu từ $-$ sang $+$ qua $x_0$ thì $x_0$ là điểm **cực tiểu**.`,
    questions: [
      {
        id: 'q_12_01_1',
        question: 'Cho hàm số $y = x^3 - 3x^2 + 2$. Điểm cực đại của hàm số là:',
        options: [
          '$x = 0$',
          '$x = 2$',
          '$x = 1$',
          '$y = 2$'
        ],
        correctIndex: 0,
        solution: '$y\' = 3x^2 - 6x = 3x(x - 2)$. $y\' = 0 \\Leftrightarrow x = 0$ hoặc $x = 2$. Qua $x = 0$, $y\'$ đổi dấu từ dương sang âm nên $x = 0$ là điểm cực đại.'
      }
    ],
    isPublished: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'ws_12_02',
    title: 'Bài 2: Giá trị lớn nhất và giá trị nhỏ nhất của hàm số',
    grade: 'Toán 12',
    chapter: 'Chương I: Ứng dụng đạo hàm để khảo sát và vẽ đồ thị hàm số',
    description: 'Quy tắc tìm GTLN, GTNN trên một đoạn $[a; b]$, trên một khoảng và bài toán tối ưu thực tế.',
    externalUrl: 'https://phieu-hoc-tap-mon-toanthpt.netlify.app/phieu-hoc-tap-toan12/bai-2-gia-tri-lon-nhat-va-gia-tri-nho-nhat-cua-ham-so.html',
    theorySummary: `### Tìm GTLN, GTNN trên đoạn $[a; b]$
- **Bước 1:** Tính $y'$, giải phương trình $y' = 0$ tìm các nghiệm $x_i \\in [a; b]$.
- **Bước 2:** Tính $y(a), y(b)$ và các giá trị $y(x_i)$.
- **Bước 3:** $\\max = \\max\\{y(a), y(b), y(x_i)\\}$, $\\min = \\min\\{y(a), y(b), y(x_i)\\}$.`,
    questions: [
      {
        id: 'q_12_02_1',
        question: 'Giá trị lớn nhất của hàm số $y = -x^2 + 4x + 1$ trên đoạn $[0; 3]$ là:',
        options: [
          '$5$',
          '$4$',
          '$1$',
          '$6$'
        ],
        correctIndex: 0,
        solution: '$y\' = -2x + 4 = 0 \\Leftrightarrow x = 2 \\in [0; 3]$. Ta có $y(0) = 1, y(3) = 4, y(2) = 5$. Vậy $\\max = 5$ tại $x = 2$.'
      }
    ],
    isPublished: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'ws_12_03',
    title: 'Bài 3: Đường tiệm cận của đồ thị hàm số',
    grade: 'Toán 12',
    chapter: 'Chương I: Ứng dụng đạo hàm để khảo sát và vẽ đồ thị hàm số',
    description: 'Định nghĩa tiệm cận đứng, tiệm cận ngang và tiệm cận xiên của đồ thị hàm số.',
    externalUrl: 'https://phieu-hoc-tap-mon-toanthpt.netlify.app/phieu-hoc-tap-toan12/bai-3-duong-tiem-can-cua-do-thi-ham-so.html',
    theorySummary: `### Định nghĩa tiệm cận
- **Tiệm cận ngang:** $\\lim_{x \\to \\pm\\infty} y = y_0 \\Rightarrow y = y_0$.
- **Tiệm cận đứng:** $\\lim_{x \\to x_0^{\\pm}} y = \\pm\\infty \\Rightarrow x = x_0$.
- **Tiệm cận xiên:** $\\lim_{x \\to \\pm\\infty} [y - (ax + b)] = 0 \\Rightarrow y = ax + b$.`,
    questions: [
      {
        id: 'q_12_03_1',
        question: 'Đường tiệm cận đứng của đồ thị hàm số $y = \\frac{2x - 1}{x - 3}$ là:',
        options: [
          '$x = 3$',
          '$y = 2$',
          '$x = \\frac{1}{2}$',
          '$y = -3$'
        ],
        correctIndex: 0,
        solution: 'Mẫu số bằng 0 khi $x = 3$ và tử số khác 0, nên $\\lim_{x \\to 3^\\pm} y = \\pm\\infty$. Do đó $x = 3$ là tiệm cận đứng.'
      }
    ],
    isPublished: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'ws_12_04',
    title: 'Bài 4: Khảo sát sự biến thiên và vẽ đồ thị hàm số',
    grade: 'Toán 12',
    chapter: 'Chương I: Ứng dụng đạo hàm để khảo sát và vẽ đồ thị hàm số',
    description: 'Sơ đồ khảo sát hàm số bậc ba, hàm phân thức bậc nhất/bậc nhất và bậc hai/bậc nhất.',
    externalUrl: 'https://phieu-hoc-tap-mon-toanthpt.netlify.app/phieu-hoc-tap-toan12/bai-4-do-thi-cua-ham-so.html',
    theorySummary: `### Các bước khảo sát hàm số
1. Tập xác định.
2. Sự biến thiên: chiều biến thiên, cực trị, tiệm cận, bảng biến thiên.
3. Vẽ đồ thị: các điểm đặc biệt, giao điểm trục tọa độ, tâm đối xứng, trục đối xứng.`,
    questions: [
      {
        id: 'q_12_04_1',
        question: 'Đồ thị hàm số bậc ba $y = ax^3 + bx^2 + cx + d$ ($a \\ne 0$) luôn có tâm đối xứng là:',
        options: [
          'Điểm uốn của đồ thị ($y\'\' = 0$)',
          'Gốc tọa độ $O$',
          'Điểm cực đại',
          'Điểm cực tiểu'
        ],
        correctIndex: 0,
        solution: 'Tâm đối xứng của đồ thị hàm số bậc ba luôn là điểm uốn $I(x_0; y_0)$ với $x_0$ thỏa mãn $y\'\'(x_0) = 0$.'
      }
    ],
    isPublished: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'ws_12_05',
    title: 'Chương 1: Tổng hợp kiến thức & Bài tập ôn tập',
    grade: 'Toán 12',
    chapter: 'Chương I: Ứng dụng đạo hàm để khảo sát và vẽ đồ thị hàm số',
    description: 'Tổng ôn luyện toàn bộ kiến thức chương 1: đơn điệu, cực trị, min-max, tiệm cận và tương giao đồ thị.',
    externalUrl: 'https://phieu-hoc-tap-mon-toanthpt.netlify.app/phieu-hoc-tap-toan12/chuong1-tong-hop-t12.html',
    theorySummary: `### Tổng kết kiến thức Chương 1
- Bảng biến thiên hàm số và dấu đạo hàm.
- Tương giao đồ thị: số nghiệm phương trình $f(x) = m$ chính là số giao điểm của đồ thị $y = f(x)$ với đường thẳng $y = m$.`,
    questions: [
      {
        id: 'q_12_05_1',
        question: 'Đồ thị hàm số $y = f(x)$ có bảng biến thiên với giá trị cực đại là 3, cực tiểu là -1. Phương trình $f(x) = 2$ có bao nhiêu nghiệm?',
        options: [
          '$3$ nghiệm',
          '$2$ nghiệm',
          '$1$ nghiệm',
          'Vô nghiệm'
        ],
        correctIndex: 0,
        solution: 'Vì $-1 < 2 < 3$, đường thẳng $y = 2$ cắt 3 nhánh của đồ thị hàm số bậc 3, nên phương trình có 3 nghiệm phân biệt.'
      }
    ],
    isPublished: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'ws_12_06',
    title: 'Bài 5: Ứng dụng đạo hàm giải quyết bài toán thực tiễn',
    grade: 'Toán 12',
    chapter: 'Chương I: Ứng dụng đạo hàm để khảo sát và vẽ đồ thị hàm số',
    description: 'Các bài toán tối ưu chi phí, tối ưu thể tích, diện tích và vận tốc trong thực tế.',
    externalUrl: 'https://phieu-hoc-tap-mon-toanthpt.netlify.app/phieu-hoc-tap-toan12/bai-5-ung-dung-dao-ham-de-giai-quyet-mot-so-van-de-lien-quan-den-thuc-tien.html',
    theorySummary: `### Phương pháp giải bài toán thực tiễn
1. Thiết lập hàm mục tiêu $f(x)$ cần tối ưu (thể tích, chi phí...).
2. Xác định tập giá trị biến $x$ từ giả thiết thực tế ($x \\in (a; b)$).
3. Khảo sát đạo hàm tìm giá trị lớn nhất hoặc nhỏ nhất.`,
    questions: [
      {
        id: 'q_12_06_1',
        question: 'Người ta muốn uốn một sợi dây kim loại dài 20m thành một hình chữ nhật có diện tích lớn nhất. Chiều dài và chiều rộng tương ứng là:',
        options: [
          '$5$m và $5$m (hình vuông)',
          '$6$m và $4$m',
          '$7$m và $3$m',
          '$8$m và $2$m'
        ],
        correctIndex: 0,
        solution: 'Nửa chu vi là 10m. Gọi cạnh là $x \\Rightarrow S = x(10 - x) = -x^2 + 10x$. Diện tích đạt cực đại khi $x = 5$m, tức là hình vuông cạnh 5m.'
      }
    ],
    isPublished: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'ws_12_07',
    title: 'Bài 6: Véctơ trong không gian',
    grade: 'Toán 12',
    chapter: 'Chương II: Véctơ và hệ tọa độ trong không gian',
    description: 'Quy tắc hình hộp, ba véctơ đồng phẳng, tích vô hướng trong không gian và góc giữa hai véctơ.',
    externalUrl: 'https://phieu-hoc-tap-mon-toanthpt.netlify.app/phieu-hoc-tap-toan12/bai-6-vecto-trong-khong-gian.html',
    theorySummary: `### Quy tắc hình hộp
- Cho hình hộp $ABCD.A'B'C'D'$, ta có:
  $\\vec{AC'} = \\vec{AB} + \\vec{AD} + \\vec{AA'}$.`,
    questions: [
      {
        id: 'q_12_07_1',
        question: 'Trong hình hộp $ABCD.A\'B\'C\'D\', khẳng định nào sau đây là ĐÚNG?',
        options: [
          '$\\vec{AC\'} = \\vec{AB} + \\vec{AD} + \\vec{AA\'}$',
          '$\\vec{AC\'} = \\vec{AB} + \\vec{BC} + \\vec{CD}$',
          '$\\vec{AC\'} = \\vec{A\'B\'} + \\vec{A\'D\'}$',
          '$\\vec{AC\'} = \\vec{BD}$'
        ],
        correctIndex: 0,
        solution: 'Theo quy tắc hình hộp: đường chéo xuất phát từ đỉnh $A$ bằng tổng ba véctơ cạnh chung gốc $A$: $\\vec{AC\'} = \\vec{AB} + \\vec{AD} + \\vec{AA\'}$.'
      }
    ],
    isPublished: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'ws_12_08',
    title: 'Bài 7: Hệ trục tọa độ trong không gian',
    grade: 'Toán 12',
    chapter: 'Chương II: Véctơ và hệ tọa độ trong không gian',
    description: 'Hệ trục tọa độ Oxyz, tọa độ của điểm, tọa độ véctơ và các tính chất cơ bản.',
    externalUrl: 'https://phieu-hoc-tap-mon-toanthpt.netlify.app/phieu-hoc-tap-toan12/bai-7-he-truc-toa-do-trong-khong-gian.html',
    theorySummary: `### Hệ tọa độ Oxyz
- Điểm $M(x; y; z) \\Leftrightarrow \\vec{OM} = x\\vec{i} + y\\vec{j} + z\\vec{k}$.
- Khoảng cách hai điểm: $AB = \\sqrt{(x_B - x_A)^2 + (y_B - y_A)^2 + (z_B - z_A)^2}$.`,
    questions: [
      {
        id: 'q_12_08_1',
        question: 'Trong không gian $Oxyz$, hình chiếu vuông góc của điểm $M(1; 2; 3)$ lên mặt phẳng $(Oxy)$ là điểm:',
        options: [
          '$M\'(1; 2; 0)$',
          '$M\'(1; 0; 3)$',
          '$M\'(0; 2; 3)$',
          '$M\'(0; 0; 3)$'
        ],
        correctIndex: 0,
        solution: 'Chiếu lên $(Oxy)$ thì cao độ $z = 0$, giữ nguyên hoành độ và tung độ: $M\'(1; 2; 0)$.'
      }
    ],
    isPublished: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'ws_12_09',
    title: 'Bài 8: Biểu thức tọa độ của các phép toán véctơ',
    grade: 'Toán 12',
    chapter: 'Chương II: Véctơ và hệ tọa độ trong không gian',
    description: 'Cộng trừ véctơ, nhân với một số, tích vô hướng, độ dài véctơ và tích có hướng trong Oxyz.',
    externalUrl: 'https://phieu-hoc-tap-mon-toanthpt.netlify.app/phieu-hoc-tap-toan12/bai-8-bieu-thuc-toa-do-cua-cac-phep-toan-vecto.html',
    theorySummary: `### Biểu thức tọa độ
- $\\vec{u} \\cdot \\vec{v} = x_1 x_2 + y_1 y_2 + z_1 z_2$.
- Độ dài: $|\\vec{u}| = \\sqrt{x^2 + y^2 + z^2}$.
- Tích có hướng $[\\vec{u}, \\vec{v}] = (y_1 z_2 - z_1 y_2; z_1 x_2 - x_1 z_2; x_1 y_2 - y_1 x_2)$.`,
    questions: [
      {
        id: 'q_12_09_1',
        question: 'Cho $\\vec{a} = (1; -2; 2)$. Độ dài của véctơ $\\vec{a}$ bằng:',
        options: [
          '$3$',
          '$9$',
          '$\\sqrt{5}$',
          '$1$'
        ],
        correctIndex: 0,
        solution: '$|\\vec{a}| = \\sqrt{1^2 + (-2)^2 + 2^2} = \\sqrt{1 + 4 + 4} = \\sqrt{9} = 3$.'
      }
    ],
    isPublished: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'ws_12_10',
    title: 'Bài 9: Khoảng biến thiên và khoảng tứ phân vị (Lớp 12)',
    grade: 'Toán 12',
    chapter: 'Chương III: Các số đặc trưng đo độ phân tán của mẫu số liệu ghép nhóm',
    description: 'Cách tính khoảng biến thiên $R$ và khoảng tứ phân vị $\\Delta_Q$ cho mẫu số liệu ghép nhóm.',
    externalUrl: 'https://phieu-hoc-tap-mon-toanthpt.netlify.app/phieu-hoc-tap-toan12/bai-9-khoang-bien-thien-va-khoang-tu-phan-vi.html',
    theorySummary: `### Mẫu số liệu ghép nhóm
- Khoảng biến thiên: $R = a_{k+1} - a_1$ (hiệu giữa đầu mút phải nhóm cuối và đầu mút trái nhóm đầu).
- Khoảng tứ phân vị: $\\Delta_Q = Q_3 - Q_1$.`,
    questions: [
      {
        id: 'q_12_10_1',
        question: 'Mẫu số liệu ghép nhóm được chia thành 4 nhóm từ $[10; 20)$ đến $[40; 50)$. Khoảng biến thiên là:',
        options: [
          '$40$',
          '$50$',
          '$10$',
          '$30$'
        ],
        correctIndex: 0,
        solution: '$R = 50 - 10 = 40$.'
      }
    ],
    isPublished: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'ws_12_11',
    title: 'Bài 10: Phương sai và độ lệch chuẩn của mẫu ghép nhóm',
    grade: 'Toán 12',
    chapter: 'Chương III: Các số đặc trưng đo độ phân tán của mẫu số liệu ghép nhóm',
    description: 'Công thức tính phương sai $s^2$ và độ lệch chuẩn $s = \\sqrt{s^2}$ cho mẫu số liệu ghép nhóm.',
    externalUrl: 'https://phieu-hoc-tap-mon-toanthpt.netlify.app/phieu-hoc-tap-toan12/bai-10-phuong-sai-va-do-lech-chuan.html',
    theorySummary: `### Phương sai & Độ lệch chuẩn ghép nhóm
- $s^2 = \\frac{1}{n} \\sum_{i=1}^k m_i (c_i - \\bar{x})^2 = \\frac{1}{n} \\sum_{i=1}^k m_i c_i^2 - (\\bar{x})^2$.
- Độ lệch chuẩn: $s = \\sqrt{s^2}$.`,
    questions: [
      {
        id: 'q_12_11_1',
        question: 'Độ lệch chuẩn $s$ có cùng đơn vị đo với:',
        options: [
          'Dấu hiệu điều tra ban đầu của mẫu số liệu',
          'Bình phương đơn vị của mẫu số liệu',
          'Không có đơn vị đo',
          'Phần trăm (%)'
        ],
        correctIndex: 0,
        solution: 'Độ lệch chuẩn $s = \\sqrt{s^2}$ nên có cùng đơn vị đo với mẫu số liệu ban đầu (khác với phương sai có đơn vị bình phương).'
      }
    ],
    isPublished: true,
    createdAt: new Date().toISOString()
  }
];
