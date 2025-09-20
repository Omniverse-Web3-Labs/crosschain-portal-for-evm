const CrossChain = artifacts.require("TwoPhaseCommitCrossChain");
const MessageVerify = artifacts.require("MessageVerify");
const fs = require("fs");

module.exports = async function (deployer, network) {
    await deployer.deploy(MessageVerify);
    let crossChain = await deployer.deploy(CrossChain, network);
    await crossChain.setVerifyContract(MessageVerify.address);

    // Update config
    if (network.indexOf('-fork') != -1) {
      return;
    }

    const contractAddressFile = './config/default.json';
    let data = fs.readFileSync(contractAddressFile, 'utf8');
    let jsonData = JSON.parse(data);
    if (!jsonData[network]) {
      console.warn('There is no config for: ', network, ', please add.');
      jsonData[network] = {};
    }

    jsonData[network].crossChainContractAddress = crossChain.address;
    fs.writeFileSync(contractAddressFile, JSON.stringify(jsonData, null, '\t'));
  };