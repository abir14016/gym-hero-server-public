//require
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;
const app = express();

//middleware
app.use(cors());
app.use(express.json());

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' });
        }
        console.log('decoded', decoded);
        req.decoded = decoded;
        next();
    });
}

//connection with database
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.boat8.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const inventoryCollection = client.db("gymHero").collection("inventory");
        const manageInventoryCollection = client.db("gymHero").collection("manageInventories");
        const myInventoryCollection = client.db("gymHero").collection("myInventories");



        //AUTH
        app.post('/login', async (req, res) => {
            const user = req.body;
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '1d'
            })
            res.send({ accessToken });
        });


        //load only 6 inventories at home page
        app.get('/inventory', async (req, res) => {
            const query = {};
            const cursor = inventoryCollection.find(query);
            const inventories = await cursor.limit(6).toArray();
            res.send(inventories);
        });


        //load all inventory data from database to server
        app.get('/manageinventory', async (req, res) => {
            const query = {};
            const cursor = inventoryCollection.find(query);
            const inventories = await cursor.toArray();
            res.send(inventories);
        });

        //load specific inventory data from database
        app.get('/inventory/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const inventory = await inventoryCollection.findOne(query);
            res.send(inventory);
        });

        //add inventory api
        app.post('/manageinventory', async (req, res) => {
            const newInventory = req.body;
            const result = await inventoryCollection.insertOne(newInventory);
            res.send(result);
        });

        // update inventory
        app.put('/inventory/:id', async (req, res) => {
            const id = req.params.id;
            const updatedUser = req.body;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };

            const updateDoc = {
                $set: {
                    quantity: updatedUser.quantity
                },
            };
            const result = await inventoryCollection.updateOne(filter, updateDoc, options);
            res.send(result);
        })

        //delete specific inventory from database
        app.delete('/manageinventory/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await inventoryCollection.deleteOne(query);
            res.send(result);
        });


        app.get('/manageinventory/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const inventory = await inventoryCollection.findOne(query);
            res.send(inventory);
        });



        //myInventories collection API


        app.get('/myInventories', verifyJWT, async (req, res) => {
            const decodedEmail = req?.decoded?.email;
            console.log(decodedEmail);
            const email = req.query.email;
            console.log(email);
            if (email === decodedEmail) {
                const query = { email: email };
                const cursor = myInventoryCollection.find(query);
                const myInventories = await cursor.toArray();
                res.send(myInventories);
            }
            else {
                res.status(403).send({ message: 'forbidden access' });
            }
        });

        app.post('/myInventories', async (req, res) => {
            const myInventory = req.body;
            const result = await myInventoryCollection.insertOne(myInventory);
            res.send(result);
        });

        app.delete('/myInventories/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await myInventoryCollection.deleteOne(query);
            res.send(result);
        });
    }
    finally {

    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('gym hero server is running');
});

app.listen(port, () => {
    console.log('gym hero running on port', port);
});