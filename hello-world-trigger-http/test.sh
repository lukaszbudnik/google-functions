#!/bin/bash

which yq &> /dev/null

if [ $? -ne 0 ]; then
  pip install yq
fi

url=$(gcloud alpha functions describe helloHttp | yq '.httpsTrigger.url' | tr -d "\"")

curl \
  -v \
  -X POST \
  -H "Content-Type:application/json" \
  --data '{"name":"Łukasz Budnik"}' \
  "$url"
