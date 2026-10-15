/* ============================================================
   Кофейный котик — основной скрипт
   ------------------------------------------------------------
   1. Тень хедера при прокрутке
   2. Закрытие мобильного меню по клику на ссылку
   3. Меню: данные + отрисовка карточек (единый источник правды)
   4. Корзина (localStorage, выезжающая панель, тосты)
   5. Статус «открыто / закрыто» по расписанию
   ============================================================ */

(function () {
  'use strict';

  /* ------------- Утилиты ------------- */
  const $ = (selector, ctx) => (ctx || document).querySelector(selector);
  const $$ = (selector, ctx) => Array.from((ctx || document).querySelectorAll(selector));
  const fmtMoney = (value) => value.toLocaleString('ru-RU') + ' ₽';

  /* ----------------------------------------------------------
     1. Тень у хедера при прокрутке
        (стили: .header.is-scrolled — см. styles.css)
     ---------------------------------------------------------- */
  const header = $('#header');

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
     ---------------------------------------------------------- */
  const navToggle = $('#nav-toggle');

  if (navToggle) {
    $$('.nav-links a').forEach((link) => {
      link.addEventListener('click', () => {
        navToggle.checked = false;
      });
    });
  }

  /* ----------------------------------------------------------
     3. Меню: данные — единый источник правды
     ---------------------------------------------------------- */
  const MENU = [
    { id: 'murlyka-latte', name: 'Мурлыка-латте', price: 320, badge: 'Хит продаж', emoji: '☕', photo: 'photos/Мурлыка-латте.png', theme: 'latte', desc: 'Нежный латте на двойном эспрессо с карамелью и щепоткой корицы.' },
    { id: 'kot-espresso', name: 'Кот-эспрессо', price: 180, badge: 'Классика', emoji: '🍫', photo: 'photos/Кот-эспрессо.png', theme: 'espresso', desc: 'Плотный двойной эспрессо из бразильской арабики с шоколадным послевкусием.' },
    { id: 'karamel-murchik', name: 'Карамельный Мурчик', price: 380, badge: 'Сладкоежкам', emoji: '🍮', theme: 'caramel', desc: 'Капучино с домашней солёной карамелью и хрустящей крошкой печенья.' },
    { id: 'matcha', name: 'Матча «Зелёный котик»', price: 350, badge: 'Не кофе', emoji: '🍵', theme: 'matcha', desc: 'Церемониальная матча на миндальном молоке с ванилью и мёдом.' },
    { id: 'kakao', name: 'Какао «Тёплые лапки»', price: 300, badge: 'Согревающее', emoji: '🧸', theme: 'cocoa', desc: 'Бельгийское какао на цельном молоке с маршмеллоу и капелькой фундука.' },
    { id: 'raf', name: 'Раф «Пушистое облако»', price: 370, badge: 'Новинка', emoji: '☁️', theme: 'raf', desc: 'Бархатистый раф на сливках с лавандой и белым шоколадом.' }
  ];

  const menuGrid = $('#menu-grid');

  if (menuGrid) {
    menuGrid.innerHTML = MENU.map((item) => `
      <article class="drink-card">
        <div class="drink-visual drink-visual--${item.theme}">
          <span class="drink-badge">${item.badge}</span>
          ${item.photo
            ? `<img class="drink-emoji drink-photo" src="${item.photo}" alt="${item.name}" loading="lazy">`
            : `<span class="drink-emoji" aria-hidden="true">${item.emoji}</span>`}
        </div>
        <div class="drink-body">
          <h3>${item.name}</h3>
          <p class="drink-desc">${item.desc}</p>
          <div class="drink-foot">
            <span class="price">${item.price}<small>₽</small></span>
            <button class="drink-add" type="button" data-add="${item.id}">В заказ</button>
          </div>
        </div>
      </article>
    `).join('');

    menuGrid.addEventListener('click', (event) => {
      const btn = event.target.closest('[data-add]');
      if (btn) addToCart(btn.dataset.add);
    });
  }

  /* ----------------------------------------------------------
     4. Корзина
     ---------------------------------------------------------- */
  const CART_KEY = 'coffeecat-cart';
  const cartRoot = $('#cart');
  const cartOpenBtn = $('#cart-open');
  const cartCloseButtons = $$('[data-cart-close]');
  const cartCount = $('#cart-count');
  const cartList = $('#cart-list');
  const cartEmpty = $('#cart-empty');
  const cartTotal = $('#cart-total');
  const cartCheckout = $('#cart-checkout');

  let cart = loadCart();

  function loadCart() {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch (err) {
      return [];
    }
  }

  function saveCart() {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch (err) {
      /* приватный режим — просто работаем без сохранения */
    }
  }

  function addToCart(id) {
    const item = MENU.find((entry) => entry.id === id);
    if (!item) return;

    const row = cart.find((entry) => entry.id === id);
    if (row) {
      row.qty += 1;
    } else {
      cart.push({ id: item.id, name: item.name, price: item.price, emoji: item.emoji, qty: 1 });
    }

    saveCart();
    renderCart();
    toast('☕ ' + item.name + ' — в заказе');
  }

  function changeQty(id, delta) {
    const row = cart.find((entry) => entry.id === id);
    if (!row) return;

    row.qty += delta;
    if (row.qty <= 0) {
      cart = cart.filter((entry) => entry.id !== id);
    }

    saveCart();
    renderCart();
  }

  function removeFromCart(id) {
    cart = cart.filter((entry) => entry.id !== id);
    saveCart();
    renderCart();
  }

  function renderCart() {
    const totalQty = cart.reduce((sum, entry) => sum + entry.qty, 0);
    const totalSum = cart.reduce((sum, entry) => sum + entry.price * entry.qty, 0);

    if (cartCount) {
      cartCount.textContent = totalQty;
      cartCount.hidden = totalQty === 0;
    }
    if (cartTotal) cartTotal.textContent = fmtMoney(totalSum);
    if (cartCheckout) cartCheckout.disabled = !cart.length;
    if (!cartList || !cartEmpty) return;

    if (!cart.length) {
      cartList.innerHTML = '';
      cartEmpty.hidden = false;
      return;
    }

    cartEmpty.hidden = true;
    cartList.innerHTML = cart.map((entry) => `
      <div class="cart-item">
        <span class="cart-item-emoji" aria-hidden="true">${entry.emoji}</span>
        <div class="cart-item-info">
          <div class="cart-item-name">${entry.name}</div>
          <div class="cart-item-price">${fmtMoney(entry.price)}</div>
          <div class="cart-item-row">
            <div class="cart-qty">
              <button type="button" data-dec="${entry.id}" aria-label="Убрать одну">−</button>
              <span class="cart-qty-num">${entry.qty}</span>
              <button type="button" data-inc="${entry.id}" aria-label="Добавить ещё">+</button>
            </div>
            <button class="cart-item-remove" type="button" data-remove="${entry.id}">Удалить</button>
          </div>
        </div>
        <span class="cart-item-sum">${fmtMoney(entry.price * entry.qty)}</span>
      </div>
    `).join('');
  }

  if (cartList) {
    cartList.addEventListener('click', (event) => {
      const dec = event.target.closest('[data-dec]');
      const inc = event.target.closest('[data-inc]');
      const remove = event.target.closest('[data-remove]');

      if (dec) changeQty(dec.dataset.dec, -1);
      else if (inc) changeQty(inc.dataset.inc, 1);
      else if (remove) removeFromCart(remove.dataset.remove);
    });
  }

  function setCart(open) {
    if (!cartRoot) return;

    cartRoot.classList.toggle('is-open', open);
    cartRoot.setAttribute('aria-hidden', String(!open));
    document.body.classList.toggle('no-scroll', open);

    if (open) {
      const closeBtn = $('.cart-close');
      if (closeBtn) closeBtn.focus();
    } else if (cartOpenBtn) {
      cartOpenBtn.focus();
    }
  }

  if (cartOpenBtn) {
    cartOpenBtn.addEventListener('click', () => setCart(true));
  }

  cartCloseButtons.forEach((btn) => {
    btn.addEventListener('click', () => setCart(false));
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && cartRoot && cartRoot.classList.contains('is-open')) {
      setCart(false);
    }
  });

  if (cartCheckout) {
    cartCheckout.addEventListener('click', () => {
      if (!cart.length) return;

      toast('🎉 Спасибо! Заказ принят — подойдите к кассе в течение 15 минут.');
      cart = [];
      saveCart();
      renderCart();
      setCart(false);
    });
  }

  // Инициализация корзины (счётчик из localStorage при загрузке)
  renderCart();

  /* ----------------------------------------------------------
     5. Тосты-уведомления
     ---------------------------------------------------------- */
  const toastContainer = $('#toasts');

  function toast(message) {
    if (!toastContainer) return;

    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = message;
    toastContainer.appendChild(el);

    setTimeout(() => el.classList.add('is-hide'), 2600);
    setTimeout(() => el.remove(), 3050);
  }

  /* ----------------------------------------------------------
     6. Статус «открыто / закрыто»
        Пн–Пт 8:00–22:00; Сб–Вс 9:00–23:00
     ---------------------------------------------------------- */
  const SCHEDULE = {
    0: [540, 1380], // Вс 9:00–23:00
    1: [480, 1320], // Пн 8:00–22:00
    2: [480, 1320], // Вт
    3: [480, 1320], // Ср
    4: [480, 1320], // Чт
    5: [480, 1320], // Пт
    6: [540, 1380]  // Сб 9:00–23:00
  };

  const openBadge = $('.open-badge');
  const minutesToTime = (minutes) =>
    String(Math.floor(minutes / 60)).padStart(2, '0') + ':' + String(minutes % 60).padStart(2, '0');

  function updateOpenStatus() {
    if (!openBadge) return;

    const now = new Date();
    const day = now.getDay();
    const minutes = now.getHours() * 60 + now.getMinutes();
    const schedule = SCHEDULE[day];
    const isOpen = Boolean(schedule) && minutes >= schedule[0] && minutes < schedule[1];

    openBadge.classList.toggle('open-badge--closed', !isOpen);

    const textEl = $('.open-badge-text', openBadge);
    if (!textEl) return;

    if (isOpen) {
      textEl.textContent = 'Сейчас открыто — до ' + minutesToTime(schedule[1]);
    } else {
      let next = null;

      if (schedule && minutes < schedule[0]) {
        next = { day, minutes: schedule[0] };
      } else {
        for (let offset = 1; offset <= 7; offset += 1) {
          const nextDay = (day + offset) % 7;
          if (SCHEDULE[nextDay]) {
            next = { day: nextDay, minutes: SCHEDULE[nextDay][0] };
            break;
          }
        }
      }

      const when = next && next.day === day ? 'сегодня' : 'завтра';
      const time = next ? minutesToTime(next.minutes) : '';
      textEl.textContent = 'Сейчас закрыто — откроемся ' + when + ' в ' + time;
    }
  }

  updateOpenStatus();
  setInterval(updateOpenStatus, 60 * 1000);

})();