// nested functions

/** The layout object
	@constructor
 */
function Layout(){
	
	/** an element of the layout
		@constructor
 	*/
	this.Element = function(elName) {
		this.expand = function() {
			
		};
	};
	
	/** 
		@constructor
	 */
	this.Canvas = function(top, left, width, height) {
		/** Is it initiated yet? */
		this.initiated = true;
	}
	
	// inner function
	function rotate() {
	}
	
	this.init(x, y, z) {
		/** The xyz. */
		this.xyz = x+y+z;
		this.getXyz = function() {
		}
	}
}