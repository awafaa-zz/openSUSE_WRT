// ////////////////////////////////////////////////////////////////////////////
// (c)2009 Symbian Foundation, Andrew Wafaa
// ////////////////////////////////////////////////////////////////////////////

// Feed presentation classes

// Abstract class used to create controls to represent feed entries.
function FeedPresenter(rssreader){
	if (rssreader) {
		this.init(rssreader);
	}
}

// FeedPresenter "Constructor"
FeedPresenter.prototype.init = function(rssreader){
	this.rssreader = rssreader;
}

// Create a control that represents this item and add it to
// parent rss reader
FeedPresenter.prototype.show = function(item){
}

// Create and add controls to be shown before items list.
FeedPresenter.prototype.addPreambleItems = function(){
}

// No items returned, show "No messages"
FeedPresenter.prototype.showNoItems = function(){
	var label = new Label(null, null, "No messages");
	this.rssreader.addControl(label);
}

// Implementation of FeedPresenter that shows feed in a 
// ContentPanel
function HtmlFeedPresenter(rssreader) {
	if (rssreader) {
		this.init(rssreader);
	}
	this.expanded = false;
}

// HtmlFeedPresenter is a subclass of FeedPresenter
HtmlFeedPresenter.prototype = new FeedPresenter(null);

// HtmlFeedPresenter "constructor"
HtmlFeedPresenter.prototype.init = function(rssreader) {
	FeedPresenter.prototype.init.call(this, rssreader);
}

// Create a control that represents this item and add it to
// parent rss reader
HtmlFeedPresenter.prototype.show = function(item) {
			// get a feed item control from the pool or create one and
		// place it in the pool if there aren't enough feed item controls
		var feedItemControl = new ContentPanel(null, null, null, true);

		// initialize feed item control
		feedItemControl.setCaption(item.title);
		feedItemControl.setContent(this.getContentHTMLForFeedItem(item));
		feedItemControl.setExpanded(this.expanded);
		
		// add the feed item control to the main view
		this.rssreader.feedItemControls.push(feedItemControl);
		this.rssreader.addControl(feedItemControl);
}

// Returns the content HTML for a feed item.
HtmlFeedPresenter.prototype.getContentHTMLForFeedItem = function (item){
	var buf = "";
	
	// item date
	if (item.date != null) {
		buf += "<div class=\"FeedItemDate\">" ;
		if ( item.author != null ) {
			buf += item.author + ", ";
		}
		buf += item.date + "</div>";
	}
	
	// item description
	if (item.description != null) {
		buf += "<div class=\"FeedItemDescription\">" + item.description + "</div>";
	}

	if (item.url != null) {
		// blogs
        buf += "<div class=\"FeedItemLink\">";
//            buf += "<a href=\"JavaScript:void(0)\" onclick=\"openURL('" + item.title + "', '" + item.url + "'); return false;\">";
            buf += "<a href=\"JavaScript:void(0)\" onclick=\"openURL('" + item.url + "'); return false;\">";
            buf += "Read more...";
            buf += "</a>";
        buf += "</div>";
	}
	
	return buf;
}


// Implementation of FeedPresenter that shows feed as a clickable
// button that shows feed entry title as label
function ButtonFeedPresenter(rssreader) {
	if (rssreader) {
		this.init(rssreader);
	}
	this.indexCounter = 0;
	this.items = [];
}

// ButtonFeedPresenter is a subclass of FeedPresenter
ButtonFeedPresenter.prototype = new FeedPresenter(null);

// ButtonFeedPresenter "constructor"
ButtonFeedPresenter.prototype.init = function(rssreader) {
	FeedPresenter.prototype.init.call(this, rssreader);
}

// Create a control that represents this item and add it to
// parent rss reader
ButtonFeedPresenter.prototype.show = function(item) {
	this.items[this.indexCounter] = item;
	// get a feed item control from the pool or create one and
	// place it in the pool if there aren't enough feed item controls
	var feedItemControl = new NavigationButton(this.indexCounter, "right.gif", item.title);

	// add button press handler
    var self = this;
	feedItemControl.addEventListener("ActionPerformed", 
		function(event) { self.feedClicked(event); } );

	this.indexCounter++;
		
	// add the feed item control to the main view
	this.rssreader.feedItemControls.push(feedItemControl);
	this.rssreader.addControl(feedItemControl);
}

// Handle the button-press
ButtonFeedPresenter.prototype.feedClicked = function(event){
	var clickedButton = event.source;
	var id = clickedButton.id;
	var url = this.items[id].url;
	
	if (url.indexOf("/wiki/index.php")) {
		// hack for printable wiki pages
		var articleName = url.replace(wikiBaseUrl + "/", "");
		url = wikiBaseUrl + "?title=" + articleName + "&action=render";
		openURL(url);
	}
	else {
		openURL(url);
	}
}


