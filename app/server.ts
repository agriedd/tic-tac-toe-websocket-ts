'use strict';

import { Server, WebSocketServer } from "ws";
import { Cell, Connection, Player, Side } from "types/IGameBoard";
import { useGameplay } from "./gameplay";
import { useUtils } from "./utils";
import { useGameplayServer } from "./gameplay-server";
import * as express from "express";
import * as path from 'path';
import * as cors from 'cors';
import { createServer } from 'https';

let connections: Connection[] = [];

const app = express();
app.use(cors())
app.use(express.static(path.join(__dirname, '/public')));

const httpServer = createServer(app);

const { getID, updateBoard, updatePlayers, updateTurn, updateScore } = useGameplayServer()
const gameplay = useGameplay()

const server: Server = new WebSocketServer({server: httpServer})

const { stringify } = useUtils()

server.on('connection', function (socket, _server, req) {

  /**
   * new connections initialize
   * 
   */
  socket.id = getID()

  addConnection(socket)

  socket.send("on-connect", { id: socket.id });

  socket.on("message", (data, _isBinary) => {


    const dataClient = bindData(data)
    let connection
    if (typeof dataClient != 'undefined') {

      switch (dataClient.key) {
        case 'wants-connection-id':
          socket.send(stringify("on-connect", { id: socket.id }));

          updateBoard(socket, server, true, gameplay.boards)
          updatePlayers(socket, server, true, gameplay.players)
          updateTurn(socket, server, true, gameplay.playerTurn)

          connection = getConnectionById(socket.id, connections)
          updateScore(socket, server, true, gameplay.score)

          if (connection)
            gameplay.setPlayerFromConnection(socket, server, connection);

          updateConnectionsCount(socket, server, true)

          break;
        case 'wants-connections-count':
          updateConnectionsCount(socket, server, false)
          break;
        case 'wants-board-update':
          updateBoard(socket, server, false, gameplay.boards)
          updatePlayers(socket, server, false, gameplay.players)
          break;
        case 'draw-cell':

          console.log("🚀 ~ socket.on ~ socket.id:", socket.id)
          connection = getConnectionById(socket.id, connections)

          if (connection)
            gameplay.setPlayerFromConnection(socket, server, connection);
          gameplay.playerDraw(socket, server, dataClient.data as { x: Cell, y: Cell })
          break;

        default:
          break;
      }

    }

  });

  socket.on("close", () => {

    console.log("disconnected", socket.id);

    gameplay.removeIfConnectionIsPlayer(socket, server, connections);
    removeConnection(socket);

    updateConnectionsCount(socket, server);

  });

})

const bindData = (data: ArrayBuffer | Buffer | string): { key: string, data: object } | undefined => {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data)
    } catch (_error) {
      return undefined
    }
  } else {
    try {
      const buff = Buffer.from(data);
      return JSON.parse(buff.toString())
    } catch (_error) {
      return undefined
    }
  }
}

const addConnection = (socket: WebSocketServer): Connection => {

  let connection = {
    created_at: new Date().getTime(),
    id: socket.id,
  };

  /**
   * check id
   *
   */
  let connectionIndex = connections.findIndex((con) => con.id === socket.id);

  if (connectionIndex == -1) {
    connections.push(connection);
  }

  return connection
}

const removeConnection = (socket: WebSocketServer) => {
  /**
   * remove from connections
   *
   */
  const indexDisconnect = connections.findIndex((con) => con.id === socket.id);

  if (indexDisconnect > -1) {
    let tempConnections: Connection[] | undefined = connections;
    tempConnections.splice(indexDisconnect, 1);
    connections = [...tempConnections];
    tempConnections = undefined;
  }
};


const updateConnectionsCount = (socket, server, broadcast: boolean = true) => {
  console.log(connections);

  socket.send(stringify("on-connections-update", { count: connections.length, connections }));
  /**
   * broadcast
   */
  if (broadcast) {
    server.clients?.forEach(client => {
      if (client.readyState === WebSocket.OPEN)
        client.send(stringify("on-connections-update", { count: connections.length, connections }))
    });
  }
};

const getConnectionById = (id: string, connections: Connection[]): Connection | null => {

  const index = connections.findIndex(e => e.id === id)
  if (index > -1) {
    return connections[index]
  }
  return null

}

httpServer.listen(443, function () {});
