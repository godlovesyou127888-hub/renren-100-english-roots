(function () {
  function start(roots) {
    const catalogView = document.querySelector("#catalogView");
    const readerView = document.querySelector("#readerView");
    const quizView = document.querySelector("#quizView");
    const catalogTab = document.querySelector("#catalogTab");
    const readerTab = document.querySelector("#readerTab");
    const quizTab = document.querySelector("#quizTab");
    const catalogList = document.querySelector("#catalogList");
    const rootPage = document.querySelector("#rootPage");
    const searchInput = document.querySelector("#searchInput");
    const filters = document.querySelector("#themeFilters");
    const dayFilters = document.querySelector("#dayFilters");
    const dayTitle = document.querySelector("#dayTitle");
    const dayRange = document.querySelector("#dayRange");
    const resultCount = document.querySelector("#resultCount");
    const favoriteCount = document.querySelector("#favoriteCount");
    const seniorMode = document.querySelector("#seniorMode");
    const showFavorites = document.querySelector("#showFavorites");
    const startReading = document.querySelector("#startReading");
    const backToCatalog = document.querySelector("#backToCatalog");
    const prevPage = document.querySelector("#prevPage");
    const nextPage = document.querySelector("#nextPage");
    const pageCounter = document.querySelector("#pageCounter");
    const restartQuiz = document.querySelector("#restartQuiz");
    const nextQuestion = document.querySelector("#nextQuestion");
    const quizCounter = document.querySelector("#quizCounter");
    const quizScore = document.querySelector("#quizScore");
    const quizCard = document.querySelector("#quizCard");
    const quizFeedback = document.querySelector("#quizFeedback");
    const quizModeText = document.querySelector("#quizModeText");

    const favoriteKey = "renren-root-favorites";
    const seniorKey = "renren-senior-mode";
    const rootsPerDay = 10;

    let activeTheme = "全部";
    let activeDay = 1;
    let favoritesOnly = false;
    let currentIndex = 0;
    let filteredRoots = roots.slice(0, rootsPerDay);
    let favorites = new Set(JSON.parse(localStorage.getItem(favoriteKey) || "[]"));
    let quizMode = "day1";
    let quizQuestions = [];
    let quizIndex = 0;
    let score = 0;
    let answered = false;
    const totalDays = Math.ceil(roots.length / rootsPerDay);
    const themes = ["全部", ...Array.from(new Set(roots.map((item) => item.theme)))];

    function normalize(value) {
      return String(value || "").toLowerCase().trim();
    }

    function saveFavorites() {
      localStorage.setItem(favoriteKey, JSON.stringify(Array.from(favorites)));
      favoriteCount.textContent = favorites.size;
    }

    function shuffle(items) {
      const copy = items.slice();
      for (let index = copy.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
      }
      return copy;
    }

    function getDayRoots(day) {
      const start = (day - 1) * rootsPerDay;
      return roots.slice(start, start + rootsPerDay);
    }

    function getQuizSource() {
      if (quizMode === "day1") return getDayRoots(1);
      if (quizMode === "day2") return getDayRoots(2);
      return roots;
    }

    function getQuizLabel() {
      if (quizMode === "day1") return "第 1 天測驗";
      if (quizMode === "day2") return "第 2 天測驗";
      return "全部混合測驗";
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

    function getVisibleRoots() {
      const query = normalize(searchInput.value);
      return getDayRoots(activeDay).filter((item) => {
        const themeOk = activeTheme === "全部" || item.theme === activeTheme;
        const favoriteOk = !favoritesOnly || favorites.has(item.id);
        return themeOk && favoriteOk && matchesSearch(item, query);
      });
    }

    function showView(viewName) {
      const isCatalog = viewName === "catalog";
      const isReader = viewName === "reader";
      catalogView.classList.toggle("active", isCatalog);
      readerView.classList.toggle("active", isReader);
      quizView.classList.toggle("active", viewName === "quiz");
      catalogTab.classList.toggle("active", isCatalog);
      readerTab.classList.toggle("active", isReader);
      quizTab.classList.toggle("active", viewName === "quiz");
    }

    function renderDayFilters() {
      dayFilters.innerHTML = Array.from({ length: totalDays }, (_, index) => {
        const day = index + 1;
        return `
          <button class="day-button ${day === activeDay ? "active" : ""}" type="button" data-day="${day}">
            第 ${day} 天
          </button>
        `;
      }).join("");
      const start = (activeDay - 1) * rootsPerDay + 1;
      const end = Math.min(activeDay * rootsPerDay, roots.length);
      dayTitle.textContent = `第 ${activeDay} 天`;
      dayRange.textContent = `字根 ${start}-${end}`;
    }

    function renderFilters() {
      filters.innerHTML = themes.map((theme) => `
        <button class="filter-button ${theme === activeTheme ? "active" : ""}" type="button" data-theme="${theme}">
          ${theme}
        </button>
      `).join("");
    }

    function renderCatalog() {
      filteredRoots = getVisibleRoots();
      resultCount.textContent = filteredRoots.length;

      catalogList.innerHTML = filteredRoots.length
        ? filteredRoots.map((item, index) => {
          const isFavorite = favorites.has(item.id);
          return `
            <li>
              <button class="catalog-item" type="button" data-index="${index}">
                <span class="catalog-no">${String(item.id).padStart(2, "0")}</span>
                <span class="catalog-main">
                  <strong>${item.root}</strong>
                  <em>${item.meaning}</em>
                  <small>${item.theme}</small>
                </span>
                <span class="catalog-star" aria-hidden="true">${isFavorite ? "★" : "☆"}</span>
              </button>
            </li>
          `;
        }).join("")
        : '<li class="empty">目前沒有符合的字根，請換一個關鍵字。</li>';

      if (currentIndex >= filteredRoots.length) currentIndex = Math.max(0, filteredRoots.length - 1);
      renderReader();
    }

    function renderReader() {
      const item = filteredRoots[currentIndex] || getDayRoots(activeDay)[0];
      if (!item) {
        rootPage.innerHTML = '<div class="empty">目前沒有字根資料。</div>';
        return;
      }

      const isFavorite = favorites.has(item.id);
      const words = item.examples.map((example) => `
        <li class="word-item">
          <span class="word">${example.word}</span>
          <span class="kk">[${example.kk}]</span>
          <span class="zh">${example.zh}</span>
        </li>
      `).join("");

      pageCounter.textContent = `第 ${activeDay} 天｜第 ${currentIndex + 1} / ${filteredRoots.length || rootsPerDay} 頁`;
      prevPage.disabled = currentIndex === 0;
      nextPage.disabled = currentIndex >= filteredRoots.length - 1;

      rootPage.innerHTML = `
        <div class="root-head">
          <span class="page-no">${String(item.id).padStart(2, "0")}</span>
          <button class="fav-button" type="button" data-fav-id="${item.id}" aria-pressed="${isFavorite}">
            ${isFavorite ? "已收藏 ★" : "收藏 ☆"}
          </button>
        </div>
        <h2>${item.root}</h2>
        <p class="meaning">${item.meaning}</p>
        <p class="theme">主題：${item.theme}</p>
        <p class="note">${item.note}</p>
        <h3>例字</h3>
        <ul class="word-list">${words}</ul>
      `;
    }

    function makeQuizQuestion(answer, source) {
      const wrongOptions = shuffle(source.filter((item) => item.id !== answer.id))
        .concat(shuffle(roots.filter((item) => item.id !== answer.id)))
        .map((item) => item.meaning)
        .filter((meaning, index, list) => meaning !== answer.meaning && list.indexOf(meaning) === index)
        .slice(0, 3);
      return { answer, options: shuffle([answer.meaning, ...wrongOptions]) };
    }

    function startQuiz() {
      const source = getQuizSource();
      quizQuestions = shuffle(source).slice(0, Math.min(rootsPerDay, source.length)).map((item) => makeQuizQuestion(item, source));
      quizIndex = 0;
      score = 0;
      answered = false;
      quizScore.textContent = "0";
      quizModeText.textContent = getQuizLabel();
      document.querySelectorAll("[data-quiz-mode]").forEach((button) => {
        button.classList.toggle("active", button.dataset.quizMode === quizMode);
      });
      renderQuiz();
      showView("quiz");
    }

    function renderQuiz() {
      const question = quizQuestions[quizIndex];
      if (!question) {
        quizCounter.textContent = "完成";
        quizCard.innerHTML = `
          <div class="quiz-finish">
            <h2>測驗完成！</h2>
            <p>這次答對 <strong>${score}</strong> / ${quizQuestions.length} 題。</p>
            <p>${score >= 8 ? "很棒，可以進入下一組字根。" : "沒關係，回到目錄再複習一次。"}</p>
            <div class="signup-cta">
              <strong>想跟老師 10 天學完 100 個字根？</strong>
              <p>第一梯測試價 NT$499，請 EMAIL 至 godlovesyou127888@gmail.com：我要參加字根小班。</p>
              <form class="signup-form" action="https://formsubmit.co/godlovesyou127888@gmail.com" method="POST">
                <input type="hidden" name="_subject" value="人人100英文字根小班報名">
                <input type="hidden" name="_template" value="table">
                <input type="hidden" name="_captcha" value="false">
                <input type="hidden" name="_next" value="https://godlovesyou127888-hub.github.io/renren-100-english-roots/">
                <input type="hidden" name="報名內容" value="我要參加字根小班">
                <label>
                  <span>姓名</span>
                  <input name="姓名" type="text" autocomplete="name" required placeholder="請輸入姓名">
                </label>
                <label>
                  <span>Email</span>
                  <input name="email" type="email" autocomplete="email" required placeholder="請輸入 Email">
                </label>
                <button class="primary-button signup-submit" type="submit">送出報名資料</button>
              </form>
            </div>
          </div>
        `;
        quizFeedback.textContent = "";
        quizFeedback.className = "quiz-feedback";
        nextQuestion.textContent = "再測一次";
        nextQuestion.disabled = false;
        return;
      }

      answered = false;
      quizCounter.textContent = `第 ${quizIndex + 1} / ${quizQuestions.length} 題`;
      quizScore.textContent = score;
      quizFeedback.textContent = "請選出這個字根的中文意思。";
      quizFeedback.className = "quiz-feedback";
      nextQuestion.textContent = quizIndex === quizQuestions.length - 1 ? "看成績" : "下一題";
      nextQuestion.disabled = true;

      quizCard.innerHTML = `
        <p class="quiz-label">這個字根是</p>
        <h2>${question.answer.root}</h2>
        <p class="quiz-note">${question.answer.note}</p>
        <div class="quiz-options">
          ${question.options.map((option) => `
            <button class="quiz-option" type="button" data-answer="${option}">
              ${option}
            </button>
          `).join("")}
        </div>
      `;
    }

    function answerQuiz(option) {
      if (answered) return;
      const question = quizQuestions[quizIndex];
      const isCorrect = option === question.answer.meaning;
      answered = true;
      if (isCorrect) score += 1;
      quizScore.textContent = score;
      quizFeedback.textContent = isCorrect
        ? `答對了！${question.answer.root} 的意思是「${question.answer.meaning}」。`
        : `再複習一次：${question.answer.root} 的意思是「${question.answer.meaning}」。`;
      quizFeedback.className = `quiz-feedback ${isCorrect ? "correct" : "wrong"}`;
      nextQuestion.disabled = false;

      quizCard.querySelectorAll(".quiz-option").forEach((button) => {
        const buttonCorrect = button.dataset.answer === question.answer.meaning;
        button.disabled = true;
        button.classList.toggle("correct", buttonCorrect);
        button.classList.toggle("wrong", !buttonCorrect && button.dataset.answer === option);
      });
    }

    function setSeniorMode(enabled) {
      document.body.classList.toggle("senior", enabled);
      seniorMode.setAttribute("aria-pressed", String(enabled));
      seniorMode.textContent = enabled ? "大字" : "標準";
      localStorage.setItem(seniorKey, enabled ? "1" : "0");
    }

    dayFilters.addEventListener("click", (event) => {
      const button = event.target.closest("[data-day]");
      if (!button) return;
      activeDay = Number(button.dataset.day);
      currentIndex = 0;
      renderDayFilters();
      renderCatalog();
    });

    filters.addEventListener("click", (event) => {
      const button = event.target.closest("[data-theme]");
      if (!button) return;
      activeTheme = button.dataset.theme;
      currentIndex = 0;
      renderFilters();
      renderCatalog();
    });

    catalogList.addEventListener("click", (event) => {
      const button = event.target.closest("[data-index]");
      if (!button) return;
      currentIndex = Number(button.dataset.index);
      renderReader();
      showView("reader");
    });

    rootPage.addEventListener("click", (event) => {
      const button = event.target.closest("[data-fav-id]");
      if (!button) return;
      const id = Number(button.dataset.favId);
      if (favorites.has(id)) favorites.delete(id); else favorites.add(id);
      saveFavorites();
      renderCatalog();
      renderReader();
    });

    quizCard.addEventListener("click", (event) => {
      const button = event.target.closest("[data-answer]");
      if (!button) return;
      answerQuiz(button.dataset.answer);
    });

    document.querySelectorAll("[data-quiz-mode]").forEach((button) => {
      button.addEventListener("click", () => {
        quizMode = button.dataset.quizMode;
        startQuiz();
      });
    });

    searchInput.addEventListener("input", () => { currentIndex = 0; renderCatalog(); });
    showFavorites.addEventListener("click", () => {
      favoritesOnly = !favoritesOnly;
      showFavorites.setAttribute("aria-pressed", String(favoritesOnly));
      showFavorites.textContent = favoritesOnly ? "顯示全部" : "只看收藏";
      currentIndex = 0;
      renderCatalog();
    });
    startReading.addEventListener("click", () => { currentIndex = 0; renderReader(); showView("reader"); });
    catalogTab.addEventListener("click", () => showView("catalog"));
    readerTab.addEventListener("click", () => showView("reader"));
    quizTab.addEventListener("click", () => showView("quiz"));
    restartQuiz.addEventListener("click", startQuiz);
    backToCatalog.addEventListener("click", () => showView("catalog"));
    seniorMode.addEventListener("click", () => setSeniorMode(!document.body.classList.contains("senior")));
    prevPage.addEventListener("click", () => { if (currentIndex > 0) { currentIndex -= 1; renderReader(); } });
    nextPage.addEventListener("click", () => { if (currentIndex < filteredRoots.length - 1) { currentIndex += 1; renderReader(); } });
    nextQuestion.addEventListener("click", () => {
      if (!quizQuestions[quizIndex]) { startQuiz(); return; }
      quizIndex += 1;
      renderQuiz();
    });

    if ("serviceWorker" in navigator && location.protocol !== "file:") navigator.serviceWorker.register("sw.js");

    renderDayFilters();
    renderFilters();
    saveFavorites();
    setSeniorMode(localStorage.getItem(seniorKey) !== "0");
    renderCatalog();
    startQuiz();
    showView("catalog");
  }

  if (window.ROOTS_DATA) {
    start(window.ROOTS_DATA);
  } else {
    window.addEventListener("roots-data-ready", () => start(window.ROOTS_DATA || []), { once: true });
  }
})();
