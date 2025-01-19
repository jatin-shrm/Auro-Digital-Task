export const createWebSocketConnection = (url) => {
    const socket = new WebSocket(url);

    socket.onopen = () => {
        console.log("WebSocket connection established.");
    };

    socket.onclose = () => {
        console.log("WebSocket connection closed.");
    };

    socket.onerror = (error) => {
        console.error("WebSocket error:", error);
    };

    return socket;
};
