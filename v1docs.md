# Docs

All Spartan Protocol pairs consist of a SPARTA token paired with a BEP20 Token. 
SPARTA token address: 0x3910db0600eA925F63C36DdB1351aB6E2c6eb102

### Request

`GET https://api.spartanprotocol.org/api/v1/tokens/0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56`

Returns relevant data based on selected token address

### Response

```json5
{
  "updated_at": 1234567,              // UNIX timestamp
  "data": {
    "name": "...",
    "symbol": "...",
    "price": "...",                   // price denominated in USD
    "price_SPARTA": "...",            // price denominated in SPARTA
  }
}
```

## [`/v1/pairs`](https://api.spartanprotocol.org/api/v1/pairs)

Returns data for the Spartan Protocol pairs, sorted by reserves.

### Request

`GET https://api.spartanprotocol.org/api/v1/pairs`

### Response

```json5
{
  "updated_at": 1234567,              // UNIX timestamp
  "data": {
    "0x..._0x...": {                  // the asset ids of SPARTA and BEP20 tokens, joined by an underscore
      "pool_address": "0x...",        // pool address
      "token_name": "...",            // token name
      "token_symbol": "...",          // token symbol
      "token_address": "0x...",       // token address
      "price_SPARTA": "...",          // price denominated in SPARTA
      "volume_SPARTA": "...",         // volume denominated in SPARTA
      "liquidity": "...",             // liquidity denominated in USD
      "liquidity_SPARTA": "..."       // liquidity denominated in SPARTA
    },
    // ...
  }
}
```