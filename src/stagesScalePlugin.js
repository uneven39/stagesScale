(function( $ ) {
    "use strict";

    var $pluginContainer,
        $timeLine;

    var dayLength = 86400000, // day duration in ms
        stages,
        minDate,
        maxDate,
        totalDuration = 0;

    var helpers = {
        sortEventNodes: function($container) {
            var $sortedData = $container.find('div[data-type]').sort(function (itemA, itemB) {
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
                var event = {};

                event.date = new Date($(item).data('date')).getTime();
                event.type = $(item).data('type');
                event.icon = $(item).data('icon');
                event.title = $(item).data('title');
                event.text = $(item).text();
                // event.$item = $(item);

                eventsList.push(event);
            });

            return eventsList;
        },

        initEventsDataFromContainer: function($container) {
            var eventsList = [];

            maxDate = new Date($container[$container.length - 1].data('date')).getTime();
            minDate = new Date($container[0].data('date')).getTime();

            totalDuration = maxDate - minDate;

            console.log(minDate, maxDate, totalDuration, totalDuration/dayLength);

            $container.each(function(index, item) {
                var event = {};

                event.date = new Date($(item).data('date')).getTime();
                event.type = $(item).data('type');
                event.icon = $(item).data('icon');
                event.title = $(item).data('title');
                event.text = $(item).text();

                if (event.date) {
                    eventsList.push(event);
                    $(item)
                        .addClass('event')
                        .prop('data-text', event.text)
                        .html('');

                } else {
                    console.log('no data');
                    $(item).addClass('hidden');
                }

                $(item).css('left', (((totalDuration - (maxDate - event.date)) / totalDuration)*100 + '%'));
            });

            return eventsList;
        },

        redraw: function (minLimit, maxLimit) {
            console.log(minLimit,
                new Date(minLimit).setUTCHours(0, 0, 0, 0),
                new Date(minLimit).setUTCHours(0, 0, 0, 0) + dayLength);
            $timeLine.children().each(function(index, item) {
                var $item = $(item),
                    date = new Date($item.data('date')).getTime(),
                    isInRange = (date >= minLimit) && (date <= maxLimit),
                    position;

                if (isInRange) {
                    position = ((totalDuration - (maxDate - date)) / totalDuration)*100 + '%';
                    $item
                        .addClass('event')
                        .css('left', position);
                } else {
                    $item.addClass('hidden');
                }
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
                helpers.sortEventNodes($pluginContainer);
                eventsList = helpers.getEventsListFromContainer($pluginContainer);
                minDate = eventsList[0].date;
                maxDate = eventsList[eventsList.length - 1].date;
                totalDuration = maxDate - minDate;

                console.log(eventsList);

                $pluginContainer
                    .children().wrapAll('<div class="time-line"></div>');
                $timeLine = $pluginContainer.find('.time-line');
                helpers.redraw(minDate, maxDate);

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