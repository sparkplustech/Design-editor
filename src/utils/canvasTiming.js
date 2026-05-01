export const waitForCanvasTick = () => new Promise(resolve => setTimeout(resolve, 50));

export const getReadyCanvasHandler = canvasRef => {
	if (!canvasRef?.handler) {
		throw new Error('Canvas is still loading.');
	}
	return canvasRef.handler;
};
