## Getting all pathway uris


For step 1-3, in case of network failure, failures will have to be manually added
e.g
```
failed to create pathway 185
```

means you have to manually run uri entry 185, create 185.json and add the sbgn/jsonld/pathway content manually (empirical failure rate 4 / 6000)

1. get all uris from pathway commons service
   - run get-pathway-data / getAllPathwaySearchHits

2. get all sbgn and all jsonld
   - run get-pathway-data / getAllSbgn, getAllJsonld

3. combine all of the data into a pathways folder
   - run get-pathway-data / generateAllPathways

End result should be a folder called ```pahtways``` which contains 0.json ... n.json n ~= 6000
Rougly 6000 pathway files
This can then be dumped into rethinkdb 

4. TODO create rethinkdb script

5. TODO index pathways by uri(create rest endpoints), index pathways by name (create rest endpoints) 