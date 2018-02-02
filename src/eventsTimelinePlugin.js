
;( function( $, window, document, undefined ) {

    "use strict";

    var pluginName = "eventsTimeLine",
        seed = 0,
        defaults = {
            'start': 0,
            'finish': 24,
            'legendHeight': 'auto',
            'zoomLevel' : 1
        },
        ruler24Labels = [
            '01:00',
            '02:00',
            '03:00',
            '04:00',
            '05:00',
            '06:00',
            '07:00',
            '08:00',
            '09:00',
            '10:00',
            '11:00',
            '12:00',
            '13:00',
            '14:00',
            '15:00',
            '16:00',
            '17:00',
            '18:00',
            '19:00',
            '20:00',
            '21:00',
            '22:00',
            '23:00',
            '24:00'
        ],
        dayLength = 86400000, // day duration in ms
        timeShift = (new Date).getTimezoneOffset() * 60 * 1000; // TimeZone offset in ms

    // plugin constructor
    function Plugin (element, dataArray, options) {
        var self = this;

        this.element = element;
        this.args = arguments;

        console.log(this.args);

        this._$pluginContainer = $(element);

        this._totalDuration = 0;

        this.timeShift = timeShift;
        this.settings = defaults;
        this._name = pluginName;

        this.init();
    }

    $.extend( Plugin.prototype, {
        init: function() {
            var eventsList = [],
                eventsHtml;
            seed += 1;

            if (this.args[1] && this.args[2]) {
                // data & options:
                if ( Array.isArray(this.args[1]) && (this.args[2] === Object(this.args[2])) ) {
                    // correct types
                    console.log('right way');
                    this.settings = $.extend( {}, this.settings, this.args[2] );
                    // sort data array by date
                    eventsList = this.args[1].sort(function(itemA, itemB) {
                        var dateA = new Date(itemA.date),
                            dateB = new Date(itemB.date);
                        return (dateA.getTime() - dateB.getTime());
                    });

                    console.log('sorted data array: ', eventsList);

                    eventsHtml = '';
                    for (var i = 0; i < eventsList.length; i++) {

                        eventsHtml += '<div data-date="' + eventsList[i].date + '" data-type="' + eventsList[i].type +
                            '" data-icon="' + eventsList[i].icon + '" data-title="' + eventsList[i].title +
                            '" data-text="' + eventsList[i].text + '" class="events-item">' + eventsList[i].text +
                            '</div> ';
                    }
                    this._$pluginContainer.html(eventsHtml);

                } else {
                    // invalid types
                    return;
                }
            } else if ((this.args[1] === Object(this.args[1])) && !Array.isArray(this.args[1])) {
                // options only
                console.log('options only');
                this.settings = $.extend( {}, this.settings, this.args[1] );
            } else if (Array.isArray(this.args[1])) {
                // data array only
                eventsList = this.args[1].sort(function(itemA,itemB) {
                    var dateA = new Date(itemA.date),
                        dateB = new Date(itemB.date);
                    return (dateA.getTime() - dateB.getTime());
                });
                eventsHtml = '';
                for (var k = 0; k < eventsList.length; k++) {
                    eventsHtml += '<div data-date="' + eventsList[k].date + '" data-type="' + eventsList[k].type +
                        '" data-icon="' + eventsList[k].icon + '" data-title="' + eventsList[k].title +
                        '" data-text="' + eventsList[k].text + '" class="events-item">' + eventsList[k].text +
                        '</div> ';
                }
                this._$pluginContainer.html(eventsHtml);
            }

            // Сортируем коллекцию событий по датам, получаем массив событий
            if (!eventsList.length) {
                this.sortEventNodes(this._$pluginContainer);
                eventsList = this.getEventsListFromContainer(this._$pluginContainer);
            }
            console.log(eventsList);
            this._firstEventDate = eventsList[0].date;
            this._lastEventDate = eventsList[eventsList.length - 1].date;
            this._totalDuration = this._lastEventDate - this._firstEventDate;
            this._zoomLevel = 1;

            console.log(this);

            this._$pluginContainer
                .addClass('time-line-plugin')
                .attr('id', 'time-line-plugin-' + seed)
                .children()
                .wrapAll('<div class="time-line"><div class="events"></div></div>');

            this._$pluginContainer
                .prepend('<div class="controls">' +
                    '<button type="button" class="control scroll-left"> < </button><button type="button" class="control scroll-right"> > </button>' +
                    '<button type="button" class="control zoom-in"> + </button><button type="button" class="control zoom-out"> - </button>' +
                    '</div>')
                .append('<div class="legend"></div>');

            this._$timeLine = this._$pluginContainer.find('.time-line');
            this._$timeLine.append('<div class="ruler"></div>');
            this._$events = this._$timeLine.find('.events');
            this._$ruler = this._$timeLine.find('.ruler');
            this._$controls = this._$pluginContainer.find('.controls');

            this._$pluginContainer.find('.legend').css('height', this.settings.legendHeight);

            this.redraw();
            this.drawRuler();

            this.bind();
            this.zoom('-', this._$timeLine);


        },
            sortEventNodes: function($container) {
                var $sortedData = $container.find('[data-type][data-date]').sort(function (itemA, itemB) {
                    var dateA = new Date($(itemA).data('date')).getTime(),
                        dateB = new Date($(itemB).data('date')).getTime();
                    return (dateA < dateB) ? -1 : (dateA > dateB) ? 1 : 0;
                });

                $container.html('').append($sortedData);

                return $container;
            },

            getEventsListFromContainer: function ($container) {
                var eventsList = [];
                console.log($container);

                $container.find('[data-type][data-date]').each(function(index, item) {
                    var event = {};

                    event.date = $(item).data('date');
                    event.type = $(item).data('type');
                    event.icon = $(item).data('icon');
                    event.title = $(item).data('title');
                    event.text = $(item).text();

                    eventsList.push(event);
                });

                return eventsList;
            },

            drawRuler: function() {
                var $ruler = this._$ruler;
                for (var i = this.settings.start; i < this.settings.finish; i++) {
                    var $rulerUnit = $('<div class="unit-hh" data-value="' + ruler24Labels[i] + '">' +
                        '<i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>' +
                        '</div>');
                    if (i === this.settings.start) {
                        var label = ('0' + i).slice(-2) + ':00';
                        $rulerUnit.attr('data-start-hour', '' + label);
                    }
                    $rulerUnit.css('width', 100 / (this.settings.finish - this.settings.start) + '%');
                    $ruler.append($rulerUnit);
                }
                this._$timeLine.append($ruler);
            },

        // TODO: make grouping by nearest events in diapason of X min
            groupEvents: function(period){
                var plugin = this,
                    $ruler = plugin._$ruler,
                    settings = plugin.settings;

                for (var h = plugin.settings.start; h < plugin.settings.finish; h++) {
                    var $group = plugin._$events
                            .children(':not(.hidden)')
                            .filter(function(index, event) {
                                var date = new Date($(event).data('date'));
                                return (date.getHours() === h);
                            });

                    if ($group.length > 1) {
                        var step = $ruler.width() / (settings.finish - settings.start),
                            $wrapper = $('<div class="group-by"></div>');
                        switch (period) {
                            case 1:
                                var offset = ((step * (h - settings.start) + step/2) / $ruler.width()) * 100;
                                $wrapper
                                    .addClass('hour')
                                    .css('left', offset + '%')
                                    .attr('data-count', $group.length);
                                $group.wrapAll($wrapper);
                                break;
                            case 2:
                                groupByRange(30, $group);

                                /*for (var m30 = 29; m30 <= 59; m30 = m30 + 30) {
                                    var $groupBy30m = $group.filter(function(index, event) {
                                        var date = new Date($(event).data('date')),
                                            mins = date.getMinutes();
                                        return ((mins >= (m30 - 29)) && (mins <= m30));
                                    });
                                    if ($groupBy30m.length > 1) {
                                        var offsetAdd30m = (m30 + 1 - 15) * step / 60,
                                            offset30m = ((step * (h - settings.start) + offsetAdd30m) / $ruler.width()) * 100;
                                        $wrapper
                                            .addClass('30min')
                                            .css('left', offset30m + '%')
                                            .attr('data-count', $groupBy30m.length);
                                            $groupBy30m.wrapAll($wrapper);
                                    }
                                }*/

                                break;
                            case 3:
                                // groupByRange(20, $group);
                                groupByRange(15, $group);
                                break;
                            case 4:
                                // groupByRange(15, $group);
                                groupByRange(5, $group);
                                break;
                            case 5:
                                // groupByRange(10, $group);
                                // break;
                            case 6:
                            case 7:
                                // groupByRange(5, $group);
                                // break;
                            case 8:
                            case 9:
                            case 10:
                                for (var m = 0; m <= 59; m++) {
                                    var $groupBy1m = $group.filter(function(index, event) {
                                        var date = new Date($(event).data('date')),
                                            mins = date.getMinutes();
                                        return (mins === m);
                                    });
                                    if ($groupBy1m.length > 1) {
                                        var offsetAdd1m = m * step / 60,
                                            offset1m = ((step * (h - settings.start) + offsetAdd1m) / $ruler.width()) * 100;
                                        $wrapper
                                            .addClass('1min')
                                            .css('left', offset1m + '%')
                                            .attr('data-count', $groupBy1m.length);
                                        $groupBy1m.wrapAll($wrapper);
                                    }
                                }
                                break;
                        }
                    }
                }

                function groupByRange(range, $group) {
                    var firstEventIdx = 0,
                        count = $group.length;

                    for (var i = 0; i < count; i++) {
                        var $item = $($group[i]),
                            curEventDate = new Date($item.data('date')),
                            firstEventDate = new Date($($group[firstEventIdx]).data('date'));

                        if ((curEventDate.getMinutes() > firstEventDate.getMinutes() + range) || i === (count - 1)) {
                            var leftOffsetFirst = $($group[firstEventIdx]).css('left'),
                                leftOffsetLast = $($group[i-1]).css('left');

                            leftOffsetFirst = +leftOffsetFirst.substring(0, leftOffsetFirst.length - 2);
                            leftOffsetLast = +leftOffsetLast.substring(0, leftOffsetLast.length - 2);

                            // Значение смещения иконки группы в процентах от общей длины шкалы
                            offset = 100 * ((leftOffsetLast + leftOffsetFirst) / 2) / $ruler.width();

                            $wrapper
                                .addClass(range + 'min')
                                .css('left', offset + '%');
                            if ((i === (count - 1)) && (curEventDate.getMinutes() <= firstEventDate.getMinutes() + range)) {
                                $wrapper.attr('data-count', count - firstEventIdx);
                                $group.slice(firstEventIdx, i + 1).wrapAll($wrapper);
                            } else if (i - firstEventIdx > 1) {
                                $wrapper.attr('data-count', i - firstEventIdx);
                                $group.slice(firstEventIdx, i).wrapAll($wrapper);
                            }
                            firstEventIdx = i;
                        }
                        console.log('firstEventIdx: ', firstEventIdx);
                    }
                }
            },

            ungroupEvents: function() {
                this._$events.find('.group-by').each(function(index, group) {
                    $(group).children().unwrap('.group-by');
                })
            },

            redraw: function () {
                var startEvents = new Date(this._firstEventDate),
                    finishEvents = new Date(this._lastEventDate),

                    startHour = startEvents.getHours(),
                    finishHour = finishEvents.getHours() === 23 ? 24 : finishEvents.getHours() + 1,

                    minDateLimit = new Date(this._firstEventDate),
                    maxDateLimit = new Date(this._firstEventDate);


                console.log('==============================');
                console.log('Draw events');
                console.log('==============================');

                console.log('first event date: ', startEvents);
                console.log('last event date: ', finishEvents);

                console.log('first event hour: ', startHour);
                console.log('last event last: ', finishHour);


                if (this.settings.start === 'auto') {
                    this.settings.start = startHour;
                }
                if (this.settings.finish === 'auto') {
                    this.settings.finish = finishHour;
                }

                console.log('settings hour limits: ', this.settings.start, this.settings.finish);

                minDateLimit.setHours(this.settings.start, 0, 0, 0);
                maxDateLimit.setHours(this.settings.finish, 0, 0, 0);

                console.log('min date limit: ', minDateLimit);
                console.log('max date limit: ', maxDateLimit);

                // this._totalDuration = maxDateLimit.getTime() - minDateLimit.getTime();
                this._totalDuration = finishEvents.getTime() - startEvents.getTime();

                console.log('total events duration: ', this._totalDuration);

                this._$events.children().each(function(index, item) {
                    var $item = $(item),
                        date = new Date($item.data('date')).getTime(),
                        isInRange = (date >= minDateLimit.getTime()) && (date <= maxDateLimit.getTime()),
                        rangeLength = maxDateLimit.getTime() - minDateLimit.getTime(),
                        position;

                    if (isInRange) {
                        position = ((rangeLength - (maxDateLimit.getTime() - date)) / rangeLength)*100 + '%';
                        // console.log('item position: ', $(item).data('date'), position);
                        $item
                            .attr('data-text', $item.text())
                            .text('')
                            .addClass('events-item')
                            .addClass('icon-' + $item.data('icon'))
                            .css('left', position);
                    } else {
                        $item.addClass('hidden');
                    }
                });

                console.log('==============================');
            },

            redrawLegend: function() {
                var totalHeight = 0,
                    listHeightLimit,
                    listHeight = 0,
                    start = 0,
                    cols = 0,
                    $legend = this._$pluginContainer.find('.legend'),
                    $events = $legend.children();

                $events.each(function (index, event) {
                    totalHeight += $(event).height();
                });

                listHeightLimit = totalHeight / 3;

                for (var i = 0; i < $events.length; i ++) {
                    listHeight += $($events[i]).height();
                    if (listHeight === listHeightLimit) {
                        $events.slice(start, i + 1).wrapAll('<div class="col-3"></div>');
                        start = i + 1;
                        listHeight = 0;
                        cols += 1;
                    } else if (listHeight > listHeightLimit) {
                        $events.slice(start, i).wrapAll('<div class="col-3"></div>');
                        start = i;
                        listHeight = 0;
                        cols += 1;
                    }
                    if (cols === 2) break;
                }
                if (cols < 3)
                    $events.slice(start, $events.length).wrapAll('<div class="col-3"></div>');
            },

            zoom: function(zoomType, $timeLineEl) {
                var $timeLine = $timeLineEl,
                    plugin = this,
                    newZoomLevel,
                    curZoomLevel = this._zoomLevel,
                    curScroll;

                switch (zoomType) {
                    case '+':
                        newZoomLevel = this._zoomLevel === 10 ? this._zoomLevel : this._zoomLevel + 1;
                        break;
                    case '-':
                        // Если уменьшаем масштаб, то сразу перегруппируем события
                        newZoomLevel = this._zoomLevel === 1 ? 1 : this._zoomLevel - 1;
                        this.ungroupEvents();
                        this.groupEvents(newZoomLevel);
                        break;
                    default:
                        newZoomLevel = this._zoomLevel;
                        break;
                }

                this._zoomLevel = newZoomLevel;

                curScroll = $timeLine.scrollLeft();

                $timeLine.animate({scrollLeft: Math.ceil((curScroll + $timeLine.width() / 2)*newZoomLevel/curZoomLevel - $timeLine.width()/2)}, 300);
                $timeLine.find('.ruler').animate({width: 100 * newZoomLevel + '%'}, 300);
                $timeLine.find('.events')
                    .animate({width: 100 * newZoomLevel + '%'},
                        {duration: 300,
                            done: function(){
                                // Если увеличиваем масштаб, то перегруппируем события после анимации
                                if (zoomType === '+') {
                                    console.log('zooming in');
                                    plugin.ungroupEvents();
                                    plugin.groupEvents(newZoomLevel);
                                }
                                $timeLine.trigger('zoom');
                            }
                        });
            },

            bind: function() {
                console.log(this._$pluginContainer);
                var plugin = this,
                    $pluginContainer = this._$pluginContainer,
                    $timeLine = this._$timeLine,
                    $controls = this._$controls,
                    $events = this._$events,
                    $ruler = this._$ruler;

                // TODO: optimize rendering
                $timeLine
                    .on('scroll zoom', function() {
                        var leftLimit = $timeLine.offset().left,
                            rightLimit = $timeLine.offset().left + $timeLine.width() + (+$timeLine.css('padding-right').slice(0, -2) * 2),
                            $legend = $pluginContainer.find('.legend'),
                            $legendContent = $('<div></div>');

                        $events.children().each(function(index, el) {
                            var leftBorder = $(el).offset().left;

                            // Checking if event item or group is in time-line viewport:
                            if ((leftBorder >= leftLimit) && (leftBorder <= rightLimit)) {
                                // Check if group or single event
                                if ($(el).hasClass('group-by')) {
                                    // group:
                                    $(el).children().each(function(index, item) {
                                        var $eventData = $('<div class="legend-item"></div>'),
                                            date = new Date($(item).data('date')),
                                            dateStr = date.getHours() + ':' + ('0' + date.getMinutes()).slice(-2) + ':' +
                                                ('0' + date.getSeconds()).slice(-2) + ' ' + ('0' + date.getDate()).slice(-2) +
                                                '.' + ('0' + (date.getMonth() + 1)).slice(-2) + '.' + date.getFullYear();

                                        $eventData.append('<div class="header icon-' + $(item).data('icon') + '">' +
                                            dateStr + '<h4>' + $(item).data('title') + '</h4>' +
                                            '</div>' +
                                            '<div class="description">' + $(item).data('text') + '</div>');
                                        $legendContent.append($eventData);
                                    });
                                } else if ($(el).hasClass('events-item')) {
                                    // single:
                                    var $eventData = $('<div class="legend-item"></div>'),
                                        date = new Date($(el).data('date')),
                                        dateStr = date.getHours() + ':' + ('0' + date.getMinutes()).slice(-2) + ':' +
                                            ('0' + date.getSeconds()).slice(-2) + ' ' + ('0' + date.getDate()).slice(-2) +
                                            '.' + ('0' + (date.getMonth() + 1)).slice(-2) + '.' + date.getFullYear();

                                    $eventData.append('<div class="header icon-' + $(el).data('icon') + '">' +
                                        dateStr + '<h4>' + $(el).data('title') + '</h4>' +
                                        '</div>' +
                                        '<div class="description">' + $(el).data('text') + '</div>');
                                    $legendContent.append($eventData);
                                }
                            }

                        });

                        $legend.html($legendContent.html());
                        plugin.redrawLegend();
                    });

                $controls
                    .on('click', '.zoom-in', function () {
                        plugin.zoom('+', plugin._$timeLine);
                        console.log('zoom in plugin: ', $pluginContainer);
                    })
                    .on('click', '.zoom-out', function () {
                        console.log('zoom out plugin: ', $pluginContainer);
                        plugin.zoom('-', plugin._$timeLine);
                    })
                    .on('click', '.scroll-right', function () {
                        var step = $ruler.width() / 24,
                            curScroll = $timeLine.scrollLeft();
                        $timeLine.animate({scrollLeft: Math.ceil(curScroll / step) * step + step}, 300);
                    })
                    .on('click', '.scroll-left', function () {
                        var step = $ruler.width() / 24,
                            curScroll = $timeLine.scrollLeft();
                        $timeLine.animate({scrollLeft: Math.ceil(curScroll / step) * step - step}, 300);
                    })
        }
    } );

    $.fn[ pluginName ] = function( dataArray, options ) {
        return this.each( function() {
            if ( !$.data( this, "plugin_" + pluginName ) ) {
                $.data( this, "plugin_" +
                    pluginName, new Plugin( this, dataArray, options ) );
            }
        } );
    };

} )( jQuery, window, document );