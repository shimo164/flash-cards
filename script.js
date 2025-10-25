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
        const setFiles = ['pens.json', 'weather.json'];
        
        for (const file of setFiles) {
            try {
                const response = await fetch(file);
                const setData = await response.json();
                this.sets.push(setData);
            } catch (error) {
                console.error(`Failed to load ${file}:`, error);
            }
        }
    }
    
    setupEventListeners() {
        document.getElementById('flashcard').addEventListener('click', () => this.flipCard());
        document.getElementById('prev-btn').addEventListener('click', () => this.previousCard());
        document.getElementById('next-btn').addEventListener('click', () => this.nextCard());
        document.getElementById('back-to-menu').addEventListener('click', () => this.showMenu());
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
        const cardElement = document.getElementById('flashcard');
        const cardContent = document.getElementById('card-content');
        
        // Reset flip state
        this.isFlipped = false;
        cardElement.classList.remove('flipped');
        
        // Show English (front)
        cardContent.innerHTML = `<div>${card.english}</div>`;
        
        // Update progress
        document.getElementById('current-card').textContent = this.currentCardIndex + 1;
        
        // Update button states
        document.getElementById('prev-btn').disabled = this.currentCardIndex === 0;
        document.getElementById('next-btn').disabled = false;
    }
    
    flipCard() {
        const card = this.currentSet.cards[this.currentCardIndex];
        const cardElement = document.getElementById('flashcard');
        const cardContent = document.getElementById('card-content');
        
        this.isFlipped = !this.isFlipped;
        
        if (this.isFlipped) {
            cardElement.classList.add('flipped');
            setTimeout(() => {
                cardContent.innerHTML = `<div>${card.japanese}</div>`;
            }, 300);
        } else {
            cardElement.classList.remove('flipped');
            setTimeout(() => {
                cardContent.innerHTML = `<div>${card.english}</div>`;
            }, 300);
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
    
    hideAllScreens() {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
    }
}

// アプリケーション開始
document.addEventListener('DOMContentLoaded', () => {
    new FlashcardApp();
});
