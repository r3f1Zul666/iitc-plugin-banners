// ==UserScript==
// @id             iitc-plugin-banners@r3f1zul666
// @name           IITC plugin: Banners
// @category       Info
// @version        0.1.7
// @namespace      https://github.com/r3f1zul666
// @updateURL      https://github.com/r3f1zul666/iitc-plugin-banners/raw/master/iitc-plugin-banners.meta.js
// @downloadURL    https://github.com/r3f1zul666/iitc-plugin-banners/raw/master/iitc-plugin-banners.user.js
// @description    Discover mission banners.
// @match          https://intel.ingress.com/*
// @grant          none
// ==/UserScript==

function wrapper(plugin_info) {
// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};

// PLUGIN START ////////////////////////////////////////////////////////

var timeToRemaining = function(t) {
    var minutes = Math.floor(t/60)%60;
    var hours = Math.floor(t/3600)%24;
    var days = Math.floor(t/86400);
    var data = [];
    if(days) data.push(days + "d");
    if(hours) data.push(hours + "h");
    if(minutes || data.length === 0) data.push(minutes + "m");
    return data.join(" ");
};

Repository = function(base) {
    this.name = name;
    this.base = base;
    this.providers_url = "%banner%.json";

    this.root = function(callback) {
        var self = this;
        $.ajax({
            dataType: "json",
            url: this.base + "/banners.json?t=" + new Date().getTime(),
            success: function(data) {
                if(data.hasOwnProperty("providers-url")) {
                    self.providers_url = data["providers-url"];
                }
                callback(data);
            }
        });
    };

    this.check = function(data, sha256) {
        // TODO: check integrity of the data
        return true;
    };

    this.fetch = function(provider, sha256, callback) {
        var self = this;
        var url = this.base + this.providers_url.replace("%banner%", provider).replace("%hash%", sha256);

        $.ajax({
            dataType: "json",
            url: url,
            success: function(data) {
                if(self.check(data, sha256)) {
                    callback(data);
                }
            },
            error: function(jqXHR, textStatus, e) {
                console.log(e);
            }
        });
    };

    return this;
};

window.plugin.banners = {
    load: function(repository, callback) {
        $.ajax({
          dataType: "json",
          url: repository + "/banners.json",
          success: function(data) {
            callback(data);
          }
        });
    },

    showProviders: function(providers) {
        var self = this;
        var container = document.createElement('div');

        Object.keys(providers).sort().forEach(function(provider) {
            if(providers.hasOwnProperty(provider)) {
                var metadata = providers[provider];

                var div = container.appendChild(document.createElement('div'));
                div.className = 'plugin-banner-provider';

                var name = div.appendChild(document.createElement('a'));
                name.textContent = metadata.name;
                (function(provider, metadata){
                    name.addEventListener('click', function(evt) {
                        self.repository.fetch(provider, metadata.sha256, function(data){
                            self.show(data);
                        });
                        // prevent browser from following link
                        evt.preventDefault();
                        return false;
                    }, false);
                })(provider, metadata);

                var length = div.appendChild(document.createElement('span'));
                length.textContent = " (" + metadata.length + ")";
            }
        });

        dialog({
            id: 'plugin-banner-provider-id',
            title: "Providers",
            height: 'auto',
            html: container,
            width: '300px',
            closeCallback: function() {
            },
            focus: function() {
            }
        }).dialog('option', 'buttons', {
            'OK': function() { $(this).dialog('close'); },
        });
    },

    showBanners: function(banners) {
        var self = this;
        var container = document.createElement('div');

        Object.keys(banners).sort().forEach(function(banner) {
            if(banners.hasOwnProperty(banner)) {
                var metadata = banners[banner];

                var div = container.appendChild(document.createElement('div'));
                div.className = 'plugin-banner-banner';

                var name = div.appendChild(document.createElement('a'));
                name.textContent = metadata.name;
                (function(banner, metadata){
                    name.addEventListener('click', function(evt) {
                        self.repository.fetch(banner, metadata.sha256, function(data){
                            self.displayBanner(metadata.name, data);
                        });
                        // prevent browser from following link
                        evt.preventDefault();
                        return false;
                    }, false);
                })(banner, metadata);

                var length = div.appendChild(document.createElement('span'));
                length.textContent = " (" + metadata.length + ")";
            }
        });

        dialog({
            id: 'plugin-banner-banners',
            title: "Providers",
            height: 'auto',
            html: container,
            width: '300px',
            closeCallback: function() {
            },
            focus: function() {
            }
        }).dialog('option', 'buttons', {
            'OK': function() { $(this).dialog('close'); },
        });
    },

    show: function(data) {
        if(data.hasOwnProperty("providers")) {
            this.showProviders(data.providers);
        }
        else if(data.hasOwnProperty("banners")) {
            this.showBanners(data["banners"]);
        }
        else {
            // oops
        }
    },

    format: function(banner) {
        var container = document.createElement('div');
        var sumMedianCompletionTimeMs = 0;
        var img;
        var table = container.appendChild(document.createElement('table'));
        table.className = 'plugin-banner-summary';
        
        for(var i = 0; i < banner.missions.length; i += 6) {
            var row = table.appendChild(document.createElement('tr'));
            for(var j = 0, k = i; j < 6 && k < banner.missions.length; j++, k++) {
                var mission = banner.missions[banner.missions.length - k - 1];
                var cell = row.appendChild(document.createElement('td'));
                img = cell.appendChild(document.createElement('img'));
                img.src = mission.image;
                (function(guid){
                    img.addEventListener('click', function(ev) {
                      window.plugin.missions.openMission(guid);
                    }, false);
                })(mission.guid);
                sumMedianCompletionTimeMs += mission.medianCompletionTimeMs;
            }
        }
        var authors = container.appendChild(document.createElement('span'));
        for(var authorNickname in banner.authors) {
            if(authors.childNodes.length) {
                authors.appendChild(document.createTextNode(', '));
            }
            if(banner.authors.hasOwnProperty(authorNickname)) {
                var author = authors.appendChild(document.createElement('span'));
                author.className = 'nickname ' + (banner.authors[authorNickname] === 'Resistance' ? 'res' : 'enl');
                author.textContent = authorNickname;
            }
        }
        authors.appendChild(document.createTextNode('.'));
        container.appendChild(document.createElement('br'));

        var infoTime = container.appendChild(document.createElement('span'));
        infoTime.className = 'plugin-mission-info time help';
        infoTime.title = 'Combined estimated duration of all missions of this banner';
        infoTime.textContent = timeToRemaining((sumMedianCompletionTimeMs / 1000) | 0) + ' ';
        img = infoTime.insertBefore(document.createElement('img'), infoTime.firstChild);
        img.src = 'https://commondatastorage.googleapis.com/ingress.com/img/tm_icons/time.png';

        return container;
    },

    displayBanner: function(name, banner){
        dialog({
            id: 'plugin-banner-details',
            // title: mission.title,
            title: name,
            height: 'auto',
            html: this.format(banner),
            width: 'auto',
            closeCallback: function() {
                // me.removeMissionLayers(markers);
            },
            // collapseCallback: this.collapseFix,
            // expandCallback: this.collapseFix,
            focus: function() {
                // me.highlightMissionLayers(markers);
            }
        }).dialog('option', 'buttons', {
            // 'Zoom to mission': function() {
            //     me.zoomToMission(mission);
            // },
            'OK': function() { $(this).dialog('close'); },
        });
    },

    openBanners: function() {
        this.repository.root(function(data){
            this.show(data);
        }.bind(this));
    },

    setup: function() {
        if (window.plugin.missions === undefined) {
           alert("'Banners' requires 'Missions'");
           return;
        }

        this.repository = Repository("https://r3f1zul666.github.io/iitc-plugin-banners");

        $('<style>').prop('type', 'text/css').html('.plugin-banner-summary img { cursor: pointer; width: 50px; }').appendTo('head');
        $('#toolbox').append('<a tabindex="0" onclick="plugin.banners.openBanners();">Discover banners</a>');
    }
};

var setup = window.plugin.banners.setup.bind(window.plugin.banners);

// PLUGIN END //////////////////////////////////////////////////////////

setup.info = plugin_info; //add the script info data to the function as a property
if(!window.bootPlugins) window.bootPlugins = [];
window.bootPlugins.push(setup);
// if IITC has already booted, immediately run the 'setup' function
if(window.iitcLoaded && typeof setup === 'function') setup();
} // wrapper end
// inject code into site context
var script = document.createElement('script');
var info = {};
if (typeof GM_info !== 'undefined' && GM_info && GM_info.script) info.script = { version: GM_info.script.version, name: GM_info.script.name, description: GM_info.script.description };
script.appendChild(document.createTextNode('('+ wrapper +')('+JSON.stringify(info)+');'));
(document.body || document.head || document.documentElement).appendChild(script);
