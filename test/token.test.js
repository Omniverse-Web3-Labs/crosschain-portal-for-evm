// const debug = require('debug')('ck');
// const BN = require('bn.js');

// const FeeToken = artifacts.require('./FeeToken.sol');

// const eq = assert.equal.bind(assert);

// const MINT_TOKEN = new BN('10000000000000000000000');
// const HUNDRED_TOKEN = new BN('100000000000000000000');

// contract('FeeToken', function(accounts) {
//     let owner = accounts[0];
//     let user1 = accounts[1];
//     let user2 = accounts[2];
    
//     describe('Initial state', function() {
//         it('should own contract', async () => {
//             let token = await FeeToken.deployed();
//             let o = await token.owner();
//             eq(o, owner);
//         });
//     });

//     describe('Token minting', function() {
//         it('should execute successfully', async () => {
//             let token = await FeeToken.deployed();
//             await token.mint(user1, MINT_TOKEN);
//             let balance = await token.balanceOf(user1);
//             assert(balance.eq(MINT_TOKEN));
//             let total = await token.totalSupply();
//             assert(total.eq(MINT_TOKEN));
//         })
//     });

//     describe('Token transfer', function() {
//         it('should execute successfully', async () => {
//             let token = await FeeToken.deployed();
//             await token.transfer(user2, HUNDRED_TOKEN, {from: user1});
//             let balance1 = await token.balanceOf(user1);
//             assert(balance1.eq(MINT_TOKEN.sub(HUNDRED_TOKEN)));
//             let balance2 = await token.balanceOf(user2);
//             assert(balance2.eq(HUNDRED_TOKEN));
//             let total = await token.totalSupply();
//             assert(total.eq(MINT_TOKEN));
//         })
//     });
// });