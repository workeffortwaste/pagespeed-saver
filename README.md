
# PageSpeed Saver - Chrome Extension

[https://defaced.dev/tools/pagespeed-saver/](https://defaced.dev/tools/pagespeed-saver/)

A Chrome Extension that adds a `Download Report` button to PageSpeed Insights performance reports allowing you to easily download the raw Lighthouse JSON data.

**Like this project? Help support my projects and buy me a coffee via [Ko-fi](https://ko-fi.com/defaced) or sponsor me on [GitHub Sponsors](https://github.com/sponsors/workeffortwaste/)**.

## Getting Started

### Installation

Install the plugin from the Chrome Web Store.

[https://chrome.google.com/webstore/detail/pagespeed-saver/iindjcojlfifabgdgkibaijkflcbjncp](https://chrome.google.com/webstore/detail/pagespeed-saver/iindjcojlfifabgdgkibaijkflcbjncp)

### Usage

Use PageSpeeds Insights as usual and once the reports have rendered there will be a new `Download Report` button on the individual Mobile and Desktop performance reports.

#### Opening Saved Reports

This extension adds a new `Open Report` button the main navigation which takes you to the [Lighthouse Report Viewer](https://googlechrome.github.io/lighthouse/viewer/) where you can open a saved report.

#### Comparing Saved Reports

This extension adds a new `Compare Reports` button the main navigation which takes you to the [Lighthouse CI Diff Viewer](https://googlechrome.github.io/lighthouse-ci/viewer/) where you can open two saved reports and see a comprehensive diff report.

### Build

To manually build the extension run `npm run build` to create an unpackaged extension in `./dist`.

## Author
Chris Johnson - [defaced.dev](https://defaced.dev) - [@defaced](http://twitter.co.uk/defaced/)

