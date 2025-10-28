class FlashcardApp {
  constructor() {
    this.currentSet = null;
    this.currentLevel = null;
    this.currentCardIndex = 0;
    this.isFlipped = false;
    this.sets = [];
    this.currentLevelFilter = 'all';
    this.favorites = this.loadFavorites();
    this.favoritesList = [];

    this.init();
  }

  async init() {
    await this.loadSets();
    this.setupEventListeners();
    this.showMenu();
  }

  async loadSets() {
    try {
      const configResponse = await fetch('helper/set-metadata.json');
      const config = await configResponse.json();

      this.sets = config.sets.map((set) => ({
        filename: set.filename,
        name: set.name,
        cardCounts: set.cardCounts,
        levels: null,
      }));
    } catch (error) {
      console.error('Failed to load sets configuration:', error);
    }
  }

  async loadSetCards(setIndex) {
    const set = this.sets[setIndex];
    if (set.levels) {
      return;
    }

    try {
      const response = await fetch(`card-sets/${set.filename}`);
      const setData = await response.json();
      set.levels = setData.levels;
    } catch (error) {
      console.error(`Failed to load cards for ${set.filename}:`, error);
    }
  }

  setupEventListeners() {
    document.getElementById('flashcard').addEventListener('click', () => this.flipCard());
    document.getElementById('back-to-menu').addEventListener('click', () => this.showMenu());
    document.getElementById('back-to-cards').addEventListener('click', () => this.backToCards());
    document.getElementById('to-menu-btn').addEventListener('click', () => this.showMenu());
    document
      .getElementById('to-favorites-btn')
      .addEventListener('click', () => this.showFavorites());
    document.getElementById('favorites-btn').addEventListener('click', () => this.showFavorites());
    document
      .getElementById('back-to-menu-from-favorites')
      .addEventListener('click', () => this.showMenu());
    document.getElementById('favorite-star').addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleFavorite();
    });

    // Hamburger menu
    document.getElementById('hamburger-menu').addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('dropdown-menu').classList.toggle('active');
    });
    
    document.addEventListener('click', () => {
      document.getElementById('dropdown-menu').classList.remove('active');
    });

    // Level filter buttons
    document.querySelectorAll('.level-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => this.setLevelFilter(e.target.dataset.level));
    });
  }

  showMenu() {
    this.hideAllScreens();
    document.getElementById('menu-screen').classList.add('active');
    this.renderSetList();
  }

  setLevelFilter(level) {
    this.currentLevelFilter = level;

    // Update button states
    document.querySelectorAll('.level-btn').forEach((btn) => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-level="${level}"]`).classList.add('active');

    // Re-render set list
    this.renderSetList();
  }

  renderSetList() {
    const setList = document.getElementById('set-list');
    setList.innerHTML = '';

    const filteredSets = this.sets.filter((set) => {
      if (this.currentLevelFilter === 'all') return true;
      const levelMap = { 初級: 'L1', 中級: 'L2', 上級: 'L3' };
      return set.cardCounts[levelMap[this.currentLevelFilter]] > 0;
    });

    filteredSets.forEach((set) => {
      const originalIndex = this.sets.findIndex((s) => s.name === set.name);
      const setItem = document.createElement('div');
      setItem.className = 'set-item';

      const title = document.createElement('div');
      title.className = 'set-title';
      title.textContent = set.name;
      setItem.appendChild(title);

      const levels = document.createElement('div');
      levels.className = 'set-levels';

      ['L1', 'L2', 'L3'].forEach((level) => {
        const btn = document.createElement('button');
        btn.className = `level-select-btn level-${level}`;
        btn.textContent = level === 'L1' ? '初級' : level === 'L2' ? '中級' : '上級';
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.startSet(originalIndex, level);
        });
        levels.appendChild(btn);
      });

      setItem.appendChild(levels);
      setList.appendChild(setItem);
    });
  }

  async startSet(setIndex, level) {
    this.currentSet = this.sets[setIndex];
    this.currentLevel = level;
    await this.loadSetCards(setIndex);

    this.currentCardIndex = 0;
    this.isFlipped = false;

    this.hideAllScreens();
    document.getElementById('card-screen').classList.add('active');

    const levelName = level === 'L1' ? '初級' : level === 'L2' ? '中級' : '上級';
    document.getElementById('set-title').textContent = `${this.currentSet.name} (${levelName})`;
    document.getElementById('current-card').textContent = 1;
    document.getElementById('total-cards').textContent = this.currentSet.levels[level].length;

    this.setNormalNavigation();
    this.showCard();
  }

  setNormalNavigation() {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');

    prevBtn.onclick = () => this.previousCard();
    nextBtn.onclick = () => this.nextCard();
    nextBtn.textContent = '次のフレーズ';

    prevBtn.disabled = this.currentCardIndex === 0;
    nextBtn.disabled = false;

    document.getElementById('to-favorites-btn').style.display = 'none';
  }

  setFavoritesNavigation(currentFavIndex) {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');

    prevBtn.onclick = () => {
      if (currentFavIndex > 0) {
        this.openFavoriteCard(this.favorites[currentFavIndex - 1]);
      }
    };
    prevBtn.disabled = currentFavIndex === 0;

    nextBtn.onclick = () => {
      if (currentFavIndex < this.favorites.length - 1) {
        this.openFavoriteCard(this.favorites[currentFavIndex + 1]);
      } else {
        this.showFavorites();
      }
    };
    nextBtn.disabled = false;
    nextBtn.textContent =
      currentFavIndex === this.favorites.length - 1 ? 'お気に入り一覧に戻る' : '次のお気に入り';

    document.getElementById('to-favorites-btn').style.display = 'block';
  }

  showCard() {
    const cards = this.currentSet.levels[this.currentLevel];
    const card = cards[this.currentCardIndex];
    const cardContent = document.getElementById('card-content');

    this.isFlipped = false;
    cardContent.innerHTML = `<div>${card.japanese}</div>`;

    this.updateFavoriteStar();
  }

  flipCard() {
    const cards = this.currentSet.levels[this.currentLevel];
    const card = cards[this.currentCardIndex];
    const cardContent = document.getElementById('card-content');

    this.isFlipped = !this.isFlipped;

    if (this.isFlipped) {
      cardContent.innerHTML = `<div>${card.english}</div>`;
    } else {
      cardContent.innerHTML = `<div>${card.japanese}</div>`;
    }
  }

  previousCard() {
    if (this.currentCardIndex > 0) {
      this.currentCardIndex--;
      document.getElementById('current-card').textContent = this.currentCardIndex + 1;
      document.getElementById('prev-btn').disabled = this.currentCardIndex === 0;
      this.showCard();
    }
  }

  nextCard() {
    const cards = this.currentSet.levels[this.currentLevel];
    if (this.currentCardIndex < cards.length - 1) {
      this.currentCardIndex++;
      document.getElementById('current-card').textContent = this.currentCardIndex + 1;
      document.getElementById('prev-btn').disabled = false;
      this.showCard();
    } else {
      this.showComplete();
    }
  }

  showComplete() {
    this.hideAllScreens();
    document.getElementById('complete-screen').classList.add('active');

    const levelName =
      this.currentLevel === 'L1' ? '初級' : this.currentLevel === 'L2' ? '中級' : '上級';
    document.getElementById(
      'completed-set-name',
    ).textContent = `${this.currentSet.name} (${levelName})`;

    this.renderNavigationLinks();
  }

  renderNavigationLinks() {
    const navContainer = document.getElementById('navigation-links');
    const currentSetIndex = this.sets.findIndex((s) => s.name === this.currentSet.name);

    let html = '<h3>関連セット</h3>';

    // Other levels
    html += '<div class="nav-section"><div class="nav-links">';
    ['L1', 'L2', 'L3'].forEach((level) => {
      if (level !== this.currentLevel) {
        const levelName = level === 'L1' ? '初級' : level === 'L2' ? '中級' : '上級';
        html += `<button class="nav-link level-${level}" onclick="app.startSet(${currentSetIndex}, '${level}')">${levelName}</button>`;
      }
    });
    html += '</div></div>';

    // Adjacent themes
    html += '<div class="theme-nav-section">';
    if (currentSetIndex > 0) {
      html += `<button class="btn" onclick="app.startSet(${currentSetIndex - 1}, '${
        this.currentLevel
      }')">前のテーマ</button>`;
    }
    if (currentSetIndex < this.sets.length - 1) {
      html += `<button class="btn" onclick="app.startSet(${currentSetIndex + 1}, '${
        this.currentLevel
      }')">次のテーマ</button>`;
    }
    html += '</div>';

    navContainer.innerHTML = html;
  }

  backToCards() {
    const cards = this.currentSet.levels[this.currentLevel];
    this.currentCardIndex = cards.length - 1;
    this.isFlipped = false;
    this.hideAllScreens();
    document.getElementById('card-screen').classList.add('active');
    this.showCard();
  }

  hideAllScreens() {
    document.querySelectorAll('.screen').forEach((screen) => {
      screen.classList.remove('active');
    });
  }

  loadFavorites() {
    const saved = localStorage.getItem('flashcard-favorites');
    return saved ? JSON.parse(saved) : [];
  }

  saveFavorites() {
    localStorage.setItem('flashcard-favorites', JSON.stringify(this.favorites));
  }

  getCardId() {
    return `${this.currentSet.name}|${this.currentLevel}|${this.currentCardIndex}`;
  }

  toggleFavorite() {
    const cardId = this.getCardId();
    const index = this.favorites.findIndex((f) => f.id === cardId);

    if (index >= 0) {
      this.favorites.splice(index, 1);
    } else {
      this.favorites.push({
        id: cardId,
        setName: this.currentSet.name,
        level: this.currentLevel,
        setIndex: this.sets.findIndex((s) => s.name === this.currentSet.name),
        cardIndex: this.currentCardIndex,
        timestamp: Date.now(),
      });
    }

    this.saveFavorites();
    this.updateFavoriteStar();
  }

  updateFavoriteStar() {
    const cardId = this.getCardId();
    const star = document.getElementById('favorite-star');
    const isFavorite = this.favorites.some((f) => f.id === cardId);
    star.textContent = isFavorite ? '★' : '☆';
    star.classList.toggle('active', isFavorite);
  }

  async showFavorites() {
    this.hideAllScreens();
    document.getElementById('favorites-screen').classList.add('active');

    const list = document.getElementById('favorites-list');

    if (this.favorites.length === 0) {
      list.innerHTML = '<p class="no-favorites">お気に入りがありません</p>';
      return;
    }

    list.innerHTML = '';

    for (const fav of this.favorites) {
      await this.loadSetCards(fav.setIndex);
      const set = this.sets[fav.setIndex];
      const card = set.levels[fav.level][fav.cardIndex];

      const levelName = fav.level === 'L1' ? '初級' : fav.level === 'L2' ? '中級' : '上級';

      const item = document.createElement('div');
      item.className = 'favorite-item';
      item.innerHTML = `
        <div class="favorite-content">
          <div class="favorite-set">${fav.setName} (${levelName})</div>
          <div class="favorite-text">${card.japanese}</div>
        </div>
      `;
      item.addEventListener('click', () => this.openFavoriteCard(fav));
      list.appendChild(item);
    }
  }

  async openFavoriteCard(fav) {
    await this.loadSetCards(fav.setIndex);
    this.currentSet = this.sets[fav.setIndex];
    this.currentLevel = fav.level;
    this.currentCardIndex = fav.cardIndex;
    this.isFlipped = false;

    this.hideAllScreens();
    document.getElementById('card-screen').classList.add('active');

    const levelName = fav.level === 'L1' ? '初級' : fav.level === 'L2' ? '中級' : '上級';
    document.getElementById('set-title').textContent = `${this.currentSet.name} (${levelName})`;

    const currentFavIndex = this.favorites.findIndex((f) => f.id === fav.id);

    document.getElementById('current-card').textContent = currentFavIndex + 1;
    document.getElementById('total-cards').textContent = this.favorites.length;

    this.setFavoritesNavigation(currentFavIndex);
    this.showCard();
  }
}

// アプリケーション開始
let app;
document.addEventListener('DOMContentLoaded', () => {
  app = new FlashcardApp();
});
