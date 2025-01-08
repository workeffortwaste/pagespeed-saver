/**
 * PageSpeed Saver 2.2.0
 * @defaced
 *
 * Source: https://github.com/workeffortwaste/pagespeed-saver/
 * Support:https://github.com/sponsors/workeffortwaste/
 * */
(async () => {
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
        grid-template-columns:94px 75px 50px 75px auto 46px 79px;
      }

      .pageSpeed_history__reports__list__item__copy,
      .pageSpeed_history__reports__list__item__download{
        font-size: 14px;
        line-height: 20px;
        color: #0368ff;
        text-transform: uppercase;
        font-weight: 500;
        cursor: pointer;
        display: grid;
        align-content: center;
        font-family: 'Google Sans' !important;
        text-transform: capitalize;
        justify-content: end;
      }

      .pageSpeed_history{
        padding: 24px;
        row-gap: calc(8px*2);
        border-radius: calc(8px/2);
        border-radius: 8px;
        background-color: #fff;
        border: 1px solid #dadce0;
        box-shadow: none;
        margin-bottom: 12px;
        position: fixed;
        top: 80px;
        right: 16px;
        z-index: 99;
        display:none;
        max-height: calc(100vh - 200px);
        overflow-y: auto;
      }
      
      .pageSpeed_history--open{
        display:block;
      }

      .pageSpeed_history * {
        font-family: Roboto, Arial, sans-serif;
      }

      .pageSpeed_history__reports__list__item {
        font-size:14px;
        border-bottom: 1px solid #ebebeb;
        padding:8px;
        padding-left: 0;
        padding-right: 0;
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
          <div><p>Your reports</p><p>Download or copy to the clipboard your PageSpeed Insights reports.</p></div>
        </div>

        <div class="pageSpeed_history__reports">
          <div class="pageSpeed_history__reports__header">
            <div>Previous Reports (${LIMIT_COLLAPSED})</div><div class="pageSpeed_history__reports__header__more">View More Reports</div>
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
          This data is saved using the <a target="_blank" href="https://defaced.dev/tools/pagespeed-saver/">PagedSpeed Saver Chrome Extension</a> from the last 100 reports generated. If you find this extension useful please consider <a target="_blank" href="https://github.com/sponsors/workeffortwaste/">supporting</a>.
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

    const targetElement = document.querySelector('body')
    historyInject(targetElement)
  }

  /**
   * Magic to capture the incoming changes to the __LIGHTHOUSE_JSON__ window object.
   * This is where PageSpeed Insights streams in its data.
   */
  Object.defineProperties(window, {
    __LIGHTHOUSE_MOBILE_PROXY__: {
      value: {},
      writable: true
    },
    __LIGHTHOUSE_MOBILE_JSON__: {
      get: function () {
        return this.__LIGHTHOUSE_MOBILE_PROXY__
      },
      set: function (val) {
        this.__LIGHTHOUSE_MOBILE_PROXY__ = val
        lighthouseWatcher(this.__LIGHTHOUSE_MOBILE_PROXY__)
      }
    }
  })

  Object.defineProperties(window, {
    __LIGHTHOUSE_DESKTOP_PROXY__: {
      value: {},
      writable: true
    },
    __LIGHTHOUSE_DESKTOP_JSON__: {
      get: function () {
        return this.__LIGHTHOUSE_DESKTOP_PROXY__
      },
      set: function (val) {
        this.__LIGHTHOUSE_DESKTOP_PROXY__ = val
        lighthouseWatcher(this.__LIGHTHOUSE_DESKTOP_PROXY__)
      }
    }
  })

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
  // eslint-disable-next-line no-undef
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
    while (historyContainer.nextSibling) historyContainer.nextSibling.remove()
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

        let filename = `${slugify(json.finalUrl)}-${slugify(json.configSettings.formFactor)}-${slugify(json.fetchTime)}`
        filename = filename.replace(regex, '-')

        /* Save the file */
        FileSaver.saveAs(new Blob([JSON.stringify(json)]), `${filename}.json`)
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
   * Toggle the collapsed reports between the upper and lower limits.
  */
  const historyMore = () => {
    collapsed = !collapsed
    /* Update the real history list. Removing the element to triggering our observer */
    rows = '' /* Clear the local rows obj to force a refresh from the db' */

    const header = document.querySelector('.pageSpeed_history__reports__header')

    const template = `<div>Previous Reports (${collapsed ? LIMIT_COLLAPSED : LIMIT_EXPANDED})</div><div class="pageSpeed_history__reports__header__more">${collapsed ? 'View More Reports' : 'View Less Reports'}</div>`
    header.innerHTML = escapeHTMLPolicy.createHTML(template)

    document.querySelector('.pageSpeed_history__reports__header__more').addEventListener('click', historyMore)

    /* Select the target element */
    const targetElement = document.querySelector('body')

    /* Add the row data to the DOM */
    historyInject(targetElement)
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

  await sleep(500)

  /* Add styles to head */
  document.head.insertAdjacentHTML('beforeend', escapeHTMLPolicy.createHTML(payloadStyles))

  /* Add additional menu buttons */
  const link = document.querySelector('header > span > div:last-of-type ')
  const linkOpen = link.cloneNode(true)
  const linkDiff = link.cloneNode(true)
  const linkHistory = link.cloneNode(true)

  linkOpen.querySelector('a').setAttribute('href', 'https://googlechrome.github.io/lighthouse/viewer/')
  linkOpen.querySelector('span').textContent = 'Open'
  linkDiff.querySelector('a').setAttribute('href', 'https://googlechrome.github.io/lighthouse-ci/viewer/')
  linkDiff.querySelector('span').textContent = 'Compare'
  linkHistory.querySelector('a').setAttribute('href', '#')
  linkHistory.querySelector('span').textContent = 'Download'
  linkHistory.addEventListener('click', (e) => {
    e.preventDefault()
    const history = document.querySelector('.pageSpeed_history')
    if (history) {
      history.classList.toggle('pageSpeed_history--open')
    }
  })

  link.before(linkHistory)
  link.before(linkOpen)
  link.before(linkDiff)

  /* Select the target element */
  const targetElement = document.querySelector('body')

  /* Inject our history content */
  targetElement.insertAdjacentHTML('afterend', escapeHTMLPolicy.createHTML(payloadHistory()))

  /* Make the more button work */
  document.querySelector('.pageSpeed_history__reports__header__more').addEventListener('click', historyMore)

  /* Add the row data to the DOM */
  historyInject(targetElement)
})()
