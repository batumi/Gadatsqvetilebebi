ElasticSearch Extraction
========================

Install the ingester:

https://www.elastic.co/guide/en/elasticsearch/plugins/current/ingest-attachment.html


## Create the index 

```
export SEARCH_URL=http://localhost:9200
```


```bash
./create_index.sh sarchelebi
```

If you want to remove the index 

```bash
curl -X DELETE $SEARCH_URL/sarchelebi
```

Index documents

```bash
./index_files.sh /Users/username/path/to/files doc sarchelebi

```


Index one document

```bash
cd /Users/username/path/to/files
filename=555_07_05_2013.doc
result=`openssl base64 -in $filename | sed -e ':a' -e 'N' -e '$!ba' -e 's/\n//g'`
echo $result
curl -X PUT -H "Content-Type: application/json" -d @- "$SEARCH_URL/$dbname/datum/$filename?pipeline=attachment&pretty=true" <<CURL_DATA
{ "raw": "$result" }
CURL_DATA
```

## Search the index 

```bash
curl -X GET "$SEARCH_URL/$dbname/_search?pretty=true" -d'
{
  "_source": ["original"],
  "query": {
    "match": {
      "original.language": "lt"
    }
  },
  "highlight": {
    "fields": {}
  }
}'
```

```bash
curl -X GET "$SEARCH_URL/$dbname/_search?pretty=true" -d'
{
  "_source": ["original"],
  "query": {
    "match": {
      "original.content": "გთხოვთ"
    }
  }
}'
```


## Get documents

Get all documents

```bash
curl "$SEARCH_URL/$dbname/_search?stored_fields=_source.original&pretty=true"
```


Retrieve one document

```bash
cd files/$dbname
filename=555_07_05_2013.doc
basename="${filename%.*}"
curl "$SEARCH_URL/$dbname/datum/$filename?_source=original&pretty=true"  > $basename.json
```


Replace one raw text file

```bash
filename=555_07_05_2013.json
basename="${filename%.*}"
grep "\"content\" : "  $filename | sed  -e  's/^.*"content" : "//g' | sed  -e  's/",$//g' | sed  -e  's/\\t/ /g' | sed  -e  's/\\[rn]/\
/g' > $basename.txt
```


## Update text files

```bash
./extract_text.sh /Users/username/path/to/files doc sarchelebi
```


## Other index examples

```bash
Index base64 
curl -X PUT "$SEARCH_URL/sarchelebi/datum/from_base64?pipeline=attachment&pretty=true" -d'
{
  "raw": "e1xydGYxXGFuc2kNCkxvcmVtIGlwc3VtIGRvbG9yIHNpdCBhbWV0DQpccGFyIH0="
}'

Index raw from base64
result=`openssl base64 -in temp.txt`
echo $result
curl -X PUT "$SEARCH_URL/sarchelebi/datum/fromraw?pipeline=attachment&pretty=true" -d "{
  \"raw\"  : \"$result\"
}"

Index larger raw fails 
result=`openssl base64 -in 1376314887_1358519941_11.txt | sed -e ':a' -e 'N' -e '$!ba' -e 's/\n//g'`
echo "{
  \"raw\"  : \"$result\"
}"
curl -X PUT "$SEARCH_URL/sarchelebi/datum/fromlargerraw?pipeline=attachment&pretty=true" -d "{
  \"raw\"  : \"$result\"
}"

Index larger pdf fails 
result=`openssl base64 -in 1376314887_1358519941_11.pdf | sed -e ':a' -e 'N' -e '$!ba' -e 's/\n//g'`
echo $result
curl -X PUT "$SEARCH_URL/sarchelebi/datum/fromlargerraw?pipeline=attachment&pretty=true" -d "{
  \"raw\"  : \"$result\"
}"      

```


## Resources

* https://gist.github.com/karmi/5594127
* https://www.elastic.co/guide/en/elasticsearch/reference/current/analysis-lang-analyzer.html
* http://stackoverflow.com/questions/37861279/how-to-index-a-pdf-file-in-elasticsearch-5-0-0-with-ingest-attachment-plugin
