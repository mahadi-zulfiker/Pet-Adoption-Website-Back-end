const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

//middleware

const corsOptions = {
    origin: [
        'http://localhost:5173',
        'http://localhost:5174'
    ],
    credentials: true,
    optionSuccessStatus: 200,
}

app.use(cors(corsOptions));
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.7uejvxv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
        //await client.connect();

        const PetsCollection = client.db("PawsDB").collection("pets");
        const UsersCollection = client.db("PawsDB").collection("users");
        const DonationCollection = client.db("PawsDB").collection("donations");

        //pets related api
        app.get('/pets', async (req, res) => {
            const result = await PetsCollection.find().toArray();
            res.send(result);
        })

        app.get("/pets/:id", async (req, res) => {
            const result = await PetsCollection.findOne({ _id: new ObjectId(req.params.id), });
            res.send(result)
        })

        //donations related api
        app.get('/donations', async (req, res) => {
            const result = await DonationCollection.find().toArray();
            res.send(result);
        })

        app.get("/donations/:id", async (req, res) => {
            const result = await DonationCollection.findOne({ _id: new ObjectId(req.params.id), });
            res.send(result)
        })

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        //await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('pets are running')
})

app.listen(port, () => {
    console.log(`Paws are running on port ${port}`);
})