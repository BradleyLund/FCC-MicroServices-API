const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')

const mongoose = require('mongoose')
mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true })

var Schema = mongoose.Schema

var SubSchema = mongoose.Schema({
    //your subschema content
    description: String,
    duration: Number,
    date: String 
},{ _id : false });



var UserSchema = new Schema({
  username: String,
  exercise: [SubSchema]
  
})

var User = mongoose.model('User',UserSchema)

// var jessLund = new User({username: "jessLund",exercise: [{description: "push ups",duration:25,date: "Thu Jul 16 2020 07:36:30 GMT+0000 (UTC)"}]})

// jessLund.save(function(err,user) {
//   if (err) {
//     console.log(err)
//   } else {
//     console.log(user)
//   }
// })

// User.findOne({username: "jessLund"},function(err,user) {
//   console.log(user)
// })

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post("/api/exercise/new-user",function(req,res) {
  //check if user already exists
  let name = req.body.username
  
  var findUser = User.findOne({username: name},function(err,user) {
    if (err) {
      console.log(err)
    } else if (user) {
      res.send("That username already exists")
    } else {
      var addUser = new User({username: `${req.body.username}`})
      addUser.save(function(err,user) {
        if (err) {
          console.log(err) 
        } else {
           res.json({"_id":user._id,"username":user.username})
          
        }
      })
      
    }
  })

})

app.get("/api/exercise/users",function(req,res) {
  User.find({}).select('username _id').exec(function(err,users) {
    if (err) {
      console.log(err)
    } else {
      res.json(users)
    }
  })
})

app.post("/api/exercise/add",function(req,res) {
  var userID = req.body.userId
  var description = req.body.description
  var duration = req.body.duration
  var date
  //date format could be the issue
  if (req.body.date) {
    //might need to make sure this is in date format, defos look at the date microservices project
    date = new Date(req.body.date)
    date = date.toDateString()
    
  } else {
    date = new Date()
    date = date.toDateString()
  }
  
  var newExercise = {description: description,duration: duration,date: date}
  //res.json(newExercise)

  var findUser2 = User.findOne({_id: userID},function(err,user) {
    if (err) {
      console.log(err)
    }
    if (user){
      user.exercise.push(newExercise);
      
      // update the records with the new information add new stuff
      user.save(function(err,data) {
        if (err) {
          console.log(err)
        } else {
          res.json({"_id":data._id,"username":data.username,"date":newExercise.date,"duration":parseInt(newExercise.duration),"description":newExercise.description})
          //res.json(data)
        }
      })
    } else {
      res.send("no such username")
    }
  })
  
})
// I can retrieve a full exercise log of any user by getting 
// /api/exercise/log with a parameter of userId(_id). Return will be the user 
// object with added array log and count (total exercise count).

app.get("/api/exercise/log",function(req,res) {
  let userID = req.query.userId
  
  //just manually insert dates and see what works and then use that for the final query .where('exercise.date').gte(dateTest)
  
  User.findOne({"_id":userID}).exec(function(err,data) {
    if (err) {
      console.log(err)
    }
    
    //console.log(req.query.from,req.query.to)
    
    var correctExercise = data.exercise
    if (req.query.from) {
      let fromDate = new Date(req.query.from)
      correctExercise = correctExercise.filter(entry=> {
      let entryDate = new Date(entry.date)
      return entryDate.getTime()>fromDate.getTime()
    })
    }
    
    
    if (req.query.to) {
      let toDate = new Date(req.query.to)
      correctExercise = correctExercise.filter(entry=> {
      let entryDate = new Date(entry.date)
      return entryDate.getTime()<toDate.getTime()
    })
    }
    
    
    
    //console.log(typeof limit,limit)
    if (req.query.limit) {
      var limit = parseInt(req.query.limit)
      correctExercise = correctExercise.splice(limit)
    }
    
    var count = correctExercise.length
    
    // console.log(correctExercise)
    res.json({"_id":userID,"username":data.username,"count":count,"log":correctExercise})
  })
  
  //res.json({"userId": userID,"fromDate": fromDate})
  
  //I guess I need to make an if statement if from to and limit exist and then do a where query attached to the find and then execute or just do the one if those
  //parameters dont exist
  
  //chain the queries and then execute them later!
  
  //my attempt at just getting from right:
  
  
  // var query = User.findOne({"_id":userID})
  
//   if (req.query.from) {
//     let fromDate = new Date(req.query.from)
//     console.log(fromDate)
//     query.find({'exercise.date':{"$gte":fromDate}}).exec(function(err,data) {
//       if (err) {
//         console.log(err)
//       }
      
//       res.json(data)
//     })
    
//   } else {
//     query.exec(function(err,data) {
//       if (err) {
//         console.log(err)
//       }
//       res.json(data)
//     })
//   }
  
//   if (req.query.to) {
//     let toDate = new Date(req.query.to)
//     query.where('exercise.date').lte(toDate).exec(function(err,data){
//       if (err) {
//         console.log(err)
//       }
//       res.json(data)
//     })
//   }
  
//   User.findOne({"_id":userID},function(err,data){
//     if (err) {
//       console.log(err)
//     } else if (data) {
      
      
//       let count = data.exercise.length
//       //res.json(count)
//       res.json({"_id":data._id,"username":data.username,"count":count,"log":data.exercise})
//     } else {
//       res.json({"error":"Invalid ID"})
//     }
    
//   })
  
  
  
  
  
})




// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
