const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const mongodb = require("mongodb");
const MongoClient = mongodb.MongoClient;

const app = express();
let db;

app.use(express.static("static"));
app.use(bodyParser.json());

app.get("/api/inventory", (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.effort_lte || req.query.effort_gte) filter.effort = {};
  if (req.query.effort_lte)
    filter.effort.$lte = parseInt(req.query.effort_lte, 10);
  if (req.query.effort_gte)
    filter.effort.$gte = parseInt(req.query.effort_gte, 10);
  db.collection("inventory")
    .find(filter)
    .toArray()
    .then(issues => {
      const metadata = { total_count: issues.length };
      res.json({ _metadata: metadata, records: issues });
    })
    .catch(err => {
      console.error(`[MongoDB - FETCH ERROR]: ${err}`);
      res.status(500).json({ message: `Internal Server Error: ${err}` });
    });
});

app.get("/api/inventory/:id", (req, res) => {
  let issueID;
  try {
    issueID = new mongodb.ObjectID(req.params.id);
  } catch (err) {
    res.status(422).json({
      message: `[MongoDB - GET :id - ERROR]: Invalid issue ID format: ${err}`
    });
    return;
  }
  db.collection("inventory")
    .find({ _id: issueID })
    .limit(1)
    .next()
    .then(issue => {
      if (!issue)
        res.status(422).json({
          message: `[MongoDB - GET :id - ERROR]: No such issue: ${err}`
        });
      else res.json(issue);
    })
    .catch(err => {
      console.error(`[MongoDB - FETCH ERROR]: ${err}`);
      res.status(500).json({ message: `Internal Server Error: ${err}` });
    });
});

app.post("/api/inventory", (req, res) => {
  const newIssue = req.body;
  newIssue.created = new Date();
  if (!newIssue.status) newIssue.status = "New";

  db.collection("inventory")
    .insertOne(newIssue)
    .then(result =>
      db
        .collection("inventory")
        .find({ _id: result.insertedId })
        .limit(1)
        .next()
    )
    .then(newIssue => res.json(newIssue))
    .catch(err => {
      console.error(`[MongoDB - INSERT ERROR]: ${err}`);
      res.status(500).json({ message: `Internal Server Error: ${err}` });
    });
});

app.put("/api/inventory/:id", (req, res) => {
  let issueID;
  try {
    issueID = new mongodb.ObjectID(req.params.id);
  } catch (err) {
    res.status(422).json({
      message: `[MongoDB - GET :id - ERROR]: Invalid issue ID format: ${err}`
    });
    return;
  }
  const issue = req.body;
  delete issue._id;

  db.collection("inventory")
    .update({ _id: issueID }, issue)
    .then(() => {
      db.collection("inventory")
        .find({ _id: issueID })
        .limit(1)
        .next();
    })
    .then(savedIssue => {
      res.json(savedIssue);
    })
    .catch(err => {
      console.error(`[MongoDB - UPDATE ERROR]: ${err}`);
      res.status(500).json({ message: `Internal Server Error: ${err}` });
    });
});

app.delete("/api/inventory/:id", (req, res) => {
  let issueID;
  try {
    issueID = new mongodb.ObjectID(req.params.id);
  } catch (err) {
    res.status(422).json({
      message: `[MongoDB - GET :id - ERROR]: Invalid issue ID format: ${err}`
    });
    return;
  }
  db.collection("inventory")
    .deleteOne({ _id: issueID })
    .then(deleteResult => {
      if (deleteResult.result.n === 1) res.json({ status: "OK" });
      else res.json({ status: "Warning: object not found" });
    })
    .catch(err => {
      console.error(`[MongoDB - UPDATE ERROR]: ${err}`);
      res.status(500).json({ message: `Internal Server Error: ${err}` });
    });
});

app.get("*", (req, res) => {
  res.sendFile(path.resolve("static/index.html"));
});

MongoClient.connect(
  "mongodb://localhost",
  { useNewUrlParser: true }
)
  .then(client => {
    db = client.db("inventory");
    app.listen(3000, () => {
      console.log("App started on port 3000");
    });
  })
  .catch(err => console.error(`[MongoDB - ERROR]: ${err}`));
