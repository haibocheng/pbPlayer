/*!
 * pbPlayer v3.4.0Beta
 * https://github.com/Pluxbox/pbPlayer
 *
 * Requires pbjs javascript framework (> 0.5)
 * https://github.com/Saartje87/pbjs
 */
(function ( context, undefined ){

"use strict";

if( context.PB === undefined ) {

	throw new Error('pbjs required. Visit https://github.com/Saartje87/pbjs for the latest release!');
}

if( context.PB.Player !== undefined ) {

	return;
}

var PB = context.PB,
	instances = [];

PB.Player = PB.Class(PB.Observer, {

	VERSION: '3.4.0Beta',

	/**
	 *
	 */
	construct: function ( files, config ) {

		this.parent();

		if( arguments.length == 1 ) {

			config = files;
		}

		this.plugin;
		this.position = 0;
		this.id = 'pb-player-'+PB.id();
		this.config = PB.overwrite(PB.overwrite({}, PB.Player.defaults), config);

		this.setMedia( files );	// Do some more checking with these

		if( this.config.renderTo ) {

			this.config.renderTo = PB(this.config.renderTo);
		} else {

			var scripts = document.getElementsByTagName('script');

			this.config.renderTo = scripts[scripts.length - 1];
		}

		if( this.config.autostart ) {

			this.play();
		}

		PB.Player.instances[this.id] = this;
	},

	destroy: function () {

		if( this.plugin ) {

			this.plugin.destroy();
		}

	},

	setMedia: function ( files, isPlaylist ) {

		if( this.config.playlist || isPlaylist ) {

			this.setPlaylist( files );
		} else {

			this.setFile( files );
		}
	},

	setFile: function ( file ) {

		this.files = [ this.formatMediaObject(file) ];
	},

	setPlaylist: function ( files ) {

		if( Array.isArray(files) === false ) {

			this.emit('error', {

				message: 'Given playlist is not an array'
			});

			return;
		}

		this.files = files.map(this.formatMediaObject);
	},

	formatMediaObject: function ( file ) {

		if( !file.codec ) {

			var url = file.url,
				codec,
				i;

			if( i = url.indexOf('?') ) {

				url = url.substr( 0, i );
			}

			if( i = url.lastIndexOf('.') ) {

				file.codec = url.substr( i+1 );
			} else {

				file.codec = 'mp3';
			}
		}

		return file;
	},

	/**
	 * Event normalisation
	 */
	emit: function ( type, data ) {

		var me = this,
			e = PB.overwrite({

			type: type,
			target: me
		}, data);

		this.parent( type, e );
	},

	getPlugin: function () {

		if( this.plugin ) {

			return;
		}

		var files = this.files,
			position = this.position;

		PB.each(PB.Player.plugins, function ( key, plugin ) {


			if( plugin.supports(files[position]) ) {

				this.stream = !!files[position].stream;

				this.plugin = new PB.Player.plugins[key]( this );

				this.plugin.set( files[position].url );
				this.plugin.volume( this.config.volume );

				return true;
			}
		}, this);
	},

	play: function () {

		this.getPlugin();

		this.plugin.play();
	},

	pause: function () {

		this.getPlugin();

		this.plugin.pause();
	},

	stop: function () {

		this.getPlugin();

		this.plugin.stop();
	},

	volume: function ( volume ) {

		this.getPlugin();

		volume = parseInt(volume, 10);
		volume = ( volume < 0 ) ? 0 : ( volume > 100 ) ? 100 : volume;

		this.config.volume = volume;

		this.plugin.volume( volume );
	},

	mute: function () {

		this.getPlugin();

		this.plugin.mute();
	},

	unmute: function () {

		this.getPlugin();

		this.plugin.unmute();
	},

	playAt: function ( position ) {

		this.getPlugin();

		this.plugin.playAt( parseFloat(position) );
	}
});

PB.Player.instances = {};

PB.Player.plugins = {};

/**
 * Register containers to PB.Player
 */
PB.Player.register = function ( name, klasse ) {

	klasse.supports = klasse.prototype.supports;
	PB.Player.plugins[name] = klasse;
};
PB.Player.defaults = {

	swfPath: 'static/pbplayer/',	// Used to get skin, swf, etc...
	skinPath: 'static/pbplayer/skins/',
	volume: 80,
	autostart: false,
	skin: false,
	renderTo: null,				// Render skin to
	timeFormat: 'i:s',
	loop: false,
	simple: true,
	playlist: true
};


var html5 = PB.Class({

	codecs: {

		mp3: 'audio/mpeg; codecs="mp3"',
		ogg: 'audio/ogg; codecs="vorbis"',
		aac: 'audio/aac; codecs="aac"'
	},

	NETWORK_ERROR: 'NETWORK_EMPTY NETWORK_IDLE NETWORK_LOADED NETWORK_LOADING NETWORK_NO_SOURCE'.split(' '),

	/**
	 * Html5 availeble and supports audio file?
	 */
	supports: function ( metadata ) {

		var codecs = html5.prototype.codecs;

		if( !window.Audio || !codecs[metadata.codec] ) {

			return false;
		}

		var audio = new window.Audio,
			ogg = ('no' != audio.canPlayType(codecs.ogg)) && ('' != audio.canPlayType(codecs.ogg)),
			mp3 = ('no' != audio.canPlayType(codecs.mp3)) && ('' != audio.canPlayType(codecs.mp3)),
			aac = ('no' != audio.canPlayType(codecs.aac)) && ('' != audio.canPlayType(codecs.aac));

	/*	if( !ogg && !mp3 && !aac ) {

			return false;
		}*/

		try {

			if( PB.browser.isSafari && !PB.browser.isNokiaBrowser ) {

				if( PB.browser.version <= 5.0 ) {

					return false;
				}
			}
		} catch (e){}

		var canPlay = audio.canPlayType( codecs[metadata.codec] );

		return canPlay === 'probably' || canPlay === 'maybe';
	},

	/**
	 *
	 */
	construct: function ( context ) {

		this.context = context;

		this.element = PB('<audio preload="metadata" />');

		this.addEvents();

		this.element = this.element.appendTo(document.body).node;
	},

	/**
	 *
	 */
	destroy: function () {

		this.element.pause();
		this.element.src = '';

		this.element.remove();

		this.element = null;
		this.context = null;
	},

	/**
	 *
	 */
	addEvents: function () {

		this._progress = this.progress.bind(this);

		this.element
			.on('loadedmetadata', this.metadataLoaded.bind(this))
			.on('error pause play volumechange ended timeupdate', this.eventDelegation.bind(this));
	},

	metadataLoaded: function ( e ) {

		this.context.emit('duration', {

			seconds: this.element.duration
		});
	},

	progress: function ( e ) {

		var element = this.element,
			error = element.error,
			buffered = element.buffered;

		if( error !== null ) {

			this.context.emit('error', {

				code: this.element.error,
				message: this.NETWORK_ERROR[this.element.error]
			});

			return;
		}

		if( buffered.length ) {

			this.context.emit('progress', {

				percent: Math.floor((buffered.end(0) / element.duration) * 100)
			});
		}


		if( element.readyState >= 3 ) {

			this.context.emit('progress', {

				percent: 100
			});

			this.context.emit('loaded');

			return;
		}

		window.setTimeout(this._progress, 100);

		element = null;
	},

	eventDelegation: function ( e ) {

		var args = {};

		switch( e.type ) {

			case 'timeupdate':
				args.seconds = this.element.currentTime;
				break;

			case 'volumechange':
				args.volume = this.element.muted
					? 0
					: parseInt(this.element.volume * 100, 10);
				break;
		}

		this.context.emit(e.type, args);
	},


	/**
	 * Set src
	 */
	set: function ( src ) {

		this.stop();

		this.element.src = src;

		this.progress();
	},

	/**
	 *
	 */
	play: function () {

		this.element.play();
	},

	/**
	 *
	 */
	pause: function () {

		this.element.pause();
	},

	/**
	 *
	 */
	stop: function () {

		var src = this.element.src;

		this.element.pause();
		this.element.src = '';

		try { this.element.currentTime = 0; } catch (e){};

		this.element.src = src;
	},

	/**
	 *
	 */
	volume: function ( volume ) {

		this.element.volume = volume / 100;
	},

	/**
	 *
	 */
	mute: function () {

		 this.element.muted = true;
	},

	/**
	 *
	 */
	unmute: function () {

		this.element.muted = false;
	},

	/**
	 *
	 */
	playAt: function ( position ) {

		this.element.currentTime = position;
	},
});

PB.Player.register('html5', html5);

var flash = PB.Class({

	/**
	 * Html5 availeble and supports audio file?
	 */
	supports: function ( metadata ) {

		var codecs = { mp3: true, mp4: true };

		if( PB.browser.flash && PB.browser.flash > 8 && codecs[metadata.codec] ) {

			return true;
		}

		return false;
	},

	/**
	 *
	 */
	construct: function ( context ) {

		var flashContainer = context.config.swfPath;

		this.context = context;

		this.maxTries = 25;		// 25 * 50 = 1250ms to load flash..
		this.queue = [];
		this.flashReady = false;

		if( context.config.stream ) {

			flashContainer += 'pbstreamplayer.swf';
		} else {

			flashContainer += 'pbplayer.swf';
		}

		if( PB.browser.isIE ) {

			this.element = PB('<object id="'+this.context.id+'" classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000" codebase="http://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=8,0,40,0" width="0" height="0">'
					+'<param name="movie" value="'+flashContainer+'?ac='+Date.now()+'">'
					+'<param name="quality" value="high">'
					+'<param name="bgcolor" value="#FFFFFF">'
					+'<param name="allowScriptAccess" value="always">'
				+'</object>');
		}
		else {

			this.element = PB('<embed width="0" height="0" id="'+this.context.id+'" '
				+'src="'+flashContainer+'?ac='+Date.now()+'"'
				+'allowscriptaccess="always" type="application/x-shockwave-flash"'
				+'pluginspage="http://www.macromedia.com/go/getflashplayer"></embed>');
		}

		this.element = this.element.appendTo(document.body).node;

		this._isLoaded = this.isLoaded.bind(this);
		this.isLoadedTimer = setInterval( this._isLoaded, 50 );
	},

	isLoaded: function () {

		try {

			this.element._playerId( this.context.id );

			this.flashReady = true;
			this.queue.forEach(function ( item ){

				if( item.args === null ) {

					this[item.method].call(this);
				} else {

					this[item.method].call(this, Array.prototype.slice.call(item.args));
				}
			}, this);

			clearTimeout( this.isLoadedTimer );

		} catch (e){};

		if( !(--this.maxTries) ) {

			clearTimeout( this.isLoadedTimer );

			this.context.emit('error', {

				message: 'Forgot to set swfPath?'
			});
		}
	},

	/**
	 *
	 */
	destroy: function () {

		this.element.remove();

		this.element = null;
		this.context = null;
	},

	addToQueue: function ( method, args ) {

		this.queue.push({

			method: method,
			args: args || null
		});
	},


	/**
	 * Set src
	 */
	set: function ( src ) {

		if( !this.flashReady ) {

			this.addToQueue( 'set', arguments );
			return;
		}

		this.element._src( src );
	},

	/**
	 *
	 */
	play: function () {

		if( !this.flashReady ) {

			this.addToQueue( 'play' );
			return;
		}

		this.element._play();
	},

	/**
	 *
	 */
	pause: function () {

		if( !this.element._pause ) {

			return;
		}

		this.element._pause();
	},

	/**
	 *
	 */
	stop: function () {

		if( !this.flashReady ) {

			this.addToQueue( 'stop' );
			return;
		}

		this.element._stop();
	},

	/**
	 *
	 */
	volume: function ( volume ) {

		if( !this.flashReady ) {

			this.addToQueue( 'volume', arguments );
			return;
		}

		this.currentVolume = volume;

		this.element._volume( volume );
	},

	/**
	 *
	 */
	mute: function () {

		if( !this.flashReady ) {

			this.addToQueue( 'mute' );
			return;
		}

		this.element._volume( 0 );
	},

	/**
	 *
	 */
	unmute: function () {

		if( !this.flashReady ) {

			this.addToQueue( 'unmute' );
			return;
		}

		this.element._volume( this.currentVolume );
	},

	/**
	 *
	 */
	playAt: function ( position ) {

		if( !this.flashReady ) {

			this.addToQueue( 'playAt', arguments );
			return;
		}

		this.element._playAt( position );
	},
});

PB.Player.register('flash', flash);


})( this );

