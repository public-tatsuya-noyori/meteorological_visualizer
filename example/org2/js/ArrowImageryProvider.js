/**
 * @typedef {Object} ArrowImageryProvider.ConstructorOptions
 *
 * Initialization options for the ArrowImageryProvider constructor
 *
 * @property {TilingScheme} [tilingScheme=new Cesium.GeographicTilingScheme()] The tiling scheme for which to draw tiles.
 * @property {Number} [tileWidth=256] The width of the tile for level-of-detail selection purposes.
 * @property {Number} [tileHeight=256] The height of the tile for level-of-detail selection purposes.
 */

/**
 * An {@link ImageryProvider} that draws a box around every rendered tile in the tiling scheme, and draws
 * a label inside it indicating the X, Y, Level coordinates of the tile.  This is mostly useful for
 * debugging terrain and imagery rendering problems.
 *
 * @alias ArrowImageryProvider
 * @constructor
 *
 * @param {ArrowImageryProvider.ConstructorOptions} [options] Object describing initialization options
 */
function ArrowImageryProvider(options) {
  options = Cesium.defaultValue(options, Cesium.defaultValue.EMPTY_OBJECT);

  this._tilingScheme = new Cesium.GeographicTilingScheme();
  this._errorEvent = new Cesium.Event();
  this._tileWidth = 256;
  this._tileHeight = 256;
  this._readyPromise = Cesium.when.resolve(true);
  this._maximumLevel = Cesium.defaultValue(options.level, undefined);
  this._minimumLevel = Cesium.defaultValue(options.level, undefined);
  this._viewerArray = Cesium.defaultValue(options.viewerArray, undefined);
  this._configPropertyTable = Cesium.defaultValue(options.configPropertyTable, undefined);
  this._datetimePath = Cesium.defaultValue(options.datetimePath, undefined);
  this._ft = Cesium.defaultValue(options.ft, undefined);

  this.contourGridFrameHash = {};

  /**propertyArray
   * The default alpha blending value of this provider, with 0.0 representing fully transparent and
   * 1.0 representing fully opaque.
   *
   * @type {Number|undefined}
   * @default undefined
   */
  this.defaultAlpha = undefined;

  /**
   * The default alpha blending value on the night side of the globe of this provider, with 0.0 representing fully transparent and
   * 1.0 representing fully opaque.
   *
   * @type {Number|undefined}
   * @default undefined
   */
  this.defaultNightAlpha = undefined;

  /**
   * The default alpha blending value on the day side of the globe of this provider, with 0.0 representing fully transparent and
   * 1.0 representing fully opaque.
   *
   * @type {Number|undefined}
   * @default undefined
   */
  this.defaultDayAlpha = undefined;

  /**
   * The default brightness of this provider.  1.0 uses the unmodified imagery color.  Less than 1.0
   * makes the imagery darker while greater than 1.0 makes it brighter.
   *
   * @type {Number|undefined}
   * @default undefined
   */
  this.defaultBrightness = undefined;

  /**
   * The default contrast of this provider.  1.0 uses the unmodified imagery color.  Less than 1.0 reduces
   * the contrast while greater than 1.0 increases it.
   *
   * @type {Number|undefined}
   * @default undefined
   */
  this.defaultContrast = undefined;

  /**
   * The default hue of this provider in radians. 0.0 uses the unmodified imagery color.
   *
   * @type {Number|undefined}
   * @default undefined
   */
  this.defaultHue = undefined;

  /**
   * The default saturation of this provider. 1.0 uses the unmodified imagery color. Less than 1.0 reduces the
   * saturation while greater than 1.0 increases it.
   *
   * @type {Number|undefined}
   * @default undefined
   */
  this.defaultSaturation = undefined;

  /**
   * The default gamma correction to apply to this provider.  1.0 uses the unmodified imagery color.
   *
   * @type {Number|undefined}
   * @default undefined
   */
  this.defaultGamma = undefined;

  /**
   * The default texture minification filter to apply to this provider.
   *
   * @type {TextureMinificationFilter}
   * @default undefined
   */
  this.defaultMinificationFilter = undefined;

  /**
   * The default texture magnification filter to apply to this provider.
   *
   * @type {TextureMagnificationFilter}
   * @default undefined
   */
  this.defaultMagnificationFilter = undefined;
}

Object.defineProperties(ArrowImageryProvider.prototype, {
  /**
   * Gets the proxy used by this provider.
   * @memberof ArrowImageryProvider.prototype
   * @type {Proxy}
   * @readonly
   */
  proxy: {
    get: function () {
      return undefined;
    },
  },

  /**
   * Gets the width of each tile, in pixels. This function should
   * not be called before {@link ArrowImageryProvider#ready} returns true.
   * @memberof ArrowImageryProvider.prototype
   * @type {Number}
   * @readonly
   */
  tileWidth: {
    get: function () {
      return this._tileWidth;
    },
  },

  /**
   * Gets the height of each tile, in pixels.  This function should
   * not be called before {@link ArrowImageryProvider#ready} returns true.
   * @memberof ArrowImageryProvider.prototype
   * @type {Number}
   * @readonly
   */
  tileHeight: {
    get: function () {
      return this._tileHeight;
    },
  },

  /**
   * Gets the maximum level-of-detail that can be requested.  This function should
   * not be called before {@link ArrowImageryProvider#ready} returns true.
   * @memberof ArrowImageryProvider.prototype
   * @type {Number|undefined}
   * @readonly
   */
  maximumLevel: {
    get: function () {
      return this._maximumLevel;
    },
  },

  /**
   * Gets the minimum level-of-detail that can be requested.  This function should
   * not be called before {@link ArrowImageryProvider#ready} returns true.
   * @memberof ArrowImageryProvider.prototype
   * @type {Number}
   * @readonly
   */
  minimumLevel: {
    get: function () {
      return this._minimumLevel;
    },
  },

  /**
   * Gets the tiling scheme used by this provider.  This function should
   * not be called before {@link ArrowImageryProvider#ready} returns true.
   * @memberof ArrowImageryProvider.prototype
   * @type {TilingScheme}
   * @readonly
   */
  tilingScheme: {
    get: function () {
      return this._tilingScheme;
    },
  },

  /**
   * Gets the rectangle, in radians, of the imagery provided by this instance.  This function should
   * not be called before {@link ArrowImageryProvider#ready} returns true.
   * @memberof ArrowImageryProvider.prototype
   * @type {Rectangle}
   * @readonly
   */
  rectangle: {
    get: function () {
      return this._tilingScheme.rectangle;
    },
  },

  /**
   * Gets the tile discard policy.  If not undefined, the discard policy is responsible
   * for filtering out "missing" tiles via its shouldDiscardImage function.  If this function
   * returns undefined, no tiles are filtered.  This function should
   * not be called before {@link ArrowImageryProvider#ready} returns true.
   * @memberof ArrowImageryProvider.prototype
   * @type {TileDiscardPolicy}
   * @readonly
   */
  tileDiscardPolicy: {
    get: function () {
      return undefined;
    },
  },

  /**
   * Gets an event that is raised when the imagery provider encounters an asynchronous error.  By subscribing
   * to the event, you will be notified of the error and can potentially recover from it.  Event listeners
   * are passed an instance of {@link TileProviderError}.
   * @memberof ArrowImageryProvider.prototype
   * @type {Event}
   * @readonly
   */
  errorEvent: {
    get: function () {
      return this._errorEvent;
    },
  },

  /**
   * Gets a value indicating whether or not the provider is ready for use.
   * @memberof ArrowImageryProvider.prototype
   * @type {Boolean}
   * @readonly
   */
  ready: {
    get: function () {
      return true;
    },
  },

  /**
   * Gets a promise that resolves to true when the provider is ready for use.
   * @memberof ArrowImageryProvider.prototype
   * @type {Promise.<Boolean>}
   * @readonly
   */
  readyPromise: {
    get: function () {
      return this._readyPromise;
    },
  },

  /**
   * Gets the credit to display when this imagery provider is active.  Typically this is used to credit
   * the source of the imagery.  This function should not be called before {@link ArrowImageryProvider#ready} returns true.
   * @memberof ArrowImageryProvider.prototype
   * @type {Credit}
   * @readonly
   */
  credit: {
    get: function () {
      return undefined;
    },
  },

  /**
   * Gets a value indicating whether or not the images provided by this imagery provider
   * include an alpha channel.  If this property is false, an alpha channel, if present, will
   * be ignored.  If this property is true, any images without an alpha channel will be treated
   * as if their alpha is 1.0 everywhere.  Setting this property to false reduces memory usage
   * and texture upload time.
   * @memberof ArrowImageryProvider.prototype
   * @type {Boolean}
   * @readonly
   */
  hasAlphaChannel: {
    get: function () {
      return true;
    },
  },
});

/**
 * Gets the credits to be displayed when a given tile is displayed.
 *
 * @param {Number} x The tile X coordinate.
 * @param {Number} y The tile Y coordinate.
 * @param {Number} level The tile level;
 * @returns {Credit[]} The credits to be displayed when the tile is displayed.
 *
 * @exception {DeveloperError} <code>getTileCredits</code> must not be called before the imagery provider is ready.
 */
ArrowImageryProvider.prototype.getTileCredits = function (
  x,
  y,
  level
) {
  return undefined;
};

/**
 * Requests the image for a given tile.  This function should
 * not be called before {@link ArrowImageryProvider#ready} returns true.
 *
 * @param {Number} x The tile X coordinate.
 * @param {Number} y The tile Y coordinate.
 * @param {Number} level The tile level.
 * @param {Request} [request] The request object. Intended for internal use only.
 * @returns {Promise.<HTMLImageElement|HTMLCanvasElement>|undefined} A promise for the image that will resolve when the image is available, or
 *          undefined if there are too many active requests to the server, and the request
 *          should be retried later.  The resolved image may be either an
 *          Image or a Canvas DOM object.
 */
ArrowImageryProvider.prototype.requestImage = async function (
  x,
  y,
  level,
  request
) {
  if (level > this._maximumLevel || level < this._minimumLevel) {
    return document.createElement("canvas");
  }
  for (let row of this._configPropertyTable) {
    let viewerIndex = row.get('viewerIndex');
    if (viewerIndex >= this._viewerArray.length) {
      continue;
    }
    let name = row.get('name');
    let urlPrefix = row.get('urlPrefix');
    let locationDatetimeTable = await Arrow.Table.from(fetch([urlPrefix, '/', this._datetimePath, '/', level, '/', x, '/', y, '/location_datetime.arrow'].join('')));
    let urlSuffix = row.get('urlSuffix');
    let propertyTable = await Arrow.Table.from(fetch([urlPrefix, '/', this._datetimePath, '/', level, '/', x, '/', y, '/', this._ft, urlSuffix].join('')));
    let draw = row.get('draw');
    let thresholdStep = row.get('thresholdStep');
    let numberOfStepForColor = row.get('numberOfStepForColor');
    let startValueForColor = row.get('startValueForColor');
    let rangeHslHue = d3.hsl(row.get('startColor')).h;
    let hslHueAngle = row.get('hslHueAngle');
    let size = row.get('size');
    let colorScaleRangeArray = [];
    let colorScaleDomainArray = [];
    let hslHueStep = hslHueAngle / numberOfStepForColor;
    d3.range(startValueForColor, numberOfStepForColor * thresholdStep + startValueForColor, thresholdStep).forEach(domainValue => {
      colorScaleRangeArray.push(d3.hsl(rangeHslHue, 1.0, 0.5));
      colorScaleDomainArray.push(domainValue);
      rangeHslHue = rangeHslHue + hslHueStep;
    });
    let colorScale = d3.scaleLinear().domain(colorScaleDomainArray).range(colorScaleRangeArray);
    let latArray = locationDatetimeTable.getColumn('latitude [degree]').toArray();
    let lonArray = locationDatetimeTable.getColumn('longitude [degree]').toArray();
    let valueArray = propertyTable.getColumn(name).toArray();
    if (draw == 'point') {
      let drawCollection = this._viewerArray[viewerIndex].scene.primitives.add(new Cesium.PointPrimitiveCollection());
      valueArray.forEach((value, i) => {
        drawCollection.add({
          color: Cesium.Color.fromCssColorString(d3.rgb(colorScale(value)).formatHex()),
          pixelSize : size,
          position : Cesium.Cartesian3.fromDegrees(lonArray[i], latArray[i])
        });
      });
    } else if (draw == 'contour') {
      let drawCollection = this._viewerArray[viewerIndex].scene.primitives.add(new Cesium.PolylineCollection());
      let thresholdStart = row.get('thresholdStart');
      let thresholdEnd = row.get('thresholdEnd');
      let thresholdArray = d3.range(thresholdStart, thresholdEnd, thresholdStep);
      let gridSize = row.get('gridSize');

      //let cellSize = row.get('cellSize');

      let propertyKeyPrefix = [urlPrefix, '/', this._datetimePath, '/', this._ft, urlSuffix].join('');
      let propertyKey = [propertyKeyPrefix, '/', level, '/', x, '/', y].join('');
      let frameLatArray = [], frameLonArray = [], frameValueArray = [];
      d3.range(valueArray.length - (2 * gridSize), valueArray.length, 1).forEach(i => {
        frameLatArray.push(latArray[i]);
        frameLonArray.push(lonArray[i]);
        frameValueArray.push(valueArray[i]);
      });
      let frameTI = {minLon: d3.min(frameLonArray), maxLon: d3.max(frameLonArray), minLat: d3.min(frameLatArray), maxLat: d3.max(frameLatArray), dataArray: d3.transpose([frameLonArray, frameLatArray, frameValueArray])}
      this.contourGridFrameHash[propertyKey + '/T'] = frameTI;
      frameLatArray = [], frameLonArray = [], frameValueArray = [];
      d3.range(0, 2 * gridSize, 1).forEach(i => {
        frameLatArray.push(latArray[i]);
        frameLonArray.push(lonArray[i]);
        frameValueArray.push(valueArray[i]);
      });
      let frameBI = {minLon: d3.min(frameLonArray), maxLon: d3.max(frameLonArray), minLat: d3.min(frameLatArray), maxLat: d3.max(frameLatArray), dataArray: d3.transpose([frameLonArray, frameLatArray, frameValueArray])}
      this.contourGridFrameHash[propertyKey + '/B'] = frameBI;
      frameLatArray = [], frameLonArray = [], frameValueArray = [];
      d3.merge([d3.range(gridSize - 2, valueArray.length, gridSize), d3.range(gridSize - 1, valueArray.length, gridSize)]).forEach(i => {
        frameLatArray.push(latArray[i]);
        frameLonArray.push(lonArray[i]);
        frameValueArray.push(valueArray[i]);
      });
      let frameRI = {minLon: d3.min(frameLonArray), maxLon: d3.max(frameLonArray), minLat: d3.min(frameLatArray), maxLat: d3.max(frameLatArray), dataArray: d3.transpose([frameLonArray, frameLatArray, frameValueArray])}
      this.contourGridFrameHash[propertyKey + '/R'] = frameRI;
      frameLatArray = [], frameLonArray = [], frameValueArray = [];
      d3.merge([d3.range(0, valueArray.length, gridSize), d3.range(1, valueArray.length, gridSize)]).forEach(i => {
        frameLatArray.push(latArray[i]);
        if (x == 0) {
          frameLonArray.push(lonArray[i] + 360.0);
        } else {
          frameLonArray.push(lonArray[i]);
        }
        frameValueArray.push(valueArray[i]);
      });
      let frameLI = {minLon: d3.min(frameLonArray), maxLon: d3.max(frameLonArray), minLat: d3.min(frameLatArray), maxLat: d3.max(frameLatArray), dataArray: d3.transpose([frameLonArray, frameLatArray, frameValueArray])}
      this.contourGridFrameHash[propertyKey + '/L'] = frameLI
      let frameRE, frameLE, frameBE, frameTE, frameKey;
      if (x == 0) {
        frameKey = [propertyKeyPrefix, '/', level, '/', 1, '/', y, '/L'].join('');
        if (frameKey in this.contourGridFrameHash) {
          frameRE = this.contourGridFrameHash[frameKey];
        }
        frameKey = [propertyKeyPrefix, '/', level, '/', 2**(level + 1) - 1, '/', y, '/R'].join('');
        if (frameKey in this.contourGridFrameHash) {
          frameLE = this.contourGridFrameHash[frameKey];
        }
      } else if (x == 2**(level + 1) - 1) {
        frameKey = [propertyKeyPrefix, '/', level, '/', 0, '/', y, '/L'].join('');
        if (frameKey in this.contourGridFrameHash) {
          frameRE = this.contourGridFrameHash[frameKey];
        }
        frameKey = [propertyKeyPrefix, '/', level, '/', x - 1, '/', y, '/R'].join('');
        if (frameKey in this.contourGridFrameHash) {
          frameLE = this.contourGridFrameHash[frameKey];
        }
      } else {
        frameKey = [propertyKeyPrefix, '/', level, '/', x + 1, '/', y, '/L'].join('');
        if (frameKey in this.contourGridFrameHash) {
          frameRE = this.contourGridFrameHash[frameKey];
        }
        frameKey = [propertyKeyPrefix, '/', level, '/', x - 1, '/', y, '/R'].join('');
        if (frameKey in this.contourGridFrameHash) {
          frameLE = this.contourGridFrameHash[frameKey];
        }
      }
      if (y == 0) {
        frameKey = [propertyKeyPrefix, '/', level, '/', x, '/', 1, '/T'].join('');
        if (frameKey in this.contourGridFrameHash) {
          frameBE = this.contourGridFrameHash[frameKey];
        }
      } else if (y == 2**level - 1) {
        frameKey = [propertyKeyPrefix, '/', level, '/', x, '/', y - 1, '/B'].join('');
        if (frameKey in this.contourGridFrameHash) {
          frameTE = this.contourGridFrameHash[frameKey];
        }
      } else{
        frameKey = [propertyKeyPrefix, '/', level, '/', x, '/', y + 1, '/T'].join('');
        if (frameKey in this.contourGridFrameHash) {
          frameBE = this.contourGridFrameHash[frameKey];
        }
        frameKey = [propertyKeyPrefix, '/', level, '/', x, '/', y - 1, '/B'].join('');
        if (frameKey in this.contourGridFrameHash) {
          frameTE = this.contourGridFrameHash[frameKey];
        }
      }
      let contoursArray = [];

      let dataArray = d3.transpose([lonArray, latArray, valueArray]);
      let contours = d3.tricontour().thresholds(thresholdArray)(dataArray);
      contours.minLon = d3.min(lonArray);
      contours.maxLon = d3.max(lonArray);
      contours.minLat = d3.min(latArray);
      contours.maxLat = d3.max(latArray);
      //let contours = d3.contours().thresholds(thresholdArray).size([gridSize, valueArray.length / gridSize])(valueArray);

      contoursArray.push(contours);
      if (frameTE) {
        contours = d3.tricontour().thresholds(thresholdArray)(d3.merge([frameTI.dataArray, frameTE.dataArray]));
        contours.minLon = d3.min([frameTI.minLon, frameTE.minLon]);
        contours.maxLon = d3.max([frameTI.maxLon, frameTE.maxLon]);
        contours.minLat = d3.min([frameTI.minLat, frameTE.minLat]);
        contours.maxLat = d3.max([frameTI.maxLat, frameTE.maxLat]);
        contoursArray.push(contours);
      }
      if (frameBE) {
        contours = d3.tricontour().thresholds(thresholdArray)(d3.merge([frameBI.dataArray, frameBE.dataArray]));
        contours.minLon = d3.min([frameBI.minLon, frameBE.minLon]);
        contours.maxLon = d3.max([frameBI.maxLon, frameBE.maxLon]);
        contours.minLat = d3.min([frameBI.minLat, frameBE.minLat]);
        contours.maxLat = d3.max([frameBI.maxLat, frameBE.maxLat]);
        contoursArray.push(contours);
      }
      if (frameLE) {
        contours = d3.tricontour().thresholds(thresholdArray)(d3.merge([frameLI.dataArray, frameLE.dataArray]));
        contours.minLon = d3.min([frameLI.minLon, frameLE.minLon]);
        contours.maxLon = d3.max([frameLI.maxLon, frameLE.maxLon]);
        contours.minLat = d3.min([frameLI.minLat, frameLE.minLat]);
        contours.maxLat = d3.max([frameLI.maxLat, frameLE.maxLat]);
        contoursArray.push(contours);
      }
      if (frameRE) {
        contours = d3.tricontour().thresholds(thresholdArray)(d3.merge([frameRI.dataArray, frameRE.dataArray]));
        contours.minLon = d3.min([frameRI.minLon, frameRE.minLon]);
        contours.maxLon = d3.max([frameRI.maxLon, frameRE.maxLon]);
        contours.minLat = d3.min([frameRI.minLat, frameRE.minLat]);
        contours.maxLat = d3.max([frameRI.maxLat, frameRE.maxLat]);
        contoursArray.push(contours);
      }
      contoursArray.forEach(contours => {
        contours.forEach(contour => {
          contour.coordinates.forEach(ringArray => {
            ringArray.forEach(pointArray => {
              let polylineArray = [], polyline = [], prePoint = [];
              pointArray.forEach(point => {
                if (prePoint.length > 0) {

                  if ((prePoint[0] == contours.minLon && point[0] == contours.minLon) || (prePoint[0] == contours.maxLon && point[0] == contours.maxLon) || (prePoint[1] == contours.minLat && point[1] == contours.minLat) || (prePoint[1] == contours.maxLat && point[1] == contours.maxLat)) {
                  //if ((prePoint[0] == 0 && point[0] == 0) || (prePoint[0] == gridSize && point[0] == gridSize) || (prePoint[1] == 0 && point[1] == 0) || (prePoint[1] == gridSize && point[1] == gridSize)) {

                    if (polyline.length > 3) {
                      polylineArray.push(polyline);
                    }
                    polyline = [];
                  } else {

                    polyline.push(point[0], point[1]);
                    //polyline.push(x * 180.0 + point[0] * cellSize - 180.0, point[1] * cellSize - 90.0);

                  }
                } else {

                  polyline.push(point[0], point[1]);
                  //polyline.push(x * 180.0 + point[0] * cellSize - 180.0, point[1] * cellSize - 90.0);

                }
                prePoint = point;
              });
              if (polyline.length > 3) {
                polylineArray.push(polyline);
              }
              if (polylineArray.length > 0) {
                polylineArray.forEach(polyline => {
                  drawCollection.add({
                    positions : Cesium.Cartesian3.fromDegreesArray(polyline),
                    width : 1,
                    material: Cesium.Material.fromType('Color', {color: Cesium.Color.fromCssColorString(d3.rgb(colorScale(contour.value)).formatHex())})
                  });
                });
              }
            });
          });
        });
      });
    }
  }
  return document.createElement("canvas");
};

/**
 * Picking features is not currently supported by this imagery provider, so this function simply returns
 * undefined.
 *
 * @param {Number} x The tile X coordinate.
 * @param {Number} y The tile Y coordinate.
 * @param {Number} level The tile level.
 * @param {Number} longitude The longitude at which to pick features.
 * @param {Number} latitude  The latitude at which to pick features.
 * @return {Promise.<ImageryLayerFeatureInfo[]>|undefined} A promise for the picked features that will resolve when the asynchronous
 *                   picking completes.  The resolved value is an array of {@link ImageryLayerFeatureInfo}
 *                   instances.  The array may be empty if no features are found at the given location.
 *                   It may also be undefined if picking is not supported.
 */
ArrowImageryProvider.prototype.pickFeatures = function (
  x,
  y,
  level,
  longitude,
  latitude
) {
  return undefined;
};
export default ArrowImageryProvider;
