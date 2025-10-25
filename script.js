class FlashcardApp {
  constructor() {
    this.currentSet = null;
    this.currentCardIndex = 0;
    this.isFlipped = false;
    this.sets = [];

    this.init();
  }

  async init() {
    await this.loadSets();
    this.setupEventListeners();
    this.showMenu();
  }

  async loadSets() {
    try {
      // Load sets configuration
      const configResponse = await fetch('helper/set-list.json');
      const config = await configResponse.json();

      // Load each set file
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

  setupEventListeners() {
    document.getElementById('flashcard').addEventListener('click', () => this.flipCard());
    document.getElementById('prev-btn').addEventListener('click', () => this.previousCard());
    document.getElementById('next-btn').addEventListener('click', () => this.nextCard());
    document.getElementById('back-to-menu').addEventListener('click', () => this.showMenu());
    document.getElementById('back-to-cards').addEventListener('click', () => this.backToCards());
  }

  showMenu() {
    this.hideAllScreens();
    document.getElementById('menu-screen').classList.add('active');
    this.renderSetList();
  }

  renderSetList() {
    const setList = document.getElementById('set-list');
    setList.innerHTML = '';

    this.sets.forEach((set, index) => {
      const setItem = document.createElement('div');
      setItem.className = 'set-item';
      setItem.textContent = set.name;
      setItem.addEventListener('click', () => this.startSet(index));
      setList.appendChild(setItem);
    });
  }

  startSet(setIndex) {
    this.currentSet = this.sets[setIndex];
    this.currentCardIndex = 0;
    this.isFlipped = false;

    this.hideAllScreens();
    document.getElementById('card-screen').classList.add('active');

    document.getElementById('set-title').textContent = this.currentSet.name;
    document.getElementById('total-cards').textContent = this.currentSet.cards.length;

    this.showCard();
  }

  showCard() {
    const card = this.currentSet.cards[this.currentCardIndex];
    const cardContent = document.getElementById('card-content');

    // Reset flip state and show Japanese first
    this.isFlipped = false;
    cardContent.innerHTML = `<div>${card.japanese}</div>`;

    // Update progress
    document.getElementById('current-card').textContent = this.currentCardIndex + 1;

    // Update button states
    document.getElementById('prev-btn').disabled = this.currentCardIndex === 0;
    document.getElementById('next-btn').disabled = false;
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
      this.showCard();
    }
  }

  nextCard() {
    if (this.currentCardIndex < this.currentSet.cards.length - 1) {
      this.currentCardIndex++;
      this.showCard();
    } else {
      this.showComplete();
    }
  }

  showComplete() {
    this.hideAllScreens();
    document.getElementById('complete-screen').classList.add('active');
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
}

// アプリケーション開始
document.addEventListener('DOMContentLoaded', () => {
  new FlashcardApp();
});
