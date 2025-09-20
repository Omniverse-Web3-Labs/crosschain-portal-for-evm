// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";

struct NodeInfo {
    address addr;
    uint256 credibility;
}

contract NodeEvaluation is Ownable {
    address[] public nodes;
    mapping(address => NodeInfo) public nodeMap;

    constructor() {

    }

    /**
     * @dev Selects validators, called from MessageVerify contract.
     */
    function selectValidators() external {

    }

    /**
     * @dev Updates node credibility by node behavior after message verification.
     */
    function updateNodes() external {

    }

    /**
     * @dev Returns credibility of node, called from MessageVerify contract.
     */
    function getNodesCredibility(address[] calldata _addresses) external returns (uint256[] memory) {
        uint256[] memory ret = new uint256[](_addresses.length);
        for (uint i = 0; i < _addresses.length; i++) {
            ret[i] = nodeMap[_addresses[i]].credibility;
        }

        return ret;
    }

    /**
     * @dev Registers a cross-chain node.
     */
    function registerNode() external {
        nodeMap[msg.sender] = NodeInfo(msg.sender, 0);
    }

    /**
     * @dev Unregisters cross-chain node.
     */
    function unregisterNode() external {
        delete nodeMap[msg.sender];
    }
}