class Maps {
    constructor() {
        this.element = undefined;
        this.pathcoords = {};
        this.forts = [];
        this.catchablePokemons = {};
        this.init();
    }

    init() {
        var mapStyleCookies = Cookies.get('mapStyle'),
            desiredStyle = mapStyleCookies || main.settings.defaultMapStyle || undefined;

        this.element = new google.maps.Map(document.getElementById('map'), {
            center: { lat: 50.0830986, lng: 6.7613762 },
            zoom: 8,
            mapTypeId: (desiredStyle && desiredStyle == 'satellite' ? 'satellite' : 'roadmap'),
            styles: ((desiredStyle && desiredStyle != 'satellite' && main.mapStyles[desiredStyle] && main.mapStyles[desiredStyle].style) ? main.mapStyles[desiredStyle].style : []),
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: true,
            fullscreenControlOptions: { position: google.maps.ControlPosition.TOP_LEFT }
        });

        var mapStylesDropdown = $('#mapStyles');
        if (main.mapStyles && Object.keys(main.mapStyles).length && mapStylesDropdown) {
            mapStylesDropdown.append('<li class="divider"></li>');
            for (var s in main.mapStyles) {
                if (main.mapStyles[s].name != undefined && main.mapStyles[s].style != undefined) {
                    mapStylesDropdown.append('<li><a data-style="' + s + '">' + main.mapStyles[s].name + '</a></li><li class="divider"></li>');
                }
            }
            mapStylesDropdown.find('li.divider:last-child').remove(); // Remove latest divider thingy
            mapStylesDropdown.find('li > a').click(this.changeMapStyle); // Add click handler
        }

        if (mapStyleCookies) { Cookies.set('mapStyle', mapStyleCookies, { expires: 365 }); } // Refresh cookies

        // Validate which user to prioritize in parsing location (this is for instances where multiple bots provide different data for the same location)
        for (var p in main.settings.users) { if (main.settings.users[p].prioritizeLocationData) { main.prioritize = p; break; } }
        if (!main.prioritize) { main.prioritize = Object.keys(main.settings.users)[0]; }
    }

    changeMapStyle(style) {
        var self = main.maps,
            style = $(this).data('style');

        if (!style) { return; }

        if (main.mapStyles[style] && main.mapStyles[style].style) {
            self.element.setOptions({
                mapTypeId: 'roadmap',
                styles: main.mapStyles[style].style
            });
        } else {
            self.element.setOptions({
                mapTypeId: (style == 'satellite' ? 'satellite' : 'roadmap'),
                styles: []
            });
        }

        Cookies.set('mapStyle', style, { expires: 365 });
    }

    setBotPathOptions(checked) {
        for (var user in main.settings.users) {
            var trainerPath = main.user_data[user].trainerPath;

            // Failsafe in case user data hasn't been fully loaded
            if (!trainerPath) { continue; }

            main.user_data[user].trainerPath.setOptions({
                strokeOpacity: (checked ? 1.0 : 0.0),
                zIndex: (checked ? 4 : 0)
            });
        }
    }

    addLocations() {
        var self = main.maps;
        for (var user in main.settings.users) {
            if (!self.pathcoords[user]) { self.pathcoords[user] = []; }
            loadJSON('location-' + user + '.json', user).then(function(data) {
                // data[0] contains the necessary data, data[1] contains the username
                self.processLocations(data[0], data[1]);
            });
        }
    }

    processLocations(data, username) {
        var self = this,
            coords = self.pathcoords[username][self.pathcoords[username].length - 1];

        // Create info_window which will be used to display PokeStop and Catchable Pokemon info if they don't exist
        if (!Object.keys(main.info_windows).length) {
            main.info_windows = {
                fort: {
                    element: new google.maps.InfoWindow(),
                    content: false, expiration: false
                },
                catchable: {
                    element: new google.maps.InfoWindow(),
                    content: false, expiration: false
                }
            };
            setInterval(self.refreshInfoWindows, 1000);
        }

        // Failsafe when cells array is not ready
        if (!data.cells) { return; }

        var allCatchablePokemons = [];

        for (var i = 0; i < data.cells.length; i++) {
            if (data.cells[i].forts) { self.processForts(data.cells[i].forts, username, data.lat, data.lng); }
            // Push all catchable_pokemons into a single array
            if (data.cells[i].catchable_pokemons) {
                for (var j = 0; j < data.cells[i].catchable_pokemons.length; j++) { allCatchablePokemons.push(data.cells[i].catchable_pokemons[j]); }
            }
        }

        self.processCatchablePokemons(allCatchablePokemons, username);

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

        if (main.user_data[username].hasOwnProperty('marker') === false) {
            main.buildTrainerList();
            main.addInventory();
            logger.log({
                message: "Trainer loaded: " + (main.settings.users[username].displayName || username),
                color: "blue"
            });
            notifier.notify({
                message: "Trainer loaded: " + (main.settings.users[username].displayName || username)
            });
            var iconSet = { url: main.settings.users[username].icon.path };
            if ((main.settings.users[username].icon.width != undefined) && (main.settings.users[username].icon.height != undefined) &&
                    (main.settings.users[username].icon.width > -1) && (main.settings.users[username].icon.height > -1)) {
                iconSet.scaledSize = new google.maps.Size(main.settings.users[username].icon.width, main.settings.users[username].icon.height);
            }
            main.user_data[username].marker = new google.maps.Marker({
                map: self.element,
                position: {
                    lat: parseFloat(data.lat),
                    lng: parseFloat(data.lng)
                },
                icon: iconSet,
                zIndex: 5 + (Object.keys(main.user_data).length - Object.keys(main.user_data).indexOf(username) - 1),
                clickable: true
            });
            var contentString = '<b>Trainer:</b> ' + (main.settings.users[username].displayName || username);
            main.user_data[username].infowindow = new google.maps.InfoWindow({
                content: contentString
            });
            google.maps.event.addListener(main.user_data[username].marker, 'click', (function(content, infowindow) {
                return function() {
                    infowindow.setContent(content);
                    infowindow.open(this.map, this);
                };
            })(contentString, main.user_data[username].infowindow));
        } else {
            main.user_data[username].marker.setPosition({
                lat: parseFloat(data.lat),
                lng: parseFloat(data.lng)
            });
            if (self.pathcoords[username].length === 2) {
                main.user_data[username].trainerPath = new google.maps.Polyline({
                    map: self.element,
                    path: self.pathcoords[username],
                    geodisc: true,
                    strokeColor: main.settings.users[username].colors.botPath,
                    strokeOpacity: 0.0,
                    strokeWeight: 2
                });
            } else {
                main.user_data[username].trainerPath.setPath(self.pathcoords[username]);
            }
        }
        self.setBotPathOptions(main.settings.botPath);

        var botCounts = Object.keys(main.settings.users).length,
            focusUser = main.settings.users[username].focus;

        if (botCounts === 1 && main.settings.userZoom) {
            self.element.setZoom(main.settings.zoom);
        }
        if (botCounts === 1 && main.settings.userFollow) {
            self.element.panTo({
                lat: parseFloat(data.lat),
                lng: parseFloat(data.lng)
            });
        }

        if (!main.hasFocused && focusUser && (botCounts > 1 || (botCounts === 1 && !main.settings.userZoom && !main.settings.userFollow))) {
            self.element.setZoom(main.settings.zoom);
            self.element.panTo({
                lat: parseFloat(data.lat),
                lng: parseFloat(data.lng)
            });
            main.hasFocused = true;
        }
    }

    processForts(data, username, lat, lng) {
        var self = this,
            jsChkTime = moment(),
            mScale;

        for (var i = 0; i < data.length; i++) {
            var id = data[i].id;

            if (self.forts[id]) {
                // Process only if the new data comes from the prioritized origin
                if (username != main.prioritize) { continue; }

                // Update existing fort data as necessary
                if (self.forts[id].data.type === 1) {
                    var oldLureInfo = self.forts[id].data.hasOwnProperty('lure_info'),
                        newLureInfo = data[i].hasOwnProperty('lure_info'),
                        isLured = false,
                        lureTimestamp = false;

                    // Validate lure effect
                    if (newLureInfo) {
                        lureTimestamp = data[i].lure_info.lure_expires_timestamp_ms;
                        isLured = (!jsChkTime.isSameOrAfter(lureTimestamp) ? true : false);
                    }

                    // Change PokeStop icon
                    mScale = (isLured ? 22.5 : 15);
                    self.forts[id].marker.setOptions({
                        icon: 'image/forts/Pstop' + (isLured ? 'Lured' : '') + '.png'
                    });

                    // Update info window message (this will always be updated regardless of whether the lure status was different or not)
                    var distance = (username == main.prioritize ?
                        parseFloat(self.haversine(lat, lng, self.forts[id].data.latitude, self.forts[id].data.longitude) * 1000).toFixed(0) : false);

                    self.forts[id].infowindow = '<b>ID:</b> ' + id + '<br><b>Type:</b> PokeStop' +
                        (distance ? '<br><b>Distance:</b> ' + distance + ' meter' + (distance !== 1 ? 's' : '') + ' from ' +
                            (main.settings.users[username].displayName || username) : '') +
                        (isLured ? '<br><br>Lure effect in this PokeStop will expire in {0}' : '');
                } else {
                    // Change Gym icon if necessary
                    var oldTeam = self.forts[id].data.owned_by_team || 0,
                        newTeam = data[i].owned_by_team || 0,
                        gymName = self.forts[id].data.gym_details.name;

                    if (newTeam !== oldTeam) {
                        mScale = (self.forts[id].data.owned_by_team ? 36 : 27);
                        self.forts[id].marker.setOptions({
                            icon: {
                                url: 'image/forts/' + main.teams[(self.forts[id].data.owned_by_team || 0)] + (self.forts[id].data.owned_by_team ? '_new' : '') + '.png',
                                scaledSize: new google.maps.Size(mScale, mScale)
                            }
                        });
                        if (main.settings.gymTeamLogs) {
                            logger.log({
                                message: (gymName ? 'Gym: ' + gymName : 'A faraway gym') +
                                    (newTeam != 0 ? ' is now owned by Team ' + main.teams[newTeam] : ' was taken over from Team ' + main.teams[oldTeam])
                            });

                            notifier.notify({
                                message: (gymName ? 'Gym: ' + gymName : 'A faraway gym') +
                                (newTeam != 0 ? ' is now owned by Team ' + main.teams[newTeam] : ' was taken over from Team ' + main.teams[oldTeam])
                            });

                        }
                    }
                }

                // Now update existing data with the new one
                self.forts[id].data = data[i];
            } else {
                // Create the fort if it didn't exist
                self.forts[id] = { data: data[i] };

                if (self.forts[id].data.type === 1) {
                    var isLured = false,
                        lureTimestamp = false;

                    if (self.forts[id].data.hasOwnProperty('lure_info')) {
                        lureTimestamp = self.forts[id].data.lure_info.lure_expires_timestamp_ms;
                        isLured = (!jsChkTime.isSameOrAfter(lureTimestamp) ? true : false);
                    }

                    mScale = (isLured ? 22.5 : 15);
                    self.forts[id].marker = new google.maps.Marker({
                        map: self.element,
                        position: {
                            lat: parseFloat(self.forts[id].data.latitude),
                            lng: parseFloat(self.forts[id].data.longitude)
                        },
                        zIndex: 1,
                        icon: 'image/forts/Pstop' + (isLured ? 'Lured' : '') + '.png'
                    });

                    var distance = (username == main.prioritize ?
                        parseFloat(self.haversine(lat, lng, self.forts[id].data.latitude, self.forts[id].data.longitude) * 1000).toFixed(0) : false);

                    self.forts[id].infowindow = '<b>ID:</b> ' + id + '<br><b>Type:</b> PokeStop' +
                        (distance ? '<br><b>Distance:</b> ' + distance + ' meter' + (distance !== 1 ? 's' : '') + ' from ' +
                            (main.settings.users[username].displayName || username) : '') +
                        (isLured ? '<br><br>Lure effect in this PokeStop will expire in {0}' : '');
                } else {
                    mScale = (self.forts[id].data.owned_by_team ? 36 : 27);
                    self.forts[id].marker = new google.maps.Marker({
                        map: self.element,
                        position: {
                            lat: parseFloat(self.forts[id].data.latitude),
                            lng: parseFloat(self.forts[id].data.longitude)
                        },
                        zIndex: 2,
                        icon: {
                            url: 'image/forts/' + main.teams[(self.forts[id].data.owned_by_team || 0)] + (self.forts[id].data.owned_by_team ? '_new' : '') + '.png',
                            scaledSize: new google.maps.Size(mScale, mScale)
                        }
                    });
                }

                // Only pass over the fort ID to the listener so that when the data changes we won't have to re-create the listener
                google.maps.event.addListener(self.forts[id].marker, 'click', (function(id) {
                    return function() {
                        if (self.forts[id].infowindow) {
                            var content = self.forts[id].infowindow,
                                expiration = (self.forts[id].data.lure_info ? self.forts[id].data.lure_info.lure_expires_timestamp_ms : 0),
                                diff = (expiration ? moment(expiration).diff(moment(), 's') : false);
                            main.info_windows.fort.id = id;
                            main.info_windows.fort.element.setContent((diff !== false ? content.format((diff >= 0 ? diff : 0) + ' second' + (diff != 1 ? 's' : '')) : content));
                            main.info_windows.fort.element.open(this.map, this);
                        } else {
                            main.buildGymInfo(self.forts[id].data);
                        }
                    };
                })(id));
            }
        }
    }

    processCatchablePokemons(data, username) {
        var self = this,
            jsChkTime = moment();

        // Create object for each username
        if (!self.catchablePokemons[username]) { self.catchablePokemons[username] = {}; }

        if (Object.keys(self.catchablePokemons[username]).length) {
            for (var encounter_id in self.catchablePokemons[username]) {
                if (moment(self.catchablePokemons[username][encounter_id].data.expiration_timestamp_ms).isSameOrBefore(jsChkTime) || !data.length) {
                    logger.log({
                        message: "[" + (main.settings.users[username].displayName || username) + "] " +
                            Pokemon.getPokemonById(self.catchablePokemons[username][encounter_id].data.pokemon_id).Name +
                            " has been caught or fled"
                    });
                    notifier.notify({
                        message: "[" + (main.settings.users[username].displayName || username) + "] " +
                        Pokemon.getPokemonById(self.catchablePokemons[username][encounter_id].data.pokemon_id).Name +
                        " has been caught or fled"
                    });
                    self.catchablePokemons[username][encounter_id].marker.setMap(null);
                    delete self.catchablePokemons[username][encounter_id];
                }
            }
        }

        for (var i = 0; i < data.length; i++) {
            var encounter_id = data[i].encounter_id,
                catchable = self.catchablePokemons[username][encounter_id];

            // Skip if it already exists or it has expired
            if (catchable || moment(data[i].expiration_timestamp_ms).isSameOrBefore(jsChkTime)) { continue; }

            // Define, assuming it doesn't exist
            catchable = { data: data[i] };

            catchable.marker = new google.maps.Marker({
                map: self.element,
                position: {
                    lat: parseFloat(data[i].latitude),
                    lng: parseFloat(data[i].longitude)
                },
                icon: self.getGoogleSprite(data[i].pokemon_id - 1, main.pokemon_sprite, 50),
                /*icon: {
                    url: 'image/pokemon/' + Pokemon.getImageById(data[i].pokemon_id),
                    scaledSize: new google.maps.Size(45, 45)
                },*/
                zIndex: 3,
                clickable: true
            });

            catchable.infowindow = '<b>Spawn Point ID:</b> ' +
                data[i].spawn_point_id +
                '<br><b>Encounter ID:</b> ' +
                data[i].encounter_id +
                '<br><b>Name:</b> ' +
                Pokemon.getPokemonById(data[i].pokemon_id).Name +
                '<br><b>Trainer:</b> ' +
                (main.settings.users[username].displayName || username) +
                '<br><br>This Pokemon will expire in {0}';

            google.maps.event.addListener(catchable.marker, 'click', (function(username, encounter_id) {
                return function() {
                    var content = self.catchablePokemons[username][encounter_id].infowindow,
                        expiration = self.catchablePokemons[username][encounter_id].data.expiration_timestamp_ms,
                        diff = moment(expiration).diff(moment(), 's');
                    main.info_windows.catchable.id = encounter_id;
                    main.info_windows.catchable.username = username;
                    main.info_windows.catchable.element.setContent(content.format(diff + ' second' + (diff != 1 ? 's' : '')));
                    main.info_windows.catchable.element.open(this.map, this);
                };
            })(username, encounter_id));

            self.catchablePokemons[username][encounter_id] = catchable;

            logger.log({
                message: "[" + (main.settings.users[username].displayName || username) + "] " + Pokemon.getPokemonById(data[i].pokemon_id).Name + " appeared",
                color: "green"
            });

            notifier.notify({
                message: Pokemon.getPokemonById(data[i].pokemon_id).Name + ' appeared!'
            });
        }
    }

    findBot(user_index) {
        var self = this,
            coords = self.pathcoords[user_index][self.pathcoords[user_index].length - 1];

        self.element.setZoom(main.settings.zoom);
        self.element.panTo({
            lat: parseFloat(coords.lat),
            lng: parseFloat(coords.lng)
        });
    }

    refreshInfoWindows() {
        var self = main.maps;

        if (!Object.keys(main.info_windows).length) { return; }

        for (var i in main.info_windows) {
            var id = main.info_windows[i].id,
                content, expiration, diff;

            if (!main.info_windows[i].element.getMap() || !id) { continue; }

            if (i == 'fort') {
                content = self.forts[id].infowindow;
                expiration = (self.forts[id].data.lure_info ? self.forts[id].data.lure_info.lure_expires_timestamp_ms : 0);
            } else if (i == 'catchable') {
                content = self.catchablePokemons[main.info_windows[i].username][id].infowindow;
                expiration = self.catchablePokemons[main.info_windows[i].username][id].data.expiration_timestamp_ms;
            }

            diff = (expiration ? moment(expiration).diff(moment(), 's') : false);
            
            main.info_windows[i].element.setContent((diff !== false ? content.format((diff >= 0 ? diff : 0) + ' second' + (diff != 1 ? 's' : '')) : content));
        }
    }

    /** Haversine formula, courtesy of http://rosettacode.org/wiki/Haversine_formula#JavaScript **/
    haversine() {
        var radians = Array.prototype.map.call(arguments, function(deg) { return deg/180.0 * Math.PI; }),
            lat1 = radians[0], lng1 = radians[1], lat2 = radians[2], lng2 = radians[3],
            R = 6372.8,
            dLat = lat2 - lat1,
            dLon = lng2 - lng1,
            a = Math.sin(dLat / 2) * Math.sin(dLat /2) + Math.sin(dLon / 2) * Math.sin(dLon /2) * Math.cos(lat1) * Math.cos(lat2),
            c = 2 * Math.asin(Math.sqrt(a));
       return R * c;
    }


    /** Functions below were taken from PokemonGo-Map **/
    getGoogleSprite(index, sprite, display_height) {
        display_height = Math.max(display_height, 3);
        var scale = display_height / sprite.icon_height;
        // Crop icon just a tiny bit to avoid bleedover from neighbor
        var scaled_icon_size = new google.maps.Size(scale * sprite.icon_width - 1, scale * sprite.icon_height - 1);
        var scaled_icon_offset = new google.maps.Point(
            (index % sprite.columns) * sprite.icon_width * scale + 0.5,
            Math.floor(index / sprite.columns) * sprite.icon_height * scale + 0.5);
        var scaled_sprite_size = new google.maps.Size(scale * sprite.sprite_width, scale * sprite.sprite_height);
        var scaled_icon_center_offset = new google.maps.Point(scale * sprite.icon_width / 2, scale * sprite.icon_height / 2);

        return {
            url: sprite.filename,
            size: scaled_icon_size,
            scaledSize: scaled_sprite_size,
            origin: scaled_icon_offset,
            anchor: scaled_icon_center_offset
        };
    }
}