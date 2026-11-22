/**
 * 本地插件：把 ```mermaid 代码块转换为 butterfly 主题可识别的结构。
 *
 * 背景：butterfly 主题的 mermaid 前端脚本只处理两种结构：
 *   1. `{% mermaid %}` tag 输出的 `.mermaid-wrap`（pre.mermaid-src[hidden]）
 *   2. `pre > code.mermaid`（由 codeToMermaid 转换）
 * 而 hexo 8 + hexo-renderer-marked 会把代码块交给 highlight.js 渲染成
 * `<figure class="highlight">`，主题完全找不到 mermaid 内容，导致图不渲染。
 *
 * 本插件在 markdown 渲染前把 ```mermaid 代码块直接替换为与主题
 * `{% mermaid %}` tag 完全一致的结构，主题脚本即可正常渲染。
 * 开关跟随主题配置 `_config.butterfly.yml` 中的 `mermaid.enable`。
 */
'use strict';

const { escapeHTML } = require('hexo-util');

// 匹配 ```mermaid ... ``` 代码块（与 hexo-filter-mermaid-diagrams 同款正则）
const reg = /(\s*)(`{3}) *(mermaid) *\n?([\s\S]+?)\s*(\2)(\n+|$)/g;

function isMermaidEnabled(hexo) {
  // 主题配置优先（_config.butterfly.yml），站点配置兜底
  const themeCfg = hexo.theme && hexo.theme.config && hexo.theme.config.mermaid;
  const siteCfg = hexo.config.mermaid;
  if (themeCfg && typeof themeCfg.enable === 'boolean') return themeCfg.enable;
  if (siteCfg && typeof siteCfg.enable === 'boolean') return siteCfg.enable;
  return true;
}

hexo.extend.filter.register('before_post_render', function (data) {
  if (!isMermaidEnabled(hexo)) return;

  const source = data.source || '';
  const ext = source.substring(source.lastIndexOf('.')).toLowerCase();
  if (['.js', '.css', '.html', '.htm'].indexOf(ext) > -1) return;

  data.content = data.content.replace(reg, function (raw, start, sq, lang, content, eq, end) {
    // 结构与 butterfly 的 mermaid tag 输出一致：
    // <div class="mermaid-wrap"><pre class="mermaid-src" data-config="{}" hidden>...</pre></div>
    return `${start}<div class="mermaid-wrap"><pre class="mermaid-src" data-config="{}" hidden>${escapeHTML(content)}</pre></div>${end}`;
  });
}, 10);
