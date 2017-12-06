var storage = require('@google-cloud/storage')();
// ({
//   projectId: 'cloudfunctionstest-xxx',
//   keyFilename: '/Users/lukasz/xxx/CloudFunctionsTest-xxx.json'
// });

function FileDoesNotExist() { };
function FileUnsupportedContentType() { };

exports.reader = function reader (req, res) {
  if (!req.body.file || !req.body.bucket) {
    res.status(400).json({ error: '"bucket" and "file" parameters are required' });
    return;
  }

  var fileName = req.body.file;
  var bucketName = req.body.bucket;

  var bucket = storage.bucket(bucketName);
  var file = bucket.file(fileName);

  file.exists()
    .then(function(data) {
      var exists = data[0];
      if (!exists) {
        throw new FileDoesNotExist();
      }
      console.log(`File:${bucketName}/${fileName} exists`);
      return file.get();
    })
    .then(function(data) {
      var file = data[0];
      if (file.metadata.contentType != 'application/json') {
        throw new FileUnsupportedContentType();
      }
      console.log(`File:${bucketName}/${fileName} supported type of ${file.metadata.contentType}`);
      return file.download();
    })
    .then(function(data) {
      var contents = data[0];
      var buffer = JSON.parse(contents, (key, value) => {
        return value && value.type === 'Buffer'
          ? Buffer.from(value.data)
          : value;
      });
      console.log(`File:${bucketName}/${fileName} about to be sent`);
      res.json(buffer);
    })
    .catch(function (error) {
      var status = 500;
      var message = `File:${bucketName}/${fileName} Unexpected error occured`;

      if (error instanceof FileDoesNotExist) {
        status = 404;
        message = `File:${bucketName}/${fileName} does not exists`;
      }
      if (error instanceof FileUnsupportedContentType) {
        status = 415;
        message = `File:${bucketName}/${fileName} unsupported content type of ${file.contentType}`;
      }

      console.error(`${message}: ${JSON.stringify(error)}`);
      res.status(status).json({ error: message });
    });
};
