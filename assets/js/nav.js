function initMobileNav() {
  const toggle = document.getElementById("menu-toggle");
  const nav = document.getElementById("mobile-nav");
  if (!toggle || !nav) return;

  function close() {
    nav.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
  }

  function open() {
    nav.hidden = false;
    toggle.setAttribute("aria-expanded", "true");
  }

  toggle.addEventListener("click", () => {
    if (nav.hidden) open(); else close();
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", close);
  });

  document.addEventListener("click", (evt) => {
    if (!nav.hidden && !nav.contains(evt.target) && !toggle.contains(evt.target)) {
      close();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 760) close();
  });
}

function initFooterYear() {
  const el = document.getElementById("copyright-year");
  if (el) el.textContent = new Date().getFullYear();
}

document.addEventListener("DOMContentLoaded", () => {
  initMobileNav();
  initFooterYear();
});
