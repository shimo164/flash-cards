class FlashcardApp {
  constructor() {
    this.currentSet = null;
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
      // Load only set metadata (fast)
      const configResponse = await fetch('helper/set-metadata.json');
      const config = await configResponse.json();

      // Store metadata only, don't load card data yet
      this.sets = config.sets.map((set) => ({
        filename: set.filename,
        name: set.name,
        cardCount: set.cardCount,
        cards: null, // Will be loaded when needed
      }));
    } catch (error) {
      console.error('Failed to load sets configuration:', error);
      // Fallback to old method if metadata file doesn't exist
      await this.loadSetsOldWay();
    }
  }

  async loadSetsOldWay() {
    try {
      const configResponse = await fetch('helper/set-list.json');
      const config = await configResponse.json();

      for (const fileName of config.sets) {
        try {
          const response = await fetch(`card-sets/${fileName}`);
          const setData = await response.json();
          this.sets.push(setData);
        } catch (error) {
          console.error(`Failed to load card-sets/${fileName}:`, error);
        }
      }
    } catch (error) {
      console.error('Failed to load sets configuration:', error);
    }
  }

  async loadSetCards(setIndex) {
    const set = this.sets[setIndex];
    if (set.cards) {
      return; // Already loaded
    }

    try {
      const response = await fetch(`card-sets/${set.filename}`);
      const setData = await response.json();
      set.cards = setData.cards;
    } catch (error) {
      console.error(`Failed to load cards for ${set.filename}:`, error);
    }
  }

  setupEventListeners() {
    document.getElementById('flashcard').addEventListener('click', () => this.flipCard());
    document.getElementById('back-to-menu').addEventListener('click', () => this.showMenu());
    document.getElementById('back-to-cards').addEventListener('click', () => this.backToCards());
    document.getElementById('to-menu-btn').addEventListener('click', () => this.showMenu());
    document.getElementById('to-favorites-btn').addEventListener('click', () => this.showFavorites());
    document.getElementById('favorites-btn').addEventListener('click', () => this.showFavorites());
    document.getElementById('back-to-menu-from-favorites').addEventListener('click', () => this.showMenu());
    document.getElementById('favorite-star').addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleFavorite();
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

    // Filter sets based on current level filter
    const filteredSets = this.sets.filter((set, index) => {
      if (this.currentLevelFilter === 'all') {
        return true;
      }
      return set.name.includes(`(${this.currentLevelFilter})`);
    });

    filteredSets.forEach((set) => {
      const originalIndex = this.sets.findIndex((s) => s.name === set.name);
      const setItem = document.createElement('div');
      setItem.className = 'set-item';
      setItem.textContent = set.name;
      setItem.addEventListener('click', () => this.startSet(originalIndex));
      setList.appendChild(setItem);
    });
  }

  async startSet(setIndex) {
    this.currentSet = this.sets[setIndex];
    await this.loadSetCards(setIndex);

    this.currentCardIndex = 0;
    this.isFlipped = false;

    this.hideAllScreens();
    document.getElementById('card-screen').classList.add('active');

    document.getElementById('set-title').textContent = this.currentSet.name;
    document.getElementById('current-card').textContent = 1;
    document.getElementById('total-cards').textContent = this.currentSet.cards.length;

    this.setNormalNavigation();
    this.showCard();
  }

  setNormalNavigation() {
    document.getElementById('prev-btn').onclick = () => this.previousCard();
    document.getElementById('next-btn').onclick = () => this.nextCard();
    document.getElementById('next-btn').textContent = '次のフレーズ';
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
    nextBtn.textContent = currentFavIndex === this.favorites.length - 1 ? 'お気に入り一覧に戻る' : '次のお気に入り';
    
    document.getElementById('to-favorites-btn').style.display = 'block';
  }

  showCard() {
    const card = this.currentSet.cards[this.currentCardIndex];
    const cardContent = document.getElementById('card-content');

    // Reset flip state and show Japanese first
    this.isFlipped = false;
    cardContent.innerHTML = `<div>${card.japanese}</div>`;

    // Update button states
    document.getElementById('prev-btn').disabled = this.currentCardIndex === 0;
    document.getElementById('next-btn').disabled = false;

    // Update favorite star
    this.updateFavoriteStar();
  }

  flipCard() {
    const card = this.currentSet.cards[this.currentCardIndex];
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
      this.showCard();
    }
  }

  nextCard() {
    if (this.currentCardIndex < this.currentSet.cards.length - 1) {
      this.currentCardIndex++;
      document.getElementById('current-card').textContent = this.currentCardIndex + 1;
      this.showCard();
    } else {
      this.showComplete();
    }
  }

  showComplete() {
    this.hideAllScreens();
    document.getElementById('complete-screen').classList.add('active');

    // Display completed set name
    document.getElementById('completed-set-name').textContent = `${this.currentSet.name}`;

    this.renderNavigationLinks();
  }

  renderNavigationLinks() {
    const navContainer = document.getElementById('navigation-links');
    const currentSet = this.currentSet;

    // Parse current set info
    const currentName = currentSet.name;
    const match = currentName.match(/^(.+)\((初級|中級|上級)\)$/);

    if (!match) {
      navContainer.innerHTML = '';
      return;
    }

    const baseName = match[1];
    const currentLevel = match[2];

    // Map level to file suffix
    const levelMap = { 初級: 'L1', 中級: 'L2', 上級: 'L3' };
    const currentLevelSuffix = levelMap[currentLevel];

    // Find related sets
    const relatedSets = this.sets
      .filter((set, index) => {
        if (set.name.startsWith(baseName)) {
          return { set, index };
        }
        return null;
      })
      .map((item, originalIndex) => {
        const setIndex = this.sets.findIndex((s) => s.name === item.name);
        return { set: item, index: setIndex };
      });

    // Find adjacent theme sets with same level
    const currentFilename = currentSet.filename || '';
    const themeMatch = currentFilename.match(/business_(\d+)_(.+)_L\d\.json/);

    let adjacentSets = [];
    if (themeMatch) {
      const currentNum = parseInt(themeMatch[1]);
      const prevNum = String(currentNum - 1).padStart(2, '0');
      const nextNum = String(currentNum + 1).padStart(2, '0');

      adjacentSets = this.sets
        .filter((set, index) => {
          const filename = set.filename || '';
          const isPrev =
            filename.includes(`business_${prevNum}_`) &&
            filename.includes(`_${currentLevelSuffix}.json`);
          const isNext =
            filename.includes(`business_${nextNum}_`) &&
            filename.includes(`_${currentLevelSuffix}.json`);
          return isPrev || isNext;
        })
        .map((set) => {
          const setIndex = this.sets.findIndex((s) => s.name === set.name);
          return { set, index: setIndex };
        });
    }

    let html = '<h3>関連セット</h3>';

    // Adjacent themes
    if (adjacentSets.length > 0) {
      html += '<div class="nav-section">';
      html += `<h4>他のテーマ (${currentLevel})</h4>`;
      html += '<div class="theme-nav-links">';

      const currentFilename = currentSet.filename || '';
      const themeMatch = currentFilename.match(/business_(\d+)_(.+)_L\d\.json/);

      if (themeMatch) {
        const currentNum = parseInt(themeMatch[1]);
        const prevNum = String(currentNum - 1).padStart(2, '0');
        const nextNum = String(currentNum + 1).padStart(2, '0');

        // Find prev and next sets
        const prevSet = adjacentSets.find(({ set }) => {
          const filename = set.filename || '';
          return filename.includes(`business_${prevNum}_`);
        });

        const nextSet = adjacentSets.find(({ set }) => {
          const filename = set.filename || '';
          return filename.includes(`business_${nextNum}_`);
        });

        if (prevSet) {
          html += `<button class="theme-nav-btn prev-btn" onclick="app.startSet(${prevSet.index})">前</button>`;
        }
        if (nextSet) {
          html += `<button class="theme-nav-btn next-btn" onclick="app.startSet(${nextSet.index})">次</button>`;
        }
      }

      html += '</div></div>';
    }

    // Level navigation
    if (relatedSets.length > 1) {
      html += '<div class="nav-section">';
      html += '<h4>他のレベル</h4>';
      html += '<div class="nav-links">';

      relatedSets.forEach(({ set, index }) => {
        const levelMatch = set.name.match(/\((初級|中級|上級)\)$/);
        const level = levelMatch ? levelMatch[1] : '';
        if (level && level !== currentLevel) {
          html += `<button class="nav-link" onclick="app.startSet(${index})">${level}</button>`;
        }
      });

      html += '</div></div>';
    }

    navContainer.innerHTML = html;
  }

  backToCards() {
    this.currentCardIndex = this.currentSet.cards.length - 1;
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
    return `${this.currentSet.name}|${this.currentCardIndex}`;
  }

  toggleFavorite() {
    const cardId = this.getCardId();
    const index = this.favorites.findIndex(f => f.id === cardId);
    
    if (index >= 0) {
      this.favorites.splice(index, 1);
    } else {
      this.favorites.push({
        id: cardId,
        setName: this.currentSet.name,
        setIndex: this.sets.findIndex(s => s.name === this.currentSet.name),
        cardIndex: this.currentCardIndex,
        timestamp: Date.now()
      });
    }
    
    this.saveFavorites();
    this.updateFavoriteStar();
  }

  updateFavoriteStar() {
    const cardId = this.getCardId();
    const star = document.getElementById('favorite-star');
    const isFavorite = this.favorites.some(f => f.id === cardId);
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
      const card = set.cards[fav.cardIndex];
      
      const item = document.createElement('div');
      item.className = 'favorite-item';
      item.innerHTML = `
        <div class="favorite-content">
          <div class="favorite-set">${fav.setName}</div>
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
    this.currentCardIndex = fav.cardIndex;
    this.isFlipped = false;
    
    this.hideAllScreens();
    document.getElementById('card-screen').classList.add('active');
    
    document.getElementById('set-title').textContent = this.currentSet.name;
    
    const currentFavIndex = this.favorites.findIndex(f => f.id === fav.id);
    
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
