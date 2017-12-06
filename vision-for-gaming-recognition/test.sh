#!/bin/bash

FUNCTION_NAME=recognition

which yq &> /dev/null

if [ $? -ne 0 ]; then
  pip install yq
fi

../vision-for-gaming-splitter/test.sh

gcloud beta functions logs read $FUNCTION_NAME
