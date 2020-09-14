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
  this._maximumLevel = Cesium.defaultValue(options.maximumLevel, undefined);
  this._minimumLevel = Cesium.defaultValue(options.maximumLevel, undefined);
  this._year = Cesium.defaultValue(options.year, undefined);
  this._monthDay = Cesium.defaultValue(options.monthDay, undefined);
  this._hourMinute = Cesium.defaultValue(options.hourMinute, undefined);
  this._locationDatetimeDirectory = "location_datetime";
  this._urlPrefixArray = Cesium.defaultValue(options.urlPrefixArray, undefined);
  this._uniqueKeysArray = Cesium.defaultValue(options.uniqueKeysArray, undefined);
  this._propertyArray = Cesium.defaultValue(options.propertyArray, undefined);
  this._drawArray = Cesium.defaultValue(options.drawArray, undefined);
  this._viewerArray = Cesium.defaultValue(options.viewerArray, undefined);
  this._pixelSizeArray = Cesium.defaultValue(options.pixelSizeArray, undefined);
  this._colorBarArray = Cesium.defaultValue(options.colorBarArray, undefined);
  this._minValueArray = Cesium.defaultValue(options.minValueArray, undefined);
  this._maxValueArray = Cesium.defaultValue(options.maxValueArray, undefined);

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
ArrowImageryProvider.prototype.requestImage = function (
  x,
  y,
  level,
  request
) {
  for (let i = 0; i < this._urlPrefixArray.length; i++) {
    let propertyDirectory = this._propertyArray[i].replace(/\[.*$/g, "").trim().replace(" ", "_");
    fetch([this._urlPrefixArray[i], "/", propertyDirectory, "/", this._year, "/", this._monthDay, "/", this._hourMinute, "/", level, "/", x, "/", y, ".arrow"].join("")).then((pResponse) => {
      if (pResponse.ok) {
        Arrow.Table.from(pResponse).then((propertyTable) => {
          fetch([this._urlPrefixArray[i], "/", this._locationDatetimeDirectory, "/", this._year, "/", this._monthDay, "/", this._hourMinute, "/", level, "/", x, "/", y, ".arrow"].join("")).then((lResponse) => {
            if (lResponse.ok) {
              Arrow.Table.from(lResponse).then((locationDatetimeTable) => {
                if (this._drawArray[i] == 'point') {
                  for (let j = 0; j < propertyTable.count(); j++) {
                    let indicator = propertyTable.get(j).get('indicator');
                    let id = propertyTable.get(j).get('id')
                    let filtered = locationDatetimeTable.filter(Arrow.predicate.and([Arrow.predicate.col('indicator').eq(indicator), Arrow.predicate.col('id').eq(id)]));
                    if (filtered.count() == 1) {
                      let value = propertyTable.get(j).get(this._propertyArray[i]);
                      let normalizedValue = 0.0;
                      let color = Cesium.Color.BLACK;
                      if (value >= this._maxValueArray[i]) {
                        normalizedValue = 1.0
                      } else if (value <= this._minValueArray[i]) {
                        normalizedValue = 0.0
                      } else {
                        normalizedValue = (value - this._minValueArray[i]) / (this._maxValueArray[i] - this._minValueArray[i])
                      }
                      if(this._colorBarArray[i] == "bgr") {
                        color = Cesium.Color.fromHsl((1.0 - normalizedValue) * 2.0 / 3.0, 1.0, 0.5, 1.0);
                      } else if (this._colorBarArray[i] == "bgrfp") {
                        color = Cesium.Color.fromHsl((8.0 - normalizedValue * 11.0) / 12.0, 1.0, 0.5, 1.0);
                      } else if (this._colorBarArray[i] == "pbgrf") {
                        color = Cesium.Color.fromHsl((9.0 - normalizedValue * 11.0) / 12.0, 1.0, 0.5, 1.0);
                      } else if (this._colorBarArray[i] == "rgbr") {
                        color = Cesium.Color.fromHsl(normalizedValue, 1.0, 0.5, 1.0);
                      }
                      filtered.scan((locationDatetime_index) => {
                        this._viewerArray[i].entities.add({
                          position: Cesium.Cartesian3.fromDegrees(filtered.getColumn('longitude [degree]').get(locationDatetime_index), filtered.getColumn('latitude [degree]').get(locationDatetime_index), 0),
                          point: {
                            pixelSize : this._pixelSizeArray[i],
                            color : color
                          }
                        });
                      });
                    }
                  }
                }
              });
            }
          });
        });
      }
    });
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
