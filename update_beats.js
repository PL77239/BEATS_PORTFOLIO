const fs = require('fs');
const path = require('path');
const directoryPath = __dirname;
const outputFile = path.join(__dirname, 'beats.json');

try {
    const files = fs.readdirSync(directoryPath);

    const mp3Files = files.filter(file => file.toLowerCase().endsWith('.mp3'));

    fs.writeFileSync(outputFile, JSON.stringify(mp3Files, null, 2));

    console.log(`✅ Sukces! Wygenerowano plik beats.json z listą ${mp3Files.length} utworów.`);
} catch (err) {
    console.error('❌ Wystąpił błąd podczas skanowania folderu:', err);
}