const COLOR_SCHEDULE = {
    'day': {
        back: '#f1f1f1',
        rain: '#000000'
    },
    'night': {
        back: '#001122',
        rain: '#ffffff'
    }
};

var dropAmount = 300;
var dropAmountRange = {
    min: 0,
    max: 600
};

var wind = 25;
var windRange = {
    min: 0,
    max: 50
};

var width = window.innerWidth,
    height = window.innerHeight;

var svg = d3.select('body')
    .append('svg')
    .attr('width', width)
    .attr('height', height);
var group = svg.append('g');
var rainColor = COLOR_SCHEDULE['night'].rain;
var autoToggleStatus = true;
var autoToggleTimer;
var progressMask = document.getElementById('progress-mask');

// init
init();

/**
 * @name init
 * @description initilization
 */
function init() {
    // set auto toggle
    autoToggle();

    setInterval(function() {
        var dropData = generateData();
        draw(dropData);
    }, 10);

    // init amount style
    setDragCtrlStyle('amount-ctrl', dropAmount, dropAmountRange);
    bindDragCtrlEvent('amount-ctrl', dropAmount, dropAmountRange, function(value) {
        dropAmount = value;
    });

    // init wind style
    setDragCtrlStyle('wind-ctrl', wind, windRange);
    bindDragCtrlEvent('wind-ctrl', wind, windRange, function(value) {
        wind = value;
    });
}

/**
 * @name setDragCtrlStyle
 * @description set drag controller style
 * @param { string} id id of drag controller
 * @param { number} current current value
 * @param { object} range
 */
function setDragCtrlStyle(id, current, range) {
    var dragCtrl = document.getElementById(id);
    var maxWidth = dragCtrl.parentNode.clientWidth;

    var targetLeft = current / (range.max - range.min) * maxWidth - dragCtrl.clientWidth / 2;
    dragCtrl.style.left = targetLeft + 'px';
}

/**
 * @name bindDragCtrlEvent
 * @description bind drag controller event
 * @param { string} id id of drag controller
 * @param { number} current current value
 * @param { object} range
 * @param { function} cb
 */
function bindDragCtrlEvent(id, current, range, cb) {
    var dragCtrl = document.getElementById(id);
    var maxWidth = dragCtrl.parentNode.clientWidth;
    var refLeft = dragCtrl.parentNode.offsetLeft;
    var moveToken = false;

    dragCtrl.addEventListener('mousedown', function(e) {
        moveToken = true;
        locationRecord = e.clientX;
    });

    dragCtrl.addEventListener('mousemove', function(e) {

        if (!moveToken) {
            return false;
        }

        var x = e.clientX;
        var delta = x - locationRecord;
        var _targetLeft = parseInt(dragCtrl.style.left) + delta;

        // call back change value
        cb((range.max - range.min) * (_targetLeft) / maxWidth);

        if (delta > 0 && locationRecord < maxWidth + 20) {
            // right
            dragCtrl.style.left = _targetLeft + 'px';
        } else if (delta < 0 && locationRecord > 20) {
            // left
            dragCtrl.style.left = _targetLeft + 'px';
        }
        locationRecord = locationRecord + delta;
    });

    dragCtrl.addEventListener('mouseup', function(e) {
        moveToken = false;
    });

    dragCtrl.addEventListener('mouseout', function(e) {
        moveToken = false;
    });
}

/**
 * @name autoToggle
 * @description auto toggle status
 */
function autoToggle() {
    if (autoToggleStatus) {
        toggleAction();
        startTimer();
    }
}

/**
 * @name changeToggleStatus
 * @description make auto toggler ON
 */
function changeToggleStatus() {
    autoToggleStatus = true;
    document.getElementById('toggler-status').innerHTML = 'ON';
    startTimer();
    progressMask.style.transition = 'width 10s';
    progressMask.style.width = (!progressMask.style.width || progressMask.style.width === '0px') ? '100%' : '0';
}

/**
 * @name toggleAction
 * @description toggle action
 */
function toggleAction() {
    progressMask.style.transition = 'width 10s';
    setTimeout(function() {
        progressMask.style.width = (!progressMask.style.width || progressMask.style.width === '0px') ? '100%' : '0';
        if (rainColor === COLOR_SCHEDULE['night'].rain) {
            setDayOrNight('day');
        } else {
            setDayOrNight('night');
        }
    }, 0);
}

/**
 * @name startTimer
 * @description start the timer
 */
function startTimer() {
    // init
    autoToggleTimer = setInterval(function() {
        toggleAction();
    }, 10000);
}

/**
 * @name manualToggle
 * @description toggle day or night manually
 * @param  {string} type day or night
 */
function manualToggle(type) {
    autoToggleStatus = false;
    document.getElementById('toggler-status').innerHTML = 'OFF';
    progressMask.style.transition = 'none';
    progressMask.style.width = '0';
    clearInterval(autoToggleTimer);
    setDayOrNight(type);
}

/**
 * @name setDayOrNight
 * @description Set whether day or night
 * @param {string} type
 */
function setDayOrNight(type) {
    document.body.style.background = COLOR_SCHEDULE[type].back;
    // autoToggleStatus && (progressMask.style.width = '100%');
    rainColor = COLOR_SCHEDULE[type].rain;
}

/**
 * @name generateData
 * @description Get data array
 * @return {array}
 */
function generateData() {
    var _dropData = [];
    var _wind = wind - (windRange.max - windRange.min) / 2;
    for (var i = 0; i < dropAmount; i++) {
        _dropData.push(generateOne());
    }

    function generateOne() {
        var randomDeltaX = Math.floor(Math.random() * 6) + _wind -3;  // [wind-3, wind+3]
        var randomDeltaY = 1 - (Math.floor(Math.random() * 100) % 20) / 100;

        var _long = dropLong(),
            _y1 = 0,
            _y2 = _y1 + _long;

        var _deltaX1 = randomDeltaX * height / _y2;

        var _x1 = xRange(width, _deltaX1),
            _x2 = _x1 + randomDeltaX;   // effect by wind

        var targetX1 = _x1 + _deltaX1,
            targetX2 = targetX1 + randomDeltaX,
            targetY2 = height * randomDeltaY,
            targetY1 = height * randomDeltaY - _long;

        return {
            origin: {
                x1: _x1,
                x2: _x2,
                y1: _y1,
                y2: _y2
            },
            target: {
                x1: targetX1,
                x2: targetX2,
                y1: targetY1,
                y2: targetY2
            }
        };
    }

    function xRange(w, delta) {
        return Math.floor(Math.random() * (w + 2 * Math.abs(delta))) - Math.abs(delta);
    }

    function dropLong() {
        return Math.floor(Math.random() * 30) + 30;
    }

    return _dropData;
}

/**
 * @name draw
 * @param  {array} data
 */
function draw(data) {
    var lines = group.selectAll('line')
        .data(data);

    lines.enter()
        .append('line')
        .attr('x1', function(d, i) {
            return d.origin.x1;
        })
        .attr('y1', function(d, i) {
            return d.origin.y1;
        })
        .attr('x2', function(d, i) {
            return d.origin.x2;
        })
        .attr('y2', function(d, i) {
            return d.origin.y2;
        })
        .style('stroke', rainColor)
        .style('stroke-width', '0.6')
        .transition()
        .duration(function(d, i) {
            return Math.random() * 200 + 300;
        })
        .ease('linear')
        .attr('x1', function(d, i) {
            return d.target.x1;
        })
        .attr('y1', function(d, i) {
            return d.target.y1;
        })
        .attr('x2', function(d, i) {
            return d.target.x2;
        })
        .attr('y2', function(d, i) {
            return d.target.y2;
        })
        .style('opacity', 0.3)
        .each('end', cb);

    function cb() {
        this.remove();
        dropTailer(this.__data__);
    }

    function dropTailer(d) {
        var cx = d.target.x2,
            cy = d.target.y2;

        var ellipse = group.append('ellipse')
            .attr('cx', cx)
            .attr('cy', cy)
            .style('stroke', rainColor)
            .style('stroke-width', 1)
            .style('fill', 'none');

        var linearRX = d3.scale.linear()
            .domain([0, 1])
            .range([0, 3]);

        var linearRY = d3.scale.linear()
            .domain([0, 1])
            .range([0, 1]);

        var aniEllipse = ellipse.transition()
            .duration(100)
            .attrTween('rx', function() {
                return function(t) {
                    return linearRX(t);
                };
            })
            .attrTween('ry', function() {
                return function(t) {
                    return linearRY(t);
                };
            })
            .each('end', function() {
                this.remove();
            });
    }
}