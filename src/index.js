import express from 'express';
import cors from 'cors'
import connect from './db.js'
import mongo from 'mongodb'

const app = express() 
const port = 3000

app.use(cors())
app.use(express.json())

//GET ALL VIDEOS
app.get('/videos', async (req, res) => {
  let db = await connect();
  let query = req.query;
  let selection = {};

  if (query._any) {
    let search = query._any;
    let terms = search.split(' ');
    let attributes = ['title', 'postedBy'];

    selection = {
      $and: [],
    };

    terms.forEach((term) => {
      let or = {
        $or: [],
      };

      attributes.forEach((attribute) => {
        or.$or.push({ [attribute]: new RegExp(term) });
      });

      selection.$and.push(or);
    });
  }

  console.log('Selection', selection);

  let cursor = await db.collection('videos').find(selection);
  let results = await cursor.toArray();

  res.json(results);
});

//GET A SINGLE VIDEO BY ID
app.get('/videos/:id', async (req, res) => {
  let id = req.params.id;
  let db = await connect();

  let document = await db.collection('videos').findOne({
    _id: mongo.ObjectId(id)
  });

  res.json(document);
  });

//GET A SINGLE USER BY USERNAME
app.get('/user/:postedBy', async (req, res) => {
  let db = await connect();

  let document = await db.collection('videos').find({
    postedBy: req.params.postedBy
  }).toArray();

  res.json(document);
});

//GET ALL FORUM POSTS
app.get('/forum', async (req, res) => {
  let db = await connect();
  let query = req.query;
  let selection = {};

  if (query._any) {
    let search = query._any;
    let terms = search.split(' ');
    let attributes = ['title'];

    selection = {
      $and: [],
    };

    terms.forEach((term) => {
      let or = {
        $or: [],
      };

      attributes.forEach((attribute) => {
        or.$or.push({ [attribute]: new RegExp(term) });
      });

      selection.$and.push(or);
    });
  }

  console.log('Selection', selection);

  let cursor = await db.collection('posts').find(selection);
  let results = await cursor.toArray();

  res.json(results);
});

//GET A SINGLE FORUM POST BY ID
app.get('/forum/:id', async (req, res) => {
  let id = req.params.id;
  let db = await connect();

  let document = await db.collection('posts').findOne({
    _id: mongo.ObjectId(id)
  });

  res.json(document);
  });

//POST A VIDEO
app.post('/videos', async (req, res) => {
  let data = req.body;
  data.postedAt = new Date().getTime();
  delete data._id;

  if(!data.title || !data.postedBy || !data.source){

    res.json({
      status: 'fail',
      reason: 'incomplete'
    })
    return
  }

    let db = await connect();
    let result = await db.collection("videos").insertOne(data);
    res.json(data)
});

//POST A FORUM POST
app.post('/forum', async (req, res) => {
  let data = req.body;
  data.postedAt = new Date().getTime();
  delete data._id;

  if(!data.title || !data.postedBy || !data.content){

    res.json({
      status: 'fail',
      reason: 'incomplete'
    })
    return
  }

    let db = await connect();
    let result = await db.collection("posts").insertOne(data);
    res.json(data)
});

//UPDATE A VIDEO
app.patch('/videos/:id', async (req, res) => {
  let doc = req.body;
  delete doc._id;
  let id = req.params.id;
  let db = await connect();

  let result = await db.collection('videos').updateOne({
    _id: mongo.ObjectId(id) 
  },

  {
    $set: doc,
  });

  if (result.modifiedCount == 1) {
    res.json({
      status: 'Video updated!',
      id: result.insertedId,
    });
  }

  else {
    res.json({
      status: 'Video failed to update!',
    });
  }
});

//UPDATE A FORUM POST
app.patch('/forum/:id', async (req, res) => {
  let doc = req.body;
  delete doc._id;
  let id = req.params.id;
  let db = await connect();

  let result = await db.collection('posts').updateOne({
    _id: mongo.ObjectId(id) 
  },

  {
    $set: doc,
  });

  if (result.modifiedCount == 1) {
    res.json({
      status: 'Post updated!',
      id: result.insertedId,
    });
  }

  else {
    res.json({
      status: 'Post failed to update!',
    });
  }
});

//DELETE A VIDEO
app.delete('/videos/:id', async (req, res) => {
  let doc = req.body;
  delete doc._id;
  let id = req.params.id;
  let db = await connect();

  let result = await db.collection('videos').deleteOne({
    _id: mongo.ObjectId(id) 
  })
  res.json("Video deleted!")
});

//DELETE A FORUM POST
app.delete('/forum/:id', async (req, res) => {
  let doc = req.body;
  delete doc._id;
  let id = req.params.id;
  let db = await connect();

  let result = await db.collection('posts').deleteOne({
    _id: mongo.ObjectId(id) 
  })
  res.json("Post deleted!")
});

app.listen(port, () => console.log(`Using port ${port}!`))