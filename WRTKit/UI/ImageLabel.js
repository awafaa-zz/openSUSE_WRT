///////////////////////////////////////////////////////////////////////////////
// The ImageLabel class implements a control that displays an image

// Constructor.
function ImageLabel(id, caption, image) {
    if (id != UI_NO_INIT_ID) {
        this.init(id, caption, image);
    }
}

// Label inherits from Control.
ImageLabel.prototype = new Control(UI_NO_INIT_ID);

// Content element for label text.
ImageLabel.prototype.contentElement = null;

// Content element for label text.
ImageLabel.prototype.image = null;

// Initializer - called from constructor.
ImageLabel.prototype.init = function(id, caption, image) {
    uiLogger.debug("ImageLabel.init(" + id + ", " + caption + ", " + image + ")");
    
    // call superclass initializer
    Control.prototype.init.call(this, id, caption);
    
	this.image = image;
	
    // create content element
    this.contentElement = document.createElement("div");
    this.controlElement.appendChild(this.contentElement);
    
    // set the image
    this.setImage(image);
}

// Returns the enabled state for the control.
ImageLabel.prototype.isEnabled = function() {
    return true;
}

// Returns the focusable state for the control.
ImageLabel.prototype.isFocusable = function() {
    return false;
}

// Returns the control text.
ImageLabel.prototype.getImage = function() {
    return this.contentElement.innerHTML;
}

// Sets the text for the control.
ImageLabel.prototype.setText = function(text) {
    uiLogger.debug("Label.setText(" + text + ")");
    this.contentElement.innerHTML = (text == null) ? "" : text;
    this.updateStyleFromState();
}

// Updates the style of the control to reflects the state of the control.
ImageLabel.prototype.updateStyleFromState = function() {
    uiLogger.debug("Label.updateStyleFromState()");
    
    // set element class names
    this.setClassName(this.rootElement, "Control");
    this.setClassName(this.assemblyElement, "ControlAssembly ControlAssemblyNormal");
    this.setClassName(this.captionElement, "ControlCaption ControlCaptionNormal");
    this.setClassName(this.controlElement, "ControlElement");
    this.setClassName(this.contentElement, "LabelText");
}
