import "../styles/deposit.css";
import "../styles/withdraw.css";
import Dropdown from "./dropdown";
import { FaCopy } from "react-icons/fa";
import React, { useState, useEffect } from "react";
import { createWebSocketConnection } from "../services/websocket";

const Deposit = () => {
    const exchanges = ["deribit", "binance", "metamask1", "metamask2"];
    const [socket, setSocket] = useState(null);
    const [exchange, setExchange] = useState("");
    const [networksData, setNetworksData] = useState(null);
    const [selectedCoin, setSelectedCoin] = useState("");
    const [selectedNetwork, setSelectedNetwork] = useState("");
    const [infoMessage, setInfoMessage] = useState("");
    const [depositAddress, setdepositAddress] = useState(null);
    const [statusMessage, setStatusMessage] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [copyAnimation, setCopyAnimation] = useState(false);

    useEffect(() => {
        const ws = createWebSocketConnection("ws://localhost:8081");
        setSocket(ws);

        return () => ws.close();
    }, []);

    const handleFetchNetworks = () => {
        if (!exchange) {
            setStatusMessage("Error: Please select Exchange");
            return;
        }

        try {
            if (socket && socket.readyState === WebSocket.OPEN) {
                const payload = {
                    method: "fetch_deposit_networks",
                    params: {
                        exchange: exchange,
                    }
                };

                socket.send(JSON.stringify(payload));
                socket.onmessage = (message) => {
                    try {
                        const data = JSON.parse(message.data);
                        if (data.result) {
                            const sortedData = Object.keys(data.result)
                                .sort()
                                .reduce((acc, key) => {
                                    acc[key] = data.result[key];
                                    return acc;
                                }, {});
                            setNetworksData(sortedData);
                            setSelectedCoin("");
                            setSelectedNetwork("");
                            setInfoMessage("");
                            setStatusMessage("");
                            setdepositAddress(null);
                        }
                        else if (data.error) {
                            setStatusMessage(data.error);
                        }
                        else {
                            setStatusMessage("Failed to fetch networks.");
                        }
                    } catch (error) {
                        setStatusMessage("An error occurred while fetching networks.");
                    }
                };
            } else {
                setStatusMessage("Error: WebSocket connection not established.");
            }
        }
        catch (error) {
            setStatusMessage(error);
        }
    };

    const handleCoinChange = (coin) => {
        setSelectedCoin(coin);
        setSelectedNetwork("");
        setInfoMessage("");
        setStatusMessage("");
        setdepositAddress(null);
    };

    const handleNetworkChange = (networkKey) => {
        setStatusMessage("");
        setSelectedNetwork(networkKey);
        setdepositAddress(null);

        if (selectedCoin && networksData[selectedCoin][networkKey]) {
            const networkInfo = networksData[selectedCoin][networkKey];
            setInfoMessage(
                `Name: ${networkInfo.name}\nDeposit Min: ${networkInfo.limits.deposit.min} Max: ${networkInfo.limits.deposit.max}\nFee: 0 ${selectedCoin}`
            );
        }
    };

    const handleFetchDespositAddress = () => {
        if (!exchange || !selectedCoin || !selectedNetwork) {
            setStatusMessage("Error: Please select all required fields (Exchange, Coin, Network).");
            return;
        }

        try {
            if (socket && socket.readyState === WebSocket.OPEN) {
                const payload = {
                    method: "fetch_deposit_address",
                    params: {
                        exchange: exchange,
                        coin: selectedCoin,
                        network: selectedNetwork,
                    },
                };

                socket.send(JSON.stringify(payload));
                setIsProcessing(true);

                socket.onmessage = (message) => {
                    try {
                        const data = JSON.parse(message.data);
                        if (data.result) {
                            setdepositAddress(`Deposit Address: ${data.result.address}`);
                            setStatusMessage('Please note that only supported networks are shown, if you deposit via another network your assets may be lost.');
                        } else if (data.error) {
                            setdepositAddress(null);
                            setStatusMessage(data.error);
                        } else {
                            setdepositAddress(null);
                            setStatusMessage("Error: Failed to fetch deposit address.");
                        }
                    } catch (error) {
                        setdepositAddress(null);
                        console.error("Error processing deposit address message:", error);
                        setStatusMessage("Error: An error occurred while fetching deposit address.");
                    } finally {
                        setIsProcessing(false);
                    }
                };
            } else {
                setdepositAddress(null);
                setStatusMessage("Error: Error: WebSocket connection not established.");
            }
        } catch (error) {
            console.error("Error in handleFetchDespositAddress:", error);
            setStatusMessage("Error: An unexpected error occurred.");
            setIsProcessing(false);
        }
    };

    const handleCopyToClipboard = () => {
        if (depositAddress) {
            const address = depositAddress.replace("Deposit Address: ", "");
            navigator.clipboard.writeText(address)
                .then(() => {
                    setCopyAnimation(true);
                    setTimeout(() => {
                        setCopyAnimation(false);
                    }, 100);
                })
                .catch((error) => {
                    console.error("Failed to copy address:", error);
                    setStatusMessage("Error: Failed to copy address.");
                });
        }
    };

    return (
        <div className="deposit-page">
            <h2 className="deposit-heading">Deposit</h2>
            <div className="dropdown-container">
                <Dropdown
                    label="Exchange"
                    options={exchanges}
                    value={exchange}
                    onChange={(value) => {
                        setExchange(value);
                        setNetworksData(null);
                        setSelectedCoin("");
                        setSelectedNetwork("");
                        setInfoMessage("");
                        setStatusMessage("");
                        setIsProcessing(false);
                        setdepositAddress(null);
                    }}
                />
            </div>

            <button className="fetch-button" onClick={handleFetchNetworks}>
                Fetch Networks
            </button>

            {/* Dynamic Dropdowns for Coin and Network */}
            {networksData && (
                <div className="coin-network-container">
                    <Dropdown
                        label="Select Coin"
                        options={Object.keys(networksData)}
                        value={selectedCoin}
                        onChange={handleCoinChange}
                    />
                    <Dropdown
                        label="Select Network"
                        options={
                            selectedCoin
                                ? Object.keys(networksData[selectedCoin]).sort()
                                : []
                        }
                        value={selectedNetwork}
                        onChange={handleNetworkChange}
                    />
                </div>
            )}

            {/* Info Message */}
            {infoMessage && (
                <div className="info-message">
                    <div>{infoMessage}</div>
                </div>
            )}

            {/* Withdraw Button */}
            {selectedCoin && selectedNetwork && (
                <button className="withdraw-button" onClick={handleFetchDespositAddress} disabled={isProcessing}>
                    {isProcessing ? "Processing..." : "Fetch Deposit Address"}
                </button>
            )}

            {/* Status Message */}
            {depositAddress && (
                <div className="deposit-message">
                    <div className="deposit-message-inner">
                        {depositAddress}
                        <FaCopy
                            className={`copy-icon ${copyAnimation ? "clicked" : ""}`}
                            onClick={handleCopyToClipboard}
                            style={{ marginLeft: "10px", cursor: "pointer" }}
                        />
                    </div>
                </div>
            )}

            {/* Status Message */}
            {statusMessage && (
                <div className="status-message">
                    <div>{statusMessage} </div>
                </div>
            )}
        </div>
    );
};

export default Deposit;
