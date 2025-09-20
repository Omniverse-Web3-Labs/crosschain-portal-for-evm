# crosschain portal for evm
Smart contracts that provide some of the basic functions of the cross chain service.

## Version : 0.1

This repository contains examples of contracts that are useful when deploying, managing, and/or using a crosschain network. They are provided for reference purposes:

   * [cross_chain](./contracts)
   * [locker](./contracts/Locker.sol)

Dependencies:
* [@openzeppelin-contracts v4.4.2](https://github.com/OpenZeppelin/openzeppelin-contracts)
* [@truffle/hdwallet-provider v2.0.0](https://www.npmjs.com/package/@truffle/hdwallet-provider)

## Build

To build the contracts follow the instructions in [Getting started](https://trufflesuite.com/docs/truffle/quickstart.html) section.

### Prepare
You must paste your private key which you want to use to deploy the cross-chain contract, and also get some tokens into the account.

### Compile
```
truffle compile
```

### Deploy
```
truffle migrate --network <CHAIN_NAME> --reset
```

`<CHAIN_NAME>` is the chain name on which you want to deploy the cross-chain contract.

## Initialize

Before using the cross-chain contract, you must set the validators.

### Configure

There are some information are configured in the file `config/default.json` for networks on which you want to deploy cross-chain contracts.

- **nodeAddress**: rpc/ws address of a node.
- **chainId**: Chain id of the chain.
- **crossChainContractAddress**: Address of the cross-chain contract, which will be filled automatically after migrating.
- **porters**: List of validator addressed which will have authority to submit message.
- **request**: The minimum number of validators to aggregate messages.

### Execute

```
node register/index -i <CHAIN_NAME>
```

## Example

### Develop
```
truffle migrate --network BSCTEST --reset --skip-dry-run
```

The address of cross-chain contract is **0x5947661057f484BEC375Fb9d53F81973f9202fbc**

### Initialize
```
node register/index.js -i BSCTEST
```