#!/bin/bash

FUNCTION_NAME=splitter

which yq &> /dev/null

if [ $? -ne 0 ]; then
  pip install yq
fi

trigger_bucket=$(gcloud beta functions describe $FUNCTION_NAME | yq '.eventTrigger.resource')

trigger_bucket=$(echo "$trigger_bucket" | tr -d '"' | awk -F '/' '{print $4}')

gsutil cp ../vision-for-gaming-images/testing_large.png "gs://$trigger_bucket"

echo "Giving GC 60 seconds to propagate events"

sleep 60

gcloud beta functions logs read $FUNCTION_NAME
