const express = require("express");
const app = express();
require("dotenv").config();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const res = require("express/lib/response");

app.use(cors());
app.use(express.json());

const port = process.env.PORT || 5000;

//mongoConnect

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cdxfa.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "UnAuthorized Access" });
  }
  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "Forbidden Token" });
    }
    req.decoded = decoded;
    next();
  });
}
const verifyAdmin = async (req, res, next) => {
  const requester = req.decoded.email;

  const requesterAccount = await userCollection.findOne({
    email: requester,
  });

  if (requesterAccount.role === "admin") {
    next();
  } else {
    res.status(403).send({ message: "Forbidden" });
  }
};

async function run() {
  try {
    await client.connect();
    const productCollection = client.db("sea_tech").collection("products");
    const userCollection = client.db("sea_tech").collection("users");

    app.get("/products", async (req, res) => {
      const result = await productCollection.find().toArray();
      res.send(result);
    });
    app.get("/product", async (req, res) => {
      const id = req.query;
      console.log(id);
      const query = { _id: ObjectId(id) };
      console.log(query);
      const result = await productCollection.findOne(query);
      res.send(result);
    });

    //signUp or Login
    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN, {
        expiresIn: "1d",
      });
      const user = req.body;
      const option = { upsert: true };
      let result;

      const updateDoc = { $set: user };
      result = await userCollection.updateOne(filter, updateDoc, option);

      res.send({ result, token });
    });
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("hellow");
});

app.listen(port, () => {
  console.log("Listening to server");
});
