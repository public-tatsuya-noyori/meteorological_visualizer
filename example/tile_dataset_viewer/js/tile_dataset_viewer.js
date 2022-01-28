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
let tables = [];
let deckglViewersLimitNum = 15;
let pageNum = 0;

document.addEventListener('DOMContentLoaded',async () => {
  initialize();
});

async function initialize(){
  let inputElem = document.getElementById('tableMode');
  inputElem.addEventListener('change', async () => {
    setPerspective();
  });
  inputElem = document.getElementById('legendMode');
  inputElem.addEventListener('change', async () => {
    setLegend();
  });
  inputElem = document.getElementById('next');
  inputElem.addEventListener('click', async () => {
    setNext();
  });
  inputElem = document.getElementById('previous');
  inputElem.addEventListener('click', async () => {
    setPrevious();
  });
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

async function setViewerType(){
  await setDeckglViewers();
}

async function setLayerType(){
  await clearDeckglLayers();
  await setDeckglLayers(tables);
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
  let viewerType = undefined;
  let selectElem = document.getElementById('viewerType');
  if (selectElem.selectedIndex > -1) {
    viewerType = selectElem.options[selectElem.selectedIndex].text;
  } else {
    viewerType = selectElem.options[0].text;
    selectElem.selectedIndex = 0;
  }
  let configNames = datasetCategoryPathConfigMap.get(datasetCategoryPath.substring(datasetCategoryPath.indexOf('/') + 1, datasetCategoryPath.length)).name
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
  datasetPath = [path, datetimeSelectedTextMap.get(maxDatetimeLevel)].join('');
  await clearDeckglLayers();
  tables = await getTables();
  if (tables.length == 0) {
    alert('No data');
  }
  await setDeckglLayers(tables);
  setPerspective();
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
      files.push(content.Key.replace(datasetPath, ''));
    });
    if (response.IsTruncated) {
      params.ContinuationToken = response.NextContinuationToken;
    }
  } while (response.IsTruncated);
  for (let file of files) {
    if (config['filter'].length == 0 || config['filter'].indexOf(file.split('.')[0]) > -1) {
      let response = await fetch([endpoint, bucket, '/', datasetPath, file].join(''));
      if (!response.ok) {
        continue
      }
      tables.push(Arrow.Table.from(await response.arrayBuffer()));
    }
  }
  return tables;
}

async function setPerspectiveTable(tables){
  let perspectiveTableSchema = {};
  tables.forEach((table) => {
    let tableColumnNames = table.schema.fields.map((d) => d.name);
    let tableColumnTypes = table.schema.fields.map((d) => d.type);
    tableColumnNames.forEach((tableColumnName, tableColumnIndex) => {
      if (tableColumnTypes[tableColumnIndex].toString().indexOf('tf8') > -1) {
        perspectiveTableSchema[tableColumnName] = 'string';
      } else if (tableColumnTypes[tableColumnIndex].toString().indexOf('loat') > -1) {
        perspectiveTableSchema[tableColumnName] = 'float';
      } else if (tableColumnTypes[tableColumnIndex].toString().indexOf('nt') > -1) {
        if (perspectiveTableSchema[tableColumnName] == undefined || perspectiveTableSchema[tableColumnName] != 'float') {
          perspectiveTableSchema[tableColumnName] = 'integer';
        }
      } else if (tableColumnTypes[tableColumnIndex].toString().indexOf('imestamp') > -1) {
        perspectiveTableSchema[tableColumnName] = 'datetime';
      }
    });
  });
  if (Object.keys(perspectiveTableSchema).length > 0) {
    perspectiveTable = await perspectiveWorker.table(perspectiveTableSchema);
    await perspectiveViewerElem.load(perspectiveTable);
    for (let table of tables) {
      await perspectiveTable.update(table.serialize().buffer);
    }
    if (perspectiveViewerConfig != undefined) {
      await perspectiveViewerElem.restore(perspectiveViewerConfig);
    }
    perspectiveViewerElem.addEventListener("perspective-config-update", async function (event) {
      perspectiveViewerConfig = await perspectiveViewerElem.save();
    });
    perspectiveViewerElem.toggleConfig(true);
    //let perspectiveTableView = await perspectiveTable.view();
    //for (let name of await perspectiveTable.columns()) {
    //  let min_max = await perspectiveTableView.get_min_max(name)
    //  console.log('name:', name, ', min:', min_max[0], ', max:', min_max[1]);
    //}
  }
}

async function setDeckglLayers(tables){
  let config = datasetCategoryPathConfigMap.get(datasetCategoryPath.substring(datasetCategoryPath.indexOf('/') + 1, datasetCategoryPath.length))
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
      colorScaleDomain.push(valueForMinColor + ((valueForMaxColor - valueForMinColor) / (colorScaleRange.length)) * i)
    }
    let colorScale = [];
    if (valueForMinColor < valueForMaxColor) {
      colorScale = d3.scaleThreshold().domain(colorScaleDomain).range(colorScaleRange);
    } else {
      colorScale = d3.scaleThreshold().domain(colorScaleDomain.reverse()).range(colorScaleRangeReverse);
    }
    tables.forEach((table, tableIndex) => {
      let tableColumnNames = table.schema.fields.map((d) => d.name);
      let layer = undefined;
      if (layerType == 'PointCloud') {
        layer = new deck.PointCloudLayer({
          id: [name, '_', tableIndex].join(''),
          pointSize: 3,
          material: false,
          data: {src: table, length: table.count()},
          getPosition: (object, {index, data, target}) => {
            let row = data.src.get(index);
            target[0] = row.get('longitude [degree]');
            target[1] = row.get('latitude [degree]');
            target[2] = 0.0;
            if (config['height'].length != 0) {
              config['height'].forEach(heightName => {
                if (row.get(heightName) != null) {
                  target[2] = row.get(heightName) * config['heightMultiply'];
                }
              })
            }
            return target;
          },
          getColor: (object, {index, data}) => {
            if (tableColumnNames.indexOf(name) < 0) {
              return [0, 0, 0];
            }
            let value = data.src.get(index).get(name);
            if (value == null) {
              return [0, 0, 0];
            } else {
              let rgb = d3.rgb(colorScale(value));
              return [rgb.r, rgb.g, rgb.b];
            }
          }
        });
      } else if (layerType == 'ScreenGrid(sum points)') {
        layer = new deck.ScreenGridLayer({
          id: [name, '_', tableIndex].join(''),
          cellSizePixels: 5,
          data: {src: table, length: table.count()},
          getPosition: (object, {index, data, target}) => {
            let row = data.src.get(index);
            target[0] = row.get('longitude [degree]');
            target[1] = row.get('latitude [degree]');
            return target;
          },
          getWeight: (object, {index, data}) => {
            if (tableColumnNames.indexOf(name) < 0) {
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
      if (layer != undefined) {
        layers.push(layer);
      }
    });
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
      d3.select(['#', 'deckglViewerHeader', deckglViewerIndex].join('')).append('svg').attr('viewBox', '0 0 600 300').attr('id', ['deckglViewerHeader', deckglViewerIndex, 'Svg'].join(''));
      d3.select(['#', 'deckglViewerHeader', deckglViewerIndex, 'Svg'].join('')).call(d3.legendColor().labels(d3.legendHelpers.thresholdLabels).scale(colorScale));
    }
  }
}

async function setNext(){
  pageNum = pageNum + 1;
  await clearDeckglLayers();
  await setDeckglViewers();
  await setDeckglLayers(tables);
}

async function setPrevious(){
  pageNum = pageNum - 1;
  await clearDeckglLayers();
  await setDeckglViewers();
  await setDeckglLayers(tables);
}

async function setPerspective(){
  let inputElem = document.getElementById('tableMode');
  if (inputElem.checked) {
    perspectiveViewerElem.style.visibility = 'visible';
    perspectiveViewerElem.style.height = '600px';
    await setPerspectiveTable(tables);
  } else {
    perspectiveViewerElem.style.visibility = 'hidden';
    perspectiveViewerElem.style.height = '0px';
    await clearPerspective();
  }
}