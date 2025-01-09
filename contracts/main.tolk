import "@stdlib/tvm-dicts";

@pure
@inline
fun beginParseExotic(c: cell): (slice, int)
    asm "XCTOS";

// Constants
const EXOTIC_CELL_TYPE_SIZE = 8; // Exotic cell type size is 8 bits
const MERKLE_PROOF_TYPE = 3; // 3 means merkle proof type in exotic 
const MERKLE_ROOT_SIZE = 256; // Merkle root size is 256 bits
const ADDRESS_SIZE = 267; // Address size is 267 bits

// Errors
const ERROR_NOT_EXOTIC_CELL = 1000;
const ERROR_NOT_MERKLE_PROOF = 1001;
const ERROR_INCORRECT_MERKLE_ROOT = 1002;
const ERROR_KEY_NOT_EXIST = 1003;

fun onInternalMessage(myBalance: int, msgValue: int, msgFull: cell, msgBody: slice) {
    return;
}

get merkleAmount(key: slice, merkleRoot: int, exoticCell: cell): int {
    // Get merkle proof from exotic cell
    var (merkleProof: slice, isExotic: int) = exoticCell.beginParseExotic();

    // Validate if merkle proof is exotic cell 
    assert(isExotic, ERROR_NOT_EXOTIC_CELL);

    // Validate if cell type is merkle proof type
    assert(merkleProof.loadUint(EXOTIC_CELL_TYPE_SIZE) == MERKLE_PROOF_TYPE, ERROR_NOT_MERKLE_PROOF);

    // Validate merkle root is identical to the one in the distributor
    assert(merkleProof.loadUint(MERKLE_ROOT_SIZE) == merkleRoot, ERROR_INCORRECT_MERKLE_ROOT);

    // Load merkle dict from merkle proof
    val merkleDict: cell = merkleProof.loadRef();

    // Load Dictionary from the proof slice and get the entry for the key
    var (entry: slice, isKeyExist: int) = merkleDict.sDictGet(ADDRESS_SIZE, key);
    debugPrintString("isKeyExist: ");
    debugPrint(isKeyExist);
    assert(isKeyExist, ERROR_KEY_NOT_EXIST);
    return entry.loadUint(32);
}
