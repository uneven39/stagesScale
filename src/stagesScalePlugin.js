(function( $ ) {
    "use strict";

    var $pluginContainer,
        $timeLine,
        $events,
        $ruler,
        $controls = $('<div class="controls">' +
            '<span class="control scroll-left"> < </span><span class="control scroll-right"> > </span>' +
            '<span class="control zoom-in"> + </span><span class="control zoom-out"> - </span>' +
            '</div>');

    var ruler24Labels = [
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
        zoomLevel = 1;

    var dayLength = 86400000, // day duration in ms
        timeShift = (new Date).getTimezoneOffset() * 60 * 1000, // TimeZone offset in ms
        stages,
        firstEventDate,
        lastEventDate,
        totalDuration = 0;

    var helpers = {
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

            $container.find('[data-type][data-date]').each(function(index, item) {
                var event = {},
                    utcDate = new Date($(item).data('date')).getTime();
                console.log((new Date($(item).data('date'))).getHours());

                event.date = utcDate + timeShift;
                event.type = $(item).data('type');
                event.icon = $(item).data('icon');
                event.title = $(item).data('title');
                event.text = $(item).text();
                event.$item = $(item);
                $(item).attr('data-timestamp', utcDate - timeShift);

                eventsList.push(event);
            });

            return eventsList;
        },

        drawRuler: function(zoomLevel) {
            switch (zoomLevel) {
                case '24h':
                    $ruler = $('<div class="ruler"></div>');
                    for (var i = 0; i < ruler24Labels.length; i++) {
                        var $rulerUnit = $('<div class="unit-hh" data-value="' + ruler24Labels[i] + '">' +
                          '<i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>' +
                          '</div>');
                        $ruler.append($rulerUnit);
                    }
                    $timeLine.append($ruler);
                    break;
            }
        },

        groupEvents: function(period){

            if (period > 0 && period < 5) {
                for (var h = 0; h < 24; h++) {
                    var $group = $events.children().filter(function(index, event) {
                        var date = new Date($(event).data('date'));
                        return (date.getHours() === h);
                    });
                    if ($group.length > 1) {
                        var step = $ruler.width() / 24,
                            $wrapper = $('<div class="group-by"></div>');
                        switch (period) {
                            case 1:
                                var offset = ((step * h + step/2) / $ruler.width()) * 100;
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
                                            offset30m = ((step * h + offsetAdd30m) / $ruler.width()) * 100;
                                        $wrapper
                                            .addClass('30min')
                                            .css('left', offset30m + '%')
                                            .attr('data-count', $groupBy30m.length);
                                        $groupBy30m.wrapAll($wrapper);
                                    }
                                }
                                break;
                            case 3:
                                for (var m15 = 14; m15 <= 59; m15 = m15 + 15) {
                                    var $groupBy15m = $group.filter(function(index, event) {
                                        var date = new Date($(event).data('date')),
                                            mins = date.getMinutes();
                                        return ((mins >= (m15 - 14)) && (mins <= m15));
                                    });
                                    if ($groupBy15m.length > 1) {
                                        var offsetAdd15m = (m15 + 1 - 7.5) * step / 60,
                                            offset15m = ((step * h + offsetAdd15m) / $ruler.width()) * 100;
                                        $wrapper
                                            .addClass('15min')
                                            .css('left', offset15m + '%')
                                            .attr('data-count', $groupBy15m.length);
                                        $groupBy15m.wrapAll($wrapper);
                                    }
                                }
                                break;
                            case 4:
                                for (var m5 = 4; m5 <= 59; m5 = m5 + 5) {
                                    var $groupBy5m = $group.filter(function(index, event) {
                                        var date = new Date($(event).data('date')),
                                            mins = date.getMinutes();
                                        return ((mins >= (m5 - 4)) && (mins <= m5));
                                    });
                                    if ($groupBy5m.length > 1) {
                                        var offsetAdd5m = (m5 + 1 - 3.75) * step / 60,
                                            offset5m = ((step * h + offsetAdd5m) / $ruler.width()) * 100;
                                        $wrapper
                                            .addClass('5min')
                                            .css('left', offset5m + '%')
                                            .attr('data-count', $groupBy5m.length);
                                        $groupBy5m.wrapAll($wrapper);
                                    }
                                }
                                break;
                        }
                    }
                }
            }

        },

        ungroupEvents: function() {
            console.log('ungroup');
            $events.find('.group-by').each(function(index, group) {
                $(group).children().unwrap('.group-by');
            })
        },

        redraw: function (minLimit, maxLimit, scale) {
            var startDay = new Date(minLimit),
                finishDay;

            // startDay.setUTCHours(0, 0, 0, 0);
            startDay = startDay.getTime() - timeShift;
            finishDay = startDay + dayLength;

            // console.log('current day range: ', startDay, finishDay);
            // console.log('current day range: ', (new Date(startDay)).toISOString(),(new Date(finishDay)).toISOString());
            console.log('durations: ', totalDuration, dayLength);

            if ((maxLimit - minLimit) <= dayLength) {
                maxLimit = finishDay;
                minLimit = startDay;
                totalDuration = dayLength;
            } else {
                maxLimit = lastEventDate;
                minLimit = firstEventDate;
            }

            $events.children().each(function(index, item) {
                var $item = $(item),
                    date = new Date($item.data('date')).getTime(),
                    isInRange = (date >= minLimit) && (date <= maxLimit),
                    position;

                if (isInRange) {
                    position = ((totalDuration - (maxLimit - date)) / totalDuration)*100 + '%';
                    $item
                        .addClass('events-item')
                        .css('left', position);
                } else {
                    $item.addClass('hidden');
                }
            });
        },

        bind: function() {
            $timeLine
                .on('scroll zoom', function() {
                    var leftLimit = $timeLine.offset().left,
                        rightLimit = $timeLine.offset().left + $timeLine.width() + (+$timeLine.css('padding-right').slice(0, -2) * 2),
                        $legend = $pluginContainer.find('.legend'),
                        $legendContent = $('<div></div>');

                    console.log('time-line scrolling');
                    console.log($timeLine.css('padding-right').slice(0, -2));
                    console.log('==========================');

                    $events.children().each(function(index, el) {
                        var leftBorder = $(el).offset().left;

                        // Checking if event item or group is in time-line viewport:
                        if ((leftBorder >= leftLimit) && (leftBorder <= rightLimit)) {
                            // Check if group or single event
                            if (el.classList.contains('group-by')) {
                                // group:
                                $(el).children().each(function(index, item) {
                                    console.log('event ' + item.dataset.title + ' in viewport');
                                    var $eventData = $('<div class="legend-item"></div>');
                                    $eventData.append('<h4>' + item.dataset.title + '</h4>' +
                                        '<div class="description">' + item.innerText + '</div>');
                                    $legendContent.append($eventData);
                                });
                            } else if (el.classList.contains('events-item')) {
                                // single:
                                console.log('event ' + el.dataset.title + ' in viewport');
                                var $eventData = $('<div class="legend-item"></div>');
                                $eventData.append('<h4>' + el.dataset.title + '</h4>' +
                                    '<div class="description">' + el.innerText + '</div>');
                                $legendContent.append($eventData);
                            }
                        }

                    });

                    $legend.html($legendContent.html());
                    console.log('==========================');
                });

            $controls
            // TODO: make scroll position constant on zooming
                .on('click', '.zoom-in', function () {
                    var newZoomLevel = zoomLevel === 8 ? zoomLevel : zoomLevel + 1,
                        step,
                        curScroll;

                    helpers.ungroupEvents();
                    helpers.groupEvents(newZoomLevel);

                    zoomLevel = newZoomLevel;

                    $timeLine.removeClass(function(i, className){
                        return (className.match (/\bzoom-\S+/g) || []).join(' ');
                    });
                    $timeLine.addClass('zoom-' + newZoomLevel);

                    step = $ruler.width() / 24;
                    curScroll = $timeLine.scrollLeft();
                    $timeLine
                        .scrollLeft(Math.ceil(curScroll / step) * step)
                        .trigger('zoom');
                })
                .on('click', '.zoom-out', function () {
                    var newZoomLevel = zoomLevel === 1 ? 1 : zoomLevel - 1,
                        step,
                        curScroll;

                    helpers.ungroupEvents();
                    helpers.groupEvents(newZoomLevel);

                    zoomLevel = newZoomLevel;

                    $timeLine.removeClass(function(i, className){
                        return (className.match (/\bzoom-\S+/g) || []).join(' ');
                    });
                    $timeLine.addClass('zoom-' + newZoomLevel);
                    step = $ruler.width() / 24;
                    curScroll = $timeLine.scrollLeft();
                    $timeLine
                        .scrollLeft(Math.ceil(curScroll / step) * step)
                        .trigger('zoom');
                })
                .on('click', '.scroll-right', function () {
                    var step = $ruler.width() / 24,
                        curScroll = $timeLine.scrollLeft();
                    $timeLine.scrollLeft(Math.ceil(curScroll / step) * step + step);
                })
                .on('click', '.scroll-left', function () {
                    var step = $ruler.width() / 24,
                        curScroll = $timeLine.scrollLeft();
                    $timeLine.scrollLeft(Math.ceil(curScroll / step) * step - step);
                })
        },

        printTest: function() {
            console.log('test');
        }
    };

    var methods = {
        init: function(events, options) {
            console.log('plugin started');
            console.log('args: ', arguments);

            var settings = $.extend( {}, options),
                eventsList;

            if ((typeof this === 'object') && this.jquery) {
                // Вызываем плагин как метод jQuery-элемента:
                $pluginContainer = this;

                // Сортируем коллекцию событий по датам, получаем массив событий
                helpers.sortEventNodes($pluginContainer);
                eventsList = helpers.getEventsListFromContainer($pluginContainer);
                firstEventDate = eventsList[0].date;
                lastEventDate = eventsList[eventsList.length - 1].date;
                totalDuration = lastEventDate - firstEventDate;

                console.log(eventsList);

                // Инициализируем DOM-элементы
                $pluginContainer
                    .children()
                    .wrapAll('<div class="time-line"><div class="events"></div></div>');
                $timeLine = $pluginContainer.find('.time-line');
                $events = $timeLine.find('.events');
                $pluginContainer
                    .prepend($controls)
                    .append($('<div class="legend"></div>'));

                helpers.redraw(firstEventDate, lastEventDate);
                helpers.drawRuler('24h');

                helpers.groupEvents(1);

                helpers.bind();

                $timeLine.trigger('scroll');

            } else if (typeof this === 'function') {
                // Вызываем плагин как глобальный метод jQuery:

            }

        },

        another: function() {
            helpers.printTest();
        }
    };

    $.stagesScale = methods.init;
    $.fn.stagesScale = function(method) {
        // логика вызова метода
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || ! method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Метод с именем ' +  method + ' не существует для jQuery.stagesScale');
        }
    };
})(jQuery);