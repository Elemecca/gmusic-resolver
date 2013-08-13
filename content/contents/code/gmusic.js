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

    _version: '0.1',
    _baseURL: 'https://www.googleapis.com/sj/v1/',

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
        if (this._email !== config.email
                || this._password !== config.password)
            this.init();
    },

    init: function() {
        var config = this.getUserConfig();
        this._email = config.email;
        this._password = config.password;

        if (!this._email || !this._password) {
            Tomahawk.log( "GMusic resolver not configured." );
            return;
        }

        //this._login();
    },

    _convertTrack: function (entry) {
        return {
            artist:     entry.artist,
            album:      entry.album,
            track:      entry.title,
            year:       entry.year,

            albumpos:   entry.trackNumber,
            discnumber: entry.discNumber,

            size:       entry.estimatedSize,
            duration:   entry.durationMillis / 1000
        };
    },

    _convertAlbum: function (entry) {
        return {
            artist:     entry.artist,
            album:      entry.name,
            year:       entry.year
        };
    },

    _convertArtist: function (entry) {
        return entry.name;
    },

    search: function (qid, query) {
        Tomahawk.log( "Google Music got search '" + query + "'." );
        var that = this;
        this._request( 'GET', this._baseURL 
                + 'query?q=' + encodeURIComponent( query ),
            function (request) {
                if (200 != request.status) {
                    Tomahawk.log(
                            "Google Music search '" + query + "' failed:\n"
                            + request.status + " "
                            + request.statusText.trim() + "\n"
                            + request.responseText.trim()
                        );
                    return;
                }

                var response = JSON.parse( request.responseText );
                var tracks = [], albums = [], artists = [];
                for (var idx = 0; idx < response.entries.length; idx++) {
                    var entry = response.entries[ idx ];

                    switch (entry.type) {
                    case '1':
                        var result = that._convertTrack( entry.track );
                        result.score = entry.score / 100;
                        tracks.push( result );
                        break;
                    
                    /*
                    case '2':
                        artists.push( that._convertArtist( entry.artist ) );
                        break;

                    case '3':
                        albums.push( that._convertAlbum( entry.album ) );
                        break;
                    */
                    }
                }

                Tomahawk.log( "found tracks:\n" + JSON.stringify( tracks, null, true ) );

                Tomahawk.addTrackResults(
                        { 'qid': qid, 'results': tracks } );
                /*
                Tomahawk.addAlbumResults(
                        { 'qid': qid, 'results': albums } );
                Tomahawk.addArtistResults(
                        { 'qid': qid, 'results': artists } );
                */
            }
        );
    },

    _request: function (method, url, callback, headers, nologin) {
        var request = new XMLHttpRequest();
        request.open( method, url, true );
        request.responseType = 'text';

        request.setRequestHeader( 'Authorization',
                'GoogleLogin auth=' + this._token );

        var that = this;
        request.onreadystatechange = function() {
            if (4 != request.readyState) return;

            // log in and retry if necessary
            if (401 == request.status && !nologin) {
                Tomahawk.log( 'Google Music login expired, re-authenticating.' );
                that._login( function() {
                    that._request( method, url, callback, headers, true );
                });
            } else {
                callback.call( window, request );
            }
        }

        request.send();
    },

    _login: function (callback) {
        var that = this;
        this._sendPOST( 'https://www.google.com/accounts/ClientLogin',
                {   'accountType':  'HOSTED_OR_GOOGLE',
                    'Email':        that._email,
                    'Passwd':       that._password,
                    'service':      'sj',
                    'source':       'tomahawk-gmusic-' + that.version
                },
                null,
                function (request) {
                    if (200 == request.status) {
                        that._token = request.responseText
                                .match( /^Auth=(.*)$/m )[ 1 ];
                        callback.call( window );
                    } else {
                        Tomahawk.log(
                                "Google Music login failed:\n"
                                + request.status + " "
                                + request.statusText.trim() + "\n"
                                + request.responseText.trim()
                            );
                    }
                }
            );
    },

    _sendPOST: function (url, params, headers, callback) {
        var request = new XMLHttpRequest();
        request.open( 'POST', url, true );
        request.responseType = 'text';

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
    
        request.send( postdata.substring( 1 ) );
    }

});

Tomahawk.resolver.instance = GMusicResolver;
