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
(function(WindowManager, Window, GUI, Utils, API, VFS) {
  'use strict';

  var DefaultCategories = {
    development : {icon: 'categories/package_development.png', title: 'Development'},
    education   : {icon: 'categories/applications-sience.png', title: 'Education'},
    games       : {icon: 'categories/package_games.png',       title: 'Games'},
    graphics    : {icon: 'categories/package_graphics.png',    title: 'Graphics'},
    network     : {icon: 'categories/package_network.png',     title: 'Network'},
    multimedia  : {icon: 'categories/package_multimedia.png',  title: 'Multimedia'},
    office      : {icon: 'categories/package_office.png',      title: 'Office'},
    system      : {icon: 'categories/package_system.png',      title: 'System'},
    utilities   : {icon: 'categories/package_utilities.png',   title: 'Utilities'},
    arduino     : {icon: 'arduino.png',                        title: 'Arancino'},
    unknown     : {icon: 'categories/applications-other.png',  title: 'Other'}
  };

  function _createIcon(aiter, aname, arg) {
    return API.getIcon(aiter.icon, arg, aiter);
  }

  /**
   * Create default application menu with categories (sub-menus)
   */
  function doBuildCategoryMenu(ev) {
    var apps = OSjs.Core.getPackageManager().getPackages();

    function createEvent(iter) {
      return function(el) {
        OSjs.GUI.Helpers.createDraggable(el, {
          type   : 'application',
          data   : {
            launch: iter.name
          }
        });
      };
    }

    function clickEvent(iter) {
      return function() {
        API.launch(iter.name);
      };
    }

    var cats = {};

    Object.keys(DefaultCategories).forEach(function(c) {
      cats[c] = [];
    });

    Object.keys(apps).forEach(function(a) {
      var iter = apps[a];
      if ( iter.type === 'application' && iter.visible !== false ) {
        var cat = iter.category && cats[iter.category] ? iter.category : 'unknown';
        cats[cat].push({name: a, data: iter});
      }
    });

    var list = [];
    Object.keys(cats).forEach(function(c) {
      var submenu = [];
      for ( var a = 0; a < cats[c].length; a++ ) {
        var iter = cats[c][a];
        submenu.push({
          title: iter.data.name,
          icon: _createIcon(iter.data, iter.name),
          tooltip : iter.data.description,
          onCreated: createEvent(iter),
          onClick: clickEvent(iter)
        });
      }

      if ( submenu.length ) {
        list.push({
          title: OSjs.Applications.CoreWM._(DefaultCategories[c].title),
          icon:  API.getIcon(DefaultCategories[c].icon, '16x16'),
          menu:  submenu
        });
      }
    });

    return list;
  }

  /////////////////////////////////////////////////////////////////////////////
  // NEW MENU
  /////////////////////////////////////////////////////////////////////////////

  function ApplicationMenu() {
    var root = this.$element = document.createElement('gui-menu');
    this.$element.id = 'CoreWMApplicationMenu';

    var apps = OSjs.Core.getPackageManager().getPackages();

    function createEntry(a, iter) {
      var entry = document.createElement('gui-menu-entry');

      var img = document.createElement('img');
      img.src = _createIcon(iter, a, '32x32');

      var txt = document.createElement('div');
      txt.appendChild(document.createTextNode(iter.name)); //.replace(/([^\s-]{8})([^\s-]{8})/, '$1-$2')));

      Utils.$bind(entry, 'mousedown', function(ev) {
        ev.stopPropagation();
        API.launch(a);
        API.blurMenu();
      });

      entry.appendChild(img);
      entry.appendChild(txt);
      root.appendChild(entry);
    }

    Object.keys(apps).forEach(function(a) {
      var iter = apps[a];
      if ( iter.type === 'application' && iter.visible !== false ) {
        createEntry(a, iter);
      }
    });
  }

  ApplicationMenu.prototype.destroy = function() {
    if ( this.$element && this.$element.parentNode ) {
      this.$element.parentNode.removeChild(this.$element);
    }
    this.$element = null;
  };

  ApplicationMenu.prototype.show = function(pos) {
    if ( !this.$element ) { return; }

    if ( !this.$element.parentNode ) {
      document.body.appendChild(this.$element);
    }

    // FIXME: This is a very hackish way of doing it and does not work when button is moved!
    Utils.$removeClass(this.$element, 'AtBottom');
    Utils.$removeClass(this.$element, 'AtTop');
    if ( pos.y > (window.innerHeight / 2) ) {
      Utils.$addClass(this.$element, 'AtBottom');

      this.$element.style.top = 'auto';
      this.$element.style.bottom = '30px';
    } else {
      Utils.$addClass(this.$element, 'AtTop');

      this.$element.style.bottom = 'auto';
      this.$element.style.top = '30px';
    }

    this.$element.style.left = pos.x + 'px';
  };

  ApplicationMenu.prototype.getRoot = function() {
    return this.$element;
  };

  /////////////////////////////////////////////////////////////////////////////
  // MENU
  /////////////////////////////////////////////////////////////////////////////

  function doShowMenu(ev) {
    var wm = OSjs.Core.getWindowManager();

    if ( (wm && wm.getSetting('useTouchMenu') === true) ) {
      var inst = new ApplicationMenu();
      var pos = {x: ev.clientX, y: ev.clientY};
      if ( ev.target ) {
        var target = ev.target;
        if ( target.tagName === 'IMG' ) {
          target = target.parentNode;
        }
        var rect = Utils.$position(target, document.body);
        if ( rect.left && rect.top && rect.width && rect.height ) {
          pos.x = rect.left - (rect.width / 2) + 4;
          pos.y = rect.top + rect.height + 4;
        }
      }
      API.createMenu(null, pos, inst);
    } else {
      var list = doBuildCategoryMenu(ev);
      var m = API.createMenu(list, ev);
      if ( m && m.$element ) {
        Utils.$addClass(m.$element, 'CoreWMDefaultApplicationMenu');
      }
    }
  }

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications                          = OSjs.Applications || {};
  OSjs.Applications.CoreWM                   = OSjs.Applications.CoreWM || {};
  OSjs.Applications.CoreWM.showMenu          = doShowMenu;

})(OSjs.Core.WindowManager, OSjs.Core.Window, OSjs.GUI, OSjs.Utils, OSjs.API, OSjs.VFS);

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
(function(WindowManager, GUI, Utils, API, VFS) {
  'use strict';

  var SETTING_STORAGE_NAME = 'CoreWM';
  var PADDING_PANEL_AUTOHIDE = 10; // FIXME: Replace with a constant ?!

  /////////////////////////////////////////////////////////////////////////////
  // SETTINGS
  /////////////////////////////////////////////////////////////////////////////

  function DefaultSettings(defaults) {
    var compability = Utils.getCompability();

    var cfg = {
      animations          : compability.css.animation,
      fullscreen          : true,
      desktopMargin       : 5,
      wallpaper           : 'osjs:///themes/wallpapers/wallpaper.png',
      icon                : 'osjs-white.png',
      backgroundColor     : '#572a79',
      fontFamily          : 'Karla',
      theme               : 'default',
      icons               : 'default',
      sounds              : 'default',
      background          : 'image-fill',
      windowCornerSnap    : 0,
      windowSnap          : 0,
      useTouchMenu        : compability.touch,
      enableIconView      : false,
      enableSwitcher      : true,
      enableHotkeys       : true,
      enableSounds        : true,
      invertIconViewColor : false,
      moveOnResize        : true,       // Move windows into viewport on resize
      desktopIcons        : [],
      panels              : [
        {
          options: {
            position: 'top',
            ontop:    false,
            autohide: false,
            background: '#101010',
            foreground: '#ffffff',
            opacity: 85
          },
          items:    [
            {name: 'AppMenu', settings: {}},
            {name: 'Buttons', settings: {}},
            {name: 'WindowList', settings: {}},
            {name: 'NotificationArea', settings: {}},
            {name: 'Clock', settings: {}}
          ]
        }
      ]
    };

    if ( defaults ) {
      cfg = Utils.mergeObject(cfg, defaults);
    }

    return cfg;
  }

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications                          = OSjs.Applications || {};
  OSjs.Applications.CoreWM                   = OSjs.Applications.CoreWM || {};
  OSjs.Applications.CoreWM.DefaultSettings   = DefaultSettings;

})(OSjs.Core.WindowManager, OSjs.GUI, OSjs.Utils, OSjs.API, OSjs.VFS);

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
(function(WindowManager, Window, GUI, Utils, API, VFS) {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // SHORTCUT DIALOG
  /////////////////////////////////////////////////////////////////////////////

  function IconViewShortcutDialog(item, scheme, closeCallback) {
    Window.apply(this, ['IconViewShortcutDialog', {
      title: 'Clock Settings',
      icon: 'status/appointment-soon.png',
      width: 400,
      height: 200,
      allow_maximize: false,
      allow_resize: false,
      allow_minimize: false
    }]);

    this.scheme = scheme;
    this.item = Utils.cloneObject(item);
    this.cb = closeCallback || function() {};
  }

  IconViewShortcutDialog.prototype = Object.create(Window.prototype);
  IconViewShortcutDialog.constructor = Window;

  IconViewShortcutDialog.prototype.init = function(wm, app) {
    var self = this;
    var root = Window.prototype.init.apply(this, arguments);
    this.scheme.render(this, this._name);

    this.scheme.find(this, 'InputShortcutLaunch').set('value', this.item.data.launch);
    this.scheme.find(this, 'InputTooltipFormatString').set('value', JSON.stringify(this.item.data.args || {}));

    this.scheme.find(this, 'ButtonApply').on('click', function() {
      self.applySettings();
      self._close('ok');
    });

    this.scheme.find(this, 'ButtonCancel').on('click', function() {
      self._close();
    });

    return root;
  };

  IconViewShortcutDialog.prototype.applySettings = function() {
    this.item.data.launch = this.scheme.find(this, 'InputShortcutLaunch').get('value');
    this.item.data.args = JSON.parse(this.scheme.find(this, 'InputTooltipFormatString').get('value') || null);
  };

  IconViewShortcutDialog.prototype._close = function(button) {
    this.cb(button, this.item);
    return Window.prototype._close.apply(this, arguments);
  };

  IconViewShortcutDialog.prototype._destroy = function() {
    this.scheme = null;
    return Window.prototype._destroy.apply(this, arguments);
  };

  /////////////////////////////////////////////////////////////////////////////
  // ICON VIEW
  /////////////////////////////////////////////////////////////////////////////

  function DesktopIconView(wm) {
    var self = this;

    this.dialog = null;
    this.$element = document.createElement('gui-icon-view');
    this.$element.setAttribute('data-multiple', 'false');
    this.$element.setAttribute('no-selection', 'true');
    this.$element.id = 'CoreWMDesktopIconView';

    GUI.Elements['gui-icon-view'].build(this.$element);

    GUI.Helpers.createDroppable(this.$element, {
      onOver: function(ev, el, args) {
        wm.onDropOver(ev, el, args);
      },

      onLeave : function() {
        wm.onDropLeave();
      },

      onDrop : function() {
        wm.onDrop();
      },

      onItemDropped: function(ev, el, item, args) {
        wm.onDropItem(ev, el, item, args);
      },

      onFilesDropped: function(ev, el, files, args) {
        wm.onDropFile(ev, el, files, args);
      }
    });

    var cel = new GUI.ElementDataView(this.$element);
    cel.on('activate', function(ev) {
      if ( ev && ev.detail ) {
        ev.detail.entries.forEach(function(entry) {
          var item = entry.data;
          if ( item.launch ) {
            API.launch(item.launch, item.args);
          } else {
            var file = new VFS.File(item);
            API.open(file);
          }
        });
      }
    });

    var defaults = [{
      icon: API.getIcon('places/folder_home.png', '32x32'),
      label: 'Home',
      value: {
        restricted: true,
        launch: 'ApplicationFileManager',
        args: {path: 'home:///'}
      }
    }];

    cel.on('contextmenu', function(ev) {
      if ( ev && ev.detail && ev.detail.entries ) {
        self.createContextMenu(ev.detail.entries[0], {x: ev.detail.x, y: ev.detail.y});
      }
    });

    cel.add(defaults);

    var icons = wm.getSetting('desktopIcons') || [];
    icons.forEach(function(icon) {
      self.addShortcut(icon, wm);
    });

    this.resize(wm);
  }

  DesktopIconView.prototype.destroy = function() {
    Utils.$remove(this.$element);
    this.$element = null;

    if ( this.dialog ) {
      this.dialog.destroy();
    }
    this.dialog = null;
  };

  DesktopIconView.prototype.blur = function() {
    var cel = new GUI.ElementDataView(this.$element);
    cel.set('value', null);
  };

  DesktopIconView.prototype.getRoot = function() {
    return this.$element;
  };

  DesktopIconView.prototype.resize = function(wm) {
    var el = this.getRoot();
    var s  = wm.getWindowSpace();

    if ( el ) {
      el.style.top    = (s.top) + 'px';
      el.style.left   = (s.left) + 'px';
      el.style.width  = (s.width) + 'px';
      el.style.height = (s.height) + 'px';
    }
  };

  DesktopIconView.prototype._save = function() {
    var cel = new GUI.ElementDataView(this.$element);
    var icons = [];
    try {
      var entries = cel.querySelectorAll('gui-icon-view-entry');

      entries.forEach(function(e) {
        var val = e.getAttribute('data-value');
        var value = null;
        try {
          value = JSON.parse(val);
        } catch ( exc ) {
        }
        if ( value !== null && !value.restricted ) {
          icons.push(value);
        }
      });
    } catch ( e ) {
      console.warn(e.stack, e);
    }

    console.warn(icons);

    var wm = OSjs.Core.getWindowManager();
    wm.applySettings({
      desktopIcons: icons
    }, false, true);
  };

  DesktopIconView.prototype.updateShortcut = function(data) {
    var cel = new GUI.ElementDataView(this.$element);
    var entries = cel.querySelectorAll('gui-icon-view-entry');

    if ( entries[data.index] ) {
      entries[data.index].setAttribute('data-value', JSON.stringify(data.data));
      this._save();
    }
  };

  DesktopIconView.prototype.addShortcut = function(data, wm, save) {
    var cel = new GUI.ElementDataView(this.$element);
    var iter = {};

    // TODO: Check for duplicates

    try {
      if ( data.mime === 'osjs/application' || data.launch ) {
        var appname = data.launch || Utils.filename(data.path);
        var meta = OSjs.Core.getPackageManager().getPackage(appname);

        iter = {
          icon: API.getIcon(meta.icon, '32x32', appname),
          id: appname,
          label: meta.name,
          value: {
            launch: appname,
            args: data.args || {}
          }
        };
      } else {
        iter = {
          icon: API.getFileIcon(data, '32x32'),
          id: data.filename,
          label: data.filename,
          value: {
            filename: data.filename,
            path: data.path,
            type: data.type,
            mime: data.mime
          }
        };
      }

      cel.add(iter);

      if ( save ) {
        this._save();
      }
    } catch ( e ) {
      console.warn(e, e.stack);
    }
  };

  DesktopIconView.prototype.createContextMenu = function(item, ev) {
    var self = this;

    var menu = [{
      title: OSjs.Applications.CoreWM._('Remove shortcut'),
      disabled: item.data.restricted,
      onClick: function() {
        if ( !item.data.restricted ) {
          self.removeShortcut(item);
        }
      }
    }];

    if ( item.data.launch ) {
      menu.push({
        title: OSjs.Applications.CoreWM._('Edit shortcut'),
        disabled: item.data.restricted,
        onClick: function() {
          if ( !item.data.restricted ) {
            self.openShortcutEdit(item);
          }
        }
      });
    }

    if ( menu.length )  {
      API.createMenu(menu, ev);
    }
  };

  DesktopIconView.prototype.removeShortcut = function(data, wm) {
    var cel = new GUI.ElementDataView(this.$element);
    cel.remove(data.index);
    this._save();
  };

  DesktopIconView.prototype.removeShortcutByPath = function(path) {
    var cel = new GUI.ElementDataView(this.$element);
    var self = this;
    try {
      var entries = cel.querySelectorAll('gui-icon-view-entry');
      entries.forEach(function(e, idx) {
        var value = JSON.parse(e.getAttribute('data-value'));
        if ( value.path === path ) {
          self.removeShortcut({index: idx});
        }
      });
    } catch ( e ) {
      console.warn(e.stack, e);
    }
  };

  DesktopIconView.prototype.openShortcutEdit = function(item) {
    if ( this.dialog ) {
      this.dialog._close();
    }

    var self = this;
    var wm = OSjs.Core.getWindowManager();

    this.dialog = new IconViewShortcutDialog(item, wm.scheme, function(button, values) {
      if ( button === 'ok' ) {
        self.updateShortcut(values);
      }
      self.dialog = null;
    });

    wm.addWindow(this.dialog, true);
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications                          = OSjs.Applications || {};
  OSjs.Applications.CoreWM                   = OSjs.Applications.CoreWM || {};
  OSjs.Applications.CoreWM.DesktopIconView   = DesktopIconView;

})(OSjs.Core.WindowManager, OSjs.Core.Window, OSjs.GUI, OSjs.Utils, OSjs.API, OSjs.VFS);

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
(function(WindowManager, Window, GUI, Utils, API, VFS) {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // Window Switcher
  /////////////////////////////////////////////////////////////////////////////

  var WindowSwitcher = function() {
    this.$switcher      = null;
    this.showing        = false;
    this.index          = -1;
    this.winRef         = null;
  };

  WindowSwitcher.prototype.destroy = function() {
    this._remove();
  };

  WindowSwitcher.prototype._remove = function() {
    if ( this.$switcher ) {
      if ( this.$switcher.parentNode ) {
        this.$switcher.parentNode.removeChild(this.$switcher);
      }
      this.$switcher = null;
    }
  };

  WindowSwitcher.prototype.show = function(ev, win, wm) {
    win = win || wm.getLastWindow();

    ev.preventDefault();

    var height = 0;
    var items  = [];
    var total  = 0;
    var index  = 0;

    // Render
    if ( !this.$switcher ) {
      this.$switcher = document.createElement('corewm-window-switcher');
    } else {
      Utils.$empty(this.$switcher);
    }

    var container, image, label, iter;
    for ( var i = 0; i < wm._windows.length; i++ ) {
      iter = wm._windows[i];
      if ( iter ) {
        container       = document.createElement('div');

        image           = document.createElement('img');
        image.src       = iter._icon;

        label           = document.createElement('span');
        label.innerHTML = iter._title;

        container.appendChild(image);
        container.appendChild(label);
        this.$switcher.appendChild(container);

        height += 32; // FIXME: We can automatically calculate this

        if ( win && win._wid === iter._wid ) {
          index = i;
        }

        items.push({
          element: container,
          win: iter
        });
      }
    }

    if ( !this.$switcher.parentNode ) {
      document.body.appendChild(this.$switcher);
    }

    this.$switcher.style.height    = height + 'px';
    this.$switcher.style.marginTop = (height ? -((height / 2) << 0) : 0) + 'px';

    // Select
    if ( this.showing ) {
      this.index++;
      if ( this.index > (items.length - 1) ) {
        this.index = -1;
      }
    } else {
      this.index = index;
      this.showing = true;
    }

    console.debug('WindowSwitcher::show()', this.index);

    if ( items[this.index] ) {
      items[this.index].element.className = 'Active';
      this.winRef = items[this.index].win;
    } else {
      this.winRef = null;
    }
  };

  WindowSwitcher.prototype.hide = function(ev, win, wm) {
    if ( !this.showing ) { return; }

    ev.preventDefault();

    this._remove();

    win = this.winRef || win;
    if ( win ) {
      win._focus();
    }

    this.winRef  = null;
    this.index   = -1;
    this.showing = false;
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications                          = OSjs.Applications || {};
  OSjs.Applications.CoreWM                   = OSjs.Applications.CoreWM || {};
  OSjs.Applications.CoreWM.WindowSwitcher    = WindowSwitcher;

})(OSjs.Core.WindowManager, OSjs.Core.Window, OSjs.GUI, OSjs.Utils, OSjs.API, OSjs.VFS);

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
(function(WindowManager, Window, GUI, Utils, API, VFS) {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // PANEL ITEM DIALOG
  /////////////////////////////////////////////////////////////////////////////

  function PanelItemDialog(name, args, settings, scheme, closeCallback) {
    this._closeCallback = closeCallback || function() {};
    this._settings = settings;
    this.scheme = scheme;

    Window.apply(this, [name, args]);
  }

  PanelItemDialog.prototype = Object.create(Window.prototype);
  PanelItemDialog.constructor = Window;

  PanelItemDialog.prototype.init = function(wm, app) {
    var self = this;
    var root = Window.prototype.init.apply(this, arguments);
    this.scheme.render(this, this._name);

    this.scheme.find(this, 'ButtonApply').on('click', function() {
      self.applySettings();
      self._close('ok');
    });

    this.scheme.find(this, 'ButtonCancel').on('click', function() {
      self._close();
    });

    return root;
  };

  PanelItemDialog.prototype.applySettings = function() {
  };

  PanelItemDialog.prototype._close = function(button) {
    this._closeCallback(button);
    return Window.prototype._close.apply(this, arguments);
  };

  PanelItemDialog.prototype._destroy = function() {
    this.scheme = null;
    this._settings = null;

    return Window.prototype._destroy.apply(this, arguments);
  };

  /////////////////////////////////////////////////////////////////////////////
  // PANELS
  /////////////////////////////////////////////////////////////////////////////

  var PANEL_SHOW_TIMEOUT = 150;
  var PANEL_HIDE_TIMEOUT = 600;

  var Panel = function(name, options, wm) {
    options = options || {};

    this._name = name;
    this._$element = null;
    this._$container = null;
    this._items = [];
    this._outtimeout = null;
    this._intimeout = null;
    this._outEvent = null;
    this._options = options.mergeDefaults({
      position: 'top'
    });

    console.debug('Panel::construct()', this._name, this._options.get());
  };

  Panel.prototype.init = function(root) {
    var self = this;
    var wm = OSjs.Core.getWindowManager();

    function createMenu(ev) {
      var menu = [
        {title: OSjs.Applications.CoreWM._('Open Panel Settings'), onClick: function(ev) {
          wm.showSettings('panel');
        }}
      ];

      if ( wm.getSetting('useTouchMenu') === true ) {
        menu.push({title: OSjs.Applications.CoreWM._('Turn off TouchMenu'), onClick: function(ev) {
          wm.applySettings({useTouchMenu: false}, false, true);
        }});
      } else {
        menu.push({title: OSjs.Applications.CoreWM._('Turn on TouchMenu'), onClick: function(ev) {
          wm.applySettings({useTouchMenu: true}, false, true);
        }});
      }

      API.createMenu(menu, ev);
    }

    this._$container = document.createElement('corewm-panel-container');
    this._$element = document.createElement('corewm-panel');
    this._$element.setAttribute('role', 'toolbar');

    Utils.$bind(this._$element, 'mousedown', function(ev) {
      ev.preventDefault();
    });
    Utils.$bind(this._$element, 'mouseover', function(ev) {
      self.onMouseOver(ev);
    });
    Utils.$bind(this._$element, 'mouseout', function(ev) {
      self.onMouseOut(ev);
    });
    Utils.$bind(this._$element, 'click', function(ev) {
      OSjs.API.blurMenu();
    });
    Utils.$bind(this._$element, 'contextmenu', function(ev) {
      createMenu(ev);
    });

    this._outEvent = Utils.$bind(document, 'mouseout', function(ev) {
      self.onMouseLeave(ev);
    }, false);

    this._$element.appendChild(this._$container);
    root.appendChild(this._$element);

    setTimeout(function() {
      self.update();
    }, 0);
  };

  Panel.prototype.destroy = function() {
    this._clearTimeouts();
    this._outEvent = Utils.$unbind(this._outEvent);

    this._items.forEach(function(item) {
      item.destroy();
    });
    this._items = [];
    this._$element = Utils.$remove(this._$element);
    this._$container = null;
  };

  Panel.prototype.update = function(options) {
    options = options || this._options.get();

    // CSS IS SET IN THE WINDOW MANAGER!
    var self = this;
    var attrs = {
      ontop: !!options.ontop,
      position: options.position || 'bottom'
    };

    if ( options.autohide ) {
      this.onMouseOut();
    }
    if ( this._$element ) {
      Object.keys(attrs).forEach(function(k) {
        self._$element.setAttribute('data-' + k, typeof attrs[k] === 'boolean' ? (attrs[k] ? 'true' : 'false') : attrs[k]);
      });
    }
    this._options.set(null, options);
  };

  Panel.prototype.autohide = function(hide) {
    if ( !this._options.get('autohide') || !this._$element ) {
      return;
    }

    if ( hide ) {
      this._$element.setAttribute('data-autohide', 'true');
    } else {
      this._$element.setAttribute('data-autohide', 'false');
    }
  };

  Panel.prototype._clearTimeouts = function() {
    if ( this._outtimeout ) {
      clearTimeout(this._outtimeout);
      this._outtimeout = null;
    }
    if ( this._intimeout ) {
      clearTimeout(this._intimeout);
      this._intimeout = null;
    }
  };

  Panel.prototype.onMouseLeave = function(ev) {
    var from = ev.relatedTarget || ev.toElement;
    if ( !from || from.nodeName === 'HTML' ) {
      this.onMouseOut(ev);
    }
  };

  Panel.prototype.onMouseOver = function() {
    var self = this;
    this._clearTimeouts();
    this._intimeout = setTimeout(function() {
      self.autohide(false);
    }, PANEL_SHOW_TIMEOUT);
  };

  Panel.prototype.onMouseOut = function() {
    var self = this;
    this._clearTimeouts();
    this._outtimeout = setTimeout(function() {
      self.autohide(true);
    }, PANEL_HIDE_TIMEOUT);
  };

  Panel.prototype.addItem = function(item) {
    if ( !(item instanceof OSjs.Applications.CoreWM.PanelItem) ) {
      throw 'Expected a PanelItem in Panel::addItem()';
    }

    this._items.push(item);
    this._$container.appendChild(item.init());
  };

  Panel.prototype.getItemByType = function(type) {
    return this.getItem(type);
  };

  Panel.prototype.getItemsByType = function(type) {
    return this.getItem(type, true);
  };

  Panel.prototype.getItem = function(type, multiple) {
    var result = multiple ? [] : null;

    this._items.forEach(function(item, idx) {
      if ( item instanceof type ) {
        if ( multiple ) {
          result.push(item);
        } else {
          result = item;
          return false;
        }
      }
      return true;
    });

    return result;
  };

  Panel.prototype.getOntop = function() {
    return this._options.get('ontop');
  };

  Panel.prototype.getPosition = function(pos) {
    return pos ? (this._options.get('position') === pos) : this._options.get('position');
  };

  Panel.prototype.getAutohide = function() {
    return this._options.get('autohide');
  };

  Panel.prototype.getRoot = function() {
    return this._$element;
  };

  Panel.prototype.getHeight = function() {
    return this._$element ? this._$element.offsetHeight : 0;
  };

  /////////////////////////////////////////////////////////////////////////////
  // PANEL ITEM
  /////////////////////////////////////////////////////////////////////////////

  var PanelItem = function(className, itemName, settings, defaults) {
    this._$root = null;
    this._className = className || 'Unknown';
    this._itemName = itemName || className.split(' ')[0];
    this._settings = null;
    this._settingsDialog = null;

    if ( settings && (settings instanceof OSjs.Helpers.SettingsFragment) && defaults ) {
      this._settings = settings.mergeDefaults(defaults);
    }
  };

  PanelItem.Name = 'PanelItem'; // Static name
  PanelItem.Description = 'PanelItem Description'; // Static description
  PanelItem.Icon = 'actions/stock_about.png'; // Static icon
  PanelItem.HasOptions = false;

  PanelItem.prototype.init = function() {
    var self = this;

    this._$root = document.createElement('corewm-panel-item');
    this._$root.className = this._className;

    if ( this._settings ) {
      var title = 'Open ' + this._itemName + ' settings'; // FIXME: Locale
      Utils.$bind(this._$root, 'contextmenu', function(ev) {
        ev.stopPropagation();
        ev.preventDefault();

        API.createMenu([{
          title: title,
          onClick: function() {
            self.openSettings();
          }
        }], ev);
      });
    }

    return this._$root;
  };

  PanelItem.prototype.destroy = function() {
    if ( this._settingsDialog ) {
      this._settingsDialog.destroy();
    }
    this._settingsDialog = null;
    this._$root = Utils.$remove(this._$root);
  };

  PanelItem.prototype.applySettings = function() {
  };

  PanelItem.prototype.openSettings = function(DialogRef, args) {
    if ( this._settingsDialog ) {
      this._settingsDialog._restore();
      return false;
    }

    var self = this;
    var wm = OSjs.Core.getWindowManager();

    if ( DialogRef ) {
      this._settingsDialog = new DialogRef(this, wm.scheme, function(button) {
        if ( button === 'ok' ) {
          self.applySettings();
        }
        self._settingsDialog = null;
      });

      OSjs.Core.getWindowManager().addWindow(this._settingsDialog, true);
    }
  };

  PanelItem.prototype.getRoot = function() {
    return this._$root;
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications                          = OSjs.Applications || {};
  OSjs.Applications.CoreWM                   = OSjs.Applications.CoreWM || {};
  OSjs.Applications.CoreWM.Panel             = Panel;
  OSjs.Applications.CoreWM.PanelItem         = PanelItem;
  OSjs.Applications.CoreWM.PanelItemDialog   = PanelItemDialog;

})(OSjs.Core.WindowManager, OSjs.Core.Window, OSjs.GUI, OSjs.Utils, OSjs.API, OSjs.VFS);

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
(function(CoreWM, Panel, PanelItem, Utils, API, GUI, VFS) {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // ITEM
  /////////////////////////////////////////////////////////////////////////////

  /**
   * PanelItem: Buttons
   */
  var PanelItemButtons = function(settings) {
    PanelItem.apply(this, ['PanelItemButtons PanelItemFill', 'Buttons', settings, {
      buttons: [
        {
          title: API._('LBL_SETTINGS'),
          icon: 'categories/applications-system.png',
          launch: 'ApplicationSettings'
        }
      ]
    }]);

    this.$container = null;
  };

  PanelItemButtons.prototype = Object.create(PanelItem.prototype);
  PanelItemButtons.Name = 'Buttons'; // Static name
  PanelItemButtons.Description = 'Button Bar'; // Static description
  PanelItemButtons.Icon = 'actions/stock_about.png'; // Static icon

  PanelItemButtons.prototype.init = function() {
    var self = this;
    var root = PanelItem.prototype.init.apply(this, arguments);

    this.$container = document.createElement('ul');
    this.$container.setAttribute('role', 'toolbar');
    root.appendChild(this.$container);

    this.renderButtons();

    var ghost;
    var lastTarget;
    var removeTimeout;
    var lastPadding = null;

    function clearGhost() {
      removeTimeout = clearTimeout(removeTimeout);
      ghost = Utils.$remove(ghost);
      lastTarget = null;
      if ( lastPadding !== null ) {
        self.$container.style.paddingRight = lastPadding;
      }
    }

    function createGhost(target) {
      if ( !target || !target.parentNode ) {
        return;
      }
      if ( target.tagName !== 'LI' && target.tagName !== 'UL' ) {
        return;
      }

      if ( lastPadding === null ) {
        lastPadding = self.$container.style.paddingRight;
      }

      if ( target !== lastTarget ) {
        clearGhost();

        ghost = document.createElement('li');
        ghost.className = 'Button Ghost';

        if ( target.tagName === 'LI' ) {
          try {
            target.parentNode.insertBefore(ghost, target);
          } catch ( e ) {}
        } else {
          target.appendChild(ghost);
        }
      }
      lastTarget = target;

      self.$container.style.paddingRight = '16px';
    }

    GUI.Helpers.createDroppable(this.$container, {
      onOver: function(ev, el, args) {
        if ( ev.target && !Utils.$hasClass(ev.target, 'Ghost') ) {
          createGhost(ev.target);
        }
      },

      onLeave : function() {
        clearTimeout(removeTimeout);
        removeTimeout = setTimeout(function() {
          clearGhost();
        }, 1000);

        //        clearGhost();
      },

      onDrop : function() {
        clearGhost();
      },

      onItemDropped: function(ev, el, item, args) {
        if ( item && item.data && item.data.mime === 'osjs/application' ) {
          var appName = item.data.path.split('applications:///')[1];
          self.createButton(appName);
        }
        clearGhost();
      },

      onFilesDropped: function(ev, el, files, args) {
        clearGhost();
      }
    });

    return root;
  };

  PanelItemButtons.prototype.destroy = function() {
    this.$container = null;
    PanelItem.prototype.destroy.apply(this, arguments);
  };

  PanelItemButtons.prototype.clearButtons = function() {
    Utils.$empty(this.$container);
  };

  PanelItemButtons.prototype.renderButtons = function() {
    var self = this;
    var systemButtons = {
      applications: function(ev) {
        OSjs.Applications.CoreWM.showMenu(ev);
      },
      settings: function(ev) {
        var wm = OSjs.Core.getWindowManager();
        if ( wm ) {
          wm.showSettings();
        }
      },
      exit: function(ev) {
        OSjs.API.signOut();
      }
    };

    this.clearButtons();

    (this._settings.get('buttons') || []).forEach(function(btn, idx) {
      var menu = [{
        title: 'Remove button',
        onClick: function() {
          self.removeButton(idx);
        }
      }];
      var callback = function() {
        API.launch(btn.launch);
      };

      if ( btn.system ) {
        menu = null; //systemMenu;
        callback = function(ev) {
          ev.stopPropagation();
          systemButtons[btn.system](ev);
        };
      }

      self.addButton(btn.title, btn.icon, menu, callback);
    });
  };

  PanelItemButtons.prototype.removeButton = function(index) {
    var buttons = this._settings.get('buttons');
    buttons.splice(index, 1);
    this.renderButtons();

    this._settings.save();
  };

  PanelItemButtons.prototype.createButton = function(appName) {
    var pkg = OSjs.Core.getPackageManager().getPackage(appName);
    var buttons = this._settings.get('buttons');
    buttons.push({
      title: appName,
      icon: pkg.icon,
      launch: appName
    });

    this.renderButtons();

    this._settings.save();
  };

  PanelItemButtons.prototype.addButton = function(title, icon, menu, callback) {
    var sel = document.createElement('li');
    sel.className = 'Button';
    sel.title = title;
    sel.innerHTML = '<img alt="" src="' + API.getIcon(icon) + '" />';
    sel.setAttribute('role', 'button');
    sel.setAttribute('aria-label', title);

    Utils.$bind(sel, 'click', callback);
    Utils.$bind(sel, 'contextmenu', function(ev) {
      ev.preventDefault();
      ev.stopPropagation();
      if ( menu ) {
        API.createMenu(menu, ev);
      }
    });

    this.$container.appendChild(sel);
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications                                    = OSjs.Applications || {};
  OSjs.Applications.CoreWM                             = OSjs.Applications.CoreWM || {};
  OSjs.Applications.CoreWM.PanelItems                  = OSjs.Applications.CoreWM.PanelItems || {};
  OSjs.Applications.CoreWM.PanelItems.Buttons          = PanelItemButtons;

})(OSjs.Applications.CoreWM.Class, OSjs.Applications.CoreWM.Panel, OSjs.Applications.CoreWM.PanelItem, OSjs.Utils, OSjs.API, OSjs.GUI, OSjs.VFS);

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
(function(CoreWM, Panel, PanelItem, PanelItemDialog, Utils, API, VFS, GUI, Window) {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // Clock Settings Dialog
  /////////////////////////////////////////////////////////////////////////////

  function ClockSettingsDialog(panelItem, scheme, closeCallback) {
    PanelItemDialog.apply(this, ['ClockSettingsDialog', {
      title: 'Clock Settings',
      icon: 'status/appointment-soon.png',
      width: 400,
      height: 280
    }, panelItem._settings, scheme, closeCallback]);
  }

  ClockSettingsDialog.prototype = Object.create(PanelItemDialog.prototype);
  ClockSettingsDialog.constructor = PanelItemDialog;

  ClockSettingsDialog.prototype.init = function(wm, app) {
    var root = PanelItemDialog.prototype.init.apply(this, arguments);
    this.scheme.find(this, 'InputUseUTC').set('value', this._settings.get('utc'));
    this.scheme.find(this, 'InputInterval').set('value', String(this._settings.get('interval')));
    this.scheme.find(this, 'InputTimeFormatString').set('value', this._settings.get('format'));
    this.scheme.find(this, 'InputTooltipFormatString').set('value', this._settings.get('tooltip'));
    return root;
  };

  ClockSettingsDialog.prototype.applySettings = function() {
    this._settings.set('utc', this.scheme.find(this, 'InputUseUTC').get('value'));
    this._settings.set('interval', parseInt(this.scheme.find(this, 'InputInterval').get('value'), 10));
    this._settings.set('format', this.scheme.find(this, 'InputTimeFormatString').get('value'), true);
    this._settings.set('tooltip', this.scheme.find(this, 'InputTooltipFormatString').get('value'), true);
  };

  /////////////////////////////////////////////////////////////////////////////
  // ITEM
  /////////////////////////////////////////////////////////////////////////////

  /**
   * PanelItem: Clock
   */
  var PanelItemClock = function(settings) {
    PanelItem.apply(this, ['PanelItemClock PanelItemFill PanelItemRight', 'Clock', settings, {
      utc: false,
      interval: 1000,
      format: 'H:i:s',
      tooltip: 'l, j F Y'
    }]);
    this.clockInterval  = null;
    this.$clock = null;
  };

  PanelItemClock.prototype = Object.create(PanelItem.prototype);
  PanelItemClock.Name = 'Clock'; // Static name
  PanelItemClock.Description = 'View the time'; // Static description
  PanelItemClock.Icon = 'status/appointment-soon.png'; // Static icon
  PanelItemClock.HasOptions = true;

  PanelItemClock.prototype.createInterval = function() {
    var self = this;
    var clock = this.$clock;
    var timeFmt = this._settings.get('format');
    var tooltipFmt = this._settings.get('tooltip');

    function update() {
      if ( clock ) {
        var now = new Date();
        var t = OSjs.Helpers.Date.format(now, timeFmt);
        var d = OSjs.Helpers.Date.format(now, tooltipFmt);
        Utils.$empty(clock);
        clock.appendChild(document.createTextNode(t));
        clock.setAttribute('aria-label', String(t));
        clock.title = d;
      }
    }

    function create(interval) {
      clearInterval(self.clockInterval);
      self.clockInterval = setInterval(function() {
        update();
      }, interval);
    }

    create(this._settings.get('interval'));
    update();
  };

  PanelItemClock.prototype.init = function() {
    var root = PanelItem.prototype.init.apply(this, arguments);

    this.$clock = document.createElement('div');
    this.$clock.innerHTML = '00:00:00';
    root.setAttribute('role', 'button');
    root.appendChild(this.$clock);

    this.createInterval();

    return root;
  };

  PanelItemClock.prototype.applySettings = function() {
    this.createInterval();
  };

  PanelItemClock.prototype.openSettings = function() {
    PanelItem.prototype.openSettings.call(this, ClockSettingsDialog, {});
  };

  PanelItemClock.prototype.destroy = function() {
    this.clockInterval = clearInterval(this.clockInterval);
    PanelItem.prototype.destroy.apply(this, arguments);
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications                                    = OSjs.Applications || {};
  OSjs.Applications.CoreWM                             = OSjs.Applications.CoreWM || {};
  OSjs.Applications.CoreWM.PanelItems                  = OSjs.Applications.CoreWM.PanelItems || {};
  OSjs.Applications.CoreWM.PanelItems.Clock            = PanelItemClock;

})(
  OSjs.Applications.CoreWM.Class,
  OSjs.Applications.CoreWM.Panel,
  OSjs.Applications.CoreWM.PanelItem,
  OSjs.Applications.CoreWM.PanelItemDialog,
  OSjs.Utils, OSjs.API, OSjs.VFS, OSjs.GUI, OSjs.Core.Window);

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
(function(CoreWM, Panel, PanelItem, Utils, API, VFS) {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // ITEM
  /////////////////////////////////////////////////////////////////////////////

  var NotificationAreaItem = function(name, opts) {
    opts = opts || {};

    this.name           = name;
    this.opts           = opts;
    this.$container     = document.createElement('div');
    this.$image         = (opts.image || opts.icon) ? document.createElement('img') : null;
    this.onCreated      = opts.onCreated     || function() {};
    this.onInited       = opts.onInited      || function() {};
    this.onDestroy      = opts.onDestroy     || function() {};
    this.onClick        = opts.onClick       || function() {};
    this.onContextMenu  = opts.onContextMenu || function() {};
    this.evClick        = null;
    this.evMenu         = null;

    this._build(name);
    this.onCreated.call(this);
  };

  NotificationAreaItem.prototype._build = function(name) {
    var self = this;
    var classNames = ['NotificationArea', 'NotificationArea_' + name];
    if ( this.opts.className ) {
      classNames.push(this.opts.className);
    }

    this.$container.className = classNames.join(' ');
    this.$container.setAttribute('role', 'button');
    this.$container.setAttribute('aria-label', this.opts.title);

    if ( this.opts.tooltip ) {
      this.$container.title = this.opts.tooltip;
    }

    this.evClick = Utils.$bind(this.$container, 'click', function(ev) {
      ev.stopPropagation();
      ev.preventDefault();
      OSjs.API.blurMenu();
      self.onClick.apply(self, arguments);
      return false;
    });

    this.evMenu = Utils.$bind(this.$container, 'contextmenu', function(ev) {
      ev.stopPropagation();
      ev.preventDefault();
      OSjs.API.blurMenu();
      self.onContextMenu.apply(self, arguments);
      return false;
    });

    if ( this.$image ) {
      this.$image.title = this.opts.title || '';
      this.$image.src   = (this.opts.image || this.opts.icon || 'about:blank');
      this.$container.appendChild(this.$image);
    }

    this.$container.appendChild(document.createElement('div'));
  };

  NotificationAreaItem.prototype.init = function(root) {
    root.appendChild(this.$container);

    try {
      this.onInited.call(this, this.$container, this.$image);
    } catch ( e ) {
      console.warn('NotificationAreaItem', 'onInited error');
      console.warn(e, e.stack);
    }
  };

  NotificationAreaItem.prototype.setIcon = function(src) {
    return this.setImage(src);
  };

  NotificationAreaItem.prototype.setImage = function(src) {
    if ( this.$image ) {
      this.$image.src = src;
    }
    this.opts.image = src;
  };

  NotificationAreaItem.prototype.setTitle = function(title) {
    if ( this.$image ) {
      this.$image.title = title;
    }
    this.opts.title = title;
  };

  NotificationAreaItem.prototype.destroy = function() {
    if ( this.evClick ) {
      this.evClick = Utils.$unbind(this.evClick);
    }
    if ( this.evMenu ) {
      this.evMenu = Utils.$unbind(this.evMenu);
    }
    this.onDestroy.call(this);

    this.$image     = Utils.$remove(this.$image);
    this.$container = Utils.$remove(this.$container);
  };

  // NOTE: This is a workaround for resetting items on panel change
  var _restartFix = {};

  /**
   * PanelItem: NotificationArea
   */
  var PanelItemNotificationArea = function() {
    PanelItem.apply(this, ['PanelItemNotificationArea PanelItemFill PanelItemRight']);
    this.notifications = {};
  };

  PanelItemNotificationArea.prototype = Object.create(PanelItem.prototype);
  PanelItemNotificationArea.Name = 'NotificationArea'; // Static name
  PanelItemNotificationArea.Description = 'View notifications'; // Static description
  PanelItemNotificationArea.Icon = 'apps/gnome-panel-notification-area.png'; // Static icon

  PanelItemNotificationArea.prototype.init = function() {
    var root = PanelItem.prototype.init.apply(this, arguments);
    root.setAttribute('role', 'toolbar');

    var fix = Object.keys(_restartFix);
    var self = this;
    if ( fix.length ) {
      fix.forEach(function(k) {
        self.createNotification(k, _restartFix[k]);
      });
    }

    return root;
  };

  PanelItemNotificationArea.prototype.createNotification = function(name, opts) {
    if ( this._$root ) {
      if ( !this.notifications[name] ) {
        var item = new NotificationAreaItem(name, opts);
        item.init(this._$root);
        this.notifications[name] = item;
        _restartFix[name] = opts;

        return item;
      }
    }
    return null;
  };

  PanelItemNotificationArea.prototype.removeNotification = function(name) {
    if ( this._$root ) {
      if ( this.notifications[name] ) {
        this.notifications[name].destroy();
        delete this.notifications[name];
        if ( _restartFix[name] ) {
          delete _restartFix[name];
        }
        return true;
      }
    }

    return false;
  };

  PanelItemNotificationArea.prototype.getNotification = function(name) {
    if ( this._$root ) {
      if ( this.notifications[name] ) {
        return this.notifications[name];
      }
    }
    return false;
  };

  PanelItemNotificationArea.prototype.destroy = function() {
    for ( var i in this.notifications ) {
      if ( this.notifications.hasOwnProperty(i) ) {
        if ( this.notifications[i] ) {
          this.notifications[i].destroy();
        }
        delete this.notifications[i];
      }
    }

    PanelItem.prototype.destroy.apply(this, arguments);
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications                                    = OSjs.Applications || {};
  OSjs.Applications.CoreWM                             = OSjs.Applications.CoreWM || {};
  OSjs.Applications.CoreWM.PanelItems                  = OSjs.Applications.CoreWM.PanelItems || {};
  OSjs.Applications.CoreWM.PanelItems.NotificationArea = PanelItemNotificationArea;

})(OSjs.Applications.CoreWM.Class, OSjs.Applications.CoreWM.Panel, OSjs.Applications.CoreWM.PanelItem, OSjs.Utils, OSjs.API, OSjs.VFS);

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
(function(CoreWM, Panel, PanelItem, Utils, API, GUI, VFS) {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // ITEM
  /////////////////////////////////////////////////////////////////////////////

  function WindowListEntry(win, className) {

    var el = document.createElement('li');
    el.className = className;
    el.title = win._title;
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', win._title);

    var img = document.createElement('img');
    img.alt = win._title;
    img.src = win._icon;

    var span = document.createElement('span');
    span.appendChild(document.createTextNode(win._title));

    el.appendChild(img);
    el.appendChild(span);

    this.evClick = Utils.$bind(el, 'click', function() {
      win._restore(false, true);
    });

    this.evMenu = Utils.$bind(el, 'contextmenu', function(ev) {
      ev.stopPropagation();
      return false;
    });

    var peeking = false;
    OSjs.GUI.Helpers.createDroppable(el, {
      onDrop: function(ev, el) {
        if ( win ) {
          win._focus();
        }
      },
      onLeave: function() {
        if ( peeking ) {
          peeking = false;
        }
      },
      onEnter: function(ev, inst, args) {
        if ( !peeking ) {
          if ( win ) {
            win._focus();
          }
          peeking = true;
        }
      },
      onItemDropped: function(ev, el, item, args) {
        if ( win ) {
          return win._onDndEvent(ev, 'itemDrop', item, args);
        }
        return false;
      },
      onFilesDropped: function(ev, el, files, args) {
        if ( win ) {
          return win._onDndEvent(ev, 'filesDrop', files, args);
        }
        return false;
      }
    });

    if ( win._state.focused ) {
      el.className += ' Focused';
    }

    this.$element = el;
    this.id = win._wid;
  }

  WindowListEntry.prototype.destroy = function() {
    if ( this.evClick ) {
      this.evClick = this.evClick.destroy();
    }

    if ( this.evMenu ) {
      this.evMenu = this.evMenu.destroy();
    }

    if ( this.$element ) {
      this.$element = Utils.$remove(this.$element);
    }
  };

  WindowListEntry.prototype.event = function(ev, win, parentEl) {
    var cn = 'WindowList_Window_' + win._wid;
    var el = this.$element;

    function _change(cn, callback) {
      var els = parentEl.getElementsByClassName(cn);
      if ( els.length ) {
        for ( var i = 0, l = els.length; i < l; i++ ) {
          if ( els[i] && els[i].parentNode ) {
            callback(els[i]);
          }
        }
      }
    }

    if ( ev === 'focus' ) {
      _change(cn, function(el) {
        el.className += ' Focused';
      });
    } else if ( ev === 'blur' ) {
      _change(cn, function(el) {
        el.className = el.className.replace(/\s?Focused/, '');
      });
    } else if ( ev === 'title' ) {
      _change(cn, function(el) {
        el.setAttribute('aria-label', win._title);

        var span = el.getElementsByTagName('span')[0];
        if ( span ) {
          Utils.$empty(span);
          span.appendChild(document.createTextNode(win._title));
        }
        var img = el.getElementsByTagName('img')[0];
        if ( img ) {
          img.alt = win._title;
        }
      });
    } else if ( ev === 'icon' ) {
      _change(cn, function(el) {
        el.getElementsByTagName('img')[0].src = win._icon;
      });
    } else if ( ev === 'attention_on' ) {
      _change(cn, function(el) {
        if ( !el.className.match(/Attention/) ) {
          el.className += ' Attention';
        }
      });
    } else if ( ev === 'attention_off' ) {
      _change(cn, function(el) {
        if ( !el.className.match(/Attention/) ) {
          el.className = el.className.replace(/\s?Attention/, '');
        }
      });
    } else if ( ev === 'close' ) {
      return false;
    }

    return true;
  };

  /**
   * PanelItem: WindowList
   */
  function PanelItemWindowList() {
    PanelItem.apply(this, ['PanelItemWindowList PanelItemWide']);
    this.$element = null;
    this.entries = [];
  }

  PanelItemWindowList.prototype = Object.create(PanelItem.prototype);
  PanelItemWindowList.Name = 'Window List'; // Static name
  PanelItemWindowList.Description = 'Toggle between open windows'; // Static description
  PanelItemWindowList.Icon = 'apps/xfwm4.png'; // Static icon

  PanelItemWindowList.prototype.init = function() {
    var root = PanelItem.prototype.init.apply(this, arguments);

    this.$element = document.createElement('ul');
    this.$element.setAttribute('role', 'toolbar');
    root.appendChild(this.$element);

    var wm = OSjs.Core.getWindowManager();
    if ( wm ) {
      var wins = wm.getWindows();
      for ( var i = 0; i < wins.length; i++ ) {
        if ( wins[i] ) {
          this.update('create', wins[i]);
        }
      }
    }

    return root;
  };

  PanelItemWindowList.prototype.destroy = function() {
    this.entries.forEach(function(e) {
      try {
        e.destroy();
      } catch ( e ) {}
      e = null;
    });

    this.entries = [];

    PanelItem.prototype.destroy.apply(this, arguments);
  };

  PanelItemWindowList.prototype.update = function(ev, win) {
    var self = this;
    if ( !this.$element || (win && win._properties.allow_windowlist === false) ) {
      return;
    }

    var entry = null;
    if ( ev === 'create' ) {
      var className = 'Button WindowList_Window_' + win._wid;
      if ( this.$element.getElementsByClassName(className).length ) {
        return;
      }

      entry = new WindowListEntry(win, className);
      this.entries.push(entry);
      this.$element.appendChild(entry.$element);
    } else {
      var found = -1;
      this.entries.forEach(function(e, idx) {
        if ( e.id === win._wid ) {
          found = idx;
        }
        return found !== -1;
      });

      entry = this.entries[found];
      if ( entry ) {
        if ( entry.event(ev, win, this.$element) === false ) {
          entry.destroy();

          this.entries.splice(found, 1);
        }
      }
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications                                    = OSjs.Applications || {};
  OSjs.Applications.CoreWM                             = OSjs.Applications.CoreWM || {};
  OSjs.Applications.CoreWM.PanelItems                  = OSjs.Applications.CoreWM.PanelItems || {};
  OSjs.Applications.CoreWM.PanelItems.WindowList       = PanelItemWindowList;

})(OSjs.Applications.CoreWM.Class, OSjs.Applications.CoreWM.Panel, OSjs.Applications.CoreWM.PanelItem, OSjs.Utils, OSjs.API, OSjs.GUI, OSjs.VFS);

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
(function(CoreWM, Panel, PanelItem, Utils, API, VFS) {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // ITEM
  /////////////////////////////////////////////////////////////////////////////

  /**
   * PanelItem: Weather
   */
  var PanelItemWeather = function() {
    var self = this;

    PanelItem.apply(this, ['PanelItemWeather PanelItemFill PanelItemRight']);

    this.clockInterval  = null;
    this.position = null;
    this.interval = null;

    if ( navigator.geolocation ) {
      navigator.geolocation.getCurrentPosition(function(pos) {
        self.position = pos;
        setTimeout(function() {
          self.updateWeather();
        }, 100);
      });
    }
  };

  PanelItemWeather.prototype = Object.create(PanelItem.prototype);
  PanelItemWeather.Name = 'Weather'; // Static name
  PanelItemWeather.Description = 'Weather notification'; // Static description
  PanelItemWeather.Icon = 'status/weather-few-clouds.png'; // Static icon

  PanelItemWeather.prototype.init = function() {
    var root = PanelItem.prototype.init.apply(this, arguments);
    this.updateWeather(root);
    return root;
  };

  PanelItemWeather.prototype.destroy = function() {
    this.interval = clearInterval(this.interval);
    PanelItem.prototype.destroy.apply(this, arguments);
  };

  PanelItemWeather.prototype.updateWeather = function(root) {
    var self = this;
    root = root || this._$element;

    if ( !root ) {
      return;
    }

    root.title = 'Not allowed or unavailable';

    var busy = false;

    function setImage(src) {
      root.style.background = 'transparent url(\'' + src + '\') no-repeat center center';
    }

    function setWeather(name, weather, main) {
      name = name || '<unknown location>';
      weather = weather || {};
      main = main || {};

      var desc = weather.description || '<unknown weather>';
      var temp = main.temp || '<unknown temp>';
      if ( main.temp ) {
        temp += 'C';
      }
      var icon = 'sunny.png';

      switch ( desc  ) {
        case 'clear sky':
          if ( weather.icon === '01n' ) {
            icon = 'weather-clear-night.png';
          } else {
            icon = 'weather-clear.png';
          }
          break;
        case 'few clouds':
          if ( weather.icon === '02n' ) {
            icon = 'weather-few-clouds-night.png';
          } else {
            icon = 'weather-few-clouds.png';
          }
          break;
        case 'scattered clouds':
        case 'broken clouds':
          icon = 'weather-overcast.png';
          break;
        case 'shower rain':
          icon = 'weather-showers.png';
          break;
        case 'rain':
          icon = 'weather-showers-scattered.png';
          break;
        case 'thunderstorm':
          icon = 'stock_weather-storm.png';
          break;
        case 'snow':
          icon = 'stock_weather-snow.png';
          break;
        case 'mist':
          icon = 'stock_weather-fog.png';
          break;
        default:
          if ( desc.match(/rain$/) ) {
            icon = 'weather-showers-scattered.png';
          }
          break;
      }

      var src = API.getIcon('status/' + icon);
      root.title = Utils.format('{0} - {1} - {2}', name, desc, temp);
      setImage(src);
    }

    function updateWeather() {
      if ( busy || !self.position ) {
        return;
      }
      busy = true;

      var lat = self.position.coords.latitude;
      var lon = self.position.coords.longitude;
      var unt = 'metric';
      var key = '4ea33327bcfa4ea0293b2d02b6fda385';
      var url = Utils.format('http://api.openweathermap.org/data/2.5/weather?lat={0}&lon={1}&units={2}&APPID={3}', lat, lon, unt, key);

      API.curl({
        url: url
      }, function(error, response) {
        if ( !error && response ) {
          var result = null;
          try {
            result = JSON.parse(response.body);
          } catch ( e ) {}

          if ( result ) {
            setWeather(result.name, result.weather ? result.weather[0] : null, result.main);
          }
        }

        busy = false;
      });
    }

    setImage(API.getIcon('status/weather-severe-alert.png'));

    this.interval = setInterval(function() {
      updateWeather();
    }, (60 * 60 * 1000));

    Utils.$bind(root, 'click', function() {
      updateWeather();
    });

    setTimeout(function() {
      updateWeather();
    }, 1000);
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications                                    = OSjs.Applications || {};
  OSjs.Applications.CoreWM                             = OSjs.Applications.CoreWM || {};
  OSjs.Applications.CoreWM.PanelItems                  = OSjs.Applications.CoreWM.PanelItems || {};
  OSjs.Applications.CoreWM.PanelItems.Weather          = PanelItemWeather;

})(OSjs.Applications.CoreWM.Class, OSjs.Applications.CoreWM.Panel, OSjs.Applications.CoreWM.PanelItem, OSjs.Utils, OSjs.API, OSjs.VFS);

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
(function(CoreWM, Panel, PanelItem, Utils, API, VFS) {
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // ITEM
  /////////////////////////////////////////////////////////////////////////////

  /**
   * PanelItem: AppMenu
   */
  var PanelItemAppMenu = function(settings) {
    PanelItem.apply(this, ['PanelItemAppMenu PanelItemFill', 'AppMenu', settings, {}]);
    this.$container = null;
  };

  PanelItemAppMenu.prototype = Object.create(PanelItem.prototype);
  PanelItemAppMenu.Name = 'AppMenu'; // Static name
  PanelItemAppMenu.Description = 'Application Menu'; // Static description
  PanelItemAppMenu.Icon = 'actions/stock_about.png'; // Static icon
  PanelItemAppMenu.HasOptions = false;

  PanelItemAppMenu.prototype.init = function() {
    var self = this;
    var root = PanelItem.prototype.init.apply(this, arguments);
    var wm = OSjs.Core.getWindowManager();

    this.$container = document.createElement('ul');
    root.appendChild(this.$container);

    var sel = document.createElement('li');
    sel.className = 'Button';
    sel.title = API._('LBL_APPLICATIONS');
    sel.innerHTML = '<img alt="" src="' + API.getIcon(wm.getSetting('icon') || 'osjs-white.png') + '" />';
    sel.setAttribute('role', 'button');
    sel.setAttribute('data-label', 'OS.js Application Menu');

    Utils.$bind(sel, 'click', function(ev) {
      ev.preventDefault();
      ev.stopPropagation();
      OSjs.Applications.CoreWM.showMenu(ev);
    });
    Utils.$bind(sel, 'contextmenu', function(ev) {
      ev.preventDefault();
      ev.stopPropagation();
    });

    this.$container.appendChild(sel);

    return root;
  };

  PanelItemAppMenu.prototype.destroy = function() {
    this.$container = null;
    PanelItem.prototype.destroy.apply(this, arguments);
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications                                    = OSjs.Applications || {};
  OSjs.Applications.CoreWM                             = OSjs.Applications.CoreWM || {};
  OSjs.Applications.CoreWM.PanelItems                  = OSjs.Applications.CoreWM.PanelItems || {};
  OSjs.Applications.CoreWM.PanelItems.AppMenu          = PanelItemAppMenu;

})(OSjs.Applications.CoreWM.Class, OSjs.Applications.CoreWM.Panel, OSjs.Applications.CoreWM.PanelItem, OSjs.Utils, OSjs.API, OSjs.VFS);

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
(function(WindowManager, GUI, Utils, API, VFS) {
  'use strict';

  var SETTING_STORAGE_NAME = 'CoreWM';
  var PADDING_PANEL_AUTOHIDE = 10; // FIXME: Replace with a constant ?!

  /////////////////////////////////////////////////////////////////////////////
  // APPLICATION
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Application
   */
  var CoreWM = function(args, metadata) {
    var ds = OSjs.Applications.CoreWM.DefaultSettings;

    var importSettings = args.defaults || {};

    WindowManager.apply(this, ['CoreWM', this, args, metadata, ds(importSettings)]);

    this.scheme           = null;
    this.panels           = [];
    this.switcher         = null;
    this.iconView         = null;
    this.$themeLink       = null;
    this.$themeScript     = null;
    this.$animationLink   = null;
    this.importedSettings = importSettings;

    this._$notifications    = document.createElement('corewm-notifications');
    this._$notifications.setAttribute('role', 'log');

    document.body.appendChild(this._$notifications);
  };

  CoreWM.prototype = Object.create(WindowManager.prototype);

  CoreWM.prototype.init = function() {
    var link = (OSjs.Core.getConfig().Connection.RootURI || '/') + 'blank.css';
    this.setThemeLink(Utils.checkdir(link));
    this.setAnimationLink(Utils.checkdir(link));

    WindowManager.prototype.init.apply(this, arguments);
  };

  CoreWM.prototype.setup = function(cb) {
    var self = this;

    function initNotifications() {
      var user = OSjs.Core.getHandler().getUserData();

      function displayMenu(ev) {
        OSjs.API.createMenu([
          {
            title: API._('TITLE_SIGN_OUT'),
            onClick: function() {
              OSjs.API.signOut();
            }
          },
          {
            title: API._('Reboot Device'),
            onClick: function() {
              OSjs.API.call('reboot', {}, function() {
                window.location.reload();
              });
            }
          }
        ], ev);

        return false;
      }

      function toggleFullscreen() {
        var notif = self.getNotificationIcon('_FullscreenNotification');
        if ( notif ) {
          if ( notif.opts._isFullscreen ) {
            if ( document.webkitCancelFullScreen ) {
              document.webkitCancelFullScreen();
            } else if ( document.mozCancelFullScreen ) {
              document.mozCancelFullScreen();
            } else if ( document.exitFullscreen ) {
              document.exitFullscreen();
            }
          } else {
            var docElm = document.documentElement;
            if ( docElm.requestFullscreen ) {
              docElm.requestFullscreen();
            } else if ( docElm.mozRequestFullScreen ) {
              docElm.mozRequestFullScreen();
            } else if ( docElm.webkitRequestFullScreen ) {
              docElm.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
            }
          }
        }
      }

      if ( self.getSetting('fullscreen') ) {
        self.createNotificationIcon('_FullscreenNotification', {
          image: OSjs.API.getIcon('actions/gtk-fullscreen.png', '16x16'),
          title: 'Enter fullscreen',
          onClick: toggleFullscreen,
          _isFullscreen: false
        });
      }

      self.createNotificationIcon('_HandlerUserNotification', {
        image: API.getIcon('status/avatar-default.png', '16x16'),
        title: API._('TITLE_SIGNED_IN_AS_FMT', user.username),
        onContextMenu: displayMenu,
        onClick: displayMenu
      });
    }

    function initScheme(icb) {
      var schemeUrl = API.getApplicationResource('CoreWM', 'scheme.html');
      self.scheme = GUI.createScheme(schemeUrl);
      self.scheme.load(function(err) {
        icb();
      });
    }

    this.applySettings(this._settings.get());

    initScheme(function() {
      self.initSwitcher();
      self.initDesktop();
      self.initPanels();
      self.initIconView();

      initNotifications();

      cb();
    });

  };

  CoreWM.prototype.destroy = function(kill, force) {
    if ( !force && kill && !window.confirm(OSjs.Applications.CoreWM._('Killing this process will stop things from working!')) ) {
      return false;
    }

    this.removeNotificationIcon('_HandlerUserNotification');

    if ( this.iconView ) {
      this.iconView.destroy();
    }
    if ( this.switcher ) {
      this.switcher.destroy();
    }
    if ( this.scheme ) {
      this.scheme.destroy();
    }

    // Reset
    this.destroyPanels();
    var settings = this.importedSettings;
    try {
      settings.background = 'color';
    } catch ( e ) {}
    this.applySettings(OSjs.Applications.CoreWM.DefaultSettings(settings), true);

    // Clear DOM
    this._$notifications = Utils.$remove(this._$notifications);
    this.$themeLink = Utils.$remove(this.$themeLink);
    this.$themeScript = Utils.$remove(this.$themeScript);
    this.$animationLink = Utils.$remove(this.$animationLink);
    this.switcher = null;
    this.iconView = null;
    this.scheme = null;

    return WindowManager.prototype.destroy.apply(this, []);
  };

  CoreWM.prototype.destroyPanels = function() {
    this.panels.forEach(function(p) {
      p.destroy();
    });
    this.panels = [];
  };

  // Copy from Application
  CoreWM.prototype._onMessage = function(obj, msg, args) {
    if ( this.iconView ) {
      if ( msg === 'vfs' ) {
        if ( args && args.type === 'delete' && args.file ) {
          this.iconView.removeShortcutByPath(args.file.path);
        }
      }
    }
  };

  // Copy from Application
  CoreWM.prototype._createDialog = function(className, args, parentClass) {
    if ( OSjs.Dialogs[className] ) {

      var w = Object.create(OSjs.Dialogs[className].prototype);
      OSjs.Dialogs[className].apply(w, args);

      if ( parentClass && (parentClass instanceof OSjs.Core.Window) ) {
        parentClass._addChild(w);
      }

      this.addWindow(w);
      return w;
    }
    return false;
  };

  //
  // Initialization
  //

  CoreWM.prototype.initSwitcher = function() {
    this.switcher = new OSjs.Applications.CoreWM.WindowSwitcher();
  };

  CoreWM.prototype.initDesktop = function() {
    var self = this;

    // Enable dropping of new wallpaper if no iconview is enabled
    GUI.Helpers.createDroppable(document.body, {
      onOver: function(ev, el, args) {
        self.onDropOver(ev, el, args);
      },

      onLeave : function() {
        self.onDropLeave();
      },

      onDrop : function() {
        self.onDrop();
      },

      onItemDropped: function(ev, el, item, args) {
        self.onDropItem(ev, el, item, args);
      },

      onFilesDropped: function(ev, el, files, args) {
        self.onDropFile(ev, el, files, args);
      }
    });

    document.addEventListener('contextmenu', function(ev) {
      return self.onContextMenu(ev);
    }, true);

    document.addEventListener('click', function(ev) {
      return self.onGlobalClick(ev);
    }, true);
  };

  CoreWM.prototype.initPanels = function(applySettings) {
    var ps = this.getSetting('panels');
    var added = false;
    var self = this;

    if ( ps === false ) {
      added = true;
    } else {
      this.destroyPanels();

      (ps || []).forEach(function(storedItem) {
        if ( !storedItem.options ) {
          storedItem.options = {};
        }

        var panelSettings = new OSjs.Helpers.SettingsFragment(storedItem.options, 'CoreWM');
        var p = new OSjs.Applications.CoreWM.Panel('Default', panelSettings, self);
        p.init(document.body);

        (storedItem.items || []).forEach(function(iter) {
          try {
            if ( typeof iter.settings === 'undefined' || iter.settings === null ) {
              iter.settings = {};
            }

            var itemSettings = {};
            try {
              itemSettings = new OSjs.Helpers.SettingsFragment(iter.settings, 'CoreWM');
            } catch ( ex ) {
              console.warn('An error occured while loading PanelItem settings', ex);
              console.warn('stack', ex.stack);
            }

            p.addItem(new OSjs.Applications.CoreWM.PanelItems[iter.name](itemSettings));
            added = true;
          } catch ( e ) {
            console.warn('An error occured while creating PanelItem', e);
            console.warn('stack', e.stack);

            self.notification({
              icon: 'status/important.png',
              title: 'CoreWM',
              message: OSjs.Applications.CoreWM._('An error occured while creating PanelItem: {0}', e)
            });
          }
        });

        self.panels.push(p);
      });
    }

    if ( !added ) {
      this.notification({
        timeout : 0,
        icon: 'status/important.png',
        title: 'CoreWM',
        message: OSjs.Applications.CoreWM._('Your panel has no items. Go to settings to reset default or modify manually\n(This error may occur after upgrades of OS.js)')
      });
    }

    if ( applySettings ) {
      // Workaround for windows appearing behind panel
      var p = this.panels[0];
      if ( p && p.getOntop() && p.getPosition('top') ) {
        var space = this.getWindowSpace();
        this._windows.forEach(function(iter) {
          if ( iter && iter._position.y < space.top ) {
            console.warn('CoreWM::initPanels()', 'I moved this window because it overlapped with a panel!', iter);
            iter._move(iter._position.x, space.top);
          }
        });
      }

      if ( this.iconView ) {
        this.iconView.resize(this);
      }
    }

    setTimeout(function() {
      self.setStyles(self._settings);
    }, 1000);
  };

  CoreWM.prototype.initIconView = function() {
    var self = this;

    if ( this.iconView ) {
      this.iconView.destroy();
      this.iconView = null;
    }

    if ( !this.getSetting('enableIconView') ) { return; }

    this.iconView = new OSjs.Applications.CoreWM.DesktopIconView(this);
    document.body.appendChild(this.iconView.getRoot());

    setTimeout(function() {
      if ( self.iconView ) {
        self.iconView.resize(self);
      }
    }, this.getAnimDuration() + 500);
  };

  //
  // Events
  //

  CoreWM.prototype.resize = function(ev, rect, wasInited) {
    if ( !this.getSetting('moveOnResize') ) { return; }

    var space = this.getWindowSpace();
    var margin = this.getSetting('desktopMargin');
    var i = 0, l = this._windows.length, iter, wrect;
    var mx, my, moved;

    for ( i; i < l; i++ ) {
      iter = this._windows[i];
      if ( !iter ) { continue; }
      wrect = iter._getViewRect();
      if ( wrect === null ) { continue; }
      if ( iter._state.mimimized ) { continue; }

      // Move the window into view if outside of view
      mx = iter._position.x;
      my = iter._position.y;
      moved = false;

      if ( (wrect.left + margin) > rect.width ) {
        mx = space.width - iter._dimension.w;
        moved = true;
      }
      if ( (wrect.top + margin) > rect.height ) {
        my = space.height - iter._dimension.h;
        moved = true;
      }

      if ( moved ) {
        if ( mx < space.left ) { mx = space.left; }
        if ( my < space.top  ) { my = space.top;  }
        iter._move(mx, my);
      }

      // Restore maximized windows (FIXME: Better solution?)
      if ( iter._state.maximized && (wasInited ? iter._restored : true) ) {
        iter._restore(true, false);
      }
    }
  };

  CoreWM.prototype.onDropLeave = function() {
    document.body.setAttribute('data-attention', 'false');
  };

  CoreWM.prototype.onDropOver = function() {
    document.body.setAttribute('data-attention', 'true');
  };

  CoreWM.prototype.onDrop = function() {
    document.body.setAttribute('data-attention', 'false');
  };

  CoreWM.prototype.onDropItem = function(ev, el, item, args) {
    document.body.setAttribute('data-attention', 'false');

    var _applyWallpaper = function(data) {
      this.applySettings({wallpaper: data.path}, false, true);
    };

    var _createShortcut = function(data) {
      if ( this.iconView ) {
        this.iconView.addShortcut(data, this, true);
      }
    };

    var _openMenu = function(data, self) {
      var pos = {x: ev.clientX, y: ev.clientY};
      OSjs.API.createMenu([{
        title: OSjs.Applications.CoreWM._('Create shortcut'),
        onClick: function() {
          _createShortcut.call(self, data);
        }
      }, {
        title: OSjs.Applications.CoreWM._('Set as wallpaper'),
        onClick: function() {
          _applyWallpaper.call(self, data);
        }
      }], pos);
    };

    if ( item ) {
      var data = item.data;
      if ( item.type === 'file' ) {
        if ( data && data.mime ) {
          if ( data.mime.match(/^image/) ) {
            if ( this.iconView ) {
              _openMenu.call(this, data, this);
            } else {
              _applyWallpaper.call(this, data);
            }
          } else {
            _createShortcut.call(this, data);
          }
        }
      } else if ( item.type === 'application' ) {
        _createShortcut.call(this, data);
      }
    }
  };

  CoreWM.prototype.onDropFile = function(ev, el, files, args) {
    var self = this;

    VFS.upload({
      destination: API.getDefaultPath(),
      files: files
    }, function(error, file) {
      if ( !error && file && self.iconView ) {
        self.iconView.addShortcut(file, self, true);
      }
    });
  };

  CoreWM.prototype.onGlobalClick = function(ev) {
    this.themeAction('event', [ev]);
    return true;
  };

  CoreWM.prototype.onContextMenu = function(ev) {
    if ( ev.target === document.body ) {
      ev.preventDefault();
      ev.stopPropagation();
      this.openDesktopMenu(ev);
      return false;
    }
    return true;
  };

  CoreWM.prototype.onKeyUp = function(ev, win) {
    if ( !ev ) { return; }

    if ( !ev.altKey ) {
      if ( this.switcher ) {
        this.switcher.hide(ev, win, this);
      }
    }
  };

  CoreWM.prototype.onKeyDown = function(ev, win) {
    if ( !ev ) { return; }

    var keys = Utils.Keys;
    if ( ev.altKey && ev.keyCode === keys.TILDE ) { // Toggle Window switcher
      if ( !this.getSetting('enableSwitcher') ) { return; }

      if ( this.switcher ) {
        this.switcher.show(ev, win, this);
      }
    } else if ( ev.altKey ) {
      if ( !this.getSetting('enableHotkeys') ) { return; }

      if ( win && win._properties.allow_hotkeys ) {
        if ( ev.keyCode === keys.H ) { // Hide window [H]
          win._minimize();
        } else if ( ev.keyCode === keys.M ) { // Maximize window [M]
          win._maximize();
        } else if ( ev.keyCode === keys.R ) { // Restore window [R]
          win._restore();
        } else if ( ev.keyCode === keys.LEFT ) { // Pin Window Left [Left]
          win._moveTo('left');
        } else if ( ev.keyCode === keys.RIGHT ) { // Pin Window Right [Right]
          win._moveTo('right');
        } else if ( ev.keyCode === keys.UP ) { // Pin Window Top [Up]
          win._moveTo('top');
        } else if ( ev.keyCode === keys.DOWN ) { // Pin Window Bottom [Down]
          win._moveTo('bottom');
        }
      }
    }
  };

  CoreWM.prototype.showSettings = function(category) {
    var self = this;

    OSjs.API.launch('ApplicationSettings', {category: category});
  };

  CoreWM.prototype.eventWindow = function(ev, win) {
    // Make sure panel items are updated correctly
    // FIXME: This is not compatible with other PanelItems

    this.panels.forEach(function(panel) {
      if ( panel ) {
        var panelItem = panel.getItem(OSjs.Applications.CoreWM.PanelItems.WindowList);
        if ( panelItem ) {
          panelItem.update(ev, win);
        }
      }
    });

    // Unfocus IconView if we focus a window
    if ( ev === 'focus' ) {
      if ( this.iconView ) {
        this.iconView.blur();
      }
    }
  };

  CoreWM.prototype.notification = (function() {
    var _visible = 0;

    return function(opts) {
      opts          = opts          || {};
      opts.icon     = opts.icon     || null;
      opts.title    = opts.title    || null;
      opts.message  = opts.message  || '';
      opts.onClick  = opts.onClick  || function() {};

      if ( typeof opts.timeout === 'undefined' ) {
        opts.timeout  = 5000;
      }

      console.log('OSjs::Core::WindowManager::notification()', opts);

      var container  = document.createElement('corewm-notification');
      var classNames = [''];
      var self       = this;
      var timeout    = null;
      var wm         = OSjs.Core.getWindowManager();

      function _remove() {
        if ( timeout ) {
          clearTimeout(timeout);
          timeout = null;
        }

        container.onclick = null;
        function _removeDOM() {
          if ( container.parentNode ) {
            container.parentNode.removeChild(container);
          }
          _visible--;
          if ( _visible <= 0 ) {
            self._$notifications.style.display = 'none';
          }
        }

        var anim = wm ? wm.getSetting('animations') : false;
        if ( anim ) {
          container.setAttribute('data-hint', 'closing');
          setTimeout(function() {
            _removeDOM();
          }, wm.getAnimDuration());
        } else {
          container.style.display = 'none';
          _removeDOM();
        }
      }

      if ( opts.icon ) {
        var icon = document.createElement('img');
        icon.alt = '';
        icon.src = API.getIcon(opts.icon, '32x32');
        classNames.push('HasIcon');
        container.appendChild(icon);
      }

      if ( opts.title ) {
        var title = document.createElement('div');
        title.className = 'Title';
        title.appendChild(document.createTextNode(opts.title));
        classNames.push('HasTitle');
        container.appendChild(title);
      }

      if ( opts.message ) {
        var message = document.createElement('div');
        message.className = 'Message';
        var lines = opts.message.split('\n');
        lines.forEach(function(line, idx) {
          message.appendChild(document.createTextNode(line));
          if ( idx < (lines.length - 1) ) {
            message.appendChild(document.createElement('br'));
          }
        });
        classNames.push('HasMessage');
        container.appendChild(message);
      }

      _visible++;
      if ( _visible > 0 ) {
        this._$notifications.style.display = 'block';
      }

      container.setAttribute('aria-label', String(opts.title));
      container.setAttribute('role', 'alert');

      container.className = classNames.join(' ');
      container.onclick = function(ev) {
        _remove();

        opts.onClick(ev);
      };

      var space = this.getWindowSpace();
      this._$notifications.style.top = space.top + 'px';

      this._$notifications.appendChild(container);

      if ( opts.timeout ) {
        timeout = setTimeout(function() {
          _remove();
        }, opts.timeout);
      }
    };
  })();

  CoreWM.prototype._getNotificationArea = function(panelId) {
    panelId = panelId || 0;
    var panel  = this.panels[panelId];
    var result = null;
    if ( panel ) {
      return panel.getItem(OSjs.Applications.CoreWM.PanelItems.NotificationArea, false);
    }

    return false;
  };

  CoreWM.prototype.createNotificationIcon = function(name, opts, panelId) {
    opts = opts || {};
    if ( !name ) { return false; }

    var pitem = this._getNotificationArea(panelId);
    if ( pitem ) {
      return pitem.createNotification(name, opts);
    }
    return null;
  };

  CoreWM.prototype.removeNotificationIcon = function(name, panelId) {
    if ( !name ) { return false; }

    var pitem = this._getNotificationArea(panelId);
    if ( pitem ) {
      pitem.removeNotification(name);
      return true;
    }
    return false;
  };

  CoreWM.prototype.getNotificationIcon = function(name, panelId) {
    if ( !name ) { return false; }
    var pitem = this._getNotificationArea(panelId);
    if ( pitem ) {
      return pitem.getNotification(name);
    }
    return false;
  };

  CoreWM.prototype.openDesktopMenu = function(ev) {
    var self = this;
    var menu = [
      {title: OSjs.Applications.CoreWM._('Open settings'), onClick: function(ev) {
        self.showSettings();
      }}
    ];

    if ( this.getSetting('enableIconView') === true ) {
      menu.push({
        title: OSjs.Applications.CoreWM._('Hide Icons'),
        onClick: function(ev) {
          self.applySettings({enableIconView: false}, false, true);
        }
      });
    } else {
      menu.push({
        title: OSjs.Applications.CoreWM._('Show Icons'),
        onClick: function(ev) {
          self.applySettings({enableIconView: true}, false, true);
        }
      });
    }

    API.createMenu(menu, ev);
  };

  CoreWM.prototype.applySettings = function(settings, force, save) {
    console.group('OSjs::Applications::CoreWM::applySettings');

    settings = force ? settings : Utils.mergeObject(this._settings.get(), settings);

    this.setBackground(settings);
    this.setTheme(settings);
    this.setIconView(settings);
    this.setStyles(settings);

    if ( save ) {
      this.initPanels(true);
      if ( settings ) {
        if ( settings.language ) {
          OSjs.Core.getSettingsManager().set('Core', 'Locale', settings.language);
          API.setLocale(settings.language);
        }
        this._settings.set(null, settings, save);
      }
    }

    console.groupEnd();

    return true;
  };

  CoreWM.prototype.themeAction = function(action, args) {
    args = args || [];
    if ( OSjs.Applications.CoreWM.CurrentTheme ) {
      try {
        OSjs.Applications.CoreWM.CurrentTheme[action].apply(null, args);
      } catch ( e ) {
        console.warn('CoreWM::themeAction()', 'exception', e);
        console.warn(e.stack);
      }
    }
  };

  //
  // Theme Setters
  //

  CoreWM.prototype.setBackground = function(settings) {
    if ( settings.backgroundColor ) {
      document.body.style.backgroundColor = settings.backgroundColor;
    }
    if ( settings.fontFamily ) {
      document.body.style.fontFamily = settings.fontFamily;
    }

    var name = settings.wallpaper;
    var type = settings.background;

    var className = 'color';
    var back      = 'none';

    if ( name && type.match(/^image/) ) {
      back = name;
      switch ( type ) {
        case 'image' :        className = 'normal';   break;
        case 'image-center':  className = 'center';   break;
        case 'image-fill' :   className = 'fill';     break;
        case 'image-strech':  className = 'strech';   break;
        default:                  className = 'default';  break;
      }
    }

    console.log('Wallpaper name', name);
    console.log('Wallpaper type', type);
    console.log('Wallpaper className', className);

    document.body.setAttribute('data-background-style', className);

    if ( back !== 'none' ) {
      VFS.url(back, function(error, result) {
        if ( !error ) {
          back = 'url(\'' + result + '\')';
          document.body.style.backgroundImage = back;
        }
      });
    } else {
      document.body.style.backgroundImage = back;
    }
  };

  CoreWM.prototype.setTheme = function(settings) {
    console.log('theme', settings.theme);
    if ( this.$themeLink ) {
      if ( settings.theme ) {
        this.setThemeLink(API.getThemeCSS(settings.theme));
      } else {
        console.warn('NO THEME WAS SELECTED!');
      }
    }

    if ( this.$themeLink ) {
      this.themeAction('destroy');
    }

    this.setThemeScript(API.getThemeResource('theme.js'));

    console.log('animations', settings.animations);
    if ( this.$animationLink ) {
      if ( settings.animations ) {
        this.setAnimationLink(API.getApplicationResource(this, 'animations.css'));
      } else {
        this.setAnimationLink(API.getThemeCSS(null));
      }
    }
  };

  CoreWM.prototype.setIconView = function(settings) {
    if ( settings.enableIconView ) {
      this.initIconView();
    } else {
      if ( this.iconView ) {
        this.iconView.destroy();
        this.iconView = null;
      }
    }
  };

  CoreWM.prototype.setStyles = function(settings) {
    /*jshint sub:true*/
    var styles = {};
    var raw = '';

    if ( settings.panels ) {
      settings.panels.forEach(function(p, i) {
        styles['corewm-panel'] = {};
        styles['corewm-notification'] = {};
        styles['corewm-notification:before'] = {
          'opacity': p.options.opacity / 100
        };
        styles['corewm-panel:before'] = {
          'opacity': p.options.opacity / 100
        };
        if ( p.options.background ) {
          styles['corewm-panel:before']['background-color'] = p.options.background;
          styles['corewm-notification:before']['background-color'] = p.options.background;
        }
        if ( p.options.foreground ) {
          styles['corewm-panel']['color'] = p.options.foreground;
          styles['corewm-notification']['color'] = p.options.foreground;
        }
      });
    }

    raw += '@media all and (max-width: 800px) {\n';
    raw += 'application-window {\n';

    var borderSize = 0;
    var space = this.getWindowSpace(true);
    var theme = this.getStyleTheme(true);
    if ( theme && theme.style && theme.style.window ) {
      borderSize = theme.style.window.border;
    }

    raw += 'top:' + String(space.top + borderSize) + 'px !important;\n';
    raw += 'left:' + String(space.left + borderSize) + 'px !important;\n';
    raw += 'right:' + String(borderSize) + 'px !important;\n';
    raw += 'bottom:' + String(space.bottom + borderSize) + 'px !important;\n';
    raw += '\n}';
    raw += '\n}';

    styles['#CoreWMDesktopIconView'] = {};
    if ( settings.invertIconViewColor && settings.backgroundColor ) {
      styles['#CoreWMDesktopIconView']['color'] = Utils.invertHEX(settings.backgroundColor);
    }

    if ( Object.keys(styles).length ) {
      this.createStylesheet(styles, raw);
    }
  };

  CoreWM.prototype.setAnimationLink = function(src) {
    if ( this.$animationLink ) {
      this.$animationLink = Utils.$remove(this.$animationLink);
    }
    this.$animationLink = Utils.$createCSS(src);
  };

  CoreWM.prototype.setThemeLink = function(src) {
    if ( this.$themeLink ) {
      this.$themeLink = Utils.$remove(this.$themeLink);
    }
    this.$themeLink = Utils.$createCSS(src);
  };

  CoreWM.prototype.setThemeScript = function(src) {
    if ( this.$themeScript ) {
      this.$themeScript = Utils.$remove(this.$themeScript);
    }

    var self = this;
    if ( src ) {
      this.$themeScript = Utils.$createJS(src, null, function() {
        self.themeAction('init');
      });
    }
  };

  //
  // Getters / Setters
  //

  CoreWM.prototype.getWindowSpace = function(noMargin) {
    var s = WindowManager.prototype.getWindowSpace.apply(this, arguments);
    var d = this.getSetting('desktopMargin');

    s.bottom = 0;

    this.panels.forEach(function(p) {
      if ( p && p.getOntop() ) {
        var ph = p.getHeight();
        if ( p.getAutohide() ) {
          s.top    += PADDING_PANEL_AUTOHIDE;
          s.height -= PADDING_PANEL_AUTOHIDE;
        } else if ( p.getPosition('top') ) {
          s.top    += ph;
          s.height -= ph;
        } else {
          s.height -= ph;
        }

        if ( p._options.position === 'bottom' ) {
          p.bottom += ph;
        }
      }
    });

    if ( !noMargin ) {
      if ( d > 0 ) {
        s.top    += d;
        s.left   += d;
        s.width  -= (d * 2);
        s.height -= (d * 2);
      }
    }

    return s;
  };

  CoreWM.prototype.getWindowPosition = function(borders) {
    borders = (typeof borders === 'undefined') || (borders === true);
    var pos = WindowManager.prototype.getWindowPosition.apply(this, arguments);

    var m = borders ? this.getSetting('desktopMargin') : 0;
    pos.x += m || 0;
    pos.y += m || 0;

    this.panels.forEach(function(p) {
      if ( p && p.getOntop() && p.getPosition('top') ) {
        if ( p.getAutohide() ) {
          pos.y += PADDING_PANEL_AUTOHIDE;
        } else {
          pos.y += p.getHeight();
        }
      }
    });

    return pos;
  };

  CoreWM.prototype.getSetting = function(k) {
    var val = WindowManager.prototype.getSetting.apply(this, arguments);
    if ( typeof val === 'undefined' || val === null ) {
      var ds = OSjs.Applications.CoreWM.DefaultSettings;
      return ds(this.importedSettings)[k];
    }
    return val;
  };

  CoreWM.prototype.getDefaultSetting = function(k) {
    var ds = OSjs.Applications.CoreWM.DefaultSettings;
    var settings = ds(this.importedSettings);
    if ( typeof k !== 'undefined' ) {
      return settings[k];
    }
    return settings;
  };

  CoreWM.prototype.getPanels = function() {
    return this.panels;
  };

  CoreWM.prototype.getPanel = function(idx) {
    return this.panels[(idx || 0)];
  };

  CoreWM.prototype.getStyleTheme = function(returnMetadata) {
    var name = this.getSetting('theme') || null;
    if ( returnMetadata ) {
      var found = null;
      if ( name ) {
        this.getStyleThemes().forEach(function(t) {
          if ( t && t.name === name ) {
            found = t;
          }
          return found ? false : true;
        });
      }
      return found;
    }
    return name;
  };

  CoreWM.prototype.getSoundTheme = function() {
    return this.getSetting('sounds') || 'default';
  };

  CoreWM.prototype.getIconTheme = function() {
    return this.getSetting('icons') || 'default';
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications                          = OSjs.Applications || {};
  OSjs.Applications.CoreWM                   = OSjs.Applications.CoreWM || {};
  OSjs.Applications.CoreWM.Class             = Object.seal(CoreWM);
  OSjs.Applications.CoreWM.PanelItems        = OSjs.Applications.CoreWM.PanelItems || {};
  OSjs.Applications.CoreWM.CurrentTheme      = OSjs.Applications.CoreWM.CurrentTheme || null;

})(OSjs.Core.WindowManager, OSjs.GUI, OSjs.Utils, OSjs.API, OSjs.VFS);

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
(function(WindowManager, GUI, Utils, API, VFS) {
  // jscs:disable validateQuoteMarks
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // LOCALES
  /////////////////////////////////////////////////////////////////////////////

  var _Locales = {
    bg_BG : {
      'Killing this process will stop things from working!' : 'Прекратяването на този процес ще спре някой приложения!',
      'Open settings' : 'Отвори настойки',
      'Your panel has no items. Go to settings to reset default or modify manually\n(This error may occur after upgrades of OS.js)' : 'Вашият панел няма обекти. Отидете в настойки за да върнете по подразбиране или да модифицирате ръчно\n(Тази грешка може да се появи след актуализация на OS.js)',
      'Create shortcut' : 'Създай пряк път',
      'Set as wallpaper' : 'Направи изображение за фон',
      'An error occured while creating PanelItem: {0}' : 'Появи се грешка докато се създаваше панелен обект: {0}',

      'Development' : 'Разработка',
      'Education' : 'Образование',
      'Games' : 'Игри',
      'Graphics' : 'Графика',
      'Network' : 'Мрежа',
      'Multimedia' : 'Мултимедия',
      'Office' : 'Офис',
      'System' : 'Система',
      'Utilities' : 'Инструменти',
      'Other' : 'Други'
    },
    de_DE : {
      'Killing this process will stop things from working!' : 'Das Beenden dieses Prozesses wird Konsequenzen haben!',
      'Open settings' : 'Einstellungen öffnen',
      'Your panel has no items. Go to settings to reset default or modify manually\n(This error may occur after upgrades of OS.js)' : 'Ihr Panel enthält keine Items. Öffnen Sie die Einstellungen um die Panel-Einstellungen zurückzusetzen oder manuell zu ändern (Dieser Fehler kann nach einem Upgrade von OS.js entstehen)',
      'Create shortcut' : 'Verknüpfung erstellen',
      'Set as wallpaper' : 'Als Hintergrund verwenden',
      'An error occured while creating PanelItem: {0}' : 'Während des Erstellens eines Panel-Items ist folgender Fehler aufgetreten: {0}',

      'Development' : 'Entwicklung',
      'Education' : 'Bildung',
      'Games' : 'Spiele',
      'Graphics' : 'Grafik',
      'Network' : 'Netzwerk',
      'Multimedia' : 'Multimedia',
      'Office' : 'Büro',
      'System' : 'System',
      'Utilities' : 'Zubehör',
      'Other' : 'Andere'
    },
    es_ES : {
      'Killing this process will stop things from working!' : '¡Forzar la terminación de este proceso hará que las cosas dejen de funcionar!',
      'Open settings': 'Abrir preferencias',
      'Your panel has no items. Go to settings to reset default or modify manually\n(This error may occur after upgrades of OS.js)' : 'Tu panel no tiene elementos. Restablece los valores por defecto en las preferencias, o modifícalo manualmente\n(Este error puede aparecer tras una actualización de OS.js)',
      'Create shortcut': 'Crear acceso directo',
      'Set as wallpaper' : 'Seleccionar como fondo de pantalla',
      'An error occured while creating PanelItem: {0}' : 'Se produjo un error al crear el PanelItem: {0}',

      'Development' : 'Desarrollo',
      'Education' : 'Educación',
      'Games' : 'Juegos',
      'Graphics' : 'Gráficos',
      'Network' : 'Red',
      'Multimedia' : 'Multimedia',
      'Office' : 'Ofimática',
      'System' : 'Sistema',
      'Utilities' : 'Herramientas',
      'Other' : 'Otros'
    },
    fr_FR : {
      'Killing this process will stop things from working!' : 'Tuer ce processus va arrêter d\'autres éléments de fonctionner !',
      'Open settings' : 'Ouvrir les paramètres',
      'Your panel has no items. Go to settings to reset default or modify manually\n(This error may occur after upgrades of OS.js)' : 'Votre panneau n\'a aucun objet. Rendez-vous dans les paramètres pour remettre à zéro ou modifier manuellement\n(Cette erreur peut survenir après avori mis à jour OS.js)',
      'Create shortcut' : 'Créer un raccourci',
      'Set as wallpaper' : 'Définir un fond d\'écran',
      'An error occured while creating PanelItem: {0}' : 'Une erreur est survenue pendant la création du PanelItem: {0}',
      'Show Icons' : 'Afficher les icônes',
      'Hide Icons' : 'Cacher les icônes',

      'Development' : 'Développement',
      'Education' : 'Éducation',
      'Games' : 'Jeux',
      'Graphics' : 'Graphique',
      'Network' : 'Réseau',
      'Multimedia' : 'Multimédia',
      'Office' : 'Bureautique',
      'System' : 'Système',
      'Utilities' : 'Utilitaires',
      'Other' : 'Autre'
    },
    it_IT : {
      'Killing this process will stop things from working!' : 'Terminare questo processo bloccherà altre funzionalità!',
      'Open settings' : 'Apri settaggi',
      'Your panel has no items. Go to settings to reset default or modify manually\n(This error may occur after upgrades of OS.js)' : 'Il tuo pannello non ha elementi. Vai nei settaggi per resettare ai valori predefiniti o modificarli manualmente\n(Questo errore può accadere dopo un aggiornamento di OS.js)',
      'Create shortcut' : 'Crea colelgamento',
      'Set as wallpaper' : 'Imposta come sfondo desktop',
      'An error occured while creating PanelItem: {0}' : 'Si è verificato un errore nella creazione del PanelItem: {0}',
      'Show Icons' : 'Mostra icone',
      'Hide Icons' : 'Nascondi icone',

      'Development' : 'Sviluppo',
      'Education' : 'Educazione',
      'Games' : 'Giochi',
      'Graphics' : 'Grafica',
      'Network' : 'Reti',
      'Multimedia' : 'Multimedia',
      'Office' : 'Ufficio',
      'System' : 'Sistema',
      'Utilities' : 'Utilità',
      'Other' : 'Altro'
    },
    ko_KR : {
      'Killing this process will stop things from working!' : '이 프로세스를 종료 할 시 작업 중인 것들이 종료됩니다!',
      'Open settings' : '환경설정 열기',
      'Your panel has no items. Go to settings to reset default or modify manually\n(This error may occur after upgrades of OS.js)' : '패널에 항목이 없습니다. 환경설정에서 초기화하거나 직접 수정하여 주십시오.\n(이 오류는 OS.js의 업그레이드 후 발생하는 문제일 수도 있습니다)',
      'Create shortcut' : '단축키 생성',
      'Set as wallpaper' : '바탕화면으로 지정',
      'An error occured while creating PanelItem: {0}' : '해당 패널 항목 생성 중 오류가 발생 하였습니다: {0}',

      'Development' : '개발',
      'Education' : '교육',
      'Games' : '게임',
      'Graphics' : '그래픽',
      'Network' : '네트워크',
      'Multimedia' : '멀티미디어',
      'Office' : '오피스',
      'System' : '시스템',
      'Utilities' : '유틸리티',
      'Other' : '기타'
    },
    nl_NL : {
      'Killing this process will stop things from working!' : 'Het stoppen van dit proces zal er voor zorgen dat dingen niet meer werken!',
      'Open settings' : 'Instellingen openen',
      'Your panel has no items. Go to settings to reset default or modify manually\n(This error may occur after upgrades of OS.js)' : 'Het paneel bevat geen items. Ga naar instellingen om te herstellen naar de standaard of om handmatig te wijzigen\n(Deze fout kan het gevolg zijn van een update van OS.js)',
      'Create shortcut' : 'Maak een link',
      'Set as wallpaper' : 'Als achtergrond gebruiken',
      'An error occured while creating PanelItem: {0}' : 'Er is een fout opgetreden tijdens het maken van paneel item: {0}',

      'Development' : 'Ontwikkeling',
      'Education' : 'Educatie',
      'Games' : 'Spellen',
      'Graphics' : 'Grafisch',
      'Network' : 'Netwerk',
      'Multimedia' : 'Multimedia',
      'Office' : 'Kantoor',
      'System' : 'Systeem',
      'Utilities' : 'Toebehoren',
      'Other' : 'Overig'
    },
    no_NO : {
      'Killing this process will stop things from working!' : 'Dreping av denne prosessen vil få konsekvenser!',
      'Open settings' : 'Åpne instillinger',
      'Your panel has no items. Go to settings to reset default or modify manually\n(This error may occur after upgrades of OS.js)' : 'Ditt panel har ingen objekter. Gå til instillinger for å nullstille eller modifisere manuelt\n(Denne feilen kan oppstå etter en oppdatering av OS.js)',
      'Create shortcut' : 'Lag snarvei',
      'Set as wallpaper' : 'Sett som bakgrunn',
      'An error occured while creating PanelItem: {0}' : 'En feil oppstod under lasting av PanelItem: {0}',
      'Show Icons' : 'Vis Ikoner',
      'Hide Icons' : 'Skjul Ikoner',

      'Development' : 'Utvikling',
      'Education' : 'Utdanning',
      'Games' : 'Spill',
      'Graphics' : 'Grafikk',
      'Network' : 'Nettverk',
      'Multimedia' : 'Multimedia',
      'Office' : 'Kontor',
      'System' : 'System',
      'Utilities' : 'Verktøy',
      'Other' : 'Andre'
    },
    pl_PL : {
      'Killing this process will stop things from working!' : 'Zabicie tego procesu zatrzyma wykonywanie działań!',
      'Open settings' : 'Otwórz ustawienia',
      'Your panel has no items. Go to settings to reset default or modify manually\n(This error may occur after upgrades of OS.js)' : 'Twój panel nie ma elementów. Idź do ustawień aby przywrócić domyślne lub zmień ręcznie\n(Ten błąd może wystąpić po aktualizacji OS.js)',
      'Create shortcut' : 'Utwórz skrót',
      'Set as wallpaper' : 'Ustaw jako tapetę',
      'An error occured while creating PanelItem: {0}' : 'Wystąpił błąd podczas tworzenia PanelItem: {0}',
      'Show Icons' : 'Pokaż Ikony',
      'Hide Icons' : 'Ukryj Ikony',

      'Development' : 'Development',
      'Education' : 'Edukacja',
      'Games' : 'Gry',
      'Graphics' : 'Graficzne',
      'Network' : 'Sieć',
      'Multimedia' : 'Multimedia',
      'Office' : 'Biuro',
      'System' : 'System',
      'Utilities' : 'Użytkowe',
      'Other' : 'Inne'
    },
    ru_RU : {
      'Killing this process will stop things from working!' : 'Завершение этого процесса остановит работу системы!',
      'Open settings': 'Открыть настройки',
      'Your panel has no items. Go to settings to reset default or modify manually\n(This error may occur after upgrades of OS.js)' : 'На вашей панели отсутствуют элементы. Откройте настройки для сброса панели к начальному состоянию или ручной настройки\n(Эта ошибка может произойти после обновления OS.js)',
      'Create shortcut': 'Создать ярлык',
      'Set as wallpaper' : 'Установить как обои',
      'An error occured while creating PanelItem: {0}' : 'Произошла обшибка при создании PanelItem: {0}',

      'Development' : 'Разработка',
      'Education' : 'Образование',
      'Games' : 'Игры',
      'Graphics' : 'Графика',
      'Network' : 'Интернет',
      'Multimedia' : 'Мультимедиа',
      'Office' : 'Офис',
      'System' : 'Система',
      'Utilities' : 'Утилиты',
      'Other' : 'Другое'
    },
    sk_SK : {
      'Open settings' : 'Otvor nastavenia',
      'Create shortcut' : 'Vytvor linku',
      'Set as wallpaper' : 'Nastav ako tapetu',
      'An error occured while creating PanelItem: {0}' : 'Chyba pri vytváraní položky: {0}',

      'Development' : 'Vývoj',
      'Education' : 'Vzdelávanie',
      'Games' : 'Hry',
      'Graphics' : 'Grafika',
      'Network' : 'Sieť',
      'Multimedia' : 'Multimédiá',
      'Office' : 'Kancelária',
      'System' : 'Systém',
      'Utilities' : 'Pomôcky',
      'Other' : 'Ostatné'
    },
    tr_TR : {
      'Open settings' : 'Ayarları Aç',
      'Create shortcut' : 'Kısayol Oluştur',
      'Set as wallpaper' : 'Arkaplan olarak ayarla',
      'An error occured while creating PanelItem: {0}' : '{0} oluşturulurken bir hata meydana geldi',

      'Development' : 'Geliştirici',
      'Education' : 'Eğitim',
      'Games' : 'Oyunlar',
      'Graphics' : 'Grafikler',
      'Network' : 'Ağ',
      'Multimedia' : 'Multimedia',
      'Office' : 'Ofis',
      'System' : 'Sistem',
      'Utilities' : 'Yan Gereksinimler',
      'Other' : 'Diğer'
    },
    vi_VN : {
      'Killing this process will stop things from working!' : 'Đóng quá trình này sẽ làm mọi thứ bị tắt!',
      'Open settings' : 'Mở cài đặt',
      'Your panel has no items. Go to settings to reset default or modify manually\n(This error may occur after upgrades of OS.js)' : 'Bảng điều khiển của bạn không có mục nào. Vào cài đặt để thiết lập lại mặc định hoặc sửa đổi bằng tay\n(Lỗi này có thể xảy ra sau khi nâng cấp OS.js)',
      'Create shortcut' : 'Tạo lối tắt',
      'Set as wallpaper' : 'Đặt làm hình nền',
      'An error occured while creating PanelItem: {0}' : 'Có lỗi xảy ra trong khi tạo PanelItem: {0}',
      'Show Icons' : 'Hiện các biểu tượng',
      'Hide Icons' : 'Ẩn các biểu tượng',

      'Development' : 'Phát triển',
      'Education' : 'Giáo dục',
      'Games' : 'Trò chơi',
      'Graphics' : 'Đồ họa',
      'Network' : 'Mạng',
      'Multimedia' : 'Đa phương tiện',
      'Office' : 'Văn phòng',
      'System' : 'Hệ thống',
      'Utilities' : 'Tiện ích',
      'Other' : 'Khác'
    }

  };

  function _() {
    var args = Array.prototype.slice.call(arguments, 0);
    args.unshift(_Locales);
    return API.__.apply(this, args);
  }

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications                          = OSjs.Applications || {};
  OSjs.Applications.CoreWM                   = OSjs.Applications.CoreWM || {};
  OSjs.Applications.CoreWM._                 = _;

})(OSjs.Core.WindowManager, OSjs.GUI, OSjs.Utils, OSjs.API, OSjs.VFS);
