"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useGameplayServer = void 0;
var utils_1 = require("./utils");
var ws_1 = require("ws");
var useGameplayServer = function () {
    var stringify = (0, utils_1.useUtils)().stringify;
    var updateBoard = function (socket, server, broadcast, boards) {
        var _a;
        if (broadcast === void 0) { broadcast = true; }
        socket.send(stringify("on-board-update", { boards: boards }));
        /**
         *
         * broadcast
         *
         */
        if (broadcast) {
            (_a = server.clients) === null || _a === void 0 ? void 0 : _a.forEach(function (client) {
                if (client.readyState === ws_1.WebSocket.OPEN)
                    client.send(stringify("on-board-update", { boards: boards }));
            });
        }
    };
    var updateScore = function (socket, server, broadcast, score) {
        var _a;
        if (broadcast === void 0) { broadcast = true; }
        socket.send(stringify("on-score-update", { score: score }));
        /**
         *
         * broadcast
         *
         */
        if (broadcast) {
            (_a = server.clients) === null || _a === void 0 ? void 0 : _a.forEach(function (client) {
                if (client.readyState === ws_1.WebSocket.OPEN)
                    client.send(stringify("on-score-update", { score: score }));
            });
        }
    };
    var resetBoard = function (socket, server, broadcast, boards) {
        var _a;
        if (broadcast === void 0) { broadcast = true; }
        socket.send(stringify("on-board-reset", { boards: boards }));
        /**
         *
         * broadcast
         *
         */
        if (broadcast) {
            (_a = server.clients) === null || _a === void 0 ? void 0 : _a.forEach(function (client) {
                if (client.readyState === ws_1.WebSocket.OPEN)
                    client.send(stringify("on-board-reset", { boards: boards }));
            });
        }
    };
    var updateTurn = function (socket, server, broadcast, turn) {
        var _a;
        if (broadcast === void 0) { broadcast = true; }
        socket.send(stringify("on-turn-update", { turn: turn }));
        /**
         *
         * broadcast
         *
         */
        if (broadcast) {
            (_a = server.clients) === null || _a === void 0 ? void 0 : _a.forEach(function (client) {
                if (client.readyState === ws_1.WebSocket.OPEN)
                    client.send(stringify("on-turn-update", { turn: turn }));
            });
        }
    };
    var announceWinner = function (socket, server, broadcast, turn) {
        var _a;
        if (broadcast === void 0) { broadcast = true; }
        socket.send(stringify("on-winner", { turn: turn }));
        /**
         *
         * broadcast
         *
         */
        if (broadcast) {
            (_a = server.clients) === null || _a === void 0 ? void 0 : _a.forEach(function (client) {
                if (client.readyState === ws_1.WebSocket.OPEN)
                    client.send(stringify("on-winner", { turn: turn }));
            });
        }
    };
    var updatePlayers = function (socket, server, broadcast, players) {
        var _a;
        if (broadcast === void 0) { broadcast = true; }
        socket.send(stringify("on-players-update", { players: players }));
        /**
         *
         * broadcast
         *
         */
        if (broadcast) {
            (_a = server.clients) === null || _a === void 0 ? void 0 : _a.forEach(function (client) {
                if (client.readyState === ws_1.WebSocket.OPEN)
                    client.send(stringify("on-players-update", { players: players }));
            });
        }
    };
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }
    var getID = function () {
        return s4() + s4() + '-' + s4();
    };
    return {
        updateBoard: updateBoard,
        updateTurn: updateTurn,
        getID: getID,
        announceWinner: announceWinner,
        updatePlayers: updatePlayers,
        resetBoard: resetBoard,
        updateScore: updateScore,
    };
};
exports.useGameplayServer = useGameplayServer;
