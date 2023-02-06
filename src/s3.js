require('dotenv').config()
const fs = require('fs')
// const S3 = require('aws-sdk/clients/s3')

const AWS = require("aws-sdk");
const s3 = new AWS.S3()

const bucketName = process.env.AWS_BUCKET_NAME
const region = process.env.AWS_BUCKET_REGION
const accessKeyId = process.env.AWS_ACCESS_KEY
const secretAccessKey = process.env.AWS_SECRET_KEY

// const s3 = new S3({
//   region,
//   accessKeyId,
//   secretAccessKey
// })

// uploads a file to s3
function uploadFile(file) {
  const fileStream = fs.createReadStream(file.path)

  const uploadParams = {
    Bucket: bucketName,
    Body: fileStream,
    Key: file.filename
  }

  return s3.upload(uploadParams).promise()
}
exports.uploadFile = uploadFile


// downloads a file from s3
function getFileStream(fileKey) {
  const downloadParams = {
    Key: fileKey,
    Bucket: bucketName
  }

  return s3.getObject(downloadParams).createReadStream()
}
exports.getFileStream = getFileStream

// const express = require('express')
// const app = express()
// const AWS = require("aws-sdk");
// const s3 = new AWS.S3()
// const bodyParser = require('body-parser');

// app.use(bodyParser.json())

// // curl -i https://some-app.cyclic.app/myFile.txt
// app.get('*', async (req,res) => {
//   let filename = req.path.slice(1)

//   try {
//     let s3File = await s3.getObject({
//       Bucket: process.env.BUCKET,
//       Key: filename,
//     }).promise()

//     res.set('Content-type', s3File.ContentType)
//     res.send(s3File.Body.toString()).end()
//   } catch (error) {
//     if (error.code === 'NoSuchKey') {
//       console.log(`No such key ${filename}`)
//       res.sendStatus(404).end()
//     } else {
//       console.log(error)
//       res.sendStatus(500).end()
//     }
//   }
// })


// // curl -i -XPUT --data '{"k1":"value 1", "k2": "value 2"}' -H 'Content-type: application/json' https://some-app.cyclic.app/myFile.txt
// app.put('*', async (req,res) => {
//   let filename = req.path.slice(1)

//   console.log(typeof req.body)

//   await s3.putObject({
//     Body: JSON.stringify(req.body),
//     Bucket: process.env.BUCKET,
//     Key: filename,
//   }).promise()

//   res.set('Content-type', 'text/plain')
//   res.send('ok').end()
// })

