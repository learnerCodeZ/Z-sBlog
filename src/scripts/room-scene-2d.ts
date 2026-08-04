/**
 * 2D 像素房间 —— AI 生成底图 + 热点交互
 */

interface Hotspot {
  // 百分比定位（0-100，相对图片尺寸）
  x: number; y: number; w: number; h: number;
  id: string;
  tipZh: string;
  tipEn: string;
  action: string;
}

// 热点位置（百分比，相对图片宽高）—— 后续按实际底图微调
const HOTSPOTS: Hotspot[] = [
  // 留言板（暂定左上区域，按实际图调）
  { x: 3, y: 3, w: 12, h: 18, id: 'board', tipZh: '留言板', tipEn: 'Message Board', action: '' },
  // EP 小车（暂定右下区域）
  { x: 72, y: 65, w: 14, h: 18, id: 'ep', tipZh: 'EP小车', tipEn: 'EP Robot', action: '' },
  // 门（暂定右下角）
  { x: 88, y: 60, w: 8, h: 25, id: 'door', tipZh: '返回主页', tipEn: 'Home', action: '' },
];

export function initRoom2D(container: HTMLElement): () => void {
  const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, '');

  // 设置 action URL
  HOTSPOTS[0].action = baseUrl + '/guestbook';
  HOTSPOTS[1].action = baseUrl + '/projects#ep-navigation';
  HOTSPOTS[2].action = baseUrl + '/';

  const isDay = !document.documentElement.classList.contains('light');
  const imgSrc = isDay ? '/room/photos/room-day.png' : '/room/photos/room-night.png';

  // 创建图片
  const img = document.createElement('img');
  img.src = import.meta.env.BASE_URL.replace(/\/$/, '') + (isDay ? '/room/photos/room-day.png' : '/room/photos/room-night.png');
  img.alt = 'Pixel Room';
  img.style.position = 'absolute';
  img.style.top = '0';
  img.style.left = '0';
  img.style.width = '100%';
  img.style.height = '100%';
  img.style.objectFit = 'contain';
  img.style.imageRendering = 'pixelated';
  img.style.transition = 'opacity 0.4s';

  // 创建热点层（覆盖在图片上）
  const overlay = document.createElement('div');
  overlay.style.position = 'absolute';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';

  // 容器设为 relative
  container.style.position = 'relative';

  container.appendChild(img);
  container.appendChild(overlay);

  // 创建热点按钮
  const buttons: HTMLElement[] = [];
  HOTSPOTS.forEach((h) => {
    const btn = document.createElement('a');
    btn.href = h.action;
    btn.style.position = 'absolute';
    btn.style.left = h.x + '%';
    btn.style.top = h.y + '%';
    btn.style.width = h.w + '%';
    btn.style.height = h.h + '%';
    btn.style.cursor = 'pointer';
    btn.style.border = '2px solid transparent';
    btn.style.borderRadius = '4px';
    btn.style.transition = 'border-color 0.2s, box-shadow 0.2s';
    btn.style.textDecoration = 'none';

    btn.addEventListener('mouseenter', () => {
      btn.style.borderColor = 'rgba(232, 177, 102, 0.8)';
      btn.style.boxShadow = '0 0 16px rgba(232, 177, 102, 0.3)';
      const tip = document.getElementById('roomTip');
      if (tip) {
        tip.textContent = document.documentElement.lang === 'en' ? h.tipEn : h.tipZh;
        tip.style.display = 'block';
      }
    });

    btn.addEventListener('mousemove', (e) => {
      const tip = document.getElementById('roomTip');
      if (tip) {
        tip.style.left = (e.clientX + 14) + 'px';
        tip.style.top = (e.clientY + 14) + 'px';
      }
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.borderColor = 'transparent';
      btn.style.boxShadow = 'none';
      const tip = document.getElementById('roomTip');
      if (tip) tip.style.display = 'none';
    });

    overlay.appendChild(btn);
    buttons.push(btn);
  });

  // 昼夜联动
  const obs = new MutationObserver(() => {
    const day = !document.documentElement.classList.contains('light');
    const newSrc = baseUrl + (day ? '/room/photos/room-day.png' : '/room/photos/room-night.png');
    if (img.src !== newSrc) {
      img.style.opacity = '0';
      setTimeout(() => {
        img.src = newSrc;
        img.onload = () => { img.style.opacity = '1'; };
      }, 200);
    }
  });
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

  return () => {
    obs.disconnect();
    if (img.parentNode === container) container.removeChild(img);
    if (overlay.parentNode === container) container.removeChild(overlay);
  };
}
