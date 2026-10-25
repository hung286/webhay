import { TeachingTool } from '../types';

export const getToolEmbedUrl = (tool: TeachingTool): string => {
  let finalUrl = tool.url;

  // --- BỘ ĐỊNH TUYẾN TRÒ CHƠI TOÁN HỌC CÔ LẬP (ROUTER FIX CHỐNG ĐÈ F1) ---
  const lowerName = tool.name.toLowerCase();
  const lowerId = tool.id.toLowerCase();
  const lowerUrl = (tool.url || '').toLowerCase();

  // 1. Bảo Vệ Chiến Hào (Tuyệt đối không để dính F1)
  if (lowerId.includes('chien_hao') || lowerId.includes('chien-hao') || lowerName.includes('chiến hào') || lowerName.includes('chien hao')) {
    finalUrl = '/game-bao-ve-chien-hao.html';
  }
  // 2. Sút Penalty (Tuyệt đối không để dính F1)
  else if (lowerId.includes('sut_pen') || lowerId.includes('sut-pen') || lowerId.includes('penalty') || lowerName.includes('sút pen') || lowerName.includes('sut pen') || lowerName.includes('penalty')) {
    finalUrl = '/game-sut-penalty.html';
  }
  // 3. Đua Xe F1
  else if (lowerId.includes('dua_xe_f1') || lowerId.includes('dua-xe-f1') || lowerId.includes('f1') || lowerName.includes('đua xe f1') || lowerName.includes('f1')) {
    finalUrl = '/game-dua-xe-f1.html';
  }
  // 4. Cờ Cá Ngựa
  else if (lowerId.includes('ca_ngua') || lowerId.includes('ca-ngua') || lowerName.includes('cá ngựa') || lowerName.includes('ca ngua')) {
    finalUrl = '/game-co-ca-ngua.html';
  }
  // 5. Tetris Xếp Gạch
  else if (lowerId.includes('tetris') || lowerId.includes('xep_gach') || lowerId.includes('xep-gach') || lowerName.includes('tetris') || lowerName.includes('xếp gạch')) {
    finalUrl = '/game-xep-gach.html';
  }
  // 6. Hái Táo Luân Phiên
  else if (lowerId.includes('hai_tao') || lowerId.includes('hai-tao') || lowerName.includes('hái táo') || lowerName.includes('hai tao')) {
    finalUrl = '/game-hai-tao.html';
  }
  // 7. Vua Phá Băng
  else if (lowerId.includes('pha_bang') || lowerId.includes('ice_breaker') || lowerName.includes('phá băng') || lowerName.includes('ice breaker')) {
    finalUrl = '/vua-pha-bang-ice-breaker.html';
  }
  // 8. Đào Vàng Tri Thức
  else if (lowerId.includes('dao_vang') || lowerName.includes('đào vàng') || lowerName.includes('gold miner')) {
    finalUrl = '/dao-vang-tri-thuc.html';
  }
  // 9. Bắn Chim Xác Suất
  else if (lowerId.includes('ban_chim') || lowerName.includes('bắn chim')) {
    finalUrl = '/ban-chim-xac-suat10.html';
  }
  // 10. Các công cụ thao tác học tập
  else if (tool.id === 'tool_khao_sat_ham_so_12' || lowerName.includes('khảo sát hàm số') || lowerName.includes('kho sat')) {
    finalUrl = '/khao_sat_ham_so_12.html';
  }
  else if (lowerName.includes('sơ đồ cây') || lowerName.includes('so do cay')) {
    finalUrl = '/so_do_cay_xac_suat.html';
  }
  else if (lowerName.includes('thống kê') || lowerName.includes('thong ke')) {
    finalUrl = '/tro_ly_thong_ke_101112.html';
  }
  else if (lowerName.includes('đường tròn') || lowerName.includes('duong tron')) {
    finalUrl = '/phuong_trinh_duong_tron.html';
  }
  else if (lowerName.includes('thể tích') || lowerName.includes('the tich')) {
    finalUrl = '/tinh_the_tich.html';
  }
  else if (lowerName.includes('diện tích') || lowerName.includes('dien tich') || lowerName.includes('tam giác') || lowerName.includes('tam giac')) {
    finalUrl = '/dien_tich_tam_giac.html';
  }
  else if (lowerName.includes('mặt cầu') || lowerName.includes('mat cau')) {
    finalUrl = '/phuong-trinh-mat-cau.html';
  }
  else if (lowerName.includes('tiết kiệm') || lowerName.includes('tiet kiem') || lowerName.includes('trả góp') || lowerName.includes('tra gop') || lowerName.includes('lãi')) {
    finalUrl = '/lai_don_lai_kep.html';
  }


  
  if (finalUrl.includes('<iframe')) {
    const srcMatch = finalUrl.match(/src=["']([^"']+)["']/);
    if (srcMatch) {
      finalUrl = srcMatch[1];
    }
  }

  if (finalUrl && !/^https?:\/\//i.test(finalUrl) && !finalUrl.startsWith('/') && !finalUrl.startsWith('<') && !/^[a-zA-Z0-9]+$/.test(finalUrl)) {
    finalUrl = 'https://' + finalUrl;
  }

  if (tool.type === 'geogebra') {
    let ggbId = finalUrl;
    
    const isIdOnly = /^[a-zA-Z0-9]{4,}$/.test(ggbId) && !ggbId.includes('http');
    if (isIdOnly) {
       ggbId = ggbId;
    } else {
       const idMatch = ggbId.match(/\/(?:m|classic|calculator|geometry|3d|graphing|id)\/([a-zA-Z0-9]+)(?:\?|$)/);
       if (idMatch) {
         ggbId = idMatch[1];
       } else {
         const slashMatch = ggbId.match(/\/([a-zA-Z0-9]+)(?:\?|$)/);
         if (slashMatch && !ggbId.includes('geogebra.org/material/iframe')) {
           ggbId = slashMatch[1];
         }
       }
    }
    
    if (finalUrl.includes('geogebra.org/material/iframe')) {
        return finalUrl;
    } else if (finalUrl.includes('geogebra.org/classic/') && finalUrl.includes('embed')) {
        return finalUrl;
    } else {
        return `https://www.geogebra.org/material/iframe/id/${ggbId}/width/1280/height/720/border/888888/sfsb/true/smb/false/stb/false/stbh/false/ai/false/asb/false/sri/true/rc/false/ld/false/sdz/true/ctl/false`;
    }
  }

  // Hỗ trợ đường dẫn tương đối khi deploy GitHub Pages (subpath /zuizui2/...)
  
  if (finalUrl.includes('.html')) {
    finalUrl += (finalUrl.includes('?') ? '&' : '?') + 'toolId=' + tool.id;
  }

  const baseUrl = import.meta.env.BASE_URL || '/';
  if (finalUrl.startsWith('/') && baseUrl !== '/') {
    return baseUrl.endsWith('/') ? baseUrl + finalUrl.slice(1) : baseUrl + finalUrl;
  }

  return finalUrl;
};
