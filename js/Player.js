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
 
  updateInventory(data, username) {
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
    this.pokedex = new Pokedex(filterInventory(data, 'pokedex_entry'), username);
    this.stats = filterInventory(data, 'player_stats')[0].inventory_item_data.player_stats;
    this.incubators = filterInventory(data, 'egg_incubators');
    this.updatePokemon(filterInventory(data, 'pokemon_data'), username);
  } 

  updatePokemon(data, username) {
    this.eggs = 0;
    this.bagPokemon = [];
    for (var i = 0; i < data.length; i++) {
      var pokeData = data[i].inventory_item_data.pokemon_data;
      if (pokeData.is_egg) {
        // TODO: show the pokemon inside eggs
        this.eggs++;
        continue;
      }
      this.bagPokemon.push(new Pokemon(pokeData, username));
    }    
  }

  getSortedPokemon(sortKey) {
    var sortedPokemon = this.bagPokemon.slice();
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
          var t = b.candy - a.candy;
          if (!t) { t = b.combatPower - a.combatPower; } // 2nd step: compare CP
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
}
