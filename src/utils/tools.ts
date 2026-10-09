import { TeachingTool } from '../types';

export const getToolEmbedUrl = (tool: TeachingTool): string => {
  let finalUrl = tool.url;

  if (tool.id === 'tool_khao_sat_ham_so_12' || tool.name.includes('Khảo sát hàm số') || tool.name.includes('Kho sAt')) {
    finalUrl = '/khao_sat_ham_so_12.html';
  }
  if (tool.name.toLowerCase().includes('sơ đồ cây') || tool.name.toLowerCase().includes('sơ đ cAy') || tool.name.toLowerCase().includes('so do cay')) {
    finalUrl = '/so_do_cay_xac_suat.html';
  }
  let lowerName = tool.name.toLowerCase();
  if (lowerName.includes('thống kê') || lowerName.includes('thong ke')) {
    finalUrl = '/tro_ly_thong_ke_101112.html';
  }
  if (lowerName.includes('đường tròn') || lowerName.includes('duong tron')) {
    finalUrl = '/phuong_trinh_duong_tron.html';
  }
  if (lowerName.includes('thể tích') || lowerName.includes('the tich')) {
    finalUrl = '/tinh_the_tich.html';
  }
  if (lowerName.includes('diện tích') || lowerName.includes('dien tich') || lowerName.includes('tam giác') || lowerName.includes('tam giac')) {
    finalUrl = '/dien_tich_tam_giac.html';
  }
  if (lowerName.includes('tiết kiệm') || lowerName.includes('tiet kiem') || lowerName.includes('trả góp') || lowerName.includes('tra gop') || lowerName.includes('lãi')) {
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
  const baseUrl = import.meta.env.BASE_URL || '/';
  if (finalUrl.startsWith('/') && baseUrl !== '/') {
    return baseUrl.endsWith('/') ? baseUrl + finalUrl.slice(1) : baseUrl + finalUrl;
  }

  return finalUrl;
};
