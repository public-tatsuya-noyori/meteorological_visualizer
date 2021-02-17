import ArrowImageryProvider from "./ArrowImageryProvider.js";
document.addEventListener('DOMContentLoaded', function(){
  init();
  yearMonthdayHourminuteIdArray.forEach(yearMonthdayHourminuteId => {
    let select = document.getElementById(yearMonthdayHourminuteId);
    select.addEventListener('change', function(){
      setDatetimeSelectors(yearMonthdayHourminuteId)
    });
  });
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
function renderLoop() {
  for (let i = 0; i < viewerIdArray.length; i++) {
    viewerArray[i].resize();
    viewerArray[i].render();
    viewerArray[i].scene.requestRender();
  };
  window.setTimeout(renderLoop, 200);
}
async function setDatetimeSelectors(param){
  let optionArray = [[],[],[]];
  let idNum = -1;
  if (param == "year" || param == "monthday" || param == "hourminute") {
    if (param == "year") {
      idNum = 0;
    } else if (param == "monthday") {
      idNum = 1;
    } else if (param == "hourminute") {
      idNum = 2;
    }
    let prefix = defaultPrefix;
    for (let i = 0; i < idNum; i++) {
      prefix = prefix + yearMonthdayHourminuteArray[i] + "/";
    }
    let selectElem = document.getElementById(param);
    for (let i = idNum; i < yearMonthdayHourminuteArray.length; i++) {
      await getChildDirectoryArray(prefix).then((result) => {
        optionArray[i] = result;
      });
      if (i == idNum) {
        yearMonthdayHourminuteArray[idNum] = selectElem.value;
      } else {
        selectElem = document.getElementById(yearMonthdayHourminuteIdArray[i]);
        selectElem.textContent = null;
      }
      prefix = prefix + yearMonthdayHourminuteArray[i] + "/";
    }
  } else {
    await getChildDirectoryArray(defaultPrefix).then((result) => {
      optionArray[0] = result;
    });
    yearMonthdayHourminuteArray[0] = optionArray[0][optionArray[0].length - 1];
    await getChildDirectoryArray(defaultPrefix + yearMonthdayHourminuteArray[0] + "/").then((result) => {
      optionArray[1] = result;
    });
    yearMonthdayHourminuteArray[1] = optionArray[1][optionArray[1].length - 1];
    await getChildDirectoryArray(defaultPrefix + yearMonthdayHourminuteArray[0] + "/"  + yearMonthdayHourminuteArray[1] + "/").then((result) => {
      optionArray[2] = result;
    });
    yearMonthdayHourminuteArray[2] = '0000';
  }
  for (let i = idNum + 1; i < yearMonthdayHourminuteArray.length; i++) {
    let selected = false;
    let optionElem = "";
    let selectElem = document.getElementById(yearMonthdayHourminuteIdArray[i]);
    for (let j = 0; j < optionArray[i].length; j++) {
      optionElem = document.createElement("option");
      optionElem.setAttribute("option", optionArray[i][j]);
      optionElem.textContent = optionArray[i][j];
      if (optionArray[i][j] == yearMonthdayHourminuteArray[i]) {
        optionElem.setAttribute("selected", "selected");
        selected = true;
      }
      if (j == optionArray[i].length - 1 & !selected) {
        yearMonthdayHourminuteArray[i] = optionArray[i][optionArray[i].length - 1];
        optionElem.setAttribute("selected", "selected");
      }
      selectElem.appendChild(optionElem);
    }
  }
  setViewer();
}
function init(){
  viewerIdArray.forEach(viewerId => {
    let viewer = new Cesium.Viewer(viewerId, {animation:false, baseLayerPicker:false, fullscreenButton:false, geocoder:false, homeButton:false, infoBox:false, sceneModePicker:false, selectionIndicator:false, timeline:false, navigationHelpButton:false, skyBox:false, skyAtmosphere:false, sceneMode:sceneMode, creditContainer:"c", requestRenderMode:true, maximumRenderTimeChange:Infinity, useDefaultRenderLoop:false}); 
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
  window.setTimeout(renderLoop, 200);
}
