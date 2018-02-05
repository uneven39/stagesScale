
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
            this._$legend = this._$pluginContainer.find('.legend');

            this._$pluginContainer.find('.legend').css('height', this.settings.legendHeight);

            this.redraw();
            this.drawRuler();
            this.initLegend();

            this.bind();
            this.zoom('-');
            this.refreshEventsLegend();
            this.redrawLegendCols();

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

        groupEvents: function(zoomToLevel, zoomFromLevel){
            var plugin = this,
                $ruler = plugin._$ruler,
                settings = plugin.settings,
                isZoomIn = zoomToLevel > zoomFromLevel;

            if (isZoomIn) {
                switch (zoomToLevel) {
                    case 1:
                        // group by 60 min
                        this.ungroupEvents();
                        for (var hour = plugin.settings.start; hour < plugin.settings.finish; hour++) {
                            var $group = plugin._$events
                                .children(':not(.hidden)')
                                .filter(function (index, event) {
                                    var date = new Date($(event).data('date'));
                                    return (date.getHours() === hour);
                                });

                            if ($group.length > 1) {
                                console.log('=========================');
                                console.log('group on zoom ', zoomToLevel);
                                console.log($group);

                                var step = $ruler.width() / (settings.finish - settings.start),
                                    $wrapper = $('<div class="group-by hour"></div>'),
                                    offset = ((step * (hour - settings.start) + step / 2) / $ruler.width()) * 100;
                                $wrapper
                                    .css('left', offset + '%')
                                    .attr('data-count', $group.length);
                                $group.wrapAll($wrapper);
                            }
                        }

                        break;
                    case 2:
                        // group by 30 min
                        var $groupsHour = plugin._$events.find('.group-by.hour');
                        console.log($groupsHour);
                        $groupsHour.each(function (index, group) {
                            var $group = $(group).children();
                            $group.unwrap('.group-by');
                            groupByRange(30, $group);
                        });

                        break;
                    case 3:
                        // group by 15 min
                        var $groups30min = plugin._$events.find('.group-by.30min');
                        console.log($groups30min);
                        $groups30min.each(function (index, group) {
                            var $group = $(group).children();
                            $group.unwrap('.group-by');
                            groupByRange(15, $group);
                        });
                        break;
                    case 4:
                        // group by 5 min
                        var $groups15min = plugin._$events.find('.group-by.15min');
                        console.log($groups15min);
                        $groups15min.each(function (index, group) {
                            var $group = $(group).children();
                            $group.unwrap('.group-by');
                            groupByRange(5, $group);
                        });
                        break;
                    case 5:
                        // group by 1 min
                        plugin._$events.find('.group-by').each(function (index, group) {
                            var $group = $(group),
                                $items = $group.children();
                            $group.children().unwrap('.group-by');
                            groupByRange(1, $items);
                        });
                        break;
                }
            } else {
                this.ungroupEvents();
                for (var hour = plugin.settings.start; hour < plugin.settings.finish; hour++) {
                    var $group = plugin._$events
                        .children(':not(.hidden)')
                        .filter(function (index, event) {
                            var date = new Date($(event).data('date'));
                            return (date.getHours() === hour);
                        });

                    if ($group.length > 1) {
                        switch (zoomToLevel) {
                            case 1:
                                var step = $ruler.width() / (settings.finish - settings.start),
                                    $wrapper = $('<div class="group-by hour"></div>'),
                                    offset = ((step * (hour - settings.start) + step / 2) / $ruler.width()) * 100;
                                $wrapper
                                    .css('left', offset + '%')
                                    .attr('data-count', $group.length);
                                $group.wrapAll($wrapper);
                                break;
                            case 2:
                                groupByRange(30, $group);
                                break;
                            case 3:
                                groupByRange(15, $group);
                                break;
                            case 4:
                                groupByRange(5, $group);
                                break;
                            case 5:
                            case 6:
                            case 7:
                            case 8:
                            case 9:
                            case 10:
                                groupByRange(1, $group);
                                break;
                        }

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

                    if ((curEventDate.getMinutes() >= firstEventDate.getMinutes() + range) || i === (count - 1)) {
                        var leftOffsetFirst = $($group[firstEventIdx]).css('left'),
                            leftOffsetLast = $($group[i-1]).css('left');

                        leftOffsetFirst = +leftOffsetFirst.substring(0, leftOffsetFirst.length - 2);
                        leftOffsetLast = +leftOffsetLast.substring(0, leftOffsetLast.length - 2);

                        // Значение смещения иконки группы в процентах от общей длины шкалы
                        offset = 100 * ((leftOffsetLast + leftOffsetFirst) / 2) / $ruler.width();
                        var $wrapper = $('<div class="group-by ' + range + 'min' + '"></div>');
                        $wrapper
                            .css('left', offset + '%');
                        if ((i === (count - 1)) && (curEventDate.getMinutes() < firstEventDate.getMinutes() + range)) {
                            $wrapper.attr('data-count', count - firstEventIdx);
                            $group.slice(firstEventIdx, i + 1).wrapAll($wrapper);
                        } else if (i - firstEventIdx > 1) {
                            $wrapper.attr('data-count', i - firstEventIdx);
                            $group.slice(firstEventIdx, i).wrapAll($wrapper);
                        }
                        firstEventIdx = i;
                    }
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

            if (this.settings.start === 'auto') {
                this.settings.start = startHour;
            }
            if (this.settings.finish === 'auto') {
                this.settings.finish = finishHour;
            }

            minDateLimit.setHours(this.settings.start, 0, 0, 0);
            maxDateLimit.setHours(this.settings.finish, 0, 0, 0);

            this._totalDuration = finishEvents.getTime() - startEvents.getTime();

            this._$events.children().each(function(index, item) {
                var $item = $(item),
                    date = new Date($item.data('date')).getTime(),
                    isInRange = (date >= minDateLimit.getTime()) && (date <= maxDateLimit.getTime()),
                    rangeLength = maxDateLimit.getTime() - minDateLimit.getTime(),
                    position;

                if (isInRange) {
                    position = ((rangeLength - (maxDateLimit.getTime() - date)) / rangeLength)*100 + '%';
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

        redrawLegendCols: function() {
            var totalHeight = 0,
                listHeightLimit,
                listHeight = 0,
                start = 0,
                end = 0,
                cols = 0,
                $legend = this._$pluginContainer.find('.legend'),
                $eventsInView,
                $cols;

            // Убираем группировку по колонкам
            $legend.find('.col-3').each(function (index, col) {
                $(col).children().unwrap('.col-3');
            });

            $eventsInView = $legend.children('.in-view');
            $eventsInView.each(function (index, event) {
                totalHeight += $(event).height();
            });

            listHeightLimit = totalHeight / 3;

            for (var i = 0; i < $eventsInView.length; i ++) {
                var itemHeight = $($eventsInView[i]).height();
                listHeight += itemHeight;
                if (listHeight >= listHeightLimit) {
                    end = (listHeight === listHeightLimit) ? (i + 1) : i;
                    if ($eventsInView.length > 3) {
                        if (($eventsInView.length % 3 === 2) && (cols === 1)) {
                            end += 1;
                        } else if  (($eventsInView.length % 3 > 0) && (cols === 0)) {
                            end += 1;
                        }
                    }
                    $eventsInView.slice(start, end).wrapAll('<div class="col-3"></div>');
                    start = end;
                    listHeight = 0;
                    cols += 1;
                }
                if (cols === 2) break;
            }
            if (cols < 3)
                $eventsInView.slice(start, $eventsInView.length).wrapAll('<div class="col-3"></div>');

        },

        zoom: function(zoomType) {
            var $timeLine = this._$timeLine,
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
                    this.groupEvents(newZoomLevel, curZoomLevel);
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
                                plugin.groupEvents(newZoomLevel, curZoomLevel);
                            }
                            $timeLine.trigger('zoom');
                        }
                    });
        },

        initLegend: function () {
            var $legend = this._$pluginContainer.find('.legend'),
                $legendContent = $('<div></div>');
            this._$events.children().each(function(index, el) {
                var $eventData = $('<div class="legend-item" data-date="' + $(el).data('date') + '"></div>'),
                    date = new Date($(el).data('date')),
                    dateStr = date.getHours() + ':' + ('0' + date.getMinutes()).slice(-2) + ':' +
                        ('0' + date.getSeconds()).slice(-2) + ' ' + ('0' + date.getDate()).slice(-2) +
                        '.' + ('0' + (date.getMonth() + 1)).slice(-2) + '.' + date.getFullYear();

                $eventData.append('<div class="header icon-' + $(el).data('icon') + '">' +
                    dateStr + '<h4>' + $(el).data('title') + '</h4>' +
                    '</div>' +
                    '<div class="description">' + $(el).data('text') + '</div>');
                $legendContent.append($eventData);
            });
            $legend.html($legendContent.html());
        },

        refreshEventsLegend: function () {
            var $timeLine = this._$timeLine,
                $events = this._$events,
                $legend = this._$legend,
                leftLimit = $timeLine.offset().left,
                rightLimit = $timeLine.offset().left + $timeLine.width() + (+$timeLine.css('padding-right').slice(0, -2) * 2);

            $legend.find('.legend-item.in-view').each(function(index, item) {
                $(item).removeClass('in-view');
            });

            $events.children().each(function(index, el) {
                var leftBorder = $(el).offset().left;

                // Checking if event item or group is in time-line viewport:
                if ((leftBorder >= leftLimit) && (leftBorder <= rightLimit)) {
                    // Check if group or single event
                    if ($(el).hasClass('group-by')) {
                        // group:
                        $(el).children().each(function(index, item) {
                            var $item = $(item),
                                eventDate = $item.data('date');

                            $legend.find('.legend-item[data-date="' + eventDate + '"]').addClass('in-view');
                        });
                    } else if ($(el).hasClass('events-item')) {
                        // single:
                        var $item = $(el),
                            eventDate = $item.data('date');

                        $legend.find('[data-date="' + eventDate + '"]').addClass('in-view');
                    }
                }

            });
        },

        bind: function() {
            console.log(this._$pluginContainer);
            var plugin = this,
                $pluginContainer = this._$pluginContainer,
                $timeLine = this._$timeLine,
                $controls = this._$controls,
                $ruler = this._$ruler;

            $timeLine
                .on('scroll zoom', function() {
                    if (!$timeLine.is(':animated')) {
                        clearTimeout($.data(this, 'scrollTimer'));
                        $.data(this, 'scrollTimer', setTimeout(function() {
                            plugin.refreshEventsLegend();
                            plugin.redrawLegendCols();
                        }, 100));
                    }
                });

            $controls
                .on('click', '.zoom-in', function () {
                    var $btn = $(this);
                    plugin.zoom('+');
                    if (plugin._zoomLevel === 10) {
                        $btn.attr('disabled', true);
                    } else {
                        $btn.attr('disabled', false);
                    }
                    plugin._$controls.find('.zoom-out').attr('disabled', false);
                })
                .on('click', '.zoom-out', function () {
                    plugin.zoom('-');
                    if (plugin._zoomLevel === 1)
                        $(this).attr('disabled', true);
                    else
                        $(this).attr('disabled', false);
                    plugin._$controls.find('.zoom-in').attr('disabled', false);
                })
                .on('click', '.scroll-right', function () {
                    var step = $ruler.width() / 24,
                        curScroll = $timeLine.scrollLeft();
                    $timeLine.animate({scrollLeft: Math.ceil(curScroll / step) * step + step},
                        {duration: 300, done: function() {
                                $timeLine.trigger('scroll');
                        }});
                })
                .on('click', '.scroll-left', function () {
                    var step = $ruler.width() / 24,
                        curScroll = $timeLine.scrollLeft();
                    $timeLine.animate({scrollLeft: Math.ceil(curScroll / step) * step - step},
                        {duration: 300, done: function() {
                                $timeLine.trigger('scroll');
                            }});
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