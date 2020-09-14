export function initDatetimeSelector(param,optionArray = []) {
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