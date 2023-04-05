const cors = require("cors")
const express = require("express")
const mongoose = require("mongoose");
const passport = require("passport")
const bodyParser = require('body-parser')
const BasicStrategy = require("passport-http").BasicStrategy

const dotenv = require('dotenv');
var dotenvExpand = require('dotenv-expand')
var env =dotenv
dotenvExpand.expand(env)
dotenv.config();

const Thread = require("./model/threads");
const Reply = require("./model/replies");
const Like = require("./model/likes");
const User = require("./model/users");
const { response } = require("express");
const { post } = require("./routes/healthcheck.js");
const { findById, db, find } = require("./model/threads");
const req = require("express/lib/request");
const res = require("express/lib/response");

const app = express()
const CONNECTION_STRING = process.env.CONNECTION_STRING
const PORT = process.env.PORT || 3001

mongoose.connect(CONNECTION_STRING, {
   useNewUrlParser: true,
  useUnifiedTopology: true,
});


passport.use(new BasicStrategy(
   function(username, password, done) {
       return done(null, {"username":"password", "nisse":"password"})
   }

))

app.use(passport.initialize())

app.use('/healthcheck', require('./routes/healthcheck.js'));
app.use(express.urlencoded({ extended: true }));
app.use(cors())
app.use(bodyParser.json());

app.get("/", (request, response)=>{
   response.set("http_status",200)
   response.set("cache-control",  "no-cache")
   response.set('Content-Type', 'application/json');
   body={"status": "available"}
   response.status(200).send(body)

   User.create
})



app.get("/threads",  (request, response)=>{
   const threads = Thread.find().then((threads) => {
      response.json(threads)
})
})

app.post("/threads", passport.authenticate('basic', {session: false}), (request, response)=>{
   let thread =new Thread(request.body)
   thread.save()
   response.status(200).json(thread)
})

app.get("/threads/:id", async (request, response)=> {
   let thread
   try{
      thread = await Thread.findById(request.params.id)
   } catch(e){
      response.status(400).send("Bad Request")
   }
   if(thread){
      response.status(200).json(thread)
   }else{
      response.status(404).send("Thread not found")
   }
})


app.get("/threads/:id/replies", async (request, response)=> {
   let thread
   let replies
   try {
      thread = await Thread.findById(request.params.id);
      replies = await Reply.find({_id: thread.replies})
      
      if (replies) {
    
           response.status(200).json(replies) 
       
      } else {
         response.status(404).send("Not found");
      }
   } catch (e){
      response.status(404).send("Bad request "+e)
   }

})


app.post("/threads/:id/replies", passport.authenticate('basic', {session: false}), async (request, response)=> {
   let thread;
   try {
      thread = await Thread.findById(request.params.id);
      if (thread) {
         request.body.time = new Date();
         const reply = new Reply(request.body);
         thread.replies.push(reply);
         await reply.save();
         await thread.save();
         response.status(201).end();
      } else {
         response.status(404).send("Not found"+e);
      }
   } catch (e){
      response.status(404).send("Bad request")
   }

 
})

app.post("/threads/:threadId/replies/:replyId/like", passport.authenticate('basic', {session: false}), async (request, response)=> { 
   let replies;
   try {
      replies = await Reply.findById(request.params.replyId);
      
      if (replies) {
         const likes = new Like({like: true});
         await likes.save();
         replies.likes.push(likes);
         await replies.save();
              
           response.status(200).send(likes) 
       
      } else {
         response.status(404).send("Not found");
      }
   } catch (e){
      response.status(404).send("Bad request "+e)
   }

})

  

app.delete("/threads/:threadId/replies/:replyId/like", passport.authenticate('basic', {session: false}), async (request, response)=> {
  let replies
  
  try{
      replies = await Reply.findById(request.params.replyId);
      const FirstLikesId =  replies.likes[0]
      replies.likes.shift()
      replies.save()
      await Like.deleteOne({_id: FirstLikesId})
      
      response.status(200).send("Success");
  
  }catch (e){
   response.status(404).send("Bad request "+e)
}

})


//curl -X POST http://localhost:3001/users -H "Content-Type: application/json" -d "{\"username\":\"nisse\",\"password\":\"password\"}"
//Create

app.get("/users", passport.authenticate('basic', {session: false}), (request, response)=>{
   const users = User.find().then((users) => {
      response.json(users)
})
})

app.post("/users", passport.authenticate('basic', {session: false}), (request, response) => {
   let user =new User(request.body)
   user.save()
   response.status(200).json(user)
})

app.get("/users/:id", async (request, response)=> {
   console.log(request.params.id)
   try {
      User.findById(request.params.id, (err, user) => {
         if (err) throw error;
         if (user) {
            response.status(200).json(user)
         } else {
            response.status(404).send("Not found")
         }
      })
   } catch (e) {
      console.error(e)
      response.status(400).send("Bad request")
   }
})


app.listen(PORT , ()=>{
     console.log(`STARTED LISTENING ON PORT ${PORT}`)
})


