'use strict';

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
        );
    }
}

const domContainer = document.querySelector('#like_button_container');
ReactDOM.render(e(LikeButton), domContainer);