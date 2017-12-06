# google-functions

A set of Google Functions sample projects.

All projects were written when Google Functions were in private invite-only alpha stage. I pushed them to GitHub in early December 2017 while I was doing housekeeping of my MacBook. Please note that some features used in these projects may not be available now.

# vision-for-gaming projects

The most interesting projects are vision-for-gaming. I had an idea of writing a robot which would collect money in my children's tablet game. The idea was simple:

1. Arduino robot scrolls the tablet
2. Android takes a screenshot and uploads it to Google Storage
3. Google Functions detects uploaded file, computes coordinates of image chunks, sends the coordinates to Google PubSub
4. Google Functions consumes message from PubSub and runs image recognition (simple moving window) and looks for a money icon
5. Upon detecting Google Functions send coordinates of detected image to Google Cloud Messaging
6. Android receives message from Google Cloud Messaging and via bluetooth sends it to Arduino robot
7. Arduino robot taps on the icon

Steps 1-7 to be executed in the loop. In this GitHub repo you will find the Google Functions part. If you are interested in how to do Android-Arduino bluetooth communication using Google Cloud Messaging you can view my tutorials on hackster.io. Here is how to build a voice controlled robot: https://www.hackster.io/lukaszbudnik/voice-controlled-robot-ebbacf (Alexa) or https://www.hackster.io/lukaszbudnik/voice-controlled-robot-google-cloud-services-94d9a8 (Google Speech).

But getting back to vision-for-gaming projects:

* vision-for-gaming-splitter - Google Functions project that detects an image uploaded to Google Storage, splits the image into smaller parts by computing coordinates of smaller chunks, sends the coordinates to Google PubSub
* vision-for-gaming-image-recognition - Google Functions project that consumes messages from PubSub and performs the image recognition itself

When I ran my first implementation of image recognition on my local machine it was taking 17 minutes. When I re-designed my solution to fully leverage distributed computing and the power of Google Functions I was able to reduce execution time to less than a half a minute. Over 34 times faster. I suspect that with an additional level of parallelism (more chunks) I could reduce the time even further. But the point was already proven :)
