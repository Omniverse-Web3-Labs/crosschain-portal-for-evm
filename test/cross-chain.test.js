const debug = require('debug')('ck');
const BN = require('bn.js');
const utils = require('./utils');
const web3 = require('web3');
const web3js = new web3(web3.givenProvider);

const CrossChain = artifacts.require('./TwoPhaseCommitCrossChain.sol');
const Locker = artifacts.require('./test/LockerMock.sol');

const eq = assert.equal.bind(assert);

const EMPTY_PAYLOAD_ITEM = {
    name: '',
    msgType: '',
    value: '0x',
};

contract('CrossChain', function(accounts) {
    let fromChain = 'NEAR';
    let sender = 'near_sender';
    let signer = 'near_signer';

    let owner = accounts[0];
    let user1 = accounts[1];
    let user2 = accounts[2];
    let user3 = accounts[3];
    let user4 = accounts[4];

    let locker;

    describe('Initial state', function() {
        it('should own contract', async () => {
            let crossChain = await CrossChain.deployed();
            let o = await crossChain.owner();
            eq(o, owner);
        });
    });

    let initContract = async function() {
        let crossChain = await CrossChain.deployed();
        locker = await Locker.new();
        await locker.setCrossChainContract(CrossChain.address);
        
        // register porters
        await crossChain.changePortersAndRequirement([user1, user2, user3, user4], 3);
    }
    
    contract('Message sending', function() {
        before(async function() {
            await initContract();
        });

        it('should send successfully', async () => {
            let crossChain = await CrossChain.deployed();
            let toChain = 'NEAR';
            let item = {
                name: 'greeting',
                msgType: 11,
                value: '0x00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001400000000000000000000000000000000000000000000000000000000000000006504c41544f4e000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000094772656574696e6773000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000144772656574696e672066726f6d20504c41544f4e00000000000000000000000000000000000000000000000000000000000000000000000000000000000000374d6f6e204a756e20323720323032322031363a33343a323820474d542b3038303020284368696e61205374616e646172642054696d6529000000000000000000',
            };
            let data = {items: [item]};
            await crossChain.sendMessage([toChain, {reveal: 0}, {contractAddress: 'near_address', action: 'near_function', data: data},
                {id: 0, callback: "0x11111111"}], {from: user1});
        });

        describe('Message table', function() {
            it('should have 1 element', async () => {
                let crossChain = await CrossChain.deployed();
                let messageCount = await crossChain.getSentMessageNumber('NEAR');
                console.log('messageCount', messageCount);
                assert(messageCount.eq(new BN('1')));
            });
    
            it('should have stored the previous message', async () => {
                let crossChain = await CrossChain.deployed();
                let message = await crossChain.getSentMessage('NEAR', 1);
                eq(message.id, 1);
                eq(message.fromChain, 'BSCTEST');
                eq(message.toChain, 'NEAR');
                eq(message.sender, user1);
                eq(message.content.contractAddress, 'near_address');
                eq(message.content.action, 'near_function');
                eq(message.content.data.items.length, 1);
            });
        });
    });

    contract('Message receiving', function() {
        before(async function() {
            await initContract();
        });

        describe('Not porter', function() {
            it('should fail', async () => {
                let to = locker.address;
                let action = '0x11111111';
                let crossChain = await CrossChain.deployed();
                let item = {
                    name: 'greeting',
                    msgType: 11,
                    value: '0x00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001400000000000000000000000000000000000000000000000000000000000000006504c41544f4e000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000094772656574696e6773000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000144772656574696e672066726f6d20504c41544f4e00000000000000000000000000000000000000000000000000000000000000000000000000000000000000374d6f6e204a756e20323720323032322031363a33343a323820474d542b3038303020284368696e61205374616e646172642054696d6529000000000000000000',
                };
                let calldata = {items: [item]};
                let argument = [10, 'NEAR', 'near_address', user1, {reveal: 0}, to, action, calldata, {id: 0, callback: '0x11111111'}, 0];
                await utils.expectThrow(crossChain.receiveMessage(argument), 'not registered');
            });
        });

        describe('Id not match', function() {
            it('should fail', async () => {
                let to = locker.address;
                let action = '0x11111111';
                let crossChain = await CrossChain.deployed();
                let item = {
                    name: 'greeting',
                    msgType: 11,
                    value: '0x00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001400000000000000000000000000000000000000000000000000000000000000006504c41544f4e000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000094772656574696e6773000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000144772656574696e672066726f6d20504c41544f4e00000000000000000000000000000000000000000000000000000000000000000000000000000000000000374d6f6e204a756e20323720323032322031363a33343a323820474d542b3038303020284368696e61205374616e646172642054696d6529000000000000000000',
                };
                let calldata = {items: [item]};
                let argument = [10, 'NEAR', 'near_address', user1, {reveal: 0}, to, action, calldata, {id: 0, callback: '0x11111111'}, 0];
                await utils.expectThrow(crossChain.receiveMessage(argument, {from: user1}), 'not match');
            });
        });
            
        describe('Id match', function() {
            it('should receive successfully', async () => {
                let to = locker.address;
                let action = '0x11111111';
                let crossChain = await CrossChain.deployed();
                let item = {
                    name: 'greeting',
                    msgType: 11,
                    value: '0x00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001400000000000000000000000000000000000000000000000000000000000000006504c41544f4e000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000094772656574696e6773000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000144772656574696e672066726f6d20504c41544f4e00000000000000000000000000000000000000000000000000000000000000000000000000000000000000374d6f6e204a756e20323720323032322031363a33343a323820474d542b3038303020284368696e61205374616e646172642054696d6529000000000000000000',
                };
                let calldata = {items: [item]};
                let argument = [1, 'NEAR', 'near_address', user1, [0], to, action, calldata, [0, '0x00000000'], 0];
                await crossChain.receiveMessage(argument, {from: user1});
                await crossChain.receiveMessage(argument, {from: user2});
                await crossChain.receiveMessage(argument, {from: user3});
                let number = await crossChain.getReceivedMessageNumber('NEAR');
                assert(number.eq(new BN('1')));
                number = await crossChain.getMsgPortingTask('NEAR');
                assert(number.eq(new BN('2')));                
                let IDs = await crossChain.getExecutableMessages(['NEAR']);
                eq(IDs[0].id, 1);
            });
        });

        contract('It is at the second two-step-commit stage', function() {
            before(async function() {
                await initContract();
                let crossChain = await CrossChain.deployed();
                let hash = '0x592fa743889fc7f92ac2a37bb1f5ba1daf2a5c84741ca0e0061d243a2e6707ba';
                crossChain.receiveHiddenMessage('NEAR', 1, hash, {from: user1});
                crossChain.receiveHiddenMessage('NEAR', 1, hash, {from: user2});
                crossChain.receiveHiddenMessage('NEAR', 1, hash, {from: user3});
            });

            it('should failed', async () => {
                let to = locker.address;
                let action = '0x11111111';
                let crossChain = await CrossChain.deployed();
                let item = {
                    name: 'greeting',
                    msgType: 11,
                    value: '0x00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001400000000000000000000000000000000000000000000000000000000000000006504c41544f4e000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000094772656574696e6773000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000144772656574696e672066726f6d20504c41544f4e00000000000000000000000000000000000000000000000000000000000000000000000000000000000000374d6f6e204a756e20323720323032322031363a33343a323820474d542b3038303020284368696e61205374616e646172642054696d6529000000000000000000',
                };
                let calldata = {items: [item]};
                let argument = [1, 'NEAR', 'near_address', user1, {reveal: 0}, to, action, calldata, {id: 0, callback: '0x11111111'}, 0];
                await utils.expectThrow(crossChain.receiveMessage(argument, {from: user1}), 'It is the second stage');
            });
        });
    });

    contract('Message executing', function() {
        before(async function() {    
            await initContract();
            // receive message
            let to = locker.address;
            let action = '0x533017fb';
            let crossChain = await CrossChain.deployed();
            let item = {
                name: 'message',
                msgType: 0,
                // Hello World
                value: '0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000b48656c6c6f20576f726c64000000000000000000000000000000000000000000',
            };
            let calldata = {items: [item]};
            let argument = [1, 'NEAR', 'near_address', user1, {reveal: 0}, to, action, calldata, {id: 0, callback: '0x'}, 0];
            await crossChain.receiveMessage(argument, {from: user1});
            await crossChain.receiveMessage(argument, {from: user2});
            await crossChain.receiveMessage(argument, {from: user3});
        });

        it('should execute successfully', async () => {
            let crossChain = await CrossChain.deployed();
            await crossChain.executeMessage('NEAR', 1);
            let message = await locker.receivedMessage();
            eq(message, 'Hello World');
        });

        describe('Message which has been executed', function() {
            it('should execute failed', async () => {
                let crossChain = await CrossChain.deployed();
                await utils.expectThrow(crossChain.executeMessage('NEAR', 1), 'The message has been executed');
            });
        });
    });

    contract('Message abandoning', function() {
        before(async function() {
            await initContract();
        });

        it('should abandon successfully', async () => {
            let crossChain = await CrossChain.deployed();
            await crossChain.abandonMessage('NEAR', 1, 1, {from: user1});
            await crossChain.abandonMessage('NEAR', 1, 1, {from: user2});
            await crossChain.abandonMessage('NEAR', 1, 1, {from: user3});
            let number = await crossChain.getReceivedMessageNumber('NEAR');
            assert(number.eq(new BN('1')));
            number = await crossChain.getMsgPortingTask('NEAR');
            assert(number.eq(new BN('2')));                
            let IDs = await crossChain.getExecutableMessages(['NEAR']);
            eq(IDs.length, 0);
        });
    });

    // describe('Receive hidden message', function() {
    //     contract('ID not match', function() {
    //         before(async function() {
    //             await initContract();
    //         });

    //         it('should failed', async () => {
    //             let crossChain = await CrossChain.deployed();
    //             let hash = '0x592fa743889fc7f92ac2a37bb1f5ba1daf2a5c84741ca0e0061d243a2e6707ba';
    //             await utils.expectThrow(crossChain.receiveHiddenMessage('NEAR', 2, hash, {from: user1}), 'id not match');
    //         });
    //     });

    //     contract('The message of this id has been aggregated', function() {
    //         before(async function() {
    //             await initContract();
    //         });

    //         before(async function() {
    //             // receive message
    //             let to = locker.address;
    //             let action = 'receiveMessage';
    //             let crossChain = await CrossChain.deployed();
    //             let function_str = await crossChain.interfaces(user1, action);
    //             let function_json = JSON.parse(function_str);
    //             let calldata = web3js.eth.abi.encodeFunctionCall(function_json, ['Hello World']);
    //             await crossChain.receiveMessage('NEAR', 1, 'near_address', user1, to, {reveal: 0}, action, calldata, {resType: 0, id: 0}, {from: user1});
    //             await crossChain.receiveMessage('NEAR', 1, 'near_address', user1, to, {reveal: 0}, action, calldata, {resType: 0, id: 0}, {from: user2});
    //             await crossChain.receiveMessage('NEAR', 1, 'near_address', user1, to, {reveal: 0}, action, calldata, {resType: 0, id: 0}, {from: user3});
    //         });

    //         it('should failed', async () => {
    //             let crossChain = await CrossChain.deployed();
    //             let hash = '0x592fa743889fc7f92ac2a37bb1f5ba1daf2a5c84741ca0e0061d243a2e6707ba';
    //             await utils.expectThrow(crossChain.receiveHiddenMessage('NEAR', 1, hash, {from: user1}), 'been aggregated');
    //         });
    //     });

    //     contract('The message is not at the first stage', function() {
    //         before(async function() {
    //             await initContract();
    //             // receive message
    //             let crossChain = await CrossChain.deployed();
    //             let hash = '0x592fa743889fc7f92ac2a37bb1f5ba1daf2a5c84741ca0e0061d243a2e6707ba';
    //             await crossChain.receiveHiddenMessage('NEAR', 1, hash, {from: user1});
    //             await crossChain.receiveHiddenMessage('NEAR', 1, hash, {from: user2});
    //             await crossChain.receiveHiddenMessage('NEAR', 1, hash, {from: user3});
    //         });

    //         it('should failed', async () => {
    //             let crossChain = await CrossChain.deployed();
    //             let hash = '0x592fa743889fc7f92ac2a37bb1f5ba1daf2a5c84741ca0e0061d243a2e6707ba';
    //             await utils.expectThrow(crossChain.receiveHiddenMessage('NEAR', 1, hash, {from: user4}), 'It is not the first stage');
    //         });
    //     });

    //     contract('Duplicate commit', function() {
    //         before(async function() {
    //             await initContract();
    //         });
            
    //         it('should failed', async () => {
    //             let crossChain = await CrossChain.deployed();
    //             let hash = '0x592fa743889fc7f92ac2a37bb1f5ba1daf2a5c84741ca0e0061d243a2e6707ba';
    //             await crossChain.receiveHiddenMessage('NEAR', 1, hash, {from: user1});
    //             await utils.expectThrow(crossChain.receiveHiddenMessage('NEAR', 1, hash, {from: user1}), 'duplicate commit');
    //         });
    //     });

    //     contract('Normal process', function() {
    //         before(async function() {
    //             await initContract();
    //         });

    //         it('should execute successfully', async () => {
    //             let crossChain = await CrossChain.deployed();
    //             let hash = '0x592fa743889fc7f92ac2a37bb1f5ba1daf2a5c84741ca0e0061d243a2e6707ba';
    //             await crossChain.receiveHiddenMessage('NEAR', 1, hash, {from: user1});
    //             await crossChain.receiveHiddenMessage('NEAR', 1, hash, {from: user2});
    //             await crossChain.receiveHiddenMessage('NEAR', 1, hash, {from: user3});
    //             let message = await crossChain.getFirstStageMessage('NEAR', 1);
    //             eq(message.stage, 2);
    //         });
    //     });
    // });

    // describe('Reveal message', function() {
    //     let sqos = {reveal: 0};
    //     let action = 'receiveMessage';
    //     let calldata;

    //     let firstStage = async function() {
    //         let crossChain = await CrossChain.deployed();
    //         let function_str = await crossChain.interfaces(user1, action);
    //         let function_json = JSON.parse(function_str);
    //         calldata = web3js.eth.abi.encodeFunctionCall(function_json, ['Hello World']);
    //         let to = locker.address;
    //         let getHash = (user) => {
    //             let d = web3js.eth.abi.encodeParameters(['string','string', 'tuple(uint8)', 'address','string','bytes','address'],
    //                 [sender, signer, [sqos.reveal], to, action, calldata, user]);
    //             let hash = web3.utils.sha3(d);
    //             return hash;
    //         }
    //         await crossChain.receiveHiddenMessage('NEAR', 1, getHash(user1), {from: user1});
    //         await crossChain.receiveHiddenMessage('NEAR', 1, getHash(user2), {from: user2});
    //         await crossChain.receiveHiddenMessage('NEAR', 1, getHash(user3), {from: user3});
    //     }

    //     contract('Not the second stage', function() {            
    //         before(async function() {
    //             await initContract();
    //             let crossChain = await CrossChain.deployed();
    //             let function_str = await crossChain.interfaces(user1, action);
    //             let function_json = JSON.parse(function_str);
    //             calldata = web3js.eth.abi.encodeFunctionCall(function_json, ['Hello World']);
    //         });

    //         describe('No hidden message committed', function() {
    //             it('should failed', async () => {
    //                 let crossChain = await CrossChain.deployed();
    //                 await utils.expectThrow(crossChain.revealMessage(fromChain, 1, sender, signer, locker.address, sqos, action, calldata, {resType: 0, id: 0}, {from: user1}), 'It is not the second stage');
    //             });
    //         });

    //         describe('It is at the second stage', function() {
    //             before(async function() {
    //                 let crossChain = await CrossChain.deployed();
    //                 let hash = '0x592fa743889fc7f92ac2a37bb1f5ba1daf2a5c84741ca0e0061d243a2e6707ba';
    //                 await crossChain.receiveHiddenMessage('NEAR', 1, hash, {from: user1});
    //             });

    //             it('should failed', async () => {
    //                 let crossChain = await CrossChain.deployed();
    //                 await utils.expectThrow(crossChain.revealMessage(fromChain, 1, sender, signer, locker.address, sqos, action, calldata, {resType: 0, id: 0}, {from: user1}), 'It is not the second stage');
    //             });
    //         });
    //     });

    //     contract('Porter did not finish the first stage', function() {            
    //         before(async function() {
    //             await initContract();
    //             await firstStage();
    //         });

    //         it('should failed', async () => {
    //             let crossChain = await CrossChain.deployed();
    //             await utils.expectThrow(crossChain.revealMessage(fromChain, 1, sender, signer, locker.address, sqos, action, calldata, {resType: 0, id: 0}, {from: user4}), 'Porter did not finish the first stage');
    //         });
    //     });

    //     contract('Normal process', function() {
    //         before(async function() {
    //             await initContract();
    //             await firstStage();
    //         });

    //         it('should execute successfully', async () => {
    //             let crossChain = await CrossChain.deployed();
    //             await crossChain.revealMessage(fromChain, 1, sender, signer, locker.address, sqos, action, calldata, {resType: 0, id: 0}, {from: user1});
    //             await crossChain.revealMessage(fromChain, 1, sender, signer, locker.address, sqos, action, calldata, {resType: 0, id: 0}, {from: user2});
    //             await crossChain.revealMessage(fromChain, 1, sender, signer, locker.address, sqos, action, calldata, {resType: 0, id: 0}, {from: user3});
    //             let message = await crossChain.getFirstStageMessage('NEAR', 1);
    //             eq(message.stage, 3);
    //         });
    //     });
    // });
});