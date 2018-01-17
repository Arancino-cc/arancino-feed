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
(function(Application, Window, Utils, API, VFS, GUI) {
  'use strict';

  var categories = ['theme', 'desktop', 'panel', 'user', 'fileview'];

  /////////////////////////////////////////////////////////////////////////////
  // WINDOWS
  /////////////////////////////////////////////////////////////////////////////

  function PanelItemDialog(app, metadata, scheme, callback) {
    Window.apply(this, ['ApplicationSettingsPanelItemsWindow', {
      icon: metadata.icon,
      title: metadata.name + ' - Panel Items',
      width: 400,
      height: 300
    }, app, scheme]);

    this.callback = callback;
    this.closed = false;
  }

  PanelItemDialog.prototype = Object.create(Window.prototype);
  PanelItemDialog.constructor = Window;

  PanelItemDialog.prototype.init = function(wm, app, scheme) {
    var self = this;
    var root = Window.prototype.init.apply(this, arguments);

    // Load and set up scheme (GUI) here
    scheme.render(this, 'PanelSettingWindow', root);

    var view = scheme.find(this, 'List');

    var items = OSjs.Applications.CoreWM.PanelItems;
    var list = [];
    Object.keys(items).forEach(function(i, idx) {
      list.push({
        value: i,
        columns: [{
          icon: API.getIcon(items[i].Icon),
          label: Utils.format('{0} ({1})', items[i].Name, items[i].Description)
        }]
      });
    });
    view.clear();
    view.add(list);

    scheme.find(this, 'ButtonOK').on('click', function() {
      this.closed = true;
      var selected = view.get('selected');
      self.callback('ok', selected.length ? selected[0] : null);
      self._close();
    });

    scheme.find(this, 'ButtonCancel').on('click', function() {
      self._close();
    });

    return root;
  };
  PanelItemDialog.prototype._close = function() {
    if ( !this.closed ) {
      this.callback('cancel');
    }
    return Window.prototype._close.apply(this, arguments);
  };

  /////////////////////////////////////////////////////////////////////////////
  // WINDOWS
  /////////////////////////////////////////////////////////////////////////////

  function ApplicationSettingsWindow(app, metadata, scheme, category) {
    Window.apply(this, ['ApplicationSettingsWindow', {
      icon: metadata.icon,
      title: metadata.name,
      width: 500,
      height: 500
    }, app, scheme]);

    this.category = category;
    this.settings = {};
    this.panelItems = [];
    this.watches = {};

    var self = this;

    this.watches.corewm = OSjs.Core.getSettingsManager().watch('CoreWM', function() {
      self.updateSettings();
    });
    this.watches.vfs = OSjs.Core.getSettingsManager().watch('VFS', function() {
      self.updateSettings();
    });
  }

  ApplicationSettingsWindow.prototype = Object.create(Window.prototype);
  ApplicationSettingsWindow.constructor = Window.prototype;

  /**
   * Init
   */
  ApplicationSettingsWindow.prototype.init = function(wm, app, scheme) {
    var root = Window.prototype.init.apply(this, arguments);
    var self = this;

    // Load and set up scheme (GUI) here
    scheme.render(this, 'SettingsWindow', root, null, null, {
      _: OSjs.Applications.ApplicationSettings._
    });

    var view = scheme.find(this, 'IconMenu');
    view.on('select', function(ev) {
      if ( ev.detail && ev.detail.entries && ev.detail.entries.length ) {
        var sel = ev.detail.entries[0].index;
        self.setContainer(sel, true);
      }
    });
    scheme.find(this, 'ButtonApply').on('click', function() {
      self.applySettings(wm, scheme);
    });
    scheme.find(this, 'ButtonCancel').on('click', function() {
      self._close();
    });

    var cat = Math.max(0, categories.indexOf(this.category));
    this.updateSettings(true);
    this.setContainer(cat);

    return root;
  };

  ApplicationSettingsWindow.prototype.setContainer = function(idx, save) {
    if ( !this._scheme ) {
      return;
    }

    var found;
    var indexes = ['TabsTheme', 'TabsDesktop', 'TabsPanel', 'TabsUser', 'TabsFileView'];
    if ( typeof idx === 'string' ) {
      idx = Math.max(0, categories.indexOf(idx));
    }

    var view = this._scheme.find(this, 'IconMenu');
    var header = this._scheme.find(this, 'Header');
    var container = this._scheme.find(this, 'TabsContainer');

    container.$element.querySelectorAll('gui-tabs').forEach(function(el, i) {
      Utils.$removeClass(el, 'active');
      if ( i === idx ) {
        found = el;
      }
    });

    if ( found && save ) {
      this._app._setArgument('category', categories[idx]);
    }

    header.set('value', indexes[idx].replace(/^Tabs/, ''));
    Utils.$addClass(found, 'active');

    view.set('value', idx);
  };

  ApplicationSettingsWindow.prototype.updateSettings = function(init) {
    var scheme = this._scheme;
    var wm = OSjs.Core.getWindowManager();

    this.settings = Utils.cloneObject(wm.getSettings());
    delete this.settings.desktopIcons;
    delete this.settings.fullscreen;
    delete this.settings.moveOnResize;

    this.initThemeTab(wm, scheme, init);
    this.initDesktopTab(wm, scheme, init);
    this.initPanelTab(wm, scheme, init);
    this.initUserTab(wm, scheme, init);
    this.initFileViewTab(wm, scheme, init);
  };

  /**
   * Destroy
   */
  ApplicationSettingsWindow.prototype.destroy = function() {
    try {
      OSjs.Core.getSettingsManager().unwatch(this.watches.corewm);
    } catch ( e ) {}
    try {
      OSjs.Core.getSettingsManager().unwatch(this.watches.vfs);
    } catch ( e ) {}

    this.watches = {};

    Window.prototype.destroy.apply(this, arguments);
  };

  /**
   * Theme
   */
  ApplicationSettingsWindow.prototype.initThemeTab = function(wm, scheme, init) {
    var self = this;
    var _ = OSjs.Applications.ApplicationSettings._;

    if ( init ) {
      var styleThemes = [];
      var soundThemes = [];
      var iconThemes = [];
      var backgroundTypes = [
        {value: 'image',        label: API._('LBL_IMAGE')},
        {value: 'image-repeat', label: _('Image (Repeat)')},
        {value: 'image-center', label: _('Image (Centered)')},
        {value: 'image-fill',   label: _('Image (Fill)')},
        {value: 'image-strech', label: _('Image (Streched)')},
        {value: 'color',        label: API._('LBL_COLOR')}
      ];

      var tmp;

      wm.getStyleThemes().forEach(function(t) {
        styleThemes.push({label: t.title, value: t.name});
      });

      tmp = wm.getSoundThemes();
      Object.keys(tmp).forEach(function(t) {
        soundThemes.push({label: tmp[t], value: t});
      });

      tmp = wm.getIconThemes();
      Object.keys(tmp).forEach(function(t) {
        iconThemes.push({label: tmp[t], value: t});
      });

      scheme.find(this, 'StyleThemeName').add(styleThemes);
      scheme.find(this, 'SoundThemeName').add(soundThemes);
      scheme.find(this, 'IconThemeName').add(iconThemes);

      var backImage = scheme.find(this, 'BackgroundImage').set('value', this.settings.wallpaper).on('open', function(ev) {
        self._toggleDisabled(true);

        API.createDialog('File', {
          mime: ['^image'],
          file: new VFS.File(ev.detail)
        }, function(ev, button, result) {
          self._toggleDisabled(false);
          if ( button === 'ok' && result ) {
            backImage.set('value', result.path);
          }
        }, self);
      });
      var backColor = scheme.find(this, 'BackgroundColor').set('value', this.settings.backgroundColor).on('open', function(ev) {
        self._toggleDisabled(true);

        API.createDialog('Color', {
          color: ev.detail
        }, function(ev, button, result) {
          self._toggleDisabled(false);
          if ( button === 'ok' && result ) {
            backColor.set('value', result.hex);
          }
        }, self);
      });

      var fontName = scheme.find(this, 'FontName').set('value', this.settings.fontFamily);

      fontName.on('click', function() {
        self._toggleDisabled(true);
        API.createDialog('Font', {
          fontName: self.settings.fontFamily,
          fontSize: -1
        }, function(ev, button, result) {
          self._toggleDisabled(false);
          if ( button === 'ok' && result ) {
            fontName.set('value', result.fontName);
          }
        }, self);
      });

      scheme.find(this, 'BackgroundStyle').add(backgroundTypes);
    }

    scheme.find(this, 'StyleThemeName').set('value', this.settings.theme);
    scheme.find(this, 'SoundThemeName').set('value', this.settings.sounds);
    scheme.find(this, 'IconThemeName').set('value', this.settings.icons);

    scheme.find(this, 'EnableAnimations').set('value', this.settings.animations);
    scheme.find(this, 'EnableSounds').set('value', this.settings.enableSounds);
    scheme.find(this, 'EnableTouchMenu').set('value', this.settings.useTouchMenu);

    scheme.find(this, 'BackgroundStyle').set('value', this.settings.background);
    scheme.find(this, 'BackgroundImage').set('value', this.settings.wallpaper);
    scheme.find(this, 'BackgroundColor').set('value', this.settings.backgroundColor);
  };

  /**
   * Desktop
   */
  ApplicationSettingsWindow.prototype.initDesktopTab = function(wm, scheme, init) {
    var self = this;
    var _ = OSjs.Applications.ApplicationSettings._;

    function updateLabel(lbl, value) {
      var map = {
        DesktopMargin: 'Desktop Margin ({0}px)',
        CornerSnapping: 'Desktop Corner Snapping ({0}px)',
        WindowSnapping: 'Window Snapping ({0}px)'
      };

      var label = Utils.format(_(map[lbl]), value);
      scheme.find(self, lbl + 'Label').set('value', label);
    }

    var inputSnap = scheme.find(this, 'WindowSnapping');
    var inputCorner = scheme.find(this, 'CornerSnapping');
    var inputDesktop = scheme.find(this, 'DesktopMargin');

    if ( init ) {
      inputDesktop.on('change', function(ev) {
        updateLabel('DesktopMargin', ev.detail);
      });
      inputCorner.on('change', function(ev) {
        updateLabel('CornerSnapping', ev.detail);
      });
      inputSnap.on('change', function(ev) {
        updateLabel('WindowSnapping', ev.detail);
      });
    }

    scheme.find(this, 'EnableHotkeys').set('value', this.settings.enableHotkeys);
    //scheme.find(this, 'EnableWindowSwitcher').set('value', this.settings.enableSwitcher);

    inputDesktop.set('value', this.settings.desktopMargin);
    inputCorner.set('value', this.settings.windowCornerSnap);
    inputSnap.set('value', this.settings.windowSnap);

    updateLabel('DesktopMargin', this.settings.desktopMargin);
    updateLabel('CornerSnapping', this.settings.windowCornerSnap);
    updateLabel('WindowSnapping', this.settings.windowSnap);

    scheme.find(this, 'EnableIconView').set('value', this.settings.enableIconView);
    scheme.find(this, 'EnableIconViewInvert').set('value', this.settings.invertIconViewColor);
  };

  /**
   * Panel
   */
  ApplicationSettingsWindow.prototype.initPanelTab = function(wm, scheme, init) {
    var self = this;
    var panel = this.settings.panels[0];

    if ( !init ) {
      return; // TODO
    }

    var panelPositions = [
      {value: 'top',    label: API._('LBL_TOP')},
      {value: 'bottom', label: API._('LBL_BOTTOM')}
    ];

    var opacity = 85;
    if ( typeof panel.options.opacity === 'number' ) {
      opacity = panel.options.opacity;
    }

    // Style
    scheme.find(this, 'PanelPosition').add(panelPositions).set('value', panel.options.position);
    scheme.find(this, 'PanelAutoHide').set('value', panel.options.autohide);
    scheme.find(this, 'PanelOntop').set('value', panel.options.ontop);
    var panelFg = scheme.find(this, 'PanelBackgroundColor').set('value', panel.options.background || '#101010').on('open', function(ev) {
      self._toggleDisabled(true);

      API.createDialog('Color', {
        color: ev.detail
      }, function(ev, button, result) {
        self._toggleDisabled(false);
        if ( button === 'ok' && result ) {
          panelFg.set('value', result.hex);
        }
      }, self);
    });
    var panelBg = scheme.find(this, 'PanelForegroundColor').set('value', panel.options.foreground || '#ffffff').on('open', function(ev) {
      self._toggleDisabled(true);

      API.createDialog('Color', {
        color: ev.detail
      }, function(ev, button, result) {
        self._toggleDisabled(false);
        if ( button === 'ok' && result ) {
          panelBg.set('value', result.hex);
        }
      }, self);
    });
    scheme.find(this, 'PanelOpacity').set('value', opacity);

    // Items
    var view = scheme.find(this, 'PanelItems');
    var buttonAdd = scheme.find(this, 'PanelButtonAdd');
    var buttonRemove = scheme.find(this, 'PanelButtonRemove');
    var buttonUp = scheme.find(this, 'PanelButtonUp');
    var buttonDown = scheme.find(this, 'PanelButtonDown');
    var buttonReset = scheme.find(this, 'PanelButtonReset');
    var buttonOptions = scheme.find(this, 'PanelButtonOptions');

    var max = 0;
    var items = OSjs.Applications.CoreWM.PanelItems;

    this.panelItems = panel.items || [];

    function openOptions(idx) {
      // FIXME
      try {
        wm.panels[0]._items[idx].openSettings();
      } catch ( e ) {}
    }

    function checkSelection(idx) {
      var hasOptions = true;

      try {
        var it = items[panel.items[idx].name];
        hasOptions = it.HasOptions === true;
      } catch ( e ) {}

      buttonOptions.set('disabled', idx < 0 || !hasOptions);
      buttonRemove.set('disabled', idx < 0);
      buttonUp.set('disabled', idx <= 0);
      buttonDown.set('disabled', idx < 0 || idx >= max);
    }

    function renderItems(setSelected) {
      var list = [];
      self.panelItems.forEach(function(i, idx) {
        var name = i.name;
        list.push({
          value: idx,
          columns: [{
            icon: API.getIcon(items[name].Icon),
            label: Utils.format('{0} ({1})', items[name].Name, items[name].Description)
          }]
        });
      });
      max = self.panelItems.length - 1;

      view.clear();
      view.add(list);

      if ( typeof setSelected !== 'undefined' ) {
        view.set('selected', setSelected);
        checkSelection(setSelected);
      } else {
        checkSelection(-1);
      }
    }

    function movePanelItem(index, pos) {
      var value = self.panelItems[index];
      var newIndex = index + pos;
      self.panelItems.splice(index, 1);
      self.panelItems.splice(newIndex, 0, value);
      renderItems(newIndex);
    }

    view.on('select', function(ev) {
      if ( ev && ev.detail && ev.detail.entries ) {
        checkSelection(ev.detail.entries[0].index);
      }
    });

    buttonAdd.on('click', function() {
      self._toggleDisabled(true);
      self._app.panelItemsDialog(function(ev, result) {
        self._toggleDisabled(false);

        if ( result ) {
          self.panelItems.push({name: result.data});
          renderItems();
        }
      });
    });

    buttonRemove.on('click', function() {
      var selected = view.get('selected');
      if ( selected.length ) {
        self.panelItems.splice(selected[0].index, 1);
        renderItems();
      }
    });

    buttonUp.on('click', function() {
      var selected = view.get('selected');
      if ( selected.length ) {
        movePanelItem(selected[0].index, -1);
      }
    });
    buttonDown.on('click', function() {
      var selected = view.get('selected');
      if ( selected.length ) {
        movePanelItem(selected[0].index, 1);
      }
    });

    buttonReset.on('click', function() {
      var defaults = wm.getDefaultSetting('panels');
      self.panelItems = defaults[0].items;
      renderItems();
    });

    buttonOptions.on('click', function() {
      var selected = view.get('selected');
      if ( selected.length ) {
        openOptions(selected[0].index);
      }
    });

    renderItems();
  };

  /**
   * User
   */
  ApplicationSettingsWindow.prototype.initUserTab = function(wm, scheme, init) {
    var user = OSjs.Core.getHandler().getUserData();
    var config = OSjs.Core.getConfig();
    var locales = config.Languages;

    if ( init ) {
      var langs = [];
      Object.keys(locales).forEach(function(l) {
        if ( OSjs.Locales[l] ) {
          langs.push({label: locales[l], value: l});
        }
      });
      scheme.find(this, 'UserLocale').add(langs);
    }

    var data = OSjs.Core.getHandler().getUserData();
    scheme.find(this, 'UserID').set('value', user.id);
    scheme.find(this, 'UserName').set('value', user.name);
    scheme.find(this, 'UserUsername').set('value', user.username);
    scheme.find(this, 'UserGroups').set('value', user.groups);
    scheme.find(this, 'UserLocale').set('value', API.getLocale());
  };

  /**
   * File View
   */
  ApplicationSettingsWindow.prototype.initFileViewTab = function(wm, scheme, init) {
    var self = this;
    var handler = OSjs.Core.getHandler();
    var pacman = OSjs.Core.getPackageManager();

    var vfsOptions = Utils.cloneObject(OSjs.Core.getSettingsManager().get('VFS') || {});
    var scandirOptions = vfsOptions.scandir || {};

    scheme.find(this, 'ShowFileExtensions').set('value', scandirOptions.showFileExtensions === true);
    scheme.find(this, 'ShowHiddenFiles').set('value', scandirOptions.showHiddenFiles === true);
  };

  /**
   * Apply
   */
  ApplicationSettingsWindow.prototype.applySettings = function(wm, scheme) {
    // Theme
    this.settings.theme = scheme.find(this, 'StyleThemeName').get('value');
    this.settings.sounds = scheme.find(this, 'SoundThemeName').get('value');
    this.settings.icons = scheme.find(this, 'IconThemeName').get('value');
    this.settings.animations = scheme.find(this, 'EnableAnimations').get('value');
    this.settings.enableSounds = scheme.find(this, 'EnableSounds').get('value');
    this.settings.useTouchMenu = scheme.find(this, 'EnableTouchMenu').get('value');
    this.settings.wallpaper = scheme.find(this, 'BackgroundImage').get('value');
    this.settings.backgroundColor = scheme.find(this, 'BackgroundColor').get('value');
    this.settings.background = scheme.find(this, 'BackgroundStyle').get('value');
    this.settings.fontFamily = scheme.find(this, 'FontName').get('value');

    // Desktop
    this.settings.enableHotkeys = scheme.find(this, 'EnableHotkeys').get('value');
    //this.settings.enableSwitcher = scheme.find(this, 'EnableWindowSwitcher').get('value');
    this.settings.desktopMargin = scheme.find(this, 'DesktopMargin').get('value');
    this.settings.windowCornerSnap = scheme.find(this, 'CornerSnapping').get('value');
    this.settings.windowSnap = scheme.find(this, 'WindowSnapping').get('value');
    this.settings.enableIconView = scheme.find(this, 'EnableIconView').get('value');
    this.settings.invertIconViewColor = scheme.find(this, 'EnableIconViewInvert').get('value');

    // Panel
    this.settings.panels[0].options.position = scheme.find(this, 'PanelPosition').get('value');
    this.settings.panels[0].options.autohide = scheme.find(this, 'PanelAutoHide').get('value');
    this.settings.panels[0].options.ontop = scheme.find(this, 'PanelOntop').get('value');
    this.settings.panels[0].options.background = scheme.find(this, 'PanelBackgroundColor').get('value') || '#101010';
    this.settings.panels[0].options.foreground = scheme.find(this, 'PanelForegroundColor').get('value') || '#ffffff';
    this.settings.panels[0].options.opacity = scheme.find(this, 'PanelOpacity').get('value');
    this.settings.panels[0].items = this.panelItems;

    // User
    this.settings.language = scheme.find(this, 'UserLocale').get('value');

    var showHiddenFiles = scheme.find(this, 'ShowHiddenFiles').get('value');
    var showFileExtensions = scheme.find(this, 'ShowFileExtensions').get('value');

    wm.applySettings(this.settings, false, function() {
      OSjs.Core.getSettingsManager().instance('VFS').set(null, {
        scandir: {
          showHiddenFiles: showHiddenFiles,
          showFileExtensions: showFileExtensions
        }
      }, true);
    });
  };

  /////////////////////////////////////////////////////////////////////////////
  // APPLICATION
  /////////////////////////////////////////////////////////////////////////////

  var ApplicationSettings = function(args, metadata) {
    Application.apply(this, ['ApplicationSettings', args, metadata]);
  };

  ApplicationSettings.prototype = Object.create(Application.prototype);
  ApplicationSettings.constructor = Application;

  ApplicationSettings.prototype.destroy = function() {
    return Application.prototype.destroy.apply(this, arguments);
  };

  ApplicationSettings.prototype.init = function(settings, metadata) {
    Application.prototype.init.apply(this, arguments);

    var self = this;
    var url = API.getApplicationResource(this, './scheme.html');
    var scheme = GUI.createScheme(url);
    var category = this._getArgument('category') || settings.category;
    scheme.load(function(error, result) {
      self._addWindow(new ApplicationSettingsWindow(self, metadata, scheme, category));
    });

    this._setScheme(scheme);
  };

  ApplicationSettings.prototype.panelItemsDialog = function(callback) {
    if ( this.__scheme ) {
      this._addWindow(new PanelItemDialog(this, this.__metadata, this.__scheme, callback));
    }
  };

  ApplicationSettings.prototype._onMessage = function(obj, msg, args) {
    Application.prototype._onMessage.apply(this, arguments);

    if ( this.__mainwindow ) {
      var win = this._getWindow(null);
      if ( msg === 'attention' && args.category ) {
        win.setContainer(args.category, true);
        win._focus();
      }
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationSettings = OSjs.Applications.ApplicationSettings || {};
  OSjs.Applications.ApplicationSettings.Class = Object.seal(ApplicationSettings);

})(OSjs.Core.Application, OSjs.Core.Window, OSjs.Utils, OSjs.API, OSjs.VFS, OSjs.GUI);

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
(function(Application, Window, GUI, Dialogs, Utils, API, VFS) {
  // jscs:disable validateQuoteMarks
  'use strict';

  /////////////////////////////////////////////////////////////////////////////
  // LOCALES
  /////////////////////////////////////////////////////////////////////////////

  var _Locales = {
    bg_BG : {
      'Theme' : 'Тема',
      'Background' : 'Фон',
      'Desktop' : 'Работен плот',
      'Background Type' : 'Тип на фон',
      'Image (Repeat)' : 'Изображение (повтарящо се)',
      'Image (Centered)' : 'Изображение (Центрирано)',
      'Image (Fill)' : 'Изображение (Запълващо)',
      'Image (Streched)' : 'Изображение (Разтеглено)',
      'Desktop Margin ({0}px)' : 'Размер на работен плот ({0}px)',
      'Panel' : 'Панел',
      'Position' : 'Позиция',
      'Ontop' : 'Най-отгоре',
      'Items' : 'Обекти',
      'Enable Animations' : 'Разреши анимации',
      'Language (requires restart)' : 'Език (нуждае се от рестарт)',
      'Enable Sounds' : 'Включи звуци',
      'Enable Window Switcher' : 'Включи превключване на прозорци',
      'Enable Hotkeys' : 'Включи горещи клавиши',
      'Enable Icon View' : 'Включи иконен-изглед',
      'General': 'Основен'
    },
    de_DE : {
      'Theme' : 'Thema',
      'Background' : 'Hintergrund',
      'Desktop' : 'Arbeitsoberflächen',
      'Background Type' : 'Hintergrundtyp',
      'Image (Repeat)' : 'Bild (Wiederholend)',
      'Image (Centered)' : 'Bild (Zentriert)',
      'Image (Fill)' : 'Bild (Ausgefüllt)',
      'Image (Streched)' : 'Bild (Gestreckt)',
      'Desktop Margin ({0}px)' : 'Arbeitsoberflächen Margin ({0}px)',
      'Panel' : 'Panel',
      'Position' : 'Position',
      'Ontop' : 'Vordergrund',
      'Items' : 'Items',
      'Enable Animations' : 'Animationen verwenden',
      'Language (requires restart)' : 'Sprache (benötigt Neustart)',
      'Enable Sounds' : 'Aktiviere Sounds',
      'Enable Window Switcher' : 'Aktiviere Fensterwechsler',
      'Enable Hotkeys' : 'Aktiviere Hotkeys',
      'Enable Icon View' : 'Aktiviere Icon-Ansicht',
      'General': 'General'
    },
    es_ES : {
      'Theme' : 'Tema',
      'Background' : 'Fondo',
      'Desktop' : 'Escritorio',
      'Background Type' : 'Tipo de fondo',
      'Image (Repeat)' : 'Imagen (Repetir)',
      'Image (Centered)' : 'Imagen (Centrada)',
      'Image (Fill)' : 'Imagen (Estirar)',
      'Image (Streched)' : 'Imagen (Ajustar)',
      'Desktop Margin ({0}px)' : 'Margen del escritorio ({0}px)',
      'Panel' : 'Panel',
      'Position' : 'Posición',
      'Ontop' : 'Primer plano',
      'Items' : 'Elementos',
      'Enable Animations' : 'Habilitar animaciones',
      'Language (requires restart)' : 'Idioma (requiere reiniciar)',
      'Enable Sounds' : 'Activar sonidos',
      'Enable Window Switcher' : 'Activar el alternador de ventanas',
      'Enable Hotkeys' : 'Activar Hotkeys',
      'Enable Icon View' : 'Activar la vista de icono',
      'General': 'General'
    },
    fr_FR : {
      'Theme' : 'Thème',
      'Sounds' : 'Sons',
      'Icons' : 'Icônes',
      'Background' : 'Fond d\'écran',
      'Desktop' : 'Bureau',
      'Background Type' : 'Type de fond d\'écran',
      'Image (Repeat)' : 'Image (Répéter)',
      'Image (Centered)' : 'Image (Centrer)',
      'Image (Fill)' : 'Image (Remplir)',
      'Image (Streched)' : 'Image (Étiré)',
      'Desktop Margin ({0}px)' : 'Marge du bureau ({0}px)',
      'Panel' : 'Pannel',
      'Position' : 'Position',
      'Ontop' : 'Premier plan',
      'Items' : 'Objets',
      'Enable Animations' : 'Activer les animations',
      'Language (requires restart)' : 'Langue (redémarrage requis)',
      'Enable Sounds' : 'Activer la musique',
      'Enable Window Switcher' : 'Activer Window Switcher',
      'Enable Hotkeys' : 'Activer les raccourcis clavier',
      'Enable Icon View' : 'Activer l\'affichage des icônes sur le bureau',
      'Remove shortcut' : 'Supprimer le raccourci',
      'General' : 'Général',
      'Debug' : 'Déboguer',
      'File View': 'Options des fichiers',
      'Show Hidden Files': 'Montrer les fichiers cachés',
      'Show File Extensions': 'Montrer les extensions de fichiers',
      'File View Options': 'Options d\'affichage des fichier',
      'Panels' : 'Pannels',
      'Invert Text Color' : 'Inverser la couleur du texte',
      'Autohide' : 'Masquage automatique',
      'Information' : 'Information',
      'Locales' : 'Localisations',
      'Icon View' : 'Affichage des icônes',
      'Opacity' : 'Opacité',
      'Appearance' : 'Apparence',
      'Packages' : 'Paquets',
      'Installed Packages' : 'Paquets installés',
      'App Store' : 'Magasin d\'applications',
      'Name' : 'Nom',
      'Username' : 'Nom d\'utilisateur',
      'Groups' : 'Groupes',
      'User' : 'Utilisateur',
      'Version' : 'Version',
      'Author' : 'Auteur',
      'Hide' : 'Cacher',
      'Application' : 'Application',
      'Scope' : 'Gamme',
      'Save' : 'Sauvegarder',
      'Regenerate metadata' : 'Régénérer les métadonnées',
      'Install from zip' : 'Installer à partir du fichier zip',
      'Refresh' : 'Rafraîchir',
      'Install selected' : 'Installer la sélection',
      'Enable TouchMenu' : 'Activer le TouchMenu'
    },
    it_IT : {
      'Theme' : 'Tema',
      'Sounds' : 'Suoni',
      'Icons' : 'Icone',
      'Background' : 'Sfondo',
      'Desktop' : 'Scrivania',
      'Background Type' : 'Tipo di sfondo',
      'Image (Repeat)' : 'Immagine (Ripeti)',
      'Image (Centered)' : 'Immagine (Centrata)',
      'Image (Fill)' : 'Immagine (Riempi)',
      'Image (Streched)' : 'Immagine (Distorci)',
      'Desktop Margin ({0}px)' : 'Margini Scrivania ({0}px)',
      'Panel' : 'Panello',
      'Position' : 'Posizione',
      'Ontop' : 'In primo piano',
      'Items' : 'Elementi',
      'Enable Animations' : 'Abilita animazioni',
      'Language (requires restart)' : 'Lingua (necessita riavvio)',
      'Enable Sounds' : 'Abilita Suoni',
      'Enable Window Switcher' : 'Abilita Cambia-Finestre',
      'Enable Hotkeys' : 'Abilita Scorciatoie da tastiera',
      'Enable Icon View' : 'Abilita Visualizzazione ad icona',
      'Remove shortcut' : 'Rimuovi scorciatoia',
      'General' : 'Generale',
      'Debug' : 'Risoluzione errori',
      'File View': 'Visualizza file',
      'Show Hidden Files': 'Mostra file nascosti',
      'Show File Extensions': 'Mostra estenzioni dei file',
      'File View Options': 'Opzioni visualizza file',
      'Panels' : 'Panelli',
      'Invert Text Color' : 'Inverti colore testi',
      'Autohide' : 'Nascondi automaticamente',
      'Information' : 'Informazioni',
      'Locales' : 'Localizzazioni',
      'Icon View' : 'Visualizzazione ad icone',
      'Opacity' : 'Opacità',
      'Appearance' : 'Aspetto',
      'Packages' : 'Pacchetti',
      'Installed Packages' : 'Installa pacchetti',
      'App Store' : 'Negozio applicazioni',
      'Name' : 'Nome',
      'Username' : 'Nome utente',
      'Groups' : 'Gruppi',
      'User' : 'Utenti',
      'Version' : 'Versione',
      'Author' : 'Autore',
      'Hide' : 'Nascondi',
      'Application' : 'Applicazione',
      'Scope' : 'Scope (namespace)',
      'Save' : 'Salva',
      'Regenerate metadata' : 'Rigenerazione metadata',
      'Install from zip' : 'Installa da zip',
      'Refresh' : 'Ricarica',
      'Install selected' : 'Installa selezionato',
      'Enable TouchMenu' : 'Abilita TouchMenu'
    },
    ko_KR : {
      'Theme' : '테마',
      'Background' : '바탕화면',
      'Desktop' : '데스크탑',
      'Background Type' : '바탕화면 타입',
      'Image (Repeat)' : '이미지 (반복)',
      'Image (Centered)' : '이미지 (가운데)',
      'Image (Fill)' : '이미지 (채우기)',
      'Image (Streched)' : '이미지 (늘이기)',
      'Desktop Margin ({0}px)' : '데스크탑 여백 ({0}px)',
      'Panel' : '패널',
      'Position' : '위치',
      'Ontop' : '상단바 자리 차지',
      'Items' : '항목',
      'Enable Animations' : '애니메이션 효과 켜기',
      'Language (requires restart)' : '언어 (재시작 필요)',
      'Enable Sounds' : '사운드 켜기',
      'Enable Window Switcher' : '윈도우 전환 활성',
      'Enable Hotkeys' : '단축키 활성',
      'Enable Icon View' : '아이콘 보이기',
      'General': '일반'
    },
    nl_NL : {
      'Theme' : 'Thema',
      'Background' : 'Achtergrond',
      'Desktop' : 'Bureaublad',
      'Background Type' : 'Achtergrond type',
      'Image (Repeat)' : 'Afbeelding (Herhalend)',
      'Image (Centered)' : 'Afbeelding (Gecentreerd)',
      'Image (Fill)' : 'Afbeelding (Passend)',
      'Image (Streched)' : 'Afbeelding (Uitrekken)',
      'Desktop Margin ({0}px)' : 'Achtergrondmarge ({0}px)',
      'Panel' : 'Paneel',
      'Position' : 'Positie',
      'Ontop' : 'Voorgrond',
      'Items' : 'Items',
      'Enable Animations' : 'Animaties gebruiken',
      'Language (requires restart)' : 'Taal (Herstarten vereist)',
      'Enable Sounds' : 'Activeer Geluiden',
      'Enable Window Switcher' : 'Activeer Venster Wisselaar',
      'Enable Hotkeys' : 'Activeer Hotkeys',
      'Enable Icon View' : 'Activeer Iconen-weergave',
      'General': 'Algemeen'
    },
    no_NO : {
      'Theme' : 'Tema',
      'Background' : 'Bakgrunn',
      'Desktop' : 'Skrivebord',
      'Background Type' : 'Bakgrunn type',
      'Image (Repeat)' : 'Bilde (Gjenta)',
      'Image (Centered)' : 'Bilde (Sentrert)',
      'Image (Fill)' : 'Bilde (Fyll)',
      'Image (Streched)' : 'Bilde (Strekk)',
      'Desktop Margin ({0}px)' : 'Skrivebord Margin ({0}px)',
      'Panel' : 'Panel',
      'Position' : 'Posisjon',
      'Ontop' : 'Topp',
      'Items' : 'Objekter',
      'Enable Animations' : 'Bruk animasjoner',
      'Language (requires restart)' : 'Språk (krever omstart)',
      'Enable Sounds' : 'Skru på lyder',
      'Enable Window Switcher' : 'Skru på Vindu-bytter',
      'Enable Hotkeys' : 'Skru på Hurtigtaster',
      'Enable Icon View' : 'Skru på Ikonvisning',
      'Remove shortcut' : 'Fjern snarvei',
      'General' : 'Generelt'
    },
    pl_PL : {
      'Theme' : 'Temat',
      'Background' : 'Tło',
      'Desktop' : 'Pulpit',
      'Background Type' : 'Typ Tła',
      'Image (Repeat)' : 'Powtarzający się',
      'Image (Centered)' : 'Wycentrowany',
      'Image (Fill)' : 'Wypełniony',
      'Image (Streched)' : 'Rozciągnięty',
      'Desktop Margin ({0}px)' : 'Margines Pulpitu ({0}px)',
      'Desktop Corner Snapping ({0}px)' : 'Przyciąganie do Narożników Pulpitu ({0}px)',
      'Window Snapping ({0}px)' : 'Przyciąganie do Okien ({0}px)',
      'Panel' : 'Panel',
      'Position' : 'Pozycja',
      'Ontop' : 'Na wierzchu',
      'Items' : 'Elementy',
      'Sounds' : 'Dźwięki',
      'Icons' : 'Ikony',
      'Enable Animations' : 'Włączone Animacje',
      'Language (requires restart)' : 'Język (zmiana wymaga restartu)',
      'Enable Sounds' : 'Włączone Dźwięki',
      'Enable TouchMenu' : 'Włączone Menu Dotykowe',
      'Enable Window Switcher' : 'Właczony Zmieniacz Okien',
      'Enable Hotkeys' : 'Włączone Skróty Klawiaturowe',
      'Enable Icon View' : 'Włączone Pokazywanie Ikon',
      'Remove shortcut' : 'Usuwanie skrótu',
      'General' : 'Ogólne',
      'Debug' : 'Debugowanie',
      'File View': 'Widok Plików',
      'Show Hidden Files': 'Pokazuj Ukryte Pliki',
      'Show File Extensions': 'Pokazuj Rozszerzenia Plików',
      'File View Options': 'Opcje Widoku Plików',
      'Panels' : 'Panele',
      'Invert Text Color' : 'Odwróć Kolor Tekstu',
      'Autohide' : 'Automatyczne ukrywanie',
      'Information' : 'Informacje',
      'Locales' : 'Tłumaczenia',
      'Icon View' : 'Widok Ikon',
      'Opacity' : 'Przeźroczystość',
      'Appearance' : 'Wygląd',
      'Packages' : 'Pakiety',
      'Installed Packages' : 'Zainstalowane Pakiety',
      'App Store' : 'Sklep App',
      'Name' : 'Nazwa',
      'Username' : 'Nazwa konta',
      'Groups' : 'Grupy',
      'User' : 'Użytkownik',
      'Version' : 'Wersja',
      'Author' : 'Autor',
      'Hide' : 'Ukryj',
      'Application' : 'Aplikacja',
      'Scope' : 'Zasięg',
      'Save' : 'Zachowaj',
      'Regenerate metadata' : 'Zregeneruj metadane',
      'Install from zip' : 'Zainstaluj z pliku zip',
      'Refresh' : 'Odśwież',
      'Install selected' : 'Zainstaluj wybrane'
    },
    ru_RU : {
      'Theme' : 'Тема',
      'Background' : 'Фон',
      'Desktop' : 'Настройки',
      'Background Type' : 'Тип фона',
      'Image (Repeat)' : 'Изображение (повторяющееся)',
      'Image (Centered)' : 'Изображение (по центру)',
      'Image (Fill)' : 'Изображение (заполнить)',
      'Image (Streched)' : 'Изображение (растянуть)',
      'Desktop Margin ({0}px)' : 'Отступ рабочего стола ({0}px)',
      'Panel' : 'Панель',
      'Position' : 'Расположение',
      'Ontop' : 'Вверху',
      'Items' : 'Элементы',
      'Enable Animations' : 'Использовать анимацию',
      'TouchMenu' : 'Крупное меню',
      'Language (requires restart)' : 'Язык (необходим перезапуск)',
      'Enable Sounds' : 'Включить звук',
      'Enable Window Switcher' : 'Включить растягивание окон',
      'Enable Hotkeys' : 'Включить горячии клавиши',
      'Enable Icon View' : 'Включить ярлыки',
      'Icon View' : 'Ярлыки рабочего стола',
      'Invert Text Color' : 'Обратить цвет текста',
      'Autohide' : 'Автоматически скрывать',
      'Opacity' : 'Прозрачность',
      'General' : 'Основные',
      'Debug' : 'Отладка'
    },
    sk_SK : {
      'Theme' : 'Téma',
      'Background' : 'Pozadie',
      'Desktop' : 'Pracovná plocha',
      'Background Type' : 'Typ pozadia',
      'Image (Repeat)' : 'Dlaždice',
      'Image (Centered)' : 'Na stred',
      'Image (Fill)' : 'Vyplniť',
      'Image (Streched)' : 'Roztiahnutý',
      'Desktop Margin ({0}px)' : 'Hranice pracovnej plochy ({0}px)',
      'Panel' : 'Panel',
      'Position' : 'Pozícia',
      'Ontop' : 'Vždy na vrchu',
      'Items' : 'Položky',
      'Enable Animations' : 'Povoliť animácie',
      'Language (requires restart)' : 'Jazyk (vyžaduje reštart)',
      'Enable Sounds' : 'Povoliť zvuky',
      'Enable Window Switcher' : 'Povoliť Prepínač Okien',
      'Enable Hotkeys' : 'Klávesové skratky',
      'Enable Icon View' : 'Ikony na ploche',
      'Remove shortcut' : 'Odstrániť skratku',
      'General' : 'Všeobecné'
    },
    tr_TR : {
      'Theme' : 'Tema',
      'Background' : 'arkaplan',
      'Desktop' : 'masaüstü',
      'Background Type' : 'arkaplan türü',
      'Image (Repeat)' : 'resim (tekrarla)',
      'Image (Centered)' : 'resm(ortala)',
      'Image (Fill)' : 'resm (kapla/doldur)',
      'Image (Streched)' : 'resm (uzat)',
      'Desktop Margin ({0}px)' : 'masaüstü kenar ({0}px)',
      'Panel' : 'Panel',
      'Position' : 'pozisyon',
      'Ontop' : 'en üst',
      'Items' : 'nesneler',
      'Enable Animations' : 'animasyonlar etkin',
      'Language (requires restart)' : 'Dil(yeniden başlatma gerektirir)',
      'Enable Sounds' : 'Müzik etkin',
      'Enable Window Switcher' : 'Ekran(pencere) değiştirme etkin',
      'Enable Hotkeys' : 'kısayol tuşları etkin',
      'Enable Icon View' : 'icon görünümü etkin',
      'Remove shortcut' : 'kısayolları kaldır',
      'General' : 'genel'
    },
    vi_VN : {
      'Theme' : 'Giao diện',
      'Background' : 'Ảnh nền',
      'Desktop' : 'Màn hình chính',
      'Background Type' : 'Kiểu nền',
      'Image (Repeat)' : 'Lặp lại',
      'Image (Centered)' : 'Căn giữa',
      'Image (Fill)' : 'Lấp đầy',
      'Image (Streched)' : 'Trải dài',
      'Desktop Margin ({0}px)' : 'Phần biên màn hình ({0}px)',
      'Panel' : 'Khung',
      'Position' : 'Vị trí',
      'Ontop' : 'Ở trên',
      'Items' : 'Các mục',
      'Enable Animations' : 'Bật hiệu ứng',
      'Language (requires restart)' : 'Ngôn ngữ (cần khởi động lại)',
      'Enable Sounds' : 'Bật âm thanh',
      'Enable Window Switcher' : 'Bật chuyển đổi cửa sổ',
      'Enable Hotkeys' : 'Bật phím nóng',
      'Enable Icon View' : 'Bật kiểu xem biểu tượng',
      'Remove shortcut' : 'Xóa lối tắt',
      'General': 'Tổng quát',
      'File View': 'Quản lí tệp',
      'Show Hidden Files': 'Hiện tập tin ẩn',
      'Show File Extensions': 'Hiện đuôi tập tin',
      'File View Options': 'Cài đặt quản lí tệp',
      'Panels' : 'Khung',
      'Autohide' : 'Tự động ẩn',
      'Information' : 'Thông tin',
      'Icon View' : 'Biểu tượng'
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

  OSjs.Applications = OSjs.Applications || {};
  OSjs.Applications.ApplicationSettings = OSjs.Applications.ApplicationSettings || {};
  OSjs.Applications.ApplicationSettings._ = _;

})(OSjs.Core.Application, OSjs.Core.Window, OSjs.GUI, OSjs.Dialogs, OSjs.Utils, OSjs.API, OSjs.VFS);
