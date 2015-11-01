// ==UserScript==
// @id             iitc-plugin-banners@aeurielesn
// @name           IITC plugin: Banners
// @category       Info
// @version        0.1.1
// @namespace      https://github.com/aeurielesn
// @updateURL      https://github.com/aeurielesn/iitc-plugin-banners/total-conversion-build.meta.js
// @downloadURL    https://secure.jonatkins.com/iitc/release/total-conversion-build.user.js
// @description    Discover mission banners.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @include        https://www.ingress.com/mission/*
// @include        http://www.ingress.com/mission/*
// @match          https://www.ingress.com/mission/*
// @match          http://www.ingress.com/mission/*
// @grant          none
// ==/UserScript==

function wrapper(plugin_info) {
// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};

// PLUGIN START ////////////////////////////////////////////////////////

var timeToRemaining = function(t) {
  var data = parseInt(t / 86400, 10) + 'd ' + (new Date(t % 86400 * 1000)).toUTCString().replace(/.*(\d{2}):(\d{2}):(\d{2}).*/, '$1h $2m $3s');
  data = data.replace('0d', '');
  data = data.replace('00h', '');
  data = data.replace('00m', '');
  return data.trim();
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

        console.log("fetching " + url);
        $.ajax({
            dataType: "json",
            url: url,
            success: function(data) {
                console.log("fetched");
                if(self.check(data, sha256)) {
                    console.log("integrity OK");
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

        for(var provider in providers) {
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
            }
        }

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

        for(var banner in banners) {
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
            }
        }

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
            console.log("showing providers");
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
        
        for(var i = 0; i < banner.length; i += 6) {
            var row = table.appendChild(document.createElement('tr'));
            for(var j = 0, k = i; j < 6; j++, k++) {
                var mission = banner[banner.length - k - 1];
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

        // var authorNickname = "Xysphere";
        // var authorTeam = "E";
        // var author = container.appendChild(document.createElement('span'));
        // author.className = 'nickname ' + (authorTeam === 'R' ? 'res' : 'enl');
        // author.textContent = authorNickname;
        // container.appendChild(document.createElement('br'));

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
        console.log("loading repository");
        this.repository.root(function(data){
            console.log("repository loaded");
            this.show(data);
        }.bind(this));
    },

    setup: function() {
        if (window.plugin.missions === undefined) {
           alert("'Banners' requires 'Missions'");
           return;
        }

        this.repository = Repository("https://aeurielesn.github.io/iitc-plugin-banners");

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
