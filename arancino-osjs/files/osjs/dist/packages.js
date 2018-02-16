(function() {
  window.OSjs = window.OSjs || {}
  OSjs.Core = OSjs.Core || {}
  OSjs.Core.getMetadata = (function() {
    var _cache;

    return function() {
      var rootURI = window.location.pathname || '/';
      if ( window.location.protocol === 'file:' ) {
        rootURI = rootURI.replace(/(index\.html)$/, 'packages/');
      } else {
        rootURI = rootURI.replace(/\/$/, '/packages/'); // FIXME
      }

      function fixDirs(dirs, key) {
        dirs.forEach(function(it, idx) {
          if ( it.src && !it.src.match(/^(\/)|(http)|(ftp)/) ) {
            it.src = rootURI + it.src;
          }
        });
        return dirs;
      }

      if ( !_cache ) {
        _cache = {
    "ApplicationArancinoAbout": {
        "className": "ApplicationArancinoAbout",
        "name": "About Arancino OS",
        "singular": true,
        "enabled": true,
        "mime": null,
        "icon": "apps/help-browser.png",
        "category": "arancino",
        "preload": [
            {
                "type": "javascript",
                "src": "target/ArancinoAbout/combined.js"
            },
            {
                "type": "stylesheet",
                "src": "target/ArancinoAbout/combined.css"
            }
        ],
        "type": "application",
        "path": "target/ArancinoAbout",
        "build": {},
        "repo": "target"
    },
    // "ApplicationArancinoCiaoConfigurator": {
    //     "className": "ApplicationArancinoCiaoConfigurator",
    //     "name": "Arancino Ciao Configurator",
    //     "mime": null,
    //     "icon": "categories/applications-system.png",
    //     "category": "arancino",
    //     "preload": [
    //         {
    //             "type": "javascript",
    //             "src": "target/ArancinoCiaoConfigurator/combined.js"
    //         },
    //         {
    //             "type": "stylesheet",
    //             "src": "target/ArancinoCiaoConfigurator/combined.css"
    //         }
    //     ],
    //     "type": "application",
    //     "path": "target/ArancinoCiaoConfigurator",
    //     "build": {},
    //     "repo": "target",
    //     "enabled": false
    // },
    "ApplicationArancinoKernelLog": {
        "className": "ApplicationArancinoKernelLog",
        "name": "Arancino Kernel Log",
        "mime": null,
        "icon": "apps/terminal.png",
        "category": "arancino",
        "preload": [
            {
                "type": "javascript",
                "src": "target/ArancinoKernelLog/combined.js"
            },
            {
                "type": "stylesheet",
                "src": "target/ArancinoKernelLog/combined.css"
            }
        ],
        "type": "application",
        "path": "target/ArancinoKernelLog",
        "build": {},
        "repo": "target",
        "enabled": true
    },
    "ApplicationArancinoLuci": {
        "className": "ApplicationArancinoLuci",
        "name": "Arancino Luci",
        "mime": null,
        "icon": "categories/applications-system.png",
        "category": "arancino",
        "preload": [
            {
                "type": "javascript",
                "src": "target/ArancinoLuci/combined.js"
            },
            {
                "type": "stylesheet",
                "src": "target/ArancinoLuci/combined.css"
            }
        ],
        "type": "application",
        "path": "target/ArancinoLuci",
        "build": {},
        "repo": "target",
        "enabled": true
    },
    "ApplicationArancinoPackageManager": {
        "className": "ApplicationArancinoPackageManager",
        "name": "Arancino Package Manager",
        "mime": [
            "application\\/x\\-ipkg"
        ],
        "icon": "apps/update-manager.png",
        "singular": true,
        "category": "arancino",
        "preload": [
            {
                "type": "javascript",
                "src": "target/ArancinoPackageManager/combined.js"
            },
            {
                "type": "stylesheet",
                "src": "target/ArancinoPackageManager/combined.css"
            }
        ],
        "type": "application",
        "path": "target/ArancinoPackageManager",
        "build": {},
        "repo": "target",
        "enabled": true
    },
    "ApplicationArancinoProcessViewer": {
        "className": "ApplicationArancinoProcessViewer",
        "name": "Arancino Process Viewer",
        "mime": null,
        "icon": "apps/gnome-monitor.png",
        "category": "arancino",
        "preload": [
            {
                "type": "javascript",
                "src": "target/ArancinoProcessViewer/combined.js"
            },
            {
                "type": "stylesheet",
                "src": "target/ArancinoProcessViewer/combined.css"
            }
        ],
        "type": "application",
        "path": "target/ArancinoProcessViewer",
        "build": {},
        "repo": "target",
        "enabled": true
    },
    "ArancinoService": {
        "className": "ArancinoService",
        "type": "service",
        "name": "ArancinoService",
        "icon": "categories/applications-system.png",
        "preload": [
            {
                "type": "javascript",
                "src": "target/ArancinoService/combined.js"
            }
        ],
        "path": "target/ArancinoService",
        "build": {},
        "repo": "target",
        "enabled": true,
        "singular": true
    },
    "ApplicationArancinoSettings": {
        "className": "ApplicationArancinoSettings",
        "name": "Arancino Settings",
        "mime": null,
        "icon": "arancino-settings.png",
        "singular": true,
        "category": "arancino",
        "preload": [
            {
                "type": "javascript",
                "src": "target/ArancinoSettings/combined.js"
            },
            {
                "type": "stylesheet",
                "src": "target/ArancinoSettings/combined.css"
            }
        ],
        "type": "application",
        "path": "target/ArancinoSettings",
        "build": {},
        "repo": "target",
        "enabled": true
    },
    "ApplicationArancinoSysLog": {
        "className": "ApplicationArancinoSysLog",
        "name": "Arancino System Log",
        "mime": null,
        "icon": "apps/terminal.png",
        "category": "arancino",
        "preload": [
            {
                "type": "javascript",
                "src": "target/ArancinoSysLog/combined.js"
            },
            {
                "type": "stylesheet",
                "src": "target/ArancinoSysLog/combined.css"
            }
        ],
        "type": "application",
        "path": "target/ArancinoSysLog",
        "build": {},
        "repo": "target",
        "enabled": true
    },
    "ApplicationArancinoWizardSettings": {
        "className": "ApplicationArancinoWizardSettings",
        "name": "Arancino Configuration Wizard",
        "mime": null,
        "icon": "categories/applications-system.png",
        "category": "utilities",
        "preload": [
            {
                "type": "javascript",
                "src": "target/ArancinoWizardSettings/combined.js"
            },
            {
                "type": "stylesheet",
                "src": "target/ArancinoWizardSettings/combined.css"
            }
        ],
        "type": "application",
        "path": "target/ArancinoWizardSettings",
        "build": {},
        "repo": "target",
        "enabled": true
    },
    "ApplicationCalculator": {
        "className": "ApplicationCalculator",
        "name": "Calculator",
        "names": {
            "bg_Bg": "Клакулатор",
            "fr_FR": "Calculatrice",
            "it_IT": "Calcolatrice",
            "ko_KR": "계산기",
            "nl_NL": "Rekenmachine",
            "no_NO": "Kalkulator",
            "pl_PL": "Kalkulator",
            "ru_RU": "Калькулятор",
            "sk_SK": "Kalkulačka",
            "tr_TR": "Hesap Makinesi",
            "vi_VN": "Máy tính"
        },
        "icon": "apps/calc.png",
        "category": "office",
        "preload": [
            {
                "type": "javascript",
                "src": "target/Calculator/combined.js"
            },
            {
                "type": "stylesheet",
                "src": "target/Calculator/combined.css"
            }
        ],
        "type": "application",
        "path": "target/Calculator",
        "build": {},
        "repo": "target",
        "enabled": true
    },
    "ApplicationCodeMirror": {
        "className": "ApplicationCodeMirror",
        "name": "CodeMirror",
        "mime": [
            "^text",
            "inode\\/x\\-empty",
            "application\\/x\\-empty",
            "application\\/x\\-lua",
            "application\\/x\\-python",
            "application\\/x\\-shellscript",
            "text\\/x\\-c",
            "text\\/x\\-cplusplus",
            "application\\/javascript"
        ],
        "icon": "arancino-ideino.png",
        "category": "development",
        "preload": [
            {
                "type": "javascript",
                "src": "target/CodeMirror/combined.js"
            },
            {
                "type": "stylesheet",
                "src": "target/CodeMirror/combined.css"
            }
        ],
        "type": "application",
        "path": "target/CodeMirror",
        "build": {},
        "repo": "target",
        "enabled": true
    },
    "CoreWM": {
        "className": "CoreWM",
        "name": "OS.js Window Manager",
        "names": {
            "bg_BG": "Мениджър на прозорци на OS.js",
            "de_DE": "OS.js Fenster-Manager",
            "es_ES": "OS.js Window Manager",
            "fr_FR": "Gestionnaire de fenêtre OS.js",
            "it_IT": "OS.js Gestore Finestre",
            "ko_KR": "OS.js 윈도우 관리자",
            "nl_NL": "OS.js venster beheer",
            "no_NO": "OS.js Vinduhåndterer",
            "pl_PL": "Menedżer Okien OS.js",
            "ru_RU": "OS.js Оконный менеджер",
            "sk_SK": "Správca Okien OS.js",
            "tr_TR": "OS.js Pencere Yöneticisi",
            "vi_VN": "Quản lí cửa sổ OS.js"
        },
        "singular": true,
        "type": "windowmanager",
        "icon": "apps/gnome-window-manager.png",
        "splash": false,
        "preload": [
            {
                "type": "javascript",
                "src": "target/CoreWM/combined.js"
            },
            {
                "type": "stylesheet",
                "src": "target/CoreWM/combined.css"
            }
        ],
        "path": "target/CoreWM",
        "build": {},
        "repo": "target",
        "enabled": true
    },
    "ApplicationFileManager": {
        "className": "ApplicationFileManager",
        "name": "File Manager",
        "description": "The default file manager",
        "names": {
            "bg_BG": "Файлов мениджър",
            "de_DE": "Dateimanager",
            "fr_FR": "Explorateur de fichier",
            "it_IT": "Gestore File",
            "nl_NL": "bestands beheer",
            "no_NO": "Fil-håndtering",
            "pl_PL": "Menedżer Plików",
            "ko_KR": "파일 탐색기",
            "sk_SK": "Správca súborov",
            "ru_RU": "Файловый менеджер",
            "tr_TR": "Dosya Yöneticisi",
            "vi_VN": "Quản lí file"
        },
        "descriptions": {
            "bg_BG": "Стандартния файлов мениджър",
            "de_DE": "Standardmäßiger Dateimanager",
            "fr_FR": "Gestionnaire de fichier par défaut",
            "it_IT": "Il gestore file predefinito",
            "nl_NL": "Standaard bestands beheerder",
            "no_NO": "Standard Fil-håndtering program",
            "pl_PL": "Domyślny Menedżer Plików",
            "ko_KR": "기본 파일 관리자",
            "sk_SK": "Štandardný správca súborov",
            "ru_RU": "Стандартный файловый менеджер",
            "tr_TR": "Varsayılan dosya yöneticisi",
            "vi_VN": "Trình quản lí file mặc định"
        },
        "category": "utilities",
        "icon": "apps/file-manager.png",
        "preload": [
            {
                "type": "javascript",
                "src": "target/FileManager/combined.js"
            },
            {
                "type": "stylesheet",
                "src": "target/FileManager/combined.css"
            }
        ],
        "type": "application",
        "path": "target/FileManager",
        "build": {},
        "repo": "target",
        "enabled": true
    },
    "ApplicationPreview": {
        "className": "ApplicationPreview",
        "name": "Preview",
        "description": "Preview image files",
        "names": {
            "bg_BG": "Преглед на изображения",
            "de_DE": "Vorschau",
            "fr_FR": "Visionneuse",
            "it_IT": "Anteprima Immagini",
            "ko_KR": "미리보기",
            "nl_NL": "Foto viewer",
            "no_NO": "Forhåndsviser",
            "pl_PL": "Podgląd",
            "ru_RU": "Просмотрщик",
            "sk_SK": "Prehliadač obrázkov",
            "tr_TR": "Önizle",
            "vi_VN": "Trình xem ảnh"
        },
        "descriptions": {
            "bg_BG": "Преглед на изображения",
            "de_DE": "Bildervorschau",
            "fr_FR": "Visionneuse de photos",
            "it_IT": "Anteprima Immagini",
            "ko_KR": "이미지 파일을 미리 봅니다",
            "nl_NL": "Foto viewer",
            "no_NO": "Forhåndsvisning av bilde-filer",
            "pl_PL": "Podgląd zdjęć",
            "ru_RU": "Просмотрщик изображений",
            "sk_SK": "Prehliadač obrázkov",
            "tr_TR": "resim dosyalarını önizle",
            "vi_VN": "Trình xem ảnh"
        },
        "mime": [
            "^image",
            "^video"
        ],
        "category": "multimedia",
        "icon": "mimetypes/image.png",
        "preload": [
            {
                "type": "javascript",
                "src": "target/Preview/combined.js"
            },
            {
                "type": "stylesheet",
                "src": "target/Preview/combined.css"
            }
        ],
        "type": "application",
        "path": "target/Preview",
        "build": {},
        "repo": "target",
        "enabled": true
    },
    "ApplicationSettings": {
        "className": "ApplicationSettings",
        "name": "Settings",
        "names": {
            "bg_BG": "Настройки",
            "de_DE": "Einstellungen",
            "es_ES": "Settings",
            "fr_FR": "Paramètres",
            "it_IT": "Settaggi",
            "ko_KR": "환경설정",
            "nl_NL": "Instellingen",
            "no_NO": "Instillinger",
            "pl_PL": "Ustawienia",
            "ru_RU": "Настройки",
            "sk_SK": "Nastavenia",
            "tr_TR": "Ayarlar",
            "vi_VN": "Cài đặt"
        },
        "descriptions": {
            "bg_BG": "Настройки",
            "de_DE": "Einstellungen",
            "es_ES": "Settings",
            "fr_FR": "Paramètres",
            "it_IT": "Settaggi",
            "ko_KR": "환경설정",
            "nl_NL": "Instellingen",
            "no_NO": "Instillinger",
            "pl_PL": "Ustawienia",
            "ru_RU": "Настройки",
            "sk_SK": "Nastavenia",
            "tr_TR": "Program Ayarlarını düzenle",
            "vi_VN": "Cài đặt"
        },
        "icon": "categories/applications-system.png",
        "category": "system",
        "singular": true,
        "preload": [
            {
                "type": "javascript",
                "src": "target/Settings/combined.js"
            },
            {
                "type": "stylesheet",
                "src": "target/Settings/combined.css"
            }
        ],
        "type": "application",
        "path": "target/Settings",
        "build": {},
        "repo": "target",
        "enabled": true
    },
    "ApplicationTerminal": {
        "className": "ApplicationTerminal",
        "enabled": true,
        "description": "System Terminal",
        "name": "Terminal",
        "mime": null,
        "icon": "apps/terminal.png",
        "category": "utilities",
        "preload": [
            {
                "type": "javascript",
                "src": "target/Terminal/combined.js"
            },
            {
                "type": "stylesheet",
                "src": "target/Terminal/combined.css"
            }
        ],
        "type": "application",
        "path": "target/Terminal",
        "build": {},
        "repo": "target"
    },
    "ApplicationTerminalExternal": {
        "className": "ApplicationTerminalExternal",
        "name": "Terminal (External Window)",
        "category": "utilities",
        "icon": "apps/terminal.png",
        "preload": [
            {
                "type": "javascript",
                "src": "target/TerminalExternal/combined.js"
            }
        ],
        "type": "application",
        "path": "target/TerminalExternal",
        "build": {},
        "repo": "target",
        "enabled": true
    },
    "ApplicationTextpad": {
        "className": "ApplicationTextpad",
        "name": "Textpad",
        "description": "Simple text editor",
        "names": {
            "bg_BG": "Текстов редактор",
            "de_DE": "Texteditor",
            "fr_FR": "Éditeur de texte",
            "it_IT": "Editor Testi",
            "ko_KR": "텍스트패드",
            "nl_NL": "Notities",
            "no_NO": "Tekstblokk",
            "pl_PL": "Notatnik",
            "ru_RU": "Редактор текста",
            "sk_SK": "Poznámkový blok",
            "tr_TR": "Basit Bir Metin Düzenleyicisi",
            "vi_VN": "Trình sửa văn bản"
        },
        "descriptions": {
            "bg_BG": "Стандартен текстов редактор",
            "de_DE": "Einfacher Texteditor",
            "fr_FR": "Éditeur de texte simple",
            "it_IT": "Semplice editor di testi",
            "ko_KR": "간단한 텍스트 편집기",
            "nl_NL": "Eenvoudige Tekstverwerker",
            "no_NO": "Simpel tekst redigering",
            "pl_PL": "Prosty edytor tekstu",
            "ru_RU": "Простой текстовый редактор",
            "sk_SK": "Jednoduchý textový editor",
            "tr_TR": "Basit Bir Metin Düzenleyicisi",
            "vi_VN": "Trình sửa văn bản đơn giản"
        },
        "mime": [
            "^text",
            "inode\\/x\\-empty",
            "application\\/x\\-empty",
            "application\\/x\\-lua",
            "application\\/x\\-python",
            "application\\/javascript",
            "application\\/json"
        ],
        "category": "utilities",
        "icon": "apps/accessories-text-editor.png",
        "preload": [
            {
                "type": "javascript",
                "src": "target/Textpad/combined.js"
            },
            {
                "type": "stylesheet",
                "src": "target/Textpad/combined.css"
            }
        ],
        "type": "application",
        "path": "target/Textpad",
        "build": {},
        "repo": "target",
        "enabled": true
    }
};

        Object.keys(_cache).forEach(function(key) {
          var iter = _cache[key];
          if ( iter && iter.preload ) {
            _cache[key].preload = fixDirs(iter.preload, key);
          }
        });
      }

      return Object.freeze(_cache);
    };
  })();
})();
