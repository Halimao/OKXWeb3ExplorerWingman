// 从链接中提取交易哈希
function extractTxHash(href) {
  // 匹配以/tx/开头的交易哈希（0x开头的64位十六进制字符串）
  const match = href.match(/\/tx\/(0x[0-9a-fA-F]{64})/);
  return match ? match[1] : null;
}

// 修改链接属性
function modifyLinks() {
  // 获取所有符合条件的a标签
  const links = document.querySelectorAll('a.dex-powerLink-a11y.dex-powerLink');

  // 从存储中获取用户自定义的交易浏览器前缀
  chrome.storage.sync.get(['browserPrefix'], function (result) {
    // 默认使用BSCscan作为交易浏览器
    const defaultPrefix = 'https://bscscan.com/tx/';
    const prefix = result.browserPrefix || defaultPrefix;

    links.forEach(link => {
      // 设置target为_blank，在新标签页打开
      link.target = '_blank';

      // 提取交易哈希并修改href
      const txHash = extractTxHash(link.href);
      if (txHash) {
        link.href = prefix + txHash;
      }
    });
  });
}

// 页面加载完成后执行
window.addEventListener('load', modifyLinks);

// 监听页面动态内容变化，处理动态加载的链接
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.addedNodes.length) {
      modifyLinks();
    }
  });
});

// 监视整个页面的变化
observer.observe(document.body, {
  childList: true,
  subtree: true
});
