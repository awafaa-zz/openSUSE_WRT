

var bugzillaTableStyle = "bugzilla";

// Bugzilla access 

function BugzillaSearchPanel(parent) {
	this.previousView = parent;
	ListView.prototype.init.call(this, null, null);	

	// add the banner and 'title bar' - avoids the caption bug
	var titleBar = new NavigationButton(null, "titlebar.png", "Bugzilla");
	titleBar.setEnabled(false);
	this.addControl(titleBar);
	
	// search term control
    this.searchTerm = new TextField('bugzillaSearchTerm', "Bugzilla search term:", "test");
    this.addControl(this.searchTerm);

	// add the search box
	this.searchButton = new FormButton(null, "Search");
	var self = this;
    this.searchButton.addEventListener("ActionPerformed", function(){
		self.bugzillaSearchClicked();
	});
	this.addControl(this.searchButton);
}


BugzillaSearchPanel.prototype = new ListView(null,null);


BugzillaSearchPanel.prototype.bugzillaSearchClicked = function() {
	// create the RssReader for bugzilla
	var searchString = this.searchTerm.getText();
	var title = "Bugzilla: " + searchString;
	var url = "https://bugzilla.novell.com/index.cgi"
		+ "bug_status=NEW&bug_status=ASSIGNED&bug_status=UNCONFIRMED"
		+ "&field-1-0-0=bug_status&field0-0-0=product&field0-0-1=component&field0-0-2=short_desc"
		+ "&field0-0-3=status_whiteboard&field0-0-4=longdesc"
		+ "&query_format=advanced&remaction=&type-1-0-0=anyexact"
		+ "&type0-0-0=substring&type0-0-1=substring&type0-0-2=substring&type0-0-3=substring"
		+ "&type0-0-4=substring&value-1-0-0=NEW%2CASSIGNED%2CUNCONFIRMED"
		+ "&value0-0-0=" + searchString
		+ "&value0-0-1=" + searchString
		+ "&value0-0-2=" + searchString
		+ "&value0-0-3=" + searchString
		+ "&value0-0-4=" + searchString
		+ "&title=Bug List&ctype=atom";
	var reader = new RssReader(title, url, new BugzillaFeedPresenter(null), this, parseBugzillaFeed);
	reader.show();
}


function parseBugzillaFeed(broker, responseStatus, xmlDoc) {
    if (responseStatus == 200 && xmlDoc != null) {
        // node ref for iterating
        var node;

		// for compatibility with rss
		var lastModified = new Date();
		
        // init result items array
        var items = [];

		var itemElements = xmlDoc.getElementsByTagName("entry");
		
		for (var i = 0; i < itemElements.length; i++) {
            // iterate through child nodes of this item and gather
            // all the data we need for a feed item
            var title = null;
            var date = null;
            var description = null;
            var url = null;
            var author = null;
			var bugid;
            node = itemElements[i].firstChild;
            while (node != null) {
                if (node.nodeType == Node.ELEMENT_NODE) {
                    if (node.nodeName == "title") {
                        // item title
                        title = getTextOfNode(node);
						if ( title.length > 48) {
							title = title.substring(0,45) + "...";
						}
                    } else if (node.nodeName == "updated" ) {
                        // item publishing date
                        date = getTextOfNode(node);
                    } else if (node.nodeName == "summary" && !this.ignoreContent ) {
                        // item description
                        description = getTextOfNode(node);
                    } else if (node.nodeName == "link") {
                        // link URL
                        url = node.getAttribute("href");
						// extract bug id
						var ind = url.indexOf("?id=");
						if ( ind != -1 ) {
							bugid = url.substring(ind + 4);
							url = symbianOrgBaseUrl + "/bugtracker/show_bug.cgi?ctype=xml&id="+bugid;
						}
                    } else if (node.nodeName == "author" ) {
						author = getTextOfNode(node);
					}
                }
                node = node.nextSibling;
            }
            items.push({ title: title, date: date, description: description, url: url, author: author });
		}

        // update was completed successfully
        return { status: "ok", lastModified: lastModified, items: items };
    } else {
        // update failed
        return { status: "error" };
    }
}


// Implementation of FeedPresenter that shows feed as a clickable
// button and shows feed entry title as label
function BugzillaFeedPresenter(rssreader) {
	ButtonFeedPresenter.prototype.init.call(this, rssreader);
}

// BugzillaFeedPresenter is a subclass of ButtonFeedPresenter
BugzillaFeedPresenter.prototype = new ButtonFeedPresenter(null);

// Handle the button-press
BugzillaFeedPresenter.prototype.feedClicked = function(event){
	var clickedButton = event.source;
	var id = clickedButton.id;
	var url = this.items[id].url;
	var presenter = new HtmlFeedPresenter(null);
	presenter.expanded = true;
	var reader = new RssReader(this.items[id].title, url, 
		presenter, uiManager.currentView, parseBugzillaBugFeed);
	reader.show();
}


function parseBugzillaBugFeed(broker, responseStatus, xmlDoc) {
    if (responseStatus == 200 && xmlDoc != null) {
        // node ref for iterating
        var node;

		// for compatibility with rss
		var lastModified = new Date();
		
        // init result items array
        var items = [];

		var itemElements = xmlDoc.getElementsByTagName("bug");
		
		for (var i = 0; i < itemElements.length; i++) {
            // iterate through child nodes of this item and gather
            // all the data we need for a feed item
            var title = null;
            var date = null;
            var url = null;
            var author = null;
			var bugid = null;
			var creationTime = "Not specified";
			var product = "Not specified";
			var component = "Not specified";
			var classification = "Not specified";
			var op_sys = "Not specified";
			var bug_status = "Not specified";
			var bug_file_loc = "Not specified";
			var priority = "Not specified";
			var severity = "Not specified";
			var target_milestone = "Not specified";
			var version = "Not specified";
			var platform = "Not specified";
			var assignedToName = "Not specified";
			var solutionDetails = "Not specified";
			var longdesc = "";
			var shortDesc = "";
			var bugid = "";
			
            node = itemElements[i].firstChild;
            while (node != null) {
                if (node.nodeType == Node.ELEMENT_NODE) {
                    if (node.nodeName == "bug_id") {
                        // item title
                        bugid = "Bug " + getTextOfNode(node);
                    } else if (node.nodeName == "updated" ) {
                        // item publishing date
                        date = getTextOfNode(node);
                    } else if (node.nodeName == "creation_ts" ) {
                        // item publishing date
                        creationTime = getTextOfNode(node);
                    } else if (node.nodeName == "short_desc" && !this.ignoreContent ) {
                        // item description
                        title = getTextOfNode(node);
                    } else if (node.nodeName == "reporter" ) {
						author = getTextOfNode(node);
					} else if (node.nodeName == "product" ) {
                        product = getTextOfNode(node);
					} else if (node.nodeName == "component" ) {
                        component = getTextOfNode(node);
					} else if (node.nodeName == "classification" ) {
                        classification = getTextOfNode(node);
					} else if (node.nodeName == "version" ) {
                        version = getTextOfNode(node);
					} else if (node.nodeName == "op_sys" ) {
                        op_sys = getTextOfNode(node);
					} else if (node.nodeName == "bug_status" ) {
                        bug_status = getTextOfNode(node);
					} else if (node.nodeName == "bug_file_loc" ) {
                        bug_file_loc = getTextOfNode(node);
					} else if (node.nodeName == "priority" ) {
                        priority = getTextOfNode(node);
					} else if (node.nodeName == "severity" ) {
                        severity = getTextOfNode(node);
					} else if (node.nodeName == "target_milestone" ) {
                        target_milestone = getTextOfNode(node);
					} else if (node.nodeName == "platform" ) {
                        platform = getTextOfNode(node);
					} else if (node.nodeName == "cf_solutiondetails" ) {
                        solutionDetails = getTextOfNode(node);
					} else if (node.nodeName == "long_desc" ) {
                        longdesc += "<br><table style="+bugzillaTableStyle+">";
						var ld_nodes = node.childNodes;
						for ( var tmp = 0 ; tmp < ld_nodes.length ; tmp++ ) {
	                        longdesc += "<tr><td>" 
								+ getTextOfNode(ld_nodes[tmp]) + "</td></tr>";
						}
                        longdesc += "</table>";
					} else if (node.nodeName == "assigned_to" ) {
                        assignedToName = getTextOfNode(node);
					} 
                }
                node = node.nextSibling;
            }
			// format the description
			var description = "<table style="+bugzillaTableStyle+">";
			description += "<tr><td>Reported:" + "</td><td>" + creationTime + "</td></tr>";
			description += "<tr><td>Product:" + "</td><td>" + product + "</td></tr>";
			description += "<tr><td>Component:" + "</td><td>" + component + "</td></tr>";
			description += "<tr><td>Classification:" + "</td><td>" + classification + "</td></tr>";
			description += "<tr><td>Operating system:" + "</td><td>" + op_sys + "</td></tr>";
			description += "<tr><td>Status:" + "</td><td>" + bug_status + "</td></tr>";
			description += "<tr><td>Priority:" + "</td><td>" + priority + "</td></tr>";
			description += "<tr><td>Severity:" + "</td><td>" + severity + "</td></tr>";
			description += "<tr><td>Version:" + "</td><td>" + version + "</td></tr>";
			description += "<tr><td>Platform:" + "</td><td>" + platform + "</td></tr>";
			description += "<tr><td>Reported by:" + "</td><td>" + author + "</td></tr>";
			description += "<tr><td>Assigned to:" + "</td><td>" + assignedToName + "</td></tr>";
			description += "<tr><td>Target milestone:" + "</td><td>" + target_milestone + "</td></tr>";
			description += "<tr><td>File location:" + "</td><td>" + bug_file_loc + "</td></tr>";
			description += "</table>";
			
			description += "<table style="+bugzillaTableStyle+">";
			description += "<tr><td>Description:" + "</td></tr>";
			description += "<tr><td>" + longdesc + "</td></tr>";
			description += "</table>";
			
			description += "<table style="+bugzillaTableStyle+">";
			description += "<tr><td>Solution details:" + "</td></tr>";
			description += "<tr><td>" + solutionDetails + "</td></tr>";
			description += "</table>";			
			
            items.push({ title: title, date: date, description: description, url: url, author: author });
		}

        // update was completed successfully
        return { status: "ok", lastModified: lastModified, items: items };
    } else {
        // update failed
        return { status: "error" };
    }
}

