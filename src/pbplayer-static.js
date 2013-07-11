// pbPlayer default options
pbPlayer.defaults = {

	debug: true,
	solution: 'html5 flash',	// Flash
	autostart: false,
	volume: 100,
	path: '/pbPlayer/dist/',
	preload: 'auto'
};

//pbPlayer.skins = {};

// 
pbPlayer.mediaContainers = {};

/**
 * Register plugin to pbPlayer
 *
 * @param {String} Container name
 * @param {Object} MediaContainer
 */
pbPlayer.registerMediaContainer = function ( name, container ) {

	pbPlayer.mediaContainers[name] = container;
};

/**
 * Set default options for all pbplayer instances
 *
 * @param {Object}
 */
pbPlayer.config = function ( config ) {

	PB.overwrite(pbPlayer.defaults, config);
};

// pbPlayer.registerSkin = function () {};