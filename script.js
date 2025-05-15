let wordList = [];
let totalWords = 0;
let isNewMode = true;
let isLexiconMode = true;
let isVowelMode = true;
let isShapeMode = true;
let currentFilteredWords = [];
let currentPosition = -1;
let currentPosition2 = -1;
let currentVowelIndex = 0;
let uniqueVowels = [];
let currentFilteredWordsForVowels = [];
let originalFilteredWords = [];

// Letter shape categories with exact categorization
const letterShapes = {
    straight: new Set(['A', 'E', 'F', 'H', 'I', 'K', 'L', 'M', 'N', 'T', 'V', 'W', 'X', 'Y', 'Z']),
    curved: new Set(['B', 'C', 'D', 'G', 'J', 'O', 'P', 'Q', 'R', 'S', 'U'])
};

// Function to get letter shape
function getLetterShape(letter) {
    letter = letter.toUpperCase();
    if (letterShapes.straight.has(letter)) return 'straight';
    if (letterShapes.curved.has(letter)) return 'curved';
    return null;
}

// Function to analyze position shapes
function analyzePositionShapes(words, position) {
    const shapes = {
        straight: new Set(),
        curved: new Set()
    };
    
    let totalLetters = 0;
    
    words.forEach(word => {
        if (word.length > position) {
            const letter = word[position];
            const shape = getLetterShape(letter);
            if (shape) {
                shapes[shape].add(letter);
                totalLetters++;
            }
        }
    });
    
    const distribution = {
        straight: shapes.straight.size / totalLetters,
        curved: shapes.curved.size / totalLetters
    };
    
    return {
        shapes,
        distribution,
        totalLetters
    };
}

// Function to find position with least variance
function findLeastVariancePosition(words, startPos, endPos) {
    let maxVariance = -1;
    let result = -1;
    
    for (let pos = startPos; pos < endPos; pos++) {
        const analysis = analyzePositionShapes(words, pos);
        if (analysis.totalLetters < 10) continue;
        
        const values = Object.values(analysis.distribution);
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
        
        if (variance > maxVariance) {
            maxVariance = variance;
            result = pos;
        }
    }
    
    return result;
}

// Function to get shortest word length
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

// Function to update shape display
function updateShapeDisplay(words) {
    const shapeFeature = document.getElementById('shapeFeature');
    const shapeDisplay = shapeFeature.querySelector('.shape-display');
    
    if (!isShapeMode || words.length === 0) {
        shapeFeature.style.display = 'none';
        return;
    }

    const startPos = 0;
    const endPos = Math.min(7, getShortestWordLength(words));

    const position = findLeastVariancePosition(words, startPos, endPos);
    if (position === -1) {
        shapeFeature.style.display = 'none';
        return;
    }

    currentPosition = position;
    const analysis = analyzePositionShapes(words, position);
    const shapes = analysis.shapes;
    
    const positionDisplay = shapeDisplay.querySelector('.position-display');
    positionDisplay.textContent = `Position ${position + 1}`;
    
    const categoryButtons = shapeDisplay.querySelector('.category-buttons');
    categoryButtons.innerHTML = '';
    
    Object.entries(shapes).forEach(([category, letters]) => {
        if (letters.size > 0) {
            const button = document.createElement('button');
            button.className = 'category-button';
            const percentage = Math.round(analysis.distribution[category] * 100);
            button.textContent = `${category.toUpperCase()} (${percentage}%)`;
            button.addEventListener('click', () => {
                const filteredWords = filterWordsByShape(words, position, category);
                displayResults(filteredWords);
                expandWordList();
            });
            categoryButtons.appendChild(button);
        }
    });
    
    shapeFeature.style.display = 'block';
}

// Function to load word list
async function loadWordList() {
    try {
        console.log('Attempting to load word list...');
        const possiblePaths = [
            'words/ENUK-Long words Noun.txt',
            './words/ENUK-Long words Noun.txt',
            '../words/ENUK-Long words Noun.txt',
            'ENUK-Long words Noun.txt'
        ];

        let response = null;
        let successfulPath = null;

        for (const path of possiblePaths) {
            try {
                console.log(`Trying path: ${path}`);
                response = await fetch(path);
                if (response.ok) {
                    successfulPath = path;
                    break;
                }
            } catch (e) {
                console.log(`Failed to load from ${path}: ${e.message}`);
            }
        }

        if (!response || !response.ok) {
            throw new Error(`Could not load word list from any of the attempted paths`);
        }

        console.log(`Successfully loaded from: ${successfulPath}`);
        const text = await response.text();
        console.log('Raw text length:', text.length);
        
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
        displayResults(wordList);
        
    } catch (error) {
        console.error('Error loading word list:', error);
        document.getElementById('wordCount').textContent = 'Error loading words';
        
        const errorDetails = document.createElement('div');
        errorDetails.style.color = 'red';
        errorDetails.style.padding = '10px';
        errorDetails.textContent = `Error details: ${error.message}`;
        document.getElementById('wordCount').parentNode.appendChild(errorDetails);
    }
}

// Function to update word count
function updateWordCount(count) {
    const wordCountElement = document.getElementById('wordCount');
    if (wordCountElement) {
        wordCountElement.textContent = count;
    }
}

// Function to get consonants in order
function getConsonantsInOrder(str) {
    const vowels = new Set(['a', 'e', 'i', 'o', 'u']);
    const consonants = [];
    const word = str.toLowerCase();
    
    for (let i = 0; i < word.length; i++) {
        if (!vowels.has(word[i])) {
            consonants.push(word[i]);
        }
    }
    
    console.log('Consonants found in order:', consonants);
    return consonants;
}

// Function to check for consonants in sequence
function hasConsonantsInSequence(word, consonants) {
    const wordLower = word.toLowerCase();
    const sequence = consonants.join('');
    console.log(`Looking for sequence "${sequence}" in "${wordLower}"`);
    return wordLower.includes(sequence);
}

// Function to get unique vowels
function getUniqueVowels(str) {
    const vowels = new Set(['a', 'e', 'i', 'o', 'u']);
    const uniqueVowels = new Set();
    str.toLowerCase().split('').forEach(char => {
        if (vowels.has(char)) {
            uniqueVowels.add(char);
        }
    });
    const result = Array.from(uniqueVowels);
    console.log('Found unique vowels:', result);
    return result;
}

// Function to find least common vowel
function findLeastCommonVowel(words, vowels) {
    const vowelCounts = {};
    vowels.forEach(vowel => {
        vowelCounts[vowel] = 0;
    });

    words.forEach(word => {
        const wordLower = word.toLowerCase();
        vowels.forEach(vowel => {
            if (wordLower.includes(vowel)) {
                vowelCounts[vowel]++;
            }
        });
    });

    console.log('Vowel counts:', vowelCounts);

    let leastCommonVowel = vowels[0];
    let lowestCount = vowelCounts[vowels[0]];

    vowels.forEach(vowel => {
        if (vowelCounts[vowel] < lowestCount) {
            lowestCount = vowelCounts[vowel];
            leastCommonVowel = vowel;
        }
    });

    console.log('Selected least common vowel:', leastCommonVowel, 'with count:', lowestCount);
    return leastCommonVowel;
}

// Function to show next vowel
function showNextVowel() {
    const vowelFeature = document.getElementById('vowelFeature');
    const vowelLetter = vowelFeature.querySelector('.vowel-letter');
    
    if (uniqueVowels.length > 0) {
        const leastCommonVowel = findLeastCommonVowel(originalFilteredWords, uniqueVowels);
        vowelLetter.textContent = leastCommonVowel.toUpperCase();
        vowelFeature.style.display = 'block';
        console.log('Showing vowel:', leastCommonVowel);
        console.log('Current filtered words:', currentFilteredWordsForVowels.length);
    } else {
        vowelFeature.style.display = 'none';
        currentVowelIndex = 0;
        showNextFeature();
    }
}

// Function to show next feature
function showNextFeature() {
    // First check if LEXICON is enabled and not completed
    if (isLexiconMode && !document.getElementById('lexiconFeature').classList.contains('completed')) {
        document.getElementById('lexiconFeature').style.display = 'block';
        document.getElementById('position1Feature').style.display = 'none';
        document.getElementById('vowelFeature').style.display = 'none';
        document.getElementById('shapeFeature').style.display = 'none';
    }
    // Then check Position 1 if LEXICON is completed
    else if (document.getElementById('lexiconFeature').classList.contains('completed') && 
             !document.getElementById('position1Feature').classList.contains('completed')) {
        document.getElementById('lexiconFeature').style.display = 'none';
        document.getElementById('position1Feature').style.display = 'block';
        document.getElementById('vowelFeature').style.display = 'none';
        document.getElementById('shapeFeature').style.display = 'none';
    }
    // Then check VOWEL if Position 1 is completed
    else if (document.getElementById('position1Feature').classList.contains('completed') && 
             isVowelMode && 
             !document.getElementById('vowelFeature').classList.contains('completed')) {
        document.getElementById('lexiconFeature').style.display = 'none';
        document.getElementById('position1Feature').style.display = 'none';
        document.getElementById('vowelFeature').style.display = 'block';
        document.getElementById('shapeFeature').style.display = 'none';
    }
    // Finally check SHAPE if VOWEL is completed
    else if (document.getElementById('vowelFeature').classList.contains('completed') && 
             isShapeMode && 
             !document.getElementById('shapeFeature').classList.contains('completed')) {
        document.getElementById('lexiconFeature').style.display = 'none';
        document.getElementById('position1Feature').style.display = 'none';
        document.getElementById('vowelFeature').style.display = 'none';
        document.getElementById('shapeFeature').style.display = 'block';
    }
    // If all features are completed, expand the word list
    else {
        expandWordList();
    }
}

// Function to expand word list
function expandWordList() {
    const wordListContainer = document.getElementById('wordListContainer');
    wordListContainer.classList.add('expanded');
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
}

// Function to reset the app
function resetApp() {
    document.getElementById('wordListContainer').classList.remove('expanded');
    document.getElementById('resultsContainer').innerHTML = '';
    document.getElementById('lexiconPositions').value = '';
    document.getElementById('position1Input').value = '';
    
    const features = document.querySelectorAll('.feature-section');
    features.forEach(feature => {
        feature.style.display = 'none';
        feature.classList.remove('completed');
    });
    
    updateWordCount(totalWords);
    currentFilteredWords = [];
    currentPosition = -1;
    currentPosition2 = -1;
    uniqueVowels = [];
    
    displayResults(wordList);
    showNextFeature();
}

// Function to toggle mode
function toggleMode() {
    isNewMode = document.getElementById('modeToggle').checked;
    resetApp();
}

// Function to toggle features
function toggleFeature(featureId) {
    const feature = document.getElementById(featureId);
    const isEnabled = document.getElementById(featureId + 'Toggle').checked;
    
    if (isEnabled) {
        showNextFeature();
    } else {
        feature.style.display = 'none';
        feature.classList.add('completed');
        showNextFeature();
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', async () => {
    await loadWordList();
    
    // Mode toggle listener
    document.getElementById('modeToggle').addEventListener('change', toggleMode);
    
    // Feature toggle listeners
    document.getElementById('lexiconToggle').addEventListener('change', () => toggleFeature('lexiconFeature'));
    document.getElementById('vowelToggle').addEventListener('change', () => toggleFeature('vowelFeature'));
    document.getElementById('shapeToggle').addEventListener('change', () => toggleFeature('shapeFeature'));
    
    // LEXICON feature
    document.getElementById('lexiconFilterButton').addEventListener('click', () => {
        const positions = document.getElementById('lexiconPositions').value;
        if (positions) {
            const filteredWords = filterWordsByCurvedPositions(currentFilteredWords, positions);
            document.getElementById('lexiconFeature').classList.add('completed');
            displayResults(filteredWords);
            showNextFeature();
        }
    });
    
    // Position 1 feature
    document.getElementById('position1Button').addEventListener('click', () => {
        const input = document.getElementById('position1Input').value.trim();
        if (input) {
            const consonants = getConsonantsInOrder(input);
            if (consonants.length >= 2) {
                const filteredWords = currentFilteredWords.filter(word => 
                    hasConsonantsInSequence(word, consonants)
                );
                document.getElementById('position1Feature').classList.add('completed');
                displayResults(filteredWords);
                
                if (isVowelMode) {
                    currentFilteredWordsForVowels = [...filteredWords];
                    originalFilteredWords = [...filteredWords];
                    uniqueVowels = getUniqueVowels(input);
                    showNextVowel();
                } else {
                    showNextFeature();
                }
            }
        }
    });
    
    // Vowel feature
    document.querySelector('.yes-btn').addEventListener('click', () => handleVowelSelection(true));
    document.querySelector('.no-btn').addEventListener('click', () => handleVowelSelection(false));
    
    // Reset button
    document.getElementById('resetButton').addEventListener('click', resetApp);
    
    // Settings button
    document.getElementById('settingsButton').addEventListener('click', () => {
        document.getElementById('settingsModal').style.display = 'block';
    });
    
    // Close settings
    document.querySelector('.close-button').addEventListener('click', () => {
        document.getElementById('settingsModal').style.display = 'none';
    });
    
    // Close settings when clicking outside
    window.onclick = function(event) {
        const modal = document.getElementById('settingsModal');
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
    
    // Enter key handlers
    document.getElementById('lexiconPositions').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('lexiconFilterButton').click();
        }
    });
    
    document.getElementById('position1Input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('position1Button').click();
        }
    });
});

// Function to check if a letter is curved
function isCurvedLetter(letter) {
    if (!letter) return false;
    letter = letter.toUpperCase();
    return letterShapes.curved.has(letter);
}

// Function to filter words by curved letter positions
function filterWordsByCurvedPositions(words, positions) {
    // Convert positions string to array of numbers and validate
    const positionArray = positions.split('')
        .map(Number)
        .filter(pos => pos >= 1 && pos <= 5); // Only allow positions 1-5
    
    if (positionArray.length === 0) {
        console.log('No valid positions provided');
        return words;
    }
    
    return words.filter(word => {
        // Skip words shorter than the highest required position
        const maxPosition = Math.max(...positionArray);
        if (word.length < maxPosition) {
            return false;
        }
        
        // Check each position from 1 to 5
        for (let i = 0; i < 5; i++) {
            const pos = i + 1; // Convert to 1-based position
            const letter = word[i];
            
            // Skip if we've reached the end of the word
            if (!letter) {
                continue;
            }
            
            if (positionArray.includes(pos)) {
                // This position should have a curved letter
                if (!isCurvedLetter(letter)) {
                    return false;
                }
            } else {
                // This position should have a straight letter
                if (isCurvedLetter(letter)) {
                    return false;
                }
            }
        }
        
        return true;
    });
} 