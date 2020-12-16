// PageSpeed Saver 1.0
// @defaced
(() => {
  const { fetch: origFetch } = window
  window.fetch = async (...args) => {
    const response = await origFetch(...args)
    response
      .clone()
      .json()
      .then(body => pageSpeedSaver(body))
      .catch(err => console.error(err))

    return response
  }

  if (document.getElementsByClassName('progress-value')[0].innerText !== '0') {
    const html = '<p style="text-align: center;color: #f7f7f7;" id="pageSpeedSaverStatus">PageSpeed Saver - Report already in progress, cannot capture data.</p>'
    document.getElementsByClassName('url-and-analyze')[0].insertAdjacentHTML('afterend', html)
  }

  const pageSpeedSaverReset = () => {
    const saver = document.getElementById('pageSpeedSaver')
    const status = document.getElementById('pageSpeedSaverStatus')
    if (status) { status.remove() }
    if (saver) { saver.remove() }
  }

  const pageSpeedSaver = (content) => {
    if (content.kind === 'pagespeedonline#result') {
      if (content.lighthouseResult.configSettings.emulatedFormFactor === 'desktop') {
        pageSpeedSaveHTML()
        window.pageSpeedSaverDesktop = content
      } else {
        window.pageSpeedSaverMobile = content
      }
    } else {
      pageSpeedSaverReset()
    }
  }

  const FileSaver = require('file-saver')

  const pageSpeedSaveHTML = () => {
    const html = `
        <style>
        #pageSpeedSaver {
            position: absolute;
            z-index: 999999999;
            right: 20px;
            padding: 0;
            height:100%;
            padding-bottom: -30px;
            box-shadow: none;
            background: transparent;
            transform: translateY(4px);
            pointer-events: none;
        }
        #pageSpeedSaver button{
            cursor:pointer;
            position:sticky;
            top: 51px;
            pointer-events: all;
        }
        #pageSpeedSaverDesktop {
            margin-left: 4px;
        }
        @media only screen and (max-width: 720px) {
            #pageSpeedSaver {
                display:none;
            }
        }
        </style>
        <div class="main-action" id="pageSpeedSaver">
            <button id="pageSpeedSaverMobile" class="button button-red analyze jfk-button main-submit jfk-button-standard">Save Mobile JSON</button>
            <button id="pageSpeedSaverDesktop" class="button button-red analyze jfk-button main-submit jfk-button-standard">Save Desktop JSON</button>
        </div>`

    document.getElementsByClassName('pagespeed-results')[0].insertAdjacentHTML('beforebegin', html)

    document.getElementById('pageSpeedSaverMobile').addEventListener('click', e => {
      FileSaver.saveAs(new Blob([JSON.stringify(window.pageSpeedSaverMobile.lighthouseResult)]), 'pagespeed-saver-json-mobile.json')
    })

    document.getElementById('pageSpeedSaverDesktop').addEventListener('click', e => {
      FileSaver.saveAs(new Blob([JSON.stringify(window.pageSpeedSaverDesktop.lighthouseResult)]), 'pagespeed-saver-json-desktop.json')
    })
  }
})()
