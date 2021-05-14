const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");
const EventHubReader = require("./scripts/event-hub-reader.js");
const Message2Device = require("./scripts/message-to-device.js");
const { json } = require("express");

// Configuração
const iotHubConnectionString = "";
const eventHubConsumerGroup = "$Default";

// HTTP Server
const app = express();
app.use(express.static(path.join(__dirname, "public")));
app.use((req, res) => {
  res.redirect("/");
});

const server = http.createServer(app);

// Websocket
const wss = new WebSocket.Server({ server });

const message2Device = new Message2Device(iotHubConnectionString);

wss.on("connection", function (socket) {
  socket.on("message", function (data) {
    console.log(`Receive data ${data}`);
    const json_data = JSON.parse(data);
    message2Device.send_message(json_data['device'], JSON.stringify(json_data['payload']));
  });
});

wss.broadcast = (data) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        console.log(`Sent data ${data}`);
        client.send(data);
      } catch (e) {
        console.error(e);
      }
    }
  });
};

server.listen("8080", () => {
  console.log("Listening on %d.", server.address().port);
});

const eventHubReader = new EventHubReader(
  iotHubConnectionString,
  eventHubConsumerGroup
);

(async () => {
  await eventHubReader.startReadMessage((message, date, deviceId) => {
    try {
      const payload = {
        IotData: message,
        MessageDate: date || Date.now().toISOString(),
        DeviceId: deviceId,
      };
      wss.broadcast(JSON.stringify(payload));
    } catch (err) {
      console.error("Error broadcasting: [%s] from [%s].", err, message);
    }
  });
})().catch();
