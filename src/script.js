// PageSpeed Saver 2.0.2
// @defaced
(() => {
  /* Libaries */
  const FileSaver = require('file-saver')

  /* The HTML payload */
  const htmlButtons = `
    <button
      class="pageSpeed_button"
      role="tab"
      aria-selected="false"
      tabindex="-1"
      data-skip-focus-on-activate="false"
    >
      <span class="pageSpeed_button__container">
        <span class="pageSpeed_button__container__text">Download Report</span>
      </span>
      <span class="pageSpeed_button__container__background"></span>
    </button>

    <style>
      .pageSpeed_button{
        font-family: "Google Sans",Roboto,Arial,sans-serif;
        line-height: 1.25rem;
        font-size: .875rem;
        letter-spacing: .0178571429em;
        font-weight: 500;
        text-transform: none;
        min-width: auto;
        background: none;
        min-width: 90px;
        display: flex;
        flex: 1 0 auto;
        justify-content: center;
        box-sizing: border-box;
        margin: 0;
        border: none;
        outline: none;
        text-align: center;
        white-space: nowrap;
        cursor: pointer;
        -webkit-appearance: none;
        z-index: 1;
        position:relative;
      }

      .pageSpeed_button__container {
        display: flex;
        align-items: center;
        justify-content: center;
        height: inherit;
        pointer-events: none;
        place-self: center;
      }

      .pageSpeed_button__container__text {
        color: #5f6368;
        transition: 150ms color linear;
        display: inline-block;
        line-height: 1;
        z-index: 2;
      }

      .pageSpeed_button:hover .pageSpeed_button__container__background{
        background-color: #f8f9fa;
        position: absolute;
        width: 100%;
        height: 100%;
      }
    </style>`

  const htmlMenu = `
    <style>
      header a {
        margin-right: auto;
      }
      header {
        justify-content: flex-end;
      }
    </style>
  `

  /* Watch the lighthouse window object to capture changes */
  const update = async (lighthouseData) => {
    if (window.__LIGHTHOUSE_JSON__?.configSettings?.formFactor === 'mobile') {
      window.pageSpeedSaverMobile = lighthouseData
      injectHTML('mobile')
    }
    if (window.__LIGHTHOUSE_JSON__?.configSettings?.formFactor === 'desktop') {
      window.pageSpeedSaverDesktop = lighthouseData
      injectHTML('desktop')
    }
  }

  Object.defineProperties(window, {
    ___LIGHTHOUSE_JSON__: {
      value: {},
      writable: true
    },
    __LIGHTHOUSE_JSON__: {
      get: function () {
        return this.___LIGHTHOUSE_JSON__
      },
      set: function (val) {
        this.___LIGHTHOUSE_JSON__ = val
        update(this.___LIGHTHOUSE_JSON__)
      }
    }
  })

  /* Button injection observer */
  const injectHTML = (device) => {
    const num = device === 'mobile' ? 0 : 1
    const target = [...document.querySelectorAll('div[role="tabpanel"] c-wiz')].slice(-2)[num]
    let toggle = false

    const callback = async (mutationsList, observer) => {
      if (toggle) return; toggle = true
      console.log(`Injecting PageSpeed Saver HTML (${device})`)
      await sleep(1000);
      // Insert button
      [...document.querySelectorAll(`*[aria-labelledby="${device}_tab"] button#url_tab`)].pop().insertAdjacentHTML('afterend', escapeHTMLPolicy.createHTML(htmlButtons))

      // Hook button to JSON
      const button = [...document.querySelectorAll(`*[aria-labelledby="${device}_tab"] .pageSpeed_button`)].pop()
      if (device === 'desktop') {
        button.addEventListener('click', e => {
          console.log('bep')
          FileSaver.saveAs(new Blob([JSON.stringify(window.pageSpeedSaverDesktop)]), 'pagespeed-saver-json-mobile.json')
        })
      } else {
        button.addEventListener('click', e => {
          console.log('bep')
          FileSaver.saveAs(new Blob([JSON.stringify(window.pageSpeedSaverMobile)]), 'pagespeed-saver-json-mobile.json')
        })
      }

      observer.disconnect()
    }

    const observer = new MutationObserver(callback)
    observer.observe(target, { attributes: true, childList: true, subtree: true })
  }

  /* ES6 sleep */
  const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /* HTML injection helper */
  const escapeHTMLPolicy = trustedTypes.createPolicy('forceInner', {
    createHTML: (content) => content
  })

  /* Add additional menu buttons */
  const link = document.querySelector('header > div')
  const linkOpen = link.cloneNode(true)
  const linkDiff = link.cloneNode(true)
  linkOpen.querySelector('a').setAttribute('href', 'https://googlechrome.github.io/lighthouse/viewer/')
  linkOpen.querySelector('span').textContent = 'Open Report'
  linkDiff.querySelector('a').setAttribute('href', 'https://googlechrome.github.io/lighthouse-ci/viewer/')
  linkDiff.querySelector('span').textContent = 'Compare Reports'
  link.before(linkOpen)
  link.before(linkDiff)
  document.body.insertAdjacentHTML('beforeend', escapeHTMLPolicy.createHTML(htmlMenu))
})()
