const perspectiveWorker = perspective.worker();
let categorySelectedTextMap = new Map(), maxCategoryLevel = 3;
let datetimeSelectedTextMap = new Map(), maxDatetimeLevel = 3;
let datasetCategoryPath = '', datasetPath = '';
let deckglViewers = [];
let deckglViewersViewState = undefined;
let perspectiveViewerElem = document.getElementsByTagName("perspective-viewer")[0];
let perspectiveViewerConfig = {};
let perspectiveViewerDivElem = document.getElementById('perspectiveViewer');
let perspectiveTable = undefined;
let deckglViewersLimitNum = 15;
let tables = [];
let pageNum = 0;
let parallel = 8;

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
  inputElem = document.getElementById('legendMode');
  inputElem.addEventListener('change', async () => {
    setLegend();
  });
  inputElem = document.getElementById('next');
  inputElem.addEventListener('click', async () => {
    pageNum = pageNum + 1;
    await clearDeckglLayers();
    await setDeckglViewers();
    await setDeckglLayers(tables);
  });
  inputElem = document.getElementById('previous');
  inputElem.addEventListener('click', async () => {
    pageNum = pageNum - 1;
    await clearDeckglLayers();
    await setDeckglViewers();
    await setDeckglLayers(tables);
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
    await setDeckglLayers(tables);
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
  });
  await setCategorySelectors(0);
}

async function getSelectOptions(path){
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

async function setCategorySelectors(selectedLevel){
  pageNum = 0;
  let inputElem = document.getElementById('clearMode');
  inputElem.checked = true;
  inputElem = document.getElementById('legendMode');
  inputElem.checked = false;
  datasetCategoryPath = '';
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
  let numberOfConfigDeckglViewer = configNames.length - deckglViewersLimitNum * pageNum;
  if (numberOfConfigDeckglViewer > deckglViewersLimitNum) {
    numberOfConfigDeckglViewer = deckglViewersLimitNum;
  }
  let numberOfDeckglViewer = deckglViewers.length;
  if (numberOfDeckglViewer > numberOfConfigDeckglViewer) {
    for (let deckglViewerIndex = numberOfConfigDeckglViewer; deckglViewerIndex < numberOfDeckglViewer; deckglViewerIndex++) {
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
      deckglViewerHeaderElem.textContent = configNames[deckglViewerIndex + deckglViewersLimitNum * pageNum];
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
      let deckglViewerHeaderElem = document.getElementById(['deckglViewerHeader', deckglViewerIndex].join(''));
      deckglViewerHeaderElem.textContent = configNames[deckglViewerIndex + deckglViewersLimitNum * pageNum];
      deckglViewerHeaderElem.style.visibility = 'visible';
      let deckglViewerElem = document.getElementById(['deckglViewer', deckglViewerIndex].join(''));
      deckglViewerElem.className = 'deckglViewer';
      deckglViewerElem.style.visibility = 'visible';
    }
  }
}

async function setDatetimeSelectors(selectedLevel){
  let datetimeLevel = datasetCategoryPathConfigMap.get(datasetCategoryPath.substring(datasetCategoryPath.indexOf('/') + 1, datasetCategoryPath.length)).datetimeLevel;
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
        selectedIndex = options.length - 1;
      }
      selectElem.selectedIndex = selectedIndex;
    }
    datetimeSelectedTextMap.set(level, selectElem.options[selectElem.selectedIndex].text);
  }
  datasetPath = [path, datetimeSelectedTextMap.get(datetimeLevel)].join('');
  await clearDeckglLayers();
  await getTables();
  if (tables.length == 0) {
    alert('No data');
  }
  await setDeckglLayers(tables);
}

async function clearDeckglLayers(){
  deckglViewers.forEach(deckglViewer => {
    deckglViewer.setProps({layers: [mapGeoJsonLayer.clone()]});
  });
}

async function getTables(){
  let config = datasetCategoryPathConfigMap.get(datasetCategoryPath.substring(datasetCategoryPath.indexOf('/') + 1, datasetCategoryPath.length));
  let inputElem = document.getElementById('clearMode');
  if (inputElem.checked) {
    tables = [];
  }
  perspectiveViewerElem.delete();
  perspectiveViewerElem.remove();
  perspectiveViewerElem = document.createElement('perspective-viewer');
  perspectiveViewerElem.className = 'perspective-viewer-material';
  perspectiveViewerDivElem.appendChild(perspectiveViewerElem);
  if (perspectiveTable != undefined) {
    perspectiveTable.clear();
    //perspectiveTable.delete();
  }
  let files = [];
  let params = {Bucket: bucket, Prefix: datasetPath, Delimiter: '/'}, response = {};
  do {
    response = await s3.makeUnauthenticatedRequest('listObjectsV2', params).promise();
    response.Contents.forEach(content => {
      let file = content.Key.replace(datasetPath, '');
      if (config['filter'].length == 0 || config['filter'].indexOf(file.split('.')[0]) > -1) {
        files.push(file);
      }
    });
    if (response.IsTruncated) {
      params.ContinuationToken = response.NextContinuationToken;
    }
  } while (response.IsTruncated);
  if (files.length > 0) {
    let workers = [];
    for (let j = 0; j < parallel; j++) {
      let slicedFiles = [];
      for (let i = 0; i * parallel + j < files.length; i++) {
        slicedFiles.push(files[i * parallel + j]);
      }
      if (slicedFiles.length > 0) {
        workers.push(fetchTables(slicedFiles));
      }
    }
    let tablesList = await Promise.all(workers);
    tables = tables.concat(tablesList.flat(2));
  }
}

async function fetchTables(slicedFiles) {
  let slicedTables = [];
  for (let file of slicedFiles) {
    slicedTables.push(await Arrow.tableFromIPC(fetch([endpoint, bucket, '/', datasetPath, file].join(''))));
  }
  return slicedTables;
}

async function setPerspectiveTable(tableList){
  let perspectiveTableSchema = {};
  tableList.forEach((table) => {
    let tableColumnTypes = table.schema.fields.map((d) => d.type);
    table.schema.names.forEach((tableColumnName, tableColumnIndex) => {
      if (tableColumnTypes[tableColumnIndex].toString().indexOf('tf8') > -1) {
        perspectiveTableSchema[tableColumnName] = 'string';
      } else if (tableColumnTypes[tableColumnIndex].toString().indexOf('loat') > -1) {
        perspectiveTableSchema[tableColumnName] = 'float';
      } else if (tableColumnTypes[tableColumnIndex].toString().indexOf('nt') > -1) {
        perspectiveTableSchema[tableColumnName] = 'integer';
      } else if (tableColumnTypes[tableColumnIndex].toString().indexOf('imestamp') > -1) {
        perspectiveTableSchema[tableColumnName] = 'datetime';
      }
    });
  });
  if (tableList.length > 0) {
    perspectiveTable = await perspectiveWorker.table(perspectiveTableSchema);
    await perspectiveViewerElem.load(perspectiveTable);
    await perspectiveViewerElem.reset();
    perspectiveViewerConfig.columns = Object.keys(perspectiveTableSchema);
    await perspectiveViewerElem.restore(perspectiveViewerConfig);
    for (let table of tables) {
      await perspectiveTable.update(Arrow.tableToIPC(table).buffer);
    }
  }
  perspectiveViewerElem.addEventListener("perspective-config-update", async () => {
    perspectiveViewerConfig = await perspectiveViewerElem.save();
    setFilterdTableToMapGlobe();
  });
  let config = datasetCategoryPathConfigMap.get(datasetCategoryPath.substring(datasetCategoryPath.indexOf('/') + 1, datasetCategoryPath.length));
  let idColumnFilter = config.idColumnFilter;
  if (idColumnFilter == undefined) {
    let selectElem = document.getElementById('idColumnFilter');
    selectElem.textContent = null;
    selectElem.style.visibility = 'hidden';
    selectElem.style.height = '0px';
    selectElem.style.width = '0px';
  } else {
    let selectElem = document.getElementById('idColumnFilter');
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

async function setPerspectiveViewer(){
  let inputElem = document.getElementById('tableMode');
  if (inputElem.checked) {
    perspectiveViewerElem.style.visibility = 'visible';
    perspectiveViewerElem.style.height = '600px';
    perspectiveViewerElem.toggleConfig(true);
  } else {
    perspectiveViewerElem.style.visibility = 'hidden';
    perspectiveViewerElem.style.height = '0px';
  }
}

async function setDeckglLayers(tables){
  let tableList = [];
  let isSetPerspectiveTalbe = false;
  if ((await perspectiveViewerElem.save()).filter.length > 0) {
    if (perspectiveTable == undefined || await perspectiveTable.size() == 0) {
      await setPerspectiveTable(tables);
      isSetPerspectiveTalbe = true;
    }
    let filteredPerspectiveView = await perspectiveTable.view({filter: (await perspectiveViewerElem.save()).filter});
    tableList = [Arrow.tableFromIPC(await filteredPerspectiveView.to_arrow())];
    filteredPerspectiveView.delete();
  } else {
    tableList = tables;
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
  let pageLength = config.name.length - deckglViewersLimitNum * pageNum;
  if (pageLength > deckglViewersLimitNum) {
    pageLength = deckglViewersLimitNum;
    let inputElem = document.getElementById('next');
    inputElem.type = 'button';
  } else {
    let inputElem = document.getElementById('next');
    inputElem.type = 'hidden';
  }
  if (pageNum > 0) {
    let inputElem = document.getElementById('previous');
    inputElem.type = 'button';
  } else {
    let inputElem = document.getElementById('previous');
    inputElem.type = 'hidden';
  }
  let tablePositionsMap = new Map();
  if (config['heightName'] == undefined) {
    for (let [tableIndex, table] of tableList.entries()) {
      let positions = new Float32Array(3 * table.numRows);
      for (let i = 0; i < table.numRows; i++) {
        positions[3 * i] =  table.get(i)['longitude [degree]'];
        positions[3 * i + 1] =  table.get(i)['latitude [degree]'];
        positions[3 * i + 2] =  0.0;
      }
      tablePositionsMap.set(tableIndex, positions);
    }
  } else {
    for (let [tableIndex, table] of tableList.entries()) {
      let positions = new Float32Array(3 * table.numRows);
      for (let i = 0; i < table.numRows; i++) {
        positions[3 * i] =  table.get(i)['longitude [degree]'];
        positions[3 * i + 1] =  table.get(i)['latitude [degree]'];
        positions[3 * i + 2] =  table.get(i)[config['heightName']] * config['heightMultiply'];
      }
      tablePositionsMap.set(tableIndex, positions);
    }
  }
  for (let configIndex = deckglViewersLimitNum * pageNum; configIndex < pageLength + deckglViewersLimitNum * pageNum; configIndex++) {
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
    for (let [tableIndex, table] of tableList.entries()) {
      if (layerType == 'PointCloud') {
        let colors = new Uint8Array(4 * table.numRows);
        if (table.schema.names.indexOf(name) > 0) {
          let vector = table.getChild(name);
          for (let i = 0; i < table.numRows; i++) {
            let rgb = d3.rgb(colorScale(vector.get(i)));
            colors[4 * i] = rgb.r;
            colors[4 * i + 1] = rgb.g;
            colors[4 * i + 2] = rgb.b;
            colors[4 * i + 3] = 255;
          }
        } else {
          for (let i = 0; i < table.numRows; i++) {
            colors[4 * i + 3] = 255;
          }
        }
        layers.push(new deck.PointCloudLayer({
          id: [name, '_', tableIndex].join(''),
          pointSize: 3,
          material: false,
          data: {
            length: table.numRows,
            attributes: {
              getColor: colors,
              getPosition: tablePositionsMap.get(tableIndex)
            }
          }
        }));
      }
    }
    layers.push(mapGeoJsonLayer.clone());
    deckglViewers[configIndex - deckglViewersLimitNum * pageNum].setProps({layers: layers});
  }
  if (!isSetPerspectiveTalbe && (perspectiveTable == undefined || await perspectiveTable.size() == 0)) {
    await setPerspectiveTable(tables);
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

async function setIdColumnFilter(){
  let selectElem = document.getElementById('idColumnFilter');
  if (selectElem.selectedIndex > 0) {
    perspectiveViewerConfig.filter = [['id', "==", selectElem.options[selectElem.selectedIndex].text]];
  } else {
    perspectiveViewerConfig.filter = [];
  }
  await perspectiveViewerElem.restore(perspectiveViewerConfig);
}

async function setFilterdTableToMapGlobe(){
  let inputElem = document.getElementById('filterText');
  let filters = [];
  perspectiveViewerConfig.filter.forEach((filter) => {
    filters.push(filter.join(''));
  });
  inputElem.value = filters.join(', ')
  await clearDeckglLayers();
  await setDeckglLayers(tables);
}