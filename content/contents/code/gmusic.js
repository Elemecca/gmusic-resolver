/* Google Play Music resolver for Tomahawk.
 * 
 * Written in 2013 by Sam Hanes <sam@maltera.com>
 *
 * To the extent possible under law, the author(s) have dedicated all
 * copyright and related and neighboring rights to this software to
 * the public domain worldwide. This software is distributed without
 * any warranty.
 *
 * You should have received a copy of the CC0 Public Domain Dedication
 * along with this software. If not, see:
 * http://creativecommons.org/publicdomain/zero/1.0/ 
 */

var GMusicResolver = Tomahawk.extend( TomahawkResolver, {
    settings: {
        name: 'Google Play Music',
        icon: '../images/icon.png',
        weight: 90,
        timeout: 8
    },

    init: function() {
        Tomahawk.log( "GMusic resolver is just a stub." );
    }

});

Tomahawk.resolver.instance = GMusicResolver;
