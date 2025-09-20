// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "./MultiPorterCrossChain.sol";
import "../interfaces/ITwoPhaseCommitCrossChain.sol";

contract TwoPhaseCommitCrossChain is ITwoPhaseCommitCrossChain, MultiPorterCrossChain {
    enum StageStatus {
        None,
        First,
        Second,
        Done
    }

    struct HiddenMessage {
        uint256 id;
        string fromChain;
        bytes32 hashData;
        address porter;
    }

    struct FirstStageMessage {
        HiddenMessage[] messages;
        StageStatus stage;
    }

    mapping(string => mapping(uint256 => FirstStageMessage)) internal hiddenMessageTable;

    constructor(string memory _chainName) MultiPorterCrossChain(_chainName) {
    }

    function receiveHiddenMessage(string calldata _fromChain, uint _id, bytes32 _hash) override external onlyPorter {
        cachedReceivedMessage[][] storage cachedChainMessage = cachedReceivedMessageTable[_fromChain];
        require(_id <= cachedChainMessage.length + 1, "TwoPhaseCommitCrossChain: id not match");

        ReceivedMessage[] storage receivedChainMessage = receivedMessageTable[_fromChain];
        require(_id >= receivedChainMessage.length + 1, "TwoPhaseCommitCrossChain: message of this id has been aggregated");
        
        mapping(uint256 => FirstStageMessage) storage chainMessage = hiddenMessageTable[_fromChain];
        FirstStageMessage storage firstStageMessage = chainMessage[_id];

        if (firstStageMessage.stage == StageStatus.None) {
            firstStageMessage.stage = StageStatus.First;
        }
        require(firstStageMessage.stage == StageStatus.First, "It is not the first stage");

        // check duplicate commit
        for (uint i = 0; i < firstStageMessage.messages.length; i++) {
            if (firstStageMessage.messages[i].porter == msg.sender) {
                revert("TwoPhaseCommitCrossChain: duplicate commit");
            }
        }
        // add message
        HiddenMessage storage m = firstStageMessage.messages.push();
        m.id = _id;
        m.fromChain = _fromChain;
        m.hashData = _hash;
        m.porter = msg.sender;

        // check if trigger second stage commit
        if (firstStageMessage.messages.length == required) {
            firstStageMessage.stage = StageStatus.Second;
            // clear received messages, currently not punish
            cachedReceivedMessage[] storage cachedMessages;
            if (_id < cachedChainMessage.length + 1) {
                delete chainMessage[_id - 1];
            }
        }
    }

    function revealMessage(IReceivedMessage calldata _message) override external {
        FirstStageMessage storage firstStageMessage = hiddenMessageTable[_message.fromChain][_message.id];
        require(firstStageMessage.stage == StageStatus.Second, "It is not the second stage");

        // if sender finish the first stage
        bool finished = false;
        HiddenMessage storage m = firstStageMessage.messages[0];
        for (uint i = 0; i < firstStageMessage.messages.length; i++) {
            if (firstStageMessage.messages[i].porter == msg.sender) {
                m = firstStageMessage.messages[i];
                finished = true;
            }
        }
        require(finished, "Porter did not finish the first stage");

        // hash verify
        bytes32 h = keccak256(abi.encode(_message.sender, _message.signer, _message.sqos, _message.contractAddress, _message.action, _message.data, msg.sender));
        
        if (h == m.hashData) {
            // verify successfully
            _receivePorterMessage(_message);
        }

        ReceivedMessage[] storage receivedChainMessage = receivedMessageTable[_message.fromChain];
        if (receivedMessageTable[_message.fromChain].length == _message.id) {
            // aggregated
            firstStageMessage.stage = StageStatus.Done;
        }
    }

    function receiveMessage(IReceivedMessage calldata _message) virtual override external onlyPorter {
        mapping(uint256 => FirstStageMessage) storage chainMessage = hiddenMessageTable[_message.fromChain];
        FirstStageMessage storage firstStageMessage = chainMessage[_message.id];
        require(firstStageMessage.stage != StageStatus.Second, "It is the second stage");
        _receivePorterMessage(_message);
    }

    function getFirstStageMessage(string calldata _fromChain, uint256 _id) view external returns (FirstStageMessage memory) {
        return hiddenMessageTable[_fromChain][_id];
    }

    function clearCrossChainMessage(string calldata _toChain) external onlyOwner {
        delete sentMessageTable[_toChain];
        delete receivedMessageTable[_toChain];
        delete cachedReceivedMessageTable[_toChain];
        for (uint i = 0; i < 20; i++) {
            delete hiddenMessageTable[_toChain][i];
        }
    }
}