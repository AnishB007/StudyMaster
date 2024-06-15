import { createRequire } from 'module';
const require = createRequire(import.meta.url);
// to avoid "SyntaxError: Cannot use import statement outside a module" error
//used above two line of statements and added "type": "module",in package.json

const express = require('express');
const mongoose = require('mongoose');
const Grid = require('gridfs-stream');
const bodyParser = require('body-parser');
const { mongoURI } = require('./config/keys'); // Update with your MongoDB URI
const Document = require('./models');

const app = express();
//use cors to enable cors origin requests
app.use(cors());

//use express.json() to handle request json data 
app.use(express.json())


//connect to mongoDB 
mongoose.connect("mongodb://localhost:27017/materials_db")

const conn = mongoose.connection;
let gfs;

conn.once('open', () => {
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection('uploads');
  console.log('Mongodb connection open and GridFS initialized.');
});

//model
const studentbasicinfo = new mongoose.Schema({
    title: String,
    pdf: { type: mongoose.Schema.Types.ObjectId, ref: 'uploads.files' }, 
    videoLink: String,
    sem: String,
    year: String,
    subject: String,
    name: String,
    email: String,
    mobno: Number,
    class: String,
    section: String,
    rollno: Number,
    fathername: String,
    mothername: String,
    sex: String,
    address: String
})

const studentbasicinfomodel = mongoose.model("studentbasicinfo", studentbasicinfo)


app.post('/getdata', (req, res) => {

 try{   
    let year = req.body.year;
    let sem = req.body.sem;
    let sub = req.body.sub;

    let records = studentbasicinfomodel.find({'year': year, 'sem': sem, 'subject': sub})

    if(records.length){
        gfs.files.findOne({ _id: doc.document }, (err, file) => {
            if (!file || file.length === 0) {
              return res.status(404).send('File not found');
            }
            const readstream = gfs.createReadStream({ _id: file._id });
      
            res.set('Content-Type', 'application/pdf');
            const bufs = [];
            readstream.on('data', (chunk) => {
              bufs.push(chunk);
            });
      
            readstream.on('end', () => {
              const pdfBuffer = Buffer.concat(bufs);
      
              res.status(200).json({
                videoLink: doc.videoLink,
                pdfData: pdfBuffer.toString('base64') 
              });
            });
      
            readstream.on('error', (err) => {
              console.error(err);
              res.status(500).send('Error reading the PDF file');
            });
          });
    }else{
        res.status.apply(404).json({
            status: 404,
            message: "Record not found."
        })
    }
}catch(e){
    res.status(500).json({        
        status: 500,
        message: "Internal Server Error!"
})
}

});

app.listen(3001, ()=>{
    console.log("Server is running at port ", 3001 + ", " + process.env.url)
});