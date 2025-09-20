// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @dev Contract that implements multi-porter management.
 */
contract MultiPorters is Ownable {
    uint256 public required;
    mapping (address => bool) public isPorter;
    address[] public porters;

    modifier onlyPorter() {
        if (!isPorter[msg.sender])
            revert("MultiPorters: porter not registered");
        _;
    }

    /**
     * @dev Changes porters and requirement.
     */
    function changePortersAndRequirement(address[] calldata _porters, uint256 _requirement) external onlyOwner {
        // clear porters
        for (uint i = 0; i < porters.length; i++) {
            isPorter[porters[i]] = false;
        }

        if (porters.length > _porters.length) {
            uint differ = porters.length - _porters.length;
            for (uint i = 0; i < differ; i++) {
                porters.pop();
            }
        }
        else {
            uint differ = _porters.length - porters.length;
            for (uint i = 0; i < differ; i++) {
                porters.push();
            }
        }

        // set value
        for (uint i = 0; i < _porters.length; i++) {
            isPorter[_porters[i]] = true;
        }
        porters = _porters;

        required = _requirement;
    }
}