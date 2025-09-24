// 加载已保存的设置
function loadOptions() {
  chrome.storage.sync.get(['browserPrefix'], function (result) {
    // 如果有保存的前缀则使用，否则使用默认值
    const defaultPrefix = 'https://bscscan.com/tx/';
    document.getElementById('browserPrefix').value = result.browserPrefix || defaultPrefix;
  });
}

// 保存设置到浏览器存储
function saveOptions() {
  const prefix = document.getElementById('browserPrefix').value;

  // 简单验证前缀格式
  if (prefix && prefix.startsWith('http')) {
    chrome.storage.sync.set({ browserPrefix: prefix }, function () {
      // 显示保存成功提示
      const status = document.getElementById('status');
      status.textContent = 'Saved success';
      setTimeout(() => {
        status.textContent = '';
      }, 2000);
    });
  } else {
    document.getElementById('status').textContent = 'Please input valid prefix(start with http)';
  }
}

// 页面加载完成后加载保存的设置
document.addEventListener('DOMContentLoaded', loadOptions);
// 绑定保存按钮点击事件
document.getElementById('save').addEventListener('click', saveOptions);
// 支持按Enter键保存
document.getElementById('browserPrefix').addEventListener('keypress', function (e) {
  if (e.key === 'Enter') {
    saveOptions();
  }
});
