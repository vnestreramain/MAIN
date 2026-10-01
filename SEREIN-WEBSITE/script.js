(function () {
  "use strict";

  /* ---------- Utilities ---------- */

  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.from((root || document).querySelectorAll(selector));
  }

  function todayISO() {
    return new Date().toISOString().split("T")[0];
  }

  function isValidPhone(value) {
    const digits = String(value || "").replace(/\D/g, "");
    return digits.length >= 10 && digits.length <= 13;
  }

  function isPastDate(dateStr) {
    if (!dateStr) return false;
    const chosen = new Date(dateStr + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return chosen < today;
  }

  function lockScroll() {
    document.body.style.overflow = "hidden";
  }

  function unlockScroll() {
    // Only unlock if neither menu nor lightbox is open
    const menuOpen = qs(".nav-links.open");
    const lightboxOpen = qs(".lightbox.open");
    if (!menuOpen && !lightboxOpen) {
      document.body.style.overflow = "";
    }
  }

  /* ---------- Form message helpers ---------- */

  function showFormMessage(form, type, text) {
    let box = qs(".form-message", form);
    if (!box) {
      box = document.createElement("div");
      box.className = "form-message";
      box.setAttribute("role", "status");
      box.setAttribute("aria-live", "polite");
      form.insertBefore(box, form.firstChild);
    }
    box.className = "form-message " + type;
    box.textContent = text;
    box.hidden = false;
    box.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function clearFormMessage(form) {
    const box = qs(".form-message", form);
    if (box) {
      box.hidden = true;
      box.textContent = "";
      box.className = "form-message";
    }
  }

  function setSubmitting(form, submitting) {
    const btn = qs('button[type="submit"]', form);
    if (!btn) return;
    btn.disabled = submitting;
    btn.setAttribute("aria-busy", submitting ? "true" : "false");
  }

  /* ---------- Mobile menu ---------- */

  function initMobileMenu() {
    const toggle = qs(".menu-toggle");
    const navLinks = qs(".nav-links");
    if (!toggle || !navLinks) return;

    let backdrop = qs(".nav-backdrop");
    if (!backdrop) {
      backdrop = document.createElement("div");
      backdrop.className = "nav-backdrop";
      backdrop.setAttribute("aria-hidden", "true");
      document.body.appendChild(backdrop);
    }

    let lastFocused = null;

    function setOpen(open) {
      navLinks.classList.toggle("open", open);
      toggle.classList.toggle("open", open);
      backdrop.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      backdrop.setAttribute("aria-hidden", open ? "false" : "true");

      if (open) {
        lastFocused = document.activeElement;
        lockScroll();
        const firstLink = qs("a", navLinks);
        if (firstLink) firstLink.focus();
      } else {
        unlockScroll();
        if (lastFocused && typeof lastFocused.focus === "function") {
          lastFocused.focus();
        } else {
          toggle.focus();
        }
      }
    }

    toggle.addEventListener("click", function () {
      setOpen(!navLinks.classList.contains("open"));
    });

    backdrop.addEventListener("click", function () {
      setOpen(false);
    });

    qsa("a", navLinks).forEach(function (link) {
      link.addEventListener("click", function () {
        setOpen(false);
      });
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && navLinks.classList.contains("open")) {
        setOpen(false);
      }
    });
  }

  /* ---------- Smooth scroll helpers ---------- */

  function prefersReducedMotion() {
    return (
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  function getHeaderOffset() {
    const header = qs("header");
    return header ? header.offsetHeight : 80;
  }

  function smoothScrollToElement(el, extraOffset) {
    if (!el) return;
    const offset = getHeaderOffset() + (extraOffset || 0);
    const top =
      el.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({
      top: Math.max(0, top),
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  }

  function pageFileName(pathname) {
    var name = (pathname || "").split("/").pop() || "";
    if (!name || name === "") return "index.html";
    return name;
  }

  /**
   * Wait for the CSS page-exit animation to finish, then run callback.
   */
  function waitForPageExit(callback) {
    var duration = prefersReducedMotion() ? 0 : 420;
    window.setTimeout(function () {
      if (typeof callback === "function") callback();
    }, duration);
  }

  /* ---------- Smooth scroll (in-page anchors) ---------- */

  function initSmoothScroll() {
    // Respect fixed header when jumping to #sections
    qsa('a[href*="#"]').forEach(function (anchor) {
      anchor.addEventListener("click", function (e) {
        const href = anchor.getAttribute("href");
        if (!href) return;

        const hashIndex = href.indexOf("#");
        if (hashIndex === -1) return;

        const path = href.slice(0, hashIndex) || window.location.pathname;
        const id = href.slice(hashIndex + 1);
        if (!id) return;

        const currentPage =
          window.location.pathname.split("/").pop() || "index.html";
        const targetPage = path.split("/").pop() || currentPage;

        // Cross-page link — let page-transition handler / browser navigate
        if (
          targetPage !== currentPage &&
          path !== "" &&
          !path.endsWith(currentPage)
        ) {
          return;
        }

        const target = document.getElementById(id);
        if (target) {
          e.preventDefault();
          smoothScrollToElement(target);
          if (!target.hasAttribute("tabindex")) {
            target.setAttribute("tabindex", "-1");
          }
          target.focus({ preventScroll: true });
        }
      });
    });
  }

  /* ---------- Header scroll state ---------- */

  function initHeaderScroll() {
    const header = qs("header");
    if (!header) return;

    let ticking = false;

    function update() {
      const scrolled = window.scrollY > 20;
      header.classList.toggle("scrolled", scrolled);
      ticking = false;
    }

    window.addEventListener(
      "scroll",
      function () {
        if (!ticking) {
          window.requestAnimationFrame(update);
          ticking = true;
        }
      },
      { passive: true }
    );

    update();
  }

  /* ---------- Contact form ---------- */

  function initContactForm() {
    const form = qs(".contact-form");
    if (!form) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      clearFormMessage(form);

      const name = qs("#name", form);
      const email = qs("#email", form);
      const phone = qs("#phone", form);
      const inquiry = qs("#inquiry", form);
      const message = qs("#message", form);
      const source = qs('input[name="source"]:checked', form);

      if (!name || !name.value.trim()) {
        showFormMessage(form, "error", "Please enter your full name.");
        if (name) name.focus();
        return;
      }
      if (!email || !email.value.trim() || !email.checkValidity()) {
        showFormMessage(form, "error", "Please enter a valid email address.");
        if (email) email.focus();
        return;
      }
      if (!phone || !isValidPhone(phone.value)) {
        showFormMessage(
          form,
          "error",
          "Please enter a valid phone number (10–13 digits)."
        );
        if (phone) phone.focus();
        return;
      }
      if (!inquiry || !inquiry.value) {
        showFormMessage(form, "error", "Please select a type of inquiry.");
        if (inquiry) inquiry.focus();
        return;
      }
      if (!source) {
        showFormMessage(
          form,
          "error",
          "Please tell us how you heard about us."
        );
        return;
      }
      if (!message || !message.value.trim()) {
        showFormMessage(form, "error", "Please write your message.");
        if (message) message.focus();
        return;
      }

      setSubmitting(form, true);

      // Simulated send (no backend). Replace with real fetch when ready.
      window.setTimeout(function () {
        showFormMessage(
          form,
          "success",
          "Thank you! Your message has been sent. We will get back to you soon."
        );
        form.reset();
        setSubmitting(form, false);
      }, 400);
    });

    form.addEventListener("reset", function () {
      window.setTimeout(function () {
        clearFormMessage(form);
        setSubmitting(form, false);
      }, 0);
    });
  }

  /* ---------- Reservation form ---------- */

  function initReservationForm() {
    const form = qs(".reservation-form");
    if (!form) return;

    const dateInput = qs("#res-date", form);
    if (dateInput) {
      dateInput.setAttribute("min", todayISO());
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      clearFormMessage(form);

      const name = qs("#res-name", form);
      const email = qs("#res-email", form);
      const phone = qs("#res-phone", form);
      const date = qs("#res-date", form);
      const time = qs("#res-time", form);
      const guests = qs("#res-guests", form);

      if (!name || !name.value.trim()) {
        showFormMessage(form, "error", "Please enter your full name.");
        if (name) name.focus();
        return;
      }
      if (!email || !email.value.trim() || !email.checkValidity()) {
        showFormMessage(form, "error", "Please enter a valid email address.");
        if (email) email.focus();
        return;
      }
      if (!phone || !isValidPhone(phone.value)) {
        showFormMessage(
          form,
          "error",
          "Please enter a valid phone number (10–13 digits)."
        );
        if (phone) phone.focus();
        return;
      }
      if (!date || !date.value) {
        showFormMessage(form, "error", "Please choose a date.");
        if (date) date.focus();
        return;
      }
      if (isPastDate(date.value)) {
        showFormMessage(
          form,
          "error",
          "Please choose a date that is today or in the future."
        );
        if (date) date.focus();
        return;
      }
      if (!time || !time.value) {
        showFormMessage(form, "error", "Please choose a time.");
        if (time) time.focus();
        return;
      }
      if (!guests || !guests.value) {
        showFormMessage(form, "error", "Please select the number of guests.");
        if (guests) guests.focus();
        return;
      }

      setSubmitting(form, true);

      window.setTimeout(function () {
        showFormMessage(
          form,
          "success",
          "Reservation request received! We will confirm your table shortly."
        );
        form.reset();
        if (dateInput) {
          dateInput.setAttribute("min", todayISO());
        }
        setSubmitting(form, false);
      }, 400);
    });
  }

  /* ---------- Gallery lightbox ---------- */

  function initLightbox() {
    const items = qsa(".gallery-item img");
    if (!items.length) return;

    let overlay = qs(".lightbox");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.className = "lightbox";
      overlay.setAttribute("role", "dialog");
      overlay.setAttribute("aria-modal", "true");
      overlay.setAttribute("aria-label", "Image preview");
      overlay.innerHTML =
        '<button type="button" class="lightbox-close" aria-label="Close">&times;</button>' +
        '<img src="" alt="" class="lightbox-image" />' +
        '<p class="lightbox-caption"></p>';
      document.body.appendChild(overlay);
    }

    const imgEl = qs(".lightbox-image", overlay);
    const captionEl = qs(".lightbox-caption", overlay);
    const closeBtn = qs(".lightbox-close", overlay);
    let lastFocused = null;

    function openLightbox(src, alt, caption) {
      lastFocused = document.activeElement;
      imgEl.src = src;
      imgEl.alt = alt || "";
      captionEl.textContent = caption || alt || "";
      overlay.classList.add("open");
      lockScroll();
      closeBtn.focus();
    }

    function closeLightbox() {
      overlay.classList.remove("open");
      imgEl.src = "";
      unlockScroll();
      if (lastFocused && typeof lastFocused.focus === "function") {
        lastFocused.focus();
      }
    }

    items.forEach(function (img) {
      img.style.cursor = "pointer";
      // Make focusable for keyboard users
      if (!img.hasAttribute("tabindex")) {
        img.setAttribute("tabindex", "0");
        img.setAttribute("role", "button");
        img.setAttribute(
          "aria-label",
          "View larger: " + (img.alt || "gallery image")
        );
      }

      function openFromImg() {
        const item = img.closest(".gallery-item");
        const title = item ? qs(".overlay h3", item) : null;
        openLightbox(img.src, img.alt, title ? title.textContent : img.alt);
      }

      img.addEventListener("click", openFromImg);
      img.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openFromImg();
        }
      });
    });

    closeBtn.addEventListener("click", closeLightbox);

    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closeLightbox();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && overlay.classList.contains("open")) {
        closeLightbox();
      }
    });
  }

  /* ---------- Page transitions ---------- */

  function isInternalNavLink(anchor) {
    if (!anchor || anchor.target === "_blank") return false;
    if (anchor.hasAttribute("download")) return false;

    var href = anchor.getAttribute("href");
    if (
      !href ||
      href.charAt(0) === "#" ||
      href.indexOf("mailto:") === 0 ||
      href.indexOf("tel:") === 0 ||
      href.indexOf("javascript:") === 0
    ) {
      return false;
    }

    try {
      var url = new URL(anchor.href, window.location.href);

      // Allow same-origin and local file:// pages
      var isHttp =
        window.location.protocol === "http:" ||
        window.location.protocol === "https:";
      if (isHttp && url.origin !== window.location.origin) return false;
      if (!isHttp && url.protocol !== window.location.protocol) return false;

      var current = pageFileName(window.location.pathname);
      var target = pageFileName(url.pathname);

      // Same page with hash only → leave to smooth-scroll handler
      if (target === current && url.hash) return false;

      return true;
    } catch (err) {
      // Relative links like "menu.html" still count as internal
      return /\.html?$/i.test(href) || href.indexOf("/") === 0;
    }
  }

  /**
   * Clean page exit: fade content out, then navigate.
   * Navbar stays fixed the whole time.
   */
  function navigateWithPageExit(url) {
    document.body.classList.add("page-exit");

    // Close mobile menu if open
    var navLinks = qs(".nav-links");
    var toggle = qs(".menu-toggle");
    var backdrop = qs(".nav-backdrop");
    if (navLinks) navLinks.classList.remove("open");
    if (toggle) {
      toggle.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    }
    if (backdrop) {
      backdrop.classList.remove("open");
      backdrop.setAttribute("aria-hidden", "true");
    }
    document.body.style.overflow = "hidden";

    waitForPageExit(function () {
      window.location.href = url;
    });
  }

  function initPageTransitions() {
    // New page always starts at the top
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
    window.scrollTo(0, 0);

    if (!prefersReducedMotion()) {
      document.body.classList.add("page-enter");
      window.setTimeout(function () {
        document.body.classList.remove("page-enter");
      }, 480);
    }

    document.addEventListener(
      "click",
      function (e) {
        if (e.defaultPrevented || e.button !== 0) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

        var anchor = e.target.closest("a");
        if (!isInternalNavLink(anchor)) return;

        if (prefersReducedMotion()) return;

        e.preventDefault();
        e.stopPropagation();
        navigateWithPageExit(anchor.href);
      },
      true
    );
  }

  /* ---------- Init ---------- */

  document.addEventListener("DOMContentLoaded", function () {
    initMobileMenu();
    initSmoothScroll();
    initHeaderScroll();
    initContactForm();
    initReservationForm();
    initLightbox();
    initPageTransitions();
  });
})();