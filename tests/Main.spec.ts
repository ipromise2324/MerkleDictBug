import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { beginCell, Builder, Cell, Dictionary, DictionaryValue, Slice, toNano } from '@ton/core';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';
import { Main } from '../wrappers/Main';

function getCellHexHash(cell: Cell): bigint {
    return BigInt('0x' + cell.hash().toString('hex'));
}

function coinsMarshaller(): DictionaryValue<bigint> {
    return {
        serialize: (src: any, builder: Builder) => {
            builder.storeCoins(src);
        },
        parse: (src: Slice) => {
            return src.loadCoins();
        },
    };
}

describe('Test Merkle Dict', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('Main');
    });

    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let testConract: SandboxContract<Main>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        testConract = blockchain.openContract(Main.createFromConfig(code));

        deployer = await blockchain.treasury('deployer');

        const deployResult = await testConract.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: testConract.address,
            deploy: true,
            success: true,
        });
    });

    it('should not throw exit code 9 when the key does not exist', async () => {
        // Create a dictionary
        let dict = Dictionary.empty(Dictionary.Keys.Address(), Dictionary.Values.Uint(32));

        // When the dict contains two key-value pairs,
        // sDictGet can't use the second returned variable to indicate that the key was not found.
        const user0 = await blockchain.treasury('user0');
        const user1 = await blockchain.treasury('user1');
        dict.set(user0.address, 10);
        dict.set(user1.address, 20);

        // Generate the merkle root
        const merkleRoot = getCellHexHash(beginCell().storeDictDirect(dict).endCell());

        // Generate the merkle proof for only user0
        const proof = dict.generateMerkleProof([user0.address]);

        // OtherAddress is not in the dict, but it is still used as a key.
        // Theoretically, it should trigger the second variable returned by sDictGet to indicate that the key does not exist.
        // When the dict contains only two key-value pairs, it throws exit code 9 instead of exit code 1003.
        const otherAddress = await blockchain.treasury('other');
        const result = await testConract.getMerkleAmount(otherAddress.address, merkleRoot, proof);
        console.log('result:', result);
    });

    it('should throw exit code 1003 when the key does not exist', async () => {
        // Create a dictionary
        let dict = Dictionary.empty(Dictionary.Keys.Address(), Dictionary.Values.Uint(32));

        // When the dict contains only one key-value pair,
        // sDictGet can use the second returned variable to indicate that the key was not found.
        const user0 = await blockchain.treasury('user0');
        // const user1 = await blockchain.treasury('user1');
        dict.set(user0.address, 100);
        // dict.set(user1.address, 200);

        // Generate the merkle root
        const merkleRoot = getCellHexHash(beginCell().storeDictDirect(dict).endCell());

        // Generate the merkle proof for only user0
        const proof = dict.generateMerkleProof([user0.address]);

        // OtherAddress is not in the dict, but it is still used as a key.
        // Theoretically, it should trigger the second variable returned by sDictGet to indicate that the key does not exist.
        // When the dict contains only one key-value pair, it successfully throws exit code 1003.
        const otherAddress = await blockchain.treasury('other');
        const result = await testConract.getMerkleAmount(otherAddress.address, merkleRoot, proof);
        console.log('result:', result);
    });

    it('should get the value of the key', async () => {
        let dict = Dictionary.empty(Dictionary.Keys.Address(), Dictionary.Values.Uint(32));
        const user0 = await blockchain.treasury('user0');
        dict.set(user0.address, 100);
        const merkleRoot = getCellHexHash(beginCell().storeDictDirect(dict).endCell());
        const proof = dict.generateMerkleProof([user0.address]);
        const result = await testConract.getMerkleAmount(user0.address, merkleRoot, proof);
        expect(result).toBe(100);
    });
});
