import { Builder, Cell, DictionaryValue, Slice } from '@ton/core';

export function getCellHexHash(cell: Cell): bigint {
    return BigInt('0x' + cell.hash().toString('hex'));
}

export function coinsMarshaller(): DictionaryValue<bigint> {
    return {
        serialize: (src: any, builder: Builder) => {
            builder.storeCoins(src);
        },
        parse: (src: Slice) => {
            return src.loadCoins();
        },
    };
}
