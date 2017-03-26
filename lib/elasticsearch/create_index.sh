#!/bin/bash

dbname=$1

echo "Create the $dbname index";
curl -X PUT "$SEARCH_URL/$dbname?pretty=true" -d'
{
  "settings": {
    "index": {
      "number_of_shards": 3,
      "number_of_replicas": 2
    }
  },
  "mappings": { 
    "datum": {
      "properties": {
        "original": {
          "properties": {
            "date": {
              "type": "date"
            },
            "content_type": {
              "type": "text",
              "fields": {
                "keyword": {
                  "ignore_above": 256,
                  "type": "keyword"
                }
              }
            },
            "author": {
              "type": "text",
              "fields": {
                "keyword": {
                  "ignore_above": 256,
                  "type": "keyword"
                }
              }
            },
            "language": {
              "type": "text",
              "fields": {
                "keyword": {
                  "ignore_above": 256,
                  "type": "keyword"
                }
              }
            },
            "content": {
              "type": "text",
              "fields": {
                "keyword": {
                  "ignore_above": 256,
                  "type": "keyword"
                }
              }
            },
            "content_length": {
              "type": "long"
            }
          }
        },
        "raw": {
          "type": "text",
          "fields": {
            "keyword": {
              "ignore_above": 256,
              "type": "keyword"
            }
          }
        }
      }
    }
  }
}'


echo "Create a pipeline";
curl -X PUT "$SEARCH_URL/_ingest/pipeline/attachment?pretty=true" -d'
{
  "description" : "Extract attachment information",
  "processors" : [
    {
      "attachment" : {
        "field" : "raw",
        "target_field": "original",
        "indexed_chars": 2147483600
      }
    }
  ]
}'
