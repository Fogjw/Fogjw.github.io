// 确保 .nojekyll 文件存在于生成目录中
const fs = require('fs');
const path = require('path');

hexo.on('exit', function() {
  const dir = hexo.public_dir;
  if (dir && fs.existsSync(dir)) {
    fs.writeFileSync(path.join(dir, '.nojekyll'), '');
    hexo.log.info('.nojekyll ensured in public dir');
  }
});
