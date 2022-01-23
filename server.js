const express = require('express');
const bcrypt = require('bcrypt');
const cors = require('cors');

const fs = require('fs')
const { v4: uuidv4 } = require('uuid');

const mobilenet = require('@tensorflow-models/mobilenet');
const tfjs = require('@tensorflow/tfjs-node');
let mobilenetModel = null;

const saltRounds = 10;

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '20mb' }))
app.use(cors());

const database = {
    users: [
        {
            id: 123,
            name: 'john',
            email: 'john@gmail.com',
            password: 'cookies',
            entries: 0,
            joined: new Date()
        },
        {
            id: 124,
            name: 'sally',
            email: 'sally@gmail.com',
            password: 'bananas',
            entries: 0,
            joined: new Date()
        }
    ],
    login: [
        {
            id: '987',
            has: '',
            email: 'john@gmail.com'
        }
    ]
}

app.get('/', (req, res) => {
    res.send(database.users);
})

app.post('/signin', (req, res) => {
    // bcrypt.compare("Gibberish", "$2b$10$laxIYL4KC9.H/9LjZvGlsu25kBEy.SrPggbKDCRCWe0oisRwcRLHu", function(err, result) {
    //     console.log("first guess", result);
    // });
    // bcrypt.compare("veggies", "$2b$10$laxIYL4KC9.H/9LjZvGlsu25kBEy.SrPggbKDCRCWe0oisRwcRLHu", function(err, result) {
    //     console.log("second guess", result);
    // });

    if (req.body.email === database.users[0].email &&
        req.body.password === database.users[0].password) {
        res.json('success');
    } else {
        res.status(400).json('error logging in');
    }
})

app.post('/register', (req, res) => {
    const { name, email, password } = req.body;

    database.users.push({
        id: 125,
        name: name,
        email: email,
        password: password,
        entries: 0,
        joined: new Date()
    })

    bcrypt.hash(password, saltRounds, function (err, hash) {
        console.log(hash);
    });

    res.json(database.users[database.users.length - 1]);
})

app.get('/profile/:id', (req, res) => {
    const { id } = req.params;
    let found = false;
    database.users.forEach(loopUser => {
        if (loopUser.id === parseInt(id)) {
            found = true;
            return res.json(loopUser);
        }
    })
    if (!found) {
        res.status(404).json("no such user")
    }
})

app.put('/image', (req, res) => {
    const { id } = req.body;
    let found = false;
    database.users.forEach(loopUser => {
        if (loopUser.id === parseInt(id)) {
            found = true;
            loopUser.entries++;
            return res.json(loopUser.entries);
        }
    })
    if (!found) {
        res.status(404).json("no such user")
    }
})

// Image Classification API
app.post('/api/classify-image', async (req, res) => {
    try {
        const base64String = req.body.base64StringFile
        const base64File = base64String.split(';base64,').pop()
        const fileType = base64String.split('/')[1].split(';')[0]
        const fileLocation = `uploads/submissions/${uuidv4()}.${fileType}`

        fs.writeFile(fileLocation, base64File, { encoding: 'base64' }, async () => {
            console.log('Classifier triggered.')

            const image = await fs.readFileSync(fileLocation)
            const decodedImage = tfjs.node.decodeImage(image, 3)
            const prediction = await mobilenetModel.classify(decodedImage)

            res.send(prediction)
        })
    } catch (error) {
        console.log(error)
    }
})

app.listen(3001, async () => {
    try {
        mobilenetModel = await mobilenet.load()
        console.log('Model successfully loaded.')
    } catch (error) {
        console.log('Model loading failed. Check error log for information.')
    }
    console.log('Server running on port : 3001');
})