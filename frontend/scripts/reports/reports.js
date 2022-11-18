const HOST = 'localhost:8080/api/v1';
let emergingReports = []; // для проверки запрета на уход со страницы или перезагрузку страницы во время создания отчёта

document.addEventListener('DOMContentLoaded', () => {
    if (messageBlock) {
        messageBlock.style.display = "none"; // изначально текстовый блок для информациооных сообщений скрыт
    } else {
        alert('некорректно определен блок для информационных сообщений');
        logError('некорректно определен блок для информационных сообщений');
    }
});

window.addEventListener("beforeunload", (event) => {
    if (emergingReports.length) {
        event.returnValue = `IDs ${emergingReports} в процессе создания отчётов!`;
    }
});

async function createReport(e) {
    try {
        if (e.type === 'keydown' && e.code !== 'Enter') { return; }

        if (!messageBlock) {
            alert('некорректно определен блок для информационных сообщений');
            logError('некорректно определен блок для информационных сообщений');
            return;
        }

        let reportType = e.target.closest('div.t-form__inputsbox').id;

        switch (reportType) {
            case 'webinar':
                await createWebinarReport(); break;

            case 'campaigns':
                await createCampaignsReport(); break;

            default:
                logError('в HTML-разметке страницы задайте id для div-блока с классом "t-form__inputsbox", затем добавьте case для этого id в createReport()');
        }
    } catch (error) {
        logError(error);
        emergingReports.pop(); // снятие запрета на уход со страницы или перезагрузку страницы после создания отчёта
    }
}

async function createWebinarReport() {
    const
        EVENT_ID = eventCodeInput.value,
        BOOK_ID = bookIDInput.value;

    if (!EVENT_ID) {
        showInfoMessage('заполните поле с кодом трансляции и поле с кодом адресной книги ДМ для создания отчёта и записи данных в ДМ или только поле с кодом трансляции для создания отчёта');
        return;
    }

    eventCodeInput.value = '';
    bookIDInput.value = '';
    showInfoMessage(`отчёт по мероприятию для event_code ${EVENT_ID} формируется. Ожидайте`, 'green');

    emergingReports.push(EVENT_ID); // запрет на уход со страницы или перезагрузку страницы во время создания отчёта

    try {
        var report = await readWebinarReport(EVENT_ID);

        console.log('отчёт:', report);

        await writeWebinarReport(EVENT_ID, BOOK_ID, report);
    } catch (error) {
        let errorMessage = `невозможно создать отчёт по мероприятию для event_code ${EVENT_ID}: ${error}`; // вид ошибки по умолчанию

        if (String(error).indexOf('writing into DM error') != -1) {
            errorMessage = `отчёт по мероприятию для event_code ${EVENT_ID} создан, но при записи данных отчёта в книгу ДМ ${BOOK_ID} возникла ошибка: ${error}`;
        }

        if (String(error).indexOf('invalid emails') != -1) {
            errorMessage = `отчёт по мероприятию для event_code ${EVENT_ID} создан, но при записи данных отчёта в книгу ДМ ${BOOK_ID} обнаружены некорректные email-адреса (для остальных почт данные записаны): ${error}`;
        }

        errorMessage = unicodeToChar(errorMessage);
        showInfoMessage(errorMessage);
        logError(errorMessage);
        emergingReports.pop(); // снятие запрета на уход со страницы или перезагрузку страницы после создания отчёта

        return;
    }

    showInfoMessage(`отчёт по мероприятию для event_code ${EVENT_ID} сформирован`, 'green');
    emergingReports.pop(); // снятие запрета на уход со страницы или перезагрузку страницы после создания отчёта
}

async function createCampaignsReport() {
    const
        START_DATE = startDate.value,
        END_DATE = endDate.value,
        FROM = START_DATE ? ` c ${START_DATE}` : '',
        TO = END_DATE ? ` по ${END_DATE}` : '';

    startDate.value = '';
    endDate.value = '';
    showInfoMessage('отчёт по рассылкам{excludeTypografPart} формируется. Ожидайте', 'green', [`${FROM}${TO}`]);

    emergingReports.push((new Date()).getTime()); // запрет на уход со страницы или перезагрузку страницы во время создания отчёта

    try {
        var report = await readCampaignsReport(START_DATE, END_DATE, FROM, TO);

        console.log('отчёт:', report);

        await writeCampaignsReport(report, FROM, TO);
    } catch (error) {
        let errorMessage = `невозможно создать отчёт по рассылкам{excludeTypografPart}: ${error}`; // вид ошибки по умолчанию
        showInfoMessage(errorMessage, undefined, [`${FROM}${TO}`]);
        logError(errorMessage);
        emergingReports.pop(); // снятие запрета на уход со страницы или перезагрузку страницы после создания отчёта

        return;
    }

    showInfoMessage(`отчёт по рассылкам{excludeTypografPart} сформирован`, 'green', [`${FROM}${TO}`]);
    emergingReports.pop(); // снятие запрета на уход со страницы или перезагрузку страницы после создания отчёта
}