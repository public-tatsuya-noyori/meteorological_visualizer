import { getChildDirectoryArray } from "./get_s3_info.js"
import { initDatetimeSelector, setViewer } from "./DateTimeDomViewer.js"
import { constance } from "./const.js"



const _com = new constance()



const region = _com.region
const endpoint = _com.endpoint
const bucket = _com.bucket
const defaultPrefix = _com.defaultPrefix
const yearMonthdayHourminuteIdArray = _com.yearMonthdayHourminuteIdArray
const viewerIdArray = _com.viewerIdArray
const sceneMode = _com.sceneMode

AWS.config.region = region;
const s3 = new AWS.S3({ apiVersion: "2014-10-01", endpoint: new AWS.Endpoint(endpoint) });


var yearOptionArray = [];
var monthdayOptionArray = [];
var hourminuteOptionArray = [];
var yearMonthdayHourminuteArray = ["", "", ""];
var viewerArray = [];
var imageryLayers = new Cesium.ImageryLayerCollection();



document.addEventListener('DOMContentLoaded', function () {
  init()
  yearMonthdayHourminuteIdArray.forEach(yearMonthdayHourminuteId => {
    let select = document.getElementById(yearMonthdayHourminuteId);
    select.addEventListener('change', function () {
      setDatetimeSelectors(s3, yearMonthdayHourminuteId)
    });
  })
});



async function setDatetimeSelectors(s3, param) {
  let OptionDic = { "year": [], "monthday": [], "hourminute": [] }
  let Dom_param_dic = { "year": "", "monthday": "", "hourminute": "" }

  if (param == "year" || param == "monthday" || param == "hourminute") {
    for (let key_param in Dom_param_dic) {
      Dom_param_dic[key_param] = document.getElementById(key_param).value
    }
  } else {
    let tmp_Prefix = defaultPrefix

    for (let key_param in Dom_param_dic) {
      console.log(tmp_Prefix)
      let tmp_option = await getChildDirectoryArray(s3, tmp_Prefix, bucket)
      console.log(tmp_option)
      Dom_param_dic[key_param] = tmp_option[tmp_option.length - 1]
      tmp_Prefix = tmp_Prefix + Dom_param_dic[key_param] + "/"
      //ループを崩したほうが可読性が高いかも
    }
  }
  setViewer(imageryLayers, viewerArray, Dom_param_dic);//辞書型にしているので関数の処理を変更する

  OptionDic["year"] = await getChildDirectoryArray(s3, defaultPrefix, bucket)
  OptionDic["monthday"] = await getChildDirectoryArray(s3, defaultPrefix + Dom_param_dic["year"] + "/", bucket)
  OptionDic["hourminute"] = await getChildDirectoryArray(s3, defaultPrefix + Dom_param_dic["year"] + "/" + Dom_param_dic["monthday"] + "/", bucket)
  for (let key_param in OptionDic) {
    let selectElem = document.getElementById(key_param)
    selectElem.textContent = null;
    for (let opt of OptionDic[key_param]){
      let optionElem = document.createElement("option");
      optionElem.setAttribute("option",opt);
      optionElem.textContent = opt
      if (opt == Dom_param_dic[key_param]) {
        optionElem.setAttribute("selected", "selected");
      }
      selectElem.appendChild(optionElem); 
    }
  }
}


function init() {
  const resolutionScale = 1;
  const minimumZoomDistance = 1000000;
  const maximumZoomDistance = 6500000;
  const percentageChanged = 0.001;
  const initialLongitude = 140;
  const initialLatitude = 35;
  const initialHeight = 6500000;
  viewerIdArray.forEach(viewerId => {
    let viewer = new Cesium.Viewer(viewerId, { animation: false, baseLayerPicker: false, fullscreenButton: false, geocoder: false, homeButton: false, infoBox: false, sceneModePicker: false, selectionIndicator: false, timeline: false, navigationHelpButton: false, shouldAnimate: true, skyBox: false, skyAtmosphere: false, sceneMode: sceneMode, creditContainer: "c", requestRenderMode: true });
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
  setDatetimeSelectors(s3, "");
}