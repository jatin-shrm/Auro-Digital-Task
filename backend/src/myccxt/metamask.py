# metamask.py

from decimal import Decimal
from myccxt import Exchange

from eth_account import Account
from web3 import Web3, HTTPProvider
from eth_defi.token import fetch_erc20_details
from web3.middleware import geth_poa_middleware
from eth_defi.abi import get_deployed_contract
from web3.middleware import construct_sign_and_send_raw_middleware

class Metamask(Exchange):
    def __init__(self, api_key, api_secret):
        super().__init__(api_key, api_secret)

        self.chain_id = '1'
        self.chain_name = 'Ethereum'
        self.network = 'ERC20'
        self.rpc_url = 'https://mainnet.infura.io/v3/8c12339d73c24b0fb0e6b35ba38eb2e5'

        self.tokens = {
            '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2': ['ETH', 18],
            '0xdAC17F958D2ee523a2206206994597C13D831ec7': ['USDT', 6],
            '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48': ['USDC', 6],
            '0x6B175474E89094C44Da98b954EedeAC495271d0F': ['DAI', 18],
            '0x111111111117dC0aa78b770fA6A738034120C302': ['1INCH', 18],
            '0xD31a59c85aE9D8edEFeC411D448f90841571b89c': ['WSOL', 9],
            '0x418D75f65a02b3D53B2418FB8E1fe493759c7605': ['WBNB', 18],
            '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599': ['WBTC', 8],
            '0xB8c77482e45F1F44dE1745F52C74426C631bDD52': ['BNB', 18],
        }

    def get_type(self, params={}):
        return 'dex'

    def fetch_networks(self, params={}):
        networks = {}

        for address, (symbol, decimal) in self.tokens.items():
            networks[symbol] = {
                self.network: {
                    'name': self.chain_name,
                    'network': self.network,
                    'limits': {
                        'withdraw': {
                            'min': 0,
                            'max': None,
                        },
                        'deposit': {
                            'min': 0,
                            'max': None,
                        }
                    },
                    'fee': 0,
                }
            }

        return networks

    def fetch_deposit_address(self, code: str, params={}):
        network = params.get('network', '')
        if network != self.network:
            raise ValueError(f'{network} not in the added chains')
        return {
            'address': self.api_key
        }

    def withdraw(self, code, amount, address, tag=None, params={}):
        network = params.get('network', None)
        if network != self.network:
            return {
                'error': f'{network} not in the added chains'
            }
        TOKEN_ADDRESS = [address for address, details in self.tokens.items() if details[0] == code][0]
        if not TOKEN_ADDRESS:
            return {
                'error': f'{code} is not in the added coins'
            }
        token_amount = amount
        to_address = address

        web3 = Web3(Web3.HTTPProvider(self.rpc_url))
        wallet_key = self.api_secret

        account = Account.from_key(wallet_key)
        web3.middleware_onion.add(construct_sign_and_send_raw_middleware(account))
        web3.middleware_onion.inject(geth_poa_middleware, layer=0)

        token_contract = get_deployed_contract(web3, "ERC20MockDecimals.json", TOKEN_ADDRESS)
        token_details = fetch_erc20_details(web3, TOKEN_ADDRESS)

        token_balance = token_contract.functions.balanceOf(account.address).call()
        eth_balance = web3.eth.get_balance(account.address)

        token_amount = Decimal(token_amount)
        raw_amount = token_details.convert_to_raw(token_amount)

        if token_balance < raw_amount:
            return {
                'error': f'Insufficient funds for withdrawal.'
            }
        
        gas_limit = token_contract.functions.transfer(to_address, raw_amount).estimate_gas({"from": account.address})
        gas_price = web3.eth.gas_price

        total_gas_cost = gas_limit * gas_price

        if eth_balance < total_gas_cost:
            return {
                'error': f'Insufficient funds for gas fees.'
            }
        
        tx_hash = token_contract.functions.transfer(to_address, raw_amount).transact({"from": account.address})

        return {
            'id': tx_hash.hex(),
            'currency': code,
            'amount': amount,
            'network': self.network,
            'status': 'success',
        }
