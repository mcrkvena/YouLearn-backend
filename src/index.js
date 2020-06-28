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

  let cursor = await db.collection('videos').find(selection).sort({_id:-1});
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

  let cursor = await db.collection('posts').find(selection).sort({_id:-1});
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

  if(!data.title || !data.postedBy || !data.url){

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
app.delete('/forum/:postId', async (req, res) => {
  let doc = req.body;
  delete doc._id;
  let postId = req.params.postId;
  let db = await connect();

  let result = await db.collection('posts').deleteOne({
    _id: mongo.ObjectId(postId) 
  })

  res.json("Post deleted!")
});

//ADD A COMMENT ON A FORUM POST
app.post('/forum/:postId/comments', async (req, res) => {
  let db = await connect();
  let doc = req.body;
  let postId = req.params.postId;
  doc._id = mongo.ObjectId();
  doc.posted_at = Date.now();

  let result = await db.collection('posts').updateOne(
      { _id: mongo.ObjectId(postId) },
      {
          $push: { comments: doc },
      }
  );

  if (result.modifiedCount == 1) {
      res.json({
          status: 'success',
          id: doc._id,
      });
      
  } else {
      res.statusCode = 500;
      res.json({
          status: 'fail',
      });
  }
});

//DELETE A COMMENT ON A FORUM POST
app.delete('/forum/:postId/comments/:commentId', async (req, res) => {
  let db = await connect();
  let postId = req.params.postId;
  let commentId = req.params.commentId;

  let result = await db.collection('posts').updateOne(
      { _id: mongo.ObjectId(postId) },
      {
          $pull: { comments: { _id: mongo.ObjectId(commentId) } },
      }
  );

  if (result.modifiedCount == 1) {
      res.statusCode = 201;
      res.send();

  } else {
      res.statusCode = 500;
      res.json({
          status: 'fail',
      });
  }
});

//ADD A COMMENT ON A VIDEO
app.post('/videos/:videoid/comments', async (req, res) => {
  let db = await connect();
  let doc = req.body;
  let videoid = req.params.videoid;
  doc._id = mongo.ObjectId();
  doc.posted_at = Date.now();

  let result = await db.collection('videos').updateOne(
      { _id: mongo.ObjectId(videoid) },
      {
          $push: { comments: doc },
      }
  );

  if (result.modifiedCount == 1) {
      res.json({
          status: 'success',
          id: doc._id,
      });

  } else {
      res.statusCode = 500;
      res.json({
          status: 'fail',
      });
  }
});

//DELETE A COMMENT ON A VIDEO
app.delete('/videos/:videoid/comments/:commentId', async (req, res) => {
  let db = await connect();
  let videoid = req.params.videoid;
  let commentId = req.params.commentId;

  let result = await db.collection('videos').updateOne(
      { _id: mongo.ObjectId(videoid) },
      {
          $pull: { comments: { _id: mongo.ObjectId(commentId) } },
      }
  );

  if (result.modifiedCount == 1) {
      res.statusCode = 201;
      res.send();
      
  } else {
      res.statusCode = 500;
      res.json({
          status: 'fail',
      });
  }
});

app.listen(port, () => console.log(`Using port ${port}!`))