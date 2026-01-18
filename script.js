// Heartopia keybind mapping
const KEYBINDS = {
    // Top row (higher octave)
    top: {
        'C': 'Q', 'D': 'W', 'E': 'E', 'F': 'R', 'G': 'T', 'A': 'Y', 'B': 'U',
        'C#': '2', 'D#': '3', 'F#': '5', 'G#': '6', 'A#': '7'
    },
    // Middle row (default)
    middle: {
        'C': 'Z', 'D': 'X', 'E': 'C', 'F': 'V', 'G': 'B', 'A': 'N', 'B': 'M',
        'C#': 'S', 'D#': 'D', 'F#': 'G', 'G#': 'H', 'A#': 'J'
    },
    // Bottom row (lower octave)
    bottom: {
        'C': ',', 'D': '.', 'E': '/', 'F': 'O', 'G': 'P', 'A': '[', 'B': ']',
        'C#': 'L', 'D#': ';', 'F#': '0', 'G#': '-', 'A#': '='
    }
};

// Solfege to letter note mapping
const SOLFEGE_MAP = {
    'DO': 'C', 'RE': 'D', 'MI': 'E', 'FA': 'F',
    'SOL': 'G', 'LA': 'A', 'SI': 'B'
};

// Flat to sharp equivalents
const FLAT_TO_SHARP = {
    'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#'
};

function normalizeSolfege(token) {
    const upper = token.toUpperCase();
    for (let solfege in SOLFEGE_MAP) {
        if (upper === solfege) {
            return SOLFEGE_MAP[solfege];
        }
    }
    return null;
}

function parseNote(token) {
    // Remove parentheses
    token = token.replace(/[()]/g, '');
    
    if (!token) return null;

    let octave = 'middle';
    let noteStr = token;

    // Check for octave markers
    if (token.startsWith('^')) {
        octave = 'top';
        noteStr = token.substring(1);
    } else if (token.startsWith('.')) {
        octave = 'bottom';
        noteStr = token.substring(1);
    }

    // Remove trailing punctuation (but not # or b)
    noteStr = noteStr.replace(/[,;:!?]+$/g, '');

    if (!noteStr) return null;

    // Try solfege first
    let note = normalizeSolfege(noteStr);
    
    if (!note) {
        // Try letter note
        const noteMatch = noteStr.match(/^([A-Ga-g])([#b]?)$/);
        if (noteMatch) {
            note = noteMatch[1].toUpperCase();
            const accidental = noteMatch[2];

            // Handle flats
            if (accidental === 'b') {
                const flatKey = note + 'b';
                if (FLAT_TO_SHARP[flatKey]) {
                    note = FLAT_TO_SHARP[flatKey];
                }
            } else if (accidental === '#') {
                note = note + '#';
            }
        } else {
            return null;
        }
    }

    return { note, octave };
}

function getKeybind(parsedNote) {
    if (!parsedNote) return null;
    const { note, octave } = parsedNote;
    return KEYBINDS[octave][note] || null;
}

function getSolfegeName(parsedNote) {
    if (!parsedNote) return null;
    const { note, octave } = parsedNote;
    
    // Reverse lookup for solfege
    let baseName = '';
    for (let solfege in SOLFEGE_MAP) {
        if (SOLFEGE_MAP[solfege] === note.replace('#', '')) {
            baseName = solfege;
            break;
        }
    }
    
    if (!baseName) return null;
    
    let result = baseName;
    if (note.includes('#')) result += '#';
    if (octave === 'top') result = '^' + result;
    if (octave === 'bottom') result = '.' + result;
    
    return result;
}

function isNoteLine(line) {
    // Check if line contains valid note tokens
    const tokens = line.split(/[\s-]+/);
    for (let token of tokens) {
        token = token.trim();
        if (!token) continue;
        
        // Remove parentheses for checking
        token = token.replace(/[()]/g, '');
        
        // Remove octave markers
        if (token.startsWith('^') || token.startsWith('.')) {
            token = token.substring(1);
        }
        
        // Remove trailing punctuation
        token = token.replace(/[,;:!?]+$/g, '');
        
        if (!token) continue;
        
        // Check if it's a solfege note
        if (normalizeSolfege(token)) return true;
        
        // Check if it's a letter note
        if (/^[A-Ga-g][#b]?$/.test(token)) return true;
    }
    return false;
}

function translateLine(line) {
    // Split by spaces but preserve hyphen groups
    const parts = line.split(/\s+/);
    const translatedParts = [];

    for (let part of parts) {
        if (!part.trim()) continue;

        // Check if this part contains hyphens
        if (part.includes('-')) {
            const subTokens = part.split('-');
            const translatedSubTokens = [];
            
            for (let subToken of subTokens) {
                subToken = subToken.trim();
                if (!subToken) {
                    translatedSubTokens.push('');
                    continue;
                }
                
                const parsed = parseNote(subToken);
                const keybind = getKeybind(parsed);
                translatedSubTokens.push(keybind || subToken);
            }
            
            translatedParts.push(translatedSubTokens.join('-'));
        } else {
            const parsed = parseNote(part);
            const keybind = getKeybind(parsed);
            translatedParts.push(keybind || part);
        }
    }

    return translatedParts.join(' ');
}

function translateLineWithSolfege(line) {
    const parts = line.split(/\s+/);
    const solfegeParts = [];
    const keybindParts = [];

    for (let part of parts) {
        if (!part.trim()) continue;

        if (part.includes('-')) {
            const subTokens = part.split('-');
            const solfegeSubTokens = [];
            const keybindSubTokens = [];
            
            for (let subToken of subTokens) {
                subToken = subToken.trim();
                if (!subToken) {
                    solfegeSubTokens.push('');
                    keybindSubTokens.push('');
                    continue;
                }
                
                const parsed = parseNote(subToken);
                const solfege = getSolfegeName(parsed);
                const keybind = getKeybind(parsed);
                
                solfegeSubTokens.push(solfege || subToken);
                keybindSubTokens.push(keybind || subToken);
            }
            
            solfegeParts.push(solfegeSubTokens.join('-'));
            keybindParts.push(keybindSubTokens.join('-'));
        } else {
            const parsed = parseNote(part);
            const solfege = getSolfegeName(parsed);
            const keybind = getKeybind(parsed);
            
            solfegeParts.push(solfege || part);
            keybindParts.push(keybind || part);
        }
    }

    return {
        solfege: solfegeParts.join(' '),
        keybind: keybindParts.join(' ')
    };
}

function translateNotes() {
    const input = document.getElementById('input').value;
    const showSolfege = document.getElementById('showSolfege').checked;
    const lines = input.split('\n');
    const outputLines = [];

    for (let line of lines) {
        // Preserve blank lines
        if (!line.trim()) {
            outputLines.push('');
            continue;
        }

        if (isNoteLine(line)) {
            if (showSolfege) {
                const translated = translateLineWithSolfege(line);
                outputLines.push(translated.solfege);
                outputLines.push(translated.keybind);
            } else {
                outputLines.push(translateLine(line));
            }
        } else {
            // Lyric line - preserve as-is
            outputLines.push(line);
        }
    }

    document.getElementById('output').value = outputLines.join('\n');
}

function copyOutput() {
    const output = document.getElementById('output');
    output.select();
    document.execCommand('copy');
    
    // Visual feedback
    const btn = event.target;
    const originalText = btn.textContent;
    btn.textContent = '✓ Copied!';
    setTimeout(() => {
        btn.textContent = originalText;
    }, 2000);
}

function clearAll() {
    document.getElementById('input').value = '';
    document.getElementById('output').value = '';
}

function downloadPDF() {
    const output = document.getElementById('output').value;
    
    if (!output.trim()) {
        alert('Please translate some notes first before downloading PDF.');
        return;
    }

    // Check if jsPDF is loaded
    if (typeof window.jspdf === 'undefined') {
        alert('PDF library is loading. Please try again in a moment.');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Set up document
    doc.setFont("courier");
    doc.setFontSize(10);
    
    // Add title
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Heartopia Piano Keybinds", 105, 15, { align: "center" });
    
    // Add timestamp
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    const date = new Date().toLocaleString();
    doc.text(`Generated: ${date}`, 105, 22, { align: "center" });
    
    // Reset font for content
    doc.setFontSize(10);
    doc.setFont("courier", "normal");
    
    // Split output into lines
    const lines = output.split('\n');
    const pageHeight = doc.internal.pageSize.height;
    const lineHeight = 5;
    const margin = 15;
    const maxWidth = 180;
    let yPosition = 30;
    
    for (let line of lines) {
        // Check if we need a new page
        if (yPosition > pageHeight - margin) {
            doc.addPage();
            yPosition = margin;
        }
        
        // Handle long lines by splitting them
        if (line.length > 90) {
            const wrappedLines = doc.splitTextToSize(line, maxWidth);
            for (let wrappedLine of wrappedLines) {
                if (yPosition > pageHeight - margin) {
                    doc.addPage();
                    yPosition = margin;
                }
                doc.text(wrappedLine, margin, yPosition);
                yPosition += lineHeight;
            }
        } else {
            doc.text(line || ' ', margin, yPosition);
            yPosition += lineHeight;
        }
    }
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `heartopia-keybinds-${timestamp}.pdf`;
    
    // Save the PDF
    doc.save(filename);
    
    // Visual feedback
    const btn = event.target;
    const originalText = btn.textContent;
    btn.textContent = '✓ Downloaded!';
    setTimeout(() => {
        btn.textContent = originalText;
    }, 2000);
}

// Dark mode toggle functionality
function toggleDarkMode() {
    const body = document.body;
    const toggleIcon = document.querySelector('.toggle-icon');
    
    body.classList.toggle('dark-mode');
    
    // Update icon
    if (body.classList.contains('dark-mode')) {
        toggleIcon.textContent = '☀️';
        localStorage.setItem('darkMode', 'enabled');
    } else {
        toggleIcon.textContent = '🌙';
        localStorage.setItem('darkMode', 'disabled');
    }
}

// Check for saved dark mode preference on page load
function loadDarkModePreference() {
    const darkMode = localStorage.getItem('darkMode');
    const toggleIcon = document.querySelector('.toggle-icon');
    
    if (darkMode === 'enabled') {
        document.body.classList.add('dark-mode');
        if (toggleIcon) {
            toggleIcon.textContent = '☀️';
        }
    }
}

// Allow Enter key to trigger translation
document.addEventListener('DOMContentLoaded', function() {
    // Load dark mode preference
    loadDarkModePreference();
    
    // Add keyboard shortcut for translation
    document.getElementById('input').addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'Enter') {
            translateNotes();
        }
    });
});
