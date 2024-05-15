export const useUtils = () => {

	const stringify = (key: string, data: object): string => {
		return JSON.stringify({
			key: key,
			data
		})
	}

	return {
		stringify,
	}

}