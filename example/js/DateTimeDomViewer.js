import {constance} from "./const.js"
import ArrowImageryProvider from "./ArrowImageryProvider.js";

var _com = new constance()
console.log(_com.maximumLevel)

export function initDatetimeSelector(param, optionArray = []) {
    let selectElem = document.getElementById(param);
    selectElem.textContent = null;
    console.log(optionArray)
    for (let i = 0; i < optionArray.length; i++) {
        let optionElem = document.createElement("option");
        optionElem.setAttribute("option", optionArray[i]);
        optionElem.textContent = optionArray[i];
        if (i == optionArray.length - 1) {
            optionElem.setAttribute("selected", "selected");
        }
        selectElem.appendChild(optionElem);
    }
}


export function setViewer(imageryLayers, viewerArray, yearMonthdayHourminuteArray) {
    console.trace(yearMonthdayHourminuteArray)
    imageryLayers.removeAll();
    for (let i = 1; i < _com.viewerIdArray.length; i++) {
        viewerArray[i].entities.removeAll();
    };
    let aipViewerArray = [];
    _com.aipViewerNumArray.forEach(aipViewerNum => {
        aipViewerArray.push(viewerArray[aipViewerNum]);
    });
    imageryLayers.addImageryProvider(new ArrowImageryProvider({
        maximumLevel: _com.maximumLevel, 
        minimumLevel: _com.minimumLevel,
        urlPrefixArray: _com.aipUrlPrefixArray,
        propertyArray: _com.aipPropertyArray,
        drawArray: _com.aipDrawArray,
        pixelSizeArray: _com.aipPixelSizeArray,
        colorBarArray: _com.aipColorBarArray,
        minValueArray: _com.aipMinValueArray,
        maxValueArray: _com.aipMaxValueArray,
        viewerArray: aipViewerArray,
        year: yearMonthdayHourminuteArray["year"],
        monthDay: yearMonthdayHourminuteArray["monthday"],
        hourMinute: yearMonthdayHourminuteArray["hourminute"],
    }));
}