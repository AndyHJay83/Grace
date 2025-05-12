let wordList = [];
let totalWords = 0;
let isExpertMode = false;
let isShapeMode = false;
let currentFilteredWords = [];
let currentPosition = -1;

// Letter shape categories
const letterShapes = {
    straight: new Set(['A', 'E', 'F', 'H', 'I', 'K', 'L', 'M', 'N', 'T', 'V', 'W', 'X', 'Y', 'Z', 'É', 'À', 'Â', 'Ã', 'Á', 'Ä', 'Å', 'Ă', 'Î', 'Ț', 'Ê', 'Ŵ', 'Ŷ', 'Ï', 'Í', 'È', 'Æ', 'Ë', 'Ÿ', 'Ẽ', 'Ĩ', 'Ỹ', 'Ñ']),
    mixed: new Set(['B', 'D', 'G', 'J', 'P', 'Q', 'R', 'U', 'Ú', 'Ü', 'ß', 'Û', 'Œ', 'Ù', 'Ũ', 'G̃', 'Ø']),
    curved: new Set(['C', 'O', 'S', 'G', 'O', 'Q', 'S', 'U', 'Ç', 'Ö', 'Õ', 'Ș', 'Ô', 'Ó', 'Ò', 'Ş'])
};

// Function to get letter shape
function getLetterShape(letter) {
    letter = letter.toUpperCase();
    if (letterShapes.straight.has(letter)) return 'straight';
    if (letterShapes.mixed.has(letter)) return 'mixed';
    if (letterShapes.curved.has(letter)) return 'curved';
    return null;
}

// Function to analyze position shapes
function analyzePositionShapes(words, position) {
    const shapes = {
        straight: new Set(),
        mixed: new Set(),
        curved: new Set()
    };
    
    words.forEach(word => {
        if (word.length > position) {
            const letter = word[position];
            const shape = getLetterShape(letter);
            if (shape) {
                shapes[shape].add(letter);
            }
        }
    });
    
    return shapes;
}

// Function to find position with least variance
function findLeastVariancePosition(words) {
    let minVariance = Infinity;
    let result = -1;
    
    for (let pos = 0; pos < 3; pos++) {
        const shapes = analyzePositionShapes(words, pos);
        const totalShapes = Object.values(shapes).reduce((a, b) => a + b.size, 0);
        
        if (totalShapes > 0 && totalShapes < minVariance) {
            minVariance = totalShapes;
            result = pos;
        }
    }
    
    return result;
}

// Function to filter words by shape category
function filterWordsByShape(words, position, category) {
    return words.filter(word => {
        if (word.length <= position) return false;
        const letter = word[position];
        return getLetterShape(letter) === category;
    });
}

// Function to update LEXICON display
function updateLexiconDisplay(words) {
    const lexiconDisplay = document.getElementById('lexiconDisplay');
    
    if (!isShapeMode || words.length === 0) {
        lexiconDisplay.style.display = 'none';
        return;
    }

    const position = findLeastVariancePosition(words);
    if (position === -1) {
        lexiconDisplay.style.display = 'none';
        return;
    }

    currentPosition = position;
    const shapes = analyzePositionShapes(words, position);
    
    // Update position display
    const positionDisplay = document.querySelector('.position-display');
    positionDisplay.textContent = `Position ${position + 1}`;
    
    // Update category buttons
    const categoryButtons = document.querySelector('.category-buttons');
    categoryButtons.innerHTML = '';
    
    Object.entries(shapes).forEach(([category, letters]) => {
        if (letters.size > 0) {
            const button = document.createElement('button');
            button.className = 'category-button';
            button.textContent = category.toUpperCase();
            button.addEventListener('click', () => {
                const filteredWords = filterWordsByShape(currentFilteredWords, currentPosition, category);
                displayResults(filteredWords);
            });
            categoryButtons.appendChild(button);
        }
    });
    
    // Show the LEXICON display
    lexiconDisplay.style.display = 'block';
}

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
        for (let i = 0; i < inputs.length; i++) {
            if (inputs[i]) {
                const inputChars = inputs[i].toLowerCase().split('');
                const wordChar = wordLower[i];
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
    currentFilteredWords = words;
    const resultsContainer = document.getElementById('resultsContainer');
    resultsContainer.innerHTML = '';
    
    words.forEach(word => {
        const wordElement = document.createElement('div');
        wordElement.className = 'word-item';
        wordElement.textContent = word.toUpperCase();
        resultsContainer.appendChild(wordElement);
    });
    
    updateWordCount(words.length);
    updateLexiconDisplay(words);
}

// Function to reset the app
function resetApp() {
    document.getElementById('searchContainer').style.display = 'flex';
    document.getElementById('resultsContainer').innerHTML = '';
    document.getElementById('searchInput').value = '';
    document.getElementById('expertInput1').value = '';
    document.getElementById('expertInput2').value = '';
    document.getElementById('expertInput3').value = '';
    document.getElementById('lexiconDisplay').style.display = 'none';
    updateWordCount(totalWords);
    currentFilteredWords = [];
    currentPosition = -1;
}

// Function to toggle between modes
function toggleMode() {
    isExpertMode = document.getElementById('modeToggle').checked;
    document.getElementById('standardMode').style.display = isExpertMode ? 'none' : 'flex';
    document.getElementById('expertMode').style.display = isExpertMode ? 'flex' : 'none';
    resetApp();
}

// Function to toggle shape mode
function toggleShapeMode() {
    isShapeMode = document.getElementById('shapeToggle').checked;
    if (currentFilteredWords.length > 0) {
        displayResults(currentFilteredWords);
    } else {
        document.getElementById('lexiconDisplay').style.display = 'none';
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadWordList();
    
    // Mode toggle listener
    document.getElementById('modeToggle').addEventListener('change', toggleMode);
    
    // Shape toggle listener
    document.getElementById('shapeToggle').addEventListener('change', toggleShapeMode);
    
    // Search button listener
    document.getElementById('searchButton').addEventListener('click', () => {
        if (isExpertMode) {
            const inputs = [
                document.getElementById('expertInput1').value.trim(),
                document.getElementById('expertInput2').value.trim(),
                document.getElementById('expertInput3').value.trim()
            ];
            
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