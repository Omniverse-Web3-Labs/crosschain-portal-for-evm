// const debug = require('debug')('ck');
// const BN = require('bn.js');
// const utils = require('./utils');
// const web3 = require('web3');
// const web3js = new web3(web3.givenProvider);

// const CrossChain = artifacts.require('./TwoPhaseCommitCrossChain.sol');
// const FeeToken = artifacts.require('./FeeToken.sol');
// const Locker = artifacts.require('./Locker.sol');

// const eq = assert.equal.bind(assert);

// const MINT_TOKEN = new BN('10000000000000000000000');
// const ONE_TOKEN = new BN('1000000000000000000');

// contract('Locker', function(accounts) {
//     let owner = accounts[0];
//     let user1 = accounts[1];

//     describe('Initial state', function() {
//         it('should own contract', async () => {
//             let locker = await Locker.deployed();
//             let o = await locker.owner();
//             eq(o, owner);
//         });

//         it('should have token contract set', async () => {
//             let locker = await Locker.deployed();
//             let token = await locker.tokenContract()
//             eq(token, FeeToken.address);
//         });

//         it('should have cross-chain contract set', async () => {
//             let locker = await Locker.deployed();
//             let crossChain = await locker.crossChainContract()
//             eq(crossChain, CrossChain.address);
//         });
//     });

//     describe('Receive token', function() {
//         describe('Caller is not CrossChain', function() {
//             it('should failed', async () => {
//                 let locker = await Locker.deployed();
//                 await utils.expectThrow(locker.receiveToken(user1, ONE_TOKEN, {from: owner}), 'not CrossChain');
//             });
//         });
//     });

//     describe('Method registering', function() {
//         it('should register successfully', async () => {
//             let locker = await Locker.deployed();
//             await locker.registerDestinationMethod('NEAR', 'locker.shanks.testnet', 'receive', {from: owner});
//             let method = await locker.methodMap('NEAR');
//             eq(method.contractAddress, 'locker.shanks.testnet');
//             eq(method.methodName, 'receive');
//         });
//     });

//     describe('Target registering', function() {
//         it('should register successfully', async () => {
//             let locker = await Locker.deployed();
//             let crossChain = await CrossChain.deployed();
//             await locker.registerTarget('receive', 'string,uint256', 'to,amount', '', {from: owner});
//             let target = await crossChain.targets(locker.address, 'receive');
//             eq(target.abiString, 'string,uint256');
//             eq(target.parameterNamesString, 'to,amount');
//             eq(target.parametertypesString, '');
//         });
//     });

//     describe('Interface registering', function() {
//         it('should register successfully', async () => {
//             let locker = await Locker.deployed();
//             let crossChain = await CrossChain.deployed();
//             let function_str = '{"inputs":[{"name":"_to","type":"address"},{"name":"_amount","type":"uint256"}],"name":"receiveToken","type":"function"}';
//             await locker.registerInterface('receiveToken', function_str, {from: owner});
//             let interface = await crossChain.interfaces(locker.address, 'receiveToken');
//             eq(interface, function_str);
//         });
//     });

//     describe('Token sending', function() {
//         describe('Without balance', function() {
//             it('Should failed', async () => {
//                 let to = 'test.omniverse.near';
//                 let toChain = 'NEAR';
//                 let locker = await Locker.deployed();
//                 await utils.expectThrow(locker.sendToken(to, ONE_TOKEN, toChain, {from: user1}), 'exceeds balance');
//             });
//         });

//         describe('With balance', function() {
//             before(async function() {
//                 let token = await FeeToken.deployed();
//                 await token.mint(user1, MINT_TOKEN);
//             });

//             describe('Without approval', function() {
//                 it('should failed', async () => {
//                     let to = 'test.omniverse.near';
//                     let toChain = 'NEAR';
//                     let locker = await Locker.deployed();
//                     await utils.expectThrow(locker.sendToken(to, ONE_TOKEN, toChain, {from: user1}), 'exceeds allowance');
//                 });
//             });

//             describe('With approval', function() {
//                 before(async function() {
//                     let token = await FeeToken.deployed();
//                     await token.approve(Locker.address, ONE_TOKEN, {from: user1});
//                 });
    
//                 it('should have approval', async () => {
//                     let token = await FeeToken.deployed();
//                     let account = await token.allowance(user1, Locker.address);
//                     let balance1 = await token.balanceOf(user1);
//                     assert(account.eq(ONE_TOKEN));
//                 });
    
//                 it('should send successfully', async () => {
//                     let locker = await Locker.deployed();
//                     let to = 'test.omniverse.near';
//                     let toChain = 'NEAR';
//                     await locker.sendToken(to, ONE_TOKEN, toChain, {from: user1});
//                 });
        
//                 describe('Message table', function() {
//                     it('should have 1 element', async () => {
//                         let crossChain = await CrossChain.deployed();
//                         let messageCount = await crossChain.getSentMessageNumber('NEAR');
//                         assert(messageCount.eq(new BN('1')));
//                     });
            
//                     it('should have stored the previous message', async () => {
//                         let crossChain = await CrossChain.deployed();
//                         let message = await crossChain.getSentMessage('NEAR', 1);
//                         eq(message.id, 1);
//                         eq(message.fromChain, 'AVALANCHE');
//                         eq(message.toChain, 'NEAR');
//                         eq(message.sender, Locker.address);
//                         eq(message.content.contractAddress, 'locker.shanks.testnet');
//                         eq(message.content.action, 'receive');
//                         let arguments = web3js.eth.abi.encodeParameters(['string', 'uint256'], ['test.omniverse.near', ONE_TOKEN]);
//                         eq(message.content.data.arguments, arguments);
//                     });

//                     describe('Message data', function() {
//                         it('should be decoded properly', async() => {
//                             let crossChain = await CrossChain.deployed();
//                             let message = await crossChain.getSentMessage('NEAR', 1);
//                             eq(message.id, 1);
//                             let target = await crossChain.targets(Locker.address, message.content.action);
//                             let abi = target.abiString.split(',');
//                             let arguments = message.content.data.arguments;
//                             let parameterNamesString = target.parameterNamesString;
//                             let parameterNames = parameterNamesString.split(',');
//                             let result = web3js.eth.abi.decodeParameters(abi, arguments);
//                             let jsonObj = {};
//                             for (let i = 0; i < parameterNames.length; i++) {
//                                 let value = result[i];
//                                 jsonObj[parameterNames[i]] = value;
//                             }
//                             let expected = {to:'test.omniverse.near', amount: '1000000000000000000'};
//                             eq(JSON.stringify(expected), JSON.stringify(jsonObj));
//                         });
//                     });
//                 });
//             });
//         }); 
//     });
// });