export function create_init_dom() {
    var table = document.getElementById('table1');
    //table.insertAdjacentHTML('beforeend', '<tr>');
    table.insertAdjacentHTML("beforeend", "<tr>")
    let inset = ""
    for (let i = 1; i < 7; i++) {
        /*
        <td>
                <div>
                    <select id=view_element_1></select><br>
                    <input type = number id="view_max_1" value=330 style="width:80px;">
                    <input type = number id="view_min_1" value=263 style="width:80px;">
                    <input type="button" id="send_view1" value="change">
                </div>
                <div class="v" id="viewer11"></div>
            </td>
        */

        const element = "<select id=\"view_element_" + i + "\"></select><br>"
        const max = "<input type = number id=\"view_max_" + i + "\" value=330 style=\"width:80px;\">"
        const min = "<input type = number id=\"view_min_" + i + "\" value=263 style=\"width:80px;\">"
        const change_button = "<input type=button id=\"send_view" + i + "\" value=\"change\">"
        const viewer = "<div class=\"v\" id=\"viewer" + (Math.floor(i / 4) + 1) + ((i-1) % 3+1) + "\"></div>"



        let row_val = "<td><div>" +
            element + max + min +
            change_button + "</div>" +
            viewer + "</td>"

        if (i == 4) {
            row_val = "</tr><tr>" + row_val
        }
        console.log(row_val)
        inset = inset + row_val   
    }
    table.insertAdjacentHTML("beforeend", inset)
    table.insertAdjacentHTML("beforeend", "</tr>")
}