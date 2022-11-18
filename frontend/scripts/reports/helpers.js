async function readWebinarReport(eventID) {
    console.log(`${formattedTimeNow()} начало чтения для eventID '${eventID}'`);

    try {
        let reqData = {
            'apiMethod': 'getWebinarReportInfo',
            'data': { 'eventID': eventID }
        };
        var report = await WebSocketRequest(reqData);
    } catch (error) { throw error; }

    console.log(`${formattedTimeNow()} конец чтения для eventID '${eventID}'`);

    return report;
}

async function readCampaignsReport(startDate, endDate, from, to) {
    console.log(`${formattedTimeNow()} начало чтения для рассылок${from}${to}`);

    try {
        let reqData = {
            'apiMethod': 'getCampaignsReportInfo',
            'data': {}
        };
        if (startDate || endDate) {
            reqData['data'] = {
                'start_date': startDate,
                'end_date': endDate
            }
        }

        var report = await WebSocketRequest(reqData);
    } catch (error) { throw error; }

    console.log(`${formattedTimeNow()} конец чтения для рассылок${from}${to}`);

    return report;
}

async function writeWebinarReport(eventID, bookID, report) {
    if (report && report.usersInfo) {
        console.log(`${formattedTimeNow()} начало записи для eventID '${eventID}'`);

        let infoDM = {},
            r = report.eventInfo,
            reportData = [
                ['', '', 'Название мероприятия', 'Описание мероприятия', 'Дата и время начала (МСК)', 'Дата и время завершения (МСК)', 'Продолжительность эфира (мин.)', 'Максимум зрителей во время эфира (кол-во)', 'Максимум онлайн во время эфира (МСК)', 'Зрителей всего', 'Дата и время формирования отчета (МСК)'],
                ['', '', modifyEmptyParam(r.name), modifyEmptyParam(r.description), modifyEmptyParam(r.date_real_start), modifyEmptyParam(r.date_real_end), modifyEmptyParam(r.duration_total), modifyEmptyParam(r.viewers_max), modifyEmptyParam(r.time_viewers_max), modifyEmptyParam(r.viewers_total), modifyEmptyParam(r.report_time)],
                ['email-адрес', 'Технический комментарий', 'Контакт', 'Ключ трансляции Facecast', 'ФИО', 'Окон показано', 'Окон подтверждено', 'Просмотрено минут в эфире', 'Первая минута онлайн просмотра', 'Последная минута онлайн просмотра', 'Минуты эфира', 'Просмотрено минут в записи', 'Первая минута в записи', 'Последная минута в записи', 'Просмотренные минуты записи', 'Гражданство', 'Федеральный округ', 'Регион', 'Город', 'Специализация', 'Бонусы ЗО', 'Режим просмотра']
            ];
        for (let info of Object.values(report.usersInfo)) {
            if (bookID && !info.own) {
                if (r.name || info.allWindows || info.confirmedWindows || info.minutesViewedOnline || info.minutesViewedOffline || info.viewRegime || info.pointsZOView) {
                    infoDM[info.email] = {
                        'кодировка_мероприятия': modifyEmptyParam(r.name),
                        'окон_показано': modifyEmptyParam(info.allWindows),
                        'окон_подтверждено': modifyEmptyParam(info.confirmedWindows),
                        'просмотрено_минут_в_эфире': modifyEmptyParam(info.minutesViewedOnline),
                        'просмотрено_минут_в_записи': modifyEmptyParam(info.minutesViewedOffline),
                        'режим_просмотра': modifyEmptyParam(info.viewRegime),
                        'бонусы_зо_за_просмотр': modifyEmptyParam(info.pointsZOView),
                    };
                }
            }
            reportData.push(getOneUserInfo(info));
        }

        try {
            let reqData = {
                'apiMethod': 'createWebinarReport',
                'data': {
                    'reportName': report.reportName,
                    'reportData': reportData
                }
            };
            await WebSocketRequest(reqData);
        } catch (error) { throw error; }

        try {
            if (bookID) {
                let reqData = {
                    'apiMethod': 'sendDataToDashaMail',
                    'data': {
                        'bookID': bookID,
                        'infoDM': infoDM
                    }
                };
                await WebSocketRequest(reqData);
            }
        } catch (error) { throw String(error).indexOf('invalid emails') != -1 ? error : `writing into DM error: ${error}`; }

        console.log(`${formattedTimeNow()} конец записи для eventID '${eventID}'`);
    } else { throw 'нет доступных для записи данных'; }
}

async function writeCampaignsReport(report, from, to) {
    if (report && report.length) {
        console.log(`${formattedTimeNow()} начало записи для рассылок${from}${to}`);

        let reportData = [[
            'время отправки рассылки', 'название рассылки', 'текстовый тег utm_campaign для отображения кликов в Google Analytics™',
            'utm_source для отображения кликов в Google Analytics™', 'utm_medium для отображения кликов в Google Analytics™',
            'utm_content для отображения кликов в Google Analytics™', 'utm_term для отображения кликов в Google Analytics™',
            'число отправленных сообщений', 'общее число кликов', 'число открытий писем', 'время первого отправленного письма',
            'время последнего открытия', 'время последнего клика', 'число уникальных открытий писем', 'число подписчиков, кликнувших в письмах',
            'число отписавшихся подписчиков', 'число жалоб на спам', 'число заблокированных за спам почтовыми провайдерами',
            'число маркированных как спам писем антиспам-системами', 'число заблокированных почтовой системой писем',
            'число жестких возвратов писем', 'число мягких возвратов писем'
        ]];

        for (let info of report) {
            reportData.push(getOneCampaignInfo(info));
        }

        try {
            let reqData = {
                'apiMethod': 'createCampaignsReport',
                'data': {
                    'reportName': 'Отчёт по рассылкам',
                    'reportData': reportData
                }
            };
            await WebSocketRequest(reqData);
        } catch (error) { throw error; }

        console.log(`${formattedTimeNow()} конец записи для рассылок${from}${to}`);
    } else { throw 'нет доступных для записи данных'; }
}

function getOneUserInfo(info) {
    let
        email = modifyEmptyParam(info.email),
        message = modifyEmptyParam(info.message),
        hiddenEmail = hideEmail(email),
        key = modifyEmptyParam(info.key),
        fio = modifyEmptyParam(info.fio),
        allWindows = modifyEmptyParam(info.allWindows),
        confirmedWindows = modifyEmptyParam(info.confirmedWindows),
        minutesViewedOnline = modifyEmptyParam(info.minutesViewedOnline),
        firstMinuteOnline = modifyEmptyParam(info.firstMinuteOnline),
        lastMinuteOnline = modifyEmptyParam(info.lastMinuteOnline),
        minutesOnline = info.minutesOnline,
        minutesViewedOffline = modifyEmptyParam(info.minutesViewedOffline),
        firstMinuteOffline = modifyEmptyParam(info.firstMinuteOffline),
        lastMinuteOffline = modifyEmptyParam(info.lastMinuteOffline),
        minutesOffline = info.minutesOffline,
        citizenship = modifyEmptyParam(info.citizenship),
        district = modifyEmptyParam(info.district),
        region = modifyEmptyParam(info.region),
        city = modifyEmptyParam(info.city),
        specialization = modifyEmptyParam(info.specialization),
        pointsZOView = modifyEmptyParam(info.pointsZOView),
        viewRegime = modifyEmptyParam(info.viewRegime);

    return [email, message, hiddenEmail, key, fio, allWindows, confirmedWindows, minutesViewedOnline, firstMinuteOnline, lastMinuteOnline, minutesOnline, minutesViewedOffline, firstMinuteOffline, lastMinuteOffline, minutesOffline, citizenship, district, region, city, specialization, pointsZOView, viewRegime];
}

function getOneCampaignInfo(info) {
    let
        date = modifyEmptyParam(info.date),
        name = modifyEmptyParam(info.name),
        tagUTM = modifyEmptyParam(info.tagUTM),
        sourceUTM = modifyEmptyParam(info.sourceUTM),
        mediumUTM = modifyEmptyParam(info.mediumUTM),
        contentUTM = modifyEmptyParam(info.contentUTM),
        termUTM = modifyEmptyParam(info.termUTM),
        sent = modifyEmptyParam(info.sent),
        clicked = modifyEmptyParam(info.clicked),
        opened = modifyEmptyParam(info.opened),
        firstSent = modifyEmptyParam(info.firstSent),
        lastOpen = modifyEmptyParam(info.lastOpen),
        lastClick = modifyEmptyParam(info.lastClick),
        uniqueOpened = modifyEmptyParam(info.uniqueOpened),
        uniqueClicked = modifyEmptyParam(info.uniqueClicked),
        unsubscribed = modifyEmptyParam(info.unsubscribed),
        spamComplained = modifyEmptyParam(info.spamComplained),
        spamBlocked = modifyEmptyParam(info.spamBlocked),
        spamMarked = modifyEmptyParam(info.spamMarked),
        mailSystemBlocked = modifyEmptyParam(info.mailSystemBlocked),
        hard = modifyEmptyParam(info.hard),
        soft = modifyEmptyParam(info.soft);

    return [date, name, tagUTM, sourceUTM, mediumUTM, contentUTM, termUTM, sent, clicked, opened, firstSent, lastOpen, lastClick, uniqueOpened, uniqueClicked, unsubscribed, spamComplained, spamBlocked, spamMarked, mailSystemBlocked, hard, soft];
}

function modifyEmptyParam(param) { return param ? param : ''; }

function hideEmail(email) {
    if (email) {
        let before = email.split('@')[0],
            firstSymbol = before[before.length - 2],
            secondSymbol = before[before.length - 1],
            after = email.split('@')[1];
        firstSymbol = (firstSymbol) ? firstSymbol : '-';

        return `***${firstSymbol}${secondSymbol}@${after}`;
    }

    return '';
}