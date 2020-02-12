const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const mongodb = require('mongodb');
const mongoClient = mongodb.MongoClient;
const url = "mongodb://localhost:27017";

app.use(bodyParser.json());
app.use(cors());

app.post('/validate', (req, res) => {
    console.log(req.body);
    let { cardNumber, pinNumber } = req.body;
    mongoClient.connect(url, (err, client) => {
        if (err) throw err;
        var db = client.db('accounts');

        db.collection('logins').findOne({ cardNumber }, (err, result) => {
            if (err) throw err;
            console.log(result);
            if (result != null) {
                if (result.pinNumber == pinNumber) {
                    res.send(JSON.stringify(result));
                    client.close()
                } else {
                    res.sendStatus(401);
                    client.close()
                }
            } else {
                res.sendStatus(401);
                client.close()
            }
        });
    })
})

const PORT = 4000;
app.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`Server listening on port: ${PORT}`);
})