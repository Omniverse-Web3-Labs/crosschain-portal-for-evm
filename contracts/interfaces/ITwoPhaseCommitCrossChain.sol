// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../MessageDefine.sol";

/**
 * @dev Interface of the TwoPhaseCommitCrossChain.
 */
interface ITwoPhaseCommitCrossChain {
    function receiveHiddenMessage(string calldata _fromChain, uint _id, bytes32 _hash) external;

    function revealMessage(IReceivedMessage calldata _message) external;
}