// export GCLOUD_PROJECT='cloudfunctionstest-xxx'
// export GOOGLE_APPLICATION_CREDENTIALS='/Users/lukasz/xxx/CloudFunctionsTest-xxx.json'
const Storage = require('@google-cloud/storage');
const PubSub = require('@google-cloud/pubsub');
const Jimp = require('jimp');

var storage = null;
var pubsub = null;
if (process.env.FUNCTION_NAME) {
  console.log('Running on Google Cloud Platform');
  // running on GC - authentication handled out of the box
  pubsub = PubSub();
  storage = Storage();
} else {
  console.log('Running locally');
  console.log(`Using GCLOUD_PROJECT => ${process.env.GCLOUD_PROJECT}`);
  console.log(`Using GOOGLE_APPLICATION_CREDENTIALS => ${process.env.GOOGLE_APPLICATION_CREDENTIALS}`);
  pubsub = PubSub({
    projectId: process.env.GCLOUD_PROJECT,
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
  });
  storage = Storage({
    projectId: process.env.GCLOUD_PROJECT,
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
  });
}

var topic = pubsub.topic('vision-for-gaming-image-recognition');

exports.splitter = function splitter (event, callback) {
  const file = event.data;

  console.log('Detected file change');
  console.log(file);
  processFile(file)
    .then(function (data) {
      console.log('Messages published');
      console.log(data[1]);
    })
    .then(callback)
    .catch(function (err) {
      console.error(err);
      callback();
    });
};

function processFile(file) {

  if (file.resourceState === 'not_exists') {
    return Promise.reject(`File ${file.name} deleted.`);
  }

  function splitFile(data) {
    console.log('File download completed');
    var contents = data[0];
    return Jimp.read(contents).then(function (screenshot) {
      const overlap = 20;
      const sizeX = 130;
      const sizeY = 130;

      var startX = 0;
      var startY = 0;

      const chunksX = Math.ceil(screenshot.bitmap.width / sizeX);
      const chunksY = Math.ceil(screenshot.bitmap.height / sizeY);

      console.log(`ChunksX ${chunksX} ChunksY ${chunksY}`);

      var chunk = 0;
      var messages = [];
      for (var chunkY = 0; chunkY < chunksY; chunkY++) {
        if (chunkY == 0) {
          newSizeY = sizeY + overlap;
          startY = 0;
        } else {
          startY = chunkY * sizeY - overlap;
          if (chunkY == chunksY - 1) {
            newSizeY = screenshot.bitmap.height - startY - 1;
          } else {
            newSizeY = sizeY + overlap + overlap;
          }
        }
        for (var chunkX = 0; chunkX < chunksX; chunkX++) {
          if (chunkX == 0) {
            newSizeX = sizeX + overlap;
            startX = 0;
          } else {
            startX = chunkX * sizeX - overlap;
            if (chunkX == chunksX - 1) {
              newSizeX = screenshot.bitmap.width - startX - 1;
            } else {
              newSizeX = sizeX + overlap + overlap;
            }
          }
          console.log(`${chunk} (${startX},${startY}) [${newSizeX}, ${newSizeY}]`);
          var message = {
            bucket: file.bucket,
            file: file.name,
            chunk: chunk,
            startX: startX,
            startY: startY,
            sizeX: newSizeX,
            sizeY: newSizeY
          };
          chunk++;
          console.log(message);
          messages.push(message);
          // ., function(err) {
          //   if (err) {
          //     console.error(`Could not publish to topic: ${err}`);
          //   }
          // })
        }
      }
      return topic.publish(messages);
    });
  }

  var bucket = storage.bucket(file.bucket);
  var fileRef = bucket.file(file.name);

  return fileRef
    .download()
    .then(splitFile);

}

if (!process.env.FUNCTION_NAME) {
  exports.splitter({
      data: {
        kind: 'storage#object',
        resourceState: 'exists',
        id: 'lukasz-budnik-temp-files/testowy.png/1489785330142666',
        selfLink: 'https://www.googleapis.com/storage/v1/b/lukasz-budnik-temp-files/o/testowy.png',
        name: 'testing_medium.png',
        bucket: 'lukasz-budnik-temp-files',
        generation: '1489785330142666',
        metageneration: '1',
        contentType: 'image/png',
        timeCreated: '2017-03-17T21:15:30.129Z',
        updated: '2017-03-17T21:15:30.129Z',
        storageClass: 'REGIONAL',
        size: '63206',
        md5Hash: 'Mjg5OWY3ZjI3YTc1ZjgzMTc5N2NhOGMwOTY1NWE0MDQ=',
        mediaLink: 'https://www.googleapis.com/storage/v1/b/lukasz-budnik-temp-files/o/testowy.png?generation=1489785330142666&alt=media',
        crc32c: 'Ku8Usg=='
      }
    },
    function() {console.log('callback')}
  );
}
