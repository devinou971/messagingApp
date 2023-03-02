# Messaging App

This project was made for a school project. \
The objective was to create a chat app using NoSQL databases and make some statistics from the results. 

In this readme, you'll find every info you need to run de chatapp. \
There is also a part on creating a MongoDB replicaset if don't know how.

## Summary 

- [Depencies](#dependencies)
- [How to install](#how-to-install)
- [How to use](#how-to-use)
- [Quick MongoDB Replicaset tuto](./replicasetTutorial.md)
- [Bugs that need to be fixed](#bugs-that-need-to-be-fixed)

---
## Dependencies

To create this project, we used Nodejs version `18.12.0`. \
Here are some of the libraries you'll be installing next : 
- Mongoose
- ExpressJS
- SocketIO

Moreover, you'll need databases to store all the messages. \
You'll need a redis database as well as a mongo database. 

---
## How to install 

First clone the repository:
```
git clone https://github.com/devinou971/messagingApp
cd messagingApp
```

Then you'll need to install all the packages that are used : 
```
npm install
```

The next step is to configure the project to work with your databases.
Create an `.env` file witht the folowinf parameters:
- `REDIS_HOST`, to store the ip of the redis database
- `REDIS_PORT`, to store the port of the redis database
- `LISTEN_PORT`, to store the port the express app will be using
- `SOCKET_HOST`, to store the ip of the server that will be used by the clients
- `REPLICASET_HOSTS`, to store all the mongo replicaset you'll be connecting to.
- `REPLICASET_NAME`, to store the name of the replicaset.
- `DB_NAME`, to store the name of the mongo database

Here is an example of `.env` file : 
```js
REDIS_HOST = "192.168.0.2"
REDIS_PORT = 6379
LISTEN_PORT = 3000
SOCKET_HOST = "192.168.0.2"
REPLICASET_HOSTS = "127.0.0.1:30000,127.0.0.1:30001,127.0.0.1:30002,127.0.0.1:30003"
REPLICASET_NAME = "rs0"
DB_NAME = "chatappdb"
```



---
## How to use

To launch the program, you'll need to have your redis database and mongodb replicaset up and running. \
You need to launch the replicaset like this :
```
mongod --port 30001 --dbpath <PATH TO FOLDER>/R0S1 --replSet rs0
mongod --port 30002 --dbpath <PATH TO FOLDER>/R0S2 --replSet rs0
mongod --port 30003 --dbpath <PATH TO FOLDER>/R0S3 --replSet rs0
mongod --port 30003 --dbpath <PATH TO FOLDER>/ABR --replSet rs0

```
Then all you have to do is : 
```
npm run dev
```

---
## Bugs that need to be fixed


