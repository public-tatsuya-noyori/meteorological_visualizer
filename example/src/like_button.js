import { setViewer } from "./js/setviewer.js";
import { constance } from "./js/const.js";

const e = React.createElement;

function create_option(input_data) {
    var list = []
    const data = input_data
    for (var i in input_data) {
        list.push(<option>{data[i]}</option>);
    }

    return list
}

class LikeButton extends React.Component {
    constructor(props) {
        super(props);
        this.state = { liked: false };
        this.input_year_data = [2020, 2019, 2018]
        this.input_monthday_data = [1124, 1123, 1126]
        this.input_hourminute_data = [1200, 1300, 1400]
    }





    render() {

        const year_list = create_option(this.input_year_data)
        const month_list = create_option(this.input_monthday_data)
        const hour_list = create_option(this.input_hourminute_data)


        return (
            <div>
                <div>
                    <select id="year">
                        {year_list}
                    </select>
                    <select id="monthday">
                        {month_list}
                    </select>
                    <select id="hourminute">
                        {hour_list}
                    </select>
                </div>

                <div className="v" id="viewer11"></div>
                <div className="v" id="viewer12"></div>
                <div className="v" id="viewer13"></div>
                <br></br>
                <div className="v" id="viewer21"></div>
                <div className="v" id="viewer22"></div>
                <div className="v" id="viewer23"></div>

                <div style={{visibility:"hidden"}} id="controleViewer"></div>
                <div style={{visibility:"hidden"}} id="c"></div>

            </div>
        );
    }
}

const domContainer = document.querySelector('#like_button_container');
ReactDOM.render(e(LikeButton), domContainer);

const _com = new constance()


const region = _com.region
const endpoint = _com.endpoint
const viewerIdArray = _com.viewerIdArray
AWS.config.region = region;
const s3 = new AWS.S3({ apiVersion: "2014-10-01", endpoint: new AWS.Endpoint(endpoint) });
const _propertyArray = _com.aipPropertyArray
let imageryLayers = new Cesium.ImageryLayerCollection();

const Dom_param_dic = { year: 2020, monthday: 1120, hourminute: 1200 }
Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI4ODliN2Q1NS1hYTkwLTQxYWQtOTVjMy01NzFlMGRkZThhYmEiLCJpZCI6Mzc1MjUsImlhdCI6MTYwNTE2MjMxNn0.NJ33oqQu8VeX6Yh55y4TiOCtFe5Cxfk6UbddVUorHWo';

let viewerArray = []
viewerIdArray.forEach(viewerId => {
    console.log(viewerId)
    let viewer = new Cesium.Viewer(viewerId)
    viewerArray.push(viewer);
})

imageryLayers = viewerArray[0].imageryLayers

setViewer(imageryLayers, viewerArray, Dom_param_dic, _propertyArray, 0)