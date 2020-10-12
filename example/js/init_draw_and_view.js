import { constance } from "./const.js";
import { getChildDirectoryArray } from "./get_s3_info.js";
import { setViewer } from "./setviewer.js";

const _com = new constance()

const defaultPrefix = _com.defaultPrefix
const bucket = _com.bucket
const opt_elemet_array = _com.opt_elemet_array


export async function init_draw_and_view(s3, imageryLayers, viewerArray) {

    const { Dom_param_dic, OptionDic } = await init_datetime(s3)
    init_datetime_dom(Dom_param_dic, OptionDic)
    const _propertyArray = _com.aipPropertyArray

    setViewer(imageryLayers, viewerArray, Dom_param_dic, _propertyArray,0)
}

async function init_datetime(s3) {
    let tmp_Prefix = defaultPrefix
    let Dom_param_dic = { "year": "", "monthday": "", "hourminute": "" }
    let OptionDic = { "year": [], "monthday": [], "hourminute": [] }

    for (let key_param in Dom_param_dic) {
        //console.log(tmp_Prefix)
        let tmp_option = await getChildDirectoryArray(s3, tmp_Prefix, bucket);
        //console.log(tmp_option)
        Dom_param_dic[key_param] = tmp_option[tmp_option.length - 1]
        tmp_Prefix = tmp_Prefix + Dom_param_dic[key_param] + "/"
        //ループを崩したほうが可読性が高いかも
    }

    OptionDic["year"] = await getChildDirectoryArray(s3, defaultPrefix, bucket);
    OptionDic["monthday"] = await getChildDirectoryArray(s3, defaultPrefix + Dom_param_dic["year"] + "/", bucket);
    OptionDic["hourminute"] = await getChildDirectoryArray(s3, defaultPrefix + Dom_param_dic["year"] + "/" + Dom_param_dic["monthday"] + "/", bucket);

    return { Dom_param_dic: Dom_param_dic, OptionDic: OptionDic }
}

function init_datetime_dom(Dom_param_dic, OptionDic) {
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

    for (let key_param in OptionDic) {
        let selected = false;
        let selectElem = document.getElementById(key_param)
        selectElem.textContent = null;
        const Option_array = OptionDic[key_param]
        for (let opt of Option_array) {
            let optionElem = document.createElement("option");
            optionElem.setAttribute("option", opt);
            optionElem.textContent = opt
            if (opt == Dom_param_dic[key_param]) {
                optionElem.setAttribute("selected", "selected");
                selected = true
            }
            selectElem.appendChild(optionElem);
        }
    }
}