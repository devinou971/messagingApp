# Quick MongoDB replicaset tutorial

Maybe you're too lazy to find a MongoDB replicaset tutorial online (I know I am) so here is a little tutorial to create a simple replicaset with MongoDB. \
In this tuto, we'll be creating 3 instances to replicate the data and 1 arbiter to manage the nodes. \

First, you'll need to create the 3 nodes.
Create 3 folders to host the database : `R0S1`, `R0S2`, `R0S3`. \
Then choose a name for your replicaset for example : `rs0`. \
Then you'll need to launch the different mongo instances (you'll need 3 terminals) : 
```
mongod --port 30001 --dbpath <PATH TO FOLDER>/R0S1 --replSet <REPLICASET NAME>
mongod --port 30002 --dbpath <PATH TO FOLDER>/R0S2 --replSet <REPLICASET NAME>
mongod --port 30003 --dbpath <PATH TO FOLDER>/R0S3 --replSet <REPLICASET NAME>
```

You will also need to create an arbiter : 
```
mkdir arb
mongod --port 30000 --dbpath <PATH TO FOLDER>/arb --replSet <REPLICASET NAME>
```

You can then connect into the first node with mongosh: 
```
mongosh --port 30001
```

Then you can initiate the replicaset with all the nodes:
```js
conf = {
    _id: "rs0",
    members: [
        {_id: 0, host: "127.0.0.1:30001"},
        {_id: 1, host: "127.0.0.1:30002"},
        {_id: 2, host: "127.0.0.1:30003"}
    ]
};
rs.initiate(conf);
```

Now create the database you'll want to use :
```js
use chatappdb;
```

Then add the arbiter:
```js
db.adminCommand({
    setDefaultRWConcern: 1, 
    defaultReadConcern: {level: "majority"}, 
    defaultWriteConcern: {w: "majority"}
});

rs.addArb("127.0.0.1:30000");
```

And that's it, your good to go !
