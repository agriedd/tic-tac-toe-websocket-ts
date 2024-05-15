import { BoardCell, Connection, Player, Scores, Side } from "types/IGameBoard";
import { useUtils } from "./utils";
import { WebSocket } from "ws";

export const useGameplayServer = () => {

	const { stringify } = useUtils()

	const updateBoard = (socket, server, broadcast: boolean = true, boards: BoardCell[]) => {
		socket.send(stringify("on-board-update", { boards: boards }));
		/**
		 * 
		 * broadcast
		 * 
		 */
		if (broadcast) {
			server.clients?.forEach(client => {
				if (client.readyState === WebSocket.OPEN)
					client.send(stringify("on-board-update", { boards: boards }))
			});
		}
	};
	const updateScore = (socket, server, broadcast: boolean = true, score: Scores) => {
		socket.send(stringify("on-score-update", { score: score }));
		/**
		 * 
		 * broadcast
		 * 
		 */
		if (broadcast) {
			server.clients?.forEach(client => {
				if (client.readyState === WebSocket.OPEN)
					client.send(stringify("on-score-update", { score: score }))
			});
		}
	};
	const resetBoard = (socket, server, broadcast: boolean = true, boards: BoardCell[]) => {
		socket.send(stringify("on-board-reset", { boards: boards }));
		/**
		 * 
		 * broadcast
		 * 
		 */
		if (broadcast) {
			server.clients?.forEach(client => {
				if (client.readyState === WebSocket.OPEN)
					client.send(stringify("on-board-reset", { boards: boards }))
			});
		}
	};
	const updateTurn = (socket, server, broadcast: boolean = true, turn: Side) => {
		socket.send(stringify("on-turn-update", { turn: turn }));
		/**
		 * 
		 * broadcast
		 * 
		 */
		if (broadcast) {
			server.clients?.forEach(client => {
				if (client.readyState === WebSocket.OPEN)
					client.send(stringify("on-turn-update", { turn: turn }))
			});
		}
	};
	const announceWinner = (socket, server, broadcast: boolean = true, turn: Side) => {
		socket.send(stringify("on-winner", { turn: turn }));
		/**
		 * 
		 * broadcast
		 * 
		 */
		if (broadcast) {
			server.clients?.forEach(client => {
				if (client.readyState === WebSocket.OPEN)
					client.send(stringify("on-winner", { turn: turn }))
			});
		}
	};
	const updatePlayers = (socket, server, broadcast: boolean = true, players: Player[]) => {
		socket.send(stringify("on-players-update", { players: players }));
		/**
		 * 
		 * broadcast
		 * 
		 */
		if (broadcast) {
			server.clients?.forEach(client => {
				if (client.readyState === WebSocket.OPEN)
					client.send(stringify("on-players-update", { players: players }))
			});
		}
	};


	function s4() {
		return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
	}
	const getID = () => {
		return s4() + s4() + '-' + s4();
	};

	return {
		updateBoard,
		updateTurn,
		getID,
		announceWinner,
		updatePlayers,
		resetBoard,
		updateScore,
	}

}