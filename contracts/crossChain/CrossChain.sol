// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;
import "@openzeppelin/contracts/access/Ownable.sol";
import "../FeeToken.sol";
import "../interfaces/ICrossChain.sol";

/*
 * This is a contract for cross chain, it only implement general cross-chain
 * functions. If you needs a shreshold for receiving message, you can derive
 * a contract inheritted from this contract, so is making a contract with a
 * deleting function.
 */
abstract contract CrossChain is ICrossChain, Ownable {
  // from chain
  string public chainName;
  // Fee token contract
  FeeToken public tokenContract;
  // sent message table
  mapping(string => SentMessage[]) internal sentMessageTable;
  /*
    The key is continually incremented to identify the received message.
    Multiple unprocessed messages can exist at the same time, and
    messages that are too old will be cleared  
  */
  mapping(string => ReceivedMessage[]) internal receivedMessageTable;
  // available received message index table
  // @note: this can be moved to a derived contract
  // mapping(string => uint256) public availableReceivedMessageIndexTable;
  // simplify message to save gas
  SimplifiedMessage internal currentSimplifiedMessage;

  constructor(string memory _chainName) {
    chainName = _chainName;
  }

  /**
   * @dev See ICrossChain.
   */
  function setTokenContract(address _address) external override onlyOwner {
    tokenContract = FeeToken(_address);
  }

  /**
   * @dev See ICrossChain.
   */
  function sendMessage(ISentMessage calldata _message) override external returns (uint256) {
    SentMessage[] storage chainMessage = sentMessageTable[_message.toChain];
    SentMessage storage message = chainMessage.push();
    message.id = chainMessage.length;
    message.fromChain = chainName;
    message.toChain = _message.toChain;
    message.sender = msg.sender;
    message.signer = tx.origin;
    message.session = _message.session;
    message.content.contractAddress = _message.content.contractAddress;
    message.content.action = _message.content.action;
    for (uint i = 0; i < _message.content.data.items.length; i++) {
      message.content.data.items.push(_message.content.data.items[i]);
    }

    for (uint i = 0; i < _message.sqos.length; i++) {
      message.sqos.push(_message.sqos[i]);
    }
    return message.id;
  }

  /**
   * @dev Abandons message.
   */
  function _abandonMessage(uint256 _id, string calldata _fromChain, uint256 _errorCode) internal {
    ReceivedMessage[] storage chainMessage = receivedMessageTable[_fromChain];
    require(_id == chainMessage.length + 1, "CrossChain: id not match");

    ReceivedMessage storage message = chainMessage.push();
    message.id = _id;
    message.fromChain = _fromChain;
    message.errorCode = _errorCode;
  }

  /**
   * @dev Receives message.
   */
  function _receiveMessage(IReceivedMessage memory _message) internal {
    ReceivedMessage[] storage chainMessage = receivedMessageTable[_message.fromChain];
    require(_message.id == chainMessage.length + 1, "CrossChain: id not match");

    ReceivedMessage storage message = chainMessage.push();
    message.id = _message.id;
    message.fromChain = _message.fromChain;
    message.sender = _message.sender;
    message.signer = _message.signer;
    message.contractAddress = _message.contractAddress;
    message.action = _message.action;
    for (uint i = 0; i < _message.data.items.length; i++) {
      message.data.items.push(_message.data.items[i]);
    }

    for (uint i = 0; i < _message.sqos.length; i++) {
      message.sqos.push(_message.sqos[i]);
    }
    message.session = _message.session;
  }

  /**
   * @dev See ICrossChain.
   */
  function executeMessage(string calldata _chainName, uint256 _id) override external {
    ReceivedMessage[] storage chainMessage = receivedMessageTable[_chainName];
    ReceivedMessage storage message = chainMessage[_id - 1];
    require(!message.executed, "The message has been executed");
    message.executed = true;

    bytes memory data = abi.encodeWithSignature("verify(string,bytes4,string)", _chainName, message.action, message.sender);
    (bool verifySuccess,) = message.contractAddress.call(data);
    // if (!verifySuccess) {
    //   revert("verify failed");
    // }

    currentSimplifiedMessage.id = message.id;
    currentSimplifiedMessage.fromChain = message.fromChain;
    currentSimplifiedMessage.sender = message.sender;
    currentSimplifiedMessage.signer = message.signer;
    currentSimplifiedMessage.sqos = message.sqos;
    currentSimplifiedMessage.contractAddress = message.contractAddress;
    currentSimplifiedMessage.action = message.action;
    currentSimplifiedMessage.session = message.session;

    data = bytes.concat(message.action, abi.encode(message.data));
    (bool success,) = message.contractAddress.call(data);
    // if (!success) {
    //   revert("execute failed");
    // }
    // revert("hahaha");
  }

  /**
   * @dev See ICrossChain.
   */
  function getCurrentMessage() view external override returns (SimplifiedMessage memory){
    return currentSimplifiedMessage;
  } 

  /**
   * @dev See ICrossChain.
   */
  function getSentMessageNumber(string calldata _chainName) view external override returns (uint256) {
    SentMessage[] storage chainMessage = sentMessageTable[_chainName];
    return chainMessage.length;
  }

  /**
   * @dev See ICrossChain.
   */
  function getReceivedMessageNumber(string calldata _chainName) view external override returns (uint256) {
    ReceivedMessage[] storage chainMessage = receivedMessageTable[_chainName];
    return chainMessage.length;
  }

  /**
    * @dev See ICrossChain.
    */
  function getSentMessage(string calldata _chainName, uint256 _id) view external override returns (SentMessage memory) {
    SentMessage[] storage chainMessage = sentMessageTable[_chainName];
    return chainMessage[_id - 1];
  }

  /**
    * @dev See ICrossChain.
    */
  function getReceivedMessage(string calldata _chainName, uint256 _id) view external override returns (ReceivedMessage memory) {
    ReceivedMessage[] storage chainMessage = receivedMessageTable[_chainName];
    return chainMessage[_id - 1];
  }

  /**
    * @dev See ICrossChain.
    */
  function getExecutableMessageId(string calldata _chainName) view external returns (uint256) {
    ReceivedMessage[] storage chainMessage = receivedMessageTable[_chainName];
    for (uint256 j = 0; j < chainMessage.length; j++) {
      ReceivedMessage storage message = chainMessage[j];
      if (message.errorCode == 0 && !message.executed) {
        return j + 1;
      }
    }

    return 0;
  }
}
