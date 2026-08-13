// 从链接中提取链名和交易哈希
function extractChainAndTxHash(href) {
  // 匹配格式：/explorer/{chain}/tx/{txHash}
  const match = href.match(/\/explorer\/([a-zA-Z0-9]+)\/tx\/(0x[0-9a-fA-F]{64})/);
  if (match) {
    return { chain: match[1], txHash: match[2] };
  }
  return null;
}

// 提取钱包地址
function extractWalletAddress(linkHref) {
  if (!linkHref) return null;
  // 适配格式：/zh-hans/portfolio/[地址]/analysis?chainIndex=xxx
  const addressRegex = /0x[0-9a-fA-F]{40}/;
  const matchResult = linkHref.match(addressRegex);
  console.log(matchResult);

  if (matchResult) {
    const addr = matchResult[0].trim();
    return addr;
  }

  console.log('未匹配到地址，链接：', linkHref);
  return null;
}

// 检查目标容器是否已添加过DeBank按钮（避免重复添加）
function hasDeBankButton(container) {
  // 通过自定义类名标记，检查容器内是否已有DeBank按钮
  return container.querySelector('.debank-custom-link') !== null;
}

// 修改链接属性
function modifyLinks() {
  // 获取所有符合条件的a标签
  const links = document.querySelectorAll('a.dex-powerLink-a11y.dex-powerLink');

  // 从存储中获取用户自定义的各链交易浏览器前缀
  chrome.storage.sync.get(['chainPrefixes'], function (result) {
    const chainPrefixes = result.chainPrefixes || {};

    links.forEach(link => {
      // 设置target为_blank，在新标签页打开
      link.target = '_blank';

      // 提取链名和交易哈希
      const extracted = extractChainAndTxHash(link.href);
      if (extracted) {
        const { chain, txHash } = extracted;
        // 只有配置了该链的前缀才进行替换，否则保持原始链接
        if (chainPrefixes[chain]) {
          link.href = chainPrefixes[chain] + txHash;
        }
      }
    });
  });
}

// 定位目标容器的新方法：找包含“/portfolio/”链接且按钮文本为“前往资产看板”的父级div
function findTargetPortfolioContainers() {
  // 1. 先找到所有“前往资产看板”按钮（文本内容更稳定）
  const targetButtons = Array.from(document.querySelectorAll('button.dex-subtlebutton'))
    .filter(button => button.innerText.trim() === '前往资产看板'); // 匹配按钮文本

  if (targetButtons.length === 0) return [];

  // 2. 从按钮向上找包含“/portfolio/”链接的父级div（容器）
  return targetButtons
    .map(button => button.closest('a[href*="/portfolio/"]')) // 找到按钮所在的链接
    .filter(link => link) // 过滤无效链接
    .map(link => link.closest('div')); // 找到链接的父级div（即目标容器）
}

function addDeBankButtonIfNeeded() {
  // 查找所有目标容器（.HWG3wN__dex）
  const targetContainers = findTargetPortfolioContainers();

  targetContainers.forEach(container => {
    // 跳过已添加过DeBank按钮的容器
    if (hasDeBankButton(container)) return;

    const originalLink = container.querySelector('a.dex-powerLink-a11y[href*="/portfolio/"]');
    if (!originalLink) return;

    // 提取原始链接中的钱包地址（无效地址则跳过）
    const walletAddress = extractWalletAddress(originalLink.getAttribute('href'));
    console.log(walletAddress);
    if (!walletAddress) return;

    // 创建DeBank链接（复用原始链接样式，确保视觉统一）
    const debankLink = document.createElement('a');
    // DeBank个人历史页链接格式：https://debank.com/profile/[地址]/history
    debankLink.href = `https://debank.com/profile/${walletAddress}/history`;
    debankLink.rel = 'noopener';
    debankLink.target = '_blank';
    // 继承原始链接的样式类 + 自定义标记类（用于判断是否已添加）
    debankLink.className = `${originalLink.className} debank-custom-link`;

    // 创建DeBank按钮（完全复用原始按钮结构，仅修改文字）
    const debankButton = document.createElement('button');
    debankButton.type = 'button';
    // 继承原始按钮的样式类（确保和OKX原生按钮外观一致）
    debankButton.className = originalLink.querySelector('button').className;

    // 组装按钮内容（复用原始图标，修改文字为“前往DeBank资产”）
    const btnContent = document.createElement('span');
    btnContent.className = 'btn-content';

    const btnIcon = document.createElement('i');
    // 复用原始按钮的图标类（保持视觉风格统一）
    btnIcon.className = originalLink.querySelector('i.dex-subtlebutton-icon').className;
    btnIcon.role = 'img';
    btnIcon.ariaHidden = 'true';

    const btnText = document.createTextNode('前往DeBank');

    // 拼接按钮结构
    btnContent.appendChild(btnIcon);
    btnContent.appendChild(btnText);
    debankButton.appendChild(btnContent);
    debankLink.appendChild(debankButton);

    // 将DeBank按钮添加到目标容器（放在原始按钮旁边）
    container.appendChild(document.createElement('br'));
    container.appendChild(debankLink);
  });
}


// ========================= 定时任务：1秒执行一次 =========================
function initTimerTask() {
  // 初始加载时先执行一次（处理页面已存在的容器）
  addDeBankButtonIfNeeded();

  // 定时轮询：每1秒执行一次（平衡“实时性”和“性能消耗”）
  const pollInterval = 300; // 1000ms = 1秒
  setInterval(() => {
    addDeBankButtonIfNeeded();
  }, pollInterval);

  // （可选）页面关闭时清除定时器，避免内存泄漏
  window.addEventListener('beforeunload', () => {
    clearInterval(pollInterval);
  });
}

// 页面加载完成后，启动定时任务
window.addEventListener('load', initTimerTask);

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
