let WEBSOCKET = '';

async function initWebSocket() {
    if (!WEBSOCKET) {
        WEBSOCKET = getWebSocketURL();
        await waitForConnection(WEBSOCKET);
    }

    return WEBSOCKET;
}

function getWebSocketURL() {
    let WS = 'ws'; // for local
    if (!HOST.includes("local")) { WS += 's'; } // for heroku

    return new WebSocket(WS + "://" + HOST + "/websocket");
}

async function waitForConnection(WEBSOCKET) {
    return new Promise((resolve, reject) => {
        WEBSOCKET.addEventListener("open", () => { resolve(); });
        WEBSOCKET.addEventListener("close", (error) => {
            reject(`соединение было закрыто со статусом ${error.code}`);
        });

        // если прошло больше 5 секунд с момента запуска функции и соединение не установилось, то сообщить об ошибке
        let entranceTime = Date.now();
        const interval = setInterval(() => {
            if (Date.now() - entranceTime > 5000) {
                clearInterval(interval);
                reject('невозможно установить WebSocket-соединение в течение 5 секунд');
            }
        }, 5);
    });
}

async function readWebSocket(WEBSOCKET) {
    return new Promise(resolve => {
        WEBSOCKET.addEventListener("message", function (e) {
            let data = JSON.parse(e.data);
            if (data.status != 'processing') {
                resolve(data);
            } else {
                console.log(`${formattedTimeNow()}\n-СТАТУС-: ${data.status}\n-КОММЕНТ-: ${data.message}`);
            }
        });
    });
}

async function WebSocketRequest(reqData) {
    try {
        await initWebSocket();
        WEBSOCKET.send(JSON.stringify(reqData));
        var respData = await readWebSocket(WEBSOCKET);
        WEBSOCKET.close();
        WEBSOCKET = '';
        if (respData && respData.message) { throw respData.message; }
    } catch (error) {
        WEBSOCKET = '';
        throw error;
    }

    return respData;
}