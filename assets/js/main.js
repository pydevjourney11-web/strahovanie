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

  const initSeoRuntimeFixes = () => {
    try {
      const isHttp = location && (location.protocol === "http:" || location.protocol === "https:");
      if (!isHttp) return;

      const canonicalUrl = `${location.origin}${location.pathname.replace(/index\.html$/i, "")}`;
      const canonical = document.querySelector('link[rel="canonical"]');
      if (canonical && canonicalUrl) canonical.setAttribute("href", canonicalUrl);

      const ogUrl = document.querySelector('meta[property="og:url"]');
      if (ogUrl) ogUrl.setAttribute("content", canonicalUrl);

      const defaultOgImage = `${location.origin}/og.jpg`;
      const ogImage = document.querySelector('meta[property="og:image"]');
      const twitterImage = document.querySelector('meta[name="twitter:image"]');

      const hasOgImage = ogImage && String(ogImage.getAttribute("content") || "").trim();
      const hasTwitterImage = twitterImage && String(twitterImage.getAttribute("content") || "").trim();

      if (ogImage && !hasOgImage) ogImage.setAttribute("content", defaultOgImage);
      if (twitterImage && !hasTwitterImage) twitterImage.setAttribute("content", defaultOgImage);

      const ld = document.querySelector('script[type="application/ld+json"]');
      if (ld && ld.textContent) {
        ld.textContent = ld.textContent
          .replaceAll("https://example.com/", canonicalUrl)
          .replaceAll("https://example.com/og.jpg", defaultOgImage);
      }
    } catch (_) {
    }
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
    initSeoRuntimeFixes();
    initMetrika();
    initProductToggle();
    initSmoothAnchors();
    initForms();
  });
})();
