let wordList = [];
let totalWords = 0;
let isExpertMode = false;
let isShapeMode = false;
let currentFilteredWords = [];
let currentPosition = -1;
let currentPosition2 = -1;

// Letter shape categories with more comprehensive letter sets
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

// Function to analyze position shapes with improved distribution analysis
function analyzePositionShapes(words, position) {
    const shapes = {
        straight: new Set(),
        mixed: new Set(),
        curved: new Set()
    };
    
    let totalLetters = 0;
    const shapeCounts = {
        straight: 0,
        mixed: 0,
        curved: 0
    };
    
    words.forEach(word => {
        if (word.length > position) {
            const letter = word[position];
            const shape = getLetterShape(letter);
            if (shape) {
                shapes[shape].add(letter);
                shapeCounts[shape]++;
                totalLetters++;
            }
        }
    });
    
    // Calculate shape distribution
    const distribution = {
        straight: shapeCounts.straight / totalLetters,
        mixed: shapeCounts.mixed / totalLetters,
        curved: shapeCounts.curved / totalLetters
    };
    
    // Calculate how uneven the distribution is
    const values = Object.values(distribution);
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);
    const distributionSpread = maxValue - minValue;
    
    // Calculate the potential for filtering
    // We want positions where at least one category has very few words
    const minCount = Math.min(...Object.values(shapeCounts));
    const maxCount = Math.max(...Object.values(shapeCounts));
    const filteringPotential = minCount / maxCount; // Lower is better (more filtering potential)
    
    return {
        shapes,
        distribution,
        totalLetters,
        shapeCounts,
        distributionSpread,
        filteringPotential
    };
}

// Function to find position with most filtering potential
function findLeastVariancePosition(words, startPos, endPos) {
    let bestPosition = -1;
    let bestFilteringPotential = 1; // Start with worst case
    let bestDistributionSpread = 0;
    
    for (let pos = startPos; pos < endPos; pos++) {
        const analysis = analyzePositionShapes(words, pos);
        
        // Skip positions with too few letters
        if (analysis.totalLetters < 10) continue;
        
        // We want positions that have:
        // 1. A large spread in the distribution (uneven distribution)
        // 2. A low filtering potential (at least one category has few words)
        const combinedScore = analysis.distributionSpread * (1 - analysis.filteringPotential);
        
        if (combinedScore > bestDistributionSpread) {
            bestDistributionSpread = combinedScore;
            bestFilteringPotential = analysis.filteringPotential;
            bestPosition = pos;
        }
    }
    
    // Log the analysis for debugging
    if (bestPosition !== -1) {
        const bestAnalysis = analyzePositionShapes(words, bestPosition);
        console.log('Selected position:', bestPosition + 1);
        console.log('Shape counts:', bestAnalysis.shapeCounts);
        console.log('Distribution:', bestAnalysis.distribution);
        console.log('Filtering potential:', bestAnalysis.filteringPotential);
    }
    
    return bestPosition;
}

// Function to get shortest word length in list
function getShortestWordLength(words) {
    return Math.min(...words.map(word => word.length));
}

// Function to filter words by shape category
function filterWordsByShape(words, position, category) {
    return words.filter(word => {
        if (word.length <= position) return false;
        const letter = word[position];
        return getLetterShape(letter) === category;
    });
}

// Function to update LEXICON display with improved analysis
function updateLexiconDisplay(words, isSecondLexicon = false) {
    const lexiconDisplay = document.getElementById('lexiconDisplay');
    
    if (!isShapeMode || words.length === 0) {
        lexiconDisplay.style.display = 'none';
        lexiconDisplay.classList.remove('visible');
        return;
    }

    // For second lexicon, only analyze positions 4-7 up to shortest word length
    const startPos = isSecondLexicon ? 3 : 0;
    const endPos = isSecondLexicon ? Math.min(7, getShortestWordLength(words)) : 3;

    const position = findLeastVariancePosition(words, startPos, endPos);
    if (position === -1) {
        lexiconDisplay.style.display = 'none';
        lexiconDisplay.classList.remove('visible');
        return;
    }

    if (isSecondLexicon) {
        currentPosition2 = position;
    } else {
        currentPosition = position;
    }

    const analysis = analyzePositionShapes(words, position);
    const shapes = analysis.shapes;
    
    // Update position display with distribution information
    const positionDisplay = lexiconDisplay.querySelector('.position-display');
    positionDisplay.textContent = `Position ${position + 1}`;
    
    // Update category buttons with letter counts
    const categoryButtons = lexiconDisplay.querySelector('.category-buttons');
    categoryButtons.innerHTML = '';
    
    Object.entries(shapes).forEach(([category, letters]) => {
        if (letters.size > 0) {
            const button = document.createElement('button');
            button.className = 'category-button';
            const count = analysis.shapeCounts[category];
            button.textContent = `${category.toUpperCase()} (${count})`;
            button.addEventListener('click', () => {
                const filteredWords = filterWordsByShape(
                    isSecondLexicon ? currentFilteredWords : words,
                    isSecondLexicon ? currentPosition2 : currentPosition,
                    category
                );
                currentFilteredWords = filteredWords;
                displayResults(filteredWords);
            });
            categoryButtons.appendChild(button);
        }
    });
    
    // Show the LEXICON display
    lexiconDisplay.style.display = 'block';
    lexiconDisplay.classList.add('visible');
}

// Function to load the word list
async function loadWordList() {
    try {
        console.log('Attempting to load word list...');
        const response = await fetch('./words/ENUK-Long words Noun.txt');
        console.log('Fetch response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const text = await response.text();
        console.log('Raw text length:', text.length);
        
        // Split by newlines and filter out empty lines
        wordList = text.split('\n')
            .map(word => word.trim())
            .filter(word => word !== '');
            
        console.log('Processed word list length:', wordList.length);
        
        if (wordList.length === 0) {
            throw new Error('No words found in the file');
        }
        
        totalWords = wordList.length;
        console.log(`Successfully loaded ${totalWords} words`);
        updateWordCount(totalWords);
        
        // Log first few words for debugging
        console.log('First few words:', wordList.slice(0, 5));
        
    } catch (error) {
        console.error('Error loading word list:', error);
        document.getElementById('wordCount').textContent = 'Error loading words';
        
        // Show more detailed error information
        const errorDetails = document.createElement('div');
        errorDetails.style.color = 'red';
        errorDetails.style.padding = '10px';
        errorDetails.textContent = `Error details: ${error.message}`;
        document.getElementById('wordCount').parentNode.appendChild(errorDetails);
    }
}

// Function to update word count display
function updateWordCount(count) {
    const wordCountElement = document.getElementById('wordCount');
    if (wordCountElement) {
        wordCountElement.textContent = count;
        console.log('Updated word count to:', count);
    } else {
        console.error('Word count element not found');
    }
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
    
    // Always update lexicon display if shape mode is enabled
    if (isShapeMode && words.length > 0) {
        updateLexiconDisplay(words);
    }
}

// Function to reset the app
function resetApp() {
    document.getElementById('searchContainer').style.display = 'flex';
    document.getElementById('resultsContainer').innerHTML = '';
    document.getElementById('searchInput').value = '';
    document.getElementById('expertInput1').value = '';
    document.getElementById('expertInput2').value = '';
    document.getElementById('expertInput3').value = '';
    const lexiconDisplay = document.getElementById('lexiconDisplay');
    lexiconDisplay.style.display = 'none';
    lexiconDisplay.classList.remove('visible');
    updateWordCount(totalWords);
    currentFilteredWords = [];
    currentPosition = -1;
    currentPosition2 = -1;
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
    const lexiconDisplay = document.getElementById('lexiconDisplay');
    
    if (isShapeMode && currentFilteredWords.length > 0) {
        displayResults(currentFilteredWords);
    } else {
        lexiconDisplay.style.display = 'none';
        lexiconDisplay.classList.remove('visible');
    }
}

// Position configuration
document.getElementById('position1').addEventListener('change', updatePositionLabels);
document.getElementById('position2').addEventListener('change', updatePositionLabels);
document.getElementById('position3').addEventListener('change', updatePositionLabels);

function updatePositionLabels() {
    const pos1 = document.getElementById('position1').value;
    const pos2 = document.getElementById('position2').value;
    const pos3 = document.getElementById('position3').value;

    document.getElementById('position1Label').textContent = pos1;
    document.getElementById('position2Label').textContent = pos2;
    document.getElementById('position3Label').textContent = pos3;

    // Update input placeholders
    document.getElementById('expertInput1').placeholder = `${getOrdinal(pos1)} position...`;
    document.getElementById('expertInput2').placeholder = `${getOrdinal(pos2)} position...`;
    document.getElementById('expertInput3').placeholder = `${getOrdinal(pos3)} position...`;
}

function getOrdinal(n) {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// Update the filterWords function to use the selected positions
function filterWords() {
    const isExpertMode = document.getElementById('modeToggle').checked;
    const isShapeMode = document.getElementById('shapeToggle').checked;
    let filteredWords = [];

    if (isExpertMode) {
        const pos1 = parseInt(document.getElementById('position1').value);
        const pos2 = parseInt(document.getElementById('position2').value);
        const pos3 = parseInt(document.getElementById('position3').value);
        const input1 = document.getElementById('expertInput1').value.toLowerCase();
        const input2 = document.getElementById('expertInput2').value.toLowerCase();
        const input3 = document.getElementById('expertInput3').value.toLowerCase();

        filteredWords = wordList.filter(word => {
            const wordLower = word.toLowerCase();
            // Check if word is long enough for all positions
            if (wordLower.length < Math.max(pos1, pos2, pos3)) {
                return false;
            }
            // Check each position match
            const match1 = !input1 || wordLower[pos1 - 1] === input1;
            const match2 = !input2 || wordLower[pos2 - 1] === input2;
            const match3 = !input3 || wordLower[pos3 - 1] === input3;
            return match1 && match2 && match3;
        });
    } else {
        const searchInput = document.getElementById('searchInput').value.toLowerCase();
        filteredWords = wordList.filter(word => 
            word.toLowerCase().includes(searchInput)
        );
    }

    currentFilteredWords = filteredWords;
    displayResults(filteredWords);
}

// Function to handle input focus
function handleInputFocus(input) {
    if (window.navigator.standalone) {
        // Only show custom keyboard in standalone mode
        showCustomKeyboard(input.id);
    }
}

// Function to show custom keyboard
function showCustomKeyboard(inputId) {
    const input = document.getElementById(inputId);
    activeInput = input;
    document.getElementById('keyboardTitle').textContent = input.placeholder;
    document.getElementById('customKeyboard').style.display = 'block';
}

// Function to hide custom keyboard
function hideCustomKeyboard() {
    document.getElementById('customKeyboard').style.display = 'none';
    activeInput = null;
}

// Function to handle key press
function handleKeyPress(key) {
    if (!activeInput) return;

    if (key.classList.contains('backspace')) {
        activeInput.value = activeInput.value.slice(0, -1);
    } else if (key.classList.contains('space')) {
        activeInput.value += ' ';
    } else if (key.classList.contains('done')) {
        hideCustomKeyboard();
    } else {
        activeInput.value += key.textContent;
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', async () => {
    // Load word list first
    await loadWordList();
    
    // Add touch handlers for all inputs
    const inputs = document.querySelectorAll('input[type="text"]');
    inputs.forEach(input => {
        // Touch start handler
        input.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            handleInputFocus(input);
        }, { passive: false });

        // Touch end handler
        input.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
            handleInputFocus(input);
        }, { passive: false });

        // Click handler
        input.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            handleInputFocus(input);
        }, { passive: false });

        // Focus handler
        input.addEventListener('focus', () => {
            handleInputFocus(input);
        });
    });

    // Add touch handlers for buttons
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        button.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            button.click();
        }, { passive: false });
    });

    // Add touch handlers for position selects
    const selects = document.querySelectorAll('select');
    selects.forEach(select => {
        select.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            select.click();
        }, { passive: false });
    });

    // Prevent double-tap zoom on interactive elements
    const interactiveElements = document.querySelectorAll('button, input, select, .key');
    interactiveElements.forEach(element => {
        element.addEventListener('touchend', (e) => {
            e.preventDefault();
        }, { passive: false });
    });

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

    // Add keyboard key handlers
    document.querySelectorAll('.keyboard-keys .key').forEach(key => {
        key.addEventListener('click', () => handleKeyPress(key));
        key.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleKeyPress(key);
        }, { passive: false });
    });
}); 