# exchange.py

class Exchange:
    def __init__(self, api_key=None, api_secret=None):
        """
        Base class for all exchanges.
        :param str api_key: API key for authentication.
        :param str api_secret: API secret for authentication.
        """
        self.api_key = api_key
        self.api_secret = api_secret

    def withdraw(self, code, amount, address, tag=None, params={}):
        """
        Make a withdrawal (to be implemented by derived classes).
        :param str code: Unified currency code (e.g., 'BTC', 'USDT').
        :param float amount: Amount to withdraw.
        :param str address: Address to withdraw to.
        :param str tag: Optional tag/memo.
        :param dict params: Extra parameters specific to the exchange API.
        """
        raise NotImplementedError("withdraw method must be implemented by subclasses")

    def deposit(self, code, amount, address, params={}):
        """
        Deposit funds (to be implemented by derived classes).
        :param str code: Unified currency code (e.g., 'BTC', 'USDT').
        :param float amount: Amount to deposit.
        :param str address: Address to deposit to.
        :param dict params: Extra parameters specific to the exchange API.
        """
        raise NotImplementedError("deposit method must be implemented by subclasses")
