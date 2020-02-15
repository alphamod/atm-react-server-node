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
    console.log(`validate api`);
    console.log(req.body);
    let { cardNumber, pinNumber } = req.body;
    mongoClient.connect(url, (err, client) => {
        if (err) throw err;
        const db = client.db('accounts');

        db.collection('logins').findOne({ cardNumber }, (err, result) => {
            if (err) throw err;
            console.log(result);
            if (result != null) {
                if (result.pinNumber == pinNumber) {
                    res.json(result);
                    client.close()
                } else {
                    res.sendStatus(401);
                    client.close();
                }
            } else {
                res.sendStatus(401);
                client.close();
            }
        });
    })
})

app.post('/withdraw', (req, res) => {
    console.log(`withdraw api`);
    console.log(req.body);
    const { withdrawAmount, cardNumber } = req.body
    mongoClient.connect(url, (err, client) => {
        if (err) throw err;
        const db = client.db('accounts');

        db.collection('logins').findOne({ cardNumber }, (err, result) => {
            if (err) throw err;
            console.log(result);
            // check whether balance is there to withdraw
            if (result.accBalance == 0) {
                console.log(`insufficient balance`);
                res.statusMessage = "Insufficient Balance";
                res.status(400).end();
                client.close();
                // check whether the amount is withdrawable
            } else if (result.accBalance != 0) {
                const afterWdrawAmount = parseInt(result.accBalance) - parseInt(withdrawAmount);
                if (afterWdrawAmount < 0) {
                    res.statusMessage = "Insufficient Balance";
                    res.status(400).end();
                    client.close();
                } else if (afterWdrawAmount >= 0) {
                    // updating new balance in DB
                    db.collection('logins').updateOne({ cardNumber }, { $set: { accBalance: parseInt(afterWdrawAmount) } }, (err, result) => {
                        if (err) throw err;
                        console.log('updating new balance + result below')
                        console.log(result);
                        let newBalanceMsg = String(afterWdrawAmount);
                        res.statusMessage = newBalanceMsg;
                        res.status(200).end();
                        client.close();
                    });
                }
            }
            client.close();
        })
    })
})

app.post('/deposit', (req, res) => {
    console.log(req.body);
    const { depositAmount, cardNumber } = req.body;
    mongoClient.connect(url, (err, client) => {
        if (err) throw err;
        const db = client.db('accounts');

        db.collection('logins').findOne({ cardNumber }, (err, result) => {
            if(err) throw err;
            console.log(result);
            const newBalance = parseInt(result.accBalance) + parseInt(depositAmount);
            db.collection('logins').updateOne({ cardNumber }, { $set: { accBalance: parseInt(newBalance) } }, (err, result) => {
                if (err) throw err;
                console.log(`update result:`);
                console.log(result.result.nModified);
                // if (result.message.modifiedCount == 1) {
                let statusMsg = String(newBalance);
                res.statusMessage = statusMsg;    
                res.status(200).end();
                // }
                client.close();
            });
            client.close();
        })
    })
})

app.get('/checkBal/:cardNumber', (req, res)=>{
    mongoClient.connect(url, (err, client) => {
        if (err) throw err;
        const db = client.db('accounts');

        db.collection('logins').findOne({ cardNumber: req.params.cardNumber }, (err, result) => {
            if (err) throw err;
            console.log(result)
            res.status(200).json(result);
            client.close();
        })

    })
})

app.post('/changePin', (req, res) => {
    console.log(`changePin api`);
    console.log(req.body);
    const { cardNumber, oldPin, newPin } = req.body;
    mongoClient.connect(url, (err, client) => {
        if (err) throw err;
        const db = client.db('accounts');
        db.collection('logins').findOne({ cardNumber }, (err, result) => {
            if (err) throw err;
            console.log(`changePin result:`)
            console.log(result);
            if (result.pinNumber == oldPin) {
                db.collection('logins').updateOne({ cardNumber }, { $set: { pinNumber: newPin } }, (err, result) => {
                    if (err) throw err;
                    console.log(result.result.nModified);
                    if (result.result.nModified == 1) {
                        res.statusMessage = "Pin Changed Successfully";
                        res.status(200).end();
                        client.close();
                    }
                    client.close();
                })
            }
            client.close();
        })
    })
})

const PORT = 4000;
app.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`Server listening on port: ${PORT}`);
})