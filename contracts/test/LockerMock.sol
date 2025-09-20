// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "../interfaces/ICrossChain.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LockerMock is Ownable {
    string public receivedMessage;
    ICrossChain internal crossChainContract;

    constructor() {

    }

    function setCrossChainContract(address _address) public onlyOwner {
        crossChainContract = ICrossChain(_address);
    }

    function sendMessage(string calldata _toChain, string calldata _message) public {
        Payload memory data;
        PayloadItem memory item = data.items[0];
        item.name = "message";
        item.msgType = MsgType.EvmString;
        item.value = abi.encode(_message);
        SQoS[] memory sqos;
        ISentMessage memory m = ISentMessage(_toChain, sqos, Content("contract", "action", data), Session(0, ""));
        crossChainContract.sendMessage(m);
    }

    function receiveMessage(Payload calldata _payload) external {
        require(msg.sender == address(crossChainContract), "Locker: caller is not CrossChain");
        (string memory _value) = abi.decode(_payload.items[0].value, (string));
        receivedMessage = _value;
    }

    function verify(
        string calldata _chainName,
        string calldata _funcName,
        string calldata _sender
    ) public view virtual returns (bool) {
        return true;
    }
}