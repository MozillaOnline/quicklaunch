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

  log: function(msg) {
    if (!this.console) {
      this.console = Components.classes["@mozilla.org/consoleservice;1"]
                               .getService(Components.interfaces.nsIConsoleService);
    }
    this.console.logStringMessage("quicklaunch: " + msg);
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

  init: function() {
    try {
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
    var strbundle = document.getElementById("quicklaunchStrings");
    if (Services.appinfo.OS == "WINNT") {
      // recreate these widgets for every call
      var widgets = CustomizableUI.getWidgetsInArea(CustomizableUI.AREA_NAVBAR);
      widgets.forEach(function(aWidget) {
        if (!aWidget || !aWidget.id) {
          return;
        }

        if (!aWidget.id.startsWith("qc-default-") &&
            !aWidget.id.startsWith("qc-customized")) {
          return;
        }

        CustomizableUI.destroyWidget(aWidget.id);
      });

      var userList = this.getPrefValue("addonbarlist", "");
      if (userList != "") {
        var userListArray = userList.split(",");
        var button;
        for(var i = 0; i < userListArray.length; i++){
          var id = userListArray[i].trim();
          if ('' == id) {
            continue;
          }

          this.buildButton(userListArray[i]);
        }
      }
    }

    // create the main button only if not existed yet
    var id = "quickluanch-addonbar-item";
    var area = CustomizableUI.AREA_PANEL;

    var widget = CustomizableUI.getWidget(id);
    if (widget && widget.provider == CustomizableUI.PROVIDER_API) {
      return;
    }

    if (Services.appinfo.OS == "WINNT") {
      var prefKey = "extensions.quicklaunch@mozillaonline.com.ff4_version";
      if (Services.prefs.prefHasUserValue(prefKey)) {
        var migrationListener = {
          onWidgetAdded: function(aWidgetId, aArea) {
            if (aWidgetId == id && aArea != CustomizableUI.AREA_ADDONBAR) {
              CustomizableUI.removeListener(migrationListener);
              Services.prefs.clearUserPref(prefKey);

              var addonbar = document.getElementById(CustomizableUI.AREA_ADDONBAR);
              if (addonbar && addonbar._currentSetMigrated.has(id)) {
                CustomizableUI.addWidgetToArea(id, area);
                addonbar._currentSetMigrated.delete(id);
                addonbar._updateMigratedSet();
              };
            }
          }
        };

        CustomizableUI.addListener(migrationListener);
      }

      CustomizableUI.createWidget(
        { id : id,
          type : "view",
          viewId : "PanelUI-MOA-quicklaunchView",
          defaultArea : area,
          label : strbundle.getString("quicklaunch-label"),
          tooltiptext : strbundle.getString("quicklaunch-label"),
          onViewShowing: this.onQuicklaunchPopupShown
        });
    } else {
      CustomizableUI.createWidget(
        { id : id,
          type : "button",
          defaultArea : area,
          label : strbundle.getString("quicklaunch-label"),
          tooltiptext : strbundle.getString("quicklaunch-label"),
          onCommand: function(aEvt) {
            var doc = aEvt.target && aEvt.target.ownerDocument;
            var win = doc && doc.defaultView;
            if (!win) {
              return;
            }

            win.ceQuickLaunch.toProfileManager();
          }
        });
    }
  },

  buildButton: function(buttonID) {
    if (buttonID == "paintWebpage") // remove paintWebpage
      return null;

    var strbundle = document.getElementById("quicklaunchStrings");
    if (isNaN(buttonID)) {
      if (["notepad", "mspaint", "calc", "myComputer",
           "paintWebpage", "switchProfile"].indexOf(buttonID) > -1) {
        var id = "qc-default-" + buttonID;

        var widget = CustomizableUI.getWidget(id);
        if (widget && widget.provider == CustomizableUI.PROVIDER_API) {
          return;
        }

        CustomizableUI.createWidget(
          { id : id,
            type : "button",
            defaultArea : CustomizableUI.AREA_NAVBAR,
            label : strbundle.getString("quicklaunch-" + buttonID),
            tooltiptext : strbundle.getString("quicklaunch-" + buttonID),
            removable: false,
            onCreated: function(aNode) {
              aNode.classList.add("quicklaunch-addonbar");
              aNode.setAttribute("image", "chrome://quicklaunch/skin/image/" + buttonID + ".png");
            },
            onCommand: function(aEvt) {
              var doc = aEvt.target && aEvt.target.ownerDocument;
              var win = doc && doc.defaultView;
              if (!win) {
                return;
              }

              switch(buttonID) {
                case "notepad":
                  win.ceQuickLaunch.runProcInWinD('notepad.exe',['']);
                  break;
                case "mspaint":
                  win.ceQuickLaunch.runProcInWinD('system32\\mspaint.exe',['']);
                  break;
                case "calc":
                  win.ceQuickLaunch.runProcInWinD('system32\\calc.exe',['']);
                  break;
                case "myComputer":
                  win.ceQuickLaunch.runProcInWinD('explorer.exe',['::{20d04fe0-3aea-1069-a2d8-08002b30309d}']);
                  break;
                case "switchProfile":
                  win.ceQuickLaunch.toProfileManager();
                  break;
              }
            }
          });
      }
    } else {
      var id, name, path, args;
      var file = Cc["@mozilla.org/file/directory_service;1"]
              .getService(Ci.nsIProperties)
              .get("ProfD", Ci.nsIFile);
      file.append("quicklaunch.sqlite");
      var storageService = Cc["@mozilla.org/storage/service;1"]
                   .getService(Ci.mozIStorageService);
      var mDBConn = storageService.openDatabase(file);
      var statement = mDBConn.createStatement("SELECT id,name,path,args FROM myquicklaunch WHERE id=?1");
      statement.bindInt32Parameter(0, buttonID);
      try {
        while(statement.executeStep()) {
          id = statement.getInt32(0);
          name = statement.getUTF8String(1);
          path = statement.getUTF8String(2);
          args = statement.getUTF8String(3);

          var id = "qc-customized-" + id;

          var widget = CustomizableUI.getWidget(id);
          if (widget && widget.provider == CustomizableUI.PROVIDER_API) {
            return;
          }

          CustomizableUI.createWidget(
            { id : id,
              type : "button",
              defaultArea : CustomizableUI.AREA_NAVBAR,
              label : name,
              tooltiptext : name,
              removable: false,
              onCreated: function(aNode) {
                aNode.classList.add("quicklaunch-addonbar");
                aNode.setAttribute("image", "moz-icon:file:///" + path);
              },
              onCommand: function(aEvt) {
                var doc = aEvt.target && aEvt.target.ownerDocument;
                var win = doc && doc.defaultView;
                win.ceQuickLaunch.runProc(path, args);
              }
            });
        }
      } finally{
        statement.reset();
      }
    }
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
    if (Services.appinfo.OS != "WINNT") {
      return;
    }

    var doc = event.target && event.target.ownerDocument;
    var win = doc && doc.defaultView;
    if (!win) {
      return;
    }

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

    var popup = doc.getElementById('PanelUI-MOA-quicklaunchView');
    var items = popup.querySelectorAll('toolbarbutton.user-customized-item');
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
        var toolbarButton = doc.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul", "toolbarbutton");
        toolbarButton.setAttribute('class', 'subviewbutton user-customized-item');
        toolbarButton.setAttribute('label', name);
        toolbarButton.setAttribute('image', 'moz-icon:file:///' + path);
        toolbarButton.setAttribute('commandPath', path);
        toolbarButton.setAttribute('commandArgs', args);
        toolbarButton.setAttribute('oncommand', 'ceQuickLaunch.runProc(this.getAttribute(\'commandPath\'),this.getAttribute(\'commandArgs\'));');
        try {
          popup.insertBefore(toolbarButton, doc.getElementById('separator-manage'));
        } catch(e) {
          continue;
        }
      }
      doc.getElementById('separator-manage').hidden = !hasItem;
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

