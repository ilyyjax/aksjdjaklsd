/* script.js
   Handles:
   - click / keyboard activation of the gold headline
   - toggling body.is-white to reveal the full-screen white overlay
   - showing/hiding the Back control (and ensuring focus management)
   - creating a small ripple micro-interaction at click point
   - honoring prefers-reduced-motion (reduces animations & makes transitions instant)
*/

/* Helper to check reduced motion preference */
const prefersReducedMotion = window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* DOM elements */
const headline = document.getElementById('headline');
const backBtn = document.getElementById('backBtn');
const whiteOverlay = document.getElementById('whiteOverlay');
const body = document.body;

/* Ensure headline is focusable (button already is), but set a tabindex just in case */
headline.setAttribute('tabindex', '0');

/* Focus trap-ish behavior: when overlay active, send focus to Back control */
function showWhiteScreen() {
  // If reduced motion, apply class immediately for an instant result
  if (prefersReducedMotion) {
    body.classList.add('is-white');
    // expose the back button and set focus
    backBtn.setAttribute('aria-hidden', 'false');
    backBtn.focus({preventScroll:true});
    whiteOverlay.setAttribute('aria-hidden', 'false');
    return;
  }

  // Add class that triggers CSS transitions (overlay fade + stage hide)
  body.classList.add('is-white');

  // After transition settles (match CSS timing), make back button visible and focus it.
  // Use a timeout slightly longer than the CSS transition to ensure visual completion.
  const settleMs = 520; // should mirror CSS --transition-medium (480ms) + safety
  setTimeout(() => {
    backBtn.setAttribute('aria-hidden', 'false');
    whiteOverlay.setAttribute('aria-hidden', 'false');
    backBtn.focus({preventScroll:true});
  }, settleMs);
}

function hideWhiteScreen() {
  // Hide back control first then remove class to animate back to page
  backBtn.setAttribute('aria-hidden', 'true');
  whiteOverlay.setAttribute('aria-hidden', 'true');

  if (prefersReducedMotion) {
    body.classList.remove('is-white');
    headline.focus({preventScroll:true});
    return;
  }

  // remove white class to animate back
  body.classList.remove('is-white');

  // after animation, restore focus to the headline for seamless keyboard navigation
  const settleMs = 520;
  setTimeout(() => {
    headline.focus({preventScroll:true});
  }, settleMs);
}

/* Click / activation handler for headline
   - supports mouse click, Enter & Space via keyboard (button element will already handle Enter/Space).
   - We still add a keydown listener for robustness and to prevent default space page-down behavior when necessary.
*/
function activateHeadline(event) {
  // If this was a keyboard event that we've already handled (e.g., space on a button), ignore duplicates
  if (event.type === 'keydown') {
    const code = event.code || event.key;
    if (code === 'Space' || code === 'Spacebar' || code === 'Enter') {
      // prevent space from scrolling page
      event.preventDefault();
    } else {
      // other keys irrelevant
      return;
    }
  }

  // Micro-interaction: create ripple near pointer (if available)
  createRipple(event);

  // Trigger the white-screen transition
  showWhiteScreen();
}

/* Create a ripple element at pointer / center for touchless keyboard activation */
function createRipple(event) {
  // If reduced motion, skip ripple
  if (prefersReducedMotion) return;

  const rect = headline.getBoundingClientRect();
  const ripple = document.createElement('span');
  ripple.className = 'ripple';

  // compute position: use click clientX/Y if present, else center of the button for keyboard activation
  let x, y;
  if (event && typeof event.clientX === 'number' && typeof event.clientY === 'number') {
    x = event.clientX - rect.left;
    y = event.clientY - rect.top;
  } else {
    x = rect.width / 2;
    y = rect.height / 2;
  }
  ripple.style.left = `${x}px`;
  ripple.style.top  = `${y}px`;

  // Append and remove after animation ends
  headline.appendChild(ripple);
  ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
}

/* Event listeners */

// Click handler
headline.addEventListener('click', activateHeadline);

// Keydown handler for Enter/Space (extra support)
headline.addEventListener('keydown', (e) => {
  if (e.code === 'Enter' || e.key === 'Enter' || e.code === 'Space' || e.key === ' ') {
    activateHeadline(e);
  }
});

// Back button handlers
backBtn.addEventListener('click', hideWhiteScreen);
backBtn.addEventListener('keydown', (e) => {
  // allow Esc to go back too
  if (e.key === 'Escape' || e.code === 'Escape') {
    hideWhiteScreen();
  }
});

/* Accessibility niceties:
   - If a user presses Escape while on the white screen, return to main view.
*/
document.addEventListener('keydown', (e) => {
  if ((e.key === 'Escape' || e.code === 'Escape') && body.classList.contains('is-white')) {
    hideWhiteScreen();
  }
});

/* Ensure click works immediately after load (no race conditions) */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // nothing else needed now; handlers attached above are available
  });
}

/* Prevent accidental double-activations (e.g., pointer + keyboard) by minor debounce */
let lastActivation = 0;
headline.addEventListener('click', (ev) => {
  const now = Date.now();
  if (now - lastActivation < 300) {
    ev.stopImmediatePropagation();
  } else {
    lastActivation = now;
  }
});

/* NOTES:
   - We intentionally avoid audio to keep experience unobtrusive and accessible.
   - The main visual effects are purely CSS for performance; JS only toggles state, focus, and small DOM ripple.
*/
