'use strict';

var logger = new Logger("#logs-panel .card-content #logs");
var notifier = new Notifications();

$(document).ready(function() {
    main.init();
});

function loadJSON(path, extra) {
    return new Promise(function(fulfill, reject) {
        $.get({
            url: path + "?" + Date.now()
        }).done(function(data) {
            if (data !== undefined) {
                if (extra != undefined) {
                    fulfill([data, extra]); // pass extra data if necessary - to solve out-of-sync username info
                } else {
                    fulfill(data);
                }
            } else {
                reject(data);
            }
        }).fail(function(jqXHR, textContent, thrownError) {
            reject(thrownError);
        });
    });
}

var main = {
    user_index: 0,
    emptyDex: [],
    info_windows: [],
    numTrainers: [
        177,
        109
    ],
    requiredExpToLevelUp: { 1: 1000, 2: 2000, 3: 3000, 4: 4000, 5: 5000, 6: 6000, 7: 7000, 8: 8000, 9: 9000, 10: 10000,
        11: 10000, 12: 10000, 13: 10000, 14: 15000, 15: 20000, 16: 20000, 17: 20000, 18: 25000, 19: 25000, 20: 50000,
        21: 75000, 22: 100000, 23: 125000, 24: 150000, 25: 190000, 26: 200000, 27: 250000, 28: 300000, 29: 350000, 30: 500000,
        31: 500000, 32: 750000, 33: 1000000, 34: 1250000, 35: 1500000, 36: 2000000, 37: 2500000, 38: 3000000, 39: 5000000, 40: 5000000
    },
    minimumGymPointsPerLevel: {
        1: 0,
        2: 2000,
        3: 4000,
        4: 8000,
        5: 12000,
        6: 16000,
        7: 20000,
        8: 30000,
        9: 40000,
        10: 50000
    },
    maps: undefined,
    mapStyles: {
        "nolabels": { name: "No Labels", style: [{featureType:"poi",elementType:"labels",stylers:[{visibility:"off"}]},{featureType:"all",elementType:"labels.icon",stylers:[{visibility:"off"}]}] },
        "light2": { name: "Light2", style: [{elementType:"geometry",stylers:[{hue:"#ff4400"},{saturation:-68},{lightness:-4},{gamma:.72}]},{featureType:"road",elementType:"labels.icon"},{featureType:"landscape.man_made",elementType:"geometry",stylers:[{hue:"#0077ff"},{gamma:3.1}]},{featureType:"water",stylers:[{hue:"#00ccff"},{gamma:.44},{saturation:-33}]},{featureType:"poi.park",stylers:[{hue:"#44ff00"},{saturation:-23}]},{featureType:"water",elementType:"labels.text.fill",stylers:[{hue:"#007fff"},{gamma:.77},{saturation:65},{lightness:99}]},{featureType:"water",elementType:"labels.text.stroke",stylers:[{gamma:.11},{weight:5.6},{saturation:99},{hue:"#0091ff"},{lightness:-86}]},{featureType:"transit.line",elementType:"geometry",stylers:[{lightness:-48},{hue:"#ff5e00"},{gamma:1.2},{saturation:-23}]},{featureType:"transit",elementType:"labels.text.stroke",stylers:[{saturation:-64},{hue:"#ff9100"},{lightness:16},{gamma:.47},{weight:2.7}]}] },
        "dark": { name: "Dark", style: [{featureType:"all",elementType:"labels.text.fill",stylers:[{saturation:36},{color:"#b39964"},{lightness:40}]},{featureType:"all",elementType:"labels.text.stroke",stylers:[{visibility:"on"},{color:"#000000"},{lightness:16}]},{featureType:"all",elementType:"labels.icon",stylers:[{visibility:"off"}]},{featureType:"administrative",elementType:"geometry.fill",stylers:[{color:"#000000"},{lightness:20}]},{featureType:"administrative",elementType:"geometry.stroke",stylers:[{color:"#000000"},{lightness:17},{weight:1.2}]},{featureType:"landscape",elementType:"geometry",stylers:[{color:"#000000"},{lightness:20}]},{featureType:"poi",elementType:"geometry",stylers:[{color:"#000000"},{lightness:21}]},{featureType:"road.highway",elementType:"geometry.fill",stylers:[{color:"#000000"},{lightness:17}]},{featureType:"road.highway",elementType:"geometry.stroke",stylers:[{color:"#000000"},{lightness:29},{weight:.2}]},{featureType:"road.arterial",elementType:"geometry",stylers:[{color:"#000000"},{lightness:18}]},{featureType:"road.local",elementType:"geometry",stylers:[{color:"#181818"},{lightness:16}]},{featureType:"transit",elementType:"geometry",stylers:[{color:"#000000"},{lightness:19}]},{featureType:"water",elementType:"geometry",stylers:[{lightness:17},{color:"#525252"}]}] },
        "pokemongo": { name: "Pokemon Go", style: [{featureType:"landscape.man_made",elementType:"geometry.fill",stylers:[{color:"#a1f199"}]},{featureType:"landscape.natural.landcover",elementType:"geometry.fill",stylers:[{color:"#37bda2"}]},{featureType:"landscape.natural.terrain",elementType:"geometry.fill",stylers:[{color:"#37bda2"}]},{featureType:"poi.attraction",elementType:"geometry.fill",stylers:[{visibility:"on"}]},{featureType:"poi.business",elementType:"geometry.fill",stylers:[{color:"#e4dfd9"}]},{featureType:"poi.business",elementType:"labels.icon",stylers:[{visibility:"off"}]},{featureType:"poi.park",elementType:"geometry.fill",stylers:[{color:"#37bda2"}]},{featureType:"road",elementType:"geometry.fill",stylers:[{color:"#84b09e"}]},{featureType:"road",elementType:"geometry.stroke",stylers:[{color:"#fafeb8"},{weight:"1.25"}]},{featureType:"road.highway",elementType:"labels.icon",stylers:[{visibility:"off"}]},{featureType:"water",elementType:"geometry.fill",stylers:[{color:"#5ddad6"}]}] },
        "light2_nolabels": { name: "Light2 (No Labels)", style: [{elementType:"geometry",stylers:[{hue:"#ff4400"},{saturation:-68},{lightness:-4},{gamma:.72}]},{featureType:"road",elementType:"labels.icon"},{featureType:"landscape.man_made",elementType:"geometry",stylers:[{hue:"#0077ff"},{gamma:3.1}]},{featureType:"water",stylers:[{hue:"#00ccff"},{gamma:.44},{saturation:-33}]},{featureType:"poi.park",stylers:[{hue:"#44ff00"},{saturation:-23}]},{featureType:"water",elementType:"labels.text.fill",stylers:[{hue:"#007fff"},{gamma:.77},{saturation:65},{lightness:99}]},{featureType:"water",elementType:"labels.text.stroke",stylers:[{gamma:.11},{weight:5.6},{saturation:99},{hue:"#0091ff"},{lightness:-86}]},{featureType:"transit.line",elementType:"geometry",stylers:[{lightness:-48},{hue:"#ff5e00"},{gamma:1.2},{saturation:-23}]},{featureType:"transit",elementType:"labels.text.stroke",stylers:[{saturation:-64},{hue:"#ff9100"},{lightness:16},{gamma:.47},{weight:2.7}]},{featureType:"all",elementType:"labels.text.stroke",stylers:[{visibility:"off"}]},{featureType:"all",elementType:"labels.text.fill",stylers:[{visibility:"off"}]},{featureType:"all",elementType:"labels.icon",stylers:[{visibility:"off"}]}] },
        "dark_nolabels": { name: "Dark (No Labels)", style: [{featureType:"all",elementType:"labels.text.fill",stylers:[{visibility:"off"}]},{featureType:"all",elementType:"labels.text.stroke",stylers:[{visibility:"off"}]},{featureType:"all",elementType:"labels.icon",stylers:[{visibility:"off"}]},{featureType:"administrative",elementType:"geometry.fill",stylers:[{color:"#000000"},{lightness:20}]},{featureType:"administrative",elementType:"geometry.stroke",stylers:[{color:"#000000"},{lightness:17},{weight:1.2}]},{featureType:"landscape",elementType:"geometry",stylers:[{color:"#000000"},{lightness:20}]},{featureType:"poi",elementType:"geometry",stylers:[{color:"#000000"},{lightness:21}]},{featureType:"road.highway",elementType:"geometry.fill",stylers:[{color:"#000000"},{lightness:17}]},{featureType:"road.highway",elementType:"geometry.stroke",stylers:[{color:"#000000"},{lightness:29},{weight:.2}]},{featureType:"road.arterial",elementType:"geometry",stylers:[{color:"#000000"},{lightness:18}]},{featureType:"road.local",elementType:"geometry",stylers:[{color:"#181818"},{lightness:16}]},{featureType:"transit",elementType:"geometry",stylers:[{color:"#000000"},{lightness:19}]},{featureType:"water",elementType:"geometry",stylers:[{lightness:17},{color:"#525252"}]}] },
        "pokemongo_nolabels": { name: "Pokemon Go (No Labels)", style: [{featureType:"landscape.man_made",elementType:"geometry.fill",stylers:[{color:"#a1f199"}]},{featureType:"landscape.natural.landcover",elementType:"geometry.fill",stylers:[{color:"#37bda2"}]},{featureType:"landscape.natural.terrain",elementType:"geometry.fill",stylers:[{color:"#37bda2"}]},{featureType:"poi.attraction",elementType:"geometry.fill",stylers:[{visibility:"on"}]},{featureType:"poi.business",elementType:"geometry.fill",stylers:[{color:"#e4dfd9"}]},{featureType:"poi.business",elementType:"labels.icon",stylers:[{visibility:"off"}]},{featureType:"poi.park",elementType:"geometry.fill",stylers:[{color:"#37bda2"}]},{featureType:"road",elementType:"geometry.fill",stylers:[{color:"#84b09e"}]},{featureType:"road",elementType:"geometry.stroke",stylers:[{color:"#fafeb8"},{weight:"1.25"}]},{featureType:"road.highway",elementType:"labels.icon",stylers:[{visibility:"off"}]},{featureType:"water",elementType:"geometry.fill",stylers:[{color:"#5ddad6"}]},{featureType:"all",elementType:"labels.text.stroke",stylers:[{visibility:"off"}]},{featureType:"all",elementType:"labels.text.fill",stylers:[{visibility:"off"}]},{featureType:"all",elementType:"labels.icon",stylers:[{visibility:"off"}]}] },
        // https://github.com/OpenPoGo/OpenPoGoWeb/issues/122
        "chrischi-": { name: "Chrischi-'s Pokemon Go (No Labels)", style: [{featureType:"road",elementType:"geometry.fill",stylers:[{color:"#4f9f92"},{visibility:"on"}]},{featureType:"water",elementType:"geometry.stroke",stylers:[{color:"#feff95"},{visibility:"on"},{weight:1.2}]},{featureType:"landscape",elementType:"geometry",stylers:[{color:"#adff9d"},{visibility:"on"}]},{featureType:"water",stylers:[{visibility:"on"},{color:"#147dd9"}]},{featureType:"poi",elementType:"geometry.fill",stylers:[{color:"#d3ffcc"}]},{elementType:"labels",stylers:[{visibility:"off"}]}] },
    },
    teams: [
        'TeamLess',
        'Mystic',
        'Valor',
        'Instinct'
    ],
    pokemon_sprite: {
        columns: 7,
        icon_width: 65,
        icon_height: 65,
        sprite_width: 455,
        sprite_height: 1430,
        filename: 'image/pokemon_sprite_highres.png'
    },
    trainerSex: [
        'm',
        'f'
    ],
    hasFocused: false,
    prioritize: undefined,
    playerInfo: {},
    user_data: {},
    user_xps: {},
    settings: {},
    paths: undefined,
    init: function() {
        var self = this;
        self.settings = $.extend(true, self.settings, userInfo);
        self.bindUi();

        loadJSON('data/pokemondata.json').then(Pokemon.setPokemonData);

        loadJSON('data/pokemoncandy.json').then(Pokemon.setPokemonCandyData);

        for (var user in self.settings.users) {
            self.user_data[user] = new Player(user);
        }

        $.getScript('https://maps.googleapis.com/maps/api/js?key={0}&libraries=drawing'.format(self.settings.gMapsAPIKey), function() {
            self.maps = new Maps();
            self.paths = new Paths();
            
            self.maps.addLocations();
            //self.maps.addCatchable();
            setInterval(self.maps.addLocations, 1000);
            //setInterval(self.maps.addCatchable, 1000);
            setInterval(self.addInventory, 5000);
        });
    },
    bindUi: function() {
        var self = this;
        $('#switchPan').prop('checked', self.settings.userFollow);
        $('#switchZoom').prop('checked', self.settings.userZoom);
        $('#strokeOn').prop('checked', self.settings.botPath);
        $('#switchNotifications').prop('checked', self.settings.sendNotifications);

        $('#switchPan').change(function() {
            self.settings.userFollow = this.checked;
        });

        $('#switchZoom').change(function() {
            self.settings.userZoom = this.checked;
        });

        $('#strokeOn').change(function() {
            self.settings.botPath = this.checked;
            self.maps.setBotPathOptions(this.checked);
        });

        $('#switchNotifications').change(function() {
            self.settings.sendNotifications = this.checked;
            notifier.toggle(this.checked);
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
            self.maps.findBot($(this).closest('ul').data('user-id'));
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
    addInventory: function() {
        var self = main;
        for (var user in self.settings.users) {
            loadJSON('inventory-' + user + '.json', user).then(function(data) {
                // data[0] contains the necessary data, data[1] contains the username
                self.user_data[data[1]].updateInventory(data[0]);

                if (!(data[1] in self.user_xps)) {
                    self.user_xps[data[1]] = [];
                }

                var t = (new Date()).getTime()/1000.0;
                var xp = self.user_data[data[1]].getExperience();
                self.user_xps[data[1]].push({'t': t, 'xp': xp});
                while (self.user_xps[data[1]].length && t-self.user_xps[data[1]][0].t > 600) {
                    self.user_xps[data[1]].shift();
                }
            });
        }
    },
    buildMenu: function(user_id, menu) {
        var self = this,
            out = '';
        $("#submenu").show();
        switch (menu) {
            case 1:
                var player = self.user_data[user_id],
                    current_user_stats = self.user_data[user_id].stats;
                $('#subtitle').html('Trainer Info');
                $('#sortButtons').html('');

                var xps = '';
                if ((user_id in self.user_xps) && self.user_xps[user_id].length) {
                    var xp_first = self.user_xps[user_id][0],
                        xp_last = self.user_xps[user_id][self.user_xps[user_id].length-1],
                        d_xp = xp_last.xp - xp_first.xp,
                        d_t = xp_last.t - xp_first.t;
                    xps = (Math.round(100 * d_xp / d_t) / 100);
                }

                out += '<div class="row"><div class="col s12"><h5>' +
                    (self.settings.users[user_id].displayName || user_id) +
                    '</h5><br>Level: ' +
                    player.getLevel() +
                    '<br><div class="progress bot-exp-bar" style="background-color: ' +
                    self.settings.users[user_id].colors.secondary +
                    '"><div class="determinate" style="width: '+
                    parseFloat((player.getExperience() - player.getTotalPreviousExps()) / self.requiredExpToLevelUp[player.getLevel()] * 100).toFixed(2) +
                    '%; background-color: ' +
                    self.settings.users[user_id].colors.primary +
                    '"></div><span class="progress-text">' +
                    parseFloat((player.getExperience() - player.getTotalPreviousExps()) / self.requiredExpToLevelUp[player.getLevel()] * 100).toFixed(2) +
                    '%</span></div>Accumulated Experience: ' +
                    player.getExperience() +
                    '<br>Experience to Level ' +
                    (parseInt(player.getLevel(), 10) + 1) +
                    ': ' +
                    (player.getExperience() - player.getTotalPreviousExps()) +
                    ' / ' +
                    self.requiredExpToLevelUp[player.getLevel()] +
                    '<br>XP/s: ' +
                    xps + ' (earned ' + d_xp + ' XPs in the last ' + Math.round(d_t) + 's)' +
                    '<br>Remaining Experience: ' +
                    (self.requiredExpToLevelUp[player.getLevel()] - (player.getExperience() - player.getTotalPreviousExps())) +
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
                sortButtons += '<div class="chip"><a href="#" data-sort="hp">HP</a></div>';
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
                '<div class="collapsible-header bot-name">' + (users[user].displayName || user) + '</div>' +
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
    errorFunc: function(xhr) {
        console.error(xhr);
    },
    sortAndShowBagPokemon: function(sortOn, user_id) {
        var self = this,
            out = '',
            user = self.user_data[user_id],
            user_id = user_id || 0;

        var sortedPokemon = user.getSortedPokemon(sortOn);

        out = '<div class="items"><div class="row">';

        var jsChkTime = moment().subtract(1, 'd');
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
                pkmnCandy = user.getCandy(pkmnNum),
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
                '<span class="pkmn-info-iv">' +
                    '<b>IV:</b> ' +
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
                    (pkmnCandy < 0 ? 'Could not retrieve candy data...' : pkmnCandy + ' Candies') + '">' +
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
                var totalToWalk = incubators[i].target_km_walked - incubators[i].start_km_walked,
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
        var sortedPokedex = user.pokedex.getAllEntriesSorted(sortOn, user);
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
                    '<span class="tooltipped" data-position="right" data-delay="25" data-tooltip="' + user.getCandy(entry.id) + ' Candies">' +
                        '<b>' + user.getCandy(entry.id) + '</b>' +
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
        var self = this,
            level = 1;
        for (var t_level in self.minimumGymPointsPerLevel) {
            if (self.minimumGymPointsPerLevel[t_level] < gymPoints) {
                level = t_level;
            } else {
                break;
            }
        }
        return level;
    },
    buildGymInfo: function(fort) {
        var self = this;

        if (!fort || !Object.keys(fort).length) { return; } // if fort is not defined or if it's an empty object or if gym_details is not present

        $('#submenu').show();
        $('#submenu').data('gym-info', '1');
        $('#sortButtons').html('');

        var out = '',
            gym_details = fort.gym_details,
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
    buildNearbyPokemonsList: function() {
        var self = this,
            users = self.settings.users;
        var out = '<div class="col s12"><ul id="nearby-pokemons-list" class="collapsible" data-collapsible="accordion">' +
            '<li><div class="collapsible-header">' +
            '<i class="material-icons">my_location</i>Nearby</div>' +
            '<div class="collapsible-body" style="padding: 0; border: 0">' +
            '<ul class="collapsible bots-list-collapsible" data-collapsible="accordion" style="border: 0; margin: 0; box-shadow: none">';

        var i = 0;
        for (var user in users) {
            // Rewrote every line to be using string join instead of that '\' thingy for consistency sake (I mean, everything else does it that way, so..)
            out += '<li class="bot-user">' +
                '<div class="collapsible-header bot-name">' + (users[user].displayName || user) + '</div>' +
                '<div class="collapsible-body" style="padding: 1em 0">' +
                    '<div class="row" style="margin: 0">' +
                        '<div class="col s4"><img src="image/pokemon/001.png"></div>' +
                        '<div class="col s4"><img src="image/pokemon/002.png"></div>' +
                        '<div class="col s4"><img src="image/pokemon/003.png"></div>' +
                        '<div class="col s4"><img src="image/pokemon/004.png"></div>' +
                        '<div class="col s4"><img src="image/pokemon/005.png"></div>' +
                        '<div class="col s4"><img src="image/pokemon/006.png"></div>' +
                    '</div>' +
                '</div>' +
            '</li>' +
            '<style>' +
                '.bot-btn-' + i + ' { background-color: ' + users[user].colors.primary + '; }' +
                '.bot-btn-' + i + ':hover { background-color: ' + users[user].colors.secondary + '; }' +
            '</style>';
            i += 1;
        }
        out += "</ul></div></li></ul></div>";
        $('#nearby_pokemons').html(out);
        $('.collapsible').collapsible();
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
