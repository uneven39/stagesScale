(function( $ ) {
    "use strict";

    var dayLength = 86400000;

    var methods = {
        init : function(options) {
            var $container = this,
                settings = $.extend( {}, options),
                totalDuration = 0,
                stages = getEventsList();

            console.log('plugin started', this);
            console.log(stages);

            function getEventsList() {
                var eventsList = [],
                    $sortedData = $('.stagesScale [data-type]').sort(function (itemA, itemB) {
                        var dateA = new Date($(itemA).data('date')).getTime(),
                            dateB = new Date($(itemB).data('date')).getTime();
                        return (dateA < dateB) ? -1 : (dateA > dateB) ? 1 : 0;
                    });

                var maxDate = new Date($($sortedData[$sortedData.length - 1]).data('date')).getTime(),
                    minDate = new Date($($sortedData[0]).data('date')).getTime();

                totalDuration = maxDate - minDate;

                console.log(minDate, maxDate, totalDuration, totalDuration/dayLength);

                $sortedData.each(function(index, item) {
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

                $container.html('').append($sortedData);
                return eventsList;
            }
        },

        another : function(content) {
        }
    };

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