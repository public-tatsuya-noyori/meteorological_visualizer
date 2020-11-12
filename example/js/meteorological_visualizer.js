import { init_draw_and_view } from "./init_draw_and_view.js"
import { set_view_element } from "./change_draw_and_view.js"
import { constance } from "./const.js"



const _com = new constance()



const region = _com.region
const endpoint = _com.endpoint
const yearMonthdayHourminuteIdArray = _com.yearMonthdayHourminuteIdArray
const viewerIdArray = _com.viewerIdArray
const sceneMode = _com.sceneMode


AWS.config.region = region;
const s3 = new AWS.S3({ apiVersion: "2014-10-01", endpoint: new AWS.Endpoint(endpoint) });



let viewerArray = [];
let imageryLayers = new Cesium.ImageryLayerCollection();

document.addEventListener('DOMContentLoaded', function () {
  init()
  yearMonthdayHourminuteIdArray.forEach(yearMonthdayHourminuteId => {
    let select = document.getElementById(yearMonthdayHourminuteId);
    select.addEventListener('change', () => set_view_element(s3, imageryLayers, viewerArray))
  })

  for (let i = 1; i < 7; i++) {
    const select = "view_element_" + i
    const view_elem = document.getElementById(select)
    view_elem.addEventListener("change", (e) => set_view_element(s3, imageryLayers, viewerArray, e.target.id))
    const max_or_min_change = "send_view" + i
    const change_elem = document.getElementById(max_or_min_change)
    change_elem.addEventListener("click", (e) => set_view_element(s3, imageryLayers, viewerArray, e.target.id))

  }
});


function renderLoop() {
  for (let i = 0; i < viewerIdArray.length; i++) {
    viewerArray[i].resize();
    viewerArray[i].render();
    viewerArray[i].scene.requestRender();
  };
  window.setTimeout(renderLoop, 200);
}

function init() {
  const resolutionScale = 1;
  const minimumZoomDistance = 1000000;
  const maximumZoomDistance = 6500000;
  const percentageChanged = 0.01;
  const initialLongitude = 140;
  const initialLatitude = 35;
  const initialHeight = 6500000;
  Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI4ODliN2Q1NS1hYTkwLTQxYWQtOTVjMy01NzFlMGRkZThhYmEiLCJpZCI6Mzc1MjUsImlhdCI6MTYwNTE2MjMxNn0.NJ33oqQu8VeX6Yh55y4TiOCtFe5Cxfk6UbddVUorHWo';
  viewerIdArray.forEach(viewerId => {
    let viewer = new Cesium.Viewer(viewerId, {
      animation: false,
      baseLayerPicker: false,
      fullscreenButton: false,
      geocoder: false,
      homeButton: false,
      infoBox: false,
      sceneModePicker: false,
      selectionIndicator: false,
      timeline: false,
      navigationHelpButton: false,
      skyBox: false,
      skyAtmosphere: false,
      sceneMode: sceneMode,
      creditContainer: "c",
      requestRenderMode: true,
      maximumRenderTimeChange: Infinity,
      useDefaultRenderLoop: false
    });
    viewer.resolutionScale = resolutionScale;
    viewer.scene.screenSpaceCameraController.minimumZoomDistance = minimumZoomDistance;
    viewer.scene.screenSpaceCameraController.maximumZoomDistance = maximumZoomDistance;
    viewer.camera.percentageChanged = percentageChanged;
    viewer.camera.setView({ destination: Cesium.Cartesian3.fromDegrees(initialLongitude, initialLatitude, initialHeight) });
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
  init_draw_and_view(s3, imageryLayers, viewerArray)
  window.setTimeout(renderLoop, 200);
}
