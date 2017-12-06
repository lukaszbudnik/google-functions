#!/bin/bash
FUNCTION_NAME=splitter
gcloud beta functions deploy $FUNCTION_NAME --stage-bucket lukasz-budnik-cloud-functions --trigger-bucket lukasz-budnik-temp-files
