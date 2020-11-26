var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

import { setViewer } from "./js/setviewer.js";
import { constance } from "./js/const.js";
//import { init_datetime } from "./js/init_draw_and_view.js"

var e = React.createElement;

function create_option(input_data) {
    var list = [];
    var data = input_data;
    for (var i in input_data) {
        list.push(React.createElement(
            "option",
            null,
            data[i]
        ));
    }

    return list;
}

var _com = new constance();
var region = _com.region;
var endpoint = _com.endpoint;
var viewerIdArray = _com.viewerIdArray;
AWS.config.region = region;
var s3 = new AWS.S3({ apiVersion: "2014-10-01", endpoint: new AWS.Endpoint(endpoint) });
var _propertyArray = _com.aipPropertyArray;
var imageryLayers = new Cesium.ImageryLayerCollection();
Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI4ODliN2Q1NS1hYTkwLTQxYWQtOTVjMy01NzFlMGRkZThhYmEiLCJpZCI6Mzc1MjUsImlhdCI6MTYwNTE2MjMxNn0.NJ33oqQu8VeX6Yh55y4TiOCtFe5Cxfk6UbddVUorHWo';

var LikeButton = function (_React$Component) {
    _inherits(LikeButton, _React$Component);

    function LikeButton(props) {
        _classCallCheck(this, LikeButton);

        var _this = _possibleConstructorReturn(this, (LikeButton.__proto__ || Object.getPrototypeOf(LikeButton)).call(this, props));

        _this.handleChange = function (event) {
            var kind = eval(event.target.id);
            _this.setState({ kind: event.target.value });
            console.log(event.target.id);
            var Dom_param_dic = {
                year: _this.state.year,
                monthday: _this.state.monthday,
                hourminute: _this.state.hourminute
            };
            setViewer(imageryLayers, viewerArray, Dom_param_dic, _propertyArray, 0);
        };

        console.log(_this.props.param);
        _this.state = {
            year: _this.props.param["year"],
            monthday: _this.props.param["monthday"],
            hourminute: _this.props.param["hourminute"]
        };
        _this.input_year_data = [2020, 2019, 2018];
        _this.input_monthday_data = [1124, 1123, 1126];
        _this.input_hourminute_data = [1200, 1300, 1400];
        return _this;
    }

    _createClass(LikeButton, [{
        key: "render",
        value: function render() {

            var year_list = create_option(this.input_year_data);
            var month_list = create_option(this.input_monthday_data);
            var hour_list = create_option(this.input_hourminute_data);

            return React.createElement(
                "div",
                null,
                React.createElement(
                    "div",
                    null,
                    React.createElement(
                        "select",
                        { id: "year", value: this.state.year, onChange: this.handleChange },
                        year_list
                    ),
                    React.createElement(
                        "select",
                        { id: "monthday", value: this.state.monthday, onChange: this.handleChange },
                        month_list
                    ),
                    React.createElement(
                        "select",
                        { id: "hourminute", value: this.state.hourminute, onChange: this.handleChange },
                        hour_list
                    )
                ),
                React.createElement("div", { className: "v", id: "viewer11" }),
                React.createElement("div", { className: "v", id: "viewer12" }),
                React.createElement("div", { className: "v", id: "viewer13" }),
                React.createElement("br", null),
                React.createElement("div", { className: "v", id: "viewer21" }),
                React.createElement("div", { className: "v", id: "viewer22" }),
                React.createElement("div", { className: "v", id: "viewer23" }),
                React.createElement("div", { style: { visibility: "hidden" }, id: "controleViewer" }),
                React.createElement("div", { style: { visibility: "hidden" }, id: "c" })
            );
        }
    }]);

    return LikeButton;
}(React.Component);

//async function init() {
//const { Dom_param_dic, OptionDic } = await init_datetime(s3)


var Dom_param_dic = { year: 2020, monthday: 1124, hourminute: 1200 };

var domContainer = document.querySelector('#like_button_container');
var figure = React.createElement(LikeButton, { param: Dom_param_dic });
ReactDOM.render(figure, domContainer);

var viewerArray = [];
viewerIdArray.forEach(function (viewerId) {
    console.log(viewerId);
    var viewer = new Cesium.Viewer(viewerId);
    viewerArray.push(viewer);
});

imageryLayers = viewerArray[0].imageryLayers;
setViewer(imageryLayers, viewerArray, Dom_param_dic, _propertyArray, 0);