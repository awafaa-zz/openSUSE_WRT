




function ForumPostForm(aParentView, forumid) {
	ListView.prototype.init.call(this, null, null);
	this.previousView = aParentView;
	this.forumid = forumid;
	
	// add the banner / 'title bar' - avoids the caption bug
	var titleBar = new NavigationButton(null, "titlebar.png", "New thread in " + aParentView.feedName);
	titleBar.setEnabled(false);
	this.addControl(titleBar);
	
	// add topic name textfield
	this.topicNameTf = new TextField('threadPostTopic', "Topic title", "");
	this.addControl(this.topicNameTf);
	
	// add content textarea
	this.contentTa = new TextArea('threadPostContent', "Message", "", 6);
	this.addControl(this.contentTa);
	
	var self = this;

    // post button
    this.postButton = new FormButton(null, "Submit");
    this.postButton.addEventListener("ActionPerformed", function(){
		login( function(){
			submitNewTopic(
				self.topicNameTf.getText(), // title
				self.contentTa.getText(), // message
				self.forumid, // forumid
				function() { self.goBack();uiManager.currentView.update(true);}
				);
			});
		});
    this.addControl(this.postButton);
    
    // cancel settings button
    this.cancelButton = new FormButton(null, "Cancel");
    this.cancelButton.addEventListener("ActionPerformed", function(){self.goBack();});
    this.addControl(this.cancelButton);
	
}

ForumPostForm.prototype = new ListView(null, null);


function ForumReplyForm(aParentView, threadid, postid, parentTitle) {
	ListView.prototype.init.call(this, null, null);
	this.previousView = aParentView;
	this.threadid = threadid;
	this.postid = postid;
	this.parentTitle = parentTitle;
	
	// add the banner / 'title bar' - avoids the caption bug
	var titleBar = new NavigationButton(null, "titlebar.png", "Reply to " + parentTitle);
	titleBar.setEnabled(false);
	this.addControl(titleBar);
	
	// add topic name textfield
	this.topicNameTf = new TextField('threadPostTopic', "Title", "");
	this.addControl(this.topicNameTf);
	
	// add content textarea
	this.contentTa = new TextArea('threadPostContent', "Message", "", 6);
	this.addControl(this.contentTa);
	
	var self = this;

    // post button
    this.postButton = new FormButton(null, "Submit");
    this.postButton.addEventListener("ActionPerformed", function(){
		login(
		function(){
			submitNewReply(self.topicNameTf.getText(), // title
			 self.contentTa.getText(), // message
			 self.threadid, // threadid
			 self.postid, // threadid
			 function(){
				self.goBack();
				uiManager.currentView.update(true);
			});
		});
	});
    this.addControl(this.postButton);
    
    // cancel settings button
    this.cancelButton = new FormButton(null, "Cancel");
    this.cancelButton.addEventListener("ActionPerformed", function(){self.goBack();});
    this.addControl(this.cancelButton);
	
}

ForumReplyForm.prototype = new ListView(null, null);


// Submitting a new to vBulletin is somewhat complex. There appears to be
// no XML based interface so we have to go through the usual web posting
// procedure. So, first we must be logged in. Then, we must request forums
// home page to get bbsessionhash cookie. Next, we request the form,
// to collect required security information (securitytoken etc) from the form.
// If all goes well, we can now post a message.

var submitUrlContent = null;
var submitUrlHttpReq = null;
var submitCallback = null;
var submitTitle = null;
var submitContent = null;
var submitForumId = null;
var submitThreadId = null;
var submitPostId = null;
var submitCallback = null;
var reply = false;

// Initiates the submission process by requesting the form
function submitNewTopic(title, content, forumid, callback){
	uiManager.showNotification(-1, "wait", "Submitting...", -1);

	// Dealing with vBulletin nastiness...
	
	// ensure we have all the cookies we need
	var vbCookieGet = new Ajax();
	var vburl = symbianOrgBaseUrl + "/forum/";
	vbCookieGet.open('GET', vburl, false);
	vbCookieGet.send(null);

	// Now we have to harvest some info from the post form. 	
	submitUrlHttpReq = new Ajax();
	var self = this;
	submitTitle = title;
	submitContent = content;
	submitForumId = forumid;
	submitThreadId = null;
	submitPostId = null;
	submitCallback = callback;
    submitUrlHttpReq.onreadystatechange = submitFormReady;
	reply = false;
	
	var url = symbianOrgBaseUrl + "/forum/newthread.php?do=newthread&f=" + forumid;
	submitUrlHttpReq.open('GET', url, true);
	submitUrlHttpReq.send(null);
}

// Initiates the submission process by requesting the form
function submitNewReply(title, content, threadid, postid, callback){
	uiManager.showNotification(-1, "wait", "Submitting...", -1);
	
	// Dealing with vBulletin nastiness...
	
	// ensure we have all the cookies we need
	var vbCookieGet = new Ajax();
	var vburl = symbianOrgBaseUrl + "/forum/";
	vbCookieGet.open('GET', vburl, false);
	vbCookieGet.send(null);

	// Now we have to harvest some info from the post form. 	
	submitUrlHttpReq = new Ajax();
	var self = this;
	submitTitle = title;
	submitContent = content;
	submitForumId = null;
	submitThreadId = threadid;
	submitPostId = postid;
	submitCallback = callback;
    submitUrlHttpReq.onreadystatechange = submitFormReady;
	reply = true;
	
	var url = symbianOrgBaseUrl + "/forum/newreply.php?do=newreply&noquote=1&p=" + postid;
	submitUrlHttpReq.open('GET', url, true);
	submitUrlHttpReq.send(null);
}


var forumPostHarvestString_loggedinuser = "name=\"loggedinuser\" value=\"";
var forumPostHarvestString_poststarttime = "name=\"poststarttime\" value=\"";		
var forumPostHarvestString_posthash = "name=\"posthash\" value=\"";		
var forumPostHarvestString_securitytoken = "name=\"securitytoken\" value=\"";		
		
// Form has been received, extract important info
function submitFormReady(){
	uiManager.showNotification(-1, "wait", "Submitting...", -1);
    if (submitUrlHttpReq.readyState == 4) {
        // attempt to get response status
        var responseStatus = null;
        try {
            responseStatus = submitUrlHttpReq.status;
        } catch (noStatusException) {}
        
		
		var content = submitUrlHttpReq.responseText;
		checkForSecurityToken("submitFormReady", content);

		// this is what we need to hardvest
		var forumPostSecurityToken, forumPostHash, forumPostStartTime, forumPostLoggedInUser;
		
		if ( content.indexOf(forumPostHarvestString_loggedinuser) == -1 ) {
			uiManager.showNotification(5000, "warning", "Submit failed.");	
		} else {
			forumPostLoggedInUser = extractFormField(content, forumPostHarvestString_loggedinuser);
			forumPostStartTime = extractFormField(content, forumPostHarvestString_poststarttime);
			forumPostHash = extractFormField(content, forumPostHarvestString_posthash);
			forumPostSecurityToken = extractFormField(content, forumPostHarvestString_securitytoken);
			
			if (forumPostSecurityToken == null || forumPostSecurityToken.length < 5) {
			    // workaround for a vBulletin bug, restart the process...
				login( function(){
					if (reply) {
						submitNewReply(submitTitle, // title
						 submitContent, // message
						 submitThreadId, // threadid
						 submitPostId, // threadid
						 submitCallback);
					}
					else {
						submitNewTopic(submitTitle, // title
							 submitContent, // message
							 submitForumId, // forumid
							 submitCallback);
					}
				});
			} else {
				doSubmitPost(submitTitle, submitContent, submitForumId, submitCallback, forumPostSecurityToken, forumPostHash, forumPostStartTime, forumPostLoggedInUser);
			}
		}
    }
}

// Send a POST request with our post information
function doSubmitPost(title, message, forumid, callback, 
			forumPostSecurityToken, forumPostHash, forumPostStartTime, forumPostLoggedInUser){
	uiManager.showNotification(-1, "wait", "Submitting...", -1);
	var url = null;
	var parameters = null;
	
	if (reply) {
		// posting a reply to an article
		url = symbianOrgNewReplyUrl + "do=postreply&t=" + submitThreadId;
		parameters = "title=" + title + "&message=" + message +
		"&wysiwyg=0&iconid=0&s=&securitytoken=" + forumPostSecurityToken +
		"&do=postreply" +
		"&t=" + submitThreadId + "&p=" + submitPostId + 
		"&specifiedpost=0" +
		"&posthash" + forumPostHash +
		"&poststarttime=" + forumPostStartTime +
		"&loggedinuser=" + forumPostLoggedInUser +
		"&multiquoteempty=&sbutton=Submit+Reply&parseurl=1&emailupdate=9999&rating=0";
	} else {
		// posting a new thread
		url = symbianOrgNewThreadUrl + "do=postthread&f=" + forumid;
		parameters = "do=postthread&f=" + forumid + "&subject=" + title + "&message=" + message +
		"&wysiwyg=0&taglist=&iconid=0&s=&securitytoken=" + forumPostSecurityToken +
		"&posthash" + forumPostHash +
		"&poststarttime=" + forumPostStartTime +
		"&loggedinuser=" + forumPostLoggedInUser +
		"&sbutton=Submit+New+Thread&parseurl=1&emailupdate=9999&polloptions=4";
	}
	
	submitUrlHttpReq = new Ajax();
    submitUrlHttpReq.onreadystatechange = submitComplete;
    // initiate the request
	submitUrlHttpReq.open('POST', url, true);
	submitUrlHttpReq.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	submitUrlHttpReq.setRequestHeader("Content-length", parameters.length);
	submitUrlHttpReq.setRequestHeader("Connection", "close");
	submitUrlHttpReq.send(parameters);
}

// Response to our POST has been received, analyse the result
function submitComplete(){
    if (submitUrlHttpReq.readyState == 4) {
		// attempt to get response status
		var responseStatus = null;
		try {
			responseStatus = submitUrlHttpReq.status;
		} 
		catch (noStatusException) {
		}
		var content = submitUrlHttpReq.responseText;
		if ( content.indexOf(submitTitle) == -1 ) {
			uiManager.showNotification(3000, "warning", "Posting failed.");	
		} else {
			uiManager.showNotification(3000, "warning", "Please wait...");	
			if ( submitCallback != null ) {
				submitCallback.call();
			}
		}
	}	
}

// Test weather page HTML contains a login form. This is useful in
// being able to tell weather a login has been successfull, or if
// we received login prompt instead of XML at any point.
function isLoginPrompt (text) {
	return text.indexOf("form name=\"frmLogin\"") != -1;
}

// Stores the current view, then shows the settings dialog
// so that once settings dialog is closed, we go back to current screen
function promptForPassword() {
		if (uiManager.currentView == settings) {
			settings.previousView = home;
		}
		else {
			settings.previousView = uiManager.currentView;
		}
		uiManager.hideNotification();
		settings.show();
}

function extractFormField(content, harvestString){
	var startind = content.indexOf(harvestString);
	if ( startind == -1 ) {
		return null;
	}
	startind += harvestString.length;
	var endind = content.indexOf("\"", startind);
	return content.substring(startind, endind);
}

function checkForSecurityToken(where, content) {
//	var stpos = content.indexOf("securitytoken");
//	if ( stpos == -1 ) {
//		var test = content.substring(stpos , stpos + 100);
//		alert("securityToken not found in " + where + " : "+ test);
//	}
}
