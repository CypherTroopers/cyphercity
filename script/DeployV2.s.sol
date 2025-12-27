// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "forge-std/Script.sol";

// Adjust the path if your file name differs.
import "../src/CypherCityV2.sol";

contract DeployV2 is Script {
    function run() external returns (address cutFacet, address cityFacet, address diamond) {
        // Private key must be provided in env var: PRIVATE_KEY
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");

        // Issuer can be provided via env var ISSUER; default to deployer address
        address issuer;
        try vm.envAddress("ISSUER") returns (address a) {
            issuer = a;
        } catch {
            issuer = vm.addr(deployerKey);
        }

        vm.startBroadcast(deployerKey);

        // 1) Deploy facets
        DiamondCutFacet cut = new DiamondCutFacet();
        CypherCityV2Facet city = new CypherCityV2Facet();

        // 2) Deploy diamond (proxy) with constructor args: issuer, cutFacet, cityFacet
        CypherCityDiamond d = new CypherCityDiamond(issuer, address(cut), address(city));

        vm.stopBroadcast();

        cutFacet = address(cut);
        cityFacet = address(city);
        diamond = address(d);

        // Optional console logs (visible in forge output)
        console2.log("Issuer:", issuer);
        console2.log("DiamondCutFacet:", cutFacet);
        console2.log("CypherCityV2Facet:", cityFacet);
        console2.log("CypherCityDiamond:", diamond);
    }
}
