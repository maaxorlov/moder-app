function showInfoMessage(message, color = 'red') {
    if (messageBlock) {
        let tp = new Typograf({ locale: ['ru', 'en-US'] });
        messageBlock.querySelector('p').innerText = tp.execute(message);
        messageBlock.querySelector('p').style.color = color;
        if (messageBlock.style.display == 'none') {
            $(messageBlock).slideToggle(500); //t_lazyload_update(); //меняем стиль текстового блока с предупреждением с видимого на невидимый
        }
    }
}

async function readCertificatesInfo(bookID) {
    console.log(`${formattedTimeNow()} начало чтения информации по сертификатам для bookID '${bookID}'`);

    try {
        let reqData = {
            'apiMethod': 'getCertificatesInfo',
            'data': { 'bookID': bookID }
        };
        var report = await WebSocketRequest(reqData);
    } catch (error) { throw error; }

    console.log(`${formattedTimeNow()} конец чтения информации по сертификатам для bookID '${bookID}'`);

    return report;
}

async function generateСertificates(bookID, certificatesInfo) {
    console.log(`${formattedTimeNow()} начало формирования сертификатов для bookID '${bookID}'`);

    try {
        let reqData = {
            'apiMethod': 'createCertificates',
            'data': certificatesInfo
        };

        var links = await WebSocketRequest(reqData);
    } catch (error) { throw error; }

    console.log(`${formattedTimeNow()} конец формирования сертификатов для bookID '${bookID}'`);

    return links;
}

async function sendLinksToDM(bookID, links) {
    console.log(`${formattedTimeNow()} начало записи ссылок на сертификаты для bookID '${bookID}'`);

    try {
        let data = {
            'bookID': bookID,
            'infoDM': links
        };
        let reqData = {
            'apiMethod': 'sendDataToDashaMail',
            'data': data
        };

        await WebSocketRequest(reqData);
    } catch (error) { throw error; }

    console.log(`${formattedTimeNow()} конец записи ссылок на сертификаты для bookID '${bookID}'`);

    return;
}