let wordList = [];
let totalWords = 0;
let isExpertMode = true;
let isShapeMode = true;
let currentFilteredWords = [];
let currentPosition = -1;
let currentPosition2 = -1;
let isVowelMode = true;
let currentVowelIndex = 0;
let uniqueVowels = [];
let currentFilteredWordsForVowels = [];
let originalFilteredWords = [];

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

// Function to analyze position shapes with improved variance calculation
function analyzePositionShapes(words, position) {
    const shapes = {
        straight: new Set(),
        mixed: new Set(),
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
    
    // Calculate shape distribution
    const distribution = {
        straight: shapes.straight.size / totalLetters,
        mixed: shapes.mixed.size / totalLetters,
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
        
        // Skip positions with too few letters
        if (analysis.totalLetters < 10) continue;
        
        // Calculate variance in distribution
        const values = Object.values(analysis.distribution);
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
        
        // We want positions with high variance (more distinct distribution)
        if (variance > maxVariance) {
            maxVariance = variance;
            result = pos;
        }
    }
    
    return result;
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
        return;
    }

    // For second lexicon, only analyze positions 4-7 up to shortest word length
    const startPos = isSecondLexicon ? 3 : 0;
    const endPos = isSecondLexicon ? Math.min(7, getShortestWordLength(words)) : 3;

    const position = findLeastVariancePosition(words, startPos, endPos);
    if (position === -1) {
        lexiconDisplay.style.display = 'none';
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
            const percentage = Math.round(analysis.distribution[category] * 100);
            button.textContent = `${category.toUpperCase()} (${percentage}%)`;
            button.addEventListener('click', () => {
                const filteredWords = filterWordsByShape(
                    isSecondLexicon ? currentFilteredWords : words,
                    isSecondLexicon ? currentPosition2 : currentPosition,
                    category
                );
                if (isSecondLexicon) {
                    displayResults(filteredWords);
                } else {
                    currentFilteredWords = filteredWords;
                    displayResults(filteredWords);
                    // Instead of showing second lexicon, update the first one with second lexicon data
                    updateLexiconDisplay(filteredWords, true);
                }
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
        // Try different possible paths for the word list
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

// Function to get consonants from a string
function getConsonants(str) {
    const vowels = new Set(['a', 'e', 'i', 'o', 'u']);
    return str.toLowerCase().split('').filter(char => !vowels.has(char));
}

// Function to find next consonant after a position
function findNextConsonant(word, startPos) {
    const vowels = new Set(['a', 'e', 'i', 'o', 'u']);
    for (let i = startPos + 1; i < word.length; i++) {
        if (!vowels.has(word[i].toLowerCase())) {
            return i;
        }
    }
    return -1; // No consonant found
}

// Function to filter words in expert mode
function filterWordsExpert(inputs) {
    let filteredWords = wordList;

    // Position 1: Check for consonants anywhere in the word except first and last positions
    if (inputs[0]) {
        const inputConsonants = getConsonants(inputs[0]);
        filteredWords = filteredWords.filter(word => {
            const wordLength = word.length;
            if (wordLength < 5) return false; // Word must be at least 5 chars long
            
            // Get consonants from the word excluding first and last positions
            const middleWord = word.slice(1, -1);
            const wordConsonants = getConsonants(middleWord);
            
            // Count how many input consonants are found in the middle section
            const matches = inputConsonants.filter(consonant => 
                wordConsonants.includes(consonant)
            );
            
            // Return true if at least 2 consonants match
            return matches.length >= 2;
        });
    }

    // Position 2: Currently ignored
    // if (inputs[1]) {
    //     const inputConsonants = getConsonants(inputs[1]);
    //     filteredWords = filteredWords.filter(word => {
    //         // Position 2 logic here
    //     });
    // }

    // Position 3: Currently ignored
    // if (inputs[2]) {
    //     const inputConsonants = getConsonants(inputs[2]);
    //     filteredWords = filteredWords.filter(word => {
    //         // Position 3 logic here
    //     });
    // }

    return filteredWords;
}

// Function to get unique vowels from a string
function getUniqueVowels(str) {
    const vowels = new Set(['a', 'e', 'i', 'o', 'u']);
    const uniqueVowels = new Set();
    str.toLowerCase().split('').forEach(char => {
        if (vowels.has(char)) {
            uniqueVowels.add(char);
        }
    });
    return Array.from(uniqueVowels);
}

// Function to find the least common vowel in the word list
function findLeastCommonVowel(words, vowels) {
    const vowelCounts = {};
    vowels.forEach(vowel => {
        vowelCounts[vowel] = 0;
    });

    // Count occurrences of each vowel in the word list
    words.forEach(word => {
        const wordLower = word.toLowerCase();
        vowels.forEach(vowel => {
            if (wordLower.includes(vowel)) {
                vowelCounts[vowel]++;
            }
        });
    });

    // Find the vowel with the lowest count
    let leastCommonVowel = vowels[0];
    let lowestCount = vowelCounts[vowels[0]];

    vowels.forEach(vowel => {
        if (vowelCounts[vowel] < lowestCount) {
            lowestCount = vowelCounts[vowel];
            leastCommonVowel = vowel;
        }
    });

    return leastCommonVowel;
}

// Function to show next vowel
function showNextVowel() {
    const vowelDisplay = document.getElementById('vowelDisplay');
    const vowelLetter = vowelDisplay.querySelector('.vowel-letter');
    
    if (uniqueVowels.length > 0) {
        // Find the least common vowel in the original filtered word list
        const leastCommonVowel = findLeastCommonVowel(originalFilteredWords, uniqueVowels);
        vowelLetter.textContent = leastCommonVowel.toUpperCase();
        vowelDisplay.style.display = 'block';
    } else {
        vowelDisplay.style.display = 'none';
        currentVowelIndex = 0;
    }
}

// Function to handle vowel selection
function handleVowelSelection(includeVowel) {
    const currentVowel = uniqueVowels[currentVowelIndex];
    if (includeVowel) {
        // Filter to only include words with the vowel
        currentFilteredWordsForVowels = currentFilteredWordsForVowels.filter(word => 
            word.toLowerCase().includes(currentVowel)
        );
    } else {
        // Filter to exclude words with the vowel
        currentFilteredWordsForVowels = currentFilteredWordsForVowels.filter(word => 
            !word.toLowerCase().includes(currentVowel)
        );
    }
    
    // Remove the processed vowel from uniqueVowels array
    uniqueVowels = uniqueVowels.filter(v => v !== currentVowel);
    
    displayResults(currentFilteredWordsForVowels);
    showNextVowel();
}

// Function to toggle vowel mode
function toggleVowelMode() {
    isVowelMode = document.getElementById('vowelToggle').checked;
    const vowelDisplay = document.getElementById('vowelDisplay');
    
    if (isVowelMode && currentFilteredWords.length > 0) {
        currentFilteredWordsForVowels = [...currentFilteredWords];
        originalFilteredWords = [...currentFilteredWords]; // Store original filtered words
        uniqueVowels = getUniqueVowels(document.getElementById('expertInput1').value);
        currentVowelIndex = 0;
        showNextVowel();
    } else {
        vowelDisplay.style.display = 'none';
        currentVowelIndex = 0;
        uniqueVowels = []; // Clear unique vowels when toggling off
        originalFilteredWords = []; // Clear original filtered words
    }
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
    
    // If in vowel mode, update the filtered words for vowel processing
    if (isVowelMode) {
        currentFilteredWordsForVowels = [...words];
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
        }, { passive: false });

        // Touch end handler
        input.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, { passive: false });

        // Click handler
        input.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, { passive: false });
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
    const interactiveElements = document.querySelectorAll('button, input, select');
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
                
                // Show vowel selection UI if vowel mode is on
                if (isVowelMode) {
                    currentFilteredWordsForVowels = [...filteredWords];
                    uniqueVowels = getUniqueVowels(inputs[0]);
                    currentVowelIndex = 0;
                    showNextVowel();
                }
            }
        } else {
            const searchWord = document.getElementById('searchInput').value.trim();
            if (searchWord) {
                const filteredWords = filterWordsStandard(searchWord);
                document.getElementById('searchContainer').style.display = 'none';
                displayResults(filteredWords);
                
                // Show vowel selection UI if vowel mode is on
                if (isVowelMode) {
                    currentFilteredWordsForVowels = [...filteredWords];
                    uniqueVowels = getUniqueVowels(searchWord);
                    currentVowelIndex = 0;
                    showNextVowel();
                }
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

    // Add vowel toggle listener
    document.getElementById('vowelToggle').addEventListener('change', toggleVowelMode);
    
    // Add vowel button listeners
    document.querySelector('.yes-btn').addEventListener('click', () => handleVowelSelection(true));
    document.querySelector('.no-btn').addEventListener('click', () => handleVowelSelection(false));
}); 