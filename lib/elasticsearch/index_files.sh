#!/bin/bash

directory=$1
extension=$2
dbname=$3

cd $directory
for filename in *.$extension;
do
  echo "Processing $filename";
  result=`openssl base64 -in $filename | sed -e ':a' -e 'N' -e '$!ba' -e 's/\n//g'`;
  # echo $result;
curl -X PUT -H "Content-Type: application/json" -d @- "$SEARCH_URL/$dbname/datum/$filename?pipeline=attachment&pretty=true" <<CURL_DATA
{ "raw": "$result" }
CURL_DATA
done;
