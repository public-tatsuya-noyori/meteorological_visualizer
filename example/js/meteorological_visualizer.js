import ArrowImageryProvider from "./ArrowImageryProvider.js";
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
    await getChildDirectoryArray(defaultPrefix).then((result) => {
      yearOptionArray = result;
    });
    yearMonthdayHourminuteArray[0] = yearOptionArray[yearOptionArray.length - 1];
  }
  if (param != "monthday" && param != "hourminute") {
    await getChildDirectoryArray(defaultPrefix + yearMonthdayHourminuteArray[0] + "/").then((result) => {
      monthdayOptionArray = result;
    });
    yearMonthdayHourminuteArray[1] = monthdayOptionArray[monthdayOptionArray.length - 1];
  }
  if (param != "hourminute") {
    await getChildDirectoryArray(defaultPrefix + yearMonthdayHourminuteArray[0] + "/" + yearMonthdayHourminuteArray[1] + "/").then((result) => {
      hourminuteOptionArray = result;
    });
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