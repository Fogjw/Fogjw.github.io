// 自定义 mermaid tag 插件
// 生成 Butterfly 主题识别的 .mermaid-wrap 结构
// 用法：
// {% mermaid %}
// graph TD
//     A --> B
// {% endmermaid %}
hexo.extend.tag.register('mermaid', function(args, content) {
  // 转义 < > 防止被 markdown/highlight 二次处理，保留换行
  const src = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return '<div class="mermaid-wrap"><pre class="mermaid-src" hidden>' + src + '</pre></div>';
}, { ends: true });
