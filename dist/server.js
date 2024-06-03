'use strict';
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var ws_1 = require("ws");
var gameplay_1 = require("./gameplay");
var utils_1 = require("./utils");
var gameplay_server_1 = require("./gameplay-server");
var express = require("express");
var path = require("path");
var cors = require("cors");
var http_1 = require("http");
var connections = [];
var app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, '../public/')));
var httpServer = (0, http_1.createServer)(app);
httpServer.listen(3001);
var _a = (0, gameplay_server_1.useGameplayServer)(), getID = _a.getID, updateBoard = _a.updateBoard, updatePlayers = _a.updatePlayers, updateTurn = _a.updateTurn, updateScore = _a.updateScore;
var gameplay = (0, gameplay_1.useGameplay)();
var server = new ws_1.WebSocketServer({ server: httpServer });
var stringify = (0, utils_1.useUtils)().stringify;
server.on('connection', function (socket, _server, req) {
    /**
     * new connections initialize
     *
     */
    socket.id = getID();
    addConnection(socket);
    socket.send("on-connect", { id: socket.id });
    socket.on("message", function (data, _isBinary) {
        var dataClient = bindData(data);
        var connection;
        if (typeof dataClient != 'undefined') {
            switch (dataClient.key) {
                case 'wants-connection-id':
                    socket.send(stringify("on-connect", { id: socket.id }));
                    updateBoard(socket, server, true, gameplay.boards);
                    updatePlayers(socket, server, true, gameplay.players);
                    updateTurn(socket, server, true, gameplay.playerTurn);
                    connection = getConnectionById(socket.id, connections);
                    updateScore(socket, server, true, gameplay.score);
                    if (connection)
                        gameplay.setPlayerFromConnection(socket, server, connection);
                    updateConnectionsCount(socket, server, true);
                    break;
                case 'wants-connections-count':
                    updateConnectionsCount(socket, server, false);
                    break;
                case 'wants-board-update':
                    updateBoard(socket, server, false, gameplay.boards);
                    updatePlayers(socket, server, false, gameplay.players);
                    break;
                case 'draw-cell':
                    console.log("🚀 ~ socket.on ~ socket.id:", socket.id);
                    connection = getConnectionById(socket.id, connections);
                    if (connection)
                        gameplay.setPlayerFromConnection(socket, server, connection);
                    gameplay.playerDraw(socket, server, dataClient.data);
                    break;
                default:
                    break;
            }
        }
    });
    socket.on("close", function () {
        console.log("disconnected", socket.id);
        gameplay.removeIfConnectionIsPlayer(socket, server, connections);
        removeConnection(socket);
        updateConnectionsCount(socket, server);
    });
});
var bindData = function (data) {
    if (typeof data === 'string') {
        try {
            return JSON.parse(data);
        }
        catch (_error) {
            return undefined;
        }
    }
    else {
        try {
            var buff = Buffer.from(data);
            return JSON.parse(buff.toString());
        }
        catch (_error) {
            return undefined;
        }
    }
};
var addConnection = function (socket) {
    var connection = {
        created_at: new Date().getTime(),
        id: socket.id,
    };
    /**
     * check id
     *
     */
    var connectionIndex = connections.findIndex(function (con) { return con.id === socket.id; });
    if (connectionIndex == -1) {
        connections.push(connection);
    }
    return connection;
};
var removeConnection = function (socket) {
    /**
     * remove from connections
     *
     */
    var indexDisconnect = connections.findIndex(function (con) { return con.id === socket.id; });
    if (indexDisconnect > -1) {
        var tempConnections = connections;
        tempConnections.splice(indexDisconnect, 1);
        connections = __spreadArray([], tempConnections, true);
        tempConnections = undefined;
    }
};
var updateConnectionsCount = function (socket, server, broadcast) {
    var _a;
    if (broadcast === void 0) { broadcast = true; }
    console.log(connections);
    socket.send(stringify("on-connections-update", { count: connections.length, connections: connections }));
    /**
     * broadcast
     */
    if (broadcast) {
        (_a = server.clients) === null || _a === void 0 ? void 0 : _a.forEach(function (client) {
            if (client.readyState === WebSocket.OPEN)
                client.send(stringify("on-connections-update", { count: connections.length, connections: connections }));
        });
    }
};
var getConnectionById = function (id, connections) {
    var index = connections.findIndex(function (e) { return e.id === id; });
    if (index > -1) {
        return connections[index];
    }
    return null;
};
