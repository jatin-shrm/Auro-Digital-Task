import json
from ccxt.base.errors import InvalidAddress

def withdraw(primary_exchange, secondary_exchange, currency, network, amount, params={}):
    exchanges = params.get('exchanges', {})
    primary_instance = exchanges.get(primary_exchange, None)
    secondary_instance = exchanges.get(secondary_exchange, None)

    if (not primary_instance or not secondary_instance):
        return {
            'message': 'Invalid primary or secondary exchange'
        }
    
    # ------------------
    # case 1: cex to cex
    # case 2: cex to dex
    # case 3: dex to cex
    # case 4: dex to dex
    # ------------------

    # case 1: cex to cex
    if (primary_instance.get_type() == 'cex' and secondary_instance.get_type() == 'cex'):
        try:
            deposit_address_resp = secondary_instance.fetch_deposit_address(currency, params={'network': network})
        except InvalidAddress as error:
            return {
                'message': f'{network} is not supported on {secondary_exchange}'
            }
        
        deposit_address = deposit_address_resp['address']

        try:
            withdraw_resp = primary_instance.withdraw(currency, float(amount), deposit_address, params={'network': network})
        except Exception as error:
            return {
                'message': str(error)
            }
        return {
            'message': withdraw_resp
        }
    
    # case 2: cex to dex
    if (primary_instance.get_type() == 'cex' and secondary_instance.get_type() == 'dex'):
        try:
            deposit_address_resp = secondary_instance.fetch_deposit_address(currency, params={'network': network})
            deposit_address = deposit_address_resp['address']
        except Exception as error:
            return {
                'message':  str(error)
            }
        
        try:
            withdraw_resp = primary_instance.withdraw(currency, float(amount), deposit_address, params={'network': network})
        except Exception as error:
            return {
                'message':  str(error)
            }
        return {
            'message': withdraw_resp
        }
    
    # case 3: dex to cex
    if (primary_instance.get_type() == 'dex' and secondary_instance.get_type() == 'cex'):
        try:
            deposit_address_resp = secondary_instance.fetch_deposit_address(currency, params={'network': network})
        except InvalidAddress as error:
            return {
                'message': f'{network} is not supported on {secondary_exchange}'
            }
        
        deposit_address = deposit_address_resp['address']

        try:
            withdraw_resp = primary_instance.withdraw(currency, float(amount), deposit_address, params={'network': network})
        except Exception as error:
            return {
                'message':  str(error)
            }    
        return {
            'message': withdraw_resp
        }
    
    # case 4: dex to dex
    if (primary_instance.get_type() == 'dex' and secondary_instance.get_type() == 'dex'):
        try:
            deposit_address_resp = secondary_instance.fetch_deposit_address(currency, params={'network': network})
            deposit_address = deposit_address_resp['address']
        except Exception as error:
            return {
                'message':  str(error)
            }
        deposit_address = secondary_instance.fetch_deposit_address(currency, params={'network': network})
        
        try:
            withdraw_resp = primary_instance.withdraw(currency, float(amount), deposit_address, params={'network': network})
        except Exception as error:
            return {
                'message':  str(error)
            }
        return {
            'message': withdraw_resp
        }

    return {
        'message': 'withdrawal done'
    }
