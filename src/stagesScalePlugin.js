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

    var seed = 0,
        defaults = {'start': 0,
            'finish': 24,
            'legendHeight': 'auto',
            'zoomLevel' : 1
        },
        settings,
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
        zoomLevel = 1;

    var dayLength = 86400000, // day duration in ms
        timeShift = (new Date).getTimezoneOffset() * 60 * 1000, // TimeZone offset in ms
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
            $ruler = $('<div class="ruler"></div>');
            for (var i = settings.start; i < settings.finish; i++) {
                var $rulerUnit = $('<div class="unit-hh" data-value="' + ruler24Labels[i] + '">' +
                    '<i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>' +
                    '</div>');
                if (i === settings.start) {
                    var label = ('0' + i).slice(-2) + ':00';
                    $rulerUnit.attr('data-start-hour', '' + label);
                }
                $rulerUnit.css('width', 100 / (settings.finish - settings.start) + '%');
                $ruler.append($rulerUnit);
            }
            $timeLine.append($ruler);
        },

        groupEvents: function(period){


            for (var h = settings.start; h < settings.finish; h++) {
                var $group = $events.children(':not(.hidden)').filter(function(index, event) {
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
                                        offset20m = ((step * (h - settings.start) + offsetAdd20m) / $ruler.width()) * 100;
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
                                        offset15m = ((step * (h - settings.start) + offsetAdd15m) / $ruler.width()) * 100;
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
                                        offset10m = ((step * (h - settings.start) + offsetAdd10m) / $ruler.width()) * 100;
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
                                        offset5m = ((step * (h - settings.start) + offsetAdd5m) / $ruler.width()) * 100;
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
                                    var offsetAdd1m = (m + 1 - 0.5) * step / 60,
                                        offset1m = ((step * h + offsetAdd1m) / $ruler.width()) * 100;
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
            $events.find('.group-by').each(function(index, group) {
                $(group).children().unwrap('.group-by');
            })
        },

        redraw: function () {
            var startEvents = new Date(firstEventDate),
                finishEvents = new Date(lastEventDate),
                dayDate = new Date(startEvents.getTime() - timeShift),
                startDate = new Date(startEvents.getTime() - timeShift),
                finishDate = new Date(finishEvents.getTime() - timeShift);

            if (settings.start === 'auto') {
                settings.start = startDate.getHours();
            } else {
                startDate.setHours(settings.start, 0, 0, 0);
            }

            if (settings.finish === 'auto') {
                settings.finish = finishDate.getHours() === 23 ? 24 : finishDate.getHours() + 1;
            } else {
                finishDate.setHours(settings.finish, 0, 0, 0);
            }

            console.log('start: ', dayDate.getDate(), startDate.getTime());
            console.log('finish: ', finishDate.getHours(), finishDate.getTime());

            // startDay.setUTCHours(0, 0, 0, 0);
            totalDuration = finishDate.getTime() - startDate.getTime();

            // console.log('current day range: ', startDay, finishDay);
            // console.log('current day range: ', (new Date(startDay)).toISOString(),(new Date(finishDay)).toISOString());
            console.log('durations: ', totalDuration, dayLength);

            $events.children().each(function(index, item) {
                var $item = $(item),
                    date = new Date($item.data('date')).getTime(),
                    isInRange = (date >= startDate.getTime()) && (date <= finishDate.getTime()),
                    position;

                if (isInRange) {
                    position = ((totalDuration - (finishDate.getTime() - date)) / totalDuration)*100 + '%';
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
                $legend = $pluginContainer.find('.legend'),
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
                curZoomLevel = zoomLevel,
                curScroll;

            switch (zoomType) {
                case '+':
                    newZoomLevel = zoomLevel === 10 ? zoomLevel : zoomLevel + 1;
                    break;
                case '-':
                    newZoomLevel = zoomLevel === 1 ? 1 : zoomLevel - 1;
                    break;
                default:
                    newZoomLevel = zoomLevel;
                    break;
            }

            helpers.ungroupEvents();
            helpers.groupEvents(newZoomLevel);

            zoomLevel = newZoomLevel;

            console.log('zoom levels: ', curZoomLevel, newZoomLevel)

            $timeLine.removeClass(function(i, className){
                return (className.match (/\bzoom-\S+/g) || []).join(' ');
            });

            curScroll = $timeLine.scrollLeft();

            console.log('start zoom');

            $timeLine.animate({scrollLeft: (curScroll + $timeLine.width() / 2)*newZoomLevel/curZoomLevel - $timeLine.width()/2}, 300);
            $ruler.animate({width: 100 * newZoomLevel + '%'}, 300);
            $events.animate({width: 100 * newZoomLevel + '%'}, 300);

            console.log('end zoom');
        },

        bind: function() {
            console.log($pluginContainer);
            $('.time-line')
                .on('scroll zoom', function() {
                    $pluginContainer = $(this).closest('.stages-scale');
                    $timeLine = $pluginContainer.find('.time-line');
                    $events = $pluginContainer.find('.events');
                    $ruler = $pluginContainer.find('.ruler');

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
                                    var $eventData = $('<div class="legend-item"></div>');
                                    $eventData.append('<h4>' + $(item).data('title')+ '</h4>' +
                                        '<div class="description">' + $(item).data('text') + '</div>');
                                    $legendContent.append($eventData);
                                });
                            } else if ($(el).hasClass('events-item')) {
                                // single:
                                // console.log('event ' + el.dataset.title + ' in viewport');
                                var $eventData = $('<div class="legend-item"></div>');
                                $eventData.append('<h4>' + $(el).data('title') + '</h4>' +
                                    '<div class="description">' + $(el).data('text') + '</div>');
                                $legendContent.append($eventData);
                            }
                        }

                    });

                    $legend.html($legendContent.html());
                    helpers.redrawLegend();
                    // console.log('==========================');
                });

            $('.controls')
            // TODO: make smooth scrolling and zooming
                .on('click', '.zoom-in', function () {
                    $pluginContainer = $(this).closest('.stages-scale');
                    $timeLine = $pluginContainer.find('.time-line');
                    $events = $pluginContainer.find('.events');
                    $ruler = $pluginContainer.find('.ruler');

                    helpers.zoom('+');
                    console.log('zoom in plugin: ', $pluginContainer);
                })
                .on('click', '.zoom-out', function () {
                    $pluginContainer = $(this).closest('.stages-scale');
                    $timeLine = $pluginContainer.find('.time-line');
                    $events = $pluginContainer.find('.events');
                    $ruler = $pluginContainer.find('.ruler');

                    console.log('zoom out plugin: ', $pluginContainer);
                    helpers.zoom('-');
                })
                .on('click', '.scroll-right', function () {
                    $pluginContainer = $(this).closest('.stages-scale');
                    $timeLine = $pluginContainer.find('.time-line');
                    $events = $pluginContainer.find('.events');
                    $ruler = $pluginContainer.find('.ruler');

                    var step = $ruler.width() / 24,
                        curScroll = $timeLine.scrollLeft();
                    $timeLine.scrollLeft(Math.ceil(curScroll / step) * step + step);
                })
                .on('click', '.scroll-left', function () {
                    $pluginContainer = $(this).closest('.stages-scale');
                    $timeLine = $pluginContainer.find('.time-line');
                    $events = $pluginContainer.find('.events');
                    $ruler = $pluginContainer.find('.ruler');

                    var step = $ruler.width() / 24,
                        curScroll = $timeLine.scrollLeft();
                    $timeLine.scrollLeft(Math.ceil(curScroll / step) * step - step);
                })
        }
    };

    var methods = {
        init: function(events, options) {
            console.log('plugin started');
            console.log('args: ', arguments);

            var eventsList;

            if ((typeof this === 'object') && this.jquery) {
                // Вызываем плагин как метод jQuery-элемента:

                console.log('plugin seed: ', seed, settings, arguments[0]);
                if ((arguments[0] === Object(arguments[0])) && !Array.isArray(arguments[0])) {
                    settings = $.extend(defaults, arguments[0]);
                } else {
                    settings = defaults;
                }
                seed += 1;
                this
                    .addClass('stages-scale')
                    .attr('id', 'stages-scale-' + seed);
                $pluginContainer = $('#stages-scale-' + seed);

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
                $timeLine = $pluginContainer
                    .find('.time-line')
                    .addClass('zoom-1');
                $events = $timeLine.find('.events');
                $pluginContainer
                    .prepend($('<div class="controls">' +
                        '<span class="control scroll-left"> < </span><span class="control scroll-right"> > </span>' +
                        '<span class="control zoom-in"> + </span><span class="control zoom-out"> - </span>' +
                        '</div>'))
                    .append($('<div class="legend"></div>'));
                $controls = $pluginContainer.find('.controls');

                helpers.redraw();
                helpers.drawRuler();

                // helpers.groupEvents(1);

                helpers.bind();

                helpers.zoom('-');

                console.log($controls);

            } else if (typeof this === 'function') {
                // Вызываем плагин как глобальный метод jQuery:
                // проверяем, что на входе есть массив с данными
                if (Array.isArray(arguments[0])) {
                    seed += 1;
                    if ((arguments[1] === Object(arguments[1])) && !Array.isArray(arguments[1])) {
                        settings = $.extend(defaults, arguments[1]);
                        console.log('plugin seed: ', seed, settings, arguments[1]);
                    }
                    // Сортируем массив событий по датам
                    eventsList = arguments[0].sort(function(itemA,itemB) {
                        return (new Date(itemA.date)).getTime() - (new Date(itemB.date)).getTime();
                    });

                    firstEventDate = eventsList[0].date;
                    lastEventDate = eventsList[eventsList.length - 1].date;
                    totalDuration = lastEventDate - firstEventDate;

                    console.log(eventsList);

                    var html = '';
                    for (var i = 0; i < eventsList.length; i++) {
                        html += '<div data-date="' + eventsList[i].date + '" data-type="' + eventsList[i].type +
                            '" data-icon="' + eventsList[i].icon + '" data-title="' + eventsList[i].title +
                            '" data-text="' + eventsList[i].text + '" class="events-item">' + eventsList[i].text +
                            '</div> ';
                    }

                    $pluginContainer = $('<div class="stages-scale" id="stage-scale-' + seed + '"><div class="time-line">' +
                        '<div class="events">' + html + '</div></div></div>');
                    console.log($pluginContainer);

                    // Инициализируем DOM-элементы
                    $timeLine = $pluginContainer
                        .find('.time-line')
                        .addClass('zoom-1');
                    $events = $timeLine.find('.events');
                    $pluginContainer
                        .prepend($controls)
                        .append($('<div class="legend"></div>'));
                    $controls = $pluginContainer.find('.controls');

                    helpers.redraw();
                    helpers.drawRuler();

                    // helpers.groupEvents(1);

                    helpers.bind();

                    console.log($controls);

                    return $pluginContainer;
                }
            }

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