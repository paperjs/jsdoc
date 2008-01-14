	/**
	 * @class Painter responsible for drawing the FeatureTransaction objects.
	 * @author Pieter De Graef
	 *
	 * @constructor
	 * @extends Painter
	 */
	FeatureTransactionPainter = function () {
		this.pointStyle = "stroke: rgb(0,0,0); fill: rgb(255,255,255); fill-opacity: 0.7; stroke-width:0.12%"; // circle tag!
		this.lineStyle = "stroke:rgb(255,0,255);stroke-width:0.3%;fill-opacity:0;";
	}


FeatureTransactionPainter.prototype = {
	

	/**
	 * @param object A FeatureTransaction object.
	 * @param graphics A GraphicsContext object, responsible for actual drawing.
	 */
	paint : function (/**Object*/object, /**GraphicsContext*/graphics) {
		graphics.setModus (graphics.statics.VIEW_SPACE_MODUS);
		graphics.setStatus (this.status);
		var features = object.getNewFeatures();
		if (features == null) {
			return;
		}
		for (var i=0; i<features.length; i++) {
			var geometry = graphics.getTransform().worldGeometryToView(features[i].getGeometry());
			if (geometry instanceof Point) {
				this._paintPoint (geometry, graphics, object);
			} else if (geometry instanceof LineString) {
				this._paintLineString (geometry, graphics, object);
			} else if (geometry instanceof Polygon) {
				this._paintPolygon (geometry, graphics, object);
			} else if (geometry instanceof MultiPolygon) {
				this._paintPolygon (geometry, graphics, object);
			} else if (geometry instanceof MultiLineString) {
				this._paintLineString (geometry, graphics, object);
			}
		}
		graphics.setModus (graphics.statics.WORLD_SPACE_MODUS);
	},

	_paintPoint : function (point, graphics, featureTransaction) {
	},

	_paintLineString : function (lineString, graphics, featureTransaction) {
		var coords = lineString.getCoordinates();
		graphics.setStyle (this.lineStyle);
		graphics.drawLine ("featureTransaction.feature0.line", lineString);

		// Points:
		for (var i=0; i<coords.length; i++) {
			var circle = new Circle (featureTransaction.getPointId(0, i));
			circle.setR ("1%");
			circle.setPosition (coords[i]);
			circle.setStyle (this.pointStyle);
			graphics.drawCircle (circle.getId(), circle);
		}
	},

	_paintPolygon : function (polygon, graphics, featureTransaction) {
		var coords = polygon.getCoordinates();
		graphics.setStyle (this.lineStyle);
		graphics.drawPolygon ("featureTransaction.feature0.line", polygon);

		// Points:
		for (var i=0; i<coords.length-1; i++) {
			var circle = new Circle (featureTransaction.getPointId(0, i));
			circle.setR ("1%");
			circle.setPosition (coords[i]);
			circle.setStyle (this.pointStyle);
			graphics.drawCircle (circle.getId(), circle);
		}
	}

};