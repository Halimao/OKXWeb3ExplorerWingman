// 从链接中提取链名和交易哈希
function extractTxHash(href) {
  const match = href.match(/\/tx\/(0x[0-9a-fA-F]{64})/);
  if (match) {
    return { txHash: match[1] };
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
function hasCustomProfileButton(container) {
  // 通过自定义类名标记，检查容器内是否已有DeBank按钮
  return container.querySelector('.custom-profile-link') !== null;
}

// 修改链接属性
function modifyLinks() {
  // 获取所有符合条件的a标签
  const links = document.querySelectorAll('a.dex-powerLink-a11y.dex-powerLink');
  const path = window.location.pathname;
  const pathSegments = path.split('/').filter(Boolean);
  const chain = pathSegments[2];

  // 从存储中获取用户自定义的各链交易浏览器前缀
  chrome.storage.sync.get(['chainPrefixes'], function (result) {
    const chainPrefixes = result.chainPrefixes || {};

    links.forEach(link => {
      // 设置target为_blank，在新标签页打开
      link.target = '_blank';

      // 提取链名和交易哈希
      const extracted = extractTxHash(link.href);
      if (extracted) {
        const { txHash } = extracted;
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
  const targetButtons = Array.from(document.querySelectorAll('.dex-subtlebutton'))
    .filter(button => button.innerText.trim() === '前往资产看板' || button.innerText.trim() === 'Go to Portfolio'); // 匹配按钮文本

  if (targetButtons.length === 0) return [];

  // 2. 从按钮向上找包含“/portfolio/”链接的父级div（容器）
  return targetButtons
    .map(button => button.closest('a[href*="/portfolio/"]')) // 找到按钮所在的链接
    .filter(link => link) // 过滤无效链接
    .map(link => link.closest('div')); // 找到链接的父级div（即目标容器）
}

function addDeBankAndZerionButtonIfNeeded() {
  // 查找所有目标容器（.HWG3wN__dex）
  const targetContainers = findTargetPortfolioContainers();

  targetContainers.forEach(container => {
    // 跳过已添加过DeBank按钮的容器
    if (hasCustomProfileButton(container)) return;

    const originalLink = container.querySelector('a.dex-powerLink-a11y[href*="/portfolio/"]');
    if (!originalLink) return;

    // 提取原始链接中的钱包地址（无效地址则跳过）
    const walletAddress = extractWalletAddress(originalLink.getAttribute('href'));
    console.log(walletAddress);
    if (!walletAddress) return;

    {
      // 创建DeBank链接（复用原始链接样式，确保视觉统一）
      const debankLink = document.createElement('a');
      // DeBank个人历史页链接格式：https://debank.com/profile/[地址]/history
      debankLink.href = `https://debank.com/profile/${walletAddress}/history`;
      debankLink.rel = 'noopener';
      debankLink.target = '_blank';
      // 继承原始链接的样式类 + 自定义标记类（用于判断是否已添加）
      debankLink.className = `${originalLink.className} debank-custom-link custom-profile-link`;

      const btnIcon = document.createElement('i');
      // 复用原始按钮的图标类（保持视觉风格统一）
      btnIcon.className = originalLink.querySelector('i.dex-subtlebutton-icon').className;
      btnIcon.role = 'img';
      btnIcon.ariaHidden = 'true';

      const btnText = document.createTextNode('前往DeBank');

      // 拼接按钮结构
      debankLink.appendChild(btnIcon);
      debankLink.appendChild(btnText);

      // 将DeBank按钮添加到目标容器（放在原始按钮旁边）
      container.appendChild(document.createElement('br'));
      container.appendChild(debankLink);
    }

    {
      // 创建Zerion链接（复用原始链接样式，确保视觉统一）
      const zerionLink = document.createElement('a');
      // DeBank个人历史页链接格式：https://debank.com/profile/[地址]/history
      zerionLink.href = `https://app.zerion.io/${walletAddress}/history`;
      zerionLink.rel = 'noopener';
      zerionLink.target = '_blank';
      // 继承原始链接的样式类 + 自定义标记类（用于判断是否已添加）
      zerionLink.className = `${originalLink.className} zerion-custom-link custom-profile-link`;

      const btnIcon = document.createElement('i');
      // 复用原始按钮的图标类（保持视觉风格统一）
      btnIcon.className = originalLink.querySelector('i.dex-subtlebutton-icon').className;
      btnIcon.role = 'img';
      btnIcon.ariaHidden = 'true';

      const btnText = document.createTextNode('前往Zerion');

      // 拼接按钮结构
      zerionLink.appendChild(btnIcon);
      zerionLink.appendChild(btnText);

      // 将Zerion按钮添加到目标容器（放在原始按钮旁边）
      container.appendChild(document.createElement('br'));
      container.appendChild(zerionLink);
    }

  });
}


// 为交易地址悬浮窗追加交易记录入口, 并在浮窗复用时同步当前地址.
function addHoverProfileButtonsIfNeeded() {
  const portfolioLinks = document.querySelectorAll('.dex-popover a.dex-powerLink-a11y');
  const providers = [
    {
      name: 'DeBank',
      key: 'debank',
      prefix: 'https://debank.com/profile/',
      color: '#FE754D',
      // 橙色圆角方块内镂空的 D, 在 14px 下仍能辨认.
      path: 'M7 6h5a6 6 0 0 1 0 12H7V6Zm3 3v6h2a3 3 0 0 0 0-6h-2Z'
    },
    {
      name: 'Zerion',
      key: 'zerion',
      prefix: 'https://app.zerion.io/',
      color: '#2962FF',
      // 蓝色圆角方块配白色折线 Z, 与 DeBank 的轮廓和尺寸统一.
      path: 'M6.5 6.5h11v2.6L10.3 15h7.2v2.5h-11v-2.6l7.2-5.9H6.5V6.5Z'
    }
  ];

  portfolioLinks.forEach(originalLink => {
    if (!originalLink.querySelector('.dex-okx-defi-nft-trading')) return;
    // 通过资产页链接和筛选图标识别底部操作行, 不依赖 OKX 会变化的哈希类名.
    const toolbar = originalLink.closest('[data-testid="okd-popup"]')?.parentElement;
    if (!toolbar || !toolbar.querySelector('.dex-okx-defi-filter')) return;

    const walletAddress = originalLink.getAttribute('href')?.match(/\/portfolio\/(0x[0-9a-fA-F]{40})(?:\/|[?#]|$)/)?.[1];
    if (!walletAddress) {
      // 地址不再有效时移除旧入口, 避免复用浮窗后仍跳转到上一地址.
      toolbar.querySelectorAll('.wingman-hover-profile-link').forEach(link => link.remove());
      return;
    }

    providers.forEach(provider => {
      let link = toolbar.querySelector(`[data-wingman-profile="${provider.key}"]`);
      if (!link) {
        link = document.createElement('a');
        link.className = `${originalLink.className} wingman-hover-profile-link`;
        link.dataset.wingmanProfile = provider.key;
        link.target = '_blank';
        link.rel = 'nofollow noopener noreferrer';
        link.title = `前往 ${provider.name} 交易记录`;
        link.setAttribute('aria-label', link.title);
        Object.assign(link.style, {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          verticalAlign: 'middle',
          flexShrink: '0'
        });

        // 使用 SVG DOM 创建静态图形, 不加载外部图片或注入 HTML.
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('width', '14');
        svg.setAttribute('height', '14');
        svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('focusable', 'false');

        const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        background.setAttribute('x', '1');
        background.setAttribute('y', '1');
        background.setAttribute('width', '22');
        background.setAttribute('height', '22');
        background.setAttribute('rx', '6');
        background.setAttribute('fill', provider.color);

        const symbol = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        symbol.setAttribute('d', provider.path);
        symbol.setAttribute('fill', '#FFFFFF');
        symbol.setAttribute('fill-rule', 'evenodd');
        svg.append(background, symbol);
        link.appendChild(svg);
        toolbar.appendChild(link);
      }

      const href = `${provider.prefix}${walletAddress}/history`;
      // 只写入变化的链接, 防止 href 监听被自身更新持续触发.
      if (link.getAttribute('href') !== href) link.href = href;
    });
  });
}

// ========================= 定时任务: 1秒执行一次 =========================
function initTimerTask() {
  // 初始加载时先执行一次（处理页面已存在的容器）
  addDeBankAndZerionButtonIfNeeded();

  // 定时轮询：每1秒执行一次（平衡“实时性”和“性能消耗”）
  const pollInterval = 300; // 1000ms = 1秒
  setInterval(() => {
    addDeBankAndZerionButtonIfNeeded();
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
  const hasAddedNodes = mutations.some(mutation => mutation.addedNodes.length > 0);
  if (hasAddedNodes) modifyLinks();

  // 新浮窗插入或原资产页链接换地址时同步入口, 不对自建链接的 href 触发全页改写.
  const hasPortfolioChange = mutations.some(mutation =>
    mutation.type === 'attributes' &&
    mutation.target.matches('.dex-popover a.dex-powerLink-a11y') &&
    mutation.target.querySelector('.dex-okx-defi-nft-trading')
  );
  if (hasAddedNodes || hasPortfolioChange) addHoverProfileButtonsIfNeeded();
});

// 监视整个页面的变化
observer.observe(document.body, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ['href']
});

// content script 执行时页面可能已加载, 立即处理已经存在的悬浮窗.
addHoverProfileButtonsIfNeeded();
