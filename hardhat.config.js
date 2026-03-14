require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const { SEPOLIA_RPC_URL, PRIVATE_KEY } = process.env;
const optionalNetworks = {};

if (SEPOLIA_RPC_URL && PRIVATE_KEY) {
  optionalNetworks.sepolia = {
    url: SEPOLIA_RPC_URL,
    accounts: [PRIVATE_KEY]
  };
}

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {},
    ...optionalNetworks
  }
};