const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

//middleware

const corsOptions = {
    origin: [
        'http://localhost:5173',
        'https://paws-for-a-home.web.app',
        'https://paws-for-a-home.firebaseapp.com'
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
        const addDonationCollection = client.db("PawsDB").collection("addDonations");
        const addProductsCollection = client.db('PawsDB').collection('addQueries')
        const adoptCollection = client.db('PawsDB').collection('adopt')

        // jwt related api
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '9h'
            });
            res.send({ token });
        })

        //middlewares
        const verifyToken = (req, res, next) => {
            if (!req.headers.authorization) {
                return res.status(401).send({ message: 'unauthorized access' })
            }
            const token = req.headers.authorization.split(' ')[1]
            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
                if (err) {
                    return res.status(403).send({ message: 'forbidden access' })
                }
                req.decoded = decoded;
                next();
            })
        }

        //use verify admin after verifyToken
        const verifyAdmin = async (req, res, next) => {
            const email = req.decoded.email;
            const query = { email: email };
            const user = await UsersCollection.findOne(query);
            const isAdmin = user?.role === 'admin';
            if (!isAdmin) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            next();
        }

        //add donations
        app.post("/addDonations", async (req, res) => {
            const result = await addDonationCollection.insertOne(req.body);
            res.send(result)
        })

        app.get("/myDonations/:email", async (req, res) => {
            const result = await addDonationCollection.find({ email: req.params.email }).toArray();
            res.send(result)
        })

        app.get('/donations', async (req, res) => {
            const cursor = addDonationCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })

        app.get("/donations/:id", async (req, res) => {
            const result = await addDonationCollection.findOne({ _id: new ObjectId(req.params.id), });
            res.send(result)
        })

        app.get("/singleDonation/:id", async (req, res) => {
            const result = await addDonationCollection.findOne({ _id: new ObjectId(req.params.id), });
            res.send(result)
        })

        app.put("/updateDonation/:id", async (req, res) => {
            const query = { _id: new ObjectId(req.params.id) };
            const data = {
                $set: {
                    Product_Name: req.body.Product_Name,
                    Product_Brand: req.body.Product_Brand,
                    image: req.body.image,
                    Boycotting_Reason_Details: req.body.Boycotting_Reason_Details,
                    Query_Title: req.body.Query_Title,
                }
            }
            const result = await addDonationCollection.updateOne(query, data);
            res.send(result)
        })

        app.delete("/deleted/:id", async (req, res) => {
            const result = await addDonationCollection.deleteOne({ _id: new ObjectId(req.params.id) });
            res.send(result)
        })

        //adopt pets
        app.post("/adopt", async (req, res) => {
            const result = await adoptCollection.insertOne(req.body);
            res.send(result)
        })

        app.get('/adopt', async (req, res) => {
            const result = await adoptCollection.find().toArray();
            res.send(result);
        });

        app.get('/adopt/:email', async (req, res) => {
            const email = req.params.email;
            if (email !== req.decoded.email) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            const query = { email: email };
            const adopt = await adoptCollection.findOne(query);
            let pending = false;
            if (adopt) {
                pending = adopt?.role === 'pending';
            }
            res.send({ pending });
        })

        app.patch('/adopt/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedDoc = {
                $set: {
                    role: 'pending'
                }
            }
            const result = await adoptCollection.updateOne(filter, updatedDoc);
            res.send(result);
        })

        app.delete('/adopt/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await adoptCollection.deleteOne(query);
            res.send(result);
        })

        //add pets
        app.post("/addQueries", async (req, res) => {
            const result = await addProductsCollection.insertOne(req.body);
            res.send(result)
        })

        app.get("/myQueries/:email", async (req, res) => {
            const result = await addProductsCollection.find({ email: req.params.email }).toArray();
            res.send(result)
        })

        app.get('/products', async (req, res) => {
            const cursor = addProductsCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })

        app.get("/products/:id", async (req, res) => {
            const result = await addProductsCollection.findOne({ _id: new ObjectId(req.params.id), });
            res.send(result)
        })

        app.get("/singleProduct/:id", async (req, res) => {
            const result = await addProductsCollection.findOne({ _id: new ObjectId(req.params.id), });
            res.send(result)
        })

        app.put("/updateProduct/:id", async (req, res) => {
            const query = { _id: new ObjectId(req.params.id) };
            const data = {
                $set: {
                    Product_Name: req.body.Product_Name,
                    Product_Brand: req.body.Product_Brand,
                    image: req.body.image,
                    Boycotting_Reason_Details: req.body.Boycotting_Reason_Details,
                    Query_Title: req.body.Query_Title,
                }
            }
            const result = await addProductsCollection.updateOne(query, data);
            res.send(result)
        })

        app.delete("/deleted/:id", async (req, res) => {
            const result = await addProductsCollection.deleteOne({ _id: new ObjectId(req.params.id) });
            res.send(result)
        })

        //pets related api
        app.get('/pets', async (req, res) => {
            const result = await PetsCollection.find().toArray();
            res.send(result);
        })

        app.get("/pets/:id", async (req, res) => {
            const result = await PetsCollection.findOne({ _id: new ObjectId(req.params.id), });
            res.send(result)
        })

        app.get("/singlePet/:id", async (req, res) => {
            const result = await PetsCollection.findOne({ _id: new ObjectId(req.params.id), });
            res.send(result)
        })

        app.get('/pets/:email', async (req, res) => {
            const email = req.params.email;
            if (email !== req.decoded.email) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            const query = { email: email };
            const adopt = await PetsCollection.findOne(query);
            let pending = false;
            if (adopt) {
                pending = adopt?.role === 'pending';
            }
            res.send({ pending });
        })

        app.patch('/pets/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedDoc = {
                $set: {
                    role: 'pending'
                }
            }
            const result = await PetsCollection.updateOne(filter, updatedDoc);
            res.send(result);
        })

        app.delete('/pets/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await PetsCollection.deleteOne(query);
            res.send(result);
        })

        app.put("/updatePets/:id", async (req, res) => {
            const query = { _id: new ObjectId(req.params.id) };
            const data = {
                $set: {
                    pet_name: req.body.pet_name,
                    pet_age: req.body.pet_age,
                    pet_image: req.body.pet_image,
                    pet_location: req.body.pet_location,
                    pet_type: req.body.pet_type,
                }
            }
            const result = await PetsCollection.updateOne(query, data);
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

        app.get("/singleDonation/:id", async (req, res) => {
            const result = await DonationCollection.findOne({ _id: new ObjectId(req.params.id), });
            res.send(result)
        })

        app.get('/donations/:email', async (req, res) => {
            const email = req.params.email;
            if (email !== req.decoded.email) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            const query = { email: email };
            const adopt = await DonationCollection.findOne(query);
            let pending = false;
            if (adopt) {
                pending = adopt?.role === 'pending';
            }
            res.send({ pending });
        })

        app.patch('/donations/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedDoc = {
                $set: {
                    role: 'pending'
                }
            }
            const result = await DonationCollection.updateOne(filter, updatedDoc);
            res.send(result);
        })

        app.delete('/donations/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await DonationCollection.deleteOne(query);
            res.send(result);
        })

        app.put("/updateDonations/:id", async (req, res) => {
            const query = { _id: new ObjectId(req.params.id) };
            const data = {
                $set: {
                    pet_name: req.body.pet_name,
                    pet_age: req.body.pet_age,
                    pet_image: req.body.pet_image,
                    pet_location: req.body.pet_location,
                    pet_type: req.body.pet_type,
                }
            }
            const result = await DonationCollection.updateOne(query, data);
            res.send(result)
        })

        // users related api

        app.get('/users', verifyToken, async (req, res) => {
            const result = await UsersCollection.find().toArray();
            res.send(result);
        });

        app.get('/users/admin/:email', verifyToken, async (req, res) => {
            const email = req.params.email;
            if (email !== req.decoded.email) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            const query = { email: email };
            const user = await UsersCollection.findOne(query);
            let admin = false;
            if (user) {
                admin = user?.role === 'admin';
            }
            res.send({ admin });
        })

        app.post('/users', async (req, res) => {
            const user = req.body;
            const query = { email: user.email }
            const existingUser = await UsersCollection.findOne(query);
            if (existingUser) {
                return res.send({ message: 'user already exists', insertedId: null })
            }
            const result = await UsersCollection.insertOne(user);
            res.send(result);
        })

        app.patch('/users/admin/:id', verifyToken, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await UsersCollection.updateOne(filter, updatedDoc);
            res.send(result);
        })

        app.delete('/users/:id', verifyToken, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await UsersCollection.deleteOne(query);
            res.send(result);
        })

        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        // console.log("Pinged your deployment. You successfully connected to MongoDB!");
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