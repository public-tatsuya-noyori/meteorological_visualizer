import ArrowImageryProvider from './ArrowImageryProvider.js';
var viewers = [];
var categorySelectOptionsMap = new Map([]), categorySelectedTextMap = new Map([]), maxCategoryLevel = 2, isCategorySet = false;
var datetimeSelectOptionsMap = new Map([]), datetimeSelectedTextMap = new Map([]), maxDatetimeLevel = 2, isDatetimeSet = false;
var datasetCategoryPath = '', datasetPath = '', tileLevel = 0;
var viewerOption = {animation:false, baseLayerPicker:false, creditContainer:'c', fullscreenButton:false, geocoder:false, homeButton:false, infoBox:false, sceneModePicker:false, selectionIndicator:false, timeline:false, navigationHelpButton:false, navigationInstructionsInitiallyVisible:false, skyBox:false, skyAtmosphere:false, targetFrameRate:1, automaticallyTrackDataSourceClocks:false, sceneMode:sceneMode, orderIndependentTranslucency:false}
var controleViewerOption = viewerOption;
controleViewerOption.imageryProvider = false;
viewerOption.imageryProvider = mapImageryProvider;
var controleViewer = new Cesium.Viewer(controleViewerId, controleViewerOption);

document.addEventListener('DOMContentLoaded',() => {
  initialize();
});

async function initialize(){
  let selector = document.getElementById('sceneMode');
  selector.addEventListener('change', function(){
    setSceneModeSelector();
  });
  for (let level = 0; level <= maxCategoryLevel; level++) {
    selector = document.getElementById('category' + level);
    selector.addEventListener('change', function(){
      setCategorySelectors(level);
    });
  }
  for (let level = 0; level <= maxDatetimeLevel; level++) {
    selector = document.getElementById('datetime' + level);
    selector.addEventListener('change', function(){
      setDatetimeSelectors(level);
    });
  }
  await setCategorySelectors(0);
}

async function setSceneModeSelector(){
  let selectElem = document.getElementById('sceneMode');
  if (selectElem.selectedIndex == 1) {
    sceneMode = sceneMode2p5D, initialHeight = initialHeight2p5D, maximumZoomDistance = maximumZoomDistance2p5D, minimumZoomDistance = minimumZoomDistance2p5D;
  } else if (selectElem.selectedIndex == 2) {
    sceneMode = sceneMode3D, initialHeight = initialHeight3D, maximumZoomDistance = maximumZoomDistance3D, minimumZoomDistance = minimumZoomDistance3D;
  } else {
    sceneMode = sceneMode2D, initialHeight = initialHeight2D, maximumZoomDistance = maximumZoomDistance2D, minimumZoomDistance = minimumZoomDistance2D;
  }
  if (isCategorySet) {
    setViewers();
    if (!isDatetimeSet) {
      await setDatetimeSelectors(-1);
    }
  } else {
    await setCategorySelectors(0);
  }
}

async function setCategorySelectors(selectedLevel){
  removeImageryLayers();
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
  setViewers();
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

function setViewers(){
  controleViewer.scene.mode = sceneMode;
  controleViewer.scene.screenSpaceCameraController.maximumZoomDistance = maximumZoomDistance;
  controleViewer.scene.screenSpaceCameraController.minimumZoomDistance = minimumZoomDistance;
  controleViewer.camera.percentageChanged = percentageChanged;
  controleViewer.resolutionScale = resolutionScale;
  if (sceneMode == Cesium.SceneMode.SCENE3D) {
    controleViewer.camera.setView({destination:Cesium.Cartesian3.fromDegrees(initialLongitude, initialLatitude, initialHeight)});
  } else if (sceneMode == Cesium.SceneMode.SCENE2D){
    controleViewer.camera.setView({destination:Cesium.Cartesian3.fromDegrees(initialLongitude, 0, initialHeight)});
  } else {
    controleViewer.camera.setView({destination:Cesium.Cartesian3.fromDegrees(0, 0, initialHeight)});
  }
  let numberOfViewer = numberOfViewerMap.get(datasetCategoryPath);
  let configNames = configTableMap.get(datasetCategoryPath).getColumn('name').toArray();
  let numberOfFormerViewer = viewers.length;
  if (numberOfFormerViewer > numberOfViewer) {
    for (let viewerIndex = numberOfViewer; viewerIndex < numberOfFormerViewer; viewerIndex++) {
      document.getElementById(['viewerheader', viewerIndex].join('')).style.visibility = 'hidden';
      document.getElementById(['viewer', viewerIndex].join('')).style.visibility = 'hidden';
      document.getElementById(['viewerfooter', viewerIndex].join('')).style.visibility = 'hidden';
    }
  }
  for (let viewerIndex = 0; viewerIndex < numberOfViewer; viewerIndex++) {
    if (viewerIndex >= numberOfFormerViewer) {
      let trNumber = Math.floor(viewerIndex / numberOfViewersTableTd);
      if (0 == viewerIndex % numberOfViewersTableTd) {
        let trElem = document.createElement('div');
        trElem.className = 'tr';
        trElem.setAttribute('id', ['viewerTr', trNumber].join(''));
        document.getElementById('viewers').appendChild(trElem);
      }
      let viewerHeaderElem = document.createElement('div');
      viewerHeaderElem.className = 'viewerheader';
      viewerHeaderElem.setAttribute('id', ['viewerheader', viewerIndex].join(''));
      viewerHeaderElem.textContent = configNames[viewerIndex];
      viewerHeaderElem.style.visibility = 'visible';
      let viewerElem = document.createElement('div');
      if (sceneMode == Cesium.SceneMode.SCENE3D) {
        viewerElem.className = 'viewerbig';
      } else {
        viewerElem.className = 'viewersmall';
      }
      viewerElem.style.visibility = 'visible';
      viewerElem.setAttribute('id', ['viewer', viewerIndex].join(''));
      let viewerFooterElem = document.createElement('div');
      viewerFooterElem.className = 'viewerfooter';
      viewerFooterElem.setAttribute('id', ['viewerfooter', viewerIndex].join(''));
      viewerFooterElem.innerHTML = mapCopyRight;
      viewerFooterElem.style.visibility = 'visible';
      let tdElem = document.createElement('div');
      tdElem.className = 'td';
      tdElem.appendChild(viewerHeaderElem);
      tdElem.appendChild(viewerElem);
      tdElem.appendChild(viewerFooterElem);
      let parentTrElem = document.getElementById(['viewerTr', trNumber].join(''));
      parentTrElem.appendChild(tdElem);
      let viewer = new Cesium.Viewer(['viewer', viewerIndex].join(''), viewerOption);
      viewer.scene.mode = sceneMode;
      viewer.scene.screenSpaceCameraController.maximumZoomDistance = maximumZoomDistance;
      viewer.scene.screenSpaceCameraController.minimumZoomDistance = minimumZoomDistance;
      viewer.camera.percentageChanged = percentageChanged;
      viewer.resolutionScale = resolutionScale;
      if (sceneMode == Cesium.SceneMode.SCENE3D) {
        viewer.camera.setView({destination:Cesium.Cartesian3.fromDegrees(initialLongitude, initialLatitude, initialHeight)});
      } else if (sceneMode == Cesium.SceneMode.SCENE2D){
        viewer.camera.setView({destination:Cesium.Cartesian3.fromDegrees(initialLongitude, 0, initialHeight)});
      } else {
        viewer.camera.setView({destination:Cesium.Cartesian3.fromDegrees(0, 0, initialHeight)});
      }
      viewer.camera.changed.addEventListener((viewerIndex) => {
        viewers.forEach((tmpViewer, tmpViewerIndex) => {
          if (tmpViewerIndex != viewerIndex) {
            tmpViewer.camera.position = viewer.camera.position;
            tmpViewer.camera.direction = viewer.camera.direction;
            tmpViewer.camera.up = viewer.camera.up;
            tmpViewer.camera.right = viewer.camera.right;
            if (sceneMode == Cesium.SceneMode.SCENE2D && viewer.camera.positionCartographic.height != tmpViewer.camera.positionCartographic.height) {
              tmpViewer.camera.setView({destination:Cesium.Cartesian3.fromRadians(viewer.camera.positionCartographic.longitude, viewer.camera.positionCartographic.latitude, viewer.camera.frustum.right - viewer.camera.frustum.left)});
            }
          }
        });
      });
      viewers.push(viewer);
    } else {
      viewers[viewerIndex].scene.mode = sceneMode;
      viewers[viewerIndex].scene.screenSpaceCameraController.maximumZoomDistance = maximumZoomDistance;
      viewers[viewerIndex].scene.screenSpaceCameraController.minimumZoomDistance = minimumZoomDistance;
      viewers[viewerIndex].camera.percentageChanged = percentageChanged;
      viewers[viewerIndex].resolutionScale = resolutionScale;
      if (sceneMode == Cesium.SceneMode.SCENE3D) {
        viewers[viewerIndex].camera.setView({destination:Cesium.Cartesian3.fromDegrees(initialLongitude, initialLatitude, initialHeight)});
      } else if (sceneMode == Cesium.SceneMode.SCENE2D){
        viewers[viewerIndex].camera.setView({destination:Cesium.Cartesian3.fromDegrees(initialLongitude, 0, initialHeight)});
      } else {
        viewers[viewerIndex].camera.setView({destination:Cesium.Cartesian3.fromDegrees(0, 0, initialHeight)});
      }  
      document.getElementById(['viewerheader', viewerIndex].join('')).textContent = configNames[viewerIndex];
      document.getElementById(['viewerheader', viewerIndex].join('')).style.visibility = 'visible';
      if (sceneMode == Cesium.SceneMode.SCENE3D) {
        document.getElementById(['viewer', viewerIndex].join('')).className = 'viewerbig';
      } else {
        document.getElementById(['viewer', viewerIndex].join('')).className = 'viewersmall';
      }
      document.getElementById(['viewer', viewerIndex].join('')).style.visibility = 'visible';
      document.getElementById(['viewerfooter', viewerIndex].join('')).style.visibility = 'visible';
    }
  }
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
    let formerSelectedText = ''
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

function removeImageryLayers(){
  viewers.forEach(viewer => {
    viewer.scene.primitives.removeAll()
  });
  controleViewer.imageryLayers.removeAll();
}

function setImageryLayers(){
  controleViewer.imageryLayers.addImageryProvider(new ArrowImageryProvider({urlPrefix:[endpoint, bucket, '/'].join(''), urlSuffix:urlSuffix, datasetPath:datasetPath, level:tileLevel, viewers:viewers, configTable:configTableMap.get(datasetCategoryPath)}));
}