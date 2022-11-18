/*/
 * К message применяется типограф. В message можно добавить конструкции вида '{excludeTypografPart}' и передать массив excludeTypografParts,
 * где на каждое вхождение '{excludeTypografPart}' в message будет свой строковый элемент в массиве. Это позволит не применять типограф к
 * выделенным частям message. Пример, когда это нужно: в message есть вхождение, например, '2022.01-01'. Важно сохранить такой вид, так
 * как типограф преобразует его к виду '2022-01-01'. Для этого в message заменяем '2022.01-01' на '{excludeTypografPart}', а в функцию
 * showInfoMessage() передаем массив ['2022-01-01']. Важно следить за соответствием количества '{excludeTypografPart}' и элементов в
 * передаваемом массиве excludeTypografParts.
/*/
const EXCLUDE_TYPOGRAF_PART = /{excludeTypografPart}/g;
function showInfoMessage(message, color = 'red', excludeTypografParts = []) {
    if (messageBlock) {
        let partsNum = (message.match(EXCLUDE_TYPOGRAF_PART) || []).length;
        if (partsNum != excludeTypografParts.length) {
            messageBlock.style.display = 'none';
            throw `the number ${partsNum} of '{excludeTypografPart}' in the message does not match the number ${excludeTypografParts.length} of items in excludeTypografParts`;
        }

        let
            tp = new Typograf({ locale: ['ru', 'en-US'] }),
            text = tp.execute(message);

        for (let excludeTypografPart of excludeTypografParts) {
            text = text.replace('{excludeTypografPart}', excludeTypografPart);
        }

        messageBlock.querySelector('div[field="text"]').innerText = text.charAt(0).toUpperCase() + text.slice(1) + '.';
        messageBlock.querySelector('div[field="text"]').style.color = color;
        if (messageBlock.style.display == 'none') {
            $(messageBlock).slideToggle(500); //t_lazyload_update(); // меняем стиль текстового блока с предупреждением с видимого на невидимый
        }
    }
}

const UNICODE_PATTERN = /\\u[\dA-F]{4}/gi;
const UNICODE_PATTERN_TO_REPLACE = /\\u/g;
function unicodeToChar(text) {
    return text.replace(UNICODE_PATTERN, (match) => {
        return String.fromCharCode(parseInt(match.replace(UNICODE_PATTERN_TO_REPLACE, ''), 16));
    });
}

Date.prototype.format = function (format = 'yyyy-mm-dd') {
    const replaces = {
        yyyy: this.getFullYear(),
        mm: ('0' + (this.getMonth() + 1)).slice(-2),
        dd: ('0' + this.getDate()).slice(-2),
        hh: ('0' + this.getHours()).slice(-2),
        MM: ('0' + this.getMinutes()).slice(-2),
        ss: ('0' + this.getSeconds()).slice(-2)
    };

    let result = format;
    for (const replace in replaces) {
        result = result.replace(replace, replaces[replace]);
    }

    return result;
};

function formattedTimeNow() { return (new Date()).format('dd.mm.yyyy hh:MM:ss'); }

function logError(error) { console.error(`${formattedTimeNow()} ошибка: ${error}`); }