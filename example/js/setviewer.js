import { constance } from "./const.js";
import ArrowImageryProvider from "./ArrowImageryProvider.js";

const _com = new constance()


export function setViewer(imageryLayers, viewerArray, yearMonthdayHourminuteArray,
    _propertyArray, viewerNum, range_array_mn, range_array_mx) {
    //console.trace(yearMonthdayHourminuteArray)
    //console.log(viewerNum)
    imageryLayers.removeAll();
    for (let i = 1; i < _com.viewerIdArray.length; i++) {
        if (i != viewerNum && viewerNum != 0) {
            continue
        }
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
    //console.log(aipViewerArray)

    let minValueArray = []
    let maxValueArray = []

    _propertyArray.forEach(proerty => {
        minValueArray.push(_com.MinValueDic[proerty])
        maxValueArray.push(_com.MaxValueDic[proerty])
    })

    if (viewerNum != 0) {
        const max_viewerNum = "view_max_" + viewerNum
        const min_viewerNum = "view_min_" + viewerNum
        const mx = document.getElementById(max_viewerNum).value
        const mn = document.getElementById(min_viewerNum).value
        if (mx > mn) {
            minValueArray[viewerNum - 1] = Number(mn)
            maxValueArray[viewerNum - 1] = Number(mx)
        }
    } else {
        minValueArray = range_array_mn
        maxValueArray = range_array_mx
    }



    console.log(minValueArray)
    console.log(maxValueArray)

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
        viewerNum: viewerNum,
        year: yearMonthdayHourminuteArray["year"],
        monthDay: yearMonthdayHourminuteArray["monthday"],
        hourMinute: yearMonthdayHourminuteArray["hourminute"],
    }));
}