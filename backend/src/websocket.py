import os
import json
import asyncio
import websockets
from dotenv import load_dotenv
from myccxt import Binance, Deribit, Metamask
from transfer import withdraw

load_dotenv()

import ccxt
print(f'ccxt version: {ccxt.__version__}')

binance_api_key = os.getenv("BINANCE_API_KEY")
binance_secret_key = os.getenv("BINANCE_SECRET_KEY")

deribit_api_key = os.getenv("DERIBIT_API_KEY")
deribit_secret_key = os.getenv("DERIBIT_SECRET_KEY")

metamask_api_key1 = os.getenv("METAMASK_WALLET_ADDRESS1")
metamask_secret_key1 = os.getenv("METAMASK_WALLET_KEY1")

metamask_api_key2 = os.getenv("METAMASK_WALLET_ADDRESS2")
metamask_secret_key2 = os.getenv("METAMASK_WALLET_KEY2")

binance_instance = Binance(binance_api_key, binance_secret_key)
deribit_instance = Deribit(deribit_api_key, deribit_secret_key)
metamask_instance1 = Metamask(metamask_api_key1, metamask_secret_key1)
metamask_instance2 = Metamask(metamask_api_key2, metamask_secret_key2)

exchanges = {
    'binance': binance_instance,
    'deribit': deribit_instance,
    'metamask1': metamask_instance1,
    'metamask2': metamask_instance2,
}

async def handle_message(websocket, path):
    print(f"New connection from {websocket.remote_address}")

    try:
        async for message in websocket:
            print(f"Received message: {message}")

            try:
                request = json.loads(message)
                request_id = request.get("id")
                method = request.get("method")
                params = request.get("params", {})

                response = {"id": request_id, "result": None, "error": None}

                if method == "fetch_networks":
                    primary = params['primary']
                    secondary = params['secondary']
                    if 'metamask' in primary:
                        response["result"] = exchanges[secondary].fetch_networks()
                    else:
                        response["result"] = exchanges[primary].fetch_networks()
                if method == "fetch_deposit_networks":
                    exchange = params['exchange']
                    response["result"] = exchanges[exchange].fetch_networks()
                if method == "fetch_deposit_address":
                    exchange = params['exchange']
                    coin = params['coin']
                    network = params['network']
                    response["result"] = exchanges[exchange].fetch_deposit_address(coin, params={'network': network})
                elif method == "withdraw":
                    primary = params['primary']
                    secondary = params['secondary']
                    coin = params['coin']
                    network = params['network']
                    amount = float(params['amount'])
                    resp = withdraw(primary, secondary, coin, network, amount, params={'exchanges': exchanges})
                    response["result"] = resp
                else:
                    response["error"] = f"Unknown method: {method}"

                await websocket.send(json.dumps(response))

            except Exception as error:
                import traceback
                traceback.print_exc()
                error_response = {
                    "id": None,
                    "result": None,
                    "error": str(error)
                }
                await websocket.send(json.dumps(error_response))
    except websockets.exceptions.ConnectionClosed as e:
        print(f"Connection closed: {e}")

async def main():
    server = await websockets.serve(handle_message, "localhost", 8081)
    print("WebSocket server started on port 8081")
    await server.wait_closed()

if __name__ == "__main__":
    asyncio.run(main())
