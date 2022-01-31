const express = require('express');
const bcrypt = require('bcrypt');
const cors = require('cors');
const knex = require('knex')

const fs = require('fs')
const request = require('request');

require('@tensorflow/tfjs-backend-cpu');
require('@tensorflow/tfjs-backend-webgl');
const tfjs = require('@tensorflow/tfjs-node');
const cocoSsd = require('@tensorflow-models/coco-ssd');

const db = knex({
    client: 'pg',
    connection: {
        host: '127.0.0.1',
        port: 5432,
        user: 'postgres',
        password: '123',
        database: 'neuralandkernel'
    }
});

const salt = 10;
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '20mb' }))
app.use(cors());

app.post('/signin', (req, res) => {
    const { email, password } = req.body
    db.select('email', 'hash').from('login')
        .where('email', '=', email)
        .then(data => {
            const isValid = bcrypt.compareSync(password, data[0].hash)
            if (isValid) {
                db.select('*').from('users')
                    .where('email', '=', email)
                    .then(user => {
                        res.json(user[0])
                    })
                    .catch(err => res.status(400).json('unable to get user'))
            } else {
                res.status(400).json('wrong credentials')
            }
        })
        .catch(err => res.status(400).json('wrong credentials'))
})

app.post('/register', (req, res) => {
    const { name, email, password } = req.body;
    const hash = bcrypt.hashSync(password, salt)
    if (name === '' || email === '' || password === '') {
        res.status(400).json("error register")
    } else {
        db.transaction(trx => {
            trx.insert({
                hash: hash,
                email: email
            })
                .into('login')
                .returning('email')
                .then(loginEmail => {
                    trx('users')
                        .returning('*')
                        .insert({
                            name: name,
                            email: loginEmail[0].email,
                            joined: new Date()
                        })
                        .then(data => {
                            res.json(data[0])
                        })
                })
                .then(trx.commit)
                .catch(trx.rollback)
        })
            .catch(err => { res.status(400).json('unable to register') })
    }
})

app.get('/profile/:id', (req, res) => {
    const { id } = req.params;
    db.select('*').from('users').where({ id: id })
        .then(data => {
            if (data.length) {
                res.json(data[0])
            } else {
                res.status(400).json('not found')
            }
        })
        .catch(err => res.status(400).json('error getting user'))
})

app.put('/image', (req, res) => {
    const { id } = req.body;
    db('users')
        .where('id', '=', id)
        .increment('entries', 1)
        .returning('entries')
        .then(
            data => res.json(data[0].entries)
        )
        .catch(err => res.status(400).json('error update entries'))
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
            } else {
                console.log('error image format')
                res.json('link error')
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