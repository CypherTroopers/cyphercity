// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

/*//////////////////////////////////////////////////////////////
                           EIP-2535
                Minimal Diamond (Issuer-only)
//////////////////////////////////////////////////////////////*/

interface IDiamondCut {
    enum FacetCutAction {
        Add,
        Replace,
        Remove
    }

    struct FacetCut {
        address facetAddress;
        FacetCutAction action;
        bytes4[] functionSelectors;
    }

    function diamondCut(FacetCut[] calldata _cut, address _init, bytes calldata _calldata) external;

    event DiamondCut(FacetCut[] _cut, address _init, bytes _calldata);
}

library LibDiamond {
    bytes32 internal constant DIAMOND_STORAGE_POSITION =
        keccak256("diamond.standard.diamond.storage.cyphercity");

    struct FacetAddressAndSelectorPosition {
        address facetAddress;
        uint16 selectorPosition;
    }

    struct FacetFunctionSelectors {
        bytes4[] functionSelectors;
        uint16 facetAddressPosition;
    }

    struct DiamondStorage {
        mapping(bytes4 => FacetAddressAndSelectorPosition) selectorToFacetAndPosition;
        mapping(address => FacetFunctionSelectors) facetFunctionSelectors;
        address[] facetAddresses;
        address contractOwner;
    }

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    event DiamondCut(IDiamondCut.FacetCut[] _cut, address _init, bytes _calldata);

    function diamondStorage() internal pure returns (DiamondStorage storage ds) {
        bytes32 pos = DIAMOND_STORAGE_POSITION;
        assembly {
            ds.slot := pos
        }
    }

    function contractOwner() internal view returns (address) {
        return diamondStorage().contractOwner;
    }

    function setContractOwner(address _newOwner) internal {
        DiamondStorage storage ds = diamondStorage();
        address prev = ds.contractOwner;
        ds.contractOwner = _newOwner;
        emit OwnershipTransferred(prev, _newOwner);
    }

    function enforceIsContractOwner() internal view {
        require(msg.sender == diamondStorage().contractOwner, "Not issuer");
    }

    function addFunctions(address _facetAddress, bytes4[] memory _selectors) internal {
        require(_selectors.length > 0, "No selectors");
        require(_facetAddress != address(0), "Facet addr=0");

        DiamondStorage storage ds = diamondStorage();

        uint16 selectorPos = uint16(ds.facetFunctionSelectors[_facetAddress].functionSelectors.length);

        if (selectorPos == 0) {
            ds.facetFunctionSelectors[_facetAddress].facetAddressPosition = uint16(ds.facetAddresses.length);
            ds.facetAddresses.push(_facetAddress);
        }

        for (uint256 i = 0; i < _selectors.length; i++) {
            bytes4 sel = _selectors[i];
            require(ds.selectorToFacetAndPosition[sel].facetAddress == address(0), "Selector exists");

            ds.facetFunctionSelectors[_facetAddress].functionSelectors.push(sel);
            ds.selectorToFacetAndPosition[sel] = FacetAddressAndSelectorPosition(_facetAddress, selectorPos);
            selectorPos++;
        }
    }

    function replaceFunctions(address _facetAddress, bytes4[] memory _selectors) internal {
        require(_selectors.length > 0, "No selectors");
        require(_facetAddress != address(0), "Facet addr=0");

        DiamondStorage storage ds = diamondStorage();

        uint16 selectorPos = uint16(ds.facetFunctionSelectors[_facetAddress].functionSelectors.length);

        if (selectorPos == 0) {
            ds.facetFunctionSelectors[_facetAddress].facetAddressPosition = uint16(ds.facetAddresses.length);
            ds.facetAddresses.push(_facetAddress);
        }

        for (uint256 i = 0; i < _selectors.length; i++) {
            bytes4 sel = _selectors[i];
            address oldFacet = ds.selectorToFacetAndPosition[sel].facetAddress;
            require(oldFacet != address(0), "Selector missing");
            require(oldFacet != _facetAddress, "Same facet");

            _removeFunction(oldFacet, sel);

            ds.facetFunctionSelectors[_facetAddress].functionSelectors.push(sel);
            ds.selectorToFacetAndPosition[sel] = FacetAddressAndSelectorPosition(_facetAddress, selectorPos);
            selectorPos++;
        }
    }

    function removeFunctions(bytes4[] memory _selectors) internal {
        require(_selectors.length > 0, "No selectors");
        DiamondStorage storage ds = diamondStorage();

        for (uint256 i = 0; i < _selectors.length; i++) {
            bytes4 sel = _selectors[i];
            address oldFacet = ds.selectorToFacetAndPosition[sel].facetAddress;
            require(oldFacet != address(0), "Selector missing");
            _removeFunction(oldFacet, sel);
        }
    }

    function _removeFunction(address _facetAddress, bytes4 _selector) private {
        DiamondStorage storage ds = diamondStorage();

        uint16 selPos = ds.selectorToFacetAndPosition[_selector].selectorPosition;
        bytes4[] storage selectors = ds.facetFunctionSelectors[_facetAddress].functionSelectors;
        uint256 lastPos = selectors.length - 1;

        if (selPos != lastPos) {
            bytes4 lastSel = selectors[lastPos];
            selectors[selPos] = lastSel;
            ds.selectorToFacetAndPosition[lastSel].selectorPosition = selPos;
        }

        selectors.pop();
        delete ds.selectorToFacetAndPosition[_selector];

        if (selectors.length == 0) {
            uint16 facetAddrPos = ds.facetFunctionSelectors[_facetAddress].facetAddressPosition;
            uint256 lastFacetPos = ds.facetAddresses.length - 1;

            if (facetAddrPos != lastFacetPos) {
                address lastFacet = ds.facetAddresses[lastFacetPos];
                ds.facetAddresses[facetAddrPos] = lastFacet;
                ds.facetFunctionSelectors[lastFacet].facetAddressPosition = facetAddrPos;
            }

            ds.facetAddresses.pop();
            delete ds.facetFunctionSelectors[_facetAddress].facetAddressPosition;
        }
    }

    function initializeDiamondCut(address _init, bytes memory _calldata) internal {
        if (_init == address(0)) {
            require(_calldata.length == 0, "init is 0 but calldata not empty");
            return;
        }
        (bool ok, bytes memory err) = _init.delegatecall(_calldata);
        if (!ok) {
            if (err.length > 0) {
                assembly {
                    revert(add(err, 32), mload(err))
                }
            }
            revert("Diamond init failed");
        }
    }

    function diamondCut(IDiamondCut.FacetCut[] memory _cut, address _init, bytes memory _calldata) internal {
        for (uint256 i = 0; i < _cut.length; i++) {
            IDiamondCut.FacetCutAction action = _cut[i].action;
            if (action == IDiamondCut.FacetCutAction.Add) {
                addFunctions(_cut[i].facetAddress, _cut[i].functionSelectors);
            } else if (action == IDiamondCut.FacetCutAction.Replace) {
                replaceFunctions(_cut[i].facetAddress, _cut[i].functionSelectors);
            } else if (action == IDiamondCut.FacetCutAction.Remove) {
                require(_cut[i].facetAddress == address(0), "Remove facetAddress must be 0");
                removeFunctions(_cut[i].functionSelectors);
            } else {
                revert("Bad FacetCutAction");
            }
        }

        emit DiamondCut(_cut, _init, _calldata);
        initializeDiamondCut(_init, _calldata);
    }
}

contract DiamondCutFacet is IDiamondCut {
    function diamondCut(FacetCut[] calldata _cut, address _init, bytes calldata _calldata) external override {
        LibDiamond.enforceIsContractOwner();
        LibDiamond.diamondCut(_cut, _init, _calldata);
    }
}

/*//////////////////////////////////////////////////////////////
                    CypherCity App Storage
//////////////////////////////////////////////////////////////*/

library LibCypherCityStorage {
    bytes32 internal constant POSITION = keccak256("cyphercity.storage.v2.tiles");

    struct AppStorage {
        mapping(uint32 => uint256) tiles;
    }

    function appStorage() internal pure returns (AppStorage storage s) {
        bytes32 pos = POSITION;
        assembly {
            s.slot := pos
        }
    }
}

/*//////////////////////////////////////////////////////////////
                    CypherCityV2 Facet
//////////////////////////////////////////////////////////////*/

contract CypherCityV2Facet {
    uint16 public constant GRID = 256;
    uint8 public constant MAX_LEVEL = 10;

    uint256 public constant PLACE_FEE = 1e15;
    uint256 public constant UPGRADE_FEE = 5e14;

    enum TileKind {
        Empty,
        House,
        Farm,
        Workshop,
        Park,
        Road,
        Monument,
        HighRiseCommercial,
        Residential,
        LuxuryHouseWithPool,
        LargePark,
        AmusementPark
    }

    event TilePlaced(uint16 indexed ax, uint16 indexed ay, TileKind kind, address indexed founder);
    event TileUpgraded(uint16 indexed ax, uint16 indexed ay, uint8 newLevel, address indexed upgrader);

    error OutOfBounds();
    error InvalidKind();
    error AlreadyPlaced();
    error NotPlaced();
    error MaxLevelReached();
    error BadFee();
    error Needs2x2Space();
    error Overlap();
    error CorruptAnchor();

    function _key(uint16 x, uint16 y) internal pure returns (uint32) {
        return (uint32(x) << 16) | uint32(y);
    }

    function _checkBounds(uint16 x, uint16 y) internal pure {
        if (x >= GRID || y >= GRID) revert OutOfBounds();
    }

    function _tiles() internal view returns (mapping(uint32 => uint256) storage t) {
        t = LibCypherCityStorage.appStorage().tiles;
    }

    function _pack(
        address founder,
        TileKind kind,
        uint8 level,
        uint32 updatedAt,
        bool isAnchor,
        uint8 ax,
        uint8 ay,
        uint8 part
    ) internal pure returns (uint256) {
        return uint256(uint160(founder))
            | (uint256(uint8(kind)) << 160)
            | (uint256(level) << 168)
            | (uint256(updatedAt) << 176)
            | (uint256(isAnchor ? 1 : 0) << 208)
            | (uint256(ax) << 209)
            | (uint256(ay) << 217)
            | (uint256(part & 3) << 225);
    }

    function _unpackCore(uint256 data)
        internal
        pure
        returns (address founder, TileKind kind, uint8 level, uint32 updatedAt)
    {
        founder = address(uint160(data));
        kind = TileKind(uint8(data >> 160));
        level = uint8(data >> 168);
        updatedAt = uint32(data >> 176);
    }

    function _unpackMeta(uint256 data) internal pure returns (bool isAnchor, uint8 ax, uint8 ay, uint8 part) {
        isAnchor = ((data >> 208) & 1) == 1;
        ax = uint8(data >> 209);
        ay = uint8(data >> 217);
        part = uint8((data >> 225) & 3);
    }

    function getTile(uint16 x, uint16 y)
        external
        view
        returns (
            bool exists,
            address founder,
            TileKind kind,
            uint8 level,
            uint32 updatedAt,
            bool isAnchor,
            uint8 anchorX,
            uint8 anchorY,
            uint8 part
        )
    {
        _checkBounds(x, y);
        uint256 data = _tiles()[_key(x, y)];
        if (data == 0) return (false, address(0), TileKind.Empty, 0, 0, false, 0, 0, 0);

        (founder, kind, level, updatedAt) = _unpackCore(data);
        (isAnchor, anchorX, anchorY, part) = _unpackMeta(data);
        return (true, founder, kind, level, updatedAt, isAnchor, anchorX, anchorY, part);
    }

    function getChunk(uint16 x0, uint16 y0, uint8 size) external view returns (uint256[] memory out) {
        if (size == 0 || size > 32) revert OutOfBounds();
        _checkBounds(x0, y0);
        if (x0 + size > GRID || y0 + size > GRID) revert OutOfBounds();

        out = new uint256[](uint256(size) * uint256(size));
        uint256 k = 0;

        mapping(uint32 => uint256) storage t = _tiles();
        for (uint16 dy = 0; dy < size; dy++) {
            for (uint16 dx = 0; dx < size; dx++) {
                out[k++] = t[_key(x0 + dx, y0 + dy)];
            }
        }
    }

    function place(uint16 x, uint16 y, TileKind kind) external payable {
        _checkBounds(x, y);
        if (msg.value != PLACE_FEE) revert BadFee();
        if (kind == TileKind.Empty || uint8(kind) > uint8(TileKind.AmusementPark)) revert InvalidKind();

        mapping(uint32 => uint256) storage t = _tiles();

        if (kind == TileKind.Road) {
            if (t[_key(x, y)] != 0) revert AlreadyPlaced();
            t[_key(x, y)] = _pack(msg.sender, kind, 1, uint32(block.timestamp), true, uint8(x), uint8(y), 0);
            emit TilePlaced(x, y, kind, msg.sender);
            return;
        }

        if (x + 1 >= GRID || y + 1 >= GRID) revert Needs2x2Space();
        if (
            t[_key(x, y)] != 0
                || t[_key(x + 1, y)] != 0
                || t[_key(x, y + 1)] != 0
                || t[_key(x + 1, y + 1)] != 0
        ) revert Overlap();

        uint32 ts = uint32(block.timestamp);
        uint8 ax = uint8(x);
        uint8 ay = uint8(y);

        t[_key(x, y)] = _pack(msg.sender, kind, 1, ts, true, ax, ay, 0);
        t[_key(x + 1, y)] = _pack(msg.sender, kind, 1, ts, false, ax, ay, 1);
        t[_key(x, y + 1)] = _pack(msg.sender, kind, 1, ts, false, ax, ay, 2);
        t[_key(x + 1, y + 1)] = _pack(msg.sender, kind, 1, ts, false, ax, ay, 3);

        emit TilePlaced(x, y, kind, msg.sender);
    }

    function upgrade(uint16 x, uint16 y) external payable {
        _checkBounds(x, y);
        if (msg.value != UPGRADE_FEE) revert BadFee();

        mapping(uint32 => uint256) storage t = _tiles();

        uint256 data = t[_key(x, y)];
        if (data == 0) revert NotPlaced();

        (bool isAnchor, uint8 ax, uint8 ay,) = _unpackMeta(data);

        uint16 anchorX = isAnchor ? x : uint16(ax);
        uint16 anchorY = isAnchor ? y : uint16(ay);

        uint256 aData = t[_key(anchorX, anchorY)];
        if (aData == 0) revert CorruptAnchor();

        (address founder, TileKind kind, uint8 level,) = _unpackCore(aData);
        (bool aIsAnchor, uint8 aAx, uint8 aAy,) = _unpackMeta(aData);

        if (!aIsAnchor) revert CorruptAnchor();
        if (uint16(aAx) != anchorX || uint16(aAy) != anchorY) revert CorruptAnchor();

        if (level >= MAX_LEVEL) revert MaxLevelReached();
        uint8 newLevel = level + 1;
        uint32 ts = uint32(block.timestamp);

        if (kind == TileKind.Road) {
            t[_key(anchorX, anchorY)] = _pack(founder, kind, newLevel, ts, true, uint8(anchorX), uint8(anchorY), 0);
            emit TileUpgraded(anchorX, anchorY, newLevel, msg.sender);
            return;
        }

        if (anchorX + 1 >= GRID || anchorY + 1 >= GRID) revert Needs2x2Space();

        uint256 tr = t[_key(anchorX + 1, anchorY)];
        uint256 bl = t[_key(anchorX, anchorY + 1)];
        uint256 br = t[_key(anchorX + 1, anchorY + 1)];
        if (tr == 0 || bl == 0 || br == 0) revert CorruptAnchor();

        (, uint8 trAx, uint8 trAy,) = _unpackMeta(tr);
        (, uint8 blAx, uint8 blAy,) = _unpackMeta(bl);
        (, uint8 brAx, uint8 brAy,) = _unpackMeta(br);

        if (uint16(trAx) != anchorX || uint16(trAy) != anchorY) revert CorruptAnchor();
        if (uint16(blAx) != anchorX || uint16(blAy) != anchorY) revert CorruptAnchor();
        if (uint16(brAx) != anchorX || uint16(brAy) != anchorY) revert CorruptAnchor();

        t[_key(anchorX, anchorY)] = _pack(founder, kind, newLevel, ts, true, uint8(anchorX), uint8(anchorY), 0);
        t[_key(anchorX + 1, anchorY)] = _pack(founder, kind, newLevel, ts, false, uint8(anchorX), uint8(anchorY), 1);
        t[_key(anchorX, anchorY + 1)] = _pack(founder, kind, newLevel, ts, false, uint8(anchorX), uint8(anchorY), 2);
        t[_key(anchorX + 1, anchorY + 1)] =
            _pack(founder, kind, newLevel, ts, false, uint8(anchorX), uint8(anchorY), 3);

        emit TileUpgraded(anchorX, anchorY, newLevel, msg.sender);
    }
}

/*//////////////////////////////////////////////////////////////
                        Diamond (Proxy)
//////////////////////////////////////////////////////////////*/

contract CypherCityDiamond {
    constructor(address issuer_, address diamondCutFacet_, address cypherCityFacet_) {
        require(issuer_ != address(0), "issuer=0");
        require(diamondCutFacet_ != address(0), "cutFacet=0");
        require(cypherCityFacet_ != address(0), "cityFacet=0");

        LibDiamond.setContractOwner(issuer_);

        // 1) Register diamondCut selector
        bytes4[] memory cutSelectors = new bytes4[](1);
        cutSelectors[0] = IDiamondCut.diamondCut.selector;
        LibDiamond.addFunctions(diamondCutFacet_, cutSelectors);

        // 2) Register CypherCityV2Facet selectors
        bytes4[] memory citySelectors = new bytes4[](8);

        // public constant getters (view functions returning constants)
        citySelectors[0] = bytes4(keccak256("GRID()"));
        citySelectors[1] = bytes4(keccak256("MAX_LEVEL()"));
        citySelectors[2] = bytes4(keccak256("PLACE_FEE()"));
        citySelectors[3] = bytes4(keccak256("UPGRADE_FEE()"));

        // actual functions
        citySelectors[4] = CypherCityV2Facet.getTile.selector;
        citySelectors[5] = CypherCityV2Facet.getChunk.selector;
        citySelectors[6] = CypherCityV2Facet.place.selector;
        citySelectors[7] = CypherCityV2Facet.upgrade.selector;

        LibDiamond.addFunctions(cypherCityFacet_, citySelectors);
    }

    function transferIssuer(address newIssuer) external {
        LibDiamond.enforceIsContractOwner();
        require(newIssuer != address(0), "issuer=0");
        LibDiamond.setContractOwner(newIssuer);
    }

    function issuer() external view returns (address) {
        return LibDiamond.contractOwner();
    }

    fallback() external payable {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        address facet = ds.selectorToFacetAndPosition[msg.sig].facetAddress;
        require(facet != address(0), "Function does not exist");

        assembly {
            calldatacopy(0, 0, calldatasize())
            let result := delegatecall(gas(), facet, 0, calldatasize(), 0, 0)
            returndatacopy(0, 0, returndatasize())
            switch result
            case 0 { revert(0, returndatasize()) }
            default { return(0, returndatasize()) }
        }
    }

    receive() external payable {}
}
