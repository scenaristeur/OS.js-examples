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

  function ApplicationWebsocketWindow(app, metadata, scheme) {
    Window.apply(this, ['ApplicationWebsocketWindow', {
      icon: metadata.icon,
      title: metadata.name,
      width: 400,
      height: 200
    }, app, scheme]);
  }

  ApplicationWebsocketWindow.prototype = Object.create(Window.prototype);
  ApplicationWebsocketWindow.constructor = Window.prototype;

  ApplicationWebsocketWindow.prototype.init = function(wmRef, app, scheme) {
    var root = Window.prototype.init.apply(this, arguments);

    this._render('WebsocketWindow');

    this._find('Button').son('click', this, this.onClick);

    return root;
  };

  ApplicationWebsocketWindow.prototype.onClick = function() {
    this._app.send({action: 'clock'});
  };

  ApplicationWebsocketWindow.prototype.onMessage = function(data) {
    this._find('Response').set('value', String(data.clock));
  };

  /////////////////////////////////////////////////////////////////////////////
  // APPLICATION
  /////////////////////////////////////////////////////////////////////////////

  function ApplicationWebsocket(args, metadata) {
    Application.apply(this, ['ApplicationWebsocket', args, metadata]);

    this.websocket = null;
  }

  ApplicationWebsocket.prototype = Object.create(Application.prototype);
  ApplicationWebsocket.constructor = Application;

  ApplicationWebsocket.prototype.destroy = function() {
    if ( this.websocket ) {
      this.websocket.close();
    }
    this.websocket = null;

    return Application.prototype.destroy.apply(this, arguments);
  };

  ApplicationWebsocket.prototype.init = function(settings, metadata, scheme) {
    Application.prototype.init.apply(this, arguments);

    var url = 'ws' + (window.location.protocol === 'https:' ? 's' : '') + '://' + window.location.hostname + ':' + metadata.config.port;

    var win = this._addWindow(new ApplicationWebsocketWindow(this, metadata, scheme));

    this.websocket = new WebSocket(url);
    this.websocket.onmessage = function(ev) {
      win.onMessage(JSON.parse(ev.data));
    };
  };

  ApplicationWebsocket.prototype.send = function(data) {
    if ( this.websocket ) {
      this.websocket.send(JSON.stringify(data));
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationWebsocket = OSjs.Applications.ApplicationWebsocket || {};
  OSjs.Applications.ApplicationWebsocket.Class = Object.seal(ApplicationWebsocket);

})(OSjs.Core.Application, OSjs.Core.Window, OSjs.Utils, OSjs.API, OSjs.VFS, OSjs.GUI);
