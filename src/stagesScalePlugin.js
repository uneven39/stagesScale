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

            for (var h = 0; h < 24; h++) {
                var $group = $events.children().filter(function(index, event) {
                    var date = new Date($(event).data('date'));
                    return (date.getHours() === h);
                });
                if ($group.length > 1) {

                    var step = $ruler.width() / 24,
                        offset = ((step * h + step/2) / $ruler.width()) * 100,
                        $wrapper = $('<div class="group-by hour"></div>');
                    $wrapper.css('left', offset + '%');
                    $group.wrapAll($wrapper);
                }
            }

            // switch (period) {
            //     case 1:
            //         for (var h = 0; h < 24; h++) {
            //             var $group = $events.children().filter(function(index, event) {
            //                 var date = new Date($(event).data('date'));
            //                 return (date.getHours() === h);
            //             });
            //             if ($group.length > 1) {
            //                 var step = $ruler.width() / 24,
            //                     offset = ((step * h + step/2) / $ruler.width()) * 100,
            //                     $wrapper = $('<div class="group-by hour"></div>');
            //                 $wrapper.css('left', offset + '%');
            //                 $group.wrapAll($wrapper);
            //             }
            //         }
            //         break;
            //
            //     case 2:
            //         for (var h = 0; h < 24; h++) {
            //             var $group = $events.children().filter(function(index, event) {
            //                 var date = new Date($(event).data('date')),
            //                     isInHour = date.getHours() === h,
            //                     isIn30Min = (date.getMinutes() < 30) ^ (date.getMinutes() >= 30);
            //                 return (isInHour && isIn30Min);
            //             });
            //             if ($group.length > 1) {
            //                 var step = $ruler.width() / 24,
            //                     offset = ((step * h + step/4) / $ruler.width()) * 100,
            //                     $wrapper = $('<div class="group-by 30min"></div>');
            //                 $wrapper.css('left', offset + '%');
            //                 $group.wrapAll($wrapper);
            //             }
            //         }
            //         break;
            //
            //     case 3:
            //         for (var h = 0; h < 24; h++) {
            //             var $group = $events.children().filter(function(index, event) {
            //                 var date = new Date($(event).data('date')),
            //                     mins = date.getMinutes(),
            //                     isInHour = date.getHours() === h,
            //                     isIn30Min = (mins >= 30) ^ (mins < 30),
            //                     isIn15Min = mins < 15 ? true :
            //                         mins >= 15 && mins < 30 ? true :
            //                             mins >= 30 && mins < 45 ? true :
            //                                 mins >= 45;
            //                     // isIn15Min = (date.getMinutes() < 15 ) ^
            //                     //     ((date.getMinutes() >= 15) && (date.getMinutes() < 30)) ^
            //                     //     ((date.getMinutes() >= 30) && (date.getMinutes() < 45)) ^
            //                     //     (date.getMinutes() >= 45);
            //                 return (isInHour && isIn15Min);
            //             });
            //             if ($group.length > 1) {
            //                 var step = $ruler.width() / 24,
            //                     offset = ((step * h + step/8) / $ruler.width()) * 100,
            //                     $wrapper = $('<div class="group-by 15min"></div>');
            //                 $wrapper.css('left', offset + '%');
            //                 $group.wrapAll($wrapper);
            //             }
            //         }
            //         break;
            //
            // }

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
            $controls
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
                    $timeLine.scrollLeft(Math.ceil(curScroll / step) * step);
                })
                .on('click', '.zoom-out', function () {
                    var newZoomLevel = zoomLevel === 1 ? 1 : zoomLevel - 1,
                        step,
                        curScroll;

                    zoomLevel = newZoomLevel;

                    $timeLine.removeClass(function(i, className){
                        return (className.match (/\bzoom-\S+/g) || []).join(' ');
                    });
                    $timeLine.addClass('zoom-' + newZoomLevel);
                    step = $ruler.width() / 24;
                    curScroll = $timeLine.scrollLeft();
                    $timeLine.scrollLeft(Math.ceil(curScroll / step) * step);
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
                $pluginContainer.prepend($controls);

                helpers.redraw(firstEventDate, lastEventDate);
                helpers.drawRuler('24h');

                helpers.groupEvents(1);

                helpers.bind();

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