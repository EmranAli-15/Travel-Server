const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');


app.use(cors());
app.use(express.json());









const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.2b4mnlf.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});




// verifying json web token
const verifyJWT = (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
        return res.status(401).send({ error: true, message: 'unauthorize access' });
    }

    const token = authorization.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
        if (err) {
            return res.status(401).send({ error: true, message: 'unauthorize access' });
        }
        req.decoded = decoded;
        next();
    })
}

async function run() {
    try {
        // database collections
        const flightTicketCollections = client.db("Travel-Ticket").collection("flightTickets");
        const adminCollection = client.db("Travel-Ticket").collection("admin")


        // create jwt token
        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: '1h' });
            res.send({ token });
        })

        // admin verify
        const verifyAdmin = async (req, res, next) => {
            const email = req.decoded.email;
            const query = { email: email };
            const admin = await adminCollection.findOne(query);
            if (!admin) {
                return res.status(403).send({ error: true, message: 'forbidden access' });
            }
            next();
        }


        app.post('/publishFlightTicket', verifyJWT, verifyAdmin, async (req, res) => {
            const ticket = req.body;
            const result = await flightTicketCollections.insertOne(ticket);
            res.send(result);
        })



        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);









app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});