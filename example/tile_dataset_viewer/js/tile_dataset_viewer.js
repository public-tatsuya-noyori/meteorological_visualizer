const perspectiveWorker = perspective.worker();
let categorySelectedTextMap = new Map(), maxCategoryLevel = 3;
let datetimeSelectedTextMap = new Map(), maxDatetimeLevel = 2;
let datasetCategoryPath = '', datasetPath = '';
let deckglViewers = [];
let deckglViewersViewState = undefined;
let perspectiveViewerElem = document.getElementsByTagName("perspective-viewer")[0];
let perspectiveViewerConfig = undefined;
let perspectiveViewerDivElem = document.getElementById('perspectiveViewer');
let perspectiveTable = undefined;
let dataUrls = [];

document.addEventListener('DOMContentLoaded',async () => {
  initialize();
});

async function initialize(){
  let selectElem = document.getElementById('viewerType');
  selectElem.selectedIndex = 0;
  selectElem.addEventListener('change', async () => {
    setViewerType();
  });
  selectElem = document.getElementById('layerType');
  selectElem.selectedIndex = 0;
  selectElem.addEventListener('change', async () => {
    setLayerType();
  });
  for (let level = 0; level <= maxCategoryLevel; level++) {
    selectElem = document.getElementById(['category', level].join(''));
    selectElem.addEventListener('change', async () => {
      setCategorySelectors(level);
    });
  }
  for (let level = 0; level <= maxDatetimeLevel; level++) {
    selectElem = document.getElementById(['datetime', level].join(''));
    selectElem.addEventListener('change', async () => {
      setDatetimeSelectors(level);
    });
  }
  selectElem = document.getElementById('tileLevel');
  selectElem.addEventListener('change', async () => {
    setTileLevel();
  });
  await setCategorySelectors(0);
}

async function setViewerType(){
  await setDeckglViewers();
}

async function setLayerType(){
  await clearLayers();
  let tables = await getTables();
  setPerspective(tables);
  setDeckglLayers(tables);
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
  let deckglViewersInitialViewState = undefined;
  if (deckglViewersViewState == undefined) {
    if (viewerType == 'Globe') {
      deckglViewersInitialViewState = globeViewInitialViewState;
    } else {
      deckglViewersInitialViewState = mapViewInitialViewState;
    }
  } else {
    deckglViewersInitialViewState = deckglViewersViewState;
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
          deckglViewersViewState = viewState;
          deckglViewers.forEach((tmpDeckglViewer, tmpDeckglViewerIndex) => {
            if (tmpDeckglViewerIndex != deckglViewerIndex) {
              deckglViewers[tmpDeckglViewerIndex].setProps({initialViewState:viewState});
            }
          });
        }
      });
      deckglViewer.setProps({initialViewState:deckglViewersInitialViewState});
      if (viewerType == 'Globe') {
        deckglViewer.setProps({views:new deck._GlobeView()});
      } else {
        deckglViewer.setProps({views:new deck.MapView({repeat:true})});
      }
      deckglViewers.push(deckglViewer);
    } else {
      deckglViewers[deckglViewerIndex].setProps({initialViewState:deckglViewersInitialViewState});
      if (viewerType == 'Globe') {
        deckglViewers[deckglViewerIndex].setProps({views:new deck._GlobeView()});
      } else {
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
  let tables = await getTables();
  setPerspective(tables);
  setDeckglLayers(tables);
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
  deckglViewers.forEach(deckglViewer => {
    deckglViewer.setProps({layers: [mapGeoJsonLayer.clone()]});
  });
  if (perspectiveTable != undefined) {
    await perspectiveTable.clear();
    perspectiveTable = undefined;  
  }
  let perspectiveViewerElemVisibility = perspectiveViewerElem.style.visibility;
  let perspectiveViewerElemHeight = perspectiveViewerElem.style.height;
  perspectiveViewerElem.remove();
  perspectiveViewerElem = document.createElement('perspective-viewer');
  perspectiveViewerElem.className = 'perspective-viewer-material';
  perspectiveViewerDivElem.appendChild(perspectiveViewerElem);
  perspectiveViewerElem.style.visibility = perspectiveViewerElemVisibility;
  perspectiveViewerElem.style.height = perspectiveViewerElemHeight;
}

async function getTables(){
  let tables = [];
  for (let dataUrl of dataUrls) {
    let dataUrlList = dataUrl.split('/');
    if (configColumns['filter'].indexOf([dataUrlList[dataUrlList.length - 3], dataUrlList[dataUrlList.length - 2], dataUrlList[dataUrlList.length - 1]].join('/')) > -1) {
      let response = await fetch([endpoint, bucket, '/', dataUrl].join(''));
      if (!response.ok) {
        continue
      }
      tables.push(await response.arrayBuffer());
    }
  }
  return tables;
}

async function setPerspective(tables){
  let tileDataTables = [];
  let tileDataTableColumnNames = [];
  let perspectiveTableSchema = {};
  for (let table of tables) {
    let tileDataTable = await perspectiveWorker.table(table);
    tileDataTables.push(tileDataTable);
    let tileDataTableSchema = await tileDataTable.schema();
    Object.keys(tileDataTableSchema).forEach(tileDataTableColumnName => {
      if (tileDataTableColumnNames.indexOf(tileDataTableColumnName) < 0) {
        tileDataTableColumnNames.push(tileDataTableColumnName);
        perspectiveTableSchema[tileDataTableColumnName] = tileDataTableSchema[tileDataTableColumnName];
      }
    });
  }
  if (tileDataTables.length == 0) {
    return;
  }
  perspectiveTable = await perspectiveWorker.table(perspectiveTableSchema);
  await perspectiveViewerElem.load(perspectiveTable);
  for (let tileDataTable of tileDataTables) {
    let tileDataTableArrow = await (await tileDataTable.view()).to_arrow();
    await perspectiveTable.update(tileDataTableArrow);
  }
  if (perspectiveViewerConfig != undefined) {
    await perspectiveViewerElem.restore(perspectiveViewerConfig);
  }
  perspectiveViewerElem.addEventListener("perspective-config-update", async function (event) {
    perspectiveViewerConfig = await perspectiveViewerElem.save();
  });
  perspectiveViewerElem.toggleConfig(true);
}

async function setDeckglLayers(tables){
  let configColumns = datasetCategoryPathConfigColumnsMap.get(datasetCategoryPath)
  let arrowTable = undefined;
  for (let [tableIndex, table] of tables.entries()) {
    if (tableIndex == 0) {
      arrowTable = Arrow.Table.from(table);
    } else {
      arrowTable = arrowTable.concat(Arrow.Table.from(table));
    }
  }
  if (arrowTable != undefined) {
    let arrowTableColumnNames = arrowTable.schema.fields.map((d) => d.name);
    for (let [deckglViewerIndex, name] of configColumns['name'].entries()) {
      let stepValueForColor = configColumns['stepValueForColor'][deckglViewerIndex];
      let numberOfStepForColor = configColumns['numberOfStepForColor'][deckglViewerIndex];
      let startValueForColor = configColumns['startValueForColor'][deckglViewerIndex];
      let rangeHslHue = d3.hsl(configColumns['startColor'][deckglViewerIndex]).h;
      let hslHueAngle = configColumns['hslHueAngle'][deckglViewerIndex];
      let colorScaleRangeArray = [];
      let colorScaleDomainArray = [];
      let hslHueStep = hslHueAngle / numberOfStepForColor;
      d3.range(startValueForColor, numberOfStepForColor * stepValueForColor + startValueForColor, stepValueForColor).forEach(domainValue => {
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
          data: {src: arrowTable, length: arrowTable.length},
          getPosition: (object, {index, data, target}) => {
            target[0] = data.src.get(index).get('longitude [degree]');
            target[1] = data.src.get(index).get('latitude [degree]');
            target[2] = 0;
            return target;
          },
          getColor: (object, {index, data}) => {
            if (arrowTableColumnNames.indexOf(name) < 0) {
              return [0, 0, 0]
            }
            let rgb = d3.rgb(colorScale(data.src.get(index).get(name)));
            return [rgb.r, rgb.g, rgb.b];
          }
        });
      } else if (layerType == 'PointCloud(threshold)') {
        layer = new deck.PointCloudLayer({
          pointSize: 3,
          material: false,
          data: {src: arrowTable, length: arrowTable.length},
          getPosition: (object, {index, data, target}) => {
            target[0] = data.src.get(index).get('longitude [degree]');
            target[1] = data.src.get(index).get('latitude [degree]');
            target[2] = 0;
            return target;
          },
          getColor: (object, {index, data}) => {
            if (arrowTableColumnNames.indexOf(name) < 0) {
              return [0, 0, 0]
            }
            let rgb = d3.rgb(colorScale(Math.round(data.src.get(index).get(name)/stepValueForColor) * stepValueForColor))
            return [rgb.r, rgb.g, rgb.b];
          }
        });
      } else if (layerType == 'ScreenGrid(sum points)') {
        layer = new deck.ScreenGridLayer({
          opacity: 0.8,
          cellSizePixels: 6,
          data: {src: arrowTable, length: arrowTable.length},
          getPosition: (object, {index, data, target}) => {
            target[0] = data.src.get(index).get('longitude [degree]');
            target[1] = data.src.get(index).get('latitude [degree]');
            return target;
          },
          getWeight: (object, {index, data}) => {
            if (arrowTableColumnNames.indexOf(name) < 0) {
              return 0;
            }
            if (data.src.get(index).get(name) == null) {
              return 0
            }
            return 1;
          },
          aggregation: 'SUM'
        });
      }
      if (layer == undefined) {
        deckglViewers[deckglViewerIndex].setProps({layers: [mapGeoJsonLayer.clone()]});
      } else {
        deckglViewers[deckglViewerIndex].setProps({layers: [layer, mapGeoJsonLayer.clone()]});
      }
    }
  }
}