# Karnataka Travel Tracker

Static site: HTML, CSS, JavaScript, Leaflet (OpenStreetMap tiles), Chart.js.

```
karnataka-travel-tracker/
  index.html
  css/styles.css
  js/app.js
  data/destinations.json   <- default data (145 entries: 16 visited, 129 pending)
```

## Run locally
`fetch()` needs a web server, so do not double-click index.html:

    cd karnataka-travel-tracker
    python -m http.server 8000      # then open http://localhost:8000

## Upload to your existing repo (my-references)
    git clone https://github.com/connectsudarshan/my-references.git
    cp -r karnataka-travel-tracker my-references/
    cd my-references
    git add karnataka-travel-tracker
    git commit -m "Add Karnataka travel tracker"
    git push

## Publish with GitHub Pages
1. Repo > Settings > Pages.
2. Source: "Deploy from a branch", branch `main`, folder `/ (root)`. Save.
3. After a minute the site is at
   https://connectsudarshan.github.io/my-references/karnataka-travel-tracker/

## Your data and saving to GitHub
- Edits are saved in your browser (localStorage) and survive refreshes. They are per browser and per device.
- To save changes to GitHub safely (no token in the code): click **Export JSON**, replace
  `data/destinations.json` with the exported file, then commit and push. Pages then serves your updated list as the default.
- Use **Import JSON** to restore a backup. **Reset to defaults** reloads the original list.
- Direct "save to GitHub" from the page would need a token or a small backend (for example a serverless function holding the token). It is not included.

## Verify before trusting
Every entry is flagged `verify: true`. Coordinates are approximate (2 decimals, from memory, not checked against a source).
19 entries have no coordinates (including DD Hills, whose location I could not confirm) and do not appear on the map until you add them with Edit.
No destination photographs are bundled; add your own with Edit. Lepakshi is in Andhra Pradesh and shows as a purple "Outside Karnataka" marker.
Anegundi appears under both Hampi and Koppal because both of your lists include it; delete one if you want a single entry.
