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

exports.recognition = function recognition (event, callback) {
  const pubsubMessage = event.data;
  const message = JSON.parse(Buffer.from(pubsubMessage.data, 'base64').toString());
  processMessage(message)
    .then(callback)
    .catch(function (err) {
        console.error(err);
        callback();
    });
};

function processImage(money, screenshot, message) {
  console.log('About to start processing');
  console.log(message);
  // iterate over the screenshot
  var sy = message.startY;
  var sx = message.startX;
  var lx = sx + message.sizeX;
  var ly = sy + message.sizeY;
  var step = 10;

  while (sy < ly) {
    // console.log(`y position ${sy}`);
    var found = false;
    var sx = message.startX;
    while (sx < lx) {
      // console.log(`x position ${sx}`);
      var image = new Jimp(money.bitmap.width, money.bitmap.height, function (err, image) {
      });

      // starting from pixel sx and sy copy to smaller image
      var offset = 0;
      screenshot.scan(sx, sy, money.bitmap.width, money.bitmap.height, function (x, y, idx) {
        var data = screenshot.bitmap.data.readUInt32BE(idx, true);
        image.bitmap.data.writeUInt32BE(data, offset, true);
        offset += 4;
      });

      var distance = Jimp.distance(image, money);

      if (distance < 0.1) {
        var diff = Jimp.diff(image, money);
        if (diff.percent < 0.5) {
          // console.log(`distance ${distance} vs. ${diff.percent}`);
          console.log(`found it at ${sx},${sy} in chunk ${message.chunk}`);
          // image.write(`out/out_${sy}_${sx}.png`);
          // skip next money width
          sx += money.bitmap.width;
          found = true;
        } else {
          sx += step;
        }
      } else {
        sx += step;
      }
    }
    if (!found) {
      sy += step;
    } else {
      sy += money.bitmap.height;
    }
  }
}

function returnFirstElement(data) {
  return data[0];
}

function createImage(data) {
  return Jimp.read(data);
}

function processMessage(message) {

  var money = storage
    .bucket('lukasz-budnik-temp-files').file('money.png')
    .download()
    .then(returnFirstElement)
    .then(createImage);

  var screenshot = storage
    .bucket(message.bucket).file(message.file)
    .download()
    .then(returnFirstElement)
    .then(createImage);

  return Promise
    .all([money, screenshot])
    .then(function(data) {
          processImage(data[0], data[1], message);
      });
}

if (!process.env.FUNCTION_NAME) {

  var message = {
    bucket: 'lukasz-budnik-temp-files',
    file: 'testing_medium.png',
    chunk: 1,
    startX: 110,
    startY: 0,
    sizeX: 170,
    sizeY: 150
  };

  var pubsubMessage = {
    data: Buffer.from(JSON.stringify(message)).toString('base64')
  };

  var event = {
    data: pubsubMessage
  };

  exports.recognition(event, function(){console.log('callback')});

}
