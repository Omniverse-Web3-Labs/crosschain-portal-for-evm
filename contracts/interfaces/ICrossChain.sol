// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
import "../MessageDefine.sol";

/**
 * @dev Interface of the CrossChain.
 */
interface ICrossChain {
    /**
     * @dev Set daten token contract address.
     */
    function setTokenContract(address _address) external;

    /**
     * @dev Cross-Chain calls method `_methodName` of contract `_contractAddress`
     * on chain `_toChain`, data is `_data`.
     */
    function sendMessage(ISentMessage calldata _message) external returns (uint256);

    /**
     * @dev Cross-Chain receives message from chain `_fromChain`, the message will
     * be handled by method `_action` of contract `_to`, data is `_data`.
     */
    function receiveMessage(IReceivedMessage calldata _message) external;

    /**
     * @dev Cross-Chain abandons message from chain `_fromChain`, the message will
     * be skipped and not be executed.
     */
    function abandonMessage(string calldata _fromChain, uint256 _id, uint256 _errorCode) external;

    /**
     * @dev Triggers execution of a message sent from chain `_chainName` with id `_id`.
     */
    function executeMessage(string calldata _chainName, uint256 _id) external;

    /**
     * @dev Returns the simplified message, this message is reset every time a third-party contract is called
     */
    function getCurrentMessage() view external returns (SimplifiedMessage memory);

    /**
     * @dev Returns the number of messages sent to chain `_chainName`.
     */
    function getSentMessageNumber(string calldata _chainName) view external returns (uint256);

    /**
     * @dev Returns the number of messages received from chain `_chainName`.
     */
    function getReceivedMessageNumber(string calldata _chainName) view external returns (uint256);

    /**
     * @dev Returns the message with id `_id` sent to chain `_chainName`.
     */
    function getSentMessage(string calldata _chainName, uint256 _id) view external returns (SentMessage memory);

    /**
     * @dev Returns the message with id `_id` received from chain `_chainName`.
     */
    function getReceivedMessage(string calldata _chainName, uint256 _id) view external returns (ReceivedMessage memory);

    /**
     * @dev Returns the id of a executable message sent from chain `_chainName`, returns 0 if none.
     */
    function getExecutableMessageId(string calldata _chainName) view external returns (uint256);
}
