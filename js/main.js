/* ============================================================
   Кофейный котик — основной скрипт
   ============================================================ */

(function () {
  'use strict';

  /* ----------------------------------------------------------
     1. Тень у хедера при прокрутке
     ---------------------------------------------------------- */
  const header = document.getElementById('header');

  if (header) {
    const onScroll = () => {
      header.classList.toggle('is-scrolled', window.scrollY > 10);
    };

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          onScroll();
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });

    onScroll();
  }

  /* ----------------------------------------------------------
     2. Закрытие мобильного меню при клике по ссылке
        (меню построено на чекбоксе — его нужно снимать вручную)
     ---------------------------------------------------------- */
  const navToggle = document.getElementById('nav-toggle');

  if (navToggle) {
    document.querySelectorAll('.nav-links a').forEach((link) => {
      link.addEventListener('click', () => {
        if (navToggle.checked) {
          navToggle.checked = false;
        }
      });
    });
  }

})();