import { BoardCell, Cell, Draw } from "types/IGameBoard";

export const useGeneratorBoard = () => {
  
	const cellValueCollection: Draw[] = ['o','x', null]
  
	const generateRandom = (): BoardCell[] => {
  
	  let result : BoardCell[] = []
  
	  for(let i = 0; i < 9; i++){
  
		let yIndex: Cell = i % 3 as Cell
		let xIndex: Cell = parseInt(String(i / 3)) as Cell
		let value: Draw = cellValueCollection[ Math.floor(Math.random() * cellValueCollection.length) ]
  
		result.push({
		  x: xIndex,
		  y: yIndex,
		  value,
		  mark: false,
		})
	  }
  
	  return result
  
	};
  
	const generateEmpty = (): BoardCell[] => {
  
	  let result : BoardCell[] = []
  
	  for(let i = 0; i < 9; i++){
  
		let yIndex: Cell = i % 3 as Cell
		let xIndex: Cell = parseInt(String(i / 3)) as Cell
		let value: Draw = null
  
		result.push({
		  x: xIndex,
		  y: yIndex,
		  value,
		  mark: false
		})
	  }
  
	  return result
  
	};
  
	return {
	  generateRandom,
	  generateEmpty,
	};
  };
  