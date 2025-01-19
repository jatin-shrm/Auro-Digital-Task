# deribit.py

import ccxt
from myccxt import Exchange

class Deribit(Exchange):
    def __init__(self, api_key, api_secret):
        super().__init__(api_key, api_secret)
        self.client = ccxt.deribit({
            'apiKey': api_key,
            'secret': api_secret,
        })

    def get_type(self, params={}):
        return 'cex'

    def fetch_networks(self, params={}):
        networks = {}
        self.client.load_markets()
        currency_items = self.client.currencies.items()

        for currency, currency_info in currency_items:
            currency_networks = {}

            if 'networks' in currency_info and currency_info.get('networks', None):
                for network_symbol, network_info in currency_info['networks'].items():
                    if 'network' in network_info:
                        currency_networks[network_info['network']] = {
                            'name': network_info.get('info', {}).get('name', None),
                            'network': network_info['network'],
                            'limits': network_info.get('limits', {}),
                            'fee': network_info.get('fee', 0),
                        }

            if currency_networks:
                networks[currency] = currency_networks
        return networks

    def fetch_deposit_address(self, code: str, params={}):
        return self.client.fetch_deposit_address(code, params)

    def withdraw(self, code, amount, address, tag=None, params={}):
        """
        Deribit-specific withdrawal implementation.
        """
        return self.client.withdraw(code, amount, address, tag, params)
