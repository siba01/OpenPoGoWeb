class Pokemon {
  constructor(data, username) {
    this.id = data.pokemon_id;
    this.name = Pokemon.getPokemonById(this.id).Name || "Unknown";
    this.combatPower = data.cp || 0;
    this.attackIV = data.individual_attack || 0;
    this.defenseIV = data.individual_defense || 0;
    this.speedIV = data.individual_stamina || 0;
    this.IV = ((this.attackIV + this.defenseIV + this.speedIV) / 45.0).toFixed(2);
    this.creationTime = data.creation_time_ms || 0;
    this.health = data.stamina; // apparently this is HP
    this.maxHealth = data.stamina_max; // and this is max HP.. I know, weird, right?
    this.candy = mapView.getCandy(this.id, username);
  }

  static getPaddedId(id) {
    var str = '' + id;
    var pad = '000'
    return pad.substring(0, pad.length - str.length) + str
  }

  static getImageById(id) {
    return Pokemon.getPaddedId(id) + '.png'
  }

  static setPokemonData(data) {
    Pokemon.pokemonData = data;
  }

  static setPokemonCandyData(data) {
    Pokemon.pokemonCandyData = data;
  }

  static getPokemonById(id) {
    return Pokemon.pokemonData[id - 1];
  }

  static getNameById(id) {
    return Pokemon.getPokemonById(id).Name;
  }

  static getCandyId(id) {
    return Pokemon.pokemonCandyData[id];
  }
}
