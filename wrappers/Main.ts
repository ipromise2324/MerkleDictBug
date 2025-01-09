import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from '@ton/core';

export type MainConfig = {};

export function mainConfigToCell(): Cell {
    return beginCell().endCell();
}

export class Main implements Contract {
    constructor(
        readonly address: Address,
        readonly init?: { code: Cell; data: Cell },
    ) {}

    static createFromAddress(address: Address) {
        return new Main(address);
    }

    static createFromConfig(code: Cell, workchain = 0) {
        const data = mainConfigToCell();
        const init = { code, data };
        return new Main(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async getMerkleAmount(provider: ContractProvider, key: Address, merkleRoot: bigint, exoticCell: Cell) {
        const result = await provider.get('merkleAmount', [
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
