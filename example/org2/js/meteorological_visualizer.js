import ArrowImageryProvider from "./ArrowImageryProvider.js";
document.addEventListener('DOMContentLoaded', function(){
  init();
});
function setViewer(){
  imageryLayers.removeAll();
  for (let i in viewerIdArray) {
    viewerArray[i].entities.removeAll();
  };
  imageryLayers.addImageryProvider(new ArrowImageryProvider({level:level, viewerArray:viewerArray, configTable:configTable, datetimePath:'2021/0411/1800', ft:'0'}));
}
async function init(){
  let viewerOption = {animation:false, baseLayerPicker:false, fullscreenButton:false, geocoder:false, homeButton:false, infoBox:false, sceneModePicker:false, selectionIndicator:false, timeline:false, navigationHelpButton:false, skyBox:false, skyAtmosphere:false, sceneMode:sceneMode, creditContainer:"c", requestRenderMode:false, useDefaultRenderLoop:true, targetFrameRate:1}
  let controleViewer = new Cesium.Viewer(controleViewerId, viewerOption);
  controleViewer.resolutionScale = resolutionScale;
  controleViewer.scene.screenSpaceCameraController.minimumZoomDistance = minimumZoomDistance;
  controleViewer.scene.screenSpaceCameraController.maximumZoomDistance = maximumZoomDistance;
  controleViewer.camera.percentageChanged = percentageChanged;
  controleViewer.camera.setView({destination:Cesium.Cartesian3.fromDegrees(initialLongitude, initialLatitude, initialHeight)});
  viewerIdArray.forEach(viewerId => {
    let viewer = new Cesium.Viewer(viewerId, viewerOption);
    viewer.resolutionScale = resolutionScale;
    viewer.scene.screenSpaceCameraController.minimumZoomDistance = minimumZoomDistance;
    viewer.scene.screenSpaceCameraController.maximumZoomDistance = maximumZoomDistance;
    viewer.camera.percentageChanged = percentageChanged;
    viewer.camera.setView({destination:Cesium.Cartesian3.fromDegrees(initialLongitude, initialLatitude, initialHeight)});
    viewerArray.push(viewer);
  });
  controleViewer.camera.changed.addEventListener(() => {
    for (let i in viewerIdArray) {
      viewerArray[i].camera.position = controleViewer.camera.position;
      viewerArray[i].camera.direction = controleViewer.camera.direction;
      viewerArray[i].camera.up = controleViewer.camera.up;
      viewerArray[i].camera.right = controleViewer.camera.right;
    };
  });
  for (let i in viewerIdArray) {
    viewerArray[i].camera.changed.addEventListener(() => {
      controleViewer.camera.position = viewerArray[i].camera.position;
      controleViewer.camera.direction = viewerArray[i].camera.direction;
      controleViewer.camera.up = viewerArray[i].camera.up;
      controleViewer.camera.right = viewerArray[i].camera.right;
    });
  };
  imageryLayers = controleViewer.imageryLayers;
  configTable = await Arrow.Table.from(fetch('/configProperty.arrow'));
  setViewer();
}
