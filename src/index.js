const s = document.createElement('script')
// eslint-disable-next-line no-undef
s.src = chrome.runtime.getURL('bundle.js')
s.onload = function () {
  this.remove()
};
(document.head || document.documentElement).appendChild(s)
