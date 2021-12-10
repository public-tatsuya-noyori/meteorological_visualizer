import PerspectiveImageryProvider from './PerspectiveImageryProvider.js';
const perspectiveWorker = perspective.worker();
let categorySelectOptionsMap = new Map([]), categorySelectedTextMap = new Map([]), maxCategoryLevel = 2, isCategorySet = false;
let datetimeSelectOptionsMap = new Map([]), datetimeSelectedTextMap = new Map([]), maxDatetimeLevel = 2, isDatetimeSet = false;
let datasetCategoryPath = '', datasetPath = '', tileLevel = 0;
let cesiumViewers = [];
let cesiumViewerOption = {animation:false, baseLayerPicker:false, creditContainer:'c', fullscreenButton:false, geocoder:false, homeButton:false, infoBox:false, sceneModePicker:false, selectionIndicator:false, timeline:false, navigationHelpButton:false, navigationInstructionsInitiallyVisible:false, skyBox:false, skyAtmosphere:false, targetFrameRate:1, automaticallyTrackDataSourceClocks:false, sceneMode:sceneMode, orderIndependentTranslucency:false}
let cesiumControleViewerOption = cesiumViewerOption;
cesiumControleViewerOption.imageryProvider = false;
cesiumViewerOption.imageryProvider = mapImageryProvider;
let cesiumControleViewer = new Cesium.Viewer(cesiumControleViewerId, cesiumControleViewerOption);
let isCesiumViewersSet = false;
let perspectiveViewerElem = document.getElementsByTagName("perspective-viewer")[0];
let perspectiveViewerDivElem = document.getElementById('perspectiveViewer');
let perspectiveImageryProvider = undefined;
let coastLineGeoJsonUrl = undefined;

document.addEventListener('DOMContentLoaded',() => {
  initialize();
});

async function initialize(){
  coastLineGeoJsonUrl = URL.createObjectURL(new Blob([JSON.stringify(await (await fetch(coastLineGeoJsonPath)).json())]));
  let selectElem = document.getElementById('mode');
  selectElem.selectedIndex = 0;
  selectElem.addEventListener('change', function(){
    setModeSelector();
  });
  for (let level = 0; level <= maxCategoryLevel; level++) {
    selectElem = document.getElementById('category' + level);
    selectElem.addEventListener('change', function(){
      setCategorySelectors(level);
    });
  }
  for (let level = 0; level <= maxDatetimeLevel; level++) {
    selectElem = document.getElementById('datetime' + level);
    selectElem.addEventListener('change', function(){
      setDatetimeSelectors(level);
    });
  }
  await setCategorySelectors(0);
}

async function setModeSelector(){
  let selectElem = document.getElementById('mode');
  if (selectElem.selectedIndex == 1) {
    sceneMode = sceneMode2p5D, initialHeight = initialHeight2p5D, maximumZoomDistance = maximumZoomDistance2p5D, minimumZoomDistance = minimumZoomDistance2p5D;
  } else if (selectElem.selectedIndex == 2) {
    sceneMode = sceneMode3D, initialHeight = initialHeight3D, maximumZoomDistance = maximumZoomDistance3D, minimumZoomDistance = minimumZoomDistance3D;
  } else {
    sceneMode = sceneMode2D, initialHeight = initialHeight2D, maximumZoomDistance = maximumZoomDistance2D, minimumZoomDistance = minimumZoomDistance2D;
  }
  if (selectElem.selectedIndex == 3) {
    perspectiveViewerElem.style.visibility = 'visible';
  } else {
    perspectiveViewerElem.style.visibility = 'hidden';
  }
  if (isCategorySet) {
    isCesiumViewersSet = false;
    setCesiumViewers();
    if (!isDatetimeSet) {
      await setDatetimeSelectors(-1);
    }
  } else {
    isCesiumViewersSet = false;
    await setCategorySelectors(0);
  }
}

async function setCategorySelectors(selectedLevel){
  let path = datasetRootPath;
  for (let level = 0; level < selectedLevel; level++) {
    if (level > 0) {
      path = [path, categorySelectedTextMap.get(level - 1)].join('');
    }
  }
  for (let level = selectedLevel; level <= maxCategoryLevel; level++) {
    let selectElem = document.getElementById(['category', level].join(''));
    let selectedIndex = 0;
    if (level == selectedLevel && selectElem.selectedIndex > -1) {
      selectedIndex = selectElem.selectedIndex;
    }
    if (level >= selectedLevel) {
      path = [path, categorySelectedTextMap.get(level - 1)].join('');
    }
    await getCategorySelectOptionsMap(path);
    let options = categorySelectOptionsMap.get(level);
    selectElem.textContent = null;
    for (let option of options) {
      let optionElem = document.createElement('option');
      optionElem.textContent = option;
      selectElem.appendChild(optionElem);
    }
    selectElem.selectedIndex = selectedIndex;
    categorySelectedTextMap.set(level, selectElem.options[selectElem.selectedIndex].text);
  }
  isCategorySet = true;
  datasetCategoryPath = [path, categorySelectedTextMap.get(maxCategoryLevel)].join('');
  setCesiumViewers();
  await setDatetimeSelectors(-1);
}

async function getCategorySelectOptionsMap(path){
  let options = [], params = {Bucket: bucket, Prefix: path, Delimiter: '/'}, response = {};
  do {
    response = await s3.makeUnauthenticatedRequest('listObjectsV2', params).promise();
    response.CommonPrefixes.forEach(commonPrefix => {
      options.push(commonPrefix.Prefix.replace(path, ''));
    });
    if (response.IsTruncated) {
      params.ContinuationToken = response.NextContinuationToken;
    }
  } while (response.IsTruncated);
  categorySelectOptionsMap.set((path.replace(datasetRootPath, '').match(new RegExp('/', 'g')) || []).length, options);
}

async function setCesiumViewers(){
  if (!isCesiumViewersSet) {
    cesiumControleViewer.scene.mode = sceneMode;
    cesiumControleViewer.scene.screenSpaceCameraController.maximumZoomDistance = maximumZoomDistance;
    cesiumControleViewer.scene.screenSpaceCameraController.minimumZoomDistance = minimumZoomDistance;
    cesiumControleViewer.camera.percentageChanged = percentageChanged;
    cesiumControleViewer.resolutionScale = resolutionScale;
    cesiumControleViewer.camera.setView({destination:Cesium.Cartesian3.fromDegrees(0.0, 0.0, initialHeight)});
    if (sceneMode == Cesium.SceneMode.SCENE3D) {
      cesiumControleViewer.camera.setView({destination:Cesium.Cartesian3.fromDegrees(initialLongitude, initialLatitude, initialHeight)});
    } else if (sceneMode == Cesium.SceneMode.SCENE2D){
      cesiumControleViewer.camera.setView({destination:Cesium.Cartesian3.fromDegrees(initialLongitude, 0.0, initialHeight)});
    }
    cesiumViewers.forEach((cesiumViewer) => {
      cesiumViewer.scene.mode = sceneMode;
      cesiumViewer.scene.screenSpaceCameraController.maximumZoomDistance = maximumZoomDistance;
      cesiumViewer.scene.screenSpaceCameraController.minimumZoomDistance = minimumZoomDistance;
      cesiumViewer.camera.percentageChanged = percentageChanged;
      cesiumViewer.resolutionScale = resolutionScale;
      cesiumViewer.camera.setView({destination:Cesium.Cartesian3.fromDegrees(0.0, 0.0, initialHeight)});
      if (sceneMode == Cesium.SceneMode.SCENE3D) {
        cesiumViewer.camera.setView({destination:Cesium.Cartesian3.fromDegrees(initialLongitude, initialLatitude, initialHeight)});
      } else if (sceneMode == Cesium.SceneMode.SCENE2D){
        cesiumViewer.camera.setView({destination:Cesium.Cartesian3.fromDegrees(initialLongitude, 0.0, initialHeight)});
      }
    });
  }
  let configNames = datasetCategoryPathConfigColumnsMap.get(datasetCategoryPath).name
  let numberOfCesiumViewer = configNames.length;
  let numberOfFormerCesiumViewer = cesiumViewers.length;
  if (numberOfFormerCesiumViewer > numberOfCesiumViewer) {
    for (let cesiumViewerIndex = numberOfCesiumViewer; cesiumViewerIndex < numberOfFormerCesiumViewer; cesiumViewerIndex++) {
      document.getElementById(['cesiumViewerHeader', cesiumViewerIndex].join('')).style.visibility = 'hidden';
      document.getElementById(['cesiumViewer', cesiumViewerIndex].join('')).style.visibility = 'hidden';
      document.getElementById(['cesiumviewerFooter', cesiumViewerIndex].join('')).style.visibility = 'hidden';
    }
  }
  for (let cesiumViewerIndex = 0; cesiumViewerIndex < numberOfCesiumViewer; cesiumViewerIndex++) {
    if (cesiumViewerIndex >= numberOfFormerCesiumViewer) {
      let trNumber = Math.floor(cesiumViewerIndex / numberOfCesiumViewersTableTd);
      if (0 == cesiumViewerIndex % numberOfCesiumViewersTableTd) {
        let trElem = document.createElement('div');
        trElem.className = 'tr';
        trElem.setAttribute('id', ['cesiumviewertr', trNumber].join(''));
        document.getElementById('cesiumViewers').appendChild(trElem);
      }
      let cesiumViewerHeaderElem = document.createElement('div');
      cesiumViewerHeaderElem.className = 'cesiumViewerHeader';
      cesiumViewerHeaderElem.setAttribute('id', ['cesiumViewerHeader', cesiumViewerIndex].join(''));
      cesiumViewerHeaderElem.textContent = configNames[cesiumViewerIndex];
      cesiumViewerHeaderElem.style.visibility = 'visible';
      let cesiumViewerElem = document.createElement('div');
      if (sceneMode == Cesium.SceneMode.SCENE3D) {
        cesiumViewerElem.className = 'cesiumViewerBig';
      } else {
        cesiumViewerElem.className = 'cesiumViewerSmall';
      }
      cesiumViewerElem.style.visibility = 'visible';
      cesiumViewerElem.setAttribute('id', ['cesiumViewer', cesiumViewerIndex].join(''));
      let cesiumViewerFooterElem = document.createElement('div');
      cesiumViewerFooterElem.className = 'cesiumviewerFooter';
      cesiumViewerFooterElem.setAttribute('id', ['cesiumviewerFooter', cesiumViewerIndex].join(''));
      cesiumViewerFooterElem.innerHTML = mapCopyRight;
      cesiumViewerFooterElem.style.visibility = 'visible';
      let tdElem = document.createElement('div');
      tdElem.className = 'td';
      tdElem.appendChild(cesiumViewerHeaderElem);
      tdElem.appendChild(cesiumViewerElem);
      tdElem.appendChild(cesiumViewerFooterElem);
      let parentTrElem = document.getElementById(['cesiumviewertr', trNumber].join(''));
      parentTrElem.appendChild(tdElem);
      let cesiumViewer = new Cesium.Viewer(['cesiumViewer', cesiumViewerIndex].join(''), cesiumViewerOption);
      cesiumViewer.scene.mode = sceneMode;
      cesiumViewer.scene.screenSpaceCameraController.maximumZoomDistance = maximumZoomDistance;
      cesiumViewer.scene.screenSpaceCameraController.minimumZoomDistance = minimumZoomDistance;
      cesiumViewer.camera.percentageChanged = percentageChanged;
      cesiumViewer.resolutionScale = resolutionScale;
      cesiumViewer.camera.position = cesiumControleViewer.camera.position;
      cesiumViewer.camera.direction = cesiumControleViewer.camera.direction;
      cesiumViewer.camera.up = cesiumControleViewer.camera.up;
      cesiumViewer.camera.right = cesiumControleViewer.camera.right;
      if (sceneMode == Cesium.SceneMode.SCENE2D && cesiumControleViewer.camera.positionCartographic.height != cesiumViewer.camera.positionCartographic.height) {
        cesiumViewer.camera.setView({destination:Cesium.Cartesian3.fromRadians(cesiumControleViewer.camera.positionCartographic.longitude, cesiumControleViewer.camera.positionCartographic.latitude, cesiumControleViewer.camera.frustum.right - cesiumControleViewer.camera.frustum.left)});
      }
      cesiumViewer.camera.changed.addEventListener((cesiumViewerIndex) => {
        cesiumControleViewer.camera.position = cesiumViewer.camera.position;
        cesiumControleViewer.camera.direction = cesiumViewer.camera.direction;
        cesiumControleViewer.camera.up = cesiumViewer.camera.up;
        cesiumControleViewer.camera.right = cesiumViewer.camera.right;
        if (sceneMode == Cesium.SceneMode.SCENE2D && cesiumViewer.camera.positionCartographic.height != cesiumControleViewer.camera.positionCartographic.height) {
          cesiumControleViewer.camera.setView({destination:Cesium.Cartesian3.fromRadians(cesiumViewer.camera.positionCartographic.longitude, cesiumViewer.camera.positionCartographic.latitude, cesiumViewer.camera.frustum.right - cesiumViewer.camera.frustum.left)});
        }
        cesiumViewers.forEach((tmpCesiumViewer, tmpCesiumViewerIndex) => {
          if (tmpCesiumViewerIndex != cesiumViewerIndex) {
            tmpCesiumViewer.camera.position = cesiumControleViewer.camera.position;
            tmpCesiumViewer.camera.direction = cesiumControleViewer.camera.direction;
            tmpCesiumViewer.camera.up = cesiumControleViewer.camera.up;
            tmpCesiumViewer.camera.right = cesiumControleViewer.camera.right;
            if (sceneMode == Cesium.SceneMode.SCENE2D && cesiumControleViewer.camera.positionCartographic.height != tmpCesiumViewer.camera.positionCartographic.height) {
              tmpCesiumViewer.camera.setView({destination:Cesium.Cartesian3.fromRadians(cesiumControleViewer.camera.positionCartographic.longitude, cesiumControleViewer.camera.positionCartographic.latitude, cesiumControleViewer.camera.frustum.right - cesiumControleViewer.camera.frustum.left)});
            }
          }
        });
      });
      cesiumViewers.push(cesiumViewer);
    } else {
      cesiumViewers[cesiumViewerIndex].scene.mode = sceneMode;
      cesiumViewers[cesiumViewerIndex].scene.screenSpaceCameraController.maximumZoomDistance = maximumZoomDistance;
      cesiumViewers[cesiumViewerIndex].scene.screenSpaceCameraController.minimumZoomDistance = minimumZoomDistance;
      cesiumViewers[cesiumViewerIndex].camera.percentageChanged = percentageChanged;
      cesiumViewers[cesiumViewerIndex].resolutionScale = resolutionScale;
      document.getElementById(['cesiumViewerHeader', cesiumViewerIndex].join('')).textContent = configNames[cesiumViewerIndex];
      document.getElementById(['cesiumViewerHeader', cesiumViewerIndex].join('')).style.visibility = 'visible';
      if (sceneMode == Cesium.SceneMode.SCENE3D) {
        document.getElementById(['cesiumViewer', cesiumViewerIndex].join('')).className = 'cesiumViewerBig';
      } else {
        document.getElementById(['cesiumViewer', cesiumViewerIndex].join('')).className = 'cesiumViewerSmall';
      }
      document.getElementById(['cesiumViewer', cesiumViewerIndex].join('')).style.visibility = 'visible';
      document.getElementById(['cesiumviewerFooter', cesiumViewerIndex].join('')).style.visibility = 'visible';
    }
  }
  isCesiumViewersSet = true;
}

async function setDatetimeSelectors(selectedLevel){
  let isDatetimeSelected = true;
  if (selectedLevel == -1) {
    selectedLevel = 0;
    isDatetimeSelected = false;
  }
  let path = datasetCategoryPath;
  for (let level = 0; level < selectedLevel; level++) {
    if (level > 0) {
      path = [path, datetimeSelectedTextMap.get(level - 1)].join('');
    }
  }
  for (let level = selectedLevel; level <= maxDatetimeLevel; level++) {
    let selectElem = document.getElementById(['datetime', level].join(''));
    let formerSelectedText = '';
    if (selectElem.selectedIndex > -1) {
      formerSelectedText = selectElem.options[selectElem.selectedIndex].text;
    }
    let selectedIndex = -1;
    if (isDatetimeSelected && level == selectedLevel && selectElem.selectedIndex > -1) {
      selectedIndex = selectElem.selectedIndex;
    }
    if (level >= selectedLevel) {
      path = [path, datetimeSelectedTextMap.get(level - 1)].join('');
    }
    await getDatetimeSelectOptionsMap(path);
    let options = datetimeSelectOptionsMap.get(level);
    selectElem.textContent = null;
    for (let option of options) {
      let optionElem = document.createElement('option');
      optionElem.textContent = option;
      selectElem.appendChild(optionElem);
    }
    if (!isDatetimeSelected && options.indexOf(formerSelectedText) > -1) {
      selectElem.selectedIndex = options.indexOf(formerSelectedText);
    } else {
      if (selectedIndex == -1) {
        selectedIndex = options.length - 1;
      }
      selectElem.selectedIndex = selectedIndex;
    }
    datetimeSelectedTextMap.set(level, selectElem.options[selectElem.selectedIndex].text);
  }
  isDatetimeSet = true;
  datasetPath = [path, datetimeSelectedTextMap.get(maxDatetimeLevel)].join('');
  await getTileLevel();
  removeImageryLayers();
  setImageryLayers();
}

async function getDatetimeSelectOptionsMap(path){
  let options = [], params = {Bucket: bucket, Prefix: path, Delimiter: '/'}, response = {};
  do {
    response = await s3.makeUnauthenticatedRequest('listObjectsV2', params).promise();
    response.CommonPrefixes.forEach(commonPrefix => {
      options.push(commonPrefix.Prefix.replace(path, ''));
    });
    if (response.IsTruncated) {
      params.ContinuationToken = response.NextContinuationToken;
    }
  } while (response.IsTruncated);
  datetimeSelectOptionsMap.set((path.replace(datasetCategoryPath, '').match(new RegExp('/', 'g')) || []).length, options);
}

async function getTileLevel(){
  let response = await s3.makeUnauthenticatedRequest('listObjectsV2', {Bucket: bucket, Prefix: datasetPath, Delimiter: '/'}).promise();
  response.CommonPrefixes.forEach(commonPrefix => {
    tileLevel = parseInt(commonPrefix.Prefix.replace(datasetPath, '').replace('/', ''));
  });
}

async function removeImageryLayers(){
  cesiumViewers.forEach(cesiumViewer => {
    if (cesiumViewer.scene.primitives.length > 0) {
      let primitiveLength = cesiumViewer.scene.primitives.length;
      for (let primitiveIndex = 1; primitiveIndex < primitiveLength; primitiveIndex++) {
        cesiumViewer.scene.primitives.remove(cesiumViewer.scene.primitives.get(primitiveLength - primitiveIndex));
      }
    } else {
      cesiumViewer.dataSources.add(Cesium.GeoJsonDataSource.load(coastLineGeoJsonUrl, {strokeWidth:0.5,stroke:Cesium.Color.WHITE}));
    }
  });
  if (perspectiveImageryProvider != undefined) {
    perspectiveImageryProvider.clearPerspectiveTable();
    let formerPerspectiveViewerElemVisibility = perspectiveViewerElem.style.visibility;
    perspectiveViewerElem.remove();
    perspectiveViewerElem = document.createElement('perspective-viewer');
    perspectiveViewerElem.className = 'perspective-viewer-material';
    perspectiveViewerDivElem.appendChild(perspectiveViewerElem);
    perspectiveViewerElem.style.visibility = formerPerspectiveViewerElemVisibility;
  }
  cesiumControleViewer.imageryLayers.removeAll();
  perspectiveImageryProvider = undefined;
}

function setImageryLayers(){
  perspectiveImageryProvider = new PerspectiveImageryProvider({urlPrefix:[endpoint, bucket, '/'].join(''), urlSuffix:urlSuffix, datasetPath:datasetPath, level:tileLevel, cesiumViewers:cesiumViewers, configColumns:datasetCategoryPathConfigColumnsMap.get(datasetCategoryPath), perspectiveWorker:perspectiveWorker, perspectiveViewerElem:perspectiveViewerElem});
  cesiumControleViewer.imageryLayers.addImageryProvider(perspectiveImageryProvider);
}