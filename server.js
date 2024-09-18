// Load required modules
const http = require("http"); // http server core module
const path = require("path");
const express = require("express"); // web framework external module
const socketIo = require("socket.io"); // web socket external module
const easyrtc = require("open-easyrtc"); // EasyRTC external module

const FIX_COORD_ROTATION = -90;

const fs = require('fs');
// require("dotenv").config();
// const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");
// // const bodyParser = require('body-parser');

const FILE_NAME = 'data_store.json'; // database name

// Set process name
process.title = "networked-aframe-server";

// Get port or default to 8080
const port = process.env.PORT || 8080;

// Setup and configure Express http server.
const app = express();
app.use(express.static("public"));

// Start Express http server
const webServer = http.createServer(app);
//
//
//
//
// Start Socket.io so it attaches itself to Express server
const socketServer = socketIo.listen(webServer, { "log level": 1 });
const myIceServers = [
    { "urls": "stun:stun1.l.google.com:19302" },
    { "urls": "stun:stun2.l.google.com:19302" },
    // {
    //   "urls":"turn:[ADDRESS]:[PORT]",
    //   "username":"[USERNAME]",
    //   "credential":"[CREDENTIAL]"
    // },
    // {
    //   "urls":"turn:[ADDRESS]:[PORT][?transport=tcp]",
    //   "username":"[USERNAME]",
    //   "credential":"[CREDENTIAL]"
    // }
];
easyrtc.setOption("appIceServers", myIceServers);
easyrtc.setOption("logLevel", "debug");
easyrtc.setOption("demosEnable", false);

// Overriding the default easyrtcAuth listener, only so we can directly access its callback
easyrtc.events.on("easyrtcAuth", (socket, easyrtcid, msg, socketCallback, callback) => {
    easyrtc.events.defaultListeners.easyrtcAuth(socket, easyrtcid, msg, socketCallback, (err, connectionObj) => {
        if (err || !msg.msgData || !msg.msgData.credential || !connectionObj) {
            callback(err, connectionObj);
            return;
        }

        connectionObj.setField("credential", msg.msgData.credential, { "isShared": false });

        console.log("[" + easyrtcid + "] Credential saved!", connectionObj.getFieldValueSync("credential"));

        callback(err, connectionObj);
    });
});

// To test, lets print the credential to the console for every room join!
easyrtc.events.on("roomJoin", (connectionObj, roomName, roomParameter, callback) => {
    console.log("[" + connectionObj.getEasyrtcid() + "] Credential retrieved!", connectionObj.getFieldValueSync("credential"));
    easyrtc.events.defaultListeners.roomJoin(connectionObj, roomName, roomParameter, callback);
});

// Start EasyRTC server
easyrtc.listen(app, socketServer, null, (err, rtcRef) => {
    console.log("Initiated");

    rtcRef.events.on("roomCreate", (appObj, creatorConnectionObj, roomName, roomOptions, callback) => {
        console.log("roomCreate fired! Trying to create: " + roomName);

        appObj.events.defaultListeners.roomCreate(appObj, creatorConnectionObj, roomName, roomOptions, callback);
    });
});





// Middleware to parse request body
// app.use(bodyParser.json());

app.use(express.json());       
app.use(express.urlencoded({extended: true}));

// Create operation
app.post('/api/create', (req, res) => {
  const data = readDataFromFile();
  // data.length + 1 || 1;
  const cursor = dataStoreGetLastItemID(data) + 1;
  
  const item = req.body;
  
  console.log(req.body);
  // console.log(req);
  //console.log(req.headers);
  
  let insert = Object.assign(item, {id:cursor});
  
  // const newItem = ;
  data.push(insert);
  saveDataToFile(data);
  res.send({"message": 'Item added successfully.'});
});

// Read operation

app.get('/api/read', (req, res) => {
  const data = readDataFromFile();
  
  if (!req.params.id) {
    res.send(data);  
  }
});

function getTourData(id) {
  const data = readDataFromFile();
  
  if (!id) {
    return data;  
  }
  
  const item = data.find((item) => item.id === parseInt(id));
  
  if (item) {
    return item;
  }
}

app.get('/api/read/:id', (req, res) => {
  const item = getTourData(parseInt(req.params.id));
  
  console.log(item);
  
  if (item) {
    res.send(item);
  } else {
    res.status(404).send({ 'message': 'Item não encontrado.' });
  }
});

// Update operation
app.put('/api/update/:id', (req, res) => {
  const data = readDataFromFile();
  const index = data.findIndex((item) => item.id === parseInt(req.params.id));
  if (index !== -1) {
    
    let dataToUpdate = req.body;
    
    delete dataToUpdate.id; // remove a chave ID do objeto de atualização
    
    data[index] = Object.assign(data[index], req.body);
    
    saveDataToFile(data);
    res.send({"message": 'Item atualizado com sucesso.'});
  } else {
    res.status(404).send({"message": 'Item não encontrado.'});
  }
});

// Delete operation
app.delete('/api/delete/:id', (req, res) => {
  const data = readDataFromFile();
  //
  const index = data.findIndex((item) => item.id === parseInt(req.params.id));
  //const index = 1;
  
  if (index !== -1) {
    data.splice(index, 1);
    saveDataToFile(data);
    res.send({"message": 'Item deletado com sucesso.'});
  } else {
    res.status(404).send('Item não encontrado.');
  }
});

// Utility functions to read/write data from/to file
function readDataFromFile() {
  try {
    const data = fs.readFileSync(FILE_NAME, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

function saveDataToFile(data) {
  fs.writeFileSync(FILE_NAME, JSON.stringify(data), 'utf8');
}

function dataStoreGetLastItemID (dataStore) {
  if (dataStore.length) {
    let ids = dataStore.map(item => item.id);
    let max = Math.max(...ids);
    return max;
    
  } else {
    return 0
  }
  
}

// 

   
    
function calcMarkerRotation(coord, skyRotation) {
  // Alinha a face do elemento de link sempre de frente ao eixo Y, na posição 0, onde o usuário está
  let [x,y,z] = coord.split(" ");

  // Calcula o ângulo em radianos entre o vetor (x, z) e o eixo Z
  const anguloRadianos = Math.atan2(x, z); // atan2(x, z) retorna o ângulo no intervalo (-π, π)
  const imageYRotation = parseInt(skyRotation.split(" ")[1]);

  // Converte o ângulo para graus
  const anguloGraus = anguloRadianos * (180 / Math.PI);

  // Ajusta o ângulo para que corresponda ao padrão de rotação da imagem, com a correção de -90
  let rotacaoY = anguloGraus + imageYRotation + FIX_COORD_ROTATION // FIX_COORD_ROTATION em main.js

  // Para os exemplos dados, a rotação ao longo dos eixos X e Z é sempre 0
  const rotacaoX = 0;
  const rotacaoZ = 0;

  return [rotacaoX, rotacaoY, rotacaoZ].join(" ");
}


app.set('view engine', 'html');
app.engine('html', require('ejs').renderFile);

app.get('/tour/:id?', (req, res) => {
  let id = parseInt(req.params.id)
  
  if (isNaN(id)) {
    id = 1;
  }
  
  const item = getTourData(id);
  
  if (item.markers) {
    item.markers.forEach((marker, index) => {
      item.markers[index]["rotation"] = calcMarkerRotation(marker.position, item.image_rotation);
    })
  }
  
  res.render(__dirname + "/public/tour.html", {tour: item});
});

app.get('/', (req, res) => {
  res.redirect("/editor");
});

app.get('/editor', (req, res) => {
  res.render(__dirname + "/public/editor.html");
});


// Listen on port
webServer.listen(port, () => {
    console.log("listening on http://localhost:" + port);
});