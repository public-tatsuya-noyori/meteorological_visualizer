const perspectiveWorker = perspective.worker();
let categorySelectedTextMap = new Map([]), maxCategoryLevel = 3;
let datetimeSelectedTextMap = new Map([]), maxDatetimeLevel = 2;
let datasetCategoryPath = '', datasetPath = '';
let deckglViewers = [];
let perspectiveViewerElem = document.getElementsByTagName("perspective-viewer")[0];
let perspectiveViewerConfig = undefined;
let perspectiveViewerDivElem = document.getElementById('perspectiveViewer');
let perspectiveTable = undefined;
let dataUrls = [];

document.addEventListener('DOMContentLoaded',() => {
  initialize();
});

async function initialize(){
  let selectElem = document.getElementById('viewerType');
  selectElem.selectedIndex = 0;
  selectElem.addEventListener('change', function(){
    setViewerType();
  });
  selectElem = document.getElementById('layerType');
  selectElem.selectedIndex = 0;
  selectElem.addEventListener('change', function(){
    setLayerType();
  });
  for (let level = 0; level <= maxCategoryLevel; level++) {
    selectElem = document.getElementById(['category', level].join(''));
    selectElem.addEventListener('change', function(){
      setCategorySelectors(level);
    });
  }
  for (let level = 0; level <= maxDatetimeLevel; level++) {
    selectElem = document.getElementById(['datetime', level].join(''));
    selectElem.addEventListener('change', function(){
      setDatetimeSelectors(level);
    });
  }
  selectElem = document.getElementById('tileLevel');
  selectElem.addEventListener('change', function(){
    setTileLevel();
  });
  await setCategorySelectors(0);
}

async function setViewerType(){
  let selectElem = document.getElementById('viewerType');
  if (selectElem.selectedIndex == 2) {
    perspectiveViewerElem.style.visibility = 'visible';
  } else {
    perspectiveViewerElem.style.visibility = 'hidden';
    await setDeckglViewers();
  }
}

async function setLayerType(){
  await clearLayers();
  await setLayers();
}

async function setCategorySelectors(selectedLevel){
  perspectiveViewerConfig = undefined;
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
    let options = await getCategorySelectOptions(path);
    selectElem.textContent = null;
    for (let option of options) {
      let optionElem = document.createElement('option');
      optionElem.textContent = option;
      selectElem.appendChild(optionElem);
    }
    selectElem.selectedIndex = selectedIndex;
    categorySelectedTextMap.set(level, selectElem.options[selectElem.selectedIndex].text);
  }
  datasetCategoryPath = [path, categorySelectedTextMap.get(maxCategoryLevel)].join('');
  setDeckglViewers();
  await setDatetimeSelectors(-1);
}

async function getCategorySelectOptions(path){
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
  return options;
}

async function setDeckglViewers(){
  let viewerType = undefined;
  let selectElem = document.getElementById('viewerType');
  if (selectElem.selectedIndex > -1) {
    viewerType = selectElem.options[selectElem.selectedIndex].text;
  } else {
    viewerType = selectElem.options[0].text;
    selectElem.selectedIndex = 0;
  }
  let configNames = datasetCategoryPathConfigColumnsMap.get(datasetCategoryPath).name
  let numberOfConfigDeckglViewer = configNames.length;
  let numberOfDeckglViewer = deckglViewers.length;
  if (numberOfDeckglViewer > numberOfConfigDeckglViewer) {
    for (let deckglViewerIndex = numberOfConfigDeckglViewer; deckglViewerIndex < numberOfDeckglViewer; deckglViewerIndex++) {
      document.getElementById(['deckglViewerHeader', deckglViewerIndex].join('')).style.visibility = 'hidden';
      document.getElementById(['deckglViewer', deckglViewerIndex].join('')).style.visibility = 'hidden';
      document.getElementById(['deckglViewerFooter', deckglViewerIndex].join('')).style.visibility = 'hidden';
    }
  }
  for (let deckglViewerIndex = 0; deckglViewerIndex < numberOfConfigDeckglViewer; deckglViewerIndex++) {
    if (deckglViewerIndex >= numberOfDeckglViewer) {
      let trNumber = Math.floor(deckglViewerIndex / numberOfConfigDeckglViewersTableTd);
      if (0 == deckglViewerIndex % numberOfConfigDeckglViewersTableTd) {
        let trElem = document.createElement('div');
        trElem.className = 'tr';
        trElem.setAttribute('id', ['deckglViewerTr', trNumber].join(''));
        document.getElementById('deckglViewers').appendChild(trElem);
      }
      let deckglViewerHeaderElem = document.createElement('div');
      deckglViewerHeaderElem.className = 'deckglViewerHeader';
      deckglViewerHeaderElem.setAttribute('id', ['deckglViewerHeader', deckglViewerIndex].join(''));
      deckglViewerHeaderElem.textContent = configNames[deckglViewerIndex];
      deckglViewerHeaderElem.style.visibility = 'visible';
      let deckglViewerElem = document.createElement('div');
      if (viewerType == 'Globe') {
        deckglViewerElem.className = 'deckglViewerSmall';
      } else {
        deckglViewerElem.className = 'deckglViewerBig';
      }
      deckglViewerElem.style.visibility = 'visible';
      deckglViewerElem.setAttribute('id', ['deckglViewer', deckglViewerIndex].join(''));
      let deckglViewerFooterElem = document.createElement('div');
      deckglViewerFooterElem.className = 'deckglViewerFooter';
      deckglViewerFooterElem.setAttribute('id', ['deckglViewerFooter', deckglViewerIndex].join(''));
      deckglViewerFooterElem.style.visibility = 'visible';
      let tdElem = document.createElement('div');
      tdElem.className = 'td';
      tdElem.appendChild(deckglViewerHeaderElem);
      tdElem.appendChild(deckglViewerElem);
      tdElem.appendChild(deckglViewerFooterElem);
      let parentTrElem = document.getElementById(['deckglViewerTr', trNumber].join(''));
      parentTrElem.appendChild(tdElem);
      let deckglViewer = new deck.DeckGL({container:['deckglViewer', deckglViewerIndex].join(''), controller:true, layers: [mapGeoJsonLayer.clone()],
        onViewStateChange: ({viewState}) => {
          deckglViewers.forEach((tmpDeckglViewer, tmpDeckglViewerIndex) => {
            if (tmpDeckglViewerIndex != deckglViewerIndex) {
              deckglViewers[tmpDeckglViewerIndex].setProps({initialViewState:viewState});
            }
          });
        }
      });
      if (viewerType == 'Globe') {
        deckglViewer.setProps({initialViewState:globeViewInitialViewState});
        deckglViewer.setProps({views:new deck._GlobeView()});
      } else {
        deckglViewer.setProps({initialViewState:mapViewInitialViewState});
        deckglViewer.setProps({views:new deck.MapView({repeat:true})});
      }
      deckglViewers.push(deckglViewer);
    } else {
      if (viewerType == 'Globe') {
        deckglViewers[deckglViewerIndex].setProps({initialViewState:globeViewInitialViewState});
        deckglViewers[deckglViewerIndex].setProps({views:new deck._GlobeView()});
      } else {
        deckglViewers[deckglViewerIndex].setProps({initialViewState:mapViewInitialViewState});
        deckglViewers[deckglViewerIndex].setProps({views:new deck.MapView({repeat:true})});
      }
      document.getElementById(['deckglViewerHeader', deckglViewerIndex].join('')).textContent = configNames[deckglViewerIndex];
      document.getElementById(['deckglViewerHeader', deckglViewerIndex].join('')).style.visibility = 'visible';
      if (viewerType == 'Globe') {
        document.getElementById(['deckglViewer', deckglViewerIndex].join('')).className = 'deckglViewerSmall';
      } else {
        document.getElementById(['deckglViewer', deckglViewerIndex].join('')).className = 'deckglViewerBig';
      }
      document.getElementById(['deckglViewer', deckglViewerIndex].join('')).style.visibility = 'visible';
      document.getElementById(['deckglViewerFooter', deckglViewerIndex].join('')).style.visibility = 'visible';
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
    let options = await getDatetimeSelectOptions(path);
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
  datasetPath = [path, datetimeSelectedTextMap.get(maxDatetimeLevel)].join('');
  await setTileLevel();
  await setTileXY();
  await clearLayers();
  await setLayers();
}

async function getDatetimeSelectOptions(path){
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
  return options;
}

async function setTileLevel(){
  let selectElem = document.getElementById('tileLevel');
  let selectedText = '';
  if (selectElem.selectedIndex > -1) {
    selectedText = selectElem.options[selectElem.selectedIndex].text;
  }
  selectElem.textContent = null;
  let params = {Bucket: bucket, Prefix: datasetPath, Delimiter: '/'}, response = {};
  do {
    response = await s3.makeUnauthenticatedRequest('listObjectsV2', params).promise();
    response.CommonPrefixes.forEach((commonPrefix, optionIndex) => {
      let option = commonPrefix.Prefix.replace(datasetPath, '');
      let optionElem = document.createElement('option');
      optionElem.textContent = option;
      selectElem.appendChild(optionElem);
      if (selectedText == option || selectedText == '') {
        selectElem.selectedIndex = optionIndex;
      }
    });
    if (response.IsTruncated) {
      params.ContinuationToken = response.NextContinuationToken;
    }
  } while (response.IsTruncated);
}

async function setTileXY(){
  dataUrls = [];
  let selectElem = document.getElementById('tileLevel');
  let tileLevel = selectElem.options[selectElem.selectedIndex].text;
  selectElem = document.getElementById('tileXY');
  let selectedText = [];
  selectElem.textContent = null;
  let path = [datasetPath, tileLevel].join('');
  let params = {Bucket: bucket, Prefix: path, Delimiter: '/'}, response = {};
  do {
    response = await s3.makeUnauthenticatedRequest('listObjectsV2', params).promise();
    for (let commonPrefix of response.CommonPrefixes) {
      let option = commonPrefix.Prefix.replace(path, '');
      let ys = await getTileYs(commonPrefix.Prefix);
      ys.forEach(y => {
        let optionElem = document.createElement('option');
        optionElem.textContent = [option, y].join('');
        selectElem.appendChild(optionElem);
        optionElem.selected = true;
        dataUrls.push([commonPrefix.Prefix, y].join(''));
      });
    }
    if (response.IsTruncated) {
      params.ContinuationToken = response.NextContinuationToken;
    }
  } while (response.IsTruncated);
}

async function getTileYs(path){
  let ys = [];
  let params = {Bucket: bucket, Prefix: path, Delimiter: '/'}, response = {};
  do {
    response = await s3.makeUnauthenticatedRequest('listObjectsV2', params).promise();
    response.Contents.forEach(content => {
      ys.push(content.Key.replace(path, ''));
    });
    if (response.IsTruncated) {
      params.ContinuationToken = response.NextContinuationToken;
    }
  } while (response.IsTruncated);
  return ys;
}

async function clearLayers(){
  if (perspectiveTable != undefined) {
    await perspectiveTable.clear();
    perspectiveTable = undefined;  
  }
  let perspectiveViewerElemVisibility = perspectiveViewerElem.style.visibility;
  perspectiveViewerElem.remove();
  perspectiveViewerElem = document.createElement('perspective-viewer');
  perspectiveViewerElem.className = 'perspective-viewer-material';
  perspectiveViewerDivElem.appendChild(perspectiveViewerElem);
  perspectiveViewerElem.style.visibility = perspectiveViewerElemVisibility;
}

async function setLayers(){
  let configColumns = datasetCategoryPathConfigColumnsMap.get(datasetCategoryPath)
  let tileDataTables = [];
  let tileDataTableColumnNames = [];
  let createTableObject = {}
  for (let dataUrl of dataUrls) {
    let response = await fetch([endpoint, bucket, '/', dataUrl].join(''));
    if (!response.ok) {
      continue
    }
    let tileDataTable = await perspectiveWorker.table(await response.arrayBuffer());
    tileDataTables.push(tileDataTable);
    let tileDataTableSchema = await tileDataTable.schema();
    Object.keys(tileDataTableSchema).forEach(tileDataTableColumnName => {
      if (!(tileDataTableColumnName in tileDataTableColumnNames)) {
        tileDataTableColumnNames.push(tileDataTableColumnName);
        if (tileDataTableSchema[tileDataTableColumnName] == 'string') {
          createTableObject[tileDataTableColumnName] = [''];
        } else if (tileDataTableSchema[tileDataTableColumnName] == 'integer') {
          createTableObject[tileDataTableColumnName] = [0];
        } else if (tileDataTableSchema[tileDataTableColumnName] == 'float') {
          createTableObject[tileDataTableColumnName] = [0.0];
        } else if (tileDataTableSchema[tileDataTableColumnName] == 'datetime') {
          createTableObject[tileDataTableColumnName] = [new Date()];
	      }
      }
    });
  }
  perspectiveTable = await perspectiveWorker.table(createTableObject);
  await perspectiveTable.clear();
  await perspectiveViewerElem.load(perspectiveTable);
  for (let tileDataTable of tileDataTables) {
    let tileDataTableColumns = await (await tileDataTable.view()).to_columns();
    await perspectiveTable.update(tileDataTableColumns);
  }
  if (perspectiveViewerConfig != undefined) {
    await perspectiveViewerElem.restore(perspectiveViewerConfig);
  }
  perspectiveViewerElem.addEventListener("perspective-config-update", async function (event) {
    perspectiveViewerConfig = await perspectiveViewerElem.save();
  });
  perspectiveViewerElem.toggleConfig(true);
  if (perspectiveTable != undefined) {
//    let perspectiveTableColumns = undefined;
//    if (perspectiveViewerConfig != undefined && perspectiveViewerConfig.filter.length > 0) {
//      perspectiveTableColumns = await (await perspectiveTable.view({filter:perspectiveViewerConfig.filter})).to_columns();
//    } else {
    let perspectiveTableColumns = await (await perspectiveTable.view()).to_columns();
//    }
    for (let [deckglViewerIndex, name] of configColumns['name'].entries()) {
      let thresholdStart = configColumns['thresholdStart'][deckglViewerIndex];
      let thresholdEnd = configColumns['thresholdEnd'][deckglViewerIndex];
      let thresholdStep = configColumns['thresholdStep'][deckglViewerIndex];
      let numberOfStepForColor = configColumns['numberOfStepForColor'][deckglViewerIndex];
      let startValueForColor = configColumns['startValueForColor'][deckglViewerIndex];
      let rangeHslHue = d3.hsl(configColumns['startColor'][deckglViewerIndex]).h;
      let hslHueAngle = configColumns['hslHueAngle'][deckglViewerIndex];
      let colorScaleRangeArray = [];
      let colorScaleDomainArray = [];
      let hslHueStep = hslHueAngle / numberOfStepForColor;
      d3.range(startValueForColor, numberOfStepForColor * thresholdStep + startValueForColor, thresholdStep).forEach(domainValue => {
        colorScaleRangeArray.push(d3.hsl(rangeHslHue, 1.0, 0.5));
        colorScaleDomainArray.push(domainValue);
        rangeHslHue = rangeHslHue + hslHueStep;
      });
      let colorScale = d3.scaleLinear().domain(colorScaleDomainArray).range(colorScaleRangeArray);
      let layer = undefined;
      let layerType = undefined;
      let selectElem = document.getElementById('layerType');
      if (selectElem.selectedIndex > -1) {
        layerType = selectElem.options[selectElem.selectedIndex].text;
      } else {
        layerType = selectElem.options[0].text;
        selectElem.selectedIndex = 0;
      }
      if (layerType == 'PointCloud') {
        layer = new deck.PointCloudLayer({
          pointSize: 3,
          material: false,
          data: {src: perspectiveTableColumns, length: perspectiveTableColumns['longitude [degree]'].length},
          getPosition: (object, {index, data, target}) => {
            target[0] = data.src['longitude [degree]'][index];
            target[1] = data.src['latitude [degree]'][index];
            if (configColumns['height'].length != 0) {
              configColumns['height'].forEach(heightName => {
                if (data.src[heightName] != undefined && data.src[heightName][index] != null) {
                  target[2] = data.src[heightName][index];
                  return target
                }
              })
            }
            target[2] = 0;
            return target;
          },
          getColor: (object, {index, data}) => {
            if (name in perspectiveTableColumns) {
              let rgb = d3.rgb(colorScale(data.src[name][index]));
              return [rgb.r, rgb.g, rgb.b];
            } else {
              return [0, 0, 0]
            }
          }
        });
      } else if (layerType == 'ScreenGrid(max)') {
        deckglViewers[deckglViewerIndex].setProps({layers: [mapGeoJsonLayer.clone()]});
        let colorRange = [];
        colorScaleDomainArray.forEach(threshold => {
          let rgb = d3.rgb(colorScale(threshold));
          colorRange.push([rgb.r, rgb.g, rgb.b]);
        });
        console.log(colorRange)
        layer = new deck.ScreenGridLayer({
          opacity: 0.8,
          cellSizePixels: 8,
          data: {src: perspectiveTableColumns, length: perspectiveTableColumns['longitude [degree]'].length},
          colorDomain: [1, colorScaleDomainArray.length + 1],
          colorRange:colorRange,
          getPosition: (object, {index, data, target}) => {
            target[0] = data.src['longitude [degree]'][index];
            target[1] = data.src['latitude [degree]'][index];
            return target;
          },
          getWeight: (object, {index, data}) => {
            if (name in perspectiveTableColumns) {
              if (data.src[name][index] == null || data.src[name][index] == undefined || data.src[name][index] == '') {
                return 0;
              } else {
                if ((thresholdStep > 0 && data.src[name][index] - thresholdStart <= 0) || (thresholdStep < 0 && data.src[name][index] - thresholdStart >= 0)) {
                  return 1;
                }
                let colorRangeIndex = Math.floor((data.src[name][index] - thresholdStart +  thresholdStep) / thresholdStep);
                if (colorRangeIndex >= colorScaleDomainArray.length) {
//                  return colorScaleDomainArray.length + 1;
                  return 1
                } else {
//                  return colorRangeIndex;
                  return 1
                }
              }
            } else {
              return 0;
            }
          },
          aggregation: 'MAX'
        });
      } else if (layerType == 'ScreenGrid(min)') {
        layer = new deck.ScreenGridLayer({
          opacity: 0.8,
          cellSizePixels: 8,
          data: {src: perspectiveTableColumns, length: perspectiveTableColumns['longitude [degree]'].length},
          getPosition: (object, {index, data, target}) => {
            target[0] = data.src['longitude [degree]'][index];
            target[1] = data.src['latitude [degree]'][index];
            return target;
          },
          getWeight: (object, {index, data}) => {
            if (name in perspectiveTableColumns) {
              if (data.src[name][index] == null || data.src[name][index] == undefined || data.src[name][index] == '') {
                return 0
              } else {
                return Math.floor((data.src[name][index] - thresholdStart) / thresholdStep);
              }
            } else {
              return 0;
            }
          },
          aggregation: 'MIN'
        });
      } else if (layerType == 'ScreenGrid(sum points)') {
        layer = new deck.ScreenGridLayer({
          opacity: 0.8,
          cellSizePixels: 8,
          data: {src: perspectiveTableColumns, length: perspectiveTableColumns['longitude [degree]'].length},
          getPosition: (object, {index, data, target}) => {
            target[0] = data.src['longitude [degree]'][index];
            target[1] = data.src['latitude [degree]'][index];
            return target;
          },
          getWeight: (object, {index, data}) => {
            if (name in perspectiveTableColumns) {
              if (data.src[name][index] == null || data.src[name][index] == undefined || data.src[name][index] == '') {
                return 0
              } else {
                return 1;
              }
            } else {
              return 0;
            }
          },
          aggregation: 'SUM'
        });
      } else if (layerType == 'Contour' && perspectiveTableColumns[name] != undefined) {
        let dataArray = d3.transpose([perspectiveTableColumns['longitude [degree]'], perspectiveTableColumns['latitude [degree]'], perspectiveTableColumns[name]]);
        let thresholdArray = d3.range(thresholdStart, thresholdEnd, thresholdStep);
        let contours = d3.tricontour().thresholds(thresholdArray)(dataArray);
        let data = [];
        contours.forEach(contour => {
          let rgb = d3.rgb(colorScale(contour.value));
          contour.coordinates.forEach(rings => {
            rings.forEach(contour => {
              data.push({contour:contour, color:[rgb.r,rgb.g,rgb.b]});
            });
          });
        });
        layer = new deck.PolygonLayer({
          data: data,
          stroked: true,
          filled: true,
          wireframe: true,
          lineWidthMinPixels: 1,
          getPolygon: d => d.contour,
          getElevation: 0,
          getFillColor: d => d.color,
          getLineColor: [80, 80, 80],
          getLineWidth: 1
        });
      }
      if (layer == undefined) {
        deckglViewers[deckglViewerIndex].setProps({layers: [mapGeoJsonLayer.clone()]});
      } else {
        deckglViewers[deckglViewerIndex].setProps({layers: [mapGeoJsonLayer.clone(), layer]});
      }
    }
  }
}