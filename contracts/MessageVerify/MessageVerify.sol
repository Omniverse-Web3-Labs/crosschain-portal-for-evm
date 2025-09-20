// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../NodeEvaluate//NodeEvaluation.sol";
import "../MessageDefine.sol";

contract MessageVerify is Ownable {
    NodeEvaluation public evaluationContract;

    constructor() {

    }

    function setEvaluationContract(address _address) onlyOwner public {
        evaluationContract = NodeEvaluation(_address);
    }

    function msgVerify(cachedReceivedMessage[] calldata _msgs, uint32 _percentage) external returns (cachedReceivedMessage[] calldata) {
        return _msgs;
    }
}