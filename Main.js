// ////////////////////////////////////////////////////////////////////////////
// (c)2009 Symbian Foundation, Andrew Wafaa
// ////////////////////////////////////////////////////////////////////////////


///////////////////////////////////////////////////////////////////////////////
// A widget for accessing openSUSE.org online resources


// Reference to the WRTKit user interface manager and main view.
var uiManager;

// Global settings / URLs and such

// openSUSE.org web site base URL
var opensuseOrgBaseUrl = "http://en.opensuse.org";
var opensuseOrgBaseUrlSsl = "https://en.opensuse.org.org";
var registrationURL = "https://secure-www.novell.com/selfreg/jsp/createOpenSuseAccount.jsp?target=http://www.opensuse.org";
var blogFeedName = "Planet SUSE";
var blogFeedUrl = "http://planet.opensu.se/rss20.xml";

// FORUM vars and settings 
var forumBaseUrl = "http://forums.opensuse.org";
var opensuseOrgNewThreadUrl = forumBaseUrl+"/newthread.php?";
var forumOrgNewReplyUrl = forumBaseUrl+"/newreply.php?";
var opensuseOrgLoginUrl = "https://forums.opensuse.org/ICSLogin/?%22http://forums.opensuse.org/login/icslogin.php?destination=/%22";
var opensuseOrgLoginUsernameField = "username";
var opensuseOrgLoginPasswordField = "password";
var forumUsername = null	;
var forumPassword = null;

// Feed name, URL etc for forums
var forumFeedName = "openSUSE.org Forums";
var forumFeedURL = forumBaseUrl+ "/external.php?type=RSS2"; //&fulldesc=1&lastpost=1
var forumsForumSpecQuery = "&forumid=";
var forumFeedUpdateFrequency = -1;

var forumGroupsUrl = forumBaseUrl+ "/rss/forum.php?type=groups";
var forumsListUrl = forumBaseUrl+ "/rss/forum.php?type=forums&group=";
var forumThreadUrl = forumBaseUrl+ "/rss/forum.php?type=threadmsgs&threadid=";

// openFATE url etc
var openfateFeedName = "openFATE feature changes";
var openfateFeedUrl = "https://hermes.opensuse.org/feeds/25544.rdf";

// Wiki url etc
var wikiFeedName = "New on openSUSE.org Wiki";
var wikiFeedUrl = opensuseOrgBaseUrl+"/Special:NewPages&feed=rss";
var wikiBaseUrl = opensuseOrgBaseUrl;

// Update variables
var myversion = "0.1";
var versionWikiPageUrl = wikiBaseUrl + "/User:FunkyPenguin/SymbianWidget";
var versionWikiPageString = "Current widget version is [";
var downloadUrl = "http://www.wafaa.eu/Uploads/SUSE/openSUSE.org.wgz";

// UI elements

// blog / forum instances
// all are SOScreen subclasses
var home;   // home screen
var blog;   // RSSReader showing blog
var openfate;   // RSSReader showing openfate
var wiki;   // RSSReader showing wiki
var bugzila; // RSSReader showing bugzilla feeds
var forumGroups; // RSSReader showing list of forum groups
var settings;
var about;

// currently showing SOScreen
var currentScreen = null;

// Controls for the settings view
var forumUsernameControl;
var forumPasswordControl;

// Constants for menu item identifiers.
var MENU_ITEM_SETTINGS = 0;
var MENU_ITEM_REFRESH = 1;
var MENU_ITEM_ABOUT = 2;
var MENU_ITEM_CHECK_UPDATE = 3;

// Flag indicating weather the web site login has been initiated
var loginInitiated = false;
var loginInitiatedCallback = null;


var widgetHomepage = opensuseOrgBaseUrl + "/USER:FunkyPenguin/SymbianWidget";
var aboutText = "<strong>openSUSE.org "+myversion+"</strong><br>"
				+ "openSUSE.org WRT Widget is a Web Runtime application which allows mobile "
				+ "access to openSUSE Forums, Blog, Wiki, openFATE and Bugzilla. <br>"
				+ "For more information and updates check <div class=FeedItemLink>"
				+ "<a href=\"JavaScript:void(0)\" onclick=\"openURL('" 
				+ widgetHomepage 
				+ "'); return false;\">"
				+" openSUSE.org Widget Homepage </a> </div><p>"
				+ "Credits: Andrew Wafaa, Ivan Litovski, Ryan Grentz, James Mentz";


// Called from the onload event handler to initialize the widget.
function init() {
	
    // set tab-navigation mode and show softkeys
    // (only if we are in the WRT environment)
    if (window.widget) {
        widget.setNavigationEnabled(false);
        window.menu.showSoftkeys();
        // create menu
        var settingsMenuItem = new MenuItem("Settings", MENU_ITEM_SETTINGS);
        settingsMenuItem.onSelect = menuItemSelected;
        menu.append(settingsMenuItem);
        var refreshMenuItem = new MenuItem("Refresh", MENU_ITEM_REFRESH);
        refreshMenuItem.onSelect = menuItemSelected;
        menu.append(refreshMenuItem);
		var aboutMenuItem = new MenuItem("About", MENU_ITEM_ABOUT);
		aboutMenuItem.onSelect = menuItemSelected;
		menu.append(aboutMenuItem);
		var updateMenuItem = new MenuItem("Check for updates", MENU_ITEM_CHECK_UPDATE);
		updateMenuItem.onSelect = menuItemSelected;
		menu.append(updateMenuItem);
    }

    // load prefs 
	if (!forumUsername || !forumPassword) {
		loadPreferences();
	}

    // create UI manager
    uiManager = new UIManager();
    
	// Create the home view
	home = new ListView(null, "<img src=logo.png>");
	
	// add forums button
	var forumsButton = new NavigationButton(1, "right.gif", "Forums")
	forumsButton.addEventListener("ActionPerformed", function(){forumGroups.show();});
	home.addControl(forumsButton);

	// add blogs button
	var blogsButton = new NavigationButton(2, "right.gif", "Blogs")
	blogsButton.addEventListener("ActionPerformed", function(){blog.show();});
	home.addControl(blogsButton);
	
	// add openfate button
	var openfateButton = new NavigationButton(2, "right.gif", "openFATE")
	openfateButton.addEventListener("ActionPerformed", function(){openfate.show();});
	home.addControl(openfateButton);

	// add wiki button
	var wikiButton = new NavigationButton(3, "right.gif", "Wiki")
	wikiButton.addEventListener("ActionPerformed", function(){wiki.show();});
	home.addControl(wikiButton);
	
	// add bugzilla button
	var bugzillaButton = new NavigationButton(3, "right.gif", "Bugzilla")
	bugzillaButton.addEventListener("ActionPerformed", function(){login(function(){bugzilla.show();});});
	home.addControl(bugzillaButton);
	
	// soft keys
	home.setupSoftKeys = function()  {
	    if (window.widget) {
			menu.setRightSoftkeyLabel("Exit", function(){window.close();});
	    }
	}
	
	// create blog screen
	blog = new RssReader(blogFeedName, blogFeedUrl, null, home, null);
	
	// create openfate screen
	openfate = new RssReader(openfateFeedName, openfateFeedUrl, null, home, null);

	
	// create wiki screen
	wiki = new RssReader(wikiFeedName, wikiFeedUrl, new ButtonFeedPresenter(null), home, null);
	
	// wiki feed contains full article text for many articles 
	// this takes up a _lot_ of memory. Also we don't 
	// really want the full text at the stage when we want a list
	// of recent articles.
	wiki.ignoreContent = true;
	
	wiki.maxItems = 20;
	
	bugzilla = new BugzillaSearchPanel(home);
	
	// create the top level forums screen - list of forum groups
	// forumsGroup, forum and thread screens are dynamically generated by forumGroups
	forumGroups = new RssReader("Forums", forumGroupsUrl, new ForumGroupsFeedPresenter(null), home, forumGroupsResponseParser);

    // create settings view
    settings = new ListView(null, createCaption("Settings"));
	settings.previousView = home;
	
	var settingsIntroLabel = new Label(null, null, 
		"In order to access all site features, you must login. "
		+ "If you have not registered yet, please click the 'Register' button below.");
		
	settings.addControl(settingsIntroLabel);
    // forum username control
    forumUsernameControl = new TextField('forumUsername', "openSUSE.org username", forumUsername?forumUsername:"");
    settings.addControl(forumUsernameControl);
	
    // forum password control
    forumPasswordControl = new TextField('forumPassword', "openSUSE.org password", forumPassword?forumPassword:"", true);
    settings.addControl(forumPasswordControl);

    // save settings button
    settingsSaveButton = new FormButton(null, "Save");
    settingsSaveButton.addEventListener("ActionPerformed", saveSettingsClicked);
    settings.addControl(settingsSaveButton);
    

    // cancel settings button
    var settingsRegisterButton = new FormButton(null, "Register");
    settingsRegisterButton.addEventListener("ActionPerformed", function(){openURL(registrationURL);});
    settings.addControl(settingsRegisterButton);

    // cancel settings button
    settingsCancelButton = new FormButton(null, "Cancel");
    settingsCancelButton.addEventListener("ActionPerformed", function(){settings.goBack();});
    settings.addControl(settingsCancelButton);
	
	//Create about view
	about = new ListView(null, createCaption("openSUSE.org"));
    about.previousView = home;
	// About label control
	aboutLabel = new ContentPanel(null, null, null, true);
	aboutLabel.setCaption("About this Widget");
	aboutLabel.setContent(aboutText);
	aboutLabel.setExpanded(true);
	about.addControl(aboutLabel);

	home.show();
	login(null);	
}

// Callback for when menu items are selected.
function menuItemSelected(id) {
	var currentView = uiManager.getView();
    switch (id) {
        case MENU_ITEM_SETTINGS:
			if ( currentView == settings || currentView == about) {
				settings.previousView = home;
			} else {
				settings.previousView = currentView;
			}
			uiManager.hideNotification();
            settings.show();
            break;
        case MENU_ITEM_REFRESH:
            currentView.update(true);
            break;
        case MENU_ITEM_CHECK_UPDATE:
            checkForUpdates();
            break;
		case MENU_ITEM_ABOUT:
			if ( currentView == settings || currentView == about) {
				about.previousView = home;
			} else {
				about.previousView = currentView;
			}
			about.show();
			break;
    }
}

// Loads widget preferences.
function loadPreferences() {
    if (window.widget) {
        // load settings from widget preferences store
        forumUsername = widget.preferenceForKey("forumUsername");
        forumPassword = widget.preferenceForKey("forumPassword");
    }
}

// Loads widget preferences.
function savePreferences() {
    if (window.widget) {
        // save settings in widget preferences store
        widget.setPreferenceForKey(forumUsername, "forumUsername");
        widget.setPreferenceForKey(forumPassword, "forumPassword");
    }
}

// Callback for settings view save button.
function saveSettingsClicked() {
	forumUsername = forumUsernameControl.getText();
	forumPassword = forumPasswordControl.getText();

    // save preferences
    savePreferences();
    
	settings.goBack();
	
	if ( loginInitiated ) {
		login(loginInitiatedCallback);
	}
}

// Opens a URL in a separate browser window
function openURL(url) {
    if (window.widget) {
        // in WRT
        widget.openURL(url);
    } else {
        // outside WRT
        window.open(url, "NewWindow");
    }
}

var updatePageAjax = null;

function checkForUpdates() {
	uiManager.showNotification(-1, "wait", "Checking for updates...", -1);
	updatePageAjax = new Ajax();
	updatePageAjax.onreadystatechange = checkForUpdatesStage2;
	updatePageAjax.open('GET', versionWikiPageUrl, true);
	updatePageAjax.send(null);	
}

function checkForUpdatesStage2() {
    if (updatePageAjax.readyState == 4) {
		// extract version number
		var content = updatePageAjax.responseText;
		var ind = content.indexOf(versionWikiPageString);
		if ( ind == -1 ) {
			uiManager.showNotification(3000, "warning", "Update failed, check manually.");
			return;
		}
		ind += versionWikiPageString.length;
		var ind2 = content.indexOf("]",ind);
		if ( ind2 == -1 || (ind2-ind) > 10 ) {
			uiManager.showNotification(3000, "warning", "Update failed, check manually.");
			return;
		}
		var version = content.substring(ind,ind2);
		// compare to this version
		if ( version != myversion ) {
			var answer = confirm("Install new version " + version + "?");
			if (answer) {
				// ok, we have the update
				uiManager.hideNotification();
				openURL(downloadUrl);
			} else {
			uiManager.showNotification(3000, "info", "Update cancelled.");
			}
		} else {
			uiManager.showNotification(3000, "info", "Up to date!");
		}
	}
}

function createCaption(caption) {
	if (caption.length > 30) {
		caption = caption.substring(0, 30) + "...";
	}
	return  "<table border=0>"
		+ "<tr><td><img src=titlebar.png style=\"{vertical-align:middle}\" > </td></td><td>" 
		+ "<p class=ListViewCaptionText>"+ caption +"</p>"
		+ "</td></tr></table>";
}
