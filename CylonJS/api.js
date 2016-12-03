/*!
 * OS.js - JavaScript Cloud/Web Desktop Platform
 *
 * Copyright (c) 2011-2016, Anders Evenrud <andersevenrud@gmail.com>
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * @author  Anders Evenrud <andersevenrud@gmail.com>
 * @licence Simplified BSD License
 */
(function(WebsocketServer) {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // CONNECTION
  /////////////////////////////////////////////////////////////////////////////

  var connections = {
    edison: {adaptor: 'intel-iot'}
  };

  var devices = {
    temp: {driver: 'analog-sensor', pin: 0},
    knob: {driver: 'analog-sensor', pin: 1},
    sound: {driver: 'analog-sensor', pin: 2},
    light: {driver: 'analog-sensor', pin: 3},
    button: {driver: 'button', pin: 4},
    led: {driver: 'led', pin: 13},
    lcd: {driver: 'jhd1313m1'}
  };

  var handlers = (function() {

    function pad(pad, num, str) {
      var p = (new Array(num)).join(pad);
      return (str + p).substring(0, p.length);
    }

    function writeToScreen(screen, message) {
      if ( typeof message === 'string' ) {
        message = [message];
      }

      message.forEach(function(msg, line) {
        screen.setCursor(0, line);
        screen.write(pad(' ', 16, String(msg).substr(0, 16)));
      });
    }

    function getTemperature(my) {
      var val = my.temp.analogRead();
      var res = (1023 - val) * 10000 / val;
      return 1 / (Math.log(res / 10000) / 3975 + 1 / 298.15) - 273.15;
    }

    return {
      _work: function(cylon) {
        cylon.lcd.on('start', function() {
          cylon.lcd.backlightOn();
        });
      },

      lcd: function(cylon, ws, data) {
        try {
          cylon.lcd.backlightOn();
        } catch ( e ) {}

        cylon.lcd.setColor(data.color.r, data.color.g, data.color.b);
        writeToScreen(cylon.lcd, data.message.split('\n'));
      },

      sensors: function(cylon, ws, data) {
        send(cylon, ws, {
          sensors: {
            temperature: getTemperature(cylon),
            sound: cylon.sound.analogRead(),
            light: cylon.light.analogRead(),
            potentiometer: cylon.knob.analogRead()
          }
        });
      }
    };
  })();

  /////////////////////////////////////////////////////////////////////////////
  // HELPERS
  /////////////////////////////////////////////////////////////////////////////

  function send(cylon, ws, data) {
    ws.send(JSON.stringify(data));
  }

  /////////////////////////////////////////////////////////////////////////////
  // APPLICATION
  /////////////////////////////////////////////////////////////////////////////

  module.exports.api = {};

  // This is called whenever the HTTP server starts up
  module.exports.register = function(env, metadata, servers) {
    var wss = new WebsocketServer({server: servers.httpServer, port: metadata.config.port});

    wss.on('connection', function(ws) {
      //console.log('!!!', 'WS', 'Opened connection');

      var cylon = require('cylon').robot({
        devices: devices,
        connections: connections,
        work: function(my) {
          handlers._work(my);
        }
      });

      cylon.start();

      send(cylon, ws, {
        connections: connections,
        devices: devices
      });

      ws.on('message', function(data, flags) {
        data = JSON.parse(data);

        if ( data.action.substr(0, 1) !== '_' &&  handlers[data.action] ) {
          handlers[data.action](cylon, ws, data);
        } else {
          console.log('!!!', 'WS', 'Message', data, flags);
        }
      });

      ws.on('close', function() {
        //console.log('!!!', 'WS', 'closed connection');

        try {
          cylon.stop();
        } catch ( e ) {}

        cylon = null; // FIXME
      });
    });

    console.log('!!!', 'Websockets Initialized on port', metadata.config.port);
  };

})(require('ws').Server);

