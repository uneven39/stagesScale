/*
 *  jquery-boilerplate - v4.0.0
 *  A jump-start for jQuery plugins development.
 *  http://jqueryboilerplate.com
 *
 *  Made by Zeno Rocha
 *  Under MIT License
 */
// the semi-colon before function invocation is a safety net against concatenated
// scripts and/or other plugins which may not be closed properly.
;( function( $, window, document, undefined ) {

    "use strict";

    // undefined is used here as the undefined global variable in ECMAScript 3 is
    // mutable (ie. it can be changed by someone else). undefined isn't really being
    // passed in so we can ensure the value of it is truly undefined. In ES5, undefined
    // can no longer be modified.

    // window and document are passed through as local variable rather than global
    // as this (slightly) quickens the resolution process and can be more efficiently
    // minified (especially when both are regularly referenced in your plugin).

    // Create the defaults once
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

    // The actual plugin constructor
    function Plugin (element, dataArray, options) {
        var self = this;

        this.element = element;
        this.args = arguments;

        this._$pluginContainer = $(element);

        this._$events;
        this._$ruler;
        this._$controls;

        this._firstEventDate;
        this._lastEventDate;
        this._totalDuration = 0;
        this._zoomLevel = 1;

        // jQuery has an extend method which merges the contents of two or
        // more objects, storing the result in the first object. The first object
        // is generally empty as we don't want to alter the default options for
        // future instances of the plugin
        this.settings = $.extend( {}, defaults, options );
        this._defaults = defaults;
        this._name = pluginName;

        this.init(self);
    }

    // Avoid Plugin.prototype conflicts
    $.extend( Plugin.prototype, {
        init: function(self) {
            seed += 1;
            this.helpers.plugin = self;

            // Сортируем коллекцию событий по датам, получаем массив событий
            this.helpers.sortEventNodes(this._$pluginContainer);
            var eventsList = this.helpers.getEventsListFromContainer(this._$pluginContainer);
            console.log(eventsList);
            this._firstEventDate = eventsList[0].date;
            this._lastEventDate = eventsList[eventsList.length - 1].date;
            this._totalDuration = this._lastEventDate - this._firstEventDate;

            console.log(eventsList);

            this._$pluginContainer
                .addClass('stages-scale')
                .children()
                .wrapAll('<div class="time-line"><div class="events"></div></div>');

            this._$pluginContainer
                .prepend('<div class="controls">' +
                    '<span class="control scroll-left"> < </span><span class="control scroll-right"> > </span>' +
                    '<span class="control zoom-in"> + </span><span class="control zoom-out"> - </span>' +
                    '</div>')
                .append('<div class="legend"></div>');

            this._$timeLine = this._$pluginContainer.find('.time-line');
            this._$timeLine.append('<div class="ruler"></div>');
            this._$events = this._$timeLine.find('.events');
            this._$ruler = this._$timeLine.find('.ruler');
            this._$controls = this._$pluginContainer.find('.controls');

            // Place initialization logic here
            // You already have access to the DOM element and
            // the options via the instance, e.g. this.element
            // and this.settings
            // you can add more functions like the one below and
            // call them like the example bellow
            this.testPrint( seed, this.args );

            this._$pluginContainer.find('.legend').css('height', this.settings.legendHeight);

            this.helpers.redraw();
            this.helpers.drawRuler();

            this.helpers.bind();
            this.helpers.zoom('-');


        },
        helpers: {
            plugin: this,

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
                    var event = {},
                        utcDate = new Date($(item).data('date')).getTime();
                    // console.log((new Date($(item).data('date'))).getHours());

                    event.date = utcDate + timeShift;
                    event.type = $(item).data('type');
                    event.icon = $(item).data('icon');
                    event.title = $(item).data('title');
                    event.text = $(item).text();

                    eventsList.push(event);
                });

                return eventsList;
            },

            drawRuler: function() {
                var $ruler = this.plugin._$ruler;
                for (var i = this.plugin.settings.start; i < this.plugin.settings.finish; i++) {
                    var $rulerUnit = $('<div class="unit-hh" data-value="' + ruler24Labels[i] + '">' +
                        '<i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>' +
                        '</div>');
                    if (i === this.plugin.settings.start) {
                        var label = ('0' + i).slice(-2) + ':00';
                        $rulerUnit.attr('data-start-hour', '' + label);
                    }
                    $rulerUnit.css('width', 100 / (this.plugin.settings.finish - this.plugin.settings.start) + '%');
                    $ruler.append($rulerUnit);
                }
                this.plugin._$timeLine.append($ruler);
            },

            groupEvents: function(period){
                var plugin = this.plugin,
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
                                for (var m30 = 29; m30 <= 59; m30 = m30 + 30) {
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
                                }
                                break;
                            case 3:
                                for (var m20 = 19; m20 <= 59; m20 = m20 + 20) {
                                    var $groupBy20m = $group.filter(function(index, event) {
                                        var date = new Date($(event).data('date')),
                                            mins = date.getMinutes();
                                        return ((mins >= (m20 - 19)) && (mins <= m20));
                                    });
                                    if ($groupBy20m.length > 1) {
                                        var offsetAdd20m = (m20 + 1 - 10) * step / 60,
                                            offset20m = ((step * (h - this.settings.start) + offsetAdd20m) / $ruler.width()) * 100;
                                        $wrapper
                                            .addClass('20min')
                                            .css('left', offset20m + '%')
                                            .attr('data-count', $groupBy20m.length);
                                        $groupBy20m.wrapAll($wrapper);
                                    }
                                }
                                break;
                            case 4:
                                for (var m15 = 14; m15 <= 59; m15 = m15 + 15) {
                                    var $groupBy15m = $group.filter(function(index, event) {
                                        var date = new Date($(event).data('date')),
                                            mins = date.getMinutes();
                                        return ((mins >= (m15 - 14)) && (mins <= m15));
                                    });
                                    if ($groupBy15m.length > 1) {
                                        var offsetAdd15m = (m15 + 1 - 7.5) * step / 60,
                                            offset15m = ((step * (h - this.settings.start) + offsetAdd15m) / $ruler.width()) * 100;
                                        $wrapper
                                            .addClass('15min')
                                            .css('left', offset15m + '%')
                                            .attr('data-count', $groupBy15m.length);
                                        $groupBy15m.wrapAll($wrapper);
                                    }
                                }
                                break;
                            case 5:
                                for (var m10 = 9; m10 <= 59; m10 = m10 + 10) {
                                    var $groupBy10m = $group.filter(function(index, event) {
                                        var date = new Date($(event).data('date')),
                                            mins = date.getMinutes();
                                        return ((mins >= (m10 - 9)) && (mins <= m10));
                                    });
                                    if ($groupBy10m.length > 1) {
                                        var offsetAdd10m = (m10 + 1 - 5) * step / 60,
                                            offset10m = ((step * (h - this.settings.start) + offsetAdd10m) / $ruler.width()) * 100;
                                        $wrapper
                                            .addClass('10min')
                                            .css('left', offset10m + '%')
                                            .attr('data-count', $groupBy10m.length);
                                        $groupBy10m.wrapAll($wrapper);
                                    }
                                }
                                break;
                            case 6:
                            case 7:
                                for (var m5 = 4; m5 <= 59; m5 = m5 + 5) {
                                    var $groupBy5m = $group.filter(function(index, event) {
                                        var date = new Date($(event).data('date')),
                                            mins = date.getMinutes();
                                        return ((mins >= (m5 - 4)) && (mins <= m5));
                                    });
                                    if ($groupBy5m.length > 1) {
                                        var offsetAdd5m = (m5 + 1 - 2.5) * step / 60,
                                            offset5m = ((step * (h - this.settings.start) + offsetAdd5m) / $ruler.width()) * 100;
                                        $wrapper
                                            .addClass('5min')
                                            .css('left', offset5m + '%')
                                            .attr('data-count', $groupBy5m.length);
                                        $groupBy5m.wrapAll($wrapper);
                                    }
                                }
                                break;
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
                                            offset1m = ((step * (h - this.settings.start) + offsetAdd1m) / $ruler.width()) * 100;
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

            },

            ungroupEvents: function() {
                console.log('ungroup');
                this.plugin._$events.find('.group-by').each(function(index, group) {
                    $(group).children().unwrap('.group-by');
                })
            },

            redraw: function () {
                var startEvents = new Date(this.plugin._firstEventDate),
                    finishEvents = new Date(this.plugin._lastEventDate),
                    dayDate = new Date(startEvents.getTime() - this.plugin.timeShift),
                    startDate = new Date(startEvents.getTime() - this.plugin.timeShift),
                    finishDate = new Date(finishEvents.getTime() - this.plugin.timeShift);

                console.log(this);

                if (this.plugin.settings.start === 'auto') {
                    this.plugin.settings.start = startDate.getHours();
                } else {
                    startDate.setHours(this.plugin.settings.start, 0, 0, 0);
                }

                if (this.plugin.settings.finish === 'auto') {
                    this.plugin.settings.finish = finishDate.getHours() === 23 ? 24 : finishDate.getHours() + 1;
                } else {
                    finishDate.setHours(this.plugin.settings.finish, 0, 0, 0);
                }

                console.log('limit events: ', startEvents, finishEvents, dayDate);
                console.log('start: ', dayDate.getDate(), startDate.getTime());
                console.log('finish: ', finishDate.getHours(), finishDate.getTime());

                this.plugin._totalDuration = finishDate.getTime() - startDate.getTime();

                console.log('durations: ', this.plugin._totalDuration, this.plugin.dayLength);

                this.plugin._$events.children().each(function(index, item) {
                    var $item = $(item),
                        date = new Date($item.data('date')).getTime(),
                        isInRange = (date >= startDate.getTime()) && (date <= finishDate.getTime()),
                        position;

                    if (isInRange) {
                        position = ((this._totalDuration - (finishDate.getTime() - date)) / this._totalDuration)*100 + '%';
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
            },

            redrawLegend: function() {
                var totalHeight = 0,
                    listHeightLimit,
                    listHeight = 0,
                    start = 0,
                    cols = 0,
                    $legend = this.plugin._$pluginContainer.find('.legend'),
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

            zoom: function(zoomType) {
                var newZoomLevel,
                    curZoomLevel = this.plugin._zoomLevel,
                    curScroll;

                switch (zoomType) {
                    case '+':
                        newZoomLevel = this.plugin._zoomLevel === 10 ? this.plugin._zoomLevel : this.plugin._zoomLevel + 1;
                        break;
                    case '-':
                        newZoomLevel = this.plugin._zoomLevel === 1 ? 1 : this.plugin._zoomLevel - 1;
                        break;
                    default:
                        newZoomLevel = this.plugin._zoomLevel;
                        break;
                }

                this.ungroupEvents();
                this.groupEvents(newZoomLevel);

                this.plugin._zoomLevel = newZoomLevel;

                console.log('zoom levels: ', curZoomLevel, newZoomLevel);

                curScroll = this.plugin._$timeLine.scrollLeft();

                console.log('start zoom');

                this.plugin._$timeLine
                    .trigger('zoom')
                    .animate({scrollLeft: (curScroll + this.plugin._$timeLine.width() / 2)*newZoomLevel/curZoomLevel - this.plugin._$timeLine.width()/2}, 300);
                this.plugin._$ruler.animate({width: 100 * newZoomLevel + '%'}, 300);
                this.plugin._$events.animate({width: 100 * newZoomLevel + '%'}, 300);

                console.log('end zoom');
            },

            bind: function() {
                console.log(this.plugin._$pluginContainer);
                var helpers = this,
                    $pluginContainer = this.plugin._$pluginContainer,
                    $timeLine = this.plugin._$timeLine,
                    $controls = this.plugin._$controls,
                    $events = this.plugin._$events,
                    $ruler = this.plugin._$ruler;

                $timeLine
                    .on('scroll zoom', function() {
                        var leftLimit = $timeLine.offset().left,
                            rightLimit = $timeLine.offset().left + $timeLine.width() + (+$timeLine.css('padding-right').slice(0, -2) * 2),
                            $legend = $pluginContainer.find('.legend'),
                            $legendContent = $('<div></div>');

                        // console.log('time-line scrolling');
                        // console.log($timeLine.css('padding-right').slice(0, -2));
                        // console.log('==========================');

                        $events.children().each(function(index, el) {
                            var leftBorder = $(el).offset().left;

                            // Checking if event item or group is in time-line viewport:
                            if ((leftBorder >= leftLimit) && (leftBorder <= rightLimit)) {
                                // Check if group or single event
                                if ($(el).hasClass('group-by')) {
                                    // group:
                                    $(el).children().each(function(index, item) {
                                        // console.log('event ' + item.dataset.title + ' in viewport');
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
                                    // console.log('event ' + el.dataset.title + ' in viewport');
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
                        helpers.redrawLegend();
                        // console.log('==========================');
                    });

                $controls
                    .on('click', '.zoom-in', function () {
                        // $pluginContainer = $(this).closest('.stages-scale');
                        // $timeLine = $pluginContainer.find('.time-line');
                        // $events = $pluginContainer.find('.events');
                        // $ruler = $pluginContainer.find('.ruler');

                        helpers.zoom('+');
                        console.log('zoom in plugin: ', $pluginContainer);
                    })
                    .on('click', '.zoom-out', function () {
                        // $pluginContainer = $(this).closest('.stages-scale');
                        // $timeLine = $pluginContainer.find('.time-line');
                        // $events = $pluginContainer.find('.events');
                        // $ruler = $pluginContainer.find('.ruler');

                        console.log('zoom out plugin: ', $pluginContainer);
                        helpers.zoom('-');
                    })
                    .on('click', '.scroll-right', function () {
                        // $pluginContainer = $(this).closest('.stages-scale');
                        // $timeLine = $pluginContainer.find('.time-line');
                        // $events = $pluginContainer.find('.events');
                        // $ruler = $pluginContainer.find('.ruler');

                        var step = $ruler.width() / 24,
                            curScroll = $timeLine.scrollLeft();
                        $timeLine.animate({scrollLeft: Math.ceil(curScroll / step) * step + step}, 300);
                    })
                    .on('click', '.scroll-left', function () {
                        // $pluginContainer = $(this).closest('.stages-scale');
                        // $timeLine = $pluginContainer.find('.time-line');
                        // $events = $pluginContainer.find('.events');
                        // $ruler = $pluginContainer.find('.ruler');

                        var step = $ruler.width() / 24,
                            curScroll = $timeLine.scrollLeft();
                        $timeLine.animate({scrollLeft: Math.ceil(curScroll / step) * step - step}, 300);
                    })
            }
        },
        testPrint: function(text, args ) {
            // some logic
            console.log(this);
            console.log(this.element);
            console.log(args);
        }
    } );

    // A really lightweight plugin wrapper around the constructor,
    // preventing against multiple instantiations
    $.fn[ pluginName ] = function( dataArray, options ) {
        return this.each( function() {
            if ( !$.data( this, "plugin_" + pluginName ) ) {
                $.data( this, "plugin_" +
                    pluginName, new Plugin( this, dataArray, options ) );
            }
        } );
    };

} )( jQuery, window, document );