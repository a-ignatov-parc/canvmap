var Map = function() {
	return {
		createLevel: this.createLevel.bind({
			context: this,
			zone: this.map,
			parent: null
		}),
		draw: this.draw.bind(this)
	};
};

Map.prototype = {
	map: {},
	mapEl: null,
	tpl: {
		map: {
			root: null,
			mapImg: null,
			zones: []
		},
		zone: {
			active: false,
			index: null,
			name: null,
			domEl: null,
			zoneImg: null,
			fileName: null,
			animation: null,
			animations: {
				active: {},
				zone: {},
				reset: {
					top: 0,
					left: 0,
					width: 800,
					height: 320,
					opacity: 1
				}
			},
			onOver: function(callback) {
				this.zone.animation && clearTimeout(this.zone.animation);
				this.zone.animation = setTimeout(function() {
					this.zone.domEl
						.fadeIn('fast', function() {
							if (typeof(callback) === 'function') {
								callback();
							}
						});

						if (this.zone.zones) {
							this.zone.domEl
								.parent()
								.addClass('b-active_zone');
						}
				}.bind(this), 100);
			},
			onOut: function(callback) {
				this.zone.animation && clearTimeout(this.zone.animation);
				this.zone.domEl
					.fadeOut('fast', function() {
						if (typeof(callback) === 'function') {
							callback();
						}
					})
					.parent()
					.removeClass('b-active_zone');
			},
			onClick: function() {
				if (this.zone.mapImg) {
					var activeMap = $('.b-map-content_map:visible', this.context.mapEl),
						zoneMap = $(this.zone.mapImg);

					this.zone.onOut.call({
						context: this.context,
						zone: this.zone
					});
					this.context.clearCanvasesList();
					this.context.currentLevel.push(this.zone.index);
					zoneMap
						.css(this.zone.animations.zone)
						.insertAfter(activeMap)
						.animate(this.zone.animations.reset, 100);
					activeMap
						.animate(this.zone.animations.active, 200, function() {
							this.onReady(this.mapEl.find('.b-map-content'));
						}.bind(this.context));
				}
			}
		}
	},
	ready: false,
	totalImgs: 0,
	loadedImgs: 0,
	currentLevel: [0],
	currentLevelRoot: null,
	canvases: [],

	createLevel: function(params) {
		var mapImg = new Image();

		$.extend(true, this.zone, this.context.tpl.map);
		this.zone.root = params.root;

		mapImg.className = 'b-map-content_map';
		this.zone.mapImg = mapImg;

		this.context.loadImg(mapImg, params.root + '_map.png');
		return {
			registerZone: this.context.registerZone.bind({
				context: this.context,
				parent: this.zone,
				grandParent: this.parent
			})
		};
	},

	registerZone: function(params) {
		var zone = $.extend(true, {}, this.context.tpl.zone, params);

		if (zone.fileName) {
			zone.fileName = this.parent.root + zone.fileName;
		}
		zone.index = this.parent.zones.length;
		this.parent.zones.push(zone);
		return {
			root: this.parent.root,
			createLevel: this.context.createLevel.bind({
				context: this.context,
				zone: zone,
				parent: this.parent
			})
		}
	},

	loadImg: function(target, src, customCallback, customEvent) {
		this.ready = false;
		this.totalImgs++;
		$(target)
			.bind('load', function(event) {
				this.loadedImgs++;

				if (this.totalImgs && this.totalImgs == this.loadedImgs) {
					this.ready = true;
					AWAD.Observatory.trigger(customEvent ? 'canvmap.' + customEvent : 'canvmap.ready');
				}

				if (typeof(customCallback) === 'function') {
					customCallback(event);
				}
			}.bind(this))
			.attr('src', src);
	},

	draw: function(container) {
		var template = $('#canvas-map'),
			mapEl = $(_.template(template.html())()),
			mapContent = mapEl.find('.b-map-content');

		mapEl
			.appendTo(container)
			.addClass('b-loading_map');
		AWAD.Observatory
			.bind('canvmap.ready', function() {
				this.onReady(mapContent);
			}.bind(this))
			.bind('canvmap.rendered', function() {
				mapEl.removeClass('b-loading_map');
				mapContent.fadeIn();
				this.setListeners(mapContent);
			}.bind(this));
		this.mapEl = mapEl;
	},

	onReady: function(container) {
		var root;

		this.setLevelRoot();
		root = this.currentLevelRoot;
		container.append(root.mapImg);

		if (root.zones) {
			this.createCanvasesList(root.zones, root.mapImg);
		}
	},

	setLevelRoot: function() {
		this.currentLevelRoot = this.getLevelRoot();
	},

	getLevelRoot: function(zoneList, currentLevel, subLevel) {
		zoneList = zoneList || this.map.zones;
		currentLevel = currentLevel || this.currentLevel;

		if (currentLevel.length == 1) {
			return subLevel ? zoneList[currentLevel[0]] : this.map;
		} else if (currentLevel.length > 1) {
			return this.getLevelRoot(zoneList, currentLevel.slice(1), true);
		}
	},

	createCanvasesList: function(list, map) {
		var hasCanvases = !!this.canvases[this.currentLevel.length - 1],
			canvases = [];

		map = $(map);
		$(list).each(function(i, item) {
			if (!hasCanvases) {
				var canvas = document.createElement('canvas'),
					ctx = canvas.getContext('2d'),
					image = $('<img>').appendTo(map.parent());
	
				canvas.width = map[0].width;
				canvas.height = map[0].height;
				image.addClass('b-map_zones');
				item.domEl = image;
	
				this.loadImg(image, item.fileName, function(event) {
					ctx.drawImage(event.target, 0, 0);
				}, 'rendered');
	
				canvases.push(ctx);
			} else {
				map
					.parent()
					.append(item.domEl);
			}
		}.bind(this));

		if (!hasCanvases) {
			this.canvases[this.currentLevel.length - 1] = canvases;
		} else {
			AWAD.Observatory.trigger('canvmap.rendered');
		}
	},

	clearCanvasesList: function() {
		$('.b-map_zones', this.mapEl).remove();
	},

	setListeners: function(mapEl) {
		var mapPos = this.findPos(mapEl[0]),
			hasActiveZone = false;

		mapEl
			.unbind()
			.bind('mousemove.canvmap click.canvmap', function(event) {
				var index = null;

				$(this.canvases[this.currentLevel.length - 1]).each(function(i, ctx) {
					var pixel = ctx.getImageData(event.pageX - mapPos.x, event.pageY - mapPos.y, 1, 1).data,
						zone = this.currentLevelRoot.zones[i];

					if (pixel[0] + pixel[1] + pixel[2] + pixel[3] > 0) {
						if (!zone.active) {
							index = zone.index;
							this.checkZone(index);
							zone.onOver.call({
								context: this,
								zone: zone
							});
						} else if (event.type == 'click') {
							zone.onClick.call({
								context: this,
								zone: zone
							});
						}
						zone.active = true;
						hasActiveZone = true;
					}
				}.bind(this));

				if (hasActiveZone) {
					hasActiveZone = false;
				} else {
					if (event.type == 'click') {
						this.zoomOut();
					}
					this.checkZone();
				}
			}.bind(this));
	},

	zoomOut: function() {
		if (this.currentLevel.length - 1) {
			var zone = this.getLevelRoot(),
				parent;
				
			this.currentLevel.length = this.currentLevel.length - 1;
			parent = this.getLevelRoot();

			var parentMap = $(parent.mapImg),
				zoneMap = $(zone.mapImg);

			this.clearCanvasesList();
			parentMap.animate(zone.animations.reset, 200);
			zoneMap
				.animate(zone.animations.zone, 200, function() {
					zoneMap.remove();
					this.onReady(this.mapEl.find('.b-map-content'));
				}.bind(this));
		}
	},

	checkZone: function(index) {
		$(this.currentLevelRoot.zones).each(function(i, zone) {
			if (i != index && zone.active) {
				zone.onOut.call({
					context: this,
					zone: zone
				});
				zone.active = false;
			}
		}.bind(this));
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