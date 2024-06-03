"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.useGameplay = void 0;
var generator_1 = require("./generator");
var gameplay_server_1 = require("./gameplay-server");
var utils_1 = require("./utils");
var useGameplay = function () {
    var boards = [];
    var players = [];
    var score = { blue: 0, red: 0 };
    var winner = null;
    var histories = [];
    var playerTurn = 'blue';
    var _a = (0, gameplay_server_1.useGameplayServer)(), updateBoard = _a.updateBoard, updateTurn = _a.updateTurn, announceWinner = _a.announceWinner, updatePlayers = _a.updatePlayers, resetBoard = _a.resetBoard, updateScore = _a.updateScore;
    var stringify = (0, utils_1.useUtils)().stringify;
    var winConds = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6],
    ];
    var generateEmpty = (0, generator_1.useGeneratorBoard)().generateEmpty;
    var initBoard = function () {
        boards = generateEmpty();
    };
    var getPlayerById = function (id) {
        var result = players.find(function (player) { return player.id === id; });
        if (result) {
            return result;
        }
        return null;
    };
    var getPlayerSideById = function (id) {
        var result = players.findIndex(function (player) { return player.id === id; });
        if (result > -1)
            return players[result].side;
        return null;
    };
    var getPlayerByTurn = function (turn) {
        var result = players.find(function (player) { return player.side === turn; });
        if (result) {
            return result;
        }
        return null;
    };
    var checkMaxBoard = function (socket, server) {
        var lastSideDraw = playerTurn === 'blue' ? "x" : "o";
        var curentSideDraw = playerTurn === 'blue' ? "o" : "x";
        var playerDraws = boards.filter(function (e) { return e.value === lastSideDraw; }).length;
        /**
         * if last player draw is greater or equal to 3 then set deprecated to it
         * and remove the current player deprecate draw
         *
         */
        if (playerDraws >= 3) {
            /**
             * set oldest player's draw to deprecated
             *
             */
            var playerDrawHistories = histories.filter(function (e) { return e.value === curentSideDraw; });
            var oldestPlayerDraw_1 = playerDrawHistories.reverse().find(function (_e, i) { return i == 2; });
            boards.forEach(function (cell, cellIndex) {
                if (cell.x === (oldestPlayerDraw_1 === null || oldestPlayerDraw_1 === void 0 ? void 0 : oldestPlayerDraw_1.x) && cell.y === (oldestPlayerDraw_1 === null || oldestPlayerDraw_1 === void 0 ? void 0 : oldestPlayerDraw_1.y)) {
                    boards[cellIndex].deprecated = true;
                }
            });
        }
        boards.forEach(function (cell, cellIndex) {
            if (cell.deprecated === true && cell.value === lastSideDraw) {
                /**
                 * remove deprecated
                 *
                 */
                boards[cellIndex].value = null;
            }
        });
        updateBoard(socket, server, true, boards);
    };
    var switchTurn = function (socket, server) {
        /**
         * change turn
         *
         */
        playerTurn = playerTurn == 'blue' ? 'red' : 'blue';
        updateTurn(socket, server, true, playerTurn);
    };
    var checkLines = function (socket, server) {
        var lastSideDraw = playerTurn === 'blue' ? "x" : "o";
        var lastSideLines = boards
            .map(function (e, i) { return (__assign({ i: i }, e)); })
            .filter(function (e) { return e.value === lastSideDraw && !e.deprecated; })
            .map(function (e) { return e.i; });
        var stacks = [];
        lastSideLines.forEach(function (e) {
            winConds.forEach(function (conds, condIndex) {
                conds.forEach(function (cond) {
                    if (e == cond) {
                        var indexStack = stacks.findIndex(function (stack) { return stack.cond === condIndex; });
                        if (indexStack > -1) {
                            var point = stacks[indexStack].point + 1;
                            stacks[indexStack].point = point;
                            if (point === 3) {
                                winner = getPlayerByTurn(playerTurn === 'blue' ? 'red' : 'blue');
                                return;
                            }
                        }
                        else {
                            stacks.push({
                                cond: condIndex,
                                point: 1
                            });
                        }
                    }
                });
                if (winner)
                    return;
            });
            if (winner)
                return;
        });
        if (winner) {
            var stackIndex = stacks.findIndex(function (e) { return e.point === 3; });
            var winOnCondIndex = stacks[stackIndex].cond;
            var conds = winConds[winOnCondIndex];
            /**
             * mark cells
             *
             */
            conds.forEach(function (cond) {
                boards[cond].mark = true;
            });
            updateBoard(socket, server, true, boards);
            /**
             * because switch turn called first then turn must reverse
             *
             */
            announceWinner(socket, server, true, playerTurn === 'blue' ? 'red' : 'blue');
            if (playerTurn === 'blue') {
                score.red = score.red + 1;
            }
            else {
                score.blue = score.blue + 1;
            }
            updateScore(socket, server, true, score);
        }
    };
    var resetGame = function (socket, server) {
        boards = generateEmpty();
        histories = [];
        winner = null;
        /**
         *
         * update the reset board
         *
         */
        updateBoard(socket, server, true, boards);
        resetBoard(socket, server, true, boards);
    };
    var playerDraw = function (socket, server, position) {
        var player = getPlayerById(socket.id);
        console.log("🚀 ~ playerDraw ~ player:", player);
        if (player === null) {
            /**
             * player is disconnected or someone (an spectactor)
             * tried to make
             * a illegal move
             */
            return;
        }
        if (getPlayerSideById(socket.id) != playerTurn) {
            /**
             * prevent player to draw when it's not
             *
             */
            return;
        }
        if (winner) {
            resetGame(socket, server);
            return;
        }
        /**
         * find cell target
         *
         */
        var cellIndex = boards.findIndex(function (e) { return e.x === position.x && e.y === position.y; });
        /**
         * check if the cell is empty
         *
         */
        if (boards[cellIndex].value == null || boards[cellIndex].deprecated) {
            /**
             *
             * set cell value
             *
             */
            boards[cellIndex].value = player.side === "blue" ? "o" : "x";
            boards[cellIndex].deprecated = undefined;
            histories.push({
                x: position.x,
                y: position.y,
                player: player,
                value: boards[cellIndex].value,
                created_at: new Date().getTime(),
            });
            updateBoard(socket, server, true, boards);
            switchTurn(socket, server);
            checkLines(socket, server);
            checkMaxBoard(socket, server);
        }
        else {
            /**
             * can't set value
             *
             */
        }
    };
    initBoard();
    var setPlayerFromConnection = function (socket, server, connection) {
        /**
         * check side available
         *
         */
        if (players.length == 0) {
            /**
             *
             * asign to blue side
             *
             */
            players.push({
                created_at: new Date().getTime(),
                id: connection.id,
                name: "Player 1",
                side: "blue",
            });
        }
        else if (players.length == 1) {
            /**
             * asign to available side
             *
             */
            var chosenSide_1 = "blue";
            players.forEach(function (player) {
                chosenSide_1 = player.side;
            });
            players.push({
                created_at: new Date().getTime(),
                id: connection.id,
                name: "Player 2",
                side: chosenSide_1 === "blue" ? "red" : "blue",
            });
        }
        else {
            /**
             * spectactor
             *
             */
        }
        updateBoard(socket, server, true, boards);
        updatePlayers(socket, server, true, players);
    };
    var removeIfConnectionIsPlayer = function (socket, server, connections) {
        var _a;
        var indexPlayer = players.findIndex(function (player) { return player.id === socket.id; });
        if (indexPlayer > -1) {
            console.log("🚀 ~ removeIfConnectionIsPlayer ~ a player disconnect");
            var tempPlayers = players;
            tempPlayers.splice(indexPlayer, 1);
            players = __spreadArray([], tempPlayers, true);
            tempPlayers = undefined;
            (_a = server.clients) === null || _a === void 0 ? void 0 : _a.forEach(function (client) {
                if (client.readyState === WebSocket.OPEN)
                    client.send(stringify("player-disconnect", {}));
            });
            /**
             * check if the connections is available
             *
             */
            var playersId_1 = players.map(function (e) { return e.id; });
            var availableConnections = connections.filter(function (e) { return !playersId_1.includes(e.id); });
            if (availableConnections.length > 0) {
                var lastAvailableConnection = availableConnections[availableConnections.length - 1];
                setPlayerFromConnection(socket, server, lastAvailableConnection);
            }
            else {
                /**
                 * update board and players
                 *
                 */
            }
            updateBoard(socket, server, true, boards);
            updatePlayers(socket, server, true, players);
        }
    };
    var setPlayers = function (values) {
        if (values === void 0) { values = []; }
        players = values;
    };
    return {
        boards: boards,
        players: players,
        initBoard: initBoard,
        playerDraw: playerDraw,
        histories: histories,
        setPlayers: setPlayers,
        removeIfConnectionIsPlayer: removeIfConnectionIsPlayer,
        setPlayerFromConnection: setPlayerFromConnection,
        playerTurn: playerTurn,
        score: score
    };
};
exports.useGameplay = useGameplay;
