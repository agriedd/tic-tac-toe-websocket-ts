import { Server, Socket } from "socket.io";
import { Connection, Player, Side } from "types/IGameBoard";

let players: Player[] = [];
let connections: Connection[] = [];

const io = new Server(443, {
  cors: {
    origin: ["https://agriedd.github.io", "https://github.io"],
		credentials: true,
		allowedHeaders: "*",
  },
});

io.on("connection", (socket) => {

  let connection: Connection = addConnection(socket)

  socket.emit("on-connect", { id: socket.id });

  if (connection) {
    setPlayerFromConnection(socket, connection);
  }

  connection = undefined;
});

io.on("connect", (socket) => {
	
  socket.emit("on-connect", { id: socket.id });
  /**
   * listenners
   *
   */
  socket.on("wants-connections-count", function message() {
		console.log(socket.id, "wants-connections-count");
		updateConnectionsCount(socket)
  });

  socket.on("wants-connection-id", function message() {
		socket.emit("on-connect", { id: socket.id });
  });

  socket.on("disconnecting", () => {

    console.log("disconnected", socket.id);

		removeConnection(socket);
    removeIfConnectionIsPlayer(socket);

    updateConnectionsCount(socket);

  });

});

const addConnection = (socket: Socket) : Connection => {
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

const removeConnection = (socket: Socket) => {
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

const removeIfConnectionIsPlayer = (socket: Socket) => {
  const indexPlayer = players.findIndex((player) => player.id === socket.id);

  if (indexPlayer > -1) {
    let tempPlayers: Player[] | undefined = players;
    tempPlayers.splice(indexPlayer, 1);
    players = [...tempPlayers];
    tempPlayers = undefined;

    socket.broadcast.emit("player-disconnect");

    /**
     * check if the connections is available
     *
     */
    let playersId = players.map((e) => e.id);

    let availableConnections = connections.filter(
      (e) => !playersId.includes(e.id)
    );

    if (availableConnections.length > 0) {
      let lastAvailableConnection =
        availableConnections[availableConnections.length - 1];

      setPlayerFromConnection(socket, lastAvailableConnection);
    } else {
      socket.broadcast.emit("waiting-player", true);
    }
  }
};

const setPlayerFromConnection = (socket: Socket, connection: Connection) => {
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

    socket.broadcast.emit("player-on-side", {
      id: connection.id,
      side: "blue",
    });
  } else if (players.length == 1) {
    /**
     * asign to available side
     *
     */
    let chosenSide: Side = "blue";

    players.forEach((player) => {
      chosenSide = player.side;
    });

    players.push({
      created_at: new Date().getTime(),
      id: connection.id,
      name: "Player 2",
      side: chosenSide === "blue" ? "red" : "blue",
    });

    socket.broadcast.emit("player-on-side", {
      id: connection.id,
      side: chosenSide === "blue" ? "red" : "blue",
    });
  } else {
    socket.broadcast.emit("on-spectating", {
      id: connection.id,
      spectator: true,
    });
  }
};

const updateConnectionsCount = (socket: Socket) => {
	console.log(connections);
	
  socket.emit("on-connections-update", { count: connections.length });
  socket.broadcast.emit("on-connections-update", { count: connections.length });
};
