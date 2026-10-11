/**
 * HỆ THỐNG DỮ LIỆU GỐC & CỨU HỘ CHO GAME KÉO THẢ TƯƠNG TÁC
 * Đảm bảo 100% không bao giờ bị trắng màn hình nếu học sinh hoặc giáo viên xóa nhầm dữ liệu
 */
export const DEFAULT_KEO_THA_DATABASE: Record<string, any> = {
  "Chuyên đề 1: Tính Đơn Điệu & Cực Trị Hàm Số": {
    1: {
      title: "Hàm Bậc 3", diffBadge: "Dễ", colorTheme: "blue", time: 180,
      funcs: [
        { id: 'f1', tex: 'y = x^3 - 3x', theme: 'blue' },
        { id: 'f2', tex: 'y = -x^3 + 3x^2', theme: 'emerald' },
        { id: 'f3', tex: 'y = x^3 + 3x + 1', theme: 'violet' },
        { id: 'f4', tex: 'y = \\frac{1}{3}x^3 - x^2 + x', theme: 'amber' },
        { id: 'f5', tex: 'y = -x^3 - x + 2', theme: 'rose' }
      ],
      props: [
        { id: 'p1_1', funcId: 'f1', text: 'Hàm số đạt cực đại tại $x = -1$' },
        { id: 'p1_2', funcId: 'f1', text: 'Hàm số đạt cực tiểu tại $x = 1$' },
        { id: 'p1_3', funcId: 'f1', text: 'Hàm số đồng biến trên khoảng $(1; +\\infty)$' },
        { id: 'p1_4', funcId: 'f1', text: 'Hàm số nghịch biến trên khoảng $(-1; 1)$' },
        { id: 'p1_5', funcId: 'f1', text: 'Giá trị cực tiểu của hàm số là $y_{CT} = -2$' },
        
        { id: 'p2_1', funcId: 'f2', text: 'Hàm số đạt cực đại tại $x = 2$' },
        { id: 'p2_2', funcId: 'f2', text: 'Hàm số đạt cực tiểu tại $x = 0$' },
        { id: 'p2_3', funcId: 'f2', text: 'Hàm số đồng biến trên khoảng $(0; 2)$' },
        { id: 'p2_4', funcId: 'f2', text: 'Hàm số nghịch biến trên khoảng $(2; +\\infty)$' },
        { id: 'p2_5', funcId: 'f2', text: 'Giá trị cực đại của hàm số bằng $4$' },
        
        { id: 'p3_1', funcId: 'f3', text: 'Hàm số không có cực trị' },
        { id: 'p3_2', funcId: 'f3', text: 'Hàm số luôn đồng biến trên $\\mathbb{R}$' },
        { id: 'p3_3', funcId: 'f3', text: 'Đạo hàm $y\' > 0, \\forall x \\in \\mathbb{R}$' },
        { id: 'p3_4', funcId: 'f3', text: 'Hàm số không có điểm cực đại' },
        { id: 'p3_5', funcId: 'f3', text: 'Hàm số đồng biến trên khoảng $(-\\infty; +\\infty)$' },
        
        { id: 'p4_1', funcId: 'f4', text: 'Hàm số đồng biến trên $\\mathbb{R}$' },
        { id: 'p4_2', funcId: 'f4', text: 'Đạo hàm $y\' \\ge 0, \\forall x \\in \\mathbb{R}$' },
        { id: 'p4_3', funcId: 'f4', text: 'Hàm số không đạt cực trị tại $x = 1$' },
        { id: 'p4_4', funcId: 'f4', text: 'Hàm số không có điểm cực tiểu' },
        { id: 'p4_5', funcId: 'f4', text: 'Đạo hàm của hàm số không đổi dấu' },
        
        { id: 'p5_1', funcId: 'f5', text: 'Hàm số luôn nghịch biến trên $\\mathbb{R}$' },
        { id: 'p5_2', funcId: 'f5', text: 'Đạo hàm $y\' < 0, \\forall x \\in \\mathbb{R}$' },
        { id: 'p5_3', funcId: 'f5', text: 'Hàm số không có cực trị' },
        { id: 'p5_4', funcId: 'f5', text: 'Hàm số nghịch biến trên khoảng $(-\\infty; +\\infty)$' },
        { id: 'p5_5', funcId: 'f5', text: 'Hàm số không có điểm cực đại' }
      ]
    },
    2: {
      title: "Hàm Trùng Phương", diffBadge: "Vừa", colorTheme: "cyan", time: 180,
      funcs: [
        { id: 'f1', tex: 'y = x^4 - 2x^2 + 1', theme: 'cyan' },
        { id: 'f2', tex: 'y = -x^4 + 2x^2', theme: 'violet' },
        { id: 'f3', tex: 'y = x^4 + 2x^2 - 3', theme: 'emerald' },
        { id: 'f4', tex: 'y = -x^4 - x^2 + 2', theme: 'amber' },
        { id: 'f5', tex: 'y = \\frac{1}{2}x^4 - x^2', theme: 'rose' }
      ],
      props: [
        { id: 'p1_1', funcId: 'f1', text: 'Đồ thị có 3 điểm cực trị tạo thành tam giác cân' },
        { id: 'p1_2', funcId: 'f1', text: 'Hàm số đạt cực đại tại $x = 0$' },
        { id: 'p1_3', funcId: 'f1', text: 'Hàm số có 2 điểm cực tiểu tại $x = \\pm 1$' },
        { id: 'p1_4', funcId: 'f1', text: 'Hàm số đồng biến trên các khoảng $(-1; 0)$ và $(1; +\\infty)$' },
        
        { id: 'p2_1', funcId: 'f2', text: 'Hàm số đạt cực tiểu tại $x = 0$' },
        { id: 'p2_2', funcId: 'f2', text: 'Hàm số có 2 điểm cực đại tại $x = \\pm 1$' },
        { id: 'p2_3', funcId: 'f2', text: 'Giá trị cực đại của hàm số bằng $1$' },
        { id: 'p2_4', funcId: 'f2', text: 'Hàm số nghịch biến trên $(1; +\\infty)$' },
        
        { id: 'p3_1', funcId: 'f3', text: 'Hàm số chỉ có 1 điểm cực trị' },
        { id: 'p3_2', funcId: 'f3', text: 'Hàm số đạt cực tiểu tại $x = 0$' },
        { id: 'p3_3', funcId: 'f3', text: 'Hàm số không có điểm cực đại' },
        { id: 'p3_4', funcId: 'f3', text: 'Hàm số đồng biến trên khoảng $(0; +\\infty)$' },
        
        { id: 'p4_1', funcId: 'f4', text: 'Hàm số chỉ có đúng 1 điểm cực trị' },
        { id: 'p4_2', funcId: 'f4', text: 'Hàm số đạt cực đại tại $x = 0$' },
        { id: 'p4_3', funcId: 'f4', text: 'Hàm số không có cực tiểu' },
        { id: 'p4_4', funcId: 'f4', text: 'Đạo hàm $y\' = -4x^3 - 2x$' },
        
        { id: 'p5_1', funcId: 'f5', text: 'Đồ thị hàm số đi qua gốc tọa độ $O(0;0)$' },
        { id: 'p5_2', funcId: 'f5', text: 'Hàm số đạt cực đại tại $x = 0$' },
        { id: 'p5_3', funcId: 'f5', text: 'Giá trị cực tiểu bằng $-\\frac{1}{2}$' },
        { id: 'p5_4', funcId: 'f5', text: 'Hàm số nghịch biến trên khoảng $(-\\infty; -1)$' }
      ]
    },
    3: {
      title: "Hàm Phân Thức Bậc 1/Bậc 1", diffBadge: "Vừa", colorTheme: "emerald", time: 180,
      funcs: [
        { id: 'f1', tex: 'y = \\frac{2x+1}{x-1}', theme: 'emerald' },
        { id: 'f2', tex: 'y = \\frac{x-2}{x+1}', theme: 'blue' },
        { id: 'f3', tex: 'y = \\frac{-x+3}{2x-1}', theme: 'amber' },
        { id: 'f4', tex: 'y = \\frac{3x-2}{x-2}', theme: 'rose' }
      ],
      props: [
        { id: 'p1_1', funcId: 'f1', text: 'Hàm số không có cực trị' },
        { id: 'p1_2', funcId: 'f1', text: 'Hàm số nghịch biến trên từng khoảng xác định' },
        { id: 'p1_3', funcId: 'f1', text: 'Đạo hàm $y\' = \\frac{-3}{(x-1)^2} < 0, \\forall x \\ne 1$' },
        { id: 'p1_4', funcId: 'f1', text: 'Tiệm cận đứng $x = 1$, tiệm cận ngang $y = 2$' },

        { id: 'p2_1', funcId: 'f2', text: 'Hàm số đồng biến trên từng khoảng xác định' },
        { id: 'p2_2', funcId: 'f2', text: 'Đạo hàm $y\' = \\frac{3}{(x+1)^2} > 0, \\forall x \\ne -1$' },
        { id: 'p2_3', funcId: 'f2', text: 'Hàm số không có điểm cực đại hay cực tiểu' },
        { id: 'p2_4', funcId: 'f2', text: 'Tiệm cận đứng $x = -1$, tiệm cận ngang $y = 1$' },

        { id: 'p3_1', funcId: 'f3', text: 'Hàm số nghịch biến trên $(-\\infty; \\frac{1}{2})$ và $(\\frac{1}{2}; +\\infty)$' },
        { id: 'p3_2', funcId: 'f3', text: 'Đạo hàm $y\' = \\frac{-5}{(2x-1)^2} < 0, \\forall x \\ne \\frac{1}{2}$' },
        { id: 'p3_3', funcId: 'f3', text: 'Tiệm cận đứng $x = \\frac{1}{2}$, tiệm cận ngang $y = -\\frac{1}{2}$' },
        { id: 'p3_4', funcId: 'f3', text: 'Không tồn tại giá trị cực trị của hàm số' },

        { id: 'p4_1', funcId: 'f4', text: 'Hàm số nghịch biến trên khoảng $(2; +\\infty)$' },
        { id: 'p4_2', funcId: 'f4', text: 'Đạo hàm $y\' = \\frac{-4}{(x-2)^2} < 0, \\forall x \\ne 2$' },
        { id: 'p4_3', funcId: 'f4', text: 'Đồ thị hàm số có tâm đối xứng là $I(2; 3)$' },
        { id: 'p4_4', funcId: 'f4', text: 'Tiệm cận đứng $x = 2$, tiệm cận ngang $y = 3$' }
      ]
    },
    4: {
      title: "Hàm Phân Thức Bậc 2/Bậc 1", diffBadge: "Khó", colorTheme: "violet", time: 200,
      funcs: [
        { id: 'f1', tex: 'y = \\frac{x^2 - x + 1}{x - 1}', theme: 'violet' },
        { id: 'f2', tex: 'y = \\frac{x^2 + 2x - 3}{x + 1}', theme: 'cyan' },
        { id: 'f3', tex: 'y = \\frac{-x^2 + x + 2}{x - 2}', theme: 'rose' }
      ],
      props: [
        { id: 'p1_1', funcId: 'f1', text: 'Hàm số đạt cực đại tại $x = 0$ với $y_{CĐ} = -1$' },
        { id: 'p1_2', funcId: 'f1', text: 'Hàm số đạt cực tiểu tại $x = 2$ với $y_{CT} = 3$' },
        { id: 'p1_3', funcId: 'f1', text: 'Đồng biến trên $(-\\infty; 0)$ và $(2; +\\infty)$' },
        { id: 'p1_4', funcId: 'f1', text: 'Tiệm cận xiên $y = x$, tiệm cận đứng $x = 1$' },

        { id: 'p2_1', funcId: 'f2', text: 'Đạo hàm $y\' = \\frac{x^2 + 2x + 5}{(x+1)^2} > 0, \\forall x \\ne -1$' },
        { id: 'p2_2', funcId: 'f2', text: 'Hàm số luôn đồng biến trên từng khoảng xác định' },
        { id: 'p2_3', funcId: 'f2', text: 'Hàm số không có điểm cực trị' },
        { id: 'p2_4', funcId: 'f2', text: 'Tiệm cận xiên $y = x + 1$, tiệm cận đứng $x = -1$' },

        { id: 'p3_1', funcId: 'f3', text: 'Hàm số đạt cực trị tại 2 điểm phân biệt' },
        { id: 'p3_2', funcId: 'f3', text: 'Tiệm cận xiên của đồ thị là đường thẳng $y = -x - 1$' },
        { id: 'p3_3', funcId: 'f3', text: 'Tiệm cận đứng của đồ thị hàm số là $x = 2$' },
        { id: 'p3_4', funcId: 'f3', text: 'Đồ thị cắt trục tung tại điểm $(0; -1)$' }
      ]
    },
    5: {
      title: "Hàm Chứa Căn Thức", diffBadge: "Khó", colorTheme: "amber", time: 210,
      funcs: [
        { id: 'f1', tex: 'y = \\sqrt{4 - x^2}', theme: 'amber' },
        { id: 'f2', tex: 'y = x - \\sqrt{x}', theme: 'blue' },
        { id: 'f3', tex: 'y = \\sqrt{x^2 - 2x + 5}', theme: 'emerald' }
      ],
      props: [
        { id: 'p1_1', funcId: 'f1', text: 'Tập xác định $D = [-2; 2]$' },
        { id: 'p1_2', funcId: 'f1', text: 'Hàm số đạt giá trị lớn nhất $y = 2$ tại $x = 0$' },
        { id: 'p1_3', funcId: 'f1', text: 'Hàm số đồng biến trên khoảng $(-2; 0)$' },
        { id: 'p1_4', funcId: 'f1', text: 'Hàm số nghịch biến trên khoảng $(0; 2)$' },

        { id: 'p2_1', funcId: 'f2', text: 'Tập xác định $D = [0; +\\infty)$' },
        { id: 'p2_2', funcId: 'f2', text: 'Hàm số đạt cực tiểu tại $x = \\frac{1}{4}$' },
        { id: 'p2_3', funcId: 'f2', text: 'Giá trị nhỏ nhất của hàm số là $y = -\\frac{1}{4}$' },
        { id: 'p2_4', funcId: 'f2', text: 'Hàm số đồng biến trên khoảng $(\\frac{1}{4}; +\\infty)$' },

        { id: 'p3_1', funcId: 'f3', text: 'Hàm số có tập xác định $D = \\mathbb{R}$' },
        { id: 'p3_2', funcId: 'f3', text: 'Hàm số đạt cực tiểu tại $x = 1$ với $y_{CT} = 2$' },
        { id: 'p3_3', funcId: 'f3', text: 'Hàm số không có điểm cực đại' },
        { id: 'p3_4', funcId: 'f3', text: 'Hàm số nghịch biến trên khoảng $(-\\infty; 1)$' }
      ]
    }
  },
  "Chuyên đề 2: Tiệm Cận & Khảo Sát Đồ Thị": {
    1: {
      title: "Tiệm Cận Đứng & Tiệm Cận Ngang", diffBadge: "Dễ", colorTheme: "cyan", time: 180,
      funcs: [
        { id: 'f1', tex: 'y = \\frac{3x - 1}{x + 2}', theme: 'cyan' },
        { id: 'f2', tex: 'y = \\frac{2}{x^2 - 1}', theme: 'violet' },
        { id: 'f3', tex: 'y = \\frac{x}{x^2 + 1}', theme: 'emerald' }
      ],
      props: [
        { id: 'p1_1', funcId: 'f1', text: 'Tiệm cận đứng là $x = -2$' },
        { id: 'p1_2', funcId: 'f1', text: 'Tiệm cận ngang là $y = 3$' },
        { id: 'p1_3', funcId: 'f1', text: 'Tâm đối xứng của đồ thị là $I(-2; 3)$' },
        { id: 'p1_4', funcId: 'f1', text: 'Đồ thị cắt trục hoành tại điểm $(\\frac{1}{3}; 0)$' },

        { id: 'p2_1', funcId: 'f2', text: 'Có 2 đường tiệm cận đứng là $x = 1$ và $x = -1$' },
        { id: 'p2_2', funcId: 'f2', text: 'Tiệm cận ngang duy nhất là trục hoành $y = 0$' },
        { id: 'p2_3', funcId: 'f2', text: 'Đồ thị có tổng cộng 3 đường tiệm cận' },
        { id: 'p2_4', funcId: 'f2', text: 'Đồ thị hàm số nhận trục tung làm trục đối xứng' },

        { id: 'p3_1', funcId: 'f3', text: 'Hàm số không có đường tiệm cận đứng' },
        { id: 'p3_2', funcId: 'f3', text: 'Tiệm cận ngang là $y = 0$' },
        { id: 'p3_3', funcId: 'f3', text: 'Đồ thị đi qua gốc tọa độ $O(0;0)$' },
        { id: 'p3_4', funcId: 'f3', text: 'Tập xác định của hàm số là $\\mathbb{R}$' }
      ]
    }
  }
};
