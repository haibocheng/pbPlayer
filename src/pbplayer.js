//= compat
/*!
 * pbPlayer v<%= PB_VERSION %>
 * https://github.com/Pluxbox/pbPlayer
 *
 * Requires pbjs javascript framework (>= 0.5.7)
 * https://github.com/Saartje87/pbjs
 *
 * copyright 2011-2012, Pluxbox
 * MIT License
 */
(function ( context, undefined ){

"use strict";

if( context.PB === undefined ) {

	throw new Error('pbjs required. Visit https://github.com/Saartje87/pbjs for the latest release!');
}

// PBPlayer should only be declared once
if( context.PB.Player !== undefined ) {

	return;
}

// Speed up reference
var PB = context.PB,
	instances = [];

//= require "./core/core"

//= require "./plugins/plugins"

})( this );

