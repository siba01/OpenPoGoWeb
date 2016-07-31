'use strict';

var logger = new Logger("#logs-panel .card-content #logs");

$(document).ready(function() {
  mapView.init();
  // https://github.com/PokemonGoF/PokemonGo-Bot doesn't support WebSocket. Suppress error by disabling this entirely
  /*var socket = io.connect('http://' + document.domain + ':' + location.port + '/event');

  socket.on('connect', function() {
    console.log('connected!');
  });
  socket.on('logging', function(msg) {
    for(var i = 0; i < msg.length; i++) {
      logger.log({
        message: msg[i].output,
        color: msg[i].color,
        toast: msg[i].toast || false
      });
    }
  });*/
});

function loadJSON(path, extra) {
  return new Promise(function(fulfill, reject) {
    $.get({
      url: path + "?" + Date.now()
    }).done(function(data) {
      if(data !== undefined) {
        if (extra == undefined) {
          fulfill(data);
        } else {
          fulfill([data, extra]); // pass extra data if necessary - to solve out-of-sync username info
        }
      } else {
        reject(data);
      }
    }).fail(function(jqXHR, textContent, thrownError) {
      reject(thrownError);
    });
  });
}

// Array of required EXPs to level up for each level
var exps_per_level = { 1: 1000, 2: 2000, 3: 3000, 4: 4000, 5: 5000, 6: 6000, 7: 7000, 8: 8000, 9: 9000, 10: 10000,
    11: 10000, 12: 10000, 13: 10000, 14: 15000, 15: 20000, 16: 20000, 17: 20000, 18: 25000, 19: 25000, 20: 50000,
    21: 75000, 22: 100000, 23: 125000, 24: 150000, 25: 190000, 26: 200000, 27: 250000, 28: 300000, 29: 350000, 30: 500000,
    31: 500000, 32: 750000, 33: 1000000, 34: 1250000, 35: 1500000, 36: 2000000, 37: 2500000, 38: 3000000, 39: 5000000, 40: 5000000
  },
  // Array of minimum gym points per level
  min_gp_per_level = { 1: 0, 2: 2000, 3: 4000, 4: 8000, 5: 12000, 6: 16000, 7: 20000, 8: 30000, 9: 40000, 10: 50000 },
  hasFocused = false;

var mapView = {
  user_index: 0,
  emptyDex: [],
  forts: [],
  info_windows: [],
  numTrainers: [
    177,
    109
  ],
  teams: [
    'TeamLess',
    'Mystic',
    'Valor',
    'Instinct'
  ],
  trainerSex: [
    'm',
    'f'
  ],
  /*pathColors: [
    '#A93226',
    '#884EA0',
    '#2471A3',
    '#17A589',
    '#229954',
    '#D4AC0D',
    '#CA6F1E',
    '#CB4335',
    '#7D3C98',
    '#2E86C1',
    '#138D75',
    '#28B463',
    '#D68910',
    '#BA4A00'
  ],*/ // obsolote
  playerInfo: {},
  user_data: {},
  pathcoords: {},
  settings: {},
  init: function() {
    var self = this;
    self.settings = $.extend(true, self.settings, userInfo);
    self.bindUi();

    loadJSON('data/pokemondata.json').then(Pokemon.setPokemonData);

    loadJSON('data/pokemoncandy.json').then(Pokemon.setPokemonCandyData);

    for (var user in self.settings.users) {
      self.user_data[user] = new Player(user);
      self.pathcoords[user] = [];
    }

    $.getScript('https://maps.googleapis.com/maps/api/js?key={0}&libraries=drawing'.format(self.settings.gMapsAPIKey), function() {
      self.initMap();
    });
  },
  setBotPathOptions: function(checked) {
      var self = this;
      for (var user in self.settings.users) {
        var trainerPath = self.user_data[user].trainerPath;
        if (!trainerPath) { continue; } // failsafe, in case user data hasn't been fully loaded
        self.user_data[user].trainerPath.setOptions({
          strokeOpacity: (checked ? 1.0 : 0.0),
          zIndex: (checked ? 4 : 0)
        });
      }
  },
  bindUi: function() {
    var self = this;
    $('#switchPan').prop('checked', self.settings.userFollow);
    $('#switchZoom').prop('checked', self.settings.userZoom);
    $('#strokeOn').prop('checked', self.settings.botPath);

    $('#switchPan').change(function() {
      self.settings.userFollow = this.checked;
    });

    $('#switchZoom').change(function() {
      self.settings.userZoom = this.checked;
    });

    $('#strokeOn').change(function() {
      self.settings.botPath = this.checked;
      self.setBotPathOptions(this.checked);
    });

    $('#optionsButton').click(function() {
      $('#optionsList').toggle();
    });

    $('#logs-button').click(function() {
      $('#logs-panel').toggle();
    });
    // Init tooltip
    $(document).ready(function() {
      $('.tooltipped').tooltip({
        delay: 50
      });
    });

    // Bots list and menus
    var submenuIndex = 0,
      currentUserId;
    $('body').on('click', ".bot-user .bot-items .btn:not(.tFind)", function() {
      var itemIndex = $(this).parent().parent().find('.btn').index($(this)) + 1,
        userId = $(this).closest('ul').data('user-id');
      if ($('#submenu').is(':visible') && itemIndex == submenuIndex && currentUserId == userId) {
        $('#submenu').toggle();
      } else {
        submenuIndex = itemIndex;
        currentUserId = userId;
        self.buildMenu(userId, itemIndex);
      }
    });

    $('body').on('click', '#close', function() {
      $('#submenu').toggle();
    });

    $('body').on('click', '.tFind', function() {
      self.findBot($(this).closest('ul').data('user-id'));
    });

    // Binding sorts
    $('body').on('click', '.pokemon-sort a', function() {
      var item = $(this);
      self.sortAndShowBagPokemon(item.data('sort'), item.parent().parent().data('user-id'));
    });
    $('body').on('click', '.pokedex-sort a', function() {
      var item = $(this);
      self.sortAndShowPokedex(item.data('sort'), item.parent().parent().data('user-id'));
    });

  },
  initMap: function() {
    var self = this,
      // https://github.com/OpenPoGo/OpenPoGoWeb/issues/122
      style_PokemonGo = [ 
        { "featureType": "road", "elementType": "geometry.fill", "stylers": [ { "color": "#4f9f92" }, { "visibility": "on" } ] },
        { "featureType": "water", "elementType": "geometry.stroke", "stylers": [ { "color": "#feff95" }, { "visibility": "on" }, { "weight": 1.2 } ] },
        { "featureType": "landscape", "elementType": "geometry", "stylers": [ { "color": "#adff9d" }, { "visibility": "on" } ] },
        { "featureType": "water", "stylers": [ { "visibility": "on" }, { "color": "#147dd9" } ] },
        { "featureType": "poi", "elementType": "geometry.fill", "stylers": [ { "color": "#d3ffcc" } ] },{ "elementType": "labels", "stylers": [ { "visibility": "off" } ] } 
      ];
    self.map = new google.maps.Map(document.getElementById('map'), {
      center: {lat: 50.0830986, lng: 6.7613762},
      zoom: 8,
      mapTypeId: 'roadmap',
      styles: (self.settings.usePokemonGoMapStyle ? style_PokemonGo : [])
    });

    self.placeTrainer();
    self.addCatchable();
    setInterval(self.placeTrainer, 1000);
    setInterval(self.addCatchable, 1000);
    setInterval(self.addInventory, 5000);
  },
  addCatchable: function() {
    var self = mapView;
    for (var user in self.settings.users) {
      loadJSON('catchable-' + user + '.json', user).then(function(data) {
        // data[0] contains the necessary data, data[1] contains the username
        self.catchSuccess(data[0], data[1]);
      });
    }
  },
  addInventory: function() {
    var self = mapView;
    for (var user in self.settings.users) {
      var a = loadJSON('inventory-' + user + '.json', user).then(function(data) {
        // data[0] contains the necessary data, data[1] contains the username
        self.user_data[data[1]].updateInventory(data[0], data[1]); // Pass username to be used to get candy num for Pokemon and Pokedex constructors.. I may need better method than this
      });
    }
  },
  calculateTotalPreviousExps: function(level)
  {
    var t, i;
    t = 0;
    for (i = 1; i < level; i++) { t += exps_per_level[i]; }
    return t;
  },
  buildMenu: function(user_id, menu) {
    var self = this,
      out = '';
    $("#submenu").show();
    switch (menu) {
      case 1:
        var current_user_stats = self.user_data[user_id].stats;
        $('#subtitle').html('Trainer Info');
        $('#sortButtons').html('');

        var exp_for_current_level = current_user_stats.experience - self.calculateTotalPreviousExps(current_user_stats.level),
          exp_to_level_percentage = exp_for_current_level / exps_per_level[current_user_stats.level] * 100;

        out += '<div class="row"><div class="col s12"><h5>' +
          self.settings.users[user_id].displayName +
          '</h5><br>Level: ' +
          current_user_stats.level +
          '<br><div class="progress bot-exp-bar" style="background-color: ' +
          self.settings.users[user_id].colors.secondary +
          '"><div class="determinate" style="width: '+
          parseFloat(exp_to_level_percentage).toFixed(2) +
          '%; background-color: ' +
          self.settings.users[user_id].colors.primary +
          '"></div><span class="progress-text">' +
          parseFloat(exp_to_level_percentage).toFixed(2) +
          '%</span></div>Accumulated Experience: ' +
          current_user_stats.experience +
          '<br>Experience to Level ' +
          (parseInt(current_user_stats.level, 10) + 1) +
          ': ' +
          exp_for_current_level +
          ' / ' +
          exps_per_level[current_user_stats.level] +
          '<br>Remaining Experience: ' +
          (exps_per_level[current_user_stats.level] - exp_for_current_level) +
          '<br>Pokemon Encountered: ' +
          (current_user_stats.pokemons_encountered || 0) +
          '<br>Pokeballs Thrown: ' +
          (current_user_stats.pokeballs_thrown || 0) +
          '<br>Pokemon Caught: ' +
          (current_user_stats.pokemons_captured || 0) +
          '<br>Small Ratata Caught: ' +
          (current_user_stats.small_rattata_caught || 0) +
          '<br>Pokemon Evolved: ' +
          (current_user_stats.evolutions || 0) +
          '<br>Eggs Hatched: ' +
          (current_user_stats.eggs_hatched || 0) +
          '<br>Unique Pokedex Entries: ' +
          (current_user_stats.unique_pokedex_entries || 0) +
          '<br>PokeStops Visited: ' +
          (current_user_stats.poke_stop_visits || 0) +
          '<br>Kilometers Walked: ' +
          (parseFloat(current_user_stats.km_walked).toFixed(2) || 0) +
          '</div></div>';

        $('#subcontent').html(out);
        break;
      case 2:
        var current_user_bag_items = self.user_data[user_id].bagItems,
          current_user_bag_items_total = 0;

        $('#sortButtons').html('');

        out = '<div class="items"><div class="row">';
        for (var i = 0; i < current_user_bag_items.length; i++) {
          if (!current_user_bag_items[i].inventory_item_data.item.count) { continue; }
          current_user_bag_items_total += current_user_bag_items[i].inventory_item_data.item.count;
          out += '<div class="col s12 m6 l3 center" style="float: left"><img src="image/items/' +
            current_user_bag_items[i].inventory_item_data.item.item_id +
            '.png" class="item_img"><br><b>' +
            Item.getName(current_user_bag_items[i].inventory_item_data.item.item_id) +
            '</b><br><b>Count:</b> ' +
            (current_user_bag_items[i].inventory_item_data.item.count || 0) +
            '</div>';
        }
        out += '</div></div>';
        var nth = 0;
        out = out.replace(/<\/div><div/g, function (match, i, original) {
          nth++;
          return (nth % 4 === 0) ? '</div></div><div class="row"><div' : match;
        });
        $('#subcontent').html(out);
        $('#subtitle').html(current_user_bag_items_total + " item" + (current_user_bag_items_total !== 1 ? "s" : "") + " in Bag");
        break;
      case 3:
        var pkmnTotal = self.user_data[user_id].bagPokemon.length;
        $('#subtitle').html(pkmnTotal + " Pokemon");

        var sortButtons = '<div class="col s12 pokemon-sort" data-user-id="' + user_id + '">Sort : ';
        sortButtons += '<div class="chip"><a href="#" data-sort="cp">CP</a></div>';
        sortButtons += '<div class="chip"><a href="#" data-sort="iv">IV</a></div>';
        sortButtons += '<div class="chip"><a href="#" data-sort="name">Name</a></div>';
        sortButtons += '<div class="chip"><a href="#" data-sort="id">ID</a></div>';
        sortButtons += '<div class="chip"><a href="#" data-sort="time">Time</a></div>';
        sortButtons += '<div class="chip"><a href="#" data-sort="candy">Candy</a></div>';
        sortButtons += '<div class="chip"><a href="#" data-sort="attack">Attack</a></div>';
        sortButtons += '<div class="chip"><a href="#" data-sort="defense">Defense</a></div>';
        sortButtons += '<div class="chip"><a href="#" data-sort="stamina">Stamina</a></div>';
        sortButtons += '</div>';

        $('#sortButtons').html(sortButtons);

        self.sortAndShowBagPokemon('cp', user_id);
        break;
      case 4:
        var pkmnTotal = self.user_data[user_id].pokedex.getNumEntries();
        $('#subtitle').html('Pokedex ' + pkmnTotal + ' / 151');

        var sortButtons = '<div class="col s12 pokedex-sort" dat-user-id="' + user_id + '">Sort : ';
        sortButtons += '<div class="chip"><a href="#" data-sort="id">ID</a></div>';
        sortButtons += '<div class="chip"><a href="#" data-sort="name">Name</a></div>';
        sortButtons += '<div class="chip"><a href="#" data-sort="enc">Seen</a></div>';
        sortButtons += '<div class="chip"><a href="#" data-sort="cap">Caught</a></div>';
        sortButtons += '<div class="chip"><a href="#" data-sort="candy">Candy</a></div>';
        sortButtons += '</div>';

        $('#sortButtons').html(sortButtons);

        self.sortAndShowPokedex('id', user_id);
        break;
      default:
        break;
    }
  },
  buildTrainerList: function() {
    var self = this,
      users = self.settings.users;
    var out = '<div class="col s12"><ul id="bots-list" class="collapsible" data-collapsible="accordion"> \
              <li class="bots_head"><div class="collapsible-title"><i class="material-icons">people</i>Bots</div></li>';

    var i = 0;
    for (var user in users) {
      // for consistency sake
      out += '<li class="bot-user">' +
        '<div class="collapsible-header bot-name">' + users[user].displayName + '</div>' +
        '<div class="collapsible-body">' +
          '<ul class="bot-items" data-user-id="' + user + '">' +
            '<li><a class="bot-btn-' + i + ' waves-effect waves-light btn tInfo">Info</a></li><br>' +
            '<li><a class="bot-btn-' + i + ' waves-effect waves-light btn tItems">Items</a></li><br>' +
            '<li><a class="bot-btn-' + i + ' waves-effect waves-light btn tPokemon">Pokemon</a></li><br>' +
            '<li><a class="bot-btn-' + i + ' waves-effect waves-light btn tPokedex">Pokedex</a></li><br>' +
            '<li><a class="bot-btn-' + i + ' waves-effect waves-light btn tFind">Find</a></li>' +
          '</ul>' +
        '</div>' +
      '</li>' +
      '<style>' +
        '.bot-btn-' + i + ' { background-color: ' + users[user].colors.primary + '; }' +
        '.bot-btn-' + i + ':hover { background-color: ' + users[user].colors.secondary + '; }' +
      '</style>';
      i += 1;
    }
    out += "</ul></div>";
    $('#trainers').html(out);
    var bots_collapsed = 1;
    $(document).on('click', '.bots_head', function () {
      var crt_display = 'block';
      if (bots_collapsed == 0) {
        bots_collapsed = 1;
      } else {
        crt_display = 'none';
        bots_collapsed = 0;
      }
      $(this).parent().find('li').each(function () {
        if (!$(this).hasClass('bots_head')) {
          $(this).css('display', crt_display);
        }
      });
    });
    $('.collapsible').collapsible();
  },
  catchSuccess: function(data, username) {
    var self = mapView,
      user = self.user_data[username],
      poke_name = '';
    if (data !== undefined && Object.keys(data).length) {
      if (user.catchable == undefined) {
        user.catchable = {};
      }
      var userCatchableLength = Object.keys(user.catchable).length,
        momentNow = moment();
      if (data.latitude !== undefined) {
        // Remove last Pokemon if it's not the current Pokemon or the expiration time has passed
        if (userCatchableLength && ((user.catchable.encounter_id != data.encounter_id) || moment(user.catchable.expiration_timestamp_ms).isSameOrBefore(momentNow))) {
          logger.log({
            message: "[" + self.settings.users[username].displayName + "] " + user.catchable.name + " has been caught or fled"
          });
          user.catchable.marker.setMap(null);
          user.catchable.infowindow.setMap(null);
          user.catchable = {};
        }
        // Process current Pokemon if last Pokemon didn't exist or was of different instance and current Pokemon hasn't expired
        if (!userCatchableLength && !moment(data.expiration_timestamp_ms).isSameOrBefore(momentNow)) {
          user.catchable.name = Pokemon.getPokemonById(data.pokemon_id).Name;
          logger.log({
            message: "[" + self.settings.users[username].displayName + "] " + user.catchable.name + " appeared",
            color: "green"
          });
          user.catchable.marker = new google.maps.Marker({
            map: self.map,
            position: {
              lat: parseFloat(data.latitude),
              lng: parseFloat(data.longitude)
            },
            icon: {
              url: 'image/pokemon/' + Pokemon.getImageById(data.pokemon_id),
              scaledSize: new google.maps.Size(70, 70)
            },
            zIndex: 3,
            //optimized: false, // need to figure out what this does - one thing that I know, zIndex gets ignored when this param exists
            clickable: true
          });
          var contentString = '<b>Spawn Point ID:</b> ' +
            data.spawn_point_id +
            '<br><b>Encounter ID:</b> ' +
            data.encounter_id +
            '<br><b>Name:</b> ' +
            user.catchable.name +
            '<br><br>This Pokemon will expire at ' +
            moment(data.expiration_timestamp_ms).format('hh:mm:ss A');
          user.catchable.infowindow = new google.maps.InfoWindow({
            content: contentString
          });
          google.maps.event.addListener(user.catchable.marker, 'click', (function(marker, content, infowindow) {
            return function() {
              infowindow.setContent(content);
              infowindow.open(map, marker);
            };
          })(user.catchable.marker, contentString, user.catchable.infowindow));
          user.catchable.encounter_id = data.encounter_id;
          user.catchable.expiration_timestamp_ms = data.expiration_timestamp_ms;
        }
      }
    } else {
      // very unlikely to be triggered with PokemonGoF as it doesn't seem to clear catchable file after successfully capturing the Pokemon
      if (Object.keys(user.catchable).length > 0) {
        logger.log({
          message: "[" + self.settings.users[username].displayName + "] " + user.catchable.name + " has been caught or fled"
        });
        user.catchable.marker.setMap(null);
        user.catchable.infowindow.setMap(null);
        user.catchable = undefined;
      }
    }
  },
  errorFunc: function(xhr) {
    console.error(xhr);
  },
  findBot: function(user_index) {
    var self = this,
      coords = self.pathcoords[user_index][self.pathcoords[user_index].length - 1];

    self.map.setZoom(self.settings.zoom);
    self.map.panTo({
      lat: parseFloat(coords.lat),
      lng: parseFloat(coords.lng)
    });
  },
  getCandy: function(p_num, user_id) {
    var self = this,
      user = self.user_data[user_id];

    for (var i = 0; i < user.bagCandy.length; i++) {
      var checkCandy = user.bagCandy[i].inventory_item_data.candy.family_id;
      if (Pokemon.getCandyId(p_num) === checkCandy) {
        return (user.bagCandy[i].inventory_item_data.candy.candy || 0);
      }
    }
  },
  placeTrainer: function() {
    var self = mapView;
    for (var user in self.settings.users) {
      loadJSON('location-' + user + '.json', user).then(function(data) {
        // data[0] contains the necessary data, data[1] contains the username
        self.trainerFunc(data[0], data[1]);
      });
    }
  },
  sortAndShowBagPokemon: function(sortOn, user_id) {
    var self = this,
      out = '',
      user = self.user_data[user_id],
      user_id = user_id || 0;

    //if (!user.bagPokemon.length) return; // commented out because this will prevent Pokemon inventory from showing (including eggs) if there's no Pokemon

    var sortedPokemon = user.getSortedPokemon(sortOn);

    out = '<div class="items"><div class="row">';

    var jsChkTime = moment().subtract(1, 'days');
    for (var i = 0; i < sortedPokemon.length; i++) {
      var myPokemon = sortedPokemon[i];
      var pkmnNum = myPokemon.id,
        pkmnImage = Pokemon.getImageById(myPokemon.id),
        pkmnName = Pokemon.getNameById(pkmnNum),
        pkmnCP = myPokemon.combatPower,
        pkmnIV = myPokemon.IV,
        pkmnIVA = myPokemon.attackIV,
        pkmnIVD = myPokemon.defenseIV,
        pkmnIVS = myPokemon.staminaIV,
        pkmnCandy = myPokemon.candy,
        pkmnHP = myPokemon.health,
        pkmnMHP = myPokemon.maxHealth,
        pkmTime = myPokemon.creationTime,
        jsPkmTime = moment(pkmTime);

      out += '<div class="col s12 m6 l3 center pkmn-info-container">' + 
        '<span class="pkmn-info-cp">CP<span>' + pkmnCP + '</span></span>' +
        '<span class="pkmn-info-img-container">' +
          '<img class="png_img pkmn-info-img" src="image/pokemon/' + pkmnImage + '">' +
          (jsPkmTime.isSameOrAfter(jsChkTime) ? '<span class="pkmn-info-img-glow"></span>' : '') +
        '</span>' +
        '<span class="pkmn-info-name">' +
          (sortOn == 'id' ? pkmnNum + ' - ' : '') +
          pkmnName +
        '</span>' + 
        '<div class="pkmn-info-hp-bar pkmn-' + pkmnNum + ' progress">' +
          '<div class="determinate pkmn-' + pkmnNum + '" style="width: ' + (pkmnHP / pkmnMHP) * 100 +'%"></div>' +
          '<span>' + pkmnHP + ' / ' + pkmnMHP + '</span>' +
        '</div>'+
        /*'<span>' +
          '<b>HP:</b> ' + pkmnHP + ' / ' + pkmnMHP + // obsolote because of the new display on the health bar
        '</span>' +*/
        '<span class="pkmn-info-iv">' +
          '<b>IV:</b> ' +
          // attach IV coloring effect only when the sorting mode isn't attack, defense and stamina, so that coloring can be focused on the selected sorting mode instead
          '<span class="' + (sortOn != 'attack' && sortOn != 'defense' && sortOn != 'stamina' ? (pkmnIV == 1 ? 'perfect' : (pkmnIV >= 0.8 ? 'solid' : '')) : '') + '">' +
            pkmnIV +
          '</span>' +
        '</span>' +
        '<span>' +
          '<b>A/D/S:</b> ' +
          (sortOn == 'attack' ? '<span class="pkmn-info-sort-ads">' + pkmnIVA + '</span>' : pkmnIVA) +
          '/' +
          (sortOn == 'defense' ? '<span class="pkmn-info-sort-ads">' + pkmnIVD + '</span>' : pkmnIVD) +
          '/' +
          (sortOn == 'stamina' ? '<span class="pkmn-info-sort-ads">' + pkmnIVS + '</span>' : pkmnIVS) +
        '</span>' +
        '<span class="pkmn-info-candy">' +
          '<span class="tooltipped" data-position="right" data-delay="25" data-tooltip="' + pkmnCandy + ' Candies">' +
            '<b>' + pkmnCandy + '</b>' +
            '<img src="image/items/Candy_new.png">' +
          '</span>' +
        '</span>' +
        (sortOn == 'time' ?
        '<span class="pkmn-info-capture-time" title="' + jsPkmTime.format("dddd, MMMM Do YYYY, h:mm:ss a") + '">' +
          jsPkmTime.fromNow() +
        '</span>'
        : '') +
      '</div>';
    }

    // Add number of eggs
    out += '<div class="col s12 m4 l3 center" style="float: left;"><img src="image/items/Egg.png" class="png_img"><br><b>You have ' + user.eggs + ' egg' + (user.eggs !== 1 ? "s" : "") + '</div>';
    for (var i = 0; i < user.incubators.length; i++) {
      var incubator = user.incubators[i].inventory_item_data.egg_incubators.egg_incubator;
      if (!incubator.item_id) {
        var incubator = user.incubators[i].inventory_item_data.egg_incubators.egg_incubator[0];
      }
      var current_user_stats = self.user_data[user_id].stats;
      var totalToWalk  = incubator.target_km_walked - incubator.start_km_walked;
      var kmsLeft = incubator.target_km_walked - current_user_stats.km_walked;
      var walked = totalToWalk - kmsLeft;
      var eggString = (parseFloat(walked).toFixed(1) || 0) + " / " + (parseFloat(totalToWalk).toFixed(1) || 0) + "km";
      if (incubator.item_id == 902) {
        var img = 'EggIncubator';
      } else {
        var img = 'EggIncubatorUnlimited';
      }
      out += '<div class="col s12 m4 l3 center" style="float: left;"><img src="image/items/' + img + '.png" class="png_img"><br>';
      out += eggString;
    }
    out += '</div></div>';
    var nth = 0;
    out = out.replace(/<\/div><div/g, function (match, i, original) {
      nth++;
      return (nth % 4 === 0) ? '</div></div><div class="row"><div' : match;
    });

    $('#subcontent').html(out);
    $('#subcontent .tooltipped').tooltip();
  },
  sortAndShowPokedex: function(sortOn, user_id) {
    var self = this,
      out = '',
      user_id = (user_id || 0),
      user = self.user_data[user_id];

    out = '<div class="items"><div class="row">';
    var sortedPokedex = user.pokedex.getAllEntriesSorted(sortOn);
    for (var i = 0; i < sortedPokedex.length; i++) {
      var entry = sortedPokedex[i];
      out += '<div class="col s12 m6 l3 center pkmn-info-container">' + 
        '<img src="image/pokemon/' + entry.image + '" class="png_img">' +
        '<span class="pkmn-info-name"> ' +
          (sortOn != 'name' ? Pokemon.getPaddedId(entry.id) + ' - ' : '') +
          entry.name +
          (sortOn == 'name' ? ' - ' + Pokemon.getPaddedId(entry.id) : '') +
        '</span>' +
        '<span>' +
          '<b>Seen:</b> ' + entry.encountered +
        '</span>' +
        '<span>' +
          '<b>Caught:</b> ' + entry.captured +
        '</span>' +
        '<span class="pkmn-info-candy">' +
          '<span class="tooltipped" data-position="right" data-delay="25" data-tooltip="' + entry.candy + ' Candies">' +
            '<b>' + entry.candy + '</b>' +
            '<img src="image/items/Candy_new.png">' +
          '</span>' +
        '</span>' +
      '</div>';
    }
    out += '</div></div>';
    var nth = 0;
    out = out.replace(/<\/div><div/g, function (match, i, original) {
      nth++;
      return (nth % 4 === 0) ? '</div></div><div class="row"><div' : match;
    });
    $('#subcontent').html(out);
    $('#subcontent .tooltipped').tooltip();
  },
  getGymLevel: function(gymPoints) {
    var level = 1;
    for (var t_level in self.min_gp_per_level) {
      if (self.min_gp_per_level[t_level] < gymPoints) {
        var level = t_level;
      }
    }
    return level;
  },
  trainerFunc: function(data, username) {
    var self = mapView,
      coords = self.pathcoords[username][self.pathcoords[username].length - 1];
    for (var i = 0; i < data.cells.length; i++) {
      var cell = data.cells[i];
      if (data.cells[i].forts != undefined) {
        for (var x = 0; x < data.cells[i].forts.length; x++) {
          var fort = cell.forts[x];
          if (!self.forts[fort.id]) {
            if (fort.type === 1) {
              self.forts[fort.id] = new google.maps.Marker({
                map: self.map,
                position: {
                  lat: parseFloat(fort.latitude),
                  lng: parseFloat(fort.longitude)
                },
                zIndex: 1,
                icon: 'image/forts/img_pokestop.png'
              });
            } else {
              self.forts[fort.id] = new google.maps.Marker({
                map: self.map,
                position: {
                  lat: parseFloat(fort.latitude),
                  lng: parseFloat(fort.longitude)
                },
                zIndex: 2,
                icon: {
                  url: 'image/forts/' + self.teams[(fort.owned_by_team || 0)] + '.png',
                  scaledSize: new google.maps.Size(30, 30)
                }
              });
            }
            var fortType = '<b>Type:</b> PokeStop',
              contentString = '<b>ID:</b> ' + fort.id;
            if (fort.type == 1) {
              contentString += '<br>' + fortType; 
            } else {
              var fortType = '<b>Type:</b> Gym',
                fortTeam = '<b>Team:</b> ' + self.teams[fort.owned_by_team],
                fortGuardPokemon = '<b>Guard Pokemon:</b> ' + (fort.guard_pokemon_id == undefined ? 'None' : (Pokemon.getPokemonById(fort.guard_pokemon_id).Name || 'None')),
                fortPoints = '<b>Points:</b> ' + fort.gym_points,
                fortLevel = '<b>Gym Level:</b> ' + self.getGymLevel(fort.gym_points);
              contentString += '<br>' + fortType + '<br>' + fortTeam + '<br>' + fortGuardPokemon + '<br>' + fortPoints + '<br>' + fortLevel;
            }
            self.info_windows[fort.id] = new google.maps.InfoWindow({
              content: contentString
            });
            google.maps.event.addListener(self.forts[fort.id], 'click', (function(marker, content, infowindow) {
              return function() {
                infowindow.setContent(content);
                infowindow.open(map, marker);
              };
            })(self.forts[fort.id], contentString, self.info_windows[fort.id]));
          }
        }
      }
    }
    if (coords > 1) {
      var tempcoords = [{
        lat: parseFloat(data.lat),
        lng: parseFloat(data.lng)
      }];
      if (tempcoords.lat != coords.lat && tempcoords.lng != coords.lng || self.pathcoords[username].length === 1) {
        self.pathcoords[username].push({
          lat: parseFloat(data.lat),
          lng: parseFloat(data.lng)
        });
      }
    } else {
      self.pathcoords[username].push({
        lat: parseFloat(data.lat),
        lng: parseFloat(data.lng)
      });
    }
    if (self.user_data[username].hasOwnProperty('marker') === false) {
      self.buildTrainerList();
      self.addInventory();
      logger.log({
        message: "Trainer loaded: " + self.settings.users[username].displayName,
        color: "blue"
      });
      self.user_data[username].marker = new google.maps.Marker({
        map: self.map,
        position: {
          lat: parseFloat(data.lat),
          lng: parseFloat(data.lng)
        },
        icon: self.settings.users[username].icon,
        zIndex: 5,
        //label: username,
        clickable: true
      });
      var contentString = '<b>Trainer:</b> ' + username;
      self.user_data[username].infowindow = new google.maps.InfoWindow({
        content: contentString
      });
      google.maps.event.addListener(self.user_data[username].marker, 'click', (function(marker, content, infowindow) {
        return function() {
          infowindow.setContent(content);
          infowindow.open(map, marker);
        };
      })(self.user_data[username].marker, contentString, self.user_data[username].infowindow));
    } else {
      self.user_data[username].marker.setPosition({
        lat: parseFloat(data.lat),
        lng: parseFloat(data.lng)
      });
      if (self.pathcoords[username].length === 2) {
        self.user_data[username].trainerPath = new google.maps.Polyline({
          map: self.map,
          path: self.pathcoords[username],
          geodisc: true,
          strokeColor: self.settings.users[username].colors.path,
          strokeOpacity: 0.0,
          strokeWeight: 2
        });
      } else {
        self.user_data[username].trainerPath.setPath(self.pathcoords[username]);
      }
    }
    self.setBotPathOptions(self.settings.botPath);
    if (Object.keys(self.settings.users).length === 1 && self.settings.userZoom === true) {
      self.map.setZoom(self.settings.zoom);
    }
    if (Object.keys(self.settings.users).length === 1 && self.settings.userFollow === true) {
      self.map.panTo({
        lat: parseFloat(data.lat),
        lng: parseFloat(data.lng)
      });
    }
    if (!hasFocused && Object.keys(self.settings.users).length > 1 && self.settings.users[username].focus) {
      self.map.setZoom(self.settings.zoom);
      self.map.panTo({
        lat: parseFloat(data.lat),
        lng: parseFloat(data.lng)
      });
      hasFocused = true;
    }
  },
};

if (!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) {
      return typeof args[number] != 'undefined' ? args[number] : match;
    });
  };
}
