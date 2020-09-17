
export class constance {
    region = "ap-northeast-1";
    endpoint = "s3.wasabisys.com";
    http = "https://"
    bucket = "japan.meteorological.agency.open.data.aws.js.s3.explorer";
    urlPrefix = this.http + "s3." + this.region + ".wasabisys.com" + "/" + this.bucket + "/";
    yearMonthdayHourminuteIdArray = ["year", "monthday", "hourminute",];
    defaultPrefix = "bufr_to_arrow/surface/synop/pressure_reduced_to_mean_sea_level/";
    sceneMode = Cesium.SceneMode.SCENE3D;
    maximumLevel = 1;
    minimumLevel = 1;
    resolutionScale = 1;
    minimumZoomDistance = 1000000;
    maximumZoomDistance = 6500000;
    percentageChanged = 0.001;
    initialLongitude = 140;
    initialLatitude = 35;
    initialHeight = 6500000;
    viewerIdArray = ["controleViewer", "viewer11", "viewer12", "viewer13", "viewer21", "viewer22", "viewer23"];
    aipViewerNumArray = [1, 2, 3, 4, 5, 6];
    aipUrlPrefixArray = [this.urlPrefix + "bufr_to_arrow/surface/synop", this.urlPrefix + "bufr_to_arrow/surface/synop", this.urlPrefix + "bufr_to_arrow/surface/synop", this.urlPrefix + "bufr_to_arrow/surface/synop", this.urlPrefix + "bufr_to_arrow/surface/synop", this.urlPrefix + "bufr_to_arrow/surface/synop"];
    aipPropertyArray = ["air temperature [K]", "air temperature [K]", "air temperature [K]", "air temperature [K]", "air temperature [K]", "air temperature [K]"];
    aipDrawArray = ["point", "point", "point", "point", "point", "point"];
    aipPixelSizeArray = [5, 5, 5, 5, 5, 5];
    aipColorBarArray = ["pbgrf", "pbgrf", "pbgrf", "pbgrf", "pbgrf", "pbgrf"];
    aipMinValueArray = [280.0, 280.0, 280.0, 280.0, 280.0, 280.0];
    aipMaxValueArray = [290.0, 290.0, 290.0, 290.0, 290.0, 290.0];
}