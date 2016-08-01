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

// Array of map styles (thanks to https://github.com/AHAAAAAAA/PokemonGo-Map)
var mStyles = {
  "nolabels": { name: "No Labels", style: [{featureType:"poi",elementType:"labels",stylers:[{visibility:"off"}]},{featureType:"all",elementType:"labels.icon",stylers:[{visibility:"off"}]}] },
  "light2": { name: "Light2", style: [{elementType:"geometry",stylers:[{hue:"#ff4400"},{saturation:-68},{lightness:-4},{gamma:.72}]},{featureType:"road",elementType:"labels.icon"},{featureType:"landscape.man_made",elementType:"geometry",stylers:[{hue:"#0077ff"},{gamma:3.1}]},{featureType:"water",stylers:[{hue:"#00ccff"},{gamma:.44},{saturation:-33}]},{featureType:"poi.park",stylers:[{hue:"#44ff00"},{saturation:-23}]},{featureType:"water",elementType:"labels.text.fill",stylers:[{hue:"#007fff"},{gamma:.77},{saturation:65},{lightness:99}]},{featureType:"water",elementType:"labels.text.stroke",stylers:[{gamma:.11},{weight:5.6},{saturation:99},{hue:"#0091ff"},{lightness:-86}]},{featureType:"transit.line",elementType:"geometry",stylers:[{lightness:-48},{hue:"#ff5e00"},{gamma:1.2},{saturation:-23}]},{featureType:"transit",elementType:"labels.text.stroke",stylers:[{saturation:-64},{hue:"#ff9100"},{lightness:16},{gamma:.47},{weight:2.7}]}] },
  "dark": { name: "Dark", style: [{featureType:"all",elementType:"labels.text.fill",stylers:[{saturation:36},{color:"#b39964"},{lightness:40}]},{featureType:"all",elementType:"labels.text.stroke",stylers:[{visibility:"on"},{color:"#000000"},{lightness:16}]},{featureType:"all",elementType:"labels.icon",stylers:[{visibility:"off"}]},{featureType:"administrative",elementType:"geometry.fill",stylers:[{color:"#000000"},{lightness:20}]},{featureType:"administrative",elementType:"geometry.stroke",stylers:[{color:"#000000"},{lightness:17},{weight:1.2}]},{featureType:"landscape",elementType:"geometry",stylers:[{color:"#000000"},{lightness:20}]},{featureType:"poi",elementType:"geometry",stylers:[{color:"#000000"},{lightness:21}]},{featureType:"road.highway",elementType:"geometry.fill",stylers:[{color:"#000000"},{lightness:17}]},{featureType:"road.highway",elementType:"geometry.stroke",stylers:[{color:"#000000"},{lightness:29},{weight:.2}]},{featureType:"road.arterial",elementType:"geometry",stylers:[{color:"#000000"},{lightness:18}]},{featureType:"road.local",elementType:"geometry",stylers:[{color:"#181818"},{lightness:16}]},{featureType:"transit",elementType:"geometry",stylers:[{color:"#000000"},{lightness:19}]},{featureType:"water",elementType:"geometry",stylers:[{lightness:17},{color:"#525252"}]}] },
  "pokemongo": { name: "Pokemon Go", style: [{featureType:"landscape.man_made",elementType:"geometry.fill",stylers:[{color:"#a1f199"}]},{featureType:"landscape.natural.landcover",elementType:"geometry.fill",stylers:[{color:"#37bda2"}]},{featureType:"landscape.natural.terrain",elementType:"geometry.fill",stylers:[{color:"#37bda2"}]},{featureType:"poi.attraction",elementType:"geometry.fill",stylers:[{visibility:"on"}]},{featureType:"poi.business",elementType:"geometry.fill",stylers:[{color:"#e4dfd9"}]},{featureType:"poi.business",elementType:"labels.icon",stylers:[{visibility:"off"}]},{featureType:"poi.park",elementType:"geometry.fill",stylers:[{color:"#37bda2"}]},{featureType:"road",elementType:"geometry.fill",stylers:[{color:"#84b09e"}]},{featureType:"road",elementType:"geometry.stroke",stylers:[{color:"#fafeb8"},{weight:"1.25"}]},{featureType:"road.highway",elementType:"labels.icon",stylers:[{visibility:"off"}]},{featureType:"water",elementType:"geometry.fill",stylers:[{color:"#5ddad6"}]}] },
  "light2_nolabels": { name: "Light2 (No Labels)", style: [{elementType:"geometry",stylers:[{hue:"#ff4400"},{saturation:-68},{lightness:-4},{gamma:.72}]},{featureType:"road",elementType:"labels.icon"},{featureType:"landscape.man_made",elementType:"geometry",stylers:[{hue:"#0077ff"},{gamma:3.1}]},{featureType:"water",stylers:[{hue:"#00ccff"},{gamma:.44},{saturation:-33}]},{featureType:"poi.park",stylers:[{hue:"#44ff00"},{saturation:-23}]},{featureType:"water",elementType:"labels.text.fill",stylers:[{hue:"#007fff"},{gamma:.77},{saturation:65},{lightness:99}]},{featureType:"water",elementType:"labels.text.stroke",stylers:[{gamma:.11},{weight:5.6},{saturation:99},{hue:"#0091ff"},{lightness:-86}]},{featureType:"transit.line",elementType:"geometry",stylers:[{lightness:-48},{hue:"#ff5e00"},{gamma:1.2},{saturation:-23}]},{featureType:"transit",elementType:"labels.text.stroke",stylers:[{saturation:-64},{hue:"#ff9100"},{lightness:16},{gamma:.47},{weight:2.7}]},{featureType:"all",elementType:"labels.text.stroke",stylers:[{visibility:"off"}]},{featureType:"all",elementType:"labels.text.fill",stylers:[{visibility:"off"}]},{featureType:"all",elementType:"labels.icon",stylers:[{visibility:"off"}]}] },
  "dark_nolabels": { name: "Dark (No Labels)", style: [{featureType:"all",elementType:"labels.text.fill",stylers:[{visibility:"off"}]},{featureType:"all",elementType:"labels.text.stroke",stylers:[{visibility:"off"}]},{featureType:"all",elementType:"labels.icon",stylers:[{visibility:"off"}]},{featureType:"administrative",elementType:"geometry.fill",stylers:[{color:"#000000"},{lightness:20}]},{featureType:"administrative",elementType:"geometry.stroke",stylers:[{color:"#000000"},{lightness:17},{weight:1.2}]},{featureType:"landscape",elementType:"geometry",stylers:[{color:"#000000"},{lightness:20}]},{featureType:"poi",elementType:"geometry",stylers:[{color:"#000000"},{lightness:21}]},{featureType:"road.highway",elementType:"geometry.fill",stylers:[{color:"#000000"},{lightness:17}]},{featureType:"road.highway",elementType:"geometry.stroke",stylers:[{color:"#000000"},{lightness:29},{weight:.2}]},{featureType:"road.arterial",elementType:"geometry",stylers:[{color:"#000000"},{lightness:18}]},{featureType:"road.local",elementType:"geometry",stylers:[{color:"#181818"},{lightness:16}]},{featureType:"transit",elementType:"geometry",stylers:[{color:"#000000"},{lightness:19}]},{featureType:"water",elementType:"geometry",stylers:[{lightness:17},{color:"#525252"}]}] },
  "pokemongo_nolabels": { name: "Pokemon Go (No Labels)", style: [{featureType:"landscape.man_made",elementType:"geometry.fill",stylers:[{color:"#a1f199"}]},{featureType:"landscape.natural.landcover",elementType:"geometry.fill",stylers:[{color:"#37bda2"}]},{featureType:"landscape.natural.terrain",elementType:"geometry.fill",stylers:[{color:"#37bda2"}]},{featureType:"poi.attraction",elementType:"geometry.fill",stylers:[{visibility:"on"}]},{featureType:"poi.business",elementType:"geometry.fill",stylers:[{color:"#e4dfd9"}]},{featureType:"poi.business",elementType:"labels.icon",stylers:[{visibility:"off"}]},{featureType:"poi.park",elementType:"geometry.fill",stylers:[{color:"#37bda2"}]},{featureType:"road",elementType:"geometry.fill",stylers:[{color:"#84b09e"}]},{featureType:"road",elementType:"geometry.stroke",stylers:[{color:"#fafeb8"},{weight:"1.25"}]},{featureType:"road.highway",elementType:"labels.icon",stylers:[{visibility:"off"}]},{featureType:"water",elementType:"geometry.fill",stylers:[{color:"#5ddad6"}]},{featureType:"all",elementType:"labels.text.stroke",stylers:[{visibility:"off"}]},{featureType:"all",elementType:"labels.text.fill",stylers:[{visibility:"off"}]},{featureType:"all",elementType:"labels.icon",stylers:[{visibility:"off"}]}] },
  // https://github.com/OpenPoGo/OpenPoGoWeb/issues/122
  "chrischi-": { name: "Chrischi-'s Pokemon Go (No Labels)", style: [{featureType:"road",elementType:"geometry.fill",stylers:[{color:"#4f9f92"},{visibility:"on"}]},{featureType:"water",elementType:"geometry.stroke",stylers:[{color:"#feff95"},{visibility:"on"},{weight:1.2}]},{featureType:"landscape",elementType:"geometry",stylers:[{color:"#adff9d"},{visibility:"on"}]},{featureType:"water",stylers:[{visibility:"on"},{color:"#147dd9"}]},{featureType:"poi",elementType:"geometry.fill",stylers:[{color:"#d3ffcc"}]},{elementType:"labels",stylers:[{visibility:"off"}]}] },
};

// Array of required EXPs to level up for each level
var expsPerLevel = { 1: 1000, 2: 2000, 3: 3000, 4: 4000, 5: 5000, 6: 6000, 7: 7000, 8: 8000, 9: 9000, 10: 10000,
  11: 10000, 12: 10000, 13: 10000, 14: 15000, 15: 20000, 16: 20000, 17: 20000, 18: 25000, 19: 25000, 20: 50000,
  21: 75000, 22: 100000, 23: 125000, 24: 150000, 25: 190000, 26: 200000, 27: 250000, 28: 300000, 29: 350000, 30: 500000,
  31: 500000, 32: 750000, 33: 1000000, 34: 1250000, 35: 1500000, 36: 2000000, 37: 2500000, 38: 3000000, 39: 5000000, 40: 5000000
};

// Array of minimum gym points per level
var minGPPerLevel = { 1: 0, 2: 2000, 3: 4000, 4: 8000, 5: 12000, 6: 16000, 7: 20000, 8: 30000, 9: 40000, 10: 50000 };

// Indicator of whether the map has focused to the first bot (for 'focus' parameter in config)
var hasFocused = false;

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
  playerInfo: {},
  user_data: {},
  pathcoords: {},
  settings: {},
  customPaths: {}, // Array of custom paths for Paths menu
  customPathsLine: 0, // Polyline of all the custom paths for Paths menu
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
        if (!trainerPath) { continue; } // Failsafe in case user data hasn't been fully loaded
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
      if ($('#submenu').is(':visible') && !$('#submenu').data('gym-info') && itemIndex == submenuIndex && currentUserId == userId) {
        $('#submenu').toggle();
      } else {
        if ($('#submenu').data('gym-info')) { $('#submenu').removeData('gym-info'); }
        submenuIndex = itemIndex;
        currentUserId = userId;
        self.buildMenu(userId, itemIndex);
      }
    });

    $('body').on('click', '#close', function() {
      $('#submenu').toggle();
      if ($('#submenu').data('gym-info')) { $('#submenu').removeData('gym-info'); }
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
  changeMapStyle: function(style) {
    var self = mapView,
      style = $(this).data('style');

    if (!style) { return; }

    if (mStyles[style] && mStyles[style].style) {
      self.map.setOptions({
        mapTypeId: 'roadmap',
        styles: mStyles[style].style
      });
    } else {
      self.map.setOptions({
        mapTypeId: (style == 'satellite' ? 'satellite' : 'roadmap'),
        styles: []
      });
    }

    Cookies.set('mapStyle', style, { expires: 365 });
  },
  initMap: function() {
    var self = this,
      cookies = Cookies.get('mapStyle'),
      desiredStyle = cookies || self.settings.defaultMapStyle || undefined;
    self.map = new google.maps.Map(document.getElementById('map'), {
      center: { lat: 50.0830986, lng: 6.7613762 },
      zoom: 8,
      mapTypeId: (desiredStyle && desiredStyle == 'satellite' ? 'satellite' : 'roadmap'),
      styles: ((desiredStyle && desiredStyle != 'satellite' && mStyles[desiredStyle] && mStyles[desiredStyle].style) ? mStyles[desiredStyle].style : []),
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: true,
      fullscreenControlOptions: { position: google.maps.ControlPosition.TOP_LEFT }
    });

    var ops = $('#mapStyles');
    if (mStyles != undefined && Object.keys(mStyles).length && ops != undefined) {
      ops.append('<li class="divider"></li>');
      for (var s in mStyles) {
        if (mStyles[s].name != undefined && mStyles[s].style != undefined) {
          ops.append('<li><a data-style="' + s + '">' + mStyles[s].name + '</a></li><li class="divider"></li>');
        }
      }
      ops.find('li.divider:last-child').remove(); // remove latest divider thingy
      ops.find('li > a').click(self.changeMapStyle); // add click handler
    }

    if (cookies) { Cookies.set('mapStyle', cookies, { expires: 365 }); } // refresh cookies

    // Validate which user to prioritize in parsing location (this is for instances where multiple bots provide different data for the same location)
    self.prioritize = undefined;
    for (var p in self.settings.users) { if (self.settings.users[p].prioritizeLocationData) { self.prioritize = p; break; } }
    if (!self.prioritize) { self.prioritize = Object.keys(self.settings.users)[0]; }

    self.placeTrainer();
    self.addCatchable();
    setInterval(self.placeTrainer, 1000);
    setInterval(self.addCatchable, 1000);
    setInterval(self.addInventory, 5000);

    self.bindPathMenu();
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
    for (i = 1; i < level; i++) { t += expsPerLevel[i]; }
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
          exp_to_level_percentage = exp_for_current_level / expsPerLevel[current_user_stats.level] * 100;

        out += '<div class="row"><div class="col s12"><h5>' +
          (self.settings.users[user_id].displayName ? self.settings.users[user_id].displayName : user_id) +
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
          expsPerLevel[current_user_stats.level] +
          '<br>Remaining Experience: ' +
          (expsPerLevel[current_user_stats.level] - exp_for_current_level) +
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

        var sortButtons = '<div class="col s12 pokedex-sort" data-user-id="' + user_id + '">Sort : ';
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
    var out = '<div class="col s12"><ul id="bots-list" class="collapsible" data-collapsible="accordion">' +
      '<li><div class="collapsible-header' + (self.settings.collapseBotMenu || self.settings.collapseBotMenu == undefined ? ' active' : '') + '">' +
      '<i class="material-icons">people</i>Bots</div>' +
      '<div class="collapsible-body" style="padding: 0; border: 0">' +
      '<ul class="collapsible bots-list-collapsible" data-collapsible="accordion" style="border: 0; margin: 0; box-shadow: none">';

    var i = 0;
    for (var user in users) {
      // Rewrote every line to be using string join instead of that '\' thingy for consistency sake (I mean, everything else does it that way, so..)
      out += '<li class="bot-user">' +
        '<div class="collapsible-header bot-name">' + (users[user].displayName ? users[user].displayName : user) + '</div>' +
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
    out += "</ul></div></li></ul></div>";
    $('#trainers').html(out);
    $('.collapsible').collapsible();
  },
  catchSuccess: function(data, username) {
    var self = mapView,
      user = self.user_data[username],
      poke_name = '';
    // Create the lone info_window which will be used to display PokeStop info if it doesn't exist
    if (!self.info_windows.pokemon) { self.info_windows.pokemon = new google.maps.InfoWindow(); }
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
            message: "[" + (self.settings.users[username].displayName ? self.settings.users[username].displayName : username) + "] " + user.catchable.name + " has been caught or fled"
          });
          user.catchable.marker.setMap(null);
          user.catchable = {};
        }
        // Process current Pokemon if last Pokemon didn't exist or was of different instance and current Pokemon hasn't expired
        if (!userCatchableLength && !moment(data.expiration_timestamp_ms).isSameOrBefore(momentNow)) {
          user.catchable.name = Pokemon.getPokemonById(data.pokemon_id).Name;
          logger.log({
            message: "[" + (self.settings.users[username].displayName ? self.settings.users[username].displayName : username) + "] " + user.catchable.name + " appeared",
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
              scaledSize: new google.maps.Size(45, 45)
            },
            zIndex: 3,
            clickable: true
          });
          user.catchable.infowindow = '<b>Spawn Point ID:</b> ' +
            data.spawn_point_id +
            '<br><b>Encounter ID:</b> ' +
            data.encounter_id +
            '<br><b>Name:</b> ' +
            user.catchable.name +
            '<br><br>This Pokemon will expire at ' +
            moment(data.expiration_timestamp_ms).format('hh:mm:ss A');
          google.maps.event.addListener(user.catchable.marker, 'click', (function(username) {
            return function() {
              self.info_windows.pokemon.setContent(self.user_data[username].catchable.infowindow);
              self.info_windows.pokemon.open(this.map, this);
            };
          })(username));
          user.catchable.encounter_id = data.encounter_id;
          user.catchable.expiration_timestamp_ms = data.expiration_timestamp_ms;
        }
      }
    } else {
      // very unlikely to be triggered with PokemonGoF as it doesn't seem to clear catchable file after successfully capturing the Pokemon
      if (user.catchable !== undefined && Object.keys(user.catchable).length > 0) {
        logger.log({
          message: "[" + (self.settings.users[username].displayName ? self.settings.users[username].displayName : username) + "] " + user.catchable.name + " has been caught or fled"
        });
        user.catchable.marker.setMap(null);
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

    return '...'; // fallback for no data
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
          '<span class="tooltipped" data-position="right" data-delay="25" data-tooltip="' +
          (pkmnCandy == '...' ? 'Could not retrieve candy data...' : pkmnCandy + ' Candies') + '">' +
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

    // Display eggs and incubators
    out += '<div class="col s12 m4 l3 center"><img src="image/items/Egg.png" class="png_img"><br><b>You have ' + user.eggs + ' egg' + (user.eggs !== 1 ? "s" : "") + '</b></div>';
    if (Object.keys(user.incubators)) {
      var incubators = user.incubators[0].inventory_item_data.egg_incubators.egg_incubator;
      for (var i = 0; i < incubators.length; i++) {
        var totalToWalk  = incubators[i].target_km_walked - incubators[i].start_km_walked,
          kmsLeft = incubators[i].target_km_walked - self.user_data[user_id].stats.km_walked,
          walked = totalToWalk - kmsLeft,
          img = (incubators[i].item_id == 902 ? 'EggIncubator' : 'EggIncubatorUnlimited'),
          eggString = '<b>' + (parseFloat(walked).toFixed(1) || 0) + " / " + (parseFloat(totalToWalk).toFixed(1) || 0) + "km</b>" +
            (incubators[i].item_id == 902 ? '<br><b>Uses Left:</b> ' + incubators[i].uses_remaining : '');

        out += '<div class="col s12 m4 l3 center"><img src="image/items/' + img + '.png" class="png_img"><br>' + eggString + '</div>';
      }
    }
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
    for (var t_level in self.minGPPerLevel) {
      if (self.minGPPerLevel[t_level] < gymPoints) {
        var level = t_level;
      }
    }
    return level;
  },
  buildGymInfo: function(fort) {
    if (!fort || !Object.keys(fort).length) { return; } // if fort is not defined or if it's an empty object or if gym_details is not present

    $('#submenu').show();
    $('#submenu').data('gym-info', '1');
    $('#sortButtons').html('');

    var self = this,
      out = '';
    var gym_details = fort.gym_details,
      gym_memberships = (gym_details.gym_state ? gym_details.gym_state.memberships : undefined);

    if (gym_details.name && gym_details.urls && gym_details.urls.length) {
      out += '<span class="gym-title">' + gym_details.name + '</span>' +
        '<div class="gym-image" style="background-image: url(\'' + gym_details.urls[0] + '\')"></div>' +
        (gym_details.description ? '<span class="gym-desc">' + gym_details.description + '</span>' : '');
    } else {
      out += '<span class="gym-desc">Unable to receive more detailed information about this Gym.</span>';
    }

    out += '<div class="gym-info-separator"></div>';

    if (fort.owned_by_team) {
      out += '<b>Team:</b> ' + self.teams[fort.owned_by_team] + '<br>' +
        '<b>Points:</b> ' + fort.gym_points + '<br>' +
        '<b>Gym Level:</b> ' + self.getGymLevel(fort.gym_points) +
        '<div class="gym-info-separator"></div>';
      if (gym_memberships && gym_memberships.length) {
        out += '<div class="row">';
        for (var m = 0; m < gym_memberships.length; m++) {
          var gymPokemon = new Pokemon(gym_memberships[m].pokemon_data);
          var pkmnNum = gymPokemon.id,
            pkmnImage = Pokemon.getImageById(gymPokemon.id),
            pkmnName = Pokemon.getNameById(pkmnNum),
            pkmnCP = gymPokemon.combatPower,
            pkmnIV = gymPokemon.IV,
            pkmnIVA = gymPokemon.attackIV,
            pkmnIVD = gymPokemon.defenseIV,
            pkmnIVS = gymPokemon.staminaIV,
            pkmnHP = gymPokemon.health,
            pkmnMHP = gymPokemon.maxHealth;

          out += '<div class="col s12 m6 l4 center pkmn-info-container">' + 
            '<span class="pkmn-info-cp">CP<span>' + pkmnCP + '</span></span>' +
            '<span class="pkmn-info-img-container">' +
              '<img class="png_img pkmn-info-img" src="image/pokemon/' + pkmnImage + '">' +
            '</span>' +
            '<span class="pkmn-info-name">' +
              pkmnName +
            '</span>' + 
            '<div class="pkmn-info-hp-bar pkmn-' + pkmnNum + ' progress">' +
              '<div class="determinate pkmn-' + pkmnNum + '" style="width: ' + (pkmnHP / pkmnMHP) * 100 +'%"></div>' +
              '<span>' + pkmnHP + ' / ' + pkmnMHP + '</span>' +
            '</div>'+
            '<span class="pkmn-info-iv">' +
              '<b>IV:</b> ' +
              '<span class="' + (pkmnIV == 1 ? 'perfect' : (pkmnIV >= 0.8 ? 'solid' : '')) + '">' +
                pkmnIV +
              '</span>' +
            '</span>' +
            '<span>' +
              '<b>A/D/S:</b> ' + pkmnIVA + '/' + pkmnIVD + '/' + pkmnIVS +
            '</span>' +
            '<span>' +
              '<b>Trainer:</b> ' + gym_memberships[m].trainer_public_profile.name +
            '</span>' +
            '<span>' +
              '<b>Trainer Level:</b> ' + gym_memberships[m].trainer_public_profile.level +
            '</span>' +
          '</div>';
        }
        out += '</div>';
      } else if (fort.guard_pokemon_id != undefined) {
        out += '<b>Guard Pokemon:</b> ' + Pokemon.getNameById(fort.guard_pokemon_id);
      }
    } else {
      out += 'This gym is not owned by any team.';
    }

    $('#subtitle').html('Gym Info');
    $('#subcontent').html(out);
  },
  trainerFunc: function(data, username) {
    var self = mapView,
      coords = self.pathcoords[username][self.pathcoords[username].length - 1],
      jsChkTime = moment();
    // Create the lone info_window which will be used to display PokeStop info if it doesn't exist
    if (!self.info_windows.fort) { self.info_windows.fort = new google.maps.InfoWindow(); }
    for (var i = 0; i < data.cells.length; i++) {
      var cell = data.cells[i];
      if (data.cells[i].forts != undefined) {
        for (var x = 0; x < data.cells[i].forts.length; x++) {
          var fort_id = cell.forts[x].id;
          if (self.forts[fort_id]) {
            // Process only if the new data comes from the same origin
            if (self.forts[fort_id].owner != self.prioritize) { break; }

            // Update existing fort data as necessary
            var fort_data = self.forts[fort_id].data;

            if (fort_data.type === 1) {
              var old_lure_info = fort_data.hasOwnProperty('lure_info'),
                new_lure_info = cell.forts[x].hasOwnProperty('lure_info'),
                is_lured = 0, lure_timestamp = 0;
              // Validate lure effect
              if (new_lure_info) {
                lure_timestamp = cell.forts[x].lure_info.lure_expires_timestamp_ms;
                is_lured = (!jsChkTime.isSameOrAfter(lure_timestamp) ? 1 : 0);
              }
              // Change PokeStop icon if necessary
              if (new_lure_info != old_lure_info) {
                self.forts[fort_id].marker.setOptions({ icon: (is_lured ? 'image/forts/img_pokestop_lure.png' : 'image/forts/img_pokestop.png') });
              }
              // Update info window message (this will always be updated regardless of whether the lure status was different or not)
              self.forts[fort_id].infowindow = '<b>ID:</b> ' + fort_data.id + '<br><b>Type:</b> PokeStop' +
                (is_lured ? '<br><br>The lure effect in this PokeStop will expire at ' + moment(lure_timestamp).format('hh:mm:ss A') : '');
            } else {
              // Change Gym icon if necessary
              var old_team = fort_data.owned_by_team || 0,
                new_team = cell.forts[x].owned_by_team || 0,
                gym_name = fort_data.gym_details.name;

              if (new_team !== old_team) {
                self.forts[fort_id].marker.setOptions({
                  icon: {
                    url: 'image/forts/' + self.teams[new_team] + '.png',
                    scaledSize: new google.maps.Size(25, 25)
                  }
                });
                logger.log({
                  message: (gym_name ? 'Gym: ' + gym_name : 'A faraway gym') +
                    (new_team != 0 ? ' is now owned by Team ' + self.teams[new_team] : ' was taken over from Team ' + self.teams[old_team])
                });
              }
            }
            // Now update existing data with the new one
            self.forts[fort_id].data = cell.forts[x];
          } else {
            // Create the fort if it didn't exist
            self.forts[fort_id] = {
              data: cell.forts[x],
              owner: username
            };
            var fort_data = self.forts[fort_id].data;
            if (fort_data.type === 1) {
              var is_lured = 0, lure_timestamp = 0;
              if (fort_data.hasOwnProperty('lure_info')) {
                lure_timestamp = fort_data.lure_info.lure_expires_timestamp_ms;
                is_lured = (!jsChkTime.isSameOrAfter(lure_timestamp) ? 1 : 0);
              }
              self.forts[fort_id].marker = new google.maps.Marker({
                map: self.map,
                position: {
                  lat: parseFloat(fort_data.latitude),
                  lng: parseFloat(fort_data.longitude)
                },
                zIndex: 1,
                icon: (is_lured ? 'image/forts/img_pokestop_lure.png' : 'image/forts/img_pokestop.png')
              });
              self.forts[fort_id].infowindow = '<b>ID:</b> ' + fort_data.id + '<br><b>Type:</b> PokeStop' +
                (is_lured ? '<br><br>The lure effect in this PokeStop will expire at ' + moment(lure_timestamp).format('hh:mm:ss A') : '');
            } else {
              self.forts[fort_id].marker = new google.maps.Marker({
                map: self.map,
                position: {
                  lat: parseFloat(fort_data.latitude),
                  lng: parseFloat(fort_data.longitude)
                },
                zIndex: 2,
                icon: {
                  url: 'image/forts/' + self.teams[(fort_data.owned_by_team || 0)] + '.png',
                  scaledSize: new google.maps.Size(25, 25)
                }
              });
            }
            // Only pass over the fort ID to the listener so that when the data changes we won't have to re-create the listener
            google.maps.event.addListener(self.forts[fort_id].marker, 'click', (function(fort_id) {
              return function() {
                if (self.forts[fort_id].infowindow) {
                  self.info_windows.fort.setContent(self.forts[fort_id].infowindow);
                  self.info_windows.fort.open(this.map, this);
                } else {
                  self.buildGymInfo(self.forts[fort_id].data);
                }
              };
            })(fort_id));
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
        message: "Trainer loaded: " + (self.settings.users[username].displayName ? self.settings.users[username].displayName : username),
        color: "blue"
      });
      var iconSet = { url: self.settings.users[username].icon.path };
      if ((self.settings.users[username].icon.width != undefined) && (self.settings.users[username].icon.height != undefined) &&
          (self.settings.users[username].icon.width > -1) && (self.settings.users[username].icon.height > -1)) {
        iconSet.scaledSize = new google.maps.Size(self.settings.users[username].icon.width, self.settings.users[username].icon.height);
      }
      self.user_data[username].marker = new google.maps.Marker({
        map: self.map,
        position: {
          lat: parseFloat(data.lat),
          lng: parseFloat(data.lng)
        },
        icon: iconSet,
        zIndex: 5,
        //label: username,
        clickable: true
      });
      var contentString = '<b>Trainer:</b> ' + username;
      self.user_data[username].infowindow = new google.maps.InfoWindow({
        content: contentString
      });
      google.maps.event.addListener(self.user_data[username].marker, 'click', (function(content, infowindow) {
        return function() {
          infowindow.setContent(content);
          infowindow.open(this.map, this);
        };
      })(contentString, self.user_data[username].infowindow));
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
          strokeColor: self.settings.users[username].colors.botPath,
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
  addPathMarker: function() {
    var self = mapView,
      i = Object.keys(self.customPaths).length;

    self.customPaths[i] = {};

    self.customPaths[i].marker = new google.maps.Marker({
      position: self.map.getCenter(),
      map: self.map,
      draggable: true,
      clickable: true,
      title: 'Path #' + i
    });

    var mapCenter = self.map.getCenter(),
      contentString = '<b>Path #{0}</b><br><b>Latitude:</b> {1}<br><b>Longitude:</b> {2}';

    self.customPaths[i].infowindow = new google.maps.InfoWindow({ content: contentString.format(i, mapCenter.lat(), mapCenter.lng()) });

    google.maps.event.addListener(self.customPaths[i].marker, 'click', (function(infowindow) {
      return function() { infowindow.open(this.map, this); };
    })(self.customPaths[i].infowindow));

    google.maps.event.addListener(self.customPaths[i].marker, 'drag', (function(content, infowindow) {
      return function() { infowindow.setContent(contentString.format(i, this.getPosition().lat(), this.getPosition().lng())); self.updatePathLine(); };
    })(contentString, self.customPaths[i].infowindow));

    google.maps.event.addListener(self.customPaths[i].marker, 'dragend', (function(content, infowindow) {
      return function() { infowindow.setContent(contentString.format(i, this.getPosition().lat(), this.getPosition().lng())); self.updatePathLine(); }
    })(contentString, self.customPaths[i].infowindow));

    $('#path_delete').removeClass('disabled');
    $('#paths_download').removeClass('disabled');
    $('#paths_clear').removeClass('disabled');

    self.updatePathLine();
  },
  deletePathMarker: function() {
    var self = mapView,
      i = Object.keys(self.customPaths).length;

    if (!i || !self.customPaths[i-1]) { return; } // if customPaths array is empty or previous path doesn't exist

    self.customPaths[i-1].marker.setMap(null);
    self.customPaths[i-1].infowindow.setMap(null);
    delete self.customPaths[i-1];

    if (!Object.keys(self.customPaths).length) {
      $('#path_delete').addClass('disabled');
      $('#paths_download').addClass('disabled');
      $('#paths_clear').addClass('disabled');
    }

    self.updatePathLine();
  },
  updatePathLine: function() {
    var self = mapView;

    if (!Object.keys(self.customPaths).length) { // if customPaths array is empty
      self.customPathsLine.setMap(null);
      self.customPathsLine = 0;
      return;
    }

    var ps = [];//, tpos;
    for (var p in self.customPaths) {
      //tpos = self.customPaths[p].marker.getPosition();
      //ps.push({ lat: tpos.lat(), lng: tpos.lng() });
      ps.push(self.customPaths[p].marker.getPosition());
    }

    if (!self.customPathsLine) {
      self.customPathsLine = new google.maps.Polyline({
        path: ps,
        geodesic: true,
        strokeColor: '#FF0000',
        strokeOpacity: 1.0,
        strokeWeight: 2
      });
    }

    self.customPathsLine.setOptions({path: ps});
    self.customPathsLine.setMap(self.map);
  },
  generatePathFile: function() {
    var self = mapView,
      i = Object.keys(self.customPaths).length;

    if (!i) { return; } // if customPaths array is empty

    var fileContent = '[';
    for (var p in self.customPaths) {
      fileContent += '\n\t{"location": "' + self.customPaths[p].marker.getPosition().lat() + ', ' + self.customPaths[p].marker.getPosition().lng() + '"}';
      if (p < (i - 1)) { fileContent += ','; }
    }
    fileContent += '\n]';

    var download = $('<a>');
    download.attr('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(fileContent));
    download.attr('download', 'path.json');
    download.css('display', 'none');
    $('body').append(download);
    download[0].click();
    download.remove();
  },
  clearPathMarkers: function() {
    var self = mapView;

    if (!Object.keys(self.customPaths).length) { return; } // if customPaths array is empty

    for (var p in self.customPaths) {
      self.customPaths[p].marker.setMap(null);
      self.customPaths[p].infowindow.setMap(null);
    }

    self.customPaths = {};

    $('#path_delete').addClass('disabled');
    $('#paths_download').addClass('disabled');
    $('#paths_clear').addClass('disabled');

    self.updatePathLine();
  },
  bindPathMenu: function() {
    var self = this;

    $('#path_add').click(self.addPathMarker);
    $('#path_delete').click(self.deletePathMarker);
    $('#paths_download').click(self.generatePathFile);
    $('#paths_clear').click(self.clearPathMarkers);
  }
};

if (!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) {
      return typeof args[number] != 'undefined' ? args[number] : match;
    });
  };
}
