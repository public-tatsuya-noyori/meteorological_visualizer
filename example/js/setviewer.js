import { constance } from "./const.js";
import ArrowImageryProvider from "./ArrowImageryProvider.js";

const _com = new constance()


export function setViewer(imageryLayers, viewerArray, yearMonthdayHourminuteArray, _propertyArray) {
    //console.trace(yearMonthdayHourminuteArray)
    imageryLayers.removeAll();
    for (let i = 1; i < _com.viewerIdArray.length; i++) {
        viewerArray[i].entities.removeAll();
    };
    let aipViewerArray = [];
    _com.aipViewerNumArray.forEach(aipViewerNum => {
        aipViewerArray.push(viewerArray[aipViewerNum]);
    });

    let propertyArray = []

    if (_propertyArray == undefined) {
        propertyArray = _com.aipPropertyArray
    } else {
        propertyArray = _propertyArray
    }

    let minValueArray = []
    let maxValueArray = []

    _propertyArray.forEach(proerty => {
        minValueArray.push(_com.MinValueDic[proerty])
        maxValueArray.push(_com.MaxValueDic[proerty])
    })

    imageryLayers.addImageryProvider(new ArrowImageryProvider({
        maximumLevel: _com.maximumLevel,
        minimumLevel: _com.minimumLevel,
        urlPrefixArray: _com.aipUrlPrefixArray,
        propertyArray: propertyArray,
        drawArray: _com.aipDrawArray,
        pixelSizeArray: _com.aipPixelSizeArray,
        colorBarArray: _com.aipColorBarArray,
        minValueArray: minValueArray,
        maxValueArray: maxValueArray,
        viewerArray: aipViewerArray,
        year: yearMonthdayHourminuteArray["year"],
        monthDay: yearMonthdayHourminuteArray["monthday"],
        hourMinute: yearMonthdayHourminuteArray["hourminute"],
    }));
}