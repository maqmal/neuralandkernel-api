const express = require('express');
const bcrypt = require('bcrypt');
const cors = require('cors');

const saltRounds = 10;

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
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

app.listen(3001, () => {
    console.log('Server running on port : 3001')
})