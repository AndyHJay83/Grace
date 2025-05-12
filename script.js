let wordList = [];
let totalWords = 0;
let isExpertMode = false;

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

// Function to filter words in standard mode
function filterWordsStandard(searchWord) {
    const searchChars = searchWord.toLowerCase().split('');
    const filteredWords = wordList.filter(word => {
        const firstThreeChars = word.toLowerCase().substring(0, 3);
        return searchChars.some(char => firstThreeChars.includes(char));
    });
    return filteredWords;
}

// Function to filter words in expert mode
function filterWordsExpert(inputs) {
    const filteredWords = wordList.filter(word => {
        const wordLower = word.toLowerCase();
        // Check each position that has input
        for (let i = 0; i < inputs.length; i++) {
            if (inputs[i]) {
                const inputChars = inputs[i].toLowerCase().split('');
                const wordChar = wordLower[i];
                // If the word's character at this position doesn't match any character in the input
                if (!inputChars.includes(wordChar)) {
                    return false;
                }
            }
        }
        return true;
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
    document.getElementById('expertInput1').value = '';
    document.getElementById('expertInput2').value = '';
    document.getElementById('expertInput3').value = '';
    updateWordCount(totalWords);
}

// Function to toggle between modes
function toggleMode() {
    isExpertMode = document.getElementById('modeToggle').checked;
    document.getElementById('standardMode').style.display = isExpertMode ? 'none' : 'flex';
    document.getElementById('expertMode').style.display = isExpertMode ? 'flex' : 'none';
    resetApp();
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadWordList();
    
    // Mode toggle listener
    document.getElementById('modeToggle').addEventListener('change', toggleMode);
    
    // Search button listener
    document.getElementById('searchButton').addEventListener('click', () => {
        if (isExpertMode) {
            const inputs = [
                document.getElementById('expertInput1').value.trim(),
                document.getElementById('expertInput2').value.trim(),
                document.getElementById('expertInput3').value.trim()
            ];
            
            // Only proceed if at least one input has a value
            if (inputs.some(input => input !== '')) {
                const filteredWords = filterWordsExpert(inputs);
                document.getElementById('searchContainer').style.display = 'none';
                displayResults(filteredWords);
            }
        } else {
            const searchWord = document.getElementById('searchInput').value.trim();
            if (searchWord) {
                const filteredWords = filterWordsStandard(searchWord);
                document.getElementById('searchContainer').style.display = 'none';
                displayResults(filteredWords);
            }
        }
    });
    
    // Enter key listeners for all inputs
    const handleEnter = (e) => {
        if (e.key === 'Enter') {
            document.getElementById('searchButton').click();
        }
    };
    
    document.getElementById('searchInput').addEventListener('keypress', handleEnter);
    document.getElementById('expertInput1').addEventListener('keypress', handleEnter);
    document.getElementById('expertInput2').addEventListener('keypress', handleEnter);
    document.getElementById('expertInput3').addEventListener('keypress', handleEnter);
    
    // Reset button listener
    document.getElementById('resetButton').addEventListener('click', resetApp);
}); 