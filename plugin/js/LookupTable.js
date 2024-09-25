class LookupTableConverter {
    lookupTable;
    length;

    constructor(tableArray) {
        this.lookupTable = tableArray;
        this.length = this.lookupTable?.length;
    }

    getFirstValueFromIndex(index) {
        return this.getValueFromIndex(index, 0);
	}

    getSecondValueFromIndex(index) {
        return this.getValueFromIndex(index, 1);
	}

    getValueFromIndex(index, valuePos) {
        try {
            if (this.lookupTable?.length < index)
                throw 'Index out of range'

            if (this.lookupTable[index]?.length < valuePos)
                throw 'Value out of range'

            return this.lookupTable[index][valuePos];
        } catch (error) {
        }
	}

    getIndexFromFirstValue(index) {
        return this.getIndexFromValue(index, 0);
	}

    getIndexFromSecondValue(index) {
        return this.getIndexFromValue(index, 1);
	}

    getIndexFromValue(value, valuePos)  {
        var idx = 0;

        for (let entry of this.lookupTable) {
            if (entry[valuePos] >= value) {
                return idx;
            }

            idx++;
        }

        return idx;
	}
}