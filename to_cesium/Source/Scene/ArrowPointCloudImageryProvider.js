import Color from "../../../cesium/Source/Core/Color.js";
import defaultValue from "../../../cesium/Source/Core/defaultValue.js";
import defined from "../../../cesium/Source/Core/defined.js";
import Event from "../../../cesium/Source/Core/Event.js";
import GeographicTilingScheme from "../../../cesium/Source/Core/GeographicTilingScheme.js";
import when from "../../../cesium/Source/ThirdParty/when.js";
//import { promise } from "when";

/**
 * @typedef {Object} ArrowPointCloudImageryProvider.ConstructorOptions
 *
 * Initialization options for the ArrowPointCloudImageryProvider constructor
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
 * @alias ArrowPointCloudImageryProvider
 * @constructor
 *
 * @param {ArrowPointCloudImageryProvider.ConstructorOptions} [options] Object describing initialization options
 */
function ArrowPointCloudImageryProvider(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  this._tilingScheme = new Cesium.GeographicTilingScheme();
  this._errorEvent = new Event();
  this._tileWidth = defaultValue(options.tileWidth, 256);
  this._tileHeight = defaultValue(options.tileHeight, 256);
  this._readyPromise = when.resolve(true);
  this._maximumLevel = defaultValue(options.maximumLevel, undefined);
  this._minimumLevel = defaultValue(options.maximumLevel, undefined);
  this._arrowDir = defaultValue(options.arrowDir, undefined);
  this._locationDatetimeDir = defaultValue(options.locationDatetimeDir, undefined);
  this._uniqueKeyArray = defaultValue(options.uniqueKeyArray, undefined);
  this._propertyDir = defaultValue(options.propertyDir, undefined);
  this._property = defaultValue(options.property, undefined);
  this._year = defaultValue(options.year, undefined);
  this._monthDay = defaultValue(options.monthDay, undefined);
  this._hour = defaultValue(options.hour, undefined);
  this._viewer = defaultValue(options.viewer, undefined);

  /**
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

Object.defineProperties(ArrowPointCloudImageryProvider.prototype, {
  /**
   * Gets the proxy used by this provider.
   * @memberof ArrowPointCloudImageryProvider.prototype
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
   * not be called before {@link ArrowPointCloudImageryProvider#ready} returns true.
   * @memberof ArrowPointCloudImageryProvider.prototype
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
   * not be called before {@link ArrowPointCloudImageryProvider#ready} returns true.
   * @memberof ArrowPointCloudImageryProvider.prototype
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
   * not be called before {@link ArrowPointCloudImageryProvider#ready} returns true.
   * @memberof ArrowPointCloudImageryProvider.prototype
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
   * not be called before {@link ArrowPointCloudImageryProvider#ready} returns true.
   * @memberof ArrowPointCloudImageryProvider.prototype
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
   * not be called before {@link ArrowPointCloudImageryProvider#ready} returns true.
   * @memberof ArrowPointCloudImageryProvider.prototype
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
   * not be called before {@link ArrowPointCloudImageryProvider#ready} returns true.
   * @memberof ArrowPointCloudImageryProvider.prototype
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
   * not be called before {@link ArrowPointCloudImageryProvider#ready} returns true.
   * @memberof ArrowPointCloudImageryProvider.prototype
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
   * @memberof ArrowPointCloudImageryProvider.prototype
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
   * @memberof ArrowPointCloudImageryProvider.prototype
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
   * @memberof ArrowPointCloudImageryProvider.prototype
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
   * the source of the imagery.  This function should not be called before {@link ArrowPointCloudImageryProvider#ready} returns true.
   * @memberof ArrowPointCloudImageryProvider.prototype
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
   * @memberof ArrowPointCloudImageryProvider.prototype
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
ArrowPointCloudImageryProvider.prototype.getTileCredits = function (
  x,
  y,
  level
) {
  return undefined;
};

/**
 * Requests the image for a given tile.  This function should
 * not be called before {@link ArrowPointCloudImageryProvider#ready} returns true.
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
ArrowPointCloudImageryProvider.prototype.requestImage = function (
  x,
  y,
  level,
  request
) {

  this._viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(-111.0, 40.0, 150000.0),
    name: "Green circle at height with outline",
    ellipse: {
      semiMinorAxis: 300000.0,
      semiMajorAxis: 300000.0,
      height: 200000.0,
      material: Cesium.Color.GREEN,
      outline: true, // height must be set for outline to display
    }
  })


  var property_response = fetch([this._arrowDir, '/', this._propertyDir, '/', this._year, '/', this._monthDay, '/', this._hour, '/', level, '/', x, '/', y, '.arrow'].join(''))
    .then((pResponse) => {
      if (!pResponse.ok) {
        throw new Error()
      }
      return pResponse
    }).then((pResponse) => {
      return Arrow.Table.from(pResponse)
    })
    .catch((e)=>console.log("property(L:%d,X:%d,Y:%d) does not exist",level,x,y))

  var loc_response = fetch([this._arrowDir, '/', this._locationDatetimeDir, '/', this._year, '/', this._monthDay, '/', this._hour, '/', level, '/', x, '/', y, '.arrow'].join(''))
    .then((lResponse) => {
      if (!lResponse.ok) {
        throw new Error()
      }
      return lResponse
    })
    .then((lResponse) => {
      return Arrow.Table.from(lResponse)
    })
    .catch((e)=>console.log("locTime(L:%d,X:%d,Y:%d) does not exist",level,x,y))

  
  Promise.all([property_response, loc_response])
    .then(([propertyTable, locTimeTable]) => {
      let propertyUniqueKeyIndexArray = []
      for (let i in this._uniqueKeyArray) {
        propertyUniqueKeyIndexArray.push(propertyTable.getColumnIndex(this._uniqueKeyArray[i]));
      }
      let propertyValueIndex = propertyTable.getColumnIndex(this._property);
      let uniqueKeyValueMap = new Map();
      for (let row of propertyTable) {
        let propertyUniqueKeyArray = []
        for (let i in propertyUniqueKeyIndexArray) {
          propertyUniqueKeyArray.push(row[i]);
        }
        uniqueKeyValueMap.set(propertyUniqueKeyArray.toString(), row[propertyValueIndex]);
      }
      let locTimeUniqueKeyIndexArray = []
      for (let i in this._uniqueKeyArray) {
        locTimeUniqueKeyIndexArray.push(locTimeTable.getColumnIndex(this._uniqueKeyArray[i]));
      }
      for (let row of locTimeTable) {
        let locTimeUniqueKeyArray = []
        for (let i in locTimeUniqueKeyIndexArray) {
          locTimeUniqueKeyArray.push(row[i]);
        }
        if (uniqueKeyValueMap.has(locTimeUniqueKeyArray.toString())) {
          console.log(row.toString())
          console.log(uniqueKeyValueMap.get(locTimeUniqueKeyArray.toString()))
        }
      }

    })
    .catch((e)=>console.log("prop_or_loc(L:%d,X:%d,Y:%d) does not exist",level,x,y))
  
  //呼び出し元の関数のエラーを回避するために空のcanvasをreturn
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
ArrowPointCloudImageryProvider.prototype.pickFeatures = function (
  x,
  y,
  level,
  longitude,
  latitude
) {
  return undefined;
};
export default ArrowPointCloudImageryProvider;