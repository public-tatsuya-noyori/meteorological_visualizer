import ArrowImageryProvider from "./ArrowImageryProvider.js";
var viewerArray = [];
var imageryLayers, configPropertyTable;
document.addEventListener('DOMContentLoaded',() => {
  init();
});
function setViewer(){
  imageryLayers.removeAll();
  viewerArray.forEach(viewer => {
    viewer.entities.removeAll();
  });
  imageryLayers.addImageryProvider(new ArrowImageryProvider({level:level, viewerArray:viewerArray, configPropertyTable:configPropertyTable, datetimePath:'2021/0411/1800', ft:'0'}));
}
async function init(){
  let sceneMode = Cesium.SceneMode.SCENE3D, maximumZoomDistance = 6500000, minimumZoomDistance = 1000000, percentageChanged = 0.001, resolutionScale = 1.0;
  let viewerOption = {animation:false, baseLayerPicker:false, creditContainer:"c", fullscreenButton:false, geocoder:false, homeButton:false, infoBox:false, navigationHelpButton:false, requestRenderMode:false, sceneMode:sceneMode, sceneModePicker:false, selectionIndicator:false, shadow:false, skyAtmosphere:false, skyBox:false, targetFrameRate:1, timeline:false, useBrowserRecommendedResolution:true, useDefaultRenderLoop:true}
  let controleViewer = new Cesium.Viewer(controleViewerId, viewerOption);
  controleViewer.scene.screenSpaceCameraController.maximumZoomDistance = maximumZoomDistance;
  controleViewer.scene.screenSpaceCameraController.minimumZoomDistance = minimumZoomDistance;
  controleViewer.camera.percentageChanged = percentageChanged;
  controleViewer.resolutionScale = resolutionScale;
  controleViewer.camera.setView({destination:Cesium.Cartesian3.fromDegrees(initialLongitude, initialLatitude, initialHeight)});
  viewerIdArray.forEach(viewerId => {
    let viewer = new Cesium.Viewer(viewerId, viewerOption);
    viewer.scene.screenSpaceCameraController.maximumZoomDistance = maximumZoomDistance;
    viewer.scene.screenSpaceCameraController.minimumZoomDistance = minimumZoomDistance;
    viewer.camera.percentageChanged = percentageChanged;
    viewer.resolutionScale = resolutionScale;
    viewer.camera.setView({destination:Cesium.Cartesian3.fromDegrees(initialLongitude, initialLatitude, initialHeight)});
    viewerArray.push(viewer);
  });
  controleViewer.camera.changed.addEventListener(() => {
    viewerArray.forEach(viewer => {
      viewer.camera.position = controleViewer.camera.position;
      viewer.camera.direction = controleViewer.camera.direction;
      viewer.camera.up = controleViewer.camera.up;
      viewer.camera.right = controleViewer.camera.right;
    });
  });
  viewerArray.forEach(viewer => {
    viewer.camera.changed.addEventListener(() => {
      controleViewer.camera.position = viewer.camera.position;
      controleViewer.camera.direction = viewer.camera.direction;
      controleViewer.camera.up = viewer.camera.up;
      controleViewer.camera.right = viewer.camera.right;
    });
  });
  imageryLayers = controleViewer.imageryLayers;
  configPropertyTable = await Arrow.Table.from(fetch(configPropertyTableUrl));
  setViewer();
}
