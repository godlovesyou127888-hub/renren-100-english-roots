(function () {
  function start(roots) {
    const grid = document.querySelector("#rootGrid");
    const searchInput = document.querySelector("#searchInput");
    const filters = document.querySelector("#themeFilters");
    const resultCount = document.querySelector("#resultCount");
    const favoriteCount = document.querySelector("#favoriteCount");
    const seniorMode = document.querySelector("#seniorMode");
    const showFavorites = document.querySelector("#showFavorites");
    const favoriteKey = "renren-root-favorites";
    const seniorKey = "renren-senior-mode";

    let activeTheme = "全部";
    let favoritesOnly = false;
    let favorites = new Set(JSON.parse(localStorage.getItem(favoriteKey) || "[]"));
    let themes = ["全部", ...Array.from(new Set(roots.map((item) => item.theme)))];

    function saveFavorites() {
      localStorage.setItem(favoriteKey, JSON.stringify(Array.from(favorites)));
      favoriteCount.textContent = favorites.size;
    }

    function normalize(value) {
      return String(value || "").toLowerCase().trim();
    }

    function matchesSearch(item, query) {
      if (!query) return true;
      const haystack = [
        item.root,
        item.meaning,
        item.theme,
        item.note,
        ...item.examples.flatMap((example) => [example.word, example.kk, example.zh]),
      ].join(" ");
      return normalize(haystack).includes(query);
    }

    function cardTemplate(item) {
      const isFavorite = favorites.has(item.id);
      const words = item.examples.map((example) => `
        <li class="word-item">
          <span class="word">${example.word}</span>
          <span class="kk">${example.kk}</span>
          <span class="zh">${example.zh}</span>
        </li>
      `).join("");

      return `
        <article class="root-card">
          <div class="card-header">
            <div>
              <h3 class="root-title">${item.id}. ${item.root}</h3>
              <span class="meaning">${item.meaning}</span>
            </div>
            <button class="fav-button" type="button" data-id="${item.id}" aria-pressed="${isFavorite}">
              ${isFavorite ? "已收藏" : "收藏"}
            </button>
          </div>
          <p class="theme">主題：${item.theme}</p>
          <p class="note">${item.note}</p>
          <ul class="word-list">${words}</ul>
        </article>
      `;
    }

    function renderFilters() {
      filters.innerHTML = themes.map((theme) => `
        <button class="filter-button ${theme === activeTheme ? "active" : ""}" type="button" data-theme="${theme}">
          ${theme}
        </button>
      `).join("");
    }

    function render() {
      const query = normalize(searchInput.value);
      const visible = roots.filter((item) => {
        const themeOk = activeTheme === "全部" || item.theme === activeTheme;
        const favoriteOk = !favoritesOnly || favorites.has(item.id);
        return themeOk && favoriteOk && matchesSearch(item, query);
      });

      resultCount.textContent = visible.length;
      grid.innerHTML = visible.length
        ? visible.map(cardTemplate).join("")
        : '<div class="empty">目前沒有符合的字根，換一個關鍵字試試看。</div>';
    }

    function setSeniorMode(enabled) {
      document.body.classList.toggle("senior", enabled);
      seniorMode.setAttribute("aria-pressed", String(enabled));
      seniorMode.textContent = enabled ? "樂齡大字" : "一般字級";
      localStorage.setItem(seniorKey, enabled ? "1" : "0");
    }

    filters.addEventListener("click", (event) => {
      const button = event.target.closest("[data-theme]");
      if (!button) return;
      activeTheme = button.dataset.theme;
      renderFilters();
      render();
    });

    grid.addEventListener("click", (event) => {
      const button = event.target.closest("[data-id]");
      if (!button) return;
      const id = Number(button.dataset.id);
      if (favorites.has(id)) {
        favorites.delete(id);
      } else {
        favorites.add(id);
      }
      saveFavorites();
      render();
    });

    searchInput.addEventListener("input", render);

    seniorMode.addEventListener("click", () => {
      setSeniorMode(!document.body.classList.contains("senior"));
    });

    showFavorites.addEventListener("click", () => {
      favoritesOnly = !favoritesOnly;
      showFavorites.setAttribute("aria-pressed", String(favoritesOnly));
      showFavorites.textContent = favoritesOnly ? "顯示全部" : "只看收藏";
      render();
    });

    if ("serviceWorker" in navigator && location.protocol !== "file:") {
      navigator.serviceWorker.register("sw.js");
    }

    renderFilters();
    saveFavorites();
    setSeniorMode(localStorage.getItem(seniorKey) !== "0");
    render();
  }

  if (window.ROOTS_DATA) {
    start(window.ROOTS_DATA);
  } else {
    window.addEventListener("roots-data-ready", () => start(window.ROOTS_DATA || []), { once: true });
  }
})();
