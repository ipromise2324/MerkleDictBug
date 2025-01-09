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

describe('Test', () => {
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

    it('should throw key not exist', async () => {
        let dict = Dictionary.empty(Dictionary.Keys.Address(), coinsMarshaller());
        const user0 = await blockchain.treasury('user0');
        const user1 = await blockchain.treasury('user1');
        dict.set(user0.address, 100n);
        dict.set(user1.address, 200n);
        const merkleRoot = getCellHexHash(beginCell().storeDictDirect(dict).endCell());
        const proof = dict.generateMerkleProof([user0.address]);

        // OtherAddress is not in dict
        const otherAddress = await blockchain.treasury('other');
        const result = await testConract.getMerkleAmount(otherAddress.address, merkleRoot, proof);
        console.log('result:', result);
    });
});
