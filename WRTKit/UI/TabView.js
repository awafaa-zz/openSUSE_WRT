
function TabView(id, caption) {
    if (id != UI_NO_INIT_ID) {
        this.init(id, caption);
    }
}

// TabView inherits from View.
TabView.prototype = new View(UI_NO_INIT_ID);

// The caption of this view; null if none.
TabView.prototype.caption = null;

// The caption element of this view.
TabView.prototype.captionElement = null;

// The caption element of this view.
TabView.prototype.captionTextElement = null;

// Root HTML element for controls.
TabView.prototype.tabViewRootElement = null;

// HTML element for tabs heading .
TabView.prototype.tabsElement = null;

// HTML element for tab content.
TabView.prototype.tabContent = null;

// List of tabs in the view.
TabView.prototype.tabs = [];

// List of tab captions in the view.
TabView.prototype.tabCaptions = [];

// List of tab captions in the view.
TabView.prototype.tabHeadElements = [];

// Current tab in this view
TabView.prototype.currentTab = null;

// Initializer for TabView.
TabView.prototype.init = function(id, caption) {
    uiLogger.debug("ListView.init(" + id + ", " + caption + ")");
    
    // call superclass initializer
    View.prototype.init.call(this, id);
    
    // init control array
    this.controls = [];
    
    // set style class name for root element - reuse ListView style
    this.rootElement.className = "ListView";
    
    // create caption and caption text elements
    this.captionElement = document.createElement("div");
    this.captionElement.className = "ListViewCaption";
    this.captionTextElement = document.createElement("div");
    this.captionTextElement.className = "ListViewCaptionText";
    this.captionElement.appendChild(this.captionTextElement);
    this.rootElement.appendChild(this.captionElement);
    
    // create root element for controls and add to the view root element
    this.tabViewRootElement = document.createElement("div");
    this.tabViewRootElement.className = "ListViewControlList";
    this.tabsElement = document.createElement("div");
    this.tabsElement.className = "ListViewCaption";
    this.tabContent = document.createElement("div");
    this.tabViewRootElement.appendChild(this.tabsElement);
    this.tabViewRootElement.appendChild(this.tabContent);
    this.rootElement.appendChild(this.tabViewRootElement);
    
    // set the caption
    this.setCaption(caption);
}

// Returns the caption; null if none.
TabView.prototype.getCaption = function() {
    return this.caption;
}

// Sets the caption; null if none.
TabView.prototype.setCaption = function(caption) {
    uiLogger.debug("ListView.setCaption(" + caption + ")");
    
    // set the display style
    this.captionElement.style.display = (caption == null) ? "none" : "block";
    
    // set the caption
    this.caption = caption;
    this.captionTextElement.innerHTML = (caption == null) ? "" : caption;
}

// Add a ListView as a tab
TabView.prototype.addTab = function(tab) {
	this.addTab(tab, tab.getCaption());
}

// Add a ListView as a tab specifying a label
TabView.prototype.addTab = function(tab, label) {
	this.tabs.push(tab);
	this.tabCaptions.push(label);
	// create a element for the tab heading
    var tabHead = document.createElement("div");
	tabHead.className = "TabViewTabCaption";
	tabHead.innerHTML = label;
	this.tabHeadElements.push(tabHead);
    this.tabsElement.appendChild(this.tabHead);
	if ( this.currentTab == null ) {
		setCurrentTab(0);
	}
}

TabView.prototype.setCurrentTab = function(newCurrentTab) {
	// clear focus on current tab
	
	// store the current tab index
	this.currentTab = newCurrentTab;
	
	// set focus on current tab
	
	// update the content element
	this.tabContent.replaceNode(this.tabs[currentTab].rootElement);
}


TabView.prototype.bindTabActionListeners = function() {
    var self = this;
	// bind left-right actions to switching tabs
    this.rootElement.addEventListener("keydown", function(event) { self.handleKeyPress(event); }, true); // capture phase
//	for ( var t = 0; t < this.tabs.length; t++ ) {
//		// bind tab listeners
//	    this.tabHeadElements[t].addEventListener("focus", function() { self.focusStateChanged(true); }, false); // bubble phase
//	    this.tabHeadElements[t].addEventListener("blur", function() { self.focusStateChanged(false); }, false);
//	    this.tabHeadElements[t].addEventListener("mouseover", function() { self.hoverStateChanged(true); }, false);
//	    this.tabHeadElements[t].addEventListener("mouseout", function() { self.hoverStateChanged(false); }, false);
//	    this.tabHeadElements[t].addEventListener("mousedown", function(event){ self.setCurrentTab(t);}, true);
//	}
}

TabView.prototype.handleKeyPress = function(event) {
	if (event.keyCode == 37 ) { // left
		if ( this.currentTab > 0 ) {
			this.setCurrentTab(this.currentTab-1);
		}
		event.stopPropagation();
		event.preventDefault();
	}
	if (event.keyCode == 39 ) { // right
		if ( this.currentTab < this.tabs.length-1 ) {
			this.setCurrentTab(this.currentTab+1);
		}
		event.stopPropagation();
		event.preventDefault();
	}
}
