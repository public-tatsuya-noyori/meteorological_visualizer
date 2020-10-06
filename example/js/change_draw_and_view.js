import { constance } from "./const.js";
import { getChildDirectoryArray } from "./get_s3_info.js";
import { setViewer } from "./setviewer.js";

const _com = new constance()

const defaultPrefix = _com.defaultPrefix
const bucket = _com.bucket
const opt_elemet_array = _com.opt_elemet_array

export async function set_view_element(s3,imageryLayers, viewerArray) {
    console.log("I'm called!!")
    const { Dom_param_dic, OptionDic } = await get_datetime_from_dom(s3)

    let propertyArray = []
    for (let i = 1; i < 7; i++) {
        const select = "view_element_" + i
        const select_elem = document.getElementById(select).value
        propertyArray.push(select_elem)
    }
    console.log(propertyArray)

    set_datetime_dom(Dom_param_dic, OptionDic ,propertyArray)
    setViewer(imageryLayers, viewerArray, Dom_param_dic, propertyArray)

}

function set_datetime_dom(Dom_param_dic, OptionDic ,propertyArray) {
    //domをセットする

    for (let i = 1; i < 7; i++) {
        const select = "view_element_" + i
        const select_elem = document.getElementById(select)
        const you_select = propertyArray[i-1]
        select_elem.textContent = null;
        for (let opt of opt_elemet_array) {
            let optionElem = document.createElement("option");
            optionElem.setAttribute("option", opt);
            optionElem.textContent = opt
            if (opt == you_select) {
                optionElem.setAttribute("selected", "selected");
            }
            select_elem.appendChild(optionElem);
        }
    }

    for (let key_param in OptionDic) {
        let selectElem = document.getElementById(key_param)
        selectElem.textContent = null;
        const Option_array = OptionDic[key_param]
        for (let opt of Option_array) {
            let optionElem = document.createElement("option");
            optionElem.setAttribute("option", opt);
            optionElem.textContent = opt
            if (opt == Dom_param_dic[key_param]) {
                optionElem.setAttribute("selected", "selected");
            }
            selectElem.appendChild(optionElem);
        }
    }
}


async function get_datetime_from_dom(s3) {
    let OptionDic = { "year": [], "monthday": [], "hourminute": [] }
    let Dom_param_dic = { "year": "", "monthday": "", "hourminute": "" }

    //domに書かれているものを取得し存在するかをチェック

    //domに書かれているものをチェック
    for (let key_param in Dom_param_dic) {
        Dom_param_dic[key_param] = document.getElementById(key_param).value
    }

    //domの組み合わせがあるかどうかをチェック
    //なければ最新のものを入れておく
    OptionDic["year"] = await getChildDirectoryArray(s3, defaultPrefix, bucket)
    OptionDic["monthday"] = await getChildDirectoryArray(s3, defaultPrefix + Dom_param_dic["year"] + "/", bucket)
    OptionDic["hourminute"] = await getChildDirectoryArray(s3, defaultPrefix + Dom_param_dic["year"] + "/" + Dom_param_dic["monthday"] + "/", bucket)

    for (let key_param in Dom_param_dic) {
        const wanabe = Dom_param_dic[key_param]
        const pro_array = OptionDic[key_param]

        if (!pro_array.includes(wanabe)) {
            Dom_param_dic[key_param] = pro_array[pro_array.lenght - 1]
        }
    }

    return { Dom_param_dic: Dom_param_dic, OptionDic: OptionDic }

}