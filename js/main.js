/**
 * 黑美人服飾開發有限公司 (Black A Beauty)
 * 官方網站前端互動邏輯庫 v2.0
 */

document.addEventListener('DOMContentLoaded', () => {
  initFittingRoom();
  initCollegeSearch();
  initCategoryFilter();
  initMobileNav();
});

/* ==========================================================================
   1. 學院色即時互動試衣間 (Interactive Fitting Room)
   ========================================================================== */
function initFittingRoom() {
  const bachelorSvg = document.getElementById('interactiveBachelorSvg');
  const masterSvg = document.getElementById('interactiveMasterSvg');
  const bachelorTab = document.getElementById('tabBachelor');
  const masterTab = document.getElementById('tabMaster');
  const swatchesContainer = document.getElementById('collegeSwatches');
  const collegeInfoText = document.getElementById('collegeInfoText');

  if (!bachelorSvg || !masterSvg || !bachelorTab || !masterTab) return;

  let currentMode = 'bachelor'; // 'bachelor' | 'master'

  // 學院配色資料庫
  const collegeSchemes = [
    {
      id: 'arts',
      name: '文學院 / 社會科學',
      desc: '象徵典雅思辨與人文底蘊，以純淨銀白領巾搭配白帽穗。',
      bachelor: {
        light: '#FFFFFF',
        mid: '#E2E8F0',
        dark: '#94A3B8',
        darkest: '#64748B',
        tassel: '#FFFFFF',
        tasselLight: '#F8FAFC',
        tasselDark: '#CBD5E1'
      },
      master: {
        light: '#F8FAFC',
        color: '#E2E8F0',
        dark: '#94A3B8',
        darkest: '#475569',
        tassel: '#FFFFFF',
        tasselLight: '#F8FAFC',
        tasselDark: '#CBD5E1'
      },
      swatchColor: '#E2E8F0'
    },
    {
      id: 'engineering',
      name: '工學院 / 科技工程',
      desc: '科技之源，以皇家寶藍領巾搭配經典翡翠綠帽穗。',
      bachelor: {
        light: '#93C5FD',
        mid: '#2563EB',
        dark: '#1D4ED8',
        darkest: '#1E3A8A',
        tassel: '#16A34A',
        tasselLight: '#4ADE80',
        tasselDark: '#15803D'
      },
      master: {
        light: '#93C5FD',
        color: '#2563EB',
        dark: '#1D4ED8',
        darkest: '#1E3A8A',
        tassel: '#16A34A',
        tasselLight: '#4ADE80',
        tasselDark: '#15803D'
      },
      swatchColor: '#2563EB'
    },
    {
      id: 'agriculture',
      name: '農學院 / 生物資源',
      desc: '大地豐饒之色，耀眼琥珀金橘領巾搭配鮮紅絲質帽穗。',
      bachelor: {
        light: '#FED7AA',
        mid: '#FB923C',
        dark: '#EA580C',
        darkest: '#9A3412',
        tassel: '#DC2626',
        tasselLight: '#F87171',
        tasselDark: '#991B1B'
      },
      master: {
        light: '#FED7AA',
        color: '#EA580C',
        dark: '#C2410C',
        darkest: '#7C2D12',
        tassel: '#DC2626',
        tasselLight: '#F87171',
        tasselDark: '#991B1B'
      },
      swatchColor: '#EA580C'
    },
    {
      id: 'law',
      name: '法學院 / 公共事務',
      desc: '莊重嚴謹之風，尊貴紫羅蘭領巾搭配鮮綠絲質流蘇。',
      bachelor: {
        light: '#F3E8FF',
        mid: '#C084FC',
        dark: '#9333EA',
        darkest: '#581C87',
        tassel: '#16A34A',
        tasselLight: '#4ADE80',
        tasselDark: '#15803D'
      },
      master: {
        light: '#F5D0FE',
        color: '#C026D3',
        dark: '#A21CAF',
        darkest: '#701A75',
        tassel: '#C026D3',
        tasselLight: '#F5D0FE',
        tasselDark: '#701A75'
      },
      swatchColor: '#9333EA'
    },
    {
      id: 'management',
      name: '管理學院 / 商學經濟',
      desc: '經世濟民，尊榮香檳金黃領巾搭配耀眼金黃流蘇。',
      bachelor: {
        light: '#FEF08A',
        mid: '#FACC15',
        dark: '#CA8A04',
        darkest: '#854D0E',
        tassel: '#EAB308',
        tasselLight: '#FEF08A',
        tasselDark: '#A16207'
      },
      master: {
        light: '#FFFBEB',
        color: '#F59E0B',
        dark: '#D97706',
        darkest: '#78350F',
        tassel: '#F59E0B',
        tasselLight: '#FFFBEB',
        tasselDark: '#B45309'
      },
      swatchColor: '#F59E0B'
    },
    {
      id: 'medicine',
      name: '醫學院 / 護理公衛',
      desc: '生命關懷之色，晶亮天青藍領巾搭配純白流蘇。',
      bachelor: {
        light: '#E0F2FE',
        mid: '#38BDF8',
        dark: '#0284C7',
        darkest: '#0369A1',
        tassel: '#0284C7',
        tasselLight: '#7DD3FC',
        tasselDark: '#075985'
      },
      master: {
        light: '#E0F2FE',
        color: '#0284C7',
        dark: '#0369A1',
        darkest: '#0C4A6E',
        tassel: '#0284C7',
        tasselLight: '#7DD3FC',
        tasselDark: '#075985'
      },
      swatchColor: '#0284C7'
    }
  ];

  let currentScheme = collegeSchemes[0];

  // 渲染色籤按鈕
  function renderSwatches() {
    swatchesContainer.innerHTML = '';
    collegeSchemes.forEach(scheme => {
      const btn = document.createElement('button');
      btn.className = `college-swatch-btn ${scheme.id === currentScheme.id ? 'active' : ''}`;
      btn.innerHTML = `
        <span class="swatch-color-circle" style="background-color: ${scheme.swatchColor};"></span>
        <span>${scheme.name}</span>
      `;
      btn.addEventListener('click', () => {
        currentScheme = scheme;
        document.querySelectorAll('.college-swatch-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        applyCurrentStyle();
      });
      swatchesContainer.appendChild(btn);
    });
  }

  // 套用樣式到目前顯示的 SVG
  function applyCurrentStyle() {
    if (currentMode === 'bachelor') {
      const c = currentScheme.bachelor;
      bachelorSvg.style.setProperty('--stole-light', c.light);
      bachelorSvg.style.setProperty('--stole-mid', c.mid);
      bachelorSvg.style.setProperty('--stole-dark', c.dark);
      bachelorSvg.style.setProperty('--stole-darkest', c.darkest);
      bachelorSvg.style.setProperty('--tassel-color', c.tassel);
      bachelorSvg.style.setProperty('--tassel-light', c.tasselLight);
      bachelorSvg.style.setProperty('--tassel-dark', c.tasselDark);
    } else {
      const c = currentScheme.master;
      masterSvg.style.setProperty('--hood-light', c.light);
      masterSvg.style.setProperty('--hood-color', c.color);
      masterSvg.style.setProperty('--hood-dark', c.dark);
      masterSvg.style.setProperty('--hood-darkest', c.darkest);
      masterSvg.style.setProperty('--tassel-color', c.tassel);
      masterSvg.style.setProperty('--tassel-light', c.tasselLight);
      masterSvg.style.setProperty('--tassel-dark', c.tasselDark);
    }

    collegeInfoText.innerHTML = `<strong>${currentScheme.name}</strong>：${currentScheme.desc}`;
  }

  bachelorTab.addEventListener('click', () => {
    if (currentMode === 'bachelor') return;
    currentMode = 'bachelor';
    bachelorTab.classList.add('active');
    masterTab.classList.remove('active');
    bachelorSvg.style.display = 'block';
    masterSvg.style.display = 'none';
    applyCurrentStyle();
  });

  masterTab.addEventListener('click', () => {
    if (currentMode === 'master') return;
    currentMode = 'master';
    masterTab.classList.add('active');
    bachelorTab.classList.remove('active');
    bachelorSvg.style.display = 'none';
    masterSvg.style.display = 'block';
    applyCurrentStyle();
  });

  renderSwatches();
  applyCurrentStyle();
}

/* ==========================================================================
   2. 75 所大專院校即時搜尋檢索模組 (Instant College Search & Region Filter)
   ========================================================================== */
function initCollegeSearch() {
  const searchInput = document.getElementById('collegeSearchInput');
  const regionBtns = document.querySelectorAll('.region-btn');
  const tagsContainer = document.getElementById('collegeTagsContainer');
  const countDisplay = document.getElementById('searchCountDisplay');

  if (!searchInput || !tagsContainer) return;

  // 原始 75 所院校完整名單及地域劃分
  const colleges = [
    // 北部 (26)
    { name: '清華大學', region: 'north' },
    { name: '台北大學', region: 'north' },
    { name: '輔仁大學', region: 'north' },
    { name: '東吳大學', region: 'north' },
    { name: '元智大學', region: 'north' },
    { name: '文化學院', region: 'north' },
    { name: '政治大學', region: 'north' },
    { name: '台灣師大', region: 'north' },
    { name: '新竹師大', region: 'north' },
    { name: '台北師大', region: 'north' },
    { name: '台北商院', region: 'north' },
    { name: '北台學院', region: 'north' },
    { name: '聖約翰大學', region: 'north' },
    { name: '中華大學', region: 'north' },
    { name: '聯合大學', region: 'north' },
    { name: '德明學院', region: 'north' },
    { name: '德霖學院', region: 'north' },
    { name: '東南大學', region: 'north' },
    { name: '實踐大學', region: 'north' },
    { name: '景文學院', region: 'north' },
    { name: '藝術大學', region: 'north' },
    { name: '亞東學院', region: 'north' },
    { name: '台北科大', region: 'north' },
    { name: '醒吾大學', region: 'north' },
    { name: '南亞學院', region: 'north' },
    { name: '大漢學院', region: 'north' },

    // 中部 (12)
    { name: '中原大學', region: 'central' },
    { name: '虎尾學院', region: 'central' },
    { name: '台中學院', region: 'central' },
    { name: '環球學院', region: 'central' },
    { name: '中洲學院', region: 'central' },
    { name: '空中大學', region: 'central' },
    { name: '雲林科大', region: 'central' },
    { name: '大葉大學', region: 'central' },
    { name: '建國大學', region: 'central' },
    { name: '中台學院', region: 'central' },
    { name: '南開學院', region: 'central' },
    { name: '台灣體院', region: 'central' },

    // 南部 (34)
    { name: '中正大學', region: 'south' },
    { name: '中山大學', region: 'south' },
    { name: '成功大學', region: 'south' },
    { name: '高雄大學', region: 'south' },
    { name: '台灣海大', region: 'south' },
    { name: '崑山大學', region: 'south' },
    { name: '輔英大學', region: 'south' },
    { name: '康寧學院', region: 'south' },
    { name: '高雄應大', region: 'south' },
    { name: '高雄科大', region: 'south' },
    { name: '長榮大學', region: 'south' },
    { name: '嘉南大學', region: 'south' },
    { name: '南華大學', region: 'south' },
    { name: '真理大學', region: 'south' },
    { name: '屏東師大', region: 'south' },
    { name: '屏東商院', region: 'south' },
    { name: '屏東科大', region: 'south' },
    { name: '大仁大學', region: 'south' },
    { name: '高醫大學', region: 'south' },
    { name: '美和學院', region: 'south' },
    { name: '永達學院', region: 'south' },
    { name: '立德大學', region: 'south' },
    { name: '致遠學院', region: 'south' },
    { name: '興國學院', region: 'south' },
    { name: '東方學院', region: 'south' },
    { name: '樹德科大', region: 'south' },
    { name: '南台大學', region: 'south' },
    { name: '中華醫院', region: 'south' },
    { name: '高苑大學', region: 'south' },
    { name: '高雄海大', region: 'south' },
    { name: '慈濟大學', region: 'south' },
    { name: '餐旅學院', region: 'south' },
    { name: '高鳳大學', region: 'south' },

    // 東部及離島 (3)
    { name: '花蓮師大', region: 'east' },
    { name: '東華大學', region: 'east' },
    { name: '澎湖海院', region: 'east' }
  ];

  let currentRegion = 'all';
  let searchTerm = '';

  function filterAndRender() {
    tagsContainer.innerHTML = '';
    const filtered = colleges.filter(c => {
      const matchRegion = currentRegion === 'all' || c.region === currentRegion;
      const matchText = !searchTerm || c.name.includes(searchTerm);
      return matchRegion && matchText;
    });

    filtered.forEach(c => {
      const span = document.createElement('span');
      span.className = 'college-badge';
      span.textContent = c.name;
      tagsContainer.appendChild(span);
    });

    if (countDisplay) {
      countDisplay.textContent = `共篩選出 ${filtered.length} 所合作大專院校（全台 75+ 院校名錄持續增加中）`;
    }
  }

  searchInput.addEventListener('input', (e) => {
    searchTerm = e.target.value.trim();
    filterAndRender();
  });

  regionBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      regionBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentRegion = btn.dataset.region;
      filterAndRender();
    });
  });

  filterAndRender();
}

/* ==========================================================================
   3. 全系列學位袍卡片分類篩選 (Category Filter)
   ========================================================================== */
function initCategoryFilter() {
  const pills = document.querySelectorAll('.category-pill');
  const cards = document.querySelectorAll('.regalia-product-card');

  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const cat = pill.dataset.category;

      cards.forEach(card => {
        if (cat === 'all' || card.dataset.category === cat) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

/* ==========================================================================
   4. 手機端抽屜式導航 (Mobile Navigation)
   ========================================================================== */
function initMobileNav() {
  const toggleBtn = document.getElementById('mobileNavToggle');
  const navMenu = document.getElementById('navMenu');

  if (!toggleBtn || !navMenu) return;

  toggleBtn.addEventListener('click', () => {
    const isOpened = navMenu.style.display === 'flex';
    if (isOpened) {
      navMenu.style.display = 'none';
    } else {
      navMenu.style.display = 'flex';
      navMenu.style.flexDirection = 'column';
      navMenu.style.position = 'absolute';
      navMenu.style.top = '76px';
      navMenu.style.left = '0';
      navMenu.style.width = '100%';
      navMenu.style.background = 'rgba(10, 14, 23, 0.98)';
      navMenu.style.padding = '24px';
      navMenu.style.borderBottom = '1px solid var(--border-subtle)';
    }
  });

  navMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        navMenu.style.display = 'none';
      }
    });
  });
}
