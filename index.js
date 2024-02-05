const express = require('express');
const marked = require('marked');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');
const shortid = require('shortid');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const port = 8080;

app.use(express.urlencoded({ extended: true }));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static('views'));

mongoose.connect('mongodb+srv://mithi:mishri@mithi.uxyhrt1.mongodb.net', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const Letter = mongoose.model('Letter', {
    id: String,
    content: String,
    author: String,
    publishDate: Date,
    scheduledDate: Date,
    shortUrl: String,
    timezone: String
});

app.get('/', (req, res) => {
    res.render(path.join('index.ejs'));
});

app.get('/wtf', (req, res) => {
    res.render(path.join('wtf.ejs'));
});

app.post('/create', async (req, res) => {
    const { letter, author, scheduledDate, timezone } = req.body;
    const htmlLetter = marked.parse(letter);
    const uniqueId = uuidv4();
    const shortUrl = shortid.generate();

    // Save the letter to MongoDB
    await saveLetterToMongoDB(uniqueId, htmlLetter, author, scheduledDate, shortUrl, timezone);

    // Redirect to the letter page with the short URL
    res.redirect(`/preview/${uniqueId}`);
});

app.get('/preview/:id', async (req, res) => {
    const letter = await getLetterByUniqueId(req.params.id);

    if (letter) {
          res.render('preview.ejs', { htmlLetter: letter.content, Url: `${process.env.url}/letter/${letter.shortUrl}` });
    } else {
        res.status(404).send('Letter not found');
    }
});

app.get('/letter/:id', async (req, res) => {
    const letter = await getLetterByShortUrl(req.params.id);

  if (letter) {
      res.render('letter.ejs', { htmlLetter: letter.content, letter });
  } else {
      res.status(404).send('Letter not found');
  }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

async function saveLetterToMongoDB(id, htmlLetter, author, scheduledDate, shortUrl, timezone) {
    try {
        await Letter.create({
            id,
            content: htmlLetter,
            author,
            publishDate: new Date(),
            scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
            shortUrl,
            timezone
        });
    } catch (error) {
        console.error('Error saving letter to MongoDB:', error);
    }
}
async function getLetterByUniqueId(id) {
    try {
        return await Letter.findOne({ id });
    } catch (error) {
        console.error('Error fetching letter by short URL:', error);
        return null;
    }
}

async function getLetterByShortUrl(shortUrl) {
    try {
        return await Letter.findOne({ shortUrl });
    } catch (error) {
        console.error('Error fetching letter by short URL:', error);
        return null;
    }
}
// scripts of mass destruction
 //getAllLetters();
async function getAllLetters() {
    try {
        const letters = await Letter.find();
        console.log('All Letters:', letters);
    } catch (error) {
        console.error('Error getting all letters:', error);
    } finally {
        mongoose.connection.close();
    }
}

async function deleteAllLetters() {
    try {
        await Letter.deleteMany({});
        console.log('All Letters deleted successfully.');
    } catch (error) {
        console.error('Error deleting all letters:', error);
    } finally {
        mongoose.connection.close();
    }
}
