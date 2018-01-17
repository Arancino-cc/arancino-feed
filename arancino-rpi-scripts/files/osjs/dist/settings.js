(function() {
  window.OSjs = window.OSjs || {}
  OSjs.Core = OSjs.Core || {}
  OSjs.Core.getConfig = (function() {
    var _cache;
    return function() {
      if ( !_cache ) {
        _cache = {
    "Version": "2.0.3-arduino-os",
    "Connection": {
        "Type": "http",
        "Handler": "arduino",
        "RootURI": "",
        "APIURI": "/cgi-bin/osjs-api",
        "FSURI": "/cgi-bin/osjs-fs",
        "MetadataURI": "packages.js",
        "ThemeURI": "themes/styles",
        "SoundURI": "themes/sounds",
        "IconURI": "themes/icons",
        "FontURI": "themes/fonts",
        "PackageURI": "packages",
        "Dist": "dist"
    },
    "Locale": "en_EN",
    "BugReporting": true,
    "VersionAppend": "",
    "ShowQuitWarning": true,
    "ReloadOnShutdown": false,
    "AutoStart": [
        "ArduinoService"
    ],
    "Styles": [
        {
            "name": "material",
            "title": "Material Design",
            "style": {
                "window": {
                    "margin": 34,
                    "border": 0
                }
            }
        }
    ],
    "PackageManager": {
        "UserPackages": "home:///.packages",
        "UserMetadata": "home:///.packages/packages.json"
    },
    "SettingsManager": {
        "VFS": {
            "scandir": {
                "showHiddenFiles": true,
                "showFileExtensions": true,
                "columns": [
                    "filename",
                    "mime",
                    "size"
                ]
            }
        },
        "Wizard": {
            "completed": false
        }
    },
    "VFS": {
        "MaxUploadSize": 1073741824,
        "Home": "home:///",
        "GoogleDrive": {
            "Enabled": false
        },
        "OneDrive": {
            "Enabled": false
        },
        "Dropbox": {
            "Enabled": false
        },
        "Mountpoints": {
            "shared": {
                "enabled": false,
                "description": "Shared",
                "icon": "places/folder-publicshare.png"
            },
            "root": {
                "description": "Arancino Storage"
            }
        }
    },
    "DropboxAPI": {
        "ClientKey": ""
    },
    "GoogleAPI": {
        "ClientId": ""
    },
    "WindowsLiveAPI": {
        "ClientId": ""
    },
    "Fonts": {
        "default": "Karla",
        "list": [
            "Karla",
            "Roboto",
            "Arial",
            "Arial Black",
            "Sans-serif",
            "Serif",
            "Trebuchet MS",
            "Impact",
            "Georgia",
            "Courier New",
            "Comic Sans MS",
            "Monospace",
            "Symbol",
            "Webdings"
        ]
    },
    "Languages": {
        "en_EN": "English",
        "bg_BG": "Bulgarian (Bulgaria)",
        "no_NO": "Norsk (Norwegian)",
        "de_DE": "Deutsch (German)",
        "es_ES": "Spanish (Spain)",
        "fr_FR": "French (France)",
        "ru_RU": "Russian (Russia)",
        "ko_KR": "Korean (한국어)",
        "zh_CN": "Chinese (China)",
        "nl_NL": "Dutch (Nederlands)",
        "pl_PL": "Polski (Poland)",
        "pt_BR": "Portuguese (Brazil)",
        "sk_SK": "Slovak (Slovenčina)",
        "vi_VN": "Vietnamese (Tiếng Việt)",
        "tr_TR": "Turkish(Turkey)",
        "it_IT": "Italiano(Italian)",
        "fa_FA": "Farsi(Persian)"
    },
    "WM": {
        "exec": "CoreWM",
        "args": {
            "defaults": {
                "theme": "material",
                "icon": "arduino.png",
                "wallpaper": "osjs:///themes/wallpapers/arduino-infinite-boards.jpg",
                "backgroundColor": "#ebebeb",
                "icons": "default",
                "sounds": "default",
                "background": "image-center",
                "enableSounds": false
            }
        }
    },
    "Icons": {
        "default": "Default (Gnome)"
    },
    "Sounds": {},
    "MIME": {
        "descriptions": {
            "image/bmp": "Bitmap Image",
            "image/gif": "GIF Image",
            "image/jpeg": "JPEG Image",
            "image/jpg": "JPEG Image",
            "image/png": "PNG Image",
            "text/plain": "Text Document",
            "text/css": "Cascade Stylesheet",
            "text/html": "HTML Document",
            "text/xml": "XML Document",
            "application/javascript": "JavaScript Document",
            "application/json": "JSON Document",
            "application/x-python": "Python Document",
            "application/x-lua": "Lua Document",
            "application/x-shellscript": "Shell Script",
            "text/x-c": "C Document",
            "text/x-cplusplus": "C++ Document",
            "application/pdf": "PDF Document",
            "application/zip": "ZIP Archive",
            "audio/aac": "AAC Audio",
            "audio/mp4": "MP4 Audio",
            "audio/mpeg": "MPEG Audio",
            "audio/ogg": "OGG Audio",
            "audio/wav": "WAV Audio",
            "audio/webm": "WEBM Audio",
            "video/mp4": "MP4 Video",
            "video/ogg": "OGG Video",
            "video/webm": "WEBM Video",
            "video/x-ms-video": "AVI Video",
            "video/x-flv": "FLV Video",
            "video/x-matroska": "MKV Video",
            "application/x-ipkg": "Itsy Package",
            "osjs/document": "OS.js Document",
            "osjs/draw": "OS.js Image",
            "osjs/project": "OS.js Project"
        },
        "mapping": {
            ".bmp": "image/bmp",
            ".css": "text/css",
            ".gif": "image/gif",
            ".htm": "text/html",
            ".html": "text/html",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".js": "application/javascript",
            ".json": "application/json",
            ".lua": "application/x-lua",
            ".sh": "application/x-shellscript",
            ".c": "text/x-c",
            ".cpp": "text/x-cplusplus",
            ".cc": "text/x-cplusplus",
            ".otf": "font/opentype",
            ".ttf": "font/opentype",
            ".png": "image/png",
            ".zip": "application/zip",
            ".aac": "audio/aac",
            ".mp4": "video/mp4",
            ".m4a": "audio/mp4",
            ".mp1": "audio/mpeg",
            ".mp2": "audio/mpeg",
            ".mp3": "audio/mpeg",
            ".mpg": "audio/mpeg",
            ".mpeg": "audio/mpeg",
            ".oga": "audio/ogg",
            ".ogg": "audio/ogg",
            ".wav": "audio/wav",
            ".webm": "video/webm",
            ".m4v": "video/mp4",
            ".ogv": "video/ogg",
            ".avi": "video/x-ms-video",
            ".flv": "video/x-flv",
            ".mkv": "video/x-matroska",
            ".py": "application/x-python",
            ".xml": "text/xml",
            ".md": "text/plain",
            ".txt": "text/plain",
            ".log": "text/plain",
            ".doc": "text/plain",
            ".pdf": "application/pdf",
            ".ipk": "application/x-ipkg",
            ".odbeat": "osjs/dbeat",
            ".oplist": "osjs/playlist",
            ".odoc": "osjs/document",
            ".odraw": "osjs/draw",
            ".oproj": "osjs/project",
            "default": "application/octet-stream"
        }
    },
    "Preloads": []
};

        var rootURI = window.location.pathname || '/';
        if ( window.location.protocol === 'file:' ) {
          rootURI = '';
        }

        var replace = ['RootURI', 'APIURI', 'FSURI', 'MetadataURI', 'ThemeURI', 'SoundURI', 'IconURI', 'PackageURI'];
        replace.forEach(function(val) {
          if ( _cache[val] ) {
            _cache[val] = _cache[val].replace(/^\//, rootURI);
          }
        });

        var preloads = _cache.Preloads;
        if ( preloads ) {
          preloads.forEach(function(item, key) {
            if ( item && item.src && item.src.match(/^\//) ) {
              preloads[key].src = item.src.replace(/^\//, rootURI);
            }
          });
        }
      }

      return Object.freeze(_cache);
    };
  })();
})();
