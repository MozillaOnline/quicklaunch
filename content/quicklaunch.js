/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var ceQuickLaunch = {
  handleEvent: function UC_handleEvent(aEvent) {
    switch (aEvent.type) {
      case "load":
        setTimeout(this.onLoad.bind(this), 500);
        break;
      case "unload":
        this.onUnload();
        break;
    }
  },

  popupInit: false,

  loadPopup: function(aPopup) {
    if (this.popupInit) {
      return;
    }

    var menuMap = new Object();
    var menuItems = document.getElementsByTagName("menuitem");
    for (var i = 0; i < menuItems.length; ++i) {
      var menuItem = menuItems[i];
      var keyId = menuItem.getAttribute("key");
      if (keyId) {
        menuMap[keyId] = menuItem;
      }
    }

    var keyIds = new Array(
        "separator",
        "key_newNavigatorTab",
        "key_close",
        "key_reload",
        "key_search",
        "key_quitApplication",
        "separator",
        "key_gotoHistory",
        "viewBookmarksSidebarKb",
        "addBookmarkAsKb",
        "manBookmarkKb",
        "separator",
        "key_openDownloads",
        "menu_openAddons",
        "key_sanitize",
        "key_viewSource"
    );

    for (var i = 0; i < keyIds.length; ++i) {
      if (keyIds[i] == "separator") {
        var newMenuItem = document.createElement("menuseparator");
        aPopup.appendChild(newMenuItem);
        continue;
      }

      var menuItem = menuMap[keyIds[i]];
      if (!menuItem) {
        menuItem = document.getElementById(keyIds[i]);
      }

      if (menuItem) {
        var label = menuItem.getAttribute("label");
        var commandId = menuItem.getAttribute("command");
        var keyId = menuItem.getAttribute("key");
        var observes = menuItem.getAttribute("observes");

        if (label) {
          var key;
          var commandKey;
          var modifiers;
          if (keyId) {
            key = document.getElementById(keyId);
          } else {
            key = null;
          }

          if (commandId) {
            if (key != null) {
              commandKey = key.getAttribute("key");
              modifiers = key.getAttribute("modifiers");
            } else {
              commandKey = null;
            }

            var newMenuItem = document.createElement("menuitem");
            newMenuItem.setAttribute("label", label + this.getCommandKey(commandKey, modifiers));
            newMenuItem.setAttribute("command", commandId);
            aPopup.appendChild(newMenuItem);
          } else if (observes) {
            if (key != null) {
              commandKey = key.getAttribute("key");
              modifiers = key.getAttribute("modifiers");
            } else {
              commandKey = null;
            }

            var newMenuItem = document.createElement("menuitem");
            newMenuItem.setAttribute("observes", observes);
            newMenuItem.setAttribute("label", label + this.getCommandKey(commandKey, modifiers));
            aPopup.appendChild(newMenuItem);
          }
        }
      }
    }

    this.popupInit = true;
  },

  getCommandKey: function(commandKey, modifiers) {
    if (!commandKey)
      return "";

    var mylabel = "    (";
    if (modifiers) {
      var modifyKeys = modifiers.split(",");
      for (var j = 0; j < modifyKeys.length; ++j) {
        var keyvalue = modifyKeys[j];
        if (keyvalue == "accel") {
          if (navigator.userAgent.match(/Mac OS/))
            keyvalue = "⌘"
          else
            keyvalue = "ctrl";
        }
        mylabel += this.upperCapital(keyvalue) + "+";
      }
    }

    if (commandKey) {
      mylabel += this.upperCapital(commandKey) + ")";
    }

    return mylabel;
  },

  upperCapital: function(value) {
    if (value && value.length == 1)
      return value.toUpperCase();

    if (value) {
      return value.substring(0, 1).toUpperCase() + value.substring(1);
    }
  },

  openPopup: function() {
    var popup = document.getElementById("shortcuts-moon-menupopup");
    var aNode = document.getElementById("shortcuts-moon-statusbar-text");
    popup.openPopup(aNode, "before_end", 0, -3);
  },

  log: function(msg) {
    if (!this.console) {
      this.console = Components.classes["@mozilla.org/consoleservice;1"]
                               .getService(Components.interfaces.nsIConsoleService);
    }
    this.console.logStringMessage("quicklaunch: " + msg);
  },

  upgrade_ff4: function(version) {
    var addonbar = window.document.getElementById("addon-bar");
    if (addonbar) {
      var firefoxnav = document.getElementById("nav-bar");
      var curNavSet = firefoxnav.currentSet;
      if (curNavSet.indexOf("quicklaunch-button") != -1) {
        var set = curNavSet.replace(/,quicklaunch-button/, "");
        firefoxnav.setAttribute("currentset", set);
        firefoxnav.currentSet = set;
        document.persist("nav-bar", "currentset");
      }

      let curSet = addonbar.currentSet;
      if (-1 == curSet.indexOf("quickluanch-addonbar-item")) {
        let newSet = curSet + ",quickluanch-addonbar-item";
        addonbar.currentSet = newSet;
        addonbar.setAttribute("currentset", newSet);
        document.persist(addonbar.id, "currentset");
        try {
          BrowserToolboxCustomizeDone(true);
        } catch(e) {}
      }

      if (addonbar.getAttribute("collapsed") == "true")
        addonbar.setAttribute("collapsed", "false");

      document.persist(addonbar.id, "collapsed");
      this.setPrefValue("ff4_version", version);
    }
  },

  upgrade: function() {
    try {
      var firefoxnav = document.getElementById("nav-bar"); // use "nav-bar" in Firefox 2 and earlier
      var curSet = firefoxnav.currentSet;
      if (curSet.indexOf("quicklaunch-button") == -1) {
        var set;
        // Place the button before the urlbar
        if (curSet.indexOf("urlbar-container") != -1)
          set = curSet.replace(/urlbar-container/, "quicklaunch-button,urlbar-container");
        else  // at the end
          set = firefoxnav.currentSet + ",quicklaunch-button";

        firefoxnav.setAttribute("currentset", set);
        firefoxnav.currentSet = set;
        document.persist("nav-bar", "currentset");
        // If you don't do the following call, funny things happen
        try {
          BrowserToolboxCustomizeDone(true);
        } catch (e) { }
      }

      //Add Bookmark and History button for users who does not have these button on the bookmark toolbar.
      if (Services.appinfo.OS == "WINNT" || Services.appinfo.OS == "Linux") {
        var personalBar = document.getElementById("PersonalToolbar");
        var personalCurSet = personalBar.currentSet;
        if (personalCurSet.indexOf("bookmarks-button") == -1 && personalCurSet.indexOf("history-button")== -1) {
          var perSet = "bookmarks-button,history-button,separator,"+personalCurSet;
          personalBar.setAttribute("currentset", perSet);
          personalBar.currentSet = perSet;
          personalBar.setAttribute("iconsize", "small");
          document.persist("PersonalToolbar", "currentset");
          document.persist("PersonalToolbar", "iconsize");
          try {
            BrowserToolboxCustomizeDone(true);
          } catch (e) { }
        }
      }
    } catch(e) { }
  },

  setPrefValue: function(prefName, value) {
    try {
      var prefs = Application.prefs;
      var name = "extensions.quicklaunch@mozillaonline.com." + prefName;
      return prefs.setValue(name, value);
    } catch(e) {
      Components.utils.reportError(e);
    }
  },

  getPrefValue: function(prefName, defValue) {
    try {
      var prefs = Application.prefs;
      var name = "extensions.quicklaunch@mozillaonline.com." + prefName;
      return prefs.getValue(name, defValue);
    } catch (e) {
      Components.utils.reportError(e);
    }
  },

  popupMenu: function() {
    var popup = document.getElementById("shortcuts-statusbar-menupopup");
    var panel = document.getElementById("quickluanch-addonbar");
    popup.openPopup(panel, "after_start", 0, -3);
  },

  init: function() {
    try {
      var self = this;
      Application.getExtensions(function(exts) {
        if (exts.has("quicklaunch@mozillaonline.com")) {
          var version = exts.get("quicklaunch@mozillaonline.com").version;
          var prevVer = self.getPrefValue("ff4_version", "");
          if (prevVer != version) {
            if (Services.appinfo.OS == "WINNT") {
              self.upgrade_ff4(version);
            } else {
              self.upgrade();
            }
          }
        }
      });

      this.rebuild_addonbar();
    } catch (e) {
      Components.utils.reportError(e);
    }
  },

  runProc: function(fileName, args) {
    try {
      var file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);

      file.initWithPath(fileName);
      var process=Components.classes['@mozilla.org/process/util;1'].createInstance(Components.interfaces.nsIProcess);
      process.init(file);
      var argsArr = args.split(" ");
      process.run(false, argsArr, argsArr.length);
    } catch(e) {
      this.log(e);
    }
  },

  runProcInWinD: function(relPath, args) {
    try {
      var winDir = Components.classes["@mozilla.org/file/directory_service;1"].
        getService(Components.interfaces.nsIProperties).get("WinD", Components.interfaces.nsILocalFile);
      var file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
      file.initWithPath(winDir.path + "\\" +relPath);
      var process=Components.classes['@mozilla.org/process/util;1'].createInstance(Components.interfaces.nsIProcess);
      process.init(file);
      process.run(false, args, args.length);
    } catch(e) {
      Components.utils.reportError(e);
    }
  },

  printScreen: function() {
    var mainwin = document.getElementById("main-window");
    if (!mainwin.getAttribute("xmlns:html"))
        mainwin.setAttribute("xmlns:html", "http://www.w3.org/1999/xhtml");

    var content = window.content;
    var desth = content.innerHeight + content.scrollMaxY;
    var destw = content.innerWidth + content.scrollMaxX;

    // Unfortunately there is a limit:
    if (desth > 16384) desth = 16384;

    var canvas = document.createElementNS("http://www.w3.org/1999/xhtml", "html:canvas");
    var ctx = canvas.getContext("2d");

    canvas.height = desth;
    canvas.width = destw;
    ctx.clearRect(0, 0, destw, desth);
    ctx.save();
    ctx.drawWindow(content, 0, 0, destw, desth, "rgb(255,255,255)");

    return canvas.toDataURL("image/png", "");
  },

  openPageWithMspaint: function() {
    var data = this.printScreen();
    //create Temp File
    let currProfD = Services.dirsvc.get("ProfD", Ci.nsIFile);
    let profileDir = currProfD.path;

    // Show the profile directory.
    let nsLocalFile = Components.Constructor("@mozilla.org/file/local;1",
                                             "nsILocalFile", "initWithPath");

    file.append("temp.png");
    file.createUnique(Components.interfaces.nsIFile.NORMAL_FILE_TYPE, 0666);
    // do whatever you need to the created file

    var io = Components.classes["@mozilla.org/network/io-service;1"]
                       .getService(Components.interfaces.nsIIOService);
    var source = io.newURI(data, "UTF8", null);
    var target = io.newFileURI(file);
    // prepare to save the canvas data
    var persist = Components.classes["@mozilla.org/embedding/browser/nsWebBrowserPersist;1"]
                            .createInstance(Components.interfaces.nsIWebBrowserPersist);

    persist.persistFlags = Components.interfaces.nsIWebBrowserPersist.PERSIST_FLAGS_REPLACE_EXISTING_FILES;
    persist.persistFlags |= Components.interfaces.nsIWebBrowserPersist.PERSIST_FLAGS_AUTODETECT_APPLY_CONVERSION;

    persist.saveURI(source, null, null, null, null, file, null);
    this.runProcInWinD('system32\\mspaint.exe', [file.path]);
  },

  toProfileManager: function() {
    const wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                         .getService(Components.interfaces.nsIWindowMediator);
    var promgrWin = wm.getMostRecentWindow("mozilla:profileSelection");
    if (promgrWin) {
      promgrWin.focus();
    } else {
      var params = Components.classes["@mozilla.org/embedcomp/dialogparam;1"]
                             .createInstance(Components.interfaces.nsIDialogParamBlock);
      params.SetNumberStrings(1);
      params.SetString(0, "menu");
      window.openDialog("chrome://quicklaunch/content/profileSelection.xul",
                        "",
                        "centerscreen,chrome,titlebar",
                        params);
    }
    // Here, we don't care about the result code
    // that was returned in the param block.
  },

  rebuild_addonbar: function() {
    if (Services.appinfo.OS == "WINNT") {
      var hbox = document.getElementById("quickluanch-addonbar-hbox");
      if (hbox) {
        while(hbox.hasChildNodes()) {
          hbox.removeChild(hbox.firstChild);
        }

        var userList = this.getPrefValue("addonbarlist", "");
        if (userList == "")
          return;

        var userListArray = userList.split(",");
        var button;
        for (let i = 0; i < userListArray.length; i++) {
          let id = userListArray[i].trim();
          if ('' == id) {
            continue;
          }

          button = this.buildButton(userListArray[i]);
          if (button) {
            hbox.appendChild(button);
          }
        }
      }
    }
  },

  buildButton: function(buttonID) {
    if (buttonID == "paintWebpage") // remove paintWebpage
      return null;

    var strbundle = document.getElementById("quicklaunchStrings");
    var button = document.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul", "toolbarbutton");
    var tooltip = "";
    if (isNaN(buttonID)) {
      switch(buttonID) {
        case "notepad":
        {
          button.setAttribute("id", "qc-default-notepad");
          button.setAttribute("image", "chrome://quicklaunch/skin/image/notepad.png");
          button.setAttribute("oncommand", "ceQuickLaunch.runProcInWinD('notepad.exe', ['']);");
          button.setAttribute("class", "quicklaunch-addonbar");
          tooltip = strbundle.getString("quicklaunch-notepad");
          button.setAttribute("tooltiptext", tooltip);
          break;
        }
        case "mspaint":
        {
          button.setAttribute("id", "qc-default-mspaint");
          button.setAttribute("image", "chrome://quicklaunch/skin/image/mspaint.png");
          button.setAttribute("oncommand", "ceQuickLaunch.runProcInWinD('system32\\\\mspaint.exe',['']);");
          button.setAttribute("class", "quicklaunch-addonbar");
          tooltip = strbundle.getString("quicklaunch-mspaint");
          button.setAttribute("tooltiptext", tooltip);
          break;
        }
        case "calc":
        {
          button.setAttribute("id", "qc-default-calc");
          button.setAttribute("image", "chrome://quicklaunch/skin/image/calc.png");
          button.setAttribute("oncommand", "ceQuickLaunch.runProcInWinD('system32\\\\calc.exe',['']);");
          button.setAttribute("class", "quicklaunch-addonbar");
          tooltip = strbundle.getString("quicklaunch-calc");
          button.setAttribute("tooltiptext", tooltip);
          break;
        }
        case "myComputer":
        {
          button.setAttribute("id", "qc-default-myComputer");
          button.setAttribute("image", "chrome://quicklaunch/skin/image/explorer.png");
          button.setAttribute("oncommand", "ceQuickLaunch.runProcInWinD('explorer.exe',['::{20d04fe0-3aea-1069-a2d8-08002b30309d}']);");
          button.setAttribute("class", "quicklaunch-addonbar");
          tooltip = strbundle.getString("quicklaunch-myComputer");
          button.setAttribute("tooltiptext", tooltip);
          break;
        }
        case "paintWebpage":
        {
          button.setAttribute("id", "qc-default-paintWebpage");
          button.setAttribute("image", "chrome://quicklaunch/skin/image/screencut.png");
          button.setAttribute("oncommand", "ceQuickLaunch.openPageWithMspaint();");
          button.setAttribute("class", "quicklaunch-addonbar");
          tooltip = strbundle.getString("quicklaunch-paintWebpage");
          button.setAttribute("tooltiptext", tooltip);
          break;
        }
        case "switchProfile":
        {
          button.setAttribute("id", "qc-default-switchProfile");
          button.setAttribute("image", "chrome://quicklaunch/skin/image/switchprofile.png");
          button.setAttribute("oncommand", "ceQuickLaunch.toProfileManager();");
          button.setAttribute("class", "quicklaunch-addonbar");
          tooltip = strbundle.getString("quicklaunch-switchProfile");
          button.setAttribute("tooltiptext", tooltip);
          break;
        }
        default:
          button = null;
          break;
      }
    } else {
      var id, name, path, args;
      var file = Components.classes["@mozilla.org/file/directory_service;1"]
                           .getService(Components.interfaces.nsIProperties)
                           .get("ProfD", Components.interfaces.nsIFile);
      file.append("quicklaunch.sqlite");
      var storageService = Components.classes["@mozilla.org/storage/service;1"]
                                     .getService(Components.interfaces.mozIStorageService);
      var mDBConn = storageService.openDatabase(file);
      var statement = mDBConn.createStatement("SELECT id,name,path,args FROM myquicklaunch WHERE id=?1");
      statement.bindInt32Parameter(0, buttonID);
      try {
        while(statement.executeStep()) {
          id = statement.getInt32(0);
          name = statement.getUTF8String(1);
          path = statement.getUTF8String(2);
          args = statement.getUTF8String(3);
          button.setAttribute("id", "qc-customized-" + id);
          button.setAttribute("image", "moz-icon:file:///" + path);
          pathArray = path.split("\\");

          var newPath = "";
          for (let j = 0; j < pathArray.length; j++) {
            newPath = newPath + pathArray[j] + "\\\\";
          }

          newPath = newPath.substring(0, newPath.length - 2);
          button.setAttribute("oncommand", "ceQuickLaunch.runProc(\"" + newPath + "\",\"" + args + "\");");
          button.setAttribute("class", "quicklaunch-addonbar");
          button.setAttribute("tooltiptext", name);
        }
      } finally {
        statement.reset();
      }
    }

    return button;
  },

  manageQuickLaunch: function() {
    const wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                         .getService(Components.interfaces.nsIWindowMediator);
    var promgrWin = wm.getMostRecentWindow( "mozilla:quickLaunchManager" );
    if (promgrWin) {
      promgrWin.focus();
    } else {
      var params = Components.classes["@mozilla.org/embedcomp/dialogparam;1"]
                             .createInstance(Components.interfaces.nsIDialogParamBlock);
      params.SetNumberStrings(1);
      params.SetString(0, "menu");
      window.openDialog("chrome://quicklaunch/content/quickLaunchManager.xul",
                        "",
                        "centerscreen,chrome,titlebar,modal",
                        params);
    }
  },

  onQuicklaunchPopupShown: function(event) {
    var file = Components.classes["@mozilla.org/file/directory_service;1"]
                         .getService(Components.interfaces.nsIProperties)
                         .get("ProfD", Components.interfaces.nsIFile);
    file.append("quicklaunch.sqlite");
    if (!file.exists()  || file.fileSize == 0) {
      return;
    }

    var storageService = Components.classes["@mozilla.org/storage/service;1"]
                                   .getService(Components.interfaces.mozIStorageService);
    var mDBConn = storageService.openDatabase(file);

    var popup = document.getElementById('shortcuts-statusbar-menupopup');
    var items = popup.querySelectorAll('menuitem.user-customized-item');
    for (let i = 0; i < items.length; i++) {
      popup.removeChild(items[i]);
    }

    var statement = mDBConn.createStatement("SELECT id,name,path,args FROM myquicklaunch");
    try {
      let hasItem = false;
      while (statement.executeStep()) {
        hasItem = true;
        id = statement.getInt32(0);
        name = statement.getUTF8String(1);
        path = statement.getUTF8String(2);
        args = statement.getUTF8String(3);
        var menuItem = document.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul", "menuitem");
        menuItem.setAttribute('class', 'menuitem-iconic user-customized-item');
        menuItem.setAttribute('label', name);
        menuItem.setAttribute('image', 'moz-icon:file:///' + path);
        menuItem.setAttribute('commandPath', path);
        menuItem.setAttribute('commandArgs', args);
        menuItem.setAttribute('oncommand', 'ceQuickLaunch.runProc(this.getAttribute(\'commandPath\'),this.getAttribute(\'commandArgs\'));');
        try {
          popup.insertBefore(menuItem, document.getElementById('separator-manage'));
        } catch(e) {
          continue;
        }
      }
      document.getElementById('separator-manage').hidden = !hasItem;
    } catch(e) {
      Components.utils.reportError("Error occurs when rebuild menu: " +
                                   mDBConn.lastErrorString);
    } finally {
      statement.reset();
    }
  },

  QueryInterface: function(aIID) {
    if (aIID.equals(Components.interfaces.nsIObserver) ||
      aIID.equals(Components.interfaces.nsISupports) ||
      aIID.equals(Components.interfaces.nsISupportsWeakReference)) {
      return this;
    }
    throw Components.results.NS_NOINTERFACE;
  },

  observe: function(subject, topic, data) {
    if (topic == 'nsPref:changed') {
      if (data == 'extensions.quicklaunch@mozillaonline.com.addonbarlist' ||
          data == 'extensions.quicklaunch@mozillaonline.com.addonbarlist_changetime') {
        this.rebuild_addonbar();
      }
    }
  },

  onLoad: function() {
    Components.utils.import('resource://quicklaunch/quicklaunch.jsm');
    this.init();
    // upgrade database, if upgraded, then rebuid the quicklaunch menu.
    quicklaunchModule.upgradeDB();
    var pref = Components.classes["@mozilla.org/preferences-service;1"]
                 .getService(Components.interfaces.nsIPrefService)
                 .QueryInterface(Components.interfaces.nsIPrefBranch2);
    pref.addObserver('extensions.quicklaunch@mozillaonline.com.', this, true);
  },

  onUnload: function() {
    var pref = Components.classes["@mozilla.org/preferences-service;1"]
                 .getService(Components.interfaces.nsIPrefService)
                 .QueryInterface(Components.interfaces.nsIPrefBranch2);
    pref.removeObserver('extensions.quicklaunch@mozillaonline.com.', this, true);
  },
};

window.addEventListener("load", ceQuickLaunch, false);
window.addEventListener('unload', ceQuickLaunch, false);

