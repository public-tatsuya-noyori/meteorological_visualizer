import perspective from 'https://cdn.jsdelivr.net/npm/@finos/perspective@latest/dist/cdn/perspective.js';
let categorySelectedTextMap = new Map(), maxCategoryLevel = 3;
let datetimeSelectedTextMap = new Map(), maxDatetimeLevel = 3;
let datasetCategoryPath = '', datasetPath = '';
let deckglViewers = [];
let deckglViewersViewState = undefined;
let deckglViewersLimitNum = 15;
let deckglViewersPageNum = 0;
let parallelFetchNum = 6;
let perspectiveWorker = undefined;
let perspectiveTableSchema = {};
let perspectiveTable = undefined;
let perspectiveViewerConfig = {filter:[]};
let isPerspectiveLoaded = false;
let arrowTables = [];

document.addEventListener('DOMContentLoaded',async () => {
  initialize();
});

async function initialize(){
  let inputElem = document.getElementById('tableMode');
  inputElem.addEventListener('change', async () => {
    setPerspectiveViewer();
  });
  inputElem.checked = false;
  setPerspectiveViewer();
  inputElem = document.getElementById('stackMode');
  inputElem.addEventListener('change', async () => {
    clearStack();
  });
  inputElem = document.getElementById('legendMode');
  inputElem.addEventListener('change', async () => {
    setLegend();
  });
  inputElem = document.getElementById('deckglViewersPageNext');
  inputElem.addEventListener('click', async () => {
    deckglViewersPageNum = deckglViewersPageNum + 1;
    await clearDeckglLayers();
    await setDeckglViewers();
    await setDeckglLayers();
  });
  inputElem = document.getElementById('deckglViewersPagePrevious');
  inputElem.addEventListener('click', async () => {
    deckglViewersPageNum = deckglViewersPageNum - 1;
    await clearDeckglLayers();
    await setDeckglViewers();
    await setDeckglLayers();
  });
  inputElem = document.getElementById('filterText');
  inputElem.value = '';
  let selectElem = document.getElementById('viewerType');
  selectElem.selectedIndex = 0;
  selectElem.addEventListener('change', async () => {
    await setDeckglViewers();
  });
  selectElem = document.getElementById('layerType');
  selectElem.selectedIndex = 0;
  selectElem.addEventListener('change', async () => {
    await clearDeckglLayers();
    await setDeckglLayers();
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
  selectElem = document.getElementById('idColumnFilter');
  selectElem.addEventListener('change', async () => {
    await setIdColumnFilter();
    await setFilterdTableToMapGlobe();
  });
  await setCategorySelectors(0);
}

async function getSelectOptions(path){
  let options = [], params = {Bucket: bucket, Prefix: path, Delimiter: '/'}, response = {};
  do {
    response = await s3.makeUnauthenticatedRequest('listObjectsV2', params).promise();
    for (let commonPrefix of response.CommonPrefixes) {
      options.push(commonPrefix.Prefix.replace(path, ''));
    }
    if (response.IsTruncated) {
      params.ContinuationToken = response.NextContinuationToken;
    }
  } while (response.IsTruncated);
  return options;
}

async function setCategorySelectors(selectedLevel){
  deckglViewersPageNum = 0;
  let inputElem = document.getElementById('stackMode');
  inputElem.checked = false;
  inputElem = document.getElementById('legendMode');
  inputElem.checked = false;
  inputElem = document.getElementById('filterText');
  inputElem.value = '';
  datasetCategoryPath = '';
  perspectiveViewerConfig = {filter:[]};
  let path = '';
  for (let level = 1; level < selectedLevel; level++) {
    path = [path, categorySelectedTextMap.get(level - 1)].join('');
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
    let options = [];
    if (level == 0) {
      options = await getSelectOptions('/');
    } else {
      options = await getSelectOptions(path);
    }
    selectElem.textContent = null;
    for (let option of options) {
      if (level == 0) {
        if (option.length == 4) {
          option = [option, '/'].join('');
        } else {
          continue;
        }
      }
      let optionElem = document.createElement('option');
      optionElem.textContent = option;
      selectElem.appendChild(optionElem);
    }
    selectElem.selectedIndex = selectedIndex;
    categorySelectedTextMap.set(level, selectElem.options[selectElem.selectedIndex].text);
    datasetCategoryPath = [path, selectElem.options[selectElem.selectedIndex].text].join('');
  }
  setDeckglViewers();
  await setDatetimeSelectors(-1);
}

async function setDatetimeSelectors(selectedLevel){
  let config = datasetCategoryPathConfigMap.get(datasetCategoryPath.substring(datasetCategoryPath.indexOf('/') + 1, datasetCategoryPath.length));
  let datetimeLevel = config.datetimeLevel;
  if (datetimeLevel < maxDatetimeLevel) {
    let selectElem = document.getElementById(['datetime', maxDatetimeLevel].join(''));
    selectElem.textContent = null;
    selectElem.style.visibility = 'hidden';
    selectElem.style.width = '0px';
  } else {
    let selectElem = document.getElementById(['datetime', maxDatetimeLevel].join(''));
    selectElem.style.visibility = 'visible';
    selectElem.style.width = null;
  }
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
  for (let level = selectedLevel; level <= datetimeLevel; level++) {
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
    let options = await getSelectOptions(path);
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
        if (datetimeLevel == maxDatetimeLevel && level == maxDatetimeLevel) {
          selectedIndex = 0;
        } else {
          selectedIndex = options.length - 1;
        }
      }
      selectElem.selectedIndex = selectedIndex;
    }
    datetimeSelectedTextMap.set(level, selectElem.options[selectElem.selectedIndex].text);
  }
  datasetPath = [path, datetimeSelectedTextMap.get(datetimeLevel)].join('');
  await clearDeckglLayers();
  await clearPerspective();
  await getTables();
  if (arrowTables.length == 0) {
    alert('No data');
  }
  await setDeckglLayers();
  setIdColumnFilterSelector(config.idColumnFilter);
  setPerspectiveViewer();
}

async function getTables(){
  let config = datasetCategoryPathConfigMap.get(datasetCategoryPath.substring(datasetCategoryPath.indexOf('/') + 1, datasetCategoryPath.length));
  let inputElem = document.getElementById('stackMode');
  if (!inputElem.checked) {
    perspectiveTableSchema = {};
    arrowTables = [];
  }
  let files = [];
  let params = {Bucket: bucket, Prefix: datasetPath, Delimiter: '/'}, response = {};
  do {
    response = await s3.makeUnauthenticatedRequest('listObjectsV2', params).promise();
    for (let content of response.Contents) {
      let file = content.Key.replace(datasetPath, '');
      if (config['filter'].length == 0 || config['filter'].indexOf(file.split('.')[0]) > -1) {
        files.push(file);
      }
    }
    if (response.IsTruncated) {
      params.ContinuationToken = response.NextContinuationToken;
    }
  } while (response.IsTruncated);
  if (files.length > 0) {
    let workers = [];
    for (let j = 0; j < parallelFetchNum; j++) {
      let slicedFiles = [];
      for (let i = 0; i * parallelFetchNum + j < files.length; i++) {
        slicedFiles.push(files[i * parallelFetchNum + j]);
      }
      if (slicedFiles.length > 0) {
        workers.push(fetchTables(slicedFiles));
      }
    }
    let arrowTablesArray = await Promise.all(workers);
    arrowTables = arrowTables.concat(arrowTablesArray.flat(2));
  }
}

async function fetchTables(slicedFiles) {
  let slicedTables = [];
  for (let file of slicedFiles) {
    let table = await Arrow.tableFromIPC(fetch([endpoint, bucket, '/', datasetPath, file].join('')));
    slicedTables.push(table);
    let tableColumnTypes = table.schema.fields.map((d) => d.type);
    for (let [tableColumnIndex, tableColumnName] of table.schema.names.entries()) {
      if (perspectiveTableSchema[tableColumnName] == undefined) {
        if (tableColumnTypes[tableColumnIndex].toString().indexOf('tf8') > -1) {
          perspectiveTableSchema[tableColumnName] = 'string';
        } else if (tableColumnTypes[tableColumnIndex].toString().indexOf('loat') > -1) {
          perspectiveTableSchema[tableColumnName] = 'float';
        } else if (tableColumnTypes[tableColumnIndex].toString().indexOf('nt') > -1) {
          perspectiveTableSchema[tableColumnName] = 'integer';
        } else if (tableColumnTypes[tableColumnIndex].toString().indexOf('imestamp') > -1) {
          perspectiveTableSchema[tableColumnName] = 'datetime';
        }  
      }
    }
  }
  return slicedTables;
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
  let configNames = datasetCategoryPathConfigMap.get(datasetCategoryPath.substring(datasetCategoryPath.indexOf('/') + 1, datasetCategoryPath.length)).name;
  let configDeckglViewerNum = configNames.length - deckglViewersLimitNum * deckglViewersPageNum;
  if (configDeckglViewerNum > deckglViewersLimitNum) {
    configDeckglViewerNum = deckglViewersLimitNum;
  }
  let numberOfDeckglViewer = deckglViewers.length;
  if (numberOfDeckglViewer > configDeckglViewerNum) {
    for (let deckglViewerIndex = configDeckglViewerNum; deckglViewerIndex < numberOfDeckglViewer; deckglViewerIndex++) {
      document.getElementById(['deckglViewerHeader', deckglViewerIndex].join('')).style.visibility = 'hidden';
      document.getElementById(['deckglViewer', deckglViewerIndex].join('')).style.visibility = 'hidden';
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
  for (let deckglViewerIndex = 0; deckglViewerIndex < configDeckglViewerNum; deckglViewerIndex++) {
    if (deckglViewerIndex >= numberOfDeckglViewer) {
      let trNumber = Math.floor(deckglViewerIndex / deckglViewerTableTdNum);
      if (0 == deckglViewerIndex % deckglViewerTableTdNum) {
        let trElem = document.createElement('div');
        trElem.className = 'tr';
        trElem.setAttribute('id', ['deckglViewerTr', trNumber].join(''));
        document.getElementById('deckglViewers').appendChild(trElem);
      }
      let deckglViewerHeaderElem = document.createElement('div');
      deckglViewerHeaderElem.className = 'deckglViewerHeader';
      deckglViewerHeaderElem.setAttribute('id', ['deckglViewerHeader', deckglViewerIndex].join(''));
      deckglViewerHeaderElem.textContent = configNames[deckglViewerIndex + deckglViewersLimitNum * deckglViewersPageNum];
      deckglViewerHeaderElem.style.visibility = 'visible';
      let deckglViewerElem = document.createElement('div');
      deckglViewerElem.className = 'deckglViewer';
      deckglViewerElem.style.visibility = 'visible';
      deckglViewerElem.setAttribute('id', ['deckglViewer', deckglViewerIndex].join(''));
      let tdElem = document.createElement('div');
      tdElem.className = 'td';
      tdElem.appendChild(deckglViewerHeaderElem);
      tdElem.appendChild(deckglViewerElem);
      let parentTrElem = document.getElementById(['deckglViewerTr', trNumber].join(''));
      parentTrElem.appendChild(tdElem);
      let deckglViewer = new deck.DeckGL({container:['deckglViewer', deckglViewerIndex].join(''), controller:true, layers: [mapGeoJsonLayer.clone()],
        onViewStateChange: ({viewState}) => {
          deckglViewersViewState = viewState;
          for (let [tmpDeckglViewerIndex, tmpDeckglViewer] of deckglViewers.entries()) {
            if (tmpDeckglViewerIndex != deckglViewerIndex) {
              tmpDeckglViewer.setProps({initialViewState:viewState});
            }
          }
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
      let deckglViewerHeaderElem = document.getElementById(['deckglViewerHeader', deckglViewerIndex].join(''));
      deckglViewerHeaderElem.textContent = configNames[deckglViewerIndex + deckglViewersLimitNum * deckglViewersPageNum];
      deckglViewerHeaderElem.style.visibility = 'visible';
      let deckglViewerElem = document.getElementById(['deckglViewer', deckglViewerIndex].join(''));
      deckglViewerElem.className = 'deckglViewer';
      deckglViewerElem.style.visibility = 'visible';
    }
  }
}

async function setDeckglLayers(){
  let tables = []
  if (perspectiveViewerConfig.filter.length > 0) {
    if (perspectiveTable == undefined) {
      await setPerspective();
    }
    let filteredPerspectiveView = await perspectiveTable.view({filter: perspectiveViewerConfig.filter});
    tables = [await Arrow.tableFromIPC(await filteredPerspectiveView.to_arrow())];
    filteredPerspectiveView.delete();
  } else {
    tables = arrowTables;
  }
  let config = datasetCategoryPathConfigMap.get(datasetCategoryPath.substring(datasetCategoryPath.indexOf('/') + 1, datasetCategoryPath.length));
  let layerType = undefined;
  let selectElem = document.getElementById('layerType');
  if (selectElem.selectedIndex > -1) {
    layerType = selectElem.options[selectElem.selectedIndex].text;
  } else {
    layerType = selectElem.options[0].text;
    selectElem.selectedIndex = 0;
  }
  let pageLength = config.name.length - deckglViewersLimitNum * deckglViewersPageNum;
  if (pageLength > deckglViewersLimitNum) {
    pageLength = deckglViewersLimitNum;
    let inputElem = document.getElementById('deckglViewersPageNext');
    inputElem.type = 'button';
  } else {
    let inputElem = document.getElementById('deckglViewersPageNext');
    inputElem.type = 'hidden';
  }
  if (deckglViewersPageNum > 0) {
    let inputElem = document.getElementById('deckglViewersPagePrevious');
    inputElem.type = 'button';
  } else {
    let inputElem = document.getElementById('deckglViewersPagePrevious');
    inputElem.type = 'hidden';
  }
  let tablePositionsMap = new Map();
  if (config['heightName'] == undefined) {
    for (let [tableIndex, table] of tables.entries()) {
      let positions = new Float32Array(3 * table.numRows);
      let lonVector = table.getChild('longitude [degree]');
      let latVector = table.getChild('latitude [degree]');
      for (let i = 0; i < table.numRows; i++) {
        positions[3 * i] =  lonVector.get(i);
        positions[3 * i + 1] =  latVector.get(i);
      }
      tablePositionsMap.set(tableIndex, positions);
    }
  } else {
    for (let [tableIndex, table] of tables.entries()) {
      let positions = new Float32Array(3 * table.numRows);
      let lonVector = table.getChild('longitude [degree]');
      let latVector = table.getChild('latitude [degree]');
      let heightVector = table.getChild(config['heightName']);
      if (heightVector == null) {
        for (let i = 0; i < table.numRows; i++) {
          positions[3 * i] =  lonVector.get(i);
          positions[3 * i + 1] =  latVector.get(i);
        }
      } else {
        for (let i = 0; i < table.numRows; i++) {
          positions[3 * i] =  lonVector.get(i);
          positions[3 * i + 1] =  latVector.get(i);
          positions[3 * i + 2] =  heightVector.get(i) * config['heightMultiply'];
        }  
      }
      tablePositionsMap.set(tableIndex, positions);
    }
  }
  for (let configIndex = deckglViewersLimitNum * deckglViewersPageNum; configIndex < pageLength + deckglViewersLimitNum * deckglViewersPageNum; configIndex++) {
    let layers = [];
    let name = config['name'][configIndex];
    let valueForMinColor = config['valueForMinColor'][configIndex];
    let valueForMaxColor = config['valueForMaxColor'][configIndex];
    let colorScaleDomain = [];
    for (let i = 0; i < colorScaleRange.length - 1; i++) {
      colorScaleDomain.push(valueForMinColor + ((valueForMaxColor - valueForMinColor) / (colorScaleRange.length)) * i);
    }
    let colorScale = [];
    if (valueForMinColor < valueForMaxColor) {
      colorScale = d3.scaleThreshold().domain(colorScaleDomain).range(colorScaleRange);
    } else {
      colorScale = d3.scaleThreshold().domain(colorScaleDomain.reverse()).range(colorScaleRangeReverse);
    }
    for (let [tableIndex, table] of tables.entries()) {
      if (layerType == 'PointCloud') {
        let colors = new Uint8Array(3 * table.numRows);
        if (table.schema.names.indexOf(name) > -1) {
          let vector = table.getChild(name);
          for (let i = 0; i < table.numRows; i++) {
            let rgb = d3.rgb(colorScale(vector.get(i)));
            colors[3 * i] = rgb.r;
            colors[3 * i + 1] = rgb.g;
            colors[3 * i + 2] = rgb.b;
          }
        }
        layers.push(new deck.PointCloudLayer({
          id: [name, '_', tableIndex].join(''),
          pointSize: 3,
          material: false,
          data: {
            length: table.numRows,
            attributes: {
              getColor: {value:colors, size:3, normalized: true}, 
              getPosition: tablePositionsMap.get(tableIndex)
            }
          }
        }));
      }
    }
    layers.push(mapGeoJsonLayer.clone());
    deckglViewers[configIndex - deckglViewersLimitNum * deckglViewersPageNum].setProps({layers: layers});
  }
}

async function clearDeckglLayers(){
  for (let deckglViewer of deckglViewers) {
    deckglViewer.setProps({layers: [mapGeoJsonLayer.clone()]});
  }
}

async function setLegend(){
  let config = datasetCategoryPathConfigMap.get(datasetCategoryPath.substring(datasetCategoryPath.indexOf('/') + 1, datasetCategoryPath.length));
  for (let [deckglViewerIndex, name] of config['name'].entries()) {
    let valueForMinColor = config['valueForMinColor'][deckglViewerIndex];
    let valueForMaxColor = config['valueForMaxColor'][deckglViewerIndex];
    let colorScaleDomain = [];
    for (let i = 0; i < colorScaleRange.length - 1; i++) {
      colorScaleDomain.push(valueForMinColor + ((valueForMaxColor - valueForMinColor) / (colorScaleRange.length)) * i);
    }
    let colorScale = [];
    if (valueForMinColor < valueForMaxColor) {
      colorScale = d3.scaleThreshold().domain(colorScaleDomain).range(colorScaleRange);
    } else {
      colorScale = d3.scaleThreshold().domain(colorScaleDomain.reverse()).range(colorScaleRangeReverse);
    }
    let inputElem = document.getElementById('legendMode');
    d3.selectAll(['#', 'deckglViewerHeader', deckglViewerIndex, 'Svg'].join('')).remove();
    if (inputElem.checked) {
      d3.select(['#', 'deckglViewerHeader', deckglViewerIndex].join('')).append('svg').attr('viewBox', '0 0 640 300').attr('id', ['deckglViewerHeader', deckglViewerIndex, 'Svg'].join(''));
      d3.select(['#', 'deckglViewerHeader', deckglViewerIndex, 'Svg'].join('')).call(d3.legendColor().labels(d3.legendHelpers.thresholdLabels).scale(colorScale));
    }
  }
}

async function clearPerspective() {
  if (perspectiveTable != undefined) {
    let perspectiveViewerElem = document.getElementsByTagName("perspective-viewer")[0];
    try {
      await perspectiveViewerElem.delete();
      await perspectiveTable.delete();
    } catch (e) {
    } finally {
      await perspectiveWorker.terminate();
    }
    perspectiveViewerElem.remove();
    perspectiveViewerElem = document.createElement('perspective-viewer');
    perspectiveViewerElem.className = 'perspective-viewer-material';
    document.getElementById('perspectiveViewer').appendChild(perspectiveViewerElem);
    perspectiveWorker = undefined;
    perspectiveTable = undefined;
    isPerspectiveLoaded = false;
  }
}

async function setPerspective(){
  perspectiveWorker = perspective.worker();
  perspectiveTable = await perspectiveWorker.table(perspectiveTableSchema);
  for (let table of arrowTables) {
    await perspectiveTable.update(Arrow.tableToIPC(table).buffer);
  }
  perspectiveViewerConfig.columns = await perspectiveTable.columns();
}

async function loadPerspectiveTable(){
  let perspectiveViewerElem = document.getElementsByTagName("perspective-viewer")[0];
  await perspectiveViewerElem.load(perspectiveTable);
  perspectiveViewerElem.toggleConfig(true);
  await perspectiveViewerElem.restore(perspectiveViewerConfig);
  perspectiveViewerElem.addEventListener("perspective-config-update", async () => {
    perspectiveViewerConfig = await perspectiveViewerElem.save();
    await setFilterdTableToMapGlobe();
  });
  isPerspectiveLoaded = true;
}

async function setPerspectiveViewer(){
  let inputElem = document.getElementById('tableMode');
  let perspectiveViewerElem = document.getElementsByTagName("perspective-viewer")[0];
  if (inputElem.checked) {
    if (perspectiveTable == undefined) {
      await setPerspective();
    }
    if (!isPerspectiveLoaded) {
      loadPerspectiveTable();
      isPerspectiveLoaded = true;
    }
    perspectiveViewerElem.style.visibility = 'visible';
    perspectiveViewerElem.style.height = '600px';
  } else {
    perspectiveViewerElem.style.visibility = 'hidden';
    perspectiveViewerElem.style.height = '0px';
  }
}

async function setIdColumnFilter(){
  let selectElem = document.getElementById('idColumnFilter');
  if (selectElem.selectedIndex > 0) {
    perspectiveViewerConfig.filter = [['id', "==", selectElem.options[selectElem.selectedIndex].text]];
  } else {
    perspectiveViewerConfig.filter = [];
  }
}

async function setFilterdTableToMapGlobe(){
  let inputElem = document.getElementById('filterText');
  let filters = [];
  for (let filter of perspectiveViewerConfig.filter) {
    filters.push(filter.join(''));
  }
  if (inputElem.value != filters.join(', ')) {
    inputElem.value = filters.join(', ');
    await clearDeckglLayers();
    await setDeckglLayers();
  }
}

async function setIdColumnFilterSelector(idColumnFilter) {
  let selectElem = document.getElementById('idColumnFilter');
  if (idColumnFilter == undefined) {
    selectElem.textContent = null;
    selectElem.style.visibility = 'hidden';
    selectElem.style.height = '0px';
    selectElem.style.width = '0px';
  } else {
    selectElem.style.visibility = 'visible';
    selectElem.style.height = null;
    selectElem.style.width = null;
    selectElem.textContent = null;
    let optionElem = document.createElement('option');
    optionElem.textContent = 'all';
    selectElem.appendChild(optionElem);
    for (let option of idColumnFilter) {
      let optionElem = document.createElement('option');
      optionElem.textContent = option;
      selectElem.appendChild(optionElem);
    }
    selectElem.selectedIndex = 0;
  }
}

async function clearStack() {
  let inputElem = document.getElementById('stackMode');
  if (!inputElem.checked) {
    let config = datasetCategoryPathConfigMap.get(datasetCategoryPath.substring(datasetCategoryPath.indexOf('/') + 1, datasetCategoryPath.length));
    setDatetimeSelectors(config.datetimeLevel);
  }
}