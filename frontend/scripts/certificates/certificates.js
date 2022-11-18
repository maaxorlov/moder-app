const HOST = 'localhost:8080/api/v1';
let emergingCertificates = []; // для проверки запрета на уход со страницы или перезагрузку страницы во время формирования сертификатов

document.addEventListener('DOMContentLoaded', () => {
    if (messageBlock) {
        messageBlock.style.display = "none"; // изначально текстовый блок для информационных сообщений скрыт
    } else {
        alert('некорректно определен блок для информационных сообщений');
        logError('некорректно определен блок для информационных сообщений');
    }
});

window.addEventListener("beforeunload", (event) => {
    if (emergingCertificates.length) {
        event.returnValue = `IDs ${emergingCertificates} в процессе создания отчётов!`;
    }
});

async function createCertificates(e) {
    if (e.type === 'keydown' && e.code !== 'Enter') { return; }

    if (!messageBlock) {
        alert('некорректно определен блок для информационных сообщений');
        logError('некорректно определен блок для информационных сообщений');
        return;
    }

    const BOOK_ID = bookIDInput.value;
    if (!BOOK_ID) {
        showInfoMessage('заполните поле с кодом адресной книги ДМ для формирования сертификатов');
        return;
    }

    bookIDInput.value = '';
    if (emergingCertificates.length) {
        showInfoMessage('дождитесь окончания предыдущего цикла формирования сертификатов');
        return;
    }
    showInfoMessage(`сертификаты для book_id ${BOOK_ID} формируются. Ожидайте`, 'green');

    emergingCertificates.push(BOOK_ID); // запрет на уход со страницы или перезагрузку страницы во время формирования сертификатов

    try {
        let certificatesInfo = await readCertificatesInfo(BOOK_ID);

        console.log('информация по сертификатам:', certificatesInfo);

        var info = await generateСertificates(BOOK_ID, certificatesInfo);

        if (!$.isEmptyObject(info.unloadedFiles)) {
            console.log('созданные, но не загруженные на ЯД сертификаты:', info.unloadedFiles);
        }

        if (!$.isEmptyObject(info.links)) {
            console.log('ссылки на созданные и загруженные на ЯД сертификаты:', info.links);
            await sendLinksToDM(BOOK_ID, info.links);
        }
    } catch (error) {
        let errorMessage = unicodeToChar(`невозможно сформировать сертификаты для book_id ${BOOK_ID}: ${error}`);
        showInfoMessage(errorMessage);
        logError(errorMessage);
        emergingCertificates.pop(); // снятие запрета на уход со страницы или перезагрузку страницы после создания отчёта

        return;
    }

    if (!$.isEmptyObject(info.unloadedFiles)) {
        let unloadedFilesInfo = '', unloadedFileNum = 0;
        for (let fileInfo of Object.entries(info.unloadedFiles)) {
            unloadedFileNum++;
            unloadedFilesInfo += `${unloadedFileNum}. email: ${fileInfo[0]} fileName: ${fileInfo[1].fileName} error: ${fileInfo[1].error}\n`;
        }
        showInfoMessage(`сертификаты для book_id ${BOOK_ID} сформированы, но некоторые из них (${unloadedFileNum} шт.) не удалось загрузить на Яндекс-Диск.\nИнформация о незагруженных файлах:\n${unloadedFilesInfo}`);
    } else {
        showInfoMessage(`сертификаты для book_id ${BOOK_ID} сформированы`, 'green');
    }
    emergingCertificates.pop(); // снятие запрета на уход со страницы или перезагрузку страницы после создания отчёта
}