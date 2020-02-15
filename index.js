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
    const {withdrawAmount, cardNumber} = req.body
    mongoClient.connect(url, (err, client) => {
        if (err) throw err;
        const db = client.db('accounts');
        
        db.collection('logins').findOne({cardNumber}, (err,result)=>{
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
                const afterWdrawAmount = result.accBalance - withdrawAmount;
                if (afterWdrawAmount < 0) {
                    res.status(400).send("Insufficient Balance");
                    client.close();
                } else if (afterWdrawAmount >= 0) {
                    // updating new balance in DB
                    db.collection('logins').updateOne({ cardNumber }, { $set: { accBalance: afterWdrawAmount } }, (err, result) => {
                        if (err) throw err;
                        console.log('updating new balance + result below')
                        console.log(result);
                        res.status(200).send("balance updated");
                        client.close();
                    });
                }
            }

        })
    })
})

const PORT = 4000;
app.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`Server listening on port: ${PORT}`);
})