require("dotenv").config();
const express = require('express');
const app = express();
// require('./db/conn');
const Register = require('./models/models');
const Nsscontact = require('./models/contactmodel');
const path = require("path");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const auth = require("../middleware/auth")
const port = process.env.PORT || 3000;

const mongoose = require("mongoose")


var multer = require('multer');
const Eventsupload = require('./models/Events');
const MembersModel = require('./models/Members');
const fs = require('fs')
const util = require('util')
const unlinkFile = util.promisify(fs.unlink)
const { uploadFile, getFileStream } = require('./s3')

// EXPRESS SPECIFIC STUFF
app.use('/static', express.static('static')) // For serving static files 
app.use(express.urlencoded({ extended: true })) //To extract the data from the website to the app.js file

// app.use('/css', express.static(path.join(__dirname, '../node_modules/bootstrap/dist/css'))) 
// app.use('/js', express.static(path.join(__dirname, '../node_modules/bootstrap/dist/js'))) 
// app.use('/jq', express.static(path.join(__dirname, '../node_modules/jquery/dist'))) 
app.use(cookieParser())

// PUG SPECIFIC STUFF
app.set('view engine', 'pug') // Set the template engine as pug
app.set('views', path.join(__dirname, '../views')) // Set the views directory



var Storage= multer.diskStorage({
  destination:"./static/eventuploads/",
  filename:(req,file,cb)=>{
    cb(null,file.fieldname+"_"+Date.now()+path.extname(file.originalname));
  }
});

var memberStorage= multer.diskStorage({
  destination:"/tmp/",
  filename:(req,file,cb)=>{
    cb(null,file.fieldname+"_"+Date.now()+path.extname(file.originalname));
  }
});
var memberupload = multer({
  storage:memberStorage
}).single('file');


var upload = multer({
  storage:Storage
}).single('file');


app.get('/images/:key', (req, res) => {
  console.log(req.params)
  const key = req.params.key
  const readStream = getFileStream(key)
  console.log("read = " + JSON.stringify(readStream));

  readStream.pipe(res)
})

app.post('/teamupload', memberupload,async (req, res, next)=> {
  var imageFile=req.file.filename;
  var success =req.file.filename+ " uploaded successfully";
  const file = req.file
  console.log(file)
  
  const result = await uploadFile(file)
  await unlinkFile(file.path)
  var memberDetails= new MembersModel({
    name:req.body.name,
    position:req.body.position,
    fb:req.body.fb,
    twiter:req.body.twiter,
    linkedin:req.body.linkedin,
    imagename:req.file.filename
  });
  
  
  // console.log(req.body)
  if (!req.body.name || !req.body.position|| !req.body.fb|| !req.body.twiter|| !req.body.linkedin || !imageFile) {
    res.status(200).render("teamupload.pug", { 'err': "Please try again" });
  } 
  else {
    await memberDetails.save().then(item => {
      res.status(200).render("teamupload.pug", { 'sucessed': "Member added successfully" })
    }).catch(err => {
      res.status(400).send("unable to save your response try again later");
    });
  }

});

app.get('/teamlist', auth, async (req, res) => {
  await teamlist();
  // console.log(object1);
  res.status(200).render('teamlist.pug', object1);
})


app.post('/eventupload', upload,async (req, res, next)=> {
  var imageFile=req.file.filename;
  var success =req.file.filename+ " uploaded successfully";
  
  const file = req.file
  console.log(file)
  
  const result = await uploadFile(file)
  // console.log(req.body);
  await unlinkFile(file.path)
  var imageDetails= new Eventsupload({
    heading:req.body.heading,
    description:req.body.description,
    imagename:result.key
  });
  
  
  // console.log(req.body)
  if (!req.body.heading || !req.body.description || !imageFile) {
    res.status(200).render("eventupload.pug", { 'err': "Please try again" });
  } 
  else {
    await imageDetails.save().then(item => {
      res.status(200).render("eventupload.pug", { 'sucessed': "Event added successfully" })
    }).catch(err => {
      res.status(400).send("unable to save your response try again later");
    });
  }

});

const eventlist = async () => {
  try {
    const collections = await Eventsupload.find({})  //returning BSON 
    object = { "c": collections }
    if (collections[0] == undefined) {
      object = { "data": collections, "message": "Nothing to show!" }

    }
    else {
      object = { "data": collections, "message": "Contact Queries" }
    }
  } catch (error) {
    console.log(error)
  }

}

const teamlist = async () => {
  try {
    const collections = await MembersModel.find({})  //returning BSON 
    object1 = { "c": collections }
    if (collections[0] == undefined) {
      object1 = { "data": collections, "message": "Nothing to show!" }

    }
    else {
      object1 = { "data": collections, "message": "Contact Queries" }
    }
  } catch (error) {
    console.log(error)
  }

}


app.get('/eventslist', auth, async (req, res) => {
  await eventlist();
  // console.log(object);
  res.status(200).render('eventview.pug', object);
})

app.get('/eventupload',function(req, res, next) {
  
  res.render('eventupload.pug', { title: 'Upload File', success:'' });
  
});

app.get('/teamupload',function(req, res, next) {
  
  res.render('teamupload.pug', { title: 'Upload File', success:'' });
  
});

const showEvents = async () => {
  try {
    const collections = await Eventsupload.find({})  //returning BSON 
    eventsobj = { "c": collections }
    if (collections[0] == undefined) {
      eventsobj = { "data": collections, "message": "Nothing to show!" }

    }
    else {
      eventsobj = { "data": collections}
    }
  } catch (error) {
    console.log(error)
  }

}



// Home Page of NSS
app.get("/", async (req, res) => {
  await showEvents();
  await teamlist();
  // console.log(object1)
  res.status(200).render('index.pug', {"events":eventsobj, "team":object1});
});

// contact section of home page saving form data
app.post('/contact', async (req, res) => {
  var myData = new Nsscontact(req.body);
  console.log(req.body);
  // console.log(myData)
  if (!req.body.email || !req.body.concern || !req.body.phone || !req.body.name) {
    await showEvents();
    await teamlist();
    res.status(200).render("index.pug", { "events":eventsobj, "team":object1,'err': "Please try again" })
  } else {
    await myData.save().then(async(item) => {
      await showEvents();
      await teamlist();
      res.status(200).render("index.pug",{ "events":eventsobj, "team":object1,'sucessed': "Thanks for sending your Query" })
    }).catch(err => {
      res.status(400).send("unable to save your response try again later");
    });
  }
})

app.get("/contact", (req, res) => {
  res.redirect("/#contact");
});

// rendering login page
app.get("/login", (req, res) => {
  res.render("login.pug")
});

// verifying user credentials with database credentials
app.post("/login", async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    const useremail = await Register.findOne({ email: email })
    const isMatch = await bcrypt.compare(password, useremail.password)

    const token = await useremail.generateAuthToken();

    res.cookie("jwt", token, {
      expires: new Date(Date.now() + 30000000),
      httpOnly: true,
      //secure: true
    })

    if (isMatch) {
      res.status(201).redirect("/admin1")
    }
    else {
      res.status(200).render("login.pug", { 'err': "Invalid Credentials" ,"email": req.body.email})
      // res.status(201).redirect("/login")
      // res.status(400).send("invalid credentials")

    }
  } catch (error) {
    res.status(200).render("login.pug", { 'err': "Invalid Credentials" ,"email": req.body.email})
    // res.status(201).redirect("/login")
  }
});

// Function for fetching queries from database and showin in admin panel
const showDocument = async () => {
  try {
    const collections = await Nsscontact.find({})  //returning BSON 
    object = { "c": collections }
    if (collections[0] == undefined) {
      object = { "data": collections, "message": "Nothing to show!" }

    }
    else {
      object = { "data": collections, "message": "Contact Queries" }
    }
  } catch (error) {
    console.log(error)
  }

}

// Function for fetching queries from database and showin in admin panel
const adminlist = async () => {
  try {
    const collections = await Register.find({})  //returning BSON 
    object = { "c": collections }
    if (collections[0] == undefined) {
      object = { "data": collections, "message": "Nothing to show!" }

    }
    else {
      object = { "data": collections, "message": "Contact Queries" }
    }
  } catch (error) {
    console.log(error)
  }

}

// rendering admin page 
app.get('/admin1', auth, async (req, res) => {
  await showDocument();
  res.status(200).render('admin1.pug', object);
})

app.get('/adminlist', auth, async (req, res) => {
  await adminlist();

  res.status(200).render('adminlist.pug', object);
})

// some post request handled here for updating status
app.post("/save/:id/pending", (req, res) => {
  // console.log(req.body);
  // console.log(res)
  const id = req.params.id;
  Nsscontact.findByIdAndUpdate(id, {
    status: "Pending"
  }, err => {
    if (err) return res.send(500, err);
    res.redirect("/admin1");
  });
});

app.post("/save/:id/resolved", (req, res) => {
  // console.log(req.body);
  // console.log(res)
  const id = req.params.id;
  Nsscontact.findByIdAndUpdate(id, {
    status: "Resolved"
  }, err => {
    if (err) return res.send(500, err);
    res.redirect("/admin1");
  });
});

app.post("/save/:id/seen", (req, res) => {
  // console.log(req.body);
  // console.log(res)
  const id = req.params.id;
  Nsscontact.findByIdAndUpdate(id, {
    status: "Seen"
  }, err => {
    if (err) return res.send(500, err);
    res.redirect("/admin1");
  });
});

app.get('/delete/:_id', function (req, res) {
  Nsscontact.findByIdAndDelete(req.params, function (err, results) {
    if (err) {
      return res.send(500, err);
    }
    else {
      res.redirect('/admin1');
    }
  });
});
app.get('/deletemember/:_id', function (req, res) {
  MembersModel.findByIdAndDelete(req.params, function (err, results) {
    if (err) {
      return res.send(500, err);
    }
    else {
      res.redirect('/teamlist');
    }
  });
});

app.get('/deleteadmin/:_id', function (req, res) {
  Register.findByIdAndDelete(req.params, function (err, results) {
    if (err) {
      return res.send(500, err);
    }
    else {
      res.redirect('/adminlist');
    }
  });
});

app.get('/deleteevent/:_id', function (req, res) {
  Eventsupload.findByIdAndDelete(req.params, function (err, results) {
    if (err) {
      return res.send(500, err);
    }
    else {
      res.redirect('/eventslist');
    }
  });
});
// // rendering dance page
// app.get("/dance", auth, (req, res) => {
//   res.render("dance.pug")
// });


// delelting token and removing cookies for current user only
app.get("/logout", auth, async (req, res) => {
  try {
    console.log(req.user)
    try {
      req.user.tokens = req.user.tokens.filter((currentElement) => {
        return currentElement.token !== req.token
      })

    } catch (error) {
      console.log(error)
    }

    res.clearCookie('jwt');
    await req.user.save();

    res.redirect("/login")
  } catch (error) {
    res.status(500).send(error)
  }
});

// deleting tokens from database to logout all users 
app.get("/logoutall", auth, async (req, res) => {
  try {
    console.log(req.user)
    try {
      req.user.tokens = []
    } catch (error) {
      console.log(error)
    }

    res.clearCookie('jwt');
    await req.user.save();

    res.redirect("/login")
  } catch (error) {
    res.status(500).send(error)
  }

});

// rendering add new admin page
app.get("/register", auth, (req, res) => {
  res.render("register.pug")
});

// Posting data of new admin to database
app.post('/register', auth, async (req, res) => {
  try {
    email=req.body.email;
    name=req.body.name;
    phone=req.body.phone;
    if (req.body.password === req.body.confirmPassword) {
      var myData = new Register(req.body);
      // console.log(myData)

      const token = await myData.generateAuthToken();

      // res.cookie("jwt", token, {
      //   expires: new Date(Date.now() + 30000),
      //   httpOnly: true
      // })

      await myData.save()
      res.status(201).redirect("/admin1");
    }
    else {
      var err = "Passwords donot match";
      res.status(200).render("register.pug", { 'err': err, 'email':email,'name':name,'phone':phone});
      // res.send("Passwords Donot Match");
    }
  } catch (error) {
      var email=req.body.email;
      var name=req.body.name;
      var phone=req.body.phone;
      res.status(200).render("register.pug", { 'err': "Cannot Add Admin Try Again", 'email':email,'name':name,'phone':phone});
    // res.status(400).send("unable to save to database");
  }
})


//connecting with mongodb named todo
mongoose.connect( process.env.DATABASE, { useNewUrlParser: true, useUnifiedTopology: true, 'useFindAndModify': false, 'useCreateIndex': true })
    .then(() => app.listen(port, () => {
      console.log(`server is running at port ${port}`);
    }))
    .catch(() => console.log("error in connecting database"));
