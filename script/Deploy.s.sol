// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "forge-std/Script.sol";
import "../src/CypherCity.sol";

contract Deploy is Script {
    function run() external returns (CypherCity city) {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(pk);
        city = new CypherCity();
        vm.stopBroadcast();
    }
}
