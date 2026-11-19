# Alvin's Portfolio

Personal portfolio of Alvin, a Computer Science student in the Faculty of Engineering at Widya Mandira Catholic University, Kupang.

**Live site:** https://nobless017.github.io

## Projects

| Project | What it is | Demo | Source |
| --- | --- | --- | --- |
| Portfolio Website | Responsive personal site with light and dark themes and a contact form powered by Formspree. | [Open](https://nobless017.github.io/) | Root of this repo |
| Kopi Sabana | Landing page for a fictional coffee shop in Kupang, with a tabbed menu and opening hours that update in real time (WITA). | [Open](https://nobless017.github.io/projects/landing-page/) | [`projects/landing-page`](projects/landing-page) |
| Money Tracker | Mobile-first finance tracker for students. Data is saved in the browser with `localStorage`. | [Open](https://nobless017.github.io/projects/catatan-keuangan/?demo=1) | [`projects/catatan-keuangan`](projects/catatan-keuangan) |

## Built with

- HTML, CSS, and vanilla JavaScript (no frameworks, no build step)
- [Formspree](https://formspree.io) for the contact form
- GitHub Pages for hosting

## Folder structure

```
.
├── index.html, about.html, contact.html, 404.html
├── style.css, script.js       # shared by the portfolio pages
├── img/                       # project screenshots
└── projects/
    ├── landing-page/          # Kopi Sabana
    └── catatan-keuangan/      # Money Tracker
```

## Run locally

Clone the repo and open `index.html` in a browser. Nothing to install.

`404.html` uses paths from the site root, so it only looks right when the site is served (for example on GitHub Pages).
