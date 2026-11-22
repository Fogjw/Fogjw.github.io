// 页面头部整屏化：归档 / 标签 / 分类 / 友链 / 关于等非首页带图页，
// 生成时把 header 由 not-home-page（400px 小横幅）改写为 full_page（100vh 整屏），
// 并补上首页同款的下滑箭头，使体验与首页一致。
//
// 原理：Butterfly 只有首页（home）走 full_page 布局，其余页面没有页面级开关；
// 因此在 HTML 产物阶段做等价改写，不动主题源码，主题升级也不受影响。
// 若未来 Butterfly 产物结构变化导致本脚本失配，页面会退回普通横幅形态，不会报错。

'use strict';

hexo.extend.filter.register('after_render:html', function (html, data) {
  // 只处理带非首页横幅（not-home-page）的页面
  if (!html || html.indexOf('not-home-page') === -1) return html;

  let out = html;

  // 1) not-home-page -> full_page（含可能存在的 fixed 等附加 class）
  out = out.replace(
    /(<header class=")([^"]*?)not-home-page([^"]*?)(" id="page-header")/,
    '$1$2full_page$3$4'
  );

  // 2) 在页面主头部（第一个 </header>）结束前补上下滑指示箭头
  if (out.indexOf('id="scroll-down"') === -1) {
    const arrow =
      '<div id="scroll-down"><i class="fas fa-angle-down scroll-down-effects"></i></div>';
    out = out.replace('</header>', arrow + '</header>');
  }

  return out;
});
