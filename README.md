# Black A Beauty (黑美人服飾) - Website Refactor

A modern, responsive, single-page showcase for Black A Beauty academic regalia.

## Project Structure
- `index.html`: The main single-page application structure.
- `style.css`: All designs, glassmorphism effects, and responsive styles.
- `script.js`: Contains the logic agents (CanvasRenderer, ScrollManager, DOMHandler).
- `images/`: Directory for product images.
- `AGENTS.md`: Technical documentation of the JavaScript modules.

## How to Customize

### 1. Swapping Images
The site currently uses placeholder images (or old ones if they exist). To show your actual high-quality images:
1.  Place your new images in the `images/` folder.
2.  Open `index.html` and look for the `<img>` tags inside `.retro-image-container`.
3.  Update the `src` attribute to match your new filename.
    *   Example: `<img src="./images/new-bachelor-gown.jpg" ...>`

> **Note**: The `.retro-image-container` class adds a "sepia/vintage" overlay and border. If you want to show the full color of your new images (once upscaled), remove that class from the surrounding `div` or edit `style.css`.

### 2. Updating Text
All text content is directly within `index.html`.
-   **Company Intro**: Located in the `#about` section.
-   **Contact Info**: Located in the `#contact` section.

### 3. Glassmorphism Design
The design uses a "Modern Heritage" aesthetic.
-   **Colors**: Configured in `style.css` under `:root`.
    -   `--color-navy` (Primary)
    -   `--color-maroon` (Accent)
    -   `--color-gold` (Highlight)

## Tech Stack
-   **HTML5** (Semantic)
-   **CSS3** (Variables, Grid, Flexbox, Backdrop Filter)
-   **JavaScript** (ES6+, HTML5 Canvas)
-   **No Dependencies**: No build steps required. Just open `index.html`.

## Deployment
Simply upload all files (`index.html`, `style.css`, `script.js`, `images/`, `fonts/`) to your web server or hosting provider.
