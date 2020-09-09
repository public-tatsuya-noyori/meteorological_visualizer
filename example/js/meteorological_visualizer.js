import ArrowImageryProvider from "./ArrowImageryProvider.js";
(function(){
  document.addEventListener('DOMContentLoaded', function(){
    init()
  });
  function init(){
    viewerIdArray.forEach(viewerId => {
      let viewer = new Cesium.Viewer(viewerId, {animation:false, baseLayerPicker:false, fullscreenButton:false, geocoder:false, homeButton:false, infoBox:false, sceneModePicker:false, selectionIndicator:false, timeline:false, navigationHelpButton:false, skyBox:false, skyAtmosphere:false, useBrowserRecommendedResolution:false, sceneMode:sceneMode, creditContainer:"c", requestRenderMode:true});
      viewer.resolutionScale = resolutionScale;
      viewer.scene.screenSpaceCameraController.minimumZoomDistance = minimumZoomDistance;
      viewer.scene.screenSpaceCameraController.maximumZoomDistance = maximumZoomDistance;
      viewer.camera.percentageChanged=percentageChanged;
      viewer.camera.setView({destination:Cesium.Cartesian3.fromDegrees(initialLongitude, initialLatitude, initialHeight)});
      viewerArray.push(viewer);
    });
    viewerArray[0].camera.changed.addEventListener(() => {
      for (let i = 1;  i < viewerIdArray.length; i++) {
        viewerArray[i].camera.position = viewerArray[0].camera.position;
        viewerArray[i].camera.direction = viewerArray[0].camera.direction;
        viewerArray[i].camera.up = viewerArray[0].camera.up;
        viewerArray[i].camera.right = viewerArray[0].camera.right;
      };
    });
    for (let i = 1;  i < viewerIdArray.length; i++) {
      viewerArray[i].camera.changed.addEventListener(() => {
        viewerArray[0].camera.position = viewerArray[i].camera.position;
        viewerArray[0].camera.direction = viewerArray[i].camera.direction;
        viewerArray[0].camera.up = viewerArray[i].camera.up;
        viewerArray[0].camera.right = viewerArray[i].camera.right;
      });
    };
    imageryLayers = viewerArray[0].imageryLayers;
    s3.makeUnauthenticatedRequest('listObjectsV2', {Bucket: bucket, Prefix: defaultPrefix, Delimiter: "/"}).promise().then((responseData) => {
      responseData.CommonPrefixes.forEach(commonPrefix => {
        yearArray.push(commonPrefix.Prefix.replace(defaultPrefix, "").replace("/", ""));
      });
      year = yearArray[0];
      s3.makeUnauthenticatedRequest('listObjectsV2', {Bucket: bucket, Prefix: defaultPrefix + year + "/", Delimiter: "/"}).promise().then((responseData) => {
        responseData.CommonPrefixes.forEach(commonPrefix => {
          monthDayArray.push(commonPrefix.Prefix.replace(defaultPrefix + year + "/", "").replace("/", ""));
        });
        monthDay = monthDayArray[0];
        s3.makeUnauthenticatedRequest('listObjectsV2', {Bucket: bucket, Prefix: defaultPrefix + year + "/" + monthDay + "/", Delimiter: "/"}).promise().then((responseData) => {
          responseData.CommonPrefixes.forEach(commonPrefix => {
            hourMinuteArray.push(commonPrefix.Prefix.replace(defaultPrefix + year + "/" + monthDay + "/", "").replace("/", ""));
          });
          hourMinute = hourMinuteArray[0];
          imageryLayers.addImageryProvider(new ArrowImageryProvider({maximumLevel:maximumLevel, minimumLevel:minimumLevel,
            year: year,
            monthDay: monthDay,
            hourMinute: hourMinute,
            pathArray: ["bufr_to_arrow/surface/synop", "bufr_to_arrow/surface/synop", "bufr_to_arrow/surface/synop", "bufr_to_arrow/surface/synop", "bufr_to_arrow/surface/synop", "bufr_to_arrow/surface/synop"],
            propertyArray: ["air temperature [K]", "air temperature [K]", "air temperature [K]", "air temperature [K]", "air temperature [K]", "air temperature [K]"],
            drawArray: ["point", "point", "point", "point", "point", "point"],
            viewerArray: [viewerArray[1], viewerArray[2], viewerArray[3], viewerArray[4], viewerArray[5], viewerArray[6]],
            pixelSizeArray: [5, 5, 5, 5, 5, 5],
            colorBarArray: ["pbgrf", "pbgrf", "pbgrf", "pbgrf", "pbgrf", "pbgrf"],
            minValueArray: [280.0, 280.0, 280.0, 280.0, 280.0, 280.0],
            maxValueArray: [290.0, 290.0, 290.0, 290.0, 290.0, 290.0]
          }));
          let yearElem = document.getElementById("year");
          for (let i = 0;  i < yearArray.length;  i++) {
            let optionElem = document.createElement("option");
            optionElem.setAttribute("option", yearArray[i]);
            optionElem.textContent = yearArray[i];
            if (i == 0) {
              optionElem.setAttribute("selected", "selected");
            }
            yearElem.appendChild(optionElem);
          };
          let monthDayElem = document.getElementById("monthDay");
          for (let i = 0;  i < monthDayArray.length;  i++) {
            let optionElem = document.createElement("option");
            optionElem.setAttribute("option", monthDayArray[i]);
            optionElem.textContent = monthDayArray[i];
            if (i == 0) {
              optionElem.setAttribute("selected", "selected");
            }
            monthDayElem.appendChild(optionElem);
          };
          let hourMinuteElem = document.getElementById("hourMinute");
          for (let i = 0;  i < hourMinuteArray.length;  i++) {
            let optionElem = document.createElement("option");
            optionElem.setAttribute("option", hourMinuteArray[i]);
            optionElem.textContent = hourMinuteArray[i];
            if (i == 0) {
              optionElem.setAttribute("selected", "selected");
            }
            hourMinuteElem.appendChild(optionElem);
          };
        });
      });
    });
  }
}())