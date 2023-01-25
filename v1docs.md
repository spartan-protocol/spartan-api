# Docs

All Spartan Protocol pairs consist of a SPARTA token paired with a BEP20 Token. 
SPARTA token address: 0x3910db0600eA925F63C36DdB1351aB6E2c6eb102

## [`/v1/supply`](https://api.spartanprotocol.org/api/v1/supply)

Returns relevant supply figures (Total supply, circulating supply & burned/dead supply)

### Request

`GET https://api.spartanprotocol.org/api/v1/supply`

### Response

```json5
{
  "totalSupply": 123456,
  "circulatingSupply": 12345,
  "burned": 123,
}
```

## [`/v1/circulating`](https://api.spartanprotocol.org/api/v1/circulating)

Returns the circulating supply

### Request

`GET https://api.spartanprotocol.org/api/v1/circulating`

### Response

```json5
89601682.073863892965724865
```

## [`/v1/totalSupply`](https://api.spartanprotocol.org/api/v1/totalSupply)

Returns the total supply

### Request

`GET https://api.spartanprotocol.org/api/v1/totalSupply`

### Response

```json5
98599960.126087144180977466
```

## [`/v1/tvlSPARTA`](https://api.spartanprotocol.org/api/v1/tvlSPARTA)

Returns the total protocol value locked, denominated in SPARTA units

### Request

`GET https://api.spartanprotocol.org/api/v1/tvlSPARTA`

### Response

```json5
23975737.340601869008484302
```

## [`/v1/tvlUSD`](https://api.spartanprotocol.org/api/v1/tvlUSD)

Returns the total protocol value locked, denominated in $USD

### Request

`GET https://api.spartanprotocol.org/api/v1/tvlUSD`

### Response

```json5
5063921.575946114470368536721846
```

## [`/v1/pools`](https://api.spartanprotocol.org/api/v1/pools)

Returns every Spartan Protocol pool in order of highest TVL

### Request

`GET https://api.spartanprotocol.org/api/v1/pools`

### Response

```json5
{
  "0x..._0x...": {                  // Addresses of SPARTA & paired BEP20 token, joined by an underscore
    "ticker_id": "SPARTA_...",      // Ticker of each paired asset joined by underscore | BASE_QUOTE | ie. "SPARTA_BUSD"
    "poolAddr": "0x...",            // Address of the pool's contract
    "base_id": "0x3910db0600eA925F63C36DdB1351aB6E2c6eb102", // SPARTA token contract address (always the base)
    "base_name": "Spartan Protocol Token", // SPARTA token name (always the base)
    "base_symbol": "SPARTA",        // SPARTA token symbol (always the base)
    "quote_id": "0x...",            // Contract address for the paired token
    "quote_name": "...",            // Name of the paired token | ie. "BUSD Token"
    "quote_symbol": "...",          // Symbol for the paired token | ie. "BUSD"
    "last_price": "...",            // Price denominated in SPARTA  
    "last_price_quote": "...",      // Price denominated in QUOTE token  
    "last_price_usd": "...",        // Price denominated in USD
    "volume": "...",                // Past 24hrs volume denominated in SPARTA
    "volume_quote": "...",          // Past 24hrs volume denominated in QUOTE token
    "volume_usd": "...",            // Past 24hrs volume denominated in USD
    "liquidity_usd": "...",         // Liquidity denominated in USD
    "depth_two_pc_plus_quote": "...", // Liquidity available within +2% spot price denominated in QUOTE token
    "depth_two_pc_plus_usd": "...", // Liquidity available within +2% spot price denominated in USD (better to use QUOTE * market price)
    "depth_two_pc_minus_base": "...", // Liquidity available within -2% spot price denominated in BASE token
    "depth_two_pc_minus_usd": "...", // Liquidity available within -2% spot price denominated in USD (better to use BASE * market price)
    "swapUrl": "https://dapp.spartanprotocol.org/swap?asset1=0x...", // Direct URL to swap token in the pool
  },
  // ...
}
```

## [`/v1/pool?address=0x...`](https://api.spartanprotocol.org/api/v1/pool?address=0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56)

Returns a single Spartan Protocol pool based on quote token address

### Request

`GET https://api.spartanprotocol.org/api/v1/pool?address=0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56`

### Response

```json5
{
  "0x..._0x...": {                  // Addresses of SPARTA & paired BEP20 token, joined by an underscore
    "ticker_id": "SPARTA_...",      // Ticker of each paired asset joined by underscore | BASE_QUOTE | ie. "SPARTA_BUSD"
    "pool_address": "0x...",        // Address of the pool's contract
    "base_id": "0x3910db0600eA925F63C36DdB1351aB6E2c6eb102", // SPARTA token contract address (always the base)
    "base_name": "Spartan Protocol Token", // SPARTA token name (always the base)
    "base_symbol": "SPARTA",        // SPARTA token symbol (always the base)
    "quote_id": "0x...",            // Contract address for the paired token
    "quote_name": "...",            // Name of the paired token | ie. "BUSD Token"
    "quote_symbol": "...",          // Symbol for the paired token | ie. "BUSD"
    "last_price": "...",            // Price denominated in SPARTA  
    "last_price_quote": "...",      // Price denominated in QUOTE token  
    "last_price_usd": "...",        // Price denominated in USD
    "volume": "...",                // Past 24hrs volume denominated in SPARTA
    "volume_quote": "...",          // Past 24hrs volume denominated in QUOTE token
    "volume_usd": "...",            // Past 24hrs volume denominated in USD
    "liquidity_usd": "...",         // Liquidity denominated in USD
    "depth_two_pc_plus_quote": "...", // Liquidity available within +2% spot price denominated in QUOTE token
    "depth_two_pc_plus_usd": "...", // Liquidity available within +2% spot price denominated in USD (better to use QUOTE * market price)
    "depth_two_pc_minus_base": "...", // Liquidity available within -2% spot price denominated in BASE token
    "depth_two_pc_minus_usd": "...", // Liquidity available within -2% spot price denominated in USD (better to use BASE * market price)
    "swapUrl": "https://dapp.spartanprotocol.org/swap?asset1=0x...", // Direct URL to swap token in the pool
  }
}
```

## [`/v1/swapQuote?inputAddr=0x...&outputAddr=0x...&inputUnits=100000000000000000000`](https://api.spartanprotocol.org/api/v1/swapQuote?inputAddr=0x55d398326f99059fF775485246999027B3197955&outputAddr=0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56&inputUnits=100000000000000000000)

Returns estimated swap output for swapping InputToken * InputUnits -> OutputToken via SpartanProtocol V2 AMM.
`inputUnits` type is WEI (not units). So if you want to swap 1.00 BNB/unit you would enter 1000000000000000000.
The return amount is also in WEI as a string, so interfaces will need to convert from WEI -> units for users.
When swapping to/from BNB you can enter either the WBNB address (0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c) or the BNB address (0x0000000000000000000000000000000000000000) the API will convert both to the corresponding correct WBNB pool.

### Request

`GET https://api.spartanprotocol.org/api/v1/swapQuote?inputAddr=0x55d398326f99059fF775485246999027B3197955&outputAddr=0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56&inputUnits=100000000000000000000`

### Response

```json5
"100019501036169151511"
```
