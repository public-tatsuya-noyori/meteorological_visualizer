import { constance } from "./const.js"
import ArrowImageryProvider from "./ArrowImageryProvider.js";
import { getChildDirectoryArray } from "./get_s3_info.js"

var _com = new constance()

const defaultPrefix = _com.defaultPrefix
const bucket = _com.bucket


export async function setDatetimeSelectors(s3, param, imageryLayers, viewerArray) {
    let OptionDic = { "year": [], "monthday": [], "hourminute": [] }
    let Dom_param_dic = { "year": "", "monthday": "", "hourminute": "" }

    if (param == "year" || param == "monthday" || param == "hourminute") {
        for (let key_param in Dom_param_dic) {
            Dom_param_dic[key_param] = document.getElementById(key_param).value
        }
    } else {
        let tmp_Prefix = defaultPrefix

        for (let key_param in Dom_param_dic) {
            //console.log(tmp_Prefix)
            let tmp_option = await getChildDirectoryArray(s3, tmp_Prefix, bucket)
            //console.log(tmp_option)
            Dom_param_dic[key_param] = tmp_option[tmp_option.length - 1]
            tmp_Prefix = tmp_Prefix + Dom_param_dic[key_param] + "/"
            //ループを崩したほうが可読性が高いかも
        }
    }


    OptionDic["year"] = await getChildDirectoryArray(s3, defaultPrefix, bucket)
    OptionDic["monthday"] = await getChildDirectoryArray(s3, defaultPrefix + Dom_param_dic["year"] + "/", bucket)
    OptionDic["hourminute"] = await getChildDirectoryArray(s3, defaultPrefix + Dom_param_dic["year"] + "/" + Dom_param_dic["monthday"] + "/", bucket)
    for (let key_param in OptionDic) {
        let selected = false;
        let selectElem = document.getElementById(key_param)
        selectElem.textContent = null;
        const Option_array = OptionDic[key_param]
        for (let i = 0; i < Option_array.length; i++) {
            let opt = Option_array[i]
            let optionElem = document.createElement("option");
            optionElem.setAttribute("option", opt);
            optionElem.textContent = opt
            if (opt == Dom_param_dic[key_param]) {
                optionElem.setAttribute("selected", "selected");
                selected = true
            }
            if (i == Option_array.length - 1 & !selected) {
                optionElem.setAttribute("selected", "selected");
                selected = true
                Dom_param_dic[key_param] = opt
            }
            selectElem.appendChild(optionElem);
        }
    }

    setViewer(imageryLayers, viewerArray, Dom_param_dic);//辞書型にしているので関数の処理を変更する
}


export function init_view_element_dom(opt_elemet_array) {
    for (let i = 1; i < 7; i++) {
        const select = "view_element_" + i
        const select_elem = document.getElementById(select)
        for (let opt of opt_elemet_array) {
            let optionElem = document.createElement("option");
            optionElem.setAttribute("option", opt);
            optionElem.textContent = opt
            select_elem.appendChild(optionElem);
        }
    }
}


export function set_view_element(imageryLayers, viewerArray) {
    console.log("I'm called!!")
    let Dom_param_dic = { "year": "", "monthday": "", "hourminute": "" }
    for (let key_param in Dom_param_dic) {
        Dom_param_dic[key_param] = document.getElementById(key_param).value
    }
    const propertyArray = []
    for (let i = 1; i < 7; i++) {
        const select = "view_element_" + i
        const select_elem = document.getElementById(select).value
        propertyArray.push(select_elem)
    }
    console.log(propertyArray)
    setViewer(imageryLayers, viewerArray, Dom_param_dic, propertyArray)
}

function setViewer(imageryLayers, viewerArray, yearMonthdayHourminuteArray, _propertyArray) {
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

    if(_propertyArray == undefined){
        propertyArray = _com.aipPropertyArray
    }else{
        propertyArray = _propertyArray
    }

    
    

    imageryLayers.addImageryProvider(new ArrowImageryProvider({
        maximumLevel: _com.maximumLevel,
        minimumLevel: _com.minimumLevel,
        urlPrefixArray: _com.aipUrlPrefixArray,
        propertyArray: propertyArray,
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