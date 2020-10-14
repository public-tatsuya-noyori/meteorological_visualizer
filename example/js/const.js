
export class constance {
    constructor() {
        this.region = "ap-northeast-1";
        this.endpoint = "s3.wasabisys.com";
        this.http = "https://"
        this.bucket = "japan.meteorological.agency.open.data";
        this.urlPrefix = this.http + "s3." + this.region + ".wasabisys.com" + "/" + this.bucket + "/";
        this.yearMonthdayHourminuteIdArray = ["year", "monthday", "hourminute",];
        this.defaultPrefix = "RJTD/tile_arrow_dataset/bufr_to_arrow/surface/synop/";
        this.sceneMode = Cesium.SceneMode.SCENE3D;
        this.maximumLevel = 3;
        this.minimumLevel = 3;
        this.resolutionScale = 1;
        this.minimumZoomDistance = 1000000;
        this.maximumZoomDistance = 6500000;
        this.percentageChanged = 0.001;
        this.initialLongitude = 140;
        this.initialLatitude = 35;
        this.initialHeight = 6500000;
        this.viewerIdArray = ["controleViewer", "viewer11", "viewer12", "viewer13", "viewer21", "viewer22", "viewer23"];
        this.aipViewerNumArray = [1, 2, 3, 4, 5, 6];
        this.synop_prefix = this.urlPrefix + this.defaultPrefix.slice(0,-1)

        this.aipUrlPrefixArray = [this.synop_prefix,
        this.synop_prefix,
        this.synop_prefix,
        this.synop_prefix,
        this.synop_prefix,
        this.synop_prefix]

        this.aipPropertyArray = ["air temperature [K]", "air temperature [K]", "air temperature [K]","air temperature [K]", "air temperature [K]", "air temperature [K]"];
        this.aipDrawArray = ["point", "point", "point", "point", "point", "point"];
        this.aipPixelSizeArray = [5, 5, 5, 5, 5, 5];
        this.aipColorBarArray = ["pbgrf", "pbgrf", "pbgrf", "pbgrf", "pbgrf", "pbgrf"];
        this.aipMinValueArray = [263.15, 0.0, 0.0, 90000.0, 263.15, 263.15];
        this.aipMaxValueArray = [313.15, 45.0, 360.0, 105000.0, 313.15, 313.15];

        this.opt_elemet_array = ["air temperature [K]", "wind speed [m/s]", "wind direction [degree]"]
    }

}
