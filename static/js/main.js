var Map = function() {
	this.map = {
		root: 
	};
	this.zonesList = [
		{
			active: false,
			countryName: 'Russia',
			zoneEl: null,
			zoneFileName: 'world-01-mask.png',
			onOver: function(zone, context) {
				console.log('zone name (over): ' + zone.countryName);
				zone.zoneEl
					.fadeIn('fast')
					.parent()
					.addClass('b-active_zone');
			},
			onOut: function(zone, context) {
				console.log('zone name (out): ' + zone.countryName);
				zone.zoneEl
					.fadeOut('fast')
					.parent()
					.removeClass('b-active_zone');
			},
			onClick: function(zone, context) {
				console.log('zone name (click): ' + zone.countryName);
				alert(zone.countryName);
			}
		}
	];

	this.init();
};

Map.prototype = {
	canvases: [],

	init: function() {
		var self = this,
			map = $('.b-map-img');

		setTimeout(function() {
			self.createCanvasesList(self.zonesList, map);
			self.setListeners(map);
		}, 1000);
	},

	createCanvasesList: function(list, map) {
		var self = this;

		$(list).each(function(i, item) {
			var canvas = document.createElement('canvas'),
				ctx = canvas.getContext('2d'),
				image = $('<img>').appendTo(map.parent());
				
			canvas.width = map.width();
			canvas.height = map.height();
			image
				.addClass('b-map_zones')
				.bind('load', function() {
					ctx.drawImage(this, 0, 0);
				})
				.attr('src', '/img/' + item.zoneFileName);
			item.zoneEl = image;
			
			self.canvases.push(ctx);
		});
	},

	setListeners: function(map) {
		var self = this,
			ctx = this.canvas,
			mapPos = this.findPos(map[0]),
			hasActiveZone = false;

		map
			.parent()
			.bind('mousemove.map', function(event) {
				$(self.canvases).each(function(i, ctx) {
					var pixel = ctx.getImageData(event.pageX - mapPos.x, event.pageY - mapPos.y, 1, 1).data,
						zone = self.zonesList[i];
					
					if (pixel[0] + pixel[1] + pixel[2] + pixel[3] > 0) {
						if (!zone.active) {
							zone.onOver(zone, self);
						}
						zone.active = true;
						hasActiveZone = true;
					}
				});
				
				if (hasActiveZone) {
					hasActiveZone = false;
				} else {
					self.checkZone();
				}
			})
			.bind('click.map', function(event) {
				var activeZone = self.zonesList[self.getActiveZoneID()];

				activeZone.onClick(activeZone, self);
				return false;
			});
	},

	getActiveZoneID: function() {
		for (var i = 0, length = this.zonesList.length; i < length; i++) {
			var zone = this.zonesList[i];

			if (zone.active) {
				return i;
			}
		}
	},
	
	checkZone: function(zone) {
		var activeZone = this.zonesList[this.getActiveZoneID()];
		
		if (activeZone) {
			activeZone.onOut(activeZone, self);
			activeZone.active = false;
		}
	},

	findPos: function(obj) {
		var curleft = 0, 
			curtop = 0;

		if (obj.offsetParent) {
			do {
				curleft += obj.offsetLeft;
				curtop += obj.offsetTop;
			} while (obj = obj.offsetParent);
			return {
				x: curleft,
				y: curtop
			};
		}
		return undefined;
	}
}

$(function() {
	new Map();
});