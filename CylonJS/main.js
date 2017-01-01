/*!
 * OS.js - JavaScript Cloud/Web Desktop Platform
 *
 * Copyright (c) 2011-2017, Anders Evenrud <andersevenrud@gmail.com>
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
(function(Application, Window, Utils, API, VFS, GUI) {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // WINDOWS
  /////////////////////////////////////////////////////////////////////////////

  function ApplicationCylonJSWindow(app, metadata, scheme) {
    Window.apply(this, ['ApplicationCylonJSWindow', {
      icon: metadata.icon,
      title: metadata.name,
      width: 400,
      height: 400,
      min_height: 400
    }, app, scheme]);

    this.color = {r: 255, g: 255, b: 255};
  }

  ApplicationCylonJSWindow.prototype = Object.create(Window.prototype);
  ApplicationCylonJSWindow.constructor = Window.prototype;

  ApplicationCylonJSWindow.prototype.init = function(wmRef, app, scheme) {
    var root = Window.prototype.init.apply(this, arguments);
    var self = this;

    scheme.render(this, 'CylonJSWindow', root);

    var c = this._find('ButtonLCDColor');
    c.on('click', function(ev) {
      API.createDialog('Color', {
        color: self.color
      }, function(ev, button, result) {
        if ( button === 'ok' && result ) {
          c.set('value', result.hex);
          self.color = result;
        }
      }, self);
    });

    this._find('ButtonLCD').son('click', this, this.onClick);

    this._find('Sensors').set('columns', [
      {label: 'Name'},
      {label: 'Value', size: '140px', textalign: 'right'}
    ]);

    return root;
  };

  ApplicationCylonJSWindow.prototype.onClick = function() {
    this._app.send({
      action: 'lcd',
      message: this._find('TextLCD').get('value'),
      color: this.color
    });
  };

  ApplicationCylonJSWindow.prototype.onMessage = function(data) {
    if ( data.sensors ) {
      var view = this._find('Sensors');
      var rows = [];

      Object.keys(data.sensors).forEach(function(name) {
        rows.push({
          id: name,
          value: name,
          columns: [
            {label: name},
            {label: String(data.sensors[name]), textalign: 'right'}
          ]
        });
      });

      view.patch(rows);
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // APPLICATION
  /////////////////////////////////////////////////////////////////////////////

  function ApplicationCylonJS(args, metadata) {
    Application.apply(this, ['ApplicationCylonJS', args, metadata]);

    this.websocket = null;
  }

  ApplicationCylonJS.prototype = Object.create(Application.prototype);
  ApplicationCylonJS.constructor = Application;

  ApplicationCylonJS.prototype.destroy = function() {
    if ( this.websocket ) {
      this.websocket.close();
    }
    this.websocket = null;

    return Application.prototype.destroy.apply(this, arguments);
  };

  ApplicationCylonJS.prototype.init = function(settings, metadata) {
    Application.prototype.init.apply(this, arguments);

    var self = this;
    var url = 'ws' + (window.location.protocol === 'https:' ? 's' : '') + '://' + window.location.hostname + ':' + metadata.config.port;

    this._loadScheme('./scheme.html', function(scheme) {
      var win = self._addWindow(new ApplicationCylonJSWindow(self, metadata, scheme));

      var interval;
      self.websocket = new WebSocket(url);
      self.websocket.onclose = function(ev) {
        interval = clearInterval(interval);
      };

      self.websocket.onmessage = function(ev) {
        win.onMessage(JSON.parse(ev.data));
      };

      self.websocket.onopen = function(ev) {
        interval = setInterval(function() {
          self.send({action: 'sensors'});
        }, 1000);
      };
    });
  };

  ApplicationCylonJS.prototype.send = function(data) {
    if ( this.websocket ) {
      this.websocket.send(JSON.stringify(data));
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationCylonJS = OSjs.Applications.ApplicationCylonJS || {};
  OSjs.Applications.ApplicationCylonJS.Class = Object.seal(ApplicationCylonJS);

})(OSjs.Core.Application, OSjs.Core.Window, OSjs.Utils, OSjs.API, OSjs.VFS, OSjs.GUI);
