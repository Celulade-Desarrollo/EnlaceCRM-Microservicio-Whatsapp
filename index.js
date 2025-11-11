import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { sendMessage } from "./src/jobs/whatsapp.js";

const app = express();
const server = createServer(app);
const io = new Server(server, {
 cors: { origin: "*" }
});

app.get("/", (req, res) => {
 res.send("Servidor WS activo");
});
const PORT = 6000;
io.on("connection", (socket) => {
 console.log("Cliente conectado:", socket.id);
 socket.on("sendNumber", async (data) => {
   console.log("Número recibido:", data);
   try {
     await sendMessage(data.number, data.message);
     socket.emit("success", "Mensaje enviado correctamente.");
   } catch (err) {
     console.error("Error enviando mensaje:", err);
     socket.emit("error", "Error enviando mensaje.");
   }
 });
});
server.listen(PORT, () => console.log("Servidor WS en puerto " + PORT));