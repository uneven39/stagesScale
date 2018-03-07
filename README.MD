#Timeline plugin

Добавить скрипты:

```
<script src="/jquery.min.js"></script>
<script src="/eventsTimelinePlugin.js"></script>
```

И стили:

```
<link href="/eventsTimelinePlugin.css" rel="stylesheet">
<link href="/icons.css" rel="stylesheet">
```

Вызов плагина:
```
$element.eventsTimeLine([data], [options]);
```

Вызов плагина с передачей опций и данных из разметки:
```
<div class="test1">
    <div data-date="2018/01/01 00:00:00" data-type="тип события 1" data-icon="file" data-title="Заголовок 0">html-текст события 0</div>
    <div data-date="2018/01/01 09:10:00" data-type="тип события 1" data-icon="type1" data-title="Заголовок 1"><h3>html-текст события 1</h3> <a href="#">go there</a> </div>
    ...
    <div data-date="2018/01/01 13:55:00" data-type="тип события 5" data-icon="file" data-title="Заголовок 25">Lorem ipsum dolor sit amet</div>
</div>
```
```
$('.test1').eventsTimeLine({start: 0, finish: 24, legendHeight: 500});
```

Вызов плагина с передачей опций и массива данных как аргументов:

```
$('.test1').eventsTimeLine(dataArray, {start: 'auto', finish: 'auto', legendHeight: 'auto'});
$('.test2').eventsTimeLine(dataArray2, {start: 0, finish: 14, legendHeight: 200});
``` 

##Опции

В объект опций можно передать параметры начала/конца временного отрезка, высоту блока легенды:
```
options = {
            'start': 0,
            'finish': 24,
            'legendHeight': 'auto',
}
```

start/finish принимают в качестве значений числа (0-24) или строку 'auto' - в таком случае будут установлены первый (последний) час в списке событий. 

##Дополнительные стили иконок
Можно добавить дополнительные иконки в стилях:

```
/* Стили иконки */
/* Таймлайн: */
/* Основа (подложка-"капля"): */
.time-line-plugin .time-line .events-item.icon-png {
    background: url("http://wfarm3.dataknet.com/static/resources/icons/set112/f2afb6f7.png"),
                url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 60'%3E%3Cpath fill='%2314A5CA' d='M20 0C8.954 0 0 8.954 0 20a19.995 19.995 0 0 0 5.68 13.959h-.004L18 46.599V60h4V46.6l12.324-12.641h-.03A19.996 19.996 0 0 0 40 20C40 8.954 31.046 0 20 0z'/%3E%3C/svg%3E");
    background-size: 60%,100%;
    background-position: 50% 22%;
    background-repeat: no-repeat;
}
/* Круг: */
.time-line-plugin .time-line .events-item.icon-png:before {
    border-color: #80d0e2
}

/* Легенда: */
.time-line-plugin .legend-item .header.icon-png:before {
    background-image: url("http://wfarm3.dataknet.com/static/resources/icons/set112/f2afb6f7.png");
    background-position: 50%;
    background-size: 20px auto;
    background-repeat: no-repeat;
}
```
