// Waline 浏览量：构建期批量拉取（Astro frontmatter 里 await，Node 环境）。
// 与 guestbook.astro 共用 WALINE_SERVER_URL；失败/超时返回空对象，保证构建成功，
// 缺的数字由访客端 pageview 模块回填。
const BASE = import.meta.env.WALINE_SERVER_URL ?? '';

// GET /api/article 的响应行不含 path，行序与请求的 path 顺序一一对应
// （官方 pageview.js 同样按索引对应）；CSV 存储下 time 可能是字符串，统一 Number()。
export async function fetchPageviews(paths: string[]): Promise<Record<string, number>> {
  if (!BASE || paths.length === 0) return {};
  try {
    const q = encodeURIComponent(paths.join(','));
    const res = await fetch(`${BASE}/api/article?path=${q}&type=time`, {
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return {};
    const json: { errno?: number; data?: { time?: number | string }[] } = await res.json();
    if (!json || json.errno || !Array.isArray(json.data)) return {};
    return Object.fromEntries(paths.map((p, i) => [p, Number(json.data?.[i]?.time ?? 0)]));
  } catch {
    return {};
  }
}
