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
  let nameArray = this._configPropertyTable.getColumn('name').toArray();
  let urlPrefixArray = this._configPropertyTable.getColumn('urlPrefix').toArray();
  let urlSuffixArray = this._configPropertyTable.getColumn('urlSuffix').toArray();
  let startValueArray = this._configPropertyTable.getColumn('startValue').toArray();
  let valueWindowArray = this._configPropertyTable.getColumn('valueWindow').toArray();
  let startHslHueArray = this._configPropertyTable.getColumn('startHslHue').toArray();
  let hslHueWindowArray = this._configPropertyTable.getColumn('hslHueWindow').toArray();
  let pixelSizeArray = this._configPropertyTable.getColumn('pixelSize').toArray();
  let locationDatetimeTable = await Arrow.Table.from(fetch([urlPrefixArray[0], '/', this._datetimePath, '/', level, '/', x, '/', y, '/location_datetime.arrow'].join('')));
  let latArray = locationDatetimeTable.getColumn('latitude [degree]').toArray();
  let lonArray = locationDatetimeTable.getColumn('longitude [degree]').toArray();
  let points = Array(this._viewerArray.lengh);
  for (let i in this._viewerArray) {
    points[i] = this._viewerArray[i].scene.primitives.add(new Cesium.PointPrimitiveCollection());
    let propertyTable = await Arrow.Table.from(fetch([urlPrefixArray[i], '/', this._datetimePath, '/', level, '/', x, '/', y, '/', this._ft, urlSuffixArray[i]].join('')));
    let columnArray = propertyTable.getColumn(nameArray[i]).toArray();
    let normalizedValue = 0.0;
    for (let j in columnArray) {
      if (valueWindowArray[i] > 0) {
        if (columnArray[j] <= startValueArray[i]) {
          normalizedValue = 0.0
        } else if (columnArray[j] > startValueArray[i] + valueWindowArray[i]) {
          normalizedValue = 1.0
        } else {
          normalizedValue = (columnArray[j] - startValueArray[i]) / valueWindowArray[i]
        }
      } else {
        if (columnArray[j] >= startValueArray[i]) {
          normalizedValue = 0.0
        } else if (columnArray[j] < startValueArray[i] + valueWindowArray[i]) {
          normalizedValue = 1.0
        } else {
          normalizedValue = (columnArray[j] - startValueArray[i]) / valueWindowArray[i]
        }
      }
      points[i].add({
        color : Cesium.Color.fromHsl(normalizedValue * hslHueWindowArray[i] + startHslHueArray[i], 1.0, 0.5, 1.0),
        pixelSize : pixelSizeArray[i],
        position : Cesium.Cartesian3.fromDegrees(lonArray[j], latArray[j])
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
