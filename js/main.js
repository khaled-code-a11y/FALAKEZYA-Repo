document.addEventListener('DOMContentLoaded', () => {
  let updateSliderLayout = null;

  // -------------------------------------------------------------
  // 1. Language i18n Engine (Default: English)
  // -------------------------------------------------------------
  let currentLang = localStorage.getItem('falakezya_lang') || 'en';

  function getDict() {
    return window.translations || (typeof translations !== 'undefined' ? translations : null);
  }

  function updateLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('falakezya_lang', lang);

    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');

    const dict = getDict();
    if (!dict) return;

    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (dict[lang] && dict[lang][key]) {
        if (el.hasAttribute('placeholder')) {
          el.setAttribute('placeholder', dict[lang][key]);
        } else {
          el.innerHTML = dict[lang][key];
        }
      }
    });

    const langBtnText = document.getElementById('lang-btn-text');
    if (langBtnText && dict[lang] && dict[lang].langButton) {
      langBtnText.textContent = dict[lang].langButton;
    }

    if (typeof updateSliderLayout === 'function') {
      updateSliderLayout();
    }
  }

  // Helper for touch + click listener binding
  function addTouchOrClickListener(element, callback) {
    if (!element) return;
    let handled = false;

    const handler = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (!handled) {
        handled = true;
        callback(e);
        setTimeout(() => { handled = false; }, 300);
      }
    };

    element.addEventListener('click', handler);
    element.addEventListener('touchend', handler);
  }

  // -------------------------------------------------------------
  // 2. Language Button Handler
  // -------------------------------------------------------------
  const langToggleBtn = document.getElementById('lang-toggle-btn');
  addTouchOrClickListener(langToggleBtn, () => {
    const newLang = currentLang === 'en' ? 'ar' : 'en';
    updateLanguage(newLang);
  });

  // -------------------------------------------------------------
  // 3. Interactive Starfield Canvas Background
  // -------------------------------------------------------------
  const canvas = document.getElementById('star-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let stars = [];

    const getStarCount = () => window.innerWidth < 768 ? 50 : 120;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    class Star {
      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.alpha = Math.random();
        this.speed = Math.random() * 0.015 + 0.005;
        this.direction = Math.random() > 0.5 ? 1 : -1;
      }

      update() {
        this.alpha += this.speed * this.direction;
        if (this.alpha >= 1 || this.alpha <= 0.1) {
          this.direction *= -1;
        }
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
        ctx.shadowBlur = this.size * 3;
        ctx.shadowColor = '#00f2fe';
        ctx.fill();
      }
    }

    const initStars = () => {
      stars = [];
      const count = getStarCount();
      for (let i = 0; i < count; i++) {
        stars.push(new Star());
      }
    };

    initStars();

    const animateStars = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach(star => {
        star.update();
        star.draw();
      });
      requestAnimationFrame(animateStars);
    };

    animateStars();
  }

  // -------------------------------------------------------------
  // 4. Large Animated Rectangle Slider with Touch Swipe
  // -------------------------------------------------------------
  const sliderWrapper = document.getElementById('slider-wrapper');
  const slides = document.querySelectorAll('.slide-item');
  const dotsContainer = document.getElementById('slider-dots');
  const prevBtn = document.getElementById('prev-slide');
  const nextBtn = document.getElementById('next-slide');

  let currentSlide = 0;

  if (sliderWrapper && slides.length > 0) {
    const totalSlides = slides.length;
    let autoSlideTimer = null;

    if (dotsContainer) {
      dotsContainer.innerHTML = '';
      for (let i = 0; i < totalSlides; i++) {
        const dot = document.createElement('div');
        dot.classList.add('dot');
        if (i === 0) dot.classList.add('active');
        addTouchOrClickListener(dot, () => goToSlide(i));
        dotsContainer.appendChild(dot);
      }
    }

    const updateDots = () => {
      const dots = document.querySelectorAll('.dot');
      dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentSlide);
      });
    };

    const goToSlide = (index) => {
      currentSlide = (index + totalSlides) % totalSlides;
      const isRTL = document.documentElement.getAttribute('dir') === 'rtl';
      const offset = isRTL ? currentSlide * 100 : -currentSlide * 100;
      sliderWrapper.style.transform = `translateX(${offset}%)`;
      updateDots();
    };

    updateSliderLayout = () => goToSlide(currentSlide);

    const nextSlide = () => goToSlide(currentSlide + 1);
    const prevSlide = () => goToSlide(currentSlide - 1);

    addTouchOrClickListener(nextBtn, () => { nextSlide(); resetTimer(); });
    addTouchOrClickListener(prevBtn, () => { prevSlide(); resetTimer(); });

    // Touch Swipe Event Handling
    let touchStartX = 0;
    let touchEndX = 0;

    sliderWrapper.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    sliderWrapper.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      const isRTL = document.documentElement.getAttribute('dir') === 'rtl';
      const diff = touchEndX - touchStartX;

      if (Math.abs(diff) > 40) {
        if (diff < 0) {
          isRTL ? prevSlide() : nextSlide();
        } else {
          isRTL ? nextSlide() : prevSlide();
        }
        resetTimer();
      }
    }, { passive: true });

    const startTimer = () => {
      autoSlideTimer = setInterval(nextSlide, 4500);
    };

    const resetTimer = () => {
      clearInterval(autoSlideTimer);
      startTimer();
    };

    const sliderContainer = document.querySelector('.slider-container');
    if (sliderContainer) {
      sliderContainer.addEventListener('mouseenter', () => clearInterval(autoSlideTimer));
      sliderContainer.addEventListener('mouseleave', startTimer);
    }

    startTimer();
  }

  // -------------------------------------------------------------
  // 5. Video Spotlight Modal
  // -------------------------------------------------------------
  const videoModal = document.getElementById('video-modal');
  const openVideoBtn = document.getElementById('open-video-modal');
  const openVideoBtn2 = document.getElementById('open-video-modal-2');
  const openVideoHeroBtn = document.getElementById('open-video-hero');
  const closeModalBtn = document.getElementById('close-video-modal');
  const modalIframeContainer = document.getElementById('modal-iframe-container');

  const facebookVideoUrl = "https://www.facebook.com/share/v/1ajYwumgZh/?mibextid=wwXIfr";

  const openModal = () => {
    if (videoModal) {
      videoModal.classList.add('active');
      document.body.classList.add('no-scroll');
      if (modalIframeContainer) {
        modalIframeContainer.innerHTML = `
          <div style="position:relative; width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; background:#060913; padding:1.5rem; text-align:center;">
            <div style="font-size:3rem; color:#00f2fe; margin-bottom:0.75rem;">🌌</div>
            <h3 style="font-size:1.5rem; font-weight:800; color:#fff; margin-bottom:0.75rem;">فريق فَلكيزيا | FALAKEZYA Video Spotlight</h3>
            <p style="color:#94a3b8; max-width:500px; margin-bottom:1.5rem; line-height:1.6; font-size:0.95rem;">
              Watch our team's physics activities and youth workshops on Facebook Reel.
            </p>
            <a href="${facebookVideoUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="font-size:1rem; padding:0.85rem 2rem;">
              ▶ Open & Play Video on Facebook
            </a>
          </div>
        `;
      }
    }
  };

  const closeModal = () => {
    if (videoModal) {
      videoModal.classList.remove('active');
      document.body.classList.remove('no-scroll');
      if (modalIframeContainer) modalIframeContainer.innerHTML = '';
    }
  };

  addTouchOrClickListener(openVideoBtn, openModal);
  addTouchOrClickListener(openVideoBtn2, openModal);
  addTouchOrClickListener(openVideoHeroBtn, openModal);
  addTouchOrClickListener(closeModalBtn, closeModal);

  if (videoModal) {
    videoModal.addEventListener('click', (e) => {
      if (e.target === videoModal) closeModal();
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  // -------------------------------------------------------------
  // 6. Responsive Mobile Navigation Drawer Engine
  // -------------------------------------------------------------
  const header = document.querySelector('header');
  const mobileToggle = document.getElementById('mobile-toggle');
  const navLinks = document.getElementById('nav-links');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 30) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  if (mobileToggle && navLinks) {
    const toggleMenu = () => {
      const isOpen = navLinks.classList.toggle('active');
      mobileToggle.innerHTML = isOpen ? '✕' : '☰';
      document.body.classList.toggle('no-scroll', isOpen);
    };

    const closeMenu = () => {
      navLinks.classList.remove('active');
      mobileToggle.innerHTML = '☰';
      document.body.classList.remove('no-scroll');
    };

    addTouchOrClickListener(mobileToggle, toggleMenu);

    document.querySelectorAll('.nav-link').forEach(link => {
      addTouchOrClickListener(link, (e) => {
        const href = link.getAttribute('href');
        if (href && href.startsWith('#')) {
          e.preventDefault();
          const targetId = href.substring(1);
          const targetElement = document.getElementById(targetId);
          if (targetElement) {
            const headerOffset = 76;
            const elementPosition = targetElement.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            window.scrollTo({
              top: offsetPosition,
              behavior: 'smooth'
            });
          }
        }
        closeMenu();
      });
    });

    document.addEventListener('click', (e) => {
      if (!navLinks.contains(e.target) && !mobileToggle.contains(e.target) && navLinks.classList.contains('active')) {
        closeMenu();
      }
    });
  }

  // -------------------------------------------------------------
  // 7. Contact Form Submission Feedback
  // -------------------------------------------------------------
  const contactForm = document.getElementById('contact-form');
  const formStatus = document.getElementById('form-status');

  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const dict = getDict();
      const successMsg = (dict && dict[currentLang] && dict[currentLang].formSuccessMsg) || "Message sent successfully!";
      if (formStatus) {
        formStatus.style.display = 'block';
        formStatus.textContent = successMsg;
        formStatus.style.color = '#00f2fe';
        contactForm.reset();

        setTimeout(() => {
          formStatus.style.display = 'none';
        }, 6000);
      }
    });
  }

  // Run initial language setup
  updateLanguage(currentLang);
});
