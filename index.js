const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


app.use(cors());
app.use(express.json());



// DB_USER=Travel-Ticket
// DB_PASS=pEsM2yVlbgzfaJOy
// ACCESS_TOKEN=90befc5b815a61d45a3d9412a1fa4b84d22cb948017d6bdbfe87062600208ccf369257da30f9a3317ca8ce3af18436582a47775138e0bc8cfceca64bc397962a






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
        const hotelTicketCollections = client.db("Travel-Ticket").collection("hotelTickets");
        const adminCollection = client.db("Travel-Ticket").collection("admin");
        const blogsCollection = client.db("Travel-Ticket").collection("blogs");


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

        // checking, is admin or not
        app.get('/adminSecure/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;
            if (req.decoded.email !== email) {
                return res.send(null);
            }
            const query = { email: email };
            const result = await adminCollection.findOne(query);
            res.send(result)
        })





        //----------------- apis for flight tickets -----------------//
        app.post('/publishFlightTicket', verifyJWT, verifyAdmin, async (req, res) => {
            const ticket = req.body;
            const result = await flightTicketCollections.insertOne(ticket);
            res.send(result);
        })

        app.post('/getFlightTickets', async (req, res) => {
            const from = req.body.from;
            const to = req.body.to;
            const query = { from: { $regex: from, $options: 'i' }, to: { $regex: to, $options: 'i' } };
            const result = await flightTicketCollections.find(query).toArray();
            res.send(result);
        })




        //----------------- apis for hotel tickets -----------------//
        app.post('/publishHotelTicket', async (req, res) => {
            const data = req.body;
            const result = await hotelTicketCollections.insertOne(data);
            res.send(result);
        })

        app.get('/getHotelTickets/:name', async (req, res) => {
            const name = req.params.name;
            const query = { place: { $regex: name, $options: 'i' } }
            const result = await hotelTicketCollections.find(query).toArray();
            res.send(result);
        })





        //----------------- apis for blogs upload -----------------//
        app.post('/uploadBlog', async (req, res) => {
            const blog = req.body;
            const result = await blogsCollection.insertOne(blog);
            res.send(result);
        })

        app.get('/getBlogs', async (req, res) => {
            const result = await blogsCollection.find().sort({ date: -1 }).toArray();
            res.send(result);
        })

        app.get('/getSingleBlog/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await blogsCollection.findOne(query);
            res.send(result);
        })

        app.get('/popularBlogLink', async (req, res) => {
            const result = await blogsCollection.find().sort({ date: -1 }).limit(4).toArray();
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