(() => {
  const root = document.documentElement;
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Support address: filled from config.js, with a plain-text fallback.
  const email = (window.ROADMAP_SUPPORT_EMAIL || "").trim();
  document.querySelectorAll("[data-support]").forEach((el) => {
    if (email.includes("@")) {
      const a = document.createElement("a");
      a.href = "mailto:" + email;
      a.textContent = email;
      el.replaceWith(a);
    } else {
      el.textContent = "the support contact on Roadmap’s App Store page";
    }
  });

  // Scroll reveal.
  const items = document.querySelectorAll(".reveal");
  if (items.length && "IntersectionObserver" in window && !calm) {
    root.classList.add("js");
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    items.forEach((el) => io.observe(el));
  }

  // Nav turns to material only once content scrolls under it.
  const nav = document.querySelector(".nav");
  let ticking = false;
  const edge = () => { nav.classList.toggle("scrolled", scrollY > 8); ticking = false; };
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(edge); } }, { passive: true });
  edge();

  // Interactive demo: tap a step, the ring follows.
  const steps = document.querySelectorAll(".step");
  const fill = document.querySelector(".ring .fill");
  const label = document.querySelector(".ring b");
  const left = document.querySelector("[data-left]");
  if (steps.length && fill) {
    const C = 2 * Math.PI * 21;
    fill.style.strokeDasharray = C;
    const paint = () => {
      const done = [...steps].filter((s) => s.getAttribute("aria-pressed") === "true").length;
      fill.style.strokeDashoffset = C * (1 - done / steps.length);
      label.textContent = done + "/" + steps.length;
      if (left) left.textContent = done === steps.length ? "All done for today" : (steps.length - done) + " steps left today";
    };
    steps.forEach((s) => s.addEventListener("click", () => {
      s.setAttribute("aria-pressed", s.getAttribute("aria-pressed") === "true" ? "false" : "true");
      paint();
    }));
    paint();
  }
})();
