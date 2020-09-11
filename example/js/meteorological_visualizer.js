import ArrowImageryProvider from "./ArrowImageryProvider.js";

var http = "https://"
var region = "ap-northeast-1";
var endpoint = "s3.wasabisys.com";
var bucket = "japan.meteorological.agency.open.data.aws.js.s3.explorer";
var urlPrefix = http + "s3." + region + ".wasabisys.com"  + "/" + bucket + "/";
AWS.config.region = region;
var s3 = new AWS.S3({apiVersion: "2014-10-01", endpoint: new AWS.Endpoint(endpoint)});
var defaultPrefix = "bufr_to_arrow/surface/synop/pressure_reduced_to_mean_sea_level/";
var yearOptionArray = [];
var monthdayOptionArray = [];
var hourminuteOptionArray = [];
var yearMonthdayHourminuteIdArray = ["year", "monthday", "hourminute",];
var yearMonthdayHourminuteArray = ["", "", "",];
var sceneMode = Cesium.SceneMode.SCENE3D;
var maximumLevel = 1;
var minimumLevel = 1;
var resolutionScale = 1;
var minimumZoomDistance = 1000000;
var maximumZoomDistance = 6500000;
var percentageChanged = 0.001;
var initialLongitude = 140;
var initialLatitude = 35;
var initialHeight = 6500000;
var viewerIdArray = ["controleViewer", "viewer11", "viewer12", "viewer13", "viewer21", "viewer22", "viewer23"];
var viewerArray = [];
var imageryLayers = new Cesium.ImageryLayerCollection();
var aipViewerNumArray = [1, 2, 3, 4, 5, 6];
var aipUrlPrefixArray = [urlPrefix + "bufr_to_arrow/surface/synop", urlPrefix + "bufr_to_arrow/surface/synop", urlPrefix + "bufr_to_arrow/surface/synop", urlPrefix + "bufr_to_arrow/surface/synop", urlPrefix + "bufr_to_arrow/surface/synop", urlPrefix + "bufr_to_arrow/surface/synop"];
var aipPropertyArray = ["air temperature [K]", "air temperature [K]", "air temperature [K]", "air temperature [K]", "air temperature [K]", "air temperature [K]"];
var aipDrawArray = ["point", "point", "point", "point", "point", "point"];
var aipPixelSizeArray = [5, 5, 5, 5, 5, 5];
var aipColorBarArray = ["pbgrf", "pbgrf", "pbgrf", "pbgrf", "pbgrf", "pbgrf"];
var aipMinValueArray = [280.0, 280.0, 280.0, 280.0, 280.0, 280.0];
var aipMaxValueArray = [290.0, 290.0, 290.0, 290.0, 290.0, 290.0];



document.addEventListener('DOMContentLoaded', function(){
  init()
  yearMonthdayHourminuteIdArray.forEach(yearMonthdayHourminuteId => {
    let select = document.getElementById(yearMonthdayHourminuteId);
    select.addEventListener('change', function(){
      setDatetimeSelectors(yearMonthdayHourminuteId)
    });
  })
});
async function getChildDirectoryArray(prefix) {
  let childDirectoryArray = [];
  const response = await s3.makeUnauthenticatedRequest('listObjectsV2', {Bucket: bucket, Prefix: prefix, Delimiter: "/"}).promise();
  response.CommonPrefixes.forEach(commonPrefix => {
    childDirectoryArray.push(commonPrefix.Prefix.replace(prefix, "").replace("/", ""));
  });
  return childDirectoryArray;
}
function setViewer(){
  imageryLayers.removeAll();
  for (let i = 1; i < viewerIdArray.length; i++) {
    viewerArray[i].entities.removeAll();
  };
  let aipViewerArray = [];
  aipViewerNumArray.forEach(aipViewerNum => {
    aipViewerArray.push(viewerArray[aipViewerNum]);
  });
  imageryLayers.addImageryProvider(new ArrowImageryProvider({maximumLevel:maximumLevel, minimumLevel:minimumLevel,
    year: yearMonthdayHourminuteArray[0],
    monthDay: yearMonthdayHourminuteArray[1],
    hourMinute: yearMonthdayHourminuteArray[2],
    urlPrefixArray: aipUrlPrefixArray,
    propertyArray: aipPropertyArray,
    drawArray: aipDrawArray,
    viewerArray: aipViewerArray,
    pixelSizeArray: aipPixelSizeArray,
    colorBarArray: aipColorBarArray,
    minValueArray: aipMinValueArray,
    maxValueArray: aipMaxValueArray
  }));
}
function initDatetimeSelector(param){
  let selectElem = document.getElementById(param);
  let optionArray = [];
  selectElem.textContent = null;
  if (param == "year") {
    optionArray = yearOptionArray;
  } else if (param == "monthday") {
    optionArray = monthdayOptionArray;
  } else if (param == "hourminute") {
    optionArray = hourminuteOptionArray;
  }
  for (let i = 0; i < optionArray.length; i++) {
    let optionElem = document.createElement("option");
    optionElem.setAttribute("option", optionArray[i]);
    optionElem.textContent = optionArray[i];
    if (i == optionArray.length - 1) {
      optionElem.setAttribute("selected", "selected");
    }
    selectElem.appendChild(optionElem);
  }
}
async function setDatetimeSelectors(param){
  if (param != "year" && param != "monthday" && param != "hourminute") {
    yearOptionArray = await getChildDirectoryArray(defaultPrefix)
    yearMonthdayHourminuteArray[0] = yearOptionArray[yearOptionArray.length - 1];
  }
  if (param != "monthday" && param != "hourminute") {
    monthdayOptionArray = await getChildDirectoryArray(defaultPrefix + yearMonthdayHourminuteArray[0] + "/")
    yearMonthdayHourminuteArray[1] = monthdayOptionArray[monthdayOptionArray.length - 1];
  }
  if (param != "hourminute") {
    hourminuteOptionArray = await getChildDirectoryArray(defaultPrefix + yearMonthdayHourminuteArray[0] + "/" + yearMonthdayHourminuteArray[1] + "/")
    yearMonthdayHourminuteArray[2] = hourminuteOptionArray[hourminuteOptionArray.length - 1];
  }
  if (param == "year" || param == "monthday" || param == "hourminute") {
    let selectElem = document.getElementById(param);
    let selectedValue = selectElem.value;
    let optionArray = [];
    let idNum = 0;
    selectElem.textContent = null;
    if (param == "year") {
      yearMonthdayHourminuteArray[0] = selectedValue;
      optionArray = yearOptionArray;
      idNum = 0;
    } else if (param == "monthday") {
      yearMonthdayHourminuteArray[1] = selectedValue;
      optionArray = monthdayOptionArray;
      idNum = 1;
    } else if (param == "hourminute") {
      yearMonthdayHourminuteArray[2] = selectedValue;
      optionArray = hourminuteOptionArray;
      idNum = 2;
    }
    for (let i = 0; i < optionArray.length; i++) {
      let optionElem = document.createElement("option");
      optionElem.setAttribute("option", optionArray[i]);
      optionElem.textContent = optionArray[i];
      if (optionArray[i] == selectedValue) {
        optionElem.setAttribute("selected", "selected");
      }
      selectElem.appendChild(optionElem);
    }
    for (let i = idNum + 1; i < yearMonthdayHourminuteIdArray.length; i++) {
      initDatetimeSelector(yearMonthdayHourminuteIdArray[i]);
    }
  } else {
    yearMonthdayHourminuteIdArray.forEach(yearMonthdayHourminuteId => {
      initDatetimeSelector(yearMonthdayHourminuteId);
    });
  }
  setViewer();
}
function init(){
  viewerIdArray.forEach(viewerId => {
    let viewer = new Cesium.Viewer(viewerId, {animation:false, baseLayerPicker:false, fullscreenButton:false, geocoder:false, homeButton:false, infoBox:false, sceneModePicker:false, selectionIndicator:false, timeline:false, navigationHelpButton:false, shouldAnimate:true, skyBox:false, skyAtmosphere:false, sceneMode:sceneMode, creditContainer:"c", requestRenderMode:true});
    viewer.resolutionScale = resolutionScale;
    viewer.scene.screenSpaceCameraController.minimumZoomDistance = minimumZoomDistance;
    viewer.scene.screenSpaceCameraController.maximumZoomDistance = maximumZoomDistance;
    viewer.camera.percentageChanged = percentageChanged;
    viewer.camera.setView({destination:Cesium.Cartesian3.fromDegrees(initialLongitude, initialLatitude, initialHeight)});
    viewerArray.push(viewer);
  });
  viewerArray[0].camera.changed.addEventListener(() => {
    for (let i = 1; i < viewerIdArray.length; i++) {
      viewerArray[i].camera.position = viewerArray[0].camera.position;
      viewerArray[i].camera.direction = viewerArray[0].camera.direction;
      viewerArray[i].camera.up = viewerArray[0].camera.up;
      viewerArray[i].camera.right = viewerArray[0].camera.right;
    };
  });
  for (let i = 1; i < viewerIdArray.length; i++) {
    viewerArray[i].camera.changed.addEventListener(() => {
      viewerArray[0].camera.position = viewerArray[i].camera.position;
      viewerArray[0].camera.direction = viewerArray[i].camera.direction;
      viewerArray[0].camera.up = viewerArray[i].camera.up;
      viewerArray[0].camera.right = viewerArray[i].camera.right;
    });
  };
  imageryLayers = viewerArray[0].imageryLayers;
  setDatetimeSelectors("");
}