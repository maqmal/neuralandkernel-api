require('@tensorflow/tfjs-backend-cpu');
require('@tensorflow/tfjs-backend-webgl');
const tfjs = require('@tensorflow/tfjs-node');
const cocoSsd = require('@tensorflow-models/coco-ssd');
const request = require('request');
const express = require('express');
const bcrypt = require('bcrypt');
const cors = require('cors');
const knex = require('knex');
const fs = require('fs');

const signin = require('./controllers/signin');
const register = require('./controllers/register');
const getProfile = require('./controllers/getProfile');
const image = require('./controllers/image');
const detectLocal = require('./controllers/detectLocal');
const detectUrl = require('./controllers/detectUrl');

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

const downloadImage = function (uri, filename, callback) {
    request.head(uri, function (err, res, body) {
        console.log('content-type:', res.headers['content-type']);
        console.log('content-length:', res.headers['content-length']);
        request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
    });
};

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '20mb' }))
app.use(cors());

const salt = 10;

app.post('/signin', (req, res)=>{ signin.handleSignIn(req, res, db, bcrypt) });

app.post('/register', (req, res)=>{ register.handleRegister(req, res, db, bcrypt, salt) });

app.get('/profile/:id', (req, res) => { getProfile.handleGetProfile(req, res, db) });

app.put('/image', (req, res) => {image.handleImage(req, res, db)});

app.post('/api/classify-image', (req, res) => {detectLocal.handleDetectLocal(req, res, tfjs, model, fs)});

app.post('/api/classify-url', (req, res) => {detectUrl.handleDetectUrl(req, res, tfjs, model, downloadImage, fs, request)});

app.listen(3001, async () => {
    try {
        model = await cocoSsd.load()
        console.log('Model successfully loaded.')
    } catch (error) {
        console.log('Model loading failed. Check error log for information.')
    }
    console.log('Server running on port : 3001');
}) 