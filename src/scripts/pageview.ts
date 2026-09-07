// 访客端：当前页浏览量 +1，并回填页面上所有 .waline-pageview-count[data-path] 元素。
// 只有带 data-pageview（页面规范路径）的页面才触发；动态 import 让
// @waline/client/pageview（<1KB gzip）拆成独立 chunk，其他页面不下载。
const url = document.body.dataset.walineUrl ?? '';
const current = document.querySelector<HTMLElement>('[data-pageview]')?.dataset.pageview;

if (url && current) {
  void import('@waline/client/pageview').then(({ pageviewCount }) =>
    pageviewCount({ serverURL: url, path: current })
  );
}
