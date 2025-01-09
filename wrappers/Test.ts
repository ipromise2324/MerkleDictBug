import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from '@ton/core';

export type TestConfig = {};

export function testConfigToCell(): Cell {
    return beginCell().endCell();
}

export const Opcodes = {
    increase: 0x7e8764ef,
};

export class Test implements Contract {
    constructor(
        readonly address: Address,
        readonly init?: { code: Cell; data: Cell },
    ) {}

    static createFromAddress(address: Address) {
        return new Test(address);
    }

    static createFromConfig(code: Cell, workchain = 0) {
        const data = testConfigToCell();
        const init = { code, data };
        return new Test(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendIncrease(
        provider: ContractProvider,
        via: Sender,
        opts: {
            increaseBy: number;
            value: bigint;
            queryID?: number;
        },
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.increase, 32)
                .storeUint(opts.queryID ?? 0, 64)
                .storeUint(opts.increaseBy, 32)
                .endCell(),
        });
    }

    async getMerkleAmount(provider: ContractProvider, key: Address, merkleRoot: bigint, exoticCell: Cell) {
        const result = await provider.get('get_merkle_amount', [
            {
                type: 'slice',
                cell: beginCell().storeAddress(key).endCell(),
            },
            {
                type: 'int',
                value: merkleRoot,
            },
            {
                type: 'cell',
                cell: exoticCell,
            },
        ]);
        return result.stack.readNumber();
    }
}
