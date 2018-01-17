
/*jshint browser: true, curly: true, bitwise: false, eqeqeq: true, newcap: true, noarg: true, noempty: true, nonew: true, sub: true, undef: true, unused: false, nonbsp: true, trailing: true, boss: true, eqnull: true, strict: true, immed: true, expr: true, latedef: nofunc, quotmark: single, indent: 2, node: true, maxerr: 9999 */
var OSjs;

/**
 * @preserve OS.js - JavaScript Cloud/Web Desktop Platform
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

(function() {
  'use strict';
  window.OSjs = window.OSjs || {};
  var handler    = null;
  var loaded     = false;
  var inited     = false;
  var signingOut = false;
  (['API', 'GUI', 'Core', 'Dialogs', 'Helpers', 'Applications', 'Locales', 'VFS', 'Extensions']).forEach(function(ns) {
    OSjs[ns] = OSjs[ns] || {};
  });
  (function() {
    window.console    = window.console    || {};
    console.log       = console.log       || function() {};
    console.debug     = console.debug     || console.log;
    console.error     = console.error     || console.log;
    console.warn      = console.warn      || console.log;
    console.group     = console.group     || console.log;
    console.groupEnd  = console.groupEnd  || console.log;
  })();
  (function() {
    var compability = ['forEach', 'every', 'map'];
    compability.forEach(function(n) {
      if ( window.HTMLCollection ) {
        window.HTMLCollection.prototype[n] = Array.prototype[n];
      }
      if ( window.NodeList ) {
        window.NodeList.prototype[n] = Array.prototype[n];
      }
      if ( window.FileList ) {
        window.FileList.prototype[n] = Array.prototype[n];
      }
    });
    (function() {
      function CustomEvent(event, params) {
        params = params || { bubbles: false, cancelable: false, detail: undefined };
        var evt = document.createEvent( 'CustomEvent' );
        evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
        return evt;
      }
      if ( window.navigator.userAgent.match(/MSIE|Edge|Trident/) ) {
        CustomEvent.prototype = window.Event.prototype;
        window.CustomEvent = CustomEvent;
      }
    })();
  })();
  var events = {
    body_contextmenu: function(ev) {
      ev.stopPropagation();
      if ( !OSjs.Utils.$isInput(ev) ) {
        ev.preventDefault();
        return false;
      }
      return true;
    },
    body_mousedown: function(ev) {
      ev.preventDefault();
      OSjs.API.blurMenu();
    },
    message: function(ev) {
      if ( ev && ev.data && typeof ev.data.wid !== 'undefined' && typeof ev.data.pid !== 'undefined' ) {
        var proc = OSjs.API.getProcess(ev.data.pid);
        if ( proc ) {
          if ( typeof proc.onPostMessage === 'function' ) {
            proc.onPostMessage(ev.data.message, ev);
          }
          var win  = proc._getWindow(ev.data.wid, 'wid');
          if ( win ) {
            win.onPostMessage(ev.data.message, ev);
          }
        }
      }
    },
    fullscreen: function(ev) {
      var notif = OSjs.Core.getWindowManager().getNotificationIcon('_FullscreenNotification');
      if ( notif ) {
        if ( !document.fullScreen && !document.mozFullScreen && !document.webkitIsFullScreen && !document.msFullscreenElement ) {
          notif.opts._isFullscreen = false;
          notif.setImage(OSjs.API.getIcon('actions/gtk-fullscreen.png', '16x16'));
        } else {
          notif.opts._isFullscreen = true;
          notif.setImage(OSjs.API.getIcon('actions/gtk-leave-fullscreen.png', '16x16'));
        }
      }
    },
    mousedown: function(ev) {
      var wm = OSjs.Core.getWindowManager();
      var win = wm ? wm.getCurrentWindow() : null;
      if ( win ) {
        win._blur();
      }
    },
    keydown: function(ev) {
      var wm  = OSjs.Core.getWindowManager();
      var win = wm ? wm.getCurrentWindow() : null;
      function sendKey(special) {
        if ( wm ) {
          wm.onKeyDown(ev, win, special);
          if ( win ) {
            return win._onKeyEvent(ev, 'keydown', special);
          }
        }
      }
      function checkPrevent() {
        var d = ev.srcElement || ev.target;
        var doPrevent = d.tagName === 'BODY' ? true : false;
        if ( (ev.keyCode === OSjs.Utils.Keys.BACKSPACE) && !OSjs.Utils.$isInput(ev) ) {
          doPrevent = true;
        } else if ( (ev.keyCode === OSjs.Utils.Keys.TAB) && OSjs.Utils.$isFormElement(ev) ) {
          doPrevent = true;
        }
        if ( doPrevent && (!win || !win._properties.key_capture) ) {
          return true;
        }
        return false;
      }
      function checkShortcut() {
        if ( ((ev.keyCode === 115 || ev.keyCode === 83) && ev.ctrlKey) || ev.keyCode === 19 ) {
          if ( ev.shiftKey ) {
            return 'saveas';
          } else {
            return 'save';
          }
        } else if ( (ev.keyCode === 79 || ev.keyCode === 83) && ev.ctrlKey ) {
          return 'open';
        }
        return false;
      }
      var shortcut = checkShortcut();
      if ( checkPrevent() || shortcut ) {
        ev.preventDefault();
      }
      sendKey(shortcut);
      return true;
    },
    keypress: function(ev) {
      var wm = OSjs.Core.getWindowManager();
      if ( wm ) {
        var win = wm.getCurrentWindow();
        if ( win ) {
          return win._onKeyEvent(ev, 'keypress');
        }
      }
      return true;
    },
    keyup: function(ev) {
      var wm = OSjs.Core.getWindowManager();
      if ( wm ) {
        wm.onKeyUp(ev, wm.getCurrentWindow());
        var win = wm.getCurrentWindow();
        if ( win ) {
          return win._onKeyEvent(ev, 'keyup');
        }
      }
      return true;
    },
    beforeunload: function(ev) {
      if ( signingOut ) { return; }
      try {
        if ( OSjs.API.getConfig('ShowQuitWarning') ) {
          return OSjs.API._('MSG_SESSION_WARNING');
        }
      } catch ( e ) {}
    },
    resize: (function() {
      var _timeout;
      function _resize(ev, wasInited) {
        var wm = OSjs.Core.getWindowManager();
        if ( !wm ) { return; }
        wm.resize(ev, wm.getWindowSpace(), wasInited);
      }
      return function(ev, wasInited) {
        if ( _timeout ) {
          clearTimeout(_timeout);
          _timeout = null;
        }
        var self = this;
        _timeout = setTimeout(function() {
          _resize.call(self, ev, wasInited);
        }, 100);
      };
    })(),
    scroll: function(ev) {
      if ( ev.target === document || ev.target === document.body ) {
        ev.preventDefault();
        ev.stopPropagation();
        return false;
      }
      document.body.scrollTop = 0;
      document.body.scrollLeft = 0;
      return true;
    },
    hashchange: function(ev) {
      var hash = window.location.hash.substr(1);
      var spl = hash.split(/^([\w\.\-_]+)\:(.*)/);
      function getArgs(q) {
        var args = {};
        q.split('&').forEach(function(a) {
          var b = a.split('=');
          var k = decodeURIComponent(b[0]);
          args[k] = decodeURIComponent(b[1] || '');
        });
        return args;
      }
      if ( spl.length === 4 ) {
        var root = spl[1];
        var args = getArgs(spl[2]);
        if ( root ) {
          OSjs.API.getProcess(root).forEach(function(p) {
            p._onMessage(null, 'hashchange', {
              source: null,
              hash: hash,
              args: args
            });
          });
        }
      }
    }
  };
  function onError(msg) {
    OSjs.API.error(OSjs.API._('ERR_CORE_INIT_FAILED'), OSjs.API._('ERR_CORE_INIT_FAILED_DESC'), msg, null, true);
  }
  function initLayout() {
    var append = OSjs.API.getConfig('VersionAppend');
    var ver = OSjs.API.getConfig('Version', 'unknown version');
    var cop = 'Copyright © 2011-2016 ';
    var lnk = document.createElement('a');
    lnk.setAttribute('aria-hidden', 'true');
    lnk.href = 'mailto:andersevenrud@gmail.com';
    lnk.appendChild(document.createTextNode('Anders Evenrud'));
    var el = document.createElement('div');
    el.id = 'DebugNotice';
    el.setAttribute('aria-hidden', 'true');
    el.appendChild(document.createTextNode(OSjs.Utils.format('OS.js {0}', ver)));
    el.appendChild(document.createElement('br'));
    el.appendChild(document.createTextNode(cop));
    el.appendChild(lnk);
    if ( append ) {
      el.appendChild(document.createElement('br'));
      el.innerHTML += append;
    }
    document.getElementById('LoadingScreen').style.display = 'none';
    document.body.appendChild(el);
  }
  function initHandler(config, callback) {
    handler = new OSjs.Core.Handler();
    handler.init(function(error) {
      if ( inited ) {
        return;
      }
      inited = true;
      if ( error ) {
        onError(error);
        return;
      }
      callback();
    });
  }
  function initEvents() {
    document.body.addEventListener('contextmenu', events.body_contextmenu, false);
    document.body.addEventListener('mousedown', events.body_mousedown, false);
    document.addEventListener('keydown', events.keydown, true);
    document.addEventListener('keypress', events.keypress, true);
    document.addEventListener('keyup', events.keyup, true);
    document.addEventListener('mousedown', events.mousedown, false);
    window.addEventListener('hashchange', events.hashchange, false);
    window.addEventListener('resize', events.resize, false);
    window.addEventListener('scroll', events.scroll, false);
    window.addEventListener('fullscreenchange', events.fullscreen, false);
    window.addEventListener('mozfullscreenchange', events.fullscreen, false);
    window.addEventListener('webkitfullscreenchange', events.fullscreen, false);
    window.addEventListener('msfullscreenchange', events.fullscreen, false);
    window.addEventListener('message', events.message, false);
    window.onbeforeunload = events.beforeunload;
    window.onerror = function(message, url, linenumber, column, exception) {
      if ( typeof exception === 'string' ) {
        exception = null;
      }
      console.warn('window::onerror()', arguments);
      OSjs.API.error(OSjs.API._('ERR_JAVASCRIPT_EXCEPTION'),
                    OSjs.API._('ERR_JAVACSRIPT_EXCEPTION_DESC'),
                    OSjs.API._('BUGREPORT_MSG'),
                    exception || {name: 'window::onerror()', fileName: url, lineNumber: linenumber + ':' + column, message: message},
                    true );
      return false;
    };
  }
  function initPreload(config, callback) {
    var preloads = config.Preloads;
    preloads.forEach(function(val, index) {
      val.src = OSjs.Utils.checkdir(val.src);
    });
    OSjs.Utils.preload(preloads, function(total, failed) {
      if ( failed.length ) {
        console.warn('doInitialize()', 'some preloads failed to load:', failed);
      }
      setTimeout(function() {
        callback();
      }, 0);
    });
  }
  function initExtensions(config, callback) {
    var exts = Object.keys(OSjs.Extensions);
    var manifest =  OSjs.Core.getMetadata();
    OSjs.Utils.asyncs(exts, function(entry, idx, next) {
      try {
        var m = manifest[entry];
        OSjs.Extensions[entry].init(m, function() {
          next();
        });
      } catch ( e ) {
        console.warn('Extension init failed', e.stack, e);
        next();
      }
    }, function() {
      callback();
    });
  }
  function initSettingsManager(cfg, callback) {
    var pools = cfg.SettingsManager || {};
    var manager = OSjs.Core.getSettingsManager();
    Object.keys(pools).forEach(function(poolName) {
      manager.instance(poolName, pools[poolName] || {});
    });
    callback();
  }
  function initPackageManager(cfg, callback) {
    OSjs.Core.getPackageManager().load(function(result, error) {
      callback(error, result);
    });
  }
  function initVFS(config, callback) {
    if ( OSjs.VFS.registerMountpoints ) {
      OSjs.VFS.registerMountpoints();
    }
    callback();
  }
  function initWindowManager(config, callback) {
    if ( !config.WM || !config.WM.exec ) {
      onError(OSjs.API._('ERR_CORE_INIT_NO_WM'));
      return;
    }
    OSjs.API.launch(config.WM.exec, (config.WM.args || {}), function(app) {
      app.setup(callback);
    }, function(error, name, args, exception) {
      onError(OSjs.API._('ERR_CORE_INIT_WM_FAILED_FMT', error), exception);
    });
  }
  function initSession(config, callback) {
    OSjs.API.playSound('service-login');
    var wm = OSjs.Core.getWindowManager();
    function autostart(cb) {
      var start = [];
      try {
        start = config.AutoStart;
      } catch ( e ) {
        console.warn('initSession()->autostart()', 'exception', e, e.stack);
      }
      OSjs.API.launchList(start, null, null, cb);
    }
    function session() {
      handler.loadSession(function() {
        setTimeout(function() {
          events.resize(null, true);
        }, 500);
        callback();
        wm.onSessionLoaded();
      });
    }
    autostart(function() {
      session();
    });
  }
  function init() {
    var config = OSjs.Core.getConfig();
    var splash = document.getElementById('LoadingScreen');
    var loading = OSjs.API.createSplash('OS.js', null, null, splash);
    var freeze = ['API', 'Core', 'Config', 'Dialogs', 'GUI', 'Locales', 'VFS'];
    initLayout();
    initPreload(config, function() {
      OSjs.API.triggerHook('onInitialize');
      initHandler(config, function() {
        initPackageManager(config, function() {
          loading.update(3, 8);
          initExtensions(config, function() {
            loading.update(4, 8);
            initSettingsManager(config, function() {
              loading.update(5, 8);
              initVFS(config, function() {
                loading.update(6, 8);
                OSjs.API.triggerHook('onInited');
                OSjs.GUI.DialogScheme.init(function() {
                  loading.update(7, 8);
                  freeze.forEach(function(f) {
                    Object.freeze(OSjs[f]);
                  });
                  initWindowManager(config, function() {
                    loading = loading.destroy();
                    splash = OSjs.Utils.$remove(splash);
                    OSjs.API.triggerHook('onWMInited');
                    initEvents();
                    var wm = OSjs.Core.getWindowManager();
                    wm._fullyLoaded = true;
                    initSession(config, function() {
                      OSjs.API.triggerHook('onSessionLoaded');
                    });
                  }); // wm
                });
              }); // vfs
            }); // settings
          }); // extensions
        }); // packages
      }); // handler
    }); // preload
  }
  OSjs.API.shutdown = function() {
    if ( !inited || !loaded ) {
      return;
    }
    signingOut = true;
    document.body.removeEventListener('contextmenu', events.body_contextmenu, false);
    document.body.removeEventListener('mousedown', events.body_mousedown, false);
    document.removeEventListener('keydown', events.keydown, true);
    document.removeEventListener('keypress', events.keypress, true);
    document.removeEventListener('keyup', events.keyup, true);
    document.removeEventListener('mousedown', events.mousedown, false);
    window.removeEventListener('hashchange', events.hashchange, false);
    window.removeEventListener('resize', events.resize, false);
    window.removeEventListener('scroll', events.scroll, false);
    window.removeEventListener('message', events.message, false);
    window.onerror = null;
    window.onbeforeunload = null;
    OSjs.API.blurMenu();
    OSjs.API.killAll();
    OSjs.GUI.DialogScheme.destroy();
    var ring = OSjs.API.getServiceNotificationIcon();
    if ( ring ) {
      ring.destroy();
    }
    var handler = OSjs.Core.getHandler();
    if ( handler ) {
      handler.destroy();
      handler = null;
    }
    console.warn('OS.js was shut down!');
    if ( OSjs.API.getConfig('Connection.Type') === 'nw' ) {
      try {
        var gui = require('nw.gui');
        var win = gui.Window.get();
        setTimeout(function() {
          win.close();
        }, 500);
      } catch ( e ) {
      }
    } else {
      if ( OSjs.API.getConfig('ReloadOnShutdown') === true ) {
        window.location.reload();
      }
    }
  };
  OSjs.Core.getConfig = OSjs.Core.getConfig || function() {
    return {};
  };
  OSjs.Core.getMetadata = OSjs.Core.getMetadata || function() {
    return {};
  };
  (function() {
    function onLoad() {
      if ( loaded ) {
        return;
      }
      loaded = true;
      init();
    }
    function onUnload() {
      OSjs.API.shutdown();
    }
    document.addEventListener('DOMContentLoaded', onLoad);
    document.addEventListener('load', onLoad);
    document.addEventListener('unload', onUnload);
  })();
})();

(function() {
  'use strict';
  window.OSjs = window.OSjs || {};
  OSjs.Utils  = OSjs.Utils  || {};
  OSjs.Utils.getCompability = (function() {
    function _checkSupport(enabled, check, isSupported) {
      var supported = {};
      Object.keys(check).forEach(function(key) {
        var chk = check[key];
        var value = false;
        if ( chk instanceof Array ) {
          chk.forEach(function(c) {
            value = isSupported(c);
            return !value;
          });
        } else {
          value = isSupported(chk);
        }
        supported[key] = value;
      });
      return supported;
    }
    function getUpload() {
      try {
        var xhr = new XMLHttpRequest();
        return (!!(xhr && ('upload' in xhr) && ('onprogress' in xhr.upload)));
      } catch ( e ) {}
      return false;
    }
    function getCanvasSupported() {
      return document.createElement('canvas').getContext ? document.createElement('canvas') : null;
    }
    function getVideoSupported() {
      return document.createElement('video').canPlayType ? document.createElement('video') : null;
    }
    function canPlayCodec(support, check) {
      return _checkSupport(support, check, function(codec) {
        try {
          return !!support.canPlayType(codec);
        } catch ( e ) {
        }
        return false;
      });
    }
    function getVideoTypesSupported() {
      return canPlayCodec(getVideoSupported(), {
        webm     : 'video/webm; codecs="vp8.0, vorbis"',
        ogg      : 'video/ogg; codecs="theora"',
        h264     : [
          'video/mp4; codecs="avc1.42E01E"',
          'video/mp4; codecs="avc1.42E01E, mp4a.40.2"'
        ],
        mpeg     : 'video/mp4; codecs="mp4v.20.8"',
        mkv      : 'video/x-matroska; codecs="theora, vorbis"'
      });
    }
    function getAudioSupported() {
      return document.createElement('audio').canPlayType ? document.createElement('audio') : null;
    }
    function getAudioTypesSupported() {
      return canPlayCodec(getAudioSupported(), {
        ogg   : 'audio/ogg; codecs="vorbis',
        mp3   : 'audio/mpeg',
        wav   : 'audio/wav; codecs="1"'
      });
    }
    function getAudioContext() {
      if ( window.hasOwnProperty('AudioContext') || window.hasOwnProperty('webkitAudioContext') ) {
        return true;
      }
      return false;
    }
    var getCanvasContexts = (function() {
      var cache = [];
      return function() {
        if ( !cache.length ) {
          var canvas = getCanvasSupported();
          if ( canvas ) {
            var test = ['2d', 'webgl', 'experimental-webgl', 'webkit-3d', 'moz-webgl'];
            test.forEach(function(tst, i) {
              try {
                if ( !!canvas.getContext(tst) ) {
                  cache.push(tst);
                }
              } catch ( eee ) {}
            });
          }
        }
        return cache;
      };
    })();
    function getWebGL() {
      var result = false;
      var contexts = getCanvasContexts();
      try {
        result = (contexts.length > 1);
        if ( !result ) {
          if ( 'WebGLRenderingContext' in window ) {
            result = true;
          }
        }
      } catch ( e ) {}
      return result;
    }
    function detectCSSFeature(featurename) {
      var feature             = false,
          domPrefixes         = 'Webkit Moz ms O'.split(' '),
          elm                 = document.createElement('div'),
          featurenameCapital  = null;
      featurename = featurename.toLowerCase();
      if ( elm.style[featurename] ) { feature = true; }
      if ( feature === false ) {
        featurenameCapital = featurename.charAt(0).toUpperCase() + featurename.substr(1);
        for ( var i = 0; i < domPrefixes.length; i++ ) {
          if ( elm.style[domPrefixes[i] + featurenameCapital ] !== undefined ) {
            feature = true;
            break;
          }
        }
      }
      return feature;
    }
    function getUserMedia() {
      var getMedia = false;
      if ( window.navigator ) {
        getMedia = ( navigator.getUserMedia ||
                         navigator.webkitGetUserMedia ||
                         navigator.mozGetUserMedia ||
                         navigator.msGetUserMedia);
      }
      return !!getMedia;
    }
    function getRichText() {
      try {
        return !!document.createElement('textarea').contentEditable;
      } catch ( e ) {}
      return false;
    }
    function getTouch() {
      try {
        if ( navigator.userAgent.match(/Windows NT 6\.(2|3)/) ) {
          return false;
        }
      } catch ( e ) {}
      try {
        if ( navigator.userAgent.match(/iOS|Android|BlackBerry|IEMobile|iPad|iPhone|iPad/i) ) {
          return true;
        }
      } catch ( e ) {}
      return false;
    }
    function getDnD() {
      return !!('draggable' in document.createElement('span'));
    }
    function getSVG() {
      return (!!document.createElementNS && !!document.createElementNS('http://www.w3.org/2000/svg', 'svg').createSVGRect);
    }
    function getFileSystem() {
      return (('requestFileSystem' in window) || ('webkitRequestFileSystem' in window));
    }
    var checkWindow = {
      indexedDB      : 'indexedDB',
      localStorage   : 'localStorage',
      sessionStorage : 'sessionStorage',
      globalStorage  : 'globalStorage',
      openDatabase   : 'openDatabase',
      socket         : 'WebSocket',
      worker         : 'Worker',
      file           : 'File',
      blob           : 'Blob',
      orientation    : 'onorientationchange'
    };
    var compability = {
      touch          : getTouch(),
      upload         : getUpload(),
      getUserMedia   : getUserMedia(),
      fileSystem     : getFileSystem(),
      localStorage   : false,
      sessionStorage : false,
      globalStorage  : false,
      openDatabase   : false,
      socket         : false,
      worker         : false,
      file           : false,
      blob           : false,
      orientation    : false,
      dnd            : getDnD(),
      css            : {
        transition : detectCSSFeature('transition'),
        animation : detectCSSFeature('animation')
      },
      canvas         : !!getCanvasSupported(),
      canvasContext  : getCanvasContexts(),
      webgl          : getWebGL(),
      audioContext   : getAudioContext(),
      svg            : getSVG(),
      video          : !!getVideoSupported(),
      videoTypes     : getVideoTypesSupported(),
      audio          : !!getAudioSupported(),
      audioTypes     : getAudioTypesSupported(),
      richtext       : getRichText()
    };
    Object.keys(checkWindow).forEach(function(key) {
      compability[key] = (checkWindow[key] in window) && window[checkWindow[key]] !== null;
    });
    return function() {
      return compability;
    };
  })();
  OSjs.Utils.isIE = function() {
    var myNav = navigator.userAgent.toLowerCase();
    return (myNav.indexOf('msie') !== -1) ? parseInt(myNav.split('msie')[1], 10) : false;
  };
  OSjs.Utils.getUserLocale = function() {
    var loc = ((window.navigator.userLanguage || window.navigator.language) || 'en-EN').replace('-', '_');
    var map = {
      'nb'    : 'no_NO',
      'es'    : 'es_ES',
      'ru'    : 'ru_RU',
      'en'    : 'en_EN'
    };
    var major = loc.split('_')[0] || 'en';
    var minor = loc.split('_')[1] || major.toUpperCase();
    if ( map[major] ) {
      return map[major];
    }
    return major + '_' + minor;
  };
  OSjs.Utils.getRect = function() {
    return {
      top    : 0,
      left   : 0,
      width  : document.body.offsetWidth,
      height : document.body.offsetHeight
    };
  };
})();

(function() {
  'use strict';
  window.OSjs = window.OSjs || {};
  OSjs.Utils  = OSjs.Utils  || {};
  OSjs.Utils.format = function(format) {
    var args = Array.prototype.slice.call(arguments, 1);
    var sprintfRegex = /\{(\d+)\}/g;
    function sprintf(match, number) {
      return number in args ? args[number] : match;
    }
    return format.replace(sprintfRegex, sprintf);
  };
  OSjs.Utils.cleanHTML = function(html) {
    return html.replace(/\n/g, '')
               .replace(/[\t ]+</g, '<')
               .replace(/\>[\t ]+</g, '><')
               .replace(/\>[\t ]+$/g, '>');
  };
  OSjs.Utils.parseurl = function(url, modify) {
    modify = modify || {};
    if ( !url.match(/^(\w+\:)\/\//) ) {
      url = '//' + url;
    }
    var protocol = url.split(/^(\w+\:)?\/\//);
    var splitted = (function() {
      var tmp = protocol[2].replace(/^\/\//, '').split('/');
      return {
        proto: (modify.protocol || protocol[1] || window.location.protocol || '').replace(/\:$/, ''),
        host: modify.host || tmp.shift(),
        path: modify.path || '/' + tmp.join('/')
      };
    })();
    function _parts() {
      var parts = [splitted.proto, '://'];
      if ( modify.username ) {
        var authstr = String(modify.username) + ':' + String(modify.password);
        parts.push(authstr);
        parts.push('@');
      }
      parts.push(splitted.host);
      parts.push(splitted.path);
      return parts.join('');
    }
    return {
      protocol: splitted.proto,
      host: splitted.host,
      path: splitted.path,
      url: _parts()
    };
  };
  OSjs.Utils.argumentDefaults = function(args, defaults, undef) {
    args = args || {};
    Object.keys(defaults).forEach(function(key) {
      if ( typeof defaults[key] === 'boolean' || typeof defaults[key] === 'number' ) {
        if ( typeof args[key] === 'undefined' || args[key] === null ) {
          args[key] = defaults[key];
        }
      } else {
        args[key] = args[key] || defaults[key];
      }
    });
    return args;
  };
  OSjs.Utils.mergeObject = function(obj1, obj2, opts) {
    opts = opts || {};
    for ( var p in obj2 ) {
      if ( obj2.hasOwnProperty(p) ) {
        try {
          if (opts.overwrite === false && obj1.hasOwnProperty(p)) {
            continue;
          }
          if ( obj2[p].constructor === Object ) {
            obj1[p] = OSjs.Utils.mergeObject(obj1[p], obj2[p]);
          } else {
            obj1[p] = obj2[p];
          }
        } catch (e) {
          obj1[p] = obj2[p];
        }
      }
    }
    return obj1;
  };
  OSjs.Utils.cloneObject = function(o) {
    return JSON.parse(JSON.stringify(o, function(key, value) {
      if ( value && typeof value === 'object' && value.tagName ) {
        return undefined;
      }
      return value;
    }));
  };
  OSjs.Utils.fixJSON = function(response) {
    if ( typeof response === 'string' ) {
      if ( response.match(/^\{|\[/) ) {
        try {
          response = JSON.parse(response);
        } catch ( e  ) {
          console.warn('FAILED TO FORCE JSON MIME TYPE', e);
        }
      }
    }
    return response;
  };
  OSjs.Utils.convertToRGB = function(hex) {
    var rgb = parseInt(hex.replace('#', ''), 16);
    var val = {};
    val.r = (rgb & (255 << 16)) >> 16;
    val.g = (rgb & (255 << 8)) >> 8;
    val.b = (rgb & 255);
    return val;
  };
  OSjs.Utils.convertToHEX = function(r, g, b) {
    if ( typeof r === 'object' ) {
      g = r.g;
      b = r.b;
      r = r.r;
    }
    if ( typeof r === 'undefined' || typeof g === 'undefined' || typeof b === 'undefined' ) {
      throw new Error('Invalid RGB supplied to convertToHEX()');
    }
    var hex = [
      parseInt(r, 10).toString( 16 ),
      parseInt(g, 10).toString( 16 ),
      parseInt(b, 10).toString( 16 )
    ];
    Object.keys(hex).forEach(function(i) {
      if ( hex[i].length === 1 ) {
        hex[i] = '0' + hex[i];
      }
    });
    return '#' + hex.join('').toUpperCase();
  };
  OSjs.Utils.invertHEX = function(hex) {
    var color = parseInt(hex.replace('#', ''), 16);
    color = 0xFFFFFF ^ color;
    color = color.toString(16);
    color = ('000000' + color).slice(-6);
    return '#' + color;
  };
  OSjs.Utils.asyncs = function(queue, onentry, ondone) {
    onentry = onentry || function(e, i, n) { n(); };
    ondone  = ondone  || function() {};
    function next(i) {
      if ( i >= queue.length ) {
        ondone();
        return;
      }
      try {
        onentry(queue[i], i, function() {
          next(i + 1);
        });
      } catch ( e ) {
        console.warn('Utils::async()', 'Exception while stepping', e.stack, e);
        next(i + 1);
      }
    }
    next(0);
  };
})();

(function() {
  'use strict';
  window.OSjs = window.OSjs || {};
  OSjs.Utils  = OSjs.Utils  || {};
  function EventCollection() {
    this.collection = [];
  }
  EventCollection.prototype.add = function(el, iter) {
    el.addEventListener.apply(el, iter);
    this.collection.push([el, iter]);
  };
  EventCollection.prototype.destroy = function(el, iter) {
    this.collection.forEach(function(iter) {
      if ( iter[0] && iter[1] ) {
        iter[0].removeEventListener.apply(iter[0], iter[1]);
      }
    });
  };
  OSjs.Utils._preventDefault = function(ev) {
    ev.preventDefault();
    return false;
  };
  OSjs.Utils.Keys = {
    F1: 112,
    F2: 113,
    F3: 114,
    F4: 115,
    F6: 118,
    F7: 119,
    F8: 120,
    F9: 121,
    F10: 122,
    F11: 123,
    F12: 124,
    TILDE:      220,
    CMD:        17,
    LSUPER:     91,
    RSUPER:     92,
    DELETE:     46,
    INSERT:     45,
    HOME:       36,
    END:        35,
    PGDOWN:     34,
    PGUP:       33,
    PAUSE:      19,
    BREAK:      19,
    CAPS_LOCK:  20,
    SCROLL_LOCK:186,
    BACKSPACE:  8,
    SPACE:      32,
    TAB:        9,
    ENTER:      13,
    ESC:        27,
    LEFT:       37,
    RIGHT:      39,
    UP:         38,
    DOWN:       40
  };
  (function() {
    for ( var n = 48; n <= 57; n++ ) {
      OSjs.Utils.Keys[String.fromCharCode(n).toUpperCase()] = n;
    }
    for ( var c = 65; c <= 90; c++ ) {
      OSjs.Utils.Keys[String.fromCharCode(c).toUpperCase()] = c;
    }
  })();
  OSjs.Utils.mouseButton = function(ev) {
    if ( typeof ev.button !== 'undefined' ) {
      if ( ev.button === 0 ) {
        return 'left';
      } else if ( ev.button === 1 ) {
        return 'middle';
      }
      return 'right';
    }
    if ( ev.which === 2 || ev.which === 4 ) {
      return 'middle';
    } else if ( ev.which === 1 ) {
      return 'left';
    }
    return 'right';
  };
  OSjs.Utils.$ = function(id) {
    return document.getElementById(id);
  };
  OSjs.Utils.$safeName = function(str) {
    return (str || '').replace(/[^a-zA-Z0-9]/g, '_');
  };
  OSjs.Utils.$remove = function(node) {
    if ( node && node.parentNode ) {
      node.parentNode.removeChild(node);
    }
    return null;
  };
  OSjs.Utils.$empty = function(myNode) {
    if ( myNode ) {
      while (myNode.firstChild) {
        myNode.removeChild(myNode.firstChild);
      }
    }
  };
  OSjs.Utils.$getStyle = function(oElm, strCssRule) {
    var strValue = '';
    if ( document.defaultView && document.defaultView.getComputedStyle ) {
      strValue = document.defaultView.getComputedStyle(oElm, '').getPropertyValue(strCssRule);
    } else if ( oElm.currentStyle ) {
      strCssRule = strCssRule.replace(/\-(\w)/g, function(strMatch, p1) {
        return p1.toUpperCase();
      });
      strValue = oElm.currentStyle[strCssRule];
    }
    return strValue;
  };
  OSjs.Utils.$position = function(el, parentEl) {
    if ( el ) {
      if ( parentEl ) {
        var result = {left:0, top:0, width: el.offsetWidth, height: el.offsetHeight};
        while ( true ) {
          result.left += el.offsetLeft;
          result.top  += el.offsetTop;
          if ( el.offsetParent ===  parentEl || el.offsetParent === null ) {
            break;
          }
          el = el.offsetParent;
        }
        return result;
      }
      return el.getBoundingClientRect();
    }
    return null;
  };
  OSjs.Utils.$index = function(el, parentEl) {
    parentEl = parentEl || el.parentNode;
    var nodeList = Array.prototype.slice.call(parentEl.children);
    var nodeIndex = nodeList.indexOf(el, parentEl);
    return nodeIndex;
  };
  OSjs.Utils.$selectRange = function(field, start, end) {
    if ( !field ) { throw new Error('Cannot select range: missing element'); }
    if ( typeof start === 'undefined' || typeof end === 'undefined' ) { throw new Error('Cannot select range: mising start/end'); }
    if ( field.createTextRange ) {
      var selRange = field.createTextRange();
      selRange.collapse(true);
      selRange.moveStart('character', start);
      selRange.moveEnd('character', end);
      selRange.select();
      field.focus();
    } else if ( field.setSelectionRange ) {
      field.focus();
      field.setSelectionRange(start, end);
    } else if ( typeof field.selectionStart !== 'undefined' ) {
      field.selectionStart = start;
      field.selectionEnd = end;
      field.focus();
    }
  };
  OSjs.Utils.$addClass = function(el, name) {
    if ( el && name && !this.$hasClass(el, name) ) {
      el.className += (el.className ? ' ' : '') + name;
    }
  };
  OSjs.Utils.$removeClass = function(el, name) {
    if ( el && name && this.$hasClass(el, name) ) {
      var re = new RegExp('\\s?' + name);
      el.className = el.className.replace(re, '');
    }
  };
  OSjs.Utils.$hasClass = function(el, name) {
    if ( el && name ) {
      return el.className.replace(/\s+/, ' ').split(' ').indexOf(name) >= 0;
    }
    return false;
  };
  OSjs.Utils.$escape = function(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  };
  OSjs.Utils.$createCSS = function(src) {
    var res    = document.createElement('link');
    document.getElementsByTagName('head')[0].appendChild(res);
    res.rel    = 'stylesheet';
    res.type   = 'text/css';
    res.href   = src;
    return res;
  };
  OSjs.Utils.$createJS = function(src, onreadystatechange, onload, onerror) {
    var res                = document.createElement('script');
    res.type               = 'text/javascript';
    res.charset            = 'utf-8';
    res.onreadystatechange = onreadystatechange || function() {};
    res.onload             = onload             || function() {};
    res.onerror            = onerror            || function() {};
    res.src                = src;
    document.getElementsByTagName('head')[0].appendChild(res);
    return res;
  };
  OSjs.Utils.$isFormElement = function(ev, types) {
    types = types || ['TEXTAREA', 'INPUT', 'SELECT'];
    var d = ev.srcElement || ev.target;
    if ( d ) {
      if ( types.indexOf(d.tagName.toUpperCase()) >= 0 ) {
        if ( !(d.readOnly || d.disabled) ) {
          return true;
        }
      }
    }
    return false;
  };
  OSjs.Utils.$isInput = function(ev) {
    return this.$isFormElement(ev); //, ['TEXTAREA', 'INPUT']);
  };
  OSjs.Utils.$bind = (function() {
    function pos(ev, touchDevice) {
      return {
        x: (touchDevice ? (ev.changedTouches[0] || {}) : ev).clientX,
        y: (touchDevice ? (ev.changedTouches[0] || {}) : ev).clientY
      };
    }
    function createTouchHandler(el, evName, collection, callback, signal) {
      var holdTimeout = null;
      var whenFinished = false;
      var isDone = false;
      function cbs(ev) {
        isDone = false;
        signal();
        if ( evName === 'click' ) {
          whenFinished = function() {
            if ( !isDone ) {
              isDone = true;
              callback.call(el, ev, pos(ev, true), true);
            }
          };
          holdTimeout = setTimeout(function() {
            whenFinished = false;
          }, 300);
        } else if ( evName === 'contextmenu' ) {
          holdTimeout = setTimeout(function() {
            if ( !isDone ) {
              isDone = true;
              ev.stopPropagation();
              ev.preventDefault();
              callback.call(el, ev, pos(ev, true), true);
            }
          }, 450);
        } else if ( evName === 'dblclick' ) {
          if ( el.getAttribute('data-tmp-clicked') !== 'true' ) {
            el.setAttribute('data-tmp-clicked', 'true');
            setTimeout(function() {
              el.removeAttribute('data-tmp-clicked');
            }, 500);
          } else {
            ev.stopPropagation();
            ev.preventDefault();
            callback.call(el, ev, pos(ev, true), true);
          }
        }
      }
      function cbe(ev) {
        signal();
        if ( typeof whenFinished === 'function' ) {
          whenFinished();
        }
        holdTimeout = clearTimeout(holdTimeout);
        whenFinished = false;
      }
      collection.add(el, ['touchstart', cbs, true]);
      collection.add(el, ['touchend', cbe, true]);
    }
    return function(el, evName, callback, param) {
      var touchMap = {
        click: createTouchHandler,
        contextmenu: createTouchHandler,
        dblclick: createTouchHandler,
        mouseup: 'touchend',
        mousemove: 'touchmove',
        mousedown: 'touchstart'
      };
      var collection = new EventCollection();
      var tev = touchMap[evName];
      var wasTouch = false;
      function cbTouch(ev) {
        callback.call(el, ev, pos(ev, true), true);
      }
      function cbNormal(ev) {
        if ( !wasTouch ) {
          callback.call(el, ev, pos(ev), false);
        }
      }
      if ( typeof tev === 'function' ) {
        tev(el, evName, collection, callback, function() {
          wasTouch = true;
        });
      } else if ( typeof tev === 'string' ) {
        collection.add(el, [tev, cbTouch, param === true]);
      }
      collection.add(el, [evName, cbNormal, param === true]);
      return collection;
    };
  })();
  OSjs.Utils.$unbind = function(collection) {
    if ( collection && collection instanceof EventCollection ) {
      collection.destroy();
    }
    return null;
  };
})();

(function() {
  'use strict';
  window.OSjs = window.OSjs || {};
  OSjs.Utils  = OSjs.Utils  || {};
  OSjs.Utils.ajax = function(args) {
    var request;
    args = OSjs.Utils.argumentDefaults(args, {
      onerror          : function() {},
      onsuccess        : function() {},
      onprogress       : function() {},
      oncreated        : function() {},
      onfailed         : function() {},
      oncanceled       : function() {},
      ontimeout        : function() {},
      acceptcodes      : [200, 201, 304],
      method           : 'GET',
      responseType     : null,
      requestHeaders   : {},
      body             : null,
      timeout          : 0,
      json             : false,
      url              : '',
      jsonp            : false
    });
    function getResponse(ctype) {
      var response = request.responseText;
      if ( args.json && ctype.match(/^application\/json/) ) {
        try {
          response = JSON.parse(response);
        } catch (ex) {
          console.warn('Utils::ajax()', 'handleResponse()', ex);
        }
      }
      return response;
    }
    function onReadyStateChange() {
      if ( request.readyState === 4 ) {
        var ctype = request.getResponseHeader('content-type') || '';
        var result = getResponse(ctype);
        if ( request.status === 200 || request.status === 201 ) {
          args.onsuccess(result, request, args.url);
        } else {
          var error = OSjs.API._('ERR_UTILS_XHR_FMT', request.status.toString());
          args.onerror(error, result, request, args.url);
        }
      }
    }
    function requestJSONP() {
      var loaded  = false;
      OSjs.Utils.$createJS(args.url, function() {
        if ( (this.readyState === 'complete' || this.readyState === 'loaded') && !loaded) {
          loaded = true;
          args.onsuccess();
        }
      }, function() {
        if ( loaded ) { return; }
        loaded = true;
        args.onsuccess();
      }, function() {
        if ( loaded ) { return; }
        loaded = true;
        args.onerror();
      });
    }
    function cleanup() {
      if ( request.upload ) {
        request.upload.removeEventListener('progress', args.onprogress, false);
      } else {
        request.removeEventListener('progress', args.onprogress, false);
      }
      request.removeEventListener('error', args.onfailed, false);
      request.removeEventListener('abort', args.oncanceled, false);
      request.onerror = null;
      request.onload = null;
      request.onreadystatechange = null;
      request.ontimeut = null;
      request = null;
    }
    function requestJSON() {
      request = new XMLHttpRequest();
      try {
        request.timeout = args.timeout;
      } catch ( e ) {}
      if ( request.upload ) {
        request.upload.addEventListener('progress', args.onprogress, false);
      } else {
        request.addEventListener('progress', args.onprogress, false);
      }
      request.ontimeout = function(evt) {
        args.ontimeout(evt);
      };
      if ( args.responseType === 'arraybuffer' ) { // Binary
        request.onerror = function(evt) {
          var error = request.response || OSjs.API._('ERR_UTILS_XHR_FATAL');
          args.onerror(error, evt, request, args.url);
          cleanup();
        };
        request.onload = function(evt) {
          if ( args.acceptcodes.indexOf(request.status) >= 0 ) {
            args.onsuccess(request.response, request, args.url);
          } else {
            OSjs.VFS.abToText(request.response, 'text/plain', function(err, txt) {
              var error = txt || err || OSjs.API._('ERR_UTILS_XHR_FATAL');
              args.onerror(error, evt, request, args.url);
            });
          }
          cleanup();
        };
      } else {
        request.addEventListener('error', args.onfailed, false);
        request.addEventListener('abort', args.oncanceled, false);
        request.onreadystatechange = onReadyStateChange;
      }
      request.open(args.method, args.url, true);
      Object.keys(args.requestHeaders).forEach(function(h) {
        request.setRequestHeader(h, args.requestHeaders[h]);
      });
      request.responseType = args.responseType || '';
      args.oncreated(request);
      request.send(args.body);
    }
    if ( (OSjs.API.getConfig('Connection.Type') === 'standalone') ) {
      args.onerror('You are currently running locally and cannot perform this operation!', null, request, args.url);
      return;
    }
    if ( args.json && (typeof args.body !== 'string') && !(args.body instanceof FormData) ) {
      args.body = JSON.stringify(args.body);
      if ( typeof args.requestHeaders['Content-Type'] === 'undefined' ) {
        args.requestHeaders['Content-Type'] = 'application/json';
      }
    }
    if ( args.jsonp ) {
      requestJSONP();
      return;
    }
    requestJSON();
  };
  OSjs.Utils.preload = (function() {
    var _LOADED = {};
    function isCSSLoaded(path) {
      var result = false;
      (document.styleSheet || []).forEach(function(iter, i) {
        if ( iter.href.indexOf(path) !== -1 ) {
          result = true;
          return false;
        }
        return true;
      });
      return result;
    }
    function createStyle(src, callback, opts) {
      src = src + '?' + Math.floor(Math.random()*80000);
      opts = opts || {};
      opts.check = (typeof opts.check === 'undefined') ? true : (opts.check === true);
      opts.interval = opts.interval || 50;
      opts.maxTries = opts.maxTries || 10;
      function _finished(result) {
        _LOADED[src] = result;
        callback(result, src);
      }
      OSjs.Utils.$createCSS(src);
      if ( opts.check === false || (typeof document.styleSheet === 'undefined') || isCSSLoaded(src) ) {
        _finished(true);
        return;
      }
      var tries = opts.maxTries;
      var ival = setInterval(function() {
        if ( isCSSLoaded(src) || (tries <= 0) ) {
          ival = clearInterval(ival);
          _finished(tries > 0);
          return;
        }
        tries--;
      }, opts.interval);
    }
    function createScript(src, callback) {
      src = src + '?' + Math.floor(Math.random()*80000);
      var _finished = function(result) {
        _LOADED[src] = result;
        callback(result, src);
      };
      var loaded  = false;
      OSjs.Utils.$createJS(src, function() {
        if ( (this.readyState === 'complete' || this.readyState === 'loaded') && !loaded) {
          loaded = true;
          _finished(true);
        }
      }, function() {
        if ( loaded ) { return; }
        loaded = true;
        _finished(true);
      }, function() {
        if ( loaded ) { return; }
        loaded = true;
        _finished(false);
      });
    }
    return function(list, callback, callbackProgress, args) {
      list = (list || []).slice();
      args = args || {};
      var successes  = [];
      var failed     = [];
      OSjs.Utils.asyncs(list, function(item, index, next) {
        function _loaded(success, src) {
          (callbackProgress || function() {})(index, list.length);
          (success ? successes : failed).push(src);
          next();
        }
        if ( item ) {
          if ( _LOADED[item.src] === true && (item.force !== true && args.force !== true) ) {
            _loaded(true);
            return;
          }
          var src = item.src;
          if ( src.substr(0, 1) !== '/' && !src.match(/^(https?|ftp)/) ) {
            src = window.location.href + src;
          }
          if ( item.type.match(/^style/) ) {
            createStyle(src, _loaded);
          } else if ( item.type.match(/script$/) ) {
            createScript(src, _loaded);
          }
        } else {
          next();
        }
      }, function() {
        (callback || function() {})(list.length, failed, successes);
      });
    };
  })();
})();

(function() {
  'use strict';
  window.OSjs = window.OSjs || {};
  OSjs.Utils  = OSjs.Utils  || {};
  OSjs.Utils.checkdir = function(path) {
    if ( path && window.location.href.match(/^file\:\/\//) ) {
      path = path.replace(/^\//, '');
    }
    return path;
  };
  OSjs.Utils.filext = function(d) {
    var ext = OSjs.Utils.filename(d).split('.').pop();
    return ext ? ext.toLowerCase() : null;
  };
  OSjs.Utils.dirname = function(f) {
    function _parentDir(p) {
      var pstr   = p.split(/^(.*)\:\/\/(.*)/).filter(function(n) { return n !== ''; });
      var args   = pstr.pop();
      var prot   = pstr.pop();
      var result = '';
      var tmp = args.split('/').filter(function(n) { return n !== ''; });
      if ( tmp.length ) {
        tmp.pop();
      }
      result = tmp.join('/');
      if ( !result.match(/^\//) ) {
        result = '/' + result;
      }
      if ( prot ) {
        result = prot + '://' + result;
      }
      return result;
    }
    return f === '/' ? f : _parentDir(f.replace(/\/$/, ''));
  };
  OSjs.Utils.filename = function(p) {
    return (p || '').replace(/\/$/, '').split('/').pop();
  };
  OSjs.Utils.humanFileSize = function(bytes, si) {
    var thresh = si ? 1000 : 1024;
    if (bytes < thresh) { return bytes + ' B'; }
    var units = si ? ['kB','MB','GB','TB','PB','EB','ZB','YB'] : ['KiB','MiB','GiB','TiB','PiB','EiB','ZiB','YiB'];
    var u = -1;
    do {
      bytes /= thresh;
      ++u;
    } while (bytes >= thresh);
    return bytes.toFixed(1) + ' ' + units[u];
  };
  OSjs.Utils.escapeFilename = function(n) {
    return (n || '').replace(/[\|&;\$%@"<>\(\)\+,\*\/]/g, '').trim();
  };
  OSjs.Utils.replaceFileExtension = function(filename, rep) {
    var spl = filename.split('.');
    spl.pop();
    spl.push(rep);
    return spl.join('.');
  };
  OSjs.Utils.replaceFilename = function(orig, newname) {
    var spl = orig.split('/');
    spl.pop();
    spl.push(newname);
    return spl.join('/');
  };
  OSjs.Utils.pathJoin = function() {
    var parts = [];
    var prefix = '';
    var i, s;
    for ( i = 0; i < arguments.length; i++ ) {
      s = String(arguments[i]);
      if ( s.match(/^([A-z0-9\-_]+)\:\//) ) {
        prefix = s.replace(/\/+$/, '//');
        continue;
      }
      s = s.replace(/^\/+/, '').replace(/\/+$/, '');
      parts.push(s);
    }
    return prefix + '/' + parts.join('/');
  };
  OSjs.Utils.getFilenameRange = function(val) {
    val = val || '';
    var range = {min: 0, max: val.length};
    if ( val.match(/^\./) ) {
      if ( val.length >= 2 ) {
        range.min = 1;
      }
    } else {
      if ( val.match(/\.(\w+)$/) ) {
        var m = val.split(/\.(\w+)$/);
        for ( var i = m.length - 1; i >= 0; i-- ) {
          if ( m[i].length ) {
            range.max = val.length - m[i].length - 1;
            break;
          }
        }
      }
    }
    return range;
  };
  OSjs.Utils.btoaUrlsafe = function(str) {
    return (!str || !str.length) ? '' : btoa(str)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  };
  OSjs.Utils.atobUrlsafe = function(str) {
    if ( str && str.length ) {
      str = (str + '===').slice(0, str.length + (str.length % 4));
      return atob(str.replace(/-/g, '+').replace(/_/g, '/'));
    }
    return '';
  };
  OSjs.Utils.btoaUtf = function(str) { // Encode
    var _unescape = window.unescape || function(s) {
      function d(x, n) {
        return String.fromCharCode(parseInt(n, 16));
      }
      return s.replace(/%([0-9A-F]{2})/i, d);
    };
    str = _unescape(encodeURIComponent(str));
    return btoa(str);
  };
  OSjs.Utils.atobUtf = function(str) { // Decode
    var _escape = window.escape || function(s) {
      function q(c) {
        c = c.charCodeAt();
        return '%' + (c < 16 ? '0' : '') + c.toString(16).toUpperCase();
      }
      return s.replace(/[\x00-),:-?[-^`{-\xFF]/g, q);
    };
    var trans = _escape(atob(str));
    return decodeURIComponent(trans);
  };
  OSjs.Utils.checkAcceptMime = function(mime, list) {
    if ( mime && list.length ) {
      var re;
      for ( var i = 0; i < list.length; i++ ) {
        re = new RegExp(list[i]);
        if ( re.test(mime) === true ) {
          return true;
        }
      }
    }
    return false;
  };
})();

(function() {
  'use strict';
  window.OSjs       = window.OSjs       || {};
  OSjs.API          = OSjs.API          || {};
  var DefaultLocale = 'en_EN';
  var CurrentLocale = 'en_EN';
  var _MENU;              // Current open 'OSjs.GUI.Menu'
  var _CLIPBOARD;         // Current 'clipboard' data
  var _hooks = {
    'onInitialize':          [],
    'onInited':              [],
    'onWMInited':            [],
    'onSessionLoaded':       [],
    'onLogout':              [],
    'onShutdown':            [],
    'onApplicationPreload':  [],
    'onApplicationLaunch':   [],
    'onApplicationLaunched': []
  };
  function ServiceNotificationIcon() {
    this.entries = {};
    this.size = 0;
    this.notif = null;
    this.init();
  }
  ServiceNotificationIcon.prototype.init = function() {
    var wm = OSjs.Core.getWindowManager();
    var self = this;
    function show(ev) {
      self.displayMenu(ev);
      return false;
    }
    if ( wm ) {
      this.notif = wm.createNotificationIcon('ServiceNotificationIcon', {
        image: OSjs.API.getIcon('status/gtk-dialog-authentication.png'),
        onContextMenu: show,
        onClick: show,
        onInited: function(el, img) {
          self._updateIcon();
        }
      });
      this._updateIcon();
    }
  };
  ServiceNotificationIcon.prototype.destroy = function() {
    var wm = OSjs.Core.getWindowManager();
    if ( wm ) {
      wm.removeNotificationIcon('ServiceNotificationIcon');
    }
    this.size = 0;
    this.entries = {};
    this.notif = null;
  };
  ServiceNotificationIcon.prototype._updateIcon = function() {
    if ( this.notif ) {
      this.notif.$container.style.display = this.size ? 'inline-block' : 'none';
      this.notif.setTitle(OSjs.API._('SERVICENOTIFICATION_TOOLTIP', this.size.toString()));
    }
  };
  ServiceNotificationIcon.prototype.displayMenu = function(ev) {
    var menu = [];
    var entries = this.entries;
    Object.keys(entries).forEach(function(name) {
      menu.push({
        title: name,
        menu: entries[name]
      });
    });
    OSjs.API.createMenu(menu, ev);
  };
  ServiceNotificationIcon.prototype.add = function(name, menu) {
    if ( !this.entries[name] ) {
      this.entries[name] = menu;
      this.size++;
      this._updateIcon();
    }
  };
  ServiceNotificationIcon.prototype.remove = function(name) {
    if ( this.entries[name] ) {
      delete this.entries[name];
      this.size--;
      this._updateIcon();
    }
  };
  function doTranslate() {
    var s = arguments[0];
    var a = arguments;
    if ( OSjs.Locales[CurrentLocale][s] ) {
      a[0] = OSjs.Locales[CurrentLocale][s];
    } else {
      a[0] = OSjs.Locales[DefaultLocale][s] || s;
    }
    return a.length > 1 ? OSjs.Utils.format.apply(null, a) : a[0];
  }
  function doTranslateList() {
    var l = arguments[0];
    var s = arguments[1];
    var a = Array.prototype.slice.call(arguments, 1);
    if ( l[CurrentLocale] && l[CurrentLocale][s] ) {
      a[0] = l[CurrentLocale][s];
    } else {
      a[0] = l[DefaultLocale] ? (l[DefaultLocale][s] || s) : s;
      if ( a[0] && a[0] === s ) {
        a[0] = doTranslate.apply(null, a);
      }
    }
    return a.length > 1 ? OSjs.Utils.format.apply(null, a) : a[0];
  }
  function doGetLocale() {
    return CurrentLocale;
  }
  function doSetLocale(l) {
    if ( OSjs.Locales[l] ) {
      CurrentLocale = l;
    } else {
      console.warn('doSetLocale()', 'Invalid locale', l, '(Using default)');
      CurrentLocale = DefaultLocale;
    }
    var html = document.querySelector('html');
    if ( html ) {
      html.setAttribute('lang', l);
    }
  }
  function doCurl(args, callback) {
    args = args || {};
    callback = callback || {};
    var opts = args.body;
    if ( typeof opts === 'object' ) {
      console.warn('DEPRECATION WARNING', 'The \'body\' wrapper is no longer needed');
    } else {
      opts = args;
    }
    doAPICall('curl', opts, callback, args.options);
  }
  var _CALL_INDEX = 1;
  function doAPICall(m, a, cb, options) {
    a = a || {};
    var lname = 'APICall_' + _CALL_INDEX;
    if ( typeof a.__loading === 'undefined' || a.__loading === true ) {
      createLoading(lname, {className: 'BusyNotification', tooltip: 'API Call'});
    }
    if ( typeof cb !== 'function' ) {
      throw new TypeError('call() expects a function as callback');
    }
    if ( options && typeof options !== 'object' ) {
      throw new TypeError('call() expects an object as options');
    }
    _CALL_INDEX++;
    var handler = OSjs.Core.getHandler();
    return handler.callAPI(m, a, function(response) {
      destroyLoading(lname);
      response = response || {};
      cb(response.error || false, response.result);
    }, function(err) {
      cb(err);
    }, options);
  }
  function doLaunchFile(file, launchArgs) {
    launchArgs = launchArgs || {};
    if ( !file.path ) { throw new Error('Cannot doLaunchFile() without a path'); }
    if ( !file.mime )  { throw new Error('Cannot doLaunchFile() without a mime type'); }
    function getApplicationNameByFile(file, forceList, callback) {
      if ( !(file instanceof OSjs.VFS.File) ) {
        throw new Error('This function excepts a OSjs.VFS.File object');
      }
      var pacman = OSjs.Core.getPackageManager();
      var val = OSjs.Core.getSettingsManager().get('DefaultApplication', file.mime);
      if ( !forceList && val ) {
        if ( pacman.getPackage(val) ) {
          callback([val]);
          return;
        }
      }
      callback(pacman.getPackagesByMime(file.mime));
    }
    var wm = OSjs.Core.getWindowManager();
    var handler = OSjs.Core.getHandler();
    var args = {file: file};
    if ( launchArgs.args ) {
      Object.keys(launchArgs.args).forEach(function(i) {
        args[i] = launchArgs.args[i];
      });
    }
    function setDefaultApplication(mime, app, callback) {
      callback = callback || function() {};
      OSjs.Core.getSettingsManager().set('DefaultApplication', mime, app);
      OSjs.Core.getSettingsManager().save('DefaultApplication', callback);
    }
    function _launch(name) {
      if ( name ) {
        OSjs.API.launch(name, args, launchArgs.onFinished, launchArgs.onError, launchArgs.onConstructed);
      }
    }
    function _onDone(app) {
      if ( app.length ) {
        if ( app.length === 1 ) {
          _launch(app[0]);
        } else {
          if ( wm ) {
            OSjs.API.createDialog('ApplicationChooser', {
              file: file,
              list: app
            }, function(ev, btn, result) {
              if ( btn !== 'ok' ) { return; }
              _launch(result.name);
              setDefaultApplication(file.mime, result.useDefault ? result.name : null);
            });
          } else {
            OSjs.API.error(OSjs.API._('ERR_FILE_OPEN'),
                           OSjs.API._('ERR_FILE_OPEN_FMT', file.path),
                           OSjs.API._('ERR_NO_WM_RUNNING') );
          }
        }
      } else {
        OSjs.API.error(OSjs.API._('ERR_FILE_OPEN'),
                       OSjs.API._('ERR_FILE_OPEN_FMT', file.path),
                       OSjs.API._('ERR_APP_MIME_NOT_FOUND_FMT', file.mime) );
      }
    }
    if ( file.mime === 'osjs/application' ) {
      doLaunchProcess(OSjs.Utils.filename(file.path));
      return;
    }
    getApplicationNameByFile(file, launchArgs.forceList, _onDone);
  }
  function doReLaunchProcess(n) {
    function relaunch(p) {
      var data = null;
      var args = {};
      if ( p instanceof OSjs.Core.Application ) {
        data = p._getSessionData();
      }
      try {
        p.destroy(true); // kill
      } catch ( e ) {
        console.warn('OSjs.API.relaunch()', e.stack, e);
      }
      if ( data !== null ) {
        args = data.args;
        args.__resume__ = true;
        args.__windows__ = data.windows || [];
      }
      args.__preload__ = {force: true};
      OSjs.API.launch(n, args);
    }
    OSjs.API.getProcess(n).forEach(relaunch);
  }
  function doLaunchProcess(n, arg, onFinished, onError, onConstructed) {
    arg           = arg           || {};
    onFinished    = onFinished    || function() {};
    onError       = onError       || function() {};
    onConstructed = onConstructed || function() {};
    if ( !n ) { throw new Error('Cannot doLaunchProcess() witout a application name'); }
    var splash = null;
    var pargs = {};
    var handler = OSjs.Core.getHandler();
    var packman = OSjs.Core.getPackageManager();
    var compability = OSjs.Utils.getCompability();
    function checkApplicationCompability(comp) {
      var result = [];
      if ( typeof comp !== 'undefined' && (comp instanceof Array) ) {
        comp.forEach(function(c, i) {
          if ( typeof compability[c] !== 'undefined' ) {
            if ( !compability[c] ) {
              result.push(c);
            }
          }
        });
      }
      return result;
    }
    function getPreloads(data) {
      var preload = (data.preload || []).slice(0);
      var additions = [];
      function _add(chk) {
        if ( chk && chk.preload ) {
          chk.preload.forEach(function(p) {
            additions.push(p);
          });
        }
      }
      if ( data.depends && data.depends instanceof Array ) {
        data.depends.forEach(function(k) {
          if ( !OSjs.Applications[k] ) {
            _add(packman.getPackage(k));
          }
        });
      }
      var pkgs = packman.getPackages(false);
      Object.keys(pkgs).forEach(function(pn) {
        var p = pkgs[pn];
        if ( p.type === 'extension' && p.uses === n ) {
          _add(p);
        }
      });
      preload = additions.concat(preload);
      additions = [];
      if ( data.scope === 'user' ) {
        preload = preload.map(function(p) {
          if ( p.src.substr(0, 1) !== '/' && !p.src.match(/^(https?|ftp)/) ) {
            OSjs.VFS.url(p.src, function(error, url) {
              if ( !error ) {
                p.src = url;
              }
            });
          }
          return p;
        });
      }
      return preload;
    }
    function _done() {
      if ( splash ) {
        splash.destroy();
        splash = null;
      }
    }
    function _error(msg, exception) {
      _done();
      OSjs.API.error(OSjs.API._('ERR_APP_LAUNCH_FAILED'),
                  OSjs.API._('ERR_APP_LAUNCH_FAILED_FMT', n),
                  msg, exception, true);
      onError(msg, n, arg, exception);
    }
    function _checkSingular(result) {
      var singular = (typeof result.singular === 'undefined') ? false : (result.singular === true);
      if ( singular ) {
        var sproc = OSjs.API.getProcess(n, true);
        if ( sproc ) {
          if ( sproc instanceof OSjs.Core.Application ) {
            sproc._onMessage(null, 'attention', arg);
          } else {
            _error(OSjs.API._('ERR_APP_LAUNCH_ALREADY_RUNNING_FMT', n));
          }
          return true;
        }
      }
      return false;
    }
    function _createInstance(result) {
      var a = null;
      try {
        a = new OSjs.Applications[n].Class(arg, result);
        onConstructed(a, result);
      } catch ( e ) {
        console.warn('Error on constructing application', e, e.stack);
        _error(OSjs.API._('ERR_APP_CONSTRUCT_FAILED_FMT', n, e), e);
        if ( a ) {
          try {
            a.destroy();
            a = null;
          } catch ( ee ) {
            console.warn('Something awful happened when trying to clean up failed launch Oo', ee);
            console.warn(ee.stack);
          }
        }
      }
      return a;
    }
    function _callback(result) {
      if ( typeof OSjs.Applications[n] === 'undefined' ) {
        _error(OSjs.API._('ERR_APP_RESOURCES_MISSING_FMT', n));
        return;
      }
      if ( typeof OSjs.Applications[n] === 'function' ) {
        OSjs.Applications[n]();
        _done();
        return;
      }
      if ( _checkSingular(result) ) {
        _done();
        return;
      }
      var a = _createInstance(result);
      try {
        var settings = OSjs.Core.getSettingsManager().get(a.__pname) || {};
        a.init(settings, result, function() {}); // NOTE: Empty function is for backward-compability
        onFinished(a, result);
        doTriggerHook('onApplicationLaunched', [{
          application: a,
          name: n,
          args: arg,
          settings: settings,
          metadata: result
        }]);
      } catch ( ex ) {
        console.warn('Error on init() application', ex, ex.stack);
        _error(OSjs.API._('ERR_APP_INIT_FAILED_FMT', n, ex.toString()), ex);
      }
      _done();
    }
    function launch() {
      doTriggerHook('onApplicationLaunch', [n, arg]);
      var data = packman.getPackage(n);
      if ( !data ) {
        _error(OSjs.API._('ERR_APP_LAUNCH_MANIFEST_FAILED_FMT', n));
        return false;
      }
      var nosupport = checkApplicationCompability(data.compability);
      if ( nosupport.length ) {
        _error(OSjs.API._('ERR_APP_LAUNCH_COMPABILITY_FAILED_FMT', n, nosupport.join(', ')));
        return false;
      }
      if ( arg.__preload__ ) {
        pargs = arg.__preload__;
        delete arg.__preload__;
      }
      if ( !OSjs.Applications[n] ) {
        if ( data.splash !== false ) {
          splash = OSjs.API.createSplash(data.name, data.icon);
        }
      }
      createLoading(n, {className: 'StartupNotification', tooltip: 'Starting ' + n});
      var preload = getPreloads(data);
      function _onLaunchPreload() {
        OSjs.Utils.preload(preload, function(total, failed) {
          destroyLoading(n);
          if ( failed.length ) {
            _error(OSjs.API._('ERR_APP_PRELOAD_FAILED_FMT', n, failed.join(',')));
            return;
          }
          setTimeout(function() {
            _callback(data);
          }, 0);
        }, function(progress, count) {
          if ( splash ) {
            splash.update(progress, count);
          }
        }, pargs);
      }
      OSjs.Utils.asyncs(_hooks.onApplicationPreload, function(qi, i, n) {
        qi(n, arg, preload, function(p) {
          if ( p && (p instanceof Array) ) {
            preload = p;
          }
          n();
        });
      }, function() {
        _onLaunchPreload();
      });
      doTriggerHook('onApplicationLaunch', [n, arg]);
      return true;
    }
    return launch();
  }
  function doLaunchProcessList(list, onSuccess, onError, onFinished) {
    list        = list        || []; 
    onSuccess   = onSuccess   || function() {};
    onError     = onError     || function() {};
    onFinished  = onFinished  || function() {};
    OSjs.Utils.asyncs(list, function(s, current, next) {
      if ( typeof s === 'string' ) {
        var args = {};
        var spl = s.split('@');
        var name = spl[0];
        if ( typeof spl[1] !== 'undefined' ) {
          try {
            args = JSON.parse(spl[1]);
          } catch ( e ) {}
        }
        s = {
          name: name,
          args: args
        };
      }
      var aname = s.name;
      var aargs = (typeof s.args === 'undefined') ? {} : (s.args || {});
      if ( !aname ) {
        console.warn('doLaunchProcessList() next()', 'No application name defined');
        next();
        return;
      }
      OSjs.API.launch(aname, aargs, function(app, metadata) {
        onSuccess(app, metadata, aname, aargs);
        next();
      }, function(err, name, args) {
        console.warn('doLaunchProcessList() _onError()', err);
        onError(err, name, args);
        next();
      });
    }, onFinished);
  }
  function doGetApplicationResource(app, name, vfspath) {
    if ( name.match(/^\//) ) {
      return name;
    }
    name = name.replace(/^\.\//, '');
    function getName() {
      var appname = null;
      if ( app instanceof OSjs.Core.Process ) {
        if ( app.__path ) {
          appname = app.__path;
        }
      } else if ( typeof app === 'string' ) {
        appname = app;
        var pacman = OSjs.Core.getPackageManager();
        var packs = pacman ? pacman.getPackages() : {};
        if ( packs[appname] ) {
          appname = packs[appname].path;
        }
      }
      return appname;
    }
    function getResultPath(path, userpkg) {
      path = OSjs.Utils.checkdir(path);
      if ( vfspath ) {
        if ( userpkg ) {
          path = path.substr(OSjs.API.getConfig('Connection.FSURI').length);
        } else {
          path = 'osjs:///' + path;
        }
      }
      return path;
    }
    function getResourcePath() {
      var appname = getName();
      var path = '';
      var root, sub;
      if ( appname ) {
        if ( appname.match(/^(.*)\/(.*)$/) ) {
          root = OSjs.API.getConfig('Connection.PackageURI');
          path = root + '/' + appname + '/' + name;
        } else {
          root = OSjs.API.getConfig('Connection.FSURI');
          sub = OSjs.API.getConfig('PackageManager.UserPackages');
          path = root + OSjs.Utils.pathJoin(sub, appname, name);
        }
      }
      return getResultPath(path, !!sub);
    }
    return getResourcePath();
  }
  function doGetThemeCSS(name) {
    var root = OSjs.API.getConfig('Connection.RootURI', '/');
    if ( name === null ) {
      return root + 'blank.css';
    }
    root = OSjs.API.getConfig('Connection.ThemeURI');
    return OSjs.Utils.checkdir(root + '/' + name + '.css');
  }
  function doGetFileIcon(file, size, icon) {
    icon = icon || 'mimetypes/gnome-fs-regular.png';
    if ( typeof file === 'object' && !(file instanceof OSjs.VFS.File) ) {
      file = new OSjs.VFS.File(file);
    }
    if ( !file.filename ) {
      throw new Error('Filename is required for getFileIcon()');
    }
    var map = [
      {match: 'application/pdf', icon: 'mimetypes/gnome-mime-application-pdf.png'},
      {match: 'application/zip', icon: 'mimetypes/folder_tar.png'},
      {match: 'application/x-python', icon: 'mimetypes/stock_script.png'},
      {match: 'application/x-lua', icon: 'mimetypes/stock_script.png'},
      {match: 'application/javascript', icon: 'mimetypes/stock_script.png'},
      {match: 'text/html', icon: 'mimetypes/stock_script.png'},
      {match: 'text/xml', icon: 'mimetypes/stock_script.png'},
      {match: 'text/css', icon: 'mimetypes/stock_script.png'},
      {match: 'osjs/document', icon: 'mimetypes/gnome-mime-application-msword.png'},
      {match: 'osjs/draw', icon: 'mimetypes/image.png'},
      {match: /^text\//, icon: 'mimetypes/txt.png'},
      {match: /^audio\//, icon: 'mimetypes/sound.png'},
      {match: /^video\//, icon: 'mimetypes/video.png'},
      {match: /^image\//, icon: 'mimetypes/image.png'},
      {match: /^application\//, icon: 'mimetypes/binary.png'}
    ];
    if ( file.type === 'dir' ) {
      icon = 'places/folder.png';
    } else if ( file.type === 'trash' ) {
      icon = 'places/user-trash.png';
    } else {
      var mime = file.mime || 'application/octet-stream';
      map.every(function(iter) {
        var match = false;
        if ( typeof iter.match === 'string' ) {
          match = (mime === iter.match);
        } else {
          match = mime.match(iter.match);
        }
        if ( match ) {
          icon = iter.icon;
          return false;
        }
        return true;
      });
    }
    return OSjs.API.getIcon(icon, size);
  }
  function doGetThemeResource(name, type) {
    name = name || null;
    type = type || null;
    var root = OSjs.API.getConfig('Connection.ThemeURI');
    function getName(str, theme) {
      if ( !str.match(/^\//) ) {
        if ( type === 'base' || type === null ) {
          str = root + '/' + theme + '/' + str;
        } else {
          str = root + '/' + theme + '/' + type + '/' + str;
        }
      }
      return str;
    }
    if ( name ) {
      var wm = OSjs.Core.getWindowManager();
      var theme = (wm ? wm.getSetting('theme') : 'default') || 'default';
      name = getName(name, theme);
    }
    return OSjs.Utils.checkdir(name);
  }
  function doGetSound(name) {
    name = name || null;
    if ( name ) {
      var wm = OSjs.Core.getWindowManager();
      var theme = wm ? wm.getSoundTheme() : 'default';
      var root = OSjs.API.getConfig('Connection.SoundURI');
      var compability = OSjs.Utils.getCompability();
      if ( !name.match(/^\//) ) {
        var ext = 'oga';
        if ( !compability.audioTypes.ogg ) {
          ext = 'mp3';
        }
        name = root + '/' + theme + '/' + name + '.' + ext;
      }
    }
    return OSjs.Utils.checkdir(name);
  }
  function doGetIcon(name, size, app) {
    name = name || null;
    size = size || '16x16';
    app  = app  || null;
    var root = OSjs.API.getConfig('Connection.IconURI');
    var wm = OSjs.Core.getWindowManager();
    var theme = wm ? wm.getIconTheme() : 'default';
    function checkIcon() {
      if ( name.match(/^\.\//) ) {
        name = name.replace(/^\.\//, '');
        if ( (app instanceof OSjs.Core.Application) || (typeof app === 'string') ) {
          return OSjs.API.getApplicationResource(app, name);
        } else {
          if ( app !== null && typeof app === 'object' ) {
            return OSjs.API.getApplicationResource(app.path, name);
          }
        }
      } else {
        if ( !name.match(/^\//) ) {
          name = root + '/' + theme + '/' + size + '/' + name;
        }
      }
      return null;
    }
    if ( name && !name.match(/^(http|\/\/)/) ) {
      var chk = checkIcon();
      if ( chk !== null ) {
        return chk;
      }
    }
    return OSjs.Utils.checkdir(name);
  }
  function doGetConfig(path, defaultValue) {
    var config = OSjs.Utils.cloneObject(OSjs.Core.getConfig());
    if ( typeof path === 'string' ) {
      var result = window.undefined;
      var queue = path.split(/\./);
      var ns = config;
      queue.forEach(function(k, i) {
        if ( i >= queue.length - 1 ) {
          result = ns[k];
        } else {
          ns = ns[k];
        }
      });
      if ( typeof result === 'undefined' ) {
        return defaultValue;
      }
      if ( typeof defaultValue !== 'undefined' ) {
        return result || defaultValue;
      }
      return result;
    }
    return config;
  }
  function doGetDefaultPath(fallback) {
    if ( fallback && fallback.match(/^\//) ) {
      fallback = null;
    }
    return OSjs.API.getConfig('VFS.Home') || fallback || 'osjs:///';
  }
  function doCreateNotification(opts) {
    var wm = OSjs.Core.getWindowManager();
    return wm.notification(opts);
  }
  function doCreateDialog(className, args, callback, parentObj) {
    callback = callback || function() {};
    function cb() {
      if ( parentObj ) {
        if ( (parentObj instanceof OSjs.Core.Window) && parentObj._destroyed ) {
          console.warn('API::createDialog()', 'INGORED EVENT: Window was destroyed');
          return;
        }
        if ( (parentObj instanceof OSjs.Core.Process) && parentObj.__destroyed ) {
          console.warn('API::createDialog()', 'INGORED EVENT: Process was destroyed');
          return;
        }
      }
      callback.apply(null, arguments);
    }
    var win = typeof className === 'string' ? new OSjs.Dialogs[className](args, cb) : className(args, cb);
    if ( !parentObj ) {
      var wm = OSjs.Core.getWindowManager();
      wm.addWindow(win, true);
    } else if ( parentObj instanceof OSjs.Core.Window ) {
      win._addHook('destroy', function() {
        if ( parentObj ) {
          parentObj._focus();
        }
      });
      parentObj._addChild(win, true);
    } else if ( parentObj instanceof OSjs.Core.Application ) {
      parentObj._addWindow(win);
    }
    setTimeout(function() {
      win._focus();
    }, 10);
    return win;
  }
  function createLoading(name, opts, panelId) {
    var wm = OSjs.Core.getWindowManager();
    if ( wm ) {
      if ( wm.createNotificationIcon(name, opts, panelId) ) {
        return name;
      }
    }
    return false;
  }
  function destroyLoading(name, panelId) {
    var wm = OSjs.Core.getWindowManager();
    if ( name ) {
      if ( wm ) {
        if ( wm.removeNotificationIcon(name, panelId) ) {
          return true;
        }
      }
    }
    return false;
  }
  function doCheckPermission(group) {
    var user = OSjs.Core.getHandler().getUserData();
    var userGroups = user.groups || [];
    if ( !(group instanceof Array) ) {
      group = [group];
    }
    var result = true;
    if ( userGroups.indexOf('admin') < 0 ) {
      group.every(function(g) {
        if ( userGroups.indexOf(g) < 0 ) {
          result = false;
        }
        return result;
      });
    }
    return result;
  }
  function doCreateSplash(name, icon, label, parentEl) {
    label = label || 'Starting';
    parentEl = parentEl || document.body;
    var splash = document.createElement('application-splash');
    splash.setAttribute('role', 'dialog');
    var img;
    if ( icon ) {
      img = document.createElement('img');
      img.alt = name;
      img.src = OSjs.API.getIcon(icon);
    }
    var titleText = document.createElement('b');
    titleText.appendChild(document.createTextNode(name));
    var title = document.createElement('span');
    title.appendChild(document.createTextNode(label + ' '));
    title.appendChild(titleText);
    title.appendChild(document.createTextNode('...'));
    var splashBar = document.createElement('gui-progress-bar');
    OSjs.GUI.Elements['gui-progress-bar'].build(splashBar);
    if ( img ) {
      splash.appendChild(img);
    }
    splash.appendChild(title);
    splash.appendChild(splashBar);
    parentEl.appendChild(splash);
    return {
      destroy: function() {
        splash = OSjs.Utils.$remove(splash);
        img = null;
        title = null;
        titleText = null;
        splashBar = null;
      },
      update: function(p, c) {
        if ( !splash || !splashBar ) { return; }
        var per = c ? 0 : 100;
        if ( c ) {
          per = (p / c) * 100;
        }
        (new OSjs.GUI.Element(splashBar)).set('value', per);
      }
    };
  }
  function doErrorDialog(title, message, error, exception, bugreport) {
    if ( OSjs.API.getConfig('BugReporting') ) {
      bugreport = typeof bugreport === 'undefined' ? false : (bugreport ? true : false);
    } else {
      bugreport = false;
    }
    OSjs.API.blurMenu();
    var wm = OSjs.Core.getWindowManager();
    if ( wm && wm._fullyLoaded ) {
      try {
        return OSjs.API.createDialog('Error', {
          title: title,
          message: message,
          error: error,
          exception: exception,
          bugreport: bugreport
        });
      } catch ( e ) {
        console.warn('An error occured while creating Dialogs.Error', e);
        console.warn('stack', e.stack);
      }
    }
    window.alert(title + '\n\n' + message + '\n\n' + error);
    return null;
  }
  function doPlaySound(name, volume) {
    var compability = OSjs.Utils.getCompability();
    if ( !compability.audio ) {
      return false;
    }
    var wm = OSjs.Core.getWindowManager();
    if ( wm && !wm.getSetting('enableSounds') ) {
      return false;
    }
    if ( typeof volume === 'undefined' ) {
      volume = 1.0;
    }
    var f = OSjs.API.getSound(name);
    var a = new Audio(f);
    a.volume = volume;
    a.play();
    return a;
  }
  function doSetClipboard(data) {
    _CLIPBOARD = data;
  }
  function doGetClipboard() {
    return _CLIPBOARD;
  }
  var doGetServiceNotificationIcon = (function() {
    var _instance;
    return function() {
      if ( !_instance ) {
        _instance = new ServiceNotificationIcon();
      }
      return _instance;
    };
  })();
  function doSignOut() {
    var handler = OSjs.Core.getHandler();
    var wm = OSjs.Core.getWindowManager();
    function signOut(save) {
      OSjs.API.playSound('service-logout');
      handler.logout(save, function() {
        OSjs.API.shutdown();
      });
    }
    if ( wm ) {
      var user = handler.getUserData() || {name: OSjs.API._('LBL_UNKNOWN')};
      OSjs.API.createDialog('Confirm', {
        title: OSjs.API._('DIALOG_LOGOUT_TITLE'),
        message: OSjs.API._('DIALOG_LOGOUT_MSG_FMT', user.name)
      }, function(ev, btn) {
        if ( btn === 'yes' ) {
          signOut(true);
        } else if ( btn === 'no' ) {
          signOut(false);
        }
      });
    } else {
      signOut(true);
    }
  }
  function doTriggerHook(name, args, thisarg) {
    thisarg = thisarg || OSjs;
    args = args || [];
    if ( _hooks[name] ) {
      _hooks[name].forEach(function(hook) {
        if ( typeof hook === 'function' ) {
          try {
            hook.apply(thisarg, args);
          } catch ( e ) {
            console.warn('Error on Hook', e, e.stack);
          }
        } else {
          console.warn('No such Hook', name);
        }
      });
    }
  }
  function doAddHook(name, fn) {
    if ( typeof _hooks[name] !== 'undefined' ) {
      _hooks[name].push(fn);
    }
  }
  OSjs.API._                      = doTranslate;
  OSjs.API.__                     = doTranslateList;
  OSjs.API.getLocale              = doGetLocale;
  OSjs.API.setLocale              = doSetLocale;
  OSjs.API.curl                   = doCurl;
  OSjs.API.call                   = doAPICall;
  OSjs.API.open                   = doLaunchFile;
  OSjs.API.launch                 = doLaunchProcess;
  OSjs.API.launchList             = doLaunchProcessList;
  OSjs.API.relaunch               = doReLaunchProcess;
  OSjs.API.getApplicationResource = doGetApplicationResource;
  OSjs.API.getThemeCSS            = doGetThemeCSS;
  OSjs.API.getIcon                = doGetIcon;
  OSjs.API.getFileIcon            = doGetFileIcon;
  OSjs.API.getThemeResource       = doGetThemeResource;
  OSjs.API.getSound               = doGetSound;
  OSjs.API.getConfig              = doGetConfig;
  OSjs.API.getDefaultPath         = doGetDefaultPath;
  OSjs.API.createMenu             = function() {
    return OSjs.GUI.Helpers.createMenu.apply(null, arguments);
  };
  OSjs.API.blurMenu               = function() {
    return OSjs.GUI.Helpers.blurMenu.apply(null, arguments);
  };
  OSjs.API.createLoading          = createLoading;
  OSjs.API.destroyLoading         = destroyLoading;
  OSjs.API.createSplash           = doCreateSplash;
  OSjs.API.createDialog           = doCreateDialog;
  OSjs.API.createNotification     = doCreateNotification;
  OSjs.API.checkPermission        = doCheckPermission;
  OSjs.API.error                      = doErrorDialog;
  OSjs.API.shutdown                   = OSjs.API.shutdown || function() {}; // init.js
  OSjs.API.triggerHook                = doTriggerHook;
  OSjs.API.addHook                    = doAddHook;
  OSjs.API.signOut                    = doSignOut;
  OSjs.API.playSound                  = doPlaySound;
  OSjs.API.setClipboard               = doSetClipboard;
  OSjs.API.getClipboard               = doGetClipboard;
  OSjs.API.getServiceNotificationIcon = doGetServiceNotificationIcon;
})();

(function(Utils, API) {
  'use strict';
  window.OSjs = window.OSjs || {};
  OSjs.API    = OSjs.API    || {};
  OSjs.Core   = OSjs.Core   || {};
  var _PROCS = [];        // Running processes
  function _kill(pid, force) {
    if ( pid >= 0 ) {
      if ( _PROCS[pid] ) {
        console.warn('Killing application', pid);
        if ( _PROCS[pid].destroy(true, force) === false ) {
          return;
        }
        _PROCS[pid] = null;
      }
    }
  }
  function doKillAllProcesses(match, force) {
    if ( match ) {
      var isMatching;
      if ( match instanceof RegExp && _PROCS ) {
        isMatching = function(p) {
          return p.__pname && p.__pname.match(match);
        };
      } else if ( typeof match === 'string' ) {
        isMatching = function(p) {
          return p.__pname === match;
        };
      }
      if ( isMatching ) {
        _PROCS.forEach(function(p) {
          if ( p && isMatching(p) ) {
            _kill(p.__pid, force);
          }
        });
      }
      return;
    }
    _PROCS.forEach(function(proc, i) {
      if ( proc ) {
        proc.destroy(false, true);
      }
      _PROCS[i] = null;
    });
    _PROCS = [];
  }
  function doKillProcess(pid) {
    _kill(pid, false);
  }
  function doProcessMessage(msg, opts) {
    _PROCS.forEach(function(p, i) {
      if ( p && (p instanceof OSjs.Core.Application || p instanceof Process) ) {
        p._onMessage(null, msg, opts);
      }
    });
  }
  function doGetProcess(name, first) {
    var p;
    var result = first ? null : [];
    if ( typeof name === 'number' ) {
      return _PROCS[name];
    }
    _PROCS.every(function(p, i) {
      if ( p ) {
        if ( p.__pname === name ) {
          if ( first ) {
            result = p;
            return false;
          }
          result.push(p);
        }
      }
      return true;
    });
    return result;
  }
  function doGetProcesses() {
    return _PROCS;
  }
  function Process(name, args, metadata) {
    this.__pid        = _PROCS.push(this) - 1;
    this.__pname      = name;
    this.__args       = args || {};
    this.__metadata   = metadata || {};
    this.__started    = new Date();
    this.__destroyed  = false;
    this.__label    = this.__metadata.name;
    this.__path     = this.__metadata.path;
    this.__scope    = this.__metadata.scope || 'system';
    this.__iter     = this.__metadata.className;
  }
  Process.prototype.destroy = function(kill) {
    kill = (typeof kill === 'undefined') ? true : (kill === true);
    if ( !this.__destroyed ) {
      if ( kill ) {
        if ( this.__pid >= 0 ) {
          _PROCS[this.__pid] = null;
        }
      }
      this.__destroyed = true;
      return true;
    }
    return false;
  };
  Process.prototype._onMessage = function(obj, msg, args) {
  };
  Process.prototype._api = function(method, args, callback, showLoading) {
    var self = this;
    function cb(err, res) {
      if ( self.__destroyed ) {
        console.warn('Process::_api()', 'INGORED RESPONSE: Process was closed');
        return;
      }
      callback(err, res);
    }
    return OSjs.API.call('application', {
      application: this.__iter,
      path: this.__path,
      method: method,
      'arguments': args, __loading: showLoading
    }, cb);
  };
  Process.prototype._call = function(method, args, onSuccess, onError, showLoading) {
    var self = this;
    function _defaultError(err) {
      err = err || 'Unknown error';
      OSjs.API.error(OSjs.API._('ERR_APP_API_ERROR'),
                     OSjs.API._('ERR_APP_API_ERROR_DESC_FMT', self.__pname, method),
                     err);
    }
    console.warn('********************************* WARNING *********************************');
    console.warn('THE METHOD Process:_call() IS DEPRECATED AND WILL BE REMOVED IN THE FUTURE');
    console.warn('PLEASE USE Process::_api() INSTEAD!');
    console.warn('***************************************************************************');
    this._api(method, args, function(err, res) {
      if ( err ) {
        (onError || _defaultError)(err);
      } else {
        (onSuccess || function() {})(res);
      }
    }, showLoading);
  };
  Process.prototype._getArgument = function(k) {
    return typeof this.__args[k] === 'undefined' ? null : this.__args[k];
  };
  Process.prototype._getArguments = function() {
    return this.__args;
  };
  Process.prototype._getResource = function(src) {
    return API.getApplicationResource(this, src);
  };
  Process.prototype._setArgument = function(k, v) {
    this.__args[k] = v;
  };
  OSjs.Core.Process          = Object.seal(Process);
  OSjs.API.killAll           = doKillAllProcesses;
  OSjs.API.kill              = doKillProcess;
  OSjs.API.message           = doProcessMessage;
  OSjs.API.getProcess        = doGetProcess;
  OSjs.API.getProcesses      = doGetProcesses;
})(OSjs.Utils, OSjs.API);

(function(Utils, API, Process) {
  'use strict';
  window.OSjs = window.OSjs || {};
  OSjs.Core   = OSjs.Core   || {};
  var Application = function(name, args, metadata, settings) {
    this.__inited     = false;
    this.__mainwindow = null;
    this.__scheme     = null;
    this.__windows    = [];
    this.__settings   = {};
    try {
      this.__settings = OSjs.Core.getSettingsManager().instance(name, settings || {});
    } catch ( e ) {
      console.warn('Application::construct()', 'An error occured while loading application settings', e);
      console.warn(e.stack);
      this.__settings = OSjs.Core.getSettingsManager().instance(name, {});
    }
    Process.apply(this, arguments);
  };
  Application.prototype = Object.create(Process.prototype);
  Application.constructor = Process;
  Application.prototype.init = function(settings, metadata) {
    var wm = OSjs.Core.getWindowManager();
    var self = this;
    function focusLastWindow() {
      var last;
      if ( wm ) {
        self.__windows.forEach(function(win, i) {
          if ( win ) {
            wm.addWindow(win);
            last = win;
          }
        });
      }
      if ( last ) {
        last._focus();
      }
    }
    if ( !this.__inited ) {
      this.__settings.set(null, settings);
      focusLastWindow();
      this.__inited = true;
    }
  };
  Application.prototype.destroy = function(kill) {
    if ( this.__destroyed ) { // From 'process.js'
      return true;
    }
    this.__windows.forEach(function(w) {
      if ( w ) {
        w.destroy();
      }
    });
    this.__mainwindow = null;
    this.__settings = {};
    this.__windows = [];
    if ( this.__scheme ) {
      this.__scheme.destroy();
    }
    this.__scheme = null;
    return Process.prototype.destroy.apply(this, arguments);
  };
  Application.prototype._onMessage = function(obj, msg, args) {
    if ( !msg ) { return false; }
    if ( msg === 'destroyWindow' ) {
      this._removeWindow(obj);
      if ( obj && obj._name === this.__mainwindow ) {
        this.destroy();
      }
    } else if ( msg === 'attention' ) {
      if ( this.__windows.length && this.__windows[0] ) {
        this.__windows[0]._focus();
      }
    }
    return true;
  };
  Application.prototype._loadScheme = function(s, cb) {
    var scheme = OSjs.GUI.createScheme(this._getResource(s));
    scheme.load(function(error, result) {
      cb(scheme);
    });
    this._setScheme(scheme);
  };
  Application.prototype._addWindow = function(w, cb, setmain) {
    if ( !(w instanceof OSjs.Core.Window) ) {
      throw new TypeError('Application::_addWindow() expects Core.Window');
    }
    this.__windows.push(w);
    if ( setmain || this.__windows.length === 1 ) {
      this.__mainwindow = w._name;
    }
    var wm = OSjs.Core.getWindowManager();
    if ( this.__inited ) {
      if ( wm ) {
        wm.addWindow(w);
      }
      if ( w._properties.start_focused ) {
        setTimeout(function() {
          w._focus();
        }, 5);
      }
    }
    (cb || function() {})(w, wm);
    return w;
  };
  Application.prototype._removeWindow = function(w) {
    if ( !(w instanceof OSjs.Core.Window) ) {
      throw new TypeError('Application::_removeWindow() expects Core.Window');
    }
    var self = this;
    this.__windows.forEach(function(win, i) {
      if ( win ) {
        if ( win._wid === w._wid ) {
          win.destroy();
          self.__windows.splice(i, 1);
          return false;
        }
      }
      return true;
    });
  };
  Application.prototype._getWindow = function(value, key) {
    key = key || 'name';
    if ( value === null ) {
      value = this.__mainwindow;
    }
    var result = key === 'tag' ? [] : null;
    this.__windows.every(function(win, i) {
      if ( win ) {
        if ( win['_' + key] === value ) {
          if ( key === 'tag' ) {
            result.push(win);
          } else {
            result = win;
            return false;
          }
        }
      }
      return true;
    });
    return result;
  };
  Application.prototype._getWindowByName = function(name) {
    return this._getWindow(name);
  };
  Application.prototype._getWindowsByTag = function(tag) {
    return this._getWindow(tag, 'tag');
  };
  Application.prototype._getWindows = function() {
    return this.__windows;
  };
  Application.prototype._getMainWindow = function() {
    return this._getWindow(this.__mainwindow, 'name');
  };
  Application.prototype._getSetting = function(k) {
    return this.__settings.get(k);
  };
  Application.prototype._getSessionData = function() {
    var args = this.__args;
    var wins = this.__windows;
    var data = {name: this.__pname, args: args, windows: []};
    wins.forEach(function(win, i) {
      if ( win && win._properties.allow_session ) {
        data.windows.push({
          name      : win._name,
          dimension : win._dimension,
          position  : win._position,
          state     : win._state
        });
      }
    });
    return data;
  };
  Application.prototype._setSetting = function(k, v, save, saveCallback) {
    save = (typeof save === 'undefined' || save === true);
    this.__settings.set(k, v, save ? (saveCallback || function() {}) : false);
  };
  Application.prototype._setScheme = function(s) {
    this.__scheme = s;
  };
  OSjs.Core.Application = Object.seal(Application);
})(OSjs.Utils, OSjs.API, OSjs.Core.Process);

(function(Utils, API, Process) {
  'use strict';
  window.OSjs = window.OSjs || {};
  OSjs.Core   = OSjs.Core   || {};
  var Service = function(name, args, metadata) {
    Process.apply(this, arguments);
  };
  Service.prototype = Object.create(Process.prototype);
  Service.prototype.init = function() {
  };
  OSjs.Core.Service = Object.seal(Service);
})(OSjs.Utils, OSjs.API, OSjs.Core.Process);

(function(Utils, API, GUI, Process) {
  'use strict';
  window.OSjs = window.OSjs || {};
  OSjs.Core   = OSjs.Core   || {};
  var getNextZindex = (function() {
    var _lzindex  = 1;
    var _ltzindex = 100000;
    return function(ontop) {
      if ( typeof ontop !== 'undefined' && ontop === true ) {
        return (_ltzindex += 2);
      }
      return (_lzindex += 2);
    };
  })();
  function stopPropagation(ev) {
    OSjs.API.blurMenu();
    if ( ev ) {
      ev.stopPropagation();
    }
    return false;
  }
  function getWindowSpace() {
    var wm = OSjs.Core.getWindowManager();
    if ( wm ) {
      return wm.getWindowSpace();
    }
    return Utils.getRect();
  }
  function getAnimDuration() {
    var wm = OSjs.Core.getWindowManager();
    if ( wm ) {
      return wm.getAnimDuration();
    }
    return 301;
  }
  function waitForAnimation(cb) {
    var wm = OSjs.Core.getWindowManager();
    var anim = wm ? wm.getSetting('animations') : false;
    if ( anim ) {
      setTimeout(function() {
        cb();
      }, getAnimDuration());
    } else {
      cb();
    }
  }
  var Window = (function() {
    var _WID                = 0;
    var _DEFAULT_WIDTH      = 200;
    var _DEFAULT_HEIGHT     = 200;
    var _DEFAULT_MIN_HEIGHT = 150;
    var _DEFAULT_MIN_WIDTH  = 150;
    var _DEFAULT_SND_VOLUME = 1.0;
    var _NAMES              = [];
    return function(name, opts, appRef, schemeRef) {
      var self = this;
      if ( _NAMES.indexOf(name) >= 0 ) {
        throw new Error(API._('ERR_WIN_DUPLICATE_FMT', name));
      }
      if ( appRef && !(appRef instanceof OSjs.Core.Application) ) {
        throw new TypeError('appRef given was not instance of Core.Application');
      }
      if ( schemeRef && !(schemeRef instanceof OSjs.GUI.Scheme) ) {
        throw new TypeError('schemeRef given was not instance of GUI.Scheme');
      }
      opts = Utils.argumentDefaults(opts, {
        icon: API.getThemeResource('wm.png', 'wm'),
        width: _DEFAULT_WIDTH,
        height: _DEFAULT_HEIGHT,
        title: name,
        tag: name
      });
      this._$element      = null;                           // DOMElement: Window Outer container
      this._$root         = null;                           // DOMElement: Window Inner container (for content)
      this._$top          = null;                           // DOMElement: Window Top
      this._$winicon      = null;                           // DOMElement: Window Icon
      this._$loading      = null;                           // DOMElement: Window Loading overlay
      this._$disabled     = null;                           // DOMElement: Window Disabled Overlay
      this._$resize       = null;                           // DOMElement: Window Resizer
      this._$warning      = null;                           // DOMElement: Warning message
      this._opts          = opts;                           // Construction opts
      this._app           = appRef || null;                 // Reference to Application Window was created from
      this._scheme        = schemeRef || null;              // Reference to UIScheme
      this._destroyed     = false;                          // If Window has been destroyed
      this._restored      = false;                          // If Window was restored
      this._loaded        = false;                          // If Window is finished loading
      this._wid           = _WID;                           // Window ID (Internal)
      this._icon          = opts.icon;                      // Window Icon
      this._name          = name;                           // Window Name (Unique identifier)
      this._title         = opts.title;                     // Window Title
      this._origtitle     = this._title;                    // Backup window title
      this._tag           = opts.tag;                       // Window Tag (ex. Use this when you have a group of windows)
      this._position      = {x:opts.x, y:opts.y};           // Window Position
      this._dimension     = {w:opts.width, h:opts.height};  // Window Dimension
      this._lastDimension = this._dimension;                // Last Window Dimension
      this._lastPosition  = this._position;                 // Last Window Position
      this._tmpPosition   = null;
      this._children      = [];                             // Child Windows
      this._parent        = null;                           // Parent Window reference
      this._disabled      = true;                           // If Window is currently disabled
      this._loading       = false;                          // If Window is currently loading
      this._sound         = null;                           // Play this sound when window opens
      this._soundVolume   = _DEFAULT_SND_VOLUME;            // ... using this volume
      this._blinkTimer    = null;
      this._properties    = {                               // Window Properties
        gravity           : null,
        allow_move        : true,
        allow_resize      : true,
        allow_minimize    : true,
        allow_maximize    : true,
        allow_close       : true,
        allow_windowlist  : true,
        allow_drop        : false,
        allow_iconmenu    : true,
        allow_ontop       : true,
        allow_hotkeys     : true,
        allow_session     : true,
        key_capture       : false,
        start_focused     : true,
        min_width         : _DEFAULT_MIN_HEIGHT,
        min_height        : _DEFAULT_MIN_WIDTH,
        max_width         : null,
        max_height        : null
      };
      this._state     = {                         // Window State
        focused   : false,
        modal     : false,
        minimized : false,
        maximized : false,
        ontop     : false,
        onbottom  : false
      };
      this._hooks     = {                         // Window Hooks (Events)
        focus     : [],
        blur      : [],
        destroy   : [],
        maximize  : [],
        minimize  : [],
        restore   : [],
        preop     : [], // Called on "mousedown" for resize and move
        postop    : [], // Called on "mouseup" for resize and move
        move      : [], // Called inside the mosuemove event
        moved     : [], // Called inside the mouseup event
        resize    : [], // Called inside the mousemove event
        resized   : []  // Called inside the mouseup event
      };
      Object.keys(opts).forEach(function(k) {
        if ( typeof self._properties[k] !== 'undefined' ) {
          self._properties[k] = opts[k];
        }
        if ( typeof self._state[k] !== 'undefined' ) {
          self._state[k] = opts[k];
        }
      });
      if ( appRef && appRef.__args && appRef.__args.__windows__ ) {
        appRef.__args.__windows__.every(function(restore) {
          if ( restore.name && restore.name === self._name ) {
            self._position.x = restore.position.x;
            self._position.y = restore.position.y;
            if ( self._properties.allow_resize ) {
              self._dimension.w = restore.dimension.w;
              self._dimension.h = restore.dimension.h;
            }
            self._restored = true;
            return false;
          }
          return true;
        });
      }
      _WID++;
    };
  })();
  Window.prototype.init = function(_wm, _app, _scheme) {
    var self = this;
    var compability = OSjs.Utils.getCompability();
    var isTouch = compability.touch;
    var wm = OSjs.Core.getWindowManager();
    var main, buttonMaximize, buttonMinimize, buttonClose;
    function _initPosition() {
      if ( !self._properties.gravity ) {
        if ( (typeof self._position.x === 'undefined') || (typeof self._position.y === 'undefined') ) {
          var np = wm ? wm.getWindowPosition() : {x:0, y:0};
          self._position.x = np.x;
          self._position.y = np.y;
        }
      }
    }
    function _initDimension() {
      if ( self._properties.min_height && (self._dimension.h < self._properties.min_height) ) {
        self._dimension.h = self._properties.min_height;
      }
      if ( self._properties.max_width && (self._dimension.w < self._properties.max_width) ) {
        self._dimension.w = self._properties.max_width;
      }
      if ( self._properties.max_height && (self._dimension.h > self._properties.max_height) ) {
        self._dimension.h = self._properties.max_height;
      }
      if ( self._properties.max_width && (self._dimension.w > self._properties.max_width) ) {
        self._dimension.w = self._properties.max_width;
      }
    }
    function _initGravity() {
      var grav = self._properties.gravity;
      if ( grav ) {
        if ( grav === 'center' ) {
          self._position.y = (window.innerHeight / 2) - (self._dimension.h / 2);
          self._position.x = (window.innerWidth / 2) - (self._dimension.w / 2);
        } else {
          var space = getWindowSpace();
          if ( grav.match(/^south/) ) {
            self._position.y = space.height - self._dimension.h;
          } else {
            self._position.y = space.top;
          }
          if ( grav.match(/west$/) ) {
            self._position.x = space.left;
          } else {
            self._position.x = space.width - self._dimension.w;
          }
        }
      }
    }
    function _initMinButton() {
      buttonMinimize            = document.createElement('application-window-button-minimize');
      buttonMinimize.className  = 'application-window-button-entry';
      if ( self._properties.allow_minimize ) {
        Utils.$bind(buttonMinimize, 'click', function(ev) {
          ev.preventDefault();
          ev.stopPropagation();
          self._onWindowButtonClick(ev, this, 'minimize');
          return false;
        });
      } else {
        buttonMinimize.style.display = 'none';
      }
    }
    function _initMaxButton() {
      buttonMaximize            = document.createElement('application-window-button-maximize');
      buttonMaximize.className  = 'application-window-button-entry';
      if ( !self._properties.allow_maximize ) {
        buttonMaximize.style.display = 'none';
      }
      Utils.$bind(buttonMaximize, 'click', function(ev) {
        ev.preventDefault();
        ev.stopPropagation();
        self._onWindowButtonClick(ev, this, 'maximize');
        return false;
      });
    }
    function _initCloseButton() {
      buttonClose           = document.createElement('application-window-button-close');
      buttonClose.className = 'application-window-button-entry';
      if ( !self._properties.allow_close ) {
        buttonClose.style.display = 'none';
      }
      Utils.$bind(buttonClose, 'click', function(ev) {
        ev.preventDefault();
        ev.stopPropagation();
        self._onWindowButtonClick(ev, this, 'close');
        return false;
      });
    }
    function _initDnD() {
      if ( self._properties.allow_drop && compability.dnd ) {
        var border = document.createElement('div');
        border.className = 'WindowDropRect';
        OSjs.GUI.Helpers.createDroppable(main, {
          onOver: function(ev, el, args) {
            main.setAttribute('data-dnd-state', 'true');
          },
          onLeave : function() {
            main.setAttribute('data-dnd-state', 'false');
          },
          onDrop : function() {
            main.setAttribute('data-dnd-state', 'false');
          },
          onItemDropped: function(ev, el, item, args) {
            main.setAttribute('data-dnd-state', 'false');
            return self._onDndEvent(ev, 'itemDrop', item, args);
          },
          onFilesDropped: function(ev, el, files, args) {
            main.setAttribute('data-dnd-state', 'false');
            return self._onDndEvent(ev, 'filesDrop', files, args);
          }
        });
      }
    }
    function _noEvent(ev) {
      ev.preventDefault();
      ev.stopPropagation();
      return false;
    }
    this._state.focused = false;
    this._icon = API.getIcon(this._icon, null, this._app);
    _initPosition();
    _initDimension();
    _initGravity();
    main = document.createElement('application-window');
    main.setAttribute('data-window-id', this._wid);
    main.setAttribute('data-allow-resize', this._properties.allow_resize ? 'true' : 'false');
    var windowWrapper       = document.createElement('application-window-content');
    var windowResize        = document.createElement('application-window-resize');
    var windowLoading       = document.createElement('application-window-loading');
    var windowLoadingImage  = document.createElement('application-window-loading-indicator');
    var windowDisabled      = document.createElement('application-window-disabled');
    var windowTop           = document.createElement('application-window-top');
    var windowIcon          = document.createElement('application-window-icon');
    var windowTitle         = document.createElement('application-window-title');
    windowTitle.setAttribute('role', 'heading');
    windowTitle.appendChild(document.createTextNode(this._title));
    Utils.$bind(windowTitle, 'dblclick', function() {
      self._maximize();
    });
    var classNames = ['Window'];
    classNames.push(Utils.$safeName(this._name));
    if ( this._tag && (this._name !== this._tag) ) {
      classNames.push(Utils.$safeName(this._tag));
    }
    Utils.$bind(main, 'contextmenu', function(ev) {
      var r = Utils.$isInput(ev);
      if ( !r ) {
        ev.preventDefault();
        ev.stopPropagation();
      }
      OSjs.API.blurMenu();
      return !!r;
    });
    Utils.$bind(windowIcon, 'dblclick', Utils._preventDefault);
    Utils.$bind(windowIcon, 'click', function(ev) {
      ev.preventDefault();
      ev.stopPropagation();
      self._onWindowIconClick(ev, this);
    });
    Utils.$bind(windowLoading, 'mousedown', _noEvent);
    Utils.$bind(windowDisabled, 'mousedown', _noEvent);
    Utils.$bind(main, 'mousedown', function(ev) {
      self._focus();
      return stopPropagation(ev);
    });
    _initMinButton();
    _initMaxButton();
    _initCloseButton();
    _initDnD();
    main.className    = classNames.join(' ');
    main.style.width  = this._dimension.w + 'px';
    main.style.height = this._dimension.h + 'px';
    main.style.top    = this._position.y + 'px';
    main.style.left   = this._position.x + 'px';
    main.style.zIndex = getNextZindex(this._state.ontop);
    main.setAttribute('role', 'application');
    main.setAttribute('aria-live', 'polite');
    main.setAttribute('aria-hidden', 'false');
    windowIcon.setAttribute('role', 'button');
    windowIcon.setAttribute('aria-haspopup', 'true');
    windowIcon.setAttribute('aria-label', 'Window Menu');
    buttonClose.setAttribute('role', 'button');
    buttonClose.setAttribute('aria-label', 'Close Window');
    buttonMinimize.setAttribute('role', 'button');
    buttonMinimize.setAttribute('aria-label', 'Minimize Window');
    buttonMaximize.setAttribute('role', 'button');
    buttonMaximize.setAttribute('aria-label', 'Maximize Window');
    windowTop.appendChild(windowIcon);
    windowTop.appendChild(windowTitle);
    windowTop.appendChild(buttonMinimize);
    windowTop.appendChild(buttonMaximize);
    windowTop.appendChild(buttonClose);
    windowLoading.appendChild(windowLoadingImage);
    main.appendChild(windowTop);
    main.appendChild(windowWrapper);
    main.appendChild(windowResize);
    main.appendChild(windowLoading);
    main.appendChild(windowDisabled);
    this._$element  = main;
    this._$root     = windowWrapper;
    this._$top      = windowTop;
    this._$loading  = windowLoading;
    this._$winicon  = windowIcon;
    this._$disabled = windowDisabled;
    this._$resize   = windowResize;
    document.body.appendChild(this._$element);
    this._onChange('create');
    this._toggleLoading(false);
    this._toggleDisabled(false);
    this._setIcon(this._icon);
    if ( this._sound ) {
      API.playSound(this._sound, this._soundVolume);
    }
    this._updateMarkup();
    return this._$root;
  };
  Window.prototype._inited = function() {
    this._loaded = true;
    if ( !this._restored ) {
      if ( this._state.maximized ) {
        this._maximize(true);
      } else if ( this._state.minimized ) {
        this._minimize(true);
      }
    }
  };
  Window.prototype.destroy = function() {
    var self = this;
    if ( this._destroyed ) {
      return false;
    }
    this._destroyed = true;
    var wm = OSjs.Core.getWindowManager();
    function _removeDOM() {
      self._setWarning(null);
      self._$root       = null;
      self._$top        = null;
      self._$winicon    = null;
      self._$loading    = null;
      self._$disabled   = null;
      self._$resize     = null;
      self._$warning    = null;
      self._$element    = Utils.$remove(self._$element);
    }
    function _destroyDOM() {
      if ( self._parent ) {
        self._parent._removeChild(self);
      }
      self._parent = null;
      self._removeChildren();
    }
    function _destroyWin() {
      if ( wm ) {
        wm.removeWindow(self);
      }
      var curWin = wm ? wm.getCurrentWindow() : null;
      if ( curWin && curWin._wid === self._wid ) {
        wm.setCurrentWindow(null);
      }
      var lastWin = wm ? wm.getLastWindow() : null;
      if ( lastWin && lastWin._wid === self._wid ) {
        wm.setLastWindow(null);
      }
    }
    this._onChange('close');
    this._fireHook('destroy');
    _destroyDOM();
    _destroyWin();
    if ( this._$element ) {
      var anim = wm ? wm.getSetting('animations') : false;
      if ( anim ) {
        this._$element.setAttribute('data-hint', 'closing');
        setTimeout(function() {
          _removeDOM();
        }, getAnimDuration());
      } else {
        this._$element.style.display = 'none';
        _removeDOM();
      }
    }
    if ( this._app ) {
      this._app._onMessage(this, 'destroyWindow', {});
    }
    this._scheme = null;
    this._app = null;
    this._hooks = {};
    this._args = {};
    return true;
  };
  Window.prototype._find = function(id) {
    return this._scheme ? this._scheme.find(this, id) : null;
  };
  Window.prototype._findByQuery = function(q, root, all) {
    return this._scheme ? this._scheme.findByQuery(this, q, root, all) : null;
  };
  Window.prototype._addHook = function(k, func) {
    if ( typeof func === 'function' && this._hooks[k] ) {
      this._hooks[k].push(func);
    }
  };
  Window.prototype._fireHook = function(k, args) {
    args = args || {};
    var self = this;
    if ( this._hooks[k] ) {
      this._hooks[k].forEach(function(hook, i) {
        if ( hook ) {
          try {
            hook.apply(self, args);
          } catch ( e ) {
            console.warn('Window::_fireHook() failed to run hook', k, i, e);
            console.warn(e.stack);
          }
        }
      });
    }
  };
  Window.prototype._addChild = function(w, wmAdd, wmFocus) {
    w._parent = this;
    var wm = OSjs.Core.getWindowManager();
    if ( wmAdd && wm ) {
      wm.addWindow(w, wmFocus);
    }
    this._children.push(w);
    return w;
  };
  Window.prototype._removeChild = function(w) {
    var self = this;
    this._children.every(function(child, i) {
      if ( child && child._wid === w._wid ) {
        child.destroy();
        self._children[i] = null;
        return false;
      }
      return true;
    });
  };
  Window.prototype._getChild = function(value, key) {
    key = key || 'wid';
    var result = key === 'tag' ? [] : null;
    this._children.every(function(child, i) {
      if ( child ) {
        if ( key === 'tag' ) {
          result.push(child);
        } else {
          if ( child['_' + key] === value ) {
            result = child;
            return false;
          }
        }
      }
      return true;
    });
    return result;
  };
  Window.prototype._getChildById = function(id) {
    return this._getChild(id, 'wid');
  };
  Window.prototype._getChildByName = function(name) {
    return this._getChild(name, 'name');
  };
  Window.prototype._getChildrenByTag = function(tag) {
    return this._getChild(tag, 'tag');
  };
  Window.prototype._getChildren = function() {
    return this._children;
  };
  Window.prototype._removeChildren = function() {
    if ( this._children && this._children.length ) {
      this._children.forEach(function(child, i) {
        if ( child ) {
          child.destroy();
        }
      });
    }
    this._children = [];
  };
  Window.prototype._close = function() {
    if ( this._disabled || this._destroyed ) {
      return false;
    }
    this._blur();
    this.destroy();
    return true;
  };
  Window.prototype._minimize = function(force) {
    var self = this;
    if ( !this._properties.allow_minimize || this._destroyed  ) {
      return false;
    }
    if ( !force && this._state.minimized ) {
      this._restore(false, true);
      return true;
    }
    this._blur();
    this._state.minimized = true;
    this._$element.setAttribute('data-minimized', 'true');
    waitForAnimation(function() {
      self._$element.style.display = 'none';
      self._fireHook('minimize');
    });
    this._onChange('minimize');
    var wm = OSjs.Core.getWindowManager();
    var win = wm ? wm.getCurrentWindow() : null;
    if ( win && win._wid === this._wid ) {
      wm.setCurrentWindow(null);
    }
    this._updateMarkup();
    return true;
  };
  Window.prototype._maximize = function(force) {
    var self = this;
    if ( !this._properties.allow_maximize || this._destroyed || !this._$element  ) {
      return false;
    }
    if ( !force && this._state.maximized ) {
      this._restore(true, false);
      return true;
    }
    this._lastPosition    = {x: this._position.x,  y: this._position.y};
    this._lastDimension   = {w: this._dimension.w, h: this._dimension.h};
    this._state.maximized = true;
    var s = this._getMaximizedSize();
    this._$element.style.zIndex = getNextZindex(this._state.ontop);
    this._$element.style.top    = (s.top) + 'px';
    this._$element.style.left   = (s.left) + 'px';
    this._$element.style.width  = (s.width) + 'px';
    this._$element.style.height = (s.height) + 'px';
    this._$element.setAttribute('data-maximized', 'true');
    this._dimension.w = s.width;
    this._dimension.h = s.height;
    this._position.x  = s.left;
    this._position.y  = s.top;
    this._focus();
    waitForAnimation(function() {
      self._fireHook('maximize');
    });
    this._onChange('maximize');
    this._updateMarkup();
    return true;
  };
  Window.prototype._restore = function(max, min) {
    var self = this;
    if ( !this._$element || this._destroyed  ) {
      return;
    }
    function restoreMaximized() {
      if ( max && self._state.maximized ) {
        self._move(self._lastPosition.x, self._lastPosition.y);
        self._resize(self._lastDimension.w, self._lastDimension.h);
        self._state.maximized = false;
        self._$element.setAttribute('data-maximized', 'false');
      }
    }
    function restoreMinimized() {
      if ( min && self._state.minimized ) {
        self._$element.style.display = 'block';
        self._$element.setAttribute('data-minimized', 'false');
        self._state.minimized = false;
      }
    }
    max = (typeof max === 'undefined') ? true : (max === true);
    min = (typeof min === 'undefined') ? true : (min === true);
    restoreMaximized();
    restoreMinimized();
    waitForAnimation(function() {
      self._fireHook('restore');
    });
    this._onChange('restore');
    this._focus();
    this._updateMarkup();
  };
  Window.prototype._focus = function(force) {
    if ( !this._$element || this._destroyed ) {
      return false;
    }
    this._toggleAttentionBlink(false);
    this._$element.style.zIndex = getNextZindex(this._state.ontop);
    this._$element.setAttribute('data-focused', 'true');
    var wm = OSjs.Core.getWindowManager();
    var win = wm ? wm.getCurrentWindow() : null;
    if ( win && win._wid !== this._wid ) {
      win._blur();
    }
    if ( wm ) {
      wm.setCurrentWindow(this);
      wm.setLastWindow(this);
    }
    if ( !this._state.focused || force) {
      this._onChange('focus');
      this._fireHook('focus');
    }
    this._state.focused = true;
    this._updateMarkup();
    return true;
  };
  Window.prototype._blur = function(force) {
    if ( !this._$element || this._destroyed || (!force && !this._state.focused) ) {
      return false;
    }
    this._$element.setAttribute('data-focused', 'false');
    this._state.focused = false;
    this._onChange('blur');
    this._fireHook('blur');
    this._blurGUI();
    var wm = OSjs.Core.getWindowManager();
    var win = wm ? wm.getCurrentWindow() : null;
    if ( win && win._wid === this._wid ) {
      wm.setCurrentWindow(null);
    }
    this._updateMarkup();
    return true;
  };
  Window.prototype._blurGUI = function() {
    this._$root.querySelectorAll('input, textarea, select, iframe, button').forEach(function(el) {
      el.blur();
    });
  };
  Window.prototype._resizeTo = function(dw, dh, limit, move, container, force) {
    var self = this;
    if ( !this._$element ) { return; }
    if ( dw <= 0 || dh <= 0 ) { return; }
    limit = (typeof limit === 'undefined' || limit === true);
    var dx = 0;
    var dy = 0;
    if ( container ) {
      var cpos  = Utils.$position(container, this._$root);
      dx = parseInt(cpos.left, 10);
      dy = parseInt(cpos.top, 10);
    }
    var space = this._getMaximizedSize();
    var cx    = this._position.x + dx;
    var cy    = this._position.y + dy;
    var newW  = dw;
    var newH  = dh;
    var newX  = null;
    var newY  = null;
    function _limitTo() {
      if ( (cx + newW) > space.width ) {
        if ( move ) {
          newW = space.width;
          newX = space.left;
        } else {
          newW = (space.width - cx) + dx;
        }
      } else {
        newW += dx;
      }
      if ( (cy + newH) > space.height ) {
        if ( move ) {
          newH = space.height;
          newY = space.top;
        } else {
          newH = (space.height - cy + self._$top.offsetHeight) + dy;
        }
      } else {
        newH += dy;
      }
    }
    function _moveTo() {
      if ( newX !== null ) {
        self._move(newX, self._position.y);
      }
      if ( newY !== null ) {
        self._move(self._position.x, newY);
      }
    }
    function _resizeFinished() {
      var wm = OSjs.Core.getWindowManager();
      var anim = wm ? wm.getSetting('animations') : false;
      if ( anim ) {
        setTimeout(function() {
          self._fireHook('resized');
        }, getAnimDuration());
      } else {
        self._fireHook('resized');
      }
    }
    if ( limit ) {
      _limitTo();
    }
    this._resize(newW, newH, force);
    _moveTo();
    _resizeFinished();
  };
  Window.prototype._resize = function(w, h, force) {
    if ( !this._$element || this._destroyed  ) {
      return false;
    }
    var p = this._properties;
    if ( !force ) {
      if ( !p.allow_resize ) { return false; }
      (function() {
        if ( !isNaN(w) && w ) {
          if ( w < p.min_width ) { w = p.min_width; }
          if ( p.max_width !== null ) {
            if ( w > p.max_width ) { w = p.max_width; }
          }
        }
      })();
      (function() {
        if ( !isNaN(h) && h ) {
          if ( h < p.min_height ) { h = p.min_height; }
          if ( p.max_height !== null ) {
            if ( h > p.max_height ) { h = p.max_height; }
          }
        }
      })();
    }
    if ( !isNaN(w) && w ) {
      this._$element.style.width = w + 'px';
      this._dimension.w = w;
    }
    if ( !isNaN(h) && h ) {
      this._$element.style.height = h + 'px';
      this._dimension.h = h;
    }
    this._onResize();
    return true;
  };
  Window.prototype._moveTo = function(pos) {
    var wm = OSjs.Core.getWindowManager();
    if ( !wm ) {
      return;
    }
    var s = wm.getWindowSpace();
    var cx = this._position.x;
    var cy = this._position.y;
    if ( pos === 'left' ) {
      this._move(s.left, cy);
    } else if ( pos === 'right' ) {
      this._move((s.width - this._dimension.w), cy);
    } else if ( pos === 'top' ) {
      this._move(cx, s.top);
    } else if ( pos === 'bottom' ) {
      this._move(cx, (s.height - this._dimension.h));
    }
  };
  Window.prototype._move = function(x, y) {
    if ( !this._$element || this._destroyed || !this._properties.allow_move  ) {
      return false;
    }
    if ( typeof x === 'undefined' || typeof y === 'undefined') {
      return false;
    }
    this._$element.style.top  = y + 'px';
    this._$element.style.left = x + 'px';
    this._position.x          = x;
    this._position.y          = y;
    return true;
  };
  Window.prototype._toggleDisabled = function(t) {
    if ( this._$disabled ) {
      this._$disabled.style.display = t ? 'block' : 'none';
    }
    this._disabled = t ? true : false;
    this._updateMarkup();
  };
  Window.prototype._toggleLoading = function(t) {
    if ( this._$loading ) {
      this._$loading.style.display = t ? 'block' : 'none';
    }
    this._loading = t ? true : false;
    this._updateMarkup();
  };
  Window.prototype._updateMarkup = function(ui) {
    if ( !this._$element ) {
      return;
    }
    var t = this._loading || this._disabled;
    var d = this._disabled;
    var h = this._state.minimized;
    var f = !this._state.focused;
    this._$element.setAttribute('aria-busy', String(t));
    this._$element.setAttribute('aria-hidden', String(h));
    this._$element.setAttribute('aria-disabled', String(d));
    this._$root.setAttribute('aria-hidden', String(f));
    if ( !ui ) {
      return;
    }
    var dmax   = this._properties.allow_maximize === true ? 'inline-block' : 'none';
    var dmin   = this._properties.allow_minimize === true ? 'inline-block' : 'none';
    var dclose = this._properties.allow_close === true ? 'inline-block' : 'none';
    this._$top.querySelector('application-window-button-maximize').style.display = dmax;
    this._$top.querySelector('application-window-button-minimize').style.display = dmin;
    this._$top.querySelector('application-window-button-close').style.display = dclose;
    var dres   = this._properties.allow_resize === true;
    this._$element.setAttribute('data-allow-resize', String(dres));
  };
  Window.prototype._toggleAttentionBlink = function(t) {
    if ( !this._$element || this._destroyed  ) { return false; }
    if ( this._state.focused ) { return false; }
    var el     = this._$element;
    var self   = this;
    function _blink(stat) {
      if ( el ) {
        if ( stat ) {
          Utils.$addClass(el, 'WindowAttentionBlink');
        } else {
          Utils.$removeClass(el, 'WindowAttentionBlink');
        }
      }
      self._onChange(stat ? 'attention_on' : 'attention_off');
    }
    _blink(t);
    return true;
  };
  Window.prototype._nextTabIndex = function(ev) {
    var nextElement = OSjs.GUI.Helpers.getNextElement(ev.shiftKey, document.activeElement, this._$root);
    if ( nextElement ) {
      if ( Utils.$hasClass(nextElement, 'gui-data-view') ) {
        new OSjs.GUI.ElementDataView(nextElement)._call('focus');
      } else {
        try {
          nextElement.focus();
        } catch ( e ) {}
      }
    }
  };
  Window.prototype._onDndEvent = function(ev, type) {
    if ( this._disabled || this._destroyed ) {
      return false;
    }
    return true;
  };
  Window.prototype._onKeyEvent = function(ev, type) {
    if ( this._destroyed ) {
      return false;
    }
    if ( type === 'keydown' && ev.keyCode === Utils.Keys.TAB ) {
      this._nextTabIndex(ev);
    }
    return true;
  };
  Window.prototype._onResize = function() {
  };
  Window.prototype._onWindowIconClick = function(ev, el) {
    if ( !this._properties.allow_iconmenu || this._destroyed  ) {
      return;
    }
    var self = this;
    var control = [
      [this._properties.allow_minimize, function() {
        return {
          title: API._('WINDOW_MINIMIZE'),
          icon: API.getIcon('actions/stock_up.png'),
          onClick: function(name, iter) {
            self._minimize();
          }
        };
      }],
      [this._properties.allow_maximize, function() {
        return {
          title: API._('WINDOW_MAXIMIZE'),
          icon: API.getIcon('actions/window_fullscreen.png'),
          onClick: function(name, iter) {
            self._maximize();
            self._focus();
          }
        };
      }],
      [this._state.maximized, function() {
        return {
          title: API._('WINDOW_RESTORE'),
          icon: API.getIcon('actions/view-restore.png'),
          onClick: function(name, iter) {
            self._restore();
            self._focus();
          }
        };
      }],
      [this._properties.allow_ontop, function() {
        if ( self._state.ontop ) {
          return {
            title: API._('WINDOW_ONTOP_OFF'),
            icon: API.getIcon('actions/window-new.png'),
            onClick: function(name, iter) {
              self._state.ontop = false;
              if ( self._$element ) {
                self._$element.style.zIndex = getNextZindex(false);
              }
              self._focus();
            }
          };
        }
        return {
          title: API._('WINDOW_ONTOP_ON'),
          icon: API.getIcon('actions/window-new.png'),
          onClick: function(name, iter) {
            self._state.ontop = true;
            if ( self._$element ) {
              self._$element.style.zIndex = getNextZindex(true);
            }
            self._focus();
          }
        };
      }],
      [this._properties.allow_close, function() {
        return {
          title: API._('WINDOW_CLOSE'),
          icon: API.getIcon('actions/window-close.png'),
          onClick: function(name, iter) {
            self._close();
          }
        };
      }]
    ];
    var list = [];
    control.forEach(function(iter) {
      if (iter[0] ) {
        list.push(iter[1]());
      }
    });
    OSjs.API.createMenu(list, ev);
  };
  Window.prototype._onWindowButtonClick = function(ev, el, btn) {
    this._blurGUI();
    if ( btn === 'close' ) {
      this._close();
    } else if ( btn === 'minimize' ) {
      this._minimize();
    } else if ( btn === 'maximize' ) {
      this._maximize();
    }
  };
  Window.prototype._onChange = function(ev, byUser) {
    ev = ev || '';
    if ( ev ) {
      var wm = OSjs.Core.getWindowManager();
      if ( wm ) {
        wm.eventWindow(ev, this);
      }
    }
  };
  Window.prototype._getMaximizedSize = function() {
    var s = getWindowSpace();
    if ( !this._$element || this._destroyed ) {
      return s;
    }
    var topMargin = 23;
    var borderSize = 0;
    var wm = OSjs.Core.getWindowManager();
    if ( wm ) {
      var theme = wm.getStyleTheme(true);
      if ( theme && theme.style && theme.style.window ) {
        topMargin = theme.style.window.margin;
        borderSize = theme.style.window.border;
      }
    }
    s.left += borderSize;
    s.top += borderSize;
    s.width -= (borderSize * 2);
    s.height -= topMargin + (borderSize * 2);
    return Object.freeze(s);
  };
  Window.prototype._getViewRect = function() {
    return this._$element ? Object.freeze(Utils.$position(this._$element)) : null;
  };
  Window.prototype._getRoot = function() {
    return this._$root;
  };
  Window.prototype._getZindex = function() {
    if ( this._$element ) {
      return parseInt(this._$element.style.zIndex, 10);
    }
    return -1;
  };
  Window.prototype._setTitle = function(t, append, delimiter) {
    if ( !this._$element || this._destroyed ) {
      return;
    }
    delimiter = delimiter || '-';
    var tel = this._$element.getElementsByTagName('application-window-title')[0];
    var text = [];
    if ( append ) {
      text = [this._origtitle, delimiter, t];
    } else {
      text = [t || this._origtitle];
    }
    this._title = text.join(' ') || this._origtitle;
    if ( tel ) {
      Utils.$empty(tel);
      tel.appendChild(document.createTextNode(this._title));
    }
    this._onChange('title');
    this._updateMarkup();
  };
  Window.prototype._setIcon = function(i) {
    if ( this._$winicon ) {
      this._$winicon.title = this._title;
      this._$winicon.style.backgroundImage = 'url(' + i + ')';
    }
    this._icon = i;
    this._onChange('icon');
  };
  Window.prototype._setWarning = function(message) {
    var self = this;
    this._$warning = Utils.$remove(this._$warning);
    if ( this._destroyed || message === null ) {
      return;
    }
    message = message || '';
    var container = document.createElement('application-window-warning');
    var close = document.createElement('div');
    close.innerHTML = 'X';
    Utils.$bind(close, 'click', function() {
      self._setWarning(null);
    });
    var msg = document.createElement('div');
    msg.appendChild(document.createTextNode(message));
    container.appendChild(close);
    container.appendChild(msg);
    this._$warning = container;
    this._$root.appendChild(this._$warning);
  };
  Window.prototype._setProperty = function(p, v) {
    if ( (v === '' || v === null) || !this._$element || (typeof this._properties[p] === 'undefined') ) {
      return;
    }
    this._properties[p] = String(v) === 'true';
    this._updateMarkup(true);
  };
  OSjs.Core.Window = Object.seal(Window);
})(OSjs.Utils, OSjs.API, OSjs.GUI, OSjs.Core.Process);

(function(Utils, API, Window) {
  'use strict';
  window.OSjs = window.OSjs || {};
  OSjs.Core   = OSjs.Core   || {};
  function DialogWindow(className, opts, args, callback) {
    var self = this;
    opts = opts || {};
    args = args || {};
    callback = callback || function() {};
    if ( typeof callback !== 'function' ) {
      throw new TypeError('DialogWindow expects a callback Function, gave: ' + typeof callback);
    }
    Window.apply(this, [className, opts]);
    this._properties.gravity          = 'center';
    this._properties.allow_resize     = false;
    this._properties.allow_minimize   = false;
    this._properties.allow_maximize   = false;
    this._properties.allow_windowlist = false;
    this._properties.allow_session    = false;
    this._state.ontop                 = true;
    this._tag                         = 'DialogWindow';
    if ( args.scheme && args.scheme instanceof OSjs.GUI.Scheme ) {
      this.scheme = args.scheme;
      delete args.scheme;
    } else {
      this.scheme = OSjs.GUI.DialogScheme.get();
    }
    this.args = args;
    this.className = className;
    this.buttonClicked = false;
    this.closeCallback = function(ev, button, result) {
      if ( self._destroyed ) {
        return;
      }
      self.buttonClicked = true;
      callback.apply(self, arguments);
      self._close();
    };
  }
  DialogWindow.prototype = Object.create(Window.prototype);
  DialogWindow.constructor = Window;
  DialogWindow.prototype.init = function() {
    var self = this;
    var root = Window.prototype.init.apply(this, arguments);
    root.setAttribute('role', 'dialog');
    this.scheme.render(this, this.className.replace(/Dialog$/, ''), root, 'application-dialog', function(node) {
      node.querySelectorAll('gui-label').forEach(function(el) {
        if ( el.childNodes.length && el.childNodes[0].nodeType === 3 && el.childNodes[0].nodeValue ) {
          var label = el.childNodes[0].nodeValue;
          Utils.$empty(el);
          el.appendChild(document.createTextNode(API._(label)));
        }
      });
    });
    var buttonMap = {
      ButtonOK:     'ok',
      ButtonCancel: 'cancel',
      ButtonYes:    'yes',
      ButtonNo:     'no'
    };
    var focusButtons = ['ButtonCancel', 'ButtonNo'];
    Object.keys(buttonMap).forEach(function(id) {
      if ( self.scheme.findDOM(self, id) ) {
        var btn = self.scheme.find(self, id);
        btn.on('click', function(ev) {
          self.onClose(ev, buttonMap[id]);
        });
        if ( focusButtons.indexOf(id) >= 0 ) {
          btn.focus();
        }
      }
    });
    Utils.$addClass(root, 'DialogWindow');
    return root;
  };
  DialogWindow.prototype.onClose = function(ev, button) {
    this.closeCallback(ev, button, null);
  };
  DialogWindow.prototype._close = function() {
    if ( !this.buttonClicked ) {
      this.onClose(null, 'cancel', null);
    }
    return Window.prototype._close.apply(this, arguments);
  };
  DialogWindow.prototype._onKeyEvent = function(ev) {
    Window.prototype._onKeyEvent.apply(this, arguments);
    if ( ev.keyCode === Utils.Keys.ESC ) {
      this.onClose(ev, 'cancel');
    }
  };
  OSjs.Core.DialogWindow = Object.seal(DialogWindow);
})(OSjs.Utils, OSjs.API, OSjs.Core.Window);

(function(Utils, API, Process, Window) {
  'use strict';
  window.OSjs = window.OSjs || {};
  OSjs.Core   = OSjs.Core   || {};
  var _WM;             // Running Window Manager process
  function BehaviourState(win, action, mousePosition) {
    var self = this;
    this.$element = win._$element;
    this.$top     = win._$top;
    this.$handle  = win._$resize;
    this.rectWorkspace  = _WM.getWindowSpace(true);
    this.rectWindow     = {
      x: win._position.x,
      y: win._position.y,
      w: win._dimension.w,
      h: win._dimension.h
    };
    var theme = _WM.getStyleTheme(true);
    this.theme = {
      topMargin : theme.style.window.margin || 0,
      borderSize: theme.style.window.border || 0
    };
    this.snapping   = {
      cornerSize : _WM.getSetting('windowCornerSnap') || 0,
      windowSize : _WM.getSetting('windowSnap') || 0
    };
    this.action     = action;
    this.moved      = false;
    this.direction  = null;
    this.startX     = mousePosition.x;
    this.startY     = mousePosition.y;
    this.minWidth   = win._properties.min_width;
    this.minHeight  = win._properties.min_height;
    var windowRects = [];
    _WM.getWindows().forEach(function(w) {
      if ( w && w._wid !== win._wid ) {
        var pos = w._position;
        var dim = w._dimension;
        var rect = {
          left : pos.x - self.theme.borderSize,
          top : pos.y - self.theme.borderSize,
          width: dim.w + (self.theme.borderSize * 2),
          height: dim.h + (self.theme.borderSize * 2) + self.theme.topMargin
        };
        rect.right = rect.left + rect.width;
        rect.bottom = (pos.y + dim.h) + self.theme.topMargin + self.theme.borderSize;//rect.top + rect.height;
        windowRects.push(rect);
      }
    });
    this.snapRects = windowRects;
  }
  BehaviourState.prototype.calculateDirection = function() {
    var dir = Utils.$position(this.$handle);
    var dirX = this.startX - dir.left;
    var dirY = this.startY - dir.top;
    var dirD = 20;
    var direction = 's';
    var checks = {
      nw: (dirX <= dirD) && (dirY <= dirD),
      n:  (dirX > dirD) && (dirY <= dirD),
      w:  (dirX <= dirD) && (dirY >= dirD),
      ne: (dirX >= (dir.width - dirD)) && (dirY <= dirD),
      e:  (dirX >= (dir.width - dirD)) && (dirY > dirD),
      se: (dirX >= (dir.width - dirD)) && (dirY >= (dir.height - dirD)),
      sw: (dirX <= dirD) && (dirY >= (dir.height - dirD))
    };
    Object.keys(checks).forEach(function(k) {
      if ( checks[k] ) {
        direction = k;
      }
    });
    this.direction = direction;
  };
  function createWindowBehaviour(win, wm) {
    var current = null;
    function onMouseDown(ev, action, win, mousePosition) {
      ev.preventDefault();
      if ( win._state.maximized ) {
        return;
      }
      current = new BehaviourState(win, action, mousePosition);
      win._focus();
      if ( action === 'move' ) {
        current.$element.setAttribute('data-hint', 'moving');
      } else {
        current.calculateDirection();
        current.$element.setAttribute('data-hint', 'resizing');
      }
      win._fireHook('preop');
      var boundMove = Utils.$bind(document, 'mousemove', _onMouseMove, false);
      var boundUp = Utils.$bind(document, 'mouseup', _onMouseUp, false);
      function _onMouseMove(ev, pos) {
        onMouseMove(ev, action, win, pos);
      }
      function _onMouseUp(ev, pos) {
        onMouseUp(ev, action, win, pos);
        boundMove = Utils.$unbind(boundMove);
        boundUp = Utils.$unbind(boundUp);
      }
    }
    function onMouseUp(ev, action, win, mousePosition) {
      if ( !current ) {
        return;
      }
      if ( current.moved ) {
        if ( action === 'move' ) {
          win._onChange('move', true);
          win._fireHook('moved');
        } else if ( action === 'resize' ) {
          win._onChange('resize', true);
          win._fireHook('resized');
        }
      }
      current.$element.setAttribute('data-hint', '');
      win._fireHook('postop');
      current = null;
    }
    function onMouseMove(ev, action, win, mousePosition) {
      if ( !_WM.getMouseLocked() || !action || !current ) {
        return;
      }
      var result;
      var dx = mousePosition.x - current.startX;
      var dy = mousePosition.y - current.startY;
      if ( action === 'move' ) {
        result = onWindowMove(ev, mousePosition, dx, dy);
      } else {
        result = onWindowResize(ev, mousePosition, dx, dy);
      }
      if ( result ) {
        if ( result.left !== null && result.top !== null ) {
          win._move(result.left, result.top);
          win._fireHook('move');
        }
        if ( result.width !== null && result.height !== null ) {
          win._resize(result.width, result.height);
          win._fireHook('resize');
        }
      }
      current.moved = true;
    }
    function onWindowResize(ev, mousePosition, dx, dy) {
      if ( !current || !current.direction ) { return; }
      var newLeft = null;
      var newTop = null;
      var newWidth = null;
      var newHeight = null;
      function clampSizeAllowed() {
        if ( current.minHeight && newHeight < current.minHeight ) {
          newHeight = current.minHeight;
        }
        if ( current.minWidth && newWidth < current.minWidth ) {
          newWidth = current.minWidth;
        }
      }
      var resizeMap = {
        s: function() {
          newWidth = current.rectWindow.w;
          newHeight = current.rectWindow.h + dy;
        },
        se: function() {
          newWidth = current.rectWindow.w + dx;
          newHeight = current.rectWindow.h + dy;
        },
        e: function() {
          newWidth = current.rectWindow.w + dx;
          newHeight = current.rectWindow.h;
        },
        sw: function() {
          newWidth = current.rectWindow.w - dx;
          newHeight = current.rectWindow.h + dy;
          newLeft = current.rectWindow.x + dx;
          newTop = current.rectWindow.y;
        },
        w: function() {
          newWidth = current.rectWindow.w - dx;
          newHeight = current.rectWindow.h;
          newLeft = current.rectWindow.x + dx;
          newTop = current.rectWindow.y;
        },
        n: function() {
          newTop = current.rectWindow.y + dy;
          newLeft = current.rectWindow.x;
          newHeight = current.rectWindow.h - dy;
          newWidth = current.rectWindow.w;
        },
        nw: function() {
          newTop = current.rectWindow.y + dy;
          newLeft = current.rectWindow.x + dx;
          newHeight = current.rectWindow.h - dy;
          newWidth = current.rectWindow.w - dx;
        },
        ne: function() {
          newTop = current.rectWindow.y + dy;
          newLeft = current.rectWindow.x;
          newHeight = current.rectWindow.h - dy;
          newWidth = current.rectWindow.w + dx;
        }
      };
      if ( resizeMap[current.direction] ) {
        resizeMap[current.direction]();
      }
      if ( newTop < current.rectWorkspace.top && newTop !== null ) {
        newTop = current.rectWorkspace.top;
        newHeight -= current.rectWorkspace.top - mousePosition.y;
      }
      clampSizeAllowed();
      return {left: newLeft, top: newTop, width: newWidth, height: newHeight};
    }
    function onWindowMove(ev, mousePosition, dx, dy) {
      var newWidth = null;
      var newHeight = null;
      var newLeft = current.rectWindow.x + dx;
      var newTop = current.rectWindow.y + dy;
      var borderSize = current.theme.borderSize;
      var topMargin = current.theme.topMargin;
      var cornerSnapSize = current.snapping.cornerSize;
      var windowSnapSize = current.snapping.windowSize;
      if ( newTop < current.rectWorkspace.top ) { newTop = current.rectWorkspace.top; }
      var newRight = newLeft + current.rectWindow.w + (borderSize * 2);
      var newBottom = newTop + current.rectWindow.h + topMargin + (borderSize);
      if ( cornerSnapSize > 0 ) {
        if ( ((newLeft - borderSize) <= cornerSnapSize) && ((newLeft - borderSize) >= -cornerSnapSize) ) { // Left
          newLeft = borderSize;
        } else if ( (newRight >= (current.rectWorkspace.width - cornerSnapSize)) && (newRight <= (current.rectWorkspace.width + cornerSnapSize)) ) { // Right
          newLeft = current.rectWorkspace.width - current.rectWindow.w - borderSize;
        }
        if ( (newTop <= (current.rectWorkspace.top + cornerSnapSize)) && (newTop >= (current.rectWorkspace.top - cornerSnapSize)) ) { // Top
          newTop = current.rectWorkspace.top + (borderSize);
        } else if (
                    (newBottom >= ((current.rectWorkspace.height + current.rectWorkspace.top) - cornerSnapSize)) &&
                    (newBottom <= ((current.rectWorkspace.height + current.rectWorkspace.top) + cornerSnapSize))
                  ) { // Bottom
          newTop = (current.rectWorkspace.height + current.rectWorkspace.top) - current.rectWindow.h - topMargin - borderSize;
        }
      }
      if ( windowSnapSize > 0 ) {
        current.snapRects.every(function(rect) {
          if ( newRight >= (rect.left - windowSnapSize) && newRight <= (rect.left + windowSnapSize) ) { // Left
            newLeft = rect.left - (current.rectWindow.w + (borderSize * 2));
            return false;
          }
          if ( (newLeft - borderSize) <= (rect.right + windowSnapSize) && (newLeft - borderSize) >= (rect.right - windowSnapSize) ) { // Right
            newLeft = rect.right + (borderSize * 2);
            return false;
          }
          if ( newBottom >= (rect.top - windowSnapSize) && newBottom <= (rect.top + windowSnapSize) ) { // Top
            newTop = rect.top - (current.rectWindow.h + (borderSize * 2) + topMargin);
            return false;
          }
          if ( newTop <= (rect.bottom + windowSnapSize) && newTop >= (rect.bottom - windowSnapSize) ) { // Bottom
            newTop = rect.bottom + borderSize * 2;
            return false;
          }
          return true;
        });
      }
      return {left: newLeft, top: newTop, width: newWidth, height: newHeight};
    }
    if ( win._properties.allow_move ) {
      Utils.$bind(win._$top, 'mousedown', function(ev, pos) {
        onMouseDown(ev, 'move', win, pos);
      });
    }
    if ( win._properties.allow_resize ) {
      Utils.$bind(win._$resize, 'mousedown', function(ev, pos) {
        onMouseDown(ev, 'resize', win, pos);
      });
    }
  }
  var WindowManager = function(name, ref, args, metadata, settings) {
    this._$notifications = null;
    this._windows        = [];
    this._settings       = OSjs.Core.getSettingsManager().instance(name, settings);
    this._currentWin     = null;
    this._lastWin        = null;
    this._mouselock      = true;
    this._stylesheet     = null;
    this._sessionLoaded  = false;
    this._fullyLoaded    = false;
    this.__name    = (name || 'WindowManager');
    this.__path    = metadata.path;
    this.__iter    = metadata.iter;
    Process.apply(this, [this.__name, args, metadata]);
    _WM = (ref || this);
  };
  WindowManager.prototype = Object.create(Process.prototype);
  WindowManager.prototype.destroy = function() {
    var self = this;
    this.destroyStylesheet();
    document.removeEventListener('mouseout', function(ev) {
      self._onMouseLeave(ev);
    }, false);
    document.removeEventListener('mouseenter', function(ev) {
      self._onMouseEnter(ev);
    }, false);
    this._windows.forEach(function(win, i) {
      if ( win ) {
        win.destroy();
        self._windows[i] = null;
      }
    });
    this._windows = [];
    this._currentWin = null;
    this._lastWin = null;
    _WM = null;
    return Process.prototype.destroy.apply(this, []);
  };
  WindowManager.prototype.init = function() {
    var self = this;
    document.addEventListener('mouseout', function(ev) {
      self._onMouseLeave(ev);
    }, false);
    document.addEventListener('mouseenter', function(ev) {
      self._onMouseEnter(ev);
    }, false);
  };
  WindowManager.prototype.setup = function(cb) {
  };
  WindowManager.prototype.getWindow = function(name) {
    var result = null;
    this._windows.every(function(w) {
      if ( w && w._name === name ) {
        result = w;
      }
      return w ? false : true;
    });
    return result;
  };
  WindowManager.prototype.addWindow = function(w, focus) {
    if ( !(w instanceof Window) ) {
      console.warn('WindowManager::addWindow()', 'Got', w);
      throw new TypeError('given argument was not instance of Core.Window');
    }
    w.init(this, w._app, w._scheme);
    createWindowBehaviour(w, this);
    this._windows.push(w);
    w._inited();
    if ( focus === true || (w instanceof OSjs.Core.DialogWindow) ) {
      setTimeout(function() {
        w._focus();
      }, 10);
    }
    return w;
  };
  WindowManager.prototype.removeWindow = function(w) {
    var self = this;
    if ( !(w instanceof Window) ) {
      console.warn('WindowManager::removeWindow()', 'Got', w);
      throw new TypeError('given argument was not instance of Core.Window');
    }
    var result = false;
    this._windows.every(function(win, i) {
      if ( win && win._wid === w._wid ) {
        self._windows[i] = null;
        result = true;
      }
      return result ? false : true;
    });
    return result;
  };
  WindowManager.prototype.applySettings = function(settings, force, save) {
    settings = settings || {};
    var result = force ? settings : Utils.mergeObject(this._settings.get(), settings);
    this._settings.set(null, result, save);
    return true;
  };
  WindowManager.prototype.createStylesheet = function(styles, rawStyles) {
    this.destroyStylesheet();
    var innerHTML = [];
    Object.keys(styles).forEach(function(key) {
      var rules = [];
      Object.keys(styles[key]).forEach(function(r) {
        rules.push(Utils.format('    {0}: {1};', r, styles[key][r]));
      });
      rules = rules.join('\n');
      innerHTML.push(Utils.format('{0} {\n{1}\n}', key, rules));
    });
    innerHTML = innerHTML.join('\n');
    if ( rawStyles ) {
      innerHTML += '\n' + rawStyles;
    }
    var style       = document.createElement('style');
    style.type      = 'text/css';
    style.id        = 'WMGeneratedStyles';
    style.innerHTML = innerHTML;
    document.getElementsByTagName('head')[0].appendChild(style);
    this._stylesheet = style;
  };
  WindowManager.prototype.destroyStylesheet = function() {
    if ( this._stylesheet ) {
      if ( this._stylesheet.parentNode ) {
        this._stylesheet.parentNode.removeChild(this._stylesheet);
      }
    }
    this._stylesheet = null;
  };
  WindowManager.prototype.onKeyDown = function(ev, win) {
  };
  WindowManager.prototype.onSessionLoaded = function() {
    if ( this._sessionLoaded ) { return false; }
    this._sessionLoaded = true;
    return true;
  };
  WindowManager.prototype.resize = function(ev, rect) {
  };
  WindowManager.prototype.notification = function() {
  };
  WindowManager.prototype.createNotificationIcon = function() {
  };
  WindowManager.prototype.createNotificationIcon = function() {
  };
  WindowManager.prototype.removeNotificationIcon = function() {
  };
  WindowManager.prototype.eventWindow = function(ev, win) {
  };
  WindowManager.prototype.showSettings = function() {
  };
  WindowManager.prototype._onMouseEnter = function(ev) {
    this._mouselock = true;
  };
  WindowManager.prototype._onMouseLeave = function(ev) {
    var from = ev.relatedTarget || ev.toElement;
    if ( !from || from.nodeName === 'HTML' ) {
      this._mouselock = false;
    } else {
      this._mouselock = true;
    }
  };
  WindowManager.prototype.getDefaultSetting = function() {
    return null;
  };
  WindowManager.prototype.getPanel = function() {
    return null;
  };
  WindowManager.prototype.getPanels = function() {
    return [];
  };
  WindowManager.prototype.getStyleTheme = function(returnMetadata) {
    return returnMetadata ? {} : 'default';
  };
  WindowManager.prototype.getSoundTheme = function() {
    return 'default';
  };
  WindowManager.prototype.getIconTheme = function() {
    return 'default';
  };
  WindowManager.prototype.getStyleThemes = function() {
    return API.getConfig('Styles', []);
  };
  WindowManager.prototype.getSoundThemes = function() {
    return API.getConfig('Sounds', []);
  };
  WindowManager.prototype.getIconThemes = function() {
    return API.getConfig('Icons', []);
  };
  WindowManager.prototype.setSetting = function(k, v) {
    return this._settings.set(k, v);
  };
  WindowManager.prototype.getWindowSpace = function() {
    return Utils.getRect();
  };
  WindowManager.prototype.getWindowPosition = (function() {
    var _LNEWX = 0;
    var _LNEWY = 0;
    return function() {
      if ( _LNEWY >= (window.innerHeight - 100) ) { _LNEWY = 0; }
      if ( _LNEWX >= (window.innerWidth - 100) )  { _LNEWX = 0; }
      return {x: _LNEWX += 10, y: _LNEWY += 10};
    };
  })();
  WindowManager.prototype.getSetting = function(k) {
    return this._settings.get(k);
  };
  WindowManager.prototype.getSettings = function() {
    return this._settings.get();
  };
  WindowManager.prototype.getWindows = function() {
    return this._windows;
  };
  WindowManager.prototype.getCurrentWindow = function() {
    return this._currentWin;
  };
  WindowManager.prototype.setCurrentWindow = function(w) {
    this._currentWin = w || null;
  };
  WindowManager.prototype.getLastWindow = function() {
    return this._lastWin;
  };
  WindowManager.prototype.setLastWindow = function(w) {
    this._lastWin = w || null;
  };
  WindowManager.prototype.getAnimDuration = function() {
    var theme = this.getStyleTheme(true);
    if ( theme && theme.style && theme.style.animation ) {
      if ( typeof theme.style.animation.duration === 'number' ) {
        return theme.style.animation.dudation;
      }
    }
    return 301;
  };
  WindowManager.prototype.getMouseLocked = function() {
    return this._mouselock;
  };
  OSjs.Core.WindowManager     = Object.seal(WindowManager);
  OSjs.Core.getWindowManager  = function() {
    return _WM;
  };
})(OSjs.Utils, OSjs.API, OSjs.Core.Process, OSjs.Core.Window);

(function(Utils, VFS, API) {
  'use strict';
  window.OSjs = window.OSjs || {};
  var PackageManager = (function() {
    var blacklist = [];
    var packages = [];
    var uri = Utils.checkdir(API.getConfig('Connection.MetadataURI'));
    return Object.seal({
      load: function(callback) {
        var self = this;
        callback = callback || {};
        function loadMetadata(cb) {
          self._loadMetadata(function(err) {
            if ( err ) {
              callback(err);
              return;
            }
            var len = Object.keys(packages).length;
            if ( len ) {
              cb();
              return;
            }
            callback(false, 'No packages found!');
          });
        }
        loadMetadata(function() {
          self._loadExtensions(function() {
            callback(true);
          });
        });
      },
      _loadExtensions: function(callback) {
        var preloads = [];
        Object.keys(packages).forEach(function(k) {
          var iter = packages[k];
          if ( iter.type === 'extension' && iter.sources ) {
            iter.sources.forEach(function(p) {
              preloads.push(p);
            });
          }
        });
        if ( preloads.length ) {
          Utils.preload(preloads, function(total, failed) {
            callback();
          });
        } else {
          callback();
        }
      },
      _loadMetadata: function(callback) {
        var self = this;
        packages = {};
        function _loadSystemMetadata(cb) {
          var preload = [{type: 'javascript', src: uri}];
          Utils.preload(preload, function(total, failed) {
            if ( failed.length ) {
              callback('Failed to load package manifest', failed);
              return;
            }
            var packages = OSjs.Core.getMetadata();
            self._addPackages(packages, 'system');
            cb();
          });
        }
        function _loadUserMetadata(cb) {
          var path = API.getConfig('PackageManager.UserMetadata');
          var file = new OSjs.VFS.File(path, 'application/json');
          OSjs.VFS.exists(file, function(err, exists) {
            if ( err || !exists ) {
              cb();
              return;
            }
            OSjs.VFS.read(file, function(err, resp) {
              resp = OSjs.Utils.fixJSON(resp || '');
              if ( err ) {
                console.warn('Failed to read user package metadata', err);
              } else {
                if ( resp ) {
                  self._addPackages(resp, 'user');
                }
              }
              cb();
            }, {type: 'text'});
          });
        }
        _loadSystemMetadata(function(err) {
          if ( err ) {
            callback(err);
            return;
          }
          _loadUserMetadata(function() {
            callback();
          });
        });
      },
      generateUserMetadata: function(callback) {
        var dir = new OSjs.VFS.File(API.getConfig('PackageManager.UserPackages'));
        var found = {};
        var queue = [];
        var self = this;
        function _enumPackages(cb) {
          function __runQueue(done) {
            Utils.asyncs(queue, function(iter, i, next) {
              var file = new OSjs.VFS.File(iter, 'application/json');
              var rpath = iter.replace(/\/metadata\.json$/, '');
              OSjs.VFS.read(file, function(err, resp) {
                var meta = OSjs.Utils.fixJSON(resp);
                if ( !err && meta ) {
                  meta.path = OSjs.Utils.filename(rpath);
                  meta.scope = 'user';
                  meta.preload = meta.preload.map(function(p) {
                    if ( p.src.substr(0, 1) !== '/' && !p.src.match(/^(https?|ftp)/) ) {
                      p.src = rpath + '/' + p.src.replace(/^(\.\/)?/, '');
                    }
                    return p;
                  });
                  found[meta.className] = meta;
                }
                next();
              }, {type: 'text'});
            }, done);
          }
          OSjs.VFS.scandir(dir, function(err, resp) {
            if ( err ) {
              console.error('_enumPackages()', err);
            }
            if ( resp && (resp instanceof Array) ) {
              resp.forEach(function(iter) {
                if ( !iter.filename.match(/^\./) && iter.type === 'dir' ) {
                  queue.push(Utils.pathJoin(dir.path, iter.filename, 'metadata.json'));
                }
              });
            }
            __runQueue(cb);
          });
        }
        function _writeMetadata(cb) {
          var path = API.getConfig('PackageManager.UserMetadata');
          var file = new OSjs.VFS.File(path, 'application/json');
          var meta = JSON.stringify(found, null, 4);
          OSjs.VFS.write(file, meta, function() {
            cb();
          });
        }
        OSjs.VFS.mkdir(dir, function() {
          _enumPackages(function() {
            _writeMetadata(function() {
              self._loadMetadata(function() {
                callback();
              });
            });
          });
        });
      },
      _addPackages: function(result, scope) {
        var keys = Object.keys(result);
        if ( !keys.length ) {
          return;
        }
        var currLocale = API.getLocale();
        keys.forEach(function(i) {
          var newIter = Utils.cloneObject(result[i]);
          if ( typeof newIter !== 'object' ) {
            return;
          }
          if ( typeof newIter.names !== 'undefined' && newIter.names[currLocale] ) {
            newIter.name = newIter.names[currLocale];
          }
          if ( typeof newIter.descriptions !== 'undefined' && newIter.descriptions[currLocale] ) {
            newIter.description = newIter.descriptions[currLocale];
          }
          if ( !newIter.description ) {
            newIter.description = newIter.name;
          }
          newIter.scope = scope || 'system';
          newIter.type  = newIter.type || 'application';
          packages[i] = newIter;
        });
      },
      install: function(file, cb) {
        var root = API.getConfig('PackageManager.UserPackages');
        var dest = Utils.pathJoin(root, file.filename.replace(/\.zip$/i, ''));
        function installFromZip() {
          OSjs.Helpers.ZipArchiver.createInstance({}, function(error, instance) {
            if ( error ) {
              cb(error);
              return;
            }
            if ( instance ) {
              instance.extract(file, dest, {
                onprogress: function() {
                },
                oncomplete: function() {
                  cb();
                }
              });
            }
          });
        }
        VFS.mkdir(new VFS.File(root), function() {
          VFS.exists(new VFS.File(dest), function(error, exists) {
            if ( error ) {
              cb(error);
            } else {
              if ( exists ) {
                cb(API._('ERR_PACKAGE_EXISTS'));
              } else {
                installFromZip();
              }
            }
          });
        });
      },
      setBlacklist: function(list) {
        blacklist = list || [];
      },
      getPackage: function(name) {
        if ( typeof packages[name] !== 'undefined' ) {
          return Object.freeze(Utils.cloneObject(packages)[name]);
        }
        return false;
      },
      getPackages: function(filtered) {
        var hidden = OSjs.Core.getSettingsManager().instance('Packages', {hidden: []}).get('hidden');
        var p = Utils.cloneObject(packages);
        function allowed(i, iter) {
          if ( blacklist.indexOf(i) >= 0 ) {
            return false;
          }
          if ( iter && (iter.groups instanceof Array) ) {
            if ( !API.checkPermission(iter.groups) ) {
              return false;
            }
          }
          return true;
        }
        if ( typeof filtered === 'undefined' || filtered === true ) {
          var result = {};
          Object.keys(p).forEach(function(name) {
            var iter = p[name];
            if ( !allowed(name, iter) ) {
              return;
            }
            if ( iter && hidden.indexOf(name) < 0 ) {
              result[name] = iter;
            }
          });
          return Object.freeze(result);
        }
        return Object.freeze(p);
      },
      getPackagesByMime: function(mime) {
        var list = [];
        var p = Utils.cloneObject(packages);
        Object.keys(p).forEach(function(i) {
          if ( blacklist.indexOf(i) < 0 ) {
            var a = p[i];
            if ( a && a.mime ) {
              if ( Utils.checkAcceptMime(mime, a.mime) ) {
                list.push(Object.freeze(Utils.cloneObject(i)));
              }
            }
          }
        });
        return list;
      },
      addDummyPackage: function(n, title, icon, fn) {
        if ( packages[n] || OSjs.Applications[n] ) {
          throw new Error('A package already exists with this name!');
        }
        if ( typeof fn !== 'function' ) {
          throw new TypeError('You need to specify a function/callback!');
        }
        packages[n] = Object.seal({
          type: 'application',
          className: n,
          description: title,
          name: title,
          icon: icon,
          cateogry: 'other',
          scope: 'system'
        });
        OSjs.Applications[n] = fn;
      }
    });
  })();
  OSjs.Core.getPackageManager = function() {
    return PackageManager;
  };
})(OSjs.Utils, OSjs.VFS, OSjs.API);

(function(Utils, VFS, API) {
  'use strict';
  var SettingsManager = {
    storage: {},
    defaults: {},
    watches: []
  };
  SettingsManager.init = function(settings) {
    this.storage = settings || {};
  };
  SettingsManager.get = function(pool, key) {
    try {
      if ( this.storage[pool] && Object.keys(this.storage[pool]).length ) {
        return key ? this.storage[pool][key] : this.storage[pool];
      }
      return key ? this.defaults[pool][key] : this.defaults[pool];
    } catch ( e ) {
      console.warn('SettingsManager::get()', 'exception', e, e.stack);
    }
    return false;
  };
  SettingsManager.set = function(pool, key, value, save) {
    try {
      if ( key ) {
        if ( typeof this.storage[pool] === 'undefined' ) {
          this.storage[pool] = {};
        }
        if ( (['number', 'string']).indexOf(typeof key) >= 0 ) {
          this.storage[pool][key] = value;
        } else {
          console.warn('SettingsManager::set()', 'expects key to be a valid iter, not', key);
        }
      } else {
        this.storage[pool] = value;
      }
    } catch ( e ) {
      console.warn('SettingsManager::set()', 'exception', e, e.stack);
    }
    if ( save ) {
      this.save(pool, save);
    }
    this.changed(pool);
    return true;
  };
  SettingsManager.save = function(pool, callback) {
    if ( typeof callback !== 'function' ) {
      callback = function() {};
    }
    var handler = OSjs.Core.getHandler();
    handler.saveSettings(pool, this.storage, callback);
  };
  SettingsManager.defaults = function(pool, defaults) {
    this.defaults[pool] = defaults;
  };
  SettingsManager.instance = function(pool, defaults) {
    if ( !this.storage[pool] || (this.storage[pool] instanceof Array) ) {
      this.storage[pool] = {};
    }
    var instance = new OSjs.Helpers.SettingsFragment(this.storage[pool], pool);
    if ( arguments.length > 1 ) {
      SettingsManager.defaults(pool, defaults);
      instance.mergeDefaults(defaults);
    }
    return instance;
  };
  SettingsManager.unwatch = function(index) {
    if ( typeof this.watches[index] !== 'undefined' ) {
      delete this.watches[index];
    }
  };
  SettingsManager.watch = function(pool, callback) {
    if ( !this.storage[pool] ) {
      return false;
    }
    var index = this.watches.push({
      pool: pool,
      callback: callback
    });
    return index - 1;
  };
  SettingsManager.changed = function(pool) {
    var self = this;
    this.watches.forEach(function(watch) {
      if ( watch && watch.pool === pool ) {
        watch.callback(self.storage[pool]);
      }
    });
    return this;
  };
  SettingsManager.clear = function(pool, save) {
    save = (typeof save === 'undefined') || (save === true);
    this.set(pool, null, {}, save);
  };
  OSjs.Core.getSettingsManager = function() {
    return SettingsManager;
  };
})(OSjs.Utils, OSjs.VFS, OSjs.API);

(function(API, Utils, VFS) {
  'use strict';
  window.OSjs = window.OSjs || {};
  OSjs.GUI = OSjs.GUI || {};
  OSjs.GUI.Elements = OSjs.GUI.Elements || {};
  function getWindowId(el) {
    while ( el.parentNode ) {
      var attr = el.getAttribute('data-window-id');
      if ( attr !== null ) {
        return parseInt(attr, 10);
      }
      el = el.parentNode;
    }
    return null;
  }
  function getLabel(el) {
    var label = el.getAttribute('data-label');
    return label || '';
  }
  function getValueLabel(el, attr) {
    var label = attr ? el.getAttribute('data-label') : null;
    if ( el.childNodes.length && el.childNodes[0].nodeType === 3 && el.childNodes[0].nodeValue ) {
      label = el.childNodes[0].nodeValue;
      Utils.$empty(el);
    }
    return label || '';
  }
  function getViewNodeValue(el) {
    var value = el.getAttribute('data-value');
    if ( typeof value === 'string' && value.match(/^\[|\{/) ) {
      try {
        value = JSON.parse(value);
      } catch ( e ) {
        value = null;
      }
    }
    return value;
  }
  function getIcon(el, win) {
    var image = el.getAttribute('data-icon');
    if ( image && image !== 'undefined') {
      if ( image.match(/^stock:\/\//) ) {
        image = image.replace('stock://', '');
        var size  = '16x16';
        try {
          var spl = image.split('/');
          var tmp = spl.shift();
          var siz = tmp.match(/^\d+x\d+/);
          if ( siz ) {
            size = siz[0];
            image = spl.join('/');
          }
          image = API.getIcon(image, size);
        } catch ( e ) {}
      } else if ( image.match(/^app:\/\//) ) {
        image = API.getApplicationResource(win._app, image.replace('app://', ''));
      }
      return image;
    }
    return null;
  }
  function getProperty(el, param, tagName) {
    tagName = tagName || el.tagName.toLowerCase();
    var isDataView = tagName.match(/^gui\-(tree|icon|list|file)\-view$/);
    if ( param === 'value' && !isDataView) {
      if ( (['gui-text', 'gui-password', 'gui-textarea', 'gui-slider', 'gui-select', 'gui-select-list']).indexOf(tagName) >= 0 ) {
        return el.querySelector('input, textarea, select').value;
      }
      if ( (['gui-checkbox', 'gui-radio', 'gui-switch']).indexOf(tagName) >= 0 ) {
        return !!el.querySelector('input').checked;
      }
      return null;
    }
    if ( (param === 'value' || param === 'selected') && isDataView ) {
      return OSjs.GUI.Elements[tagName].values(el);
    }
    return el.getAttribute('data-' + param);
  }
  function setProperty(el, param, value, tagName) {
    tagName = tagName || el.tagName.toLowerCase();
    function _setInputProperty() {
      var firstChild = el.querySelector('textarea, input, select, button');
      if ( param === 'value' ) {
        if ( tagName === 'gui-radio' || tagName === 'gui-checkbox' ) {
          if ( value ) {
            firstChild.setAttribute('checked', 'checked');
            firstChild.checked = true;
          } else {
            firstChild.removeAttribute('checked');
            firstChild.checked = false;
          }
        }
        firstChild.value = value;
        return;
      } else if ( param === 'disabled' ) {
        if ( value ) {
          firstChild.setAttribute('disabled', 'disabled');
        } else {
          firstChild.removeAttribute('disabled');
        }
        el.setAttribute('aria-disabled', String(value === true));
        return;
      }
      firstChild.setAttribute(param, value || '');
    }
    function _setElementProperty() {
      if ( typeof value === 'boolean' ) {
        value = value ? 'true' : 'false';
      } else if ( typeof value === 'object' ) {
        try {
          value = JSON.stringify(value);
        } catch ( e ) {}
      }
      el.setAttribute('data-' + param, value);
    }
    function _createInputLabel() {
      if ( param === 'label' ) {
        var firstChild = el.querySelector('textarea, input, select');
        el.appendChild(firstChild);
        Utils.$remove(el.querySelector('label'));
        createInputLabel(el, tagName.replace(/^gui\-/, ''), firstChild, value);
      }
    }
    var firstChild = el.children[0];
    var accept = ['gui-slider', 'gui-text', 'gui-password', 'gui-textarea', 'gui-checkbox', 'gui-radio', 'gui-select', 'gui-select-list', 'gui-button'];
    if ( accept.indexOf(tagName) >= 0 ) {
      _setInputProperty();
      _createInputLabel();
    }
    accept = ['gui-image', 'gui-audio', 'gui-video'];
    if ( (['src', 'controls', 'autoplay', 'alt']).indexOf(param) >= 0 && accept.indexOf(tagName) >= 0 ) {
      firstChild[param] = value;
    }
    if ( (['_id', '_class', '_style']).indexOf(param) >= 0 ) {
      firstChild.setAttribute(param.replace(/^_/, ''), value);
      return;
    }
    if ( param !== 'value' ) {
      _setElementProperty();
    }
  }
  function createInputLabel(el, type, input, label) {
    label = label || getLabel(el);
    if ( label ) {
      var lbl = document.createElement('label');
      var span = document.createElement('span');
      span.appendChild(document.createTextNode(label));
      if ( type === 'checkbox' || type === 'radio' ) {
        lbl.appendChild(input);
        lbl.appendChild(span);
      } else {
        lbl.appendChild(span);
        lbl.appendChild(input);
      }
      el.appendChild(lbl);
    } else {
      el.appendChild(input);
    }
  }
  function createElement(tagName, params, ignoreParams) {
    ignoreParams = ignoreParams || [];
    var el = document.createElement(tagName);
    var classMap = {
      textalign: function(v) {
        Utils.$addClass(el, 'gui-align-' + v);
      },
      className: function(v) {
        Utils.$addClass(el, v);
      }
    };
    function getValue(k, value) {
      if ( typeof value === 'boolean' ) {
        value = value ? 'true' : 'false';
      } else if ( typeof value === 'object' ) {
        try {
          value = JSON.stringify(value);
        } catch ( e ) {}
      }
      return value;
    }
    if ( typeof params === 'object' ) {
      Object.keys(params).forEach(function(k) {
        if ( ignoreParams.indexOf(k) >= 0 ) {
          return;
        }
        var value = params[k];
        if ( typeof value !== 'undefined' && typeof value !== 'function' ) {
          if ( classMap[k] ) {
            classMap[k](value);
            return;
          }
          var fvalue = getValue(k, value);
          el.setAttribute('data-' + k, fvalue);
        }
      });
    }
    return el;
  }
  function setFlexbox(el, grow, shrink, basis, checkel) {
    checkel = checkel || el;
    (function() {
      if ( typeof basis === 'undefined' || basis === null ) {
        basis = checkel.getAttribute('data-basis') || 'auto';
      }
    })();
    (function() {
      if ( typeof grow === 'undefined' || grow === null ) {
        grow = checkel.getAttribute('data-grow') || 0;
      }
    })();
    (function() {
      if ( typeof shrink === 'undefined' || shrink === null ) {
        shrink = checkel.getAttribute('data-shrink') || 0;
      }
    })();
    var flex = [grow, shrink];
    if ( basis.length ) {
      flex.push(basis);
    }
    var style = flex.join(' ');
    el.style.WebkitBoxFlex = style;
    el.style.MozBoxFlex = style;
    el.style.WebkitFlex = style;
    el.style.MozFlex = style;
    el.style.MSFlex = style;
    el.style.OFlex = style;
    el.style.flex = style;
    var align = el.getAttribute('data-align');
    Utils.$removeClass(el, 'gui-flex-align-start');
    Utils.$removeClass(el, 'gui-flex-align-end');
    if ( align ) {
      Utils.$addClass(el, 'gui-flex-align-' + align);
    }
  }
  function createDrag(el, onDown, onMove, onUp) {
    onDown = onDown || function() {};
    onMove = onMove || function() {};
    onUp = onUp || function() {};
    var startX, startY, currentX, currentY;
    var dragging = false;
    var boundUp, boundMove;
    function _onMouseDown(ev, pos, touchDevice) {
      ev.preventDefault();
      startX = pos.x;
      startY = pos.y;
      onDown(ev, {x: startX, y: startY});
      dragging = true;
      boundUp = Utils.$bind(window, 'mouseup', _onMouseUp, false);
      boundMove = Utils.$bind(window, 'mousemove', _onMouseMove, false);
    }
    function _onMouseMove(ev, pos, touchDevice) {
      ev.preventDefault();
      if ( dragging ) {
        currentX = pos.x;
        currentY = pos.y;
        var diffX = currentX - startX;
        var diffY = currentY - startY;
        onMove(ev, {x: diffX, y: diffY}, {x: currentX, y: currentY});
      }
    }
    function _onMouseUp(ev, pos, touchDevice) {
      onUp(ev, {x: currentX, y: currentY});
      dragging = false;
      boundUp = Utils.$unbind(boundUp);
      boundMove = Utils.$unbind(boundMove);
    }
    Utils.$bind(el, 'mousedown', _onMouseDown, false);
  }
  function getNextElement(prev, current, root) {
    function getElements() {
      var ignore_roles = ['menu', 'menuitem', 'grid', 'gridcell', 'listitem'];
      var list = [];
      root.querySelectorAll('.gui-element').forEach(function(e) {
        if ( Utils.$hasClass(e, 'gui-focus-element') || ignore_roles.indexOf(e.getAttribute('role')) >= 0 || e.getAttribute('data-disabled') === 'true' ) {
          return;
        }
        if ( e.offsetParent ) {
          list.push(e);
        }
      });
      return list;
    }
    function getCurrentIndex(els, m) {
      var found = -1;
      if ( m ) {
        els.every(function(e, idx) {
          if ( e === m ) {
            found = idx;
          }
          return found === -1;
        });
      }
      return found;
    }
    function getCurrentParent(els, m) {
      if ( m ) {
        var cur = m;
        while ( cur.parentNode ) {
          if ( Utils.$hasClass(cur, 'gui-element') ) {
            return cur;
          }
          cur = cur.parentNode;
        }
        return null;
      }
      return els[0];
    }
    function getNextIndex(els, p, i) {
      if ( prev ) {
        i = (i <= 0) ? (els.length) - 1 : (i - 1);
      } else {
        i = (i >= (els.length - 1)) ? 0 : (i + 1);
      }
      return i;
    }
    function getNextElement(els, i) {
      var next = els[i];
      if ( next.tagName.match(/^GUI\-(BUTTON|TEXT|PASSWORD|SWITCH|CHECKBOX|RADIO|SELECT)/) ) {
        next = next.querySelectorAll('input, textarea, button')[0];
      }
      if ( next.tagName === 'GUI-FILE-VIEW' ) {
        next = next.children[0];
      }
      return next;
    }
    if ( root ) {
      var elements = getElements();
      if ( elements.length ) {
        var currentParent = getCurrentParent(elements, current);
        var currentIndex = getCurrentIndex(elements, currentParent);
        if ( currentIndex >= 0 ) {
          var nextIndex = getNextIndex(elements, currentParent, currentIndex);
          return getNextElement(elements, nextIndex);
        }
      }
    }
    return null;
  }
  function createDraggable(el, args) {
    args = OSjs.Utils.argumentDefaults(args, {
      type       : null,
      effect     : 'move',
      data       : null,
      mime       : 'application/json',
      dragImage  : null,
      onStart    : function() { return true; },
      onEnd      : function() { return true; }
    });
    if ( OSjs.Utils.isIE() ) {
      args.mime = 'text';
    }
    function _toString(mime) {
      return JSON.stringify({
        type:   args.type,
        effect: args.effect,
        data:   args.data,
        mime:   args.mime
      });
    }
    function _dragStart(ev) {
      try {
        ev.dataTransfer.effectAllowed = args.effect;
        if ( args.dragImage && (typeof args.dragImage === 'function') ) {
          if ( ev.dataTransfer.setDragImage ) {
            var dragImage = args.dragImage(ev, el);
            if ( dragImage ) {
              var dragEl    = dragImage.element;
              var dragPos   = dragImage.offset;
              document.body.appendChild(dragEl);
              ev.dataTransfer.setDragImage(dragEl, dragPos.x, dragPos.y);
            }
          }
        }
        ev.dataTransfer.setData(args.mime, _toString(args.mime));
      } catch ( e ) {
        console.warn('Failed to dragstart: ' + e);
        console.warn(e.stack);
      }
    }
    el.setAttribute('draggable', 'true');
    el.setAttribute('aria-grabbed', 'false');
    el.addEventListener('dragstart', function(ev) {
      this.setAttribute('aria-grabbed', 'true');
      this.style.opacity = '0.4';
      if ( ev.dataTransfer ) {
        _dragStart(ev);
      }
      return args.onStart(ev, this, args);
    }, false);
    el.addEventListener('dragend', function(ev) {
      this.setAttribute('aria-grabbed', 'false');
      this.style.opacity = '1.0';
      return args.onEnd(ev, this, args);
    }, false);
  }
  function createDroppable(el, args) {
    args = OSjs.Utils.argumentDefaults(args, {
      accept         : null,
      effect         : 'move',
      mime           : 'application/json',
      files          : true,
      onFilesDropped : function() { return true; },
      onItemDropped  : function() { return true; },
      onEnter        : function() { return true; },
      onOver         : function() { return true; },
      onLeave        : function() { return true; },
      onDrop         : function() { return true; }
    });
    if ( OSjs.Utils.isIE() ) {
      args.mime = 'text';
    }
    function getParent(start, matcher) {
      if ( start === matcher ) { return true; }
      var i = 10;
      while ( start && i > 0 ) {
        if ( start === matcher ) {
          return true;
        }
        start = start.parentNode;
        i--;
      }
      return false;
    }
    function _onDrop(ev, el) {
      ev.stopPropagation();
      ev.preventDefault();
      args.onDrop(ev, el);
      if ( !ev.dataTransfer ) { return true; }
      if ( args.files ) {
        var files = ev.dataTransfer.files;
        if ( files && files.length ) {
          return args.onFilesDropped(ev, el, files, args);
        }
      }
      var data;
      try {
        data = ev.dataTransfer.getData(args.mime);
      } catch ( e ) {
        console.warn('Failed to drop: ' + e);
      }
      if ( data ) {
        var item = JSON.parse(data);
        if ( args.accept === null || args.accept === item.type ) {
          return args.onItemDropped(ev, el, item, args);
        }
      }
      return false;
    }
    el.setAttribute('aria-dropeffect', args.effect);
    el.addEventListener('drop', function(ev) {
      return _onDrop(ev, this);
    }, false);
    el.addEventListener('dragenter', function(ev) {
      return args.onEnter.call(this, ev, this, args);
    }, false);
    el.addEventListener('dragover', function(ev) {
      ev.preventDefault();
      if ( !getParent(ev.target, el) ) {
        return false;
      }
      ev.stopPropagation();
      ev.dataTransfer.dropEffect = args.effect;
      return args.onOver.call(this, ev, this, args);
    }, false);
    el.addEventListener('dragleave', function(ev) {
      return args.onLeave.call(this, ev, this, args);
    }, false);
  }
  OSjs.GUI.Helpers = {
    getNextElement: getNextElement,
    getProperty: getProperty,
    getValueLabel: getValueLabel,
    getViewNodeValue: getViewNodeValue,
    getLabel: getLabel,
    getIcon: getIcon,
    getWindowId: getWindowId,
    createInputLabel: createInputLabel,
    createElement: createElement,
    createDrag: createDrag,
    setProperty: setProperty,
    setFlexbox: setFlexbox,
    createDraggable: createDraggable,
    createDroppable: createDroppable
  };
})(OSjs.API, OSjs.Utils, OSjs.VFS);

(function(API, Utils, VFS) {
  'use strict';
  window.OSjs = window.OSjs || {};
  OSjs.GUI = OSjs.GUI || {};
  var dialogScheme;
  function parseDynamic(scheme, node, win, args) {
    args = args || {};
    var translator = args._ || API._;
    node.querySelectorAll('*[data-label]').forEach(function(el) {
      var label = translator(el.getAttribute('data-label'));
      el.setAttribute('data-label', label);
    });
    node.querySelectorAll('gui-label, gui-button, gui-list-view-column, gui-select-option, gui-select-list-option').forEach(function(el) {
      if ( !el.children.length && !el.getAttribute('data-no-translate') ) {
        var lbl = OSjs.GUI.Helpers.getValueLabel(el);
        el.appendChild(document.createTextNode(translator(lbl)));
      }
    });
    node.querySelectorAll('gui-button').forEach(function(el) {
      var label = OSjs.GUI.Helpers.getValueLabel(el);
      if ( label ) {
        el.appendChild(document.createTextNode(API._(label)));
      }
    });
    node.querySelectorAll('*[data-icon]').forEach(function(el) {
      var image = OSjs.GUI.Helpers.getIcon(el, win);
      el.setAttribute('data-icon', image);
    });
  }
  function addChildren(frag, root) {
    if ( frag ) {
      var children = frag.children;
      var i = 0;
      while ( children.length && i < 10000 ) {
        root.appendChild(children[0]);
        i++;
      }
    }
  }
  function resolveFragments(scheme, node, el) {
    function _resolve() {
      var nodes = node.querySelectorAll('gui-fragment');
      if ( nodes.length ) {
        nodes.forEach(function(el) {
          var id = el.getAttribute('data-fragment-id');
          var frag = scheme.getFragment(id, 'application-fragment').cloneNode(true);
          addChildren(frag, el.parentNode);
          Utils.$remove(el);
        });
        return true;
      }
      return false;
    }
    if ( scheme ) {
      var resolving = true;
      while ( resolving ) {
        resolving = _resolve();
      }
    }
  }
  function createScheme(url) {
    return new UIScheme(url);
  }
  function UIScheme(url) {
    this.url = url;
    this.scheme = null;
    this.triggers = {render: []};
  }
  UIScheme.prototype.destroy = function() {
    Utils.$empty(this.scheme);
    this.scheme = null;
    this.triggers = {};
  };
  UIScheme.prototype.on = function(f, fn) {
    this.triggers[f].push(fn);
  };
  UIScheme.prototype._trigger = function(f, args) {
    args = args || [];
    var self = this;
    this.triggers[f].forEach(function(fn) {
      fn.apply(self, args);
    });
  };
  UIScheme.prototype._load = function(html) {
    function removeSelfClosingTags(str) {
      var split = (str || '').split('/>');
      var newhtml = '';
      for (var i = 0; i < split.length - 1;i++) {
        var edsplit = split[i].split('<');
        newhtml += split[i] + '></' + edsplit[edsplit.length - 1].split(' ')[0] + '>';
      }
      return newhtml + split[split.length - 1];
    }
    var doc = document.createDocumentFragment();
    var wrapper = document.createElement('div');
    wrapper.innerHTML = Utils.cleanHTML(removeSelfClosingTags(html));
    doc.appendChild(wrapper);
    this.scheme = doc.cloneNode(true);
    wrapper = null;
    doc = null;
  };
  UIScheme.prototype.loadString = function(html, cb) {
    this._load(html);
    cb(false, this.scheme);
  };
  UIScheme.prototype.load = function(cb) {
    var self = this;
    if ( window.location.protocol.match(/^file/) ) {
      var url = this.url;
      if ( !url.match(/^\//) ) {
        url = '/' + url;
      }
      self._load(OSjs.API.getDefaultSchemes(url.replace(/^\/packages/, '')));
      cb(false, self.scheme);
      return;
    }
    var src = this.url;
    if ( src.substr(0, 1) !== '/' && !src.match(/^(https?|ftp)/) ) {
      src = window.location.href + src;
    }
    Utils.ajax({
      url: src,
      onsuccess: function(html) {
        self._load(html);
        cb(false, self.scheme);
      },
      onerror: function() {
        cb('Failed to fetch scheme');
      }
    });
  };
  UIScheme.prototype.getFragment = function(id, type) {
    var content = null;
    if ( id ) {
      if ( type ) {
        content = this.scheme.querySelector(type + '[data-id="' + id + '"]');
      } else {
        content = this.scheme.querySelector('application-window[data-id="' + id + '"]') ||
                  this.scheme.querySelector('application-fragment[data-id="' + id + '"]');
      }
    }
    return content;
  };
  UIScheme.prototype.parse = function(id, type, win, onparse, args) {
    var self = this;
    var content = this.getFragment(id, type);
    if ( !content ) {
      console.error('UIScheme::parse()', 'No fragment found', id + '@' + type);
      return null;
    }
    type = type || content.tagName.toLowerCase();
    if ( content ) {
      var node = content.cloneNode(true);
      UIScheme.parseNode(this, win, node, type, args, onparse, id);
      return node;
    }
    return null;
  };
  UIScheme.prototype.render = function(win, id, root, type, onparse, args) {
    root = root || win._getRoot();
    if ( root instanceof OSjs.GUI.Element ) {
      root = root.$element;
    }
    function setWindowProperties(frag) {
      if ( frag ) {
        var width = parseInt(frag.getAttribute('data-width'), 10) || 0;
        var height = parseInt(frag.getAttribute('data-height'), 10) || 0;
        var allow_maximize = frag.getAttribute('data-allow_maximize');
        var allow_minimize = frag.getAttribute('data-allow_minimize');
        var allow_close = frag.getAttribute('data-allow_close');
        var allow_resize = frag.getAttribute('data-allow_resize');
        if ( (!isNaN(width) && width > 0) || (!isNaN(height) && height > 0) ) {
          win._resize(width, height);
        }
        win._setProperty('allow_maximize', allow_maximize);
        win._setProperty('allow_minimize', allow_minimize);
        win._setProperty('allow_close', allow_close);
        win._setProperty('allow_resize', allow_resize);
      }
    }
    var content = this.parse(id, type, win, onparse, args);
    addChildren(content, root);
    if ( !win._restored ) {
      setWindowProperties(this.getFragment(id));
    }
    this._trigger('render', [root]);
  };
  UIScheme.prototype.create = function(win, tagName, params, parentNode, applyArgs) {
    tagName = tagName || '';
    params = params || {};
    parentNode = parentNode || win.getRoot();
    if ( parentNode instanceof OSjs.GUI.Element ) {
      parentNode = parentNode.$element;
    }
    var el;
    if ( OSjs.GUI.Elements[tagName] && OSjs.GUI.Elements[tagName].create ) {
      el = OSjs.GUI.Elements[tagName].create(params);
    } else {
      el = OSjs.GUI.Helpers.createElement(tagName, params);
    }
    parentNode.appendChild(el);
    OSjs.GUI.Elements[tagName].build(el, applyArgs, win);
    return new OSjs.GUI.Element(el);
  };
  UIScheme.prototype.find = function(win, id, root) {
    root = this._findRoot(win, root);
    var res = this._findDOM(win, id, root);
    return this.get(res.el, res.q);
  };
  UIScheme.prototype.findByQuery = function(win, query, root, all) {
    root = this._findRoot(win, root);
    var el;
    var self = this;
    if ( all ) {
      el = root.querySelectorAll(query).map(function(e) {
        return self.get(e, query);
      });
    }
    el = root.querySelector(query);
    return this.get(el, query);
  };
  UIScheme.prototype.findDOM = function(win, id, root) {
    root = this._findRoot(win, root);
    return this._findDOM(win, id, root).el;
  };
  UIScheme.prototype._findRoot = function(win, root) {
    if ( !(win instanceof OSjs.Core.Window) ) {
      throw new Error('UIScheme::_findDOM() expects a instance of Window');
    }
    return root || win._getRoot();
  };
  UIScheme.prototype._findDOM = function(win, id, root) {
    var q = '[data-id="' + id + '"]';
    return {
      q: q,
      el: root.querySelector(q)
    };
  };
  UIScheme.prototype.get = function(el, q) {
    return UIScheme.getElementInstance(el, q);
  };
  UIScheme.prototype.getHTML = function() {
    return this.scheme.firstChild.innerHTML;
  };
  UIScheme.parseNode = function(scheme, win, node, type, args, onparse, id) {
    onparse = onparse || function() {};
    args = args || {};
    type = type || 'snipplet';
    if ( args.resolve !== false ) {
      resolveFragments(scheme, node);
    }
    node.querySelectorAll('*').forEach(function(el) {
      var lcase = el.tagName.toLowerCase();
      if ( lcase.match(/^gui\-/) && !lcase.match(/(\-container|\-(h|v)box|\-columns?|\-rows?|(status|tool)bar|(button|menu)\-bar|bar\-entry)$/) ) {
        Utils.$addClass(el, 'gui-element');
      }
    });
    parseDynamic(scheme, node, win, args);
    onparse(node);
    Object.keys(OSjs.GUI.Elements).forEach(function(key) {
      node.querySelectorAll(key).forEach(function(pel) {
        if ( pel._wasParsed ) {
          return;
        }
        try {
          OSjs.GUI.Elements[key].build(pel);
        } catch ( e ) {
          console.warn('parseNode()', id, type, win, 'exception');
          console.warn(e, e.stack);
        }
        pel._wasParsed = true;
      });
    });
  };
  UIScheme.getElementInstance = function(el, q) {
    if ( el ) {
      var tagName = el.tagName.toLowerCase();
      if ( tagName.match(/^gui\-(list|tree|icon|file)\-view$/) || tagName.match(/^gui\-select/) ) {
        return new OSjs.GUI.ElementDataView(el, q);
      }
    }
    return new OSjs.GUI.Element(el, q);
  };
  var DialogScheme = (function() {
    var dialogScheme;
    return {
      get: function() {
        return dialogScheme;
      },
      destroy: function() {
        if ( dialogScheme ) {
          dialogScheme.destroy();
        }
        dialogScheme = null;
      },
      init: function(cb) {
        if ( dialogScheme ) {
          cb();
          return;
        }
        var root = API.getConfig('Connection.RootURI');
        var url = root + 'client/dialogs.html';
        if ( API.getConfig('Connection.Dist') === 'dist' ) {
          url = root + 'dialogs.html';
        }
        dialogScheme = OSjs.GUI.createScheme(url);
        dialogScheme.load(function(error) {
          if ( error ) {
            console.warn('OSjs.GUI.initDialogScheme()', 'error loading dialog schemes', error);
          }
          cb();
        });
      }
    };
  })();
  OSjs.GUI.Scheme = Object.seal(UIScheme);
  OSjs.GUI.DialogScheme = DialogScheme;
  OSjs.GUI.createScheme = createScheme;
})(OSjs.API, OSjs.Utils, OSjs.VFS);

(function(API, Utils, VFS) {
  'use strict';
  window.OSjs = window.OSjs || {};
  OSjs.GUI = OSjs.GUI || {};
  function getFocusElement(inst) {
    var tagMap = {
      'gui-switch': 'button',
      'gui-list-view': 'textarea',
      'gui-tree-view': 'textarea',
      'gui-icon-view': 'textarea',
      'gui-input-modal': 'button'
    };
    if ( tagMap[inst.tagName] ) {
      return inst.$element.querySelector(tagMap[inst.tagName]);
    }
    return inst.$element.firstChild || inst.$element;
  }
  function UIElement(el, q) {
    this.$element = el || null;
    this.tagName = el ? el.tagName.toLowerCase() : null;
    this.oldDisplay = null;
    if ( !el ) {
      console.error('UIElement() was constructed without a DOM element', q);
    }
  }
  UIElement.prototype.remove = function() {
    this.$element = Utils.$remove(this.$element);
  };
  UIElement.prototype.empty = function() {
    Utils.$empty(this.$element);
    return this;
  };
  UIElement.prototype.blur = function() {
    if ( this.$element ) {
      var firstChild = getFocusElement(this);
      if ( firstChild ) {
        firstChild.blur();
      }
    }
    return this;
  };
  UIElement.prototype.focus = function() {
    if ( this.$element ) {
      var firstChild = getFocusElement(this);
      if ( firstChild ) {
        firstChild.focus();
      }
    }
    return this;
  };
  UIElement.prototype.show = function() {
    if ( this.$element && !this.$element.offsetParent ) {
      if ( OSjs.GUI.Elements[this.tagName] && OSjs.GUI.Elements[this.tagName].show ) {
        OSjs.GUI.Elements[this.tagName].show.apply(this, arguments);
      } else {
        if ( this.$element ) {
          this.$element.style.display = this.oldDisplay || '';
        }
      }
    }
    return this;
  };
  UIElement.prototype.hide = function() {
    if ( this.$element && this.$element.offsetParent ) {
      if ( !this.oldDisplay ) {
        this.oldDisplay = this.$element.style.display;
      }
      this.$element.style.display = 'none';
    }
    return this;
  };
  UIElement.prototype.on = function(evName, callback, args) {
    if ( OSjs.GUI.Elements[this.tagName] && OSjs.GUI.Elements[this.tagName].bind ) {
      OSjs.GUI.Elements[this.tagName].bind(this.$element, evName, callback, args);
    }
    return this;
  };
  UIElement.prototype.set = function(param, value, arg, arg2) {
    if ( this.$element ) {
      if ( OSjs.GUI.Elements[this.tagName] && OSjs.GUI.Elements[this.tagName].set ) {
        if ( OSjs.GUI.Elements[this.tagName].set(this.$element, param, value, arg, arg2) === true ) {
          return this;
        }
      }
      OSjs.GUI.Helpers.setProperty(this.$element, param, value, arg, arg2);
    }
    return this;
  };
  UIElement.prototype.get = function() {
    if ( this.$element ) {
      if ( OSjs.GUI.Elements[this.tagName] && OSjs.GUI.Elements[this.tagName].get ) {
        var args = ([this.$element]).concat(Array.prototype.slice.call(arguments));
        return OSjs.GUI.Elements[this.tagName].get.apply(this, args);
      } else {
        return OSjs.GUI.Helpers.getProperty(this.$element, arguments[0]);
      }
    }
    return null;
  };
  UIElement.prototype.fn = function(name, args, thisArg) {
    args = args || [];
    thisArg = thisArg || this;
    if ( this.$element ) {
      return OSjs.GUI.Elements[this.tagName][name].apply(thisArg, args);
    }
    return null;
  };
  UIElement.prototype.append = function(el) {
    if ( el instanceof UIElement ) {
      el = el.$element;
    } else if ( typeof el === 'string' || typeof el === 'number' ) {
      el = document.createTextNode(String(el));
    }
    var outer = document.createElement('div');
    outer.appendChild(el);
    this._append(outer);
    outer = null;
    return this;
  };
  UIElement.prototype.appendHTML = function(html, scheme, win, args) {
    var el = document.createElement('div');
    el.innerHTML = html;
    return this._append(el, scheme, win, args);
  };
  UIElement.prototype._append = function(el, scheme, win, args) {
    if ( el instanceof Element ) {
      OSjs.GUI.Scheme.parseNode(scheme, win, el, null, args);
    }
    while ( el.childNodes.length ) {
      this.$element.appendChild(el.childNodes[0]);
    }
    el = null;
    return this;
  };
  UIElement.prototype.querySelector = function(q, rui) {
    var el = this.$element.querySelector(q);
    if ( rui ) {
      return OSjs.GUI.Scheme.getElementInstance(el, q);
    }
    return el;
  };
  UIElement.prototype.querySelectorAll = function(q, rui) {
    var el = this.$element.querySelectorAll(q);
    if ( rui ) {
      el = el.map(function(i) {
        return OSjs.GUI.Scheme.getElementInstance(i, q);
      });
    }
    return el;
  };
  UIElement.prototype._call = function(method, args) {
    if ( OSjs.GUI.Elements[this.tagName] && OSjs.GUI.Elements[this.tagName].call ) {
      var cargs = ([this.$element, method, args]);//.concat(args);
      return OSjs.GUI.Elements[this.tagName].call.apply(this, cargs);
    }
    return null;//this;
  };
  function UIElementDataView() {
    UIElement.apply(this, arguments);
  }
  UIElementDataView.prototype = Object.create(UIElement.prototype);
  UIElementDataView.constructor = UIElement;
  UIElementDataView.prototype.clear = function() {
    return this._call('clear', []);
  };
  UIElementDataView.prototype.add = function(props) {
    return this._call('add', [props]);
  };
  UIElementDataView.prototype.patch = function(props) {
    return this._call('patch', [props]);
  };
  UIElementDataView.prototype.remove = function(id, key) {
    return this._call('remove', [id, key]);
  };
  OSjs.GUI.Element = Object.seal(UIElement);
  OSjs.GUI.ElementDataView = Object.seal(UIElementDataView);
})(OSjs.API, OSjs.Utils, OSjs.VFS);

(function(API, Utils, VFS, GUI) {
  'use strict';
  GUI = OSjs.GUI || {};
  GUI.Elements = OSjs.GUI.Elements || {};
  var _classMap = { // Defaults to (foo-bar)-entry
    'gui-list-view': 'gui-list-view-row'
  };
  function handleItemSelection(ev, item, idx, className, selected, root, multipleSelect) {
    root = root || item.parentNode;
    if ( !multipleSelect || !ev.shiftKey ) {
      root.querySelectorAll(className).forEach(function(i) {
        Utils.$removeClass(i, 'gui-active');
      });
      selected = [];
    }
    var findex = selected.indexOf(idx);
    if ( findex >= 0 ) {
      selected.splice(findex, 1);
      Utils.$removeClass(item, 'gui-active');
    } else {
      selected.push(idx);
      Utils.$addClass(item, 'gui-active');
    }
    selected.sort(function(a, b) {
      return a - b;
    });
    return selected;
  }
  function getSelected(el) {
    return GUI.Elements[el.tagName.toLowerCase()].values(el);
  }
  function handleKeyPress(el, ev) {
    var map = {};
    var key = ev.keyCode;
    var type = el.tagName.toLowerCase();
    var className = _classMap[type];
    if ( !className ) {
      className = type + '-entry';
    }
    var root = el.querySelector(type + '-body');
    var entries = root.querySelectorAll(className);
    var count = entries.length;
    if ( !count ) { return; }
    if ( key === Utils.Keys.ENTER ) {
      el.dispatchEvent(new CustomEvent('_activate', {detail: {entries: getSelected(el)}}));
      return;
    }
    map[Utils.Keys.C] = function(ev) {
      if ( ev.ctrlKey ) {
        var selected = getSelected(el);
        if ( selected && selected.length ) {
          var data = [];
          selected.forEach(function(s) {
            if ( s && s.data ) {
              data.push(new VFS.File(s.data.path, s.data.mime));
            }
          });
          API.setClipboard(data);
        }
        console.warn();
      }
    };
    var selected = el._selected.concat() || [];
    var first = selected.length ? selected[0] : 0;
    var last = selected.length > 1 ? selected[selected.length - 1] : first;
    var current = 0;
    function select() {
      var item = entries[current];
      if ( item ) {
        el._selected = handleItemSelection(ev, item, current, className, selected, root, ev.shiftKey);
        GUI.Elements._dataview.scrollIntoView(el, item);
      }
    }
    function getRowSize() {
      var d = 0;
      var lastTop = -1;
      entries.forEach(function(e) {
        if ( lastTop === -1 ) {
          lastTop = e.offsetTop;
        }
        if ( lastTop !== e.offsetTop ) {
          return false;
        }
        lastTop = e.offsetTop;
        d++;
        return true;
      });
      return d;
    }
    function handleKey() {
      function next() {
        current = Math.min(last + 1, count);
        select();
      }
      function prev() {
        current = Math.max(0, first - 1);
        select();
      }
      if ( type === 'gui-tree-view' || type === 'gui-list-view' ) {
        map[Utils.Keys.UP] = prev;
        map[Utils.Keys.DOWN] = next;
      } else {
        map[Utils.Keys.UP] = function() {
          current = Math.max(0, first - getRowSize());
          select();
        };
        map[Utils.Keys.DOWN] = function() {
          current = Math.max(last, last + getRowSize());
          select();
        };
        map[Utils.Keys.LEFT] = prev;
        map[Utils.Keys.RIGHT] = next;
      }
      if ( map[key] ) { map[key](ev); }
    }
    handleKey();
  }
  function matchValueByKey(r, val, key, idx) {
    var value = r.getAttribute('data-value');
    if ( !key && (val === idx || val === value) ) {
      return r;
    } else {
      try {
        var json = JSON.parse(value);
        if ( typeof json[key] === 'object' ? json[key] === val : String(json[key]) === String(val) ) {
          return r;
        }
      } catch ( e ) {}
    }
    return false;
  }
  GUI.Elements._dataview = {
    clear: function(el, body) {
      body = body || el;
      Utils.$empty(body);
      body.scrollTop = 0;
      el._selected = [];
    },
    add: function(el, args, oncreate) {
      var entries = args[0];
      if ( !(entries instanceof Array) ) {
        entries = [entries];
      }
      entries.forEach(oncreate);
      return this;
    },
    patch: function(el, args, className, body, oncreate, oninit) {
      var self = this;
      var entries = args[0];
      var single = false;
      if ( !(entries instanceof Array) ) {
        entries = [entries];
        single = true;
      }
      var inView = {};
      body.querySelectorAll(className).forEach(function(row) {
        var id = row.getAttribute('data-id');
        if ( id !== null ) {
          inView[id] = row;
        }
      });
      entries.forEach(function(entry) {
        var insertBefore;
        if ( typeof entry.id !== 'undefined' && entry.id !== null ) {
          if ( inView[entry.id] ) {
            insertBefore = inView[entry.id];
            delete inView[entry.id];
          }
          var row = oncreate(entry);
          if ( row ) {
            if ( insertBefore ) {
              if ( Utils.$hasClass(insertBefore, 'gui-active') ) {
                Utils.$addClass(row, 'gui-active');
              }
              body.insertBefore(row, insertBefore);
              self.remove(el, null, className, insertBefore);
            } else {
              body.appendChild(row);
            }
            oninit(el, row);
          }
        }
      });
      if ( !single ) {
        Object.keys(inView).forEach(function(k) {
          self.remove(el, null, className, inView[k]);
        });
      }
      inView = {};
      this.updateActiveSelection(el, className);
      return this;
    },
    remove: function(el, args, className, target) {
      function remove(cel) {
        Utils.$remove(cel);
      }
      if ( target ) {
        remove(target);
        return;
      }
      if ( typeof args[1] === 'undefined' && typeof args[0] === 'number' ) {
        remove(el.querySelectorAll(className)[args[0]]);
      } else {
        var findId = args[0];
        var findKey = args[1] || 'id';
        var q = 'data-' + findKey + '="' + findId + '"';
        el.querySelectorAll(className + '[' + q + ']').forEach(remove);
      }
      this.updateActiveSelection(el, className);
      return this;
    },
    updateActiveSelection: function(el, className) {
      var active = [];
      el.querySelectorAll(className + '.gui-active').forEach(function(cel) {
        active.push(Utils.$index(cel));
      });
      el._active = active;
    },
    scrollIntoView: function(el, element) {
      var pos = Utils.$position(element, el);
      var marginTop = 0;
      if ( el.tagName.toLowerCase() === 'gui-list-view' ) {
        var header = el.querySelector('gui-list-view-head');
        if ( header ) {
          marginTop = header.offsetHeight;
        }
      }
      var scrollSpace = (el.scrollTop + el.offsetHeight) - marginTop;
      var scrollTop = el.scrollTop + marginTop;
      var elTop = pos.top - marginTop;
      if ( pos !== null && (elTop > scrollSpace || elTop < scrollTop) ) {
        el.scrollTop = elTop;
        return true;
      }
      return false;
    },
    bindEntryEvents: function(el, row, className) {
      var singleClick = el.getAttribute('data-single-click') === 'true';
      function select(ev) {
        ev.stopPropagation();
        var multipleSelect = el.getAttribute('data-multiple');
        multipleSelect = multipleSelect === null || multipleSelect === 'true';
        var idx = Utils.$index(row);
        el._selected = handleItemSelection(ev, row, idx, className, el._selected, el, multipleSelect);
        el.dispatchEvent(new CustomEvent('_select', {detail: {entries: getSelected(el)}}));
      }
      function activate(ev) {
        ev.stopPropagation();
        el.dispatchEvent(new CustomEvent('_activate', {detail: {entries: getSelected(el)}}));
      }
      function context(ev) {
        select(ev);
        el.dispatchEvent(new CustomEvent('_contextmenu', {detail: {entries: getSelected(el), x: ev.clientX, y: ev.clientY}}));
      }
      function createDraggable() {
        var value = row.getAttribute('data-value');
        if ( value !== null ) {
          try {
            value = JSON.parse(value);
          } catch ( e ) {}
        }
        var source = row.getAttribute('data-draggable-source');
        if ( source === null ) {
          source = GUI.Helpers.getWindowId(el);
          if ( source !== null ) {
            source = {wid: source};
          }
        }
        GUI.Helpers.createDraggable(row, {
          type   : el.getAttribute('data-draggable-type') || row.getAttribute('data-draggable-type'),
          source : source,
          data   : value
        });
        var tooltip = row.getAttribute('data-tooltip');
        if ( tooltip && !row.getAttribute('title') ) {
          row.setAttribute('title', tooltip);
        }
      }
      if ( singleClick ) {
        Utils.$bind(row, 'click', function(ev) {
          select(ev);
          activate(ev);
        });
      } else {
        Utils.$bind(row, 'click', select, false);
        Utils.$bind(row, 'dblclick', activate, false);
      }
      Utils.$bind(row, 'contextmenu', function(ev) {
        ev.preventDefault();
        context(ev);
        return false;
      }, false);
      el.dispatchEvent(new CustomEvent('_render', {detail: {
        element: row,
        data: GUI.Helpers.getViewNodeValue(row)
      }}));
      if ( el.getAttribute('data-draggable') === 'true' ) {
        createDraggable();
      }
    },
    getSelected: function(el, entries) {
      var selected = [];
      entries.forEach(function(iter, idx) {
        if ( Utils.$hasClass(iter, 'gui-active') ) {
          selected.push({
            index: idx,
            data: GUI.Helpers.getViewNodeValue(iter)
          });
        }
      });
      return selected;
    },
    getEntry: function(el, entries, val, key) {
      var result = null;
      entries.forEach(function(r, idx) {
        if ( matchValueByKey(r, val, key, idx) ) {
          result = r;
        }
        return !!result;
      });
      return result;
    },
    setSelected: function(el, body, entries, val, key, opts) {
      var self = this;
      var select = [];
      var scrollIntoView = false;
      if ( typeof opts === 'object' ) {
        scrollIntoView = opts.scroll === true;
      }
      function sel(r, idx) {
        select.push(idx);
        Utils.$addClass(r, 'gui-active');
        if ( scrollIntoView ) {
          self.scrollIntoView(el, r);
        }
      }
      entries.forEach(function(r, idx) {
        Utils.$removeClass(r, 'gui-active');
        if ( matchValueByKey(r, val, key, idx) ) {
          sel(r, idx);
        }
      });
      el._selected = select;
    },
    build: function(el, applyArgs) {
      el._selected = [];
      el.scrollTop = 0;
      Utils.$addClass(el, 'gui-data-view');
      if ( !el.querySelector('textarea.gui-focus-element') && !el.getAttribute('no-selection') ) {
        var underlay = document.createElement('textarea');
        underlay.setAttribute('aria-label', '');
        underlay.setAttribute('aria-hidden', 'true');
        underlay.setAttribute('readonly', 'true');
        underlay.className = 'gui-focus-element';
        Utils.$bind(underlay, 'focus', function(ev) {
          ev.preventDefault();
          Utils.$addClass(el, 'gui-element-focused');
        });
        Utils.$bind(underlay, 'blur', function(ev) {
          ev.preventDefault();
          Utils.$removeClass(el, 'gui-element-focused');
        });
        Utils.$bind(underlay, 'keydown', function(ev) {
          ev.preventDefault();
          handleKeyPress(el, ev);
        });
        Utils.$bind(underlay, 'keypress', function(ev) {
          ev.preventDefault();
        });
        this.bind(el, 'select', function(ev) {
          if ( Utils.$hasClass(el, 'gui-element-focused') ) {
            return;
          }
          var oldTop = el.scrollTop;
          underlay.focus();
          el.scrollTop = oldTop;
          setTimeout(function() {
            el.scrollTop = oldTop;
          }, 2);
        }, true);
        el.appendChild(underlay);
      }
    },
    focus: function(el) {
      try {
        var underlay = el.querySelector('.gui-focus-element');
        underlay.focus();
      } catch ( e ) {
        console.warn(e, e.stack);
      }
    },
    blur: function(el) {
      try {
        var underlay = el.querySelector('.gui-focus-element');
        underlay.blur();
      } catch ( e ) {
        console.warn(e, e.stack);
      }
    },
    bind: function(el, evName, callback, params) {
      if ( (['activate', 'select', 'expand', 'contextmenu', 'render', 'drop']).indexOf(evName) !== -1 ) {
        evName = '_' + evName;
      }
      Utils.$bind(el, evName, callback.bind(new GUI.Element(el)), params);
    }
  };
})(OSjs.API, OSjs.Utils, OSjs.VFS, OSjs.GUI);

(function(API, Utils, VFS, GUI) {
  'use strict';
  GUI.Elements['gui-color-box'] = {
    bind: function(el, evName, callback, params) {
      var target = el.querySelector('div');
      Utils.$bind(target, evName, callback.bind(new GUI.Element(el)), params);
    },
    set: function(el, param, value) {
      if ( param === 'value' ) {
        el.firstChild.style.backgroundColor = value;
        return true;
      }
      return false;
    },
    build: function(el) {
      var inner = document.createElement('div');
      el.appendChild(inner);
    }
  };
  GUI.Elements['gui-color-swatch'] = {
    bind: function(el, evName, callback, params) {
      var target = el.querySelector('canvas');
      if ( evName === 'select' || evName === 'change' ) {
        evName = '_change';
      }
      Utils.$bind(target, evName, callback.bind(new GUI.Element(el)), params);
    },
    build: function(el) {
      var cv        = document.createElement('canvas');
      cv.width      = 100;
      cv.height     = 100;
      var ctx       = cv.getContext('2d');
      var gradient  = ctx.createLinearGradient(0, 0, ctx.canvas.width, 0);
      function getColor(ev) {
        var pos = OSjs.Utils.$position(cv);
        var cx = typeof ev.offsetX === 'undefined' ? (ev.clientX - pos.left) : ev.offsetX;
        var cy = typeof ev.offsetY === 'undefined' ? (ev.clientY - pos.top) : ev.offsetY;
        if ( isNaN(cx) || isNaN(cy) ) {
          return null;
        }
        var data = ctx.getImageData(cx, cy, 1, 1).data;
        return {
          r: data[0],
          g: data[1],
          b: data[2],
          hex: Utils.convertToHEX(data[0], data[1], data[2])
        };
      }
      gradient.addColorStop(0,    'rgb(255,   0,   0)');
      gradient.addColorStop(0.15, 'rgb(255,   0, 255)');
      gradient.addColorStop(0.33, 'rgb(0,     0, 255)');
      gradient.addColorStop(0.49, 'rgb(0,   255, 255)');
      gradient.addColorStop(0.67, 'rgb(0,   255,   0)');
      gradient.addColorStop(0.84, 'rgb(255, 255,   0)');
      gradient.addColorStop(1,    'rgb(255,   0,   0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
      gradient.addColorStop(0,   'rgba(255, 255, 255, 1)');
      gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
      gradient.addColorStop(0.5, 'rgba(0,     0,   0, 0)');
      gradient.addColorStop(1,   'rgba(0,     0,   0, 1)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      Utils.$bind(cv, 'click', function(ev) {
        var c = getColor(ev);
        if ( c ) {
          cv.dispatchEvent(new CustomEvent('_change', {detail: c}));
        }
      }, false);
      el.appendChild(cv);
    }
  };
  GUI.Elements['gui-iframe'] = (function() {
    var tagName = 'iframe';
    if ( (['nw', 'electron', 'x11']).indexOf(API.getConfig('Connection.Type')) >= 0 ) {
      tagName = 'webview';
    }
    return {
      set: function(el, key, val) {
        if ( key === 'src' ) {
          el.querySelector(tagName).src = val;
        }
      },
      build: function(el) {
        var src = el.getAttribute('data-src') || 'about:blank';
        var iframe = document.createElement(tagName);
        iframe.src = src;
        iframe.setAttribute('border', 0);
        el.appendChild(iframe);
      }
    };
  })();
  GUI.Elements['gui-progress-bar'] = {
    set: function(el, param, value) {
      el.setAttribute('data-' + param, value);
      if ( param === 'progress' || param === 'value' ) {
        value = parseInt(value, 10);
        value = Math.max(0, Math.min(100, value));
        el.setAttribute('aria-label', String(value));
        el.setAttribute('aria-valuenow', String(value));
        el.querySelector('div').style.width = value.toString() + '%';
        el.querySelector('span').innerHTML = value + '%';
        return true;
      }
      return false;
    },
    build: function(el) {
      var p = (el.getAttribute('data-progress') || 0);
      p = Math.max(0, Math.min(100, p));
      var percentage = p.toString() + '%';
      var progress = document.createElement('div');
      progress.style.width = percentage;
      var span = document.createElement('span');
      span.appendChild(document.createTextNode(percentage));
      el.setAttribute('role', 'progressbar');
      el.setAttribute('aria-valuemin', 0);
      el.setAttribute('aria-valuemax', 100);
      el.setAttribute('aria-label', 0);
      el.setAttribute('aria-valuenow', 0);
      el.appendChild(progress);
      el.appendChild(span);
    }
  };
  GUI.Elements['gui-statusbar'] = {
    set: function(el, param, value) {
      if ( param === 'label' || param === 'value' ) {
        var span = el.getElementsByTagName('gui-statusbar-label')[0];
        if ( span ) {
          Utils.$empty(span);
          span.innerHTML = value;
        }
        return true;
      }
      return false;
    },
    build: function(el) {
      var lbl = el.getAttribute('data-label') || el.getAttribute('data-value') || el.innerHTML || '';
      var span = document.createElement('gui-statusbar-label');
      span.innerHTML = lbl;
      el.setAttribute('role', 'log');
      el.appendChild(span);
    }
  };
})(OSjs.API, OSjs.Utils, OSjs.VFS, OSjs.GUI);

(function(API, Utils, VFS, GUI) {
  'use strict';
  var lastMenu;
  function blurMenu(ev) {
    if ( lastMenu ) {
      lastMenu(ev);
    }
    lastMenu = null;
  }
  function bindSelectionEvent(child, span, idx, expand, dispatcher) {
    dispatcher = dispatcher || span;
    var id = child.getAttribute('data-id');
    var hasInput = child.querySelector('input');
    Utils.$bind(child, 'mousedown', function(ev) {
      var target = ev.target || ev.srcElement;
      var isExpander = (target.tagName.toLowerCase() === 'gui-menu-entry' && Utils.$hasClass(target, 'gui-menu-expand'));
      var stopProp = hasInput || isExpander;
      if ( hasInput ) {
        ev.preventDefault();
        hasInput.dispatchEvent(new MouseEvent('click'));
      }
      dispatcher.dispatchEvent(new CustomEvent('_select', {detail: {index: idx, id: id}}));
      if ( stopProp ) {
        ev.stopPropagation();
      }
      if ( !isExpander ) {
        blurMenu(ev);
      }
    }, false);
  }
  function clampSubmenuPositions(r) {
    function _clamp(rm) {
      rm.querySelectorAll('gui-menu-entry').forEach(function(srm) {
        var sm = srm.querySelector('gui-menu');
        if ( sm ) {
          sm.style.left = String(-parseInt(sm.offsetWidth, 10)) + 'px';
          _clamp(sm);
        }
      });
    }
    var pos = Utils.$position(r);
    if ( (window.innerWidth - pos.right) < r.offsetWidth ) {
      Utils.$addClass(r, 'gui-overflowing');
      _clamp(r);
    }
    Utils.$addClass(r, 'gui-showing');
  }
  GUI.Elements['gui-menu'] = {
    bind: function(el, evName, callback, params) {
      if ( evName === 'select' ) {
        evName = '_select';
      }
      el.querySelectorAll('gui-menu-entry > label').forEach(function(target) {
        Utils.$bind(target, evName, callback.bind(new GUI.Element(el)), params);
      });
    },
    show: function(ev) {
      ev.stopPropagation();
      ev.preventDefault();
      var newNode = this.$element.cloneNode(true);
      var el = this.$element;
      newNode.querySelectorAll('gui-menu-entry > label').forEach(function(label) {
        var expand = label.children.length > 0;
        var i = Utils.$index(label.parentNode);
        bindSelectionEvent(label.parentNode, label, i, expand, el.querySelector('label'));
      });
      OSjs.GUI.Helpers.createMenu(null, ev, newNode);
    },
    set: function(el, param, value, arg) {
      if ( param === 'checked' ) {
        var found = el.querySelector('gui-menu-entry[data-id="' + value + '"]');
        if ( found ) {
          var input = found.querySelector('input');
          if ( input ) {
            if ( arg ) {
              input.setAttribute('checked', 'checked');
            } else {
              input.removeAttribute('checked');
            }
          }
        }
        return true;
      }
      return false;
    },
    build: function(el, customMenu, winRef) {
      var isMenuBarChild =  el.parentNode ? el.parentNode.tagName === 'GUI-MENU-BAR-ENTRY' : false;
      function createTyped(child, par) {
        var type = child.getAttribute('data-type');
        var value = child.getAttribute('data-checked') === 'true';
        var input = null;
        if ( type ) {
          var group = child.getAttribute('data-group');
          input = document.createElement('input');
          input.type = type;
          input.name = group ? group + '[]' : '';
          if ( value ) {
            input.setAttribute('checked', 'checked');
          }
          input.addEventListener('click', function(ev) {
            blurMenu();
          }, true);
          par.setAttribute('role', 'menuitem' + type);
          par.appendChild(input);
        }
      }
      function runChildren(pel, level) {
        function _checkExpand(child) {
          if ( child.children && child.children.length ) {
            Utils.$addClass(child, 'gui-menu-expand');
            child.setAttribute('aria-haspopup', 'true');
            return true;
          } else {
            child.setAttribute('aria-haspopup', 'false');
          }
          return false;
        }
        function createChild(child, i) {
          if ( child && child.tagName.toLowerCase() === 'gui-menu-entry') {
            var expand = _checkExpand(child);
            child.setAttribute('role', 'menuitem' + (child.getAttribute('data-type') || ''));
            var label = GUI.Helpers.getLabel(child);
            var icon = GUI.Helpers.getIcon(child, winRef);
            child.setAttribute('aria-label', label);
            var span = document.createElement('label');
            if ( icon ) {
              child.style.backgroundImage = 'url(' + icon + ')';
              Utils.$addClass(span, 'gui-has-image');
            }
            child.appendChild(span);
            createTyped(child, span);
            if ( child.getAttribute('data-labelhtml') === 'true' ) {
              span.innerHTML = label;
            } else {
              span.appendChild(document.createTextNode(label));
            }
            bindSelectionEvent(child, span, i, expand);
            if ( customMenu ) {
              var sub = child.querySelector('gui-menu');
              if ( sub ) {
                runChildren(sub, level + 1);
              }
            }
          }
        }
        (pel.children || []).forEach(createChild);
      }
      el.setAttribute('role', 'menu');
      runChildren(el, 0);
    }
  };
  GUI.Elements['gui-menu-bar'] = {
    bind: function(el, evName, callback, params) {
      if ( evName === 'select' ) {
        evName = '_select';
      }
      el.querySelectorAll('gui-menu-bar-entry').forEach(function(target) {
        Utils.$bind(target, evName, callback.bind(new GUI.Element(el)), params);
      });
    },
    build: function(el) {
      el.setAttribute('role', 'menubar');
      function updateChildren(sm, level) {
        if ( !sm ) {
          return;
        }
        var children = sm.children;
        var child;
        for ( var i = 0; i < children.length; i++ ) {
          child = children[i];
          if ( child.tagName === 'GUI-MENU-ENTRY' ) {
            child.setAttribute('aria-haspopup', String(!!child.firstChild));
            updateChildren(child.firstChild, level + 1);
          }
        }
      }
      el.querySelectorAll('gui-menu-bar-entry').forEach(function(mel, idx) {
        var label = GUI.Helpers.getLabel(mel);
        var id = mel.getAttribute('data-id');
        var span = document.createElement('span');
        span.appendChild(document.createTextNode(label));
        mel.setAttribute('role', 'menuitem');
        mel.insertBefore(span, mel.firstChild);
        var submenu = mel.querySelector('gui-menu');
        clampSubmenuPositions(submenu);
        mel.setAttribute('aria-haspopup', String(!!submenu));
        updateChildren(submenu, 2);
        Utils.$bind(mel, 'mousedown', function(ev) {
          blurMenu();
          ev.preventDefault();
          ev.stopPropagation();
          if ( submenu ) {
            lastMenu = function(ev) {
              if ( ev ) {
                ev.stopPropagation();
              }
              Utils.$removeClass(mel, 'gui-active');
            };
          }
          if ( Utils.$hasClass(mel, 'gui-active') ) {
            if ( submenu ) {
              Utils.$removeClass(mel, 'gui-active');
            }
          } else {
            if ( submenu ) {
              Utils.$addClass(mel, 'gui-active');
            }
            mel.dispatchEvent(new CustomEvent('_select', {detail: {index: idx, id: id}}));
          }
        }, false);
      });
    }
  };
  OSjs.GUI.Helpers.blurMenu = blurMenu;
  OSjs.GUI.Helpers.createMenu = function(items, ev, customInstance) {
    items = items || [];
    blurMenu();
    var root = customInstance;
    function resolveItems(arr, par) {
      arr.forEach(function(iter) {
        var props = {label: iter.title, icon: iter.icon, disabled: iter.disabled, labelHTML: iter.titleHTML, type: iter.type, checked: iter.checked};
        var entry = GUI.Helpers.createElement('gui-menu-entry', props);
        if ( iter.menu ) {
          var nroot = GUI.Helpers.createElement('gui-menu', {});
          resolveItems(iter.menu, nroot);
          entry.appendChild(nroot);
        }
        if ( iter.onClick ) {
          Utils.$bind(entry, 'mousedown', function(ev) {
            ev.stopPropagation();
            iter.onClick.apply(this, arguments);
          }, false);
        }
        par.appendChild(entry);
      });
    }
    function getPosition() {
      var x = typeof ev.clientX === 'undefined' ? ev.x : ev.clientX;
      var y = typeof ev.clientY === 'undefined' ? ev.y : ev.clientY;
      if ( typeof x === 'undefined' && typeof y === 'undefined' ) {
        if ( ev.detail && typeof ev.detail.x !== 'undefined' ) {
          x = ev.detail.x;
          y = ev.detail.y;
        } else {
          var tpos = Utils.$position(ev.target);
          x = tpos.left;
          y = tpos.top;
        }
      }
      return {x: x, y: y};
    }
    if ( !root ) {
      root = GUI.Helpers.createElement('gui-menu', {});
      resolveItems(items || [], root);
      GUI.Elements['gui-menu'].build(root, true);
    }
    if ( root.$element ) {
      root = root.$element;
    }
    var wm = OSjs.Core.getWindowManager();
    var space = wm.getWindowSpace();
    var pos = getPosition();
    Utils.$addClass(root, 'gui-root-menu');
    root.style.left = pos.x + 'px';
    root.style.top  = pos.y + 'px';
    document.body.appendChild(root);
    setTimeout(function() {
      var pos = Utils.$position(root);
      if ( pos.right > space.width ) {
        var newLeft = Math.round(space.width - pos.width);
        root.style.left = Math.max(0, newLeft) + 'px';
      }
      if ( pos.bottom > space.height ) {
        var newTop = Math.round(space.height - pos.height);
        root.style.top = Math.max(0, newTop) + 'px';
      }
      clampSubmenuPositions(root);
    }, 1);
    lastMenu = function() {
      Utils.$remove(root);
    };
  };
})(OSjs.API, OSjs.Utils, OSjs.VFS, OSjs.GUI);

(function(API, Utils, VFS, GUI) {
  'use strict';
  function toggleActive(el, eidx, idx) {
    Utils.$removeClass(el, 'gui-active');
    if ( eidx === idx ) {
      Utils.$addClass(el, 'gui-active');
    }
  }
  GUI.Elements['gui-tabs'] = {
    bind: function(el, evName, callback, params) {
      if ( (['select', 'activate']).indexOf(evName) !== -1 ) {
        evName = 'change';
      }
      if ( evName === 'change' ) {
        evName = '_' + evName;
      }
      Utils.$bind(el, evName, callback.bind(new GUI.Element(el)), params);
    },
    build: function(el) {
      var tabs = document.createElement('ul');
      var lastTab;
      function selectTab(ev, idx, tab) {
        if ( lastTab ) {
          Utils.$removeClass(lastTab, 'gui-active');
        }
        tabs.querySelectorAll('li').forEach(function(tel, eidx) {
          toggleActive(tel, eidx, idx);
        });
        el.querySelectorAll('gui-tab-container').forEach(function(tel, eidx) {
          toggleActive(tel, eidx, idx);
        });
        lastTab = tab;
        Utils.$addClass(tab, 'gui-active');
        el.dispatchEvent(new CustomEvent('_change', {detail: {index: idx}}));
      }
      el.querySelectorAll('gui-tab-container').forEach(function(tel, idx) {
        var tab = document.createElement('li');
        var label = GUI.Helpers.getLabel(tel);
        Utils.$bind(tab, 'click', function(ev) {
          selectTab(ev, idx, tab);
        }, false);
        tab.setAttribute('role', 'tab');
        tab.setAttribute('aria-label', label);
        tel.setAttribute('role', 'tabpanel');
        tab.appendChild(document.createTextNode(label));
        tabs.appendChild(tab);
      });
      tabs.setAttribute('role', 'tablist');
      el.setAttribute('role', 'navigation');
      if ( el.children.length ) {
        el.insertBefore(tabs, el.children[0]);
      } else {
        el.appendChild(tabs);
      }
      var currentTab = parseInt(el.getAttribute('data-selected-index'), 10) || 0;
      selectTab(null, currentTab);
    }
  };
})(OSjs.API, OSjs.Utils, OSjs.VFS, OSjs.GUI);

(function(API, Utils, VFS, GUI) {
  'use strict';
  var _buttonCount = 0;
  function createInputOfType(el, type) {
    var group = el.getAttribute('data-group');
    var placeholder = el.getAttribute('data-placeholder');
    var disabled = String(el.getAttribute('data-disabled')) === 'true';
    var value = el.childNodes.length ? el.childNodes[0].nodeValue : null;
    Utils.$empty(el);
    var input = document.createElement(type === 'textarea' ? 'textarea' : 'input');
    var attribs = {
      value: null,
      type: type,
      tabindex: -1,
      placeholder: placeholder,
      disabled: disabled ? 'disabled' : null,
      name: group ? group + '[]' : null
    };
    function _bindDefaults() {
      if ( ['range', 'slider'].indexOf(type) >= 0 ) {
        attribs.min = el.getAttribute('data-min');
        attribs.max = el.getAttribute('data-max');
        attribs.step = el.getAttribute('data-step');
      } else if ( ['radio', 'checkbox'].indexOf(type) >= 0 ) {
        if ( el.getAttribute('data-value') === 'true' ) {
          attribs.checked = 'checked';
        }
      } else if ( ['text', 'password', 'textarea'].indexOf(type) >= 0 ) {
        attribs.value = value || '';
      }
      Object.keys(attribs).forEach(function(a) {
        if ( attribs[a] !== null ) {
          input.setAttribute(a, attribs[a]);
        }
      });
    }
    function _bindEvents() {
      if ( type === 'text' || type === 'password' || type === 'textarea' ) {
        Utils.$bind(input, 'keydown', function(ev) {
          if ( ev.keyCode === Utils.Keys.ENTER ) {
            input.dispatchEvent(new CustomEvent('_enter', {detail: this.value}));
          } else if ( ev.keyCode === Utils.Keys.C && ev.ctrlKey ) {
            API.setClipboard(this.value);
          }
          if ( type === 'textarea' && ev.keyCode === Utils.Keys.TAB ) {
            ev.preventDefault();
            this.value += '\t';
          }
        }, false);
      }
    }
    function _create() {
      _bindDefaults();
      _bindEvents();
      GUI.Helpers.createInputLabel(el, type, input);
      var rolemap = {
        'TEXTAREA': function() {
          return 'textbox';
        },
        'INPUT': function(i) {
          var typemap = {
            'range': 'slider',
            'text': 'textbox',
            'password': 'textbox'
          };
          return typemap[i.type] || i.type;
        }
      };
      if ( rolemap[el.tagName] ) {
        input.setAttribute('role', rolemap[el.tagName](input));
      }
      input.setAttribute('aria-label', el.getAttribute('title') || '');
      el.setAttribute('role', 'region');
      el.setAttribute('aria-disabled', String(disabled));
      Utils.$bind(input, 'change', function(ev) {
        var value = input.value;
        if ( type === 'radio' || type === 'checkbox' ) {
          value = input.checked; //input.value === 'on';
        }
        input.dispatchEvent(new CustomEvent('_change', {detail: value}));
      }, false);
    }
    _create();
  }
  function bindInputEvents(el, evName, callback, params) {
    if ( evName === 'enter' ) { evName = '_enter'; }
    if ( evName === 'change' ) { evName = '_change'; }
    var target = el.querySelector('textarea, input, select');
    Utils.$bind(target, evName, callback.bind(new GUI.Element(el)), params);
  }
  function addToSelectBox(el, entries) {
    var target = el.querySelector('select');
    if ( !(entries instanceof Array) ) {
      entries = [entries];
    }
    entries.forEach(function(e) {
      var opt = document.createElement('option');
      opt.setAttribute('role', 'option');
      opt.setAttribute('value', e.value);
      opt.appendChild(document.createTextNode(e.label));
      target.appendChild(opt);
    });
  }
  function removeFromSelectBox(el, what) {
    var target = el.querySelector('select');
    target.querySelectorAll('option').forEach(function(opt) {
      if ( String(opt.value) === String(what) ) {
        Utils.$remove(opt);
        return false;
      }
      return true;
    });
  }
  function callSelectBox(el, method, args) {
    if ( method === 'add' ) {
      addToSelectBox(el, args[0]);
    } else if ( method === 'remove' ) {
      removeFromSelectBox(el, args[0]);
    } else if ( method === 'clear' ) {
      var target = el.querySelector('select');
      Utils.$empty(target);
    }
  }
  function createSelectInput(el, multiple) {
    var disabled = el.getAttribute('data-disabled') !== null;
    var selected = el.getAttribute('data-selected');
    var select = document.createElement('select');
    if ( multiple ) {
      select.setAttribute('size', el.getAttribute('data-size') || 2);
      multiple = el.getAttribute('data-multiple') === 'true';
    }
    if ( multiple ) {
      select.setAttribute('multiple', 'multiple');
    }
    if ( disabled ) {
      select.setAttribute('disabled', 'disabled');
    }
    if ( selected !== null ) {
      select.selectedIndex = selected;
    }
    el.querySelectorAll('gui-select-option').forEach(function(sel) {
      var value = sel.getAttribute('data-value') || '';
      var label = sel.childNodes.length ? sel.childNodes[0].nodeValue : '';
      var option = document.createElement('option');
      option.setAttribute('role', 'option');
      option.setAttribute('value', value);
      option.appendChild(document.createTextNode(label));
      if ( sel.getAttribute('selected') ) {
        option.setAttribute('selected', 'selected');
      }
      select.appendChild(option);
      sel.parentNode.removeChild(sel);
    });
    Utils.$bind(select, 'change', function(ev) {
      select.dispatchEvent(new CustomEvent('_change', {detail: select.value}));
    }, false);
    select.setAttribute('role', 'listbox');
    select.setAttribute('aria-label', el.getAttribute('title') || '');
    el.setAttribute('aria-disabled', String(disabled));
    el.setAttribute('role', 'region');
    el.appendChild(select);
  }
  function setSwitchValue(val, input, button) {
    if ( val !== true ) {
      input.removeAttribute('checked');
      Utils.$removeClass(button, 'gui-active');
      button.innerHTML = '0';
    } else {
      input.setAttribute('checked', 'checked');
      Utils.$addClass(button, 'gui-active');
      button.innerHTML = '1';
    }
  }
  var guiSelect = {
    bind: bindInputEvents,
    call: function() {
      callSelectBox.apply(this, arguments);
      return this;
    },
    build: function(el) {
      var multiple = (el.tagName.toLowerCase() === 'gui-select-list');
      createSelectInput(el, multiple);
    }
  };
  GUI.Elements['gui-label'] = {
    set: function(el, param, value, isHTML) {
      if ( param === 'value' || param === 'label' ) {
        el.setAttribute('data-label', String(value));
        var lbl = el.querySelector('label');
        Utils.$empty(lbl);
        if ( isHTML ) {
          lbl.innerHTML = value;
        } else {
          lbl.appendChild(document.createTextNode(value));
        }
        return true;
      }
      return false;
    },
    build: function(el) {
      var label = GUI.Helpers.getValueLabel(el, true);
      var lbl = document.createElement('label');
      lbl.appendChild(document.createTextNode(label));
      el.setAttribute('role', 'heading');
      el.setAttribute('data-label', String(label));
      el.appendChild(lbl);
    }
  };
  GUI.Elements['gui-textarea'] = {
    bind: bindInputEvents,
    build: function(el) {
      createInputOfType(el, 'textarea');
    }
  };
  GUI.Elements['gui-text'] = {
    bind: bindInputEvents,
    build: function(el) {
      createInputOfType(el, 'text');
    }
  };
  GUI.Elements['gui-password'] = {
    bind: bindInputEvents,
    build: function(el) {
      createInputOfType(el, 'password');
    }
  };
  GUI.Elements['gui-file-upload'] = {
    bind: bindInputEvents,
    build: function(el) {
      var input = document.createElement('input');
      input.setAttribute('role', 'button');
      input.setAttribute('type', 'file');
      input.onchange = function(ev) {
        input.dispatchEvent(new CustomEvent('_change', {detail: input.files[0]}));
      };
      el.appendChild(input);
    }
  };
  GUI.Elements['gui-radio'] = {
    bind: bindInputEvents,
    build: function(el) {
      createInputOfType(el, 'radio');
    }
  };
  GUI.Elements['gui-checkbox'] = {
    bind: bindInputEvents,
    build: function(el) {
      createInputOfType(el, 'checkbox');
    }
  };
  GUI.Elements['gui-switch'] = {
    bind: bindInputEvents,
    set: function(el, param, value) {
      if ( param === 'value' ) {
        var input = el.querySelector('input');
        var button = el.querySelector('button');
        setSwitchValue(value, input, button);
        return true;
      }
      return false;
    },
    build: function(el) {
      var input = document.createElement('input');
      input.type = 'checkbox';
      el.appendChild(input);
      var inner = document.createElement('div');
      var button = document.createElement('button');
      inner.appendChild(button);
      GUI.Helpers.createInputLabel(el, 'switch', inner);
      function toggleValue(v) {
        var val = false;
        if ( typeof v === 'undefined' ) {
          val = !!input.checked;
          val = !val;
        } else {
          val = v;
        }
        setSwitchValue(val, input, button);
      }
      Utils.$bind(inner, 'click', function(ev) {
        ev.preventDefault();
        var disabled = el.getAttribute('data-disabled') !== null;
        if ( !disabled ) {
          toggleValue();
        }
      }, false);
      toggleValue(false);
    }
  };
  GUI.Elements['gui-button'] = {
    set: function(el, param, value, isHTML) {
      if ( param === 'value' || param === 'label' ) {
        var lbl = el.querySelector('button');
        Utils.$empty(lbl);
        if ( isHTML ) {
          lbl.innerHTML = value;
        } else {
          lbl.appendChild(document.createTextNode(value));
        }
        lbl.setAttribute('aria-label', value);
        return true;
      }
      return false;
    },
    create: function(params) {
      var label = params.label;
      if ( params.label ) {
        delete params.label;
      }
      var el = GUI.Helpers.createElement('gui-button', params);
      if ( label ) {
        el.appendChild(document.createTextNode(label));
      }
      return el;
    },
    bind: function(el, evName, callback, params) {
      var target = el.querySelector('button');
      Utils.$bind(target, evName, callback.bind(new GUI.Element(el)), params);
    },
    build: function(el) {
      var icon = el.getAttribute('data-icon');
      var disabled = el.getAttribute('data-disabled') !== null;
      var group = el.getAttribute('data-group');
      var label = GUI.Helpers.getValueLabel(el);
      var input = document.createElement('button');
      function setGroup(g) {
        if ( g ) {
          input.setAttribute('name', g + '[' + _buttonCount + ']');
          Utils.$bind(input, 'click', function() {
            var root = el;
            while ( root.parentNode ) {
              if ( root.tagName.toLowerCase() === 'application-window-content' ) {
                break;
              }
              root = root.parentNode;
            }
            Utils.$addClass(input, 'gui-active');
            root.querySelectorAll('gui-button[data-group="' + g + '"] > button').forEach(function(b) {
              if ( b.name === input.name ) {
                return;
              }
              Utils.$removeClass(b, 'gui-active');
            });
          });
        }
      }
      function setImage() {
        if ( icon && icon !== 'null' ) {
          var img = document.createElement('img');
          img.src = icon;
          img.alt = el.getAttribute('data-tooltip') || '';
          img.title = el.getAttribute('data-tooltip') || '';
          if ( input.firstChild ) {
            input.insertBefore(img, input.firstChild);
          } else {
            input.appendChild(img);
          }
          Utils.$addClass(el, 'gui-has-image');
        }
      }
      function setLabel() {
        if ( label ) {
          Utils.$addClass(el, 'gui-has-label');
        }
        input.appendChild(document.createTextNode(label));
        input.setAttribute('aria-label', label);
      }
      if ( disabled ) {
        input.setAttribute('disabled', 'disabled');
      }
      setLabel();
      setImage();
      setGroup(group);
      _buttonCount++;
      el.setAttribute('role', 'navigation');
      el.appendChild(input);
    }
  };
  GUI.Elements['gui-select'] = guiSelect;
  GUI.Elements['gui-select-list'] = guiSelect;
  GUI.Elements['gui-slider'] = {
    bind: bindInputEvents,
    get: function(el, param) {
      var val = GUI.Helpers.getProperty(el, param);
      if ( param === 'value' ) {
        return parseInt(val, 10);
      }
      return val;
    },
    build: function(el) {
      createInputOfType(el, 'range');
    }
  };
  GUI.Elements['gui-input-modal'] = {
    bind: function(el, evName, callback, params) {
      if ( evName === 'open' ) { evName = '_open'; }
      Utils.$bind(el, evName, callback.bind(new GUI.Element(el)), params);
    },
    get: function(el, param) {
      if ( param === 'value' ) {
        var input = el.querySelector('input');
        return input.value;
      }
      return false;
    },
    set: function(el, param, value) {
      if ( param === 'value' ) {
        var input = el.querySelector('input');
        input.removeAttribute('disabled');
        input.value = value;
        input.setAttribute('disabled', 'disabled');
        input.setAttribute('aria-disabled', 'true');
        return true;
      }
      return false;
    },
    build: function(el) {
      var container = document.createElement('div');
      var input = document.createElement('input');
      input.type = 'text';
      input.setAttribute('disabled', 'disabled');
      var button = document.createElement('button');
      button.innerHTML = '...';
      Utils.$bind(button, 'click', function(ev) {
        el.dispatchEvent(new CustomEvent('_open', {detail: input.value}));
      }, false);
      container.appendChild(input);
      container.appendChild(button);
      el.appendChild(container);
    }
  };
})(OSjs.API, OSjs.Utils, OSjs.VFS, OSjs.GUI);

(function(API, Utils, VFS, GUI) {
  'use strict';
  function createVisualElement(el, nodeType, applyArgs) {
    applyArgs = applyArgs || {};
    if ( typeof applyArgs !== 'object' ) {
      console.error('Derp', 'applyArgs was not an object ?!');
      applyArgs = {};
    }
    var img = document.createElement(nodeType);
    var src = el.getAttribute('data-src');
    var controls = el.getAttribute('data-controls');
    if ( controls ) {
      img.setAttribute('controls', 'controls');
    }
    var autoplay = el.getAttribute('data-autoplay');
    if ( autoplay ) {
      img.setAttribute('autoplay', 'autoplay');
    }
    Object.keys(applyArgs).forEach(function(k) {
      var val = applyArgs[k];
      if ( typeof val === 'function' ) {
        k = k.replace(/^on/, '');
        if ( (nodeType === 'video' || nodeType === 'audio') && k === 'load' ) {
          k = 'loadedmetadata';
        }
        Utils.$bind(img, k, val, false);
      } else {
        if ( typeof applyArgs[k] === 'boolean' ) {
          val = val ? 'true' : 'false';
        }
        img.setAttribute(k, val);
      }
    });
    img.src = src || 'about:blank';
    el.appendChild(img);
  }
  GUI.Elements['gui-audio'] = {
    bind: function(el, evName, callback, params) {
      var target = el.querySelector('audio');
      Utils.$bind(target, evName, callback.bind(new GUI.Element(el)), params);
    },
    build: function(el, applyArgs) {
      createVisualElement(el, 'audio', applyArgs);
    }
  };
  GUI.Elements['gui-video'] = {
    bind: function(el, evName, callback, params) {
      var target = el.querySelector('video');
      Utils.$bind(target, evName, callback.bind(new GUI.Element(el)), params);
    },
    build: function(el, applyArgs) {
      createVisualElement(el, 'video', applyArgs);
    }
  };
  GUI.Elements['gui-image'] = {
    bind: function(el, evName, callback, params) {
      var target = el.querySelector('img');
      Utils.$bind(target, evName, callback.bind(new GUI.Element(el)), params);
    },
    build: function(el, applyArgs) {
      createVisualElement(el, 'img', applyArgs);
    }
  };
  GUI.Elements['gui-canvas'] = {
    bind: function(el, evName, callback, params) {
      var target = el.querySelector('canvas');
      Utils.$bind(target, evName, callback.bind(new GUI.Element(el)), params);
    },
    build: function(el) {
      var canvas = document.createElement('canvas');
      el.appendChild(canvas);
    }
  };
})(OSjs.API, OSjs.Utils, OSjs.VFS, OSjs.GUI);

(function(API, Utils, VFS, GUI) {
  'use strict';
  var _iconSizes = { // Defaults to 16x16
    'gui-icon-view': '32x32'
  };
  function getChildView(el) {
    return el.children[0];
  }
  function getFileIcon(iter, size) {
    if ( iter.icon && typeof iter.icon === 'object' ) {
      return API.getIcon(iter.icon.filename, size, iter.icon.application);
    }
    var icon = 'status/gtk-dialog-question.png';
    return API.getFileIcon(iter, size, icon);
  }
  function getFileSize(iter) {
    var filesize = '';
    if ( iter.type !== 'dir' && iter.size ) {
      filesize = Utils.humanFileSize(iter.size);
    }
    return filesize;
  }
  var removeExtension = (function() {
    var mimeConfig;
    return function(str, opts) {
      if ( !mimeConfig ) {
        mimeConfig = API.getConfig('MIME.mapping');
      }
      if ( opts.extensions === false ) {
        var ext = Utils.filext(str);
        if ( ext ) {
          ext = '.' + ext;
          if ( mimeConfig[ext] ) {
            str = str.substr(0, str.length - ext.length);
          }
        }
      }
      return str;
    };
  })();
  function getDateFromStamp(stamp) {
    if ( typeof stamp === 'string' ) {
      var date = null;
      try {
        date = new Date(stamp);
      } catch ( e ) {}
      if ( date ) {
        return OSjs.Helpers.Date.format(date);
      }
    }
    return stamp;
  }
  function getListViewColumns(iter, opts) {
    opts = opts || {};
    var columnMapping = {
      filename: {
        label: 'LBL_FILENAME',
        icon: function() {
          return getFileIcon(iter);
        },
        value: function() {
          return removeExtension(iter.filename, opts);
        }
      },
      mime: {
        label: 'LBL_MIME',
        basis: '100px',
        icon: function() {
          return null;
        },
        value: function() {
          return iter.mime;
        }
      },
      mtime: {
        label: 'LBL_MODIFIED',
        basis: '160px',
        icon: function() {
          return null;
        },
        value: function() {
          return getDateFromStamp(iter.mtime);
        }
      },
      ctime: {
        label: 'LBL_CREATED',
        basis: '160px',
        icon: function() {
          return null;
        },
        value: function() {
          return getDateFromStamp(iter.ctime);
        }
      },
      size: {
        label: 'LBL_SIZE',
        basis: '120px',
        icon: function() {
          return null;
        },
        value: function() {
          return getFileSize(iter);
        }
      }
    };
    var defColumns = ['filename', 'mime', 'size'];
    var useColumns = defColumns;
    if ( !opts.defaultcolumns ) {
      var vfsOptions = Utils.cloneObject(OSjs.Core.getSettingsManager().get('VFS') || {});
      var scandirOptions = vfsOptions.scandir || {};
      useColumns = scandirOptions.columns || defColumns;
    }
    var columns = [];
    useColumns.forEach(function(key, idx) {
      var map = columnMapping[key];
      if ( iter ) {
        columns.push({
          label: map.value(),
          icon: map.icon(),
          textalign: idx === 0 ? 'left' : 'right'
        });
      } else {
        var grow = idx === 0 ? 1 : 0;
        var shrink = grow;
        columns.push({
          label: API._(map.label),
          basis: map.basis || 'auto',
          grow: grow,
          shrink: shrink,
          resizable: idx > 0,
          textalign: idx === 0 ? 'left' : 'right'
        });
      }
    });
    return columns;
  }
  function buildChildView(el) {
    var type = el.getAttribute('data-type') || 'list-view';
    if ( !type.match(/^gui\-/) ) {
      type = 'gui-' + type;
    }
    var nel = new GUI.ElementDataView(GUI.Helpers.createElement(type, {'draggable': true, 'draggable-type': 'file'}));
    GUI.Elements[type].build(nel.$element);
    nel.on('select', function(ev) {
      el.dispatchEvent(new CustomEvent('_select', {detail: ev.detail}));
    });
    nel.on('activate', function(ev) {
      el.dispatchEvent(new CustomEvent('_activate', {detail: ev.detail}));
    });
    nel.on('contextmenu', function(ev) {
      if ( !el.hasAttribute('data-has-contextmenu') || el.hasAttribute('data-has-contextmenu') === 'false' ) {
        new GUI.Element(el).fn('contextmenu', [ev]);
      }
      el.dispatchEvent(new CustomEvent('_contextmenu', {detail: ev.detail}));
    });
    if ( type === 'gui-tree-view' ) {
      nel.on('expand', function(ev) {
        el.dispatchEvent(new CustomEvent('_expand', {detail: ev.detail}));
      });
    }
    el.setAttribute('role', 'region');
    el.appendChild(nel.$element);
  }
  function scandir(tagName, dir, opts, cb, oncreate) {
    var file = new VFS.File(dir);
    file.type  = 'dir';
    var scanopts = {
      backlink:           opts.backlink,
      showDotFiles:       opts.dotfiles === true,
      showFileExtensions: opts.extensions === true,
      mimeFilter:         opts.filter || [],
      typeFilter:         opts.filetype || null
    };
    try {
      VFS.scandir(file, function(error, result) {
        if ( error ) {
          cb(error); return;
        }
        var list = [];
        var summary = {size: 0, directories: 0, files: 0, hidden: 0};
        function isHidden(iter) {
          return (iter.filename || '').substr(0) === '.';
        }
        (result || []).forEach(function(iter) {
          list.push(oncreate(iter));
          summary.size += iter.size || 0;
          summary.directories += iter.type === 'dir' ? 1 : 0;
          summary.files += iter.type !== 'dir' ? 1 : 0;
          summary.hidden += isHidden(iter) ? 1 : 0;
        });
        cb(false, list, summary);
      }, scanopts);
    } catch ( e ) {
      cb(e);
    }
  }
  function readdir(el, dir, done, sopts) {
    sopts = sopts || {};
    var vfsOptions = Utils.cloneObject(OSjs.Core.getSettingsManager().get('VFS') || {});
    var scandirOptions = vfsOptions.scandir || {};
    var target = getChildView(el);
    var tagName = target.tagName.toLowerCase();
    el.setAttribute('data-path', dir);
    var opts = {filter: null, backlink: sopts.backlink};
    function setOption(s, d, c, cc) {
      if ( el.hasAttribute(s) ) {
        opts[d] = c(el.getAttribute(s));
      } else {
        opts[d] = (cc || function() {})();
      }
    }
    setOption('data-dotfiles', 'dotfiles', function(val) {
      return val === 'true';
    }, function() {
      return scandirOptions.showHiddenFiles === true;
    });
    setOption('data-extensions', 'extensions', function(val) {
      return val === 'true';
    }, function() {
      return scandirOptions.showFileExtensions === true;
    });
    setOption('data-filetype', 'filetype', function(val) {
      return val;
    });
    setOption('data-defaultcolumns', 'defaultcolumns', function(val) {
      return val === 'true';
    });
    try {
      opts.filter = JSON.parse(el.getAttribute('data-filter'));
    } catch ( e ) {
    }
    scandir(tagName, dir, opts, function(error, result, summary) {
      if ( tagName === 'gui-list-view' ) {
        GUI.Elements[tagName].set(target, 'zebra', true);
        GUI.Elements[tagName].set(target, 'columns', getListViewColumns(null, opts));
      }
      done(error, result, summary);
    }, function(iter) {
      var tooltip = Utils.format('{0}\n{1}\n{2} {3}', iter.type.toUpperCase(), iter.filename, getFileSize(iter), iter.mime || '');
      function _createEntry() {
        var row = {
          value: iter,
          id: iter.id || removeExtension(iter.filename, opts),
          label: iter.filename,
          tooltip: tooltip,
          icon: getFileIcon(iter, _iconSizes[tagName] || '16x16')
        };
        if ( tagName === 'gui-tree-view' && iter.type === 'dir' ) {
          if ( iter.filename !== '..' ) {
            row.entries = [{
              label: 'Loading...'
            }];
          }
        }
        return row;
      }
      if ( tagName !== 'gui-list-view' ) {
        return _createEntry();
      }
      return {
        value: iter,
        id: iter.id || iter.filename,
        tooltip: tooltip,
        columns: getListViewColumns(iter, opts)
      };
    });
  }
  GUI.Elements['gui-file-view'] = {
    bind: function(el, evName, callback, params) {
      if ( (['activate', 'select', 'contextmenu']).indexOf(evName) !== -1 ) {
        evName = '_' + evName;
      }
      if ( evName === '_contextmenu' ) {
        el.setAttribute('data-has-contextmenu', 'true');
      }
      Utils.$bind(el, evName, callback.bind(new GUI.Element(el)), params);
    },
    set: function(el, param, value, arg) {
      if ( param === 'type' ) {
        var firstChild = el.children[0];
        if ( firstChild && firstChild.tagName.toLowerCase() === value ) {
          return true;
        }
        Utils.$empty(el);
        el.setAttribute('data-type', value);
        Utils.$bind(el, '_expand', function(ev) {
          var target = ev.detail.element;
          if ( target.getAttribute('data-was-rendered') ) {
            return;
          }
          if ( ev.detail.expanded ) {
            var view = new GUI.ElementDataView(getChildView(el));
            var entry = ev.detail.entries[0].data;
            target.setAttribute('data-was-rendered', String(true));
            readdir(el, entry.path, function(error, result, summary) {
              if ( !error ) {
                target.querySelectorAll('gui-tree-view-entry').forEach(function(e) {
                  Utils.$remove(e);
                  view.add({
                    entries: result,
                    parentNode: target
                  });
                });
              }
            }, {backlink: false});
          }
        });
        buildChildView(el);
        if ( typeof arg === 'undefined' || arg === true ) {
          GUI.Elements['gui-file-view'].call(el, 'chdir', {
            path: el.getAttribute('data-path')
          });
        }
        return true;
      } else if ( (['filter', 'dotfiles', 'filetype', 'extensions', 'defaultcolumns']).indexOf(param) >= 0 ) {
        GUI.Helpers.setProperty(el, param, value);
        return true;
      }
      var target = getChildView(el);
      if ( target ) {
        var tagName = target.tagName.toLowerCase();
        GUI.Elements[tagName].set(target, param, value, arg);
        return true;
      }
      return false;
    },
    build: function(el) {
      buildChildView(el);
    },
    values: function(el) {
      var target = getChildView(el);
      if ( target ) {
        var tagName = target.tagName.toLowerCase();
        return GUI.Elements[tagName].values(target);
      }
      return null;
    },
    contextmenu: function(ev) {
      var vfsOptions = OSjs.Core.getSettingsManager().instance('VFS');
      var scandirOptions = (vfsOptions.get('scandir') || {});
      function setOption(opt, toggle) {
        var opts = {scandir: {}};
        opts.scandir[opt] = toggle;
        vfsOptions.set(null, opts, true);
      }
      API.createMenu([
        {
          title: API._('LBL_SHOW_HIDDENFILES'),
          type: 'checkbox',
          checked: scandirOptions.showHiddenFiles === true,
          onClick: function() {
            setOption('showHiddenFiles', !scandirOptions.showHiddenFiles);
          }
        },
        {
          title: API._('LBL_SHOW_FILEEXTENSIONS'),
          type: 'checkbox',
          checked: scandirOptions.showFileExtensions === true,
          onClick: function() {
            setOption('showFileExtensions', !scandirOptions.showFileExtensions);
          }
        }
      ], ev);
    },
    call: function(el, method, args) {
      args = args || {};
      args.done = args.done || function() {};
      var target = getChildView(el);
      if ( target ) {
        var tagName = target.tagName.toLowerCase();
        if ( method === 'chdir' ) {
          var t = new GUI.ElementDataView(target);
          var dir = args.path || OSjs.API.getDefaultPath();
          readdir(el, dir, function(error, result, summary) {
            if ( error ) {
              API.error(API._('ERR_VFSMODULE_XHR_ERROR'), API._('ERR_VFSMODULE_SCANDIR_FMT', dir), error);
            } else {
              t.clear();
              t.add(result);
            }
            args.done(error, summary);
          });
          return;
        }
        GUI.Elements[tagName].call(target, method, args);
      }
    }
  };
})(OSjs.API, OSjs.Utils, OSjs.VFS, OSjs.GUI);

(function(API, Utils, VFS, GUI) {
  'use strict';
  function createEntry(e) {
    var entry = GUI.Helpers.createElement('gui-tree-view-entry', e, ['entries']);
    return entry;
  }
  function initEntry(el, sel) {
    if ( sel._rendered ) {
      return;
    }
    sel._rendered = true;
    var icon = sel.getAttribute('data-icon');
    var label = GUI.Helpers.getLabel(sel);
    var expanded = el.getAttribute('data-expanded') === 'true';
    var next = sel.querySelector('gui-tree-view-entry');
    var container = document.createElement('div');
    var dspan = document.createElement('span');
    function handleItemExpand(ev, root, expanded) {
      if ( typeof expanded === 'undefined' ) {
        expanded = !Utils.$hasClass(root, 'gui-expanded');
      }
      Utils.$removeClass(root, 'gui-expanded');
      if ( expanded ) {
        Utils.$addClass(root, 'gui-expanded');
      }
      var children = root.children;
      for ( var i = 0; i < children.length; i++ ) {
        if ( children[i].tagName.toLowerCase() === 'gui-tree-view-entry' ) {
          children[i].style.display = expanded ? 'block' : 'none';
        }
      }
      var selected = {
        index: Utils.$index(root),
        data: GUI.Helpers.getViewNodeValue(root)
      };
      root.setAttribute('data-expanded', String(expanded));
      root.setAttribute('aria-expanded', String(expanded));
      el.dispatchEvent(new CustomEvent('_expand', {detail: {entries: [selected], expanded: expanded, element: root}}));
    } // handleItemExpand()
    function onDndEnter(ev) {
      ev.stopPropagation();
      Utils.$addClass(sel, 'dnd-over');
    }
    function onDndLeave(ev) {
      Utils.$removeClass(sel, 'dnd-over');
    }
    if ( icon ) {
      dspan.style.backgroundImage = 'url(' + icon + ')';
      Utils.$addClass(dspan, 'gui-has-image');
    }
    dspan.appendChild(document.createTextNode(label));
    container.appendChild(dspan);
    if ( next ) {
      Utils.$addClass(sel, 'gui-expandable');
      var expander = document.createElement('gui-tree-view-expander');
      Utils.$bind(expander, 'dblclick', function(ev) {
        ev.preventDefault();
        ev.stopPropagation();
      });
      Utils.$bind(expander, 'click', function(ev) {
        handleItemExpand(ev, sel);
      });
      sel.insertBefore(container, next);
      sel.insertBefore(expander, container);
    } else {
      sel.appendChild(container);
    }
    if ( String(sel.getAttribute('data-draggable')) === 'true' ) {
      GUI.Helpers.createDraggable(container, (function() {
        var data = {};
        try {
          data = JSON.parse(sel.getAttribute('data-value'));
        } catch ( e ) {}
        return {data: data};
      })());
    }
    if ( String(sel.getAttribute('data-droppable')) === 'true' ) {
      var timeout;
      GUI.Helpers.createDroppable(container, {
        onEnter: onDndEnter,
        onOver: onDndEnter,
        onLeave: onDndLeave,
        onDrop: onDndLeave,
        onItemDropped: function(ev, eel, item) {
          ev.stopPropagation();
          ev.preventDefault();
          timeout = clearTimeout(timeout);
          timeout = setTimeout(function() {
            Utils.$removeClass(sel, 'dnd-over');
          }, 10);
          var dval = {};
          try {
            dval = JSON.parse(eel.parentNode.getAttribute('data-value'));
          } catch ( e ) {}
          el.dispatchEvent(new CustomEvent('_drop', {detail: {
            src: item.data,
            dest: dval
          }}));
        }
      });
    }
    handleItemExpand(null, sel, expanded);
    GUI.Elements._dataview.bindEntryEvents(el, sel, 'gui-tree-view-entry');
  }
  GUI.Elements['gui-tree-view'] = {
    bind: GUI.Elements._dataview.bind,
    values: function(el) {
      return GUI.Elements._dataview.getSelected(el, el.querySelectorAll('gui-tree-view-entry'));
    },
    build: function(el, applyArgs) {
      var body = el.querySelector('gui-tree-view-body');
      var found = !!body;
      if ( !body ) {
        body = document.createElement('gui-tree-view-body');
        el.appendChild(body);
      }
      body.setAttribute('role', 'group');
      el.setAttribute('role', 'tree');
      el.setAttribute('aria-multiselectable', body.getAttribute('data-multiselect') || 'false');
      el.querySelectorAll('gui-tree-view-entry').forEach(function(sel, idx) {
        sel.setAttribute('aria-expanded', 'false');
        if ( !found ) {
          body.appendChild(sel);
        }
        sel.setAttribute('role', 'treeitem');
        initEntry(el, sel);
      });
      GUI.Elements._dataview.build(el, applyArgs);
    },
    get: function(el, param, value, arg) {
      if ( param === 'entry' ) {
        var body = el.querySelector('gui-tree-view-body');
        return GUI.Elements._dataview.getEntry(el, body.querySelectorAll('gui-tree-view-entry'), value, arg);
      }
      return GUI.Helpers.getProperty(el, param);
    },
    set: function(el, param, value, arg, arg2) {
      var body = el.querySelector('gui-tree-view-body');
      if ( param === 'selected' || param === 'value' ) {
        GUI.Elements._dataview.setSelected(el, body, body.querySelectorAll('gui-tree-view-entry'), value, arg, arg2);
        return true;
      }
      return false;
    },
    call: function(el, method, args) {
      var body = el.querySelector('gui-tree-view-body');
      function recurse(a, root, level) {
        GUI.Elements._dataview.add(el, a, function(e) {
          if ( e ) {
            if ( e.parentNode ) {
              delete e.parentNode;
            }
            var entry = createEntry(e);
            root.appendChild(entry);
            if ( e.entries ) {
              recurse([e.entries], entry, level + 1);
            }
            initEntry(el, entry);
          }
        });
      }
      function add() {
        var parentNode = body;
        var entries = args;
        if ( typeof args[0] === 'object' && !(args[0] instanceof Array) && Object.keys(args[0]).length ) {
          entries = [args[0].entries || []];
          parentNode = args[0].parentNode || body;
        }
        recurse(entries, parentNode, 0);
      }
      if ( method === 'add' ) {
        add();
      } else if ( method === 'remove' ) {
        GUI.Elements._dataview.remove(el, args, 'gui-tree-view-entry');
      } else if ( method === 'clear' ) {
        GUI.Elements._dataview.clear(el, body);
      } else if ( method === 'patch' ) {
        GUI.Elements._dataview.patch(el, args, 'gui-tree-view-entry', body, createEntry, initEntry);
      } else if ( method === 'focus' ) {
        GUI.Elements._dataview.focus(el);
      }
      return this;
    }
  };
})(OSjs.API, OSjs.Utils, OSjs.VFS, OSjs.GUI);

(function(API, Utils, VFS, GUI) {
  'use strict';
  function resize(rel, w) {
    var flex = w.toString() + 'px';
    rel.style.webkitFlexBasis = flex;
    rel.style.mozFflexBasis = flex;
    rel.style.msFflexBasis = flex;
    rel.style.oFlexBasis = flex;
    rel.style.flexBasis = flex;
  }
  function createEntry(v, head) {
    var label = v.label || '';
    if ( v.label ) {
      delete v.label;
    }
    var checks = {grow: 1, shrink: 1, basis: ''};
    Object.keys(checks).forEach(function(k) {
      if ( typeof v[k] === 'undefined' ) {
        v[k] = checks[k];
      }
    });
    var nel = GUI.Helpers.createElement('gui-list-view-column', v);
    if ( typeof label === 'function' ) {
      nel.appendChild(label.call(nel, nel, v));
    } else {
      nel.appendChild(document.createTextNode(label));
    }
    return nel;
  }
  function createResizers(el) {
    var head = el.querySelector('gui-list-view-head');
    var body = el.querySelector('gui-list-view-body');
    var cols = head.querySelectorAll('gui-list-view-column');
    head.querySelectorAll('gui-list-view-column-resizer').forEach(function(rel) {
      Utils.$remove(rel);
    });
    cols.forEach(function(col, idx) {
      var attr = col.getAttribute('data-resizable');
      if ( attr === 'true' ) {
        var resizer = document.createElement('gui-list-view-column-resizer');
        col.appendChild(resizer);
        var startWidth   = 0;
        var maxWidth     = 0;
        var widthOffset  = 16;
        var minWidth     = widthOffset;
        var tmpEl        = null;
        GUI.Helpers.createDrag(resizer, function(ev) {
          startWidth = col.offsetWidth;
          minWidth = widthOffset;//calculateWidth();
          maxWidth = el.offsetWidth - (el.children.length * widthOffset);
        }, function(ev, diff) {
          var newWidth = startWidth - diff.x;
          if ( !isNaN(newWidth) && newWidth > minWidth && newWidth < maxWidth ) {
            resize(col, newWidth);
            body.querySelectorAll('gui-list-view-row').forEach(function(row) {
              resize(row.children[idx], newWidth);
            });
          }
          tmpEl = Utils.$remove(tmpEl);
        });
      }
    });
  }
  function initRow(el, row) {
    var cols = el.querySelectorAll('gui-list-view-head gui-list-view-column');
    var headContainer = el.querySelector('gui-list-view-head');
    row.querySelectorAll('gui-list-view-column').forEach(function(cel, idx) {
      var cl = cols.length;
      var x = cl ? idx % cl : idx;
      GUI.Helpers.setFlexbox(cel, null, null, null, cols[x]);
      var icon = cel.getAttribute('data-icon');
      if ( icon && icon !== 'null' ) {
        Utils.$addClass(cel, 'gui-has-image');
        cel.style.backgroundImage = 'url(' + icon + ')';
      }
      var text = cel.firstChild;
      if ( text && text.nodeType === 3 ) {
        var span = document.createElement('span');
        span.appendChild(document.createTextNode(text.nodeValue));
        cel.insertBefore(span, text);
        cel.removeChild(text);
      }
      if ( el._columns[idx] && !el._columns[idx].visible ) {
        cel.style.display = 'none';
      }
      cel.setAttribute('role', 'listitem');
    });
    GUI.Elements._dataview.bindEntryEvents(el, row, 'gui-list-view-row');
  }
  function createRow(e) {
    e = e || {};
    if ( e.columns ) {
      var row = GUI.Helpers.createElement('gui-list-view-row', e, ['columns']);
      e.columns.forEach(function(se) {
        row.appendChild(createEntry(se));
      });
      return row;
    }
    return null;
  }
  GUI.Elements['gui-list-view'] = {
    bind: GUI.Elements._dataview.bind,
    values: function(el) {
      var body = el.querySelector('gui-list-view-body');
      return GUI.Elements._dataview.getSelected(el, body.querySelectorAll('gui-list-view-row'));
    },
    get: function(el, param, value, arg) {
      if ( param === 'entry' ) {
        var body = el.querySelector('gui-list-view-body');
        return GUI.Elements._dataview.getEntry(el, body.querySelectorAll('gui-list-view-row'), value, arg);
      }
      return GUI.Helpers.getProperty(el, param);
    },
    set: function(el, param, value, arg) {
      if ( param === 'columns' ) {
        var head = el.querySelector('gui-list-view-head');
        var row = document.createElement('gui-list-view-row');
        Utils.$empty(head);
        el._columns = [];
        value.forEach(function(v) {
          v.visible = (typeof v.visible === 'undefined') || v.visible === true;
          var nel = createEntry(v, true);
          el._columns.push(v);
          if ( !v.visible ) {
            nel.style.display = 'none';
          }
          row.appendChild(nel);
          GUI.Helpers.setFlexbox(nel);
        });
        head.appendChild(row);
        createResizers(el);
        return true;
      } else if ( param === 'selected' || param === 'value' ) {
        var body = el.querySelector('gui-list-view-body');
        GUI.Elements._dataview.setSelected(el, body, body.querySelectorAll('gui-list-view-row'), value, arg);
        return true;
      }
      return false;
    },
    call: function(el, method, args) {
      var body = el.querySelector('gui-list-view-body');
      if ( method === 'add' ) {
        GUI.Elements._dataview.add(el, args, function(e) {
          var cbCreated = e.onCreated || function() {};
          var row = createRow(e);
          if ( row ) {
            body.appendChild(row);
            initRow(el, row);
          }
          cbCreated(row);
        });
      } else if ( method === 'remove' ) {
        GUI.Elements._dataview.remove(el, args, 'gui-list-view-row');
      } else if ( method === 'clear' ) {
        GUI.Elements._dataview.clear(el, el.querySelector('gui-list-view-body'));
      } else if ( method === 'patch' ) {
        GUI.Elements._dataview.patch(el, args, 'gui-list-view-row', body, createRow, initRow);
      } else if ( method === 'focus' ) {
        GUI.Elements._dataview.focus(el);
      }
      return this;
    },
    build: function(el, applyArgs) {
      el._columns  = [];
      var head = el.querySelector('gui-list-view-head');
      var body = el.querySelector('gui-list-view-body');
      if ( !body ) {
        body = document.createElement('gui-list-view-body');
        el.appendChild(body);
      }
      if ( !head ) {
        head = document.createElement('gui-list-view-head');
        el.insertBefore(head, body);
      }
      head.setAttribute('role', 'group');
      body.setAttribute('role', 'group');
      el.setAttribute('role', 'list');
      createResizers(el);
      Utils.$bind(el, 'scroll', function(ev) {
        head.style.top = el.scrollTop + 'px';
      }, false);
      el.querySelectorAll('gui-list-view-head gui-list-view-column').forEach(function(cel, idx) {
        GUI.Helpers.setFlexbox(cel);
        var vis = cel.getAttribute('data-visible');
        var iter = {
          visible: vis === null || vis === 'true',
          grow: cel.getAttribute('data-grow'),
          shrink: cel.getAttribute('data-shrink'),
          basis: cel.getAttribute('data-basis')
        };
        el._columns.push(iter);
        if ( !iter.visible ) {
          cel.style.display = 'none';
        }
      });
      el.querySelectorAll('gui-list-view-body gui-list-view-row').forEach(function(row) {
        initRow(el, row);
      });
      GUI.Elements._dataview.build(el, applyArgs);
    }
  };
})(OSjs.API, OSjs.Utils, OSjs.VFS, OSjs.GUI);

(function(API, Utils, VFS, GUI) {
  'use strict';
  function createEntry(e) {
    var entry = GUI.Helpers.createElement('gui-icon-view-entry', e);
    return entry;
  }
  function initEntry(el, cel) {
    var icon = cel.getAttribute('data-icon');
    var label = GUI.Helpers.getLabel(cel);
    var dicon = document.createElement('div');
    var dimg = document.createElement('img');
    dimg.src = icon;
    dicon.appendChild(dimg);
    var dlabel = document.createElement('div');
    var dspan = document.createElement('span');
    dspan.appendChild(document.createTextNode(label));
    dlabel.appendChild(dspan);
    GUI.Elements._dataview.bindEntryEvents(el, cel, 'gui-icon-view-entry');
    cel.setAttribute('role', 'listitem');
    cel.appendChild(dicon);
    cel.appendChild(dlabel);
  }
  GUI.Elements['gui-icon-view'] = {
    bind: GUI.Elements._dataview.bind,
    values: function(el) {
      return GUI.Elements._dataview.getSelected(el, el.querySelectorAll('gui-icon-view-entry'));
    },
    build: function(el, applyArgs) {
      var body = el.querySelector('gui-icon-view-body');
      var found = !!body;
      if ( !body ) {
        body = document.createElement('gui-icon-view-body');
        el.appendChild(body);
      }
      el.querySelectorAll('gui-icon-view-entry').forEach(function(cel, idx) {
        if ( !found ) {
          body.appendChild(cel);
        }
        initEntry(el, cel);
      });
      el.setAttribute('role', 'list');
      GUI.Elements._dataview.build(el, applyArgs);
    },
    get: function(el, param, value, arg) {
      if ( param === 'entry' ) {
        var body = el.querySelector('gui-icon-view-body');
        return GUI.Elements._dataview.getEntry(el, body.querySelectorAll('gui-icon-view-entry'), value, arg);
      }
      return GUI.Helpers.getProperty(el, param);
    },
    set: function(el, param, value, arg) {
      var body = el.querySelector('gui-icon-view-body');
      if ( param === 'selected' || param === 'value' ) {
        GUI.Elements._dataview.setSelected(el, body, body.querySelectorAll('gui-icon-view-entry'), value, arg);
        return true;
      }
      return false;
    },
    call: function(el, method, args) {
      var body = el.querySelector('gui-icon-view-body');
      if ( method === 'add' ) {
        GUI.Elements._dataview.add(el, args, function(e) {
          var entry = createEntry(e);
          body.appendChild(entry);
          initEntry(el, entry);
        });
      } else if ( method === 'remove' ) {
        GUI.Elements._dataview.remove(el, args, 'gui-icon-view-entry');
      } else if ( method === 'clear' ) {
        GUI.Elements._dataview.clear(el, body);
      } else if ( method === 'patch' ) {
        GUI.Elements._dataview.patch(el, args, 'gui-icon-view-entry', body, createEntry, initEntry);
      } else if ( method === 'focus' ) {
        GUI.Elements._dataview.focus(el);
      }
      return this;
    }
  };
})(OSjs.API, OSjs.Utils, OSjs.VFS, OSjs.GUI);

(function(API, Utils, VFS, GUI) {
  'use strict';
  GUI.Elements['gui-paned-view'] = {
    bind: function(el, evName, callback, params) {
      if ( evName === 'resize' ) {
        evName = '_' + evName;
      }
      Utils.$bind(el, evName, callback.bind(new GUI.Element(el)), params);
    },
    build: function(el) {
      var orient = el.getAttribute('data-orientation') || 'horizontal';
      function bindResizer(resizer, idx, cel) {
        var resizeEl = resizer.previousElementSibling;
        if ( !resizeEl ) { return; }
        var startWidth = resizeEl.offsetWidth;
        var startHeight = resizeEl.offsetHeight;
        var minSize = 16;
        var maxSize = Number.MAX_VALUE;
        GUI.Helpers.createDrag(resizer, function(ev) {
          startWidth = resizeEl.offsetWidth;
          startHeight = resizeEl.offsetHeight;
          minSize = parseInt(cel.getAttribute('data-min-size'), 10) || minSize;
          var max = parseInt(cel.getAttribute('data-max-size'), 10);
          if ( !max ) {
            var totalHeight = resizer.parentNode.offsetHeight;
            var totalContainers = resizer.parentNode.querySelectorAll('gui-paned-view-container').length;
            var totalSpacers = resizer.parentNode.querySelectorAll('gui-paned-view-handle').length;
            maxSize = totalHeight - (totalContainers * 16) - (totalSpacers * 8);
          }
        }, function(ev, diff) {
          var newWidth = startWidth + diff.x;
          var newHeight = startHeight + diff.y;
          var flex;
          if ( orient === 'horizontal' ) {
            if ( !isNaN(newWidth) && newWidth > 0 && newWidth >= minSize && newWidth <= maxSize ) {
              flex = newWidth.toString() + 'px';
            }
          } else {
            if ( !isNaN(newHeight) && newHeight > 0 && newHeight >= minSize && newHeight <= maxSize ) {
              flex = newHeight.toString() + 'px';
            }
          }
          if ( flex ) {
            resizeEl.style.webkitFlexBasis = flex;
            resizeEl.style.mozFflexBasis = flex;
            resizeEl.style.msFflexBasis = flex;
            resizeEl.style.oFlexBasis = flex;
            resizeEl.style.flexBasis = flex;
          }
        }, function(ev) {
          el.dispatchEvent(new CustomEvent('_resize', {detail: {index: idx}}));
        });
      }
      el.querySelectorAll('gui-paned-view-container').forEach(function(cel, idx) {
        if ( idx % 2 ) {
          var resizer = document.createElement('gui-paned-view-handle');
          resizer.setAttribute('role', 'separator');
          cel.parentNode.insertBefore(resizer, cel);
          bindResizer(resizer, idx, cel);
        }
      });
    }
  };
  GUI.Elements['gui-paned-view-container'] = {
    build: function(el) {
      GUI.Helpers.setFlexbox(el);
    }
  };
  GUI.Elements['gui-button-bar'] = {
    build: function(el) {
      el.setAttribute('role', 'toolbar');
    }
  };
  GUI.Elements['gui-toolbar'] = {
    build: function(el) {
      el.setAttribute('role', 'toolbar');
    }
  };
  GUI.Elements['gui-grid'] = {
    build: function(el) {
      var rows = el.querySelectorAll('gui-grid-row');
      var p = 100 / rows.length;
      rows.forEach(function(r) {
        r.style.height = String(p) + '%';
      });
    }
  };
  GUI.Elements['gui-grid-row'] = {
    build: function(el) {
    }
  };
  GUI.Elements['gui-grid-entry'] = {
    build: function(el) {
    }
  };
  GUI.Elements['gui-vbox'] = {
    build: function(el) {
    }
  };
  GUI.Elements['gui-vbox-container'] = {
    build: function(el) {
      GUI.Helpers.setFlexbox(el);
    }
  };
  GUI.Elements['gui-hbox'] = {
    build: function(el) {
    }
  };
  GUI.Elements['gui-hbox-container'] = {
    build: function(el) {
      GUI.Helpers.setFlexbox(el);
    }
  };
  GUI.Elements['gui-expander'] = (function() {
    function toggleState(el, expanded) {
      if ( typeof expanded === 'undefined' ) {
        expanded = el.getAttribute('data-expanded') !== 'false';
        expanded = !expanded;
      }
      el.setAttribute('aria-expanded', String(expanded));
      el.setAttribute('data-expanded', String(expanded));
      return expanded;
    }
    return {
      set: function(el, param, value) {
        if ( param === 'expanded' ) {
          return toggleState(el, value === true);
        }
        return null;
      },
      bind: function(el, evName, callback, params) {
        if ( (['change']).indexOf(evName) !== -1 ) {
          evName = '_' + evName;
        }
        Utils.$bind(el, evName, callback.bind(new GUI.Element(el)), params);
      },
      build: function(el) {
        var lbltxt = el.getAttribute('data-label') || '';
        var label = document.createElement('gui-expander-label');
        Utils.$bind(label, 'click', function(ev) {
          el.dispatchEvent(new CustomEvent('_change', {detail: {expanded: toggleState(el)}}));
        }, false);
        label.appendChild(document.createTextNode(lbltxt));
        el.setAttribute('role', 'toolbar');
        el.setAttribute('aria-expanded', 'true');
        el.setAttribute('data-expanded', 'true');
        if ( el.children.length ) {
          el.insertBefore(label, el.children[0]);
        } else {
          el.appendChild(label);
        }
      }
    };
  })();
})(OSjs.API, OSjs.Utils, OSjs.VFS, OSjs.GUI);

(function(API, Utils, DialogWindow) {
  'use strict';
  function AlertDialog(args, callback) {
    args = Utils.argumentDefaults(args, {});
    DialogWindow.apply(this, ['AlertDialog', {
      title: args.title || API._('DIALOG_ALERT_TITLE'),
      icon: 'status/dialog-warning.png',
      width: 400,
      height: 100
    }, args, callback]);
  }
  AlertDialog.prototype = Object.create(DialogWindow.prototype);
  AlertDialog.constructor = DialogWindow;
  AlertDialog.prototype.init = function() {
    var root = DialogWindow.prototype.init.apply(this, arguments);
    root.setAttribute('role', 'alertdialog');
    this.scheme.find(this, 'Message').set('value', this.args.message, true);
    return root;
  };
  OSjs.Dialogs = OSjs.Dialogs || {};
  OSjs.Dialogs.Alert = Object.seal(AlertDialog);
})(OSjs.API, OSjs.Utils, OSjs.Core.DialogWindow);

(function(API, Utils, DialogWindow) {
  'use strict';
  function ApplicationChooserDialog(args, callback) {
    args = Utils.argumentDefaults(args, {});
    DialogWindow.apply(this, ['ApplicationChooserDialog', {
      title: args.title || API._('DIALOG_APPCHOOSER_TITLE'),
      width: 400,
      height: 400
    }, args, callback]);
  }
  ApplicationChooserDialog.prototype = Object.create(DialogWindow.prototype);
  ApplicationChooserDialog.constructor = DialogWindow;
  ApplicationChooserDialog.prototype.init = function() {
    var self = this;
    var root = DialogWindow.prototype.init.apply(this, arguments);
    var cols = [{label: API._('LBL_NAME')}];
    var rows = [];
    var metadata = OSjs.Core.getPackageManager().getPackages();
    (this.args.list || []).forEach(function(name) {
      var iter = metadata[name];
      if ( iter && iter.type === 'application' ) {
        var label = [iter.name];
        if ( iter.description ) {
          label.push(iter.description);
        }
        rows.push({
          value: iter,
          columns: [
            {label: label.join(' - '), icon: API.getIcon(iter.icon, null, name), value: JSON.stringify(iter)}
          ]
        });
      }
    });
    this.scheme.find(this, 'ApplicationList').set('columns', cols).add(rows).on('activate', function(ev) {
      self.onClose(ev, 'ok');
    });
    var file = '<unknown file>';
    var label = '<unknown mime>';
    if ( this.args.file ) {
      file = Utils.format('{0} ({1})', this.args.file.filename, this.args.file.mime);
      label = API._('DIALOG_APPCHOOSER_SET_DEFAULT', this.args.file.mime);
    }
    this.scheme.find(this, 'FileName').set('value', file);
    this.scheme.find(this, 'SetDefault').set('label', label);
    return root;
  };
  ApplicationChooserDialog.prototype.onClose = function(ev, button) {
    var result = null;
    if ( button === 'ok' ) {
      var useDefault = this.scheme.find(this, 'SetDefault').get('value');
      var selected = this.scheme.find(this, 'ApplicationList').get('value');
      if ( selected && selected.length ) {
        result = selected[0].data.className;
      }
      if ( !result ) {
        OSjs.API.createDialog('Alert', {
          message: API._('DIALOG_APPCHOOSER_NO_SELECTION')
        }, null, this);
        return;
      }
      result = {
        name: result,
        useDefault: useDefault
      };
    }
    this.closeCallback(ev, button, result);
  };
  OSjs.Dialogs = OSjs.Dialogs || {};
  OSjs.Dialogs.ApplicationChooser = Object.seal(ApplicationChooserDialog);
})(OSjs.API, OSjs.Utils, OSjs.Core.DialogWindow);

(function(API, Utils, DialogWindow) {
  'use strict';
  function ColorDialog(args, callback) {
    args = Utils.argumentDefaults(args, {
    });
    var rgb = args.color;
    var hex = rgb;
    if ( typeof rgb === 'string' ) {
      hex = rgb;
      rgb = Utils.convertToRGB(rgb);
      rgb.a = null;
    } else {
      if ( typeof rgb.a === 'undefined' ) {
        rgb.a = null;
      } else {
        if ( rgb.a > 1.0 ) {
          rgb.a /= 100;
        }
      }
      rgb = rgb || {r: 0, g: 0, b: 0, a: 100};
      hex = Utils.convertToHEX(rgb.r, rgb.g, rgb.b);
    }
    DialogWindow.apply(this, ['ColorDialog', {
      title: args.title || API._('DIALOG_COLOR_TITLE'),
      icon: 'apps/gnome-settings-theme.png',
      width: 400,
      height: rgb.a !== null ? 300  : 220
    }, args, callback]);
    this.color = {r: rgb.r, g: rgb.g, b: rgb.b, a: rgb.a, hex: hex};
  }
  ColorDialog.prototype = Object.create(DialogWindow.prototype);
  ColorDialog.constructor = DialogWindow;
  ColorDialog.prototype.init = function() {
    var self = this;
    var root = DialogWindow.prototype.init.apply(this, arguments);
    function updateHex(update) {
      self.scheme.find(self, 'LabelRed').set('value', API._('DIALOG_COLOR_R', self.color.r));
      self.scheme.find(self, 'LabelGreen').set('value', API._('DIALOG_COLOR_G', self.color.g));
      self.scheme.find(self, 'LabelBlue').set('value', API._('DIALOG_COLOR_B', self.color.b));
      self.scheme.find(self, 'LabelAlpha').set('value', API._('DIALOG_COLOR_A', self.color.a));
      if ( update ) {
        self.color.hex = Utils.convertToHEX(self.color.r, self.color.g, self.color.b);
      }
      var value = self.color.hex;
      if ( self.color.a !== null && !isNaN(self.color.a) ) {
        value = Utils.format('rgba({0}, {1}, {2}, {3})', self.color.r, self.color.g, self.color.b, self.color.a);
      }
      self.scheme.find(self, 'ColorPreview').set('value', value);
    }
    this.scheme.find(this, 'ColorSelect').on('change', function(ev) {
      self.color = ev.detail;
      self.scheme.find(self, 'Red').set('value', self.color.r);
      self.scheme.find(self, 'Green').set('value', self.color.g);
      self.scheme.find(self, 'Blue').set('value', self.color.b);
      updateHex(true);
    });
    this.scheme.find(this, 'Red').on('change', function(ev) {
      self.color.r = parseInt(ev.detail, 10);
      updateHex(true);
    }).set('value', this.color.r);
    this.scheme.find(this, 'Green').on('change', function(ev) {
      self.color.g = parseInt(ev.detail, 10);
      updateHex(true);
    }).set('value', this.color.g);
    this.scheme.find(this, 'Blue').on('change', function(ev) {
      self.color.b = parseInt(ev.detail, 10);
      updateHex(true);
    }).set('value', this.color.b);
    this.scheme.find(this, 'Alpha').on('change', function(ev) {
      self.color.a = parseInt(ev.detail, 10) / 100;
      updateHex(true);
    }).set('value', this.color.a * 100);
    if ( this.color.a === null ) {
      this.scheme.find(this, 'AlphaContainer').hide();
      this.scheme.find(this, 'AlphaLabelContainer').hide();
    }
    updateHex(false, this.color.a !== null);
    return root;
  };
  ColorDialog.prototype.onClose = function(ev, button) {
    this.closeCallback(ev, button, button === 'ok' ? this.color : null);
  };
  OSjs.Dialogs = OSjs.Dialogs || {};
  OSjs.Dialogs.Color = Object.seal(ColorDialog);
})(OSjs.API, OSjs.Utils, OSjs.Core.DialogWindow);

(function(API, Utils, DialogWindow) {
  'use strict';
  function ConfirmDialog(args, callback) {
    args = Utils.argumentDefaults(args, {
      buttons: ['yes', 'no', 'cancel']
    });
    DialogWindow.apply(this, ['ConfirmDialog', {
      title: args.title || API._('DIALOG_CONFIRM_TITLE'),
      icon: 'status/dialog-question.png',
      width: 400,
      height: 100
    }, args, callback]);
  }
  ConfirmDialog.prototype = Object.create(DialogWindow.prototype);
  ConfirmDialog.constructor = DialogWindow;
  ConfirmDialog.prototype.init = function() {
    var self = this;
    var root = DialogWindow.prototype.init.apply(this, arguments);
    this.scheme.find(this, 'Message').set('value', this.args.message);
    var buttonMap = {
      yes: 'ButtonYes',
      no: 'ButtonNo',
      cancel: 'ButtonCancel'
    };
    var hide = [];
    (['yes', 'no', 'cancel']).forEach(function(b) {
      if ( self.args.buttons.indexOf(b) < 0 ) {
        hide.push(b);
      }
    });
    hide.forEach(function(b) {
      self.scheme.find(self, buttonMap[b]).hide();
    });
    return root;
  };
  OSjs.Dialogs = OSjs.Dialogs || {};
  OSjs.Dialogs.Confirm = Object.seal(ConfirmDialog);
})(OSjs.API, OSjs.Utils, OSjs.Core.DialogWindow);

(function(API, Utils, DialogWindow) {
  'use strict';
  function ErrorDialog(args, callback) {
    args = Utils.argumentDefaults(args, {});
    console.error('ErrorDialog::constructor()', args);
    var exception = args.exception || {};
    var error = '';
    if ( exception.stack ) {
      error = exception.stack;
    } else {
      if ( Object.keys(exception).length ) {
        error = exception.name;
        error += '\nFilename: ' + exception.fileName || '<unknown>';
        error += '\nLine: ' + exception.lineNumber;
        error += '\nMessage: ' + exception.message;
        if ( exception.extMessage ) {
          error += '\n' + exception.extMessage;
        }
      }
    }
    DialogWindow.apply(this, ['ErrorDialog', {
      title: args.title || API._('DIALOG_CONFIRM_TITLE'),
      icon: 'status/dialog-error.png',
      width: 400,
      height: error ? 400 : 200
    }, args, callback]);
    this._sound = 'dialog-warning';
    this._soundVolume = 1.0;
    this.traceMessage = error;
  }
  ErrorDialog.prototype = Object.create(DialogWindow.prototype);
  ErrorDialog.constructor = DialogWindow;
  ErrorDialog.prototype.init = function() {
    var self = this;
    var root = DialogWindow.prototype.init.apply(this, arguments);
    root.setAttribute('role', 'alertdialog');
    var msg = Utils.$escape(this.args.message || '').replace(/\*\*(\w+)\*\*/, '<span>$1</span>');
    this.scheme.find(this, 'Message').set('value', msg, true);
    this.scheme.find(this, 'Summary').set('value', this.args.error);
    this.scheme.find(this, 'Trace').set('value', this.traceMessage);
    if ( !this.traceMessage ) {
      this.scheme.find(this, 'Trace').hide();
      this.scheme.find(this, 'TraceLabel').hide();
    }
    if ( this.args.bugreport ) {
      this.scheme.find(this, 'ButtonBugReport').on('click', function() {
        var title = encodeURIComponent('');
        var body = [self.args.message];
        if ( self.args.error ) {
          body.push('\n> ' + self.args.error.replace('\n', ' '));
        }
        if ( self.traceMessage ) {
          body.push('\n```\n' + self.traceMessage + '\n```');
        }
        window.open('//github.com/os-js/OS.js/issues/new?title=' + title + '&body=' + encodeURIComponent(body.join('\n')));
      });
    } else {
      this.scheme.find(this, 'ButtonBugReport').hide();
    }
    return root;
  };
  OSjs.Dialogs = OSjs.Dialogs || {};
  OSjs.Dialogs.Error = Object.seal(ErrorDialog);
})(OSjs.API, OSjs.Utils, OSjs.Core.DialogWindow);

(function(API, VFS, Utils, DialogWindow) {
  'use strict';
  function FileDialog(args, callback) {
    args = Utils.argumentDefaults(args, {
      file:       null,
      type:       'open',
      path:       OSjs.API.getDefaultPath(),
      filename:   '',
      filetypes:  [],
      extension:  '',
      mime:       'application/octet-stream',
      filter:     [],
      select:     null,
      multiple:   false
    });
    args.multiple = (args.type === 'save' ? false : args.multiple === true);
    if ( args.path && args.path instanceof VFS.File ) {
      args.path = Utils.dirname(args.path.path);
    }
    if ( args.file && args.file.path ) {
      args.path = Utils.dirname(args.file.path);
      args.filename = args.file.filename;
      args.mime = args.file.mime;
      if ( args.filetypes.length ) {
        var setTo = args.filetypes[0];
        args.filename = Utils.replaceFileExtension(args.filename, setTo.extension);
        args.mime = setTo.mime;
      }
    }
    var title     = API._(args.type === 'save' ? 'DIALOG_FILE_SAVE' : 'DIALOG_FILE_OPEN');
    var icon      = args.type === 'open' ? 'actions/gtk-open.png' : 'actions/gtk-save-as.png';
    DialogWindow.apply(this, ['FileDialog', {
      title: title,
      icon: icon,
      width: 600,
      height: 400
    }, args, callback]);
    this.selected = null;
    this.path = args.path;
    var self = this;
    this.settingsWatch = OSjs.Core.getSettingsManager().watch('VFS', function() {
      self.changePath();
    });
  }
  FileDialog.prototype = Object.create(DialogWindow.prototype);
  FileDialog.constructor = DialogWindow;
  FileDialog.prototype.destroy = function() {
    try {
      OSjs.Core.getSettingsManager().unwatch(this.settingsWatch);
    } catch ( e ) {}
    return DialogWindow.prototype.destroy.apply(this, arguments);
  };
  FileDialog.prototype.init = function() {
    var self = this;
    var root = DialogWindow.prototype.init.apply(this, arguments);
    var view = this.scheme.find(this, 'FileView');
    view.set('filter', this.args.filter);
    view.set('filetype', this.args.select || '');
    view.set('defaultcolumns', 'true');
    var filename = this.scheme.find(this, 'Filename');
    var home = this.scheme.find(this, 'HomeButton');
    var mlist = this.scheme.find(this, 'ModuleSelect');
    function checkEmptyInput() {
      var disable = false;
      if ( self.args.select !== 'dir' ) {
        disable = !filename.get('value').length;
      }
      self.scheme.find(self, 'ButtonOK').set('disabled', disable);
    }
    this._toggleLoading(true);
    view.set('multiple', this.args.multiple);
    filename.set('value', this.args.filename || '');
    home.on('click', function() {
      var dpath = API.getDefaultPath();
      self.changePath(dpath);
    });
    view.on('activate', function(ev) {
      self.selected = null;
      if ( self.args.type !== 'save' ) {
        filename.set('value', '');
      }
      if ( ev && ev.detail && ev.detail.entries ) {
        var activated = ev.detail.entries[0];
        if ( activated ) {
          self.selected = new VFS.File(activated.data);
          if ( self.selected.type !== 'dir' ) {
            filename.set('value', self.selected.filename);
          }
          self.checkSelection(ev, true);
        }
      }
    });
    view.on('select', function(ev) {
      self.selected = null;
      if ( ev && ev.detail && ev.detail.entries ) {
        var activated = ev.detail.entries[0];
        if ( activated ) {
          self.selected = new VFS.File(activated.data);
          if ( self.selected.type !== 'dir' ) {
            filename.set('value', self.selected.filename);
          }
        }
      }
      checkEmptyInput();
    });
    if ( this.args.type === 'save' ) {
      var filetypes = [];
      this.args.filetypes.forEach(function(f) {
        filetypes.push({
          label: Utils.format('{0} (.{1} {2})', f.label, f.extension, f.mime),
          value: f.extension
        });
      });
      var ft = this.scheme.find(this, 'Filetype').add(filetypes).on('change', function(ev) {
        var newinput = Utils.replaceFileExtension(filename.get('value'), ev.detail);
        filename.set('value', newinput);
      });
      if ( filetypes.length <= 1 ) {
        new OSjs.GUI.Element(ft.$element.parentNode).hide();
      }
      filename.on('enter', function(ev) {
        self.selected = null;
        self.checkSelection(ev);
      });
      filename.on('change', function(ev) {
        checkEmptyInput();
      });
      filename.on('keyup', function(ev) {
        checkEmptyInput();
      });
    } else {
      this.scheme.find(this, 'FileInput').hide();
    }
    var rootPath = VFS.getRootFromPath(this.path);
    var modules = [];
    VFS.getModules().forEach(function(m) {
      modules.push({
        label: m.name + (m.module.readOnly ? Utils.format(' ({0})', API._('LBL_READONLY')) : ''),
        value: m.module.root
      });
    });
    mlist.clear().add(modules).set('value', rootPath);
    mlist.on('change', function(ev) {
      self.changePath(ev.detail, true);
    });
    this.changePath();
    checkEmptyInput();
    return root;
  };
  FileDialog.prototype.changePath = function(dir, fromDropdown) {
    var self = this;
    var view = this.scheme.find(this, 'FileView');
    var lastDir = this.path;
    function resetLastSelected() {
      var rootPath = VFS.getRootFromPath(lastDir);
      try {
        self.scheme.find(self, 'ModuleSelect').set('value', rootPath);
      } catch ( e ) {
        console.warn('FileDialog::changePath()', 'resetLastSelection()', e);
      }
    }
    this._toggleLoading(true);
    view._call('chdir', {
      path: dir || this.path,
      done: function(error) {
        if ( error ) {
          if ( fromDropdown ) {
            resetLastSelected();
          }
        } else {
          if ( dir ) {
            self.path = dir;
          }
        }
        self.selected = null;
        self._toggleLoading(false);
      }
    });
  };
  FileDialog.prototype.checkFileExtension = function() {
    var filename = this.scheme.find(this, 'Filename');
    var filetypes = this.scheme.find(this, 'Filetypes');
    var mime = this.args.mime;
    var input = filename.get('value');
    if ( this.args.filetypes.length ) {
      if ( !input && this.args.filename ) {
        input = this.args.filename;
      }
      if ( input.length ) {
        var extension = input.split('.').pop();
        var current = filetypes.get('value');
        var found = false;
        this.args.filetypes.forEach(function(f) {
          if ( f.extension === extension ) {
            found = f;
          }
          return !!found;
        });
        found = found || this.args.filetypes[0];
        input = Utils.replaceFileExtension(input, found.extension);
        mime  = found.mime;
      }
    }
    return {
      filename: input,
      mime: mime
    };
  };
  FileDialog.prototype.checkSelection = function(ev, wasActivated) {
    var self = this;
    if ( this.selected && this.selected.type === 'dir' ) {
      if ( wasActivated ) {
        this.changePath(this.selected.path);
        return false;
      }
    }
    if ( this.args.type === 'save' ) {
      var check = this.checkFileExtension();
      if ( !this.path || !check.filename ) {
        API.error(API._('DIALOG_FILE_ERROR'), API._('DIALOG_FILE_MISSING_FILENAME'));
        return;
      }
      this.selected = new VFS.File(this.path.replace(/^\//, '') + '/' + check.filename, check.mime);
      this._toggleDisabled(true);
      VFS.exists(this.selected, function(error, result) {
        self._toggleDisabled(false);
        if ( self._destroyed ) {
          return;
        }
        if ( error ) {
          API.error(API._('DIALOG_FILE_ERROR'), API._('DIALOG_FILE_MISSING_FILENAME'));
        } else {
          if ( result ) {
            self._toggleDisabled(true);
            if ( self.selected ) {
              API.createDialog('Confirm', {
                buttons: ['yes', 'no'],
                message: API._('DIALOG_FILE_OVERWRITE', self.selected.filename)
              }, function(ev, button) {
                self._toggleDisabled(false);
                if ( button === 'yes' || button === 'ok' ) {
                  self.closeCallback(ev, 'ok', self.selected);
                }
              }, self);
            }
          } else {
            self.closeCallback(ev, 'ok', self.selected);
          }
        }
      });
      return false;
    } else {
      if ( !this.selected && this.args.select !== 'dir' ) {
        API.error(API._('DIALOG_FILE_ERROR'), API._('DIALOG_FILE_MISSING_SELECTION'));
        return false;
      }
      var res = this.selected;
      if ( !res && this.args.select === 'dir' ) {
        res = new VFS.File({
          filename: Utils.filename(this.path),
          path: this.path,
          type: 'dir'
        });
      }
      this.closeCallback(ev, 'ok', res);
    }
    return true;
  };
  FileDialog.prototype.onClose = function(ev, button) {
    if ( button === 'ok' && !this.checkSelection(ev) ) {
      return;
    }
    this.closeCallback(ev, button, this.selected);
  };
  OSjs.Dialogs = OSjs.Dialogs || {};
  OSjs.Dialogs.File = Object.seal(FileDialog);
})(OSjs.API, OSjs.VFS, OSjs.Utils, OSjs.Core.DialogWindow);

(function(API, Utils, VFS, DialogWindow) {
  'use strict';
  function FileInfoDialog(args, callback) {
    args = Utils.argumentDefaults(args, {});
    DialogWindow.apply(this, ['FileInfoDialog', {
      title: args.title || API._('DIALOG_FILEINFO_TITLE'),
      width: 400,
      height: 400
    }, args, callback]);
    if ( !this.args.file ) {
      throw new Error('You have to select a file for FileInfo');
    }
  }
  FileInfoDialog.prototype = Object.create(DialogWindow.prototype);
  FileInfoDialog.constructor = DialogWindow;
  FileInfoDialog.prototype.init = function() {
    var root = DialogWindow.prototype.init.apply(this, arguments);
    var txt = this.scheme.find(this, 'Info').set('value', API._('LBL_LOADING'));
    var file = this.args.file;
    function _onError(error) {
      if ( error ) {
        txt.set('value', API._('DIALOG_FILEINFO_ERROR_LOOKUP_FMT', file.path));
      }
    }
    function _onSuccess(data) {
      var info = [];
      Object.keys(data).forEach(function(i) {
        if ( i === 'exif' ) {
          info.push(i + ':\n\n' + data[i]);
        } else {
          info.push(i + ':\n\t' + data[i]);
        }
      });
      txt.set('value', info.join('\n\n'));
    }
    VFS.fileinfo(file, function(error, result) {
      if ( error ) {
        _onError(error);
        return;
      }
      _onSuccess(result || {});
    });
    return root;
  };
  OSjs.Dialogs = OSjs.Dialogs || {};
  OSjs.Dialogs.FileInfo = Object.seal(FileInfoDialog);
})(OSjs.API, OSjs.Utils, OSjs.VFS, OSjs.Core.DialogWindow);

(function(API, Utils, DialogWindow) {
  'use strict';
  function FileProgressDialog(args, callback) {
    args = Utils.argumentDefaults(args, {});
    DialogWindow.apply(this, ['FileProgressDialog', {
      title: args.title || API._('DIALOG_FILEPROGRESS_TITLE'),
      icon: 'actions/document-send.png',
      width: 400,
      height: 100
    }, args, callback]);
    this.busy = !!args.filename;
  }
  FileProgressDialog.prototype = Object.create(DialogWindow.prototype);
  FileProgressDialog.constructor = DialogWindow;
  FileProgressDialog.prototype.init = function() {
    var root = DialogWindow.prototype.init.apply(this, arguments);
    if ( this.args.message ) {
      this.scheme.find(this, 'Message').set('value', this.args.message, true);
    }
    return root;
  };
  FileProgressDialog.prototype.onClose = function(ev, button) {
    this.closeCallback(ev, button, null);
  };
  FileProgressDialog.prototype.setProgress = function(p) {
    this.scheme.find(this, 'Progress').set('progress', p);
  };
  FileProgressDialog.prototype._close = function(force) {
    if ( !force && this.busy  ) {
      return false;
    }
    return DialogWindow.prototype._close.call(this);
  };
  FileProgressDialog.prototype._onKeyEvent = function(ev) {
    if ( !this.busy ) {
      DialogWindow.prototype._onKeyEvent.apply(this, arguments);
    }
  };
  FileProgressDialog.prototype.setMessage = function(msg) {
    this.scheme.find(this, 'Message').set('value', msg);
  };
  OSjs.Dialogs.FileProgress = Object.seal(FileProgressDialog);
})(OSjs.API, OSjs.Utils, OSjs.Core.DialogWindow);

(function(API, VFS, Utils, DialogWindow) {
  'use strict';
  function FileUploadDialog(args, callback) {
    args = Utils.argumentDefaults(args, {
      dest:     API.getDefaultPath(),
      progress: {},
      file:     null
    });
    DialogWindow.apply(this, ['FileUploadDialog', {
      title: args.title || API._('DIALOG_UPLOAD_TITLE'),
      icon: 'actions/filenew.png',
      width: 400,
      height: 100
    }, args, callback]);
  }
  FileUploadDialog.prototype = Object.create(DialogWindow.prototype);
  FileUploadDialog.constructor = DialogWindow;
  FileUploadDialog.prototype.init = function() {
    var self = this;
    var root = DialogWindow.prototype.init.apply(this, arguments);
    var message = this.scheme.find(this, 'Message');
    var maxSize = API.getConfig('VFS.MaxUploadSize');
    message.set('value', API._('DIALOG_UPLOAD_DESC', this.args.dest, maxSize), true);
    var input = this.scheme.find(this, 'File');
    if ( this.args.file ) {
      this.setFile(this.args.file, input);
    } else {
      input.on('change', function(ev) {
        self.setFile(ev.detail, input);
      });
    }
    return root;
  };
  FileUploadDialog.prototype.setFile = function(file, input) {
    var self = this;
    var progressDialog;
    function error(msg, ev) {
      API.error(
        OSjs.API._('DIALOG_UPLOAD_FAILED'),
        OSjs.API._('DIALOG_UPLOAD_FAILED_MSG'),
        msg || OSjs.API._('DIALOG_UPLOAD_FAILED_UNKNOWN')
      );
      progressDialog._close(true);
      self.onClose(ev, 'cancel');
    }
    if ( file ) {
      var fileSize = 0;
      if ( file.size > 1024 * 1024 ) {
        fileSize = (Math.round(file.size * 100 / (1024 * 1024)) / 100).toString() + 'MB';
      } else {
        fileSize = (Math.round(file.size * 100 / 1024) / 100).toString() + 'KB';
      }
      if ( input ) {
        input.set('disabled', true);
      }
      this.scheme.find(this, 'ButtonCancel').set('disabled', true);
      var desc = OSjs.API._('DIALOG_UPLOAD_MSG_FMT', file.name, file.type, fileSize, this.dest);
      progressDialog = API.createDialog('FileProgress', {
        message: desc,
        dest: this.args.dest,
        filename: file.name,
        mime: file.type,
        size: fileSize
      }, function(ev, button) {
      }, this);
      if ( this._wmref ) {
        this._wmref.createNotificationIcon(this.notificationId, {className: 'BusyNotification', tooltip: desc, image: false});
      }
      OSjs.VFS.upload({files: [file], destination: this.args.dest}, function(err, result, ev) {
        if ( err ) {
          error(err, ev);
          return;
        }
        progressDialog._close();
        self.onClose(ev, 'ok', file);
      }, {
        onprogress: function(ev) {
          if ( ev.lengthComputable ) {
            var p = Math.round(ev.loaded * 100 / ev.total);
            progressDialog.setProgress(p);
          }
        }
      });
      setTimeout(function() {
        if ( progressDialog ) { progressDialog._focus(); }
      }, 100);
    }
  };
  FileUploadDialog.prototype.onClose = function(ev, button, result) {
    result = result || null;
    this.closeCallback(ev, button, result);
  };
  OSjs.Dialogs = OSjs.Dialogs || {};
  OSjs.Dialogs.FileUpload = Object.seal(FileUploadDialog);
})(OSjs.API, OSjs.VFS, OSjs.Utils, OSjs.Core.DialogWindow);

(function(API, Utils, DialogWindow) {
  'use strict';
  function FontDialog(args, callback) {
    args = Utils.argumentDefaults(args, {
      fontName: API.getConfig('Fonts.default'),
      fontSize: 12,
      fontColor: '#000000',
      backgroundColor: '#ffffff',
      fonts: API.getConfig('Fonts.list'),
      minSize: 6,
      maxSize: 30,
      text: 'The quick brown fox jumps over the lazy dog',
      unit: 'px'
    });
    if ( args.unit === 'null' || args.unit === 'unit' ) {
      args.unit = '';
    }
    DialogWindow.apply(this, ['FontDialog', {
      title: args.title || API._('DIALOG_FONT_TITLE'),
      width: 400,
      height: 300
    }, args, callback]);
    this.selection = {
      fontName: args.fontName,
      fontSize: args.fontSize + args.unit
    };
  }
  FontDialog.prototype = Object.create(DialogWindow.prototype);
  FontDialog.constructor = DialogWindow;
  FontDialog.prototype.init = function() {
    var root = DialogWindow.prototype.init.apply(this, arguments);
    var self = this;
    var preview = this.scheme.find(this, 'FontPreview');
    var sizes = [];
    var fonts = [];
    for ( var i = this.args.minSize; i < this.args.maxSize; i++ ) {
      sizes.push({value: i, label: i});
    }
    for ( var j = 0; j < this.args.fonts.length; j++ ) {
      fonts.push({value: this.args.fonts[j], label: this.args.fonts[j]});
    }
    function updatePreview() {
      preview.querySelector('textarea').style.fontFamily = self.selection.fontName;
      preview.querySelector('textarea').style.fontSize = self.selection.fontSize;
    }
    var listFonts = this.scheme.find(this, 'FontName');
    listFonts.add(fonts).set('value', this.args.fontName);
    listFonts.on('change', function(ev) {
      self.selection.fontName = ev.detail;
      updatePreview();
    });
    var listSizes = this.scheme.find(this, 'FontSize');
    listSizes.add(sizes).set('value', this.args.fontSize);
    listSizes.on('change', function(ev) {
      self.selection.fontSize = ev.detail + self.args.unit;
      updatePreview();
    });
    preview.$element.style.color = this.args.fontColor;
    preview.$element.style.backgroundColor = this.args.backgroundColor;
    preview.set('value', this.args.text);
    if ( this.args.fontSize < 0 ) {
      this.scheme.find(this, 'FontSizeContainer').hide();
    }
    updatePreview();
    return root;
  };
  FontDialog.prototype.onClose = function(ev, button) {
    var result = button === 'ok' ? this.selection : null;
    this.closeCallback(ev, button, result);
  };
  OSjs.Dialogs = OSjs.Dialogs || {};
  OSjs.Dialogs.Font = Object.seal(FontDialog);
})(OSjs.API, OSjs.Utils, OSjs.Core.DialogWindow);

(function(API, Utils, DialogWindow) {
  'use strict';
  function InputDialog(args, callback) {
    args = Utils.argumentDefaults(args, {});
    DialogWindow.apply(this, ['InputDialog', {
      title: args.title || API._('DIALOG_INPUT_TITLE'),
      icon: 'status/dialog-information.png',
      width: 400,
      height: 120
    }, args, callback]);
  }
  InputDialog.prototype = Object.create(DialogWindow.prototype);
  InputDialog.constructor = DialogWindow;
  InputDialog.prototype.init = function() {
    var self = this;
    var root = DialogWindow.prototype.init.apply(this, arguments);
    if ( this.args.message ) {
      this.scheme.find(this, 'Message').set('value', this.args.message, true);
    }
    var input = this.scheme.find(this, 'Input');
    input.set('placeholder', this.args.placeholder || '');
    input.set('value', this.args.value || '');
    input.on('enter', function(ev) {
      self.onClose(ev, 'ok');
    });
    return root;
  };
  InputDialog.prototype._focus = function() {
    if ( DialogWindow.prototype._focus.apply(this, arguments) ) {
      this.scheme.find(this, 'Input').focus();
      return true;
    }
    return false;
  };
  InputDialog.prototype.onClose = function(ev, button) {
    var result = this.scheme.find(this, 'Input').get('value');
    this.closeCallback(ev, button, button === 'ok' ? result : null);
  };
  InputDialog.prototype.setRange = function(range) {
    var input = this.scheme.find(this, 'Input');
    if ( input.$element ) {
      input.$element.querySelector('input').select(range);
    }
  };
  OSjs.Dialogs = OSjs.Dialogs || {};
  OSjs.Dialogs.Input = Object.seal(InputDialog);
})(OSjs.API, OSjs.Utils, OSjs.Core.DialogWindow);

(function(API, Utils) {
  'use strict';
  window.OSjs   = window.OSjs   || {};
  OSjs.Core     = OSjs.Core     || {};
  var _handlerInstance;
  var _Handler = function() {
    if ( _handlerInstance ) {
      throw Error('Cannot create another Handler Instance');
    }
    this._saveTimeout = null;
    this.offline    = false;
    this.nw         = null;
    this.userData   = {
      id      : 0,
      username: 'root',
      name    : 'root user',
      groups  : ['admin']
    };
    if ( (API.getConfig('Connection.Type') === 'nw') ) {
      this.nw = require('osjs').init({
        root: process.cwd(),
        settings: {
          mimes: API.getConfig('MIME.mapping')
        },
        nw: true
      });
    }
    _handlerInstance = this;
  };
  _Handler.prototype.init = function(callback) {
    var self = this;
    API.setLocale(API.getConfig('Locale'));
    if ( typeof navigator.onLine !== 'undefined' ) {
      window.addEventListener('offline', function(ev) {
        self.onOffline();
      });
      window.addEventListener('online', function(ev) {
        self.onOnline();
      });
    }
    callback();
  };
  _Handler.prototype.destroy = function() {
    var self = this;
    if ( typeof navigator.onLine !== 'undefined' ) {
      window.removeEventListener('offline', function(ev) {
        self.onOffline();
      });
      window.removeEventListener('online', function(ev) {
        self.onOnline();
      });
    }
    this.nw = null;
    _handlerInstance = null;
  };
  _Handler.prototype.login = function(username, password, callback) {
    var opts = {username: username, password: password};
    this.callAPI('login', opts, function(response) {
      if ( response.result ) { // This contains an object with user data
        callback(false, response.result);
      } else {
        var error = response.error || API._('ERR_LOGIN_INVALID');
        callback(API._('ERR_LOGIN_FMT', error), false);
      }
    }, function(error) {
      callback(API._('ERR_LOGIN_FMT', error), false);
    });
  };
  _Handler.prototype.logout = function(save, callback) {
    var self = this;
    function _finished() {
      var opts = {};
      self.callAPI('logout', opts, function(response) {
        if ( response.result ) {
          callback(true);
        } else {
          callback(false, 'An error occured: ' + (response.error || 'Unknown error'));
        }
      }, function(error) {
        callback(false, 'Logout error: ' + error);
      });
    }
    function saveSession(cb) {
      var data = [];
      API.getProcesses().forEach(function(proc, i) {
        if ( proc && (proc instanceof OSjs.Core.Application) ) {
          data.push(proc._getSessionData());
        }
      });
      OSjs.Core.getSettingsManager().set('UserSession', null, data, cb);
    }
    if ( save ) {
      saveSession(function() {
        _finished(true);
      });
      return;
    }
    _finished(true);
  };
  _Handler.prototype.loadSession = function(callback) {
    callback = callback || function() {};
    var res = OSjs.Core.getSettingsManager().get('UserSession');
    var list = [];
    (res || []).forEach(function(iter, i) {
      var args = iter.args;
      args.__resume__ = true;
      args.__windows__ = iter.windows || [];
      list.push({name: iter.name, args: args});
    });
    API.launchList(list, null, null, callback);
  };
  _Handler.prototype.saveSettings = function(pool, storage, callback) {
    var self = this;
    var opts = {settings: storage};
    function _save() {
      self.callAPI('settings', opts, function(response) {
        callback.call(self, false, response.result);
      }, function(error) {
        callback.call(self, error, false);
      });
    }
    if ( this._saveTimeout ) {
      clearTimeout(this._saveTimeout);
      this._saveTimeout = null;
    }
    setTimeout(_save, 250);
  };
  _Handler.prototype.getVFSPath = function(item) {
    var base = API.getConfig('Connection.FSURI', '/');
    if ( item ) {
      return base + '/get/' + item.path;
    }
    return base + '/upload';
  };
  _Handler.prototype.callAPI = function(method, args, cbSuccess, cbError, options) {
    args      = args      || {};
    options   = options   || {};
    cbSuccess = cbSuccess || function() {};
    cbError   = cbError   || function() {};
    var self = this;
    function checkState() {
      if ( self.offline ) {
        cbError('You are currently off-line and cannot perform this operation!');
        return false;
      } else if ( (API.getConfig('Connection.Type') === 'standalone') ) {
        cbError('You are currently running locally and cannot perform this operation!');
        return false;
      }
      return true;
    }
    function _call() {
      if ( (API.getConfig('Connection.Type') === 'nw') ) {
        return self.__callNW(method, args, options, cbSuccess, cbError);
      }
      if ( method.match(/^FS/) ) {
        return self._callVFS(method, args, options, cbSuccess, cbError);
      }
      return self._callAPI(method, args, options, cbSuccess, cbError);
    }
    return checkState() ? _call() : false;
  };
  _Handler.prototype.__callNW = function(method, args, options, cbSuccess, cbError) {
    cbError = cbError || function() {
      console.warn('Handler::__callNW()', 'error', arguments);
    };
    try {
      this.nw.request(method.match(/^FS\:/) !== null, method.replace(/^FS\:/, ''), args, function(err, res) {
        cbSuccess({error: err, result: res});
      });
    } catch ( e ) {
      console.warn('callAPI() NW.js Warning', e.stack, e);
      cbError(e);
    }
    return true;
  };
  _Handler.prototype.__callXHR = function(url, args, options, cbSuccess, cbError) {
    var self = this;
    cbError = cbError || function() {
      console.warn('Handler::__callXHR()', 'error', arguments);
    };
    var data = {
      url: url,
      method: 'POST',
      json: true,
      body: args,
      onsuccess: function() {
        cbSuccess.apply(self, arguments);
      },
      onerror: function() {
        cbError.apply(self, arguments);
      }
    };
    if ( options ) {
      Object.keys(options).forEach(function(key) {
        data[key] = options[key];
      });
    }
    Utils.ajax(data);
    return true;
  };
  _Handler.prototype._callAPI = function(method, args, options, cbSuccess, cbError) {
    var url = API.getConfig('Connection.APIURI') + '/' + method;
    return this.__callXHR(url, args, options, cbSuccess, cbError);
  };
  _Handler.prototype._callVFS = function(method, args, options, cbSuccess, cbError) {
    if ( method === 'FS:get' ) {
      return this.__callGET(args, options, cbSuccess, cbError);
    } else if ( method === 'FS:upload' ) {
      return this.__callPOST(args, options, cbSuccess, cbError);
    }
    var url = API.getConfig('Connection.FSURI') + '/' + method.replace(/^FS\:/, '');
    return this.__callXHR(url, args, options, cbSuccess, cbError);
  };
  _Handler.prototype.__callPOST = function(form, options, cbSuccess, cbError) {
    var onprogress = options.onprogress || function() {};
    cbError = cbError || function() {
      console.warn('Handler::__callPOST()', 'error', arguments);
    };
    OSjs.Utils.ajax({
      url: OSjs.VFS.Transports.Internal.path(),
      method: 'POST',
      body: form,
      onsuccess: function(result) {
        cbSuccess(false, result);
      },
      onerror: function(result) {
        cbError('error', null, result);
      },
      onprogress: function(evt) {
        onprogress(evt);
      },
      oncanceled: function(evt) {
        cbError('canceled', null, evt);
      }
    });
    return true;
  };
  _Handler.prototype.__callGET = function(args, options, cbSuccess, cbError) {
    var self = this;
    var onprogress = args.onprogress || function() {};
    cbError = cbError || function() {
      console.warn('Handler::__callGET()', 'error', arguments);
    };
    Utils.ajax({
      url: args.url || OSjs.VFS.Transports.Internal.path(args.path),
      method: args.method || 'GET',
      responseType: 'arraybuffer',
      onprogress: function(ev) {
        if ( ev.lengthComputable ) {
          onprogress(ev, ev.loaded / ev.total);
        } else {
          onprogress(ev, -1);
        }
      },
      onsuccess: function(response, xhr) {
        if ( !xhr || xhr.status === 404 || xhr.status === 500 ) {
          cbSuccess({error: xhr.statusText || response, result: null});
          return;
        }
        cbSuccess({error: false, result: response});
      },
      onerror: function() {
        cbError.apply(self, arguments);
      }
    });
    return true;
  };
  _Handler.prototype.onLogin = function(data, callback) {
    callback = callback || function() {};
    var userSettings = data.userSettings;
    if ( !userSettings || userSettings instanceof Array ) {
      userSettings = {};
    }
    this.userData = data.userData;
    function getUserLocale() {
      var curLocale = Utils.getUserLocale() || API.getConfig('Locale');
      var result = OSjs.Core.getSettingsManager().get('CoreWM');
      if ( !result ) {
        try {
          result = userSettings.CoreWM;
        } catch ( e )  {}
      }
      return result ? (result.language || curLocale) : curLocale;
    }
    document.getElementById('LoadingScreen').style.display = 'block';
    API.setLocale(getUserLocale());
    OSjs.Core.getSettingsManager().init(userSettings);
    if ( data.blacklistedPackages ) {
      OSjs.Core.getPackageManager().setBlacklist(data.blacklistedPackages);
    }
    callback();
  };
  _Handler.prototype.onVFSRequest = function(vfsModule, vfsMethod, vfsArguments, callback) {
    callback();
  };
  _Handler.prototype.onOnline = function() {
    console.warn('Handler::onOnline()', 'Going online...');
    this.offline = false;
    var wm = OSjs.Core.getWindowManager();
    if ( wm ) {
      wm.notification({title: 'Warning!', message: 'You are On-line!'});
    }
  };
  _Handler.prototype.onOffline = function() {
    console.warn('Handler::onOffline()', 'Going offline...');
    this.offline = true;
    var wm = OSjs.Core.getWindowManager();
    if ( wm ) {
      wm.notification({title: 'Warning!', message: 'You are Off-line!'});
    }
  };
  _Handler.prototype.getUserData = function() {
    return this.userData || {};
  };
  _Handler.prototype.initLoginScreen = function(callback) {
    var self      = this;
    var container = document.getElementById('Login');
    var login     = document.getElementById('LoginForm');
    var u         = document.getElementById('LoginUsername');
    var p         = document.getElementById('LoginPassword');
    var s         = document.getElementById('LoginSubmit');
    if ( !container ) {
      throw new Error('Could not find Login Form Container');
    }
    function _restore() {
      s.removeAttribute('disabled');
      u.removeAttribute('disabled');
      p.removeAttribute('disabled');
    }
    function _lock() {
      s.setAttribute('disabled', 'disabled');
      u.setAttribute('disabled', 'disabled');
      p.setAttribute('disabled', 'disabled');
    }
    function _login(username, password) {
      self.login(username, password, function(error, result) {
        if ( error ) {
          alert(error);
          _restore();
          return;
        }
        container.parentNode.removeChild(container);
        self.onLogin(result, function() {
          callback();
        });
      });
    }
    login.onsubmit = function(ev) {
      _lock();
      if ( ev ) {
        ev.preventDefault();
      }
      _login(u.value, p.value);
    };
    container.style.display = 'block';
    _restore();
  };
  OSjs.Core._Handler = _Handler;
  OSjs.Core.Handler  = null;
  OSjs.Core.getHandler = function() {
    return _handlerInstance;
  };
})(OSjs.API, OSjs.Utils);

(function(API, Utils, VFS) {
  'use strict';
  window.OSjs  = window.OSjs || {};
  OSjs.Core    = OSjs.Core   || {};
  var ArduinoHandler = function() {
    OSjs.Core._Handler.apply(this, arguments);
    this._saveTimeout = null;
    API.addHook('onSessionLoaded', function() {
      var pool = OSjs.Core.getSettingsManager().instance('Wizard');
      if ( !pool.get('completed') ) {
        API.launch('ApplicationArduinoWizardSettings');
      }
    });
  };
  ArduinoHandler.prototype = Object.create(OSjs.Core._Handler.prototype);
  ArduinoHandler.prototype.initLoginScreen = function(callback) {
    OSjs.Core._Handler.prototype.initLoginScreen.apply(this, arguments);
    document.getElementById('LoginUsername').value = 'root';
    if ( location.search === '?DEBUGMODE' ) {
      document.getElementById('LoginPassword').value = 'doghunter';
      document.getElementById('LoginForm').onsubmit();
    }
  };
  ArduinoHandler.prototype.init = function(callback) {
    var self = this;
    this.initLoginScreen(function() {
      OSjs.Core._Handler.prototype.init.call(self, callback);
    });
  };
  ArduinoHandler.prototype.login = function(username, password, callback) {
    function checkSettingsCompability(settings) {
      settings = settings || {};
      var curr = API.getConfig('Version');
      if ( !settings['__version__'] || settings['__version__'] !== curr ) {
        settings = {};
      }
      settings['__version__'] = curr;
      return settings;
    }
    var opts = {username: username, password: password};
    this.callAPI('login', opts, function(response) {
      try{
        document.cookie = 'osjsuser=' + username;
      } catch(e){
      }
      if ( response.result ) { // This contains an object with user data
        try {
          document.cookie = 'osjsuser=' + username;
        } catch (e) {}
        callback(false, {
          userData: response.result.userData,
          userSettings: checkSettingsCompability(response.result.userSettings)
        });
      } else {
        callback(response.error ? ('Error while logging in: ' + response.error) : 'Invalid login', false);
      }
    }, function(error) {
      callback('Login error: ' + error, false);
    });
  };
  ArduinoHandler.prototype.logout = function(save, callback) {
    var self = this;
    function _finished() {
      var opts = {};
      self.callAPI('logout', opts, function(response) {
        if ( response.result ) {
          callback(true);
        } else {
          callback(false, 'An error occured: ' + (response.error || 'Unknown error'));
        }
      }, function(error) {
        callback(false, 'Logout error: ' + error);
      });
    }
    OSjs.Core._Handler.prototype.logout.call(this, save, _finished);
  };
  ArduinoHandler.prototype.saveSettings = function(pool, storage, callback) {
    var self = this;
    var opts = {settings: storage};
    function _save() {
      self.callAPI('settings', opts, function(response) {
        if ( response.result ) {
          callback.call(self, true);
        } else {
          callback.call(self, false);
        }
      }, function(error) {
        console.warn('ArduinoHandler::syncSettings()', 'Call error', error);
        callback.call(self, false);
      });
    }
    if ( this._saveTimeout ) {
      clearTimeout(this._saveTimeout);
      this._saveTimeout = null;
    }
    setTimeout(_save, 100);
  };
  OSjs.Core.Handler = ArduinoHandler;
})(OSjs.API, OSjs.Utils, OSjs.VFS);

(function(Utils, API) {
  'use strict';
  OSjs.VFS             = OSjs.VFS            || {};
  OSjs.VFS.Modules     = OSjs.VFS.Modules    || {};
  OSjs.VFS.Transports  = OSjs.VFS.Transports || {};
  var DefaultModule = 'User';
  var MountsRegistered = false;
  function checkMetadataArgument(item, err) {
    if ( typeof item === 'string' ) {
      item = new OSjs.VFS.File(item);
    } else if ( typeof item === 'object' ) {
      if ( item.path ) {
        item = new OSjs.VFS.File(item);
      }
    }
    if ( !(item instanceof OSjs.VFS.File) ) {
      throw new TypeError(err || API._('ERR_VFS_EXPECT_FILE'));
    }
    return item;
  }
  function isInternalModule(test) {
    test = test || '';
    var m = OSjs.VFS.Modules;
    var d = null;
    if ( test !== null ) {
      Object.keys(m).every(function(name) {
        var i = m[name];
        if ( i.internal === true && i.match && test.match(i.match) ) {
          d = true;
          return false;
        }
        return true;
      });
    }
    return d;
  }
  function getModules(opts) {
    opts = Utils.argumentDefaults(opts, {
      visible: true,
      special: false
    });
    var m = OSjs.VFS.Modules;
    var a = [];
    Object.keys(m).forEach(function(name) {
      var iter = m[name];
      if ( !iter.enabled() || (!opts.special && iter.special) ) {
        return;
      }
      if ( opts.visible && iter.visible === opts.visible ) {
        a.push({
          name: name,
          module: iter
        });
      }
    });
    return a;
  }
  function getModuleFromPath(test, retdef) {
    retdef = typeof retdef === 'undefined' ? true : (retdef === true);
    var d = null;
    if ( typeof test === 'string' ) {
      Object.keys(OSjs.VFS.Modules).every(function(name) {
        var i = OSjs.VFS.Modules[name];
        if ( i.enabled() === true && i.match && test.match(i.match) ) {
          d = name;
          return false;
        }
        return true;
      });
    }
    return d || (retdef ? DefaultModule : null);
  }
  function request(test, method, args, callback, options) {
    var d = getModuleFromPath(test, false);
    if ( !d ) {
      throw new Error(API._('ERR_VFSMODULE_NOT_FOUND_FMT', test));
    }
    if ( typeof method !== 'string' ) {
      throw new TypeError(API._('ERR_ARGUMENT_FMT', 'VFS::' + method, 'method', 'String', typeof method));
    }
    if ( !(args instanceof Object) ) {
      throw new TypeError(API._('ERR_ARGUMENT_FMT', 'VFS::' + method, 'args', 'Object', typeof args));
    }
    if ( !(callback instanceof Function) ) {
      throw new TypeError(API._('ERR_ARGUMENT_FMT', 'VFS::' + method, 'callback', 'Function', typeof callback));
    }
    if ( options && !(options instanceof Object) ) {
      throw new TypeError(API._('ERR_ARGUMENT_FMT', 'VFS::' + method, 'options', 'Object', typeof options));
    }
    OSjs.Core.getHandler().onVFSRequest(d, method, args, function vfsRequestCallback() {
      try {
        OSjs.VFS.Modules[d].request(method, args, callback, options);
      } catch ( e ) {
        var msg = API._('ERR_VFSMODULE_EXCEPTION_FMT', e.toString());
        callback(msg);
        console.warn('VFS::request()', 'exception', e.stack, e);
      }
    });
  }
  function filterScandir(list, options) {
    var defaultOptions = Utils.cloneObject(OSjs.Core.getSettingsManager().get('VFS') || {});
    options = Utils.argumentDefaults(options, defaultOptions.scandir || {});
    options = Utils.argumentDefaults(options, {
      typeFilter: null,
      mimeFilter: [],
      showHiddenFiles: true
    }, true);
    var result = [];
    function filterFile(iter) {
      if ( iter.filename !== '..' ) {
        if ( (options.typeFilter && iter.type !== options.typeFilter) || (!options.showHiddenFiles && iter.filename.match(/^\.\w/)) ) {
          return false;
        }
      }
      return true;
    }
    function validMime(iter) {
      if ( options.mimeFilter && options.mimeFilter.length && iter.mime ) {
        var valid = false;
        options.mimeFilter.every(function(miter) {
          if ( iter.mime.match(miter) ) {
            valid = true;
            return false;
          }
          return true;
        });
        return valid;
      }
      return true;
    }
    list.forEach(function(iter) {
      if ( iter.mime === 'application/vnd.google-apps.folder' ) {
        iter.type = 'dir';
      }
      if ( (iter.filename === '..' && options.backlink === false) || !filterFile(iter) ) {
        return;
      }
      if ( iter.type === 'file' ) {
        if ( !validMime(iter) ) {
          return;
        }
      }
      result.push(iter);
    });
    var tree = {dirs: [], files: []};
    for ( var i = 0; i < result.length; i++ ) {
      if ( result[i].type === 'dir' ) {
        tree.dirs.push(result[i]);
      } else {
        tree.files.push(result[i]);
      }
    }
    return tree.dirs.concat(tree.files);
  }
  function getRelativeURL(orig) {
    return orig.replace(/^([A-z0-9\-_]+)\:\/\//, '');
  }
  function getRootFromPath(path) {
    var module = getModuleFromPath(path);
    return OSjs.VFS.Modules[module].root;
  }
  function internalCall(name, args, callback) {
    API.call('FS:' + name, args, function(err, res) {
      if ( !err && typeof res === 'undefined' ) {
        err = API._('ERR_VFS_FATAL');
      }
      callback(err, res);
    });
  }
  function existsWrapper(item, callback, options) {
    options = options || {};
    if ( typeof options.overwrite !== 'undefined' && options.overwrite === true ) {
      callback();
    } else {
      OSjs.VFS.exists(item, function(error, result) {
        if ( error ) {
          console.warn('existsWrapper() error', error);
        }
        if ( result ) {
          callback(API._('ERR_VFS_FILE_EXISTS'));
        } else {
          callback();
        }
      });
    }
  }
  function internalUpload(file, dest, callback, options) {
    options = options || {};
    if ( typeof file.size !== 'undefined' ) {
      var maxSize = API.getConfig('VFS.MaxUploadSize');
      if ( maxSize > 0 ) {
        var bytes = file.size;
        if ( bytes > maxSize ) {
          var msg = API._('DIALOG_UPLOAD_TOO_BIG_FMT', Utils.humanFileSize(maxSize));
          callback('error', msg);
          return;
        }
      }
    }
    var fd  = new FormData();
    fd.append('upload', 1);
    fd.append('path', dest);
    if ( options ) {
      Object.keys(options).forEach(function(key) {
        fd.append(key, String(options[key]));
      });
    }
    addFormFile(fd, 'upload', file);
    OSjs.Core.getHandler().callAPI('FS:upload', fd, callback, null, options);
  }
  function createMatch(name) {
    return new RegExp('^' + name.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&'));
  }
  function addFormFile(fd, key, data, file) {
    if ( data instanceof window.File ) {
      fd.append(key, data);
    } else {
      if ( file ) {
        if ( data instanceof window.ArrayBuffer ) {
          try {
            data = new Blob([data], {type: file.mime});
          } catch ( e ) {
            data = null;
            console.warn(e, e.stack);
          }
        }
        fd.append(key, data, file.filename);
      } else {
        if ( data.data && data.filename ) { // In case user defines custom
          fd.append(key, data.data, data.filename);
        }
      }
    }
  }
  function dataSourceToAb(data, mime, callback) {
    var byteString = atob(data.split(',')[1]);
    var mimeString = data.split(',')[0].split(':')[1].split(';')[0];
    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    callback(false, ab);
  }
  function textToAb(data, mime, callback) {
    mime = mime || 'application/octet-stream';
    try {
      var blob    = new Blob([data], {type: mime});
      var r       = new FileReader();
      r.onerror   = function(e) { callback(e);               };
      r.onloadend = function()  { callback(false, r.result); };
      r.readAsArrayBuffer(blob);
    } catch ( e ) {
      console.warn(e, e.stack);
      callback(e);
    }
  }
  function abToDataSource(arrayBuffer, mime, callback) {
    mime = mime || 'application/octet-stream';
    try {
      var blob    = new Blob([arrayBuffer], {type: mime});
      var r       = new FileReader();
      r.onerror   = function(e) { callback(e);               };
      r.onloadend = function()  { callback(false, r.result); };
      r.readAsDataURL(blob);
    } catch ( e ) {
      console.warn(e, e.stack);
      callback(e);
    }
  }
  function abToText(arrayBuffer, mime, callback) {
    mime = mime || 'application/octet-stream';
    try {
      var blob    = new Blob([arrayBuffer], {type: mime});
      var r       = new FileReader();
      r.onerror   = function(e) { callback(e);               };
      r.onloadend = function()  { callback(false, r.result); };
      r.readAsText(blob);
    } catch ( e ) {
      console.warn(e, e.stack);
      callback(e);
    }
  }
  function abToBinaryString(arrayBuffer, mime, callback) {
    mime = mime || 'application/octet-stream';
    try {
      var blob    = new Blob([arrayBuffer], {type: mime});
      var r       = new FileReader();
      r.onerror   = function(e) { callback(e);               };
      r.onloadend = function()  { callback(false, r.result); };
      r.readAsBinaryString(blob);
    } catch ( e ) {
      console.warn(e, e.stack);
      callback(e);
    }
  }
  function abToBlob(arrayBuffer, mime, callback) {
    mime = mime || 'application/octet-stream';
    try {
      var blob = new Blob([arrayBuffer], {type: mime});
      callback(false, blob);
    } catch ( e ) {
      console.warn(e, e.stack);
      callback(e);
    }
  }
  function blobToAb(data, callback) {
    try {
      var r       = new FileReader();
      r.onerror   = function(e) { callback(e);               };
      r.onloadend = function()  { callback(false, r.result); };
      r.readAsArrayBuffer(data);
    } catch ( e ) {
      console.warn(e, e.stack);
      callback(e);
    }
  }
  OSjs.VFS.scandir = function(item, callback, options) {
    if ( arguments.length < 2 ) {
      throw new Error(API._('ERR_VFS_NUM_ARGS'));
    }
    item = checkMetadataArgument(item);
    request(item.path, 'scandir', [item], function(error, response) {
      if ( error ) {
        error = API._('ERR_VFSMODULE_SCANDIR_FMT', error);
      }
      callback(error, response);
    }, options);
  };
  OSjs.VFS.write = function(item, data, callback, options, appRef) {
    if ( arguments.length < 3 ) {
      throw new Error(API._('ERR_VFS_NUM_ARGS'));
    }
    item = checkMetadataArgument(item);
    function _finished(error, result) {
      if ( error ) {
        error = API._('ERR_VFSMODULE_WRITE_FMT', error);
      } else {
        API.message('vfs', {type: 'write', file: item, source: appRef ? appRef.__pid : null});
      }
      callback(error, result);
    }
    function _write(filedata) {
      request(item.path, 'write', [item, filedata], _finished, options);
    }
    function _converted(error, response) {
      if ( error ) {
        _finished(error, null);
        return;
      }
      _write(response);
    }
    if ( typeof data === 'string' ) {
      if ( data.length ) {
        textToAb(data, item.mime, function(error, response) {
          _converted(error, response);
        });
      } else {
        _converted(null, data);
      }
    } else {
      if ( data instanceof OSjs.VFS.FileDataURL ) {
        OSjs.VFS.dataSourceToAb(data.toString(), item.mime, function(error, response) {
          _converted(error, response);
        });
        return;
      } else if ( window.Blob && data instanceof window.Blob ) {
        OSjs.VFS.blobToAb(data, function(error, response) {
          _converted(error, response);
        });
        return;
      }
      _write(data);
    }
  };
  OSjs.VFS.read = function(item, callback, options) {
    if ( arguments.length < 2 ) {
      throw new Error(API._('ERR_VFS_NUM_ARGS'));
    }
    item = checkMetadataArgument(item);
    options = options || {};
    function _finished(error, response) {
      if ( error ) {
        error = API._('ERR_VFSMODULE_READ_FMT', error);
        callback(error);
        return;
      }
      if ( options.type ) {
        var types = {
          datasource: function readToDataSource() {
            OSjs.VFS.abToDataSource(response, item.mime, function(error, dataSource) {
              callback(error, error ? null : dataSource);
            });
          },
          text: function readToText() {
            OSjs.VFS.abToText(response, item.mime, function(error, text) {
              callback(error, error ? null : text);
            });
          },
          blob: function readToBlob() {
            OSjs.VFS.abToBlob(response, item.mime, function(error, blob) {
              callback(error, error ? null : blob);
            });
          }
        };
        var type = options.type.toLowerCase();
        if ( types[type] ) {
          types[type]();
          return;
        }
      }
      callback(error, error ? null : response);
    }
    request(item.path, 'read', [item], function(error, response) {
      if ( error ) {
        _finished(error);
        return;
      }
      _finished(false, response);
    }, options);
  };
  OSjs.VFS.copy = function(src, dest, callback, options, appRef) {
    if ( arguments.length < 3 ) {
      throw new Error(API._('ERR_VFS_NUM_ARGS'));
    }
    src = checkMetadataArgument(src, API._('ERR_VFS_EXPECT_SRC_FILE'));
    dest = checkMetadataArgument(dest, API._('ERR_VFS_EXPECT_DST_FILE'));
    options = Utils.argumentDefaults(options, {
      type: 'binary',
      dialog: null
    });
    options.arrayBuffer = true;
    function dialogProgress(prog) {
      if ( options.dialog ) {
        options.dialog.setProgress(prog);
      }
    }
    function doRequest() {
      function _finished(error, result) {
        if ( !error ) {
          API.message('vfs', {type: 'mkdir', file: dest, source: appRef ? appRef.__pid : null});
        }
        callback(error, result);
      }
      var srcInternal = isInternalModule(src.path);
      var dstInternal = isInternalModule(dest.path);
      var msrc = getModuleFromPath(src.path);
      var mdst = getModuleFromPath(dest.path);
      if ( (srcInternal && dstInternal) || (msrc === mdst) ) {
        var tmp = (msrc === mdst) ? src.path : null;
        request(tmp, 'copy', [src, dest], function(error, response) {
          dialogProgress(100);
          if ( error ) {
            error = API._('ERR_VFSMODULE_COPY_FMT', error);
          }
          _finished(error, response);
        }, options);
      } else {
        OSjs.VFS.Modules[msrc].request('read', [src], function(error, data) {
          dialogProgress(50);
          if ( error ) {
            _finished(API._('ERR_VFS_TRANSFER_FMT', error));
            return;
          }
          dest.mime = src.mime;
          OSjs.VFS.Modules[mdst].request('write', [dest, data], function(error, result) {
            dialogProgress(100);
            if ( error ) {
              error = API._('ERR_VFSMODULE_COPY_FMT', error);
            }
            _finished(error, result);
          }, options);
        }, options);
      }
    }
    existsWrapper(dest, function(error) {
      if ( error ) {
        error = API._('ERR_VFSMODULE_COPY_FMT', error);
        return callback(error);
      }
      doRequest();
    });
  };
  OSjs.VFS.move = function(src, dest, callback, options, appRef) {
    if ( arguments.length < 3 ) {
      throw new Error(API._('ERR_VFS_NUM_ARGS'));
    }
    src = checkMetadataArgument(src, API._('ERR_VFS_EXPECT_SRC_FILE'));
    dest = checkMetadataArgument(dest, API._('ERR_VFS_EXPECT_DST_FILE'));
    var self = this;
    function doRequest() {
      function _finished(error, result) {
        if ( !error ) {
          API.message('vfs', {type: 'move', file: dest, source: appRef ? appRef.__pid : null});
        }
        callback(error, result);
      }
      var srcInternal = isInternalModule(src.path);
      var dstInternal = isInternalModule(dest.path);
      var msrc = getModuleFromPath(src.path);
      var mdst = getModuleFromPath(dest.path);
      if ( (srcInternal && dstInternal) || (msrc === mdst) ) {
        var tmp = (msrc === mdst) ? src.path : null;
        request(tmp, 'move', [src, dest], function(error, response) {
          if ( error ) {
            error = API._('ERR_VFSMODULE_MOVE_FMT', error);
          }
          _finished(error, error ? null : response);
        }, options);
      } else {
        self.copy(src, dest, function(error, result) {
          if ( error ) {
            error = API._('ERR_VFS_TRANSFER_FMT', error);
            return _finished(error);
          }
          OSjs.VFS.Modules[msrc].request('unlink', [src], function(error, result) {
            if ( error ) {
              error = API._('ERR_VFS_TRANSFER_FMT', error);
            }
            _finished(error, result);
          }, options);
        });
      }
    }
    existsWrapper(dest, function(error) {
      if ( error ) {
        error = API._('ERR_VFSMODULE_MOVE_FMT', error);
        return callback(error);
      }
      doRequest();
    });
  };
  OSjs.VFS.rename = function(src, dest, callback) {
    OSjs.VFS.move.apply(this, arguments);
  };
  OSjs.VFS.unlink = function(item, callback, options, appRef) {
    if ( arguments.length < 2 ) {
      throw new Error(API._('ERR_VFS_NUM_ARGS'));
    }
    item = checkMetadataArgument(item);
    function _finished(error, result) {
      if ( error ) {
        error = API._('ERR_VFSMODULE_UNLINK_FMT', error);
      } else {
        API.message('vfs', {type: 'delete', file: item, source: appRef ? appRef.__pid : null});
      }
      callback(error, result);
    }
    request(item.path, 'unlink', [item], _finished, options);
  };
  OSjs.VFS['delete'] = function(item, callback) {
    OSjs.VFS.unlink.apply(this, arguments);
  };
  OSjs.VFS.mkdir = function(item, callback, options, appRef) {
    if ( arguments.length < 2 ) {
      throw new Error(API._('ERR_VFS_NUM_ARGS'));
    }
    item = checkMetadataArgument(item);
    function doRequest() {
      function _finished(error, result) {
        if ( error ) {
          error = API._('ERR_VFSMODULE_MKDIR_FMT', error);
        } else {
          API.message('vfs', {type: 'mkdir', file: item, source: appRef ? appRef.__pid : null});
        }
        callback(error, result);
      }
      request(item.path, 'mkdir', [item], _finished, options);
    }
    existsWrapper(item, function(error) {
      if ( error ) {
        error = API._('ERR_VFSMODULE_MKDIR_FMT', error);
        return callback(error);
      }
      doRequest();
    });
  };
  OSjs.VFS.exists = function(item, callback) {
    if ( arguments.length < 2 ) {
      throw new Error(API._('ERR_VFS_NUM_ARGS'));
    }
    item = checkMetadataArgument(item);
    request(item.path, 'exists', [item], callback);
  };
  OSjs.VFS.fileinfo = function(item, callback) {
    if ( arguments.length < 2 ) {
      throw new Error(API._('ERR_VFS_NUM_ARGS'));
    }
    item = checkMetadataArgument(item);
    request(item.path, 'fileinfo', [item], function(error, response) {
      if ( error ) {
        error = API._('ERR_VFSMODULE_FILEINFO_FMT', error);
      }
      callback(error, response);
    });
  };
  OSjs.VFS.url = function(item, callback) {
    if ( arguments.length < 2 ) {
      throw new Error(API._('ERR_VFS_NUM_ARGS'));
    }
    item = checkMetadataArgument(item);
    request(item.path, 'url', [item], function(error, response) {
      if ( error ) {
        error = API._('ERR_VFSMODULE_URL_FMT', error);
      }
      callback(error, Utils.checkdir(response));
    });
  };
  OSjs.VFS.upload = function(args, callback, options, appRef) {
    args = args || {};
    if ( arguments.length < 2 ) {
      throw new Error(API._('ERR_VFS_NUM_ARGS'));
    }
    if ( !args.files ) {
      throw new Error(API._('ERR_VFS_UPLOAD_NO_FILES'));
    }
    if ( !args.destination ) {
      throw new Error(API._('ERR_VFS_UPLOAD_NO_DEST'));
    }
    function _createFile(filename, mime, size) {
      var npath = (args.destination + '/' + filename).replace(/\/\/\/\/+/, '///');
      return new OSjs.VFS.File({
        filename: filename,
        path: npath,
        mime: mime || 'application/octet-stream',
        size: size
      });
    }
    function _dialogClose(btn, filename, mime, size) {
      if ( btn !== 'ok' && btn !== 'complete' ) {
        callback(false, false);
        return;
      }
      var file = _createFile(filename, mime, size);
      API.message('vfs', {type: 'upload', file: file, source: args.app.__pid});
      callback(false, file);
    }
    if ( !isInternalModule(args.destination) ) {
      args.files.forEach(function(f, i) {
        request(args.destination, 'upload', [f, args.destination], callback, options);
      });
      return;
    }
    function doRequest(f, i) {
      if ( args.app ) {
        API.createDialog('FileUpload', {
          dest: args.destination,
          file: f
        }, _dialogClose, args.win || args.app);
      } else {
        OSjs.VFS.internalUpload(f, args.destination, function(err, result, ev) {
          if ( err ) {
            if ( err === 'canceled' ) {
              callback(API._('ERR_VFS_UPLOAD_CANCELLED'), null, ev);
            } else {
              var errstr = ev ? ev.toString() : 'Unknown reason';
              var msg = API._('ERR_VFS_UPLOAD_FAIL_FMT', errstr);
              callback(msg, null, ev);
            }
          } else {
            var file = _createFile(f.name, f.type, f.size);
            callback(false, file, ev);
          }
        }, options);
      }
    }
    args.files.forEach(function(f, i) {
      var filename = (f instanceof window.File) ? f.name : f.filename;
      var dest = new OSjs.VFS.File(args.destination + '/' + filename);
      existsWrapper(dest, function(error) {
        if ( error ) {
          return callback(error);
        }
        doRequest(f, i);
      }, options);
    });
  };
  OSjs.VFS.download = (function download() {
    var _didx = 1;
    return function(args, callback) {
      args = args || {};
      if ( arguments.length < 2 ) {
        throw new Error(API._('ERR_VFS_NUM_ARGS'));
      }
      if ( !args.path ) {
        throw new Error(API._('ERR_VFS_DOWNLOAD_NO_FILE'));
      }
      args = checkMetadataArgument(args);
      var lname = 'DownloadFile_' + _didx;
      _didx++;
      API.createLoading(lname, {className: 'BusyNotification', tooltip: API._('TOOLTIP_VFS_DOWNLOAD_NOTIFICATION')});
      var dmodule = getModuleFromPath(args.path);
      if ( !isInternalModule(args.path) ) {
        var file = args;
        if ( !(file instanceof OSjs.VFS.File) ) {
          file = new OSjs.VFS.File(args.path);
          if ( args.id ) {
            file.id = args.id;
          }
        }
        OSjs.VFS.Modules[dmodule].request('read', [file], function(error, result) {
          API.destroyLoading(lname);
          if ( error ) {
            callback(API._('ERR_VFS_DOWNLOAD_FAILED', error));
            return;
          }
          callback(false, result);
        });
        return;
      }
      OSjs.VFS.url(args, function(error, url) {
        if ( error ) {
          return callback(error);
        }
        Utils.ajax({
          url: url,
          method: 'GET',
          responseType: 'arraybuffer',
          onsuccess: function(result) {
            API.destroyLoading(lname);
            callback(false, result);
          },
          onerror: function(result) {
            API.destroyLoading(lname);
            callback(error);
          }
        });
      });
    };
  })();
  OSjs.VFS.trash = function(item, callback) {
    if ( arguments.length < 2 ) {
      throw new Error(API._('ERR_VFS_NUM_ARGS'));
    }
    item = checkMetadataArgument(item);
    request(item.path, 'trash', [item], function(error, response) {
      if ( error ) {
        error = API._('ERR_VFSMODULE_TRASH_FMT', error);
      }
      callback(error, response);
    });
  };
  OSjs.VFS.untrash = function(item, callback) {
    if ( arguments.length < 2 ) {
      throw new Error(API._('ERR_VFS_NUM_ARGS'));
    }
    item = checkMetadataArgument(item);
    request(item.path, 'untrash', [item], function(error, response) {
      if ( error ) {
        error = API._('ERR_VFSMODULE_UNTRASH_FMT', error);
      }
      callback(error, response);
    });
  };
  OSjs.VFS.emptyTrash = function(callback) {
    if ( arguments.length < 1 ) {
      throw new Error(API._('ERR_VFS_NUM_ARGS'));
    }
    request(null, 'emptyTrash', [], function(error, response) {
      if ( error ) {
        error = API._('ERR_VFSMODULE_EMPTYTRASH_FMT', error);
      }
      callback(error, response);
    });
  };
  OSjs.VFS.remoteRead = function(url, mime, callback, options) {
    options = options || {};
    options.type = options.type || 'binary';
    mime = options.mime || 'application/octet-stream';
    if ( arguments.length < 1 ) { throw new Error(API._('ERR_VFS_NUM_ARGS')); }
    options = options || {};
    API.curl({
      url: url,
      binary: true,
      mime: mime,
      method: 'POST'
    }, function(error, response) {
      if ( error ) {
        callback(error);
        return;
      }
      if ( !response.body ) {
        callback(API._('ERR_VFS_REMOTEREAD_EMPTY'));
        return;
      }
      if ( options.type.toLowerCase() === 'datasource' ) {
        callback(false, response.body);
        return;
      }
      dataSourceToAb(response.body, mime, function(error, response) {
        if ( options.type === 'text' ) {
          OSjs.VFS.abToText(response, mime, function(error, text) {
            callback(error, text);
          });
          return;
        }
        callback(error, response);
      });
    });
  };
  function createMountpoint(opts, cb) {
    opts = Utils.argumentDefaults(opts, {
      description: 'My VFS Module',
      type: 'internal',
      name: 'MyModule',
      icon: 'places/server.png'
    });
    if ( OSjs.VFS.Modules[opts.name] ) {
      throw new Error(API._('ERR_VFSMODULE_ALREADY_MOUNTED_FMT', opts.name));
    }
    if ( opts.type === 'owndrive' ) {
      opts.type = 'webdav';
    }
    var modulePath = opts.name.replace(/\s/g, '-').toLowerCase() + '://';
    var moduleRoot = modulePath + '/';
    var moduleMatch = createMatch(modulePath);
    var moduleOptions = opts.options || {};
    var module = (function createMountpointModule() {
      var isMounted = true;
      return _createMountpoint({
        readOnly: false,
        description: opts.description,
        visible: true,
        dynamic: true,
        unmount: function(cb) {
          isMounted = false;
          API.message('vfs', {type: 'unmount', module: opts.name, source: null});
          (cb || function() {})(false, true);
          delete OSjs.VFS.Modules[opts.name];
        },
        mounted: function() {
          return isMounted;
        },
        root: moduleRoot,
        icon: opts.icon,
        match: moduleMatch,
        options: moduleOptions,
        request: function(name, args, callback, options) {
          if ( opts.type === 'internal' ) {
            OSjs.VFS.Transports.Internal.request.apply(null, arguments);
          } else if ( opts.type === 'webdav' ) {
            OSjs.VFS.Transports.WebDAV.request.apply(null, arguments);
          } else {
            callback(API._('ERR_VFSMODULE_INVALID_TYPE_FMT', opts.type));
          }
        }
      });
    })();
    var validModule = (function() {
      if ( (['internal', 'webdav']).indexOf(opts.type) < 0 ) {
        return 'No such type \'' + opts.type + '\'';
      }
      if ( opts.type === 'webdav' && !moduleOptions.username ) {
        return 'Connection requires username (authorization)';
      }
      return true;
    })();
    if ( validModule !== true ) {
      throw new Error(API._('ERR_VFSMODULE_INVALID_CONFIG_FMT', validModule));
    }
    OSjs.VFS.Modules[opts.name] = module;
    API.message('vfs', {type: 'mount', module: opts.name, source: null});
    (cb || function() {})(false, true);
  }
  function removeMountpoint(moduleName, cb) {
    if ( !OSjs.VFS.Modules[moduleName] || !OSjs.VFS.Modules[moduleName].dynamic ) {
      throw new Error(API._('ERR_VFSMODULE_NOT_MOUNTED_FMT', moduleName));
    }
    OSjs.VFS.Modules[moduleName].unmount(cb);
  }
  function registerMountpoints() {
    if ( MountsRegistered ) { return; }
    MountsRegistered = true;
    var config = null;
    try {
      config = API.getConfig('VFS.Mountpoints');
    } catch ( e ) {
      console.warn('mountpoints.js initialization error', e, e.stack);
    }
    if ( config ) {
      var points = Object.keys(config);
      points.forEach(function(key) {
        var iter = config[key];
        if ( iter.enabled !== false ) {
          OSjs.VFS.Modules[key] = _createMountpoint({
            readOnly: (typeof iter.readOnly === 'undefined') ? false : (iter.readOnly === true),
            description: iter.description || key,
            icon: iter.icon || 'devices/harddrive.png',
            root: key + ':///',
            visible: true,
            internal: true,
            match: createMatch(key + '://'),
            request: function mountpointRequest() {
              OSjs.VFS.Transports.Internal.request.apply(null, arguments);
            }
          });
        }
      });
    }
  }
  function _createMountpoint(params) {
    return Utils.argumentDefaults(params, {
      unmount: function(cb) {
        (cb || function() {})(API._('ERR_VFS_UNAVAILABLE'), false);
      },
      mounted: function() {
        return true;
      },
      enabled: function() {
        return true;
      }
    });
  }
  OSjs.VFS.internalCall          = internalCall;
  OSjs.VFS.internalUpload        = internalUpload;
  OSjs.VFS.filterScandir         = filterScandir;
  OSjs.VFS.getModules            = getModules;
  OSjs.VFS.getModuleFromPath     = getModuleFromPath;
  OSjs.VFS.isInternalModule      = isInternalModule;
  OSjs.VFS.getRelativeURL        = getRelativeURL;
  OSjs.VFS.getRootFromPath       = getRootFromPath;
  OSjs.VFS.addFormFile           = addFormFile;
  OSjs.VFS.abToBinaryString      = abToBinaryString;
  OSjs.VFS.abToDataSource        = abToDataSource;
  OSjs.VFS.abToText              = abToText;
  OSjs.VFS.textToAb              = textToAb;
  OSjs.VFS.abToBlob              = abToBlob;
  OSjs.VFS.blobToAb              = blobToAb;
  OSjs.VFS.dataSourceToAb        = dataSourceToAb;
  OSjs.VFS._createMountpoint     = _createMountpoint;
  OSjs.VFS.createMountpoint      = createMountpoint;
  OSjs.VFS.removeMountpoint      = removeMountpoint;
  OSjs.VFS.registerMountpoints   = registerMountpoints;
})(OSjs.Utils, OSjs.API);

(function(Utils, API) {
  'use strict';
  OSjs.VFS = OSjs.VFS || {};
  function FileDataURL(dataURL) {
    this.dataURL = dataURL;
  }
  FileDataURL.prototype.toBase64 = function() {
    return this.data.split(',')[1];
  };
  FileDataURL.prototype.toString = function() {
    return this.dataURL;
  };
  function FileMetadata(arg, mime) {
    if ( !arg ) {
      throw new Error(API._('ERR_VFS_FILE_ARGS'));
    }
    this.path     = null;
    this.filename = null;
    this.type     = null;
    this.size     = null;
    this.mime     = null;
    this.id       = null;
    if ( typeof arg === 'object' ) {
      this.setData(arg);
    } else if ( typeof arg === 'string' ) {
      this.path = arg;
      this.setData();
    }
    if ( typeof mime === 'string' ) {
      if ( mime.match(/\//) ) {
        this.mime = mime;
      } else {
        this.type = mime;
      }
    }
  }
  FileMetadata.prototype.setData = function(o) {
    var self = this;
    if ( o ) {
      Object.keys(o).forEach(function(k) {
        if ( k !== '_element' ) {
          self[k] = o[k];
        }
      });
    }
    if ( !this.filename ) {
      this.filename = Utils.filename(this.path);
    }
  };
  FileMetadata.prototype.getData = function() {
    return {
      path: this.path,
      filename: this.filename,
      type: this.type,
      size: this.size,
      mime: this.mime,
      id: this.id
    };
  };
  OSjs.VFS.File        = FileMetadata;
  OSjs.VFS.FileDataURL = FileDataURL;
})(OSjs.Utils, OSjs.API);

(function(Utils, API) {
  'use strict';
  window.OSjs          = window.OSjs          || {};
  OSjs.VFS             = OSjs.VFS             || {};
  OSjs.VFS.Transports  = OSjs.VFS.Transports  || {};
  var internalTransport = {};
  internalTransport.scandir = function(item, callback, options) {
    OSjs.VFS.internalCall('scandir', {path: item.path}, function(error, result) {
      var list = [];
      if ( result ) {
        result = OSjs.VFS.filterScandir(result, options);
        result.forEach(function(iter) {
          list.push(new OSjs.VFS.File(iter));
        });
      }
      callback(error, list);
    });
  };
  internalTransport.write = function(item, data, callback, options) {
    options = options || {};
    options.onprogress = options.onprogress || function() {};
    function _write(dataSource) {
      var wopts = {path: item.path, data: dataSource};
      OSjs.VFS.internalCall('write', wopts, callback, options);
    }
    if ( typeof data === 'string' && !data.length ) {
      _write(data);
      return;
    }
    OSjs.VFS.abToDataSource(data, item.mime, function(error, dataSource) {
      if ( error ) {
        callback(error);
        return;
      }
      _write(dataSource);
    });
  };
  internalTransport.read = function(item, callback, options) {
    if ( API.getConfig('Connection.Type') === 'nw' ) {
      OSjs.Core.getHandler().nw.request(true, 'read', {
        path: item.path,
        options: {raw: true}
      }, function(err, res) {
        callback(err, res);
      });
      return;
    }
    OSjs.VFS.internalCall('get', {path: item.path}, callback, options);
  };
  internalTransport.copy = function(src, dest, callback) {
    OSjs.VFS.internalCall('copy', {src: src.path, dest: dest.path}, callback);
  };
  internalTransport.move = function(src, dest, callback) {
    OSjs.VFS.internalCall('move', {src: src.path, dest: dest.path}, callback);
  };
  internalTransport.unlink = function(item, callback) {
    OSjs.VFS.internalCall('delete', {path: item.path}, callback);
  };
  internalTransport.mkdir = function(item, callback) {
    OSjs.VFS.internalCall('mkdir', {path: item.path}, callback);
  };
  internalTransport.exists = function(item, callback) {
    OSjs.VFS.internalCall('exists', {path: item.path}, callback);
  };
  internalTransport.fileinfo = function(item, callback) {
    OSjs.VFS.internalCall('fileinfo', {path: item.path}, callback);
  };
  internalTransport.url = function(item, callback) {
    callback(false, OSjs.VFS.Transports.Internal.path(item));
  };
  internalTransport.trash = function(item, callback) {
    callback(API._('ERR_VFS_UNAVAILABLE'));
  };
  internalTransport.untrash = function(item, callback) {
    callback(API._('ERR_VFS_UNAVAILABLE'));
  };
  internalTransport.emptyTrash = function(item, callback) {
    callback(API._('ERR_VFS_UNAVAILABLE'));
  };
  function makeRequest(name, args, callback, options) {
    args = args || [];
    callback = callback || {};
    if ( !internalTransport[name] ) {
      throw new Error('Invalid Internal API call name');
    }
    var fargs = args;
    fargs.push(callback);
    fargs.push(options);
    internalTransport[name].apply(internalTransport, fargs);
  }
  function makePath(item) {
    if ( typeof item === 'string' ) {
      item = new OSjs.VFS.File(item);
    }
    return OSjs.Core.getHandler().getVFSPath(item);
  }
  OSjs.VFS.Transports.Internal = {
    request: makeRequest,
    path: makePath
  };
})(OSjs.Utils, OSjs.API);

(function(Utils, API) {
  'use strict';
  window.OSjs          = window.OSjs          || {};
  OSjs.VFS             = OSjs.VFS             || {};
  OSjs.VFS.Transports  = OSjs.VFS.Transports  || {};
  function getModule(item) {
    var module = OSjs.VFS.getModuleFromPath(item.path);
    if ( !module || !OSjs.VFS.Modules[module] ) {
      throw new Error(API._('ERR_VFSMODULE_INVALID_FMT', module));
    }
    return OSjs.VFS.Modules[module];
  }
  function getNamespace(item) {
    var module = getModule(item);
    return module.options.ns || 'DAV:';
  }
  function getCORSAllowed(item) {
    var module = getModule(item);
    var val = module.options.cors;
    return typeof val === 'undefined' ? false : val === true;
  }
  function getURL(item) {
    if ( typeof item === 'string' ) {
      item = new OSjs.VFS.File(item);
    }
    var module = getModule(item);
    var opts = module.options;
    return Utils.parseurl(opts.host, {username: opts.username, password: opts.password}).url;
  }
  function getURI(item) {
    var module = getModule(item);
    return Utils.parseurl(module.options.host).path;
  }
  function resolvePath(item) {
    var module = getModule(item);
    return item.path.replace(module.match, '');
  }
  function davCall(method, args, callback, raw) {
    function parseDocument(body) {
      var parser = new DOMParser();
      var doc = parser.parseFromString(body, 'application/xml');
      return doc.firstChild;
    }
    function getUrl(p, f) {
      var url = getURL(p);
      url += resolvePath(f).replace(/^\//, '');
      return url;
    }
    var mime = args.mime || 'application/octet-stream';
    var headers = {};
    var sourceFile = new OSjs.VFS.File(args.path, mime);
    var sourceUrl = getUrl(args.path, sourceFile);
    var destUrl = null;
    if ( args.dest ) {
      destUrl = getUrl(args.dest, new OSjs.VFS.File(args.dest, mime));
      headers.Destination = destUrl;
    }
    function externalCall() {
      var opts = {
        url: sourceUrl,
        method: method,
        requestHeaders: headers
      };
      if ( raw ) {
        opts.binary = true;
        opts.mime = mime;
      }
      if ( typeof args.data !== 'undefined' ) {
        opts.query = args.data;
      }
      API.call('curl', opts, function(error, result) {
        if ( error ) {
          callback(error);
          return;
        }
        if ( !result ) {
          callback(API._('ERR_VFS_REMOTEREAD_EMPTY'));
          return;
        }
        if ( ([200, 201, 203, 204, 205, 207]).indexOf(result.httpCode) < 0 ) {
          callback(API._('ERR_VFSMODULE_XHR_ERROR') + ': ' + result.httpCode);
          return;
        }
        if ( opts.binary ) {
          OSjs.VFS.dataSourceToAb(result.body, mime, callback);
        } else {
          var doc = parseDocument(result.body);
          callback(false, doc);
        }
      }, function(err) {
        callback(err);
      });
    }
    if ( getCORSAllowed(sourceFile) ) {
      OSjs.VFS.internalCall('get', {url: sourceUrl, method: method}, callback);
    } else {
      externalCall();
    }
  }
  var davTransport = {};
  davTransport.scandir = function(item, callback, options) {
    function parse(doc) {
      var ns = getNamespace(item);
      var list = [];
      var reqpath = resolvePath(item);
      var root = OSjs.VFS.getRootFromPath(item.path);
      if ( item.path !== root ) {
        list.push({
          path: root,
          filename: '..',
          type: 'dir'
        });
      }
      doc.children.forEach(function(c) {
        var type = 'file';
        function getPath() {
          var path = c.getElementsByTagNameNS(ns, 'href')[0].textContent;
          return path.substr(getURI(item).length - 1, path.length);
        }
        function getId() {
          var id = null;
          try {
            id = c.getElementsByTagNameNS(ns, 'getetag')[0].textContent;
          } catch ( e ) {
          }
          return id;
        }
        function getMime() {
          var mime = null;
          if ( type === 'file' ) {
            try {
              mime = c.getElementsByTagNameNS(ns, 'getcontenttype')[0].textContent || 'application/octet-stream';
            } catch ( e ) {
              mime = 'application/octet-stream';
            }
          }
          return mime;
        }
        function getSize() {
          var size = 0;
          if ( type === 'file' ) {
            try {
              size = parseInt(c.getElementsByTagNameNS(ns, 'getcontentlength')[0].textContent, 10) || 0;
            } catch ( e ) {
            }
          }
          return size;
        }
        var path = getPath();
        if ( path.match(/\/$/) ) {
          type = 'dir';
          path = path.replace(/\/$/, '') || '/';
        }
        if ( path !== reqpath ) {
          list.push({
            id: getId(),
            path: root + path.replace(/^\//, ''),
            filename: Utils.filename(path),
            size: getSize(),
            mime: getMime(),
            type: type
          });
        }
      });
      return OSjs.VFS.filterScandir(list, options);
    }
    davCall('PROPFIND', {path: item.path}, function(error, doc) {
      var list = [];
      if ( !error && doc ) {
        var result = parse(doc);
        result.forEach(function(iter) {
          list.push(new OSjs.VFS.File(iter));
        });
      }
      callback(error, list);
    });
  };
  davTransport.write = function(item, data, callback, options) {
    davCall('PUT', {path: item.path, mime: item.mime, data: data}, callback);
  };
  davTransport.read = function(item, callback, options) {
    davCall('GET', {path: item.path, mime: item.mime}, callback, true);
  };
  davTransport.copy = function(src, dest, callback) {
    davCall('COPY', {path: src.path, dest: dest.path}, callback);
  };
  davTransport.move = function(src, dest, callback) {
    davCall('MOVE', {path: src.path, dest: dest.path}, callback);
  };
  davTransport.unlink = function(item, callback) {
    davCall('DELETE', {path: item.path}, callback);
  };
  davTransport.mkdir = function(item, callback) {
    davCall('MKCOL', {path: item.path}, callback);
  };
  davTransport.exists = function(item, callback) {
    davCall('PROPFIND', {path: item.path}, function(error, doc) {
      callback(false, !error);
    });
  };
  davTransport.fileinfo = function(item, callback, options) {
    callback(API._('ERR_VFS_UNAVAILABLE'));
  };
  davTransport.url = function(item, callback, options) {
    callback(false, OSjs.VFS.Transports.WebDAV.path(item));
  };
  davTransport.trash = function(item, callback) {
    callback(API._('ERR_VFS_UNAVAILABLE'));
  };
  davTransport.untrash = function(item, callback) {
    callback(API._('ERR_VFS_UNAVAILABLE'));
  };
  davTransport.emptyTrash = function(item, callback) {
    callback(API._('ERR_VFS_UNAVAILABLE'));
  };
  function makeRequest(name, args, callback, options) {
    args = args || [];
    callback = callback || {};
    if ( !davTransport[name] ) {
      throw new Error(API._('ERR_VFSMODULE_INVALID_METHOD_FMT', name));
    }
    var fargs = args;
    fargs.push(callback);
    fargs.push(options);
    davTransport[name].apply(davTransport, fargs);
  }
  function makePath(item) {
    if ( typeof item === 'string' ) {
      item = new OSjs.VFS.File(item);
    }
    var url      = getURL(item);
    var reqpath  = resolvePath(item).replace(/^\//, '');
    var fullpath = url + reqpath;
    if ( !getCORSAllowed(item) ) {
      fullpath = API.getConfig('Connection.FSURI') + '/get/' + fullpath;
    }
    return fullpath;
  }
  OSjs.VFS.Transports.WebDAV = {
    request: makeRequest,
    path: makePath
  };
})(OSjs.Utils, OSjs.API);

(function(Utils, API) {
  'use strict';
  window.OSjs       = window.OSjs       || {};
  OSjs.VFS          = OSjs.VFS          || {};
  OSjs.VFS.Modules  = OSjs.VFS.Modules  || {};
  function makeRequest(name, args, callback, options) {
    args = args || [];
    callback = callback || {};
    function getFiles() {
      var metadata = OSjs.Core.getPackageManager().getPackages();
      var files = [];
      Object.keys(metadata).forEach(function(m) {
        var iter = metadata[m];
        if ( iter.type !== 'extension' ) {
          files.push(new OSjs.VFS.File({
            filename: iter.name,
            icon: {
              filename: iter.icon,
              application: m
            },
            type: 'application',
            path: 'applications:///' + m,
            mime: 'osjs/application'
          }, 'osjs/application'));
        }
      });
      return files;
    }
    if ( name === 'scandir' ) {
      var files = getFiles();
      callback(false, files);
      return;
    }
    return callback(API._('ERR_VFS_UNAVAILABLE'));
  }
  OSjs.VFS.Modules.Apps = OSjs.VFS.Modules.Apps || OSjs.VFS._createMountpoint({
    readOnly: true,
    description: 'Applications',
    root: 'applications:///',
    match: /^applications\:\/\//,
    icon: 'places/user-bookmarks.png',
    special: true,
    visible: true,
    internal: true,
    request: makeRequest
  });
})(OSjs.Utils, OSjs.API);

(function(Utils, API) {
  'use strict';
  window.OSjs       = window.OSjs       || {};
  OSjs.VFS          = OSjs.VFS          || {};
  OSjs.VFS.Modules  = OSjs.VFS.Modules  || {};
  var OSjsStorage = {};
  OSjsStorage.url = function(item, callback) {
    var root = window.location.pathname || '/';
    if ( root === '/' || window.location.protocol === 'file:' ) {
      root = '';
    }
    var url = item.path.replace(OSjs.VFS.Modules.OSjs.match, root);
    callback(false, url);
  };
  function makeRequest(name, args, callback, options) {
    args = args || [];
    callback = callback || {};
    var restricted = ['write', 'copy', 'move', 'unlink', 'mkdir', 'exists', 'fileinfo', 'trash', 'untrash', 'emptyTrash'];
    if ( OSjsStorage[name] ) {
      var fargs = args;
      fargs.push(callback);
      fargs.push(options);
      return OSjsStorage[name].apply(OSjsStorage, fargs);
    } else if ( restricted.indexOf(name) !== -1 ) {
      return callback(API._('ERR_VFS_UNAVAILABLE'));
    }
    OSjs.VFS.Transports.Internal.request.apply(null, arguments);
  }
  OSjs.VFS.Modules.OSjs = OSjs.VFS.Modules.OSjs || OSjs.VFS._createMountpoint({
    readOnly: true,
    description: 'OS.js',
    root: 'osjs:///',
    match: /^osjs\:\/\//,
    icon: 'devices/harddrive.png',
    visible: true,
    internal: true,
    request: makeRequest
  });
})(OSjs.Utils, OSjs.API);

(function(Utils, API) {
  'use strict';
  window.OSjs           = window.OSjs       || {};
  OSjs.VFS              = OSjs.VFS          || {};
  OSjs.VFS.Modules      = OSjs.VFS.Modules  || {};
  OSjs.VFS.Modules.User = OSjs.VFS.Modules.User || OSjs.VFS._createMountpoint({
    readOnly: false,
    description: 'Home',
    root: 'home:///',
    icon: 'places/folder_home.png',
    match: /^home\:\/\//,
    visible: true,
    internal: true,
    request: OSjs.VFS.Transports.Internal.request
  });
})(OSjs.Utils, OSjs.API);

(function(Utils, VFS, API) {
  'use strict';
  window.OSjs       = window.OSjs       || {};
  OSjs.Helpers      = OSjs.Helpers      || {};
  function filter(from, index, shrt, toindex) {
    var list = [];
    for ( var i = (shrt ? 0 : toindex); i < from.length; i++ ) {
      list.push(from[i]);
    }
    return list;
  }
  function format(fmt, date) {
    var utc;
    if ( typeof fmt === 'undefined' || !fmt ) {
      fmt = ExtendedDate.config.defaultFormat;
    } else {
      if ( typeof fmt !== 'string' ) {
        utc = fmt.utc;
        fmt = fmt.format;
      } else {
        utc = ExtendedDate.config.utc;
      }
    }
    return formatDate(date, fmt, utc);
  }
  function _now(now) {
    return now ? (now instanceof ExtendedDate ? now.date : now) : new Date();
  }
  function _y(y, now) {
    return (typeof y === 'undefined' || y === null || y < 0 ) ? now.getFullYear() : y;
  }
  function _m(m, now) {
    return (typeof m === 'undefined' || m === null || m < 0 ) ? now.getMonth() : m;
  }
  function ExtendedDate(date) {
    if ( date ) {
      if ( date instanceof Date ) {
        this.date = date;
      } else if ( date instanceof ExtendedDate ) {
        this.date = date.date;
      } else if ( typeof date === 'string' ) {
        this.date = new Date(date);
      }
    }
    if ( !this.date ) {
      this.date = new Date();
    }
  }
  ExtendedDate.config = {
    defaultFormat: 'isoDateTime'
  };
  ExtendedDate.dayNames = [
    'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat',
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ];
  ExtendedDate.monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'
  ];
  var methods = [
    'UTC',
    'toString',
    'now',
    'parse',
    'getDate',
    'getDay',
    'getFullYear',
    'getHours',
    'getMilliseconds',
    'getMinutes',
    'getMonth',
    'getSeconds',
    'getTime',
    'getTimezoneOffset',
    'getUTCDate',
    'getUTCDay',
    'getUTCFullYear',
    'getUTCHours',
    'getUTCMilliseconds',
    'getUTCMinutes',
    'getUTCMonth',
    'getUTCSeconds',
    'getYear',
    'setDate',
    'setFullYear',
    'setHours',
    'setMilliseconds',
    'setMinutes',
    'setMonth',
    'setSeconds',
    'setTime',
    'setUTCDate',
    'setUTCFullYear',
    'setUTCHours',
    'setUTCMilliseconds',
    'setUTCMinutes',
    'setUTCMonth',
    'setUTCSeconds',
    'setYear',
    'toDateString',
    'toGMTString',
    'toISOString',
    'toJSON',
    'toLocaleDateString',
    'toLocaleFormat',
    'toLocaleString',
    'toLocaleTimeString',
    'toSource',
    'toString',
    'toTimeString',
    'toUTCString',
    'valueOf'
  ];
  methods.forEach(function(m) {
    ExtendedDate.prototype[m] = function() {
      return this.date[m].apply(this.date, arguments);
    };
  });
  ExtendedDate.prototype.get = function() {
    return this.date;
  };
  ExtendedDate.prototype.format = function(fmt) {
    return ExtendedDate.format(this, fmt);
  };
  ExtendedDate.prototype.getFirstDayInMonth = function(fmt) {
    return ExtendedDate.getFirstDayInMonth(fmt, null, null, this);
  };
  ExtendedDate.prototype.getLastDayInMonth = function(fmt) {
    return ExtendedDate.getLastDayInMonth(fmt, null, null, this);
  };
  ExtendedDate.prototype.getDaysInMonth = function() {
    return ExtendedDate.getDaysInMonth(null, null, this);
  };
  ExtendedDate.prototype.getWeekNumber = function() {
    return ExtendedDate.getWeekNumber(this);
  };
  ExtendedDate.prototype.isWithinMonth = function(from, to) {
    return ExtendedDate.isWithinMonth(this, from, to);
  };
  ExtendedDate.prototype.getDayOfTheYear = function() {
    return ExtendedDate.getDayOfTheYear();
  };
  ExtendedDate.format = function(date, fmt) {
    return format(fmt, date);
  };
  ExtendedDate.getPreviousMonth = function(now) {
    now = now ? (now instanceof ExtendedDate ? now.date : now) : new Date();
    var current;
    if (now.getMonth() === 0) {
      current = new Date(now.getFullYear() - 1, 11, now.getDate());
    } else {
      current = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    }
    return new ExtendedDate(current);
  };
  ExtendedDate.getNextMonth = function(now) {
    now = now ? (now instanceof ExtendedDate ? now.date : now) : new Date();
    var current;
    if (now.getMonth() === 11) {
      current = new Date(now.getFullYear() + 1, 0, now.getDate());
    } else {
      current = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
    }
    return new ExtendedDate(current);
  };
  ExtendedDate.getFirstDayInMonth = function(fmt, y, m, now) {
    now = _now(now);
    y = _y(y, now);
    m = _m(m, now);
    var date = new Date();
    date.setFullYear(y, m, 1);
    if ( fmt === true ) {
      return date.getDate();
    }
    return fmt ? format(fmt, date) : new ExtendedDate(date);
  };
  ExtendedDate.getLastDayInMonth = function(fmt, y, m, now) {
    now = _now(now);
    y = _y(y, now);
    m = _m(m, now);
    var date = new Date();
    date.setFullYear(y, m, 0);
    if ( fmt === true ) {
      return date.getDate();
    }
    return fmt ? format(fmt, date) : new ExtendedDate(date);
  };
  ExtendedDate.getDaysInMonth = function(y, m, now) {
    now = _now(now);
    y = _y(y, now);
    m = _m(m, now);
    var date = new Date();
    date.setFullYear(y, m, 0);
    return parseInt(date.getDate(), 10);
  };
  ExtendedDate.getWeekNumber = function(now) {
    now = now ? (now instanceof ExtendedDate ? now.date : now) : new Date();
    var d = new Date(+now);
    d.setHours(0,0,0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    return Math.ceil((((d - new Date(d.getFullYear(),0,1)) / 8.64e7) + 1) / 7);
  };
  ExtendedDate.getDayName = function(index, shrt) {
    if ( index < 0 || index === null || typeof index === 'undefined' ) {
      return filter(ExtendedDate.dayNames, index, shrt, 7);
    }
    shrt = shrt ? 0 : 1;
    var idx = index + (shrt + 7);
    return ExtendedDate.dayNames[idx];
  };
  ExtendedDate.getMonthName = function(index, shrt) {
    if ( index < 0 || index === null || typeof index === 'undefined' ) {
      return filter(ExtendedDate.monthNames, index, shrt, 12);
    }
    shrt = shrt ? 0 : 1;
    var idx = index + (shrt + 12);
    return ExtendedDate.monthNames[idx];
  };
  ExtendedDate.isWithinMonth = function(now, from, to) {
    if ( now.getFullYear() >= from.getFullYear() && now.getMonth() >= from.getMonth() ) {
      if ( now.getFullYear() <= to.getFullYear() && now.getMonth() <= to.getMonth() ) {
        return true;
      }
    }
    return false;
  };
  ExtendedDate.getDayOfTheYear = function() {
    var now = new Date();
    var start = new Date(now.getFullYear(), 0, 0);
    var diff = now - start;
    var oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
  };
  function formatDate(date, format, utc) {
    utc = utc === true;
    function pad(val, len) {
      val = String(val);
      len = len || 2;
      while (val.length < len) {
        val = '0' + val;
      }
      return val;
    }
    var defaultFormats = {
      'default':      'Y-m-d H:i:s',
      shortDate:      'm/d/y',
      mediumDate:     'M d, Y',
      longDate:       'F d, Y',
      fullDate:       'l, F d, Y',
      shortTime:      'h:i A',
      mediumTime:     'h:i:s A',
      longTime:       'h:i:s A T',
      isoDate:        'Y-m-d',
      isoTime:        'H:i:s',
      isoDateTime:    'Y-m-d H:i:s'
    };
    format = defaultFormats[format] || format;
    if ( !(date instanceof ExtendedDate) ) {
      date = new ExtendedDate(date);
    }
    var map = {
      d: function(s) { return pad(map.j(s)); },
      D: function(s) { return ExtendedDate.dayNames[utc ? date.getUTCDay() : date.getDay()]; },
      j: function(s) { return (utc ? date.getUTCDate() : date.getDate()); },
      l: function(s) { return ExtendedDate.dayNames[(utc ? date.getUTCDay() : date.getDay()) + 7]; },
      w: function(s) { return (utc ? date.getUTCDay() : date.getDay()); },
      z: function(s) { return date.getDayOfTheYear(); },
      S: function(s) {
        var d = utc ? date.getUTCDate() : date.getDate();
        return ['th', 'st', 'nd', 'rd'][d % 10 > 3 ? 0 : (d % 100 - d % 10 !== 10) * d % 10];
      },
      W: function(s) { return date.getWeekNumber(); },
      F: function(s) { return ExtendedDate.monthNames[(utc ? date.getUTCMonth() : date.getMonth()) + 12]; },
      m: function(s) { return pad(map.n(s)); },
      M: function(s) { return ExtendedDate.monthNames[(utc ? date.getUTCMonth() : date.getMonth())]; },
      n: function(s) { return (utc ? date.getUTCMonth() : date.getMonth()) + 1; },
      t: function(s) { return date.getDaysInMonth(); },
      Y: function(s) { return (utc ? date.getUTCFullYear() : date.getFullYear()); },
      y: function(s) { return String(map.Y(s)).slice(2); },
      a: function(s) { return map.G(s) < 12 ? 'am' : 'pm'; },
      A: function(s) { return map.a(s).toUpperCase(); },
      g: function(s) { return map.G(s) % 12 || 12; },
      G: function(s) { return (utc ? date.getUTCHours() : date.getHours()); },
      h: function(s) { return pad(map.g(s)); },
      H: function(s) { return pad(map.G(s)); },
      i: function(s) { return pad(utc ? date.getUTCMinutes() : date.getMinutes()); },
      s: function(s) { return pad(utc ? date.getUTCSeconds() : date.getSeconds()); },
      O: function(s) {
        var tzo = -date.getTimezoneOffset(),
            dif = tzo >= 0 ? '+' : '-',
            ppad = function(num) {
              var norm = Math.abs(Math.floor(num));
              return (norm < 10 ? '0' : '') + norm;
            };
        var str = dif + ppad(tzo / 60) + ':' + ppad(tzo % 60);
        return str;
      },
      T: function(s) {
        var timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g,
            timezoneClip = /(\+|\-)[0-9]+$/;
        if ( utc ) { return 'UTC'; }
        var zones = String(date.date).match(timezone) || [''];
        return zones.pop().replace(timezoneClip, '');
      },
      U: function(s) { return date.getTime(); }
    };
    var result = [];
    format.split('').forEach(function(s) {
      result.push(map[s] ? map[s]() : s);
    });
    return result.join('');
  }
  OSjs.Helpers.Date = ExtendedDate;
})(OSjs.Utils, OSjs.VFS, OSjs.API);

(function(Application, Window, Utils, VFS, GUI) {
  'use strict';
  window.OSjs       = window.OSjs       || {};
  OSjs.Helpers      = OSjs.Helpers      || {};
  var IFRAME_COUNT = 0;
  var IFrameApplicationWindow = function(name, opts, app) {
    opts = Utils.argumentDefaults(opts, {
      src: 'about:blank',
      focus: function() {},
      blur: function() {},
      icon: null,
      title: 'IframeApplicationWindow',
      width: 320,
      height: 240,
      allow_resize: false,
      allow_restore: false,
      allow_maximize: false
    });
    Window.apply(this, ['IFrameApplicationWindow', opts, app]);
    this._iwin = null;
    this._frame = null;
  };
  IFrameApplicationWindow.prototype = Object.create(Window.prototype);
  IFrameApplicationWindow.prototype.destroy = function() {
    this.postMessage('Window::destroy');
    return Window.prototype.destroy.apply(this, arguments);
  };
  IFrameApplicationWindow.prototype.init = function(wmRef, app) {
    var self = this;
    var root = Window.prototype.init.apply(this, arguments);
    root.style.overflow = 'visible';
    var id = 'IframeApplicationWindow' + IFRAME_COUNT.toString();
    var iframe = document.createElement('iframe');
    iframe.setAttribute('border', 0);
    iframe.id = id;
    iframe.className = 'IframeApplicationFrame';
    iframe.addEventListener('load', function() {
      self._iwin = iframe.contentWindow;
      self.postMessage('Window::init');
    });
    this.setLocation(this._opts.src, iframe);
    root.appendChild(iframe);
    this._frame = iframe;
    try {
      this._iwin = iframe.contentWindow;
    } catch ( e ) {}
    if ( this._iwin ) {
      this._iwin.focus();
    }
    this._frame.focus();
    this._opts.focus(this._frame, this._iwin);
    IFRAME_COUNT++;
    return root;
  };
  IFrameApplicationWindow.prototype._blur = function() {
    if ( Window.prototype._blur.apply(this, arguments) ) {
      if ( this._iwin ) {
        this._iwin.blur();
      }
      if ( this._frame ) {
        this._frame.blur();
      }
      this._opts.blur(this._frame, this._iwin);
      return true;
    }
    return false;
  };
  IFrameApplicationWindow.prototype._focus = function() {
    if ( Window.prototype._focus.apply(this, arguments) ) {
      if ( this._iwin ) {
        this._iwin.focus();
      }
      if ( this._frame ) {
        this._frame.focus();
      }
      this._opts.focus(this._frame, this._iwin);
      return true;
    }
    return false;
  };
  IFrameApplicationWindow.prototype.postMessage = function(message) {
    if ( this._iwin && this._app ) {
      this._iwin.postMessage({
        message: message,
        pid: this._app.__pid,
        wid: this._wid
      }, window.location.href);
    }
  };
  IFrameApplicationWindow.prototype.onPostMessage = function(message, ev) {
  };
  IFrameApplicationWindow.prototype.setLocation = function(src, iframe) {
    iframe = iframe || this._frame;
    var oldbefore = window.onbeforeunload;
    window.onbeforeunload = null;
    iframe.src = src;
    window.onbeforeunload = oldbefore;
  };
  var IFrameApplication = function(name, args, metadata, opts) {
    Application.call(this, name, args, metadata);
    this.options = Utils.argumentDefaults(opts, {
      icon: '',
      title: 'IframeApplicationWindow'
    });
    this.options.src = OSjs.API.getApplicationResource(this, this.options.src);
  };
  IFrameApplication.prototype = Object.create(Application.prototype);
  IFrameApplication.prototype.init = function(settings, metadata) {
    Application.prototype.init.apply(this, arguments);
    var name = this.__pname + 'Window';
    this._addWindow(new IFrameApplicationWindow(name, this.options, this), null, true);
  };
  IFrameApplication.prototype.onPostMessage = function(message, ev) {
  };
  IFrameApplication.prototype.postMessage = function(message) {
    var win = this._getMainWindow();
    if ( win ) {
      win.postMessage(message);
    }
  };
  OSjs.Helpers.IFrameApplication       = IFrameApplication;
  OSjs.Helpers.IFrameApplicationWindow = IFrameApplicationWindow;
})(OSjs.Core.Application, OSjs.Core.Window, OSjs.Utils, OSjs.VFS, OSjs.GUI);

(function(Application, Window, Utils, VFS, API, GUI) {
  'use strict';
  window.OSjs       = window.OSjs       || {};
  OSjs.Helpers      = OSjs.Helpers      || {};
  function DefaultApplication(name, args, metadata, opts) {
    this.defaultOptions = Utils.argumentDefaults(opts, {
      readData: true,
      rawData: false,
      extension: '',
      mime: 'application/octet-stream',
      filetypes: [],
      filename: 'New file'
    });
    Application.apply(this, [name, args, metadata]);
  }
  DefaultApplication.prototype = Object.create(Application.prototype);
  DefaultApplication.constructor = Application;
  DefaultApplication.prototype.destroy = function() {
    Application.prototype.destroy.apply(this, arguments);
  };
  DefaultApplication.prototype.init = function(settings, metadata, onLoaded) {
    Application.prototype.init.call(this, settings, metadata);
    var self = this;
    var url = API.getApplicationResource(this, './scheme.html');
    var file = this._getArgument('file');
    var scheme = GUI.createScheme(url);
    scheme.load(function(error, result) {
      if ( error ) {
        console.error('DefaultApplication::init()', 'Scheme::load()', error, self);
      } else {
        onLoaded(scheme, file);
      }
    });
    this._setScheme(scheme);
  };
  DefaultApplication.prototype._onMessage = function(obj, msg, args) {
    Application.prototype._onMessage.apply(this, arguments);
    var self = this;
    var current = this._getArgument('file');
    var win = this._getWindow(this.__mainwindow);
    if ( msg === 'vfs' && args.source !== null && args.source !== this.__pid && args.file ) {
      if ( win && current && current.path === args.file.path ) {
        win._toggleDisabled(true);
        API.createDialog('Confirm', {
          buttons: ['yes', 'no'],
          message: API._('MSG_FILE_CHANGED')
        }, function(ev, button) {
          win._toggleDisabled(false);
          if ( button === 'ok' || button === 'yes' ) {
            self.openFile(new VFS.File(args.file), win);
          }
        }, win);
      }
    }
  };
  DefaultApplication.prototype.openFile = function(file, win) {
    var self = this;
    if ( !file ) { return; }
    function onError(error) {
      if ( error ) {
        API.error(self.__label,
                  API._('ERR_FILE_APP_OPEN'),
                  API._('ERR_FILE_APP_OPEN_ALT_FMT',
                  file.path));
        return true;
      }
      return false;
    }
    function onDone(result) {
      self._setArgument('file', file);
      win.showFile(file, result);
    }
    var check = this.__metadata.mime || [];
    if ( !Utils.checkAcceptMime(file.mime, check) ) {
      API.error(this.__label,
                API._('ERR_FILE_APP_OPEN'),
                API._('ERR_FILE_APP_OPEN_FMT',
                file.path, file.mime)
      );
      return false;
    }
    win._toggleLoading(true);
    function vfsCallback(error, result) {
      win._toggleLoading(false);
      if ( onError(error) ) {
        return;
      }
      onDone(result);
    }
    if ( this.defaultOptions.readData ) {
      VFS.read(file, vfsCallback, {type: this.defaultOptions.rawData ? 'binary' : 'text'});
    } else {
      VFS.url(file, vfsCallback);
    }
    return true;
  };
  DefaultApplication.prototype.saveFile = function(file, value, win) {
    var self = this;
    if ( !file ) { return; }
    win._toggleLoading(true);
    VFS.write(file, value || '', function(error, result) {
      win._toggleLoading(false);
      if ( error ) {
        API.error(self.__label,
                  API._('ERR_FILE_APP_SAVE'),
                  API._('ERR_FILE_APP_SAVE_ALT_FMT',
                  file.path));
        return;
      }
      self._setArgument('file', file);
      win.updateFile(file);
    }, {}, this);
  };
  DefaultApplication.prototype.saveDialog = function(file, win, saveAs) {
    var self = this;
    var value = win.getFileData();
    if ( !saveAs ) {
      this.saveFile(file, value, win);
      return;
    }
    win._toggleDisabled(true);
    API.createDialog('File', {
      file: file,
      filename: file ? file.filename : this.defaultOptions.filename,
      filetypes: this.defaultOptions.filetypes,
      filter: this.__metadata.mime,
      extension: this.defaultOptions.extension,
      mime: this.defaultOptions.mime,
      type: 'save'
    }, function(ev, button, result) {
      win._toggleDisabled(false);
      if ( button === 'ok' ) {
        self.saveFile(result, value, win);
      }
    }, win);
  };
  DefaultApplication.prototype.openDialog = function(file, win) {
    var self = this;
    function openDialog() {
      win._toggleDisabled(true);
      API.createDialog('File', {
        file: file,
        filter: self.__metadata.mime
      }, function(ev, button, result) {
        win._toggleDisabled(false);
        if ( button === 'ok' && result ) {
          self.openFile(new VFS.File(result), win);
        }
      }, win);
    }
    win.checkHasChanged(function(discard) {
      if ( discard ) {
        openDialog();
      }
    });
  };
  DefaultApplication.prototype.newDialog = function(path, win) {
    var self = this;
    win.checkHasChanged(function(discard) {
      if ( discard ) {
        self._setArgument('file', null);
        win.showFile(null, null);
      }
    });
  };
  OSjs.Helpers.DefaultApplication       = DefaultApplication;
})(OSjs.Core.Application, OSjs.Core.Window, OSjs.Utils, OSjs.VFS, OSjs.API, OSjs.GUI);

(function(Application, Window, Utils, VFS, API, GUI) {
  'use strict';
  window.OSjs       = window.OSjs       || {};
  OSjs.Helpers      = OSjs.Helpers      || {};
  function DefaultApplicationWindow(name, app, args, scheme, file) {
    Window.apply(this, arguments);
    this.hasClosingDialog = false;
    this.currentFile = file ? new VFS.File(file) : null;
    this.hasChanged = false;
  }
  DefaultApplicationWindow.prototype = Object.create(Window.prototype);
  DefaultApplicationWindow.constructor = Window;
  DefaultApplicationWindow.prototype.destroy = function() {
    Window.prototype.destroy.apply(this, arguments);
    this.currentFile = null;
  };
  DefaultApplicationWindow.prototype.init = function(wm, app, scheme) {
    var root = Window.prototype.init.apply(this, arguments);
    return root;
  };
  DefaultApplicationWindow.prototype._inited = function() {
    var result = Window.prototype._inited.apply(this, arguments);
    var self = this;
    var app = this._app;
    var menuMap = {
      MenuNew:    function() { app.newDialog(self.currentFile, self); },
      MenuSave:   function() { app.saveDialog(self.currentFile, self); },
      MenuSaveAs: function() { app.saveDialog(self.currentFile, self, true); },
      MenuOpen:   function() { app.openDialog(self.currentFile, self); },
      MenuClose:  function() { self._close(); }
    };
    this._scheme.find(this, 'SubmenuFile').on('select', function(ev) {
      if ( menuMap[ev.detail.id] ) { menuMap[ev.detail.id](); }
    });
    this._scheme.find(this, 'MenuSave').set('disabled', true);
    if ( this.currentFile ) {
      if ( !this._app.openFile(this.currentFile, this) ) {
        this.currentFile = null;
      }
    }
    return result;
  };
  DefaultApplicationWindow.prototype._onDndEvent = function(ev, type, item, args) {
    if ( !Window.prototype._onDndEvent.apply(this, arguments) ) { return; }
    if ( type === 'itemDrop' && item ) {
      var data = item.data;
      if ( data && data.type === 'file' && data.mime ) {
        this._app.openFile(new VFS.File(data), this);
      }
    }
  };
  DefaultApplicationWindow.prototype._close = function() {
    var self = this;
    if ( this.hasClosingDialog ) {
      return;
    }
    if ( this.hasChanged ) {
      this.hasClosingDialog = true;
      this.checkHasChanged(function(discard) {
        self.hasClosingDialog = false;
        if ( discard ) {
          self.hasChanged = false; // IMPORTANT
          self._close();
        }
      });
      return;
    }
    Window.prototype._close.apply(this, arguments);
  };
  DefaultApplicationWindow.prototype.checkHasChanged = function(cb) {
    var self = this;
    if ( this.hasChanged ) {
      this._toggleDisabled(true);
      API.createDialog('Confirm', {
        buttons: ['yes', 'no'],
        message: API._('MSG_GENERIC_APP_DISCARD')
      }, function(ev, button) {
        self._toggleDisabled(false);
        cb(button === 'ok' || button === 'yes');
      });
      return;
    }
    cb(true);
  };
  DefaultApplicationWindow.prototype.showFile = function(file, content) {
    this.updateFile(file);
  };
  DefaultApplicationWindow.prototype.updateFile = function(file) {
    this.currentFile = file || null;
    this.hasChanged = false;
    if ( this._scheme && (this._scheme instanceof GUI.Scheme) ) {
      this._scheme.find(this, 'MenuSave').set('disabled', !file);
    }
    if ( file ) {
      this._setTitle(file.filename, true);
    } else {
      this._setTitle();
    }
  };
  DefaultApplicationWindow.prototype.getFileData = function() {
    return null;
  };
  DefaultApplicationWindow.prototype._onKeyEvent = function(ev, type, shortcut) {
    if ( shortcut === 'save' ) {
      this._app.saveDialog(this.currentFile, this, !this.currentFile);
      return false;
    } else if ( shortcut === 'saveas' ) {
      this._app.saveDialog(this.currentFile, this, true);
      return false;
    } else if ( shortcut === 'open' ) {
      this._app.openDialog(this.currentFile, this);
      return false;
    }
    return Window.prototype._onKeyEvent.apply(this, arguments);
  };
  OSjs.Helpers.DefaultApplicationWindow = DefaultApplicationWindow;
})(OSjs.Core.Application, OSjs.Core.Window, OSjs.Utils, OSjs.VFS, OSjs.API, OSjs.GUI);

(function(Utils) {
  'use strict';
  window.OSjs       = window.OSjs       || {};
  OSjs.Helpers      = OSjs.Helpers      || {};
  function SettingsFragment(obj, poolName) {
    this._pool = poolName;
    if ( obj.constructor !== {}.constructor ) {
      throw new Error('SettingsFragment will not work unless you give it a object to manage.');
    }
    this._settings = obj;
  }
  SettingsFragment.prototype.get = function(key) {
    if ( !key ) {
      return this._settings;
    }
    return this._settings[key];
  };
  SettingsFragment.prototype.set = function(key, value, save) {
    if ( key === null ) {
      Utils.mergeObject(this._settings, value);
    } else {
      if ( (['number', 'string']).indexOf(typeof key) >= 0 ) {
        this._settings[key] = value;
      } else {
        console.warn('SettingsFragment::set()', 'expects key to be a valid iter, not', key);
      }
    }
    if (save) {
      OSjs.Core.getSettingsManager().save(this._pool, save);
    }
    OSjs.Core.getSettingsManager().changed(this._pool);
    return this;
  };
  SettingsFragment.prototype.save = function(callback) {
    return OSjs.Core.getSettingsManager().save(this._pool, callback);
  };
  SettingsFragment.prototype.getChained = function() {
    var nestedSetting = this._settings;
    arguments.every(function(key) {
      if (nestedSetting[key]) {
        nestedSetting = nestedSetting[key];
        return true;
      }
      return false;
    });
    return nestedSetting;
  };
  SettingsFragment.prototype.mergeDefaults = function(defaults) {
    Utils.mergeObject(this._settings, defaults, {overwrite: false});
    return this;
  };
  SettingsFragment.prototype.instance = function(key) {
    if (typeof this._settings[key] === 'undefined') {
      throw new Error('The object doesn\'t contain that key. SettingsFragment will not work.');
    }
    return new OSjs.Helpers.SettingsFragment(this._settings[key], this._pool);
  };
  OSjs.Helpers.SettingsFragment = SettingsFragment;
})(OSjs.Utils);
