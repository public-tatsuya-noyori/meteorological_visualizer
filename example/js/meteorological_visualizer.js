import { setDatetimeSelectors, init_view_element_dom, set_view_element } from "./DateTimeDomViewer.js"
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
    select.addEventListener('change', function () {
      setDatetimeSelectors(s3, yearMonthdayHourminuteId, imageryLayers, viewerArray)
    });
  })

  for (let i = 1; i < 7; i++) {
    const select = "view_element_" + i
    const view_elem = document.getElementById(select)
    view_elem.addEventListener("change",() => set_view_element(imageryLayers, viewerArray))
  }
});


function init() {
  const resolutionScale = 1;
  const minimumZoomDistance = 1000000;
  const maximumZoomDistance = 6500000;
  const percentageChanged = 0.01;
  const initialLongitude = 140;
  const initialLatitude = 35;
  const initialHeight = 6500000;
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
      shouldAnimate: true,
      skyBox: false,
      skyAtmosphere: false,
      sceneMode: sceneMode,
      creditContainer: "c",
      requestRenderMode: true
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
  setDatetimeSelectors(s3, "", imageryLayers, viewerArray);
  const opt_elemet_array = _com.opt_elemet_array
  init_view_element_dom(opt_elemet_array)
}