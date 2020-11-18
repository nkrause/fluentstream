var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors')
var cron = require('node-cron');
var fileUpload = require('express-fileupload');
var fs = require('fs');
var readline = require('readline');
var IPRouter = require('ip-router');
var ipRouter = new IPRouter({});

const moment = require('moment');

// checks if a single IP address is valid
const isValidIP = (ip) => {
  if (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ip)){
    return true;
  }
  return false;
}

// helper function to populate the router with IP addresses
const populateRouter = () => {  
  // create a temporary router
  let _ipRouter = new IPRouter({});

  // create an interface to read the file
  const readInterface = readline.createInterface({
    input: fs.createReadStream('public/ipsets.txt'),
    console: false
  });

  // read the file line by line and populate the IPRouter
  readInterface.on('line', function(line) {
    // skip empty or commented lines
    if(line && line.indexOf('#') < 0){
      _ipRouter.insert(line, 'true');
    }
  });

  readInterface.on('close', () => {
    // clear the entries from the existing router
    ipRouter.clear();

    // update the router
    ipRouter = _ipRouter;
    _ipRouter = null;
  })
}

// initialize the router
populateRouter();

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// custom
app.use(cors()); // it enables all cors requests
app.use(fileUpload());

// user uploaded a file on the client app
app.post('/upload', (req, res) => {    
    if (!req.files) {
      return res.status(500).send({ msg: "file is not found" })
    }
      // accessing the file
      const myFile = req.files.file; 

      //  mv() method places the file inside public directory
      myFile.mv(`${__dirname}/public/${myFile.name}`, function (err) {
        if (err) {
          return res.status(500).send({ msg: "Error occured" });
        }
  
        // use a Set so there are no duplicates in the results 
        let ipMatches = new Set();

        // create an interface to read the file
        const readInterface = readline.createInterface({
          input: fs.createReadStream(`public/${myFile.name}`),
          console: false
        });
    
        // read the file line by line and push any matches to result
        readInterface.on('line', function(line) {
          // check if the IP is valid before trying to match, 
          // otherwise an error is thrown and the server app stops
          if(isValidIP(line)){
            if(ipRouter.route(line)){
              ipMatches.add(line);
            }
          }       
        });
  
        // close the file
        readInterface.on('close', () => {
          // remove the file
          fs.unlink(`public/${myFile.name}`, (err) => {
            if (err) {
              console.error(err)
              return
            }
            //file removed
          })

          // return the result
          return res.send({ipMatches: [...ipMatches]});
        })
      });  
})

// user is checking a single IP from the client app or a list of IPs from a POST request 
app.post('/check-ip', (req, res) => {  
  console.log('/check-ip:'+ipRouter.size());  
  const ipList = req.body.ipList;

  // use a Set so there are no duplicates in the results 
  let ipMatches = new Set();

  // check that the ipList param exists and the list isn't empty
  if(ipList && ipList.length > 0){
    ipList.forEach(ip => {
      // found a match - add it to the list to send back
      if(ipRouter.route(ip)){
        ipMatches.add(ip);
      }
    });

    // return the result
    return res.send({'ipMatches':[...ipMatches]});
  }
  // user sent an empty list, nothing to check
  else if(ipList && ipList.length == 0){
    res.status(500).send({ msg: "Error: parameter 'ipList' empty" })
  }

  // bad input
  return res.status(500).send({ msg: "Error: missing parameter 'ipList'" })
})

// catch 404 and forward to error handler
// app.use(function(req, res, next) {
//   next(createError(404));
// });

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// schedule tasks to be run on the server.
cron.schedule('59 * * * *', function() {
  // update the router
  populateRouter();
});

module.exports = app;
