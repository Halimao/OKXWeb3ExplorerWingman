// 渲染一条链的配置行
function createChainItem(chain, prefix) {
  const item = document.createElement('div');
  item.className = 'chain-item';

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.className = 'chain-name';
  nameInput.value = chain || '';
  nameInput.placeholder = 'e.g. bsc';

  const prefixInput = document.createElement('input');
  prefixInput.type = 'text';
  prefixInput.className = 'chain-prefix';
  prefixInput.value = prefix || '';
  prefixInput.placeholder = 'e.g. https://app.blocksec.com/explorer/tx/bsc/';

  const removeBtn = document.createElement('button');
  removeBtn.className = 'btn-remove';
  removeBtn.textContent = 'Remove';
  removeBtn.addEventListener('click', function () {
    item.remove();
  });

  item.appendChild(nameInput);
  item.appendChild(prefixInput);
  item.appendChild(removeBtn);

  return item;
}

// 加载已保存的设置
function loadOptions() {
  chrome.storage.sync.get(['chainPrefixes'], function (result) {
    const chainPrefixes = result.chainPrefixes || {};
    const chainList = document.getElementById('chainList');
    chainList.innerHTML = '';

    const chains = Object.keys(chainPrefixes);
    if (chains.length === 0) {
      // 没有配置时显示一个空行
      chainList.appendChild(createChainItem('', ''));
    } else {
      chains.forEach(chain => {
        chainList.appendChild(createChainItem(chain, chainPrefixes[chain]));
      });
    }
  });
}

// 添加一条链配置
function addChainItem() {
  const chainList = document.getElementById('chainList');
  chainList.appendChild(createChainItem('', ''));
}

// 保存设置到浏览器存储
function saveOptions() {
  const items = document.querySelectorAll('.chain-item');
  const chainPrefixes = {};
  let hasError = false;

  items.forEach(item => {
    const chain = item.querySelector('.chain-name').value.trim();
    const prefix = item.querySelector('.chain-prefix').value.trim();

    if (!chain) return; // 跳过空链名

    if (!prefix.startsWith('http')) {
      hasError = true;
      return;
    }

    chainPrefixes[chain] = prefix;
  });

  if (hasError) {
    document.getElementById('status').textContent = 'Prefix must start with http';
    return;
  }

  chrome.storage.sync.set({ chainPrefixes: chainPrefixes }, function () {
    const status = document.getElementById('status');
    status.textContent = 'Saved successfully';
    setTimeout(() => {
      status.textContent = '';
    }, 2000);
  });
}

// 页面加载完成后加载保存的设置
document.addEventListener('DOMContentLoaded', loadOptions);
// 绑定添加按钮
document.getElementById('addChain').addEventListener('click', addChainItem);
// 绑定保存按钮
document.getElementById('save').addEventListener('click', saveOptions);
