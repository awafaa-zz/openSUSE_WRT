// ////////////////////////////////////////////////////////////////////////////
// (c)2009 Symbian Foundation
// ////////////////////////////////////////////////////////////////////////////

// Forums

// Forums have the following structure:
//
// Forum group list
//   Forum list
//     Thread list
//       Message list

// All four views are based on customised RssReader. We customise two aspects:
// - Parsing XML - data is not RSS
// - Handling item selection (e.g. creating a new view for a newly selected forum)

// /////////////////////////////////////////////////////////////////////////////
// Forum groups

// response parser for forum groups
function forumGroupsResponseParser(broker, responseStatus, xmlDoc) {
    if (responseStatus == 200 && xmlDoc != null) {
        // node ref for iterating
        var node;

		// for compatibility with rss
		var lastModified = new Date();
		
        // init result items array
        var items = [];

		var elements = xmlDoc.getElementsByTagName("group");
		for (var i = 0; i < elements.length; i++) {
			var groupid = elements[i].getAttribute("id");
			var grouptitle = elements[i].getAttribute("title");
            items.push({ id: groupid, title: grouptitle});
		}

        // update was completed successfully
        return { status: "ok", lastModified: lastModified, items: items };
    } else {
        // update failed
        return { status: "error" };
    }
}

// FeedPresenter implementation for forum groups
function ForumGroupsFeedPresenter(rssreader){
	if (rssreader) {
		this.init(rssreader);
	}
}

// ForumGroupsFeedPresenter is a subclass of ButtonFeedPresenter
ForumGroupsFeedPresenter.prototype = new ButtonFeedPresenter(null);

// ForumGroupsFeedPresenter "Constructor"
ForumGroupsFeedPresenter.prototype.init = function(rssreader) {
	ButtonFeedPresenter.prototype.init.call(this, rssreader);
}

// Handle the click on a specific item
ForumGroupsFeedPresenter.prototype.feedClicked = function(event){
	var buttonid = event.source.id;
	
	if (buttonid == "latestPosts") {
		// show latest posts
		var url = forumFeedURL;
		var latestPostsView = new RssReader("Latest posts", url, new LatestPostsFeedPresenter(null), this.rssreader, null);
		latestPostsView.show();
	}
	else {
		// show forum group
		var groupid = this.items[buttonid].id;
		var grouptitle = this.items[buttonid].title;
		
		var url = forumsListUrl + groupid;
		var forumListView = new RssReader(grouptitle, url, new ForumsListFeedPresenter(null), this.rssreader, forumListResponseParser);
		forumListView.show();
	}
}

// Create and add controls to be shown before items list.
ForumGroupsFeedPresenter.prototype.addPreambleItems = function(){
	var feedItemControl = new NavigationButton("latestPosts", "blueright.gif", "Latest posts");
    var self = this;
	feedItemControl.addEventListener("ActionPerformed", function(event) { self.feedClicked(event); });
	this.rssreader.addControl(feedItemControl);
}


// ///////////////////////////////////////////////////////////////////////////
// List of forums in a group

// response parser for forum list - in a group
function forumListResponseParser(broker, responseStatus, xmlDoc) {
    if (responseStatus == 200 && xmlDoc != null) {
        // node ref for iterating
        var node;

		// for compatibility with rss
		var lastModified = new Date();
		
        // init result items array
        var items = [];

		// extract items for all group elements
		var elements = xmlDoc.getElementsByTagName("group");
		for (var i = 0; i < elements.length; i++) {
			var forumid = elements[i].getAttribute("id");
			var forumtitle = elements[i].getAttribute("title");
            items.push({ id: forumid, title: forumtitle});
		}

        // update was completed successfully
        return { status: "ok", lastModified: lastModified, items: items };
    } else {
        // update failed
        return { status: "error" };
    }
}

// FeedPresenter implementation for forum groups
function ForumsListFeedPresenter(rssreader){
	if (rssreader) {
		this.init(rssreader);
	}
}

// ForumsListFeedPresenter is a subclass of ButtonFeedPresenter
ForumsListFeedPresenter.prototype = new ButtonFeedPresenter(null);

// ForumsListFeedPresenter constructor
ForumsListFeedPresenter.prototype.init = function(rssreader) {
	ButtonFeedPresenter.prototype.init.call(this, rssreader);
}


// forum has been selected, create a reader showing threads in the forum
ForumsListFeedPresenter.prototype.feedClicked = function(event){
	var buttonid = event.source.id;
	if (buttonid == "latestPosts") {
		// show latest posts
		var url = forumFeedURL + "&forumids=";
		// append requested forum ids
		for( var i = 0; i < this.items.length; i++) {
			url += this.items[i].id + ",";
		}
		
		var latestPostsView = new RssReader(
			"Latest posts in " + this.rssreader.feedName, 
			url, 
			new LatestPostsFeedPresenter(null), 
			this.rssreader, 
			null);
		latestPostsView.show();
	}
	else {
		var forumid = this.items[buttonid].id;
		var forumtitle = this.items[buttonid].title;
		
		var url = forumFeedURL + forumsForumSpecQuery + forumid;
		var forumListView = new RssReader(forumtitle, url, new ThreadListFeedPresenter(null), this.rssreader, null);
		forumListView.show();
	}
}

// Create and add controls to be shown before items list.
ForumsListFeedPresenter.prototype.addPreambleItems = function(){
	var feedItemControl = new NavigationButton("latestPosts", "blueright.gif", "Latest posts in " + this.rssreader.feedName);
    var self = this;
	feedItemControl.addEventListener("ActionPerformed", function(event) { self.feedClicked(event); });
	this.rssreader.addControl(feedItemControl);
}



// ///////////////////////////////////////////////////////////////////////////
// List of threads in a forum

// response parser for thread list is the usual rss parser

// FeedPresenter implementation for forum groups
function ThreadListFeedPresenter(rssreader){
	if (rssreader) {
		this.init(rssreader);
	}
}

// ThreadListFeedPresenter is a subclass of ButtonFeedPresenter
ThreadListFeedPresenter.prototype = new ButtonFeedPresenter(null);

// ThreadListFeedPresenter constructor
ThreadListFeedPresenter.prototype.init = function(rssreader) {
	ButtonFeedPresenter.prototype.init.call(this, rssreader);
}


// Handle the click on a specific item
ThreadListFeedPresenter.prototype.feedClicked = function(event){
	var buttonid = event.source.id;
	
	if (buttonid == "newThread") {
		// extract forum id from rssreader.feedURL
		var ind = this.rssreader.feedURL.indexOf(forumsForumSpecQuery);
		var forumid = this.rssreader.feedURL.substring( ind + forumsForumSpecQuery.length);
		var postForm = new ForumPostForm(this.rssreader, forumid);
		postForm.show();
	}
	else {
		var weburl = this.items[buttonid].url;
		
		// extract thread id from url. looking for t=xxx
		var ind1 = weburl.indexOf("?t=");
		if (ind1 == -1) {
			ind1 = weburl.indexOf("&t=");
		}
		if (ind1 != -1) {
			var threadid = "";
			var ind2 = weburl.indexOf("&", ind1);
			if (ind2 == -1) {
				threadid = weburl.substring(ind1 + 3); // ?t=
			}
			else {
				threadid = weburl.substring(ind1 + 3, ind2); // ?t=
			}
			var url = forumThreadUrl + threadid;
			var title = this.items[buttonid].title;
			if (title.length > 30) {
				title = title.substring(0, 30) + "...";
			}
			var threadView = new RssReader(title, url, new ThreadFeedPresenter(null), this.rssreader, threadResponseParser);
			threadView.show();
		}
	}
}

// Create and add controls to be shown before items list.
ThreadListFeedPresenter.prototype.addPreambleItems = function(){
	var feedItemControl = new NavigationButton("newThread", "blueright.gif", "Post a new thread");
    var self = this;
	feedItemControl.addEventListener("ActionPerformed", function(event) { self.feedClicked(event); });
	this.rssreader.addControl(feedItemControl);
}

// ///////////////////////////////////////////////////////////////////////////
// List of messages in a thread

// response parser for thread list
function threadResponseParser(broker, responseStatus, xmlDoc) {
    if (responseStatus == 200 && xmlDoc != null) {
        // node ref for iterating
        var node;

		// for compatibility with rss
		var lastModified = new Date();
		
        // init result items array
        var items = [];

		// iterate over message elements
		var elements = xmlDoc.getElementsByTagName("message");
		for (var i = 0; i < elements.length; i++) {
			var postid;
			var threadid;
			var username;
			var title;
			var dateline;
			var pagetext;
			var isdeleted;
			
			// extract info about the post
			node = elements[i].firstChild;
			while (node != null) {
				if ( node.nodeName == "postid" ) postid=getTextOfNode(node);
				else if ( node.nodeName == "threadid" ) threadid=getTextOfNode(node);
				else if ( node.nodeName == "username" ) username=getTextOfNode(node);
				else if ( node.nodeName == "title" ) title=getTextOfNode(node);
				else if ( node.nodeName == "dateline" ) dateline=getTextOfNode(node);
				else if ( node.nodeName == "pagetext" ) pagetext=getTextOfNode(node);
				else if ( node.nodeName == "isdeleted" ) isdeleted=getTextOfNode(node);
				node = node.nextSibling;
			}
			if ( isdeleted == 1 ) continue;
			
			items.push({
				postid: postid,
				threadid: threadid,
				username: username,
				title: title,
				dateline: dateline,
				pagetext: pagetext
			});
		}

        // update was completed successfully
        return { status: "ok", lastModified: lastModified, items: items };
    } else {
        // update failed
        return { status: "error" };
    }
}

// FeedPresenter implementation for forum groups
function ThreadFeedPresenter(rssreader){
	if (rssreader) {
		this.init(rssreader);
	}
}

// ThreadFeedPresenter is a subclass of HtmlFeedPresenter
ThreadFeedPresenter.prototype = new HtmlFeedPresenter(null);

// ThreadFeedPresenter constructor
ThreadFeedPresenter.prototype.init = function(rssreader) {
	HtmlFeedPresenter.prototype.init.call(this, rssreader);
}


// Handle the click on a specific item
ThreadFeedPresenter.prototype.feedClicked = function(event){
	// do nothing
}

// Create a control that represents this item and add it to
// parent rss reader
ThreadFeedPresenter.prototype.show = function(item) {
	// get a feed item control from the pool or create one and
	// place it in the pool if there aren't enough feed item controls
	var feedItemControl = new ContentPanel(null, null, null, true);

	// initialize feed item control
	var title = item.title;
	if ( title.length == 0 ) { 
		title = "Re:";
		item.title = title;
	}
	feedItemControl.setCaption(bbcode2html(title));
	feedItemControl.setContent(this.getContentHTMLForFeedItem(item));
	feedItemControl.setExpanded(true);
	
	// add the feed item control to the main view
	this.rssreader.feedItemControls.push(feedItemControl);
	this.rssreader.addControl(feedItemControl);
}

// Generate HTML content from the feed item
ThreadFeedPresenter.prototype.getContentHTMLForFeedItem = function (item){
	var buf = "";
	
	// item date
	if (item.dateline != null) {
		var date = new Date();
		date.setTime(item.dateline*1000);
		buf += "<div class=\"FeedItemDate\">" ;
		if ( item.username != null ) {
			buf += item.username + ", ";
		}
		buf += date + "</div>";
	}
	
	// item description
	if (item.pagetext != null) {
		var text = bbcode2html(item.pagetext);
		text = text.replace(/\r\n/g, "<br>");
		buf += "<div class=\"FeedItemDescription\">" + text + "</div>";
        buf += "<div class=\"FeedItemLink\">";
		buf += "<a href=\"JavaScript:void(0)\" onclick=\"showReplyForm(" 
				+ item.threadid+ "," + item.postid + ", '" + item.title
				+ "'); return false;\">";
		buf += "<strong>Reply to this post<strong></a>"
		buf += "</div>";
	}
	
	return buf;
}

// Show the reply-to-post form
function showReplyForm(threadid, postid, title) {
	var replyForm = new ForumReplyForm(uiManager.currentView, threadid, postid, title);
	replyForm.show();
}


// ///////////////////////////////////////////////////////////////////////////
// Latest posts - same as ThreadListFeedPresenter, only has no preamble items
// because it doesn't show one thread (so we can't post to latest items)...

// FeedPresenter implementation for latest posts
function LatestPostsFeedPresenter(rssreader){
	if (rssreader) {
		this.init(rssreader);
	}
}

LatestPostsFeedPresenter.prototype = new ThreadListFeedPresenter(null);

// ForumGroupsFeedPresenter "Constructor"
LatestPostsFeedPresenter.prototype.init = function(rssreader) {
	ButtonFeedPresenter.prototype.init.call(this, rssreader);
}

// LatestPostsFeedPresenter has no preamble items
LatestPostsFeedPresenter.prototype.addPreambleItems = function(){
}


// ///////////////////////////////////////////////////////////////////////////
// Utilities


// feeds contain bbcodes - this function should turn the bbcode markup
// to HTML
function bbcode2html(s) {
	return sanitize(s);
}

// Forum posts can be be quite messy and include bbcodes, smilies etc.
// This function does the minimum by stripping bbcodes and such
function sanitize(text) {
	var prevind = 0;
	var ind = text.indexOf("[");
	if ( ind == -1 ) return text;
	var buf = "";
	while ( ind != -1 ) {
		buf += text.substring(prevind, ind);
		var ind2 = text.indexOf("]", ind);
		if ( ind2 != -1 ) {
			prevind = ind2+1;
		} else {
			break;
		}
		ind = text.indexOf("[", prevind);
	}
	if ( prevind > 0 && prevind < text.length) {
		buf += text.substring(prevind);
	}
	return buf;
}



