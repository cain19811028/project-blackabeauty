# System Agents / Modules

The frontend logic is divided into three distinct "Agents" (modules) within `script.js` to ensure separation of concerns and maintainability.

## 1. CanvasRenderer (The Visual Artist)
*   **Role**: Manages the HTML5 Canvas background.
*   **Behavior**: Generates algorithmic art representing "abstract academic caps" or "flowing threads". It handles the animation loop (`requestAnimationFrame`) and responds to window resize events.
*   **Aesthetic**: Minimalist, slow-moving, subtle opacity to ensure it doesn't distract from the content.

## 2. ScrollManager (The Director)
*   **Role**: Handles scroll-based animations and interactions.
*   **Behavior**: Uses `IntersectionObserver` to detect when elements enter the viewport. It applies CSS classes (e.g., `.visible`) to trigger CSS transitions (fade-in, slide-up).
*   **Features**:
    *   Smooth scrolling for navigation links.
    *   Parallax effects (optional).

## 3. DOMHandler (The interface)
*   **Role**: Manages direct user interactions and DOM manipulations.
*   **Behavior**:
    *   Toggles the mobile menu state.
    *   Handles form submissions (if any, or just mailto links).
    *   Manages the "Back to Top" button visibility.
