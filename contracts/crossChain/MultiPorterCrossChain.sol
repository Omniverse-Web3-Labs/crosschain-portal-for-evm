// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "./CrossChain.sol";
import "./MultiPorters.sol";
import "../MessageVerify/MessageVerify.sol";

contract MultiPorterCrossChain is CrossChain, MultiPorters {
    mapping(string => cachedReceivedMessage[][]) internal cachedReceivedMessageTable;
    MessageVerify public verifyContract;

    constructor(string memory _chainName) CrossChain(_chainName) {
    }

    /**
     * @dev Sets address of MessageVerify contract.
     */
    function setVerifyContract(address _address) external onlyOwner {
        verifyContract = MessageVerify(_address);
    }

    /**
     * @dev See ICrossChain.
     */
    function abandonMessage(string calldata _fromChain, uint256 _id, uint256 _errorCode) virtual override external onlyPorter {
        cachedReceivedMessage[][] storage chainMessage = cachedReceivedMessageTable[_fromChain];
        require(_id <= chainMessage.length + 1, "MultiPorterCrossChain: id not match");
        ReceivedMessage[] storage receivedChainMessage = receivedMessageTable[_fromChain];
        require(_id >= receivedChainMessage.length + 1, "MultiPorterCrossChain: message of this id has been aggregated");

        cachedReceivedMessage[] storage cachedMessages;
        if (_id == chainMessage.length + 1) {
            cachedMessages = chainMessage.push();
        }
        else {
            cachedMessages = chainMessage[_id - 1];
        }
        // check duplicate commit
        for (uint i = 0; i < cachedMessages.length; i++) {
            if (cachedMessages[i].porter == msg.sender) {
                revert("MultiPorterCrossChain: duplicate commit");
            }
        }
        // add message
        cachedReceivedMessage storage m = cachedMessages.push();
        m.message.id = _id;
        m.message.fromChain = _fromChain;
        m.message.errorCode = _errorCode;
        m.porter = msg.sender;
        
        // aggregation
        if (cachedMessages.length == required) {
            _abandonMessage(_id, _fromChain, _errorCode);
        }
    }

    /**
     * @dev See ICrossChain.
     */
    function receiveMessage(IReceivedMessage calldata _message) virtual override external onlyPorter {
        _receivePorterMessage(_message);
    }

    function _receivePorterMessage(IReceivedMessage calldata _message) internal {
        cachedReceivedMessage[][] storage chainMessage = cachedReceivedMessageTable[_message.fromChain];
        require(_message.id <= chainMessage.length + 1, "MultiPorterCrossChain: id not match");
        ReceivedMessage[] storage receivedChainMessage = receivedMessageTable[_message.fromChain];
        require(_message.id >= receivedChainMessage.length + 1, "MultiPorterCrossChain: message of this id has been aggregated");

        cachedReceivedMessage[] storage cachedMessages;
        if (_message.id == chainMessage.length + 1) {
            cachedMessages = chainMessage.push();
        }
        else {
            cachedMessages = chainMessage[_message.id - 1];
        }
        // check duplicate commit
        for (uint i = 0; i < cachedMessages.length; i++) {
            if (cachedMessages[i].porter == msg.sender) {
                revert("MultiPorterCrossChain: duplicate commit");
            }
        }
        // add message
        cachedReceivedMessage storage m = cachedMessages.push();
        m.message.id = _message.id;
        m.message.fromChain = _message.fromChain;
        m.message.sender = _message.sender;
        m.message.signer = _message.signer;
        m.message.contractAddress = _message.contractAddress;
        m.message.action = _message.action;
        m.message.data = _message.data;
        m.message.session = _message.session;

        for (uint i = 0; i < _message.sqos.length; i++) {
            // m.message.sqos.push(_message.sqos[i]);
        }
        m.porter = msg.sender;
        
        // aggregation
        if (cachedMessages.length == required) {
            // require(address(verifyContract) != address(0), "Verify Contract not set");
            // cachedReceivedMessage[] memory rets = verifyContract.msgVerify(cachedMessages, 100);
            if (cachedMessages.length > 0) {
                IReceivedMessage memory ret = cachedMessages[0].message;
                _receiveMessage(ret);
            }
        }
    }

    /**
    * @dev Returns the id of the message which the account `_porter` must port from the chain `_chainName`.
    */
    function getMsgPortingTask(string calldata _chainName, address _porter) view external returns (uint256) {
        if (!isPorter[_porter]) {
            return 0;
        }

        cachedReceivedMessage[][] storage chainMessage = cachedReceivedMessageTable[_chainName];
        for (uint256 i = 0; i < chainMessage.length; i++) {
            cachedReceivedMessage[] storage cachedMessages = chainMessage[i];
            bool ported = false;
            for (uint256 j = 0; j < cachedMessages.length; j++) {
                if (cachedMessages[j].porter == _porter) {
                    ported = true;
                    break;
                }
            }
            
            if (!ported) {
                return i + 1;
            }
        }
        return chainMessage.length + 1;
    }
}