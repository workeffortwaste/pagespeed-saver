/**
 * PageSpeed Saver 2.1.1
 * @defaced
 *
 * Source: https://github.com/workeffortwaste/pagespeed-saver/
 * Support: https://ko-fi.com/defaced/
 * */
(() => {
  /* Init */
  const saver = {} /* Store the most recent report ids for mobile and desktop devices. */
  let rows = '' /* Store the HTML for reinjecting the previous report rows into the DOM. */
  let injecting = false /* Block multiple simulatations calls to inject previous report rows */
  let collapsed = true /* Toggle the collapsed report rows between LIMIT_COLLAPSED and LIMIT_EXPANDED */

  const LIMIT_COLLAPSED = 5 /* Maximum number of rows to show while collapsed */
  const LIMIT_EXPANDED = 100 /* Maximum number of rows to show while expanded */
  const LIMIT_DATABASE = 100 /* Maximum number of reports to save in the database.

  /* Libaries */
  const FileSaver = require('file-saver')
  const slugify = require('slugify')
  const dexie = require('dexie')

  /* Init DB */
  const db = new dexie.Dexie('PageSpeedSaver')

  /* Declare tables, IDs and indexes */
  db.version(1).stores({
    reports: '++id, url, timestamp, device, score, json'
  })

  /**
   * HTML payload for the mobile and desktop download report buttons
   * @returns {string} HTML
   */
  const payloadButtons = `
    <button class="pageSpeed_button" role="tab" tabindex="-1">
      <span class="pageSpeed_button__container">
        <span class="pageSpeed_button__container__text">Download Report</span>
      </span>
      <span class="pageSpeed_button__container__background"></span>
    </button>
  `
  /**
   * CSS payload for unique styling for the HTML elements in this extension
   * @returns {string} HTML
   */
  const payloadStyles = `
    <style>
      header a {
        margin-right: auto;
      }
      header {
        justify-content: flex-end;
      }
      .pageSpeed_history__header{
        display: grid;
        grid-template-columns: max-content auto;
        gap: 16px;
        margin-bottom: 16px;
      }
      .pageSpeed_history__header p {
        display: block;
        margin: 0;
        line-height: 1.5rem;
        font-size: 1.125rem;
      }
      .pageSpeed_history__header p:last-of-type{
        color: #5f6368;
        font-size: .875rem;
        letter-spacing: .0142857143em;
      }
      .pageSpeed_history__reports__header{
        font-size: 12px;
        line-height: 20px;
        color: #616161;
        text-transform: uppercase;
        font-weight: 500;
        letter-spacing: 0.8px;
        padding-left:0;
        display: flex;
        flex-flow: row;
        justify-content: space-between;
        place-items: center;
      }
      .pageSpeed_history__reports__header div:last-of-type{
        color: #5f6368;
        padding: 8px;
        padding-right:0;
        cursor: pointer;
        font-family: Roboto,Arial,sans-serif;
        line-height: 1rem;
        font-size: .75rem;
        letter-spacing: .025em;
        font-weight: 400;
        text-transform: capitalize;
      }

      .pageSpeed_history__reports__list__header span {
        font-size: 12px;
        line-height: 20px;
        color: #757575;
        line-height:calc(2.3 * 14px);
        letter-spacing: 0.8px;
      }

      .pageSpeed_history__reports__list__header,
      .pageSpeed_history__reports__list__item {
        display:grid;
        color:#5f6368;
        grid-template-columns:94px 75px 50px 75px auto 46px 60px;
      }

      .pageSpeed_history__reports__list__item__copy,
      .pageSpeed_history__reports__list__item__download{
        font-size: 12px;
        line-height: 20px;
        color: #757575;
        text-transform: uppercase;
        font-weight: 500;
        letter-spacing: 0.8px;
        cursor: pointer;
      }

      .pageSpeed_history{
        padding: 24px;
        row-gap: calc(8px*2);
        border-radius: calc(8px/2);
        border-radius: 8px;
        background-color: #fff;
        border: 1px solid #dadce0;
        box-shadow: none;
      }

      .pageSpeed_history__reports__list__item {
        font-size:14px;
        border-bottom: 1px solid #ebebeb;
        padding:8px;
        padding-left:0;
        line-height:24px;
      }

      .pageSpeed_history__reports__list__item:hover {
        background: #FAFAFA;
      }
      .pageSpeed_history__reports__list__header {
        border-bottom: 1px solid #ebebeb;
        padding:8px;
        padding-left:0;
      }

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
      .pageSpeed_history__reports__list__item span:nth-child(5){
        color:black;
        padding-right:10px;
        word-break:break-all;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      @media only screen and (max-width: 900px) {
        .pageSpeed_history__reports__list__header span:last-of-type{
          display:none;
        }
        .pageSpeed_history__reports__list__item span:nth-child(5) {
          grid-row-start: 2;
          grid-column: 1 / -1;
        }
        .pageSpeed_history__reports__list__item span:nth-child(6) {
          grid-column-start: 6;
        } 
        .pageSpeed_history__reports__list__item span:nth-child(7) {
          grid-column-start: 7;
        } 
      }
    
      .pageSpeed_history__reports__list__item span:nth-child(4){
        text-transform:capitalize;
      }

      span[data-historyscore="poor"]{
        color:#c00;
      }
      span[data-historyscore="improvement"]{
        color:#ae6032;
      }
      span[data-historyscore="good"]{
        color:#018642;
      }

      .pageSpeed_history__footer{
        font-size:12px;
        line-height:20px;
        margin-top:8px;
        margin-bottom:8px;
        color:#757575;
      }
    </style>
    `

  /**
   * HTML payload for previous reports container
   * @returns {string} HTML
   */
  const payloadHistory = () => {
    return `
      <div class="pageSpeed_history">
        <div class="pageSpeed_history__header">
          <div><img src="https://www.gstatic.com/pagespeed/insights/ui/img/icon-lab.svg" alt="" data-iml="198727" style="width: 48px; height: 48px;" data-atf="false"></div>
          <div><p>Your previous reports</p><p>Download or copy to the clipboard your previous PageSpeed Insights reports.</p></div>
        </div>

        <div class="pageSpeed_history__reports">
          <div class="pageSpeed_history__reports__header">
            <div>Previous Reports (${collapsed ? LIMIT_COLLAPSED : LIMIT_EXPANDED})</div><div class="pageSpeed_history__reports__header__more">${collapsed ? 'View More Reports' : 'View Less Reports'}</div>
          </div>
          <div class="pageSpeed_history__reports__list">
            <div class="pageSpeed_history__reports__list__header">
              <span>Date</span>
              <span>Time</span>
              <span>Perf.</span>
              <span>Device</span>
              <span>URL</span>
            </div>
          </div>
        </div>

        <div class="pageSpeed_history__footer">
          This data is saved using the <a target="_blank" href="https://defaced.dev/tools/pagespeed-saver/">PagedSpeed Saver Chrome Extension</a> from the last 100 reports generated. If you find this extension useful please consider <a target="_blank" href="https://ko-fi.com/defaced/">donating</a>.
        </div>
      </div>
  `
  }

  /**
   * HTML template that constructs a report row for the previous reports container
   * @returns {string} HTML
   */
  const templateHistoryRows = (date, score, device, url, id, time) => {
    return `
      <div class="pageSpeed_history__reports__list__item">
        <span>${date}</span>
        <span>${time}</span>
        <span data-historyscore="${templateHistoryHelper(score)}">${score}</span>
        <span>${device}</span>
        <span>${url}</span>
        <span class="pageSpeed_history__reports__list__item__copy" data-historyid="${id}">Copy</span>
        <span class="pageSpeed_history__reports__list__item__download" data-historyid="${id}">Download</span>
      </div>`
  }

  /**
   * Lighthouse performance threshold helper.
   * @param {int} score Lighthouse performance score
   * @returns {string} Lighthouse performance text
   */
  const templateHistoryHelper = (score) => {
    if (score < 50) return 'poor'
    if (score < 90) return 'improvement'
    return 'good'
  }

  /**
   * Handler for incoming Lighthouse data from PageSpeed Insights.
   * @param {obj} lighthouseData The Lighthouse report JSON
   */
  const lighthouseWatcher = async (lighthouseData) => {
    /* Trigger the button observer for the incoming device type */
    lighthouseData.configSettings.formFactor === 'desktop' ? buttonObserve('desktop') : buttonObserve('mobile')

    /* Save to history */
    const dbId = await db.reports.add({
      device: lighthouseData.configSettings.formFactor,
      url: lighthouseData.finalUrl,
      timestamp: lighthouseData.fetchTime,
      score: (lighthouseData.categories.performance.score * 100).toFixed(0),
      json: JSON.stringify(lighthouseData)
    })

    /* Delete older entries */
    limitDatabase()

    /* Add the report ID to the window object so we know which is the most recent reports */
    saver[lighthouseData.configSettings.formFactor] = dbId

    /* Get the HTML template for the new report */
    const template = templateHistoryRows(lighthouseData.fetchTime.substring(0, 10), (lighthouseData.categories.performance.score * 100).toFixed(0), lighthouseData.configSettings.formFactor, lighthouseData.finalUrl, dbId, lighthouseData.fetchTime.substring(11, 19))

    /* Add the report to the cached history list */
    rows = template + rows
    const parser = new DOMParser()
    const fakeDom = parser.parseFromString(escapeHTMLPolicy.createHTML(rows), 'text/html')
    fakeDom.querySelector('div:last-of-type').remove()
    rows = fakeDom.body.innerHTML

    /* Update the real history list. */
    const formElement = [...document.querySelectorAll('form')].pop()

    /* Trigger a refresh by modifying the form element with a new class */
    formElement.classList.add('refresh')
  }

  /**
   * Magic to capture the incoming changes to the __LIGHTHOUSE_JSON__ window object.
   * This is where PageSpeed Insights streams in its data.
   */
  Object.defineProperties(window, {
    __LIGHTHOUSE_PROXY__: {
      value: {},
      writable: true
    },
    __LIGHTHOUSE_JSON__: {
      get: function () {
        return this.__LIGHTHOUSE_PROXY__
      },
      set: function (val) {
        this.__LIGHTHOUSE_PROXY__ = val
        lighthouseWatcher(this.__LIGHTHOUSE_PROXY__)
      }
    }
  })

  /**
   * Inject the mobile and desktop download report buttons into the DOM.
   * @param {string} device The device name (mobile|desktop)
   */
  const buttonInject = (device) => {
    /* If the pathname for the current state doesn't contain report then return */
    if (!window.location.pathname.includes('report')) return

    /* Fetch the most recent native button for the device param */
    const button = [...document.querySelectorAll(`*[aria-labelledby="${device}_tab"] button#url_tab`)].pop()

    /* Return if a current sibling (our button) exists */
    if (button.nextElementSibling) { return }

    /* Inject our button */
    button.insertAdjacentHTML('afterend', escapeHTMLPolicy.createHTML(payloadButtons))

    /* Select our injected button */
    const newButton = button.nextElementSibling

    /* Attach an event to our button */
    newButton.addEventListener('click', async (e) => {
      const id = saver[device]
      const obj = await db.reports.get(id)
      const json = JSON.parse(obj.json)

      /* Regex for filename sanitisation */
      const regex = /[*+~.()'"!:@]/g

      let filename = `${slugify(json.finalUrl)}-${slugify(json.configSettings.formFactor)}-${slugify(json.fetchTime)}.json`
      filename = filename.replace(regex, '-')

      /* Save the file */
      FileSaver.saveAs(new Blob([JSON.stringify(json)]), filename)
    })
  }

  /**
   * Observe the specified tab panel for changes to automatically reinject our report buttons
   * @param {string} device The device name (mobile|desktop)
   */
  const buttonObserve = (device) => {
    /* The most recent tab panel elements to watch for changes */
    const num = device === 'mobile' ? 0 : 1
    const target = [...document.querySelectorAll('div[role="tabpanel"] c-wiz')].slice(-2)[num]

    const callback = async (mutationsList, observer) => {
      /* Destroy the observer */
      observer.disconnect()

      /* A quick pause to wait for the DOM to render changes */
      await sleep(1000)

      /* Inject our button */
      buttonInject(device)
    }

    const observer = new MutationObserver(callback)
    observer.observe(target, { attributes: true, childList: true, subtree: true })
  }

  /**
   * ES6 sleep
   * Sleep for the specified amount of time
   * @param {int} ms Time in ms
   */
  const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * HTML injection helper to allow .innerHTML to function with the documents current security settings
   */
  const escapeHTMLPolicy = trustedTypes.createPolicy('forceInner', {
    createHTML: (content) => content
  })

  /**
   * Add the report history rows HTML to the DOM
   */
  const historyInject = async () => {
    /* Block concurrent calls to this function */
    if (injecting) { return }
    injecting = true

    /* If our local rows HTML is not set then fetch fresh data. */
    if (!rows.length) {
      /* Get all the in the database reversed and limited */
      const all = await db.reports.reverse().limit(collapsed ? LIMIT_COLLAPSED : LIMIT_EXPANDED).toArray()
      all.forEach(e => {
        const row = templateHistoryRows(e.timestamp.substring(0, 10), e.score, e.device, e.url, e.id, e.timestamp.substring(11, 19))
        /* Add the HTML to the rows variable. */
        rows += row
      })
    }

    /* Get element */
    const historyContainer = document.querySelector('.pageSpeed_history__reports__list__header')
    historyContainer.insertAdjacentHTML('afterend', escapeHTMLPolicy.createHTML(rows))

    /* Unblock calls to this function */
    injecting = false

    /* Add events to all the download buttons */
    document.querySelectorAll('.pageSpeed_history__reports__list__item__download').forEach(e => {
      e.addEventListener('click', async (event) => {
        const id = e.getAttribute('data-historyid')
        const obj = await db.reports.get(parseInt(id))
        const json = JSON.parse(obj.json)

        /* Regex for file sanitisation */
        const regex = /[*+~.()'"!:@]/g

        let filename = `${slugify(json.finalUrl)}-${slugify(json.configSettings.formFactor)}-${slugify(json.fetchTime)}.json`
        filename = filename.replace(regex, '-')

        /* Save the file */
        FileSaver.saveAs(new Blob([JSON.stringify(json)]), filename)
      })
    })

    /* Add events all the copy buttons */
    document.querySelectorAll('.pageSpeed_history__reports__list__item__copy').forEach(e => {
      e.addEventListener('click', async (event) => {
        const id = e.getAttribute('data-historyid')
        const obj = await db.reports.get(parseInt(id))
        /* Send the JSON to the OS clipboard */
        navigator.clipboard.writeText(obj.json)
      })
    })
  }

  /**
   * Observe the form element for changes to automatically reinject our previous report container.
   * Also triggers the button injection to catch an edge case scenario where buttons did not get reinjected into the DOM.
   */
  const formObserve = () => {
    const callback = async (mutationsList, observer) => {
      /* Trigger the tab panel button injections */
      buttonInject('mobile')
      buttonInject('desktop')

      if (document.querySelectorAll('.pageSpeed_history').length === 0) {
        const formElement = [...document.querySelectorAll('form')].pop()
        formElement.insertAdjacentHTML('afterend', escapeHTMLPolicy.createHTML(payloadHistory()))

        /* Make the more button work */
        document.querySelector('.pageSpeed_history__reports__header__more').addEventListener('click', historyMore)

        /* Add the row data to the DOM */
        historyInject(formElement)
      }

      if ((mutationsList.map(e => e.attributeName).includes('class'))) {
        /* Remove the observer */
        observer.disconnect()

        /* Remove the current pagespeed history from the DOM */
        document.querySelector('.pageSpeed_history').remove()

        /* Reinject the history container and reports in the correct place */
        const formElement = [...document.querySelectorAll('form')].pop()
        formElement.insertAdjacentHTML('afterend', escapeHTMLPolicy.createHTML(payloadHistory()))

        /* Make the more button work */
        document.querySelector('.pageSpeed_history__reports__header__more').addEventListener('click', historyMore)

        /* Add the row data to the DOM */
        historyInject(formElement)

        /* Start the form observer again to listen for changes on the correct form element */
        formObserve()
      }
    }

    const observer = new MutationObserver(callback)

    /* Fetch the last form element in the DOM */
    const formElement = [...document.querySelectorAll('form')].slice(-1)[0]
    observer.observe(formElement, { attributes: true, childList: true, subtree: true })
  }

  /**
   * Toggle the collapsed reports between the upper and lower limits.
  */
  const historyMore = () => {
    collapsed = !collapsed
    /* Update the real history list. Removing the element to triggering our observer */
    rows = '' /* Clear the local rows obj to force a refresh from the db' */
    const formElement = [...document.querySelectorAll('form')].pop()
    formElement.classList.add('refresh')
  }

  /**
   * Remove everything over the uppoer bounds of the database limit so it doesn't balloon in size.
   */
  const limitDatabase = async () => {
    await db.reports.reverse().offset(LIMIT_DATABASE).delete()
  }

  document.querySelector('header > a').addEventListener('click', async (e) => {
    /* Force a browser refresh rather than a JS framework refresh */
    window.location.href = 'https://pagespeed.web.dev/'
  })

  /* Add styles to head */
  document.head.insertAdjacentHTML('beforeend', escapeHTMLPolicy.createHTML(payloadStyles))

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

  /* Select the form */
  const formElement = [...document.querySelectorAll('form')].pop()

  /* Inject our history content */
  formElement.insertAdjacentHTML('afterend', escapeHTMLPolicy.createHTML(payloadHistory()))

  /* Make the more button work */
  document.querySelector('.pageSpeed_history__reports__header__more').addEventListener('click', historyMore)

  /* Add the row data to the DOM */
  historyInject(formElement)

  /* Start the form observer for the first time */
  formObserve()
})()
