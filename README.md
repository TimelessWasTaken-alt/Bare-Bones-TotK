# Bare Bones TOTK — Field Manual

A responsive, multi-file static website for the Bare Bones TOTK challenge rulebook. It is designed for GitHub Pages and uses plain HTML, CSS, and JavaScript—no build step or dependencies required.

## Included features

- TOTK-inspired field-manual theme, responsive layout, inline icons, abstract landscape hero artwork, and light/dark toggle.
- Searchable and expandable universal rules.
- Late-Start checklist with progress indicator.
- Master Sword unlock tracker, initially set to 1/5.
- Wanderer region checklist, with independent time, exploration, and destination checkboxes.
- Effect-food allowance tracker and three-region replenishment counter.
- Image checklist grouped by section.
- Survival run log.
- Browser-local autosave for progress, theme, and run log.
- Copy-to-clipboard buttons for checklists and progress.
- Keyboard focus styling and reduced-motion support.

## Publish on GitHub Pages

1. Create a repository, for example `bare-bones-totk`.
2. Upload `index.html`, `styles.css`, `app.js`, `README.md`, and the `assets/` folder to the repository root.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, select **Deploy from a branch**.
5. Choose branch `main` and folder `/(root)`, then save.
6. When deployment finishes, the site will be available at `https://YOUR-USERNAME.github.io/bare-bones-totk/`.

No Node.js, packages, or compilation are needed.

## Local preview

Open `index.html` directly in a modern browser. Most features work offline. Clipboard access is best when served over HTTPS (GitHub Pages provides HTTPS); a fallback copy prompt is included.

## Customize

- Edit the rule text in `index.html`.
- Change colors and layout in `styles.css`.
- Change tracker behavior or checklist items in `app.js`.
- Add screenshots you own or have permission to use inside `assets/`, then reference them with a relative path such as `assets/my-screenshot.jpg`.
- Use your supplied screenshot for the “No Restrictions” logo. It is not included or recreated in this starter package.
- The Wanderer destinations are intentionally labeled as a working list; a few regional assignments and the complete region list still need confirmation.

## Persistence

Progress is saved in local storage in the current browser on the current device. It is not a shared database and does not automatically sync between devices. Clearing site data clears the saved progress.

## Credits

Fan-made and unofficial challenge rules. Not affiliated with or endorsed by Nintendo. The Legend of Zelda and related marks belong to their respective owners.
