(() => {
  const PRODUCT_KEY = "insuranceProduct";

  const config = (() => {
    const cfg = (window.SITE_CONFIG && typeof window.SITE_CONFIG === "object") ? window.SITE_CONFIG : {};
    const YM_COUNTER_ID = Number(cfg.YM_COUNTER_ID || 0) || 0;
    const WHITE_LABEL_URL = String(cfg.WHITE_LABEL_URL || "").trim();
    return { YM_COUNTER_ID, WHITE_LABEL_URL };
  })();

  window.YM_COUNTER_ID = config.YM_COUNTER_ID;

  const initMetrika = () => {
    if (!config.YM_COUNTER_ID) return;
    if (typeof window.ym === "function") return;

    (function(m,e,t,r,i,k,a){
      m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
      m[i].l=1*new Date();
      k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
    })(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

    window.ym(config.YM_COUNTER_ID, "init", {
      clickmap:true,
      trackLinks:true,
      accurateTrackBounce:true,
      webvisor:true
    });
  };

  const reachGoal = (goal, params = {}) => {
    try {
      if (typeof window.ym === "function" && typeof window.YM_COUNTER_ID !== "undefined") {
        window.ym(window.YM_COUNTER_ID, "reachGoal", goal, params);
      }
    } catch (_) {
    }
  };

  const initWhiteLabelLink = () => {
    const link = document.getElementById("white-label-link");
    if (!link) return;
    if (!config.WHITE_LABEL_URL) return;
    link.setAttribute("href", config.WHITE_LABEL_URL);
  };

  const getProduct = () => {
    const saved = (localStorage.getItem(PRODUCT_KEY) || "").toUpperCase();
    return saved === "КАСКО" ? "КАСКО" : "ОСАГО";
  };

  const setProduct = (value) => {
    const normalized = (value || "").toUpperCase();
    const product = normalized === "КАСКО" ? "КАСКО" : "ОСАГО";
    localStorage.setItem(PRODUCT_KEY, product);
    document.documentElement.dataset.product = product;

    document.querySelectorAll("[data-product-button]").forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.productButton === product);
      btn.setAttribute("aria-pressed", btn.dataset.productButton === product ? "true" : "false");
    });

    document.querySelectorAll("[data-product-text]").forEach((el) => {
      el.textContent = product;
    });

    document.querySelectorAll('input[name="product"]')
      .forEach((input) => {
        input.value = product;
      });
  };

  const initProductToggle = () => {
    const buttons = document.querySelectorAll("[data-product-button]");
    if (!buttons.length) return;

    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        setProduct(btn.dataset.productButton);
        reachGoal("select_product", { product: getProduct() });
      });
    });

    setProduct(getProduct());
  };

  const initMobileNav = () => {
    const toggle = document.querySelector("[data-nav-toggle]");
    const nav = document.querySelector("[data-site-nav]");
    if (!toggle || !nav) return;

    const close = () => {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    };

    toggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    document.addEventListener("click", (e) => {
      if (!nav.classList.contains("is-open")) return;
      const target = e.target;
      if (target instanceof Element) {
        if (nav.contains(target) || toggle.contains(target)) return;
      }
      close();
    });

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });

    nav.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener("click", () => {
        close();
      });
    });
  };

  const initActiveNav = () => {
    const links = Array.from(document.querySelectorAll('a.nav-link[href^="#"]'));
    if (!links.length) return;

    const mapHashToMenu = (hash) => {
      const normalized = hash && hash !== "#" ? hash : "#home";
      const id = normalized.startsWith("#") ? normalized.slice(1) : normalized;

      if (id === "about") return "#about";
      if (id === "partners") return "#partners";
      if (id === "contacts") return "#contacts";
      if (id === "form") return "#contacts";
      if (id === "privacy") return "#contacts";

      return "#home";
    };

    const setActive = (hash) => {
      const normalized = mapHashToMenu(hash);
      links.forEach((a) => {
        const href = a.getAttribute("href") || "";
        const isActive = href === normalized;
        a.classList.toggle("is-active", isActive);
        if (isActive) a.setAttribute("aria-current", "page");
        else a.removeAttribute("aria-current");
      });
    };

    const sections = Array.from(document.querySelectorAll("[data-section][id]"));
    if (sections.length) {
      const io = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((e) => e.isIntersecting)
            .sort((a, b) => (b.intersectionRatio || 0) - (a.intersectionRatio || 0));
          if (!visible.length) return;
          const id = visible[0].target.id;
          setActive(`#${id}`);
        },
        {
          root: null,
          threshold: [0.15, 0.25, 0.4, 0.6],
          rootMargin: "-40% 0px -55% 0px"
        }
      );
      sections.forEach((s) => io.observe(s));
    }

    window.addEventListener("hashchange", () => {
      setActive(location.hash);
    });

    setActive(location.hash);
  };

  const initSmoothAnchors = () => {
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener("click", (e) => {
        const href = a.getAttribute("href");
        if (!href || href === "#") return;
        const id = href.slice(1);
        const el = document.getElementById(id);
        if (!el) return;
        e.preventDefault();
        el.scrollIntoView({ behavior: "smooth", block: "start" });

        try {
          history.pushState(null, "", href);
        } catch (_) {
          location.hash = href;
        }
      });
    });
  };

  const initFaqAccordion = () => {
    const items = Array.from(document.querySelectorAll("details.faq-item"));
    if (!items.length) return;

    items.forEach((item) => {
      item.addEventListener("toggle", () => {
        if (!item.open) return;
        items.forEach((other) => {
          if (other !== item) other.open = false;
        });
      });
    });
  };

  const initPolis812BlackTheme = () => {
    const container = document.querySelector(".polis812-widget");
    if (!container) return;

    const css = `
      :host, :root, * {
        color: #000 !important;
        border-color: #000 !important;
      }
      svg, svg * {
        fill: #000 !important;
        stroke: #000 !important;
      }
      input, textarea, select, button, [role="button"] {
        color: #000 !important;
        background: #fff !important;
        border-color: #000 !important;
      }
      a { color: #000 !important; }
    `;

    const inject = (root) => {
      if (!root) return;
      try {
        if (root.__polis812BlackInjected) return;
        const style = document.createElement("style");
        style.setAttribute("data-polis812-black", "true");
        style.textContent = css;
        root.appendChild(style);
        root.__polis812BlackInjected = true;
      } catch (_) {
      }
    };

    const walkShadow = (node) => {
      if (!node || !(node instanceof Element)) return;
      if (node.shadowRoot) inject(node.shadowRoot);
      node.querySelectorAll("*").forEach((el) => {
        if (el.shadowRoot) inject(el.shadowRoot);
      });
    };

    walkShadow(container);

    const mo = new MutationObserver(() => {
      walkShadow(container);
    });

    mo.observe(container, {
      childList: true,
      subtree: true
    });
  };

  const validatePhone = (value) => {
    const v = (value || "").trim();
    if (!v) return false;
    return /^[+\d][\d\s()\-]{7,}$/.test(v);
  };

  const initForms = () => {
    document.querySelectorAll("form[data-lead-form]").forEach((form) => {
      const error = form.querySelector("[data-form-error]");
      const success = form.querySelector("[data-form-success]");

      const setError = (text) => {
        if (!error) return;
        error.textContent = text;
        error.style.display = "block";
        if (success) success.style.display = "none";
      };

      const setSuccess = (text) => {
        if (!success) return;
        success.textContent = text;
        success.style.display = "block";
        if (error) error.style.display = "none";
      };

      form.addEventListener("submit", (e) => {
        e.preventDefault();

        const name = form.querySelector('input[name="name"]');
        const phone = form.querySelector('input[name="phone"]');
        const consent = form.querySelector('input[name="consent"]');

        if (name && !name.value.trim()) {
          setError("Укажите имя.");
          name.focus();
          return;
        }

        if (phone && !validatePhone(phone.value)) {
          setError("Укажите корректный номер телефона.");
          phone.focus();
          return;
        }

        if (consent && !consent.checked) {
          setError("Подтвердите согласие с политикой конфиденциальности.");
          consent.focus();
          return;
        }

        setSuccess("Заявка отправлена. Мы свяжемся с вами в ближайшее время.");
        reachGoal("lead_submit", { product: getProduct() });

        form.reset();
        setProduct(getProduct());
      });
    });
  };

  document.addEventListener("DOMContentLoaded", () => {
    initMetrika();
    initProductToggle();
    initMobileNav();
    initActiveNav();
    initSmoothAnchors();
    initForms();
    initWhiteLabelLink();
    initFaqAccordion();
    initPolis812BlackTheme();
  });
})();
