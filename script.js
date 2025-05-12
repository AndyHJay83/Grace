let wordList = [];
let totalWords = 0;

// Function to load the word list
async function loadWordList() {
    try {
        const response = await fetch('words/ENUK-Long words Noun.txt');
        const text = await response.text();
        wordList = text.split('\n').filter(word => word.trim() !== '');
        totalWords = wordList.length;
        updateWordCount(totalWords);
    } catch (error) {
        console.error('Error loading word list:', error);
    }
}

// Function to update word count display
function updateWordCount(count) {
    document.getElementById('wordCount').textContent = `Total words: ${count}`;
}

// Function to filter words
function filterWords(searchWord) {
    const searchChars = searchWord.toLowerCase().split('');
    const filteredWords = wordList.filter(word => {
        const firstThreeChars = word.toLowerCase().substring(0, 3);
        return searchChars.some(char => firstThreeChars.includes(char));
    });
    return filteredWords;
}

// Function to display results
function displayResults(words) {
    const resultsContainer = document.getElementById('resultsContainer');
    resultsContainer.innerHTML = '';
    
    words.forEach(word => {
        const wordElement = document.createElement('div');
        wordElement.className = 'word-item';
        wordElement.textContent = word.toUpperCase();
        resultsContainer.appendChild(wordElement);
    });
    
    updateWordCount(words.length);
}

// Function to reset the app
function resetApp() {
    document.getElementById('searchContainer').style.display = 'flex';
    document.getElementById('resultsContainer').innerHTML = '';
    document.getElementById('searchInput').value = '';
    updateWordCount(totalWords);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadWordList();
    
    document.getElementById('searchButton').addEventListener('click', () => {
        const searchWord = document.getElementById('searchInput').value.trim();
        if (searchWord) {
            const filteredWords = filterWords(searchWord);
            document.getElementById('searchContainer').style.display = 'none';
            displayResults(filteredWords);
        }
    });
    
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('searchButton').click();
        }
    });
    
    document.getElementById('resetButton').addEventListener('click', resetApp);
}); 