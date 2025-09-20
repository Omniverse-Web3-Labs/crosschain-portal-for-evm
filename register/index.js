const Web3 = require('web3');
const fs = require('fs');
const ethereum = require('./ethereum');
const { program } = require('commander');
const config = require('config');

let web3;
let netConfig;
let crossChainContract;

// Private key
let testAccountPrivateKey = fs.readFileSync('./.secret').toString();

function init(chainName) {
    netConfig = config.get(chainName);
    if (!netConfig) {
        console.log('Config of chain (' + chainName + ') not exists');
        return false;
    }

    let crossChainContractAddress = netConfig.crossChainContractAddress;
    // Load contract abi, and init contract object
    const crossChainRawData = fs.readFileSync('./build/contracts/TwoPhaseCommitCrossChain.json');
    const crossChainAbi = JSON.parse(crossChainRawData).abi;

    web3 = new Web3(netConfig.nodeAddress);
    web3.eth.handleRevert = true;
    crossChainContract = new web3.eth.Contract(crossChainAbi, crossChainContractAddress);

    return true;
}

async function initialize() {
    // Registers porters and request
    await ethereum.sendTransaction(web3, netConfig.chainId, crossChainContract, 'changePortersAndRequirement', testAccountPrivateKey, [netConfig.porters, netConfig.request]);
}

async function clear(destChain) {
    await ethereum.sendTransaction(web3, netConfig.chainId, crossChainContract, 'clearCrossChainMessage', testAccountPrivateKey, [destChain]);
}

async function transfer(address) {
    await ethereum.sendTransaction(web3, netConfig.chainId, crossChainContract, 'transferOwnership', testAccountPrivateKey, [address]);
}

(async function () {
    function list(val) {
		return val.split(',')
	}

    program
        .version('0.1.0')
        .option('-i, --initialize <chain name>', 'Initialize cross chain contract')
        .option('-c, --clear <chain name>,<dest chain name>', 'Clear data of cross chain contract', list)
        .option('-t, --transfer <chain name>,<address>', 'Transfer ownership', list)
        .parse(process.argv);

    if (program.opts().initialize) {
        if (!init(program.opts().initialize)) {
            return;
        }
        await initialize();
    }
    else if (program.opts().clear) {
        if (program.opts().clear.length != 2) {
            console.log('2 arguments are needed, but ' + program.opts().clear.length + ' provided');
            return;
        }
        
        if (!init(program.opts().clear[0])) {
            return;
        }
        await clear(program.opts().clear[1]);
    }
    else if (program.opts().transfer) {
        if (program.opts().transfer.length != 2) {
            console.log('2 arguments are needed, but ' + program.opts().transfer.length + ' provided');
            return;
        }
        
        if (!init(program.opts().transfer[0])) {
            return;
        }
        await transfer(program.opts().transfer[1]);
    }
}());
