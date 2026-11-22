// 文章卡片入场动画（参考 wow.js 效果，零依赖实现）
// 行为：支持 IntersectionObserver 时，卡片默认透明下移，滚入视口后逐个浮现；
// 不支持或脚本被禁用时页面内容保持默认可见（渐进增强，不影响内容展示）。
(function () {
  var items = Array.prototype.slice.call(document.querySelectorAll('.recent-post-item'))
  if (!items.length || !('IntersectionObserver' in window)) return

  var styleId = 'post-reveal-style'
  if (!document.getElementById(styleId)) {
    var st = document.createElement('style')
    st.id = styleId
    st.textContent =
      '.recent-post-item{opacity:0;transform:translateY(26px);transition:opacity .6s ease,transform .6s ease}' +
      '.recent-post-item.post-reveal{opacity:1;transform:none}'
    document.head.appendChild(st)
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('post-reveal')
        io.unobserve(entry.target)
      }
    })
  }, { threshold: 0.12 })

  items.forEach(function (item) { io.observe(item) })
})()
