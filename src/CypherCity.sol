// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

/// @title CypherCity (Adminless, on-chain city builder)
/// @notice A 256x256 grid of tiles that everyone fills together. No administrator. All fees are sinks (non-withdrawable).
contract CypherCity {
    uint16 public constant GRID = 256;
    uint8 public constant MAX_LEVEL = 5;

    // 0.001 CPH (= 0.001 ether unit): placement fee
    uint256 public constant PLACE_FEE = 1e15;
    // 0.0005 CPH: upgrade fee
    uint256 public constant UPGRADE_FEE = 5e14;

    // 0: Empty 1: House 2: Farm 3: Workshop 4: Park 5: Road 6: Monument
    enum TileKind {
        Empty,
        House,
        Farm,
        Workshop,
        Park,
        Road,
        Monument
    }

    // packed tile:
    // [0..159]   founder (address)
    // [160..167] kind (uint8)
    // [168..175] level (uint8)  (1..MAX_LEVEL)
    // [176..207] updatedAt (uint32)
    mapping(uint32 => uint256) private tiles;

    event TilePlaced(uint16 indexed x, uint16 indexed y, TileKind kind, address indexed founder);
    event TileUpgraded(uint16 indexed x, uint16 indexed y, uint8 newLevel, address indexed upgrader);

    error OutOfBounds();
    error InvalidKind();
    error AlreadyPlaced();
    error NotPlaced();
    error MaxLevel();
    error BadFee();

    function _key(uint16 x, uint16 y) internal pure returns (uint32) {
        // Valid range is 0..255, but stored as 16+16 bits for simplicity
        return (uint32(x) << 16) | uint32(y);
    }

    function _checkBounds(uint16 x, uint16 y) internal pure {
        if (x >= GRID || y >= GRID) revert OutOfBounds();
    }

    function _pack(address founder, TileKind kind, uint8 level, uint32 updatedAt) internal pure returns (uint256) {
        return uint256(uint160(founder)) | (uint256(uint8(kind)) << 160) | (uint256(level) << 168)
            | (uint256(updatedAt) << 176);
    }

    function _unpack(uint256 data)
        internal
        pure
        returns (address founder, TileKind kind, uint8 level, uint32 updatedAt)
    {
        founder = address(uint160(data));
        kind = TileKind(uint8(data >> 160));
        level = uint8(data >> 168);
        updatedAt = uint32(data >> 176);
    }

    /// @notice Get a single tile
    function getTile(uint16 x, uint16 y)
        external
        view
        returns (bool exists, address founder, TileKind kind, uint8 level, uint32 updatedAt)
    {
        _checkBounds(x, y);
        uint256 data = tiles[_key(x, y)];
        if (data == 0) return (false, address(0), TileKind.Empty, 0, 0);

        (founder, kind, level, updatedAt) = _unpack(data);
        return (true, founder, kind, level, updatedAt);
    }

    /// @notice Batch retrieval (for frontends)
    /// @dev size is recommended to be at most 32 (to reduce RPC load and response size)
    function getChunk(uint16 x0, uint16 y0, uint8 size) external view returns (uint256[] memory out) {
        if (size == 0 || size > 32) revert OutOfBounds();

        _checkBounds(x0, y0);
        if (x0 + size > GRID || y0 + size > GRID) revert OutOfBounds();

        out = new uint256[](uint256(size) * uint256(size));
        uint256 k = 0;

        for (uint16 dy = 0; dy < size; dy++) {
            for (uint16 dx = 0; dx < size; dx++) {
                out[k++] = tiles[_key(x0 + dx, y0 + dy)];
            }
        }
    }

    /// @notice Place a tile (only the first time)
    function place(uint16 x, uint16 y, TileKind kind) external payable {
        _checkBounds(x, y);
        if (msg.value != PLACE_FEE) revert BadFee();

        if (kind == TileKind.Empty || uint8(kind) > uint8(TileKind.Monument)) revert InvalidKind();

        uint32 key = _key(x, y);
        if (tiles[key] != 0) revert AlreadyPlaced();

        tiles[key] = _pack(msg.sender, kind, 1, uint32(block.timestamp));
        emit TilePlaced(x, y, kind, msg.sender);
    }

    /// @notice Upgrade a tile (anyone can upgrade; tile type is fixed)
    function upgrade(uint16 x, uint16 y) external payable {
        _checkBounds(x, y);
        if (msg.value != UPGRADE_FEE) revert BadFee();

        uint32 key = _key(x, y);
        uint256 data = tiles[key];
        if (data == 0) revert NotPlaced();

        (address founder, TileKind kind, uint8 level,) = _unpack(data);
        if (level >= MAX_LEVEL) revert MaxLevel();

        uint8 newLevel = level + 1;
        tiles[key] = _pack(founder, kind, newLevel, uint32(block.timestamp));
        emit TileUpgraded(x, y, newLevel, msg.sender);
    }
}
