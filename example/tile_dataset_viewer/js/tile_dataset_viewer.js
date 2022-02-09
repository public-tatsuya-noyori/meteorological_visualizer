const perspectiveWorker = perspective.worker();
let categorySelectedTextMap = new Map(), maxCategoryLevel = 3;
let datetimeSelectedTextMap = new Map(), maxDatetimeLevel = 3;
let datasetCategoryPath = '', datasetPath = '';
let deckglViewers = [];
let deckglViewersViewState = undefined;
let perspectiveViewerElem = document.getElementsByTagName("perspective-viewer")[0];
let perspectiveViewerConfig = undefined;
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
    setPerspective(tables);
  });
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
  inputElem = document.getElementById('filterdTableToMapGlobe');
  inputElem.addEventListener('click', async () => {
    await setFilterdTableToMapGlobe();
  });
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
  perspectiveViewerConfig = undefined;
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
  let viewerType = undefined;
  let selectElem = document.getElementById('viewerType');
  if (selectElem.selectedIndex > -1) {
    viewerType = selectElem.options[selectElem.selectedIndex].text;
  } else {
    viewerType = selectElem.options[0].text;
    selectElem.selectedIndex = 0;
  }
  let configNames = config.name;
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
  setPerspective(tables);
}

async function clearDeckglLayers(){
  deckglViewers.forEach(deckglViewer => {
    deckglViewer.setProps({layers: [mapGeoJsonLayer.clone()]});
  });
}

async function clearPerspective(){
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
  let config = datasetCategoryPathConfigMap.get(datasetCategoryPath.substring(datasetCategoryPath.indexOf('/') + 1, datasetCategoryPath.length));
  let inputElem = document.getElementById('clearMode');
  if (inputElem.checked) {
    tables = [];
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
      let sliced_files = [];
      for (let i = 0; i * parallel + j < files.length; i++) {
        sliced_files.push(files[i * parallel + j]);
      }
      if (sliced_files.length > 0) {
        workers.push(fetchTables(sliced_files));
      }
    }
    let parallel_tables = await Promise.all(workers);
    tables = tables.concat(parallel_tables.flat(2));
  }
}

async function fetchTables(sliced_files) {
  let sliced_tables = [];
  for (let file of sliced_files) {
    sliced_tables.push(await Arrow.tableFromIPC(fetch([endpoint, bucket, '/', datasetPath, file].join(''))));
  }
  return sliced_tables;
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
  if (Object.keys(perspectiveTableSchema).length > 0) {
    perspectiveTable = await perspectiveWorker.table(perspectiveTableSchema);
    await perspectiveViewerElem.load(perspectiveTable);
    for (let table of tableList) {
      await perspectiveTable.update(Arrow.tableToIPC(table).buffer);
    }
    if (perspectiveViewerConfig == undefined) {
      await perspectiveViewerElem.reset();
    } else {
      await perspectiveViewerElem.restore(perspectiveViewerConfig);
    }
    perspectiveViewerElem.addEventListener("perspective-config-update", async function (event) {
      perspectiveViewerConfig = await perspectiveViewerElem.save();
    });
    perspectiveViewerElem.toggleConfig(true);
    //let perspectiveTableView = await perspectiveTable.view();
    //for (let name of await perspectiveTable.columns()) {
    //  let min_max = await perspectiveTableView.get_min_max(name);
    //  console.log('name:', name, ', min:', min_max[0], ', max:', min_max[1]);
    //}
  }
}

async function setDeckglLayers(tableList){
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
        if (table.schema.names.indexOf(name) > 0) {
          layers.push(new deck.PointCloudLayer({
            id: [name, '_', tableIndex].join(''),
            pointSize: 3,
            material: false,
            data: {src: table, length: table.numRows},
            getColor: (object, {index, data}) => {
              let rgb = d3.rgb(colorScale(data.src.get(index)[name]));
              return new Uint8Array([rgb.r, rgb.g, rgb.b]);
            },
            getPosition: (object, {index, data}) => {
              return new Float32Array([data.src.get(index)['longitude [degree]'], data.src.get(index)['latitude [degree]'], data.src.get(index)[config['heightName']] * config['heightMultiply']]);
            }
          }));
        } else {
          layers.push(new deck.PointCloudLayer({
            id: [name, '_', tableIndex].join(''),
            pointSize: 3,
            material: false,
            data: {src: table, length: table.numRows},
            getColor: new Uint8Array([0, 0, 0]),
            getPosition: (object, {index, data}) => {
              return new Float32Array([data.src.get(index)['longitude [degree]'], data.src.get(index)['latitude [degree]'], data.src.get(index)[config['heightName']] * config['heightMultiply']]);
            }
          }));
        }
      }
    }
    layers.push(mapGeoJsonLayer.clone());
    deckglViewers[configIndex - deckglViewersLimitNum * pageNum].setProps({layers: layers});
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

async function setPerspective(tableList){
  let inputElem = document.getElementById('tableMode');
  if (inputElem.checked) {
    await clearPerspective();
    perspectiveViewerElem.style.visibility = 'visible';
    perspectiveViewerElem.style.height = '600px';
    await setPerspectiveTable(tableList);
  } else {
    perspectiveViewerElem.style.visibility = 'hidden';
    perspectiveViewerElem.style.height = '0px';
    await clearPerspective();
  }
}

async function setIdColumnFilter(){
  let inputElem = document.getElementById('tableMode');
  if (!inputElem.checked) {
    inputElem.checked = true;
    await setPerspective(tables);  
  }
  let selectElem = document.getElementById('idColumnFilter');
  if (selectElem.selectedIndex > 0) {
    await perspectiveViewerElem.restore({filter: [['id', "==", selectElem.options[selectElem.selectedIndex].text]]});
    await clearDeckglLayers();
    await setDeckglLayers([Arrow.tableFromIPC(await (await perspectiveTable.view({filter: [['id', "==", selectElem.options[selectElem.selectedIndex].text]]})).to_arrow())]);
  } else {
    await clearDeckglLayers();
    await setDeckglLayers([Arrow.tableFromIPC(await (await perspectiveTable.view({filter: (await perspectiveViewerElem.save()).filter})).to_arrow())]);
  }
}

async function setFilterdTableToMapGlobe(){
  let inputElem = document.getElementById('tableMode');
  if (!inputElem.checked) {
    inputElem.checked = true;
    await setPerspective(tables);  
  }
  await clearDeckglLayers();
  await setDeckglLayers([Arrow.tableFromIPC(await (await perspectiveTable.view({filter: (await perspectiveViewerElem.save()).filter})).to_arrow())]);
}