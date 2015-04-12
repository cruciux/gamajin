
var React = require('react');

var Backend = React.createClass({
    getInitialState: function() {
        return {
            data: {
                frame: 0,
                units: []
            }
        };
    },
    componentDidMount: function() {
        var self = this;
        var connection = new WebSocket('ws://localhost:9001');
        connection.onmessage = function (e) {
            var data = JSON.parse(e.data);
            self.setState({
                data: data
            });
        }; 
    },
    render: function() {

        var frameStart = this.state.data.frame - 10;
        var frameEnd = this.state.data.frame + 2;
        var bars = [];

        for (var i=frameEnd; i>frameStart; i--) {
            bars.push(
                <div key={i} className="unit-frame">
                    {i}
                </div>
            )
        }

        return (
            <div>
                <div>Frame: {this.state.data.frame}</div>
                <div>Players connected: {this.state.data.units.length}</div>

                <div className="units" style={{overflow:'hidden'}}>

                    <div className="frame-legend">
                        <div>Frame</div>
                        {bars}
                    </div>

                    {this.state.data.units.map(function(unit) {
                        return (
                            <Unit key={unit.id} frameStart={frameStart} frameEnd={frameEnd} unit={unit} />
                        )
                    })}
                </div>

            </div>
        );
    }
});

var Unit = React.createClass({
    render: function() {

        var blocks = [];
        for (var i=this.props.frameEnd; i>this.props.frameStart; i--) {


            if (this.props.unit.inputs[i] === undefined) {
                blocks.push(
                    <div key={i} className="unit-frame"></div>
                )
            } else {

                var input = this.props.unit.inputs[i];
                var state = this.props.unit.states[i];

                var styles = {};

                if (!input.estimate) {
                    styles.backgroundColor = '#009900';
                }

                blocks.push(
                    <div key={i} className="unit-frame" style={styles}>
                        Input=({input.horizontal},{input.vertical}) Pos=({state.x},{state.y})
                    </div>
                )
            }

            
        }

        return (
            <div className="unit">
                <div>Player {this.props.unit.id}</div>
                {blocks}
            </div>
        );
    }
});

// Hook onto the backend element in the DOM
React.render(
    <Backend />,
    document.getElementById('backend')
);
