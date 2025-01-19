import "../styles/withdraw.css";
import Dropdown from "./dropdown";
import React, { useState, useEffect } from "react";
import { createWebSocketConnection } from "../services/websocket";

const Withdraw = () => {
    const exchanges = ["deribit", "binance", "metamask1", "metamask2"];
    const [socket, setSocket] = useState(null);
    const [primaryExchange, setPrimaryExchange] = useState("");
    const [secondaryExchange, setSecondaryExchange] = useState("");
    const [networksData, setNetworksData] = useState(null);
    const [selectedCoin, setSelectedCoin] = useState("");
    const [selectedNetwork, setSelectedNetwork] = useState("");
    const [infoMessage, setInfoMessage] = useState("");
    const [amount, setAmount] = useState("");
    const [statusMessage, setStatusMessage] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        const ws = createWebSocketConnection("ws://localhost:8081");
        setSocket(ws);

        return () => ws.close();
    }, []);

    const handleFetchNetworks = () => {
        if (!primaryExchange || !secondaryExchange) {
            setStatusMessage("Error: Please select both Primary and Secondary Exchanges.");
            return;
        }

        if (socket && socket.readyState === WebSocket.OPEN) {
            const payload = {
                method: "fetch_networks",
                params: {
                    primary: primaryExchange,
                    secondary: secondaryExchange,
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
                        setAmount("");
                    }
                    else if (data.error) {
                        setStatusMessage(data.error);
                    }
                    else {
                        setStatusMessage("Error: Failed to fetch networks.");
                    }
                } catch (error) {
                    setStatusMessage("Error: An error occurred while fetching networks.");
                }
            };
        } else {
            setStatusMessage("Error: WebSocket connection not established.");
        }
    };

    const handleCoinChange = (coin) => {
        setSelectedCoin(coin);
        setSelectedNetwork("");
        setInfoMessage("");
        setAmount("");
        setStatusMessage("");
    };

    const handleNetworkChange = (networkKey) => {
        setAmount("");
        setStatusMessage("");
        setSelectedNetwork(networkKey);

        if (selectedCoin && networksData[selectedCoin][networkKey]) {
            const networkInfo = networksData[selectedCoin][networkKey];
            if (primaryExchange === 'metamask') {
                setInfoMessage(
                    `Name: ${networkInfo.name}\nWithdraw Min: ${networkInfo.limits.deposit.min} Max: ${networkInfo.limits.deposit.max}\nFee: 0 ${selectedCoin}`
                );
            }
            else {
                setInfoMessage(
                    `Name: ${networkInfo.name}\nWithdraw Min: ${networkInfo.limits.withdraw.min} Max: ${networkInfo.limits.withdraw.max}\nFee: ${networkInfo.fee} ${selectedCoin}`
                );
            }
        }
    };

    const handleWithdrawal = () => {
        if (!primaryExchange || !secondaryExchange || !selectedCoin || !selectedNetwork || !amount) {
            setStatusMessage("Error: Please fill in all the fields.");
            return;
        }

        const networkLimits = networksData[selectedCoin][selectedNetwork].limits;
        const isMetamask = primaryExchange === "metamask";
        const limits = isMetamask ? networkLimits.deposit : networkLimits.withdraw;
        const minLimit = limits.min !== null ? limits.min : 0;
        const maxLimit = limits.max !== null ? limits.max : Infinity;

        if (amount <= 0) {
            setStatusMessage("Error: Amount should be greater than 0.");
            return;
        }

        if (amount < minLimit) {
            setStatusMessage(`Error: Amount is less than the minimum limit of ${minLimit} ${selectedCoin}.`);
            return;
        }

        if (amount > maxLimit) {
            setStatusMessage(`Error: Amount exceeds the maximum limit of ${maxLimit} ${selectedCoin}.`);
            return;
        }

        if (socket && socket.readyState === WebSocket.OPEN) {
            setIsProcessing(true);
            setStatusMessage("Pending...");

            const payload = {
                method: "withdraw",
                params: {
                    primary: primaryExchange,
                    secondary: secondaryExchange,
                    coin: selectedCoin,
                    network: selectedNetwork,
                    amount: amount.toString(),
                },
            };

            socket.send(JSON.stringify(payload));
            socket.onmessage = (message) => {
                try {
                    const data = JSON.parse(message.data);
                    console.log(data)
                    setIsProcessing(false);
                    if (data.result) {
                        setStatusMessage(`${JSON.stringify(data.result.message)}`);
                    } else if (data.error) {
                        setStatusMessage(`${data.error}`);
                    } else {
                        setStatusMessage("Unexpected response from the server.");
                    }
                } catch (error) {
                    setIsProcessing(false);
                    setStatusMessage("An error occurred while processing the withdrawal.");
                }
            };
        } else {
            setStatusMessage("Error: WebSocket connection not established.");
        }
    };

    return (
        <div className="withdraw-page">
            <h2 className="withdraw-heading">Withdraw</h2>
            <div className="dropdown-container">
                <Dropdown
                    label="Primary Exchange"
                    options={exchanges}
                    value={primaryExchange}
                    onChange={(value) => {
                        setPrimaryExchange(value);
                        setNetworksData(null);
                        setSelectedCoin("");
                        setSelectedNetwork("");
                        setInfoMessage("");
                        setAmount("");
                        setStatusMessage("");
                        setIsProcessing(false);
                    }}
                // exclude={secondaryExchange}
                />
                <Dropdown
                    label="Secondary Exchange"
                    options={exchanges}
                    value={secondaryExchange}
                    onChange={(value) => {
                        setSecondaryExchange(value);
                        setNetworksData(null);
                        setSelectedCoin("");
                        setSelectedNetwork("");
                        setInfoMessage("");
                        setAmount("");
                        setStatusMessage("");
                        setIsProcessing(false);
                    }}
                    exclude={primaryExchange}
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

            {/* Amount Input */}
            {selectedCoin && selectedNetwork && (
                <div className="amount-container">
                    <label htmlFor="amount">Withdrawal Amount</label>
                    <div className="amount-input-wrapper">
                        <input
                            type="number"
                            id="amount"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder={`Minimum ${primaryExchange === "metamask"
                                ? networksData[selectedCoin][selectedNetwork].limits.deposit.min || 0
                                : networksData[selectedCoin][selectedNetwork].limits.withdraw.min || 0
                                }`}
                        />
                        <span className="currency-label">{selectedCoin}</span>
                    </div>
                </div>
            )}

            {/* Withdraw Button */}
            {selectedCoin && selectedNetwork && (
                <button className="withdraw-button" onClick={handleWithdrawal} disabled={isProcessing}>
                    {isProcessing ? "Processing..." : "Withdraw"}
                </button>
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

export default Withdraw;
