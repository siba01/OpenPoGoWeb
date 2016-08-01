class Player {
    constructor(name) {
        this.name = name;
        this.bagCandy = undefined;
        this.bagItems = undefined;
        this.bagPokemon = undefined;
        this.eggs = undefined;
        this.incubators = undefined;
        this.pokedex = undefined;
        this.stats = undefined;
        this.trainerPath = undefined;
    }
 
    updateInventory(data) {
        function filterInventory(arr, search) {
            var filtered = [];
            for (var i = 0; i < arr.length; i++) {
                if (arr[i].inventory_item_data[search] != undefined) {
                    filtered.push(arr[i]);
                }
            }
            return filtered;
        }

        this.bagCandy = filterInventory(data, 'candy');
        this.bagItems = filterInventory(data, 'item');
        this.pokedex = new Pokedex(filterInventory(data, 'pokedex_entry'));
        this.stats = filterInventory(data, 'player_stats')[0].inventory_item_data.player_stats;
        this.incubators = filterInventory(data, 'egg_incubators');
        this.updatePokemon(filterInventory(data, 'pokemon_data'));
    } 

    updatePokemon(data) {
        this.eggs = 0;
        this.bagPokemon = [];
        for (var i = 0; i < data.length; i++) {
            var pokeData = data[i].inventory_item_data.pokemon_data;
            if (pokeData.is_egg) {
                this.eggs++;
                continue;
            }
            this.bagPokemon.push(new Pokemon(pokeData));
        }        
    }

    getCandy(pokemon_num) {
        for (var i = 0; i < this.bagCandy.length; i++) {
            var checkCandy = this.bagCandy[i].inventory_item_data.candy.family_id;
            if (Pokemon.getCandyId(pokemon_num) === checkCandy) {
                return (this.bagCandy[i].inventory_item_data.candy.candy || 0);
            }
        }
        return -1; // fallback for no data
    }

    getSortedPokemon(sortKey) {
        var self = this, sortedPokemon = self.bagPokemon.slice();
        switch (sortKey) {
            case 'name':
                sortedPokemon.sort(function(a, b) {
                    var t = a.name.localeCompare(b.name, "en-US");
                    if (!t) { t = b.combatPower - a.combatPower; } // 2nd step: compare CP
                    return t;
                });
                break;
            case 'id':
                sortedPokemon.sort(function(a, b) {
                    var t = a.id - b.id;
                    if (!t) { t = b.combatPower - a.combatPower; } // 2nd step: compare CP
                    return t;
                });
                break;
            case 'cp':
                sortedPokemon.sort(function(a, b) {
                    return b.combatPower - a.combatPower;
                });
                break;
            case 'iv':
                sortedPokemon.sort(function(a, b) {
                    var t = b.IV - a.IV;
                    if (!t) { t = b.combatPower - a.combatPower; } // 2nd step: compare CP
                    return t;
                });
                break;
            case 'time':
                sortedPokemon.sort(function(a, b) {
                    return b.creationTime - a.creationTime;
                });
                break;
            case 'candy':
                sortedPokemon.sort(function(a, b) {
                    var t = self.getCandy(b.id) - self.getCandy(a.id);
                    if (!t) { t = b.combatPower - a.combatPower; } // 2nd step: compare CP
                    return t;
                });
                break;
            case 'hp':
                sortedPokemon.sort(function(a, b) {
                    var t = b.maxHealth - a.maxHealth;
                    if (!t) { t = b.health - a.health; } // 2nd step: compare actual HP
                    return t;
                });
                break;
            case 'attack':
                sortedPokemon.sort(function(a, b) {
                    var t = b.attackIV - a.attackIV;
                    if (!t) { t = b.IV - a.IV; } // 2nd step: compare IV
                    if (!t) { t = b.combatPower - a.combatPower; } // 3rd step: compare CP
                    return t;
                });
                break;
            case 'defense':
                sortedPokemon.sort(function(a, b) {
                    var t = b.defenseIV - a.defenseIV;
                    if (!t) { t = b.IV - a.IV; } // 2nd step: compare IV
                    if (!t) { t = b.combatPower - a.combatPower; } // 3rd step: compare CP
                    return t;
                });
                break;
            case 'stamina':
                sortedPokemon.sort(function(a, b) {
                    var t = b.staminaIV - a.staminaIV;
                    if (!t) { t = b.IV - a.IV; } // 2nd step: compare IV
                    if (!t) { t = b.combatPower - a.combatPower; } // 3rd step: compare CP
                    return t;
                });
                break;
            default:
                sortedPokemon.sort(function(a, b) {
                    if (a.cp > b.cp) return -1;
                    if (a.cp < b.cp) return 1;
                    return 0;
                });
                break;
        }
        return sortedPokemon;
    }

    getLevel() {
        return this.stats.level;
    }

    getExperience() {
        return this.stats.experience;
    }

    getTotalPreviousExps() {
        var self = mapView, t = 0, i;
        for (i = 1; i < this.stats.level; i++) {
            t += self.requiredExpToLevelUp[i];
        }
        return t;
    }
}
