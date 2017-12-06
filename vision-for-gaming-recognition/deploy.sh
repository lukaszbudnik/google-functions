#!/bin/bash
FUNCTION_NAME=recognition
gcloud beta functions deploy $FUNCTION_NAME --stage-bucket lukasz-budnik-cloud-functions --trigger-topic vision-for-gaming-image-recognition
