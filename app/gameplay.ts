import { BoardCell, BoardCellHistory, Cell, Connection, Player, Scores, Side } from "types/IGameBoard";
import { useGeneratorBoard } from "./generator";
import { useGameplayServer } from "./gameplay-server";
import { useUtils } from "./utils";

export const useGameplay = () => {

	let boards: BoardCell[] = []
	let players: Player[] = [];
	let score: Scores = {blue: 0, red: 0};
	let winner: Player | null = null;
	let histories: BoardCellHistory[] = [];
	let playerTurn: Side = 'blue'

	const { updateBoard, updateTurn, announceWinner, updatePlayers, resetBoard, updateScore } = useGameplayServer()
	const { stringify } = useUtils()

	const winConds = [
		[0, 1, 2],
		[3, 4, 5],
		[6, 7, 8],
		[0, 3, 6],
		[1, 4, 7],
		[2, 5, 8],
		[0, 4, 8],
		[2, 4, 6],
	];

	const { generateEmpty } = useGeneratorBoard()

	const initBoard = () => {
		boards = generateEmpty()
	}

	const getPlayerById = (id: string): Player | null => {
		const result = players.find(player => player.id === id)
		if (result) {
			return result as Player
		}
		return null
	}
	const getPlayerSideById = (id: string): Side|null => {
		const result = players.findIndex(player => player.id === id)
		if(result > -1)
			return players[result].side
		return null
	}

	const getPlayerByTurn = (turn: Side): Player | null => {
		const result = players.find((player) => player.side === turn)
		if (result) {
			return result as Player
		}
		return null
	}


	const checkMaxBoard = (socket, server) => {
		const lastSideDraw = playerTurn === 'blue' ? "x" : "o";
		const curentSideDraw = playerTurn === 'blue' ? "o" : "x";
		const playerDraws = boards.filter(e => e.value === lastSideDraw).length
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

			const playerDrawHistories = histories.filter(e => e.value === curentSideDraw)
			const oldestPlayerDraw = playerDrawHistories.reverse().find((_e, i) => i == 2)

			boards.forEach((cell, cellIndex) => {
				if (cell.x === oldestPlayerDraw?.x && cell.y === oldestPlayerDraw?.y) {
					boards[cellIndex].deprecated = true
				}
			})
		}

		boards.forEach((cell, cellIndex) => {
			if (cell.deprecated === true && cell.value === lastSideDraw) {
				/**
				 * remove deprecated
				 * 
				 */
				boards[cellIndex].value = null
			}
		})

		updateBoard(socket, server, true, boards)

	}


	const switchTurn = (socket, server) => {
		/**
		 * change turn
		 *
		 */
		playerTurn = playerTurn == 'blue' ? 'red' : 'blue';
		updateTurn(socket, server, true, playerTurn)
	};

	const checkLines = (socket, server) => {
		const lastSideDraw = playerTurn === 'blue' ? "x" : "o";
		const lastSideLines = boards
			.map((e, i) => ({ i, ...e }))
			.filter((e) => e.value === lastSideDraw && !e.deprecated)
			.map((e) => e.i);

		const stacks: { cond: number, point: number }[] = []

		lastSideLines.forEach(e => {
			winConds.forEach((conds, condIndex) => {
				conds.forEach(cond => {
					if (e == cond) {
						let indexStack = stacks.findIndex(stack => stack.cond === condIndex)
						if (indexStack > -1) {
							const point = stacks[indexStack].point + 1
							stacks[indexStack].point = point
							if (point === 3) {
								winner = getPlayerByTurn(playerTurn === 'blue' ? 'red' : 'blue')
								return
							}
						} else {
							stacks.push({
								cond: condIndex,
								point: 1
							})
						}
					}
				})
				if (winner) return
			})
			if (winner) return
		})

		if (winner) {
			const stackIndex = stacks.findIndex(e => e.point === 3)
			const winOnCondIndex = stacks[stackIndex].cond
			const conds = winConds[winOnCondIndex]

			/**
			 * mark cells
			 * 
			 */
			conds.forEach(cond => {
				boards[cond].mark = true
			})

			updateBoard(socket, server, true, boards)
			/**
			 * because switch turn called first then turn must reverse
			 * 
			 */
			announceWinner(socket,server, true, playerTurn === 'blue' ? 'red' : 'blue')
			if(playerTurn === 'blue'){
				score.red = score.red + 1
			} else {
				score.blue = score.blue + 1
			}
			updateScore(socket, server, true, score)

		}

	};

	const resetGame = (socket, server) => {
		boards = generateEmpty()
		histories = []
		winner = null
		/**
		 * 
		 * update the reset board
		 * 
		 */
		updateBoard(socket,server, true, boards)
		resetBoard(socket, server, true, boards)
	}

	const playerDraw = (socket, server, position: { x: Cell; y: Cell }): void => {

		const player = getPlayerById(socket.id)
		
		console.log("🚀 ~ playerDraw ~ player:", player)

		if (player === null) {
			/**
			 * player is disconnected or someone (an spectactor) 
			 * tried to make 
			 * a illegal move
			 */
			return
		}

		if(getPlayerSideById(socket.id) != playerTurn){
			/**
			 * prevent player to draw when it's not  
			 * 
			 */
			return
		}

		if (winner) {
			resetGame(socket, server)
			return
		}

		/**
		 * find cell target
		 *
		 */
		const cellIndex = boards.findIndex(
			(e) => e.x === position.x && e.y === position.y
		);
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
			boards[cellIndex].deprecated = undefined

			histories.push({
				x: position.x,
				y: position.y,
				player: player,
				value: boards[cellIndex].value,
				created_at: new Date().getTime(),
			});

			updateBoard(socket, server, true, boards)

			switchTurn(socket, server);
			checkLines(socket, server);
			checkMaxBoard(socket, server);

		} else {
			/**
			 * can't set value
			 *
			 */
		}
	};

	initBoard()


	const setPlayerFromConnection = (socket, server, connection: Connection) => {
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

		} else {

			/**
			 * spectactor
			 * 
			 */

		}

		updateBoard(socket,server, true, boards)
		updatePlayers(socket,server, true, players)

	};

	const removeIfConnectionIsPlayer = (socket, server, connections: Connection[]) => {
		const indexPlayer = players.findIndex((player) => player.id === socket.id);

		if (indexPlayer > -1) {
			
			console.log("🚀 ~ removeIfConnectionIsPlayer ~ a player disconnect")

			let tempPlayers: Player[] | undefined = players;
			tempPlayers.splice(indexPlayer, 1);
			players = [...tempPlayers];
			tempPlayers = undefined;

			server.clients?.forEach(client => {
				if (client.readyState === WebSocket.OPEN)
					client.send(stringify("player-disconnect", {}))
			});

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

				setPlayerFromConnection(socket,server, lastAvailableConnection);
			} else {
				/**
				 * update board and players
				 * 
				 */
			}
			
			updateBoard(socket,server, true, boards)
			updatePlayers(socket,server, true, players)

		}
	};

	const setPlayers = (values: Player[] = []) => {
		players = values
	}

	return {
		boards,
		players,
		initBoard,
		playerDraw,
		histories,
		setPlayers,
		removeIfConnectionIsPlayer,
		setPlayerFromConnection,
		playerTurn,
		score
	}

}