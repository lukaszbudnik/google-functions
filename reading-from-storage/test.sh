#!/bin/bash

which yq &> /dev/null

if [ $? -ne 0 ]; then
  pip install yq
fi

url=$(gcloud alpha functions describe reader | yq '.httpsTrigger.url' | tr -d "\"")

response=$(curl \
  -i -s \
  -X POST \
  -H "Content-Type:application/json" \
  --data '{"file":"package.json", "bucket": "lukasz-budnik-temp-files"}' \
  $url)

execution_id=$(echo "$response" | grep function-execution-id | awk {'print $2'} | tr -d '\r')

echo "$response"
echo

delay=10

echo "Fetching logs for execution: $execution_id"

# sleep 10

while true; do
  logs=$(gcloud alpha functions logs read reader --execution-id $execution_id)
  if [ ! -z "$logs" ]; then
    echo "$logs" | grep -q 'Listed 0 items'
    if [ $? -eq 1 ]; then
      break;
    fi
  fi
  sleep 2
done

echo "$logs"
