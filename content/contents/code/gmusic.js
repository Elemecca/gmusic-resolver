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

    version: '0.1',

    getConfigUi: function() {
        return {
            "widget": Tomahawk.readBase64( "config.ui" ),
            fields: [{
                name: "email",
                widget: "email_edit",
                property: "text"
            }, {
                name: "password",
                widget: "password_edit",
                property: "text"
            }],
            images: [{
                "play-logo.png":
                    Tomahawk.readBase64( "play-logo.png" )
            }]
        };
    },

    newConfigSaved: function() {
        var config = this.getUserConfig();
        if (this.email !== config.email
                || this.password !== config.password)
            this.init();
    },

    init: function() {
        var config = this.getUserConfig();
        this.email = config.email;
        this.password = config.password;

        Tomahawk.log( "GMusic Resolver"
                + " email='" + config.email + "'"
                + " password='" + config.password + "'"
            );

        if (!this.email || !this.password) {
            Tomahawk.log( "GMusic resolver not configured." );
            return;
        }

        this._login();
    },

    _login: function (callback) {
        var that = this;
        this._sendPOST( 'https://www.google.com/accounts/ClientLogin',
                {   'accountType':  'HOSTED_OR_GOOGLE',
                    'Email':        that.email,
                    'Passwd':       that.password,
                    'service':      'sj',
                    'source':       'tomahawk-gmusic-' + that.version
                },
                null,
                function (request) {
                    if (200 == request.status) {
                        this.token = request.responseText.match( /^Auth=(.*)$/m )[ 1 ];
                        Tomahawk.log( 'Login OK:\n' + token );
                    } else {
                        Tomahawk.log( 'Login failed:\n' + request.responseText );
                    }
                }
            );
    },

    _sendPOST: function (url, params, headers, callback) {
        var request = new XMLHttpRequest();
        request.open( 'POST', url, true );

        if (headers) for (var name in headers) {
            request.setRequestHeader( name, headers[ name ] );
        }

        request.setRequestHeader( 'Content-Type',
                'application/x-www-form-urlencoded' );

        request.onreadystatechange = function() {
            if (4 == request.readyState)
                callback.call( window, request );
        }
        
        function encode (value) {
            // close enough to x-www-form-urlencoded
            return encodeURIComponent( value ).replace( '%20', '+' );
        }

        var postdata = "";
        for (var name in params) {
            postdata += '&' + encode( name )
                + '=' + encode( params[ name ] );
        }
        postdata = postdata.substring( 1 );
        Tomahawk.log( "POST request:\n" + url + "\n" + postdata );

        request.send( postdata );
    }

});

Tomahawk.resolver.instance = GMusicResolver;
