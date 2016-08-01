class Pokedex {
    constructor(data) {
        this.entries = {};
        for (var i = 0; i < data.length; i++) {
            var entry = {};
            var entryData = data[i].inventory_item_data.pokedex_entry;
            entry['id'] = entryData.pokemon_id;
            entry['name'] = Pokemon.getNameById(entry['id']);
            entry['image'] = Pokemon.getImageById(entry['id']);
            entry['encountered'] = entryData.times_encountered || 0;
            entry['captured'] = entryData.times_captured || 0;
            this.entries[entry['id']] = entry;
        }
    }

    getEntry(id) {
        return this.entries['' + id];
    }

    getNumEntries() {
        return Object.keys(this.entries).length;
    }

    getAllEntries() {
        var keys = Object.keys(this.entries);
        var returnData = [];
        for(var i = 0; i < keys.length; i++) {
            returnData.push(this.getEntry(keys[i]));
        }
        return returnData;
    }

    getAllEntriesSorted(sortKey, user) {
        var sortedPokedex = this.getAllEntries();
        switch (sortKey) {
            case 'id':
                sortedPokedex.sort(function(a, b) {
                    return a.id - b.id;
                });
                break;
            case 'name':
                sortedPokedex.sort(function(a, b) {
                    return a.name.localeCompare(b.name, "en-US");
                });
                break;
            case 'enc':
                sortedPokedex.sort(function(a, b) {
                    return b.encountered - a.encountered; // descending
                    //return a.encountered - b.encountered; // ascending
                });
                break;
            case 'cap':
                sortedPokedex.sort(function(a, b) {
                    return b.captured - a.captured; // descending
                    // return a.captured - b.captured; // ascending
                });
                break;
            case 'candy':
                sortedPokedex.sort(function(a, b) {
                    var t = user.getCandy(b.id) - user.getCandy(a.id);
                    if (!t) { t = a.id - b.id; } // 2nd step: compare ID
                    return t;
                });
                break;
            default:
                sortedPokedex.sort(function(a, b) {
                    return a.id - b.id;
                });
                break;
        }
        return sortedPokedex;
    }
}
