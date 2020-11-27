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

function renderLoop(viewerArray) {
    for (var i = 0; i < viewerIdArray.length; i++) {
        viewerArray[i].resize();
        viewerArray[i].render();
        viewerArray[i].scene.requestRender();
    };
    window.setTimeout(renderLoop(viewerArray), 200);
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
            var type = event.target.id;
            console.log(event.target.value);
            var val = Number(event.target.value);
            if (type == "year") {
                _this.setState({ year: val });
            } else if (type == "monthday") {
                _this.setState({ monthday: val });
            } else {
                _this.setState({ hourminute: val });
            }
        };

        console.log(_this.props.param);
        _this.state = {
            year: _this.props.param["year"],
            monthday: _this.props.param["monthday"],
            hourminute: _this.props.param["hourminute"],
            viewerArray: [],
            imageryLayers: ""
        };
        _this.input_year_data = [2020, 2019, 2018];
        _this.input_monthday_data = [1124, 1123, 1126];
        _this.input_hourminute_data = [1200, 1300, 1400];

        _this.custom_render_loop = _this.custom_render_loop.bind(_this);
        _this.rend_flag = 0;

        return _this;
    }

    _createClass(LikeButton, [{
        key: "componentDidUpdate",
        value: function componentDidUpdate() {
            var initialLongitude = 140;
            var initialLatitude = 35;
            var initialHeight = 6500000;
            console.log(this.state.hourminute);
            console.log("Did update !");

            var Dom_param_dic = {
                year: this.state.year,
                monthday: this.state.monthday,
                hourminute: this.state.hourminute
            };
            console.log(Dom_param_dic);
            setViewer(this.state.imageryLayers, this.state.viewerArray, Dom_param_dic, _propertyArray, 0);

            for (var i = 0; i < viewerIdArray.length; i++) {
                this.state.viewerArray[i].scene.requestRender();
            };

            this.rend_flag = 0;
            this.custom_render_loop();
        }
    }, {
        key: "custom_render_loop",
        value: function custom_render_loop() {
            for (var i = 0; i < viewerIdArray.length; i++) {
                this.state.viewerArray[i].scene.requestRender();
            }

            if (this.rend_flag == 50) {
                return;
            } else {
                this.rend_flag = this.rend_flag + 1;
                window.requestAnimationFrame(this.custom_render_loop);
            }
        }
    }, {
        key: "componentDidMount",
        value: function componentDidMount() {
            console.log("didmount");
            var viewerArray = [];
            viewerIdArray.forEach(function (viewerId) {
                console.log(viewerId);
                var viewer = new Cesium.Viewer(viewerId, {
                    requestRenderMode: true,
                    maximumRenderTimeChange: 10,
                    useDefaultRenderLoop: true
                });
                viewerArray.push(viewer);
            });
            var imageryLayers = viewerArray[0].imageryLayers;
            this.setState({
                viewerArray: viewerArray,
                imageryLayers: imageryLayers
            });
        }
    }, {
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

var Dom_param_dic = { year: 2020, monthday: 1124, hourminute: 1200 };
var domContainer = document.getElementById('root');
var figure = React.createElement(LikeButton, { param: Dom_param_dic });
ReactDOM.render(figure, domContainer);