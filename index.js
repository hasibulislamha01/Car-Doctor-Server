const express = require('express');
const cors = require('cors');
require('dotenv').config()
const app = express();
const cookieParser = require('cookie-parser')
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;

// middleware
app.use(cors({
    origin:  ['http://localhost:5173'],
    credentials: true
}))
app.use(express.json())
app.use(cookieParser())

console.log(process.env.db_User)
console.log(process.env.db_Pass)


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.db_User}:${process.env.db_Pass}@cluster0.75ieoxq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();


        const serviceCollection = client.db('CarDoctor').collection('Services')
        const orderCollection = client.db('CarDoctor').collection('orders')
        // console.log('collection is',serviceCollection)

        
        // auth related api
        app.post('/jwt', async (req, res) => {
            const user = req.body
            console.log(user);
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'})

            res
            .cookie('token', token, {
                httpOnly: true,
                secure: false,   
                // for localhost secure option takes false value
                sameSite: 'none'
                // is server and client are in same site ?
                // server is running on 5000 and client on 5173. So, the value will be none
            })
            .send({success : true})
        })
        
        
        // service related api
        app.get('/services', async (req, res) => {
            console.log('tok tok token', req.cookies.token)
            const cursor = serviceCollection.find();
            const result = await cursor.toArray();
            res.send(result)
        })

        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const options = {
                // Include only the `title` and `imdb` fields in the returned document
                projection: { _id: 1, title: 1, price: 1 },
            };
            const cursor = serviceCollection.find(query, options)
            const result = await cursor.toArray()
            res.send(result)
        })

        app.post('/orders', async (req, res)=> {
            const order = req.body;
            console.log(order)
            const result = await orderCollection.insertOne(order)
            res.send(result)
        })

        app.get('/orders', async (req, res)=> {
            const cursor = orderCollection.find()
            const result = await cursor.toArray()
            res.send(result)
        })

        app.get('/orders', async (req, res)=> {
            console.log(req.query)
            let query = {}
            if(req.query.buyerEmail){
                query = {email: req.query.email}
            }
            const result = await orderCollection.find(query).toArray()
            res.send(result)
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
    res.send('Car doctor server is running')
})



app.listen(port, () => {
    console.log("car doctor server is running on port", port)
})