const express = require('express');
const marked = require('marked');
const { v4: uuidv4 } = require('uuid'); // Import the uuid library
const fs = require('fs').promises;
const path = require('path');

const app = express();
const port = 8080;

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static('views'));
app.set('views', path.join(__dirname, 'views'));

const lettersFilePath = path.join(__dirname, 'letters.json');

app.get('/', (req, res) => {
    res.render(path.join('index.ejs'));
});

app.get('/wtf', (req, res) => {
    res.render(path.join('wtf.ejs'));
});

app.post('/create', async (req, res) => {
    const { letter } = req.body;
    const htmlLetter = marked.parse(letter);

    // Generate a unique ID using uuid
    const uniqueId = uuidv4();

    // Save the HTML letter and its unique ID to a JSON file
    await saveLetter(uniqueId, htmlLetter);

    // Redirect to the letter page with the unique ID
    res.redirect(`/letter/${uniqueId}`);
});

app.get('/letter/:id', async (req, res) => {
    // Fetch the HTML letter from the JSON file using the ID
    const htmlLetter = await getLetterById(req.params.id);

    if (htmlLetter) {
        res.render(path.join('letter.ejs', { htmlLetter }));
    } else {
        res.status(404).send('Letter not found');
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

// Function to save the HTML letter and its unique ID to a JSON file
async function saveLetter(id, htmlLetter) {
    try {
        const letters = await readLettersFile();
        letters[id] = htmlLetter;
        await fs.writeFile(lettersFilePath, JSON.stringify(letters, null, 2));
    } catch (error) {
        console.error('Error saving letter:', error);
    }
}

// Function to fetch the HTML letter from the JSON file using the ID
async function getLetterById(id) {
    try {
        const letters = await readLettersFile();
        return letters[id];
    } catch (error) {
        console.error('Error fetching letter by ID:', error);
        return null;
    }
}

// Function to read the letters JSON file
async function readLettersFile() {
    try {
        const data = await fs.readFile(lettersFilePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        // If the file doesn't exist, return an empty object
        if (error.code === 'ENOENT') {
            return {};
        }
        throw error;
    }
}
