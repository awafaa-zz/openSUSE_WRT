///////////////////////////////////////////////////////////////////////////////
// The FeedUpdateBroker class implements a simple RSS fetcher and parser.
// Adapted from WRTKit RssReader example

// Constructor.
function FeedUpdateBroker() {
    this.httpReq = null;
    this.feedAddress = null;
    this.callback = null;
	this.ignoreContent = false;
	this.cancelled = false;
	this.responseParser = this.handleRssResponse;
	this.startFromItem = 0;
	this.maxItems = 0;
}

// Fetches a feed from the specified URL and calls the callback when the feed
// has been fetched and parsed, or if the process results in an error.
FeedUpdateBroker.prototype.doFetchFeed = function(){    
    // create new XML HTTP request
    this.httpReq = new Ajax();
    
    // set callback
    var self = this;
    this.httpReq.onreadystatechange = function() { self.readyStateChanged(); };

	var fullURL = this.feedAddress;
    if (fullURL.indexOf("?") == -1) {
        fullURL += "?";
    } else {
        fullURL += "&";
    }
    fullURL += "nocache=" + (new Date().getTime());

    // initiate the request
    this.httpReq.open("GET", fullURL, true);
    this.httpReq.send(null);
}

// has been fetched and parsed, or if the process results in an error.
FeedUpdateBroker.prototype.fetchFeed = function(feedURL, callback) {
    // remember callback
    this.callback = callback;
    this.feedAddress = feedURL;
	this.doFetchFeed();
}

// Callback for ready-state change events in the XML HTTP request.
FeedUpdateBroker.prototype.readyStateChanged = function() {
    // complete request?
    if (this.httpReq.readyState == 4) {
        // attempt to get response status
        var responseStatus = null;
        try {
            responseStatus = this.httpReq.status;
        } catch (noStatusException) {}
        
		// are we being prompted for login?
		var text = this.httpReq.responseText;
		if ( isLoginPrompt (text) ) {
			var self = this;
			login(function(){self.doFetchFeed();});
			return;
		}
		
        // handle the response and call the registered callback object
		var response = this.httpReq.responseXML;
		if (response == null) {
			// if the content type is not set correctly, we get the response as text
			var xmlparser = new DOMParser();
		    response = xmlparser.parseFromString(this.httpReq.responseText, "text/xml");
		}
        this.callback.feedUpdateCompleted(this.handleResponse(responseStatus, response));
    }
}

// Handles a completed response.
FeedUpdateBroker.prototype.handleResponse = function(responseStatus, xmlDoc){
	if (this.responseParser == null) {
		return this.handleRssResponse(responseStatus, xmlDoc);
	}
	else {
		return this.responseParser.call(this, this, responseStatus, xmlDoc);
	}	
}


FeedUpdateBroker.prototype.handleRssResponse = function(broker, responseStatus, xmlDoc){
	if ( this.cancelled ) {
        return { status: "cancelled" };
	}
    if (responseStatus == 200 && xmlDoc != null) {
        // node ref for iterating
        var node;
        
        // get last modified time - default to current time
        var lastModified = new Date().getTime();
        var channelElements = xmlDoc.getElementsByTagName("channel");
        if (channelElements.length > 0) {
            node = channelElements[0].firstChild;
            while (node != null) {
                if (node.nodeType == Node.ELEMENT_NODE) {
                    if (node.nodeName == "pubDate" ||
                            node.nodeName == "lastBuildDate" ||
                            node.nodeName == "dc:date") {
                        lastModified = getTextOfNode(node);
                        break;
                    }
                }
                node = node.nextSibling;
            }
        }
        
        // init feed items array
        var items = [];
        
        // we got the feed XML so now we'll parse it
        var itemElements = xmlDoc.getElementsByTagName("item");
		
        for (var i = this.startFromItem; i < itemElements.length; i++) {
			if ( this.maxItems > 0 && this.maxItems < i ) {
				break;
			}
            // iterate through child nodes of this item and gather
            // all the data we need for a feed item
            var title = null;
            var date = null;
            var description = null;
            var url = null;
            var author = null;
            node = itemElements[i].firstChild;
            while (node != null) {
                if (node.nodeType == Node.ELEMENT_NODE) {
                    if (node.nodeName == "title") {
                        // item title
                        title = getTextOfNode(node);
                    } else if (node.nodeName == "pubDate" || node.nodeName == "dc:date") {
                        // item publishing date
                        date = getTextOfNode(node);
                    } else if (node.nodeName == "description" && !this.ignoreContent ) {
                        // item description
                        description = getTextOfNode(node);
                    } else if (node.nodeName == "link") {
                        // link URL
                        url = getTextOfNode(node);
                    } else if (node.nodeName == "dc:creator" ) {
						author = getTextOfNode(node);
					}
                }
                node = node.nextSibling;
            }
            
            // create the item and add to the items array
            items.push({ title: title, date: date, description: description, url: url, author: author });
        }
        
        // update was completed successfully
        return { status: "ok", lastModified: lastModified, items: items };
    } else {
        // update failed
        return { status: "error" };
    }
}

// Returns the text of a node.
function getTextOfNode(node) {
    var buf = "";
    
    // iterate through all child elements and collect all text to the buffer
    var child = node.firstChild;
    while (child != null) {
        if (child.nodeType == Node.TEXT_NODE || child.nodeType == Node.CDATA_SECTION_NODE) {
            // append text to buffer
            if (buf != "") {
                buf += " ";
            }
            buf += child.nodeValue;
        }
        child = child.nextSibling;
    }
    
    // strip all tags from the buffer
    var strippedBuf = "";
    var textStartPos = -1;
    var tagBalance = 0;
    
    // iterate through the text and append all text to the stripped buffer
    // that is at a tag balance of 0
    for (pos = 0; pos < buf.length; pos++) {
        var c = buf.charAt(pos);
        if (c == '<') {
            // entering a tag
            if (tagBalance == 0 && textStartPos != -1) {
                // everything up to here was valid text
                strippedBuf += buf.substring(textStartPos, pos);
                textStartPos = -1;
            }
            tagBalance++;
        } else if (c == '>') {
            // leaving a tag
            tagBalance--;
            textStartPos = -1;
        } else if (tagBalance == 0 && textStartPos == -1) {
            // first char of text
            textStartPos = pos;
        }
    }
    
    // add remaining text - if any
    if (tagBalance == 0 && textStartPos != -1) {
        strippedBuf += buf.substring(textStartPos, pos);
    }
    
    return strippedBuf;
}

FeedUpdateBroker.prototype.cancel = function() {
	this.cancelled = true;
	this.httpReq.abort();
}
