#!/bin/bash

directory=$1
extension=$2
dbname=$3

echo "Retrieve documents"
cd $directory
for filename in *.$extension;
do
  echo "Processing $filename";
  basename="${filename%.*}"
  curl "$SEARCH_URL/$dbname/datum/$filename?_source=original&pretty=true"  > $basename.json
done;

echo "Update text files"
for filename in *.json;
do
  echo "Processing $filename";
basename="${filename%.*}"
grep "\"content\" : "  $filename | sed  -e  's/^.*"content" : "//g' | sed  -e  's/",$//g' | sed  -e  's/\\t/ /g' | sed  -e  's/\\[rn]/\
/g' > $basename.txt
done;
