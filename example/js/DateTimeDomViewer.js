import {constance} from "./const.js"
import ArrowImageryProvider from "./ArrowImageryProvider.js";

var con = new constance()
console.log(con.maximumLevel)

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
    imageryLayers.removeAll();
    for (let i = 1; i < con.viewerIdArray.length; i++) {
        viewerArray[i].entities.removeAll();
    };
    let aipViewerArray = [];
    con.aipViewerNumArray.forEach(aipViewerNum => {
        aipViewerArray.push(viewerArray[aipViewerNum]);
    });
    imageryLayers.addImageryProvider(new ArrowImageryProvider({
        maximumLevel: con.maximumLevel, 
        minimumLevel: con.minimumLevel,
        urlPrefixArray: con.aipUrlPrefixArray,
        propertyArray: con.aipPropertyArray,
        drawArray: con.aipDrawArray,
        pixelSizeArray: con.aipPixelSizeArray,
        colorBarArray: con.aipColorBarArray,
        minValueArray: con.aipMinValueArray,
        maxValueArray: con.aipMaxValueArray,
        viewerArray: aipViewerArray,
        year: yearMonthdayHourminuteArray[0],
        monthDay: yearMonthdayHourminuteArray[1],
        hourMinute: yearMonthdayHourminuteArray[2],
    }));
}