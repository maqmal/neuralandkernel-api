const express = require('express');
const bcrypt = require('bcrypt');
const cors = require('cors');

const fs = require('fs')
const request = require('request');

require('@tensorflow/tfjs-backend-cpu');
require('@tensorflow/tfjs-backend-webgl');
const tfjs = require('@tensorflow/tfjs-node');
const cocoSsd = require('@tensorflow-models/coco-ssd');

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
    const { email, password } = req.body
    let found = false;
    database.users.forEach(loopUser => {
        if (loopUser.email === email && loopUser.password === password) {
            found = true;
            return res.json(loopUser);
        }
    })
    if (!found) {
        res.status(404).json("no such user")
    }
})

app.post('/register', (req, res) => {
    const { name, email, password } = req.body;
    if (name === '' || email === '' || password === '') {
        res.status(400).json("error register")
    } else {
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
    }
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
        const base64String = req.body.base64StringFile;
        const base64File = base64String.split(';base64,').pop();
        const fileType = base64String.split('/')[1].split(';')[0];
        const fileLocation = `uploads/imageUpload.${fileType}`;

        fs.writeFile(fileLocation, base64File, { encoding: 'base64' }, async () => {
            console.log('Image created!');
            const image = await fs.readFileSync(fileLocation);
            const decodedImage = tfjs.node.decodeImage(image, 3);
            console.log('Decoded image...');
            const prediction = await model.detect(decodedImage);
            console.log('Classifier triggered!');
            if (prediction.length === 0) {
                res.json('not found');
            } else {
                res.json(prediction);
            }
        });
    } catch (error) {
        res.status(400).json("tf error")
    };
})

const downloadImage = function (uri, filename, callback) {
    request.head(uri, function (err, res, body) {
        console.log('content-type:', res.headers['content-type']);
        console.log('content-length:', res.headers['content-length']);
        request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
    });
};

app.post('/api/classify-url', async (req, res) => {
    const magic = {
        jpg: 'ffd8ffe0',
        png: '89504e47',
        gif: '47494638'
    };
    const options = {
        method: 'GET',
        url: req.body.url,
        encoding: null // keeps the body as buffer
    };
    try {
        request(options, async function (err, response, body) {
            if (!err && response.statusCode == 200) {
                var magigNumberInBody = body.toString('hex', 0, 4);
                if (magigNumberInBody == magic.jpg ||
                    magigNumberInBody == magic.png ||
                    magigNumberInBody == magic.gif) {
                    const fileLocation = `uploads/imageUrl.${magigNumberInBody}`;
                    downloadImage(req.body.url, fileLocation, async () => {
                        const image = await fs.readFileSync(fileLocation);
                        const decodedImage = tfjs.node.decodeImage(image, 3);
                        console.log('Decoded image...');
                        const prediction = await model.detect(decodedImage);
                        console.log('Classifier triggered!');
                        if (prediction.length === 0) {
                            res.json('not found');
                        } else {
                            res.json(prediction);
                        }
                    })
                }
            }
        }
        )
    } catch (error) {
        res.status(400).json("tf error")
    }
})

app.listen(3001, async () => {
    try {
        model = await cocoSsd.load()
        console.log('Model successfully loaded.')
    } catch (error) {
        console.log('Model loading failed. Check error log for information.')
    }
    console.log('Server running on port : 3001');
}) 